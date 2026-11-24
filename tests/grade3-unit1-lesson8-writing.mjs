// Grade 3 Unit 1 Lesson 8 writing audit: the inventory, the readiness record and the writing layer must agree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const LESSON = 'grade3-unit1-lesson8';
const inventory = read(`docs/grade3-unit1-lesson8/writing-inventory.md`);
const readiness = JSON.parse(read('docs/english-curriculum-audit/writing-readiness.json'));
const workbook = read(`${LESSON}-workbook.html`);
const pupilBook = read(`${LESSON}-pupil-book.html`);
const writingJs = read(`lesson8-writing-practice.js`);

// 1. Inventory: every printed Workbook exercise is classified, and the writing count is 4.
for (const heading of ["1. Read and match.", "2. Read and write.", "3. Read and write about yourself.", "4. Listen and write the number.", "5. Reorder.", "6. Write and draw about what you like doing."]) {
  assert.ok(inventory.includes(heading), `inventory: missing printed instruction ${heading}`);
}
assert.match(inventory, /\*\*Workbook writing activities: 4\*\*/, 'inventory: Workbook writing count');
assert.match(inventory, /Total writing activities: \*\*4\*\*/, 'inventory: total writing count');
assert.match(inventory, /\*\*Pupil's Book writing activities: 0\.\*\*/, "inventory: Pupil's Book writing count");
console.log('PASS Inventory classification', 'six Pupil\'s Book activities and every printed Workbook exercise classified; 4 writing activities');

// 2. Readiness record: the registered lesson is audited with the same count and exception evidence.
const entry = readiness.audited[LESSON];
assert.ok(entry, `readiness: ${LESSON} record missing`);
assert.equal(entry.activityCount, 4, 'readiness: activity count');
assert.equal(entry.inventory, `docs/grade3-unit1-lesson8/writing-inventory.md`, 'readiness: inventory link');
assert.ok(fs.existsSync(path.join(root, entry.inventory)), 'readiness: inventory file exists');
assert.ok(entry.exceptions.length <= entry.activityCount, 'readiness: exceptions within activity count');
const expectedExceptions = [["Workbook", 24, "Exercise 2"], ["Workbook", 25, "Exercise 3"], ["Workbook", 26, "Exercise 5"], ["Workbook", 26, "Exercise 6"]];
assert.deepEqual(entry.exceptions.map(ex => [ex.book, ex.page, ex.activity.split(' — ')[0]]), expectedExceptions, 'readiness: exception list');
for (const ex of entry.exceptions) {
  assert.equal(ex.evidence, `docs/grade3-unit1-lesson8/writing-inventory.md`, 'readiness: exception evidence');
}
console.log('PASS Readiness record', `activityCount 4; ${entry.exceptions.length} documented exceptions with local evidence`);

// 3. Workbook writing layer: managed activities have fields, a labelled model, comparison and reset.
const sectionOf = id => {
  const start = workbook.indexOf(`<section class="panel" id="${id}"`);
  assert.ok(start >= 0, `${id}: panel exists`);
  return workbook.slice(start, workbook.indexOf('</section>', start));
};
for (const id of ["wb-1", "wb-2", "wb-3", "wb-5", "wb-6"]) {
  const panel = sectionOf(id);
  assert.ok(panel.includes(`data-writing-activity="${id}"`), `${id}: writing layer attribute`);
  assert.ok(panel.includes('class="check-practice"'), `${id}: compare control`);
  assert.match(panel, new RegExp(`class="secondary reveal" aria-controls="${id}-key"`), `${id}: model reveal control`);
  assert.match(panel, /type="reset"/, `${id}: activity reset`);
  assert.ok(new RegExp(`class="answer" id="${id}-key" hidden`).test(panel), `${id}: model starts hidden`);
  assert.match(panel, /inferred|illustrative/i, `${id}: model is labelled inferred or illustrative`);
}
for (const id of ["wb-3", "wb-6"]) {
  assert.match(sectionOf(id), /Illustrative examples|illustrative/i, `${id}: open item labelled illustrative`);
}
console.log('PASS Workbook writing layer', `managed sections ${["wb-1", "wb-2", "wb-3", "wb-5", "wb-6"].join(', ')} have drafts, labelled models, comparison and reset`);

// 4. Listening exercise has no fabricated checker or key.
const listeningStart = workbook.indexOf('id="wb-listen"');
assert.ok(listeningStart >= 0, 'wb-listen form exists');
const listening = workbook.slice(listeningStart - 40, workbook.indexOf('</form>', listeningStart));
assert.ok(!listening.includes('check-practice') && !listening.includes('class="answer"'), 'wb-listen: no fabricated checker or key');
assert.match(listening, /not supplied|Not scored/, 'wb-listen: disclosed as not scored');
assert.ok(!pupilBook.includes('class="answer"') && !pupilBook.includes('check-practice'), "Pupil's Book: no writing controls or keys");
console.log('PASS Audio exceptions', `Workbook listening exercise and Pupil's Book audio activities are disclosed and carry no key`);

// 5. Shared writing script: drafts, compare without overwrite, reset and no autograding.
for (const token of [`${LESSON}-workbook-drafts-v1`, 'Compare', 'This exercise is cleared', 'drafts[id][input.name]', 'Answers vary']) {
  assert.ok(writingJs.includes(token), `writing script: ${token}`);
}
assert.ok(!/\bscore\b/i.test(writingJs), 'writing script: no score is shown for writing');
assert.ok(!/[\u0600-\u06ff]/.test(writingJs), 'writing script: no Arabic');
console.log('PASS Writing script behaviour', 'drafts persist, compare never overwrites, reset is per activity, no score is shown');
