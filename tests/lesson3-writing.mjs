import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

// Every scan for this batch must stay byte-for-byte unchanged. The two lesson manifests
// map the twelve supplied originals onto the preserved repository scans.
const g3Manifest = JSON.parse(fs.readFileSync('assets/grade3-unit1-lesson3/source-manifest.json', 'utf8'));
const g4Manifest = JSON.parse(fs.readFileSync('assets/grade4-unit1-lesson3/source-manifest.json', 'utf8'));

// Upload order for this batch: G3 Pupil's Book 9-11 (1-3), G3 Workbook 9-11 (4-6),
// G4 Pupil's Book 9-11 (7-9), G4 Workbook 11-13 (10-12).
const g3Expected = [
  'pupil-book-page-9.png', 'pupil-book-page-10.png', 'pupil-book-page-11.png',
  'workbook-page-9.png', 'workbook-page-10.png', 'workbook-page-11.png'
];
const g4Expected = [
  'pupil-book-page-9.png', 'pupil-book-page-10.png', 'pupil-book-page-11.png',
  'workbook-page-11.png', 'workbook-page-12.png', 'workbook-page-13.png'
];
const check = (entries, expected, label) => {
  assert.equal(entries.length, 6, `${label}: six supplied scans`);
  entries.forEach((entry, index) => {
    assert.ok(fs.existsSync(entry.file), `${label}: ${entry.file} is present`);
    const bytes = fs.readFileSync(entry.file);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, `${label}: original changed — ${entry.file}`);
    assert.ok(entry.file.endsWith(expected[index]), `${label}: upload ${index + 1} scan order`);
  });
};
check(g3Manifest, g3Expected, 'Grade 3');
check(g4Manifest.images, g4Expected, 'Grade 4');

// Printed page numbers must match the scans the lesson pages cite.
const g3Pages = g3Manifest.map(entry => entry.file);
assert.deepEqual(g3Pages.filter(file => file.includes('pupil-book')), [
  'assets/grade3-unit1-lesson3/source/pupil-book-page-9.png',
  'assets/grade3-unit1-lesson3/source/pupil-book-page-10.png',
  'assets/grade3-unit1-lesson3/source/pupil-book-page-11.png'
]);
assert.deepEqual(g3Pages.filter(file => file.includes('workbook')), [
  'assets/grade3-unit1-lesson3/source/workbook-page-9.png',
  'assets/grade3-unit1-lesson3/source/workbook-page-10.png',
  'assets/grade3-unit1-lesson3/source/workbook-page-11.png'
]);
for (const image of g4Manifest.images) {
  const book = image.book === 'pupil-book' ? 'pupil-book' : 'workbook';
  assert.ok(image.file.includes(`${book}-page-${image.sourcePage}.png`), `${image.file}: printed page number matches the manifest`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(image.file)).digest('hex'), image.sha256, `${image.file}: original changed`);
  assert.equal(fs.statSync(image.file).size, image.bytes, `${image.file}: byte count matches the manifest`);
}

// Genuine written-production activities, recorded per book and printed page.
const inventory = {
  'grade3-unit1-lesson3-workbook.html': [
    ['wb-1', 'Workbook', 9, 5], ['wb-2', 'Workbook', 9, 6], ['wb-3', 'Workbook', 10, 3],
    ['wb-4', 'Workbook', 10, 2], ['wb-5', 'Workbook', 11, 4], ['wb-6', 'Workbook', 11, 6]
  ],
  'grade4-unit1-lesson3-pupil-book.html': [
    ['pb-9', "Pupil's Book", 11, 4], ['pb-10', "Pupil's Book", 11, 6], ['pb-11', "Pupil's Book", 11, 5]
  ],
  'grade4-unit1-lesson3-workbook.html': [
    ['wb-2', 'Workbook', 11, 6], ['wb-4', 'Workbook', 12, 5], ['wb-5', 'Workbook', 12, 2], ['wb-8', 'Workbook', 13, 7]
  ]
};
const writingPages = Object.keys(inventory);
for (const file of writingPages) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<script src="lesson3-writing-practice\.js" defer><\/script>/, `${file}: writing practice wired in`);
  assert.ok(!/id="(?:teacher-gate|teacher-key|answer-guide)"/.test(html), `${file}: pupil book pages must not include the teacher-only key`);
}
// The two Pupil's Book pages with no written production must not claim writing activities.
for (const file of ['grade3-unit1-lesson3-pupil-book.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(!/lesson3-writing-practice\.js/.test(html), `${file}: no writing layer where the book prints no writing`);
}
for (const [file, activities] of Object.entries(inventory)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [id, book, page, fields] of activities) {
    const section = html.match(new RegExp(`<section class="panel" id="${id}"[\\s\\S]*?</section>`))?.[0];
    assert.ok(section, `${file}: ${id} is present`);
    assert.match(section, new RegExp(`<span class="pill">Page ${page} ·`), `${file}: ${id} printed page ${page}`);
    const controls = (section.match(/<input[^>]*type="text"[^>]*>/g) || []).length;
    assert.equal(controls, fields, `${file}: ${id} keeps its ${fields} printed response spaces`);
  }
}

const code = fs.readFileSync('lesson3-writing-practice.js', 'utf8');
assert.ok(!/teacher-password|unlock-solutions|answer-guide|teacher-key/.test(code), 'writing practice must not copy teacher-only keys');
// Models injected by the layer must carry the required labels.
assert.match(code, /Show a sample answer \(answers vary\)/, 'personal prompts are labelled as illustrative samples');
assert.match(code, /The original recording was not supplied/, 'audio-dependent numbering is documented instead of modelled');
assert.match(code, /quarter to one/, 'the printed clock model records the derived times');
for (const file of ['grade3-unit1-lesson3.css', 'grade4-unit1-lesson3.css']) {
  const css = fs.readFileSync(file, 'utf8');
  assert.match(css, /\.writing-model\s*\{/, `${file}: labelled model styling`);
  assert.match(css, /\.writing-actions/, `${file}: per-activity control styling`);
}
console.log(`PASS Lesson 3 Writing inventory: ${Object.values(inventory).flat().length} source-verified written-production activities across 12 unchanged scans`);
