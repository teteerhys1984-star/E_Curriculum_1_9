import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const root = process.cwd();
const require = createRequire(import.meta.url);
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/E_Curriculum_1_9\//, '');
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

// Source-verified writing activities: id -> printed response spaces.
const cases = [
  ['grade3-unit1-lesson3-workbook.html', { 'wb-1': 5, 'wb-2': 6, 'wb-3': 3, 'wb-4': 2, 'wb-5': 4, 'wb-6': 6 }],
  ['grade4-unit1-lesson3-pupil-book.html', { 'pb-9': 4, 'pb-10': 6, 'pb-11': 5 }],
  ['grade4-unit1-lesson3-workbook.html', { 'wb-2': 6, 'wb-4': 5, 'wb-5': 2, 'wb-8': 7 }]
];
// model = injected student-visible sample; reveal = the book page's own guidance panel;
// exception = explicit documentation that the source cannot support a model.
const models = {
  'grade3-unit1-lesson3-workbook.html:wb-1': ['reveal', /read \/ library[\s\S]*laboratory[\s\S]*draw \/ art room/],
  'grade3-unit1-lesson3-workbook.html:wb-2': ['exception', /recording was not supplied[\s\S]*no answer model[\s\S]*not graded/i],
  'grade3-unit1-lesson3-workbook.html:wb-3': ['reveal', /on the left of[\s\S]*classroom[\s\S]*twelve/],
  'grade3-unit1-lesson3-workbook.html:wb-4': ['model', /sample answer[\s\S]*favourite room is the library/i],
  'grade3-unit1-lesson3-workbook.html:wb-5': ['reveal', /2, 3, 5, 4, 1/],
  'grade3-unit1-lesson3-workbook.html:wb-6': ['reveal', /classroom, laboratory, playground[\s\S]*living room, bedroom, kitchen/],
  'grade4-unit1-lesson3-pupil-book.html:pb-9': ['reveal', /wake[\s\S]*wakes[\s\S]*watch[\s\S]*watches/],
  'grade4-unit1-lesson3-pupil-book.html:pb-10': ['reveal', /wash my face[\s\S]*brush my hair[\s\S]*get dressed[\s\S]*get up[\s\S]*have my breakfast[\s\S]*brush my teeth/],
  'grade4-unit1-lesson3-pupil-book.html:pb-11': ['model', /sample answer[\s\S]*half past six[\s\S]*do my homework/i],
  'grade4-unit1-lesson3-workbook.html:wb-2': ['reveal', /get[\s\S]*wash[\s\S]*get[\s\S]*gets[\s\S]*washes[\s\S]*gets/],
  'grade4-unit1-lesson3-workbook.html:wb-4': ['model', /half past ten[\s\S]*quarter to one[\s\S]*quarter past six[\s\S]*four o’clock[\s\S]*quarter past seven/],
  'grade4-unit1-lesson3-workbook.html:wb-5': ['model', /sample answer[\s\S]*have breakfast[\s\S]*seven o’clock/i],
  'grade4-unit1-lesson3-workbook.html:wb-8': ['model', /sample answer[\s\S]*wake up at 6\.30[\s\S]*go to bed/i]
};
// Open-ended prompts must never claim an automatic grade.
const openEnded = [
  'grade3-unit1-lesson3-workbook.html:wb-4',
  'grade4-unit1-lesson3-pupil-book.html:pb-11',
  'grade4-unit1-lesson3-workbook.html:wb-5',
  'grade4-unit1-lesson3-workbook.html:wb-8'
];

let browser;
const errors = [];
try {
  const pkg = require('@sparticuz/chromium');
  let options = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  else if (process.platform === 'linux') {
    const dir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
    const libs = await pkg.inflate(path.join(dir, 'bin', 'al2023.tar.br'));
    pkg.setupLambdaEnvironment(path.join(libs, 'lib'));
    options = { ...options, executablePath: await pkg.default.executablePath(), args: pkg.default.args };
  }
  browser = await chromium.launch(options);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  const origin = `http://127.0.0.1:${server.address().port}/E_Curriculum_1_9/`;
  const navigate = async id => {
    const index = await page.locator(`[data-writing-activity="${id}"]`).evaluate(el => Array.from(document.querySelectorAll('main > section.panel')).indexOf(el.closest('section.panel')));
    assert.ok(index >= 0, `${id}: activity lives in a navigable step`);
    await page.locator('.content-nav-links button').nth(index).click();
  };
  const fieldsOf = id => page.locator(`[data-writing-activity="${id}"] input[type="text"], [data-writing-activity="${id}"] textarea`);
  const openModel = async id => {
    const group = page.locator(`[data-writing-activity="${id}"]`);
    const details = group.locator('details[data-student-model]');
    if (await details.count()) {
      await details.locator('summary').click();
      assert.equal(await details.evaluate(el => el.open), true, `${id}: model opens`);
      return { kind: 'model', text: await details.textContent() };
    }
    const reveal = group.locator('button[aria-controls]').first();
    if (await reveal.count()) {
      await reveal.click();
      assert.equal(await reveal.getAttribute('aria-expanded'), 'true', `${id}: guidance opens`);
      const target = await reveal.getAttribute('aria-controls');
      const panel = page.locator(`#${target}`);
      assert.equal(await panel.isVisible(), true, `${id}: guidance panel visible`);
      return { kind: 'reveal', text: await panel.textContent() };
    }
    const note = group.locator('[data-writing-exception]');
    assert.ok(await note.count(), `${id}: either a model, guidance or an explicit exception must exist`);
    return { kind: 'exception', text: await note.textContent() };
  };

  for (const [file, expected] of cases) {
    const ids = Object.keys(expected);
    await page.goto(origin + file);
    assert.deepEqual(
      await page.locator('[data-writing-activity]').evaluateAll(els => els.map(el => el.dataset.writingActivity)),
      ids,
      `${file}: written-production activities in printed order`
    );
    assert.equal(await page.locator('#teacher-gate, #teacher-key, #answer-guide').count(), 0, `${file}: teacher-only key is not on the pupil page`);

    for (const id of ids) {
      await navigate(id);
      const count = await fieldsOf(id).count();
      assert.equal(count, expected[id], `${file}:${id}: printed response spaces`);
      for (let i = 0; i < count; i++) await fieldsOf(id).nth(i).fill(`draft ${id} ${i}`);

      // Reveal/hide must never overwrite pupil work.
      const before = await fieldsOf(id).evaluateAll(els => els.map(el => el.value));
      const [kind, pattern] = models[`${file}:${id}`];
      const opened = await openModel(id);
      assert.equal(opened.kind, kind, `${file}:${id}: expected a ${kind} support`);
      assert.match(opened.text, pattern, `${file}:${id}: ${kind} content`);
      assert.deepEqual(await fieldsOf(id).evaluateAll(els => els.map(el => el.value)), before, `${file}:${id}: reveal must not overwrite pupil work`);

      // Existing deterministic checks must also leave the pupil's text intact.
      const check = page.locator(`[data-writing-activity="${id}"] .check-practice`);
      if (await check.count()) {
        await check.click();
        assert.deepEqual(await fieldsOf(id).evaluateAll(els => els.map(el => el.value)), before, `${file}:${id}: checking must not rewrite pupil work`);
      }
      if (openEnded.includes(`${file}:${id}`)) {
        assert.equal(await check.count(), 0, `${file}:${id}: personal writing is not auto-graded`);
      }
      await fieldsOf(id).first().fill(`edited ${id}`);
      assert.equal(await page.locator(`[data-writing-activity="${id}"] [data-writing-status]`).textContent(), 'Responses are saved in this browser. Compare, edit, or reset when ready.');
    }

    // Persistence after reload.
    await page.reload();
    for (const id of ids) {
      await navigate(id);
      assert.equal(await fieldsOf(id).first().inputValue(), `edited ${id}`, `${file}:${id}: draft restored after reload`);
      for (let i = 1; i < expected[id]; i++) assert.equal(await fieldsOf(id).nth(i).inputValue(), `draft ${id} ${i}`);
    }

    // Deliberate reset of one activity must not clear another.
    for (let n = 0; n < ids.length; n++) {
      const id = ids[n];
      await navigate(id);
      const group = page.locator(`[data-writing-activity="${id}"]`);
      await openModel(id);
      await group.locator('[data-writing-reset]').first().click();
      assert.ok((await fieldsOf(id).evaluateAll(els => els.map(el => el.value))).every(value => value === ''), `${file}:${id}: reset clears this activity`);
      if (await group.locator('details[data-student-model]').count()) {
        assert.equal(await group.locator('details[data-student-model]').evaluate(el => el.open), false, `${file}:${id}: reset closes the model`);
      } else if (await group.locator('button[aria-controls]').count()) {
        assert.equal(await group.locator('button[aria-controls]').first().getAttribute('aria-expanded'), 'false', `${file}:${id}: reset closes the guidance`);
      }
      if (n + 1 < ids.length) {
        await navigate(ids[n + 1]);
        assert.equal(await fieldsOf(ids[n + 1]).first().inputValue(), `edited ${ids[n + 1]}`, `${file}:${id}: reset left the next activity untouched`);
      }
    }
    await page.reload();
    for (const id of ids) {
      await navigate(id);
      assert.ok((await fieldsOf(id).evaluateAll(els => els.map(el => el.value))).every(value => value === ''), `${file}:${id}: reset survived the reload`);
    }
    console.log(`PASS ${file}: ${ids.length} writing activities — model/exception, reveal without overwrite, edit, reload, isolated reset`);
  }

  // The page-level reset on the Grade 4 pages clears every typed draft.
  for (const file of ['grade4-unit1-lesson3-pupil-book.html', 'grade4-unit1-lesson3-workbook.html']) {
    await page.goto(origin + file);
    const ids = Object.keys(cases.find(([name]) => name === file)[1]);
    for (const id of ids) {
      await navigate(id);
      await fieldsOf(id).first().fill(`page reset ${id}`);
    }
    await page.locator('#reset-book-practice').click();
    await page.waitForTimeout(50);
    await page.reload();
    for (const id of ids) {
      await navigate(id);
      assert.equal(await fieldsOf(id).first().inputValue(), '', `${file}:${id}: page reset clears the draft`);
    }
    console.log(`PASS ${file}: page-level reset clears every writing draft`);
  }

  // Keyboard access to the model reveal and the reset control.
  await page.goto(origin + 'grade3-unit1-lesson3-workbook.html');
  await navigate('wb-4');
  const summary = page.locator('[data-writing-activity="wb-4"] details[data-student-model] summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-writing-activity="wb-4"] details[data-student-model]').evaluate(el => el.open), true, 'Enter opens the sample answer');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-writing-activity="wb-4"] details[data-student-model]').evaluate(el => el.open), false, 'Enter closes the sample answer');
  await page.locator('[data-writing-activity="wb-4"] [data-writing-reset]').focus();
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-writing-reset')), true, 'reset control is keyboard focusable');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  await navigate('wb-1');
  const revealButton = page.locator('[data-writing-activity="wb-1"] button[aria-controls]').first();
  await revealButton.focus();
  await page.keyboard.press('Enter');
  assert.equal(await revealButton.getAttribute('aria-expanded'), 'true', 'Enter opens existing guidance');
  console.log('PASS keyboard access to models, guidance and reset');

  // Responsive: no horizontal overflow on a phone-sized viewport.
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [file, expected] of cases) {
      await page.goto(origin + file);
      for (const id of Object.keys(expected)) {
        await navigate(id);
        const overflow = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
        assert.ok(overflow.html <= overflow.viewport + 1 && overflow.body <= overflow.viewport + 1, `${file} ${id} @${width}px: horizontal overflow ${JSON.stringify(overflow)}`);
      }
    }
    console.log(`PASS responsive layout at ${width}px on every writing activity`);
  }
  await page.setViewportSize({ width: 1366, height: 900 });

  // Teacher-only answers stay on the gated test pages, never in the writing layer.
  for (const file of ['grade3-unit1-lesson3-test.html', 'grade4-unit1-lesson3-test.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /id="teacher-gate"/, `${file}: teacher key stays behind its gate`);
  }
  assert.ok(!/teacher-key|answer-guide|teacher-password/.test(fs.readFileSync(path.join(root, 'lesson3-writing-practice.js'), 'utf8')), 'writing layer never copies teacher-only answers');

  // Storage failure is disclosed rather than silently dropping work.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  });
  await page.goto(origin + 'grade3-unit1-lesson3-workbook.html');
  await navigate('wb-1');
  assert.match(await page.locator('[data-writing-activity="wb-1"] [data-writing-status]').textContent(), /storage is unavailable/i);
  console.log('PASS storage failure is disclosed');

  assert.deepEqual(errors, [], 'no page errors during the writing run');
} finally {
  if (browser) await browser.close();
  server.close();
}
