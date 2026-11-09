import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const lesson = process.argv[2];
if (!lesson) throw new Error('Lesson number argument is required');
if (!lesson) throw new Error('Lesson number argument is required');
const slug = 'grade3-unit1-lesson' + lesson;
const suffixes = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'];
const files = suffixes.map(suffix => `${slug}${suffix}.html`);
const content = JSON.parse(read(`tests/${slug}.content.json`));
const quiz = JSON.parse(read(`tests/${slug}.quiz.json`));
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const normalize = value => String(value).toLowerCase().replace(/[\u2018\u2019`]/g, "'").trim().replace(/\s+/g, ' ').replace(/\s+([?.!,])/g, '$1').replace(/[.?!]+$/, '').trim();
const words = value => normalize(value).replace(/[.?!]+$/, '').match(/[a-z0-9']+/g) || [];
const shingles = (value, size = 7) => {
  const tokens = words(value);
  return new Set(tokens.slice(0, Math.max(0, tokens.length - size + 1)).map((_, i) => tokens.slice(i, i + size).join(' ')));
};
let passes = 0;
const pass = (name, detail) => { passes++; console.log(`PASS ${name} ${detail}`); };

for (const file of files) {
  const html = read(file);
  assert.match(html, /<html lang="en" dir="ltr">/, `${file}: English/LTR document`);
  assert.match(html, /<main class="wrap">/, `${file}: shared main landmark`);
  assert.equal((html.match(/src="design-system\.css"|href="design-system\.css"/g) || []).length, 1, `${file}: one shared stylesheet`);
  assert.equal((html.match(new RegExp(`href="${slug}\\.css"`, 'g')) || []).length, 1, `${file}: one local stylesheet`);
  for (const script of ['platform-shell.js', 'lesson-accessibility.js']) {
    assert.equal((html.match(new RegExp(`src="${script.replace('.', '\\.')}"`, 'g')) || []).length, 1, `${file}: one ${script}`);
  }
  const nav = html.match(/<nav class="section-links"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav, `${file}: section switcher exists`);
  assert.equal((nav.match(/class="section-link"/g) || []).length, 5, `${file}: all five sections linked`);
  assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, `${file}: one current section`);
  for (const target of files) assert.ok(nav.includes(`href="${target}"`), `${file}: missing link to ${target}`);
  const section = file.slice(slug.length, -5).replace(/^-/, '') || 'menu';
  assert.ok(html.includes(`data-nav-page="${section}"`), `${file}: correct navigation page id`);
  if (section === 'menu') {
    assert.ok(!html.includes('lesson-content-navigation.js') && !html.includes('lesson-navigation.js'), 'menu must not gain an empty step navigator');
    const prev = String(Number(lesson) - 1);
    assert.ok(html.includes(`href="grade3-unit1-lesson${prev}.html"`), `menu links to the previous published lesson ${prev}`);
    if (lesson === '5') {
      assert.ok(html.includes('href="grade3-unit1-lesson4.html"'), 'Revision 1 closes the published sequence');
      assert.match(html, /Next lesson · not yet published/, 'menu does not invent an unavailable next lesson');
    } else {
      assert.ok(html.includes(`href="grade3-unit1-lesson${Number(lesson) + 1}.html"`), `menu links to the next published lesson ${Number(lesson) + 1}`);
    }
  } else {
    for (const script of [`${slug}.js`, 'lesson-navigation.js', 'lesson-content-navigation.js']) {
      assert.equal((html.match(new RegExp(`src="${script.replace('.', '\\.')}"`, 'g')) || []).length, 1, `${file}: one ${script}`);
    }
    assert.ok(html.includes(`data-lesson-nav="${slug}"`), `${file}: shared section flow enabled`);
  }
}
pass('Five-page structure and navigation', 'Exact filenames, English/LTR shell, five section links, one current page, shared scripts and honest previous/next-lesson state');

const pngSize = buffer => [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
assert.equal(content.sourceImages.length, 6);
const sourceManifest = JSON.parse(read(`assets/${slug}/source-manifest.json`));
assert.equal(sourceManifest.length, 6);
for (const source of content.sourceImages) {
  const buffer = fs.readFileSync(path.join(root, source.file));
  assert.equal(sha(buffer), source.sha256, `${source.file}: original upload bytes changed`);
  assert.deepEqual(pngSize(buffer), source.size, `${source.file}: source dimensions changed`);
  assert.ok(sourceManifest.some(item => item.file === source.file && item.sha256 === source.sha256), `${source.file}: manifest mismatch`);
}
const cropManifest = JSON.parse(read(`assets/${slug}/crops-manifest.json`));
assert.equal(cropManifest.length, content.cropCount);
const allLessonHtml = files.map(read).join('\n');
for (const crop of cropManifest) {
  const buffer = fs.readFileSync(path.join(root, crop.file));
  assert.equal(sha(buffer), crop.sha256, `${crop.file}: crop bytes changed`);
  assert.deepEqual(pngSize(buffer), crop.size, `${crop.file}: crop dimensions changed`);
  const [x1, y1, x2, y2] = crop.box;
  const originalEntry = sourceManifest.find(item => item.file === crop.source);
  const original = originalEntry && content.sourceImages.find(item => item.file === originalEntry.file);
  const scale = crop.scale || 1;
  assert.ok(original && x1 >= 0 && y1 >= 0 && x2 <= original.size[0] && y2 <= original.size[1] && (x2 - x1) * scale === crop.size[0] && (y2 - y1) * scale === crop.size[1], `${crop.file}: crop box does not match its source`);
  assert.ok(allLessonHtml.includes(crop.file), `${crop.file}: faithful crop is not used by the lesson`);
}
pass('Authoritative source assets', `Six byte-preserved originals and ${cropManifest.length} direct crops match SHA-256 manifests, dimensions and crop boxes; every crop is used`);

for (const [section, counts] of Object.entries(content.responseControls)) {
  const html = read(`${slug}-${section}.html`);
  const scope = section === 'test' ? html.match(/<form id="quiz"[\s\S]*?<\/form>/)[0] : html;
  for (const [type, expected] of Object.entries(counts)) {
    const actual = type === 'canvas' ? (scope.match(/<canvas\b/g) || []).length
      : type === 'select' ? (scope.match(/<select\b/g) || []).length
      : (scope.match(new RegExp(`<input[^>]*type="${type}"`, 'g')) || []).length;
    assert.equal(actual, expected, `${section}: ${type} response count`);
  }
}
const bookIds = { 'pupil-book': [], workbook: [] };
for (const id of Object.keys(content.printed)) bookIds[id.startsWith('pb') ? 'pupil-book' : 'workbook'].push(id);
for (const [section, ids] of Object.entries(bookIds)) {
  const html = read(`${slug}-${section}.html`);
  const actual = [...html.matchAll(/data-source-id="([^"]+)"/g)].map(match => match[1]).sort();
  assert.deepEqual(actual, [...ids].sort(), `${section}: exact printed-block coverage`);
}
for (const [id, instruction] of Object.entries(content.instructions)) {
  const section = id.startsWith('pb') ? 'pupil-book' : 'workbook';
  const html = read(`${slug}-${section}.html`);
  const block = html.match(new RegExp(`<section class="panel" id="${id}"[\\s\\S]*?<h2>([^<]+)</h2>`));
  assert.ok(block && normalize(block[1]) === normalize(instruction), `${id}: exact printed instruction`);
}
const wb = read(`${slug}-workbook.html`);
const listening = wb.match(/<form class="practice-form" id="wb-listen"[\s\S]*?<\/form>/)[0];
assert.ok(!listening.includes('check-practice') && !listening.includes('class="answer"') && !listening.includes('data-practice'), 'audio-dependent listening must not gain a fabricated checker or key');
const sectionOf = (html, formId) => {
  const formIndex = html.indexOf(`id="${formId}"`);
  if (formIndex < 0) return '';
  const start = html.lastIndexOf('<section class="panel"', formIndex);
  const end = html.indexOf('</section>', formIndex);
  return start >= 0 && end > start ? html.slice(start, end) : '';
};
for (const section of ['pupil-book', 'workbook']) {
  const html = read(`${slug}-${section}.html`);
  const forms = [...html.matchAll(/<form class="practice-form" id="([^"]+)"[\s\S]*?<\/form>/g)];
  for (const match of forms) {
    if (match[0].includes('check-practice')) continue;
    const panel = sectionOf(html, match[1]);
    assert.match(panel, /not scored|unavailable|recording/i, `${match[1]}: unscored practice must disclose why it cannot be checked`);
    assert.ok(!panel.includes('class="answer"'), `${match[1]}: unscored practice must not publish an answer key`);
  }
}
const pupilBook = read(`${slug}-pupil-book.html`);
for (const match of pupilBook.matchAll(/<form class="practice-form" id="([^"]+)"[\s\S]*?<\/form>/g)) {
  if (!match[0].includes('data-audio-only')) continue;
  const panel = sectionOf(pupilBook, match[1]);
  assert.match(panel, /audio required|recording unavailable|unavailable|not scored/i, `${match[1]}: missing-audio disclosure`);
}
assert.ok(!/<audio\b|\.mp3|\.wav|\.ogg/i.test(allLessonHtml + read(`${slug}.js`)), 'no replacement audio is invented');
pass('Exercise and response-space coverage', `All ${Object.keys(content.instructions).length} printed instructions, ${Object.keys(content.printed).length} printed blocks, ${Object.values(content.responseControls).reduce((n, c) => n + Object.values(c).reduce((a, b) => a + b, 0), 0)} response controls and audio limitations are present`);

const vocabularyHtml = read(`${slug}-vocabulary.html`);
const rows = [...vocabularyHtml.matchAll(/<tr><td lang="en" dir="ltr">([\s\S]*?)<\/td><td class="ar" lang="ar" dir="rtl">([\s\S]*?)<\/td>/g)]
  .map(match => ({ english: match[1].replace(/<[^>]+>/g, '').trim(), arabic: match[2].replace(/<[^>]+>/g, '').trim() }));
assert.deepEqual(rows, content.vocabulary, 'vocabulary entries, meanings and order must match the reviewed lesson-only list');
assert.equal((vocabularyHtml.match(/class="ar" lang="ar" dir="rtl"/g) || []).length, content.vocabulary.length);
for (const file of [...files.filter(file => !file.endsWith('-vocabulary.html')), `${slug}.js`, `${slug}.css`]) {
  assert.ok(!/[\u0600-\u06ff]/.test(read(file)), `${file}: Arabic belongs only in marked vocabulary meaning cells`);
}
pass('Vocabulary and language direction', `${rows.length} lesson-only entries with reviewed Arabic meanings; Arabic is confined to RTL meaning cells and English remains LTR`);

assert.equal(quiz.totalQuestions, 20);
assert.equal(quiz.questions.length, 20);
assert.deepEqual(quiz.questions.map(item => item.id), Array.from({ length: 20 }, (_, i) => `q${i + 1}`));
const formats = { 'multiple-choice': 0, 'true-false': 0, 'short-answer': 0 };
const objectives = new Set();
const testHtml = read(`${slug}-test.html`);
const quizHtml = testHtml.match(/<form id="quiz"[\s\S]*?<\/form>/)[0];
assert.equal((quizHtml.match(/class="question"/g) || []).length, 20);
assert.ok(!/\bchecked(?:\s|>)/.test(quizHtml) && !/<input[^>]*type="text"[^>]*\bvalue=/.test(quizHtml), 'student quiz fields must start empty');
for (const item of quiz.questions) {
  formats[item.format]++;
  objectives.add(item.objective);
  assert.ok(quiz.objectives.includes(item.objective), `${item.id}: unknown objective`);
  assert.ok(item.evidence.length > 20, `${item.id}: explanation required`);
  const block = quizHtml.match(new RegExp(`<section class="question" id="${item.id}"[\\s\\S]*?<\\/section>`))?.[0];
  assert.ok(block, `${item.id}: rendered question exists`);
  assert.ok(block.includes(`data-objective="${item.objective}"`), `${item.id}: objective tag`);
  assert.ok(block.includes(`data-format="${item.format}"`), `${item.id}: format tag`);
  if (item.format === 'short-answer') {
    const accepted = item.accepted.map(normalize);
    assert.equal(new Set(accepted).size, accepted.length, `${item.id}: duplicate accepted answers`);
    assert.ok(accepted.includes(normalize(item.correct)), `${item.id}: key must be accepted`);
    assert.ok(!accepted.includes(normalize(item.wrongSample)) && !accepted.includes(''), `${item.id}: wrong/empty answer must not score`);
    const acceptedAttr = (block.match(/data-accepted="([^"]*)"/) || [])[1] || '';
    const decoded = acceptedAttr.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    assert.equal(decoded, item.accepted.join('|'), `${item.id}: accepted answers published consistently`);
  } else {
    const values = item.options.map((_, i) => String(i));
    assert.ok(values.includes(String(item.correct)), `${item.id}: key must identify exactly one option`);
    assert.equal(values.filter(value => value === String(item.correct)).length, 1, `${item.id}: one unambiguous key`);
    assert.equal((block.match(/type="radio"/g) || []).length, item.options.length, `${item.id}: every option rendered`);
    assert.ok(block.includes(`data-correct="${item.correct}"`), `${item.id}: key published consistently`);
    if (item.format === 'true-false') assert.equal(item.options.length, 2);
  }
}
assert.deepEqual(formats, { 'multiple-choice': 12, 'true-false': 4, 'short-answer': 4 });
assert.equal(objectives.size, quiz.objectives.length, 'every declared objective is assessed');
assert.ok(testHtml.includes('id="teacher-gate"') && !quizHtml.includes('id="teacher-gate"'), 'teacher gate stays outside the pupil form');
assert.ok(testHtml.includes('id="answer-guide" class="answer" hidden'), 'teacher key starts hidden');
pass('Independent test key and scoring contract', `Exactly 20 items (12 MC, 4 TF, 4 written), one key each, all ${quiz.objectives.length} objectives tagged, written equivalence bounded, wrong/empty samples rejected and key hidden`);

const sourceCorpus = [...Object.values(content.printed), ...Object.values(content.instructions)].join(' ');
const sourceShingles = shingles(sourceCorpus);
let longestOverlap = 0;
const stimuli = [...testHtml.matchAll(/<div class="test-stimulus[\s\S]*?<\/div>\s*<\/div>|<div class="test-stimulus[\s\S]*?<\/div>/g)].map(match => match[0].replace(/<[^>]+>/g, ' '));
for (const item of quiz.questions) {
  const prompt = item.prompt.replace(/^\d+\.\s*/, '');
  assert.ok(!normalize(sourceCorpus).includes(normalize(prompt)), `${item.id}: copied textbook prompt`);
  for (const phrase of shingles(prompt)) {
    assert.ok(!sourceShingles.has(phrase), `${item.id}: seven-word textbook overlap: ${phrase}`);
    longestOverlap = Math.max(longestOverlap, 6);
  }
}
for (const stimulus of stimuli) {
  for (const phrase of shingles(stimulus)) assert.ok(!sourceShingles.has(phrase), `test stimulus copies textbook wording: ${phrase}`);
}
pass('Original-question independence', `No prompt or test stimulus contains a seven-word sequence from the authoritative textbook inventory (${quiz.questions.length} original items, ${quiz.objectives.length} objectives)`);

assert.ok(read('platform-shell.js').includes(`'${slug}': { grade: 3, unit: 1, lesson: ${lesson},`), `${slug}: shell metadata`);
assert.match(read('lessons.html'), /const preparedCounts = \{ 3: [3-9],/);
assert.ok(read('lessons.html').includes(`href="${slug}.html"`));
assert.ok(read('round-tests.html').includes(`href: '${slug}-test.html'`));
for (const file of files) {
  assert.ok(read('index.html').includes(`href="${file}"`), `home directory missing ${file}`);
  assert.ok(read('teacher-resources.html').includes(`href="${file}"`), `teacher directory missing ${file}`);
}
const pkg = JSON.parse(read('package.json'));
assert.ok(pkg.scripts.test.includes(`tests/${slug}.mjs`));
assert.ok(pkg.scripts['test:browser'].includes(`tests/${slug}.browser.mjs`));
assert.ok(read('.github/workflows/lesson-checks.yml').includes(`test-results/${slug}/`));
pass('Curriculum integration', `Shell metadata, Grade 3 count/listing, home and teacher directories, round-test link, npm checks and CI evidence path include Lesson ${lesson}`);
console.log(`Grade 3 Unit 1 Lesson ${lesson} static suite: PASS (${passes} groups)`);
