import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrySlugs, writingReadiness } from './writing-readiness.mjs';

const slugs = registrySlugs(fs.readFileSync('platform-shell.js', 'utf8'));
const data = JSON.parse(fs.readFileSync('docs/english-curriculum-audit/writing-readiness.json', 'utf8'));
const run = value => writingReadiness(slugs, value, file => fs.existsSync(file));
const clone = () => structuredClone(data);

test('every registered lesson has a Writing state; unrecorded lessons are not audited', () => {
  const states = run(data);
  assert.equal(states.length, slugs.length);
  assert.equal(states.find(s => s.slug === 'grade3-unit1-lesson1').state, 'Writing audited');
  assert.equal(states.find(s => s.slug === 'grade4-unit1-lesson1').state, 'Writing audited with documented exceptions');
  assert.equal(states.find(s => s.slug === 'grade3-unit1-lesson5').state, 'Writing audited with documented exceptions');
  assert.equal(states.find(s => s.slug === 'grade4-unit1-lesson5').state, 'Writing audited with documented exceptions');
  assert.equal(states.find(s => s.slug === 'grade3-unit1-lesson6').state, 'Writing audited with documented exceptions');
  assert.ok(states.filter(s => !Object.hasOwn(data.audited, s.slug)).every(s => s.state === 'Writing not yet audited'));
});

test('the eighteen documented exceptions cannot silently disappear or be combined', () => {
  const found = Object.entries(data.audited).flatMap(([slug, audit]) => audit.exceptions.map(e => `${slug}|${e.book}|${e.page}|${e.activity}`));
  assert.deepEqual(found, [
    "grade4-unit1-lesson1|Pupil's Book|3|Exercise 1 — Listen and number",
    "grade4-unit1-lesson1|Pupil's Book|3|Exercise 2 — Listen again and order",
    'grade4-unit1-lesson1|Workbook|6|Exercise 5 — Listen and write the number',
    'grade4-unit1-lesson1|Workbook|7|Exercise 8 — Write the correct form',
    "grade4-unit1-lesson2|Pupil's Book|6|Activity 3 — Look and describe",
    'grade4-unit1-lesson2|Workbook|9|Exercise 4 — Listen and match',
    'grade3-unit1-lesson3|Workbook|9|Exercise 2 — Listen and number',
    "grade4-unit1-lesson4|Pupil's Book|12|Exercise 1 — Listen and number",
    "grade3-unit1-lesson5|Pupil's Book|16|Activity 2 — Listen then complete the table",
    'grade3-unit1-lesson5|Workbook|17|Exercise 6 — Look, match then write',
    "grade4-unit1-lesson5|Pupil's Book|15|Exercise 1 — Listen and number",
    "grade4-unit1-lesson5|Pupil's Book|18|Revision 1 Exercise 2 — Read and correct the underlined mistakes, item 5",
    'grade4-unit1-lesson5|Workbook|18|Exercise 5 — Complete, items 2 and 3',
    'grade4-unit1-lesson5|Workbook|19|Exercise 9 — Write about your favourite subject',
    'grade3-unit1-lesson6|Workbook|18|Exercise 1 — Look, read and write',
    'grade3-unit1-lesson6|Workbook|18|Exercise 2 — Read, complete with never/always and say',
    'grade3-unit1-lesson6|Workbook|20|Exercise 5 — Reorder',
    'grade3-unit1-lesson6|Workbook|20|Exercise 6 — Write about your family, items 2–4'
  ]);
  assert.equal(run(data).reduce((n, s) => n + s.exceptions, 0), 18);
});

test('invalid, duplicate, undocumented and unregistered records are rejected', () => {
  let bad = clone(); bad.audited['grade4-unit1-lesson1'].exceptions[0].reason = ''; assert.throws(() => run(bad), /reason/);
  bad = clone(); bad.audited['grade4-unit1-lesson1'].exceptions[0].handling = ' '; assert.throws(() => run(bad), /handling/);
  bad = clone(); bad.audited['grade4-unit1-lesson1'].exceptions[0].evidence = 'missing.md'; assert.throws(() => run(bad), /evidence/);
  bad = clone(); bad.audited['grade4-unit1-lesson1'].exceptions.push(bad.audited['grade4-unit1-lesson1'].exceptions[0]); assert.throws(() => run(bad), /duplicate exception/);
  bad = clone(); bad.audited['grade4-unit1-lesson1'].activityCount = 1; assert.throws(() => run(bad), /invalid exceptions/);
  bad = clone(); bad.audited['grade9-unit1-lesson1'] = bad.audited['grade3-unit1-lesson1']; assert.throws(() => run(bad), /not for a registered lesson/);
  bad = clone(); bad.audited['grade3-unit1-lesson1'].inventory = 'missing.md'; assert.throws(() => run(bad), /inventory evidence/);
  bad = clone(); delete bad.audited['grade3-unit1-lesson1'].exceptions; assert.throws(() => run(bad), /invalid exceptions/);
});
