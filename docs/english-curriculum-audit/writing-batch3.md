# Writing audit and remediation — Batch 3

**Scope:** Grade 3 Unit 1 Lesson 3 and Grade 4 Unit 1 Lesson 3 only.
**Base:** `main` at `a76784941780ca0295a91d1b337402502829a692` (merge of PR #74).
**Status:** implemented and verified locally; one pull request opened, **not merged or deployed**.

Per-lesson detail lives in
[Grade 3](../grade3-unit1-lesson3/writing-inventory.md) and
[Grade 4](../grade4-unit1-lesson3/writing-inventory.md) inventories.

## Sources

Twelve textbook scans were inspected for this batch; all were already in the repository under
the lessons' `source/` directories and all matched their integrity manifests byte-for-byte
(SHA-256). Every expected page was present and readable, so no re-upload was requested.

| Lesson | Book | Printed pages | Scans |
|---|---|---|---|
| Grade 3 | Pupil's Book | 9, 10, 11 | `assets/grade3-unit1-lesson3/source/pupil-book-page-{9,10,11}.png` |
| Grade 3 | Workbook | 9, 10, 11 | `assets/grade3-unit1-lesson3/source/workbook-page-{9,10,11}.png` |
| Grade 4 | Pupil's Book | 9, 10, 11 | `assets/grade4-unit1-lesson3/source/pupil-book-page-{9,10,11}.png` |
| Grade 4 | Workbook | 11, 12, 13 | `assets/grade4-unit1-lesson3/source/workbook-page-{11,12,13}.png` |

Printed page numbers were read from the page footers and cross-checked against the manifests
and filenames.

## Counts

| Lesson | Pupil's Book writing | Workbook writing | Total | Compliant before | Corrected | Still blocked |
|---|---:|---:|---:|---:|---:|---:|
| Grade 3 | 0 | 6 | **6** | 0 fully | 6 | 1 (`wb-2`, audio) |
| Grade 4 | 3 | 4 | **7** | 0 fully | 7 | 0 |
| **Batch** | **3** | **10** | **13** | **0 fully** | **13** | **1** |

"Fully compliant before" counts activities that already met every requirement (model or labelled
sample or documented exception, reveal/hide, entry and editing, compare without overwriting,
deliberate per-activity reset, persistence, teacher-only separation, no fake grading, and
preserved IDs/storage). No activity had a per-activity writing marker, status or reset, so none
was fully compliant; the requirement-by-requirement before/after tables are in each inventory.

## Changes

- `lesson3-writing-practice.js` (new, shared by the three pages that contain writing):
  groups every written-production activity, adds labelled student-visible models and
  documented exceptions, exposes a persistence status, migrates drafts already saved by the
  existing lesson stores, and provides a deliberate per-activity reset with its own storage key
  `efc_writing_<page>_v1:<id>`.
- `grade3-unit1-lesson3-workbook.html`, `grade4-unit1-lesson3-pupil-book.html`,
  `grade4-unit1-lesson3-workbook.html`: one `<script>` reference each.
- `grade3-unit1-lesson3.css`, `grade4-unit1-lesson3.css`: styling for the labelled model and
  per-activity controls (hidden in print).
- `tests/lesson3-writing.mjs`, `tests/lesson3-writing.browser.mjs` (new) and the matching
  `package.json` script entries.

No other lesson, page, shared behaviour or curriculum-wide content was modified. Existing
section IDs, field IDs, lesson storage keys (`efc_grade3_unit1_lesson3_practice_v1:*`,
`efc_grade4_unit1_lesson3:practice:*`), printed activity text and progress are preserved.

## Verification

- `npm test` — passes (includes the new `tests/lesson3-writing.mjs`, which re-hashes all
  12 scans and pins the 13 activities and their printed response spaces).
- `node tests/lesson3-writing.browser.mjs` — passes: model/exception content, reveal without
  overwriting, edit, reload persistence, isolated per-activity reset, page-level reset,
  keyboard access, 390 px/768 px layout, storage-failure disclosure, and teacher-key separation.
- `node tests/grade3-unit1-lesson3.browser.mjs` and
  `node tests/grade4-unit1-lessons34.browser.mjs` — existing lesson suites pass unchanged.
- Full browser suite (`npm run test:browser`) — **exit 0**, 185 `PASS` lines and zero
  failures across all 26 browser files, including the new lesson-3 writing suite. (The
  phase-2-B teacher-portal suite rewrites its own tracked evidence screenshots; those
  regenerated files were reverted as unrelated to this batch.)
- `git diff --check` — clean.

## Integrity

All 49 files under `assets/grade3-unit1-lesson3/` (30) and `assets/grade4-unit1-lesson3/` (19)
are unchanged — 12 scans, 33 crops and 4 manifests. Their SHA-256 values were recorded before
the work and compared afterwards, and the scan hashes are re-checked against the manifests by
the tests.
