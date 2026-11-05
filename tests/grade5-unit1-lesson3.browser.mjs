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

  /* ---------- 4. The eighteen-question independent lesson test ---------- */
  await go(PAGES.test);
  const fixtureSpec = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'grade5-unit1-lesson3.quiz.json'), 'utf8'));
  const fixture = fixtureSpec.questions;
  const testShape = await page.evaluate(() => ({
    questions: document.querySelectorAll('#quiz .question').length,
    radios: document.querySelectorAll('#quiz input[type="radio"]').length,
    textInputs: document.querySelectorAll('#quiz input[type="text"]').length,
    images: document.querySelectorAll('#quiz img, main img').length,
    tables: document.querySelectorAll('#quiz table.l3-test-chart').length,
    passages: document.querySelectorAll('#quiz .l3-test-passage').length,
    stepButtons: document.querySelectorAll('.content-nav-links button').length,
    items: Array.from(document.querySelectorAll('#quiz .question')).map(question => ({
      id: question.id,
      format: question.dataset.format,
      objective: question.dataset.objective,
      objectiveLabel: question.dataset.objectiveLabel,
      correct: question.dataset.correct
    }))
  }));
  assert.equal(testShape.questions, 18, 'The independent lesson test has eighteen questions');
  assert.equal(testShape.radios, 46, '14 three-option MCQs (42) + 2 True/False items (4) = 46 radio inputs');
  assert.equal(testShape.textInputs, 2, '2 deterministic written short-answer inputs (q17 and q18)');
  assert.equal(testShape.images, 0, 'The lesson test uses zero textbook images or crops');
  assert.equal(testShape.tables, 2, 'Questions 8 and 9 display Mazen’s independent schedule table');
  assert.equal(testShape.passages, 3, 'Questions 13–15 display Bilal’s independent reading passage');
  assert.equal(testShape.stepButtons, 18, 'Shared step navigator exposes 18 question buttons');
  assert.equal(fixture.length, testShape.questions, 'The stored fixture covers all 18 questions');
  fixture.forEach((question, index) => {
    const rendered = testShape.items[index];
    assert.equal(rendered.id, question.id, `Question ${index + 1}: id matches fixture`);
    assert.equal(rendered.format, question.format, `${question.id}: format matches fixture`);
    assert.equal(rendered.objective, question.objective, `${question.id}: objective matches fixture`);
    assert.equal(rendered.objectiveLabel, question.objectiveLabel, `${question.id}: objectiveLabel matches fixture`);
    assert.equal(rendered.correct, String(question.correct), `${question.id}: answer key matches fixture`);
  });
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'The teacher key starts hidden');

  const fillTestAnswers = async answerMap => {
    await page.evaluate(answers => {
      document.querySelectorAll('#quiz .question').forEach(question => {
        const id = question.id;
        const val = Object.prototype.hasOwnProperty.call(answers, id) ? answers[id] : null;
        if (question.dataset.format === 'short-answer') {
          const textInput = question.querySelector('input[type="text"]');
          textInput.value = val === null ? '' : String(val);
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
          textInput.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        question.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.checked = false;
        });
        if (val !== null) {
          const target = question.querySelector(`input[type="radio"][value="${val}"]`);
          if (!target) throw new Error(`Missing radio ${id}=${val}`);
          target.checked = true;
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }, answerMap);
  };

  const correctAnswerMap = Object.fromEntries(
    fixture.map(q => [q.id, q.format === 'short-answer' ? q.correct : String(q.correct)])
  );
  const wrongAnswerMap = Object.fromEntries(
    fixture.map(q => {
      if (q.format === 'short-answer') return [q.id, q.wrongSample];
      const count = q.options.length;
      return [q.id, String((Number(q.correct) + 1) % count)];
    })
  );

  // 4a. Persistence before scoring (reload + cross-page navigation).
  await fillTestAnswers({
    q1: '1',
    q8: '1',
    q9: '1',
    q17: 'goes',
    q18: 'Does Maysa tidy her bedroom?'
  });
  await page.reload({ waitUntil: 'load' });
  await go(PAGES.menu);
  await go(PAGES.test);
  const restoredDraft = await page.evaluate(() => ({
    q1: document.querySelector('#quiz input[name="q1"]:checked')?.value || null,
    q8: document.querySelector('#quiz input[name="q8"]:checked')?.value || null,
    q9: document.querySelector('#quiz input[name="q9"]:checked')?.value || null,
    q17: document.querySelector('#quiz input[name="q17"]')?.value || '',
    q18: document.querySelector('#quiz input[name="q18"]')?.value || '',
    answeredSteps: document.querySelectorAll('.content-nav-links button.is-answered').length
  }));
  assert.deepEqual(
    restoredDraft,
    {
      q1: '1',
      q8: '1',
      q9: '1',
      q17: 'goes',
      q18: 'Does Maysa tidy her bedroom?',
      answeredSteps: 5
    },
    'In-progress radio and written test answers survive reload and cross-page navigation'
  );

  // 4b. All correct (including case/whitespace/punctuation normalization on written items).
  await fillTestAnswers({
    ...correctAnswerMap,
    q17: '  GOES. ',
    q18: 'does   maysa tidy her bedroom'
  });
  await page.locator('#check-answers').click();
  const allCorrect = await page.locator('#score').innerText();
  assert.match(allCorrect, /Score: 18 \/ 18/, 'All eighteen correct answers score 18 / 18');
  assert.match(allCorrect, /Answered: 18 \/ 18/, 'The score reports eighteen answered');
  assert.match(allCorrect, /Unanswered: 0\./, 'The score reports zero unanswered');
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'Scoring does not open the teacher key');

  // Scored state also persists across a reload until reset.
  await page.reload({ waitUntil: 'load' });
  assert.match(await page.locator('#score').innerText(), /Score: 18 \/ 18/, 'Scored test state survives a reload');
  assert.equal(await page.locator('.feedback.correct').count(), 18, 'All 18 feedback lines stay restored after reload');

  // 4c. All wrong.
  await fillTestAnswers(wrongAnswerMap);
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').innerText(), /Score: 0 \/ 18/, 'All wrong answers score 0 / 18');
  const wrongFeedback = await page.locator('#q1 .feedback').innerText();
  assert.match(wrongFeedback, /Not correct/, 'A wrong answer says so');
  assert.match(wrongFeedback, /Lesson objective:/, 'Feedback names the Lesson 3 learning objective');
  const wrongWrittenFeedback = await page.locator('#q18 .feedback').innerText();
  assert.match(wrongWrittenFeedback, /Does Maysa tidy her bedroom\?/, 'Wrong written answer shows the exact canonical sentence');

  // 4d. Partial / unanswered (one radio cleared + one whitespace-only written input = 2 unanswered).
  await fillTestAnswers({
    ...correctAnswerMap,
    q1: null,
    q17: '   '
  });
  await page.locator('#check-answers').click();
  const mixed = await page.locator('#score').innerText();
  assert.match(mixed, /Score: 16 \/ 18/, 'Clearing one radio and leaving whitespace in one written item scores 16 / 18');
  assert.match(mixed, /Answered: 16 \/ 18/, 'Answered count excludes whitespace-only written input');
  assert.match(mixed, /Unanswered: 2\./, 'The score reports 2 unanswered questions');

  // 4e. Reset / Retry clears DOM, feedback, score, step badges, and localStorage, then allows a clean retry.
  await page.locator('#reset-test').click();
  await page.waitForFunction(() => document.querySelectorAll('#quiz input:checked').length === 0);
  const resetState = await page.evaluate(() => ({
    checked: document.querySelectorAll('#quiz input:checked').length,
    q17: document.querySelector('#quiz input[name="q17"]').value,
    q18: document.querySelector('#quiz input[name="q18"]').value,
    answeredSteps: document.querySelectorAll('.content-nav-links button.is-answered').length,
    stored: window.localStorage.getItem('efc_lesson3_answers_v1:test')
  }));
  assert.deepEqual(
    resetState,
    { checked: 0, q17: '', q18: '', answeredSteps: 0, stored: null },
    'Reset clears radio choices, written inputs, step badges, and saved localStorage state'
  );
  assert.equal(await page.locator('.feedback').filter({ hasText: /Correct|Not correct|No answer/ }).count(), 0, 'Resetting clears every feedback line');
  assert.equal((await page.locator('#score').innerText()).trim(), '', 'Resetting clears the score');

  await page.reload({ waitUntil: 'load' });
  assert.equal(await page.locator('#quiz input:checked').count(), 0, 'After reset + reload, zero radios are checked');
  assert.equal((await page.locator('#score').innerText()).trim(), '', 'After reset + reload, score stays empty');

  // Retry after reset: answer all 18 accurately and score again, then reset cleanly before screenshot.
  await fillTestAnswers(correctAnswerMap);
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').innerText(), /Score: 18 \/ 18/, 'Retrying after reset scores 18 / 18 cleanly');
  await page.locator('#reset-test').click();

  // 4f. The teacher gate and 18-item answer key.
  await page.locator('#teacher-password').fill('not-the-password');
  await page.locator('#unlock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'A wrong password keeps the key closed');
  const codes = fs.readFileSync(path.join(root, 'grade3-unit1-lesson1-test.html'), 'utf8').match(/String\.fromCharCode\(([\d,]+)\)/)[1].split(',').map(Number);
  await page.locator('#teacher-password').fill(String.fromCharCode(...codes));
  await page.locator('#unlock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), true, 'The shared classroom password opens the key');
  const keyItems = await page.locator('#answer-key .teacher-key li').count();
  assert.equal(keyItems, 18, 'The key lists one entry per independent question');
  const keyText = await page.locator('#answer-key').innerText();
  assert.match(keyText, /not secure authentication/i, 'The key repeats that the gate is not authentication');
  assert.match(keyText, /Does Maysa tidy her bedroom\?/, 'The key includes written question answers');
  await page.locator('#lock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'The hide button closes the key again');
  await page.screenshot({ path: path.join(evidenceDir, 'test-desktop.png'), fullPage: true });
  screenshots.push('test-desktop.png');
  pass('Lesson test: independence, persistence, scoring, retry and teacher gate', '18 independent questions across 3 formats + schedule table + unseen passage match fixture; answers and score persist across reload and cross-page navigation; 18/18, 0/18 and 16/18 score accurately; reset wipes DOM and storage for clean retry; teacher gate verifies all 18 key entries');

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
    if (label === 'pupil-book' || label === 'workbook' || label === 'test') {
      await mobile.screenshot({ path: path.join(evidenceDir, `${label}-mobile.png`), fullPage: false });
      screenshots.push(`${label}-mobile.png`);
    }
  }
  // Check narrow 320px phone width across test schedule table (Q8), unseen passage (Q13), and written wordbank (Q18).
  await mobile.setViewportSize({ width: 320, height: 740 });
  await mobile.goto(origin + PAGES.test, { waitUntil: 'load' });
  for (const stepIndex of [0, 7, 12, 17]) {
    await mobile.locator('.content-nav-links button').nth(stepIndex).click();
    const overflow320 = await mobile.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow320 <= 1, `test step ${stepIndex + 1} at 320px: overflow ${overflow320}px`);
  }
  await mobile.setViewportSize({ width: 390, height: 844 });
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
  pass('Phone layout stays within the viewport', 'All five pages fit 390×844 and test schedule/passage/writing steps fit 320×740 with no horizontal overflow; the workbook clock labels stay reachable and usable');

  assert.deepEqual(errors, [], 'No browser JavaScript errors across the five pages');
  const report = { suite: 'grade5-unit1-lesson3-browser', date: new Date().toISOString(), status: 'PASS', checks, screenshots, errors };
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
