import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const root = process.cwd();
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.woff2':'font/woff2' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  const pkg = require('@sparticuz/chromium');
  const dir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
  const libs = await pkg.inflate(path.join(dir, 'bin', 'al2023.tar.br'));
  pkg.setupLambdaEnvironment(path.join(libs, 'lib'));
  browser = await chromium.launch({ headless: true, executablePath: await pkg.default.executablePath(), args: pkg.default.args });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const folder = process.env.LESSON5_PUBLISHED ? 'grade8-unit1-lesson5' : 'docs/grade8-unit1-lesson5-draft/grade8-unit1-lesson5';
  for (const suffix of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) {
    await page.goto(origin + folder + suffix + '.html');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${suffix}: horizontal overflow`);
    if (!process.env.LESSON5_PUBLISHED) assert.match(await page.locator('.notice').first().innerText(), /Draft/);
  }
  await page.goto(origin + folder + '-pupil-book.html');
  await page.getByRole('button', { name: 'Reading tasks and Vocabulary', exact: true }).first().click();
  for (const [i, value] of ['b', 'c', 'e', 'a', 'd'].entries()) await page.locator(`#sb36-match-${i + 1}`).selectOption(value);
  await page.locator('#sb36-match .check-practice').click();
  assert.match(await page.locator('#sb36-match .practice-feedback').innerText(), /5 of 5/);
  await page.reload();
  await page.getByRole('button', { name: 'Reading tasks and Vocabulary', exact: true }).first().click();
  assert.equal(await page.locator('#sb36-match-1').inputValue(), 'b');
  await page.locator('#sb36-match button[type=reset]').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#sb36-match-1').inputValue(), '');
  await page.getByRole('button', { name: 'Pronunciation and Writing', exact: true }).first().click();
  assert.equal(await page.locator('#sb39-pronunciation select').count(), 23);
  assert.equal(await page.locator('#sb39-pronunciation .check-practice').count(), 0);
  await page.locator('#sb39-word-1').selectOption('short');
  await page.reload();
  await page.getByRole('button', { name: 'Pronunciation and Writing', exact: true }).first().click();
  assert.equal(await page.locator('#sb39-word-1').inputValue(), 'short');
  await page.locator('#sb39-pronunciation button[type=reset]').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#sb39-word-1').inputValue(), '');
  await page.goto(origin + folder + '-vocabulary.html');
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'assets/grade8-unit1-lesson5/vocabulary-audit.json'), 'utf8'));
  const rendered = await page.locator('table tbody tr').evaluateAll(rows => rows.map(row => ({ english: row.cells[0].textContent.trim(), arabic: row.cells[1].textContent.trim(), dir: row.cells[1].getAttribute('dir'), lang: row.cells[1].getAttribute('lang') })));
  assert.equal(rendered.length, audit.length);
  for (const item of audit) assert.ok(rendered.some(row => row.english === item.english && row.arabic === item.arabic && row.dir === 'rtl' && row.lang === 'ar'), item.english);
  await page.getByRole('button', { name: 'Vocabulary practice', exact: true }).first().click();
  await page.locator('#vocab-practice summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#vocab-practice details').getAttribute('open'), '');
  await page.locator('#vocab-practice button[type=reset]').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#vocab-practice details').getAttribute('open'), null);
  await page.goto(origin + folder + '-test.html');
  assert.equal(await page.locator('#answer-key').isVisible(), false);
  await page.locator('#teacher-password').fill('incorrect');
  await page.locator('#unlock-teacher').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false);
  const reviewedKeys = ['a','b','b','a','a','b','b','a','b','a','b','a'];
  for (let i = 1; i <= 12; i++) {
    await page.getByRole('button', { name: new RegExp(`Go to question ${i},`) }).click();
    const q = page.locator('.question').nth(i-1);
    assert.equal(await q.getAttribute('data-correct'), reviewedKeys[i-1]);
    await q.locator(`input[value="${reviewedKeys[i-1]}"]`).check();
  }
  const reviewedAnswers = ['humiliate them','grief','judge it','a trusted teacher','True','False','would take','managed','If I were you, I would talk to a teacher.','She talked with a friend.','lonely','Why don’t you talk to a trusted adult?'];
  const keyEntries = await page.locator('#answer-key ol li b').allTextContents();
  assert.deepEqual(keyEntries, reviewedAnswers);
  for (let i=0;i<12;i++) {
    const q=page.locator('.question').nth(i);
    const chosen=await q.locator('input:checked').evaluate(el=>el.closest('label').textContent.trim());
    assert.equal(chosen,reviewedAnswers[i],`question ${i+1}: displayed answer`);
  }
  await page.locator('#quiz button[type=submit]').click();
  assert.match(await page.locator('#quiz-result').innerText(), /12 \/ 12/);
  await page.reload();
  assert.match(await page.locator('#quiz-result').innerText(), /12 \/ 12/);
  await page.locator('#quiz button[type=reset]').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#quiz-result').innerText(), '');
  assert.equal(await page.locator('#quiz input:checked').count(), 0);
  await page.locator('#quiz button[type=submit]').click();
  assert.match(await page.locator('#quiz-result').innerText(), /0 \/ 12/);
  await page.getByRole('button', { name: /Go to question 1,/ }).click();
  await page.locator('.question').first().locator('input[value="b"]').check();
  await page.locator('#quiz button[type=submit]').click();
  assert.match(await page.locator('#quiz-result').innerText(), /0 \/ 12/);
  await page.locator('#teacher-password').fill('somer173');
  await page.locator('#unlock-teacher').click();
  assert.equal(await page.locator('#answer-key').isVisible(), true);
  await page.locator('#close-teacher').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS draft smoke: five pages, narrow layout, practice, pronunciation persistence/reset, glossary, keyboard reveal, scoring and classroom gate');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
