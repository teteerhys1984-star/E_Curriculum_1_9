import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

/* Browser checks for the Grade 3 Unit 1 Lesson 6 Workbook writing layer.
   Covers: model reveal without overwriting, comparison, drafts across reload,
   per-activity reset, honest storage-failure disclosure, mobile layout and step navigation. */

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'drafts/grade3-unit1-lesson6/grade3-unit1-lesson6-workbook.html';
const KEY = 'grade3-unit1-lesson6-workbook-drafts-v1';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8' };

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(root, reqPath === '/' ? 'index.html' : reqPath);
  /* Draft pages live in drafts/grade3-unit1-lesson6/; shared assets are read from the root. */
  const draftPrefix = '/drafts/grade3-unit1-lesson6/';
  if ((!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) && reqPath.startsWith(draftPrefix)) {
    filePath = path.join(root, reqPath.slice(draftPrefix.length));
  }
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/${PAGE}`;

let launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
} else {
  const chromiumPackage = require('@sparticuz/chromium');
  const bundled = chromiumPackage.default;
  const packageDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
  const libs = await chromiumPackage.inflate(path.join(packageDir, 'bin', 'al2023.tar.br'));
  chromiumPackage.setupLambdaEnvironment(path.join(libs, 'lib'));
  launchOptions = { ...launchOptions, executablePath: await bundled.executablePath(), args: bundled.args };
}
const browser = await chromium.launch(launchOptions);
const results = [];
/* The shared step navigation shows one part at a time. Reach a part the way a pupil does:
   return to part 1, then press Next until the wanted exercise is visible. */
async function openPart(page, id) {
  await page.reload({ waitUntil: 'load' });
  for (let i = 0; i < 10; i++) {
    if (await page.isVisible(`#${id}`)) return;
    await page.locator('button:has-text("Next")').first().click();
  }
  throw new Error(`could not reach part ${id}`);
}
const pass = (name) => { results.push(name); console.log('PASS', name); };

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });

  /* 1. Structure: four writing activities, the two non-writing exercises carry none. */
  const activities = await page.$$eval('[data-writing-activity]', els => els.map(e => e.dataset.writingActivity));
  assert.deepEqual(activities, ['wb-1', 'wb-2', 'wb-5', 'wb-6']);
  pass('four writing activities present; listen and match carry no writing field');

  /* 2. Model reveal and hide without overwriting the pupil's response. */
  await page.fill('#wb1-1', 'often');
  const modelHidden = await page.$eval('#wb1-key', el => el.hidden);
  assert.equal(modelHidden, true);
  await page.click('#wb1-form button.reveal');
  assert.equal(await page.$eval('#wb1-key', el => el.hidden), false);
  assert.equal(await page.inputValue('#wb1-1'), 'often');
  await page.click('#wb1-form button.reveal');
  assert.equal(await page.$eval('#wb1-key', el => el.hidden), true);
  assert.equal(await page.inputValue('#wb1-1'), 'often');
  pass('model reveal and hide do not overwrite the pupil response');

  /* 3. Comparison reports per item without changing either answer. */
  await page.fill('#wb1-1', 'always');
  await page.fill('#wb1-2', 'often');
  await page.click('#wb1-form .check-practice');
  const fb = await page.textContent('#wb1-form .practice-feedback');
  assert.match(fb, /Item 1: matches the inferred model/);
  assert.match(fb, /Item 2: matches the inferred model/);
  assert.match(fb, /Item 3: no answer yet/);
  assert.match(fb, /inferred, not an official key/);
  assert.equal(await page.inputValue('#wb1-1'), 'always');
  pass('comparison labels the model as inferred and leaves responses untouched');

  /* 4. Open-ended activity says answers vary and never marks it right or wrong. */
  await openPart(page, 'wb-6');
  await page.fill('#wb6-2', 'My sister paints pictures.');
  await page.click('#wb6-form .check-practice');
  const openFb = await page.textContent('#wb6-form .practice-feedback');
  assert.match(openFb, /Answers vary/);
  assert.doesNotMatch(openFb, /matches the inferred model|different from the inferred model/);
  pass('open-ended write-about-family uses “answers vary” and no automatic marking');

  /* 5. Drafts survive reload. */
  await openPart(page, 'wb-2');
  await page.fill('#wb2-1', 'never');
  await page.waitForFunction(k => !!localStorage.getItem(k), KEY);
  await page.reload({ waitUntil: 'load' });
  assert.equal(await page.inputValue('#wb1-1'), 'always');
  assert.equal(await page.inputValue('#wb2-1'), 'never');
  assert.equal(await page.inputValue('#wb6-2'), 'My sister paints pictures.');
  pass('drafts persist across reload in every writing activity');

  /* 6. Reset clears only one activity. */
  await openPart(page, 'wb-1');
  await page.click('#wb1-form button[type="reset"]');
  await page.waitForTimeout(50);
  assert.equal(await page.inputValue('#wb1-1'), '');
  assert.equal(await page.inputValue('#wb2-1'), 'never');
  assert.equal(await page.inputValue('#wb6-2'), 'My sister paints pictures.');
  const stored = JSON.parse(await page.evaluate(k => localStorage.getItem(k), KEY));
  assert.equal(stored['wb-1'], undefined);
  assert.equal(stored['wb-2']['wb2-1'], 'never');
  pass('reset clears only the chosen activity, in the page and in storage');

  /* 7. Storage failure is disclosed and does not discard the on-screen answer.
     One browser context only: this Chromium runs single-process, so extra contexts are not used. */
  await openPart(page, 'wb-5');
  await page.evaluate(() => {
    window.__realSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new Error('quota'); };
  });
  await page.fill('#wb5-1', 'Ted always brushes his teeth.');
  const failFb = await page.textContent('#wb5-form .practice-feedback');
  assert.match(failFb, /could not be saved/);
  assert.equal(await page.inputValue('#wb5-1'), 'Ted always brushes his teeth.');
  await page.evaluate(() => { Storage.prototype.setItem = window.__realSetItem; });
  pass('storage failure is disclosed and the on-screen answer is kept');

  /* 8. Mobile layout: no horizontal overflow at 390px. */
  await page.setViewportSize({ width: 390, height: 844 });
  await openPart(page, 'wb-1');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow of ${overflow}px at 390px`);
  pass('no horizontal overflow at 390px');

  /* 9. Shared step navigation is present on the page. */
  const navCount = await page.$$eval('.lesson-generated-step, .lesson-content-nav, nav[aria-label]', els => els.length);
  assert.ok(navCount >= 1, 'shared lesson navigation missing');
  pass('shared lesson navigation loaded');

  assert.deepEqual(errors, []);
  pass('no uncaught page errors');
} finally {
  await browser.close();
  server.close();
}
console.log(`grade3-unit1-lesson6 workbook browser checks passed: ${results.length} groups.`);
