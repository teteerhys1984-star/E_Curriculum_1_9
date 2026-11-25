// Grade 3 Unit 1 browser checks shared by Lessons 7 and 8: navigation, crops, vocabulary, the independent
// Lesson Test (scoring, persistence, reset, teacher gate), Workbook writing drafts and comparison, responsive
// overflow and console health. Usage: node tests/grade3-lesson.browser.mjs <lesson> [full|writing]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const lesson = process.argv[2];
const mode = process.argv[3] || 'full';
assert.ok(['7', '8'].includes(lesson), 'usage: grade3-lesson.browser.mjs <7|8> [full|writing]');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const base = `grade3-unit1-lesson${lesson}`;
const writingKey = `${base}-workbook-drafts-v1`;
const evidence = path.join(root, 'test-results', base);
fs.mkdirSync(evidence, { recursive: true });
const prefix = '/E_Curriculum_1_9/';
const quiz = JSON.parse(fs.readFileSync(path.join(root, `tests/${base}.quiz.json`), 'utf8'));
const content = JSON.parse(fs.readFileSync(path.join(root, `tests/${base}.content.json`), 'utf8'));
const checks = [];
const errors = [];
const pass = (name, detail = '') => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end('Use project-prefix URL'); return; }
  const file = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${prefix}`;
let browser;
try {
  let launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  else if (process.platform === 'linux') {
    const chromiumPackage = require('@sparticuz/chromium');
    const bundled = chromiumPackage.default;
    const packageDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
    const libs = await chromiumPackage.inflate(path.join(packageDir, 'bin', 'al2023.tar.br'));
    chromiumPackage.setupLambdaEnvironment(path.join(libs, 'lib'));
    launchOptions = { ...launchOptions, executablePath: await bundled.executablePath(), args: bundled.args };
  }
  browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ url: page.url(), console: message.text() }); });
  page.on('response', response => { if (response.status() >= 400) errors.push({ url: response.url(), status: response.status() }); });
  const go = async file => {
    const response = await page.goto(origin + file, { waitUntil: 'networkidle' });
    if (response) assert.equal(response.status(), 200, file);
    await page.evaluate(() => document.fonts.ready);
  };
  const noOverflow = async label => {
    const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(size.document <= size.viewport + 1 && size.body <= size.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(size)}`);
  };

  if (mode === 'full') {
    // 1. Menu and navigation
    await go(`${base}.html`);
    assert.equal(await page.locator('nav.section-links a.section-link').count(), 5, 'menu: five section links');
    const prev = `grade3-unit1-lesson${Number(lesson) - 1}.html`;
    assert.ok(await page.locator(`a[href="${prev}"]`).count() > 0, `menu: previous lesson link ${prev}`);
    if (lesson === '7') {
      assert.ok(await page.locator('a[href="grade3-unit1-lesson8.html"]').count() >= 1, 'Lesson 7 links forward to the published Lesson 8');
    } else {
      assert.equal(await page.locator('a[href="grade3-unit1-lesson9.html"]').count(), 0, 'Lesson 8 does not link to unpublished Lesson 9');
      assert.match(await page.locator('body').textContent(), /not yet published/i, 'Lesson 8 shows the honest next-lesson state');
    }
    pass('Menu and navigation', `Five section links, previous Lesson ${Number(lesson) - 1} link, ${lesson === '7' ? 'forward link to Lesson 8' : 'honest unpublished next-lesson state'}`);

    // 2. Pupil's Book and Workbook: every printed block visible, crops load, source pages carry alt text
    for (const [file, prefixId] of [[`${base}-pupil-book.html`, 'pb'], [`${base}-workbook.html`, 'wb']]) {
      await go(file);
      const ids = Object.keys(content.instructions).filter(id => id.startsWith(prefixId));
      for (const id of ids) assert.equal(await page.locator(`#${id}`).count(), 1, `${file}: ${id} present`);
      const steps = await page.locator('.content-nav-links button').count();
      for (let i = 0; i < steps; i++) { await page.locator('.content-nav-links button').nth(i).click(); await page.waitForTimeout(20); }
      const crops = await page.locator('figure.crop img').evaluateAll(imgs => imgs.map(img => ({ src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0 })));
      assert.ok(crops.length >= 6 && crops.every(c => c.ok), `${file}: every crop loads ${JSON.stringify(crops.filter(c => !c.ok))}`);
      const sources = await page.locator('details.source-page img').evaluateAll(imgs => imgs.every(img => img.getAttribute('alt')));
      assert.ok(sources, `${file}: source images have alt text`);
      await noOverflow(file);
    }
    pass('Pupil’s Book and Workbook pages', 'All printed activities visible; every crop image loads; source pages carry alt text');

    // 3. Vocabulary
    await go(`${base}-vocabulary.html`);
    const vocabRows = await page.locator('table.vocabulary-table tbody tr').evaluateAll(rows => rows.map(row => ({
      en: row.cells[0].textContent.trim(), ar: row.cells[1].textContent.trim(), dir: row.cells[1].getAttribute('dir') })));
    assert.deepEqual(vocabRows.map(r => [r.en, r.ar]), content.vocabulary.map(v => [v.english, v.arabic]), 'vocabulary rows');
    assert.ok(vocabRows.every(r => r.dir === 'rtl'), 'Arabic cells are RTL');
    pass('Vocabulary', `${vocabRows.length} lesson words with RTL Arabic meanings in the reviewed order`);

    // 4. Lesson Test: empty state, full marks, persistence, reset, partial scoring, teacher gate
    const total = quiz.questions.length;
    await go(`${base}-test.html`);
    const answer = async (q, correct) => {
      await page.locator('.content-nav-links button').nth(Number(q.id.slice(1)) - 1).click();
      if (q.format === 'short-answer') await page.locator(`#${q.id}-input`).fill(correct ? q.accepted[0] : 'not an answer');
      else await page.locator(`label.option:has(input[name="${q.id}"][value="${correct ? q.correct : (q.correct + 1) % q.options.length}"])`).click();
    };
    assert.equal(await page.locator('input[type="radio"]:checked').count(), 0, 'test: fields start empty');
    await page.locator('#check-answers').click();
    assert.match(await page.locator('#score').textContent(), new RegExp(`Score: 0 / ${total}`));
    pass('Empty test', 'Checking with no answers scores 0 and nothing is counted as correct');

    for (const q of quiz.questions) await answer(q, true);
    await page.locator('#check-answers').click();
    assert.match(await page.locator('#score').textContent(), new RegExp(`Score: ${total} / ${total}`), 'all-correct score');
    pass('Full marks', `All ${total} correct answers score ${total} / ${total}`);

    await page.reload({ waitUntil: 'networkidle' });
    assert.ok(await page.locator(`input[name="${quiz.questions[0].id}"][value="${quiz.questions[0].correct}"]`).isChecked(), 'answers persist after reload');
    const written = quiz.questions.find(q => q.format === 'short-answer');
    assert.equal(await page.locator(`#${written.id}-input`).inputValue(), written.accepted[0], 'written answer persists after reload');
    pass('Attempt persistence', 'Choices and written answers are restored after reload');

    await page.locator('#reset-test').click();
    await page.waitForTimeout(50);
    assert.equal(await page.locator('input[type="radio"]:checked').count(), 0, 'reset clears choices');
    assert.equal(await page.locator('input.written-answer').evaluateAll(els => els.every(el => el.value === '')), true, 'reset clears written answers');
    pass('Reset', 'Reset clears every choice and written answer');

    // Partial: first question wrong, last question left empty => total - 2 correct, total - 1 answered
    const last = quiz.questions[quiz.questions.length - 1];
    for (const q of quiz.questions) if (q.id !== last.id) await answer(q, q.id !== 'q1');
    await page.locator('#check-answers').click();
    assert.match(await page.locator('#score').textContent(), new RegExp(`Score: ${total - 2} / ${total}`), 'partial score');
    assert.match(await page.locator('#score').textContent(), new RegExp(`Answered: ${total - 1} / ${total}`), 'answered count');
    pass('Partial scoring', `One wrong and one empty answer give ${total - 2} / ${total}; the empty item does not count as correct`);

    assert.equal(await page.locator('#answer-guide').isHidden(), true, 'teacher key hidden');
    await page.locator('#teacher-password').fill('wrong');
    await page.locator('#unlock-solutions').click();
    assert.equal(await page.locator('#answer-guide').isHidden(), true, 'wrong password keeps key closed');
    assert.match(await page.locator('#gate-feedback').textContent(), /Incorrect password/);
    await page.locator('#teacher-password').fill('somer173');
    await page.locator('#unlock-solutions').click();
    assert.equal(await page.locator('#answer-guide').isVisible(), true, 'teacher key opens');
    assert.equal(await page.locator('#teacher-key li').count(), total, `teacher key lists ${total} items`);
    pass('Teacher gate', `Key stays hidden with a wrong password, opens with the classroom password and lists all ${total} items`);
    await page.locator('#lock-solutions').click();
    assert.equal(await page.locator('#answer-guide').isHidden(), true, 'teacher key closes');
    await page.locator('#reset-test').click();

    // 5. Responsive layout at each width
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const file of [`${base}.html`, `${base}-pupil-book.html`, `${base}-workbook.html`, `${base}-vocabulary.html`, `${base}-test.html`]) {
        await go(file);
        await noOverflow(`${file} @${width}`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    await go(`${base}-test.html`);
    await page.screenshot({ path: path.join(evidence, 'test-desktop-1440.png'), fullPage: false });
    pass('Responsive layout', 'All five pages free of horizontal overflow at 1440, 1024, 768, 390 and 320 px');

    // 6. Accessibility basics
    await page.setViewportSize({ width: 1440, height: 960 });
    for (const file of [`${base}.html`, `${base}-pupil-book.html`, `${base}-workbook.html`, `${base}-vocabulary.html`, `${base}-test.html`]) {
      await go(file);
      const issues = await page.evaluate(() => {
        const bad = [];
        document.querySelectorAll('img').forEach(img => { if (!img.hasAttribute('alt')) bad.push('img without alt: ' + img.src); });
        document.querySelectorAll('button, input:not([type=hidden])').forEach(el => {
          const name = el.getAttribute('aria-label') || el.textContent.trim() || el.value || (el.id && document.querySelector(`label[for="${el.id}"]`)) || (el.closest('label'));
          if (!name) bad.push('unnamed control: ' + (el.id || el.outerHTML.slice(0, 60)));
        });
        if (document.querySelectorAll('main').length !== 1) bad.push('main landmark count');
        return bad;
      });
      assert.deepEqual(issues, [], `${file}: accessibility basics`);
    }
    pass('Accessibility basics', 'Every image has alt text, every control has an accessible name, and each page has one main landmark');
  }

  // Workbook writing layer: drafts persist, compare never overwrites, reset clears one activity, no score is shown.
  await page.setViewportSize({ width: 1440, height: 960 });
  await go(`${base}-workbook.html`);
  const managed = await page.locator('[data-writing-activity]').evaluateAll(els => els.map(el => el.getAttribute('data-writing-activity')));
  assert.ok(managed.length >= 3, `writing: managed activities ${managed.join(', ')}`);
  const target = managed.find(id => id === 'wb-5') || managed[0];
  const stepIndex = await page.evaluate(id => [...document.querySelectorAll('section.panel[id^="wb-"]')].findIndex(s => s.id === id), target);
  await page.locator('.content-nav-links button').nth(stepIndex).click();
  const inputs = page.locator(`#${target} input[type="text"]`);
  const n = await inputs.count();
  assert.ok(n >= 3, `${target}: response fields`);
  const typed = [];
  for (let i = 0; i < n; i++) { const v = `draft ${i + 1}`; typed.push(v); await inputs.nth(i).fill(v); }
  await page.locator(`#${target} .check-practice`).click();
  for (let i = 0; i < n; i++) assert.equal(await inputs.nth(i).inputValue(), typed[i], `${target}: compare does not overwrite response ${i + 1}`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.content-nav-links button').nth(stepIndex).click();
  for (let i = 0; i < n; i++) assert.equal(await page.locator(`#${target} input[type="text"]`).nth(i).inputValue(), typed[i], `${target}: draft ${i + 1} persists after reload`);
  const stored = await page.evaluate(key => localStorage.getItem(key), writingKey);
  assert.ok(stored && stored.includes('draft 1'), 'writing drafts stored under the lesson key');
  await page.locator('.content-nav-links button').nth(stepIndex).click();
  await page.locator(`#${target} button[type="reset"]`).click();
  await page.waitForTimeout(50);
  for (let i = 0; i < n; i++) assert.equal(await page.locator(`#${target} input[type="text"]`).nth(i).inputValue(), '', `${target}: reset clears response ${i + 1}`);
  assert.equal(/Score:/i.test(await page.locator('main').textContent()), false, 'no writing score is shown');
  pass('Workbook writing layer', `${managed.length} managed writing activities; ${target} drafts persist, compare never overwrites, reset clears one activity`);

  assert.deepEqual(errors, [], 'Browser/console/HTTP errors: ' + JSON.stringify(errors));
  pass('Browser console and HTTP health', 'Zero page errors, console errors or HTTP responses >= 400 on tested routes');
  const report = { suite: `${base}-browser-${mode}`, status: 'PASS', date: new Date().toISOString(), browser: 'Chromium ' + browser.version(), checks };
  fs.writeFileSync(path.join(evidence, `report-${mode}.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(`${base} browser suite (${mode}): PASS (${checks.length} groups)`);
} catch (error) {
  fs.writeFileSync(path.join(evidence, `failure-${mode}.json`), JSON.stringify({ status: 'FAIL', error: error.stack, checks, errors }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  server.close();
}
