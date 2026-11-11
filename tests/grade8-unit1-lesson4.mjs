import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'grade8-unit1-lesson4';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = JSON.parse(read(`assets/${slug}/source-manifest.json`));
const crops = JSON.parse(read(`assets/${slug}/crops-manifest.json`)).crops;
const fixture = JSON.parse(read(`tests/${slug}-fixture.json`));

// 1. Eleven originals, byte-for-byte, in the required book order.
assert.equal(source.length, 11);
assert.deepEqual(source.map(s => s.upload), Array.from({length: 11}, (_, i) => `image-${i + 1}.png`));
assert.deepEqual(source.map(s => s.page), [26,27,28,29,30,31,32,14,15,16,17]);
assert.deepEqual(source.map(s => s.book), [
  'Student’s Book','Student’s Book','Student’s Book','Student’s Book','Student’s Book','Student’s Book','Student’s Book',
  'Workbook','Workbook','Workbook','Workbook'
]);
for (const item of source) {
  const data = fs.readFileSync(path.join(root, item.file));
  assert.equal(data.length, item.bytes, item.file);
  assert.equal(sha(data), item.sha256, item.file);
  assert.equal(data.readUInt32BE(16), item.width, item.file);
  assert.equal(data.readUInt32BE(20), item.height, item.file);
}

// 2. Fifteen crops, pinned to their unchanged source page and decoded pixel-for-pixel.
assert.equal(crops.length, 15);
let canConvert = true;
try { execFileSync('convert', ['-version'], {stdio:'ignore'}); } catch { canConvert = false; }
for (const crop of crops) {
  const file = crop.file.startsWith('assets') ? crop.file : `assets/${slug}/${crop.file}`;
  const data = fs.readFileSync(path.join(root, file));
  assert.equal(data.length, crop.bytes, file);
  assert.equal(sha(data), crop.sha256, file);
  assert.equal(sha(fs.readFileSync(path.join(root, crop.source))), crop.sourceSha256, `${file}: source page`);
  if (canConvert) {
    const {width,height,x,y} = crop.crop;
    const recut = execFileSync('convert', [path.join(root,crop.source), '-crop', `${width}x${height}+${x}+${y}`, '+repage', '-depth','8','rgb:-']);
    const actual = execFileSync('convert', [path.join(root,file), '-depth','8','rgb:-']);
    assert.deepEqual(actual, recut, `${file}: decoded source rectangle must match`);
  }
}

// 3. Five pages, shared shell, mutual links.
const pages = ['','-pupil-book','-workbook','-vocabulary','-test'].map(s => `${slug}${s}.html`);
for (const file of pages) {
  const html = read(file);
  assert.match(html, /<html lang="en" dir="ltr">/, file);
  assert.match(html, /<main class="wrap">/, file);
  assert.ok(html.includes('design-system.css') && html.includes('platform-shell.js') && html.includes('lesson-accessibility.js'), file);
  assert.ok(html.includes(`data-lesson-nav="${slug}"`), `${file}: lesson nav hook`);
  if (file !== pages[0]) assert.ok(html.includes('lesson-content-navigation.js'), file);
  for (const target of pages) assert.ok(html.includes(`href="${target}"`), `${file}: link to ${target}`);
}
const all = pages.map(read).join('\n');
const pb = read(pages[1]), wb = read(pages[2]), vocab = read(pages[3]), test = read(pages[4]);

// 4. Book separation: no Student's Book page leaks a Workbook scan and vice versa.
assert.ok(!pb.includes('workbook-page-'), 'Student’s Book must not embed Workbook scans');
assert.ok(!wb.includes('student-book-page-'), 'Workbook must not embed Student’s Book scans');

// 5. Every fixture transcription string is present verbatim in the pages.
const decode = text => text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&ldquo;/g,'“').replace(/&rdquo;/g,'”');
for (const [id, text] of Object.entries(fixture.sourceTexts)) {
  const match = all.match(new RegExp(`data-source="${id}"[^>]*>([^<]*)<`));
  assert.ok(match, `missing source text ${id}`);
  assert.equal(decode(match[1]), decode(text), id);
}

// 6. Workbook content corrected against images 8–11 is the printed wording.
for (const phrase of [
  'Have you ever had a good holiday?', 'Where did you go?', 'What did you visit?', 'Who did you go with?',
  'Read the following text and do the tasks below.', 'Focus on Two Cities',
  'Alhambra Palace is an ancient fortress and citadel located in Granada',
  'Yaleton is a wonderful neighborhood',
  'Where is Sandra from?', 'Why is Sandra going to visit Granada?', 'How old is Alhambra Palace?',
  'Is Yaleton an entertaining place? Why?',
  'Alhambra Palace is a modern building.', 'Alhambra Palace was named for its reddish doors.',
  'In Granada, you can go skiing and swimming on the same day.',
  'It takes a long time to travel between Yaleton and Vancouver.',
  'Match the follwing words with their definitions .',
  'a-to move on snow or water for sport', 'b-a small shop that sells clothes or other objects',
  'c-a place that is protected against attacks', 'd-castle', 'e-a nearby area of a town or city',
  'Complete with the past perfect tense.', 'Write the sentences in reported speech.',
  'Read the dialogue. Then complete the paragraph using reported speech.',
  'I’ve never been here before, and someone stole my purse this morning.',
  'Listen to Carl talking to Lucy about his vacation, then do the tasks.',
  'Write an invitation to your friends including a plan for one week holiday.',
  'Linking words and phrases show how a sentence or paragraph relates to the previous one.'
]) assert.ok(wb.includes(phrase), `Workbook must print: ${phrase}`);

// 7. The superseded draft wording is gone.
for (const stale of [
  'Have you ever been to a city by a sea?', 'Have you ever been to a mountainous city?',
  'I visited Spain last year', 'dominates the city from the top of a hill',
  'Where does Sandra come from?', 'What is the Alhambra?', 'Who visited Canada?',
  'Sandra comes from Spain.', 'Granada is dominated by a modern castle.',
  'Sarah visited the USA last summer.', 'Match the words with their meanings:',
  'a large strong building or group of buildings built to defend against attack',
  'How does Carl like Lucy', 'What does Carl like in Lucy?'
]) assert.ok(!all.includes(stale), `stale draft text still present: ${stale}`);

// 8. Nine-gap reported-speech paragraph, printed exactly.
const dialogueForm = wb.match(/<form[^>]*id="wb-dialogue"[\s\S]*?<\/form>/)[0];
assert.equal((dialogueForm.match(/<input\b/g) || []).length, 9, 'the printed paragraph has nine gaps');

// 9. Forms: ids, field order and checked answers all match the fixture.
for (const [fid, form] of Object.entries(fixture.forms)) {
  const found = all.match(new RegExp(`<form[^>]*id="${fid}"[\\s\\S]*?</form>`));
  assert.ok(found, fid);
  assert.ok(found[0].includes(`data-mode="${form.mode}"`), `${fid}: mode`);
  const names = [...new Set([...found[0].matchAll(/\bname="([^"]+)"/g)].map(m => m[1]))];
  assert.deepEqual(names, form.fields, `${fid}: field order`);
  for (const [itemId, answers] of Object.entries(form.checkedItems)) {
    const fieldset = found[0].match(new RegExp(`<fieldset[^>]*id="${itemId}"[^>]*>`));
    assert.ok(fieldset, `${fid}: missing checkable item ${itemId}`);
    const encoded = answers.map(a => a.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')).join('|');
    assert.ok(fieldset[0].includes(`data-practice-answer="${encoded}"`), `${fid}/${itemId}: answer fixture`);
  }
}
// No answer is attached to an audio task, an open task, or a personal response.
for (const fid of ['sb-listening','wb-listening','sb-speaking','sb-writing','sb-pastperfect','sb-pronunciation',
  'sb-story-correct','sb-story-summary','sb-climate-c','sb-geography-speaking','wb-speaking','wb-reading-a',
  'wb-reading-b','wb-grammar-c','wb-dialogue','wb-writing']) {
  assert.equal(Object.keys(fixture.forms[fid].checkedItems).length, 0, `${fid} must carry no guessed key`);
  assert.equal(fixture.forms[fid].mode === 'check', false, `${fid} must not be a scored form`);
}

// 10. Vocabulary: 15 listed items, 114 additional items, every row translated, totals reconcile.
const listed = vocab.split('id="vocab-additional-step"')[0];
const listedRows = (listed.match(/<td class="ar" lang="ar" dir="rtl">/g) || []).length;
const additional = vocab.split('id="vocab-additional-step"')[1].split('id="vocab-practice-step"')[0];
const groups = additional.split(/<h3>/).slice(1);
const groupCounts = groups.map(g => (g.match(/<tr><td><b>/g) || []).length);
const additionalRows = groupCounts.reduce((a, b) => a + b, 0);
assert.equal(listedRows, 15, 'textbook-listed vocabulary count');
assert.equal(additionalRows, 114, 'additional vocabulary count');
const auditCounts = [...vocab.matchAll(/<tr><td>\d+<\/td><td>[^<]+<\/td><td>[^<]*<\/td><td>(\d+) —/g)].map(m => Number(m[1]));
assert.equal(auditCounts.length, 11, 'the audit table must cover all eleven images once');
assert.equal(auditCounts.reduce((a, b) => a + b, 0), additionalRows, 'audit rows must sum to the additional items');
assert.ok(vocab.includes('(114 items)'), 'the section heading must state the real count');
// Every vocabulary row that names a word carries an Arabic cell; no row is missing one.
for (const table of vocab.split('<table>').slice(1)) {
  for (const row of table.split('<tr>').slice(1)) {
    if (!row.includes('<td><b>')) continue;
    assert.ok(row.includes('class="ar" lang="ar" dir="rtl"'), `vocabulary row without Arabic: ${row.slice(0, 120)}`);
  }
}
assert.equal((vocab.match(/class="ar" lang="ar" dir="rtl"/g) || []).length, listedRows + additionalRows,
  'every vocabulary row has exactly one Arabic meaning');
// Arabic appears only on the Vocabulary page.
for (const file of [pages[0], pages[1], pages[2], pages[4]]) assert.doesNotMatch(read(file), /[\u0600-\u06ff]/, file);

// 11. Independent test: 14 new items, objective on each, balanced key, gate outside the quiz.
const questions = [...test.matchAll(/<section class="question" id="quiz-question-(\d+)" data-objective="([^"]+)" data-correct="([^"]+)">/g)];
assert.equal(questions.length, 14, 'test item count');
assert.deepEqual(questions.map(q => Number(q[1])), Array.from({length: 14}, (_, i) => i + 1), 'question order');
for (const q of questions) assert.ok(q[2].trim().length > 0, `question ${q[1]}: objective`);
const keys = questions.map(q => q[3]);
assert.deepEqual(['a','b','c'].map(a => keys.filter(k => k === a).length), [5,4,5], 'answer positions stay balanced');
assert.equal(fixture.assessment.length, 14);
for (const [i, q] of fixture.assessment.entries()) {
  assert.equal(questions[i][2], q.objective, `question ${i+1}: objective matches the key`);
  assert.equal(questions[i][3], q.answer, `question ${i+1}: keyed answer matches the fixture`);
  assert.ok([2,3].includes(q.options.length), `question ${i+1}: option count`);
  assert.ok(q.options.length > 'abc'.indexOf(q.answer), `question ${i+1}: key points at a real option`);
}
// The test reuses no textbook sentence and cites no book page or asset.
assert.ok(!test.includes(`assets/${slug}/`), 'the test must not embed book images');
for (const phrase of ['Iguazu Falls are located on the Iguazu River', 'Alhambra Palace is an ancient fortress',
  'Yaleton is a wonderful neighborhood', 'Our team had practised before they played the match']) {
  assert.ok(!test.includes(phrase), `the test must not copy book sentences: ${phrase}`);
}
// Gate and key sit outside the pupil form, and the key lists all fourteen items.
const quizForm = test.match(/<form id="quiz"[\s\S]*?<\/form>/)[0];
assert.ok(test.indexOf('id="teacher-gate"') > test.indexOf('</form>'), 'gate outside the quiz form');
assert.ok(!quizForm.includes('id="answer-key"'), 'answer key outside the pupil form');
assert.ok(!quizForm.includes('teacher-key'), 'answer key list outside the pupil form');
const keyItems = [...test.matchAll(/<li><b>([^<]+):<\/b>/g)].map(m => m[1]);
assert.equal(keyItems.length, 14, 'teacher key lists all fourteen items');
assert.deepEqual([...new Set(keyItems)].sort(), ['Linking words','Past perfect','Pronunciation','Reading','Reported speech','Vocabulary']);
assert.match(test, /not textbook questions/, 'the test must say it is not a textbook test');
assert.match(test, /not authentication/, 'the gate disclosure must be present');

// 12. Discoverability: registry, listings, teacher matrix and counts.
const shell = read('platform-shell.js');
assert.ok(shell.includes(`'${slug}': { grade: 8, unit: 1, lesson: 4, title: 'Interesting Destinations'`), 'platform-shell registry');
const lessons = read('lessons.html');
assert.ok(lessons.includes('preparedCounts = { 3: 5, 4: 2, 5: 5, 8: 4 }'), 'lessons.html prepared count for Grade 8');
assert.ok(lessons.includes(`href="${slug}.html"`), 'lessons.html Grade 8 Lesson 4 entry');
const home = read('index.html');
assert.ok(home.includes(`href="${slug}.html"`), 'index.html directory entry');
assert.ok(home.includes('18 verified lessons · 90 pages'), 'index.html totals');
assert.ok(home.includes('<span class="badge badge-available">4 lessons ready</span>'), 'index.html Grade 8 badge');
const teachers = read('teacher-resources.html');
assert.ok(teachers.includes('18 lessons · 90 pages'), 'teacher-resources totals');
assert.ok(teachers.includes(`href="${slug}-test.html#teacher-gate"`), 'teacher-resources key deep-link');
const matrixRow = teachers.match(new RegExp(`<th scope="row">8 · 4 Interesting Destinations</th>([\\s\\S]*?)</tr>`));
assert.ok(matrixRow, 'teacher-resources matrix row for Lesson 4');
const cells = [...matrixRow[1].matchAll(/<td>([^<]*)<\/td>/g)].map(m => m[1]);
assert.deepEqual(cells, ['14','Published (deep-linked gate)','16','8','None'], 'matrix row counts must equal the pages');
const countReveals = file => (read(file).match(/<button[^>]*(?:data-answer=|data-a=|data-reveal=|class="[^"]*\breveal\b|onclick="document\.getElementById)/g) || []).length;
assert.equal(cells[2], String(countReveals(pages[1])), 'Student’s Book reveal count');
assert.equal(cells[3], String(countReveals(pages[2])), 'Workbook reveal count');

console.log(`PASS Grade 8 Lesson 4: 11 pinned originals (7 Student’s Book + 4 Workbook), 15 crops${canConvert ? ' with decoded pixel comparisons' : ' (ImageMagick unavailable: pixel comparison skipped)'}, ${Object.keys(fixture.sourceTexts).length} transcription strings, 27 activity forms with ${Object.values(fixture.forms).reduce((n, f) => n + Object.keys(f.checkedItems).length, 0)} checked items, 15 + 114 vocabulary rows with Arabic, and 14 independent assessment items`);
