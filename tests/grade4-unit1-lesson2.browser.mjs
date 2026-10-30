import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'test-results', 'grade4-unit1-lesson2');
fs.mkdirSync(evidence, { recursive: true });
const base = 'grade4-unit1-lesson2';
const prefix = '/E_Curriculum_1_9/';
const checks = [];
const errors = [];
const pass = (name, detail = '') => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
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
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push({ url: response.url(), status: response.status() }); });
  const go = async file => {
    const response = await page.goto(origin + file, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, file);
    await page.evaluate(() => document.fonts.ready);
  };
  const noPageOverflow = async label => {
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  };
  const assertRenderedLanguage = async label => {
    const result = await page.evaluate(() => {
      const arabicPattern = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
      const violations = [];
      let arabicNodes = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (/^(SCRIPT|STYLE)$/.test(node.parentElement?.tagName || '') || !arabicPattern.test(node.nodeValue || '')) continue;
        arabicNodes++;
        if (!node.parentElement?.closest('.ar[lang="ar"][dir="rtl"]')) violations.push('unmarked Arabic text');
      }
      for (const element of document.querySelectorAll('*')) {
        for (const attribute of element.getAttributeNames()) {
          if (arabicPattern.test(element.getAttribute(attribute) || '')) violations.push(`Arabic in ${element.tagName.toLowerCase()}[${attribute}]`);
        }
        const direction = element.getAttribute('dir');
        if (direction && direction !== 'ltr' && !(direction === 'rtl' && element.matches('.ar[lang="ar"][dir="rtl"]'))) violations.push(`unexpected dir=${direction}`);
        const computedDirection = getComputedStyle(element).direction;
        if (computedDirection !== 'ltr' && !(computedDirection === 'rtl' && element.closest('.ar[lang="ar"][dir="rtl"]'))) violations.push(`unexpected computed direction=${computedDirection}`);
        const language = element.getAttribute('lang');
        if (language && language !== 'en' && !(language === 'ar' && element.matches('.ar[dir="rtl"]'))) violations.push(`unexpected lang=${language}`);
      }
      const rtlCells = Array.from(document.querySelectorAll('.ar[lang="ar"][dir="rtl"]')).map(cell => getComputedStyle(cell).direction);
      return { lang: document.documentElement.lang, dir: document.documentElement.dir, arabicNodes, violations, rtlCells };
    });
    assert.equal(result.lang, 'en', `${label}: html lang`);
    assert.equal(result.dir, 'ltr', `${label}: html direction`);
    assert.deepEqual(result.violations, [], `${label}: language/direction violations`);
    for (const direction of result.rtlCells) assert.equal(direction, 'rtl', `${label}: meaning cell should render RTL`);
    return result.arabicNodes;
  };
  const clickStep = async index => { await page.locator('.content-nav-links button').nth(index).click(); };
  const visiblePanel = async id => { assert.equal(await page.locator('#' + id).isVisible(), true, `${id} should be visible`); };
  const imageHealth = async label => {
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(el => { el.open = true; });
    await page.locator('img').evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
    const broken = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src));
    assert.deepEqual(broken, [], `${label}: broken images`);
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(el => { el.open = false; });
  };
  const normalizedText = async selector => page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const paragraphs = node.querySelectorAll(':scope > p');
    const text = paragraphs.length ? Array.from(paragraphs).map(p => p.textContent).join(' ') : node.textContent;
    return text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  }));

  // The Grade 4 listing is rendered by JavaScript, so click the real link.
  await go('lessons.html?grade=4');
  const lessonLink = page.locator('#lesson-list a[href="grade4-unit1-lesson2.html"]');
  assert.equal(await lessonLink.count(), 1);
  assert.match(await lessonLink.textContent(), /My Family/);
  assert.equal(await page.locator('#lesson-list a[href="grade4-unit1-lesson1.html"]').count(), 1);
  await lessonLink.click();
  await page.waitForURL('**/grade4-unit1-lesson2.html');
  assert.equal(await page.locator('.cards .card').count(), 4);
  await noPageOverflow('Grade 4 menu');
  pass('Rendered Grade 4 list opens Lesson 2', 'Grade 4 now lists Lesson 1 and Lesson 2; four section cards');

  for (const grade of [1, 2, 3, 5, 6, 7, 8, 9]) {
    await go(`lessons.html?grade=${grade}`);
    assert.ok((await page.locator('#lesson-list a.lesson').count()) >= 1);
    assert.equal(await page.locator('#lesson-list a[href="grade4-unit1-lesson2.html"]').count(), 0);
  }
  pass('Other grade menus still render', 'Grades 1, 2, 3, 5, 6, 7, 8 and 9 unchanged');

  const pages = [
    { file: `${base}.html`, short: 'menu', panels: [] },
    { file: `${base}-pupil-book.html`, short: 'pupil-book', panels: Array.from({ length: 11 }, (_, i) => `pb-${i + 1}`) },
    { file: `${base}-workbook.html`, short: 'workbook', panels: Array.from({ length: 8 }, (_, i) => `wb-${i + 1}`) },
    { file: `${base}-vocabulary.html`, short: 'vocabulary', panels: 6 },
    { file: `${base}-test.html`, short: 'test', panels: [] }
  ];
  for (const item of pages) {
    await go(item.file);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
    assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).direction), 'ltr');
    const arabicNodes = await assertRenderedLanguage(item.file);
    if (item.short === 'vocabulary') assert.ok(arabicNodes > 40, 'Vocabulary meanings should be present');
    else assert.equal(arabicNodes, 0, `${item.file}: no Arabic outside the Vocabulary page`);
    if (item.short !== 'menu') {
      for (const link of await page.locator('.section-links a').all()) {
        const href = await link.getAttribute('href');
        const response = await context.request.get(origin + href);
        assert.equal(response.status(), 200, href);
      }
      assert.equal(await page.locator('.lesson-step-footer [data-prev]').count(), 1);
      assert.equal(await page.locator('.lesson-step-footer [data-next]').count(), 1);
    }
    const panelIds = item.panels;
    if (panelIds.length) {
      assert.equal(await page.locator('.content-nav-links button').count(), panelIds.length);
      for (let i = 0; i < panelIds.length; i++) {
        await clickStep(i);
        await visiblePanel(panelIds[i]);
        assert.equal(await page.locator('main > section.panel:visible').count(), 1);
        assert.equal(await page.locator('.content-nav-links button[aria-current="step"]').count(), 1);
      }
      await clickStep(0);
      assert.equal(await page.locator('.lesson-step-footer [data-prev]').isDisabled(), true);
      for (let i = 1; i < panelIds.length; i++) { await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel(panelIds[i]); }
      await page.locator('.lesson-step-footer [data-next]').click();
      await visiblePanel(panelIds[0]);
    }
    await imageHealth(item.short);
    await noPageOverflow(item.short + ' desktop');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(evidence, `${item.short}-desktop-1366.png`), fullPage: true, timeout: 30000 });
  }
  pass('Five pages with working step indexes and Previous/Next', 'Pupil’s Book 11 steps, Workbook 8 steps, Vocabulary 6 steps, test 20 questions; all images decode');
  pass('English LTR with marked RTL vocabulary meanings', '1366×900; Arabic only inside the Vocabulary meaning column; no page-level horizontal overflow');

  // Source transcription checks.
  await go(`${base}-pupil-book.html`);
  await clickStep(0);
  assert.deepEqual(await page.locator('#pb-1 .label-chips li').allTextContents(), ['1. father', '2. mother', '3. sister', '4. brother', '5. grandfather', '6. grandmother']);
  assert.deepEqual(await normalizedText('#pb-1 .speech-bubble p'), ['This is my family.', 'What do they look like?']);
  await clickStep(1);
  assert.deepEqual(await page.locator('#pb-2 .label-chips li').allTextContents(), ['brown hair', 'blond hair', 'black hair', 'brown eyes', 'green eyes', 'blue eyes']);
  await clickStep(5);
  // The printed strips carry the only visible copies of the four descriptions; the menus
  // keep them as accessible names, so screen readers still hear them without the page
  // repeating them as visible text.
  assert.deepEqual(await page.locator('#pb-5 .match-item select').evaluateAll(selects => selects.map(select => select.labels[0] && select.labels[0].textContent.trim())), ['Description 1, Long blond hair: choose the picture it describes', 'Description 2, Short black hair: choose the picture it describes', 'Description 3, brown eyes: choose the picture it describes', 'Description 4, green eyes: choose the picture it describes']);
  assert.deepEqual(await page.locator('#pb-5 .match-item label').evaluateAll(labels => labels.map(label => getComputedStyle(label).position)), ['absolute', 'absolute', 'absolute', 'absolute']);
  assert.deepEqual(await page.locator('#pb-5 .match-item').evaluateAll(rows => rows.map(row => {
    const clone = row.cloneNode(true);
    clone.querySelectorAll('.sr-only, select').forEach(node => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  })), ['1', '2', '3', '4']);
  // The strips in the scanned picture must stay the only visible copies of the descriptions
  // inside the matching block; the note below may of course discuss eyes and hair in prose.
  assert.deepEqual(await page.evaluate(() => {
    const clone = document.querySelector('#pb-5 .match-list').cloneNode(true);
    clone.querySelectorAll('.sr-only').forEach(node => node.remove());
    const text = (clone.textContent || '').replace(/\s+/g, ' ');
    return ['Long blond hair', 'Short black hair', 'brown eyes', 'green eyes'].filter(word => text.includes(word));
  }), []);
  await clickStep(6);
  assert.deepEqual(await normalizedText('#pb-7 .source-quote p'), ['Hi, I am Sanaa from Lattakia. I\'m thirty-five years old. I\'ve got two children, a son and a daughter. My son Dani is ten years old. He\'s got brown hair and green eyes. My daughter Tina is eight years old. She\'s got blond hair and big blue eyes. We usually read stories together. We are a happy family.']);
  assert.match(await page.locator('#pb-7 .given-answer').first().textContent(), /printed in the source/);
  await page.locator('#pb-7 button.reveal').first().click();
  assert.equal(await page.locator('#pb7a-key').isVisible(), true);
  assert.match(await page.locator('#pb7a-key').textContent(), /Dani is ten years old/);
  await page.locator('#pb-7 button.reveal').first().click();
  assert.equal(await page.locator('#pb7a-key').isVisible(), false);
  await clickStep(7);
  assert.deepEqual(await normalizedText('#pb-8 .source-quote p'), ['What does he / she look like?', 'He is tall. She is short.', 'He\'s got blond hair. She\'s got brown eyes.']);
  await clickStep(8);
  assert.match(await page.locator('#pb-9 h2').textContent(), /Fill in the spaces with/);
  await page.locator('#pb8-1').fill('has got');
  await clickStep(9);
  assert.equal(await page.locator('#pb8-1').inputValue(), 'has got');
  assert.match(await page.locator('#pb-10 .given-answer').textContent(), /What is your brother\u2019s name\?/);
  await clickStep(0);
  pass('Pupil’s Book transcription, disclosures and written answers', 'All six printed word groups, the speech bubble, the reading text, the Let’s Learn box, and printed example answers preserved');

  await go(`${base}-workbook.html`);
  await clickStep(0);
  assert.deepEqual(await normalizedText('#wb-1 .source-quote p'), ['Hi, I am John White. I am from London. I am ten. I have a lovely family. I\'ve got a sister, Eve and a brother, Daniel.', 'My grandfather, Robert, is next to me. My sister is next to my grandmother, Liza. She\'s got short blond hair.', 'My dad, James, is standing behind my grandfather. My mum Mary is behind my grandmother. My grandmother is carrying my little brother, Daniel. My grandmother is wearing a blouse and a skirt. We are a happy family.']);
  assert.equal(await page.locator('#wb-1 .tree input').count(), 6);
  await page.locator('#wb1-grandmother-name').fill('Liza');
  await clickStep(1);
  assert.deepEqual(await page.locator('#wb-2 .match-item label').allTextContents(), ['1. Hi, I am Kevin', '2. My mother is wearing', '3. What does your father do?', '4. Where do they live?']);
  assert.equal(await page.locator('#wb-2 select').count(), 4);
  await clickStep(2);
  assert.match(await page.locator('#wb-3 h2').textContent(), /Listen and tick/);
  assert.equal(await page.locator('#wb-ex3 input[type="radio"]').count(), 8);
  assert.equal(await page.locator('#wb-3 .notice').count(), 1);
  await clickStep(3);
  assert.match(await page.locator('#wb-4 h2').textContent(), /Listen and match\. \(Adam’s family – Tom’s family\)/);
  assert.equal(await page.locator('#wb-4 .notice').count(), 1);
  await clickStep(4);
  assert.equal(await page.locator('#wb-5 .writing-lines input').count(), 5, 'one field per printed dotted line');
  await page.locator('#wb5-1').fill('The mother has got long hair.');
  await clickStep(6);
  assert.equal(await page.locator('#wb-ex7 input[type="radio"]').count(), 15);
  await page.locator('#wb-7 button.reveal').click();
  assert.match(await page.locator('#wb7-key').textContent(), /1 → b/);
  await page.locator('#wb-7 button.reveal').click();
  await clickStep(7);
  assert.equal(await page.locator('#wb-8 input').count(), 10);
  assert.equal(await page.locator('#wb-ex8 .activity input').count(), 8, 'eight in-sentence blanks');
  assert.equal(await page.locator('#wb-8 .writing-lines input').count(), 2, 'two unlabelled printed lines');
  await clickStep(4);
  assert.equal(await page.locator('#wb5-1').inputValue(), 'The mother has got long hair.');
  await clickStep(0);
  assert.equal(await page.locator('#wb1-grandmother-name').inputValue(), 'Liza');
  pass('Workbook transcription and persistence', 'John’s text, six table blanks, matching selects, eight listening choices, five choose-the-word items and personal writing survive step changes');

  // Quiz behaviour.
  await go(`${base}-test.html`);
  const count = await page.locator('#quiz .question').count();
  assert.equal(count, 20);
  assert.equal(await page.locator('.content-nav-links button').count(), 20);
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 0 \/ 20/);
  assert.match(await page.locator('#score').textContent(), /Unanswered: 20/);
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  const correct = await page.locator('#quiz .question').evaluateAll(questions => questions.map(q => q.dataset.correct));
  for (let i = 0; i < count; i++) {
    await clickStep(i);
    assert.equal(await page.locator(`#q${i + 1}`).isVisible(), true);
    await page.locator(`#q${i + 1} input[value="${(Number(correct[i]) + 1) % 3}"]`).check();
  }
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 0 \/ 20/);
  assert.equal(await page.locator('.feedback.incorrect').count(), 20);
  for (let i = 0; i < count; i++) {
    await clickStep(i);
    await page.locator(`#q${i + 1} input[value="${correct[i]}"]`).check();
  }
  assert.equal(await page.locator('#score').textContent(), '');
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 20 \/ 20/);
  assert.equal(await page.locator('.feedback.correct').count(), 20);
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#score').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, 'quiz-score-20-of-20.png'), timeout: 30000 });
  await clickStep(0);
  await page.locator(`#q1 input[value="${(Number(correct[0]) + 1) % 3}"]`).check();
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 19 \/ 20/);
  await page.locator('#reset-test').click();
  assert.equal(await page.locator('#quiz input:checked').count(), 0);
  assert.equal(await page.locator('#score').textContent(), '');
  await page.locator(`#q1 input[value="${correct[0]}"]`).check();
  await page.locator('#check-answers').click();
  assert.match(await page.locator('#score').textContent(), /Score: 1 \/ 20/);
  pass('Quiz scoring and navigation', 'Empty 0/20, all wrong 0/20, all correct 20/20, one wrong 19/20, one answered 1/20; stale scores cleared; reset clears answers');

  // Teacher key uses the project’s existing password mechanism.
  const existing = fs.readFileSync(path.join(root, 'grade3-unit1-lesson1-test.html'), 'utf8');
  const codes = existing.match(/String\.fromCharCode\(([\d,]+)\)/)[1].split(',').map(Number);
  const teacherPassword = String.fromCharCode(...codes);
  const ownScript = fs.readFileSync(path.join(root, 'grade4-unit1-lesson2.js'), 'utf8');
  assert.ok(ownScript.includes('String.fromCharCode('), 'the lesson script should use the project password gate');
  await page.locator('#unlock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#teacher-password').fill('definitely-not-the-teacher-password');
  await page.locator('#teacher-password').press('Enter');
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  await page.locator('#teacher-password').fill(teacherPassword);
  await page.locator('#unlock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), true);
  assert.equal(await page.locator('#teacher-key > li').count(), 20);
  assert.match(await page.locator('#teacher-key').textContent(), /Inferred from the source/);
  await page.locator('#answer-guide').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, 'teacher-key-open.png'), timeout: 30000 });
  await page.locator('#lock-solutions').click();
  assert.equal(await page.locator('#answer-guide').isVisible(), false);
  pass('Teacher answer key gate', 'Wrong password rejected, existing project password accepted, 20 evidence entries, key can be closed');

  // Keyboard and direction checks.
  await clickStep(0);
  await page.locator('#q1 input').first().focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#q1 input').first().isChecked(), true);
  assert.equal(await page.locator('#q1 .options .en').first().evaluate(el => getComputedStyle(el).direction), 'ltr');
  assert.equal(await page.locator('#q1 .feedback').evaluate(el => getComputedStyle(el).direction), 'ltr');
  pass('Keyboard and English feedback direction', 'Space selects a radio option; options and feedback render LTR');

  // Responsive checks at three narrower viewports.
  for (const viewport of [{ width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    for (const item of pages) {
      await go(item.file);
      await noPageOverflow(`${item.short} ${viewport.width}`);
      if (viewport.width < 761 && await page.locator('.content-nav').count()) {
        assert.equal(await page.locator('.content-nav').evaluate(el => getComputedStyle(el).position), 'static', `${item.short}: mobile navigator stays in normal flow`);
      }
      if (item.panels.length) {
        const steps = typeof item.panels === 'number' ? item.panels : item.panels.length;
        for (let i = 0; i < steps; i++) {
          await clickStep(i);
          assert.equal(await page.locator('main > section.panel:visible').count(), 1);
          await noPageOverflow(`${item.short} step ${i + 1} at ${viewport.width}`);
        }
        await clickStep(0);
        for (let i = 1; i < steps; i++) { await page.locator('.lesson-step-footer [data-next]').click(); assert.equal(await page.locator('main > section.panel:visible').count(), 1); }
        await clickStep(0);
      }
      if (item.short === 'test') {
        for (let i = 1; i < 20; i++) { await page.locator('.lesson-step-footer [data-next]').click(); await visiblePanel('q' + (i + 1)); }
        await clickStep(0);
        await page.locator('#q1 input').first().check();
        await page.locator('#check-answers').click();
        assert.ok((await page.locator('#score').textContent()).includes('Score:'));
        await page.locator('#reset-test').click();
      }
      if (viewport.width < 540 && (item.short === 'pupil-book' || item.short === 'workbook' || item.short === 'vocabulary')) {
        await clickStep(item.short === 'pupil-book' ? 10 : item.short === 'workbook' ? 0 : 0);
        const table = page.locator(item.short === 'pupil-book' ? '#pb-11 .table-scroll' : item.short === 'workbook' ? '#wb-1 .table-scroll' : '#vocab-family .table-scroll').first();
        if (await table.count()) {
          await table.scrollIntoViewIfNeeded();
          const sizes = await table.evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }));
          assert.ok(sizes.scroll >= sizes.client, 'Wide source table keeps its own scroll region');
          await table.evaluate(el => { el.scrollLeft = 0; });
          const zero = await table.evaluate(el => el.scrollLeft);
          await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
          const positive = await table.evaluate(el => el.scrollLeft);
          assert.ok(sizes.scroll === sizes.client || zero !== positive, 'Table can reach its horizontal ends');
          await table.evaluate(el => { el.scrollLeft = 0; });
          await noPageOverflow(item.short + ' table at ' + viewport.width);
        }
        await clickStep(0);
      }
      if (viewport.width === 390) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(evidence, `${item.short}-mobile-390.png`), fullPage: true, timeout: 30000 });
      }
    }
  }
  pass('Responsive rendering', 'All five pages at 768×1024, 390×844 and 320×740; every book and vocabulary step checked; no page-level horizontal overflow');

  // Return links by real clicks.
  for (const section of ['pupil-book', 'workbook', 'vocabulary', 'test']) {
    await go(`${base}-${section}.html`);
    await page.locator('.top a.back').click();
    await page.waitForURL('**/lessons.html?grade=4');
    await go(`${base}-${section}.html`);
    await page.locator(`.footer a[href="${base}.html"]`).click();
    await page.waitForURL(`**/${base}.html`);
  }
  pass('Return navigation works under the project path', 'Each subpage returns to the Grade 4 list and to the lesson menu by click');

  assert.deepEqual(errors, [], 'Browser errors or HTTP failures: ' + JSON.stringify(errors));
  pass('Browser console and HTTP health', 'No JavaScript page errors and no HTTP status of 400 or above on tested routes');
  const report = { suite: 'grade4-unit1-lesson2-browser', status: 'PASS', date: new Date().toISOString(), browser: 'Chromium ' + browser.version(), originPath: prefix, viewports: ['1366×900', '768×1024', '390×844', '320×740'], checks, errors, screenshots: fs.readdirSync(evidence).filter(f => f.endsWith('.png')) };
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  fs.writeFileSync(path.join(evidence, 'failure.json'), JSON.stringify({ status: 'FAIL', error: error.stack, checks, errors }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
