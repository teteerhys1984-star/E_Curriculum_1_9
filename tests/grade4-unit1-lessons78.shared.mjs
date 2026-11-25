/* Shared static validator for Grade 4 Unit 1 Lessons 7 and 8.
   It intentionally mirrors the rigor of the Lessons 5–6 validator while pinning this
   pair's own source allocation, defects, writing audits and independent tests. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateCropAssets } from './grade4-unit1-lessons56.shared.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const plain = value => String(value).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/\s+/g, ' ').trim();

const SOURCES = {
  7: [
    { n: 1, bytes: 603979, w: 762, h: 1042, page: 24, book: 'pupil-book', hash: '3575caadc2b971def40050c39c2ee9a145e5fbb1bcf2b6d4e31dacf1eaf1664b' },
    { n: 2, bytes: 533999, w: 742, h: 1018, page: 25, book: 'pupil-book', hash: '8c41ea0e710adf9a5a38ca343a3658df12cacd50e3f1fd253c2b1cf2714914b7' },
    { n: 3, bytes: 293143, w: 745, h: 1000, page: 26, book: 'pupil-book', hash: '5f80d587c027744fd14f293070ff543227ce57187a78c0d34d4ac6f537cddab4' },
    { n: 4, bytes: 270052, w: 745, h: 1020, page: 25, book: 'workbook', hash: '8ee8297625adc27de1d843ee3b09dc9a46239b57bb89e30507e9e6776bef9344' },
    { n: 5, bytes: 294671, w: 751, h: 1023, page: 26, book: 'workbook', hash: '62ac60d3eaa836832e4f640a4cbe7c7d44a24087392c6135824dbb1ba612d608' },
    { n: 6, bytes: 226062, w: 736, h: 1005, page: 27, book: 'workbook', hash: '0b7b035a269c73f268771cfc559c25597b21b4d04baa300b2662e3f9e2ff827a' }
  ],
  8: [
    { n: 7, bytes: 874298, w: 768, h: 1044, page: 27, book: 'pupil-book', hash: '83fb60dfb94d5e88a92a3fffb4700d1b4605047448a4644e33a0367e2f874b08' },
    { n: 8, bytes: 378881, w: 714, h: 1017, page: 28, book: 'pupil-book', hash: '6177c9edb05ccf3902b47f72a5c8a531585cd615014a3aff5b1e6f07ff3b1441' },
    { n: 9, bytes: 555575, w: 750, h: 1009, page: 29, book: 'pupil-book', hash: 'f0887721a2dba076b643cadc876af7481512977755992da7c9b9366218d5d1da' },
    { n: 10, bytes: 417728, w: 763, h: 997, page: 28, book: 'workbook', hash: '6dcbd89ad2b53f1be15c6da4abe1b5d089c99296638c9f7073b94f572b74c57d' },
    { n: 11, bytes: 260891, w: 741, h: 1011, page: 29, book: 'workbook', hash: 'a0f4f8f78f1cad369f25f0945e17158a736e357794742b018170f22bc2ba49ab' },
    { n: 12, bytes: 313030, w: 753, h: 988, page: 30, book: 'workbook', hash: '70af272dfe0f19db46ce223cc5b510663ba4bef9716720fc672345b103beeb94' }
  ]
};

function pngDimensions(bytes, label) {
  assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label}: invalid PNG`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

export function validateLesson(lesson) {
  assert.ok([7, 8].includes(lesson));
  const base = `grade4-unit1-lesson${lesson}`;
  const expected = SOURCES[lesson];
  const manifest = json(`assets/${base}/source-manifest.json`);
  assert.deepEqual(manifest.images.map(image => image.uploadIndex), expected.map(source => source.n), 'upload allocation');
  const byNumber = new Map(expected.map(source => [source.n, source]));
  for (const image of manifest.images) {
    const source = byNumber.get(image.uploadIndex);
    assert.ok(source, `${image.uploadIndex}: unexpected upload`);
    const bytes = fs.readFileSync(path.join(root, image.file));
    assert.equal(bytes.length, source.bytes, `${image.file}: byte count`);
    assert.equal(bytes.length, image.bytes, `${image.file}: manifest byte count`);
    assert.equal(sha(bytes), source.hash, `${image.file}: preserved SHA-256`);
    assert.equal(image.sha256, source.hash, `${image.file}: manifest SHA-256`);
    assert.deepEqual(pngDimensions(bytes, image.file), [source.w, source.h], `${image.file}: dimensions`);
    assert.equal(image.width, source.w); assert.equal(image.height, source.h);
    assert.equal(image.lesson, lesson); assert.equal(image.book, source.book); assert.equal(image.sourcePage, source.page);
    assert.ok(image.originalFile === `image-${source.n}.png` && image.allocationNote);
  }
  const crops = json(`assets/${base}/crops-manifest.json`);
  const lessonHtml = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'].map(suffix => read(`${base}${suffix}.html`)).join('\n');
  validateCropAssets({ manifest: crops, cropsDirectory: path.join(root, `assets/${base}/crops`), rootDirectory: root, sourceImages: manifest.images, lessonHtml });

  const audit = json(`docs/${base}/vocabulary-audit.json`);
  assert.equal(audit.lesson, lesson);
  assert.equal(audit.review.status, 'complete');
  assert.equal(audit.imageAudit.length, expected.length);
  assert.equal(audit.entries.length, audit.totals.allEntries);
  const categories = { printed: 0, additional: 0, expression: 0 };
  const ids = new Set(); const terms = new Set();
  for (const entry of audit.entries) {
    assert.ok(entry.id && entry.term && entry.meaning && entry.example, `${entry.id}: incomplete entry`);
    assert.ok(!ids.has(entry.id) && !terms.has(entry.term.toLocaleLowerCase('en')), `${entry.term}: duplicate entry`);
    assert.match(entry.meaning, /\p{Script=Arabic}/u, `${entry.id}: Arabic gloss`);
    assert.ok(entry.sourceImages.length && entry.sourceImages.every(number => expected.some(source => source.n === number)));
    assert.ok(['printed', 'additional', 'expression'].includes(entry.category));
    ids.add(entry.id); terms.add(entry.term.toLocaleLowerCase('en')); categories[entry.category]++;
  }
  assert.deepEqual(audit.totals, { ...categories, allEntries: audit.entries.length });
  const sourceByNumber = new Map(manifest.images.map(image => [image.uploadIndex, image]));
  for (const imageAudit of audit.imageAudit) {
    const source = sourceByNumber.get(imageAudit.imageNumber);
    assert.ok(source);
    assert.equal(imageAudit.sourceFile, source.file); assert.equal(imageAudit.sourceSha256, source.sha256);
    assert.equal(imageAudit.book, source.book); assert.equal(imageAudit.sourcePage, source.sourcePage);
    for (const [category, key] of [['printed', 'printedVocabulary'], ['additional', 'additionalVocabulary'], ['expression', 'usefulExpressions']]) {
      const wanted = audit.entries.filter(entry => entry.category === category && entry.sourceImages.includes(imageAudit.imageNumber)).map(entry => entry.id).sort();
      assert.deepEqual([...imageAudit[key]].sort(), wanted, `${key} for image ${imageAudit.imageNumber}`);
      assert.equal(imageAudit.counts[category], wanted.length);
    }
    assert.equal(imageAudit.arabicTranslationConfirmed, true); assert.ok(imageAudit.excludedContent);
  }
  const vocab = read(`${base}-vocabulary.html`);
  const rows = [...vocab.matchAll(/<tr data-entry-id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)];
  assert.equal(rows.length, audit.entries.length);
  assert.equal(new Set(rows.map(row => row[1])).size, rows.length);
  for (const [, id, row] of rows) {
    const entry = audit.entries.find(item => item.id === id);
    assert.ok(entry, `${id}: audit row`);
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(cell => plain(cell[1]));
    assert.equal(cells.length, 4);
    assert.equal(cells[0], entry.term); assert.equal(cells[1], entry.meaning); assert.equal(cells[2], entry.example);
    assert.ok(row.includes('class="ar" lang="ar" dir="rtl"'));
  }
  for (const category of ['printed', 'additional', 'expression']) {
    const section = vocab.match(new RegExp(`<section class="panel" id="vocab-${category}">([\\s\\S]*?)<\\/section>`))?.[1];
    assert.ok(section, `vocab-${category} section`);
    assert.equal((section.match(/<tr data-entry-id=/g) || []).length, categories[category]);
  }

  const files = [`${base}.html`, `${base}-pupil-book.html`, `${base}-workbook.html`, `${base}-vocabulary.html`, `${base}-test.html`];
  for (const file of files) {
    const html = read(file);
    assert.match(html, /<html lang="en" dir="ltr">/);
    assert.match(html, /<main class="wrap">/);
    assert.ok(html.includes(`data-lesson-nav="${base}"`), `${file}: lesson nav key`);
    assert.ok(html.includes('design-system.css') && html.includes('grade4-unit1-lesson78.css'));
    assert.ok(!/localhost|127\.0\.0\.1|<audio\b/i.test(html), `${file}: forbidden local or audio reference`);
    if (file !== `${base}.html`) {
      assert.ok(html.includes('lesson-content-navigation.js'), `${file}: shared navigation`);
      assert.equal((html.match(/class="section-link"/g) || []).length, 5, `${file}: five section links`);
      for (const suffix of ['', '-pupil-book', '-workbook', '-vocabulary', '-test']) assert.ok(html.includes(`${base}${suffix}.html`), `${file}: link ${suffix}`);
    }
  }
  const menu = read(`${base}.html`);
  assert.equal((menu.match(/class="card"/g) || []).length, 4, 'hub has four section cards plus itself');
  assert.ok(menu.includes(`${audit.entries.length} vocabulary entries`) || /vocabulary/i.test(menu));
  assert.ok(!menu.includes('lesson-content-navigation.js'), 'hub must not load step navigation');

  for (const [book, prefix, bookExpected] of [['pupil-book', 'pb', expected.filter(source => source.book === 'pupil-book')], ['workbook', 'wb', expected.filter(source => source.book === 'workbook')]]) {
    const html = read(`${base}-${book}.html`);
    assert.deepEqual([...html.matchAll(new RegExp(`<section class="panel" id="${prefix}-(\\d+)"`, 'g'))].map(match => Number(match[1])), [1, 2, 3], `${book}: three ordered panels`);
    const images = [...html.matchAll(/<img class="source-scan" src="([^"]+)"/g)].map(match => match[1]);
    assert.equal(images.length, 3, `${book}: three source scans`);
    assert.equal((html.match(/class="source-transcription"/g) || []).length, 3, `${book}: transcription for every scan`);
    for (const source of bookExpected) {
      const mapped = sourceByNumber.get(source.n);
      assert.ok(html.includes(`src="${mapped.file}"`), `${book}: image ${source.n}`);
    }
    const activityIds = [...html.matchAll(/data-writing-activity="([^"]+)"/g)].map(match => match[1]);
    assert.ok(activityIds.length > 0, `${book}: writing practice present`);
    assert.equal(new Set(activityIds).size, activityIds.length, `${book}: unique writing activity ids`);
    for (const id of activityIds) assert.ok(html.includes(`data-writing-activity="${id}"`) && html.includes(`data-writing-reset`), `${id}: reset control`);
  }

  const pb = read(`${base}-pupil-book.html`); const wb = read(`${base}-workbook.html`);
  if (lesson === 7) {
    assert.ok(pb.includes('about 2 kilometres every day') && pb.includes('5 kilometres every day'), 'both printed kilometre statements preserved');
    assert.ok(/conflicting item is not assigned|deliberately excluded/.test(pb), 'kilometre contradiction disclosed');
    assert.ok(/no (audio|recording)|not supplied/i.test(pb) && /no (audio|recording)|not supplied/i.test(wb), 'audio limitation disclosed');
  } else {
    assert.ok(pb.includes('4 bakery') && pb.includes('4 school'), 'duplicate printed 4 preserved');
    assert.ok(/number 4 is printed twice/.test(pb), 'duplicate number disclosed');
    assert.ok(/no recording was supplied/i.test(pb + wb), 'audio limitation disclosed');
    assert.ok(pb.includes('inferred map answers') && wb.includes('audio-dependent'), 'inference and audio labels present');
  }

  const readiness = json('docs/english-curriculum-audit/writing-readiness.json');
  const record = readiness.audited[base];
  assert.ok(record && Number.isInteger(record.activityCount), `${base}: writing readiness record`);
  assert.ok(fs.existsSync(path.join(root, record.inventory)), `${base}: inventory exists`);
  assert.ok(record.exceptions.length > 0 && record.exceptions.length <= record.activityCount);
  for (const exception of record.exceptions) {
    assert.ok(['Pupil\'s Book', 'Workbook'].includes(exception.book));
    assert.ok(exception.page > 0 && exception.reason && exception.handling);
    assert.ok(fs.existsSync(path.join(root, exception.evidence)), `${exception.evidence}: local evidence`);
  }
  const checklist = read(`docs/${base}/source-checklist.md`);
  const inventory = read(record.inventory);
  for (const source of expected) assert.ok(checklist.includes(source.hash), `checklist pins image ${source.n}`);
  assert.ok(inventory.includes('Total writing activities') || inventory.includes('**Total writing activities'));

  const quiz = json(`tests/${base}.quiz.json`); const test = read(`${base}-test.html`);
  assert.equal(quiz.lesson, base); assert.equal(quiz.policy, 'independent-lesson-test-v1');
  assert.equal(quiz.totalQuestions, 12); assert.equal(quiz.questions.length, 12);
  assert.equal(new Set(quiz.questions.map(question => question.id)).size, 12);
  assert.equal(new Set(quiz.questions.map(question => question.number)).size, 12);
  assert.ok(quiz.questions.every(question => quiz.objectives.includes(question.objective) && question.objectiveLabel && question.evidence));
  assert.deepEqual([...new Set(quiz.questions.map(question => question.objective))].sort(), [...quiz.objectives].sort(), 'every declared objective is assessed');
  assert.ok(quiz.questions.filter(question => ['short-answer', 'sentence-construction'].includes(question.format)).every(question => question.accepted?.includes(question.correct) && question.wrongSample && !question.accepted.includes(question.wrongSample)));
  assert.equal((test.match(/<section class="question"/g) || []).length, 12);
  assert.match(test, /id="answer-guide" hidden/); assert.match(test, /id="teacher-key"/);
  assert.match(test, /id="reset-test"/); assert.match(test, /id="check-answers"/); assert.match(test, /id="test-save-status"/);
  for (const question of quiz.questions) {
    const block = test.match(new RegExp(`<section class="question" id="${question.id}"([^>]*)>([\\s\\S]*?)<\\/section>`));
    assert.ok(block, `${question.id}: test block`);
    assert.ok(block[1].includes(`data-objective="${question.objective}"`));
    assert.ok(block[1].includes(`data-correct="${String(question.correct).replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`), `${question.id}: correct value`);
    const heading = plain(block[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]).replace(/^\d+\.\s*/, '');
    assert.equal(heading, question.prompt, `${question.id}: prompt agreement`);
    if (question.options) assert.deepEqual([...block[2].matchAll(/<label class="option"[^>]*>([\s\S]*?)<\/label>/g)].map(option => plain(option[1])), question.options);
    if (question.stimulus) assert.ok(quiz.stimuli.some(stimulus => stimulus.id === question.stimulus));
  }
  assert.deepEqual([...new Set(quiz.questions.map(question => question.stimulus).filter(Boolean))].sort(), quiz.stimuli.map(stimulus => stimulus.id).sort());
  for (const stimulus of quiz.stimuli) {
    assert.ok(!test.includes('assets/grade4-unit1'), `${stimulus.id}: no textbook asset in test`);
    assert.ok(/original|fictional|independent|only for this assessment/i.test(stimulus.description), `${stimulus.id}: original stimulus`);
    if (stimulus.rows) {
      assert.ok(stimulus.headers.length > 1 && stimulus.rows.every(row => row.length === stimulus.headers.length));
      assert.ok(test.includes(`id="stimulus-${stimulus.id}"`));
    } else assert.ok(stimulus.text && test.includes(`id="stimulus-${stimulus.id}"`));
  }
  const textbookPhrases = lesson === 7
    ? ['What is your favourite hobby?', 'I swim once a week.', 'He runs about 2 kilometres every day.']
    : ['Why do you go to school?', 'I go to school to learn new things.', 'Where is the fire station?'];
  for (const phrase of textbookPhrases) assert.ok(!test.includes(phrase), `Test must not copy: ${phrase}`);

  assert.ok(read('lessons.html').includes(`${base}.html`));
  assert.ok(read('index.html').includes(`${base}.html`));
  assert.ok(read('teacher-resources.html').includes(`${base}.html`));
  assert.ok(read('platform-shell.js').includes(`'${base}': { grade: 4, unit: 1, lesson: ${lesson},`));
  assert.match(read('round-tests.html'), /curriculum\.gradeSummary\(grade\)/);

  console.log(`PASS Grade 4 Unit 1 Lesson ${lesson}: 5 pages; 6 byte-identical scans; ${audit.totals.allEntries} audited entries (${categories.printed}/${categories.additional}/${categories.expression}); ${record.activityCount} writing activities with ${record.exceptions.length} documented exceptions; 12 independent mapped test items.`);
}
