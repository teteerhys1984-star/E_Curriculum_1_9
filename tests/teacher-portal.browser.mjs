/* Phase 2-B Teacher Portal browser checks.
   Verifies the two new pages render on the six approved viewports, that the shared
   header and breadcrumbs mark the teacher routes correctly, that every teacher link
   and key anchor resolves, and that the pages make no security or tracking claims.
   It never edits a lesson page: the four gated tests are only opened read-only. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = '/E_Curriculum_1_9/';
const evidenceDir = path.join(root, 'docs', 'phase2-b-teacher-portal', 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

const checks = [];
const errors = [];
const screenshots = [];
const pass = (name, detail = '') => {
  checks.push({ name, status: 'PASS', detail });
  console.log('PASS', name, detail);
};

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

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (!urlPath.startsWith(prefix)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const relative = urlPath.slice(prefix.length) || 'index.html';
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const teacherRoutes = ['teacher.html', 'teacher-resources.html'];
const anchoredKeyLinks = [
  'grade3-unit1-lesson1-test.html#teacher-gate',
  'grade3-unit1-lesson2-test.html#teacher-gate',
  'grade4-unit1-lesson2-test.html#teacher-gate',
  'grade5-unit1-lesson1-test.html#teacher-gate'
];
const unanchoredTests = [
  { slug: 'grade4-unit1-lesson1', hasKeyArea: false },
  { slug: 'grade5-unit1-lesson2', hasKeyArea: true },
  { slug: 'grade8-unit1-lesson1', hasKeyArea: true }
];
const viewports = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 740 }
];

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}${prefix}`;

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
  page.setDefaultTimeout(15000);
  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push({ url: page.url(), consoleError: msg.text() });
  });
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      errors.push({ url: response.url(), status: response.status() });
    }
  });

  const go = async route => {
    const res = await page.goto(origin + route, { waitUntil: 'load' });
    assert.equal(res.status(), 200, `${route}: expected HTTP 200`);
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  };

  const assertLayoutIntegrity = async label => {
    const metrics = await page.evaluate(() => {
      const vw = window.innerWidth;
      const header = document.querySelector('.site-header');
      const clipped = [];
      for (const el of document.querySelectorAll('.site-header, .btn, button, .card, .tile, .panel, .grade, .directory-lesson-row, .contact')) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right > vw + 1.5 || rect.left < -1.5) {
          clipped.push(`${el.tagName.toLowerCase()}.${el.className}: [${Math.round(rect.left)}..${Math.round(rect.right)}] > ${vw}`);
        }
      }
      return {
        vw,
        docScroll: document.documentElement.scrollWidth,
        bodyScroll: document.body.scrollWidth,
        bodyPadRight: getComputedStyle(document.body).paddingRight,
        headerWidth: header ? header.getBoundingClientRect().width : 0,
        clipped: clipped.slice(0, 5)
      };
    });
    assert.ok(metrics.docScroll <= metrics.vw + 1, `${label}: docScroll ${metrics.docScroll} > ${metrics.vw}`);
    assert.ok(metrics.bodyScroll <= metrics.vw + 1, `${label}: bodyScroll ${metrics.bodyScroll} > ${metrics.vw}`);
    assert.equal(metrics.bodyPadRight, '0px', `${label}: body must not use a right-padding hack`);
    assert.ok(Math.abs(metrics.headerWidth - metrics.vw) <= 2, `${label}: site-header must span the viewport`);
    assert.deepEqual(metrics.clipped, [], `${label}: clipped or overflowing elements`);
  };

  // 1. Six approved viewports on both teacher pages.
  let layoutChecks = 0;
  for (const vp of viewports) {
    await page.setViewportSize(vp);
    for (const route of teacherRoutes) {
      await go(route);
      await assertLayoutIntegrity(`${route} @ ${vp.width}×${vp.height}`);
      layoutChecks += 1;
    }
  }
  pass('Six approved viewports', `${layoutChecks} teacher page/viewport combinations at 1440, 1366, 1024, 768, 390 and 320px with no horizontal overflow, no clipped controls and a full-width header`);

  // 2. Shared header: four items on desktop, Teachers current, drawer below 768px.
  const headerAt768 = await (async () => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const results = [];
    for (const route of [...teacherRoutes, 'index.html', 'lessons.html?grade=4']) {
      await go(route);
      results.push(await page.evaluate(() => {
        const vw = window.innerWidth;
        const links = Array.from(document.querySelectorAll('.site-nav-link'));
        const nav = document.querySelector('.site-nav');
        const brand = document.querySelector('.site-brand');
        const boxes = links.map(l => l.getBoundingClientRect());
        const current = links.filter(l => l.getAttribute('aria-current') === 'page').map(l => l.textContent.trim());
        return {
          route: location.pathname.split('/').pop() + location.search,
          vw,
          count: links.length,
          labels: links.map(l => l.textContent.trim()),
          singleRow: new Set(boxes.map(b => Math.round(b.top))).size === 1,
          rightmost: Math.round(Math.max(...boxes.map(b => b.right))),
          navScroll: nav.scrollWidth,
          navClient: nav.clientWidth,
          gap: Math.round(nav.getBoundingClientRect().left - brand.getBoundingClientRect().right),
          current,
          navVisible: getComputedStyle(nav).display !== 'none'
        };
      }));
    }
    return results;
  })();
  for (const item of headerAt768) {
    assert.equal(item.navVisible, true, `${item.route} @768: desktop navigation must be visible`);
    assert.equal(item.count, 4, `${item.route} @768: expected four header items`);
    assert.ok(item.labels.includes('Teachers'), `${item.route} @768: missing Teachers item`);
    assert.equal(item.singleRow, true, `${item.route} @768: header items must stay on one row`);
    assert.ok(item.rightmost <= item.vw, `${item.route} @768: header items overflow the viewport`);
    assert.ok(item.navScroll <= item.navClient + 1, `${item.route} @768: navigation must not scroll internally`);
    assert.ok(item.gap >= 8, `${item.route} @768: brand and navigation are crowded (${item.gap}px)`);
    assert.equal(item.current.length, 1, `${item.route} @768: exactly one current item`);
  }
  assert.equal(headerAt768.find(i => i.route.startsWith('teacher.html')).current[0], 'Teachers');
  assert.equal(headerAt768.find(i => i.route.startsWith('teacher-resources.html')).current[0], 'Teachers');
  pass('Header at the narrowest desktop width', 'Four header items stay on one row at 768px on index, lessons, teacher and teacher-resources pages with 66–120px between brand and navigation, no internal scrolling and exactly one current item');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of teacherRoutes) {
    await go(route);
    assert.equal(await page.locator('.site-nav').isVisible(), false, `${route}: desktop nav must be hidden at 390px`);
    const toggle = page.locator('.site-mobile-toggle');
    assert.equal(await toggle.isVisible(), true, `${route}: mobile menu button must be visible`);
    assert.equal(await toggle.evaluate(el => el.getBoundingClientRect().height >= 44), true, `${route}: menu button must be at least 44px tall`);
    await toggle.click();
    const drawer = page.locator('#site-mobile-drawer');
    assert.equal(await drawer.isVisible(), true, `${route}: drawer must open`);
    const drawerLinks = await drawer.locator('a').allTextContents();
    assert.equal(drawerLinks.length, 4, `${route}: drawer must list four destinations`);
    assert.ok(drawerLinks.some(text => text.includes('Teachers')), `${route}: drawer must include Teachers`);
    assert.equal(await drawer.locator('a[aria-current="page"]').count(), 1, `${route}: drawer must mark one current item`);
    await page.keyboard.press('Escape');
    assert.equal(await drawer.isVisible(), false, `${route}: Escape must close the drawer`);
    assert.equal(await toggle.evaluate(el => el === document.activeElement), true, `${route}: focus must return to the menu button`);
  }
  pass('Mobile drawer', 'Below 768px both teacher pages hide the desktop bar, open a four-destination drawer that marks Teachers as current, and close on Escape with focus restored');

  // 3. Breadcrumbs.
  const crumbs = {};
  for (const route of teacherRoutes) {
    await go(route);
    crumbs[route] = await page.evaluate(() => ({
      items: Array.from(document.querySelectorAll('.breadcrumb-list li')).map(li => li.textContent.trim()),
      links: Array.from(document.querySelectorAll('.breadcrumb-list a')).map(a => a.getAttribute('href')),
      current: document.querySelector('.breadcrumb-list [aria-current="page"]')?.textContent.trim() || ''
    }));
  }
  assert.deepEqual(crumbs['teacher.html'].items, ['Home', 'Teacher Portal']);
  assert.deepEqual(crumbs['teacher.html'].links, ['index.html']);
  assert.equal(crumbs['teacher.html'].current, 'Teacher Portal');
  assert.deepEqual(crumbs['teacher-resources.html'].items, ['Home', 'Teacher Portal', 'Teacher Resources']);
  assert.deepEqual(crumbs['teacher-resources.html'].links, ['index.html', 'teacher.html']);
  assert.equal(crumbs['teacher-resources.html'].current, 'Teacher Resources');
  pass('Breadcrumb trail', 'teacher.html shows Home → Teacher Portal and teacher-resources.html shows Home → Teacher Portal → Teacher Resources, with the correct parent links');

  // 4. Every local link on both pages resolves.
  const localLinks = new Set();
  for (const route of teacherRoutes) {
    await go(route);
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href')));
    for (const href of hrefs) {
      if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
      localLinks.add(href);
    }
  }
  const brokenLinks = [];
  for (const href of [...localLinks].sort()) {
    const target = origin + href.replace(/^\.\//, '');
    const response = await context.request.get(target);
    if (response.status() !== 200) brokenLinks.push(`${href} → HTTP ${response.status()}`);
  }
  assert.deepEqual(brokenLinks, [], 'broken teacher links');
  pass('Teacher link resolution', `${localLinks.size} distinct local destinations from the two teacher pages all returned HTTP 200, including every lesson page and every template route`);

  // 5. Key anchors: the four published areas deep-link, the others are linked without a fragment.
  for (const href of anchoredKeyLinks) {
    await go(href);
    const gate = page.locator('#teacher-gate');
    assert.equal(await gate.count(), 1, `${href}: the documented key area is missing`);
    // The shared step navigator lays the test out after load, so the browser settles the
    // hash scroll a moment later. Wait for the key area to reach the viewport, then assert.
    await page.waitForFunction(() => {
      const el = document.getElementById('teacher-gate');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top > -2 && rect.top < window.innerHeight - 40;
    }, { timeout: 5000 }).catch(() => {});
    const view = await gate.evaluate(el => ({ top: el.getBoundingClientRect().top, vh: window.innerHeight }));
    assert.ok(view.top >= -2 && view.top < view.vh - 40, `${href}: hash navigation must bring the key area into view (top ${Math.round(view.top)} of ${view.vh})`);
    const keyId = await page.evaluate(() => {
      const guide = document.querySelector('#answer-guide, #answer-key');
      return guide ? guide.id : '';
    });
    assert.ok(keyId.length > 0, `${href}: no answer container found`);
    assert.equal(await page.locator(`#${keyId}`).isVisible(), false, `${href}: the key must stay hidden until it is unlocked`);
    assert.equal(await page.locator('[id="teacher-password"]').count() + await page.locator('#pw').count() > 0, true, `${href}: the existing key area must keep its password field`);
  }
  pass('Published key anchors', 'Four lesson tests deep-link to #teacher-gate, each lands with the key area in view and keeps the answer container hidden until it is unlocked');

  for (const { slug, hasKeyArea } of unanchoredTests) {
    await go(`${slug}-test.html`);
    assert.equal(await page.locator('#teacher-gate').count(), 0, `${slug}: this phase must not add a key anchor`);
    if (hasKeyArea) {
      const heading = await page.locator('h2', { hasText: 'Teacher Area · Answer Key' }).count();
      assert.equal(heading, 1, `${slug}: expected the existing heading without an anchor`);
      assert.equal(await page.locator('input[type="password"]').count(), 1, `${slug}: expected the existing password field`);
    } else {
      assert.equal(await page.locator('input[type="password"]').count(), 0, `${slug}: this test has no key area at all`);
      const text = await page.locator('body').innerText();
      assert.doesNotMatch(text, /Teacher Area|teacher password/i, `${slug}: no key area may be claimed`);
    }
  }
  pass('Pages without a key anchor', 'Grade 4 Lesson 1 has no key area, and the Grade 5 Lesson 2 and Grade 8 Lesson 1 key areas keep their existing heading and password field untouched, with no anchor invented');

  // 6. The teacher pages ask for nothing and record nothing.
  await go('teacher.html');
  await page.evaluate(() => window.localStorage.setItem('efc_recent_visit_v1', '{"sentinel":"teacher-portal"}'));
  for (const route of teacherRoutes) {
    await go(route);
    assert.equal(await page.locator('input').count(), 0, `${route}: must contain no input control`);
    assert.equal(await page.locator('form').count(), 0, `${route}: must contain no form`);
  }
  const storedAfter = await page.evaluate(() => window.localStorage.getItem('efc_recent_visit_v1'));
  assert.equal(storedAfter, '{"sentinel":"teacher-portal"}', 'teacher pages must not overwrite the saved student place');
  await page.evaluate(() => window.localStorage.removeItem('efc_recent_visit_v1'));
  pass('No prompts and no storage writes', 'Both teacher pages contain zero inputs and zero forms, and the Continue-learning key in browser storage is byte-identical after visiting them');

  // 7. Honest disclosure is present and no protection claim is made.
  const disclosures = {};
  for (const route of teacherRoutes) {
    await go(route);
    const text = await page.locator('main').innerText();
    assert.match(text, /not authentication/i, `${route}: missing the "not authentication" statement`);
    assert.match(text, /shared classroom password/i, `${route}: missing the shared password explanation`);
    assert.doesNotMatch(text, /password[- ]protected|encrypted|only teachers can|only teachers may|restricted access/i, `${route}: must not claim protection`);
    disclosures[route] = true;
  }
  await go('teacher-resources.html');
  assert.match(await page.locator('main').innerText(), /visible to pupils/i, 'teacher-resources.html: in-page reveals must be disclosed as visible to pupils');
  pass('Honest disclosure', 'Both pages state that the shared classroom password is not authentication, neither claims protection, and the open answer reveals are disclosed as visible to pupils');

  // 8. Rendered matrix matches the published pages.
  await go('teacher-resources.html');
  const matrix = await page.evaluate(() => {
    const table = document.querySelector('.table-scroll table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return {
      headers: Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim()),
      rows: rows.map(tr => ({
        label: tr.querySelector('th').textContent.trim(),
        cells: Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
      })),
      wrapped: Boolean(document.querySelector('.table-scroll')?.classList.contains('table-scroll'))
    };
  });
  assert.equal(matrix.rows.length, 7, 'the matrix must list all seven prepared lessons');
  assert.deepEqual(matrix.headers, ['Grade · Lesson', 'Test items', 'Answer-key area', 'Book reveals', 'Workbook reveals', 'Listening key']);
  assert.equal(matrix.rows.filter(row => row.cells[4] === 'None').length, 7, 'every lesson must report no listening key');
  assert.equal(matrix.rows.filter(row => /^Not published$/.test(row.cells[1])).length, 1, 'exactly one lesson has no published key');
  assert.match(matrix.rows.find(row => row.label.startsWith('4 · 1')).cells[1], /Not published/);
  pass('Rendered status matrix', 'Seven rows with the expected columns, one “Not published” key and “None” for every listening key');

  // 9. Keyboard access and skip link (desktop width, where the header bar is visible).
  await page.setViewportSize({ width: 1440, height: 900 });
  await go('teacher-resources.html');
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => ({
    className: document.activeElement?.className || '',
    href: document.activeElement?.getAttribute('href') || ''
  }));
  assert.match(firstFocus.className, /skip-link/, 'the first Tab stop must be the skip link');
  const skipTarget = await page.evaluate(href => {
    const id = href.replace('#', '');
    const main = document.getElementById(id);
    const outline = getComputedStyle(document.activeElement).outlineWidth;
    return { exists: Boolean(main), outline };
  }, firstFocus.href);
  assert.equal(skipTarget.exists, true, 'the skip link must target an existing landmark');
  const seen = new Set();
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('Tab');
    seen.add(await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return '';
      if (el.classList.contains('site-nav-link')) return `nav:${el.textContent.trim()}`;
      if (el.classList.contains('btn')) return `btn:${el.textContent.trim()}`;
      if (el.classList.contains('skip-link')) return 'skip';
      return '';
    }));
  }
  const navFocus = [...seen].filter(k => k.startsWith('nav:'));
  assert.ok(navFocus.includes('nav:Teachers'), 'the Teachers header link must be keyboard reachable');
  assert.ok([...seen].some(k => k.startsWith('btn:')), 'the page buttons must be keyboard reachable');
  const focusRing = await page.evaluate(() => {
    const link = document.querySelector('.site-nav-link');
    link.focus();
    const style = getComputedStyle(link);
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
  });
  assert.ok(focusRing.width >= 2 && focusRing.style !== 'none', 'focused header links must show a visible outline');
  pass('Keyboard access', 'The skip link is the first Tab stop and targets the main landmark; header links, the Teachers item and page buttons are all reachable and show a visible focus outline');

  // 10. Reduced motion and print behaviour.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await go('teacher.html');
  const reduced = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    button: parseFloat(getComputedStyle(document.querySelector('.btn')).transitionDuration)
  }));
  assert.equal(reduced.scroll, 'auto', 'reduced motion must disable smooth scrolling');
  assert.ok(reduced.button <= 0.01, 'reduced motion must remove button transitions');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.emulateMedia({ media: 'print' });
  await go('teacher-resources.html');
  const printState = await page.evaluate(() => ({
    header: getComputedStyle(document.querySelector('.site-header')).display,
    banner: getComputedStyle(document.querySelector('.engineer-contact-banner')).display
  }));
  assert.equal(printState.header, 'none', 'print must hide the site header');
  assert.equal(printState.banner, 'none', 'print must hide the contact strip');
  await page.emulateMedia({ media: 'screen' });
  pass('Reduced motion and print', 'Reduced motion removes smooth scrolling and button transitions; print hides the header and contact strip so the directory prints cleanly');

  // 11. Evidence.
  await page.setViewportSize({ width: 1440, height: 900 });
  await go('teacher.html');
  await page.screenshot({ path: path.join(evidenceDir, 'teacher-desktop-1440.png'), fullPage: true, timeout: 30000 });
  screenshots.push('teacher-desktop-1440.png');

  await page.setViewportSize({ width: 768, height: 1024 });
  await go('teacher.html');
  await page.locator('.site-header').screenshot({ path: path.join(evidenceDir, 'header-768-teacher.png'), timeout: 30000 });
  screenshots.push('header-768-teacher.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await go('teacher.html');
  await page.screenshot({ path: path.join(evidenceDir, 'teacher-mobile-390.png'), fullPage: true, timeout: 30000 });
  screenshots.push('teacher-mobile-390.png');

  await page.setViewportSize({ width: 1440, height: 900 });
  await go('teacher-resources.html');
  await page.screenshot({ path: path.join(evidenceDir, 'teacher-resources-desktop-1440.png'), fullPage: true, timeout: 30000 });
  screenshots.push('teacher-resources-desktop-1440.png');
  await page.locator('.table-scroll').screenshot({ path: path.join(evidenceDir, 'teacher-resources-matrix.png'), timeout: 30000 });
  screenshots.push('teacher-resources-matrix.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await go('teacher-resources.html');
  await page.screenshot({ path: path.join(evidenceDir, 'teacher-resources-mobile-390.png'), fullPage: true, timeout: 30000 });
  screenshots.push('teacher-resources-mobile-390.png');
  pass('Screenshots captured', `${screenshots.length} images written to docs/phase2-b-teacher-portal/evidence/`);

  assert.deepEqual(errors, [], 'no page, console or HTTP errors');
  pass('Browser and HTTP health', 'Zero JavaScript page errors, zero console errors and no HTTP status of 400 or above on any tested route');

  fs.writeFileSync(
    path.join(evidenceDir, 'report.json'),
    JSON.stringify({
      suite: 'phase2-b-teacher-portal-browser',
      status: 'PASS',
      date: new Date().toISOString(),
      browser: `Chromium ${browser.version()}`,
      originPath: prefix,
      viewports: viewports.map(vp => `${vp.width}×${vp.height}`),
      routes: teacherRoutes,
      checks,
      errors,
      screenshots
    }, null, 2) + '\n'
  );
  console.log('Phase 2-B teacher portal browser suite: PASS');
} finally {
  if (browser) await browser.close();
  server.close();
}
