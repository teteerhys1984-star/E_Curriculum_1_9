import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

/* Batch 5 — static inventory contract.
   This pins what the source review recorded: unchanged scans, activity ids, printed pages,
   control counts and script wiring. It is NOT a browser interaction test; the browser
   coverage lives in tests/lesson5-writing.browser.mjs and is deliberately narrower. */

const read = file => fs.readFileSync(file, 'utf8');
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

// ---- 1. Every original scan still byte-matches its manifest -------------------
const g3 = JSON.parse(read('assets/grade3-unit1-lesson5/source-manifest.json'));
assert.equal(g3.length, 6, 'Grade 3 Lesson 5: six supplied scans');
const g3Order = [
  'pupil-book-page-15.png', 'pupil-book-page-16.png', 'pupil-book-page-17.png',
  'workbook-page-15.png', 'workbook-page-16.png', 'workbook-page-17.png'
];
g3.forEach((entry, index) => {
  assert.ok(entry.file.endsWith(g3Order[index]), `Grade 3 upload ${index + 1} scan order`);
  const bytes = fs.readFileSync(entry.file);
  assert.equal(sha(bytes), entry.sha256, `${entry.file}: original changed`);
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], entry.size, `${entry.file}: dimensions`);
});

const g4 = JSON.parse(read('assets/grade4-unit1-lesson5/source-manifest.json')).images;
assert.equal(g4.length, 11, 'Grade 4 Lesson 5: eleven supplied scans');
for (const image of g4) {
  const bytes = fs.readFileSync(image.file);
  assert.equal(sha(bytes), image.sha256, `${image.file}: original changed`);
  assert.equal(bytes.length, image.bytes, `${image.file}: byte count`);
  assert.equal(bytes.readUInt32BE(16), image.width, `${image.file}: width`);
  assert.equal(bytes.readUInt32BE(20), image.height, `${image.file}: height`);
  assert.equal(image.lesson, 5, `${image.file}: allocated to Lesson 5`);
  const book = image.book === 'pupil-book' ? 'pupil-book' : 'workbook';
  assert.ok(image.file.includes(`${book}-page-${image.sourcePage}.png`), `${image.file}: printed page matches`);
}
// Zero crops are declared for this lesson and no crop directory may appear.
const g4Crops = JSON.parse(read('assets/grade4-unit1-lesson5/crops-manifest.json'));
assert.equal(g4Crops.cropCount ?? 0, 0, 'Grade 4 Lesson 5 declares no crops');
assert.ok(!fs.existsSync('assets/grade4-unit1-lesson5/crops'), 'no unexpected crop directory');

// ---- 2. The recorded writing inventory --------------------------------------
const inventory = {
  'grade3-unit1-lesson5-pupil-book.html': {
    book: "Pupil's Book", pageBase: 0, file: 'grade3-unit1-lesson5-pupil-book.html',
    activities: [['pb-2', 16, [8, 0]]]
  },
  'grade3-unit1-lesson5-workbook.html': {
    book: 'Workbook', activities: [['wb-5', 17, [7, 0]], ['wb-6', 17, [0, 4]]]
  },
  'grade4-unit1-lesson5-pupil-book.html': {
    book: "Pupil's Book",
    activities: [['pb-1', 15, [9, 0]], ['pb-7', 17, [3, 0]], ['pb-8', 17, [6, 0]],
      ['pb-10', 18, [5, 0]], ['pb-11', 18, [5, 0]], ['pb-12', 20, [7, 0]]]
  },
  'grade4-unit1-lesson5-workbook.html': {
    book: 'Workbook',
    activities: [['wb-1', 17, [7, 0]], ['wb-2', 17, [8, 0]], ['wb-3', 17, [3, 0]],
      ['wb-5', 18, [6, 0]], ['wb-7', 19, [2, 0]], ['wb-8', 19, [7, 0]], ['wb-10', 20, [4, 0]],
      ['wb-11', 21, [5, 0]], ['wb-12', 21, [6, 0]]]
  }
};

const countActivities = Object.values(inventory).reduce((n, page) => n + page.activities.length, 0);
assert.equal(countActivities, 18, 'Batch 5 records 18 writing activities');
assert.equal(inventory['grade3-unit1-lesson5-pupil-book.html'].activities.length
  + inventory['grade3-unit1-lesson5-workbook.html'].activities.length, 3, 'Grade 3 Lesson 5: 3 writing activities');
assert.equal(inventory['grade4-unit1-lesson5-pupil-book.html'].activities.length
  + inventory['grade4-unit1-lesson5-workbook.html'].activities.length, 15, 'Grade 4 Lesson 5: 15 writing activities');

for (const [file, spec] of Object.entries(inventory)) {
  const html = read(file);
  assert.ok(html.includes('lesson5-writing-practice.js'), `${file}: loads the writing layer`);
  const ids = [...html.matchAll(/data-writing-activity="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, spec.activities.map(a => a[0]), `${file}: exact writing activity ids and order`);
  for (const [id, page, [textExpected, radioGroupsExpected]] of spec.activities) {
    const block = html.match(new RegExp(`<(?:section|div)[^>]*data-writing-activity="${id}"[^>]*>([\\s\\S]*?)(?=<div class="l5-group"|<div class="l5-pagenote"|</section>)`));
    assert.ok(block, `${file} ${id}: block exists`);
    const text = (block[1].match(/<input[^>]*type="text"/g) || []).length;
    assert.equal(text, textExpected, `${file} ${id}: ${textExpected} written text fields`);
    const radios = [...block[1].matchAll(/<input[^>]*type="radio"[^>]*name="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(radios).size, radioGroupsExpected, `${file} ${id}: ${radioGroupsExpected} written choice groups`);
    assert.ok(text + radioGroupsExpected > 0, `${file} ${id}: every writing activity accepts a response`);
    assert.ok(html.includes(`page ${page}`), `${file}: cites page ${page} for ${id}`);
  }
}

// Activities that must stay excluded from Writing on the book pages.
const g3wb = read('grade3-unit1-lesson5-workbook.html');
assert.ok(!/wb4-line[123]/.test(g3wb), 'the invented Grade 3 Workbook Exercise 4 fields are gone');
assert.ok(g3wb.includes('prints <strong>no answer lines</strong>'), 'Grade 3 Exercise 4 discloses that it has no writing space');
assert.equal((g3wb.match(/type="text"/g) || []).length, 7, 'Grade 3 Workbook keeps exactly its 7 genuine text fields');

const g4pb = read('grade4-unit1-lesson5-pupil-book.html');
for (const id of ['pb-2', 'pb-3', 'pb-4', 'pb-5']) {
  assert.ok(!g4pb.includes(`data-writing-activity="${id}"`), `${id}: non-writing activity is not a writing group`);
}
const g4wb = read('grade4-unit1-lesson5-workbook.html');
for (const id of ['wb-4', 'wb-6', 'wb-9', 'wb-13']) {
  assert.ok(!g4wb.includes(`data-writing-activity="${id}"`), `${id}: non-writing section is not a writing group`);
}
// The audio-dependent tick exercise keeps its disclosure and gains no invented answer.
assert.ok(g4wb.includes('the recording was not supplied'), 'Grade 4 Workbook listening disclosure kept');

// ---- 3. Responsiveness, models and resets -----------------------------------
const js = read('lesson5-writing-practice.js');
assert.ok(js.includes('event.preventDefault()'), 'reset runs synchronously');
assert.ok(js.includes("efc_writing_${file.replace('.html', '')}_v1:"), 'per-activity storage key');
assert.ok(js.includes('efc_grade3_unit1_lesson5_practice_v1:'), 'Grade 3 legacy draft migration');
assert.ok(js.includes('efc_grade4_unit1_lesson5:practice:'), 'Grade 4 legacy draft migration');
assert.ok(js.includes('Browser storage is unavailable'), 'storage failure is disclosed honestly');
assert.ok(!/check-practice|marked|score/i.test(js), 'the writing layer introduces no autograding');
for (const file of Object.keys(inventory)) {
  assert.ok(!/-test\.html$/.test(file));
}
// A teacher-only key must not be copied onto a book page.
const test = read('grade4-unit1-lesson5-test.html');
assert.ok(test.includes('id="teacher-gate"'), 'teacher key stays on the test page');
for (const file of Object.keys(inventory)) {
  assert.ok(!read(file).includes('teacher-key'), `${file}: no teacher-only key on a book page`);
}

// ---- 4. Documentation records ------------------------------------------------
const record = JSON.parse(read('docs/english-curriculum-audit/writing-readiness.json'));
for (const [slug, count, exceptions] of [
  ['grade3-unit1-lesson5', 3, 2],
  ['grade4-unit1-lesson5', 15, 4]
]) {
  const audit = record.audited[slug];
  assert.ok(audit, `${slug}: audit record`);
  assert.equal(audit.activityCount, count, `${slug}: activity count`);
  assert.equal(audit.exceptions.length, exceptions, `${slug}: exception count`);
  assert.ok(fs.existsSync(audit.inventory), `${slug}: inventory exists`);
}
for (const doc of ['docs/grade3-unit1-lesson5/writing-inventory.md', 'docs/grade4-unit1-lesson5/writing-inventory.md',
  'docs/english-curriculum-audit/writing-batch5.md', 'docs/english-curriculum-audit/writing-readiness.md']) {
  assert.ok(fs.existsSync(doc), `${doc} exists`);
}

console.log(`lesson5-writing static checks passed: 18 writing activities across 4 book pages, `
  + '17 byte-identical scans, 6 documented exceptions.');
