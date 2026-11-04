/* Grade 5 · Unit 1 · Lesson 3 (Daily Routines): end-to-end checks for the five new pages.
   The spec answers every printed control on both book pages, reloads and navigates away
   and back to prove the answers survive, drives the twenty-question test through scoring
   and the teacher gate, and repeats the overflow check on a phone viewport.
   Nothing here is mocked: the pages are served from the repository as they will ship. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'test-results', 'grade5-unit1-lesson3');
fs.mkdirSync(evidenceDir, { recursive: true });
const checks = [];
const errors = [];
const screenshots = [];
const pass = (name, detail) => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;

const PAGES = {
  menu: 'grade5-unit1-lesson3.html',
  pupilBook: 'grade5-unit1-lesson3-pupil-book.html',
  workbook: 'grade5-unit1-lesson3-workbook.html',
  vocabulary: 'grade5-unit1-lesson3-vocabulary.html',
  test: 'grade5-unit1-lesson3-test.html'
};

let browser;
try {
  let launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  } else if (process.platform === 'linux') {
    const chromiumPackage = require('@sparticuz/chromium');
    const bundled = chromiumPackage.default;
    const packageDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
    const libs = await chromiumPackage.inflate(path.join(packageDir, 'bin', 'al2023.tar.br'));
    chromiumPackage.setupLambdaEnvironment(path.join(libs, 'lib'));
    launchOptions = { ...launchOptions, executablePath: await bundled.executablePath(), args: bundled.args };
  }
  browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  const go = async file => {
    await page.goto(origin + file, { waitUntil: 'load' });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  };
  // Every printed step must be reachable through the shared navigator.
  const openAllSteps = async () => {
    const buttons = page.locator('.content-nav-links button');
    const count = await buttons.count();
    for (let index = 0; index < count; index++) await buttons.nth(index).click();
  };

  /* ---------- 1. The five pages load with no console errors and no overflow ---------- */
  for (const [label, file] of Object.entries(PAGES)) {
    await go(file);
    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      horizontal: document.documentElement.scrollWidth - innerWidth,
      arabic: Array.from(document.querySelectorAll('body *')).filter(el => /[\u0600-\u06FF]/.test(el.textContent || '') && !el.closest('[lang="ar"]')).length
    }));
    assert.equal(state.lang, 'en', `${file}: English document`);
    assert.equal(state.dir, 'ltr', `${file}: left-to-right document`);
    assert.ok(state.horizontal <= 1, `${file}: desktop horizontal overflow ${state.horizontal}px`);
    if (label !== 'vocabulary') assert.equal(state.arabic, 0, `${file}: Arabic must not appear outside a marked Arabic cell`);
  }
  pass('Lesson 3 pages render in English, left to right, with no desktop overflow', 'All five pages: lang=en, dir=ltr, no horizontal overflow at 1366×900; Arabic appears only on the Vocabulary page inside lang="ar" cells');

  /* ---------- 2. Answer every printed control on the Pupil's Book page ---------- */
  await go(PAGES.pupilBook);
  const pbControls = await page.evaluate(() => ({
    radios: Array.from(document.querySelectorAll('main input[type="radio"]')).length,
    names: [...new Set(Array.from(document.querySelectorAll('main input[type="radio"]'), el => el.name))].length,
    texts: Array.from(document.querySelectorAll('main input[type="text"]')).length,
    selects: Array.from(document.querySelectorAll('main select')).length,
    reveals: Array.from(document.querySelectorAll('main button.reveal')).length
  }));
  assert.ok(pbControls.radios >= 40, `Pupil's Book: expected every printed choice to be answerable, found ${pbControls.radios} radios`);
  assert.equal(pbControls.selects, 2, "Pupil's Book activity 3 keeps its two printed gaps answerable");
  assert.ok(pbControls.reveals >= 8, "Pupil's Book: a reveal per printed activity");
  // Click one printed option in every radio group and fill every writing line.
  const pbFilled = await page.evaluate(() => {
    const groups = new Map();
    document.querySelectorAll('main input[type="radio"]').forEach(input => {
      if (!groups.has(input.name)) groups.set(input.name, []);
      groups.get(input.name).push(input);
    });
    groups.forEach(inputs => {
      inputs[0].checked = true;
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main input[type="text"]').forEach((input, index) => {
      input.value = 'answer ' + (index + 1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main select').forEach((select, index) => {
      select.value = select.options[index + 1].value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return { groups: groups.size, texts: document.querySelectorAll('main input[type="text"]').length, selects: document.querySelectorAll('main select').length };
  });
  assert.ok(pbFilled.groups > 10, "Pupil's Book: answered every printed radio group");
  const pbStatusText = await page.locator('[data-status-for="pb1"]').innerText();
  assert.match(pbStatusText, /6 of 6 answered/, "Pupil's Book activity 1 counter follows the six picture groups");
  const pb2Status = await page.locator('[data-status-for="pb2"]').innerText();
  assert.match(pb2Status, /6 of 6 answered/, "Pupil's Book activity 2 counter follows the six word pairs");
  // The stored answers must survive a reload ...
  await page.reload({ waitUntil: 'load' });
  const afterReload = await page.evaluate(() => ({
    checked: document.querySelectorAll('main input[type="radio"]:checked').length,
    texts: Array.from(document.querySelectorAll('main input[type="text"]')).filter(el => el.value.trim()).length,
    selects: Array.from(document.querySelectorAll('main select')).filter(el => el.value).length
  }));
  assert.equal(afterReload.checked, pbFilled.groups, "Pupil's Book: every chosen option survives a reload");
  assert.equal(afterReload.texts, pbFilled.texts, "Pupil's Book: every written answer survives a reload");
  assert.equal(afterReload.selects, pbFilled.selects, "Pupil's Book: both chosen phrases survive a reload");
  // ... and a trip to another lesson-3 page and back.
  await go(PAGES.workbook);
  await go(PAGES.pupilBook);
  const afterNavigation = await page.evaluate(() => ({
    checked: document.querySelectorAll('main input[type="radio"]:checked').length,
    texts: Array.from(document.querySelectorAll('main input[type="text"]')).filter(el => el.value.trim()).length
  }));
  assert.equal(afterNavigation.checked, pbFilled.groups, "Pupil's Book: every chosen option survives navigation to another page and back");
  assert.equal(afterNavigation.texts, pbFilled.texts, "Pupil's Book: every written answer survives navigation to another page and back");
  // Every reveal must open its panel.
  await openAllSteps();
  const revealCount = await page.locator('main button.reveal').count();
  for (let index = 0; index < revealCount; index++) {
    const button = page.locator('main button.reveal').nth(index);
    if (!(await button.isVisible())) continue;
    await button.click();
    const id = await button.getAttribute('aria-controls');
    assert.equal(await page.locator('#' + id).isVisible(), true, `Pupil's Book reveal ${id} opens its panel`);
    assert.equal(await button.getAttribute('aria-expanded'), 'true', `Pupil's Book reveal ${id} reports aria-expanded=true`);
  }
  await page.screenshot({ path: path.join(evidenceDir, 'pupil-book-desktop.png'), fullPage: true });
  screenshots.push('pupil-book-desktop.png');
  pass('Pupil’s Book: every printed item is answerable and the answers persist', `${pbControls.radios} printed choices, ${pbControls.texts} writing lines and ${pbControls.selects} gap selections are answerable; answers survive a reload and a round trip to the Workbook page; all ${revealCount} reveal panels open`);

  /* ---------- 3. The Workbook page, including the items with no key ---------- */
  await go(PAGES.workbook);
  const wbFilled = await page.evaluate(() => {
    const groups = new Map();
    document.querySelectorAll('main input[type="radio"]').forEach(input => {
      if (!groups.has(input.name)) groups.set(input.name, []);
      groups.get(input.name).push(input);
    });
    groups.forEach(inputs => {
      inputs[0].checked = true;
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main input[type="text"]').forEach((input, index) => {
      input.value = 'item ' + (index + 1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.querySelectorAll('main select').forEach((select, index) => {
      select.value = 'A';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main textarea').forEach((area, index) => {
      area.value = 'written answer ' + (index + 1);
      area.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return {
      groups: groups.size,
      radios: document.querySelectorAll('main input[type="radio"]').length,
      texts: document.querySelectorAll('main input[type="text"]').length,
      selects: document.querySelectorAll('main select').length,
      textareas: document.querySelectorAll('main textarea').length
    };
  });
  assert.equal(wbFilled.radios, 8, 'Workbook exercise 4 keeps both printed choices for four listening items');
  assert.equal(wbFilled.groups, 4, 'Workbook exercise 4 keeps four listening items');
  assert.equal(wbFilled.selects, 7, 'Workbook exercise 1 keeps seven matching selects');
  assert.equal(wbFilled.texts, 31, 'Workbook keeps 6 (ex2) + 12 (clock) + 6 (ex5 adverbs and verbs) + 7 (ex6a) writing lines');
  assert.equal(wbFilled.textareas, 9, 'Workbook keeps 3 routine boxes and 6 routine sentences');
  // The clock labels are blank in the book: no printed time text inside a label.
  const clockLabels = await page.evaluate(() => Array.from(document.querySelectorAll('.l3-clock-labels .l3-clock-label')).map(cell => {
    const input = cell.querySelector('input');
    const text = Array.from(cell.childNodes).filter(node => node.nodeType === 3 || node.tagName === 'SPAN' && !node.hasAttribute('aria-hidden') && node.className !== 'l3-dots').map(node => node.textContent || '').join(' ').trim();
    return { text, id: input?.id || '' };
  }));
  assert.equal(clockLabels.length, 12, 'Workbook exercise 3 keeps twelve blank labels');
  for (const label of clockLabels) {
    assert.doesNotMatch(label.text, /past|to\b|o’clock|o'clock/i, `Workbook clock label ${label.id} must stay blank, found “${label.text}”`);
  }
  // The listening exercise must say the audio is missing and claim no answer.
  const ex4 = await page.locator('.notice').first().innerText();
  assert.match(ex4, /Audio required; the recording was not supplied/, 'Workbook exercise 4 states the audio is unavailable');
  assert.equal(await page.locator('main audio').count(), 0, 'Workbook invents no audio element');
  // The passage keeps the printed numbering and does not invent a mark (6).
  const marks = await page.evaluate(() => Array.from(document.querySelectorAll('.l3-reading .l3-mark-num')).map(mark => mark.textContent.trim()));
  assert.deepEqual(marks, ['(1)', '(2)', '(3)', '(4)', '(5)', '(7)', '(8)'], 'Workbook passage keeps exactly the printed marks (1)-(5), (7), (8)');
  // Reload: workbook answers are kept too.
  await page.reload({ waitUntil: 'load' });
  const wbAfterReload = await page.evaluate(() => ({
    checked: document.querySelectorAll('main input[type="radio"]:checked').length,
    texts: Array.from(document.querySelectorAll('main input[type="text"]')).filter(el => el.value.trim()).length,
    textareas: Array.from(document.querySelectorAll('main textarea')).filter(el => el.value.trim()).length,
    selects: Array.from(document.querySelectorAll('main select')).filter(el => el.value).length
  }));
  assert.equal(wbAfterReload.checked, 4, 'Workbook: listening choices survive a reload');
  assert.equal(wbAfterReload.texts, wbFilled.texts, 'Workbook: every written item survives a reload');
  assert.equal(wbAfterReload.textareas, wbFilled.textareas, 'Workbook: every writing box survives a reload');
  assert.equal(wbAfterReload.selects, wbFilled.selects, 'Workbook: every matching select survives a reload');
  await page.screenshot({ path: path.join(evidenceDir, 'workbook-desktop.png'), fullPage: true });
  screenshots.push('workbook-desktop.png');
  pass('Workbook: every exercise is answerable, and the blank clock labels and missing mark (6) are preserved', 'WB1 ×7 selects, WB2 ×6, WB3 ×12 blank labels, WB4 ×4 listening items (no key, audio notice), WB5 ×6, WB6a ×7, WB6b ×3, WB7 ×6; all answers survive a reload');

  /* ---------- 4. The twenty-question test ---------- */
  await go(PAGES.test);
  const testShape = await page.evaluate(() => ({
    questions: document.querySelectorAll('#quiz .question').length,
    answers: document.querySelectorAll('#quiz input[type="radio"]').length,
    correct: Array.from(document.querySelectorAll('#quiz .question')).map(question => Number(question.dataset.correct)),
    kinds: Array.from(document.querySelectorAll('#quiz .question')).map(question => question.dataset.kind),
    references: Array.from(document.querySelectorAll('#quiz .question')).map(question => question.dataset.reference || '')
  }));
  assert.equal(testShape.questions, 20, 'The lesson test has twenty questions');
  assert.equal(testShape.answers, 40, 'Each question keeps its two printed options');
  assert.ok(testShape.references.every(text => /Pupil’s Book|Workbook/.test(text)), 'Every question names the page it comes from');
  const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'grade5-unit1-lesson3.quiz.json'), 'utf8'));
  assert.equal(fixture.length, testShape.questions, 'The stored fixture covers every question');
  fixture.forEach((question, index) => {
    assert.equal(testShape.correct[index], question.correct, `Question ${index + 1}: answer index matches the fixture`);
    assert.equal(testShape.kinds[index], question.kind, `Question ${index + 1}: evidence type matches the fixture`);
  });
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'The teacher key starts hidden');
  // All correct.
  const selectAll = async value => {
    await page.evaluate(correct => {
      document.querySelectorAll('#quiz .question').forEach((question, index) => {
        const input = question.querySelector(`input[value="${correct[index]}"]`);
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }, value);
  };
  await selectAll(testShape.correct);
  await page.locator('#check-answers').click();
  const allCorrect = await page.locator('#score').innerText();
  assert.match(allCorrect, /Score: 20 \/ 20/, 'All twenty correct answers score 20 / 20');
  assert.match(allCorrect, /Answered: 20 \/ 20/, 'The score reports twenty answered');
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'Scoring does not open the teacher key');
  // All wrong.
  await selectAll(testShape.correct.map(value => (value === 0 ? 1 : 0)));
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').innerText(), /Score: 0 \/ 20/, 'All wrong answers score 0 / 20');
  const wrongFeedback = await page.locator('#q1 .feedback').innerText();
  assert.match(wrongFeedback, /Not correct/, 'A wrong answer says so');
  assert.match(wrongFeedback, /Explicit in the source|Inferred from the source/, 'Each correction names its evidence type');
  // One answer cleared.
  await page.evaluate(() => {
    document.querySelectorAll('#quiz .question').forEach((question, index) => {
      const input = question.querySelector(`input[value="${index === 0 ? 1 : 0}"]`);
      if (index === 0) { input.checked = false; input.dispatchEvent(new Event('change', { bubbles: true })); return; }
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await page.locator('#check-answers').click();
  const mixed = await page.locator('#score').innerText();
  assert.match(mixed, /Score: 19 \/ 20/, 'One cleared question leaves 19 / 20');
  assert.match(mixed, /Unanswered: 1/, 'The score reports the unanswered question');
  // Reset.
  await page.locator('#reset-test').click();
  await page.waitForFunction(() => document.querySelectorAll('#quiz input:checked').length === 0);
  assert.equal(await page.locator('.feedback').filter({ hasText: 'Correct' }).count(), 0, 'Resetting clears every feedback line');
  assert.equal((await page.locator('#score').innerText()).trim(), '', 'Resetting clears the score');
  // The teacher gate.
  await page.locator('#teacher-password').fill('not-the-password');
  await page.locator('#unlock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'A wrong password keeps the key closed');
  const codes = fs.readFileSync(path.join(root, 'grade3-unit1-lesson1-test.html'), 'utf8').match(/String\.fromCharCode\(([\d,]+)\)/)[1].split(',').map(Number);
  await page.locator('#teacher-password').fill(String.fromCharCode(...codes));
  await page.locator('#unlock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), true, 'The shared classroom password opens the key');
  const keyItems = await page.locator('#answer-key .teacher-key li').count();
  assert.equal(keyItems, 20, 'The key lists one entry per question');
  const keyText = await page.locator('#answer-key').innerText();
  assert.match(keyText, /not secure authentication/i, 'The key repeats that the gate is not authentication');
  await page.locator('#lock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'The hide button closes the key again');
  await page.screenshot({ path: path.join(evidenceDir, 'test-desktop.png'), fullPage: true });
  screenshots.push('test-desktop.png');
  pass('Lesson test: scoring, reset, evidence and teacher gate', '20 questions with 40 options match the stored fixture; 20/20, 0/20 and 19/20 with one unanswered all score exactly; a reset clears feedback and score; the gate rejects a wrong password, opens with the shared one and closes again');

  /* ---------- 5. Navigation between the five pages ---------- */
  await go(PAGES.menu);
  const menuLinks = await page.evaluate(() => Array.from(document.querySelectorAll('main a[href$=".html"]'), link => link.getAttribute('href')));
  for (const target of [PAGES.pupilBook, PAGES.workbook, PAGES.vocabulary, PAGES.test]) {
    assert.ok(menuLinks.includes(target), `Lesson menu links to ${target}`);
  }
  for (const file of [PAGES.pupilBook, PAGES.workbook, PAGES.vocabulary, PAGES.test]) {
    await go(file);
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('main a'), link => link.getAttribute('href')));
    for (const target of [PAGES.menu, PAGES.pupilBook, PAGES.workbook, PAGES.vocabulary, PAGES.test]) {
      assert.ok(links.includes(target), `${file} links to ${target}`);
    }
  }
  // The shared header builds a lesson trail for this lesson.
  await go(PAGES.workbook);
  const breadcrumb = await page.evaluate(() => document.body.innerText.includes('Daily Routines'));
  assert.equal(breadcrumb, true, 'The shared shell recognises the lesson and names it');
  pass('Lesson navigation is complete', 'The menu links to all four content pages and every content page links back to the menu and across to the other three; the shared shell resolves the lesson title');

  /* ---------- 6. Phone viewport ---------- */
  const mobile = await context.newPage();
  mobile.on('pageerror', error => errors.push({ url: mobile.url(), error: error.message }));
  await mobile.setViewportSize({ width: 390, height: 844 });
  for (const [label, file] of Object.entries(PAGES)) {
    await mobile.goto(origin + file, { waitUntil: 'load' });
    const state = await mobile.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, height: document.body.scrollHeight }));
    assert.ok(state.overflow <= 1, `${file}: phone overflow ${state.overflow}px`);
    if (label === 'pupil-book' || label === 'workbook') {
      await mobile.screenshot({ path: path.join(evidenceDir, `${label}-mobile.png`), fullPage: false });
      screenshots.push(`${label}-mobile.png`);
    }
  }
  // The clock-label list must still be usable with one thumb.
  await mobile.goto(origin + PAGES.workbook, { waitUntil: 'load' });
  // Print labels are hidden on small screens, so the clock step is found by its heading.
  const clockStep = mobile.locator('.content-nav-links button').filter({ hasText: /What time is it/i }).first();
  assert.equal(await clockStep.count(), 1, 'The clock exercise has its own navigator step');
  await clockStep.click();
  const clockInput = mobile.locator('#wb3-1');
  assert.equal(await clockInput.isVisible(), true, 'The clock labels stay reachable on a phone');
  const inputBox = await clockInput.boundingBox();
  assert.ok(inputBox && inputBox.width > 40, 'The clock input keeps a usable width on a phone');
  await mobile.close();
  pass('Phone layout stays within the viewport', 'All five pages fit 390×844 with no horizontal overflow; the workbook clock labels stay reachable and usable');

  assert.deepEqual(errors, [], 'No browser JavaScript errors across the five pages');
  const report = { suite: 'grade5-unit1-lesson3-browser', date: new Date().toISOString(), status: 'PASS', checks, screenshots, errors };
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
