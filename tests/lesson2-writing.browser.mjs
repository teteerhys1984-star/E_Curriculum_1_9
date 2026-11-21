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
  ['grade3-unit1-lesson2-workbook.html', ['wb-4', 'wb-5', 'wb-6']],
  ['grade4-unit1-lesson2-pupil-book.html', ['pb-3', 'pb-6', 'pb-9', 'pb-10', 'pb-11']],
  ['grade4-unit1-lesson2-workbook.html', ['wb-1', 'wb-4', 'wb-5', 'wb-8']]
];
const fieldCounts = {
  'grade3-unit1-lesson2-workbook.html': { 'wb-4': 4, 'wb-5': 4, 'wb-6': 1 },
  'grade4-unit1-lesson2-pupil-book.html': { 'pb-3': 1, 'pb-6': 1, 'pb-9': 3, 'pb-10': 3, 'pb-11': 3 },
  'grade4-unit1-lesson2-workbook.html': { 'wb-1': 6, 'wb-4': 2, 'wb-5': 5, 'wb-8': 10 }
};
const expected = {
  'grade3-unit1-lesson2-workbook.html:wb-4': /21, 22, 23, 24, 25, 26, 27, 28, 29, 30/,
  'grade3-unit1-lesson2-workbook.html:wb-5': /English.*Science.*Sports.*Maths/s,
  'grade3-unit1-lesson2-workbook.html:wb-6': /sample answer.*My favourite lesson is English/is,
  'grade4-unit1-lesson2-pupil-book.html:pb-3': /no model answer can be verified/is,
  'grade4-unit1-lesson2-pupil-book.html:pb-6': /sample answer.*long black hair.*brown eyes/is,
  'grade4-unit1-lesson2-pupil-book.html:pb-9': /has got.*is.*is/s,
  'grade4-unit1-lesson2-pupil-book.html:pb-10': /His name is John.*He is short.*He has got black hair/s,
  'grade4-unit1-lesson2-pupil-book.html:pb-11': /sample sentences.*blond hair.*brown eyes.*short black hair/is,
  'grade4-unit1-lesson2-workbook.html:wb-1': /Liza.*mother.*James.*brother.*sister/s,
  'grade4-unit1-lesson2-workbook.html:wb-4': /recording.*not supplied/is,
  'grade4-unit1-lesson2-workbook.html:wb-5': /sample description.*short hair.*glasses/is,
  'grade4-unit1-lesson2-workbook.html:wb-8': /sample completion.*Sami/is
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
        assert.match(await group.locator('[data-writing-exception]').textContent(), expected[`${file}:${id}`]);
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
  assert.match(await page.locator('[data-writing-activity="wb-4"] [data-writing-status]').textContent(), /storage is unavailable/i);
  console.log('PASS storage failure is disclosed');
} finally {
  if (browser) await browser.close();
  server.close();
}
