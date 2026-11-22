import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sparticuzChromium from '@sparticuz/chromium';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const reqPath = (req.url || '/').split('?')[0];
  const filePath = path.join(process.cwd(), reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({
  executablePath: await sparticuzChromium.executablePath(),
  args: sparticuzChromium.args,
  headless: true
});
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
page.on('pageerror', err => errors.push(err.message));

const cases = [
  {
    file: 'grade3-unit1-lesson4-workbook.html',
    section: '#wb-1',
    input: '#wb1-1',
    sample: 'nose',
    hasStudentModel: false,
    existingReveal: '#wb-words button.reveal'
  },
  {
    file: 'grade4-unit1-lesson4-pupil-book.html',
    section: '#pb-1',
    input: '#pb1-number-1',
    sample: '3',
    exception: true
  },
  {
    file: 'grade4-unit1-lesson4-pupil-book.html',
    section: '#pb-11',
    input: '#pb10-first',
    sample: 'very bright',
    hasStudentModel: true
  },
  {
    file: 'grade4-unit1-lesson4-workbook.html',
    section: '#wb-9',
    input: '#wb9-room',
    sample: 'my bedroom',
    hasStudentModel: true
  }
];

const navigate = async (page, sectionSelector) => {
  const id = sectionSelector.replace(/^#/, '');
  const index = await page.evaluate(targetId => {
    const panels = [...document.querySelectorAll('main.wrap section.panel')];
    return panels.findIndex(p => p.id === targetId || p.querySelector(`#${targetId}`));
  }, id);
  assert.ok(index >= 0, `${sectionSelector}: activity lives in a navigable step`);
  const btn = page.locator('.content-nav-links button').nth(index);
  if (await btn.count()) await btn.click();
};

for (const c of cases) {
  await page.goto(`${baseUrl}/${c.file}`, { waitUntil: 'networkidle' });
  await navigate(page, c.section);
  const sec = page.locator(c.section);
  await sec.waitFor({ state: 'visible' });

  // Model reveal / hide
  if (c.hasStudentModel) {
    const details = sec.locator('details[data-student-model]');
    await details.locator('summary').click();
    assert.equal(await details.getAttribute('open'), '');
    await details.locator('summary').click();
    assert.equal(await details.getAttribute('open'), null);
  } else if (c.existingReveal) {
    const btn = sec.locator(c.existingReveal);
    await btn.click();
    assert.equal(await btn.getAttribute('aria-expanded'), 'true');
    await btn.click();
    assert.equal(await btn.getAttribute('aria-expanded'), 'false');
  }

  // The audio-dependent activity remains explicitly unverified and ungraded.
  if (c.exception) {
    const note = await sec.locator('[data-writing-exception]').innerText();
    assert.match(note, /recording was not supplied/);
    assert.match(note, /no answer model is provided/);
    assert.match(note, /not graded/);
    assert.equal(await sec.locator('details[data-student-model]').count(), 0);
  }

  // Compare a model without replacing the response, then edit and persist it.
  const input = sec.locator(c.input);
  await input.fill(c.sample);
  if (c.hasStudentModel) {
    await sec.locator('details[data-student-model] summary').click();
    assert.equal(await input.inputValue(), c.sample);
    await sec.locator('details[data-student-model] summary').click();
  } else if (c.existingReveal) {
    await sec.locator(c.existingReveal).click();
    assert.equal(await input.inputValue(), c.sample);
    await sec.locator(c.existingReveal).click();
  }
  const edited = c.sample + (c.exception ? '1' : ' edited');
  await input.fill(edited);
  await page.reload({ waitUntil: 'networkidle' });
  await navigate(page, c.section);
  await sec.waitFor({ state: 'visible' });
  assert.equal(await sec.locator(c.input).inputValue(), edited, `${c.file} ${c.input} persisted`);

  // Inspect state within the same browser task as the click, before any reload.
  const immediate = await sec.evaluate((section, selector) => {
    section.querySelector('[data-writing-reset]').click();
    const key = `efc_writing_${location.pathname.split('/').pop().replace('.html', '')}_v1:${section.dataset.writingActivity}`;
    return { value: section.querySelector(selector).value, stored: localStorage.getItem(key) };
  }, c.input);
  assert.equal(immediate.value, '', `${c.file} ${c.input} immediately cleared`);
  assert.equal(immediate.stored, null, `${c.file} activity storage immediately cleared`);
  await page.reload({ waitUntil: 'networkidle' });
  await navigate(page, c.section);
  await sec.waitFor({ state: 'visible' });
  assert.equal(await sec.locator(c.input).inputValue(), '', `${c.file} ${c.input} cleared synchronously`);
}

assert.deepEqual(errors, [], `No page errors: ${errors.join('; ')}`);

await browser.close();
server.close();
console.log('lesson4-writing browser checks passed.');
