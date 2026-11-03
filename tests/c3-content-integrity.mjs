import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'tests', 'c3-content-baseline.json');
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
  fs.writeFileSync(manifestPath, JSON.stringify({
    note: 'C-3 baseline captured from main at 451761991899793097c7bb7156ac2f969a74eaf2 before accessibility edits. Educational text excludes button labels; data hashes protect legacy quiz/recall arrays and modern assessment evidence attributes.',
    files: current
  }, null, 2) + '\n');
  console.log(`Wrote C-3 content baseline for ${htmlFiles.length} HTML files`);
} else {
  const baseline = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files;
  assert.deepEqual(Object.keys(current).sort(), Object.keys(baseline).sort(), 'C-3 must not add/remove lesson pages');
  for (const file of htmlFiles) {
    assert.equal(current[file].text, baseline[file].text, `${file}: educational text changed`);
    assert.deepEqual(current[file].data, baseline[file].data, `${file}: quiz/recall/evidence data changed`);
  }
  console.log(`PASS C-3 content integrity: ${htmlFiles.length} HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence`);
}
