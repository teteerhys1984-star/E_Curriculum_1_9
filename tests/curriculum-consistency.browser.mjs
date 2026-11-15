/* Rendered curriculum consistency audit.

   tests/curriculum-registry.mjs proves that the authoritative registry in
   platform-shell.js matches the lesson pages on disk and the markup of every display
   surface. This suite proves the same agreement for the pages a pupil or teacher
   actually sees after platform-shell.js runs: the derived counts, ranges, titles and
   readiness labels must be re-rendered from window.EFCPlatform on every page, for every
   grade from 1 to 9, with no fallback text and no console error left behind.

   Expectations are read from the registry exposed by the page itself, so nothing here
   pins a lesson count. The suite reports drift by naming the page, the surface and the
   value that disagreed. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'test-results', 'curriculum-consistency');
fs.mkdirSync(evidenceDir, { recursive: true });
const prefix = '/E_Curriculum_1_9/';
const checks = [];
const errors = [];
const drift = [];
const pass = (name, detail = '') => {
  checks.push({ name, status: 'PASS', detail });
  console.log('PASS', name, detail ? `— ${detail}` : '');
};
const note = (page, surface, detail) => {
  drift.push({ page, surface, detail });
  console.log('DRIFT', page, '|', surface, '|', detail);
};

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml'
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end('Use project-prefix URL'); return; }
  const relative = pathname.slice(prefix.length) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${prefix}`;

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
  page.setDefaultTimeout(20000);
  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ url: page.url(), console: message.text() });
  });
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      errors.push({ url: response.url(), status: response.status() });
    }
  });

  const open = async (target, query = '') => {
    const url = `${origin}${target}${query}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean(window.EFCPlatform && window.EFCPlatform.LESSONS), null, { timeout: 15000 });
    return url;
  };

  /* ---------------------------------------------------------------- *
   * 1. Homepage: hero totals, nine grade cards, prepared-lesson list
   * ---------------------------------------------------------------- */

  const homeUrl = await open('index.html');
  const home = await page.evaluate(() => {
    const curriculum = window.EFCPlatform;
    const totals = curriculum.platformTotals();
    const problems = [];
    const expect = (surface, actual, expected) => {
      if (String(actual) !== String(expected)) {
        problems.push(`${surface}: rendered "${actual}", registry says "${expected}"`);
      }
    };

    for (const node of document.querySelectorAll('[data-curriculum-count]')) {
      const key = node.getAttribute('data-curriculum-count');
      expect(`hero total ${key}`, node.textContent, totals[key]);
    }
    for (const node of document.querySelectorAll('[data-curriculum-count-words]')) {
      const key = node.getAttribute('data-curriculum-count-words');
      expect(`spelled total ${key}`, node.textContent.toLowerCase(), curriculum.numberToWords(totals[key]).toLowerCase());
    }
    const list = items => items.length < 2 ? String(items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
    const TOTALS = {
      'verified-lessons-pages': `${totals.lessons} verified lessons \u00b7 ${totals.pages} pages`,
      'lessons-pages': `${totals.lessons} lessons \u00b7 ${totals.pages} pages`,
      'ready-grades': totals.readyGradeList,
      'ready-grade-numbers': totals.readyGradeNumbers,
      'template-grade-numbers': list(totals.templateGrades.map(grade => String(grade)))
    };
    const checkTotals = () => {
      for (const node of document.querySelectorAll('[data-curriculum-totals]')) {
        const format = node.getAttribute('data-curriculum-totals');
        if (!(format in TOTALS)) { problems.push(`totals ${format}: no format is bound for this hook`); continue; }
        expect(`totals ${format}`, node.textContent.trim(), TOTALS[format]);
      }
    };
    checkTotals();

    const cards = [...document.querySelectorAll('#grades > a.grade')];
    const grades = Array.from({ length: curriculum.GRADE_MAX - curriculum.GRADE_MIN + 1 }, (_, i) => curriculum.GRADE_MIN + i);
    expect('grade card count', cards.length, grades.length);

    grades.forEach((grade, index) => {
      const card = cards[index];
      if (!card) return;
      const summary = curriculum.gradeSummary(grade);
      const label = card.querySelector('.num')?.textContent.trim();
      expect(`card ${grade} heading`, label, `Grade ${grade}`);
      expect(`card ${grade} link`, card.getAttribute('href'), `lessons.html?grade=${grade}`);
      expect(`card ${grade} state class`, card.classList.contains(summary.isReady ? 'is-available' : 'is-upcoming'), true);
      expect(`card ${grade} badge`, card.querySelector('.grade-top .badge')?.textContent.trim(), curriculum.readinessBadge(grade));

      const summaryNode = card.querySelector('[data-curriculum-summary]');
      if (summary.isReady) {
        if (!summaryNode) { problems.push(`card ${grade}: readiness sentence is not derived from the registry`); return; }
        expect(`card ${grade} readiness range`, summaryNode.textContent, curriculum.readinessSummary(grade));
        const emphasised = [...summaryNode.querySelectorAll('em')].map(node => node.textContent.trim());
        expect(`card ${grade} titles`, JSON.stringify(emphasised), JSON.stringify(summary.titles));
        expect(`card ${grade} title count`, emphasised.length, summary.readyCount);
      } else if (summaryNode) {
        problems.push(`card ${grade}: a template-only grade must not advertise ready lessons`);
      }
    });

    const registered = curriculum.registeredLessons();
    const readyGrades = curriculum.readyGrades().map(grade => curriculum.gradeSummary(grade));
    const heads = [...document.querySelectorAll('.directory-grade-head h3')].map(node => node.textContent.trim());
    expect('directory grade groups', JSON.stringify(heads),
      JSON.stringify(readyGrades.map(summary => `Grade ${summary.grade} \u00b7 ${summary.unitLabel}`)));
    const rows = [...document.querySelectorAll('.directory-lesson-row')];
    expect('directory rows', rows.length, registered.length);
    rows.forEach((row, index) => {
      const entry = registered[index];
      expect(`directory row ${index + 1} label`, row.querySelector('.directory-lesson-info strong')?.textContent.trim(),
        `Lesson ${entry.lesson} \u00b7 ${entry.title}`);
      const links = [...row.querySelectorAll('.directory-quick-links a')].map(link => link.getAttribute('href'));
      expect(`directory row ${index + 1} links`, JSON.stringify(links), JSON.stringify(
        ['', '-pupil-book', '-workbook', '-vocabulary', '-test'].map(suffix => `${entry.slug}${suffix}.html`)));
    });

    return {
      problems,
      hero: [...document.querySelectorAll('.stat')].map(stat => `${stat.querySelector('b')?.textContent.trim()} | ${stat.querySelector('span')?.textContent.trim()}`),
      cards: [...document.querySelectorAll('#grades > a.grade')].map(card => ({
        grade: card.querySelector('.num')?.textContent.trim(),
        badge: card.querySelector('.grade-top .badge')?.textContent.trim(),
        summary: card.querySelector('[data-curriculum-summary]')?.textContent.trim() ?? card.querySelector('p')?.textContent.trim(),
        titles: [...card.querySelectorAll('[data-curriculum-summary] em')].map(node => node.textContent.trim())
      })),
      registry: { grades: totals.grades, lessons: totals.lessons, pages: totals.pages, answerKeyAreas: totals.answerKeyAreas }
    };
  });
  home.problems.forEach(problem => note('index.html', 'homepage surface', problem));
  assert.deepEqual(home.problems, [], 'index.html must render every curriculum number from the registry');
  fs.writeFileSync(path.join(evidenceDir, 'index-curriculum.json'), JSON.stringify(home, null, 2));
  pass('Homepage renders registry values',
    `hero ${home.hero.join(' · ')}; grade cards ${home.cards.map(card => `${card.grade}=${card.badge}`).join(', ')}`);

  /* ---------------------------------------------------------------- *
   * 2. Grade lesson menus, all nine grades
   * ---------------------------------------------------------------- */

  const listingReports = [];
  for (const grade of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const url = await open('lessons.html', `?grade=${grade}`);
    const report = await page.evaluate(() => {
      const curriculum = window.EFCPlatform;
      const params = new URLSearchParams(location.search);
      const grade = Number(params.get('grade'));
      const summary = curriculum.gradeSummary(grade);
      const totals = curriculum.platformTotals();
      const problems = [];
      const expect = (surface, actual, expected) => {
        if (String(actual) !== String(expected)) problems.push(`${surface}: rendered "${actual}", registry says "${expected}"`);
      };

      expect('document title', document.title, `English Full Curriculum | Grade ${grade} Lessons`);
      expect('grade heading', document.getElementById('title')?.textContent.trim(), `Grade ${grade} Curriculum`);

      const chips = [...document.querySelectorAll('#grade-switcher a.grade-chip')];
      expect('grade switcher chips', chips.length, curriculum.GRADE_MAX - curriculum.GRADE_MIN + 1);
      expect('grade switcher current', chips.filter(chip => chip.getAttribute('aria-current') === 'page').map(chip => chip.textContent.trim()), `Grade ${grade}`);
      const dotted = chips.filter(chip => chip.querySelector('.grade-chip-dot')).map(chip => chip.getAttribute('href'));
      expect('prepared-grade dots', JSON.stringify(dotted),
        JSON.stringify(curriculum.readyGrades().filter(other => other !== grade).map(other => `lessons.html?grade=${other}`)));

      const links = [...document.querySelectorAll('#lesson-list a.lesson')];
      if (summary.isReady) {
        expect('unit heading', document.getElementById('unit-heading')?.textContent.trim(), `${summary.unitLabel} Lessons`);
        expect('lesson count', links.length, summary.readyCount);
        expect('badges', document.getElementById('grade-badges')?.textContent.trim(),
          `${summary.readyCount} prepared ${summary.readyCount === 1 ? 'lesson' : 'lessons'} available${summary.unitLabel} active`);
        expect('grade summary', document.getElementById('grade-summary')?.textContent.trim(),
          `Grade ${grade} currently includes ${summary.readyCount} complete, source-verified ${summary.unitLabel} ${summary.readyCount === 1 ? 'lesson' : 'lessons'}. Open a lesson below to study the book pages, complete Workbook activities, review Vocabulary, or take the Lesson Test.`);
        expect('round coverage copy', document.getElementById('round-copy')?.textContent.trim(),
          `Grade ${grade} has ${summary.roundCoverage} of ${totals.roundSize} verified lessons for Round 1 coverage. The cumulative Round 1 test has not been published.`);
        links.forEach((link, index) => {
          const entry = summary.lessons[index];
          expect(`lesson ${index + 1} href`, link.getAttribute('href'), `${entry.slug}.html`);
          expect(`lesson ${index + 1} title`, link.querySelector('strong')?.textContent.trim(), `Lesson ${entry.lesson} \u00b7 ${entry.title}`);
          expect(`lesson ${index + 1} unit badge`, link.querySelector('.badge')?.textContent.trim(), `Available \u00b7 Unit ${entry.unit}`);
        });
      } else {
        expect('lesson count', links.length, 3);
        expect('badges', document.getElementById('grade-badges')?.textContent.trim(), 'Curriculum in preparationTemplate structure preview');
        expect('grade summary', document.getElementById('grade-summary')?.textContent.trim(),
          `Verified textbook scans for Grade ${grade} are currently in preparation. You can preview the standard 4-part lesson layout below or switch to Grades ${totals.readyGradeNumbers} for complete live lessons.`);
        expect('round coverage copy', document.getElementById('round-copy')?.textContent.trim(),
          `Grade ${grade} needs ${curriculum.numberToWords(totals.roundSize)} verified lessons for Round 1 coverage. The cumulative Round 1 test has not been published.`);
        links.forEach((link, index) => {
          expect(`template ${index + 1} target`, link.getAttribute('href'), `lesson-menu.html?grade=${grade}&lesson=${index + 1}`);
        });
        problems.push(...[...document.querySelectorAll('#lesson-list')].flatMap(node =>
          /Lesson \d+ \u00b7 [A-Z]/.test(node.textContent) ? ['a template-only grade lists a lesson title it does not have'] : []));
      }

      return {
        problems,
        grade,
        readyCount: summary.readyCount,
        renderedCount: links.length,
        summary: document.getElementById('grade-summary')?.textContent.trim(),
        titles: links.map(link => link.querySelector('strong')?.textContent.trim() ?? link.textContent.trim())
      };
    });
    report.problems.forEach(problem => note(url, 'grade lesson menu', problem));
    assert.deepEqual(report.problems, [], `lessons.html?grade=${grade} must render from the registry`);
    listingReports.push(report);
  }
  fs.writeFileSync(path.join(evidenceDir, 'lessons-per-grade.json'), JSON.stringify(listingReports, null, 2));
  pass('Grade lesson menus render registry values for Grades 1-9',
    listingReports.map(report => `G${report.grade}=${report.renderedCount}`).join(' '));

  /* ---------------------------------------------------------------- *
   * 3. Round-test directories, all nine grades
   * ---------------------------------------------------------------- */

  const roundReports = [];
  for (const grade of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const url = await open('round-tests.html', `?grade=${grade}`);
    const report = await page.evaluate(() => {
      const curriculum = window.EFCPlatform;
      const params = new URLSearchParams(location.search);
      const grade = Number(params.get('grade'));
      const summary = curriculum.gradeSummary(grade);
      const totals = curriculum.platformTotals();
      const problems = [];
      const expect = (surface, actual, expected) => {
        if (String(actual) !== String(expected)) problems.push(`${surface}: rendered "${actual}", registry says "${expected}"`);
      };

      expect('document title', document.title, `English Full Curriculum | Grade ${grade} Round Tests`);
      const pills = [...document.querySelectorAll('#status-pills .badge')].map(node => node.textContent.trim());
      expect('coverage pill', pills[0], `${summary.roundCoverage} of ${totals.roundSize} Round 1 lessons covered`);
      expect('round size pill', pills[1], `${totals.roundSize} lessons per round`);

      const panel = document.getElementById('available-tests-panel');
      const links = [...document.querySelectorAll('#available-tests-links a')];
      if (summary.isReady) {
        expect('individual test panel visible', panel && !panel.hidden, true);
        expect('individual test count', links.length, summary.readyCount);
        links.forEach((link, index) => {
          const entry = summary.lessons[index];
          expect(`test ${index + 1} href`, link.getAttribute('href'), `${entry.slug}-test.html`);
          expect(`test ${index + 1} label`, link.textContent.trim(), `Lesson ${entry.lesson} Test \u00b7 ${entry.title}`);
        });
      } else {
        expect('individual test panel hidden', Boolean(panel) && panel.hidden, true);
        expect('individual test count', links.length, 0);
      }

      const rounds = [...document.querySelectorAll('#round-cards article')];
      expect('round cards', rounds.length, 4);
      rounds.forEach((card, index) => {
        const ready = index === 0 ? summary.roundCoverage : 0;
        expect(`round ${index + 1} range`, card.querySelector('h2')?.textContent.trim(),
          `Round ${index + 1} \u00b7 Lessons ${index * totals.roundSize + 1}\u2013${(index + 1) * totals.roundSize}`);
        expect(`round ${index + 1} coverage`, card.querySelector('.badge')?.textContent.trim(),
          `Not published \u00b7 ${ready}/${totals.roundSize} lessons covered`);
      });

      return { problems, grade, readyCount: summary.readyCount, tests: links.length, hidden: Boolean(panel?.hidden), pills };
    });
    report.problems.forEach(problem => note(url, 'round-test directory', problem));
    assert.deepEqual(report.problems, [], `round-tests.html?grade=${grade} must render from the registry`);
    roundReports.push(report);
  }
  fs.writeFileSync(path.join(evidenceDir, 'round-tests-per-grade.json'), JSON.stringify(roundReports, null, 2));
  pass('Round-test directories render registry values for Grades 1-9',
    roundReports.map(report => `G${report.grade}=${report.tests}${report.hidden ? '(hidden)' : ''}`).join(' '));

  /* ---------------------------------------------------------------- *
   * 4. Teacher portal and teacher resources
   * ---------------------------------------------------------------- */

  const teacherUrl = await open('teacher.html');
  const teacher = await page.evaluate(() => {
    const curriculum = window.EFCPlatform;
    const totals = curriculum.platformTotals();
    const problems = [];
    const expect = (surface, actual, expected) => {
      if (String(actual) !== String(expected)) problems.push(`${surface}: rendered "${actual}", registry says "${expected}"`);
    };

    for (const node of document.querySelectorAll('[data-curriculum-count]')) {
      const key = node.getAttribute('data-curriculum-count');
      expect(`hero total ${key}`, node.textContent, totals[key]);
    }
    for (const node of document.querySelectorAll('[data-curriculum-count-words]')) {
      const key = node.getAttribute('data-curriculum-count-words');
      expect(`spelled total ${key}`, node.textContent.toLowerCase(), curriculum.numberToWords(totals[key]).toLowerCase());
    }
    const list = items => items.length < 2 ? String(items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
    const TOTALS = {
      'verified-lessons-pages': `${totals.lessons} verified lessons \u00b7 ${totals.pages} pages`,
      'lessons-pages': `${totals.lessons} lessons \u00b7 ${totals.pages} pages`,
      'ready-grades': totals.readyGradeList,
      'ready-grade-numbers': totals.readyGradeNumbers,
      'template-grade-numbers': list(totals.templateGrades.map(grade => String(grade)))
    };
    const checkTotals = () => {
      for (const node of document.querySelectorAll('[data-curriculum-totals]')) {
        const format = node.getAttribute('data-curriculum-totals');
        if (!(format in TOTALS)) { problems.push(`totals ${format}: no format is bound for this hook`); continue; }
        expect(`totals ${format}`, node.textContent.trim(), TOTALS[format]);
      }
    };
    checkTotals();

    const cards = [...document.querySelectorAll('section.grades > a.grade[data-curriculum-grade]')];
    const ready = curriculum.readyGrades();
    expect('readiness cards', cards.length, ready.length);
    expect('readiness card grades', JSON.stringify(cards.map(card => Number(card.getAttribute('data-curriculum-grade')))), JSON.stringify(ready));
    cards.forEach(card => {
      const grade = Number(card.getAttribute('data-curriculum-grade'));
      const summary = curriculum.gradeSummary(grade);
      expect(`card ${grade} badge`, card.querySelector('.grade-top .badge')?.textContent.trim(), curriculum.preparedBadge(grade));
      const pages = card.querySelector('[data-curriculum-pages]');
      if (pages) expect(`card ${grade} verified pages`, pages.textContent.trim(), summary.pages);
      else problems.push(`card ${grade}: verified-page count is not derived from the registry`);
      const titles = card.querySelector('[data-curriculum-titles]');
      if (titles) expect(`card ${grade} titles`, titles.textContent.trim(), summary.titleList);
      const spelled = card.querySelector('[data-curriculum-grade-count-words]');
      if (spelled) expect(`card ${grade} spelled count`, spelled.textContent.trim().toLowerCase(), curriculum.numberToWords(summary.readyCount));
      const copy = card.textContent;
      if (/each lesson with a published answer-key area/.test(copy)) {
        const keyed = summary.lessons.filter(entry => entry.answerKey).length;
        expect(`card ${grade} answer-key promise`, keyed, summary.readyCount);
      }
      const range = copy.match(/Lessons (\d+)\u2013(\d+) have published answer keys; Lesson (\d+) has none/);
      if (range) {
        const keyed = summary.lessons.filter(entry => entry.answerKey);
        const keyless = summary.lessons.filter(entry => !entry.answerKey);
        expect(`card ${grade} keyed range start`, range[1], keyed[0].lesson);
        expect(`card ${grade} keyed range end`, range[2], keyed[keyed.length - 1].lesson);
        expect(`card ${grade} keyless lesson`, range[3], keyless[0].lesson);
      } else if (summary.lessons.some(entry => !entry.answerKey)) {
        problems.push(`card ${grade}: withholds the fact that Lesson ${summary.lessons.filter(entry => !entry.answerKey).map(entry => entry.lesson).join(', ')} publishes no answer key`);
      }
    });

    const upcoming = [...document.querySelectorAll('section.grades > a.grade:not([data-curriculum-grade])')];
    expect('template-only cards', upcoming.length, totals.templateGradeCount);
    upcoming.forEach(card => expect('template-only badge', card.querySelector('.badge')?.textContent.trim(), 'Template only'));

    return {
      problems,
      stats: [...document.querySelectorAll('.stat')].map(stat => `${stat.querySelector('b')?.textContent.trim()} ${stat.querySelector('span')?.textContent.trim()}`),
      cards: cards.map(card => `${card.querySelector('.num')?.textContent.trim()}: ${card.querySelector('.grade-top .badge')?.textContent.trim()}`)
    };
  });
  teacher.problems.forEach(problem => note(teacherUrl, 'teacher portal', problem));
  assert.deepEqual(teacher.problems, [], 'teacher.html must render from the registry');

  const resourcesUrl = await open('teacher-resources.html');
  const resources = await page.evaluate(() => {
    const curriculum = window.EFCPlatform;
    const totals = curriculum.platformTotals();
    const ready = curriculum.readyGrades();
    const problems = [];
    const expect = (surface, actual, expected) => {
      if (String(actual) !== String(expected)) problems.push(`${surface}: rendered "${actual}", registry says "${expected}"`);
    };

    for (const node of document.querySelectorAll('[data-curriculum-count-words]')) {
      const key = node.getAttribute('data-curriculum-count-words');
      expect(`spelled total ${key}`, node.textContent.toLowerCase(), curriculum.numberToWords(totals[key]).toLowerCase());
    }
    const list = items => items.length < 2 ? String(items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
    const TOTALS = {
      'verified-lessons-pages': `${totals.lessons} verified lessons \u00b7 ${totals.pages} pages`,
      'lessons-pages': `${totals.lessons} lessons \u00b7 ${totals.pages} pages`,
      'ready-grades': totals.readyGradeList,
      'ready-grade-numbers': totals.readyGradeNumbers,
      'template-grade-numbers': list(totals.templateGrades.map(grade => String(grade)))
    };
    const checkTotals = () => {
      for (const node of document.querySelectorAll('[data-curriculum-totals]')) {
        const format = node.getAttribute('data-curriculum-totals');
        if (!(format in TOTALS)) { problems.push(`totals ${format}: no format is bound for this hook`); continue; }
        expect(`totals ${format}`, node.textContent.trim(), TOTALS[format]);
      }
    };
    checkTotals();

    const rows = [...document.querySelectorAll('table th[scope="row"]')].map(node => node.textContent.trim());
    const expectedRows = ready.flatMap(grade => curriculum.gradeSummary(grade).lessons.map(entry => `${entry.grade} \u00b7 ${entry.lesson} ${entry.title}`));
    expect('status matrix rows', JSON.stringify(rows), JSON.stringify(expectedRows));

    const keyLinks = [...document.querySelectorAll('a[href*="-test.html#teacher-gate"]')].map(link => link.getAttribute('href'));
    const expectedKeys = ready.flatMap(grade => curriculum.gradeSummary(grade).lessons.filter(entry => entry.answerKey).map(entry => `${entry.slug}-test.html#teacher-gate`));
    expect('answer-key deep links', keyLinks.length, expectedKeys.length);
    expect('answer-key deep links unique', JSON.stringify([...new Set(keyLinks)].sort()), JSON.stringify([...new Set(expectedKeys)].sort()));
    const keyless = curriculum.registeredLessons().filter(entry => !entry.answerKey);
    keyless.forEach(entry => {
      if (keyLinks.includes(`${entry.slug}-test.html#teacher-gate`)) {
        problems.push(`${entry.slug}: teacher-resources.html deep-links an answer-key area this lesson does not publish`);
      }
    });

    return { problems, rows: rows.length, keyLinks: keyLinks.length, stats: totals };
  });
  resources.problems.forEach(problem => note(resourcesUrl, 'teacher resources', problem));
  assert.deepEqual(resources.problems, [], 'teacher-resources.html must render from the registry');
  fs.writeFileSync(path.join(evidenceDir, 'teacher-pages.json'), JSON.stringify({ teacher, resources }, null, 2));
  pass('Teacher pages render registry values',
    `teacher.html stats ${teacher.stats.join(' / ')}; teacher-resources.html ${resources.rows} matrix rows and ${resources.keyLinks} answer-key deep links`);

  /* ---------------------------------------------------------------- *
   * 5. Every registered lesson resolves in the shell
   *    (the Grade 4 Lessons 5-6 defect: pages published, registry silent)
   * ---------------------------------------------------------------- */

  const shellReports = [];
  const sections = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'];
  for (const entry of curriculumEntries()) {
    for (const section of sections) {
      const file = `${entry.slug}${section}.html`;
      const url = await open(file);
      const report = await page.evaluate(() => {
        const curriculum = window.EFCPlatform;
        const file = location.pathname.split('/').pop();
        const slug = file.replace(/(?:-pupil-book|-workbook|-vocabulary|-test)?\.html$/, '');
        const entry = curriculum.LESSONS[slug];
        const problems = [];
        if (!entry) problems.push(`${slug}: not present in the authoritative registry`);
        // The four content pages carry the shell-injected five-tab section bar; the lesson
        // hub is the menu itself and must reach all four sections with its own cards.
        const nav = document.querySelector('nav.section-links');
        let tabs = [];
        if (nav) {
          const links = [...nav.querySelectorAll('a')];
          tabs = links.map(link => link.textContent.trim());
          if (links.length !== 5) problems.push(`section bar has ${links.length} links, expected 5`);
          const expected = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'].map(suffix => `${slug}${suffix}.html`);
          if (JSON.stringify(links.map(link => link.getAttribute('href'))) !== JSON.stringify(expected)) {
            problems.push(`section bar links "${links.map(link => link.getAttribute('href')).join(', ')}" instead of the five registered pages`);
          }
          const current = links.filter(link => link.getAttribute('aria-current') === 'page').length;
          if (current !== 1) problems.push(`section bar marks ${current} pages current, expected exactly 1`);
        } else {
          const hrefs = [...document.querySelectorAll('a[href]')].map(link => link.getAttribute('href'));
          for (const suffix of ['-pupil-book', '-workbook', '-vocabulary', '-test']) {
            if (!hrefs.includes(`${slug}${suffix}.html`)) problems.push(`lesson hub does not link ${slug}${suffix}.html`);
          }
        }
        const crumbs = [...document.querySelectorAll('.breadcrumbs li')].map(node => node.textContent.trim());
        if (!crumbs.some(crumb => crumb.includes(entry?.title ?? '\u0000'))) {
          problems.push(`breadcrumbs "${crumbs.join(' / ')}" never name the registered title`);
        }
        if (/\bLesson \d+: Lesson \d+\b/.test(crumbs.join(' '))) problems.push('breadcrumb fell back to a generated label instead of the registered title');
        return { problems, slug, title: entry?.title ?? null, tabs, crumbs };
      });
      report.problems.forEach(problem => note(url, 'lesson shell metadata', problem));
      assert.deepEqual(report.problems, [], `${file} must resolve through the shell registry`);
      shellReports.push(report);
      if (section === '') {
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('efc_recent_visit_v1') || 'null'));
        assert.ok(stored && stored.slug === entry.slug, `${file}: opening a ready lesson must save the resume link`);
      }
    }
  }
  fs.writeFileSync(path.join(evidenceDir, 'lesson-shell-metadata.json'), JSON.stringify(shellReports, null, 2));
  pass('Every registered lesson resolves in the shell',
    `${shellReports.length} pages: registry title, five section tabs with exactly one current, titled breadcrumb and a saved resume link`);

  /* ---------------------------------------------------------------- *
   * 6. Small viewport: derived copy must not break the layout
   * ---------------------------------------------------------------- */

  await page.setViewportSize({ width: 390, height: 844 });
  for (const target of ['index.html', 'lessons.html?grade=4', 'round-tests.html?grade=4', 'teacher.html', 'teacher-resources.html']) {
    const [file, query] = target.split('?');
    await open(file, query ? `?${query}` : '');
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    assert.ok(overflow.scrollWidth <= overflow.clientWidth + 1,
      `${target}: derived curriculum copy overflows a 390px viewport (${overflow.scrollWidth} > ${overflow.clientWidth})`);
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  pass('Derived copy keeps the responsive layout', 'no horizontal overflow at 390px on the homepage, Grade 4 menu, Grade 4 round tests and both teacher pages');

  await open('index.html');
  await page.screenshot({ path: path.join(evidenceDir, 'index-grades.png'), fullPage: false });
  await open('lessons.html', '?grade=4');
  await page.screenshot({ path: path.join(evidenceDir, 'lessons-grade4.png'), fullPage: false });

  assert.deepEqual(errors, [], 'no page, console or HTTP errors while auditing rendered curriculum metadata');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.close();
}

function curriculumEntries() {
  const shell = fs.readFileSync(path.join(root, 'platform-shell.js'), 'utf8');
  const block = shell.match(/const LESSONS = \{([\s\S]*?)\n {2}\};/);
  return [...block[1].matchAll(/'(grade\d+-unit\d+-lesson\d+)': \{ grade: (\d+), unit: (\d+), lesson: (\d+), title: '([^']+)'/g)]
    .map(match => ({ slug: match[1], grade: Number(match[2]), unit: Number(match[3]), lesson: Number(match[4]), title: match[5] }))
    .sort((a, b) => a.grade - b.grade || a.unit - b.unit || a.lesson - b.lesson);
}

console.log(JSON.stringify({
  suite: 'curriculum-consistency',
  date: new Date().toISOString(),
  status: 'PASS',
  evidence: path.relative(root, evidenceDir),
  pagesAudited: 5 + 9 + 9 + 2 + curriculumEntries().length * 5,
  drift,
  checks
}, null, 2));
