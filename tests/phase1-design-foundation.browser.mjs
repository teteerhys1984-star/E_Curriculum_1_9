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

const htmlPages = fs.readdirSync(root).filter(file => file.endsWith('.html')).sort();
const checks = [];
const errors = [];

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

  await page.route('**/*', route =>
    route.request().url().startsWith(origin) ? route.continue() : route.abort()
  );

  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ url: page.url(), consoleError: msg.text() });
    }
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
      const docScroll = document.documentElement.scrollWidth;
      const bodyScroll = document.body.scrollWidth;
      const bodyPadRight = getComputedStyle(document.body).paddingRight;
      const header = document.querySelector('.site-header');
      const headerWidth = header ? header.getBoundingClientRect().width : 0;

      const clipped = [];
      for (const el of document.querySelectorAll('.site-header, .btn, button, .card, .panel, .question')) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right > vw + 1.5 || rect.left < -1.5) {
          clipped.push(`${el.tagName.toLowerCase()}.${el.className}: [${Math.round(rect.left)}..${Math.round(rect.right)}] > ${vw}`);
        }
      }

      return { vw, docScroll, bodyScroll, bodyPadRight, headerWidth, clipped: clipped.slice(0, 5) };
    });

    assert.ok(metrics.docScroll <= metrics.vw + 1, `${label}: docScroll ${metrics.docScroll} > ${metrics.vw}`);
    assert.ok(metrics.bodyScroll <= metrics.vw + 1, `${label}: bodyScroll ${metrics.bodyScroll} > ${metrics.vw}`);
    assert.equal(metrics.bodyPadRight, '0px', `${label}: body must not use right-padding hack`);
    assert.ok(Math.abs(metrics.headerWidth - metrics.vw) <= 2, `${label}: site-header must span full viewport width`);
    assert.deepEqual(metrics.clipped, [], `${label}: clipped/overflowing elements`);
  };

  // 1. Six required responsive viewports across representative platform and lesson routes
  const requiredViewports = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 740 }
  ];

  const coreRoutes = [
    'index.html',
    'lessons.html?grade=4',
    'lessons.html?grade=1',
    'round-tests.html?grade=4',
    'lesson-menu.html?grade=2&lesson=1',
    'lesson.html?grade=2&lesson=1&section=pupil-book',
    'grade4-unit1-lesson2.html',
    'grade4-unit1-lesson2-pupil-book.html',
    'grade4-unit1-lesson2-workbook.html',
    'grade4-unit1-lesson2-vocabulary.html',
    'grade4-unit1-lesson2-test.html',
    'grade5-unit1-lesson1.html',
    'grade5-unit1-lesson1-test.html',
    'grade8-unit1-lesson1-pupil-book.html'
  ];

  for (const vp of requiredViewports) {
    await page.setViewportSize(vp);
    for (const route of coreRoutes) {
      await go(route);
      await assertLayoutIntegrity(`${route} @ ${vp.width}×${vp.height}`);

      const hasNav = await page.locator('.content-nav').count();
      if (hasNav) {
        const navPos = await page.locator('.content-nav').evaluate(el => getComputedStyle(el).position);
        if (vp.width >= 980) {
          assert.equal(navPos, 'sticky', `${route} @ ${vp.width}: desktop step nav should be sticky in grid column 2`);
        } else {
          assert.equal(navPos, 'static', `${route} @ ${vp.width}: <=979px step nav must stay static in normal flow`);
        }
      }
    }
  }
  pass(
    'Responsive layout across all 6 required viewports',
    `${coreRoutes.length} representative routes verified at 1440×900, 1366×768, 1024×768, 768×1024, 390×844, and 320×740 with zero overflow or clipping`
  );

  // 2. Full 40-page sweep at ultra-narrow 320×740 and wide 1440×900 + DOM ID & accessible control audit
  for (const vp of [{ width: 1440, height: 900 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(vp);
    for (const file of htmlPages) {
      await go(file);
      await assertLayoutIntegrity(`${file} @ ${vp.width}×${vp.height}`);

      if (vp.width === 1440) {
        const a11yAudit = await page.evaluate(() => {
          const seenIds = new Set();
          const duplicateIds = [];
          for (const el of document.querySelectorAll('[id]')) {
            if (seenIds.has(el.id)) duplicateIds.push(el.id);
            seenIds.add(el.id);
          }

          const unlabeled = [];
          const hasLabel = el => {
            if (el.getAttribute('aria-label')?.trim()) return true;
            const labelledBy = el.getAttribute('aria-labelledby');
            if (labelledBy && document.getElementById(labelledBy)?.textContent?.trim()) return true;
            if (el.labels && el.labels.length > 0 && Array.from(el.labels).some(l => l.textContent.trim())) return true;
            if (el.closest('label')?.textContent?.trim()) return true;
            if (el.getAttribute('title')?.trim()) return true;
            if (el.getAttribute('placeholder')?.trim()) return true;
            return false;
          };

          for (const ctrl of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
            if (!hasLabel(ctrl)) {
              unlabeled.push(`${ctrl.tagName.toLowerCase()}[name="${ctrl.name || ''}"][id="${ctrl.id || ''}"]`);
            }
          }

          for (const btn of document.querySelectorAll('button')) {
            const name = (btn.textContent || '').trim() || btn.getAttribute('aria-label') || btn.getAttribute('title');
            if (!name) unlabeled.push(`button[class="${btn.className}"]`);
          }

          return { duplicateIds, unlabeled };
        });

        assert.deepEqual(a11yAudit.duplicateIds, [], `${file}: duplicate live-DOM IDs`);
        assert.deepEqual(a11yAudit.unlabeled, [], `${file}: unlabeled form controls or buttons`);
      }
    }
  }
  pass(
    'Full 40-page narrowest (320×740) and wide (1440×900) layout & accessible control audit',
    `All ${htmlPages.length} pages have zero overflow, unique live-DOM IDs, and accessible labels on every form control and button`
  );

  // 3. Shared platform header, mobile drawer keyboard Escape close, breadcrumbs & 5-tab section switcher
  await page.setViewportSize({ width: 390, height: 844 });
  await go('grade3-unit1-lesson1-pupil-book.html');
  const mobileToggle = page.locator('.site-mobile-toggle');
  assert.equal(await mobileToggle.isVisible(), true, 'Mobile menu toggle visible at 390px');
  const toggleBox = await mobileToggle.boundingBox();
  assert.ok(toggleBox.width >= 44 && toggleBox.height >= 44, 'Mobile menu toggle meets >=44px touch target');
  assert.equal(await mobileToggle.getAttribute('aria-expanded'), 'false');
  await mobileToggle.click();
  assert.equal(await mobileToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#site-mobile-drawer').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await mobileToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#site-mobile-drawer').isVisible(), false);

  // Verify injected 5-tab .section-links and breadcrumbs on legacy Lesson 1 page
  assert.equal(await page.locator('.breadcrumbs li').count(), 4);
  assert.equal(await page.locator('.section-links a.section-link').count(), 5);
  assert.equal(await page.locator('.section-links a[aria-current="page"]').count(), 1);
  pass(
    'Unified header, mobile drawer Escape handling, breadcrumbs & 5-tab section links',
    'Verified touch target >=44px, drawer open/Escape close, 4-level breadcrumb trail, and standardized 5-tab section switcher'
  );

  // 4. Honest Continue Learning flow (empty state -> real visit -> clear -> forged payload rejection)
  await page.setViewportSize({ width: 1440, height: 900 });
  await go('index.html');
  await page.evaluate(() => localStorage.clear());
  await go('index.html');

  assert.equal(await page.locator('#continue-learning-panel.has-progress').count(), 0);
  assert.match(await page.locator('#continue-card-heading').textContent(), /Quick Start/i);

  // Visit a real prepared section page
  await go('grade4-unit1-lesson2-workbook.html');
  await go('index.html');
  assert.equal(await page.locator('#continue-learning-panel.has-progress').count(), 1);
  assert.match(await page.locator('#continue-card-heading').textContent(), /Continue on This Browser/i);
  assert.match(await page.locator('#continue-lesson-title').textContent(), /My Family/);
  assert.equal(
    await page.locator('#continue-card-actions a.btn-accent').getAttribute('href'),
    'grade4-unit1-lesson2-workbook.html'
  );

  // Clear saved place
  await page.locator('#continue-card-actions button', { hasText: 'Clear saved place' }).click();
  assert.equal(await page.locator('#continue-learning-panel.has-progress').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('efc_recent_visit_v1')), null);

  // Forged payload must be safely rejected, and tampered sectionLabel must be canonically normalized
  const forgedResult = await page.evaluate(() => {
    localStorage.setItem('efc_recent_visit_v1', JSON.stringify({ slug: 'grade99-fake', href: 'javascript:alert(1)' }));
    return window.EFCPlatform.readRecentVisit();
  });
  assert.equal(forgedResult, null, 'Forged localStorage visit entry must be rejected');

  const sanitizedLabel = await page.evaluate(() => {
    localStorage.setItem(
      'efc_recent_visit_v1',
      JSON.stringify({ slug: 'grade4-unit1-lesson2', href: 'grade4-unit1-lesson2-workbook.html', sectionLabel: 'Synced Cloud Account' })
    );
    return window.EFCPlatform.readRecentVisit()?.sectionLabel;
  });
  assert.equal(sanitizedLabel, 'Workbook', 'Tampered sectionLabel must be replaced with canonical section label');
  await page.evaluate(() => localStorage.clear());

  await go('lesson.html?grade=8&lesson=2&section=pupil-book');
  assert.match(await page.locator('.breadcrumbs').textContent(), /Student's Book/);
  pass(
    'Honest device-local Continue Learning state & canonical metadata',
    'Default Quick Start verified; real lesson visit persisted locally; Clear button resets state; forged payload rejected; tampered label normalized'
  );

  // 5. Compact 5-column quiz navigator, stepper placement & answered-question state across radio + written tests
  for (const quizPage of ['grade4-unit1-lesson2-test.html', 'grade5-unit1-lesson1-test.html']) {
    await go(quizPage);
    assert.equal(await page.locator('.content-nav.is-quiz-nav .content-nav-links button').count(), 20);
    assert.equal(await page.locator('.content-nav-links button.is-answered').count(), 0);
    await page.locator('form#quiz .question').first().locator('input[type="radio"]').first().check();
    assert.equal(await page.locator('.content-nav-links button.is-answered').count(), 1);
  }
  await go('grade3-unit1-lesson1-test.html');
  const stepperAboveCheck = await page.evaluate(() => {
    const stepTop = document.querySelector('.lesson-step-footer').getBoundingClientRect().top;
    const checkTop = document.getElementById('check').getBoundingClientRect().top;
    return stepTop < checkTop;
  });
  assert.equal(stepperAboveCheck, true, 'Question stepper must appear above Check my answers button');
  await page.locator('.content-nav-links button').nth(15).click();
  await page.locator('textarea[name="w16"]').fill('She has got brown eyes.');
  assert.equal(await page.locator('.content-nav-links button').nth(15).evaluate(el => el.classList.contains('is-answered')), true);
  pass(
    'Compact 20-question test grid, stepper order & answered-state indicator',
    'Verified 20 numbered buttons, stepper above Check button, and live .is-answered highlight on choice and written questions'
  );

  // 6. Bundled local WOFF2 font decoding, keyboard focus, WCAG AA contrast & prefers-reduced-motion
  await go('index.html');
  const fontAudit = await page.evaluate(async () => {
    const faces = Array.from(document.fonts);
    await Promise.all(faces.map(f => f.load()));
    return faces.map(f => ({ family: f.family, status: f.status }));
  });
  assert.equal(fontAudit.length, 6, 'Expected all 6 @font-face declarations in design-system.css');
  for (const face of fontAudit) {
    assert.equal(face.status, 'loaded', `Bundled local font ${face.family} failed to load: ${face.status}`);
  }
  await page.keyboard.press('Tab');
  const firstFocusedClass = await page.evaluate(() => document.activeElement?.className || '');
  assert.equal(firstFocusedClass, 'skip-link', 'First Tab stop should focus .skip-link');
  const focusOutline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  assert.notEqual(focusOutline.style, 'none');
  assert.ok(focusOutline.width >= 2, 'Visible >=2px focus outline required');

  const contrastReport = await page.evaluate(() => {
    function parseRgb(str) {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
      if (!m) return [255, 255, 255, 1];
      return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
    }
    function effectiveBg(el) {
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const [r, g, b, a] = parseRgb(getComputedStyle(cur).backgroundColor);
        if (a >= 0.95) return [r, g, b];
        cur = cur.parentElement;
      }
      return [250, 249, 246];
    }
    function lum([r, g, b]) {
      const chan = [r, g, b].map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
    }
    function ratio(fg, bg) {
      const l1 = lum(fg);
      const l2 = lum(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    const targets = [
      ['Hero H1', document.querySelector('#home-heading'), 3.0],
      ['Hero lead copy', document.querySelector('.hero-lead'), 4.5],
      ['Header nav link', document.querySelector('.site-nav-link'), 4.5],
      ['Primary CTA button', document.querySelector('.btn-primary'), 4.5],
      ['Accent CTA button', document.querySelector('.btn-accent'), 4.5],
      ['Secondary button', document.querySelector('.btn-secondary'), 4.5],
      ['Available badge', document.querySelector('.badge-available'), 4.5],
      ['Upcoming badge', document.querySelector('.badge-upcoming'), 4.5]
    ];

    return targets.map(([label, el, min]) => {
      if (!el) return { label, ok: false, r: 0, min };
      const fg = parseRgb(getComputedStyle(el).color);
      const bg = effectiveBg(el);
      const r = Number(ratio(fg, bg).toFixed(2));
      return { label, ok: r >= min, r, min };
    });
  });

  for (const item of contrastReport) {
    assert.equal(item.ok, true, `${item.label}: contrast ${item.r}:1 < ${item.min}:1`);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionCheck = await page.evaluate(() => {
    const htmlScroll = getComputedStyle(document.documentElement).scrollBehavior;
    const btnDur = parseFloat(getComputedStyle(document.querySelector('.btn')).transitionDuration);
    return { htmlScroll, btnDur };
  });
  assert.equal(reducedMotionCheck.htmlScroll, 'auto');
  assert.ok(reducedMotionCheck.btnDur <= 0.001, 'prefers-reduced-motion must collapse transitions');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  pass(
    'Keyboard focus, WCAG AA contrast & prefers-reduced-motion',
    `Skip-link focusable with >=2px outline; all ${contrastReport.length} component contrast pairs pass WCAG AA; reduced motion verified`
  );

  // 7. Zero console/page/HTTP errors
  assert.deepEqual(errors, [], `Unexpected console, page, or HTTP errors: ${JSON.stringify(errors)}`);
  pass('Console, runtime & HTTP health', 'Zero console errors, zero page errors, zero HTTP >=400 responses');

  console.log(
    JSON.stringify(
      {
        suite: 'phase1-design-foundation-browser',
        status: 'PASS',
        date: new Date().toISOString(),
        viewports: requiredViewports.map(v => `${v.width}×${v.height}`),
        pageCount: htmlPages.length,
        contrastSample: contrastReport,
        checks
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close();
  server.close();
}
