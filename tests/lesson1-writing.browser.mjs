import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const root = process.cwd();
const require = createRequire(import.meta.url);
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/E_Curriculum_1_9\//, '');
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const cases = [
  ['grade3-unit1-lesson1-workbook.html', ['wb4', 'wb5']],
  ['grade4-unit1-lesson1-pupil-book.html', ['pb1', 'pb2', 'pb5', 'pb6b', 'pb7', 'pb8', 'pb9']],
  ['grade4-unit1-lesson1-workbook.html', ['wb1', 'wb3', 'wb4', 'wb5', 'wb6', 'wb7', 'wb8']]
];
const fieldCounts = {
  'grade3-unit1-lesson1-workbook.html': { wb4: 4, wb5: 1 },
  'grade4-unit1-lesson1-pupil-book.html': { pb1: 3, pb2: 12, pb5: 2, pb6b: 5, pb7: 4, pb8: 2, pb9: 9 },
  'grade4-unit1-lesson1-workbook.html': { wb1: 7, wb3: 3, wb4: 14, wb5: 5, wb6: 4, wb7: 7, wb8: 6 }
};
const expected = {
  'grade3-unit1-lesson1-workbook.html:wb4': /Maya\s+has got\s+a little sister.*I\s+have got\s+two brothers.*He\s+has got\s+a car.*We\s+have got\s+a nice flat/s,
  'grade3-unit1-lesson1-workbook.html:wb5': /sample response.*My name's John.*I live in a flat.*I live with my parents.*I'm ten years old.*I've got a little brother/is,
  'grade4-unit1-lesson1-pupil-book.html:pb5': /sample responses.*I'm from Lebanon.*Lebanon and Syria are Arab countries/is,
  'grade4-unit1-lesson1-pupil-book.html:pb6b': /am\s*·\s*am\s*·\s*is\s*·\s*are\s*·\s*is/,
  'grade4-unit1-lesson1-pupil-book.html:pb7': /2\. are.*3\. is.*4\. am.*5\. is/s,
  'grade4-unit1-lesson1-pupil-book.html:pb8': /Sally is ten years old.*Sami and Reem are in grade four/s,
  'grade4-unit1-lesson1-pupil-book.html:pb9': /sample response.*Ahmed.*Lebanon.*ten years old.*grade 4.*father is a doctor/is,
  'grade4-unit1-lesson1-workbook.html:wb1': /Rosa.*meet.*today.*fine.*name.*My.*old/s,
  'grade4-unit1-lesson1-workbook.html:wb3': /2\s*·\s*1\s*·\s*3/,
  'grade4-unit1-lesson1-workbook.html:wb4': /2 two.*3 three.*5 five.*6 six.*7 seven.*9 nine.*11 eleven.*12 twelve.*13 thirteen.*14 fourteen.*15 fifteen.*18 eighteen.*19 nineteen.*20 twenty/s,
  'grade4-unit1-lesson1-workbook.html:wb6': /We are from Syria.*Robin is ten years old.*How are you doing.*Where are you from/s,
  'grade4-unit1-lesson1-workbook.html:wb7': /am\s*·\s*is\s*·\s*are\s*·\s*are\s*·\s*are\s*·\s*is\s*·\s*is/,
  'grade4-unit1-lesson1-workbook.html:wb8': /partial example.*She is Tala.*He is Tom.*It is my bag/is
};
try {
  const pkg = require('@sparticuz/chromium');
  let options = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  else if (process.platform === 'linux') {
    const dir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
    const libs = await pkg.inflate(path.join(dir, 'bin', 'al2023.tar.br'));
    pkg.setupLambdaEnvironment(path.join(libs, 'lib'));
    options = { ...options, executablePath: await pkg.default.executablePath(), args: pkg.default.args };
  }
  browser = await chromium.launch(options);
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}/E_Curriculum_1_9/`;
  const navigate = async id => {
    const i = await page.locator(`[data-writing-activity="${id}"]`).evaluate(el => Array.from(document.querySelectorAll('main > section.panel')).indexOf(el.closest('section.panel')));
    assert.ok(i >= 0);
    await page.locator('.content-nav-links button').nth(i).click();
  };
  for (const [file, ids] of cases) {
    await page.goto(origin + file);
    assert.deepEqual(await page.locator('[data-writing-activity]').evaluateAll(els => els.map(el => el.dataset.writingActivity)), ids, file);
    assert.equal(await page.locator('#teacher-gate, #teacher-key, #answer-guide').count(), 0, `${file}: no teacher-only test key in the book`);
    for (const id of ids) {
      await navigate(id);
      const group = page.locator(`[data-writing-activity="${id}"]`);
      const fields = group.locator('input[type="text"], textarea');
      const count = await fields.count();
      assert.equal(count, fieldCounts[file][id], `${file}:${id}: expected response controls`);
      for (let i = 0; i < count; i++) await fields.nth(i).fill(`draft ${id} ${i}`);
      const before = await fields.evaluateAll(els => els.map(el => el.value));
      const details = group.locator('details[data-student-model]');
      const reveal = group.locator('button[aria-controls]').first();
      if (await details.count()) {
        await details.locator('summary').click();
        assert.equal(await details.evaluate(el => el.open), true);
        assert.match(await details.textContent(), expected[`${file}:${id}`]);
      } else if (await reveal.count()) {
        await reveal.click();
        assert.equal(await reveal.getAttribute('aria-expanded'), 'true');
        const target = await reveal.getAttribute('aria-controls');
        assert.equal(await page.locator(`#${target}`).isVisible(), true);
        assert.match(await page.locator(`#${target}`).textContent(), expected[`${file}:${id}`]);
      } else {
        assert.match(await group.locator('[data-writing-exception]').textContent(), /recording.*not supplied/is);
      }
      assert.deepEqual(await fields.evaluateAll(els => els.map(el => el.value)), before, 'reveal must not overwrite student work');
      await fields.first().fill(`edited ${id}`);
    }
    await page.reload();
    for (const id of ids) {
      await navigate(id);
      const group = page.locator(`[data-writing-activity="${id}"]`);
      const fields = group.locator('input[type="text"], textarea');
      assert.equal(await fields.first().inputValue(), `edited ${id}`, `${file}:${id} reload`);
      for (let i = 1; i < await fields.count(); i++) assert.equal(await fields.nth(i).inputValue(), `draft ${id} ${i}`);
    }
    // Reset each activity, and check that the next activity is not cleared.
    for (let n = 0; n < ids.length; n++) {
      const id = ids[n];
      await navigate(id);
      const group = page.locator(`[data-writing-activity="${id}"]`);
      const details = group.locator('details[data-student-model]');
      const reveal = group.locator('button[aria-controls]').first();
      if (await details.count()) await details.locator('summary').click();
      else if (await reveal.count()) await reveal.click();
      await group.locator('[data-writing-reset]').click();
      assert.ok((await group.locator('input[type="text"], textarea').evaluateAll(els => els.map(el => el.value))).every(value => value === ''));
      if (await details.count()) assert.equal(await details.evaluate(el => el.open), false);
      else if (await reveal.count()) assert.equal(await reveal.getAttribute('aria-expanded'), 'false');
      if (n + 1 < ids.length) {
        await navigate(ids[n + 1]);
        assert.equal(await page.locator(`[data-writing-activity="${ids[n + 1]}"] input[type="text"], [data-writing-activity="${ids[n + 1]}"] textarea`).first().inputValue(), `edited ${ids[n + 1]}`);
      }
    }
    await page.reload();
    for (const id of ids) {
      await navigate(id);
      assert.ok((await page.locator(`[data-writing-activity="${id}"] input[type="text"], [data-writing-activity="${id}"] textarea`).evaluateAll(els => els.map(el => el.value))).every(value => value === ''));
    }
    console.log(`PASS ${file}: ${ids.length} source activities, reveal, edit, reload and isolated reset`);
  }
  assert.deepEqual(errors, []);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  });
  await page.goto(origin + cases[0][0]);
  assert.match(await page.locator('[data-writing-activity="wb4"] [data-writing-status]').textContent(), /storage is unavailable/i);
  console.log('PASS storage failure is disclosed');
} finally {
  if (browser) await browser.close();
  server.close();
}
