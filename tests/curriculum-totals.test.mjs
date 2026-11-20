import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertTeacherFallbackTotals, curriculumTotals, readCurriculumTotals } from './curriculum-totals.shared.mjs';

const shell = readFileSync(new URL('../platform-shell.js', import.meta.url), 'utf8');
const teacher = readFileSync(new URL('../teacher.html', import.meta.url), 'utf8');

// Change the evaluated registry in memory only; neither the shell nor the HTML is rewritten.
const withRegistryChange = change => readCurriculumTotals(`${shell}\n${change}`);

test('registering a lesson without a key adds a lesson and its pages, but no key area', () => {
  const updated = withRegistryChange(`
    const registry = window.EFCPlatform.LESSONS;
    registry['grade4-unit1-lesson999'] = {
      ...registry['grade4-unit1-lesson1'], lesson: 999, answerKey: false
    };
  `);
  const pagesPerLesson = curriculumTotals.pages / curriculumTotals.lessons;
  assert.deepEqual(updated, {
    lessons: curriculumTotals.lessons + 1,
    pages: curriculumTotals.pages + pagesPerLesson,
    answerKeyAreas: curriculumTotals.answerKeyAreas
  });
});

test('publishing an answer key changes only the key-area total', () => {
  const updated = withRegistryChange(`
    const keyless = Object.values(window.EFCPlatform.LESSONS).find(entry => !entry.answerKey);
    keyless.answerKey = true;
  `);
  assert.deepEqual(updated, { ...curriculumTotals, answerKeyAreas: curriculumTotals.answerKeyAreas + 1 });
});

test('adding a lesson section adds one page for every registered lesson', () => {
  const updated = withRegistryChange("window.EFCPlatform.LESSON_SECTIONS.push('extra-section');");
  assert.deepEqual(updated, { ...curriculumTotals, pages: curriculumTotals.pages + curriculumTotals.lessons });
});

test('the published teacher fallback totals agree with the registry', () => {
  assertTeacherFallbackTotals(teacher);
});

for (const [key, label] of [
  ['lessons', 'Prepared lessons'],
  ['pages', 'Verified lesson pages'],
  ['answerKeyAreas', 'Answer-key areas']
]) {
  test(`teacher fallback check rejects an incorrect ${key} total`, () => {
    const correct = `data-curriculum-count="${key}">${curriculumTotals[key]}</b>`;
    const wrong = `data-curriculum-count="${key}">${curriculumTotals[key] + 1}</b>`;
    const modified = teacher.replace(correct, wrong);
    assert.notEqual(modified, teacher, 'the negative control must change the HTML');
    assert.throws(() => assertTeacherFallbackTotals(modified), {
      code: 'ERR_ASSERTION',
      message: `teacher.html: ${label} must show ${curriculumTotals[key]} in the static HTML`
    });
  });
}
