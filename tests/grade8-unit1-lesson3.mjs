import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'grade8-unit1-lesson3';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = JSON.parse(read(`assets/${slug}/source-manifest.json`));
const crops = JSON.parse(read(`assets/${slug}/crops-manifest.json`)).crops;
const fixture = JSON.parse(read(`tests/${slug}-fixture.json`));
assert.equal(source.length, 10);
assert.deepEqual(source.map(s => s.upload), Array.from({length: 10}, (_, i) => `image-${i + 1}.png`));
assert.deepEqual(source.map(s => s.page), [20,21,22,23,24,25,10,11,12,13]);
for (const item of source) {
  const data = fs.readFileSync(path.join(root, item.file));
  assert.equal(data.length, item.bytes); assert.equal(sha(data), item.sha256);
  assert.equal(data.readUInt32BE(16), item.width); assert.equal(data.readUInt32BE(20), item.height);
}
assert.equal(crops.length, 7);
let canConvert = true;
try { execFileSync('convert', ['-version'], {stdio:'ignore'}); } catch { canConvert = false; }
for (const crop of crops) {
  const data = fs.readFileSync(path.join(root, crop.file));
  assert.equal(data.length, crop.bytes); assert.equal(sha(data), crop.sha256);
  assert.equal(sha(fs.readFileSync(path.join(root, crop.source))), crop.sourceSha256);
  if (canConvert) {
    const {width,height,x,y} = crop.crop;
    const recut = execFileSync('convert', [path.join(root,crop.source), '-crop', `${width}x${height}+${x}+${y}`, '+repage', '-depth','8','rgb:-']);
    const actual = execFileSync('convert', [path.join(root,crop.file), '-depth','8','rgb:-']);
    assert.deepEqual(actual, recut, `${crop.file}: decoded source rectangle must match`);
  }
}
const pages = ['','-pupil-book','-workbook','-vocabulary','-test'].map(s => `${slug}${s}.html`);
for (const file of pages) {
  const html = read(file);
  assert.match(html, /<html lang="en" dir="ltr">/); assert.match(html, /<main class="wrap">/);
  assert.ok(html.includes('design-system.css') && html.includes('platform-shell.js') && html.includes('lesson-accessibility.js'));
  if (file !== pages[0]) assert.ok(html.includes('lesson-content-navigation.js'));
  for (const target of pages) assert.ok(html.includes(`href="${target}"`), `${file}: link to ${target}`);
}
const all = pages.map(read).join('\n');
const decode = text => text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
for (const [id,text] of Object.entries(fixture.sourceTexts)) {
  const match = all.match(new RegExp(`data-source="${id}"[^>]*>([^<]*)<`));
  assert.ok(match, `missing source text ${id}`); assert.equal(decode(match[1]), text, id);
}
const pb = read(pages[1]), wb = read(pages[2]), test = read(pages[4]);
assert.ok(!pb.includes('workbook-page-') && !wb.includes('student-book-page-'));
for (const [fid, form] of Object.entries(fixture.forms)) {
  const found = all.match(new RegExp(`<form[^>]*id="${fid}"[^>]*>([\\s\\S]*?)</form>`));
  assert.ok(found, fid);
  const names = [...new Set([...found[1].matchAll(/\bname="([^"]+)"/g)].map(m => m[1]))];
  assert.deepEqual(names, form.fields, fid);
  for (const [name,answers] of Object.entries(form.checkedItems)) {
    assert.ok(found[1].includes(`data-practice-answer="${answers.map(a => a.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')).join('|')}"`), `${name} answer fixture`);
  }
}
assert.ok(pb.includes('data-unscored=') && !pb.match(/data-practice-answer[^>]*id="sb22-b2-item"/));
for (const id of ['sb-listening','wb-listening']) assert.equal(Object.keys(fixture.forms[id].checkedItems).length, 0, `${id} must have no guessed key`);
assert.equal((test.match(/class="question"/g)||[]).length, 12);
assert.ok(test.includes('independent') && !test.includes('assets/grade8-unit1-lesson3/'));
assert.equal(fixture.assessment.length,12);
for (const [i,q] of fixture.assessment.entries()) {
  assert.ok(test.includes(`data-objective="${q.objective}" data-correct="${q.answer}"`));
  assert.ok([2,3].includes(q.options.length) && ['a','b','c'].indexOf(q.answer) < q.options.length);
}
assert.deepEqual(['a','b','c'].map(a => fixture.assessment.filter(q=>q.answer===a).length),[4,4,4]);
console.log(`PASS Grade 8 Lesson 3: 10 pinned originals, 7 crops${canConvert ? ' with decoded pixel comparisons' : ' (ImageMagick unavailable: pixel comparison skipped)'}, ${Object.keys(fixture.sourceTexts).length} transcription strings, 18 activity forms and 12 independent assessment items`);
