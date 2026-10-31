import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = process.cwd();
const projectPrefix = '/E_Curriculum_1_9';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

const checks = [];
const errors = [];
const screenshots = [];
const screenshotsDir = path.join(root, 'test-results', 'phase2-a');
fs.mkdirSync(screenshotsDir, { recursive: true });

const pass = (name, detail = '') => {
  checks.push({ name, status: 'PASS', detail });
  console.log('PASS', name, detail);
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (!urlPath.startsWith(projectPrefix + '/')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const relative = urlPath.slice((projectPrefix + '/').length) || 'index.html';
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}${projectPrefix}/`;

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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());

  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('console', msg => { if (msg.type() === 'error') errors.push({ url: page.url(), consoleError: msg.text() }); });
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push({ url: response.url(), status: response.status() }); });

  const go = async route => {
    const res = await page.goto(origin + route, { waitUntil: 'load' });
    assert.equal(res.status(), 200, `${route}: expected HTTP 200`);
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  };

  const capture = async (label) => {
    const file = path.join(screenshotsDir, `${label.replace(/\s+/g, '-').toLowerCase()}.png`);
    await page.screenshot({ path: file, fullPage: true });
    screenshots.push({ label, file });
    return file;
  };

  const grades = [3, 4, 5, 8];
  const sections = ['pupil-book', 'workbook', 'vocabulary', 'test'];
  let pagesChecked = 0;
  let transitionsChecked = 0;

  for (const grade of grades) {
    const lessonNum = grade === 8 ? 1 : 2;
    const slug = `grade${grade}-unit1-lesson${lessonNum}`;
    await go(`${slug}.html`);
    assert.equal(await page.locator('script[src="lesson-navigation.js"]').count(), 0);
    assert.equal(await page.locator('.lesson-flow').count(), 0);

    for (const [index, section] of sections.entries()) {
      const route = `${slug}-${section}.html`;
      await go(route);
      assert.equal(await page.locator('script[src="lesson-navigation.js"]').count(), 1, `${route}: one script reference`);
      assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.endsWith('/lesson-navigation.js')).length), 1, `${route}: script loaded once`);
      assert.equal(await page.locator('.lesson-flow').count(), 1, `${route}: one bottom nav`);
      assert.equal(await page.locator('.section-links').count(), 1, `${route}: one section switcher`);
      assert.equal(await page.locator('.lesson-flow a').count(), 2, `${route}: only Previous/Next in bottom nav`);
      assert.equal(await page.locator('.lesson-flow').getAttribute('aria-label'), 'Lesson section navigation');

      const expected = [
        index === 0 ? `${slug}.html` : `${slug}-${sections[index - 1]}.html`,
        index === sections.length - 1 ? `lessons.html?grade=${grade}` : `${slug}-${sections[index + 1]}.html`
      ];
      for (const [actionIndex, destination] of expected.entries()) {
        if (actionIndex > 0) await go(route);
        const control = page.locator('.lesson-flow-action').nth(actionIndex);
        assert.equal(await control.getAttribute('href'), destination, `${route}: action ${actionIndex} destination`);
        assert.notEqual(await control.getAttribute('aria-disabled'), 'true', `${route}: working link must not be disabled`);
        assert.equal(await control.evaluate(el => el.tabIndex), 0, `${route}: keyboard focusable`);
        assert.equal((await control.textContent()).trim(), actionIndex === 0 ? '← Previous' : index === sections.length - 1 ? 'Finish lesson ✓' : 'Next section →');
        await control.focus();
        assert.equal(await control.evaluate(el => document.activeElement === el), true);
        await Promise.all([
          page.waitForURL(origin + destination),
          page.keyboard.press('Enter')
        ]);
        assert.equal(page.url(), origin + destination, `${route}: keyboard activation destination`);
        transitionsChecked++;
      }
      await go(route);
      await capture(`grade${grade}-lesson${lessonNum}-${section}`);
      pagesChecked++;
    }
  }

  assert.deepEqual(errors, [], 'No browser, console or local HTTP errors');
  pass('Previous/Next and Finish lesson behaviour', `${grades.length} grades × ${sections.length} sections; ${transitionsChecked} keyboard-activated transitions`);
  pass('Script loading and unique navigation', `${pagesChecked} content pages: one script load, one bottom nav, two actions, one top section switcher; four hubs excluded`);
  pass('Accessible working links', 'All 32 controls focusable and operable with Enter; none marked disabled');
  pass('Browser errors', 'Zero page, console or local HTTP errors');
  pass('Screenshots captured', `${screenshots.length} full-page screenshots in test-results/phase2-a/`);

  console.log(JSON.stringify({ suite: 'phase2-a-navigation-browser', status: 'PASS', date: new Date().toISOString(), screenshots, checks }, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
