import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const shell = readFileSync(new URL('../platform-shell.js', import.meta.url), 'utf8');

export function readCurriculumTotals(source = shell) {
  // Load the production exports without starting the DOM renderer. Compute expectations
  // from the raw metadata so a bug in platformTotals() cannot also change the oracle.
  const window = {};
  runInNewContext(source, {
    window,
    document: { readyState: 'loading', addEventListener() {} }
  }, { filename: 'platform-shell.js', timeout: 1000 });
  const { LESSONS, LESSON_SECTIONS } = window.EFCPlatform;
  const entries = Object.values(LESSONS);
  return {
    lessons: entries.length,
    pages: entries.length * LESSON_SECTIONS.length,
    answerKeyAreas: entries.filter(entry => entry.answerKey === true).length
  };
}

export const curriculumTotals = Object.freeze(readCurriculumTotals());

export function assertTeacherFallbackTotals(html) {
  for (const [key, label] of [
    ['lessons', 'Prepared lessons'],
    ['pages', 'Verified lesson pages'],
    ['answerKeyAreas', 'Answer-key areas']
  ]) {
    const expected = curriculumTotals[key];
    assert.ok(
      html.includes(`<b data-curriculum-count="${key}">${expected}</b><span>${label}</span>`),
      `teacher.html: ${label} must show ${expected} in the static HTML`
    );
  }
}
