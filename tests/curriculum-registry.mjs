/* Platform-wide curriculum metadata and readiness audit.

   This suite protects the published curriculum numbers themselves, not a snapshot of
   them. Every expectation below is computed at run time from two independent inputs:

     1. the authoritative curriculum registry (`LESSONS` in platform-shell.js), and
     2. the lesson pages that actually exist on disk.

   It then requires every learner-facing and teacher-facing surface — the homepage grade
   cards and hero totals, the prepared-lessons directory, lessons.html, round-tests.html,
   teacher.html and teacher-resources.html — to agree with those two inputs.

   Nothing here asserts a fixed lesson count. Publishing a new lesson therefore only
   requires registering it; if a surface is left behind, this suite names the surface and
   the value that drifted. Conversely, an incomplete lesson can never be counted as ready:
   a registered lesson whose five pages are missing fails, and a complete lesson that was
   never registered fails too. That second direction is the Grade 4 Lessons 5-6 defect
   this suite was written for. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

const checks = [];
const pass = (name, detail = '') => {
  checks.push({ name, status: 'PASS', detail });
  console.log('PASS', name, detail ? `— ${detail}` : '');
};

const SECTIONS = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'];
const SECTION_NAMES = ['menu', 'pupil-book', 'workbook', 'vocabulary', 'test'];
const GRADE_MIN = 1;
const GRADE_MAX = 9;
const ALL_GRADES = Array.from({ length: GRADE_MAX - GRADE_MIN + 1 }, (_, i) => GRADE_MIN + i);
const ROUND_SIZE = 5;

/* Independent number-to-words conversion, so a spelled-out count on a page is checked
   against arithmetic rather than against another copy of the same string. */
const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function words(value) {
  const n = Number(value);
  assert.ok(Number.isInteger(n) && n >= 0 && n <= 999, `number out of range for spelling: ${value}`);
  if (n < 20) return UNITS[n];
  if (n < 100) return n % 10 ? `${TENS[Math.floor(n / 10)]}-${UNITS[n % 10]}` : TENS[Math.floor(n / 10)];
  const hundreds = `${UNITS[Math.floor(n / 100)]} hundred`;
  return n % 100 ? `${hundreds} and ${words(n % 100)}` : hundreds;
}
const capitalised = value => value.charAt(0).toUpperCase() + value.slice(1);
const listSentence = items => {
  if (!items.length) return '';
  if (items.length === 1) return String(items[0]);
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
};

/* ------------------------------------------------------------------ *
 * 1. The authoritative registry
 * ------------------------------------------------------------------ */

const shell = read('platform-shell.js');
const registryBlock = shell.match(/const LESSONS = \{([\s\S]*?)\n {2}\};/);
assert.ok(registryBlock, 'platform-shell.js must keep the authoritative LESSONS registry');

const ENTRY_PATTERN = /'([a-z0-9-]+)': \{ grade: (\d+), unit: (\d+), lesson: (\d+), title: '([^']+)', bookLabel: "([^"]+)", answerKey: (true|false) \}/g;
const registry = new Map();
for (const match of registryBlock[1].matchAll(ENTRY_PATTERN)) {
  const [, slug, grade, unit, lesson, title, bookLabel, answerKey] = match;
  assert.ok(!registry.has(slug), `registry lists ${slug} twice`);
  registry.set(slug, {
    slug,
    grade: Number(grade),
    unit: Number(unit),
    lesson: Number(lesson),
    title,
    bookLabel,
    answerKey: answerKey === 'true'
  });
}

// A shape change in one entry must not silently drop that lesson from the audit.
const declaredKeys = [...registryBlock[1].matchAll(/'([a-z0-9-]+)': \{/g)].map(match => match[1]);
assert.deepEqual(
  declaredKeys,
  [...registry.keys()],
  'every LESSONS entry must keep the documented shape: slug, grade, unit, lesson, title, bookLabel, answerKey'
);
assert.ok(registry.size > 0, 'the registry must not be empty');

for (const [slug, entry] of registry) {
  const shape = slug.match(/^grade(\d+)-unit(\d+)-lesson(\d+)$/);
  assert.ok(shape, `${slug}: registry key must follow gradeN-unitN-lessonN`);
  assert.equal(Number(shape[1]), entry.grade, `${slug}: key grade disagrees with its record`);
  assert.equal(Number(shape[2]), entry.unit, `${slug}: key unit disagrees with its record`);
  assert.equal(Number(shape[3]), entry.lesson, `${slug}: key lesson disagrees with its record`);
  assert.ok(entry.grade >= GRADE_MIN && entry.grade <= GRADE_MAX, `${slug}: grade outside Grades ${GRADE_MIN}-${GRADE_MAX}`);
  assert.ok(entry.title.trim().length > 1, `${slug}: registry title must be a real lesson title`);
  assert.ok(
    ["Pupil's Book", "Student's Book"].includes(entry.bookLabel),
    `${slug}: bookLabel must name the printed book this grade uses`
  );
  assert.equal(
    entry.bookLabel,
    entry.grade >= 7 ? "Student's Book" : "Pupil's Book",
    `${slug}: Grade ${entry.grade} uses the ${entry.grade >= 7 ? "Student's" : "Pupil's"} Book`
  );
}

const positions = new Map();
for (const entry of registry.values()) {
  const key = `${entry.grade}:${entry.unit}:${entry.lesson}`;
  assert.ok(!positions.has(key), `${key}: two registered lessons claim the same grade, unit and lesson number`);
  positions.set(key, entry.slug);
}

const grades = ALL_GRADES.map(grade => {
  const lessons = [...registry.values()]
    .filter(entry => entry.grade === grade)
    .sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);
  const units = [...new Set(lessons.map(entry => entry.unit))].sort((a, b) => a - b);
  const numbers = lessons.map(entry => entry.lesson);
  // "Lessons 1-N" is only a truthful range when the registered lessons are unbroken.
  assert.deepEqual(
    numbers,
    Array.from({ length: numbers.length }, (_, i) => i + 1),
    `Grade ${grade}: registered lesson numbers must run 1..${numbers.length} without a gap, otherwise every displayed "Lessons 1-N" range is wrong`
  );
  return {
    grade,
    lessons,
    readyCount: lessons.length,
    isReady: lessons.length > 0,
    pages: lessons.length * SECTIONS.length,
    units,
    unitLabel: units.length === 1 ? `Unit ${units[0]}` : '',
    lessonRange: lessons.length ? `${lessons[0].lesson}\u2013${lessons[lessons.length - 1].lesson}` : '',
    titles: lessons.map(entry => entry.title),
    titleList: listSentence(lessons.map(entry => entry.title)),
    answerKeys: lessons.filter(entry => entry.answerKey).length,
    keyless: lessons.filter(entry => !entry.answerKey),
    roundCoverage: Math.min(lessons.length, ROUND_SIZE)
  };
});
const byGrade = new Map(grades.map(summary => [summary.grade, summary]));
const readyGrades = grades.filter(summary => summary.isReady);
const templateGrades = grades.filter(summary => !summary.isReady);

const totals = {
  grades: ALL_GRADES.length,
  lessons: registry.size,
  pages: registry.size * SECTIONS.length,
  answerKeyAreas: [...registry.values()].filter(entry => entry.answerKey).length,
  preparedGradeCount: readyGrades.length,
  templateGradeCount: templateGrades.length,
  readyGradeNumbers: listSentence(readyGrades.map(summary => summary.grade)),
  templateGradeNumbers: listSentence(templateGrades.map(summary => summary.grade))
};

const readinessBadge = summary =>
  summary.isReady ? `${summary.readyCount} ${summary.readyCount === 1 ? 'lesson' : 'lessons'} ready` : 'In preparation';
const preparedBadge = summary =>
  summary.isReady ? `${summary.readyCount} ${summary.readyCount === 1 ? 'lesson' : 'lessons'} prepared` : 'Template only';
const readinessSummary = summary =>
  summary.isReady ? `${summary.unitLabel} Lessons ${summary.lessonRange} ready: ${summary.titleList}` : '';

pass(
  'Authoritative curriculum registry',
  `${registry.size} registered lessons across Grades ${listSentence(readyGrades.map(s => s.grade))} ` +
  `(${readyGrades.map(s => `Grade ${s.grade}=${s.readyCount}`).join(', ')}); ` +
  `${totals.templateGradeCount} template-only grades; ${totals.pages} pages; ${totals.answerKeyAreas} answer-key areas`
);

/* ------------------------------------------------------------------ *
 * 2. Readiness is proven from the pages, not from folder names
 * ------------------------------------------------------------------ */

const lessonFilePattern = /^grade(\d+)-unit(\d+)-lesson(\d+)(?:-(pupil-book|workbook|vocabulary|test))?\.html$/;
const onDisk = new Map();
for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const match = file.match(lessonFilePattern);
  if (!match) continue;
  const slug = `grade${match[1]}-unit${match[2]}-lesson${match[3]}`;
  if (!onDisk.has(slug)) onDisk.set(slug, new Set());
  onDisk.get(slug).add(match[4] || 'menu');
}

const completeOnDisk = [...onDisk.entries()]
  .filter(([, sections]) => SECTION_NAMES.every(name => sections.has(name)))
  .map(([slug]) => slug)
  .sort();

// Partial work must never be published as ready, and never be silently ignored.
for (const [slug, sections] of onDisk) {
  const present = SECTION_NAMES.filter(name => sections.has(name));
  const missing = SECTION_NAMES.filter(name => !sections.has(name));
  assert.equal(
    missing.length,
    0,
    `${slug}: lesson pages exist for [${present.join(', ')}] but not for [${missing.join(', ')}]; an incomplete lesson must not be shipped or counted as ready`
  );
}

assert.deepEqual(
  completeOnDisk,
  [...registry.keys()].sort(),
  'the registry and the published lesson pages must describe exactly the same lessons: ' +
  'a complete lesson missing from the registry is invisible to every derived count, and a ' +
  'registered lesson with no pages would be advertised as ready without existing'
);

for (const entry of registry.values()) {
  const { slug } = entry;
  for (const section of SECTIONS) {
    const file = `${slug}${section}.html`;
    assert.ok(exists(file), `${slug}: registered lesson is missing ${file}`);
    const html = read(file);
    assert.match(html, /<html lang="en" dir="ltr">/, `${file}: English LTR root`);
    assert.ok(html.includes('design-system.css'), `${file}: must load the shared design system`);
    assert.ok(html.includes('platform-shell.js'), `${file}: must load the shared platform shell`);
    // Legacy Lesson 1 pages carry no static section bar: platform-shell.js injects the five
    // tabs from the registry at runtime. Every other page states its links inline. The
    // browser suite renders all five tabs for every registered lesson either way.
    if (/class="section-link/.test(html)) {
      for (const other of SECTIONS) {
        if (other === section) continue;
        assert.ok(html.includes(`${slug}${other}.html`), `${file}: must link to ${slug}${other}.html`);
      }
    }
    if (section === '') {
      assert.ok(!html.includes('lesson-content-navigation.js'), `${file}: lesson hub must opt out of the step navigator`);
      assert.ok(html.includes('data-nav-page="menu"'), `${file}: lesson hub must declare the menu opt-out`);
      assert.ok(
        html.includes(entry.title),
        `${file}: the lesson hub must name its registered title "${entry.title}", so the registry cannot invent one`
      );
    } else {
      assert.ok(
        html.includes('lesson-content-navigation.js'),
        `${file}: content pages must load the shared step navigator (LESSON_PAGE_STANDARD.md)`
      );
    }
  }

  // A ready lesson must publish a real Vocabulary glossary. Word-level Arabic meanings are
  // required to be marked RTL wherever a lesson supplies them; Grade 8 Lesson 3 publishes an
  // English-only source glossary, so the marking rule is checked rather than assumed.
  const vocabulary = read(`${slug}-vocabulary.html`);
  const markedMeanings = (vocabulary.match(/class="ar" lang="ar" dir="rtl"/g) || []).length;
  assert.ok(
    markedMeanings > 0 || /<table\b/.test(vocabulary),
    `${slug}-vocabulary.html: a ready lesson must publish a vocabulary glossary`
  );
  const withoutMarkedCells = vocabulary.replace(/class="ar" lang="ar" dir="rtl"[^>]*>[^<]*/g, '');
  assert.ok(
    !/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/.test(
      withoutMarkedCells.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    ),
    `${slug}-vocabulary.html: Arabic may appear only inside marked RTL word-meaning cells or recall data`
  );

  const test = read(`${slug}-test.html`);
  const staticQuestions = (test.match(/class="question"/g) || []).length;
  const dynamicBlock = test.match(/const qs=\[([\s\S]*?)\n\];/);
  const dynamicQuestions = dynamicBlock ? (dynamicBlock[1].match(/^\s*\["/gm) || []).length : 0;
  const questions = staticQuestions || dynamicQuestions;
  assert.ok(questions >= 10 && questions <= 20, `${slug}-test.html: published tests hold 10-20 questions, found ${questions}`);
  assert.ok(
    test.includes('id="teacher-gate"') === entry.answerKey,
    `${slug}: registry answerKey=${entry.answerKey} disagrees with the test page, which ` +
    `${test.includes('id="teacher-gate"') ? 'publishes' : 'does not publish'} a #teacher-gate answer-key area`
  );
}

pass(
  'Readiness is proven from the published pages',
  `${registry.size} lessons x ${SECTIONS.length} pages verified: five connected pages each, English/LTR roots, shared ` +
  'design system and platform shell, step navigator on the four content pages, menu opt-out on the hub, marked RTL ' +
  'vocabulary meanings, a 10-20 question independent test, and an answerKey flag that matches each #teacher-gate'
);

/* ------------------------------------------------------------------ *
 * 3. The shared shell exposes the derived API the pages consume
 * ------------------------------------------------------------------ */

for (const symbol of [
  'registeredLessons', 'lessonsForGrade', 'readyGrades', 'templateGrades',
  'gradeSummary', 'platformTotals', 'readinessBadge', 'readinessSummary',
  'preparedBadge', 'numberToWords', 'bindCurriculumMetadata'
]) {
  assert.ok(shell.includes(symbol), `platform-shell.js must expose ${symbol} so no page restates a curriculum count`);
}
assert.match(shell, /window\.EFCPlatform = \{[\s\S]*?LESSONS,/, 'platform-shell.js must publish the registry on window.EFCPlatform');

const derivedPages = ['index.html', 'lessons.html', 'round-tests.html', 'teacher.html', 'teacher-resources.html'];
for (const file of derivedPages) {
  const html = read(file);
  assert.ok(html.includes('platform-shell.js'), `${file}: must load the registry that drives its curriculum numbers`);
}
// No page may keep its own copy of the per-grade readiness counts.
for (const file of derivedPages) {
  const html = read(file);
  assert.ok(!/preparedCounts\s*=\s*\{/.test(html), `${file}: hardcoded per-grade prepared-count map must stay removed`);
  assert.ok(!/gradeTests\s*=\s*\{/.test(html), `${file}: hardcoded per-grade lesson-test map must stay removed`);
  assert.doesNotMatch(
    html,
    /\{\s*3:\s*\d+\s*,\s*4:\s*\d+\s*,\s*5:\s*\d+\s*,\s*8:\s*\d+\s*\}/,
    `${file}: no per-grade count literal may be reintroduced`
  );
}
pass('Single source of truth', 'platform-shell.js exposes the derived curriculum API and no display page keeps a parallel per-grade count map');

/* A mistyped or undocumented derivation hook binds to nothing, so the page would keep
   showing whatever stale text was typed into it. Every hook in use must be documented and
   actually handled, and every key it names must exist. */
const HANDLED_HOOKS = [
  'data-curriculum-count', 'data-curriculum-count-words', 'data-curriculum-totals', 'data-curriculum-grade',
  'data-curriculum-summary', 'data-curriculum-pages', 'data-curriculum-titles', 'data-curriculum-grade-count-words'
];
const countKeys = new Set([...shell.match(/const COUNT_KEYS = new Set\(\[([\s\S]*?)\]\);/)[1].matchAll(/'([\w-]+)'/g)].map(m => m[1]));
const totalsFormats = new Set([...shell.match(/const TOTALS_FORMATS = \{([\s\S]*?)\n {2}\};/)[1].matchAll(/'([\w-]+)':/g)].map(m => m[1]));
const standardDoc = read('LESSON_PAGE_STANDARD.md');
const hooksInUse = new Map();
for (const file of derivedPages) {
  for (const match of read(file).matchAll(/data-curriculum-([a-z-]+)(?:="([^"]*)")?/g)) {
    const hook = `data-curriculum-${match[1]}`;
    if (!hooksInUse.has(hook)) hooksInUse.set(hook, new Set());
    if (match[2] !== undefined) hooksInUse.get(hook).add(match[2]);
  }
}
for (const [hook, values] of hooksInUse) {
  assert.ok(HANDLED_HOOKS.includes(hook), `${hook} is used by a display page but bindCurriculumMetadata does not handle it`);
  assert.ok(standardDoc.includes(`\`${hook}\``), `LESSON_PAGE_STANDARD.md must document the ${hook} derivation hook`);
  if (hook === 'data-curriculum-count' || hook === 'data-curriculum-count-words') {
    for (const value of values) {
      assert.ok(countKeys.has(value), `${hook}="${value}" names no platformTotals() key, so the page keeps its stale text`);
    }
  }
  if (hook === 'data-curriculum-totals') {
    for (const value of values) {
      assert.ok(totalsFormats.has(value), `${hook}="${value}" has no bound format, so the page keeps its stale text`);
    }
  }
}
for (const hook of HANDLED_HOOKS) {
  assert.ok(
    hooksInUse.has(hook) || shell.includes(`[${hook}]`),
    `${hook} is neither used by a display page nor queried by bindCurriculumMetadata`
  );
}
pass('Derivation hooks are documented and bound', `${hooksInUse.size} hooks in use across the display pages: ${[...hooksInUse.keys()].sort().join(', ')}`);


/* ------------------------------------------------------------------ *
 * 4. Homepage grade cards, hero totals and prepared-lessons directory
 * ------------------------------------------------------------------ */

const home = read('index.html');

const homeCards = new Map();
for (const match of home.matchAll(/<a class="grade (is-available|is-upcoming)" href="lessons\.html\?grade=(\d+)"([^>]*)>([\s\S]*?)\n {6}<\/a>/g)) {
  const [, state, grade, rest, body] = match;
  homeCards.set(Number(grade), { state, derived: /data-curriculum-grade="(\d+)"/.exec(rest)?.[1], body });
}
assert.deepEqual(
  [...homeCards.keys()].sort((a, b) => a - b),
  ALL_GRADES,
  'index.html must show exactly one grade card per grade, 1 to 9'
);

for (const summary of grades) {
  const card = homeCards.get(summary.grade);
  const expectedState = summary.isReady ? 'is-available' : 'is-upcoming';
  assert.equal(card.state, expectedState, `index.html Grade ${summary.grade} card state must be ${expectedState} for ${summary.readyCount} ready lessons`);
  if (!summary.isReady) continue;

  assert.equal(
    card.derived,
    String(summary.grade),
    `index.html Grade ${summary.grade} card must be wired to the registry with data-curriculum-grade`
  );
  const badge = card.body.match(/<span class="badge badge-available">([^<]*)<\/span>/);
  assert.ok(badge, `index.html Grade ${summary.grade} card must keep a readiness badge`);
  assert.equal(badge[1], readinessBadge(summary), `index.html Grade ${summary.grade} readiness badge is stale`);

  const summaryNode = card.body.match(/<span data-curriculum-summary>([\s\S]*?)<\/span>/);
  assert.ok(summaryNode, `index.html Grade ${summary.grade} card must derive its readiness sentence`);
  const summaryText = summaryNode[1].replace(/<\/?em>/g, '');
  assert.equal(summaryText, readinessSummary(summary), `index.html Grade ${summary.grade} readiness summary is stale`);

  const emphasised = [...summaryNode[1].matchAll(/<em>([^<]+)<\/em>/g)].map(match => match[1]);
  assert.deepEqual(emphasised, summary.titles, `index.html Grade ${summary.grade} card must list exactly the registered lesson titles`);
}

for (const [key, expected] of [['grades', totals.grades], ['lessons', totals.lessons], ['pages', totals.pages]]) {
  const stat = home.match(new RegExp(`<b data-curriculum-count="${key}">(\\d+)</b><span>([^<]*)</span>`));
  assert.ok(stat, `index.html hero must derive the "${key}" total from the registry`);
  assert.equal(Number(stat[1]), expected, `index.html hero "${stat[2]}" is stale: shows ${stat[1]}, registry says ${expected}`);
}

const directoryBadge = home.match(/<span class="badge badge-available" data-curriculum-totals="verified-lessons-pages">([^<]*)<\/span>/);
assert.ok(directoryBadge, 'index.html prepared-lessons heading must derive its totals badge');
assert.equal(
  directoryBadge[1],
  `${totals.lessons} verified lessons \u00b7 ${totals.pages} pages`,
  'index.html prepared-lessons totals badge is stale'
);

const chooseGrade = home.match(/<p>Grades <span data-curriculum-totals="ready-grade-numbers">([^<]*)<\/span> include complete verified Unit 1 lessons\./);
assert.ok(chooseGrade, 'index.html "Choose a Grade" copy must derive its ready-grade list');
assert.equal(chooseGrade[1], totals.readyGradeNumbers, 'index.html "Choose a Grade" ready-grade list is stale');

const homeRows = [...home.matchAll(/<strong>Lesson (\d+) \u00b7 ([^<]+)<\/strong>/g)].map(match => `Lesson ${match[1]} \u00b7 ${match[2]}`);
assert.deepEqual(
  homeRows,
  readyGrades.flatMap(summary => summary.lessons.map(entry => `Lesson ${entry.lesson} \u00b7 ${entry.title}`)),
  'index.html prepared-lessons directory must list exactly the registered lessons, in registry order, with their registered titles'
);
for (const entry of registry.values()) {
  for (const section of SECTIONS) {
    assert.ok(home.includes(`href="${entry.slug}${section}.html"`), `index.html directory must link ${entry.slug}${section}.html`);
  }
}

const teacherPanel = home.match(/The teacher portal collects the <span data-curriculum-count-words="lessons">([^<]*)<\/span> prepared lessons, the answer-key areas published on <span data-curriculum-count-words="answerKeyAreas">([^<]*)<\/span> lesson tests/);
assert.ok(teacherPanel, 'index.html teacher panel must derive its spelled-out totals');
assert.equal(teacherPanel[1], words(totals.lessons), 'index.html teacher panel lesson total is stale');
assert.equal(teacherPanel[2], words(totals.answerKeyAreas), 'index.html teacher panel answer-key total is stale');

pass(
  'Homepage agrees with the registry',
  `${ALL_GRADES.length} grade cards, hero totals ${totals.lessons} lessons / ${totals.pages} pages, ` +
  `${homeRows.length} directory rows and the teacher-panel totals all derive from the registry`
);

/* ------------------------------------------------------------------ *
 * 5. lessons.html: cards keyed by registry slug, counts derived
 * ------------------------------------------------------------------ */

const listing = read('lessons.html');
assert.match(listing, /curriculum\.gradeSummary\(grade\)/, 'lessons.html must derive its readiness summary from the registry');
assert.match(listing, /curriculum\.platformTotals\(\)/, 'lessons.html must derive its round coverage from the registry');
assert.match(listing, /summary\.lessons\.map\(entry => LESSON_CARDS\[entry\.slug\]/, 'lessons.html must render its lesson list from the registry order');

const cardBlock = listing.match(/const LESSON_CARDS = \{([\s\S]*?)\n {4}\};/);
assert.ok(cardBlock, 'lessons.html must keep its per-lesson card map');
const cardSource = `${cardBlock[1]}\n`;
const cardKeys = [...cardBlock[1].matchAll(/'(grade\d+-unit\d+-lesson\d+)':/g)].map(match => match[1]);
assert.deepEqual(
  [...cardKeys].sort(),
  [...registry.keys()].sort(),
  'lessons.html card map must cover exactly the registered lessons: an unregistered card advertises a lesson that is not ready, and a missing card drops a ready lesson from the grade menu'
);

for (const entry of registry.values()) {
  const card = cardSource.match(new RegExp(`'${entry.slug}': '([\\s\\S]*?)',?\\n`));
  assert.ok(card, `lessons.html must hold a card for ${entry.slug}`);
  const markup = card[1];
  assert.ok(markup.includes(`href="${entry.slug}.html"`), `lessons.html ${entry.slug} card must link to its lesson hub`);
  assert.ok(
    markup.includes(`<strong>Lesson ${entry.lesson} \u00b7 ${entry.title}</strong>`),
    `lessons.html ${entry.slug} card must show the registered title "${entry.title}"`
  );
  assert.ok(
    markup.includes(`Available \u00b7 Unit ${entry.unit}`),
    `lessons.html ${entry.slug} card must show its registered unit`
  );
  assert.match(markup, /<small>[^<]*\d+-question Lesson Test<\/small>/, `lessons.html ${entry.slug} card must state its own test question count`);
}

pass(
  'Grade lesson menus agree with the registry',
  `${cardKeys.length} registry-keyed cards; counts, badges, ranges, grade switcher dots and round coverage all derived`
);

/* ------------------------------------------------------------------ *
 * 6. round-tests.html: the individual test directory is derived
 * ------------------------------------------------------------------ */

const roundPage = read('round-tests.html');
assert.match(roundPage, /curriculum\.gradeSummary\(grade\)/, 'round-tests.html must derive its Lesson Test directory from the registry');
assert.match(roundPage, /summary\.lessons\.map\(entry =>/, 'round-tests.html must build its test links from the registered lessons');
assert.match(roundPage, /label: `Lesson \$\{entry\.lesson\} Test \\u00b7 \$\{entry\.title\}`|label: `Lesson \$\{entry\.lesson\} Test \u00b7 \$\{entry\.title\}`/, 'round-tests.html labels must come from registered lesson numbers and titles');
assert.doesNotMatch(
  roundPage,
  /grade\d+-unit\d+-lesson\d+-test\.html/,
  'round-tests.html must not keep a hardcoded list of individual test pages'
);

pass('Round-test directory is derived', 'Every individual Lesson Test link and the capped Round 1 coverage come from the registry');

/* ------------------------------------------------------------------ *
 * 7. Teacher portal
 * ------------------------------------------------------------------ */

const teacher = read('teacher.html');
for (const [key, expected] of [
  ['lessons', totals.lessons],
  ['pages', totals.pages],
  ['answerKeyAreas', totals.answerKeyAreas],
  ['templateGradeCount', totals.templateGradeCount]
]) {
  const stat = teacher.match(new RegExp(`<b data-curriculum-count="${key}">(\\d+)</b><span>([^<]*)</span>`));
  assert.ok(stat, `teacher.html must derive the "${key}" total from the registry`);
  assert.equal(Number(stat[1]), expected, `teacher.html "${stat[2]}" is stale: shows ${stat[1]}, registry says ${expected}`);
}

const teacherLead = teacher.match(/in this repository: <span data-curriculum-count-words="lessons">([^<]*)<\/span> prepared Unit 1 lessons across Grades <span data-curriculum-totals="ready-grade-numbers">([^<]*)<\/span>, their Pupil\u2019s or Student\u2019s\s*\n\s*Book, Workbook, Vocabulary and Lesson Test pages, and the answer-key areas that are published on <span data-curriculum-count-words="answerKeyAreas">([^<]*)<\/span> of those tests\./);
assert.ok(teacherLead, 'teacher.html lead must derive its spelled-out totals and ready-grade list');
assert.equal(teacherLead[1], words(totals.lessons), 'teacher.html lead lesson total is stale');
assert.equal(teacherLead[2], totals.readyGradeNumbers, 'teacher.html lead ready-grade list is stale');
assert.equal(teacherLead[3], words(totals.answerKeyAreas), 'teacher.html lead answer-key total is stale');

const teacherGate = teacher.match(/The answer-key areas on <span data-curriculum-count-words="answerKeyAreas">([^<]*)<\/span> lesson tests ask for a single/);
assert.ok(teacherGate, 'teacher.html password disclosure must derive its answer-key count');
assert.equal(teacherGate[1], words(totals.answerKeyAreas), 'teacher.html password disclosure answer-key count is stale');

const teacherCards = new Map();
for (const match of teacher.matchAll(/<a class="grade (is-available|is-upcoming)" href="teacher-resources\.html#([\w-]+)"([^>]*)>([\s\S]*?)\n {6}<\/a>/g)) {
  const [, state, anchor, rest, body] = match;
  const grade = /^grade-(\d+)$/.exec(anchor)?.[1];
  teacherCards.set(grade ? Number(grade) : anchor, { state, derived: /data-curriculum-grade="(\d+)"/.exec(rest)?.[1], body });
}

for (const summary of grades) {
  if (!summary.isReady) {
    const card = teacherCards.get(summary.grade);
    assert.ok(!card, `teacher.html must not show a per-grade readiness card for template-only Grade ${summary.grade}`);
    continue;
  }
  const card = teacherCards.get(summary.grade);
  assert.ok(card, `teacher.html is missing a readiness card for Grade ${summary.grade}`);
  assert.equal(card.state, 'is-available', `teacher.html Grade ${summary.grade} card must be marked available`);
  assert.equal(card.derived, String(summary.grade), `teacher.html Grade ${summary.grade} card must be wired to the registry`);

  const badge = card.body.match(/<span class="badge badge-available">([^<]*)<\/span>/);
  assert.ok(badge, `teacher.html Grade ${summary.grade} card must keep a readiness badge`);
  assert.equal(badge[1], preparedBadge(summary), `teacher.html Grade ${summary.grade} badge is stale`);

  const pages = card.body.match(/<span data-curriculum-pages>(\d+)<\/span> verified pages/);
  assert.ok(pages, `teacher.html Grade ${summary.grade} card must derive its verified-page count`);
  assert.equal(Number(pages[1]), summary.pages, `teacher.html Grade ${summary.grade} page count is stale`);

  const titles = card.body.match(/<span data-curriculum-titles>([^<]*)<\/span>/);
  if (titles) {
    assert.equal(titles[1], summary.titleList, `teacher.html Grade ${summary.grade} title list is stale`);
  }
  const spelled = card.body.match(/<span data-curriculum-grade-count-words>([^<]*)<\/span> prepared lessons/);
  if (spelled) {
    assert.equal(spelled[1], capitalised(words(summary.readyCount)), `teacher.html Grade ${summary.grade} spelled lesson count is stale`);
  }

  // The answer-key sentence on the Grade 4 card is a factual claim about the registry.
  const keyClaim = card.body.match(/Lessons (\d+)\u2013(\d+) have published answer keys; Lesson (\d+) has none\./);
  if (keyClaim) {
    const keyed = summary.lessons.filter(entry => entry.answerKey);
    assert.equal(summary.keyless.length, 1, `teacher.html Grade ${summary.grade} claims exactly one keyless lesson`);
    assert.equal(Number(keyClaim[1]), keyed[0].lesson, `teacher.html Grade ${summary.grade} answer-key range start is stale`);
    assert.equal(Number(keyClaim[2]), keyed[keyed.length - 1].lesson, `teacher.html Grade ${summary.grade} answer-key range end is stale`);
    assert.equal(Number(keyClaim[3]), summary.keyless[0].lesson, `teacher.html Grade ${summary.grade} keyless lesson is stale`);
  } else {
    assert.equal(
      summary.keyless.length,
      0,
      `teacher.html Grade ${summary.grade} card must disclose that Lesson ${summary.keyless.map(e => e.lesson).join(', ')} publishes no answer key`
    );
    // A card that promises a key on every lesson must not be left behind when one is withheld.
    if (/each lesson with a published answer-key area/.test(card.body)) {
      assert.equal(summary.answerKeys, summary.readyCount, `teacher.html Grade ${summary.grade} promises a published answer-key area on every lesson`);
    }
  }
}

const teacherTemplate = teacher.match(/<a class="grade is-upcoming" href="teacher-resources\.html#template-grades">/g) || [];
assert.equal(teacherTemplate.length, totals.templateGradeCount, 'teacher.html must show one template-only card per grade without ready lessons');

pass(
  'Teacher portal agrees with the registry',
  `Totals ${totals.lessons} lessons / ${totals.pages} pages / ${totals.answerKeyAreas} answer-key areas / ${totals.templateGradeCount} template-only grades; ` +
  `${readyGrades.length} readiness cards with derived badges, page counts and title lists`
);

/* ------------------------------------------------------------------ *
 * 8. Teacher resources directory
 * ------------------------------------------------------------------ */

const resources = read('teacher-resources.html');
const resourcesBadge = resources.match(/<span class="badge badge-available" data-curriculum-totals="lessons-pages">([^<]*)<\/span>/);
assert.ok(resourcesBadge, 'teacher-resources.html must derive its totals badge');
assert.equal(resourcesBadge[1], `${totals.lessons} lessons \u00b7 ${totals.pages} pages`, 'teacher-resources.html totals badge is stale');

const resourcesLead = resources.match(/<span data-curriculum-count-words="lessons">([^<]*)<\/span> prepared Unit 1 lessons across Grades <span data-curriculum-totals="ready-grade-numbers">([^<]*)<\/span>/);
assert.ok(resourcesLead, 'teacher-resources.html lead must derive its spelled-out totals and ready-grade list');
assert.equal(resourcesLead[1], capitalised(words(totals.lessons)), 'teacher-resources.html lead lesson total is stale');
assert.equal(resourcesLead[2], totals.readyGradeNumbers, 'teacher-resources.html lead ready-grade list is stale');

const resourcesGate = resources.match(/Answer-key areas sit inside <span data-curriculum-count-words="answerKeyAreas">([^<]*)<\/span> lesson tests/);
assert.ok(resourcesGate, 'teacher-resources.html must derive its answer-key count');
assert.equal(resourcesGate[1], words(totals.answerKeyAreas), 'teacher-resources.html answer-key count is stale');

for (const occurrence of resources.matchAll(/<span data-curriculum-totals="template-grade-numbers">([^<]*)<\/span>/g)) {
  assert.equal(occurrence[1], totals.templateGradeNumbers, 'teacher-resources.html template-grade list is stale');
}
assert.ok(
  (resources.match(/data-curriculum-totals="template-grade-numbers"/g) || []).length >= 3,
  'teacher-resources.html must derive every template-grade list it shows'
);

const resourceRows = [...resources.matchAll(/<strong>Lesson (\d+) \u00b7 ([^<]+)<\/strong>/g)].map(match => `Lesson ${match[1]} \u00b7 ${match[2]}`);
assert.deepEqual(
  resourceRows,
  readyGrades.flatMap(summary => summary.lessons.map(entry => `Lesson ${entry.lesson} \u00b7 ${entry.title}`)),
  'teacher-resources.html must list exactly the registered lessons, in registry order, with their registered titles'
);

const matrixLabels = [...resources.matchAll(/<th scope="row">([^<]+)<\/th>/g)].map(match => match[1].trim());
assert.deepEqual(
  matrixLabels,
  readyGrades.flatMap(summary => summary.lessons.map(entry => `${entry.grade} \u00b7 ${entry.lesson} ${entry.title}`)),
  'teacher-resources.html status matrix must hold one row per registered lesson, labelled from the registry'
);

for (const entry of registry.values()) {
  for (const section of SECTIONS) {
    assert.ok(
      resources.includes(`href="${entry.slug}${section}.html`),
      `teacher-resources.html must link ${entry.slug}${section}.html`
    );
  }
  const keyLink = `href="${entry.slug}-test.html#teacher-gate"`;
  assert.equal(
    resources.includes(keyLink),
    entry.answerKey,
    `${entry.slug}: teacher-resources.html must ${entry.answerKey ? '' : 'not '}deep-link an answer-key area for this lesson`
  );
}
assert.match(
  resources,
  /<strong>Grade 4 Lesson 1 answer key\.<\/strong> The test page has no key area/,
  'teacher-resources.html must keep disclosing the one lesson that publishes no answer key'
);

pass(
  'Teacher resources directory agrees with the registry',
  `${resourceRows.length} directory rows, ${matrixLabels.length} status-matrix rows, ${totals.answerKeyAreas} answer-key deep links and one disclosed keyless lesson`
);

/* ------------------------------------------------------------------ *
 * 9. Template pages name the grades that are actually ready
 * ------------------------------------------------------------------ */

for (const file of ['lesson-menu.html', 'lesson.html']) {
  const html = read(file);
  const linked = [...html.matchAll(/href="lessons\.html\?grade=(\d+)">Grade (\d+)<\/a>/g)].map(match => Number(match[1]));
  const unique = [...new Set(linked)].sort((a, b) => a - b);
  assert.deepEqual(
    unique,
    readyGrades.map(summary => summary.grade),
    `${file} points pupils at the grades with complete lessons; that list must match the registry`
  );
}
pass('Template previews point at the ready grades', `lesson-menu.html and lesson.html both name Grades ${totals.readyGradeNumbers}`);

/* ------------------------------------------------------------------ *
 * 10. The confirmed Grade 4 defect stays fixed
 * ------------------------------------------------------------------ */

const grade4 = byGrade.get(4);
assert.equal(grade4.readyCount, 6, 'Grade 4 publishes six complete, registered lessons');
assert.deepEqual(
  grade4.titles,
  ['Nice to Meet You', 'My Family', 'Daily Routine', 'My House', 'School Subjects', 'Where I Live'],
  'Grade 4 lesson titles, including Lessons 5 and 6 that the homepage card used to omit'
);
assert.equal(grade4.lessonRange, '1\u20136', 'Grade 4 lesson range');
assert.equal(grade4.pages, 30, 'Grade 4 verified page count');
for (const lesson of [5, 6]) {
  const slug = `grade4-unit1-lesson${lesson}`;
  assert.ok(registry.has(slug), `${slug} must be registered so breadcrumbs, the resume card and every derived count can see it`);
  assert.ok(home.includes(`Lesson ${lesson} \u00b7 ${registry.get(slug).title}`), `index.html must list Grade 4 Lesson ${lesson}`);
  assert.ok(listing.includes(`'${slug}': '<a class="lesson" href="${slug}.html"`), `lessons.html must hold a card for Grade 4 Lesson ${lesson}`);
}
pass(
  'Grade 4 reports all six ready lessons everywhere',
  'Registry, homepage card ("6 lessons ready", Lessons 1-6 with six titles), homepage directory, grade menu and teacher directories all agree'
);

console.log(JSON.stringify({
  suite: 'curriculum-registry',
  date: new Date().toISOString(),
  status: 'PASS',
  registry: {
    lessons: totals.lessons,
    pages: totals.pages,
    answerKeyAreas: totals.answerKeyAreas,
    perGrade: Object.fromEntries(grades.map(summary => [summary.grade, summary.readyCount])),
    readyGrades: readyGrades.map(summary => summary.grade),
    templateGrades: templateGrades.map(summary => summary.grade)
  },
  checks
}, null, 2));
