import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'test-results', 'grade3-unit1-lesson3');
fs.mkdirSync(evidence, { recursive: true });
const base = 'grade3-unit1-lesson3';
const prefix = '/E_Curriculum_1_9/';
const content = JSON.parse(fs.readFileSync(path.join(root, `tests/${base}.content.json`), 'utf8'));
const quizSpec = JSON.parse(fs.readFileSync(path.join(root, `tests/${base}.quiz.json`), 'utf8'));
const checks = [];
const errors = [];
const pass = (name, detail = '') => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ url: page.url(), console: message.text() }); });
  page.on('response', response => { if (response.status() >= 400) errors.push({ url: response.url(), status: response.status() }); });
  const go = async file => {
    const response = await page.goto(origin + file, { waitUntil: 'networkidle' });
    // Same-document fragment navigation (the teacher deep link) has no HTTP response.
    if (response) assert.equal(response.status(), 200, file);
    else assert.ok(new URL(page.url()).hash, `${file}: navigation without a response must be a fragment jump`);
    await page.evaluate(() => document.fonts.ready);
  };
  const clickStep = index => page.locator('.content-nav-links button').nth(index).click();
  const noOverflow = async label => {
    const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(size.document <= size.viewport + 1 && size.body <= size.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(size)}`);
  };
  const sourceText = () => page.evaluate(() => {
    const clean = value => value.replace(/\s+/g, ' ').trim();
    return Object.fromEntries(Array.from(document.querySelectorAll('[data-source-id]')).map(el => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('label, .sr-only').forEach(node => node.remove());
      clone.querySelectorAll('input').forEach(input => input.replaceWith(document.createTextNode('…')));
      // textContent does not imply whitespace at element boundaries; preserve the
      // visual separation of sentences, list lines, word-bank chips and phonics words.
      clone.querySelectorAll('p,li,div,span,figcaption,h3').forEach(node => node.appendChild(document.createTextNode(' ')));
      return [el.dataset.sourceId, clean(clone.textContent)];
    }));
  });
  const imageHealth = async label => {
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(el => { el.open = true; });
    await page.locator('img').evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
    const broken = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src));
    assert.deepEqual(broken, [], `${label}: broken images`);
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(el => { el.open = false; });
  };
  const resetForm = async id => { await page.locator(`#${id} button[type="reset"]`).click(); await page.waitForTimeout(30); };
  const storage = key => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), key);
  const practiceKey = section => `efc_grade3_unit1_lesson3_practice_v1:${section}`;
  const testKey = 'efc_grade3_unit1_lesson3_test_v1';

  await go('lessons.html?grade=3');
  assert.equal(await page.locator('#lesson-list a.lesson').count(), 5);
  for (const lesson of [1, 2, 3, 4, 5]) assert.equal(await page.locator(`#lesson-list a[href="${base.replace('lesson3', 'lesson' + lesson)}.html"]`).count(), 1);
  await page.locator(`#lesson-list a[href="${base}.html"]`).click();
  await page.waitForURL(`**/${base}.html`);
  assert.equal(await page.locator('.cards .card').count(), 4);
  assert.match(await page.locator('nav[aria-label="Published lesson sequence"]').textContent(), /Previous lesson · School Subjects/);
  assert.match(await page.locator('nav[aria-label="Published lesson sequence"]').textContent(), /Next lesson · My Five Senses/);
  await noOverflow('lesson menu');
  pass('Rendered Grade 3 listing and menu', 'Five Grade 3 lessons, four section cards, and honest previous/next links in the published sequence');

  const pages = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'].map(suffix => `${base}${suffix}.html`);
  for (const file of pages) {
    await go(file);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
    assert.equal(await page.locator('.section-links a[aria-current="page"]').count(), 1);
    assert.equal(await page.locator('.section-links a').count(), 5);
    const directionIssues = await page.evaluate(() => Array.from(document.querySelectorAll('*')).filter(el => {
      const dir = getComputedStyle(el).direction;
      return dir !== 'ltr' && !(dir === 'rtl' && el.closest('.ar[lang="ar"][dir="rtl"]'));
    }).map(el => el.tagName + '.' + el.className));
    assert.deepEqual(directionIssues, [], `${file}: unexpected RTL`);
    await imageHealth(file);
    await noOverflow(file);
  }
  pass('All five pages load with healthy assets and direction', 'English/LTR UI, five section links, one current section, all images decode and no horizontal overflow at 1440px');

  for (const section of ['pupil-book', 'workbook']) {
    await go(`${base}-${section}.html`);
    const rendered = await sourceText();
    const expected = Object.fromEntries(Object.entries(content.printed).filter(([id]) => id.startsWith(section === 'pupil-book' ? 'pb' : 'wb')));
    assert.deepEqual(rendered, expected, `${section}: exact rendered source transcription and blank/example structure`);
    for (const [id, instruction] of Object.entries(content.instructions)) {
      if (!id.startsWith(section === 'pupil-book' ? 'pb' : 'wb')) continue;
      assert.equal((await page.locator(`#${id} h2`).textContent()).replace(/\s+/g, ' ').trim(), instruction, `${id}: printed instruction`);
    }
  }
  pass('Rendered textbook fidelity', 'All 32 source blocks and 12 instructions match the reviewed inventory, including blanks, printed examples, punctuation and the unusual song line');

  await go(`${base}-vocabulary.html`);
  const vocabulary = await page.locator('.vocabulary-table tbody tr').evaluateAll(rows => rows.map(row => ({ english: row.cells[0].textContent, arabic: row.cells[1].textContent, dir: getComputedStyle(row.cells[1]).direction, lang: row.cells[1].lang })));
  assert.equal(vocabulary.length, content.vocabulary.length);
  vocabulary.forEach((row, i) => {
    assert.equal(row.english, content.vocabulary[i].english);
    assert.equal(row.arabic, content.vocabulary[i].arabic);
    assert.equal(row.dir, 'rtl'); assert.equal(row.lang, 'ar');
  });
  pass('Vocabulary rendering', `${vocabulary.length} reviewed English/Arabic pairs; meanings render RTL and all other content remains LTR`);

  // Pupil's Book matching: wrong feedback does not open the key; correct answers persist.
  await go(`${base}-pupil-book.html`);
  await clickStep(3);
  for (const [n, value] of [[1, 'a'], [2, 'c'], [3, 'b']]) await page.locator(`#pb-match-${n}`).selectOption(value);
  await page.locator('#pb-match .check-practice').click();
  assert.match(await page.locator('#pb-match .practice-feedback').textContent(), /0 of 3/);
  assert.equal(await page.locator('#pb-match-key').isVisible(), false);
  await page.locator('#pb-match .reveal').click();
  assert.equal(await page.locator('#pb-match-key').isVisible(), true);
  assert.match(await page.locator('#pb-match-key').textContent(), /1 → c; 2 → b; 3 → a/);
  await page.locator('#pb-match .reveal').click();
  for (const [n, value] of [[1, 'c'], [2, 'b'], [3, 'a']]) await page.locator(`#pb-match-${n}`).selectOption(value);
  await page.locator('#pb-match .check-practice').click();
  assert.match(await page.locator('#pb-match .practice-feedback').textContent(), /All 3/);
  await page.reload({ waitUntil: 'networkidle' }); await clickStep(3);
  assert.deepEqual(await page.locator('#pb-match select').evaluateAll(els => els.map(el => el.value)), ['c', 'b', 'a']);
  await resetForm('pb-match');
  assert.deepEqual(await page.locator('#pb-match select').evaluateAll(els => els.map(el => el.value)), ['', '', '']);
  assert.equal(await page.locator('#pb-match-key').isVisible(), false);
  pass('Pupil’s Book matching interaction', 'Wrong/correct checking, explicit answer guidance, reload persistence and reset all work');

  // Workbook 1: five blanks.
  await go(`${base}-workbook.html`);
  await page.locator('#wb1-1a').fill('wrong');
  await page.locator('#wb-words .check-practice').click();
  assert.match(await page.locator('#wb-words .practice-feedback').textContent(), /0 of 5/);
  assert.equal(await page.locator('#wb-words-key').isVisible(), false);
  for (const [id, value] of Object.entries({ 'wb1-1a': 'read', 'wb1-1b': 'library', 'wb1-2a': 'laboratory', 'wb1-3a': 'draw', 'wb1-3b': 'art room' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-words .check-practice').click();
  assert.match(await page.locator('#wb-words .practice-feedback').textContent(), /All 5/);
  await resetForm('wb-words');
  assert.deepEqual(await page.locator('#wb-words input').evaluateAll(els => els.map(el => el.value)), ['', '', '', '', '']);

  // Workbook 2: audio-dependent, deliberately unscored.
  await clickStep(1);
  assert.equal(await page.locator('#wb-listen .check-practice').count(), 0);
  assert.equal(await page.locator('#wb-listen .answer').count(), 0);
  const listenIds = ['top-left', 'top-right', 'middle-left', 'middle-centre', 'middle-right', 'bottom'];
  for (let i = 0; i < listenIds.length; i++) await page.locator(`#wb2-${listenIds[i]}`).fill(String(i + 1));
  assert.match(await page.locator('#wb-listen .practice-feedback').textContent(), /unavailable audio/);
  await page.reload({ waitUntil: 'networkidle' }); await clickStep(1);
  assert.deepEqual(await page.locator('#wb-listen input').evaluateAll(els => els.map(el => el.value)), ['1', '2', '3', '4', '5', '6']);
  await resetForm('wb-listen');

  // Workbook 3: three blanks plus the printed example.
  await clickStep(2);
  assert.equal(await page.locator('[data-source-id="wb3-1"] .given-answer').textContent(), 'gym');
  for (const [id, value] of Object.entries({ 'wb3-blank-2': 'to the left of', 'wb3-blank-3': 'classroom', 'wb3-blank-4': '12' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-look .check-practice').click();
  assert.match(await page.locator('#wb-look .practice-feedback').textContent(), /All 3/);
  await resetForm('wb-look');

  // Workbook 4: personal writing plus a real pointer/keyboard drawing surface.
  await clickStep(3);
  await page.locator('#wb4-room').fill('library');
  await page.locator('#wb4-can').fill('read interesting books');
  const canvas = page.locator('#room-canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 60, box.y + 60); await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 120, { steps: 6 }); await page.mouse.up();
  let drawingState = await storage(practiceKey('workbook'));
  assert.ok(drawingState.drawing.length >= 1 && drawingState.drawing[0].points.length > 1, 'pointer drawing must create a stroke');
  await canvas.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape');
  drawingState = await storage(practiceKey('workbook'));
  assert.ok(drawingState.drawing.length >= 2, 'keyboard drawing must create a second stroke');
  await page.locator('#draw-undo').click();
  drawingState = await storage(practiceKey('workbook'));
  assert.equal(drawingState.drawing.length, 1, 'undo removes the last stroke');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#draw-download').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'my-favourite-room.png');
  await page.reload({ waitUntil: 'networkidle' }); await clickStep(3);
  assert.equal(await page.locator('#wb4-room').inputValue(), 'library');
  drawingState = await storage(practiceKey('workbook'));
  assert.equal(drawingState.drawing.length, 1, 'drawing persists across reload');
  await resetForm('wb-draw');
  assert.equal(await page.locator('#wb4-room').inputValue(), '');
  drawingState = await storage(practiceKey('workbook'));
  assert.equal(drawingState.drawing.length, 0, 'exercise reset clears the drawing');

  // Workbook 5: four empty order boxes; printed 1 stays printed.
  await clickStep(4);
  for (const [n, value] of [[1, '2'], [2, '3'], [3, '5'], [4, '4']]) await page.locator(`#wb5-order-${n}`).fill(value);
  await page.locator('#wb-order .check-practice').click();
  assert.match(await page.locator('#wb-order .practice-feedback').textContent(), /All 4/);
  assert.equal(await page.locator('[data-source-id="wb5-5"] .given-answer').textContent(), '1');
  await resetForm('wb-order');

  // Workbook 6: category checking accepts any within-box order but rejects duplicates.
  await clickStep(5);
  for (const [id, value] of Object.entries({ 'wb6-school-1': 'playground', 'wb6-school-2': 'classroom', 'wb6-school-3': 'laboratory', 'wb6-house-1': 'kitchen', 'wb6-house-2': 'bedroom', 'wb6-house-3': 'living room' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-sort .check-practice').click();
  assert.match(await page.locator('#wb-sort .practice-feedback').textContent(), /All 6/);
  await page.locator('#wb6-house-1').fill('classroom');
  await page.locator('#wb-sort .check-practice').click();
  assert.match(await page.locator('#wb-sort .practice-feedback').textContent(), /4 of 6/);
  await resetForm('wb-sort');
  pass('All Workbook exercises are genuinely usable', 'Five word blanks, unscored listening numbers, three picture blanks, writing + pointer/keyboard drawing + undo/download/persistence, dialogue order and duplicate-aware sorting; every reset clears its own work');

  // Independent test: full key, normalization, stale-score clearing, partial scoring and reset.
  await go(`${base}-test.html`);
  assert.equal(await page.locator('#quiz .question').count(), 20);
  assert.equal(await page.locator('.content-nav-links button').count(), 20);
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  assert.equal(await page.locator('#teacher-key li').count(), 20);
  const fillCorrect = async () => {
    for (const item of quizSpec.questions) {
      await clickStep(item.number - 1);
      if (item.format === 'short-answer') {
        const variants = { q17: '  Are  ', q18: 'I can read there.', q19: 'DOWNSTAIRS', q20: 'Meat.' };
        await page.locator(`#${item.id}-input`).fill(variants[item.id] || item.accepted[0]);
      } else await page.locator(`#${item.id} input[value="${item.correct}"]`).check();
    }
  };
  await fillCorrect();
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 20 \/ 20/);
  assert.equal(await page.locator('#quiz .feedback.correct').count(), 20);
  assert.equal(await page.locator('#answer-guide').isVisible(), false, 'checking must not open the teacher key');
  await page.reload({ waitUntil: 'networkidle' });
  assert.match(await page.locator('#score').textContent(), /Score: 20 \/ 20/);
  await clickStep(0);
  await page.locator('#q1 input[value="0"]').check();
  assert.equal((await page.locator('#score').textContent()).trim(), '', 'editing an answer clears the stale score');
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 19 \/ 20/);
  await page.locator('#reset-test').click();
  assert.equal(await page.locator('#quiz input:checked').count(), 0);
  assert.deepEqual(await page.locator('#quiz input[type="text"]').evaluateAll(els => els.map(el => el.value)), ['', '', '', '']);
  assert.equal((await page.locator('#score').textContent()).trim(), '');
  assert.equal(await storage(testKey), null);
  await clickStep(0); await page.locator('#q1 input[value="1"]').check();
  await clickStep(16); await page.locator('#q17-input').fill('is');
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 1 \/ 20/);
  assert.match(await page.locator('#score').textContent(), /Answered: 2 \/ 20 · Unanswered: 18/);
  assert.match(await page.locator('#feedback-17').textContent(), /Not correct/);
  await page.locator('#teacher-password').fill('wrong');
  await page.locator('#unlock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  assert.match(await page.locator('#gate-feedback').textContent(), /Incorrect password/);
  await page.locator('#teacher-password').fill('somer173');
  await page.locator('#unlock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), true);
  assert.equal(await page.locator('#teacher-key li').count(), 20);
  await page.locator('#lock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await go(`${base}-test.html#teacher-gate`);
  const gateInView = await page.locator('#teacher-gate').evaluate(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  assert.equal(gateInView, true, 'teacher deep link lands at the gate');
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  pass('Independent 20-question assessment', 'Full key scores 20/20 with normalized written answers; persistence, stale-score clearing, 19/20 after one edit, partial/unanswered scoring, reset and separate teacher gate all verified');

  // Section flow and responsive rendering, including every book/vocabulary step.
  await go(`${base}-pupil-book.html`);
  assert.equal(await page.locator('[data-prev]').isDisabled(), true);
  await page.locator('[data-next]').click();
  assert.equal(await page.locator('#pb-2').isVisible(), true);
  await page.locator('[data-prev]').click();
  assert.equal(await page.locator('#pb-1').isVisible(), true);
  const viewports = [{ width: 1440, height: 960 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const file of pages) {
      await go(file);
      await noOverflow(`${file} @${viewport.width}`);
      const steps = await page.locator('.content-nav-links button').count();
      for (let i = 0; i < steps; i++) { await clickStep(i); await noOverflow(`${file} step ${i + 1} @${viewport.width}`); }
      if (viewport.width === 1440 && file.endsWith('-pupil-book.html')) { await clickStep(0); await page.screenshot({ path: path.join(evidence, 'pupil-book-desktop-1440.png'), fullPage: true }); }
      if (viewport.width === 1440 && file.endsWith('-workbook.html')) { await clickStep(3); await page.screenshot({ path: path.join(evidence, 'workbook-drawing-desktop-1440.png'), fullPage: true }); }
      if (viewport.width === 1440 && file.endsWith('-test.html')) { await clickStep(3); await page.screenshot({ path: path.join(evidence, 'test-room-row-desktop-1440.png'), fullPage: true }); }
      if (viewport.width === 390 && file === `${base}.html`) await page.screenshot({ path: path.join(evidence, 'menu-mobile-390.png'), fullPage: true });
      if (viewport.width === 390 && file.endsWith('-workbook.html')) { await clickStep(5); await page.screenshot({ path: path.join(evidence, 'workbook-sort-mobile-390.png'), fullPage: true }); }
    }
  }
  pass('Responsive rendering and section flow', 'All five pages at 1440, 1024, 768, 390 and 320px; every book/vocabulary/test step checked for page overflow; Previous/Next move between parts');

  assert.deepEqual(errors, [], 'Browser/console/HTTP errors: ' + JSON.stringify(errors));
  pass('Browser console and HTTP health', 'Zero page errors, console errors or HTTP responses >=400 on tested routes');
  const report = { suite: `${base}-browser`, status: 'PASS', date: new Date().toISOString(), browser: 'Chromium ' + browser.version(), originPath: prefix, viewports: viewports.map(v => `${v.width}×${v.height}`), checks, errors, screenshots: fs.readdirSync(evidence).filter(file => file.endsWith('.png')) };
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  fs.writeFileSync(path.join(evidence, 'failure.json'), JSON.stringify({ status: 'FAIL', error: error.stack, checks, errors }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
