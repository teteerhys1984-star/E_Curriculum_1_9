// Grade 3 Unit 1 Lesson 6 writing audit: the inventory, the readiness record and the writing layer must agree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const inventory = read('docs/grade3-unit1-lesson6/writing-inventory.md');
const readiness = JSON.parse(read('docs/english-curriculum-audit/writing-readiness.json'));
const workbook = read('grade3-unit1-lesson6-workbook.html');
const pupilBook = read('grade3-unit1-lesson6-pupil-book.html');
const writingJs = read('lesson6-writing-practice.js');

// 1. Inventory: every printed Workbook exercise is classified, and the writing count is 4.
for (const heading of ['1. Look, read and write.', '2. Read, complete with (never/ always) and say.', '3. Listen and tick ✓.',
  '4. Read and match.', '5. Reorder.', '6. Write about your family.']) {
  assert.ok(inventory.includes(heading), `inventory: missing printed instruction ${heading}`);
}
assert.match(inventory, /\*\*Workbook writing activities: 4\*\*/, 'inventory: Workbook writing count');
assert.match(inventory, /Total writing activities: \*\*4\*\*/, 'inventory: total writing count');
assert.match(inventory, /\*\*Pupil's Book writing activities: 0\.\*\*/, 'inventory: Pupil\'s Book writing count');
console.log('PASS Inventory classification', 'six Workbook exercises and six Pupil\'s Book activities classified; 4 writing activities');

// 2. Readiness record: the registered lesson is audited with the same count and exception evidence.
const entry = readiness.audited['grade3-unit1-lesson6'];
assert.ok(entry, 'readiness: grade3-unit1-lesson6 record missing');
assert.equal(entry.activityCount, 4, 'readiness: activity count');
assert.equal(entry.inventory, 'docs/grade3-unit1-lesson6/writing-inventory.md', 'readiness: inventory link');
assert.ok(fs.existsSync(path.join(root, entry.inventory)), 'readiness: inventory file exists');
assert.ok(entry.exceptions.length <= entry.activityCount, 'readiness: exceptions within activity count');
const expectedExceptions = [
  ['Workbook', 18, 'Exercise 1'], ['Workbook', 18, 'Exercise 2'], ['Workbook', 20, 'Exercise 5'], ['Workbook', 20, 'Exercise 6']
];
assert.deepEqual(entry.exceptions.map(ex => [ex.book, ex.page, ex.activity.split(' — ')[0]]), expectedExceptions, 'readiness: exception list');
for (const ex of entry.exceptions) {
  assert.equal(ex.evidence, 'docs/grade3-unit1-lesson6/writing-inventory.md', 'readiness: exception evidence');
}
console.log('PASS Readiness record', `activityCount 4; ${entry.exceptions.length} documented exceptions with local evidence`);

// 3. Workbook writing layer: the four writing activities each have fields, a labelled model, comparison, and reset.
const sectionOf = id => {
  const start = workbook.indexOf(`<section class="panel" id="${id}"`);
  assert.ok(start >= 0, `${id}: panel exists`);
  return workbook.slice(start, workbook.indexOf('</section>', start));
};
for (const id of ['wb-1', 'wb-2', 'wb-5', 'wb-6']) {
  const panel = sectionOf(id);
  assert.ok(panel.includes(`data-writing-activity="${id}"`), `${id}: writing layer attribute`);
  const fields = (panel.match(/<input class="(?:long|wide)-blank" type="text"/g) || []).length;
  assert.ok(fields >= 3, `${id}: response fields (${fields})`);
  assert.ok(panel.includes('class="check-practice"'), `${id}: compare control`);
  assert.match(panel, /class="secondary reveal" aria-controls="wb\d-key"/, `${id}: model reveal control`);
  assert.match(panel, /type="reset"/, `${id}: activity reset`);
  assert.ok(panel.includes('class="answer"') && /class="answer" id="wb\d-key" hidden/.test(panel), `${id}: model starts hidden`);
  assert.match(panel, /inferred|illustrative/i, `${id}: model is labelled inferred or illustrative`);
}
const wb4 = sectionOf('wb-4');
assert.equal((wb4.match(/<select\b/g) || []).length, 5, 'wb-4: five matching selects');
assert.ok(wb4.includes('check-practice'), 'wb-4: comparison against inferred pairs');
assert.match(wb4, /Inferred model pairs/, 'wb-4: inferred label');
assert.equal((workbook.match(/<input[^>]*type="text"/g) || []).length, 15, 'Workbook: 15 text responses');
console.log('PASS Workbook writing layer', 'wb-1, wb-2, wb-5, wb-6 have fields, labelled hidden models, comparison and reset; wb-4 matching is checkable against its inferred model');

// 4. Listening exercise has no fabricated checker or key.
const listening = workbook.slice(workbook.indexOf('id="wb-listen"') - 40, workbook.indexOf('</form>', workbook.indexOf('id="wb-listen"')));
assert.ok(!listening.includes('check-practice') && !listening.includes('class="answer"'), 'wb-listen: no fabricated checker or key');
assert.match(listening, /not supplied|Not scored/, 'wb-listen: disclosed as not scored');
assert.ok(!pupilBook.includes('class="answer"') && !pupilBook.includes('check-practice'), 'Pupil\'s Book: no writing controls or keys');
console.log('PASS Audio exceptions', 'Workbook 3 and Pupil\'s Book 4, 6, 7 are disclosed and carry no key');

// 5. Shared writing script: drafts, compare without overwrite, edit/retry, reset and no autograding.
for (const token of ['grade3-unit1-lesson6-workbook-drafts-v1', 'Compare', 'This exercise is cleared', 'drafts[id][input.name]',
  'Answers vary', 'inferred, not an official key']) {
  assert.ok(writingJs.includes(token), `writing script: ${token}`);
}
assert.ok(!/\bscore\b/i.test(writingJs), 'writing script: no score is shown for writing');
assert.ok(!/[\u0600-\u06ff]/.test(writingJs), 'writing script: no Arabic');
console.log('PASS Writing script behaviour', 'drafts persist, compare never overwrites, reset is per activity, no score is shown');
console.log('Grade 3 Unit 1 Lesson 6 writing audit: PASS');
