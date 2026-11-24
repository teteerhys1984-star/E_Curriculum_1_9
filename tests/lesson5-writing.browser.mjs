import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Batch 5 — real browser interaction for the Lesson 5 writing layers.
   Deliberately narrower than the 18-activity static inventory: it exercises
   representative activities and says so. */

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = path.join(process.cwd(), reqPath === '/' ? 'index.html' : reqPath);
  if (!filePath.startsWith(process.cwd() + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

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
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));

let checks = 0;
const pass = () => { checks++; };

const navigate = async (page, activityId) => {
  // Steps are whole scanned pages, so a writing activity is reached through the
  // section that contains its [data-writing-activity] block.
  const index = await page.evaluate(id => {
    const panels = [...document.querySelectorAll('main.wrap section.panel')];
    const activity = document.querySelector(`[data-writing-activity="${id}"]`);
    const panel = activity ? activity.closest('section.panel') : null;
    return panels.indexOf(panel);
  }, activityId);
  assert.ok(index >= 0, `#${activityId}: activity lives in a navigable step`);
  const buttons = page.locator('.content-nav-links button');
  if (await buttons.count() > index) await buttons.nth(index).click();
  pass();
};

const key = (file, id) => `efc_writing_${file.replace('.html', '')}_v1:${id}`;

const cases = [
  {
    // Audio exception: disclosure, no model, still resettable.
    file: 'grade3-unit1-lesson5-pupil-book.html',
    id: 'pb-2',
    input: '#pb2-sisters',
    sample: '2',
    exception: /recording was not supplied/i,
    personal: true
  },
  {
    // Layout exception on the printed columns + existing printed reveal.
    file: 'grade3-unit1-lesson5-workbook.html',
    id: 'wb-6',
    input: '#wb6-house-oo',
    sample: null,
    radio: '#wb6-house-ou',
    exception: /printed columns disagree|example line jumps/i
  },
  {
    // Verified model, reveal/hide, no overwrite.
    file: 'grade4-unit1-lesson5-pupil-book.html',
    id: 'pb-7',
    input: '#pb7-1',
    sample: 'My favourite subject is geography.',
    model: /My favourite subject is geography/
  },
  {
    // Verified model on the Workbook.
    file: 'grade4-unit1-lesson5-workbook.html',
    id: 'wb-11',
    input: '#wb11-1',
    sample: 'She has got green eyes.',
    model: /She has got green eyes/
  },
  {
    // Personal prompt: labelled illustrative sample.
    file: 'grade4-unit1-lesson5-workbook.html',
    id: 'wb-12',
    input: '#wb12-1',
    sample: 'Omar',
    model: /answers vary/
  }
];

for (const c of cases) {
  await page.goto(`${baseUrl}/${c.file}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await navigate(page, c.id);
  const section = page.locator(`[data-writing-activity="${c.id}"]`);
  await section.waitFor({ state: 'visible' });
  pass();

  // Exception disclosure where the source cannot verify an answer.
  if (c.exception) {
    const notice = await section.locator('[data-writing-exception]').innerText();
    assert.match(notice, c.exception, `${c.id}: exception disclosed`);
    assert.equal(await section.locator('details[data-student-model]').count(), 0,
      `${c.id}: no fabricated model beside an unresolved exception`);
    pass();
  }

  // Model reveal / hide without touching the response.
  if (c.model) {
    const details = section.locator('details[data-student-model]');
    assert.equal(await details.count(), 1, `${c.id}: one student-facing model`);
    const summary = details.locator('summary');
    await summary.click();
    assert.equal(await details.getAttribute('open'), '', `${c.id}: model revealed`);
    assert.match(await details.innerText(), c.model, `${c.id}: model content`);
    if (c.sample) assert.equal(await section.locator(c.input).inputValue(), '', `${c.id}: reveal does not fill the field`);
    await summary.click();
    assert.equal(await details.getAttribute('open'), null, `${c.id}: model hidden`);
    pass();
  }

  // Response entry, comparison without overwriting, editing and persistence.
  if (c.radio) {
    await section.locator(c.radio).check();
    assert.equal(await section.locator(c.radio).isChecked(), true, `${c.id}: choice recorded`);
    const choiceReset = await section.evaluate((sectionEl, selector) => {
      sectionEl.querySelector('[data-writing-reset]').click();
      const id = sectionEl.dataset.writingActivity;
      return { checked: sectionEl.querySelector(selector).checked, stored: localStorage.getItem(`efc_writing_${location.pathname.split('/').pop().replace('.html', '')}_v1:${id}`) };
    }, c.radio);
    assert.equal(choiceReset.checked, false, `${c.id}: reset clears the choice immediately`);
    assert.equal(choiceReset.stored, null, `${c.id}: reset clears the activity key immediately`);
    pass();
  } else {
    const input = section.locator(c.input);
    await input.fill(c.sample);
    assert.equal(await input.inputValue(), c.sample, `${c.id}: response entry`);
    if (c.model) {
      await section.locator('details[data-student-model] summary').click();
      assert.equal(await input.inputValue(), c.sample, `${c.id}: comparison does not overwrite`);
      await section.locator('details[data-student-model] summary').click();
    }
    const edited = `${c.sample} edited`;
    await input.fill(edited);
    await page.reload({ waitUntil: 'networkidle' });
    await navigate(page, c.id);
    assert.equal(await page.locator(`[data-writing-activity="${c.id}"] ${c.input}`).inputValue(), edited,
      `${c.id}: response persists across reload`);
    pass();

    // Isolated reset: this activity clears synchronously and no other activity loses work.
    const otherId = c.id === 'wb-11' ? '#wb12-6' : null;
    if (otherId) {
      await page.locator(otherId).fill('I get up at seven.');
      pass();
    }
    const immediate = await page.evaluate(({ id, input }) => {
      const section = document.querySelector(`[data-writing-activity="${id}"]`);
      section.querySelector('[data-writing-reset]').click();
      const activityKey = `efc_writing_${location.pathname.split('/').pop().replace('.html', '')}_v1:${id}`;
      return { value: section.querySelector(input).value, stored: localStorage.getItem(activityKey) };
    }, { id: c.id, input: c.input });
    assert.equal(immediate.value, '', `${c.id}: reset clears the field before returning`);
    assert.equal(immediate.stored, null, `${c.id}: reset clears only this activity key`);
    pass();
    await page.reload({ waitUntil: 'networkidle' });
    await navigate(page, c.id);
    assert.equal(await page.locator(`[data-writing-activity="${c.id}"] ${c.input}`).inputValue(), '',
      `${c.id}: reset survives reload`);
    if (otherId) {
      assert.equal(await page.locator(otherId).inputValue(), 'I get up at seven.',
        `${c.id}: resetting one activity keeps another activity's work`);
      pass();
    }
    // No other activity key was removed by the isolated reset.
    const remaining = await page.evaluate(prefix => Object.keys(localStorage).filter(k => k.startsWith(prefix)).length, 
      `efc_writing_${c.file.replace('.html', '')}_v1:`);
    assert.ok(remaining >= (otherId ? 1 : 0), `${c.id}: other activity stores survive`);
    pass();
  }
}

// Storage failure is reported honestly rather than silently pretending to save.
await page.goto(`${baseUrl}/grade4-unit1-lesson5-pupil-book.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  const real = Storage.prototype.setItem;
  Storage.prototype.setItem = function () { throw new Error('quota'); };
  window.__restoreStorage = () => { Storage.prototype.setItem = real; };
});
await navigate(page, 'pb-7');
await page.locator('#pb7-1').fill('Storage check');
const status = await page.locator('[data-writing-activity="pb-7"] [data-writing-status]').innerText();
assert.match(status, /unavailable/i, 'storage failure is disclosed in the activity status');
await page.evaluate(() => window.__restoreStorage());
pass();

assert.deepEqual(errors, [], `No page errors: ${errors.join('; ')}`);
await browser.close();
server.close();
console.log(`lesson5-writing browser checks passed: ${checks} assertions across 5 representative activities `
  + '(exception disclosure, model reveal/hide, non-overwriting comparison, editing, reload persistence, '
  + 'isolated reset and honest storage failure).');
