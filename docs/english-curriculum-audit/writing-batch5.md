# Writing Audit — Batch 5 (Grade 3 Unit 1 Lesson 5 & Grade 4 Unit 1 Lesson 5)

- **Lessons:** Grade 3 Unit 1 Lesson 5 (*Revision 1*, Pupil's Book pp. 15–17, Workbook pp. 15–17) and
  Grade 4 Unit 1 Lesson 5 (*School Subjects*, Pupil's Book pp. 15–20, Workbook pp. 17–21).
- **Sources:** All 17 original scans (6 Grade 3, 11 Grade 4) verified byte-for-byte against their
  `source-manifest.json` SHA-256 hashes and byte counts. No page was missing, so no re-upload was
  requested.
- **Inventories:** [Grade 3](../grade3-unit1-lesson5/writing-inventory.md) ·
  [Grade 4](../grade4-unit1-lesson5/writing-inventory.md).
- **Counts:**
  - Grade 3 Lesson 5: 1 Pupil's Book (`pb-2`) + 2 Workbook (`wb-5`, `wb-6`) = **3** writing activities.
  - Grade 4 Lesson 5: 6 Pupil's Book (`pb-1`, `pb-7`, `pb-8`, `pb-10`, `pb-11`, `pb-12`) + 9 Workbook = **15** writing activities.
  - **Batch 5 total: 18 writing activities.**
- **Exceptions (6):** Grade 3 `pb-2` (audio) and `wb-6` (printed columns disagree);
  Grade 4 `pb-1` (audio), `pb-10` item 5 (repair beyond a form change), `wb-5` items 2–3 (unprinted
  adjectives) and `wb-9`/`wb-11`/`wb-14`-type personal frames.
- **Source corrections made:**
  1. Grade 3 Workbook Exercise 4 was described as having "three printed empty lines" and carried three
     invented number-word fields. Contrast inspection of the scan (x 60–395, y 575–995, no markings
     above background) shows the left half of page 16 is blank. The fields and the false description are
     removed; the exercise is classified as drawing + oral, and `tests/grade3-unit1-lesson5.content.json`
     now pins 7 Workbook text inputs instead of 10.
  2. Grade 4's book pages carried only five/six generic page textareas (`study-5-1` … `study-5-11`).
     Those are preserved for any existing draft, and every writing activity now has its own fields,
     model, status and reset.
- **Implementation:** `lesson5-writing-practice.js` loaded on all four book pages
  (`grade3-unit1-lesson5-pupil-book.html`, `grade3-unit1-lesson5-workbook.html`,
  `grade4-unit1-lesson5-pupil-book.html`, `grade4-unit1-lesson5-workbook.html`), per-activity storage
  `efc_writing_<page>_v1:<id>`, visible persistence status, synchronous reset, and migration of the
  existing `efc_grade3_unit1_lesson5_practice_v1:<page>` / `efc_grade4_unit1_lesson5:practice:<path>`
  drafts.
- **Verification:** `npm test` including `tests/lesson5-writing.mjs`, `npm run test:browser`
  including `tests/lesson5-writing.browser.mjs`, and `git diff --check`.
- **Coverage boundary:** the static suite pins every activity id, page, control count and source hash;
  the browser suite exercises a representative subset (see the readiness record for exactly which)
  and does not claim browser coverage for the rest.
