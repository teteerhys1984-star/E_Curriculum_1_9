import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = 'docs/grade8-unit1-lesson5-draft/grade8-unit1-lesson5';
for (const suffix of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) {
  const html = fs.readFileSync(`${base}${suffix}.html`, 'utf8');
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.match(html, /This lesson is under development/);
  assert.match(html, /design-system\.css/);
}
for (const suffix of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) {
  const html = fs.readFileSync(`grade8-unit1-lesson5${suffix}.html`, 'utf8');
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.doesNotMatch(html, /This lesson is under development/);
  for (const section of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) assert.ok(html.includes(`grade8-unit1-lesson5${section}.html`));
}
const words = JSON.parse(fs.readFileSync('assets/grade8-unit1-lesson5/vocabulary-audit.json', 'utf8'));
assert.equal(words.filter(x => x.kind === 'printed').length, 49);
assert.equal(words.filter(x => x.kind === 'additional').length, 120);
assert.equal(new Set(words.map(x => x.english.toLowerCase())).size, words.length);
assert.ok(words.every(x => x.english && x.arabic && x.source && /[\u0600-\u06ff]/.test(x.arabic)));
const test = fs.readFileSync(`${base}-test.html`, 'utf8');
assert.equal((test.match(/class="question"/g) || []).length, 12);
assert.match(test, /id="answer-key" hidden/);
console.log('PASS draft structure: 5 draft pages, 169 nonduplicate glossary entries with Arabic, 12 candidate questions');
console.log('NOTE: these checks do not establish source completeness or answer correctness.');
