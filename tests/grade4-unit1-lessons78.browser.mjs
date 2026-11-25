import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { curriculumTotals } from './curriculum-totals.shared.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = '/E_Curriculum_1_9/';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
  const file = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${prefix}`;
let browser;
let checks = 0;
const errors = [];
const check = (ok, message) => { assert.ok(ok, message); checks++; };

try {
  let options = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  else {
    const pkg = require('@sparticuz/chromium');
    const bundle = pkg.default;
    const directory = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
    const libs = await pkg.inflate(path.join(directory, 'bin', 'al2023.tar.br'));
    pkg.setupLambdaEnvironment(path.join(libs, 'lib'));
    options = { ...options, executablePath: await bundle.executablePath(), args: bundle.args };
  }
  browser = await chromium.launch(options);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  for (const lesson of [7, 8]) {
    const base = `grade4-unit1-lesson${lesson}`;
    for (const suffix of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) {
      const file = `${base}${suffix}.html`;
      const response = await page.goto(origin + file, { waitUntil: 'networkidle' });
      check(response.status() === 200, `${file}: responds`);
      check(await page.locator('html[lang="en"][dir="ltr"]').count() === 1, `${file}: English LTR root`);
      if (suffix !== '') check(await page.locator('.section-links a').count() === 5, `${file}: five lesson links`);
      else check(await page.locator('.grid-cards a').count() === 4, `${file}: four section cards`);
      for (const width of [390, 320, 1366]) {
        await page.setViewportSize({ width, height: 850 });
        const metrics = await page.evaluate(() => ({ inner: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
        check(metrics.doc <= metrics.inner + 1 && metrics.body <= metrics.inner + 1, `${file}: no overflow at ${width}px (${JSON.stringify(metrics)})`);
      }

      if (suffix.includes('pupil-book') || suffix.includes('-workbook')) {
        const scans = page.locator('img.source-scan');
        check(await scans.count() === 3, `${file}: three source scans`);
        for (const image of await scans.all()) {
          check(await image.evaluate(node => node.complete && node.naturalWidth > 0), `${file}: scan decodes`);
          check(Boolean(await image.getAttribute('alt')), `${file}: scan has alt text`);
        }
        check(await page.locator('.source-transcription pre').count() === 3, `${file}: one transcription per scan`);
        check(await page.locator('.content-nav-links button').count() > 0, `${file}: shared step index`);

        const groups = await page.evaluate(() => [...document.querySelectorAll('[data-writing-activity]')].map(group => ({
          id: group.dataset.writingActivity,
          resets: group.querySelectorAll('[data-writing-reset]').length,
          fields: group.querySelectorAll('[data-writing-input]').length,
          models: group.querySelectorAll('details[data-student-model]').length,
          exceptions: group.querySelectorAll('[data-writing-exception]').length,
          modelTitle: group.querySelector('details[data-student-model] summary')?.textContent || ''
        })));
        if (groups.length) {
          for (const group of groups) {
            check(group.resets === 1 && group.fields > 0, `${file} ${group.id}: one reset and response fields`);
            if (group.exceptions) check(group.models === 0, `${file} ${group.id}: disclosed exception has no model`);
            else check(group.models === 1 && /infer|illustrat|printed model|comparison/i.test(group.modelTitle), `${file} ${group.id}: labelled model`);
          }
          const navigateToGroup = async id => {
            const index = await page.evaluate(activityId => {
              const group = document.querySelector(`[data-writing-activity="${activityId}"]`);
              const panel = group?.closest('section.panel');
              return [...document.querySelectorAll('main.wrap section.panel')].indexOf(panel);
            }, id);
            if (index >= 0) await page.locator('.content-nav-links button').nth(index).click();
          };
          const first = groups[0];
          await navigateToGroup(first.id);
          const firstInput = page.locator(`[data-writing-activity="${first.id}"] [data-writing-input]`).first();
          await firstInput.fill('saved by the lesson 78 browser test');
          const writingKey = await page.evaluate(id => Object.keys(localStorage).find(key => key.endsWith(`:writing:${id}`)), first.id);
          check(Boolean(writingKey), `${file} ${first.id}: draft saved locally`);
          await page.reload({ waitUntil: 'networkidle' });
          await navigateToGroup(first.id);
          check(await page.locator(`[data-writing-activity="${first.id}"] [data-writing-input]`).first().inputValue() === 'saved by the lesson 78 browser test', `${file} ${first.id}: draft restored`);
          const details = page.locator(`[data-writing-activity="${first.id}"] details[data-student-model]`).first();
          if (await details.count()) {
            await details.locator('summary').click();
            check(await details.getAttribute('open') === '', `${file} ${first.id}: model reveals`);
            check(await page.locator(`[data-writing-activity="${first.id}"] [data-writing-input]`).first().inputValue() === 'saved by the lesson 78 browser test', `${file} ${first.id}: reveal does not overwrite response`);
            await details.locator('summary').click();
            check(await details.getAttribute('open') === null, `${file} ${first.id}: model hides`);
          }
          if (groups.length > 1) {
            await navigateToGroup(groups[1].id);
            await page.locator(`[data-writing-activity="${groups[1].id}"] [data-writing-input]`).first().fill('kept');
            await navigateToGroup(first.id);
            await page.locator(`[data-writing-activity="${first.id}"] [data-writing-reset]`).click();
            check(await page.evaluate(key => localStorage.getItem(key), writingKey) === null, `${file} ${first.id}: reset clears only its key`);
            await navigateToGroup(groups[1].id);
            check(await page.locator(`[data-writing-activity="${groups[1].id}"] [data-writing-input]`).first().inputValue() === 'kept', `${file} ${first.id}: reset leaves other activity`);
          }
        }
        if (lesson === 7 && suffix === '-pupil-book') {
          const transcription = (await page.locator('.source-transcription pre').allTextContents()).join('\n');
          const disclosure = await page.locator('body').textContent();
          check(transcription.includes('2 kilometres every day') && transcription.includes('5 kilometres every day'), 'both printed kilometre statements present');
          check(/conflicting item is not assigned|deliberately excluded/.test(disclosure), 'kilometre defect disclosed in browser');
        }
        if (lesson === 8 && suffix === '-pupil-book') {
          const transcription = (await page.locator('.source-transcription pre').allTextContents()).join('\n');
          const disclosure = await page.locator('body').textContent();
          check(transcription.includes('4 bakery') && transcription.includes('4 school'), 'duplicate printed 4 present');
          check(/number 4 is printed twice/.test(disclosure), 'duplicate 4 disclosed in browser');
        }
      }

      if (suffix === '-vocabulary') {
        const rows = page.locator('tr[data-entry-id]');
        const count = await rows.count();
        check(count > 0, `${file}: vocabulary rows rendered`);
        check(await page.locator('td.ar[lang="ar"][dir="rtl"]').count() === count, `${file}: every meaning is marked Arabic RTL`);
        await page.locator('#vocab-entry').selectOption({ index: 1 });
        const id = await page.locator('#vocab-entry').inputValue();
        const expected = await page.locator(`tr[data-entry-id="${id}"] td.ar`).innerText();
        await page.locator('#reveal-vocab-meaning').click();
        check(await page.locator('#vocab-meaning').innerText() === expected, `${file}: audited Arabic revealed`);
        check(await page.locator('#vocab-meaning').getAttribute('dir') === 'rtl', `${file}: revealed Arabic stays RTL`);
        const vocabKey = await page.evaluate(baseKey => Object.keys(localStorage).find(key => key.endsWith(':vocab')), base);
        check(Boolean(vocabKey), `${file}: vocabulary selection saved`);
        await page.locator('#reset-book-practice').click();
        await page.waitForTimeout(40);
        check(await page.evaluate(key => localStorage.getItem(key), vocabKey) === null, `${file}: vocabulary reset clears key`);
        check(await page.locator('#vocab-meaning').innerText() === '', `${file}: vocabulary reset clears reveal`);
      }

      if (suffix === '-test') {
        check(await page.locator('.question').count() === 12, `${file}: twelve questions`);
        check(await page.locator('.test-stimulus').count() === 2, `${file}: two original stimuli`);
        check(await page.locator('#answer-guide').isHidden(), `${file}: teacher key starts hidden`);
        for (const radio of await page.locator('input[type="radio"]').all()) check(Boolean(await radio.getAttribute('name')), `${file}: named radio`);
        const quiz = JSON.parse(fs.readFileSync(path.join(root, 'tests', `${base}.quiz.json`), 'utf8'));
        for (const [index, question] of quiz.questions.entries()) {
          await page.locator('.content-nav-links button').nth(index).click();
          const block = page.locator(`#${question.id}`);
          if (typeof question.correct === 'number') await block.locator(`input[type="radio"][value="${question.correct}"]`).check();
          else await block.locator('input[type="text"]').fill(question.correct);
        }
        await page.locator('#check-answers').click();
        check((await page.locator('#score').innerText()).includes('Score: 12 / 12'), `${file}: all verified answers score`);
        const testKey = await page.evaluate(baseKey => Object.keys(localStorage).find(key => key.endsWith(':test')), base);
        check(Boolean(testKey), `${file}: attempt saved`);
        await page.reload({ waitUntil: 'networkidle' });
        check((await page.locator('#score').innerText()).includes('Score: 12 / 12'), `${file}: score restored after reload`);
        const codes = fs.readFileSync(path.join(root, `${base}.js`), 'utf8').match(/const expected = String\.fromCharCode\(([^)]+)\)/)?.[1];
        check(Boolean(codes), `${file}: teacher key code present`);
        await page.locator('#teacher-password').fill(String.fromCharCode(...codes.split(',').map(Number)));
        await page.locator('#unlock-solutions').click();
        check(await page.locator('#answer-guide').isVisible(), `${file}: teacher key reveals`);
        check(await page.locator('#teacher-key li').count() === 12, `${file}: teacher key has twelve entries`);
        await page.locator('#lock-solutions').click();
        check(await page.locator('#answer-guide').isHidden(), `${file}: teacher key hides`);
        await page.locator('#reset-test').click();
        await page.waitForTimeout(40);
        check(await page.evaluate(key => localStorage.getItem(key), testKey) === null, `${file}: reset clears saved attempt`);
      }
    }
  }

  await page.goto(origin + 'lessons.html?grade=4');
  check(await page.locator('#lesson-list a.lesson').count() === 8, 'Grade 4 menu lists eight prepared lessons');
  for (const lesson of [7, 8]) check(await page.locator(`#lesson-list a[href="grade4-unit1-lesson${lesson}.html"]`).count() === 1, `Grade 4 menu includes Lesson ${lesson}`);
  await page.goto(origin + 'round-tests.html?grade=4');
  check(await page.locator('#available-tests-links a').count() === 8, 'Round test directory lists eight tests');
  await page.goto(origin + 'index.html');
  check((await page.locator('#prepared-lessons').innerText()).includes(`${curriculumTotals.lessons} verified lessons · ${curriculumTotals.pages} pages`), 'homepage totals derive from registry');
  check(await page.locator('a[href="grade4-unit1-lesson8.html"]').count() >= 1, 'homepage directory links Lesson 8');
  await page.goto(origin + 'teacher.html');
  check(await page.locator('.stat').nth(0).innerText() === `${curriculumTotals.lessons}\nPrepared lessons`, 'teacher lesson count');
  check(await page.locator('.stat').nth(1).innerText() === `${curriculumTotals.pages}\nVerified lesson pages`, 'teacher page count');
  await page.goto(origin + 'teacher-resources.html');
  for (const lesson of [7, 8]) check(await page.locator(`a[href="grade4-unit1-lesson${lesson}-test.html#teacher-gate"]`).count() === 1, `teacher resources deep-link Lesson ${lesson} key`);
  check(errors.length === 0, `No browser console or page errors: ${errors.join('; ')}`);
  console.log(`PASS Grade 4 Unit 1 Lessons 7 & 8 browser tests: ${checks} checks across all ten pages, viewports, navigation, scans, writing drafts, models, Arabic RTL, scoring, persistence, reset, teacher keys and registry integrations.`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
