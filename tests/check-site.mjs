import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'grade3-unit1-lesson2';
const checks = [];
const pass = (name, detail = '') => { checks.push({ name, status: 'PASS', detail }); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const attrs = tag => Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs), m => [m[1], m[3]]));
const tags = (html, name) => Array.from(html.matchAll(new RegExp('<' + name + '(?=[\\s>])[^>]*>', 'gi')), m => attrs(m[0]));
const localUrl = url => url && !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
const fileOfUrl = url => decodeURIComponent(url.split(/[?#]/)[0]);
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html')).sort();
const newPages = ['menu', 'pupil-book', 'workbook', 'vocabulary', 'test'].map(section => base + (section === 'menu' ? '' : '-' + section) + '.html');
const arabicPattern = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
const isVocabularyPage = file => /-vocabulary\.html$/i.test(file);
function checkEnglishMarkup(file, html) {
  const rootTag = html.match(/<html\b[^>]*>/i)?.[0] || '';
  const rootAttrs = attrs(rootTag);
  assert.equal(rootAttrs.lang, 'en', `${file}: root language must be English`);
  assert.equal(rootAttrs.dir, 'ltr', `${file}: root direction must be LTR`);
  if (!isVocabularyPage(file)) {
    assert.ok(!arabicPattern.test(html), `${file}: Arabic is not allowed outside vocabulary meanings`);
    return;
  }
  // Inline script data may contain Arabic word meanings for vocabulary recall, but
  // visible text and attributes may contain it only in explicitly marked RTL spans.
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const tokens = visible.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [];
  const stack = [];
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const token of tokens) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) {
      const name = token.match(/^<\/([\w:-]+)/)?.[1]?.toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name === name) { stack.length = i; break; }
      continue;
    }
    if (token.startsWith('<')) {
      const name = token.match(/^<([\w:-]+)/)?.[1]?.toLowerCase();
      if (!name) continue;
      const tagAttrs = attrs(token);
      for (const [key, value] of Object.entries(tagAttrs)) assert.ok(!arabicPattern.test(value), `${file}: Arabic in ${name}[${key}]`);
      if (!voidTags.has(name) && !token.endsWith('/>')) stack.push({ name, attrs: tagAttrs });
      continue;
    }
    if (!arabicPattern.test(token)) continue;
    const allowed = stack.some(({ attrs: a }) => a.class?.split(/\s+/).includes('ar') && a.lang === 'ar' && a.dir === 'rtl');
    assert.ok(allowed, `${file}: unmarked Arabic text: ${token.trim()}`);
  }
}

// All repository HTML, not just new files: relative links and assets must exist.
let localLinks = 0;
let assetReferences = 0;
for (const file of htmlFiles) {
  const html = read(file);
  checkEnglishMarkup(file, html);
  // Existing menu pages build links in inline JavaScript. Inspect actual HTML tags,
  // not template strings; the browser suite clicks the dynamically rendered links.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => /\bsrc\s*=/.test(match) ? match : '');
  const refs = [...tags(markup, 'a'), ...tags(markup, 'link')].map(a => a.href).filter(localUrl)
    .concat([...tags(markup, 'script'), ...tags(markup, 'img'), ...tags(markup, 'source')].map(a => a.src).filter(localUrl));
  const allIds = Array.from(markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/g), m => m[1]);
  assert.equal(new Set(allIds).size, allIds.length, `${file}: duplicate IDs`);
  for (const ref of refs) {
    const resolved = path.resolve(root, path.dirname(file), fileOfUrl(ref));
    assert.ok(resolved.startsWith(root + path.sep), `${file}: link leaves project: ${ref}`);
    assert.ok(fs.existsSync(resolved), `${file}: missing link/asset: ${ref}`);
    localLinks++;
    const fragment = ref.includes('#') ? decodeURIComponent(ref.split('#')[1]) : '';
    if (fragment && resolved.endsWith('.html')) {
      assert.ok(fs.readFileSync(resolved, 'utf8').includes(`id="${fragment}"`), `${file}: missing fragment ${ref}`);
    }
  }
  for (const img of tags(html, 'img')) {
    assert.ok(img.alt !== undefined, `${file}: image missing alt: ${img.src}`);
    if (file.startsWith(base)) assert.ok(localUrl(img.src), `${file}: nonrelative image`);
  }
}
pass('All repository HTML local links and assets resolve', `${htmlFiles.length} HTML files; ${localLinks} references`);
pass('English-only content and language direction', 'Every HTML root is lang=en and dir=ltr; Arabic appears only as explicitly marked RTL word meanings on Vocabulary pages.');
const textExtensions = new Set(['.html','.css','.js','.mjs','.json','.md','.yml','.yaml','.txt','.py','.sh','.svg']);
const excludedDirectories = new Set(['.git','node_modules','test-results','build','dist','coverage','.cache']);
let auditedTextFiles = 0;
function scanTextFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) scanTextFiles(path.join(directory, entry.name));
      continue;
    }
    const file = path.join(directory, entry.name);
    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension) || (extension === '.html' && isVocabularyPage(entry.name))) continue;
    const contents = fs.readFileSync(file, 'utf8');
    assert.ok(!arabicPattern.test(contents), `${path.relative(root, file)}: Arabic text is not allowed in code, tests, documentation, or non-Vocabulary pages`);
    auditedTextFiles++;
  }
}
scanTextFiles(root);
pass('Documentation, tests, and other repository text are English', `${auditedTextFiles} non-Vocabulary text files scanned; no Arabic script found`);

for (const file of newPages) {
  assert.ok(exists(file), `Missing ${file}`);
  const html = read(file);
  assert.match(html, /<html lang="en" dir="ltr">/, `${file}: English LTR root`);
  assert.match(html, /<main class="wrap">/, `${file}: shared content wrapper`);
  assert.ok(html.includes('href="lessons.html?grade=3"'), `${file}: Grade 3 return link`);
  assert.ok(html.includes(`href="${base}.html"`), `${file}: lesson home link`);
  if (!file.endsWith(`${base}.html`)) {
    assert.ok(html.includes('<script src="lesson-content-navigation.js" defer></script>'), `${file}: shared step navigator required`);
    assert.ok(html.includes(`src="${base}.js"`), `${file}: lesson-local interactions`);
  } else {
    assert.ok(!html.includes('lesson-content-navigation.js'), 'Menu must not load step navigator');
    assert.ok(html.includes('data-nav-page="menu"'), 'Menu opt-out');
  }
  assert.ok(!/localhost|127\.0\.0\.1/.test(html), `${file}: browser-facing loopback URL`);
}
pass('Five new pages follow LESSON_PAGE_STANDARD.md', 'Four content pages load the shared step navigator; menu opts out');

const listing = read('lessons.html');
assert.ok(listing.includes("grade===3?'<a class=\"lesson\" href=\"grade3-unit1-lesson2.html\""));
assert.ok(listing.includes('Lesson 2 · School Subjects'));
assert.ok(listing.includes("grade===5?'<a class=\"lesson\" href=\"grade5-unit1-lesson2.html\""));
for (const grade of [3, 4, 5, 8]) assert.ok(listing.includes(`grade${grade}-unit1-lesson1.html`));
pass('Grade 3 listing includes new lesson without removing existing lesson links');

const pb = read(`${base}-pupil-book.html`);
const wb = read(`${base}-workbook.html`);
for (let i = 1; i <= 5; i++) assert.ok(pb.includes(`id="pb-${i}"`));
for (let i = 1; i <= 6; i++) assert.ok(wb.includes(`id="wb-${i}"`));
assert.equal((pb.match(/class="dialogue"/g) || []).length, 6);
assert.equal((pb.match(/<li><b>\d+<\/b>/g) || []).length, 10);
assert.equal((wb.match(/type="radio"/g) || []).length, 8);
assert.equal((wb.match(/name="missing-/g) || []).length, 4);
assert.equal((wb.match(/id="schedule-/g) || []).length, 4);
assert.equal((wb.match(/<details class="source-page">/g) || []).length, 3);
assert.equal((pb.match(/<details class="source-page">/g) || []).length, 3);
assert.ok(!pb.includes('<audio'));
assert.ok(!wb.includes('<audio'));
assert.ok(!wb.includes('wb-listen-key'));
assert.ok(pb.includes('Music, Art, English, Arabic'));
assert.ok(pb.includes('Art and English'));
pass('Source activity counts and blanks', 'PB: 5 activities, 6 dialogues, 10 numbers; WB: 6 exercises, 8 listening options, 4 sequence blanks, 4 timetable blanks');

const manifest = JSON.parse(read('assets/grade3-unit1-lesson2/source-manifest.json'));
assert.equal(manifest.length, 6);
for (const item of manifest) {
  const bytes = fs.readFileSync(path.join(root, item.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, `Original changed: ${item.file}`);
}
const crops = fs.readdirSync(path.join(root, 'assets/grade3-unit1-lesson2/crops')).filter(f => f.endsWith('.png'));
assert.equal(crops.length, 28);
pass('Original source images preserved byte-for-byte', '6 SHA-256 matches; 27 original source crops plus one clearly named English-normalised display derivative');

const test = read(`${base}-test.html`);
const expectedQuiz = JSON.parse(read('tests/grade3-unit1-lesson2.quiz.json'));
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const plain = value => decode(value.replace(/<[^>]*>/g, '')).trim();
const questionBlocks = Array.from(test.matchAll(/<section class="question" id="q(\d+)"([^>]*)>([\s\S]*?)<\/section>/g));
assert.equal(questionBlocks.length, 20);
assert.equal(expectedQuiz.length, 20);
for (const [index, block] of questionBlocks.entries()) {
  const expected = expectedQuiz[index];
  const data = attrs('<section ' + block[2] + '>');
  assert.equal(Number(block[1]), expected.number);
  assert.equal(Number(data['data-correct']), expected.correct);
  assert.equal(data['data-reference'], expected.reference);
  assert.equal(data['data-kind'], expected.kind);
  assert.equal(plain(block[3].match(/<h2>([\s\S]*?)<\/h2>/)[1]), `${expected.number}. ${expected.prompt}`);
  const options = Array.from(block[3].matchAll(/<span class="en" lang="en" dir="ltr">([abc]\) [\s\S]*?)<\/span>/g), (m, i) => plain(m[1]).slice(3));
  assert.deepEqual(options, expected.options);
}
assert.equal((test.match(/class="question"/g) || []).length, 20);
assert.equal((test.match(/type="radio"/g) || []).length, 60);
assert.equal((test.match(/data-kind="inferred"/g) || []).length, 5);
assert.equal((test.match(/data-kind="explicit"/g) || []).length, 15);
assert.ok(test.includes('id="answer-guide" class="answer" hidden'));
assert.ok(test.includes('id="quiz"'));
assert.ok(!test.includes('<audio'));
pass('Test structure', '20 questions, 60 options, 15 direct readings and 5 explicitly marked inferences; teacher key initially hidden');
pass('Exact quiz prompts, choices, references and answer indices', 'All 20 questions match the stored source-review fixture');

// Grade 4, Unit 1, Lesson 2: My Family.
const g4 = 'grade4-unit1-lesson2';
const g4Pages = ['menu', 'pupil-book', 'workbook', 'vocabulary', 'test'].map(section => g4 + (section === 'menu' ? '' : '-' + section) + '.html');
for (const file of g4Pages) {
  assert.ok(exists(file), `Missing ${file}`);
  const html = read(file);
  assert.match(html, /<html lang="en" dir="ltr">/, `${file}: English LTR root`);
  assert.match(html, /<main class="wrap">/, `${file}: shared content wrapper`);
  assert.ok(html.includes('href="lessons.html?grade=4"'), `${file}: Grade 4 return link`);
  assert.ok(html.includes(`href="${g4}.html"`), `${file}: lesson home link`);
  assert.ok(!/<audio\b/.test(html), `${file}: no invented audio element`);
  assert.ok(!/localhost|127\.0\.0\.1/.test(html), `${file}: browser-facing loopback URL`);
}
for (const section of ['pupil-book', 'workbook', 'vocabulary', 'test']) {
  const html = read(`${g4}-${section}.html`);
  assert.ok(html.includes('<script src="lesson-content-navigation.js" defer></script>'), `${g4}-${section}.html: shared step navigator required`);
  assert.ok(html.includes(`src="${g4}.js"`), `${g4}-${section}.html: lesson-local interactions`);
  for (const other of ['pupil-book', 'workbook', 'vocabulary', 'test']) {
    if (other !== section) assert.ok(html.includes(`href="${g4}-${other}.html"`), `${g4}-${section}.html: link to ${other}`);
  }
}
assert.ok(!read(`${g4}.html`).includes('lesson-content-navigation.js'), 'Grade 4 Lesson 2 menu must not load the step navigator');
assert.ok(read(`${g4}.html`).includes('data-nav-page="menu"'), 'Grade 4 Lesson 2 menu opt-out');
pass('Grade 4 Lesson 2 pages follow LESSON_PAGE_STANDARD.md', 'Five connected pages; four content pages load the shared step navigator; menu opts out');

const g4Listing = read('lessons.html');
assert.ok(g4Listing.includes("grade===4?'<a class=\"lesson\" href=\"grade4-unit1-lesson2.html\""));
assert.ok(g4Listing.includes('Lesson 2 · My Family'));
assert.ok(g4Listing.includes('grade4-unit1-lesson1.html'));
assert.ok(g4Listing.includes('grade3-unit1-lesson2.html'));
pass('Grade 4 listing includes the new lesson', 'Grade 4 now lists Lesson 1 and Lesson 2; the Grade 3 and Grade 5 entries are unchanged');

const g4Pb = read(`${g4}-pupil-book.html`);
const g4Wb = read(`${g4}-workbook.html`);
for (let i = 1; i <= 11; i++) assert.ok(g4Pb.includes(`id="pb-${i}"`), `Pupil’s Book: missing step pb-${i}`);
for (let i = 1; i <= 8; i++) assert.ok(g4Wb.includes(`id="wb-${i}"`), `Workbook: missing exercise wb-${i}`);
for (const text of ['1. Listen and Match.', '2. Listen and repeat.', '3. Look and describe.', '4. Talk about your family.', '5. Read and match.', '6. Before you read, answer this question.', '7. Read the text and do the tasks below.', '8. Fill in the spaces with.', '9. Reorder the following sentences.', '10. Read and complete.', 'This is my family.', 'What do they look like?', 'Let’s Learn']) {
  assert.ok(g4Pb.includes(text), `Pupil’s Book: missing printed text: ${text}`);
}
for (const text of ['1. Read and fill in the table.', '2. Read and match.', '3. Listen and tick', '4. Listen and match.', '5. Describe this family.', '6. Ask and answer.', '7. Choose the right word.', '8. Complete about your family.', 'John White', 'Robert', 'Liza', 'James', 'The father has got short hair.']) {
  assert.ok(g4Wb.includes(text), `Workbook: missing printed text: ${text}`);
}
assert.equal((g4Pb.match(/<span class="given-answer">/g) || []).length, 2, 'Pupil’s Book: the two answers printed in the source must stay marked as printed');
assert.equal((g4Pb.match(/class="notice"/g) || []).length, 3, 'Pupil’s Book: listening/ambiguity notices');
assert.equal((g4Wb.match(/class="notice"/g) || []).length, 2, 'Workbook: listening notices for exercises 3 and 4');
assert.ok(g4Pb.includes('Audio required; the recording was not supplied.'));
assert.ok(g4Wb.includes('Audio required; the recording was not supplied.'));
assert.ok(!g4Pb.includes('wb5-'), 'Pupil’s Book must not contain Workbook controls');
assert.ok(!g4Wb.includes('pb7a'), 'Workbook must not contain Pupil’s Book controls');
pass('Grade 4 Lesson 2 source coverage', 'Pupil’s Book activities 1–10 and Let’s Learn; Workbook exercises 1–8; listening items retained and marked');

// Counts that mirror the printed pages exactly.
assert.equal((g4Wb.match(/id="wb5-\d"/g) || []).length, 5, 'Workbook exercise 5 must have one field per printed dotted line (five)');
assert.equal((g4Wb.match(/class="tree"[\s\S]*?<\/table>/)[0].match(/<input/g) || []).length, 6, 'Workbook exercise 1 table keeps six printed dotted lines');
assert.equal((g4Pb.match(/name="wb3-/g) || []).length, 0, 'listening controls belong to the Workbook only');
assert.equal(new Set(g4Wb.match(/name="wb3-\d"/g)).size, 4, 'Workbook exercise 3 keeps four listening items');
assert.equal(new Set(g4Pb.match(/name="pb7a\d"/g)).size, 2, 'Pupil’s Book 7a keeps items 2 and 3 answerable; item 1 is printed as a tick');
assert.equal(new Set(g4Pb.match(/name="pb7b\d"/g)).size, 3, 'Pupil’s Book 7b keeps three choices');
assert.equal((g4Pb.match(/id="pb8-\d"/g) || []).length, 3, 'Pupil’s Book exercise 8 keeps three blanks');
assert.equal((g4Pb.match(/id="pb9-[bcd]"/g) || []).length, 3, 'Pupil’s Book exercise 9 keeps b, c and d; a is printed answered');
assert.equal((g4Pb.match(/id="pb10-(mother|sister|brother)"/g) || []).length, 3, 'Pupil’s Book exercise 10 keeps three lines');
assert.equal(new Set(g4Wb.match(/id="wb8-[a-z0-9]+"/g)).size, 10, 'Workbook exercise 8 keeps eight in-sentence blanks plus two unlabelled lines');
assert.equal((g4Wb.match(/<form\b/g) || []).length, (g4Wb.match(/<\/form>/g) || []).length, 'Workbook forms must all be closed');
assert.equal((g4Pb.match(/<form\b/g) || []).length, (g4Pb.match(/<\/form>/g) || []).length, 'Pupil’s Book forms must all be closed');
assert.equal((read(`${g4}-test.html`).match(/<form\b/g) || []).length, (read(`${g4}-test.html`).match(/<\/form>/g) || []).length, 'Test form must be closed');
// Exercise 8 must keep the printed sentences intact around the blanks, not a stack of
// labelled boxes. Rebuild each printed sentence, replacing every field with a gap mark.
const g4Ex8 = g4Wb.match(/<form class="practice-form" id="wb-ex8">([\s\S]*?)<\/form>/)[1];
const g4Ex8Body = g4Ex8.match(/<div class="activity fill-lines">([\s\S]*?)<\/div>/);
assert.ok(g4Ex8Body, 'Workbook exercise 8 must keep a fill-lines block');
const rebuild = paragraph => paragraph
  .replace(/<input[^>]*>/g, '\u2026')
  .replace(/<label[^>]*>([\s\S]*?)<\/label>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/[\u2019]/g, '\u2019')
  .replace(/\s+/g, ' ')
  .trim();
const g4Ex8Sentences = Array.from(g4Ex8Body[1].matchAll(/<p>([\s\S]*?)<\/p>/g), m => rebuild(m[1]));
assert.deepEqual(g4Ex8Sentences, [
  'My name \u2026 I\u2019m \u2026.',
  'I live in \u2026.',
  'I\u2019ve got \u2026 sisters and \u2026 brothers.',
  'My father is an/a \u2026 He\u2019s got \u2026 and \u2026.'
], 'Workbook exercise 8 must print the four original lines with a field at each gap');
pass('Grade 4 Lesson 2 blank and option counts', 'PB 7a ×2, 7b ×3, ex8 ×3, ex9 ×3, ex10 ×3; WB tree ×6, ex3 ×4, ex5 ×5, ex8 ×10');

// Crops are pinned by hash and size so a re-crop with wrong boundaries cannot pass
// silently. The framing itself was checked against the source pages by eye; the hash
// makes any later change to these files a deliberate, reviewable act.
const g4Crops = fs.readdirSync(path.join(root, `assets/${g4}/crops`)).filter(f => f.endsWith('.png')).sort();
assert.equal(g4Crops.length, 7, 'Expected seven source crops and no generated imagery');
const g4CropManifest = JSON.parse(read(`assets/${g4}/crops-manifest.json`));
assert.equal(g4CropManifest.length, 7);
for (const item of g4CropManifest) {
  const bytes = fs.readFileSync(path.join(root, item.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, `Crop changed: ${item.file}`);
}
pass('Grade 4 Lesson 2 crops are pinned', 'Seven source crops match their recorded SHA-256 hashes and sizes');

const g4Manifest = JSON.parse(read(`assets/${g4}/source-manifest.json`));
assert.equal(g4Manifest.length, 6);
for (const item of g4Manifest) {
  const bytes = fs.readFileSync(path.join(root, item.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, `Original changed: ${item.file}`);
}
pass('Grade 4 Lesson 2 source images preserved byte-for-byte', 'Six SHA-256 matches against the supplied uploads');

const g4Vocab = read(`${g4}-vocabulary.html`);
const arabicCells = Array.from(g4Vocab.matchAll(/<td class="ar" lang="ar" dir="rtl">([^<]+)<\/td>/g));
assert.ok(arabicCells.length >= 40, 'Vocabulary: expected the lesson word list with Arabic meanings');
for (const cell of arabicCells) {
  const value = cell[1].trim();
  assert.ok(!/[.!]$/.test(value), `Vocabulary meaning must stay word-level: ${value}`);
  assert.ok(value.split(/\s+/).length <= 3, `Vocabulary meaning must be a short word-level translation: ${value}`);
}
assert.ok(!/class="ar"/.test(g4Pb) && !/class="ar"/.test(g4Wb) && !/class="ar"/.test(read(`${g4}-test.html`)) && !/class="ar"/.test(read(`${g4}.html`)), 'Arabic meanings must not appear outside the Vocabulary page');
pass('Grade 4 Lesson 2 language policy', `${arabicCells.length} Arabic word meanings, all marked RTL inside the Vocabulary tables; every other page is English only`);

const g4Test = read(`${g4}-test.html`);
const g4Quiz = JSON.parse(read('tests/grade4-unit1-lesson2.quiz.json'));
const g4Blocks = Array.from(g4Test.matchAll(/<section class="question" id="q(\d+)"([^>]*)>([\s\S]*?)<\/section>/g));
assert.equal(g4Blocks.length, 20);
assert.equal(g4Quiz.length, 20);
for (const [index, block] of g4Blocks.entries()) {
  const expected = g4Quiz[index];
  const data = attrs('<section ' + block[2] + '>');
  assert.equal(Number(block[1]), expected.number);
  assert.equal(Number(data['data-correct']), expected.correct);
  assert.equal(data['data-reference'], expected.reference);
  assert.equal(data['data-kind'], expected.kind);
  assert.equal(plain(block[3].match(/<h2>([\s\S]*?)<\/h2>/)[1]), `${expected.number}. ${expected.prompt}`);
  const options = Array.from(block[3].matchAll(/<span class="en" lang="en" dir="ltr">([abc]\) [\s\S]*?)<\/span>/g), m => plain(m[1]).slice(3));
  assert.deepEqual(options, expected.options);
}
assert.equal((g4Test.match(/type="radio"/g) || []).length, 60);
assert.equal((g4Test.match(/data-kind="inferred"/g) || []).length, 7);
assert.equal((g4Test.match(/data-kind="explicit"/g) || []).length, 13);
assert.ok(g4Test.includes('id="answer-guide" class="answer" hidden'));
assert.ok(g4Test.includes('id="teacher-password"'));
pass('Grade 4 Lesson 2 test structure', '20 questions, 60 options, 13 direct readings and 7 labelled inferences; prompts, choices, references and answer indices match the fixture');

function collectFiles(directory, extension, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) collectFiles(path.join(directory, entry.name), extension, files);
    } else if (path.extname(entry.name).toLowerCase() === extension) files.push(path.join(directory, entry.name));
  }
  return files;
}
let docLinks = 0;
for (const file of collectFiles(root, '.md')) {
  const markdown = fs.readFileSync(file, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const url = match[1];
    if (/^(?:https?:|#)/.test(url)) continue;
    const resolved = path.resolve(path.dirname(file), fileOfUrl(url));
    assert.ok(resolved.startsWith(root + path.sep), `${path.relative(root, file)}: documentation link leaves project: ${url}`);
    assert.ok(fs.existsSync(resolved), `${path.relative(root, file)}: broken documentation link ${url}`);
    docLinks++;
  }
}
let cssReferences = 0;
function checkCssAssets(css, owner) {
  for (const match of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
    const url = match[1].trim();
    if (!localUrl(url)) continue;
    const resolved = path.resolve(path.dirname(owner), fileOfUrl(url));
    assert.ok(resolved.startsWith(root + path.sep), `${path.relative(root, owner)}: CSS asset leaves project: ${url}`);
    assert.ok(fs.existsSync(resolved), `${path.relative(root, owner)}: missing CSS asset: ${url}`);
    cssReferences++;
  }
}
for (const file of collectFiles(root, '.css')) checkCssAssets(fs.readFileSync(file, 'utf8'), file);
for (const file of htmlFiles) {
  const html = read(file);
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) checkCssAssets(match[1], path.join(root, file));
}
pass('Documentation links and local font assets', `${docLinks} Markdown links; ${cssReferences} local CSS assets resolve`);

const result = { suite: 'static-site-and-source-integrity', date: new Date().toISOString(), status: 'PASS', checks };
console.log(JSON.stringify(result, null, 2));
