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
  assert.match(await sequence.textContent(), /Previous lesson · My Five Senses/);
  assert.match(await sequence.textContent(), /Next lesson · not yet published/);
  await noOverflow('lesson menu');
  pass('Rendered Grade 3 listing and menu', 'Five Grade 3 lessons listed; the Revision 1 menu links back to Lesson 4 and invents no next lesson');

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
  pass('Rendered textbook fidelity', `${Object.keys(content.printed).length} source blocks and ${Object.keys(content.instructions).length} printed instructions match the reviewed inventory, including the printed ou example and the transcribed school labels`);

  await go(`${base}-vocabulary.html`);
  const vocabulary = await page.locator('.vocabulary-table tbody tr').evaluateAll(rows => rows.map(row => ({ english: row.cells[0].textContent, arabic: row.cells[1].textContent, dir: getComputedStyle(row.cells[1]).direction, lang: row.cells[1].lang })));
  assert.equal(vocabulary.length, content.vocabulary.length);
  vocabulary.forEach((row, i) => {
    assert.equal(row.english, content.vocabulary[i].english);
    assert.equal(row.arabic, content.vocabulary[i].arabic);
    assert.equal(row.dir, 'rtl'); assert.equal(row.lang, 'ar');
  });
  pass('Vocabulary rendering', `${vocabulary.length} reviewed English/Arabic pairs; meanings render RTL and all other content stays LTR`);

  // Pupil's Book 1: tick or cross against the printed school picture.
  await go(`${base}-pupil-book.html`);
  await page.locator('#pb1-1-tick').check();
  await page.locator('#pb-cross .check-practice').click();
  assert.match(await page.locator('#pb-cross .practice-feedback').textContent(), /0 of 5/);
  assert.equal(await page.locator('#pb-cross-key').isVisible(), false);
  for (const [n, value] of [[1, 'x'], [2, '✓'], [3, 'x'], [4, '✓'], [5, 'x']]) await page.locator(`#pb1-${n}-${value === '✓' ? 'tick' : 'cross'}`).check();
  await page.locator('#pb-cross .check-practice').click();
  assert.match(await page.locator('#pb-cross .practice-feedback').textContent(), /All 5/);
  await page.locator('#pb-cross .reveal').click();
  assert.equal(await page.locator('#pb-cross-key').isVisible(), true);
  await page.locator('#pb-cross .reveal').click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#pb1-4-tick').isChecked(), true);
  await resetForm('pb-cross');
  assert.equal(await page.locator('#pb-cross input:checked').count(), 0);

  // Pupil's Book 3: audio-only phonics table stays unscored.
  await clickStep(2);
  assert.equal(await page.locator('#pb-tick .check-practice').count(), 0);
  assert.equal(await page.locator('#pb-tick .answer').count(), 0);
  await page.locator('#pb-tick input[type="checkbox"]').first().check();
  assert.match(await page.locator('#pb-tick .practice-feedback').textContent(), /unavailable|practice only|recording/i);
  await resetForm('pb-tick');

  // Pupil's Book 4: the printed bracketed pairs.
  await clickStep(3);
  for (const [id, value] of [['pb4-1', 'play'], ['pb4-2', 'science'], ['pb4-3', 'read']]) await page.locator(`#${id}-${value}`).check();
  await page.locator('#pb-see .check-practice').click();
  assert.match(await page.locator('#pb-see .practice-feedback').textContent(), /All 3/);
  await resetForm('pb-see');
  pass('Pupil’s Book practice', 'Tick/cross checking, the unscored listening phonics table and the three circled bracket pairs check, persist and reset');

  // Pupil's Book 5: the project response space, including its drawing surface.
  await clickStep(4);
  await page.locator('#pb5-smell').check();
  await page.locator('#pb5-plan').fill('petal 1 nose, petal 2 flowers');
  const flowerCanvas = page.locator('#flower-canvas');
  await flowerCanvas.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(120);
  const flowerBox = await flowerCanvas.boundingBox();
  await page.mouse.move(flowerBox.x + 60, flowerBox.y + 60); await page.mouse.down();
  await page.mouse.move(flowerBox.x + 180, flowerBox.y + 120, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
  let drawing = (await storage(practiceKey('pupil-book'))) || {};
  assert.ok(drawing.drawing && drawing.drawing.length === 1 && drawing.drawing[0].points.length > 1, 'pointer drawing must create a stroke');
  await flowerCanvas.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  assert.equal(((await storage(practiceKey('pupil-book'))) || {}).drawing.length, 2, 'keyboard drawing must create a second stroke');
  await page.locator('#draw-undo').click();
  await page.waitForTimeout(150);
  assert.equal(((await storage(practiceKey('pupil-book'))) || {}).drawing.length, 1, 'undo removes the last stroke');
  const download = page.waitForEvent('download');
  await page.locator('#draw-download').click();
  assert.equal((await download).suggestedFilename(), 'my-senses-flower.png');
  await page.reload({ waitUntil: 'networkidle' });
  await clickStep(4);
  assert.equal(await page.locator('#pb5-plan').inputValue(), 'petal 1 nose, petal 2 flowers');
  assert.equal(((await storage(practiceKey('pupil-book'))) || {}).drawing.length, 1, 'drawing persists across reload');
  await page.locator('#draw-clear').click();
  await page.waitForTimeout(150);
  assert.equal(((await storage(practiceKey('pupil-book'))) || {}).drawing.length, 0, 'clear empties the drawing');
  assert.equal(await storage(practiceKey('workbook')), null, 'drawing must not leak into the Workbook page bucket');
  assert.equal(await storage('efc_grade3_unit1_lesson4_practice_v1:pupil-book'), null, 'no Lesson 4 drawing state');
  await resetForm('pb-project');
  assert.equal(await page.locator('#pb5-plan').inputValue(), '');
  pass('Project response space and drawing', 'Sense choice, project notes, pointer/keyboard strokes, undo, PNG download, reload persistence and independent per-lesson storage verified');

  // Workbook exercises.
  await go(`${base}-workbook.html`);
  await clickStep(0);
  for (const [id, value] of [['wb-match-1', 'c'], ['wb-match-2', 'd'], ['wb-match-3', 'a'], ['wb-match-4', 'b'], ['wb-match-5', 'e']]) await page.locator('#' + id).selectOption(value);
  await page.locator('#wb-match .check-practice').click();
  assert.match(await page.locator('#wb-match .practice-feedback').textContent(), /All 5/);
  await resetForm('wb-match');

  await clickStep(1);
  for (const id of ['wb2-2-b', 'wb2-3-d', 'wb2-4-a']) await page.locator('#' + id).check();
  await page.locator('#wb-odd .check-practice').click();
  assert.match(await page.locator('#wb-odd .practice-feedback').textContent(), /All 3/);
  assert.match(await page.locator('[data-source-id="wb2-1"]').textContent(), /gym/);
  await resetForm('wb-odd');

  await clickStep(2);
  assert.equal(await page.locator('#wb-listen .check-practice').count(), 0);
  assert.equal(await page.locator('#wb-listen .answer').count(), 0);
  await page.locator('#wb3-1-left').check();
  assert.match(await page.locator('#wb-listen .practice-feedback').textContent(), /unavailable|practice only|recording/i);
  await resetForm('wb-listen');

  await clickStep(3);
  for (const [id, value] of [['wb4-line1', 'forty'], ['wb4-line2', 'twenty'], ['wb4-line3', 'fifty']]) await page.locator('#' + id).fill(value);
  await page.reload({ waitUntil: 'networkidle' });
  await clickStep(3);
  assert.equal(await page.locator('#wb4-line2').inputValue(), 'twenty');

  await clickStep(4);
  for (const [id, value] of Object.entries({ 'wb5-1a': 'Science', 'wb5-1b': 'Music', 'wb5-2a': 'English', 'wb5-2b': 'Maths', 'wb5-3': 'Art', 'wb5-4a': 'Music', 'wb5-4b': 'Sports' })) await page.locator('#' + id).fill(value);
  await page.locator('#wb-write .check-practice').click();
  assert.match(await page.locator('#wb-write .practice-feedback').textContent(), /All 7/);
  await resetForm('wb-write');

  await clickStep(5);
  for (const [id, value] of [['wb6-broom', 'oo'], ['wb6-house', 'ou'], ['wb6-goat', 'oa'], ['wb6-eat', 'ea']]) await page.locator(`#${id}-${value}`).check();
  await page.locator('#wb-phonics .check-practice').click();
  assert.match(await page.locator('#wb-phonics .practice-feedback').textContent(), /All 4/);
  await resetForm('wb-phonics');
  pass('All Workbook exercises are genuinely usable', 'Five-sentence matching, three odd-one-out rows with the printed example intact, unscored listening ticks, personal number lines, five subject blanks plus two personal ones and four sound pairs; every check and reset works');

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
  await page.locator('#q1 input[value="1"]').check();
  assert.equal((await page.locator('#score').textContent()).trim(), '', 'editing an answer clears the stale score');
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 19 \/ 20/);
  await page.locator('#reset-test').click();
  assert.equal(await page.locator('#quiz input:checked').count(), 0);
  assert.deepEqual(await page.locator('#quiz input[type="text"]').evaluateAll(els => els.map(el => el.value)), ['', '', '', '']);
  assert.equal((await page.locator('#score').textContent()).trim(), '');
  assert.equal(await storage(testKey), null);
  await clickStep(0); await page.locator('#q1 input[value="0"]').check();
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
  assert.equal(await storage('efc_grade3_unit1_lesson4_test_v1'), null, 'Lesson 4 test state must not appear');
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
      if (viewport.width === 1440 && file.endsWith('-pupil-book.html')) { await clickStep(4); await page.screenshot({ path: path.join(evidence, 'pupil-book-project-desktop-1440.png'), fullPage: true }); }
      if (viewport.width === 390 && file.endsWith('-pupil-book.html')) { await clickStep(0); await page.screenshot({ path: path.join(evidence, 'pupil-book-mobile-390.png'), fullPage: true }); }
      if (viewport.width === 1440 && file.endsWith('-workbook.html')) { await clickStep(5); await page.screenshot({ path: path.join(evidence, 'workbook-phonics-desktop-1440.png'), fullPage: true }); }
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
