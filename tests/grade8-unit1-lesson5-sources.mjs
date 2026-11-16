import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const base = 'assets/grade8-unit1-lesson5';
const hashes = [
  'd16973a2e53fc2583009a8278b73e1d9829ba33b6cb236e249b6500ac8b21516',
  '0d68ff4b222a0b11c090cad0a0e7e411170078e13afbc339b48edc9e5fbbd7ef',
  'feeffe985d2893c631d5759dc63345b9ab1b197bdffae2e6294bf84607c597b1',
  '265fd3666fa2325079d177577a3d5e6f79adb2985c3e3343b5bca9af4beabbd9',
  '3e2f987267fff0b2fbdea02123f9f0a45cd673e10dd4d20644a5bbc3f75cba9e',
  '3048f3da5c79131b5b9e324fdb11827ba904f902b94eebae1603e6ae1174c286',
  'afc9032820a949f962fff89ae3a9202ab4cd5f899f0051c6fa9b54bb6a864b65',
  'b2856a451ca7a15b77abfe26be498dce9e3a01b819f8e42894891f47df8c3b5b',
  'f357d94cf9b07fb86958902c0232e575f3a80b7d737efa517bace404a2fce611',
  '208bfada5164eb0310145621e06e359dad894f04278435800a902e66d4962d6f'
];
const entries = JSON.parse(readFileSync(`${base}/source-manifest.json`, 'utf8'));
assert.equal(entries.length, 10);
const checksums = [];
for (const [index, entry] of entries.entries()) {
  const n = index + 1;
  const student = n <= 6;
  const page = student ? 33 + n : 11 + n;
  const file = `${base}/source/${student ? 'student-book' : 'workbook'}-page-${page}.png`;
  assert.equal(entry.upload, `image-${n}.png`);
  assert.equal(entry.book, student ? 'Student’s Book' : 'Workbook');
  assert.equal(entry.page, page);
  assert.equal(entry.file, file);
  const data = readFileSync(file);
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(data.readUInt32BE(16), entry.width);
  assert.equal(data.readUInt32BE(20), entry.height);
  assert.equal(data.length, entry.bytes);
  const hash = createHash('sha256').update(data).digest('hex');
  assert.equal(hash, hashes[index]);
  assert.equal(entry.sha256, hash);
  checksums.push(`${hash}  ${file}`);
}
assert.equal(readFileSync(`${base}/source-sha256.txt`, 'utf8'), checksums.join('\n') + '\n');
assert.deepEqual(readdirSync(`${base}/source`).sort(), entries.map(e => e.file.split('/').at(-1)).sort());
console.log('PASS Grade 8 Lesson 5 source allocation, dimensions, hashes and inventory (10 originals)');
