import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const LESSON = process.argv[2];
if (!LESSON) throw new Error('Lesson number argument is required');

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'test-results', `grade3-unit1-lesson${LESSON}`);
fs.mkdirSync(evidence, { recursive: true });
const base = 'grade3-unit1-lesson' + LESSON;
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
  const practiceKey = section => `efc_grade3_unit1_lesson${LESSON}_practice_v1:${section}`;
  const testKey = `efc_grade3_unit1_lesson${LESSON}_test_v1`;

  await go('lessons.html?grade=3');
  assert.equal(await page.locator('#lesson-list a.lesson').count(), 5);
  for (const lesson of [1, 2, 3, 4, 5]) assert.equal(await page.locator(`#lesson-list a[href="grade3-unit1-lesson${lesson}.html"]`).count(), 1);
  await page.locator(`#lesson-list a[href="${base}.html"]`).click();
  await page.waitForURL(`**/${base}.html`);
  assert.equal(await page.locator('.cards .card').count(), 4);
  const sequence = page.locator('nav[aria-label="Published lesson sequence"]');
  assert.match(await sequence.textContent(), /Previous lesson · My Lovely School/);
  assert.match(await sequence.textContent(), /Revision 1/);
  await noOverflow('lesson menu');
  pass('Rendered Grade 3 listing and menu', 'Five Grade 3 lessons listed; the Lesson 4 menu links back to Lesson 3 and forward to Lesson 5');

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
  pass('All five pages load with healthy assets and direction', 'English/LTR UI, five section links, one current section, every image decodes and no horizontal overflow at 1440px');

  for (const section of ['pupil-book', 'workbook']) {
    await go(`${base}-${section}.html`);
    const rendered = await sourceText();
    const expected = Object.fromEntries(Object.entries(content.printed).filter(([id]) => id.startsWith(section === 'pupil-book' ? 'pb' : 'wb')));
    assert.deepEqual(rendered, expected, `${section}: exact rendered source transcription and blank/example structure`);
    for (const [id, instruction] of Object.entries(content.instructions)) {
      if (!id.startsWith(section === 'pupil-book' ? 'pb' : 'wb')) continue;
      assert.equal((await page.locator(`#${id} h2`).textContent()).replace(/\s+/g, ' ').trim(), instruction.replace(/\s+/g, ' ').trim(), `${id}: printed instruction`);
    }
  }
  pass('Rendered textbook fidelity', `${Object.keys(content.printed).length} source blocks and ${Object.keys(content.instructions).length} printed instructions match the reviewed inventory, including dotted letter shapes, printed examples and punctuation`);

  await go(`${base}-vocabulary.html`);
  const vocabulary = await page.locator('.vocabulary-table tbody tr').evaluateAll(rows => rows.map(row => ({ english: row.cells[0].textContent, arabic: row.cells[1].textContent, dir: getComputedStyle(row.cells[1]).direction, lang: row.cells[1].lang })));
  assert.equal(vocabulary.length, content.vocabulary.length);
  vocabulary.forEach((row, i) => {
    assert.equal(row.english, content.vocabulary[i].english);
    assert.equal(row.arabic, content.vocabulary[i].arabic);
    assert.equal(row.dir, 'rtl'); assert.equal(row.lang, 'ar');
  });
  pass('Vocabulary rendering', `${vocabulary.length} reviewed English/Arabic pairs; meanings render RTL and all other content stays LTR`);

  // Pupil's Book 2: five sense + body-part pairs, wrong first then correct.
  await go(`${base}-pupil-book.html`);
  await clickStep(1);
  await page.locator('#pb2-ear').fill('see');
  await page.locator('#pb-senses .check-practice').click();
  assert.match(await page.locator('#pb-senses .practice-feedback').textContent(), /0 of 5/);
  assert.equal(await page.locator('#pb-senses-key').isVisible(), false);
  for (const [id, value] of Object.entries({ 'pb2-ear': 'hear', 'pb2-mouth': 'taste', 'pb2-eye': 'see', 'pb2-nose': 'smell', 'pb2-hand': 'touch' })) await page.locator('#' + id).fill(value);
  await page.locator('#pb-senses .check-practice').click();
  assert.match(await page.locator('#pb-senses .practice-feedback').textContent(), /All 5/);
  await page.locator('#pb-senses .reveal').click();
  assert.equal(await page.locator('#pb-senses-key').isVisible(), true);
  await page.locator('#pb-senses .reveal').click();
  await page.reload({ waitUntil: 'networkidle' });
  await clickStep(1);
  assert.equal(await page.locator('#pb2-hand').inputValue(), 'touch');
  await resetForm('pb-senses');
  assert.equal(await page.locator('#pb2-hand').inputValue(), '');

  // Pupil's Book 3: tens numbers accept numeral or word.
  await clickStep(2);
  for (const [id, value] of Object.entries({ 'pb3-10': 'ten', 'pb3-20': '20', 'pb3-30': 'thirty', 'pb3-40': '40', 'pb3-50': 'fifty' })) await page.locator('#' + id).fill(value);
  await page.locator('#pb-numbers .check-practice').click();
  assert.match(await page.locator('#pb-numbers .practice-feedback').textContent(), /All 5/);
  await resetForm('pb-numbers');

  // Pupil's Book 4: audio-only tick grid stays unscored.
  await clickStep(3);
  assert.equal(await page.locator('#pb-tick .check-practice').count(), 0);
  assert.equal(await page.locator('#pb-tick .answer').count(), 0);
  await page.locator('#pb-tick input[type="checkbox"]').first().check();
  assert.match(await page.locator('#pb-tick .practice-feedback').textContent(), /unavailable|practice only|recording/i);
  await resetForm('pb-tick');

  // Pupil's Book 6: the printed oa letters.
  await clickStep(5);
  for (const id of ['pb6-coat', 'pb6-goat']) await page.locator('#' + id).fill('oa');
  await page.locator('#pb-oa .check-practice').click();
  assert.match(await page.locator('#pb-oa .practice-feedback').textContent(), /All 2/);
  await resetForm('pb-oa');
  pass('Pupil’s Book practice', 'Sense matching, dual numeral/word numbers, unscored listening grid and the printed oa letters all check, persist and reset');

  // Drawing surface added to the song activity.
  await clickStep(4);
  const songCanvas = page.locator('#song-canvas');
  await songCanvas.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(120);
  const songBox = await songCanvas.boundingBox();
  await page.mouse.move(songBox.x + 50, songBox.y + 50); await page.mouse.down();
  await page.mouse.move(songBox.x + 170, songBox.y + 110, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
  let drawing = (await storage(practiceKey('pupil-book'))) || {};
  assert.ok(drawing.drawing.length >= 1 && drawing.drawing[0].points.length > 1, 'pointer drawing must create a stroke');
  await songCanvas.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  drawing = (await storage(practiceKey('pupil-book'))) || {};
  assert.ok(drawing.drawing.length >= 2, 'keyboard drawing must create a second stroke');
  await page.locator('#draw-undo').click();
  await page.waitForTimeout(150);
  drawing = (await storage(practiceKey('pupil-book'))) || {};
  assert.equal(drawing.drawing.length, 1, 'undo removes the last stroke');
  const songDownload = page.waitForEvent('download');
  await page.locator('#draw-download').click();
  assert.equal((await songDownload).suggestedFilename(), 'my-senses-song.png');
  await page.reload({ waitUntil: 'networkidle' });
  await clickStep(4);
  await page.waitForTimeout(150);
  assert.equal(((await storage(practiceKey('pupil-book'))) || {}).drawing.length, 1, 'drawing persists across reload');
  await page.locator('#draw-clear').click();
  await page.waitForTimeout(150);
  assert.equal(((await storage(practiceKey('pupil-book'))) || {}).drawing.length, 0, 'clear empties the drawing');
  assert.equal(await storage(practiceKey('workbook')), null, 'drawing must not leak into the Workbook page');
  pass('Drawing surface', 'Pointer and keyboard strokes, undo, PNG download, reload persistence and clear all work, and nothing leaks into the Workbook page bucket');

  // Workbook exercises.
  await go(`${base}-workbook.html`);
  await clickStep(0);
  await page.locator('#wb1-1').fill('nose');
  await page.locator('#wb-words .check-practice').click();
  assert.match(await page.locator('#wb-words .practice-feedback').textContent(), /1 of 5/);
  for (const [id, value] of Object.entries({ 'wb1-1': 'nose', 'wb1-2': 'eye', 'wb1-3': 'ear', 'wb1-4': 'mouth', 'wb1-5': 'hand' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-words .check-practice').click();
  await page.waitForTimeout(60);
  assert.match(await page.locator('#wb-words .practice-feedback').textContent(), /All 5/);
  await resetForm('wb-words');

  await clickStep(1);
  for (const [id, value] of Object.entries({ 'wb2-1': 'hear', 'wb2-2': 'see', 'wb2-3': 'touch', 'wb2-4': 'taste', 'wb2-5': 'smell' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-fill .check-practice').click();
  await page.waitForTimeout(60);
  assert.match(await page.locator('#wb-fill .practice-feedback').textContent(), /All 5/);
  await resetForm('wb-fill');

  await clickStep(2);
  for (const [id, value] of Object.entries({ 'wb3-1': 'taste', 'wb3-2': 'smell', 'wb3-3': 'hear', 'wb3-4': 'see' })) await page.locator(`#${id}-${value}`).check();
  await page.locator('#wb-circle .check-practice').click();
  await page.waitForTimeout(60);
  assert.match(await page.locator('#wb-circle .practice-feedback').textContent(), /All 4/);
  await resetForm('wb-circle');

  await clickStep(3);
  assert.equal(await page.locator('#wb-listen .check-practice').count(), 0);
  assert.equal(await page.locator('#wb-listen .answer').count(), 0);
  await page.locator('#wb4-a-24').check();
  assert.match(await page.locator('#wb-listen .practice-feedback').textContent(), /unavailable|practice only|recording/i);
  await resetForm('wb-listen');

  await clickStep(4);
  for (const [id, value] of Object.entries({ 'wb5-r1c3': '33', 'wb5-r1c4': 'thirty-four', 'wb5-r1c6': '36', 'wb5-r2c2': '38', 'wb5-r2c3': '39', 'wb5-r2c5': '41', 'wb5-r2c6': '42', 'wb5-r3c3': '45', 'wb5-r3c5': '47' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-numbers .check-practice').click();
  await page.waitForTimeout(60);
  assert.match(await page.locator('#wb-numbers .practice-feedback').textContent(), /All 9/);
  await resetForm('wb-numbers');

  await clickStep(5);
  for (const [id, value] of Object.entries({ 'wb6-2': 'I can smell a rose', 'wb6-3': 'I can taste an orange', 'wb6-4': 'I can touch a rabbit' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-look .check-practice').click();
  await page.waitForTimeout(60);
  assert.match(await page.locator('#wb-look .practice-feedback').textContent(), /All 3/);
  await resetForm('wb-look');
  pass('All Workbook exercises are genuinely usable', 'Five body-part blanks, five sense blanks, four circled pairs, unscored listening numbers, nine missing numbers and three look-and-write sentences; every check and reset works');

  // Independent test.
  await go(`${base}-test.html`);
  assert.equal(await page.locator('#quiz .question').count(), 20);
  assert.equal(await page.locator('.content-nav-links button').count(), 20);
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  assert.equal(await page.locator('#teacher-key li').count(), 20);
  for (const item of quizSpec.questions) {
    await clickStep(item.number - 1);
    if (item.format === 'short-answer') await page.locator(`#${item.id}-input`).fill(item.accepted[0]);
    else await page.locator(`#${item.id} input[value="${item.correct}"]`).check();
  }
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
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 1 \/ 20/);
  assert.match(await page.locator('#score').textContent(), /Answered: 1 \/ 20 · Unanswered: 19/);
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
  assert.equal(await page.locator('#teacher-gate').evaluate(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), true, 'teacher deep link lands at the gate');
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  // Lesson 5 state must stay in its own bucket.
  assert.equal(await storage('efc_grade3_unit1_lesson5_test_v1'), null, 'Lesson 5 test state must not appear');
  pass('Independent 20-question assessment', '20/20 with the published key; persistence, stale-score clearing, partial/unanswered scoring, reset and the separate teacher gate verified');

  // Section flow and responsive rendering.
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
      if (viewport.width === 1440 && file.endsWith('-pupil-book.html')) { await clickStep(4); await page.screenshot({ path: path.join(evidence, 'pupil-book-drawing-desktop-1440.png'), fullPage: true }); }
      if (viewport.width === 390 && file.endsWith('-pupil-book.html')) { await clickStep(1); await page.screenshot({ path: path.join(evidence, 'pupil-book-mobile-390.png'), fullPage: true }); }
      if (viewport.width === 1440 && file.endsWith('-workbook.html')) { await clickStep(4); await page.screenshot({ path: path.join(evidence, 'workbook-numbers-desktop-1440.png'), fullPage: true }); }
      if (viewport.width === 390 && file === `${base}.html`) await page.screenshot({ path: path.join(evidence, 'menu-mobile-390.png'), fullPage: true });
    }
  }
  pass('Responsive rendering and section flow', 'All five pages at 1440, 1024, 768, 390 and 320px; every step checked for page overflow; Previous/Next move between parts');

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
