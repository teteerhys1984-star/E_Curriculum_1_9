import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const parseJson = file => JSON.parse(read(file));
const decode = value => String(value)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
const plain = value => decode(value.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const normalize = value => plain(String(value)).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1]] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}
function assertInternalReferences(file, html) {
  for (const [, , raw] of html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gs)) {
    const reference = decode(raw);
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
    const local = reference.split(/[?#]/, 1)[0];
    if (!local) continue;
    const resolved = path.resolve(root, path.dirname(file), local);
    assert.ok(resolved === root || resolved.startsWith(root + path.sep), `${file}: reference escapes repository: ${reference}`);
    assert.ok(fs.existsSync(resolved), `${file}: missing local reference ${reference}`);
  }
}
function verifySourceAndCropManifests(lesson, expectedUploads) {
  const base = `assets/grade4-unit1-lesson${lesson}`;
  const sourceManifest = parseJson(`${base}/source-manifest.json`);
  assert.equal(sourceManifest.images.length, 6, `Lesson ${lesson}: expected six source scans`);
  assert.deepEqual(sourceManifest.images.map(item => item.uploadIndex), expectedUploads);
  const sourceByImage = new Map();
  for (const item of sourceManifest.images) {
    const bytes = fs.readFileSync(path.join(root, item.file));
    assert.equal(bytes.length, item.bytes, `${item.file}: byte count changed`);
    assert.equal(sha256(bytes), item.sha256, `${item.file}: source hash changed`);
    sourceByImage.set(item.uploadIndex, item);
  }
  const cropManifest = parseJson(`${base}/crops-manifest.json`);
  assert.equal(cropManifest.cropCount, cropManifest.crops.length, `Lesson ${lesson}: crop count metadata`);
  const cropFiles = fs.readdirSync(path.join(root, base, 'crops')).filter(file => file.endsWith('.png')).sort();
  assert.equal(cropFiles.length, cropManifest.crops.length, `Lesson ${lesson}: every crop must be inventoried`);
  for (const crop of cropManifest.crops) {
    const bytes = fs.readFileSync(path.join(root, crop.file));
    assert.equal(sha256(bytes), crop.sha256, `${crop.file}: crop hash changed`);
    const source = sourceByImage.get(crop.sourceImageNumber);
    assert.ok(source, `${crop.file}: references an unknown upload`);
    assert.equal(crop.sourceFile, source.file, `${crop.file}: source file mapping`);
    assert.ok(crop.sourceBounds.x >= 0 && crop.sourceBounds.y >= 0, `${crop.file}: negative crop origin`);
    assert.ok(crop.sourceBounds.width > 0 && crop.sourceBounds.height > 0, `${crop.file}: empty crop`);
    assert.ok(crop.sourceBounds.x + crop.sourceBounds.width <= source.width, `${crop.file}: crop exceeds source width`);
    assert.ok(crop.sourceBounds.y + crop.sourceBounds.height <= source.height, `${crop.file}: crop exceeds source height`);
  }
  return sourceByImage;
}
function verifyVocabulary(lesson, expected) {
  const auditPath = `docs/grade4-unit1-lesson${lesson}/vocabulary-audit.json`;
  const audit = parseJson(auditPath);
  assert.equal(audit.totals.allEntries, expected.total);
  assert.equal(audit.entries.length, expected.total);
  assert.deepEqual(audit.totals, {
    ...audit.totals,
    printed: expected.categories.printed,
    additional: expected.categories.additional,
    expression: expected.categories.expression,
    allEntries: expected.total
  });
  assert.equal(audit.review.status, 'complete');
  assert.equal(audit.imageAudit.length, 6);

  const ids = new Set();
  const terms = new Set();
  const byId = new Map();
  const categories = { printed: 0, additional: 0, expression: 0 };
  for (const entry of audit.entries) {
    assert.ok(entry.id && !ids.has(entry.id), `${auditPath}: duplicate or empty entry id`);
    assert.ok(entry.term && !terms.has(normalize(entry.term)), `${auditPath}: duplicate or empty English term`);
    assert.ok(entry.meaning, `${auditPath}/${entry.id}: missing learner-support gloss`);
    assert.ok(entry.example, `${auditPath}/${entry.id}: missing source example`);
    assert.ok(Array.isArray(entry.sourceImages) && entry.sourceImages.length > 0, `${auditPath}/${entry.id}: no source image`);
    assert.ok(Object.hasOwn(categories, entry.category), `${auditPath}/${entry.id}: unknown category ${entry.category}`);
    ids.add(entry.id);
    terms.add(normalize(entry.term));
    byId.set(entry.id, entry);
    categories[entry.category]++;
  }
  assert.deepEqual(categories, expected.categories, `${auditPath}: category totals`);
  const sourceByNumber = new Map(audit.imageAudit.map(image => [image.imageNumber, image]));
  const sourceManifest = parseJson(`assets/grade4-unit1-lesson${lesson}/source-manifest.json`);
  assert.equal(sourceByNumber.size, 6, `${auditPath}: duplicate image audit numbers`);
  const categoryFields = {
    printed: 'printedVocabulary',
    additional: 'additionalVocabulary',
    expression: 'usefulExpressions'
  };
  const referenceTotals = { printed: 0, additional: 0, expression: 0 };
  for (const image of audit.imageAudit) {
    const source = sourceManifest.images.find(item => item.uploadIndex === image.imageNumber);
    assert.ok(source, `${auditPath}: image ${image.imageNumber} is not in the source manifest`);
    assert.equal(image.sourceFile, source.file, `${auditPath}: image ${image.imageNumber} source path`);
    assert.equal(image.sourceSha256, source.sha256, `${auditPath}: image ${image.imageNumber} source hash`);
    for (const [category, field] of Object.entries(categoryFields)) {
      const imageIds = image[field];
      assert.ok(Array.isArray(imageIds), `${auditPath}: ${field} must be an array`);
      const expectedIds = audit.entries
        .filter(entry => entry.category === category && entry.sourceImages.includes(image.imageNumber))
        .map(entry => entry.id).sort();
      assert.deepEqual([...imageIds].sort(), expectedIds, `${auditPath}: ${field} allocation for image ${image.imageNumber}`);
      assert.equal(image.counts[category], imageIds.length, `${auditPath}: ${field} count for image ${image.imageNumber}`);
      referenceTotals[category] += imageIds.length;
    }
  }
  for (const entry of audit.entries) {
    for (const imageNumber of entry.sourceImages) assert.ok(sourceByNumber.has(imageNumber), `${auditPath}/${entry.id}: unknown image ${imageNumber}`);
  }
  const expectedOccurrences = {
    ...referenceTotals,
    allReferences: Object.values(referenceTotals).reduce((sum, count) => sum + count, 0)
  };
  assert.deepEqual(expectedOccurrences, audit.occurrences, `${auditPath}: image occurrence totals`);

  if (lesson === 3) {
    assert.equal(audit.review.inflectionChecks.length, 9, 'Lesson 3: manually reviewed inflected term/image matches');
    for (const check of audit.review.inflectionChecks) {
      assert.ok(byId.has(check.entryId), `Lesson 3: missing reviewed inflection entry ${check.entryId}`);
      assert.ok(byId.get(check.entryId).sourceImages.includes(check.imageNumber), `Lesson 3: inflection image not allocated to ${check.entryId}`);
      assert.ok(check.printedForm && check.evidence, 'Lesson 3: inflection review must identify the printed form and evidence');
    }
  }

  const vocabularyPath = `grade4-unit1-lesson${lesson}-vocabulary.html`;
  const html = read(vocabularyPath);
  const allRows = [...html.matchAll(/<tr\s+data-entry-id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)];
  assert.equal(allRows.length, expected.total, `${vocabularyPath}: rendered entry count`);
  assert.equal(new Set(allRows.map(([, id]) => id)).size, expected.total, `${vocabularyPath}: duplicate rendered entry ids`);
  const sections = {
    printed: html.match(/<section class="panel" id="vocab-printed">([\s\S]*?)<\/section>/)?.[1],
    additional: html.match(/<section class="panel" id="vocab-additional">([\s\S]*?)<\/section>/)?.[1],
    expression: html.match(/<section class="panel" id="vocab-expression">([\s\S]*?)<\/section>/)?.[1]
  };
  for (const [category, section] of Object.entries(sections)) {
    assert.ok(section, `${vocabularyPath}: missing ${category} table`);
    const rows = [...section.matchAll(/<tr\s+data-entry-id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)];
    assert.equal(rows.length, expected.categories[category], `${vocabularyPath}: ${category} table count`);
    for (const [, id] of rows) assert.equal(byId.get(id)?.category, category, `${vocabularyPath}: ${id} is in the wrong category`);
  }
  for (const [, id, rowHtml] of allRows) {
    const entry = byId.get(id);
    assert.ok(entry, `${vocabularyPath}: unreviewed entry ${id}`);
    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(([, cell]) => plain(cell));
    assert.equal(cells.length, 4, `${vocabularyPath}/${id}: four reference columns`);
    assert.equal(normalize(cells[0]), normalize(entry.term), `${vocabularyPath}/${id}: English headword`);
    assert.equal(normalize(cells[1]), normalize(entry.meaning), `${vocabularyPath}/${id}: Arabic gloss`);
    assert.equal(normalize(cells[2]), normalize(entry.example), `${vocabularyPath}/${id}: printed example`);
    const refs = [...rowHtml.matchAll(/<span class="source-reference">([\s\S]*?)<\/span>/g)].map(([, ref]) => plain(ref)).sort();
    const expectedRefs = entry.sourceImages.map(imageNumber => {
      const source = sourceByNumber.get(imageNumber);
      const label = source.book === 'pupil-book' ? 'Pupil’s Book' : 'Workbook';
      return `${label} · p. ${source.sourcePage}`;
    }).sort();
    assert.deepEqual(refs, expectedRefs, `${vocabularyPath}/${id}: printed source citations`);
  }
  return audit;
}
function validateTest(lesson, quiz, testHtml) {
  const base = `grade4-unit1-lesson${lesson}`;
  assert.equal(quiz.lesson, base);
  assert.equal(quiz.policy, 'independent-lesson-test-v1');
  assert.equal(quiz.totalQuestions, 12);
  assert.equal(quiz.questions.length, quiz.totalQuestions);
  assert.ok(quiz.questions.every((question, index) => question.number === index + 1 && question.id === `q${index + 1}`));
  const questionBlocks = [...testHtml.matchAll(/<section class="question" id="q(\d+)"([^>]*)>([\s\S]*?)<\/section>/g)];
  assert.equal(questionBlocks.length, quiz.totalQuestions, `${base}-test.html: question count`);
  assert.equal((testHtml.match(/<section class="question"/g) || []).length, quiz.totalQuestions);
  assert.match(testHtml, /<form id="quiz"[^>]*aria-label="Grade 4 Unit 1 Lesson \d test: 12 questions"/);
  assert.match(testHtml, /id="answer-guide"[^>]*\shidden(?:\s|>)/, `${base}: teacher key must start hidden`);
  assert.match(testHtml, /id="teacher-key"/);
  assert.match(testHtml, /id="test-save-status"/);
  assert.match(testHtml, /id="reset-test"/);
  assert.match(testHtml, /id="check-answers"/);
  const stimulusIds = new Set(quiz.stimuli.map(stimulus => stimulus.id));
  for (const stimulus of quiz.stimuli) {
    const section = testHtml.match(new RegExp(`<section class="panel test-stimulus" id="stimulus-${stimulus.id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1];
    assert.ok(section, `${base}: missing original stimulus ${stimulus.id}`);
    const title = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
    assert.equal(normalize(title || ''), normalize(stimulus.title), `${base}: stimulus title ${stimulus.id}`);
    if (stimulus.description) assert.ok(section.includes(stimulus.description), `${base}: stimulus description ${stimulus.id}`);
    if (stimulus.rows) {
      const rowCells = [...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(([, row]) => [...row.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map(([, cell]) => normalize(cell)));
      assert.deepEqual(rowCells, [stimulus.headers, ...stimulus.rows].map(row => row.map(normalize)), `${base}: stimulus table ${stimulus.id}`);
    }
    if (stimulus.text) {
      const passage = section.match(/<div class="test-passage"[^>]*>([\s\S]*?)<\/div>/)?.[1];
      assert.equal(normalize(passage || ''), normalize(stimulus.text), `${base}: stimulus passage ${stimulus.id}`);
    }
  }
  const usedStimuli = new Set();
  for (const [index, [, number, rawAttrs, contents]] of questionBlocks.entries()) {
    const question = quiz.questions[index];
    const attrs = attributes(`<section ${rawAttrs}>`);
    assert.equal(Number(number), question.number);
    assert.equal(question.id, `q${number}`);
    assert.equal(attrs['data-format'], question.format, `${base} ${question.id}: format`);
    assert.equal(attrs['data-objective'], question.objective, `${base} ${question.id}: objective`);
    assert.equal(attrs['data-objective-label'], question.objectiveLabel, `${base} ${question.id}: objective label`);
    assert.equal(attrs['data-correct'], String(question.correct), `${base} ${question.id}: keyed answer`);
    assert.equal(attrs['data-evidence'], question.evidence, `${base} ${question.id}: key evidence`);
    if (question.accepted) assert.equal(attrs['data-accepted'], question.accepted.join('|'), `${base} ${question.id}: accepted written answers`);
    if (question.stimulus) {
      assert.equal(attrs['data-stimulus'], question.stimulus, `${base} ${question.id}: stimulus reference`);
      assert.ok(stimulusIds.has(question.stimulus), `${base} ${question.id}: unknown stimulus`);
      usedStimuli.add(question.stimulus);
    }
    const heading = contents.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
    const prompt = normalize(heading || '').replace(/^\d+\.\s*/, '');
    assert.equal(prompt, normalize(question.prompt), `${base} ${question.id}: prompt differs from quiz JSON`);
    const options = [...contents.matchAll(/<label class="option"[^>]*>([\s\S]*?)<\/label>/g)].map(([, option]) => normalize(option));
    assert.deepEqual(options, (question.options || []).map(normalize), `${base} ${question.id}: choices differ from quiz JSON`);
    if (typeof question.correct === 'number') {
      assert.ok(question.correct >= 0 && question.correct < question.options.length, `${base} ${question.id}: incorrect key index`);
      assert.ok(question.options.length >= 2, `${base} ${question.id}: missing distractors`);
    } else {
      assert.ok(question.accepted?.length, `${base} ${question.id}: written item has no accepted responses`);
      const normalizeAnswer = answer => normalize(answer).toLocaleLowerCase('en').replace(/[.!?]/g, '');
      assert.ok(question.accepted.some(answer => normalizeAnswer(answer) === normalizeAnswer(question.correct)), `${base} ${question.id}: canonical answer is not accepted`);
      assert.ok(question.wrongSample && !question.accepted.some(answer => normalizeAnswer(answer) === normalizeAnswer(question.wrongSample)), `${base} ${question.id}: wrong sample is absent or accepted`);
    }
    assert.ok(question.evidence, `${base} ${question.id}: no rationale/evidence`);
  }
  assert.deepEqual([...usedStimuli].sort(), [...stimulusIds].sort(), `${base}: every new stimulus should support at least one question`);
  assert.ok(!/<audio\b/i.test(testHtml), `${base}: no unavailable audio element`);
}

export function validateLesson(lesson) {
  assert.ok([3, 4].includes(lesson), `Unsupported Grade 4 lesson ${lesson}`);
  const base = `grade4-unit1-lesson${lesson}`;
  const expectedPages = [
    `${base}.html`, `${base}-pupil-book.html`, `${base}-workbook.html`, `${base}-vocabulary.html`, `${base}-test.html`
  ];
  const expectedUploads = lesson === 3 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
  const sourceByImage = verifySourceAndCropManifests(lesson, expectedUploads);
  const expectedVocabulary = lesson === 3
    ? { total: 162, categories: { printed: 31, additional: 74, expression: 57 } }
    : { total: 183, categories: { printed: 28, additional: 102, expression: 53 } };
  const audit = verifyVocabulary(lesson, expectedVocabulary);
  const quiz = parseJson(`tests/${base}.quiz.json`);

  for (const file of expectedPages) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file}: missing lesson page`);
    const html = read(file);
    assert.match(html, /<html lang="en" dir="ltr">/, `${file}: English LTR document root`);
    assert.match(html, /<main class="wrap"/, `${file}: shared main wrapper`);
    assert.ok(html.includes(`data-lesson-nav="${base}"`), `${file}: shared navigation key`);
    assert.ok(!/localhost|127\.0\.0\.1/.test(html), `${file}: no browser-facing loopback URL`);
    assert.ok(!/<audio\b/i.test(html), `${file}: no unsupplied audio player`);
    assertInternalReferences(file, html);
    const sectionLinks = html.match(/<nav class="section-links"[\s\S]*?<\/nav>/)?.[0];
    if (file !== `${base}.html`) {
      assert.ok(sectionLinks, `${file}: shared section navigation`);
      for (const section of ['pupil-book', 'workbook', 'vocabulary', 'test']) {
        assert.ok(sectionLinks.includes(`${base}-${section}.html`), `${file}: missing link to ${section}`);
      }
      assert.ok(sectionLinks.includes(`${base}.html`), `${file}: missing lesson home link`);
      assert.ok(html.includes('lesson-content-navigation.js'), `${file}: missing content step navigation`);
      if (!file.endsWith('-vocabulary.html')) assert.ok(html.includes(`src="${base}.js"`), `${file}: missing lesson interactions`);
    }
  }

  const menu = read(`${base}.html`);
  assert.match(menu, /data-nav-page="menu"/);
  assert.equal((menu.match(/class="card"/g) || []).length, 4, `${base}: menu should link to four lesson sections`);
  assert.ok(menu.includes(`${expectedVocabulary.total} vocabulary entries`), `${base}: menu vocabulary total`);
  assert.ok(menu.includes('Browse the reference list'), `${base}: vocabulary link label`);

  const pupilBook = read(`${base}-pupil-book.html`);
  const workbook = read(`${base}-workbook.html`);
  const expectedPanelCounts = lesson === 3 ? { pb: 11, wb: 8 } : { pb: 12, wb: 9 };
  for (const [prefix, count, html] of [['pb', expectedPanelCounts.pb, pupilBook], ['wb', expectedPanelCounts.wb, workbook]]) {
    const panels = [...html.matchAll(new RegExp(`<section class="panel" id="${prefix}-(\\d+)"`, 'g'))].map(([, number]) => Number(number));
    assert.deepEqual(panels, Array.from({ length: count }, (_, index) => index + 1), `${base}: ${prefix} activity order/count`);
    const sourcePages = [...html.matchAll(/<details class="source-page"[\s\S]*?<a href="([^"]+)"/g)].map(([, href]) => href);
    assert.ok(sourcePages.length >= 1, `${base}: ${prefix} page links to its original scans`);
  }
  if (lesson === 3) {
    assert.equal((pupilBook.match(/class="[^"]*\bl3-clock-item\b[^"]*"/g) || []).length, 4, 'Lesson 3: four blank draw-and-write clocks');
    assert.equal((pupilBook.match(/type="time"/g) || []).length, 4, 'Lesson 3: four accessible time inputs');
    assert.ok(pupilBook.includes('In the afternoon, I'));
    assert.ok(pupilBook.includes('does not supply a continuation or a fixed answer'));
    assert.ok(workbook.includes('Audio required; the recording was not supplied.'));
  } else {
    assert.ok(pupilBook.includes('The source passage does not name its narrator, although question a1 calls the narrator “Linda.”'));
    assert.ok(pupilBook.includes('No item-by-item rule or key is invented.'));
    assert.ok(pupilBook.includes('Pronunciation audio was not supplied.'));
    assert.ok(workbook.includes('Audio required; the recording was not supplied.'));
  }

  const testHtml = read(`${base}-test.html`);
  validateTest(lesson, quiz, testHtml);
  const siteListing = read('lessons.html');
  assert.ok(siteListing.includes(`${base}.html`), `lessons.html: ${base} must be registered`);
  assert.ok(read('platform-shell.js').includes(`'${base}': { grade: 4, unit: 1, lesson: ${lesson},`), `registry: ${base} must be registered so round-tests.html lists its test`);
  assert.match(read('round-tests.html'), /curriculum\.gradeSummary\(grade\)/, 'round-tests.html derives its Lesson Test directory from the curriculum registry');
  assert.ok(read('index.html').includes(`${base}.html`), `index.html: ${base} must be directly listed`);
  assert.ok(read('teacher-resources.html').includes(`${base}.html`), `teacher-resources.html: ${base} must be listed for teachers`);
  assert.ok(read('teacher.html').includes('22</b><span>Prepared lessons'), 'Teacher portal aggregate lesson total');
  assert.ok(read('teacher.html').includes('110</b><span>Verified lesson pages'), 'Teacher portal aggregate page total');
  assert.ok(read('teacher.html').includes('21</b><span>Answer-key areas'), 'Teacher portal aggregate key total');

  console.log(`PASS Grade 4 Unit 1 Lesson ${lesson}: five registered pages; source/crop hashes; ${expectedVocabulary.total} audited vocabulary entries and references; ${quiz.totalQuestions} quiz questions matched to JSON; curriculum links, limits and key data checked.`);
}
