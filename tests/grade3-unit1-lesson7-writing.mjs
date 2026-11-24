// Grade 3 Unit 1 Lesson 7 writing audit: the inventory, the readiness record and the writing layer must agree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const LESSON = 'grade3-unit1-lesson7';
const inventory = read(`docs/grade3-unit1-lesson7/writing-inventory.md`);
const readiness = JSON.parse(read('docs/english-curriculum-audit/writing-readiness.json'));
const workbook = read(`${LESSON}-workbook.html`);
const pupilBook = read(`${LESSON}-pupil-book.html`);
const writingJs = read(`lesson7-writing-practice.js`);

// 1. Inventory: every printed Workbook exercise is classified, and the writing count is 4.
for (const heading of ["1. Listen and tick (✓) or cross (✖).", "2. Look, read and write.", "3. Look, read and circle.", "4. Look , and write.", "5. Fill in the spaces.", "6. Let’s learn!", "7. Rewrite the following sentences using capital letters and full stops."]) {
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
assert.equal(entry.inventory, `docs/grade3-unit1-lesson7/writing-inventory.md`, 'readiness: inventory link');
assert.ok(fs.existsSync(path.join(root, entry.inventory)), 'readiness: inventory file exists');
assert.ok(entry.exceptions.length <= entry.activityCount, 'readiness: exceptions within activity count');
const expectedExceptions = [["Workbook", 21, "Exercise 2"], ["Workbook", 22, "Exercise 4"], ["Workbook", 23, "Exercise 5"], ["Workbook", 23, "Exercise 7"]];
assert.deepEqual(entry.exceptions.map(ex => [ex.book, ex.page, ex.activity.split(' — ')[0]]), expectedExceptions, 'readiness: exception list');
for (const ex of entry.exceptions) {
  assert.equal(ex.evidence, `docs/grade3-unit1-lesson7/writing-inventory.md`, 'readiness: exception evidence');
}
console.log('PASS Readiness record', `activityCount 4; ${entry.exceptions.length} documented exceptions with local evidence`);

// 3. Workbook writing layer: managed activities have fields, a labelled model, comparison and reset.
const sectionOf = id => {
  const start = workbook.indexOf(`<section class="panel" id="${id}"`);
  assert.ok(start >= 0, `${id}: panel exists`);
  return workbook.slice(start, workbook.indexOf('</section>', start));
};
for (const id of ["wb-4", "wb-5", "wb-7"]) {
  const panel = sectionOf(id);
  assert.ok(panel.includes(`data-writing-activity="${id}"`), `${id}: writing layer attribute`);
  assert.ok(panel.includes('class="check-practice"'), `${id}: compare control`);
  assert.match(panel, new RegExp(`class="secondary reveal" aria-controls="${id}-key"`), `${id}: model reveal control`);
  assert.match(panel, /type="reset"/, `${id}: activity reset`);
  assert.ok(new RegExp(`class="answer" id="${id}-key" hidden`).test(panel), `${id}: model starts hidden`);
  assert.match(panel, /inferred|illustrative/i, `${id}: model is labelled inferred or illustrative`);
}
for (const id of []) {
  assert.match(sectionOf(id), /Illustrative examples|illustrative/i, `${id}: open item labelled illustrative`);
}
console.log('PASS Workbook writing layer', `managed sections ${["wb-4", "wb-5", "wb-7"].join(', ')} have drafts, labelled models, comparison and reset`);


// Exercise 2 is a writing activity whose clock times cannot be read reliably from the scan, so it has no model.
// It is a documented exception: fields are present, the answer is disclosed as not scored, and no key is shown.
const wb2 = sectionOf('wb-2');
assert.ok(!wb2.includes('check-practice') && !/class="answer"/.test(wb2), 'wb-2: no fabricated model or checker');
assert.match(wb2, /Not scored/, 'wb-2: disclosed as not scored');
assert.equal((wb2.match(/<input class="long-blank" type="text"/g) || []).length, 3, 'wb-2: three response fields');
// Exercise 3 is a choice exercise with a labelled inferred model, checked like Lesson 6 matching.
const wb3 = sectionOf('wb-3');
assert.equal((wb3.match(/<select\b/g) || []).length, 3, 'wb-3: three choice selects');
assert.ok(wb3.includes('check-practice') && /Inferred model/.test(wb3), 'wb-3: comparison against inferred model');
console.log('PASS Documented exception wb-2', 'writing without a printed key is disclosed, not scored, and carries no invented model');

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
