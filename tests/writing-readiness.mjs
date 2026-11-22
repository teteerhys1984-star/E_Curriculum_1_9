// Writing-only readiness: a missing audit is explicitly not audited.
// This checker validates records, not their pedagogical correctness.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function registrySlugs(shell) {
  const block = shell.match(/const LESSONS = \{([\s\S]*?)\n {2}\};/);
  assert.ok(block, 'authoritative LESSONS registry not found');
  const slugs = [...block[1].matchAll(/'([a-z0-9-]+)'\s*:\s*\{/g)].map(m => m[1]);
  assert.ok(slugs.length, 'empty LESSONS registry');
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate registry lesson');
  return slugs;
}

export function writingReadiness(slugs, data, exists) {
  assert.ok(Array.isArray(slugs) && slugs.length > 0, 'registered lessons required');
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate registered lesson');
  assert.ok(record(data) && data.version === 1 && record(data.audited), 'invalid Writing readiness record');
  const registered = new Set(slugs);
  const validLocal = p => nonempty(p) && !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..') && exists(p);
  for (const [slug, audit] of Object.entries(data.audited)) {
    assert.ok(registered.has(slug), `${slug}: audit is not for a registered lesson`);
    assert.ok(record(audit), `${slug}: audit must be an object`);
    assert.ok(Number.isInteger(audit.activityCount) && audit.activityCount >= 0, `${slug}: invalid activity count`);
    assert.ok(nonempty(audit.inventory) && (validLocal(audit.inventory) || /^https:\/\/github\.com\/teteerhys1984-star\/E_Curriculum_1_9\/pull\/\d+$/.test(audit.inventory)), `${slug}: missing inventory evidence`);
    assert.ok(Array.isArray(audit.exceptions) && audit.exceptions.length <= audit.activityCount, `${slug}: invalid exceptions`);
    const seen = new Set();
    for (const ex of audit.exceptions) {
      assert.ok(record(ex), `${slug}: invalid exception`);
      assert.ok(["Pupil's Book", "Student's Book", 'Workbook'].includes(ex.book), `${slug}: invalid book`);
      assert.ok(Number.isInteger(ex.page) && ex.page > 0, `${slug}: invalid page`);
      for (const field of ['activity', 'reason', 'handling']) assert.ok(nonempty(ex[field]), `${slug}: missing ${field}`);
      assert.ok(validLocal(ex.evidence), `${slug}: missing local exception evidence`);
      const key = JSON.stringify([ex.book, ex.page, ex.activity]);
      assert.ok(!seen.has(key), `${slug}: duplicate exception`);
      seen.add(key);
    }
  }
  return slugs.map(slug => {
    const audit = data.audited[slug];
    return {
      slug,
      state: !audit ? 'Writing not yet audited' : audit.exceptions.length ? 'Writing audited with documented exceptions' : 'Writing audited',
      exceptions: audit ? audit.exceptions.length : 0
    };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const slugs = registrySlugs(fs.readFileSync(path.join(root, 'platform-shell.js'), 'utf8'));
  const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/english-curriculum-audit/writing-readiness.json'), 'utf8'));
  const states = writingReadiness(slugs, data, file => fs.existsSync(path.join(root, file)));
  for (const item of states) console.log(`${item.slug}: ${item.state}${item.exceptions ? ` (${item.exceptions} exceptions)` : ''}`);
  console.log('PASS Writing readiness records (structural checks only; not a pedagogical audit)');
}
