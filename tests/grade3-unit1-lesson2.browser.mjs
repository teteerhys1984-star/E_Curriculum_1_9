import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'test-results', 'grade3-unit1-lesson2');
fs.mkdirSync(evidence, { recursive: true });
const base = 'grade3-unit1-lesson2';
const prefix = '/E_Curriculum_1_9/';
const checks = [];
const errors = [];
const pass = (name, detail = '') => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end('Use project-prefix URL'); return; }
  const relative = pathname.slice(prefix.length) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${prefix}`;
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
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('response', response => { if (response.status() >= 400) errors.push({ url: response.url(), status: response.status() }); });
  const go = async file => {
    const response = await page.goto(origin + file, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, file);
    await page.evaluate(() => document.fonts.ready);
  };
  const noPageOverflow = async label => {
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  };
  const clickStep = async index => {
    await page.locator('.content-nav-links button').nth(index).click();
  };
  const visiblePanel = async id => {
    assert.equal(await page.locator('#' + id).isVisible(), true, `${id} should be visible`);
  };
  const imageHealth = async label => {
    // Open all source disclosures so their lazy images are actually requested.
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(el => { el.open = true; });
    await page.locator('img').evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
    const broken = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src));
    assert.deepEqual(broken, [], `${label}: broken images`);
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(el => { el.open = false; });
  };

  // Dynamic Grade 3 list entry: click the actual rendered link, not only inspect its source.
  await go('lessons.html?grade=3');
  const lessonLink = page.locator('#lesson-list a[href="grade3-unit1-lesson2.html"]');
  assert.equal(await lessonLink.count(), 1);
  assert.match(await lessonLink.textContent(), /School Subjects/);
  assert.equal(await page.locator('#lesson-list a[href="grade3-unit1-lesson1.html"]').count(), 1);
  await lessonLink.click();
  await page.waitForURL('**/grade3-unit1-lesson2.html');
  assert.equal(await page.locator('.cards .card').count(), 4);
  await noPageOverflow('Grade 3 menu');
  pass('Rendered Grade 3 list opens Lesson 2', 'Existing Lesson 1 link still present; four lesson section cards');

  // Check other grade menus to guard the shared listing change.
  for (const grade of [1, 2, 4, 5, 6, 7, 8, 9]) {
    await go(`lessons.html?grade=${grade}`);
    assert.ok((await page.locator('#lesson-list a.lesson').count()) >= 1);
    assert.equal(await page.locator('#lesson-list a[href="grade3-unit1-lesson2.html"]').count(), 0);
    if (grade === 5) assert.equal(await page.locator('#lesson-list a[href="grade5-unit1-lesson2.html"]').count(), 1);
  }
  pass('Other grade menus still render', 'Grades 1, 2, 4, 5, 6, 7, 8, 9; Grade 5 Lesson 2 retained');

  const pages = [
    { file: `${base}.html`, short: 'menu', panels: [] },
    { file: `${base}-pupil-book.html`, short: 'pupil-book', panels: [1,2,3,4,5].map(i => `pb-${i}`) },
    { file: `${base}-workbook.html`, short: 'workbook', panels: [1,2,3,4,5,6].map(i => `wb-${i}`) },
    { file: `${base}-vocabulary.html`, short: 'vocabulary', panels: [] },
    { file: `${base}-test.html`, short: 'test', panels: [] }
  ];
  for (const item of pages) {
    await go(item.file);
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).direction), 'rtl');
    if (item.short !== 'menu') {
      for (const link of await page.locator('.section-links a').all()) {
        const href = await link.getAttribute('href');
        const response = await context.request.get(origin + href);
        assert.equal(response.status(), 200, href);
      }
      assert.equal(await page.locator('.lesson-step-footer [data-prev]').count(), 1);
      assert.equal(await page.locator('.lesson-step-footer [data-next]').count(), 1);
    }
    if (item.panels.length) {
      assert.equal(await page.locator('.content-nav-links button').count(), item.panels.length);
      for (let i = 0; i < item.panels.length; i++) {
        await clickStep(i); await visiblePanel(item.panels[i]);
        assert.equal(await page.locator('main > section.panel:visible').count(), 1);
        assert.equal(await page.locator('.content-nav-links button[aria-current="step"]').count(), 1);
      }
      await clickStep(0);
      assert.equal(await page.locator('.lesson-step-footer [data-prev]').isDisabled(), true);
      for (let i = 1; i < item.panels.length; i++) { await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel(item.panels[i]); }
      await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel(item.panels[0]);
      for (let i = item.panels.length - 1; i >= 0; i--) {
        await clickStep(i);
        if (i > 0) { await page.locator('.lesson-step-footer [data-prev]').click(); await visiblePanel(item.panels[i-1]); await clickStep(i); }
      }
    }
    if (item.short === 'vocabulary') {
      const count = await page.locator('.content-nav-links button').count();
      assert.equal(count, 5);
      for (let i = 0; i < count; i++) { await clickStep(i); assert.equal(await page.locator('main > section.panel:visible').count(), 1); }
      await clickStep(0);
    }
    await imageHealth(item.short);
    await noPageOverflow(item.short + ' desktop');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(evidence, `${item.short}-desktop-1366.png`), fullPage: true, timeout: 30000 });
  }
  pass('All five pages, shared step indexes and Previous/Next', 'Every content step reached; previous disabled at first; next wraps; all images decode');
  pass('Arabic RTL and source image health on desktop', '1366×900; no page-level horizontal overflow; source disclosures opened');

  // Exact source transcription checks, including all choices and blank positions.
  await go(`${base}-pupil-book.html`);
  const normalizedText = async selector => page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const paragraphs = node.querySelectorAll(':scope > p');
    const text = paragraphs.length ? Array.from(paragraphs).map(p => p.textContent).join(' ') : node.textContent;
    return text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  }));
  const dialoguePositions = await page.locator('.dialogue').evaluateAll(nodes => nodes.map(node => ({x:node.getBoundingClientRect().x,y:node.getBoundingClientRect().y})));
  assert.ok(dialoguePositions[0].x < dialoguePositions[1].x, 'Original left-to-right dialogue order must be preserved');
  assert.ok(dialoguePositions[0].y < dialoguePositions[2].y, 'Original top-to-bottom dialogue order must be preserved');
  assert.deepEqual(await normalizedText('.dialogue-text'), [
    "What lessons have we got today? Today we've got Maths and Science.",
    "What's your favourite lesson? My favourite lesson is Sports.",
    "Have we got Arabic today? No, we haven't. We've got Social Studies.",
    "Hello, pupils! Open your books. We've got English today.",
    "Tomorrow, I've got Music. I like Music.",
    "On Tuesday, we've got Art. We need crayons."
  ]);
  assert.deepEqual(await normalizedText('#pb-2 .source-quote p'), ['What lessons have we got today?', 'Today we have got Science and Maths.', 'My favourite lesson is Maths.']);
  assert.deepEqual(await normalizedText('#pb-3 .source-quote p'), ['What lessons have you got on Wednesday?', "On Wednesday, I've got Art and English."]);
  assert.deepEqual(await page.locator('.number-list li').evaluateAll(nodes => nodes.map(node => [node.querySelector('b').textContent,node.querySelector('span').textContent])), [['21','twenty-one'],['22','twenty-two'],['23','twenty-three'],['24','twenty-four'],['25','twenty-five'],['26','twenty-six'],['27','twenty-seven'],['28','twenty-eight'],['29','twenty-nine'],['30','thirty']]);
  assert.deepEqual(await normalizedText('.phonics-pair .sound-word'), ['house','mouse']);
  await go(`${base}-workbook.html`);
  assert.deepEqual(await normalizedText('.match-options.en li'), ['What lessons have we got today?', "What's your favourite lesson?", 'What have you got on Tuesday?', "a — On Tuesday, I've got Maths.", "b — Today, we've got Art and Music.", 'c — My favourite lesson is English.']);
  assert.deepEqual(await normalizedText('#wb-number-match .match-row label'), ['twenty-nine','twenty-two','thirty','twenty-one','twenty-eight','twenty-three']);
  assert.deepEqual(await page.locator('#wb-number-match select').evaluateAll(nodes => nodes.map(node => Array.from(node.options).slice(1).map(option => option.value))), Array(6).fill(['21','30','29','28','23','22']));
  assert.deepEqual(await normalizedText('#wb-4 > p'), ['الأعداد المطبوعة بالترتيب: 21 → 22 → … → 24 → … → … → 27 → 28 → … → 30.']);
  assert.deepEqual(await page.locator('.schedule-table tbody tr').evaluateAll(rows => rows.map(row => Array.from(row.cells).map(cell => cell.querySelector('input') ? '[blank]' : cell.textContent.trim()))), [
    ['Sunday','Maths','Art','[blank]','Arabic'], ['Monday','[blank]','Music','Arabic','English'], ['Tuesday','Arabic','[blank]','Social Studies','[blank]']
  ]);
  assert.deepEqual(await normalizedText('#wb-6 .activity > p'), ["What's your favourite lesson?"]);
  assert.equal(await page.locator('#wb-6 .writing-line > span').textContent(), 'My');
  pass('Exact source transcription audit', 'Six PB dialogues; learn/ask sentences; ten numbers; phonics words; all WB questions/options; number order; four+four blank positions; personal writing prompt');

  // Source-specific content and image separation.
  await go(`${base}-pupil-book.html`);
  await clickStep(2);
  assert.deepEqual(await page.locator('.timetable tbody tr').evaluateAll(rows => rows.map(row => Array.from(row.cells).map(cell => cell.textContent.trim()))), [
    ['Science','Arabic','Music','Art'], ['Maths','Art','Art','Maths'], ['Arabic','Sports','English','Social Studies'], ['English','','Arabic','Science']
  ]);
  assert.equal(await page.locator('.source-quote').first().evaluate(el => getComputedStyle(el).direction), 'ltr');
  await go(`${base}-workbook.html`);
  assert.equal(await page.locator('img[src*="pupil-book"]').count(), 0);
  await clickStep(0);
  await page.locator('input[name="listen-1"][value="Maths"]').check();
  await page.locator('input[name="listen-4"][value="Art"]').check();
  await clickStep(1);
  await page.locator('#match-1').selectOption('b');
  await clickStep(0);
  assert.equal(await page.locator('input[name="listen-1"][value="Maths"]').isChecked(), true);
  assert.equal(await page.locator('#wb-listen .answer').count(), 0);
  await page.locator('#wb-listen button[type="reset"]').click();
  assert.equal(await page.locator('#wb-listen input:checked').count(), 0);
  await clickStep(1);
  assert.equal(await page.locator('#match-1').inputValue(), 'b');
  for (const [form, step, answer] of [
    ['wb-match',1,'wb-match-key'], ['wb-number-match',2,'wb-number-key'], ['wb-missing',3,'wb-missing-key'], ['wb-schedule',4,'wb-schedule-key']
  ]) {
    await clickStep(step);
    const reveal = page.locator(`#${form} button.reveal`).first();
    await reveal.click(); assert.equal(await page.locator('#'+answer).isVisible(), true);
    assert.equal(await reveal.getAttribute('aria-expanded'), 'true');
    await reveal.click(); assert.equal(await page.locator('#'+answer).isVisible(), false);
    await reveal.click(); await page.locator(`#${form} button[type="reset"]`).click();
    assert.equal(await page.locator('#'+answer).isVisible(), false);
  }
  await clickStep(3);
  for (const n of [23,25,26,29]) await page.locator(`#missing-${n}`).fill(String(n));
  await clickStep(4);
  for (const [id,value] of [['schedule-sunday-3','English'],['schedule-monday-1','Science'],['schedule-tuesday-2','Sports'],['schedule-tuesday-4','Maths']]) await page.locator('#'+id).fill(value);
  await clickStep(5);
  await page.locator('#personal-answer').fill('favourite lesson is Art.');
  await clickStep(3);
  assert.equal(await page.locator('#missing-23').inputValue(), '23');
  await clickStep(5);
  assert.equal(await page.locator('#personal-answer').inputValue(), 'favourite lesson is Art.');
  assert.equal(await page.locator('#wb-6 button.reveal').count(), 0);
  pass('Workbook interactions', 'Listening not scored/resettable; four inferred keys toggle/reset; 8 written blanks and personal response retained across steps');

  // Assessment: empty, all wrong, all correct, partial and changed answers.
  await go(`${base}-test.html`);
  const count = await page.locator('#quiz .question').count();
  assert.equal(count, 20);
  assert.equal(await page.locator('.content-nav-links button').count(), 20);
  for (let i=0;i<count;i++) {
    await clickStep(i);
    assert.equal(await page.locator(`#q${i+1}`).isVisible(), true);
    assert.equal(await page.locator('#quiz .question:visible').count(), 1);
  }
  await clickStep(0);
  for (let i=1;i<count;i++) { await page.locator('.lesson-step-footer [data-next]').click(); assert.equal(await page.locator(`#q${i+1}`).isVisible(), true); }
  await page.locator('.lesson-step-footer [data-next]').click();
  await visiblePanel('q1');
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /النتيجة: 0 \/ 20/);
  assert.match(await page.locator('#score').textContent(), /غير المُجابة: 20/);
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  const correct = await page.locator('#quiz .question').evaluateAll(questions => questions.map(q => q.dataset.correct));
  for (let i=0;i<count;i++) {
    await clickStep(i);
    await page.locator(`#q${i+1} input[value="${(Number(correct[i])+1)%3}"]`).check();
  }
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /النتيجة: 0 \/ 20/);
  assert.match(await page.locator('#score').textContent(), /الأسئلة المُجابة: 20 \/ 20/);
  assert.equal(await page.locator('.feedback.incorrect').count(), 20);
  for (let i=0;i<count;i++) {
    await clickStep(i);
    await page.locator(`#q${i+1} input[value="${correct[i]}"]`).check();
  }
  assert.equal(await page.locator('#score').textContent(), '');
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /النتيجة: 20 \/ 20/);
  assert.equal(await page.locator('.feedback.correct').count(), 20);
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#score').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, 'quiz-score-20-of-20.png'), timeout: 30000 });
  await clickStep(0);
  assert.equal(await page.locator('#q1 input:checked').inputValue(), correct[0]);
  await page.locator(`#q1 input[value="${(Number(correct[0])+1)%3}"]`).check();
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /النتيجة: 19 \/ 20/);
  await page.locator('#reset-test').click();
  assert.equal(await page.locator('#quiz input:checked').count(), 0);
  assert.equal(await page.locator('#score').textContent(), '');
  assert.equal(await page.locator('.feedback').evaluateAll(nodes => nodes.filter(n => n.textContent).length), 0);
  await page.locator('#q1 input[value="'+correct[0]+'"]').check();
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /النتيجة: 1 \/ 20/);
  assert.match(await page.locator('#score').textContent(), /غير المُجابة: 19/);
  pass('Quiz scoring and question navigation', '0/20 empty; 0/20 all wrong; 20/20 all correct; 19/20 one wrong; 1/20 partial; stale score cleared; reset clears all');

  // Use the already-existing project password without printing it into test logs.
  const oldTest = fs.readFileSync(path.join(root, 'grade3-unit1-lesson1-test.html'), 'utf8');
  const codes = oldTest.match(/String\.fromCharCode\(([\d,]+)\)/)[1].split(',').map(Number);
  const teacherPassword = String.fromCharCode(...codes);
  await page.locator('#unlock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#teacher-password').fill('definitely-not-the-teacher-password');
  await page.locator('#teacher-password').press('Enter');
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#teacher-password').fill(teacherPassword);
  await page.locator('#unlock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), true);
  assert.equal(await page.locator('#teacher-key > li').count(), 20);
  assert.match(await page.locator('#teacher-key').textContent(), /مستنتج من المصدر/);
  await page.locator('#answer-guide').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, 'teacher-key-open.png'), timeout: 30000 });
  await page.locator('#lock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#teacher-password').fill(teacherPassword);
  await page.locator('#teacher-password').press('Enter');
  assert.equal(await page.locator('#answer-guide').isVisible(), true);
  await page.locator('#reset-test').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  assert.equal(await page.locator('#teacher-password').inputValue(), '');
  pass('Teacher answer key gate', 'Empty/wrong passwords rejected; existing project password accepted; 20 evidence entries; lock and reset close key');

  // Keyboard operation and mixed English/Arabic direction.
  await clickStep(0);
  await page.locator('#q1 input').first().focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#q1 input').first().isChecked(), true);
  assert.equal(await page.locator('#q1 .options .en').first().evaluate(el => getComputedStyle(el).direction), 'ltr');
  assert.equal(await page.locator('#q1 .feedback').evaluate(el => getComputedStyle(el).direction), 'rtl');
  pass('Keyboard and mixed-direction text', 'Space selects radio; English options LTR; Arabic feedback RTL');

  // Laptop, tablet-boundary and mobile rendering. Full-page screenshots are evidence, not CSS-only checks.
  for (const viewport of [{width:390,height:844},{width:320,height:740},{width:768,height:1024}]) {
    await page.setViewportSize(viewport);
    for (const item of pages) {
      await go(item.file);
      await noPageOverflow(`${item.short} ${viewport.width}`);
      if (item.panels.length) {
        for (let i=0;i<item.panels.length;i++) { await clickStep(i); await visiblePanel(item.panels[i]); await noPageOverflow(`${item.short} step ${i+1} at ${viewport.width}`); }
        await clickStep(0);
        assert.equal(await page.locator('.lesson-step-footer [data-prev]').isDisabled(), true);
        for (let i=1;i<item.panels.length;i++) { await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel(item.panels[i]); }
        await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel(item.panels[0]);
      }
      if (item.short === 'vocabulary') {
        const steps = await page.locator('.content-nav-links button').count();
        for (let i=0;i<steps;i++) { await clickStep(i); assert.equal(await page.locator('main > section.panel:visible').count(), 1); }
        await clickStep(0);
        for (let i=1;i<steps;i++) { await page.locator('.lesson-step-footer [data-next]').click(); assert.equal(await page.locator('main > section.panel:visible').count(), 1); }
        await clickStep(0);
      }
      if (item.short === 'test') {
        for (let i=1;i<20;i++) { await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel('q'+(i+1)); }
        await clickStep(0);
        await page.locator('#q1 input').first().check();
        await page.locator('#check-answers').click();
        assert.ok((await page.locator('#score').textContent()).includes('19'));
        await page.locator('#reset-test').click();
      }
      if (viewport.width < 540 && (item.short === 'pupil-book' || item.short === 'workbook')) {
        await clickStep(item.short === 'pupil-book' ? 2 : 4);
        const table = page.locator(item.short === 'pupil-book' ? '#pb-3 .table-scroll' : '#wb-5 .table-scroll');
        await table.scrollIntoViewIfNeeded();
        const sizes = await table.evaluate(el => ({client:el.clientWidth,scroll:el.scrollWidth}));
        assert.ok(sizes.scroll > sizes.client, 'Wide source table should scroll inside its own region');
        await table.evaluate(el => { el.scrollLeft = 0; });
        const zero = await table.evaluate(el => el.scrollLeft);
        await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
        const positive = await table.evaluate(el => el.scrollLeft);
        await table.evaluate(el => { el.scrollLeft = -el.scrollWidth; });
        const negative = await table.evaluate(el => el.scrollLeft);
        assert.ok(zero !== positive || zero !== negative, 'Table can reach both horizontal ends');
        await noPageOverflow(item.short + ' source table scroll');
        if (viewport.width === 390) await page.screenshot({ path: path.join(evidence, item.short+'-table-mobile-viewport.png'), timeout: 30000 });
        await clickStep(0);
      }
      if (viewport.width === 390) { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(evidence, `${item.short}-mobile-390.png`), fullPage: true, timeout: 30000 }); }
    }
  }
  pass('Responsive browser rendering', 'All five pages at 320×740, 390×844, 768×1024 and 1366×900; every book/vocabulary step checked; no page-level horizontal overflow');

  // Check return/menu links by actual clicks from each subpage.
  for (const section of ['pupil-book','workbook','vocabulary','test']) {
    await go(`${base}-${section}.html`);
    await page.locator('.top a.back').click();
    await page.waitForURL('**/lessons.html?grade=3');
    assert.equal(await lessonLink.count(), 1);
    await go(`${base}-${section}.html`);
    await page.locator('.footer a[href="grade3-unit1-lesson2.html"]').click();
    await page.waitForURL('**/grade3-unit1-lesson2.html');
  }
  pass('Return navigation under GitHub Pages project path', `All routes served below ${prefix}; each subpage returns to Grade 3 and lesson menu by click`);

  assert.deepEqual(errors, [], 'Browser errors or HTTP failures: '+JSON.stringify(errors));
  pass('Browser console and HTTP health', 'No JavaScript page errors or HTTP >=400 responses during tested routes');
  const report = { suite: 'grade3-unit1-lesson2-browser', status: 'PASS', date: new Date().toISOString(), browser: 'Chromium '+browser.version(), originPath: prefix, viewports: ['1366×900','768×1024','390×844','320×740'], checks, errors, screenshots: fs.readdirSync(evidence).filter(f=>f.endsWith('.png')) };
  fs.writeFileSync(path.join(evidence,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} catch (error) {
  fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({status:'FAIL',error:error.stack,checks,errors},null,2)+'\n');
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
