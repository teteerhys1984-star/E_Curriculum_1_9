import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'test-results', 'c3-accessibility');
fs.mkdirSync(evidenceDir, { recursive: true });
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html')).sort();
const testPages = htmlFiles.filter(file => /-test\.html$/.test(file));
const checks = [];
const errors = [];
// Optional focused runs make the pre-fix failures reproducible without changing main.
// The default and CI always run every section.
const section = process.env.C3_SECTION || 'all';
const sections = ['all', 'semantics', 'names', 'disclosures', 'keyboard', 'answered', 'gates', 'layout'];
if (!sections.includes(section)) throw new Error(`Unknown C3_SECTION: ${section}`);
const enabled = name => section === 'all' || section === name;
const pass = (name, detail) => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;
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
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  const go = async file => { await page.goto(origin + file, { waitUntil: 'load' }); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); };

  const auditSemantics = () => page.evaluate(() => {
    const clean = value => (value || '').replace(/\s+/g, ' ').trim();
    const nameOf = el => {
      const aria = el.getAttribute('aria-label');
      if (clean(aria)) return clean(aria);
      const refs = el.getAttribute('aria-labelledby');
      if (refs) return clean(refs.split(/\s+/).map(id => document.getElementById(id)?.textContent).join(' '));
      if (el.tagName === 'FIELDSET') { const legend = el.querySelector('legend'); if (legend && clean(legend.textContent)) return clean(legend.textContent); }
      const labels = Array.from(el.labels || []).map(label => label.textContent).join(' ');
      if (clean(labels)) return clean(labels);
      return clean(el.getAttribute('title'));
    };
    const ids = Array.from(document.querySelectorAll('[id]'), el => el.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const invalidReferences = [];
    for (const el of document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby],label[for]')) {
      for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for']) {
        if (!el.hasAttribute(attr)) continue;
        for (const id of el.getAttribute(attr).split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(id)) invalidReferences.push({ element: el.tagName, id: el.id, attr, target: id });
        }
      }
    }
    const unnamedControls = Array.from(document.querySelectorAll('input:not([type="hidden"]),textarea,select'))
      .filter(el => !nameOf(el)).map(el => ({ tag: el.tagName, id: el.id, name: el.name, placeholder: el.getAttribute('placeholder') }));
    const namedGenerics = Array.from(document.querySelectorAll('div[aria-label],span[aria-label],div[aria-labelledby],span[aria-labelledby]'))
      .filter(el => !el.hasAttribute('role')).map(el => ({ tag: el.tagName, class: el.className, label: el.getAttribute('aria-label') }));
    const revealButtons = Array.from(document.querySelectorAll('button[data-answer],button[data-a],button[data-reveal],button[data-toggle-answer],button.reveal'));
    const brokenReveals = revealButtons.filter(button => {
      const target = document.getElementById(button.getAttribute('aria-controls'));
      return !target || !['true', 'false'].includes(button.getAttribute('aria-expanded')) || button.type !== 'button';
    }).map(button => ({ text: clean(button.textContent), controls: button.getAttribute('aria-controls'), expanded: button.getAttribute('aria-expanded') }));
    const radioGroups = Array.from(document.querySelectorAll('#quiz [role="radiogroup"], #quiz fieldset'));
    const unnamedRadioGroups = radioGroups.filter(group => !nameOf(group)).map(group => ({ id: group.id, class: group.className }));
    // Finding no group element is itself a failure: do not audit only groups that already exist.
    const missingRadioGroups = new Set();
    for (const input of document.querySelectorAll('#quiz input[type="radio"]')) {
      let parent = input.parentElement;
      let named = false;
      while (parent && parent !== document.body) {
        if (parent.matches('fieldset,[role="radiogroup"]') && nameOf(parent)) { named = true; break; }
        parent = parent.parentElement;
      }
      if (!named) missingRadioGroups.add(input.name);
    }
    return { duplicateIds, invalidReferences, unnamedControls, namedGenerics, brokenReveals, unnamedRadioGroups, missingRadioGroups: [...missingRadioGroups], revealCount: revealButtons.length };
  });

  if (enabled('semantics')) {
    for (const file of htmlFiles) {
      await go(file);
      const audit = await auditSemantics();
      assert.deepEqual(audit.duplicateIds, [], `${file}: duplicate IDs`);
      assert.deepEqual(audit.invalidReferences, [], `${file}: invalid ARIA/label references`);
      assert.deepEqual(audit.unnamedControls, [], `${file}: controls need accessible names`);
      assert.deepEqual(audit.namedGenerics, [], `${file}: aria-label on generic elements needs a supporting role`);
      assert.deepEqual(audit.brokenReveals, [], `${file}: reveal buttons need type, aria-controls and aria-expanded`);
      assert.deepEqual(audit.unnamedRadioGroups, [], `${file}: radio groups need an accessible question label`);
      assert.deepEqual(audit.missingRadioGroups, [], `${file}: every quiz radio group needs a named group ancestor`);
    }
    pass('Rendered names, references and roles', `All ${htmlFiles.length} pages: no unnamed controls, duplicate IDs, broken ARIA/label references, named generic containers or unnamed/missing quiz radio groups`);
  }

  // Chromium's accessibility tree, not a custom HTML-attribute approximation.
  // Visit every step and audit each control once, including controls in inactive panels.
  if (enabled('names')) {
    const selector = 'input:not([type="hidden"]),textarea,select';
    const namedSnapshot = /^\w+ (?:"((?:[^"\\]|\\.)*)"|'((?:[^']|'')*)')/;
    let totalControls = 0;
    const missingNames = [];
    for (const file of htmlFiles) {
      await go(file);
      const expected = await page.locator(selector).count();
      await page.evaluate(selector => {
        window.__c3CheckedNames = new Set();
        document.querySelectorAll(selector).forEach((el, index) => el.setAttribute('data-c3-name-check', String(index)));
      }, selector);
      const stepCount = await page.locator('.content-nav-links button').count();
      const positions = stepCount ? Array.from({ length: stepCount }, (_, index) => index) : [-1];
      let checked = 0;
      for (const position of positions) {
        if (position >= 0) await page.locator('.content-nav-links button').nth(position).click();
        const pending = await page.evaluate(selector => {
          const result = [];
          document.querySelectorAll(selector).forEach((el, index) => {
            if (!el.checkVisibility() || window.__c3CheckedNames.has(index)) return;
            window.__c3CheckedNames.add(index);
            const refs = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
            const explicitName = Boolean((el.getAttribute('aria-label') || '').trim() || refs.some(id => document.getElementById(id)?.textContent.trim()) || Array.from(el.labels || []).some(label => label.textContent.trim()) || (el.getAttribute('title') || '').trim());
            result.push({ index, tag: el.tagName, id: el.id, name: el.name, placeholder: el.getAttribute('placeholder'), explicitName });
          });
          return result;
        }, selector);
        for (const control of pending) {
          const snapshot = await page.locator(`[data-c3-name-check="${control.index}"]`).ariaSnapshot();
          // ariaSnapshot is YAML: a name containing ':' can quote the entire role/name scalar.
          const scalar = snapshot.split('\n')[0].replace(/^\s*- /, '').replace(/:$/, '');
          const decoded = scalar.startsWith("'") ? scalar.slice(1, -1).replace(/''/g, "'") : scalar.startsWith('"') ? JSON.parse(scalar) : scalar;
          const nameMatch = decoded.match(namedSnapshot);
          const accessibleName = nameMatch ? (nameMatch[1] !== undefined ? JSON.parse('"' + nameMatch[1] + '"') : nameMatch[2].replace(/''/g, "'")) : '';
          const placeholderOnly = !control.explicitName && Boolean(control.placeholder?.trim()) && accessibleName === control.placeholder.replace(/\s+/g, ' ').trim();
          if (!nameMatch || placeholderOnly) missingNames.push({ file, ...control, reason: placeholderOnly ? 'placeholder-only name' : 'missing accessibility-tree name', snapshot });
          checked++;
        }
      }
      assert.equal(checked, expected, `${file}: every form control must be reachable in a visible lesson step`);
      totalControls += checked;
      await page.evaluate(selector => {
        document.querySelectorAll(selector).forEach(el => el.removeAttribute('data-c3-name-check'));
        delete window.__c3CheckedNames;
      }, selector);
    }
    assert.deepEqual(missingNames, [], 'Chromium accessibility-tree names are required; placeholders alone are insufficient');
    pass('Chromium computed accessible names', `${totalControls} unique controls across all ${htmlFiles.length} pages and every lesson step have a non-empty accessibility-tree name; placeholders alone are insufficient`);
  }

  if (enabled('disclosures')) {
    let totalReveals = 0;
    const selector = 'button[data-answer],button[data-a],button[data-reveal],button[data-toggle-answer],button.reveal';
    for (const file of htmlFiles) {
      await go(file);
      const revealCount = await page.locator(selector).count();
      for (let index = 0; index < revealCount; index++) {
        const button = page.locator(selector).nth(index);
        const controls = await button.getAttribute('aria-controls');
        const target = page.locator(`[id="${controls}"]`);
        const initial = await button.getAttribute('aria-expanded');
        const initialStatus = await button.evaluate(el => {
          const status = el.nextElementSibling;
          return status?.matches('[data-reveal-status]') ? { role: status.getAttribute('role'), live: status.getAttribute('aria-live'), text: status.textContent } : null;
        });
        assert.deepEqual(initialStatus, { role: 'status', live: 'polite', text: '' }, `${file}: reveal ${index} needs an empty live region registered before its first activation`);
        await button.evaluate(el => el.click());
        assert.equal(await button.getAttribute('aria-expanded'), initial === 'true' ? 'false' : 'true', `${file}: reveal ${index} expands`);
        const open = await target.evaluate(el => !el.hidden && getComputedStyle(el).display !== 'none');
        assert.equal(open, initial !== 'true', `${file}: reveal ${index} panel visibility matches state`);
        const status = await button.evaluate(el => el.nextElementSibling?.matches('[data-reveal-status]') ? el.nextElementSibling.textContent : '');
        assert.match(status, /shown|hidden/, `${file}: reveal ${index} announces state`);
        await button.evaluate(el => el.click());
        assert.equal(await button.getAttribute('aria-expanded'), initial, `${file}: reveal ${index} returns to initial state`);
        totalReveals++;
      }
    }
    pass('Practice reveal controls', `${totalReveals} legacy and modern reveals have a pre-registered live region, valid controlled panel, synchronized aria-expanded and shown/hidden announcements`);
  }

  if (enabled('keyboard')) {
    // Keyboard activation and focus visibility on representative legacy and modern pages.
    for (const file of ['grade3-unit1-lesson1-pupil-book.html', 'grade3-unit1-lesson2-workbook.html', 'grade8-unit1-lesson1-workbook.html']) {
      await go(file);
      const button = page.locator('button[data-answer],button[data-a],button[data-reveal],button[data-toggle-answer],button.reveal').first();
      await button.evaluate(el => { el.closest('.content-step-hidden')?.classList.remove('content-step-hidden'); el.focus(); });
      assert.equal(await button.evaluate(el => document.activeElement === el), true, `${file}: reveal can receive keyboard focus`);
      const controls = await button.getAttribute('aria-controls');
      await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-expanded'), 'true', `${file}: Enter opens reveal`);
      assert.equal(await page.locator(`[id="${controls}"]`).evaluate(el => !el.hidden && getComputedStyle(el).display !== 'none'), true);
      await page.keyboard.press('Space');
      assert.equal(await button.getAttribute('aria-expanded'), 'false', `${file}: Space closes reveal`);
    }
    pass('Keyboard reveal operation', 'Enter and Space toggle legacy and modern practice reveals without moving focus away from the button');
  }

  if (enabled('answered')) {
    // Answered question index: visible mark, accessible name and live state, including written responses and reset.
    for (const file of testPages) {
      await go(file);
      const firstQuestion = page.locator('#quiz .question').first();
      const firstRadio = firstQuestion.locator('input[type="radio"]').first();
      const indexButton = page.locator('.content-nav.is-quiz-nav .content-nav-links button').first();
      assert.equal(await indexButton.locator('.question-state').isVisible(), false, `${file}: unanswered mark is not shown`);
      assert.match(await indexButton.getAttribute('aria-label'), /not answered/i, `${file}: initial accessible state`);
      await firstRadio.focus();
      await page.keyboard.press('Space');
      assert.equal(await indexButton.locator('.question-state').isVisible(), true, `${file}: answered mark is visible`);
      assert.match(await indexButton.getAttribute('aria-label'), /question 1, answered/i, `${file}: answered accessible state`);
      assert.match(await page.locator('[data-question-index-status]').textContent(), /Question 1: Answered/, `${file}: answered state is announced`);
      const resetButton = page.locator('#quiz button[type="reset"], #reset, #clear').first();
      if (await resetButton.count()) {
        await resetButton.focus();
      await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.content-nav-links button')?.classList.contains('is-answered'));
        assert.equal(await indexButton.locator('.question-state').isVisible(), false, `${file}: reset removes answered mark`);
        assert.match(await indexButton.getAttribute('aria-label'), /not answered/i, `${file}: reset restores accessible state`);
      }
      const written = page.locator('#quiz textarea, #quiz input[type="text"]').first();
      if (await written.count()) {
        await written.evaluate(el => { el.value = '   '; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
        const writtenIndex = await written.evaluate(el => Array.from(document.querySelectorAll('#quiz .question')).indexOf(el.closest('.question')));
        const writtenButton = page.locator('.content-nav-links button').nth(writtenIndex);
        assert.match(await writtenButton.getAttribute('aria-label'), /not answered/i, `${file}: whitespace is not an answer`);
        await written.evaluate(el => { el.value = 'Practice response'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
        assert.match(await writtenButton.getAttribute('aria-label'), /answered/i, `${file}: written response marks answered`);
      }
    }
    pass('Answered-state regression', `All ${testPages.length} tests expose a visible check mark, accessible answered/not-answered name and live state; reset and whitespace-only writing clear the state`);
  }

  if (enabled('gates')) {
    // Teacher gate ARIA must follow the existing password behaviour without changing the key or scoring.
    const oldTest = fs.readFileSync(path.join(root, 'grade3-unit1-lesson1-test.html'), 'utf8');
    const codes = oldTest.match(/String\.fromCharCode\(([^)]+)\)/)[1].split(',').map(Number);
    const teacherPassword = String.fromCharCode(...codes);
    const keyedTests = [
      { file: 'grade3-unit1-lesson1-test.html', password: '#teacher-password', unlock: '#unlock-solutions', panel: '#answer-guide' },
      { file: 'grade3-unit1-lesson2-test.html', password: '#teacher-password', unlock: '#unlock-solutions', panel: '#answer-guide', lock: '#lock-solutions' },
      { file: 'grade4-unit1-lesson2-test.html', password: '#teacher-password', unlock: '#unlock-solutions', panel: '#answer-guide', lock: '#lock-solutions' },
      { file: 'grade5-unit1-lesson1-test.html', password: '#teacher-password', unlock: '#verify-password', panel: '#answer-key' },
      { file: 'grade5-unit1-lesson2-test.html', password: '#pw', unlock: '#unlock', panel: '#key' },
      { file: 'grade8-unit1-lesson1-test.html', password: '#pw', unlock: '#unlock', panel: '#key' }
    ];
    for (const item of keyedTests) {
      await go(item.file);
      const unlock = page.locator(item.unlock);
      assert.equal(await unlock.getAttribute('aria-controls'), item.panel.slice(1), `${item.file}: gate button controls key`);
      assert.equal(await unlock.getAttribute('aria-expanded'), 'false', `${item.file}: key starts closed`);
      await page.locator(item.password).fill('not-the-password');
      await unlock.evaluate(el => el.click());
      assert.equal(await unlock.getAttribute('aria-expanded'), 'false', `${item.file}: wrong password keeps key closed`);
      await page.locator(item.password).fill(teacherPassword);
      await unlock.evaluate(el => el.click());
      assert.equal(await unlock.getAttribute('aria-expanded'), 'true', `${item.file}: correct password opens key`);
      assert.equal(await page.locator(item.panel).evaluate(el => !el.hidden && getComputedStyle(el).display !== 'none'), true);
      if (item.lock) {
        await page.locator(item.lock).evaluate(el => el.click());
        assert.equal(await unlock.getAttribute('aria-expanded'), 'false', `${item.file}: lock closes key`);
        assert.equal(await unlock.evaluate(el => document.activeElement === el), true, `${item.file}: lock returns focus to unlock`);
      }
    }
    pass('Teacher gate accessibility', 'Six existing keyed tests keep the C-2 separation, expose aria-expanded, reject wrong passwords and synchronize the open/closed state');
  }

  if (enabled('layout')) {
    // Mobile overflow and forced-colors survival of the non-colour answered mark.
    await page.setViewportSize({ width: 390, height: 844 });
    for (const file of testPages) {
      await go(file);
      const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      assert.ok(widths.document <= widths.viewport + 1 && widths.body <= widths.viewport + 1, `${file}: mobile overflow ${JSON.stringify(widths)}`);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    await go('grade3-unit1-lesson2-test.html');
    await page.locator('#q1 input[type="radio"]').first().evaluate(el => el.click());
    assert.equal(await page.locator('.content-nav-links button .question-state').first().isVisible(), true, 'forced colors keeps the answered check mark');
    await page.screenshot({ path: path.join(evidenceDir, 'answered-state-forced-colors-390.png') });
    await page.emulateMedia({ forcedColors: 'none' });
    pass('Mobile and forced-colors regression', 'Seven test pages avoid horizontal overflow at 390px; the answered check mark remains visible in forced-colors mode');
  }

  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  const report = { suite: 'c3-accessibility-browser', date: new Date().toISOString(), section, status: 'PASS', checks, errors };
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
