# Grade 3 · Unit 1 · Lesson 6 — unpublished draft pages

These two pages are work in progress and are **not published**. The site check
(`tests/curriculum-registry.mjs`) rejects any lesson whose five pages are not all at the
repository root, so the draft pages stay here until Lesson 6 is complete.

- `grade3-unit1-lesson6-pupil-book.html`
- `grade3-unit1-lesson6-workbook.html`

They refer to shared assets by root-relative names. The browser test
`tests/grade3-unit1-lesson6-workbook.browser.mjs` serves this folder's files with a fallback
to the repository root for shared assets. When the lesson is finished, move both pages back to
the root beside the other Lesson 6 pages.
