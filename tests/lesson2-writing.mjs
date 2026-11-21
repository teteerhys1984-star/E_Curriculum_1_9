import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

// The twelve user-supplied originals for this batch, mapped to the preserved
// repository scans through the lesson source manifests. Every scan must stay
// byte-for-byte unchanged.
const lessonManifests = [
  'assets/grade3-unit1-lesson2/source-manifest.json',
  'assets/grade4-unit1-lesson2/source-manifest.json'
];
// Required batch order: images 1-3 G3 Pupil's Book, 4-6 G3 Workbook,
// 7-9 G4 Pupil's Book, 10-12 G4 Workbook.
const expectedScanOrder = {
  'assets/grade3-unit1-lesson2/source-manifest.json': [
    'pupil-book-page-6.png', 'pupil-book-page-7.png', 'pupil-book-page-8.png',
    'workbook-page-6.png', 'workbook-page-7.png', 'workbook-page-8.png'
  ],
  'assets/grade4-unit1-lesson2/source-manifest.json': [
    'pupil-book-page-6.png', 'pupil-book-page-7.png', 'pupil-book-page-8.png',
    'workbook-page-8.png', 'workbook-page-9.png', 'workbook-page-10.png'
  ]
};
// Each manifest numbers its own upload batch 1-6; the Grade 4 batch is the
// task's images 7-12 (Grade 4 Pupil's Book 7-9, Grade 4 Workbook 10-12).
const uploadIndices = {
  'assets/grade3-unit1-lesson2/source-manifest.json': [1, 2, 3, 4, 5, 6],
  'assets/grade4-unit1-lesson2/source-manifest.json': [1, 2, 3, 4, 5, 6]
};
for (const manifestPath of lessonManifests) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.length, 6, manifestPath);
  manifest.forEach((item, index) => {
    assert.ok(item.file && item.sha256, `${manifestPath}: every entry names a file and a hash`);
    const bytes = fs.readFileSync(item.file);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, `Original changed: ${item.file}`);
    assert.ok(item.file.endsWith(expectedScanOrder[manifestPath][index]), `${manifestPath}: upload ${index + 1} scan order`);
    const upload = item.uploadIndex != null ? item.uploadIndex : Number(String(item.source).replace(/^image-(\d+)\.png$/, '$1'));
    assert.equal(upload, uploadIndices[manifestPath][index], `${manifestPath}: upload index`);
  });
}

for (const file of ['grade3-unit1-lesson2-workbook.html', 'grade4-unit1-lesson2-pupil-book.html', 'grade4-unit1-lesson2-workbook.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<script src="lesson2-writing-practice\.js" defer><\/script>/, `${file}: writing practice wired in`);
  assert.ok(!/id="(?:teacher-gate|teacher-key|answer-guide)"/.test(html), `${file} must not include the test teacher key`);
}
const code = fs.readFileSync('lesson2-writing-practice.js', 'utf8');
assert.ok(!/teacher-password|unlock-solutions|answer-guide/.test(code), 'practice does not copy teacher-only keys');
console.log('PASS lesson 2 Writing source mapping and unchanged upload hashes');
