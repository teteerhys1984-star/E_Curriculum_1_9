import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = '/E_Curriculum_1_9/';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const errors = [];
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
let checks = 0;
const pass = (name, detail = '') => { checks++; console.log(`PASS ${name}${detail ? ` — ${detail}` : ''}`); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const decode = value => String(value).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const assertNoOverflow = async (page, label) => {
  const d = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(d.html <= d.viewport + 1 && d.body <= d.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(d)}`);
};
const derivePassword = lesson => {
  const source = read(`${lesson}.js`);
  const codes = source.match(/const expected = String\.fromCharCode\(([^)]+)\)/)?.[1];
  assert.ok(codes, `${lesson}.js: shared classroom gate implementation is present`);
  return String.fromCharCode(...codes.split(',').map(value => Number(value.trim())));
};

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
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push({ url: response.url(), status: response.status() }); });
  const go = async file => {
    const response = await page.goto(origin + file, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, `${file}: HTTP status`);
    await page.evaluate(() => document.fonts.ready);
  };
  const checkEnglishDirection = async file => {
    const result = await page.evaluate(() => {
      const rtlText = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
      const violations = [];
      let arabic = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (/^(SCRIPT|STYLE)$/.test(node.parentElement?.tagName || '') || !rtlText.test(node.nodeValue || '')) continue;
        arabic++;
        if (!node.parentElement?.closest('.ar[lang="ar"][dir="rtl"]')) violations.push('unmarked Arabic text');
      }
      for (const element of document.querySelectorAll('[dir], [lang]')) {
        if (element.hasAttribute('dir') && element.getAttribute('dir') !== 'ltr' && !element.matches('.ar[lang="ar"][dir="rtl"]')) violations.push(`${element.tagName}[dir]`);
        if (element.hasAttribute('lang') && element.getAttribute('lang') !== 'en' && !(element.matches('.ar[lang="ar"][dir="rtl"]'))) violations.push(`${element.tagName}[lang]`);
      }
      const badControls = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'))
        .filter(control => !control.labels?.length && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby') && !control.title)
        .map(control => `${control.tagName.toLowerCase()}#${control.id || '(no id)'}`);
      const unnamedImages = Array.from(document.querySelectorAll('img')).filter(img => !img.hasAttribute('alt')).map(img => img.src);
      return { lang: document.documentElement.lang, dir: document.documentElement.dir, arabic, violations, badControls, unnamedImages };
    });
    assert.equal(result.lang, 'en', `${file}: document language`);
    assert.equal(result.dir, 'ltr', `${file}: document direction`);
    assert.deepEqual(result.violations, [], `${file}: unexpected language/direction`);
    assert.deepEqual(result.badControls, [], `${file}: unlabeled form controls`);
    assert.deepEqual(result.unnamedImages, [], `${file}: images missing alt attributes`);
    if (file.includes('vocabulary')) assert.ok(result.arabic > 100, `${file}: Arabic glosses should be visible`);
    else assert.equal(result.arabic, 0, `${file}: Arabic belongs only on the Vocabulary page`);
  };
  const loadAllImages = async file => {
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(element => { element.open = true; });
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); })));
    const broken = await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.src));
    assert.deepEqual(broken, [], `${file}: broken source or activity images`);
    for (const details of await page.locator('details.source-page').all()) await details.evaluate(element => { element.open = false; });
  };
  const checkAllCorrect = async lesson => {
    const quiz = JSON.parse(read(`tests/${lesson}.quiz.json`));
    for (const question of quiz.questions) {
      await page.locator('.content-nav-links button').nth(question.number - 1).click();
      if (typeof question.correct === 'number') {
        await page.locator(`#${question.id} input[type="radio"][value="${question.correct}"]`).check();
      } else {
        await page.locator(`#${question.id} input[type="text"], #${question.id} textarea`).fill(question.accepted[0]);
      }
    }
    await page.locator('#check-answers').click();
    assert.match(await page.locator('#score').innerText(), new RegExp(`Score: ${quiz.totalQuestions} / ${quiz.totalQuestions}`), `${lesson}: full score`);
    assert.match(await page.locator('#score').innerText(), new RegExp(`Answered: ${quiz.totalQuestions} / ${quiz.totalQuestions}`), `${lesson}: answered count`);
    return quiz;
  };
  const checkQuizAndTeacherGate = async lesson => {
    const quiz = await checkAllCorrect(lesson);
    await page.reload({ waitUntil: 'networkidle' });
    assert.match(await page.locator('#score').innerText(), new RegExp(`Score: ${quiz.totalQuestions} / ${quiz.totalQuestions}`), `${lesson}: submitted score restores after reload`);
    assert.equal(await page.locator('#answer-guide').isVisible(), false, `${lesson}: teacher key starts hidden`);
    await page.locator('#teacher-password').fill('not-the-password');
    await page.locator('#unlock-solutions').click();
    assert.equal(await page.locator('#answer-guide').isVisible(), false, `${lesson}: wrong password keeps key hidden`);
    await page.locator('#teacher-password').fill(derivePassword(lesson));
    await page.locator('#teacher-password').press('Enter');
    assert.equal(await page.locator('#answer-guide').isVisible(), true, `${lesson}: correct password opens teacher key`);
    assert.equal(await page.locator('#teacher-key li').count(), quiz.totalQuestions, `${lesson}: key has one item per question`);
    const missingEvidence = await page.locator('#teacher-key li').evaluateAll(items => items.filter(item => item.querySelectorAll('p')[1]?.textContent.trim() === '').length);
    assert.equal(missingEvidence, 0, `${lesson}: each key item has evidence`);
    await page.locator('#lock-solutions').click();
    assert.equal(await page.locator('#answer-guide').isVisible(), false, `${lesson}: lock button closes teacher key`);
    await page.locator('#reset-test').click();
    await page.waitForTimeout(30);
    assert.equal((await page.locator('#score').innerText()).trim(), '', `${lesson}: reset clears score`);
    assert.equal(await page.locator('#answer-guide').isVisible(), false, `${lesson}: reset keeps teacher key closed`);
    const stored = await page.evaluate(lessonKey => localStorage.getItem(`${lessonKey}:test`), quiz.lesson);
    assert.equal(stored, null, `${lesson}: reset clears local test attempt`);
    await page.locator('.content-nav-links button').nth(0).click();
    const first = quiz.questions[0];
    const wrongValue = String(first.correct) === '0' ? '1' : '0';
    await page.locator(`#${first.id} input[type="radio"][value="${wrongValue}"]`).check();
    await page.locator('#check-answers').click();
    assert.match(await page.locator('#score').innerText(), /Score: 0 \/ 12/, `${lesson}: wrong answer and unanswered items do not receive credit`);
    assert.match(await page.locator('#score').innerText(), /Answered: 1 \/ 12/);
    await page.locator('#reset-test').click();
    await page.waitForTimeout(30);
    pass(`${lesson}: 12-question scoring, persistence, reset and key gate`, '12/12 restores; classroom key opens only after the matching passphrase; reset clears; 1 answered/11 blank scores zero');
  };

  // Directories and totals: grade counts, teacher links, and round-test inventory are reconciled.
  await go('index.html');
  assert.ok((await page.locator('.section-head#prepared-lessons').innerText()).includes('22 verified lessons · 110 pages'));
  // The homepage card must report every published Grade 4 lesson, not only the two this suite covers.
  assert.equal(await page.locator('#grades a.grade[data-curriculum-grade="4"] .grade-top .badge').innerText(), '6 lessons ready');
  assert.match(await page.locator('#grades').innerText(), /Unit 1 Lessons 1–6 ready: Nice to Meet You, My Family, Daily Routine, My House, School Subjects and Where I Live/);
  for (const lesson of [3, 4]) {
    const base = `grade4-unit1-lesson${lesson}`;
    for (const pageSlug of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) assert.equal(await page.locator(`a[href="${base}${pageSlug}.html"]`).count() >= 1, true, `index directory includes ${base}${pageSlug}`);
  }
  await go('teacher.html');
  assert.equal(await page.locator('.stat').nth(0).innerText(), '22\nPrepared lessons');
  assert.equal(await page.locator('.stat').nth(1).innerText(), '110\nVerified lesson pages');
  assert.equal(await page.locator('.stat').nth(2).innerText(), '21\nAnswer-key areas');
  assert.match(await page.locator('.grade[href="teacher-resources.html#grade-4"]').innerText(), /6 lessons prepared[\s\S]*30 verified pages/);
  await go('teacher-resources.html');
  assert.equal(await page.locator('.badge.badge-available').filter({ hasText: '22 lessons · 110 pages' }).count(), 1);
  for (const lesson of [3, 4]) {
    const row = page.locator(`#grade-4 .directory-lesson-row`).filter({ hasText: lesson === 3 ? 'Daily Routine' : 'My House' });
    assert.equal(await row.count(), 1, `Teacher resources list Grade 4 Lesson ${lesson}`);
    assert.equal(await row.locator('a').count(), 6, `Teacher resources links all six lesson and answer-key destinations for Lesson ${lesson}`);
  }
  pass('Index and teacher directories register both lessons; totals reconcile to 22 lessons, 110 pages and 21 key areas');

  await go('lessons.html?grade=4');
  assert.match(await page.locator('#grade-badges').innerText(), /6 prepared lessons available/);
  assert.match(await page.locator('#grade-summary').innerText(), /6 complete, source-verified/);
  assert.match(await page.locator('#round-copy').innerText(), /5 of 5 verified lessons[\s\S]*test has not been published/);
  assert.equal(await page.locator('#lesson-list a[href="grade4-unit1-lesson3.html"]').count(), 1);
  assert.equal(await page.locator('#lesson-list a[href="grade4-unit1-lesson4.html"]').count(), 1);
  assert.match(await page.locator('#lesson-list').innerText(), /Lesson 3 · Daily Routine[\s\S]*Lesson 4 · My House/);
  await go('lessons.html?grade=5');
  assert.match(await page.locator('#grade-badges').innerText(), /7 prepared lessons available/);
  assert.match(await page.locator('#round-copy').innerText(), /5 of 5 verified lessons/);
  assert.equal(await page.locator('#lesson-list a.lesson').count(), 7, 'Grade 5 count matches seven rendered lessons');
  pass('Grade menus display the real published counts and capped Round 1 coverage');

  await go('round-tests.html?grade=4');
  assert.match(await page.locator('#status-pills').innerText(), /5 of 5 Round 1 lessons covered/);
  assert.equal(await page.locator('#available-tests-links a').count(), 6, 'Grade 4 exposes six individual Lesson Tests');
  assert.equal(await page.locator('#available-tests-links a[href="grade4-unit1-lesson3-test.html"]').count(), 1);
  assert.equal(await page.locator('#available-tests-links a[href="grade4-unit1-lesson4-test.html"]').count(), 1);
  assert.match(await page.locator('#round-cards').innerText(), /Not published · 5\/5 lessons covered/);
  await go('round-tests.html?grade=5');
  assert.match(await page.locator('#status-pills').innerText(), /5 of 5 Round 1 lessons covered/);
  assert.equal(await page.locator('#available-tests-links a').count(), 7, 'Grade 5 exposes all seven individual Lesson Tests');
  assert.doesNotMatch(await page.locator('#status-pills').innerText(), /7 of 5/);
  await go('round-tests.html?grade=8');
  assert.equal(await page.locator('#available-tests-links a').count(), 4, 'Grade 8 exposes all four published lesson tests');
  pass('Round-test directory lists all published individual tests without claiming an unpublished cumulative test');

  const pageFiles = [
    'grade4-unit1-lesson3.html', 'grade4-unit1-lesson3-pupil-book.html', 'grade4-unit1-lesson3-workbook.html', 'grade4-unit1-lesson3-vocabulary.html', 'grade4-unit1-lesson3-test.html',
    'grade4-unit1-lesson4.html', 'grade4-unit1-lesson4-pupil-book.html', 'grade4-unit1-lesson4-workbook.html', 'grade4-unit1-lesson4-vocabulary.html', 'grade4-unit1-lesson4-test.html'
  ];
  for (const file of pageFiles) {
    await go(file);
    await checkEnglishDirection(file);
    const navLinks = await page.locator('.section-links a').evaluateAll(links => links.map(link => link.getAttribute('href')));
    assert.equal(navLinks.length, 5, `${file}: five shared lesson-section links`);
    for (const href of navLinks) {
      const response = await context.request.get(origin + href);
      assert.equal(response.status(), 200, `${file}: navigation target ${href}`);
    }
    if (file.includes('pupil-book') || file.includes('workbook')) {
      assert.ok(await page.locator('.content-nav-links button').count() >= 8, `${file}: shared step navigation generated`);
      await page.locator('.content-nav-links button').last().click();
      assert.match(await page.locator('.content-nav-count').innerText(), /PART \d+ \/ \d+/);
      await loadAllImages(file);
    }
    if (file.includes('vocabulary')) {
      const expected = file.includes('lesson3') ? 162 : 183;
      assert.equal(await page.locator('tr[data-entry-id]').count(), expected, `${file}: all audited terms render`);
      assert.equal(await page.locator('.ar[lang="ar"][dir="rtl"]').count(), expected, `${file}: one marked Arabic meaning per entry`);
      assert.equal(await page.locator('.content-nav-links button').count(), 4, `${file}: three category tables plus source-and-scope step`);
    }
    await assertNoOverflow(page, `${file} desktop`);
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(page, `${file} mobile 390px`);
    await page.setViewportSize({ width: 320, height: 740 });
    await assertNoOverflow(page, `${file} mobile 320px`);
    await page.setViewportSize({ width: 1366, height: 900 });
  }
  pass('All ten lesson pages render, navigate and remain responsive at 320px and 390px; all source images decode');

  // Lesson 3 clock drawing uses both the exact 12-hour hand positions and page-local draft storage.
  await go('grade4-unit1-lesson3-pupil-book.html');
  assert.equal(await page.locator('.l3-clock-item').count(), 4);
  await page.locator('.content-nav-links button').nth(8).click();
  await page.locator('#pb8-clock-1').fill('08:45');
  assert.equal(await page.locator('#pb8-clock-1').evaluate(input => input.closest('.l3-clock-item').querySelector('[data-hour-hand]').getAttribute('transform')), 'rotate(262.5 80 80)');
  assert.equal(await page.locator('#pb8-clock-1').evaluate(input => input.closest('.l3-clock-item').querySelector('[data-minute-hand]').getAttribute('transform')), 'rotate(270 80 80)');
  assert.equal(await page.locator('#pb8-clock-status-1').innerText(), 'Clock hands drawn for 8:45.');
  await page.locator('.content-nav-links button').nth(9).click();
  await page.locator('#pb9-face').fill('wash');
  const practiceStoreKey = await page.evaluate(() => Object.keys(localStorage).find(key => key.startsWith('efc_grade4_unit1_lesson3:practice:')));
  assert.ok(practiceStoreKey, 'Lesson 3 practice draft is saved under its lesson-scoped key');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#pb8-clock-1').inputValue(), '08:45');
  assert.equal(await page.locator('#pb8-clock-1').evaluate(input => input.closest('.l3-clock-item').querySelector('[data-hour-hand]').getAttribute('transform')), 'rotate(262.5 80 80)');
  assert.equal(await page.locator('#pb9-face').inputValue(), 'wash');
  await page.locator('#reset-book-practice').click();
  assert.equal(await page.locator('#pb8-clock-1').inputValue(), '');
  assert.equal(await page.locator('#pb8-clock-1').evaluate(input => input.closest('.l3-clock-item').querySelector('[data-hour-hand]').hasAttribute('transform')), false);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), practiceStoreKey), null, 'Lesson 3 page reset clears only its local practice draft');
  pass('Lesson 3 clock drawing, exact hand rotation, restore, accessible status and page reset');

  // Lesson 4 practice uses the same lesson-local storage contract without sharing Lesson 3 state.
  await go('grade4-unit1-lesson4-workbook.html');
  await page.locator('.content-nav-links button').nth(7).click();
  await page.locator('#wb8-1').fill('is');
  const l4PracticeKey = await page.evaluate(() => Object.keys(localStorage).find(key => key.startsWith('efc_grade4_unit1_lesson4:practice:')));
  assert.ok(l4PracticeKey, 'Lesson 4 practice draft has its own key');
  assert.notEqual(l4PracticeKey, practiceStoreKey, 'Lesson 3 and Lesson 4 practice storage are isolated');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#wb8-1').inputValue(), 'is');
  await page.locator('#reset-book-practice').click();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), l4PracticeKey), null, 'Lesson 4 practice reset clears its key');
  pass('Lesson 4 practice storage restores and resets independently');

  await go('grade4-unit1-lesson3-test.html');
  await checkQuizAndTeacherGate('grade4-unit1-lesson3');
  await go('grade4-unit1-lesson4-test.html');
  await checkQuizAndTeacherGate('grade4-unit1-lesson4');

  assert.deepEqual(errors, [], 'No JavaScript page errors or local HTTP failures');
  pass('Browser logs and local HTTP responses are clean', `${checks} browser check groups completed`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
