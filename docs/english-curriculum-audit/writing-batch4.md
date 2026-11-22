# Writing Audit — Batch 4 (Grade 3 Unit 1 Lesson 4 & Grade 4 Unit 1 Lesson 4)

- **Lessons:** Grade 3 Unit 1 Lesson 4 (*My Five Senses*, Pupil's Book pp. 12–14, Workbook pp. 12–14) and Grade 4 Unit 1 Lesson 4 (*My House*, Pupil's Book pp. 12–14, Workbook pp. 14–16).
- **Sources:** All 12 original scans verified byte-for-byte against their `source-manifest.json` SHA-256 hashes.
- **Counts:**
  - Grade 3 Lesson 4: 0 Pupil's Book + 4 Workbook (`wb-1`, `wb-2`, `wb-5`, `wb-6`) = **4** writing activities.
  - Grade 4 Lesson 4: 6 Pupil's Book (`pb-1`, `pb-3`, `pb-6`, `pb-9`, `pb-10`, `pb-11`) + 5 Workbook (`wb-2`, `wb-3`, `wb-6`, `wb-8`, `wb-9`) = **11** writing activities.
  - **Batch 4 total: 15 writing activities.**
- **Implementation:** `lesson4-writing-practice.js` loaded on `grade3-unit1-lesson4-workbook.html`, `grade4-unit1-lesson4-pupil-book.html`, and `grade4-unit1-lesson4-workbook.html`. Synchronous reset preserved (no deferred cleanup).
- **Verification:** `npm test` (including `tests/lesson4-writing.mjs`) and `tests/lesson4-writing.browser.mjs`.
