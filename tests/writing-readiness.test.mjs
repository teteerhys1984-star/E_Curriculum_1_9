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
  assert.equal(states.find(s => s.slug === 'grade3-unit1-lesson7').state, 'Writing audited with documented exceptions');
  assert.equal(states.find(s => s.slug === 'grade3-unit1-lesson8').state, 'Writing audited with documented exceptions');
  assert.equal(states.find(s => s.slug === 'grade5-unit1-lesson8').state, 'Writing audited with documented exceptions');
  assert.equal(states.find(s => s.slug === 'grade5-unit1-lesson9').state, 'Writing audited with documented exceptions');
  assert.ok(states.filter(s => !Object.hasOwn(data.audited, s.slug)).every(s => s.state === 'Writing not yet audited'));
});

test('the fifty-nine documented exceptions cannot silently disappear or be combined', () => {
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
    'grade3-unit1-lesson6|Workbook|20|Exercise 6 — Write about your family, items 2–4',
    'grade3-unit1-lesson7|Workbook|21|Exercise 2 — Look, read and write',
    'grade3-unit1-lesson7|Workbook|22|Exercise 4 — Look , and write',
    'grade3-unit1-lesson7|Workbook|23|Exercise 5 — Fill in the spaces',
    'grade3-unit1-lesson7|Workbook|23|Exercise 7 — Rewrite the following sentences using capital letters and full stops',
    'grade3-unit1-lesson8|Workbook|24|Exercise 2 — Read and write',
    'grade3-unit1-lesson8|Workbook|25|Exercise 3 — Read and write about yourself',
    'grade3-unit1-lesson8|Workbook|26|Exercise 5 — Reorder',
    'grade3-unit1-lesson8|Workbook|26|Exercise 6 — Write and draw about what you like doing',
    "grade4-unit1-lesson7|Pupil's Book|26|Exercise 7 — Reorder these sentences",
    "grade4-unit1-lesson7|Pupil's Book|26|Exercise 8 — Complete these sentences about hobbies, items 2–4",
    'grade4-unit1-lesson7|Workbook|25|Exercise 1b — Fill in the spaces',
    'grade4-unit1-lesson7|Workbook|26|Exercise 5 — Ask and answer',
    'grade4-unit1-lesson7|Workbook|27|Exercise 6 — Look at the pictures and practise',
    'grade4-unit1-lesson7|Workbook|27|Exercise 7 — Write sentences',
    'grade4-unit1-lesson7|Workbook|27|Exercise 8 — Complete the sentences',
    "grade4-unit1-lesson8|Pupil's Book|29|Exercise 7a — Look and fill in the spaces",
    "grade4-unit1-lesson8|Pupil's Book|29|Exercise 7b — Look and complete",
    'grade4-unit1-lesson8|Workbook|28|Exercise 1 — Read and write the numbers',
    'grade4-unit1-lesson8|Workbook|28|Exercise 3 — Complete',
    'grade4-unit1-lesson8|Workbook|29|Exercise 4 — Fill in the spaces',
    'grade4-unit1-lesson8|Workbook|30|Exercise 6 — Listen, look and write the number',
    'grade4-unit1-lesson8|Workbook|30|Exercise 7 — Ask and answer according to the map',
    'grade4-unit1-lesson8|Workbook|30|Exercise 8 — Now draw a picture of your town and write sentences about it',
    "grade5-unit1-lesson8|Pupil's Book|27|Activity 1 a — Listen and number",
    "grade5-unit1-lesson8|Pupil's Book|27|Activity 1 b — Listen again and match the inventor to the invention or discovery",
    "grade5-unit1-lesson8|Pupil's Book|27|Pronunciation — u:",
    "grade5-unit1-lesson8|Pupil's Book|28|Activity 3 — Ask and answer",
    "grade5-unit1-lesson8|Pupil's Book|29|Activity 7 — Write three sentences in the past simple",
    "grade5-unit1-lesson8|Pupil's Book|29|Activity 8 — Write about your invention",
    'grade5-unit1-lesson8|Workbook|28|Exercise 1 — Write the number next to the picture',
    'grade5-unit1-lesson8|Workbook|29|Exercise 6 — Listen and tick the invention',
    'grade5-unit1-lesson8|Workbook|30|Exercise 9 — Write about your favourite invention',
    "grade5-unit1-lesson9|Pupil's Book|30|Activity 1 — Listen and choose the speaker",
    "grade5-unit1-lesson9|Pupil's Book|30|Pronunciation — æ and ɑː",
    "grade5-unit1-lesson9|Pupil's Book|31|Activity 4 — Look at the picture and say what they are going to do",
    "grade5-unit1-lesson9|Pupil's Book|32|Activity 8 — Look and write, items 2–4",
    "grade5-unit1-lesson9|Pupil's Book|32|Activity 10 — Complete",
    'grade5-unit1-lesson9|Workbook|31|Exercise 1 — Correct the mistake then match',
    'grade5-unit1-lesson9|Workbook|32|Exercise 3 — Listen and number',
    'grade5-unit1-lesson9|Workbook|32|Exercise 4 — Listen and choose',
    'grade5-unit1-lesson9|Workbook|32|Exercise 7 — Listen and classify'
  ]);
  assert.equal(run(data).reduce((n, s) => n + s.exceptions, 0), 59);
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
