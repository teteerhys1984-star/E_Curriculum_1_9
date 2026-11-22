import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

// Every scan for this batch must stay byte-for-byte unchanged.
const g3Manifest = JSON.parse(fs.readFileSync('assets/grade3-unit1-lesson4/source-manifest.json', 'utf8'));
const g4Manifest = JSON.parse(fs.readFileSync('assets/grade4-unit1-lesson4/source-manifest.json', 'utf8'));

const g3Expected = [
  'pupil-book-page-12.png', 'pupil-book-page-13.png', 'pupil-book-page-14.png',
  'workbook-page-12.png', 'workbook-page-13.png', 'workbook-page-14.png'
];
const g4Expected = [
  'pupil-book-page-12.png', 'pupil-book-page-13.png', 'pupil-book-page-14.png',
  'workbook-page-14.png', 'workbook-page-15.png', 'workbook-page-16.png'
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

for (const image of g4Manifest.images) {
  const book = image.book === 'pupil-book' ? 'pupil-book' : 'workbook';
  assert.ok(image.file.includes(`${book}-page-${image.sourcePage}.png`), `${image.file}: printed page number matches the manifest`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(image.file)).digest('hex'), image.sha256, `${image.file}: original changed`);
  assert.equal(fs.statSync(image.file).size, image.bytes, `${image.file}: byte count matches the manifest`);
}

// Genuine written-production activities, recorded per book and printed page.
const inventory = {
  'grade3-unit1-lesson4-workbook.html': [
    ['wb-1', 'Workbook', 12, 5],
    ['wb-2', 'Workbook', 12, 5],
    ['wb-5', 'Workbook', 14, 9],
    ['wb-6', 'Workbook', 14, 3]
  ],
  'grade4-unit1-lesson4-pupil-book.html': [
    ['pb-1', "Pupil's Book", 12, 8],
    ['pb-3', "Pupil's Book", 12, 1],
    ['pb-6', "Pupil's Book", 13, 2],
    ['pb-9', "Pupil's Book", 14, 4],
    ['pb-10', "Pupil's Book", 14, 2],
    ['pb-11', "Pupil's Book", 14, 3]
  ],
  'grade4-unit1-lesson4-workbook.html': [
    ['wb-2', 'Workbook', 14, 3],
    ['wb-3', 'Workbook', 14, 6],
    ['wb-6', 'Workbook', 15, 5],
    ['wb-8', 'Workbook', 16, 4],
    ['wb-9', 'Workbook', 16, 3]
  ]
};

for (const [file, items] of Object.entries(inventory)) {
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('lesson4-writing-practice.js'), `${file}: loads lesson4-writing-practice.js`);
  for (const [id, , page] of items) {
    assert.ok(html.includes(`id="${id}"`), `${file}: contains section #${id}`);
    assert.ok(html.includes(`Page ${page}`), `${file}: cites Page ${page}`);
  }
}

const g3Pb = fs.readFileSync('grade3-unit1-lesson4-pupil-book.html', 'utf8');
assert.ok(!g3Pb.includes('lesson4-writing-practice.js'), 'Grade 3 Pupil Book has 0 writing activities and does not load writing layer');

const js = fs.readFileSync('lesson4-writing-practice.js', 'utf8');
assert.ok(js.includes('event.preventDefault()'), 'lesson4-writing-practice.js uses synchronous reset');

console.log('lesson4-writing static checks passed.');
