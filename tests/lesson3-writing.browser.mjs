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

    /* Deliberate reset must be synchronous and complete. A draft is first kept in every
       activity, then one activity is reset and the whole page state is read back in a
       single evaluation — no waiting, no polling — so a deferred cleanup cannot hide. */
    const isG3 = file.startsWith('grade3');
    const legacyPrefix = isG3 ? 'efc_grade3_unit1_lesson3_practice_v1:' : 'efc_grade4_unit1_lesson3:practice:';
    const writingPrefix = `efc_writing_${file.replace('.html', '')}_v1:`;
    const readAfterReset = id => page.evaluate(({ id, legacyPrefix, writingPrefix, isG3 }) => {
      const section = document.querySelector(`[data-writing-activity="${id}"]`);
      const fields = [...section.querySelectorAll('input[type="text"], textarea')];
      const keys = [...section.querySelectorAll('input, select, textarea')]
        .map(el => (isG3 ? el.name : el.id)).filter(Boolean);
      const legacyKey = Object.keys(localStorage).find(key => key.startsWith(legacyPrefix));
      let legacy = null;
      try { legacy = legacyKey ? JSON.parse(localStorage.getItem(legacyKey) || 'null') : null; } catch { legacy = null; }
      const legacyDraft = legacy
        ? keys.filter(key => {
          const entry = isG3 ? legacy.fields?.[key] : legacy[key]?.value;
          return typeof entry === 'string' && entry !== '';
        })
        : [];
      return {
        values: fields.map(field => field.value),
        writingKey: localStorage.getItem(writingPrefix + id),
        legacyDraft,
        invalid: [...section.querySelectorAll('[aria-invalid]')].length,
        modelsOpen: [...section.querySelectorAll('details[data-student-model]')].filter(details => details.open).length,
        expanded: [...section.querySelectorAll('button[aria-controls]')]
          .filter(button => button.getAttribute('aria-expanded') === 'true').length,
        feedback: (section.querySelector('.practice-feedback')?.textContent || '').trim(),
        status: (section.querySelector('[data-writing-status]')?.textContent || '').trim()
      };
    }, { id, legacyPrefix, writingPrefix, isG3 });
    const assertCleared = (state, id, when) => {
      assert.ok(state.values.every(value => value === ''), `${file}:${id}: ${when} clears every field`);
      assert.equal(state.writingKey, null, `${file}:${id}: ${when} removes its own saved writing key`);
      assert.deepEqual(state.legacyDraft, [], `${file}:${id}: ${when} clears the legacy lesson draft for this activity`);
      assert.equal(state.invalid, 0, `${file}:${id}: ${when} clears invalid-field marking`);
      assert.equal(state.modelsOpen, 0, `${file}:${id}: ${when} closes the model`);
      assert.equal(state.expanded, 0, `${file}:${id}: ${when} closes the guidance`);
      assert.equal(state.feedback, '', `${file}:${id}: ${when} clears feedback`);
      assert.equal(state.status, 'Responses are saved in this browser. Compare, edit, or reset when ready.', `${file}:${id}: ${when} reports the saved-draft status`);
    };
    const otherDrafts = async (exceptId, prefix) => {
      const kept = {};
      for (const id of ids) {
        if (id === exceptId) continue;
        await navigate(id);
        kept[id] = await fieldsOf(id).first().inputValue();
        assert.equal(kept[id], `${prefix} ${id}`, `${file}:${id}: another activity's draft must survive a reset elsewhere`);
      }
      return kept;
    };

    // Seed a draft in every activity so isolation can be observed.
    for (const id of ids) {
      await navigate(id);
      await fieldsOf(id).first().fill(`kept ${id}`);
    }
    await page.reload();

    for (const id of ids) {
      await navigate(id);
      const group = page.locator(`[data-writing-activity="${id}"]`);
      for (let i = 0; i < expected[id]; i++) await fieldsOf(id).nth(i).fill(`reset-me ${id} ${i}`);
      await openModel(id);
      const check = group.locator('.check-practice');
      if (await check.count()) await check.click();
      await group.locator('[data-writing-reset]').first().click();
      // Read the settled state with no waiting: fields, keys, panels, marking, feedback.
      assertCleared(await readAfterReset(id), id, 'reset');

      // Reload immediately after the next click: nothing asynchronous may still be pending.
      for (let i = 0; i < expected[id]; i++) await fieldsOf(id).nth(i).fill(`again ${id} ${i}`);
      await group.locator('[data-writing-reset]').first().click();
      await page.reload();
      await navigate(id);
      assertCleared(await readAfterReset(id), id, 'immediate reload after reset');
      await otherDrafts(id, 'kept');

      // Leave a draft behind again so the next activity's isolation check is meaningful.
      await navigate(id);
      await fieldsOf(id).first().fill(`kept ${id}`);
    }
    console.log(`PASS ${file}: ${ids.length} writing activities — model/exception, reveal without overwrite, edit, reload, synchronous isolated reset`);
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

  // Draft migration: work saved by the lesson script before this layer existed is adopted,
  // so upgrading the page never discards a pupil's earlier draft.
  for (const [file, activity, fieldId] of [
    ['grade3-unit1-lesson3-workbook.html', 'wb-1', 'wb1-1a'],
    ['grade4-unit1-lesson3-workbook.html', 'wb-2', 'wb2-1']
  ]) {
    const isG3 = file.startsWith('grade3');
    await page.goto(origin + file);
    await page.evaluate(({ isG3, fieldId }) => {
      localStorage.clear();
      if (isG3) localStorage.setItem('efc_grade3_unit1_lesson3_practice_v1:workbook', JSON.stringify({ fields: { [fieldId]: 'legacy draft' } }));
      else localStorage.setItem(`efc_grade4_unit1_lesson3:practice:${location.pathname}`, JSON.stringify({ [fieldId]: { kind: 'value', value: 'legacy draft' } }));
    }, { isG3, fieldId });
    await page.reload();
    await navigate(activity);
    assert.equal(await page.locator(`#${fieldId}`).inputValue(), 'legacy draft', `${file}: legacy draft is adopted`);
    const migrated = await page.evaluate(id => localStorage.getItem(`efc_writing_${location.pathname.split('/').pop().replace('.html', '')}_v1:${id}`), activity);
    assert.ok(migrated && migrated.includes('legacy draft'), `${file}: adopted draft is persisted in the activity key`);
    await page.locator(`[data-writing-activity="${activity}"] [data-writing-reset]`).first().click();
    assert.equal(await page.locator(`#${fieldId}`).inputValue(), '', `${file}: reset clears the adopted draft`);
    assert.equal(await page.evaluate(id => localStorage.getItem(`efc_writing_${location.pathname.split('/').pop().replace('.html', '')}_v1:${id}`), activity), null, `${file}: reset removes the adopted key`);
    console.log(`PASS ${file}: legacy draft migration is preserved and resettable`);
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
