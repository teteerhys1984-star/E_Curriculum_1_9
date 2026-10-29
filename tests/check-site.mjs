import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'grade3-unit1-lesson2';
const checks = [];
const pass = (name, detail = '') => { checks.push({ name, status: 'PASS', detail }); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const attrs = tag => Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs), m => [m[1], m[3]]));
const tags = (html, name) => Array.from(html.matchAll(new RegExp('<' + name + '(?=[\\s>])[^>]*>', 'gi')), m => attrs(m[0]));
const localUrl = url => url && !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
const fileOfUrl = url => decodeURIComponent(url.split(/[?#]/)[0]);
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html')).sort();
const newPages = ['menu', 'pupil-book', 'workbook', 'vocabulary', 'test'].map(section => base + (section === 'menu' ? '' : '-' + section) + '.html');

// All repository HTML, not just new files: relative links and assets must exist.
let localLinks = 0;
let assetReferences = 0;
for (const file of htmlFiles) {
  const html = read(file);
  // Existing menu pages build links in inline JavaScript. Inspect actual HTML tags,
  // not template strings; the browser suite clicks the dynamically rendered links.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => /\bsrc\s*=/.test(match) ? match : '');
  const refs = [...tags(markup, 'a'), ...tags(markup, 'link')].map(a => a.href).filter(localUrl)
    .concat([...tags(markup, 'script'), ...tags(markup, 'img'), ...tags(markup, 'source')].map(a => a.src).filter(localUrl));
  const allIds = Array.from(markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/g), m => m[1]);
  assert.equal(new Set(allIds).size, allIds.length, `${file}: duplicate IDs`);
  for (const ref of refs) {
    const resolved = path.resolve(root, path.dirname(file), fileOfUrl(ref));
    assert.ok(resolved.startsWith(root + path.sep), `${file}: link leaves project: ${ref}`);
    assert.ok(fs.existsSync(resolved), `${file}: missing link/asset: ${ref}`);
    localLinks++;
    const fragment = ref.includes('#') ? decodeURIComponent(ref.split('#')[1]) : '';
    if (fragment && resolved.endsWith('.html')) {
      assert.ok(fs.readFileSync(resolved, 'utf8').includes(`id="${fragment}"`), `${file}: missing fragment ${ref}`);
    }
  }
  for (const img of tags(html, 'img')) {
    assert.ok(img.alt !== undefined, `${file}: image missing alt: ${img.src}`);
    if (file.startsWith(base)) assert.ok(localUrl(img.src), `${file}: nonrelative image`);
  }
}
pass('All repository HTML local links and assets resolve', `${htmlFiles.length} HTML files; ${localLinks} references`);

for (const file of newPages) {
  assert.ok(exists(file), `Missing ${file}`);
  const html = read(file);
  assert.match(html, /<html lang="ar" dir="rtl">/, `${file}: Arabic RTL root`);
  assert.match(html, /<main class="wrap">/, `${file}: shared content wrapper`);
  assert.ok(html.includes('href="lessons.html?grade=3"'), `${file}: Grade 3 return link`);
  assert.ok(html.includes(`href="${base}.html"`), `${file}: lesson home link`);
  if (!file.endsWith(`${base}.html`)) {
    assert.ok(html.includes('<script src="lesson-content-navigation.js" defer></script>'), `${file}: shared step navigator required`);
    assert.ok(html.includes(`src="${base}.js"`), `${file}: lesson-local interactions`);
  } else {
    assert.ok(!html.includes('lesson-content-navigation.js'), 'Menu must not load step navigator');
    assert.ok(html.includes('data-nav-page="menu"'), 'Menu opt-out');
  }
  assert.ok(!/localhost|127\.0\.0\.1/.test(html), `${file}: browser-facing loopback URL`);
}
pass('Five new pages follow LESSON_PAGE_STANDARD.md', 'Four content pages load the shared step navigator; menu opts out');

const listing = read('lessons.html');
assert.ok(listing.includes("grade===3?'<a class=\"lesson\" href=\"grade3-unit1-lesson2.html\""));
assert.ok(listing.includes('Lesson 2 · School Subjects'));
assert.ok(listing.includes("grade===5?'<a class=\"lesson\" href=\"grade5-unit1-lesson2.html\""));
for (const grade of [3, 4, 5, 8]) assert.ok(listing.includes(`grade${grade}-unit1-lesson1.html`));
pass('Grade 3 listing includes new lesson without removing existing lesson links');

const pb = read(`${base}-pupil-book.html`);
const wb = read(`${base}-workbook.html`);
for (let i = 1; i <= 5; i++) assert.ok(pb.includes(`id="pb-${i}"`));
for (let i = 1; i <= 6; i++) assert.ok(wb.includes(`id="wb-${i}"`));
assert.equal((pb.match(/class="dialogue"/g) || []).length, 6);
assert.equal((pb.match(/<li><b>\d+<\/b>/g) || []).length, 10);
assert.equal((wb.match(/type="radio"/g) || []).length, 8);
assert.equal((wb.match(/name="missing-/g) || []).length, 4);
assert.equal((wb.match(/id="schedule-/g) || []).length, 4);
assert.equal((wb.match(/<details class="source-page">/g) || []).length, 3);
assert.equal((pb.match(/<details class="source-page">/g) || []).length, 3);
assert.ok(!pb.includes('<audio'));
assert.ok(!wb.includes('<audio'));
assert.ok(!wb.includes('wb-listen-key'));
assert.ok(pb.includes('Music, Art, English, Arabic'));
assert.ok(pb.includes('Art and English'));
pass('Source activity counts and blanks', 'PB: 5 activities, 6 dialogues, 10 numbers; WB: 6 exercises, 8 listening options, 4 sequence blanks, 4 timetable blanks');

const manifest = JSON.parse(read('assets/grade3-unit1-lesson2/source-manifest.json'));
assert.equal(manifest.length, 6);
for (const item of manifest) {
  const bytes = fs.readFileSync(path.join(root, item.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, `Original changed: ${item.file}`);
}
const crops = fs.readdirSync(path.join(root, 'assets/grade3-unit1-lesson2/crops')).filter(f => f.endsWith('.png'));
assert.equal(crops.length, 27);
pass('Original source images preserved byte-for-byte', '6 SHA-256 matches; 27 derivative illustration crops');

const test = read(`${base}-test.html`);
const expectedQuiz = JSON.parse(read('tests/grade3-unit1-lesson2.quiz.json'));
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const plain = value => decode(value.replace(/<[^>]*>/g, '')).trim();
const questionBlocks = Array.from(test.matchAll(/<section class="question" id="q(\d+)"([^>]*)>([\s\S]*?)<\/section>/g));
assert.equal(questionBlocks.length, 20);
assert.equal(expectedQuiz.length, 20);
for (const [index, block] of questionBlocks.entries()) {
  const expected = expectedQuiz[index];
  const data = attrs('<section ' + block[2] + '>');
  assert.equal(Number(block[1]), expected.number);
  assert.equal(Number(data['data-correct']), expected.correct);
  assert.equal(data['data-reference'], expected.reference);
  assert.equal(data['data-kind'], expected.kind);
  assert.equal(plain(block[3].match(/<h2>([\s\S]*?)<\/h2>/)[1]), `${expected.number}. ${expected.prompt}`);
  const options = Array.from(block[3].matchAll(/<span class="en" lang="en" dir="ltr">([abc]\) [\s\S]*?)<\/span>/g), (m, i) => plain(m[1]).slice(3));
  assert.deepEqual(options, expected.options);
}
assert.equal((test.match(/class="question"/g) || []).length, 20);
assert.equal((test.match(/type="radio"/g) || []).length, 60);
assert.equal((test.match(/data-kind="inferred"/g) || []).length, 5);
assert.equal((test.match(/data-kind="explicit"/g) || []).length, 15);
assert.ok(test.includes('id="answer-guide" class="answer" hidden'));
assert.ok(test.includes('id="quiz"'));
assert.ok(!test.includes('<audio'));
pass('Test structure', '20 questions, 60 options, 15 direct readings and 5 explicitly marked inferences; teacher key initially hidden');
pass('Exact quiz prompts, choices, references and answer indices', 'All 20 questions match the stored source-review fixture');

const docsDir = path.join(root, 'docs', base);
let docLinks = 0;
for (const file of fs.readdirSync(docsDir).filter(f => f.endsWith('.md'))) {
  const markdown = fs.readFileSync(path.join(docsDir, file), 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const url = match[1];
    if (/^(?:https?:|#)/.test(url)) continue;
    assert.ok(fs.existsSync(path.resolve(docsDir, fileOfUrl(url))), `${file}: broken documentation link ${url}`);
    docLinks++;
  }
}
for (const match of read(`${base}.css`).matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
  assert.ok(exists(match[1]), `Missing CSS asset: ${match[1]}`);
}
pass('Documentation links and local font assets', `${docLinks} Markdown links; every CSS font URL exists`);

const result = { suite: 'static-site-and-source-integrity', date: new Date().toISOString(), status: 'PASS', checks };
console.log(JSON.stringify(result, null, 2));
