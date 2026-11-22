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

for (const c of cases) {
  await page.goto(`${baseUrl}/${c.file}`, { waitUntil: 'networkidle' });
  const sec = page.locator(c.section);
  await sec.waitFor();

  // Model reveal / hide
  if (c.hasStudentModel) {
    const details = sec.locator('details[data-student-model]');
    await details.locator('summary').click();
    assert.equal(await details.getAttribute('open'), '');
    await details.locator('summary').click();
    assert.equal(await details.getAttribute('open'), null);
  } else if (c.existingReveal) {
    const btn = page.locator(c.existingReveal);
    await btn.click();
    assert.equal(await btn.getAttribute('aria-expanded'), 'true');
    await btn.click();
    assert.equal(await btn.getAttribute('aria-expanded'), 'false');
  }

  // Write, reload, verify persistence
  await page.fill(c.input, c.sample);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.inputValue(c.input), c.sample, `${c.file} ${c.input} persisted`);

  // Synchronous reset, immediate reload, verify cleared
  await page.locator(`${c.section} [data-writing-reset]`).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.inputValue(c.input), '', `${c.file} ${c.input} cleared synchronously`);
}

assert.deepEqual(errors, [], `No page errors: ${errors.join('; ')}`);

await browser.close();
server.close();
console.log('lesson4-writing browser checks passed.');
