import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

// Exact SHA-256 values of the twelve user-supplied originals, in upload order.
const sources = [
  ['grade3', 'pupil-book', 3, 'd0f4db1b1a237515119262d12430eb22a6c692cac06b63afe55026575921be60'],
  ['grade3', 'pupil-book', 4, '67ab9fbe9a84cb8a6d8cacd0fdbcc2330143ac0f14757066b226e647ee628a05'],
  ['grade3', 'pupil-book', 5, 'd6f27fac415c1340b94f20f0c5301ffb55928747959beb215cb7d122b1eb35c1'],
  ['grade3', 'workbook', 3, '84d03f781c772d54afd803e9529796b7100a22f5f7e8a6e23e51bebd7e9b5fad'],
  ['grade3', 'workbook', 4, '7508c31cb13e437e122b3253000a9bcc0696fe648c996c97f1292f00b80620df'],
  ['grade3', 'workbook', 5, '373c97ec078a261d7dc166c6adc7e5df8ee3431e716e26cb363ccd27202cf845'],
  ['grade4', 'pupil-book', 3, 'fb2e5b4d906c2fbb3371f20d4aabb6aac5f3492e7c47dc9443b41d2b89c25a21'],
  ['grade4', 'pupil-book', 4, 'c4e4d2f914cd55184245f89f64583f5fbe4d0ab4d6da8bf67609819196594d07'],
  ['grade4', 'pupil-book', 5, '511c7955d3d5b20ef17403cf4aeb170751e2ab788d89c4adb92335b197bb3942'],
  ['grade4', 'workbook', 5, 'ea19987099c779760e1fc9bc0f1ede0df5d1c7f8b561a7dccc3806ba595e8b1d'],
  ['grade4', 'workbook', 6, 'c32dbfa49f42a4fb4e8075b81de43aa151324d14892388e63dfd823599f14df7'],
  ['grade4', 'workbook', 7, '8a061c7058b4026110b226bc9b0fd7e5674d9b636d3c6f104ea43c93b513527d']
];
for (const [grade, book, page, expected] of sources) {
  const file = `assets/${grade}-unit1-lesson1/source/${book}-page-${page}.png`;
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), expected, file);
}
for (const file of ['grade3-unit1-lesson1-workbook.html', 'grade4-unit1-lesson1-pupil-book.html', 'grade4-unit1-lesson1-workbook.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<script src="lesson1-writing-practice\.js" defer><\/script>/);
  assert.ok(!/id="(?:teacher-gate|teacher-key|answer-guide)"/.test(html), `${file} must not include the test teacher key`);
}
const code = fs.readFileSync('lesson1-writing-practice.js', 'utf8');
assert.ok(!/teacher-password|unlock-solutions|answer-guide/.test(code), 'practice does not copy teacher-only keys');
console.log('PASS lesson 1 Writing source mapping and unchanged upload hashes');
