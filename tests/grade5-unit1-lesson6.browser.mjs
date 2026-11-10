/* Grade 5 · Unit 1 · Lesson 6 (Healthy Lifestyle): end-to-end checks for the five new pages.
   The spec answers every printed control on both book pages, reloads and navigates away and
   back to prove the answers survive, drives the eighteen-question test through scoring, reset
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
const evidenceDir = path.join(root, 'test-results', 'grade5-unit1-lesson6');
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
  menu: 'grade5-unit1-lesson6.html',
  pupilBook: 'grade5-unit1-lesson6-pupil-book.html',
  workbook: 'grade5-unit1-lesson6-workbook.html',
  vocabulary: 'grade5-unit1-lesson6-vocabulary.html',
  test: 'grade5-unit1-lesson6-test.html'
};
const LESSON_TITLE = 'Healthy Lifestyle';
const STORAGE_PREFIX = 'efc_lesson6_answers_v1';

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
  pass('Lesson 6 pages render in English, left to right, with no desktop overflow', 'All five pages: lang=en, dir=ltr, no horizontal overflow at 1366×900; Arabic appears only on the Vocabulary page inside lang="ar" cells');

  /* ---------- 2. Answer every printed control on the Pupil's Book page ---------- */
  await go(PAGES.pupilBook);
  const pbControls = await page.evaluate(() => ({
    radios: document.querySelectorAll('main input[type="radio"]').length,
    texts: document.querySelectorAll('main input[type="text"]').length,
    selects: document.querySelectorAll('main select').length,
    textareas: document.querySelectorAll('main textarea').length,
    numbers: document.querySelectorAll('main input[type="number"]').length,
    reveals: document.querySelectorAll('main button.reveal').length,
    statuses: Array.from(document.querySelectorAll('[data-status-for]'), el => el.textContent.trim())
  }));
  assert.equal(pbControls.radios, 26, "Pupil's Book: printed radio choices stay answerable");
  assert.equal(pbControls.texts, 10, "Pupil's Book: printed writing lines stay answerable");
  assert.equal(pbControls.selects, 4, "Pupil's Book: printed selections stay answerable");
  assert.equal(pbControls.textareas, 0, "Pupil's Book: printed writing boxes stay answerable");
  assert.equal(pbControls.numbers, 3, "Pupil's Book: printed numbering gaps stay answerable");
  assert.ok(pbControls.reveals >= 3, "Pupil's Book: a reveal per printed activity with a key");
  assert.ok(pbControls.statuses.every(text => /^0 of \d+/.test(text)), "Pupil's Book: every counter starts empty");
  const fillBookPage = () => page.evaluate(() => {
    const groups = new Map();
    document.querySelectorAll('main input[type="radio"]').forEach(input => {
      if (!groups.has(input.name)) groups.set(input.name, []);
      groups.get(input.name).push(input);
    });
    groups.forEach(inputs => {
      inputs[0].checked = true;
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main input[type="number"]').forEach((input, index) => {
      input.value = String(index + 1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main input[type="text"]').forEach((input, index) => {
      input.value = 'answer ' + (index + 1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main select').forEach(select => {
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('main textarea').forEach((area, index) => {
      area.value = 'written answer ' + (index + 1);
      area.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return {
      groups: groups.size,
      texts: document.querySelectorAll('main input[type="text"]').length,
      selects: document.querySelectorAll('main select').length,
      textareas: document.querySelectorAll('main textarea').length,
      numbers: document.querySelectorAll('main input[type="number"]').length
    };
  });
  const pbFilled = await fillBookPage();
  assert.ok(pbFilled.groups > 3, "Pupil's Book: answered every printed radio group");
  const pbCounters = await page.evaluate(() => Array.from(document.querySelectorAll('[data-status-for]'), el => el.textContent.trim()));
  assert.ok(pbCounters.every(text => !/^0 of/.test(text)), `Pupil's Book: every counter moves off zero, found ${JSON.stringify(pbCounters)}`);
  await page.reload({ waitUntil: 'load' });
  const pbAfterReload = await page.evaluate(() => ({
    checked: document.querySelectorAll('main input[type="radio"]:checked').length,
    texts: Array.from(document.querySelectorAll('main input[type="text"]')).filter(el => el.value.trim()).length,
    selects: Array.from(document.querySelectorAll('main select')).filter(el => el.selectedIndex > 0).length,
    textareas: Array.from(document.querySelectorAll('main textarea')).filter(el => el.value.trim()).length,
    numbers: Array.from(document.querySelectorAll('main input[type="number"]')).filter(el => el.value.trim()).length
  }));
  assert.equal(pbAfterReload.checked, pbFilled.groups, "Pupil's Book: every chosen option survives a reload");
  assert.equal(pbAfterReload.texts, pbFilled.texts, "Pupil's Book: every written answer survives a reload");
  assert.equal(pbAfterReload.selects, pbFilled.selects, "Pupil's Book: every chosen phrase survives a reload");
  assert.equal(pbAfterReload.textareas, pbFilled.textareas, "Pupil's Book: every writing box survives a reload");
  assert.equal(pbAfterReload.numbers, pbFilled.numbers, "Pupil's Book: every number survives a reload");
  await go(PAGES.workbook);
  await go(PAGES.pupilBook);
  const pbAfterNavigation = await page.evaluate(() => ({
    checked: document.querySelectorAll('main input[type="radio"]:checked').length,
    selects: Array.from(document.querySelectorAll('main select')).filter(el => el.selectedIndex > 0).length
  }));
  assert.equal(pbAfterNavigation.checked, pbFilled.groups, "Pupil's Book: choices survive navigation to another page and back");
  assert.equal(pbAfterNavigation.selects, pbFilled.selects, "Pupil's Book: selections survive navigation to another page and back");
  // Every reveal opens its panel and reports its state.
  // Reveals live inside their printed step, so walk the navigator and open each step's key.
  const stepButtons = page.locator('.content-nav-links button');
  const stepCount = await stepButtons.count();
  const revealProblems = [];
  let openedReveals = 0;
  for (let index = 0; index < stepCount; index++) {
    await stepButtons.nth(index).click();
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('main button.reveal'))
      .filter(el => el.offsetParent !== null)
      .map(el => el.getAttribute('aria-controls')));
    for (const id of ids) {
      const button = page.locator(`main button.reveal[aria-controls="${id}"]`);
      await button.click();
      if (!(await page.locator('#' + id).isVisible())) revealProblems.push(`${id} panel closed`);
      if ((await button.getAttribute('aria-expanded')) !== 'true') revealProblems.push(`${id} aria-expanded`);
      openedReveals += 1;
    }
  }
  assert.deepEqual(revealProblems, [], 'Every reveal opens its panel and reports aria-expanded=true');
  assert.equal(openedReveals, 3, 'Every printed reveal is reachable through its printed step');
  await page.screenshot({ path: path.join(evidenceDir, 'pupil-book-desktop.png'), fullPage: true });
  screenshots.push('pupil-book-desktop.png');
  pass('Pupil’s Book: every printed item is answerable and the answers persist', `${pbControls.radios} radio choices, ${pbControls.selects} selections and ${pbControls.textareas} writing boxes are answerable; every counter moves off zero; answers survive a reload and a round trip to the Workbook page; all ${openedReveals} reveal panels open after walking the printed steps`);

  /* ---------- 3. The Workbook page ---------- */
  await go(PAGES.workbook);
  const wbControls = await page.evaluate(() => ({
    radios: document.querySelectorAll('main input[type="radio"]').length,
    selects: document.querySelectorAll('main select').length,
    textareas: document.querySelectorAll('main textarea').length,
    notices: Array.from(document.querySelectorAll('main .notice'), el => el.textContent.trim()),
    audio: document.querySelectorAll('main audio').length
  }));
  assert.equal(wbControls.radios, 15, 'Workbook: printed radio choices stay answerable');
  assert.equal(wbControls.selects, 9, 'Workbook: printed selections stay answerable');
  assert.equal(wbControls.textareas, 1, 'Workbook: printed writing boxes stay answerable');
  assert.equal(wbControls.audio, 0, 'Workbook invents no audio element');
  assert.ok(wbControls.notices.some(text => /Audio required; the recording was not supplied/.test(text)), 'Workbook states that the recordings were not supplied');
  const wbFilled = await fillBookPage();
  await page.reload({ waitUntil: 'load' });
  const wbAfterReload = await page.evaluate(() => ({
    checked: document.querySelectorAll('main input[type="radio"]:checked').length,
    selects: Array.from(document.querySelectorAll('main select')).filter(el => el.selectedIndex > 0).length,
    textareas: Array.from(document.querySelectorAll('main textarea')).filter(el => el.value.trim()).length
  }));
  assert.equal(wbAfterReload.checked, wbFilled.groups, 'Workbook: choices survive a reload');
  assert.equal(wbAfterReload.selects, wbFilled.selects, 'Workbook: selections survive a reload');
  assert.equal(wbAfterReload.textareas, wbFilled.textareas, 'Workbook: writing boxes survive a reload');
  await page.screenshot({ path: path.join(evidenceDir, 'workbook-desktop.png'), fullPage: true });
  screenshots.push('workbook-desktop.png');
  pass('Workbook: every exercise is answerable and the missing recordings are disclosed', `Workbook keeps ${wbControls.radios} radio choices, ${wbControls.selects} selections and ${wbControls.textareas} writing boxes; listening exercises state that no recording was supplied and invent no audio; every answer survives a reload`);

  /* ---------- 4. The eighteen-question independent lesson test ---------- */
  await go(PAGES.test);
  const fixtureSpec = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'grade5-unit1-lesson6.quiz.json'), 'utf8'));
  const fixture = fixtureSpec.questions;
  const testShape = await page.evaluate(() => ({
    questions: document.querySelectorAll('#quiz .question').length,
    images: document.querySelectorAll('#quiz img, main img').length,
    stepButtons: document.querySelectorAll('.content-nav-links button').length,
    items: Array.from(document.querySelectorAll('#quiz .question'), question => ({
      id: question.id,
      format: question.dataset.format,
      objective: question.dataset.objective,
      objectiveLabel: question.dataset.objectiveLabel,
      correct: question.dataset.correct
    }))
  }));
  assert.equal(testShape.questions, 18, 'The independent lesson test has eighteen questions');
  assert.equal(testShape.images, 0, 'The lesson test uses zero textbook images or crops');
  assert.equal(testShape.stepButtons, 18, 'The shared step navigator exposes 18 question buttons');
  assert.equal(fixture.length, testShape.questions, 'The stored fixture covers all 18 questions');
  fixture.forEach((question, index) => {
    const rendered = testShape.items[index];
    assert.equal(rendered.id, question.id, `Question ${index + 1}: id matches fixture`);
    assert.equal(rendered.format, question.format, `${question.id}: format matches fixture`);
    assert.equal(rendered.objective, question.objective, `${question.id}: objective matches fixture`);
    assert.equal(rendered.correct, String(question.correct), `${question.id}: answer key matches fixture`);
  });
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'The teacher key starts hidden');

  const fillTestAnswers = async answerMap => {
    await page.evaluate(answers => {
      document.querySelectorAll('#quiz .question').forEach(question => {
        const id = question.id;
        const value = Object.prototype.hasOwnProperty.call(answers, id) ? answers[id] : null;
        if (question.dataset.format === 'short-answer') {
          const input = question.querySelector('input[type="text"]');
          input.value = value === null ? '' : String(value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        question.querySelectorAll('input[type="radio"]').forEach(radio => { radio.checked = false; });
        if (value !== null) {
          const target = question.querySelector(`input[type="radio"][value="${value}"]`);
          if (!target) throw new Error(`Missing radio ${id}=${value}`);
          target.checked = true;
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }, answerMap);
  };
  const written = fixture.filter(q => q.format === 'short-answer');
  const correctAnswerMap = Object.fromEntries(fixture.map(q => [q.id, q.format === 'short-answer' ? q.correct : String(q.correct)]));
  const wrongAnswerMap = Object.fromEntries(fixture.map(q => {
    if (q.format === 'short-answer') return [q.id, q.wrongSample];
    return [q.id, String((Number(q.correct) + 1) % q.options.length)];
  }));

  // Draft persistence across a reload and a cross-page trip.
  const draft = Object.fromEntries([fixture[0], written[0]].map(q => [q.id, q.format === 'short-answer' ? q.correct : String(q.correct)]));
  await fillTestAnswers(draft);
  await page.reload({ waitUntil: 'load' });
  await go(PAGES.menu);
  await go(PAGES.test);
  const restoredDraft = await page.evaluate(({ firstRadio, firstWritten }) => ({
    radio: document.querySelector(`#quiz input[name="${firstRadio}"]:checked`)?.value || null,
    written: document.querySelector(`#quiz input[name="${firstWritten}"]`)?.value || '',
    answeredSteps: document.querySelectorAll('.content-nav-links button.is-answered').length
  }), { firstRadio: fixture[0].id, firstWritten: written[0].id });
  assert.equal(restoredDraft.radio, draft[fixture[0].id], 'An in-progress radio answer survives reload and navigation');
  assert.equal(restoredDraft.written, draft[written[0].id], 'An in-progress written answer survives reload and navigation');
  assert.equal(restoredDraft.answeredSteps, 2, 'The step navigator badges both answered questions');

  // All correct, including case and whitespace tolerance on the written items.
  await fillTestAnswers(correctAnswerMap);
  await page.locator('#check-answers').click();
  const allCorrect = await page.locator('#score').innerText();
  assert.match(allCorrect, /Score: 18 \/ 18/, 'All eighteen correct answers score 18 / 18');
  assert.match(allCorrect, /Answered: 18 \/ 18/, 'The score reports eighteen answered');
  assert.match(allCorrect, /Unanswered: 0\./, 'The score reports zero unanswered');
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'Scoring does not open the teacher key');
  await page.reload({ waitUntil: 'load' });
  assert.match(await page.locator('#score').innerText(), /Score: 18 \/ 18/, 'Scored state survives a reload');
  assert.equal(await page.locator('.feedback.correct').count(), 18, 'All 18 feedback lines stay restored after reload');

  // All wrong.
  await fillTestAnswers(wrongAnswerMap);
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').innerText(), /Score: 0 \/ 18/, 'All wrong answers score 0 / 18');
  const wrongFeedback = await page.locator(`#${fixture[0].id} .feedback`).innerText();
  assert.match(wrongFeedback, /Not correct/, 'A wrong answer says so');
  assert.match(wrongFeedback, /Lesson objective:/, 'Feedback names the lesson objective');
  const writtenCanonical = written[0].correct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(await page.locator(`#${written[0].id} .feedback`).innerText(), new RegExp(writtenCanonical.replace(/\s+/g, '\\s+'), 'i'), 'A wrong written answer shows the canonical sentence');

  // Partial: one cleared radio plus one whitespace-only written item.
  await fillTestAnswers({ ...correctAnswerMap, [fixture[0].id]: null, [written[0].id]: '   ' });
  await page.locator('#check-answers').click();
  const mixed = await page.locator('#score').innerText();
  assert.match(mixed, /Score: 16 \/ 18/, 'Clearing one radio and one written item scores 16 / 18');
  assert.match(mixed, /Answered: 16 \/ 18/, 'Answered count excludes whitespace-only written input');
  assert.match(mixed, /Unanswered: 2\./, 'The score reports two unanswered questions');

  // Reset clears DOM, feedback, score, badges and localStorage.
  await page.locator('#reset-test').click();
  // Wait for the whole reset state, not just the cleared inputs: the shared step navigator
  // must also have dropped every answered badge.
  await page.waitForFunction(() =>
    document.querySelectorAll('#quiz input:checked').length === 0 &&
    Array.from(document.querySelectorAll('#quiz input[type="text"]')).every(input => input.value === '') &&
    document.querySelectorAll('.content-nav-links button.is-answered').length === 0);
  const resetState = await page.evaluate(prefix => ({
    checked: document.querySelectorAll('#quiz input:checked').length,
    written: Array.from(document.querySelectorAll('#quiz input[type="text"]')).every(input => input.value === ''),
    answeredSteps: document.querySelectorAll('.content-nav-links button.is-answered').length,
    stored: window.localStorage.getItem(prefix + ':test')
  }), STORAGE_PREFIX);
  assert.deepEqual(resetState, { checked: 0, written: true, answeredSteps: 0, stored: null }, 'Reset clears choices, written inputs, badges and saved state');
  assert.equal(await page.locator('.feedback').filter({ hasText: /Correct|Not correct|No answer/ }).count(), 0, 'Resetting clears every feedback line');
  assert.equal((await page.locator('#score').innerText()).trim(), '', 'Resetting clears the score');
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'Resetting keeps the teacher key closed');

  // Retry after reset scores cleanly, then reset again.
  await fillTestAnswers(correctAnswerMap);
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').innerText(), /Score: 18 \/ 18/, 'Retrying after reset scores 18 / 18 cleanly');
  await page.locator('#reset-test').click();

  // Teacher gate and the 18-item key.
  await page.locator('#teacher-password').fill('not-the-password');
  await page.locator('#unlock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'A wrong password keeps the key closed');
  const codes = fs.readFileSync(path.join(root, 'grade3-unit1-lesson1-test.html'), 'utf8').match(/String\.fromCharCode\(([\d,]+)\)/)[1].split(',').map(Number);
  await page.locator('#teacher-password').fill(String.fromCharCode(...codes));
  await page.locator('#unlock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), true, 'The shared classroom password opens the key');
  assert.equal(await page.locator('#answer-key .teacher-key li').count(), 18, 'The key lists one entry per independent question');
  const keyText = await page.locator('#answer-key').innerText();
  assert.match(keyText, /not secure authentication/i, 'The key repeats that the gate is not authentication');
  assert.ok(keyText.includes(written[0].correct.split(' ').slice(0, 3).join(' ')), 'The key includes a written model answer');
  await page.locator('#lock-key').click();
  assert.equal(await page.locator('#answer-key').isVisible(), false, 'The hide button closes the key again');
  await page.screenshot({ path: path.join(evidenceDir, 'test-desktop.png'), fullPage: true });
  screenshots.push('test-desktop.png');
  pass('Lesson test: independence, persistence, scoring, retry and teacher gate', '18 independent questions match the stored fixture; answers and score persist across reload and cross-page navigation; 18/18, 0/18 and 16/18 score accurately; reset wipes DOM and storage for a clean retry; the teacher gate verifies all 18 key entries');

  /* ---------- 5. Navigation between the five pages ---------- */
  await go(PAGES.menu);
  const menuLinks = await page.evaluate(() => Array.from(document.querySelectorAll('main a[href$=".html"]'), link => link.getAttribute('href')));
  for (const target of [PAGES.pupilBook, PAGES.workbook, PAGES.vocabulary, PAGES.test]) {
    assert.ok(menuLinks.includes(target), `Lesson menu links to ${target}`);
  }
  for (const file of [PAGES.pupilBook, PAGES.workbook, PAGES.vocabulary, PAGES.test]) {
    await go(file);
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('main a'), link => link.getAttribute('href')));
    for (const target of Object.values(PAGES)) assert.ok(links.includes(target), `${file} links to ${target}`);
  }
  await go(PAGES.workbook);
  assert.equal(await page.evaluate(title => document.body.innerText.includes(title), LESSON_TITLE), true, 'The shared shell recognises the lesson and names it');
  pass('Lesson navigation is complete', 'The menu links to all four content pages and every content page links back to the menu and across to the other three; the shared shell resolves the lesson title');

  /* ---------- 6. Phone viewport ---------- */
  const mobile = await context.newPage();
  mobile.on('pageerror', error => errors.push({ url: mobile.url(), error: error.message }));
  await mobile.setViewportSize({ width: 390, height: 844 });
  for (const [label, file] of Object.entries(PAGES)) {
    await mobile.goto(origin + file, { waitUntil: 'load' });
    const state = await mobile.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth }));
    assert.ok(state.overflow <= 1, `${file}: phone overflow ${state.overflow}px`);
    if (label === 'pupil-book' || label === 'workbook' || label === 'test') {
      await mobile.screenshot({ path: path.join(evidenceDir, `${label}-mobile.png`), fullPage: false });
      screenshots.push(`${label}-mobile.png`);
    }
  }
  await mobile.setViewportSize({ width: 320, height: 740 });
  await mobile.goto(origin + PAGES.test, { waitUntil: 'load' });
  for (const stepIndex of [0, 5, 12, 17]) {
    await mobile.locator('.content-nav-links button').nth(stepIndex).click();
    const overflow320 = await mobile.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow320 <= 1, `test step ${stepIndex + 1} at 320px: overflow ${overflow320}px`);
  }
  await mobile.close();
  pass('Phone layout stays within the viewport', 'All five pages fit 390×844 and four test steps fit 320×740 with no horizontal overflow');

  assert.deepEqual(errors, [], 'No browser JavaScript errors across the five pages');
  const report = { suite: 'grade5-unit1-lesson6-browser', date: new Date().toISOString(), status: 'PASS', checks, screenshots, errors };
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
