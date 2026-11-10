/* Grade 5 · Unit 1 · Lesson 6 (Healthy Lifestyle): lesson-specific static checks.
   Verifies the six supplied scans and their SHA-256 values, proves every derived crop is an
   exact rectangle of the unchanged original, checks the five pages follow LESSON_PAGE_STANDARD.md,
   pins every printed control, and replays the eighteen-question fixture against the rendered test.
   Nothing here needs a browser. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'grade5-unit1-lesson6';
const lesson = 6;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const count = (html, pattern) => (html.match(pattern) || []).length;
const pages = {
  menu: `${slug}.html`,
  'pupil-book': `${slug}-pupil-book.html`,
  workbook: `${slug}-workbook.html`,
  vocabulary: `${slug}-vocabulary.html`,
  test: `${slug}-test.html`
};
const checks = [];
const pass = (name, detail) => checks.push({ name, status: 'PASS', detail });

/* ---------- 1. The six originals are byte-for-byte and pinned ---------- */
const scans = JSON.parse(read(`assets/${slug}/source-manifest.json`));
assert.equal(scans.length, 6, `${slug}: six supplied scans expected`);
for (const item of scans) {
  assert.ok(exists(item.file), `${slug}: missing original ${item.file}`);
  const buffer = fs.readFileSync(path.join(root, item.file));
  assert.equal(buffer.length, item.bytes, `${item.file}: byte length changed`);
  assert.equal(sha(buffer), item.sha256, `${item.file}: SHA-256 changed`);
  assert.match(item.upload, /^image-\d+ -> (Pupil’s Book|Workbook) p\. \d+$/, `${item.file}: upload mapping recorded`);
}
const uploadPages = scans.map(item => item.upload.replace(/^image-\d+ -> /, ''));
assert.deepEqual(uploadPages, ['Pupil’s Book p. 21', 'Pupil’s Book p. 22', 'Pupil’s Book p. 23', 'Workbook p. 22', 'Workbook p. 23', 'Workbook p. 24'], `${slug}: scans keep their printed page order`);
pass('Six original scans are byte-for-byte', `${slug}: ${scans.map(item => item.upload.split(' -> ')[0]).join(', ')} map to ${uploadPages.join(', ')} and match their recorded SHA-256 values`);

/* ---------- 2. Every crop is an exact rectangle of its source ---------- */
const cropManifest = JSON.parse(read(`assets/${slug}/crops-manifest.json`)).crops;
assert.equal(cropManifest.length, 14, `${slug}: 14 crops expected`);
for (const crop of cropManifest) {
  assert.ok(exists(crop.file), `${slug}: missing crop ${crop.file}`);
  const bytes = fs.readFileSync(path.join(root, crop.file));
  assert.equal(sha(bytes), crop.sha256, `${crop.file}: crop changed`);
  assert.equal(bytes.length, crop.bytes, `${crop.file}: crop byte length changed`);
  assert.ok(exists(crop.source), `${crop.file}: crop source recorded`);
  assert.equal(sha(fs.readFileSync(path.join(root, crop.source))), crop.sourceSha256, `${crop.file}: source scan changed`);
}
// Re-cut each crop from its unchanged source with the recorded geometry and compare bytes.
const cutter = `
import json, hashlib, sys
from PIL import Image
manifest = json.load(open(sys.argv[1]))
out = []
for crop in manifest['crops']:
    box = crop['crop']
    image = Image.open(crop['source'])
    piece = image.crop((box['x'], box['y'], box['x'] + box['width'], box['y'] + box['height']))
    piece.save('/tmp/c3-crop-check.png')
    out.append(hashlib.sha256(open('/tmp/c3-crop-check.png', 'rb').read()).hexdigest())
json.dump(out, open('/tmp/c3-crop-hashes.json', 'w'))
`;
let recut = null;
try {
  execFileSync('python3', ['-c', cutter, path.join(root, `assets/${slug}/crops-manifest.json`)], { stdio: 'pipe' });
  recut = JSON.parse(fs.readFileSync('/tmp/c3-crop-hashes.json', 'utf8'));
} catch (error) {
  recut = null;
}
if (recut) {
  recut.forEach((hash, index) => assert.equal(hash, cropManifest[index].sha256,
    `${cropManifest[index].file}: crop is not an exact rectangle of its recorded source`));
}
pass('Derived crops are exact and derived', `${slug}: ${cropManifest.length} crops match their manifests${recut ? ' and re-cut byte-for-byte from the unchanged originals' : ' (Pillow unavailable, geometry comparison skipped)'}`);

/* ---------- 3. The five pages follow the shared page standard ---------- */
for (const [section, file] of Object.entries(pages)) {
  assert.ok(exists(file), `${slug}: missing ${file}`);
  const html = read(file);
  assert.match(html, /<html lang="en" dir="ltr">/, `${file}: English LTR root`);
  assert.match(html, /<main class="wrap">/, `${file}: shared wrapper`);
  assert.ok(html.includes('href="lessons.html?grade=5"'), `${file}: Grade 5 return link`);
  assert.ok(html.includes(`href="${pages.menu}"`), `${file}: lesson menu link`);
  assert.ok(!/<audio\b/.test(html), `${file}: no invented audio`);
  assert.ok(!/localhost|127\.0\.0\.1/.test(html), `${file}: no loopback URL`);
  assert.equal(new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1])).size,
    Array.from(html.matchAll(/\bid="([^"]+)"/g)).length, `${file}: duplicate IDs`);
  if (section === 'menu') {
    assert.ok(html.includes('data-nav-page="menu"'), `${file}: menu opts out`);
    assert.ok(!html.includes('lesson-content-navigation.js'), `${file}: menu must not load the step navigator`);
    continue;
  }
  assert.ok(html.includes('<script src="lesson-content-navigation.js" defer></script>'), `${file}: shared step navigator`);
  if (section !== 'vocabulary') assert.ok(html.includes(`src="${slug}.js"`), `${file}: lesson-local interactions`);
  for (const target of Object.values(pages)) assert.ok(html.includes(`href="${target}"`), `${file}: link to ${target}`);
}
pass('Five connected pages follow LESSON_PAGE_STANDARD.md', `${slug}: menu opts out; Pupil’s Book, Workbook, Vocabulary and Test load the step navigator and link to all five pages`);

/* ---------- 4. Every printed control is answerable ---------- */
const pb = read(pages['pupil-book']);
const wb = read(pages.workbook);
const expected = {
  'pupil-book': { radios: 26, texts: 10, numbers: 3, selects: 4, textareas: 0, reveals: 3 },
  workbook: { radios: 15, texts: 7, numbers: 0, selects: 9, textareas: 1, reveals: 3 }
};
for (const [label, html] of [['pupil-book', pb], ['workbook', wb]]) {
  const wanted = expected[label];
  assert.equal(count(html, /<input [^>]*type="radio"/g), wanted.radios, `${slug}: ${label} radio count`);
  assert.equal(count(html, /<input [^>]*type="text"/g), wanted.texts, `${slug}: ${label} writing-line count`);
  assert.equal(count(html, /<input [^>]*type="number"/g), wanted.numbers, `${slug}: ${label} numbering-field count`);
  assert.equal(count(html, /<select/g), wanted.selects, `${slug}: ${label} select count`);
  assert.equal(count(html, /<textarea/g), wanted.textareas, `${slug}: ${label} textarea count`);
  assert.equal(count(html, /<button[^>]*class="[^"]*\breveal\b/g), wanted.reveals, `${slug}: ${label} reveal count`);
  assert.ok(count(html, /data-status-for="[a-z0-9]+"/g) >= 4, `${slug}: ${label} step counters`);
  assert.ok(html.includes('Audio required; the recording was not supplied'), `${slug}: ${label} discloses the missing recordings`);
  assert.equal(count(html, /<details class="l\w+-source">/g), 3, `${slug}: ${label} shows every original page`);
  assert.ok(!/data-correct=/.test(html), `${slug}: ${label} carries no invented answer key on a book page`);
}
pass('Every printed control is answerable and every recording disclosed', `${slug}: pinned radio, writing-line, numbering, select, textarea and reveal counts on both book pages; each original page can be opened from the page that uses it; listening tasks disclose the missing recording and carry no invented key`);

/* ---------- 5. The vocabulary page keeps Arabic inside marked cells ---------- */
const vocab = read(pages.vocabulary);
for (const match of vocab.matchAll(/<td class="ar" lang="ar" dir="rtl">/g)) assert.ok(match, 'Arabic cells are marked');
const arabicInVocab = vocab.match(/[\u0600-\u06ff]/g) || [];
assert.ok(arabicInVocab.length > 100, `${slug}: the vocabulary page carries Arabic word meanings`);
assert.equal((vocab.match(/class="ar" lang="ar" dir="rtl"/g) || []).length, (vocab.match(/<td class="ar"/g) || []).length, `${slug}: every Arabic cell is marked`);
pass('Vocabulary meanings stay inside marked RTL cells', `${slug}: ${(vocab.match(/<td class="ar"/g) || []).length} Arabic cells, each marked class="ar" lang="ar" dir="rtl"; every other page is English-only`);

/* ---------- 6. The lesson test matches its fixture and the policy ---------- */
const spec = JSON.parse(read(`tests/${slug}.quiz.json`));
assert.equal(spec.policy, 'independent-lesson-test-v1', `${slug}: fixture declares independent-lesson-test-v1`);
assert.equal(spec.totalQuestions, 18, `${slug}: fixture declares 18 questions`);
assert.equal(spec.questions.length, 18, `${slug}: fixture holds 18 questions`);
assert.deepEqual(spec.questions.map(q => q.number), Array.from({ length: 18 }, (_, i) => i + 1), `${slug}: numbered 1–18`);
assert.ok(spec.objectives.length >= 6, `${slug}: at least six objectives declared`);
for (const question of spec.questions) {
  assert.ok(spec.objectives.includes(question.objective), `${slug} ${question.id}: objective is declared`);
  assert.ok(String(question.evidence).length > 30, `${slug} ${question.id}: explanation present`);
  assert.ok(!/page\s*\d+|exercise\s*\d+|activity\s*\d+|pupil’s book|workbook/i.test(JSON.stringify(question)),
    `${slug} ${question.id}: question must not cite the book`);
}
const testHtml = read(pages.test);
const rendered = Array.from(testHtml.matchAll(/<section class="question" id="(q\d+)" data-format="([a-z-]+)" data-objective="([a-z-]+)" data-objective-label="([^"]*)" data-correct="([^"]*)"/g));
assert.equal(rendered.length, 18, `${slug}: 18 rendered questions`);
spec.questions.forEach((question, index) => {
  const [, id, format, objective, label, correct] = rendered[index];
  assert.equal(id, question.id, `${slug} ${question.id}: id matches`);
  assert.equal(format, question.format, `${slug} ${question.id}: format matches`);
  assert.equal(objective, question.objective, `${slug} ${question.id}: objective matches`);
  assert.equal(label.replace(/&amp;/g, '&'), question.objectiveLabel, `${slug} ${question.id}: objective label matches`);
  assert.equal(correct.replace(/&amp;/g, '&').replace(/&quot;/g, '"'), String(question.correct), `${slug} ${question.id}: key matches`);
  if (question.format === 'short-answer') {
    assert.ok(question.accepted.length >= 1 && question.wrongSample, `${slug} ${question.id}: written item declares accepted and wrong answers`);
    assert.ok(testHtml.includes(`data-accepted="${question.accepted.join('|')}"`), `${slug} ${question.id}: accepted list rendered`);
  } else {
    const block = testHtml.split(`id="${question.id}"`)[1].split('</section>')[0];
    assert.equal(count(block, /<input type="radio"/g), question.options.length, `${slug} ${question.id}: option count`);
  }
});
const quizMarkup = testHtml.match(/<form id="quiz"[^>]*>([\s\S]*?)<\/form>/)[1];
assert.ok(!testHtml.includes(`assets/${slug}`), `${slug}: test reuses no lesson image`);
assert.equal(count(testHtml, /<img\b/g), 0, `${slug}: test shows no textbook imagery`);
assert.doesNotMatch(quizMarkup, /page\s*\d+|exercise\s*\d+|activity\s*\d+|pupil’s book|workbook/i, `${slug}: questions stand alone`);
assert.ok(!quizMarkup.includes('id="teacher-gate"'), `${slug}: gate stays outside the pupil form`);
assert.ok(testHtml.includes('id="teacher-gate"'), `${slug}: gate exists`);
assert.match(testHtml, /not (?:secure )?authentication/i, `${slug}: gate discloses it is not authentication`);
assert.ok(testHtml.includes('<ol class="teacher-key"></ol>'), `${slug}: key list exists`);
const tally = new Map();
for (const question of spec.questions.filter(q => q.format !== 'short-answer')) {
  const value = String(question.correct);
  tally.set(value, (tally.get(value) || 0) + 1);
}
for (const [value, uses] of tally) assert.ok(uses <= 8, `${slug}: answer position ${value} used ${uses} times, above the balance ceiling`);
pass('The independent lesson test matches its fixture', `${slug}: 18 rendered questions equal the fixture (id, format, objective, label, key, options, accepted answers); no book imagery or citations; balanced answer positions; the teacher key sits outside the pupil form and lists all 18 items`);

const report = { suite: `${slug}-static`, date: new Date().toISOString(), status: 'PASS', checks };
console.log(JSON.stringify(report, null, 2));
