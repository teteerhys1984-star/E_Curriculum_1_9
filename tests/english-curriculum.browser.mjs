import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'test-results', 'english-curriculum');
fs.mkdirSync(evidenceDir, { recursive: true });
const prefix = '/E_Curriculum_1_9/';
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html')).sort();
const checks = [];
const errors = [];
const screenshots = [];
const pass = (name, detail) => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
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
  page.setDefaultTimeout(10000);
  // External web fonts are intentionally blocked in this offline smoke test; local
  // assets and the browser's font fallback are what the page can rely on here.
  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) errors.push({ url: response.url(), status: response.status() });
  });

  const auditRenderedLanguage = async file => page.evaluate(() => {
    const arabic = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
    const violations = [];
    let markedArabicTextNodes = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (/^(SCRIPT|STYLE)$/.test(node.parentElement?.tagName || '') || !arabic.test(node.nodeValue || '')) continue;
      if (node.parentElement?.closest('.ar[lang="ar"][dir="rtl"]')) markedArabicTextNodes++;
      else violations.push('unmarked Arabic text');
    }
    for (const element of document.querySelectorAll('*')) {
      for (const attribute of element.getAttributeNames()) {
        if (arabic.test(element.getAttribute(attribute) || '')) violations.push(`Arabic in ${element.tagName.toLowerCase()}[${attribute}]`);
      }
      const direction = element.getAttribute('dir');
      if (direction && direction !== 'ltr' && !(direction === 'rtl' && element.matches('.ar[lang="ar"][dir="rtl"]'))) violations.push(`unexpected dir=${direction}`);
      const computedDirection = getComputedStyle(element).direction;
      if (computedDirection !== 'ltr' && !(computedDirection === 'rtl' && element.closest('.ar[lang="ar"][dir="rtl"]'))) violations.push(`unexpected computed direction=${computedDirection}`);
      const language = element.getAttribute('lang');
      if (language && language !== 'en' && !(language === 'ar' && element.matches('.ar[dir="rtl"]'))) violations.push(`unexpected lang=${language}`);
    }
    const main = document.querySelector('main');
    return {
      rootLanguage: document.documentElement.lang,
      rootDirection: document.documentElement.dir,
      mainDirection: getComputedStyle(main || document.body).direction,
      markedArabicTextNodes,
      violations,
      widths: { viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }
    };
  });

  let imageCount = 0;
  const renderAt = async (file, viewport, checkImages = false) => {
    await page.setViewportSize(viewport);
    const response = await page.goto(origin + file, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200, `${file} at ${viewport.width}px`);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const language = await auditRenderedLanguage(file);
    assert.equal(language.rootLanguage, 'en', `${file}: root language`);
    assert.equal(language.rootDirection, 'ltr', `${file}: root direction`);
    assert.equal(language.mainDirection, 'ltr', `${file}: main direction`);
    assert.deepEqual(language.violations, [], `${file}: visible language/direction audit`);
    assert.ok(language.widths.document <= viewport.width + 1 && language.widths.body <= viewport.width + 1,
      `${file}: horizontal overflow at ${viewport.width}px (${JSON.stringify(language.widths)})`);
    if (viewport.width <= 760) {
      const nav = page.locator('.content-nav');
      if (await nav.count()) assert.equal(await nav.evaluate(element => getComputedStyle(element).position), 'static', `${file}: mobile navigator stays in normal flow`);
    }
    const isVocabulary = file.endsWith('-vocabulary.html');
    if (isVocabulary) {
      assert.ok(language.markedArabicTextNodes > 0, `${file}: expected word-level Arabic meanings`);
      const arabicFont = await page.evaluate(async () => {
        const sample = document.querySelector('.ar[lang="ar"][dir="rtl"]');
        const text = sample?.textContent.trim() || 'vocabulary';
        await document.fonts.load('16px "Noto Sans Arabic"', text);
        return { family: getComputedStyle(sample).fontFamily, loaded: document.fonts.check('16px "Noto Sans Arabic"', text) };
      });
      assert.match(arabicFont.family, /Noto Sans Arabic/, `${file}: local Arabic font family`);
      assert.equal(arabicFont.loaded, true, `${file}: local Arabic font loaded`);
    } else assert.equal(language.markedArabicTextNodes, 0, `${file}: no Arabic outside Vocabulary pages`);

    if (checkImages) {
      for (const details of await page.locator('details').all()) await details.evaluate(el => { el.open = true; });
      const images = page.locator('img');
      const broken = await images.evaluateAll(nodes => Promise.all(nodes.map(async image => {
        image.loading = 'eager';
        try { await image.decode(); } catch {}
        return image.complete && image.naturalWidth > 0 ? null : image.currentSrc || image.src;
      })).then(results => results.filter(Boolean)));
      assert.deepEqual(broken, [], `${file}: image decode failures`);
      imageCount += await images.count();
      const altless = await images.evaluateAll(nodes => nodes.filter(image => !image.hasAttribute('alt')).map(image => image.src));
      assert.deepEqual(altless, [], `${file}: image without alt text`);
      for (const details of await page.locator('details').all()) await details.evaluate(el => { el.open = false; });
    }
    return language;
  };

  assert.ok(htmlFiles.length > 0, 'No root HTML pages found');
  const desktopArabicNodes = new Map();
  for (const file of htmlFiles) {
    const result = await renderAt(file, { width: 1366, height: 900 }, true);
    desktopArabicNodes.set(file, result.markedArabicTextNodes);
  }
  pass('Rendered all root pages on desktop', `${htmlFiles.length} HTML pages loaded at 1366×900; root lang=en, dir=ltr; local Noto Sans Arabic verified on all ${htmlFiles.filter(file => file.endsWith('-vocabulary.html')).length} Vocabulary pages; no unmarked Arabic or horizontal overflow`);
  pass('Images and source disclosures', `${imageCount} rendered images decoded; all images have alt text; all disclosure images were opened during inspection`);

  for (const file of htmlFiles) {
    const result = await renderAt(file, { width: 390, height: 844 }, false);
    if (file.endsWith('-vocabulary.html')) assert.ok(result.markedArabicTextNodes > 0);
  }
  pass('Rendered all root pages on a mobile viewport', `${htmlFiles.length} HTML pages loaded at 390×844; mobile navigation stays in normal flow; no page-level horizontal overflow; Arabic remains restricted to marked vocabulary meanings`);

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(origin + 'grade8-unit1-lesson1-pupil-book.html', { waitUntil: 'domcontentloaded' });
  const grade8SpeakingText = await page.locator('body').innerText();
  for (const text of ['Look at the photos above. What can you see?', 'Which of them refers to', 'In pairs, tell your partner which school in the photos you prefer and why.']) {
    assert.ok(grade8SpeakingText.includes(text), `Grade 8 Student’s Book photo task missing: ${text}`);
  }
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-students-book-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-students-book-desktop.png');
  await page.locator('.content-nav-links button').filter({ hasText: 'Key Words' }).click();
  assert.ok((await page.locator('body').innerText()).includes('Key Words'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-students-book-key-words-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-students-book-key-words-desktop.png');
  await page.locator('.content-nav-links button').filter({ hasText: 'Grammar: Revision of tenses' }).click();
  assert.ok((await page.locator('body').innerText()).includes('Underline the simple present'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-students-book-grammar-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-students-book-grammar-desktop.png');
  await page.locator('.content-nav-links button').filter({ hasText: 'Listening' }).click();
  assert.ok((await page.locator('body').innerText()).includes('official audio recording, which is unavailable'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-students-book-listening-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-students-book-listening-desktop.png');

  await page.goto(origin + 'grade8-unit1-lesson1-vocabulary.html', { waitUntil: 'domcontentloaded' });
  assert.ok((await page.locator('body').innerText()).includes('Arabic meaning'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-vocabulary-table-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-vocabulary-table-desktop.png');
  await page.locator('.content-nav-links button').filter({ hasText: 'Grammar 1' }).click();
  assert.ok((await page.locator('body').innerText()).includes('We use the present simple'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-vocabulary-grammar-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-vocabulary-grammar-desktop.png');
  await page.locator('.content-nav-links button').filter({ hasText: 'Grammar 2' }).click();
  assert.ok((await page.locator('body').innerText()).includes('We use the present progressive'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-vocabulary-present-progressive-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-vocabulary-present-progressive-desktop.png');
  await page.locator('.content-nav-links button').filter({ hasText: 'Grammar 3' }).click();
  assert.ok((await page.locator('body').innerText()).includes('Use will for decisions'));
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-vocabulary-future-tense-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-vocabulary-future-tense-desktop.png');

  await page.goto(origin + 'grade5-unit1-lesson1-pupil-book.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.content-nav-links button').filter({ hasText: 'School rules' }).click();
  const grade5GrammarText = await page.locator('body').innerText();
  assert.match(grade5GrammarText, /don’t have to.*not necessary/s);
  assert.match(grade5GrammarText, /does not mean “must not”/);
  await page.screenshot({ path: path.join(evidenceDir, 'grade5-pupil-book-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade5-pupil-book-desktop.png');

  const assessmentCases = [
    { file: 'grade4-unit1-lesson2-test.html', submit: '#check-answers', result: '#score', hiddenKey: '#answer-guide' },
    { file: 'grade3-unit1-lesson1-test.html', submit: '#check', result: '#result', hiddenKey: '#answer-guide' },
    { file: 'grade4-unit1-lesson1-test.html', submit: 'button[type="submit"]', result: '#score' },
    { file: 'grade5-unit1-lesson1-test.html', submit: '#check', result: '#score', hiddenKey: '#answer-key' },
    { file: 'grade5-unit1-lesson2-test.html', submit: '#check', result: '#score', hiddenKey: '#key' },
    { file: 'grade8-unit1-lesson1-test.html', submit: '#check', result: '#score', hiddenKey: '#key' }
  ];
  for (const test of assessmentCases) {
    await page.goto(origin + test.file, { waitUntil: 'domcontentloaded' });
    const radioGroups = await page.locator('input[type="radio"]').evaluateAll(nodes => [...new Set(nodes.map(node => node.name))]);
    assert.ok(radioGroups.length > 0, `${test.file}: assessment choices rendered`);
    const questionNav = page.locator('.content-nav-links button');
    if (await questionNav.count() > 1) {
      for (let index = 0; index < await questionNav.count(); index++) {
        await questionNav.nth(index).click();
        const visibleChoices = page.locator('input[type="radio"]:visible');
        if (await visibleChoices.count() > 0) await visibleChoices.first().check();
      }
    } else {
      for (const name of radioGroups) {
        const choice = page.locator(`input[type="radio"][name="${name}"]:visible`).first();
        assert.ok(await choice.count() > 0, `${test.file}: radio group ${name} is visible`);
        await choice.check();
      }
    }
    const selectedGroups = await page.locator('input[type="radio"]:checked').evaluateAll(nodes => new Set(nodes.map(node => node.name)).size);
    assert.equal(selectedGroups, radioGroups.length, `${test.file}: one option selected in every multiple-choice question`);
    if (test.hiddenKey) assert.equal(await page.locator(test.hiddenKey).isVisible(), false, `${test.file}: teacher answers initially hidden`);
    await page.locator(test.submit).click();
    assert.ok((await page.locator(test.result).innerText()).trim().length > 0, `${test.file}: scoring feedback rendered`);
    if (test.hiddenKey) assert.equal(await page.locator(test.hiddenKey).isVisible(), false, `${test.file}: scoring does not unlock teacher answers`);
  }
  pass('Legacy assessment scoring and teacher-key gates', `Selected one option in every multiple-choice group across ${assessmentCases.length} quizzes; each produced scoring feedback and kept teacher answers hidden`);

  await page.goto(origin + 'grade3-unit1-lesson2-workbook.html', { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('img[src$="workbook-page-6-listen-row-2-english-display.png"]').count(), 1);
  assert.equal(await page.locator('img[src$="workbook-page-6-listen-row-2.png"]').count(), 0);
  assert.equal(await page.locator('img[src$="workbook-page-6-listen-and-tick.png"]').count(), 0);
  assert.equal(await page.locator('img[src$="source/workbook-page-6.png"]').count(), 0);
  await page.screenshot({ path: path.join(evidenceDir, 'grade3-workbook-display-desktop.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade3-workbook-display-desktop.png');
  pass('Workbook source-image exception', 'The English-normalised item-2 display is rendered; the original scan, full activity crop, and original item crop are not rendered.');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + 'grade8-unit1-lesson1-pupil-book.html', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(evidenceDir, 'grade8-students-book-mobile-390.png'), fullPage: true, timeout: 30000 });
  screenshots.push('grade8-students-book-mobile-390.png');

  assert.deepEqual(errors, [], `Browser errors and local HTTP failures: ${JSON.stringify(errors)}`);
  pass('Targeted Grade 8 and Grade 5 content verification', 'Grade 8 photo, vocabulary, grammar, and audio notes rendered; Grade 5 “don’t have to” remains unnecessary, not forbidden');
  pass('Local browser console and HTTP health', 'No JavaScript page errors or local HTTP >=400 responses across the audit');
  const report = {
    suite: 'full-curriculum-english-browser-audit', status: 'PASS', date: new Date().toISOString(),
    browser: `Chromium ${browser.version()}`, projectPath: prefix, pages: htmlFiles,
    pageCount: htmlFiles.length, viewports: ['1366×900','390×844'], decodedImages: imageCount,
    vocabularyPagesWithMarkedArabicMeanings: [...desktopArabicNodes.entries()].filter(([file,count]) => file.endsWith('-vocabulary.html') && count > 0).map(([file]) => file),
    checks, errors, screenshots
  };
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  fs.writeFileSync(path.join(evidenceDir, 'failure.json'), JSON.stringify({ status: 'FAIL', error: error.stack, checks, errors }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
