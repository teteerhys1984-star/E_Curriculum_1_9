import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'tests', 'c3-content-baseline.json');
const extensionPath = path.join(root, 'tests', 'c3-content-extension.json');
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html')).sort();
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const decode = value => value
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const normalize = value => decode(value).replace(/\s+/g, ' ').trim();

// Hash educational text, not UI button labels or accessibility-only markup.
// Script/style/button contents are excluded; hidden answer panels are included.
function visibleText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const tokens = main.match(/<[^>]+>|[^<]+/g) || [];
  const excluded = new Set();
  const parts = [];
  for (const token of tokens) {
    if (token.startsWith('<')) {
      const closing = token.match(/^<\/([a-z0-9-]+)/i)?.[1]?.toLowerCase();
      const opening = token.match(/^<([a-z0-9-]+)/i)?.[1]?.toLowerCase();
      if (closing) { excluded.delete(closing); continue; }
      if (!opening) continue;
      if (['script', 'style', 'button'].includes(opening)) excluded.add(opening);
      if (!excluded.size && !token.endsWith('/>')) {
        // Void elements never contain text.
        if (!['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'wbr'].includes(opening)) excluded.add('void:' + opening);
      }
      continue;
    }
    const realExclusions = [...excluded].filter(x => !x.startsWith('void:'));
    if (!realExclusions.length) parts.push(token);
  }
  return normalize(parts.join(' '));
}

function dataBlocks(html) {
  const blocks = {};
  const patterns = {
    qs: /const qs=\[[\s\S]*?\n\];/,
    key: /const key=\[[\s\S]*?\];/,
    correct: /const correct=\{[\s\S]*?\};/,
    words: /const words=\[[\s\S]*?\]\.map\([\s\S]*?\);/,
    ws: /const ws=\[[\s\S]*?\];/,
    assessmentData: /data-(?:correct|kind|reference|evidence)="[^"]*"/g
  };
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = html.match(pattern);
    if (matches) blocks[name] = sha(Array.isArray(matches) && pattern.global ? matches.join('\n') : matches[0]);
  }
  return blocks;
}

const current = Object.fromEntries(htmlFiles.map(file => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  return [file, { text: sha(visibleText(html)), data: dataBlocks(html) }];
}));

if (process.argv.includes('--write')) {
  // Once an explicit extension exists, never absorb its additions or shared edits into
  // the historical baseline. Review the extension instead of silently rebaselining.
  assert.ok(!fs.existsSync(extensionPath), 'C-3 baseline regeneration is disabled while a reviewed content extension exists');
  fs.writeFileSync(manifestPath, JSON.stringify({
    note: 'C-3 baseline captured from main at 451761991899793097c7bb7156ac2f969a74eaf2 before accessibility edits. Educational text excludes button labels; data hashes protect legacy quiz/recall arrays and modern assessment evidence attributes.',
    files: current
  }, null, 2) + '\n');
  console.log(`Wrote C-3 content baseline for ${htmlFiles.length} HTML files`);
} else {
  const baseline = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files;
  const extension = fs.existsSync(extensionPath)
    ? JSON.parse(fs.readFileSync(extensionPath, 'utf8'))
    : { pages: [], integrationEdits: {} };
  const additions = [...extension.pages].sort();
  assert.equal(new Set(additions).size, additions.length, 'C-3 extension must list each new page once');
  assert.deepEqual(Object.keys(current).filter(file => !(file in baseline)).sort(), additions, 'C-3 allows only the explicitly reviewed new pages');
  for (const file of additions) assert.ok(!(file in baseline), `${file}: an original baseline page cannot be reclassified as an addition`);

  // Reverse only exact, reviewed shared-integration edits before comparing with the
  // original hashes. Any other text or assessment-data change still fails closed.
  const protectedCurrent = { ...current };
  for (const [file, edits] of Object.entries(extension.integrationEdits)) {
    assert.ok(file in baseline, `${file}: integration edits may only target original baseline pages`);
    assert.ok(!additions.includes(file), `${file}: a new page cannot also be an integration edit`);
    let restored = fs.readFileSync(path.join(root, file), 'utf8');
    for (const edit of edits) {
      assert.equal(restored.split(edit.after).length - 1, 1, `${file}: reviewed integration edit is missing or ambiguous`);
      restored = restored.replace(edit.after, () => edit.before);
    }
    protectedCurrent[file] = { text: sha(visibleText(restored)), data: dataBlocks(restored) };
  }
  for (const file of Object.keys(baseline)) {
    assert.ok(file in current, `${file}: an original baseline page was removed`);
    assert.equal(protectedCurrent[file].text, baseline[file].text, `${file}: educational text changed outside the reviewed integration`);
    assert.deepEqual(protectedCurrent[file].data, baseline[file].data, `${file}: quiz/recall/evidence data changed outside the reviewed integration`);
  }
  console.log(`PASS C-3 content integrity: ${Object.keys(baseline).length} original HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence; ${additions.length} explicitly reviewed new pages added`);
}
