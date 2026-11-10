# Verification — Grade 5, Unit 1, Lesson 5 “Clothes”

Everything below was run in this repository on the task branch, after the lesson was built from the eleven supplied scans. The Lesson Test follows the permanent **Independent Lesson Test Policy** ([`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md)).

## 1. Files and scope

| File | Purpose |
|---|---|
| `grade5-unit1-lesson5.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson5-pupil-book.html` | Pupil’s Book pp. 15–20: activities 1–9, Revision 1 (pp. 18–19) and the Project (p. 20) |
| `grade5-unit1-lesson5-workbook.html` | Workbook pp. 17–21: exercises 1–10 and Revision 1 |
| `grade5-unit1-lesson5-vocabulary.html` | Clothes, patterns, shopping and charity words plus the grammar notes; Arabic meanings only, inside marked RTL cells |
| `grade5-unit1-lesson5-test.html` | Independent 18-question Lesson Test with persistence, scoring, reset and a teacher key |
| `grade5-unit1-lesson5.css` / `grade5-unit1-lesson5.js` | `l5-*` styling; answer persistence, step counters, scoring, reset and the teacher gate |
| `tests/grade5-unit1-lesson5.quiz.json` | Structured specification of all 18 questions |
| `tests/grade5-unit1-lesson5.browser.mjs` | End-to-end Playwright spec |
| `docs/grade5-unit1-lesson5/source-checklist.md` | Source-by-source review of the eleven scans |
| `assets/grade5-unit1-lesson5/source/` | The eleven supplied scans, byte-for-byte |
| `assets/grade5-unit1-lesson5/crops/` | Twenty-eight derived crops referenced by the book pages |

## 2. Lesson Test design

- **18 wholly original questions**: 14 multiple-choice (3 options each), 2 True/False, 2 written short answers. No textbook sentence, character, picture or passage is reused.
- Objectives covered: clothes vocabulary (Q1–2), pattern words (Q3–4), present continuous (Q5–6), `-ing` spelling (Q7–8), present simple vs continuous (Q9–10), punctuation (Q11–13), reading an unseen passage “My Uncle’s Shop” (Q14–16), shopping language (Q17), sentence writing (Q18).
- Every question carries `data-objective`, `data-objective-label`, `data-correct` and `data-evidence`; the key renders one entry per question from those attributes.
- Answer positions stay balanced (no option value used more than eight times).

## 3. Commands and results

| Command | Result |
|---|---|
| `npm test` | **PASS** — 39 static checks, including the new “Grade 5 Lessons 4 and 5 …” checks and `PASS C-3 content integrity: 52 original HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence; 25 explicitly reviewed new pages added` |
| `node tests/grade5-unit1-lesson5.browser.mjs` | **PASS** — 6 checks: five pages render LTR with no desktop overflow; every Pupil’s Book control answerable, counters move, answers survive reload and navigation, all 9 reveals open; Workbook controls answerable with the missing recordings disclosed; the 18-question test scores 18/18, 0/18 and 16/18, resets cleanly and the gate lists 18 entries; navigation complete; phone and 320 px layouts clean |
| `npm run test:browser` | **PASS** — the complete browser chain (13 suites, 129 PASS lines), with no assertion or console error |

## 4. Integrity evidence

- `node tests/check-site.mjs` re-hashes every scan and every crop: eleven scans and twenty-eight crops match their manifests, and every crop referenced by a page exists.
- `tests/c3-content-integrity.mjs` protects the original 52 baseline pages; the ten new pages are listed explicitly in `tests/c3-content-extension.json`, and the shared integration edits are recorded as exact before/after pairs.
- `git diff --check` reports no whitespace errors.

## 5. Honesty notes

- The recordings for Pupil’s Book activity 1 and Workbook exercises 3 and 8 were not supplied. Those items are reproduced as printed, are **not scored**, and say so on the page.
- Pupil’s Book activity 6b item 3 (“There is only one fitting room.”) is marked as not settled by the printed dialogue, which only says “The fitting room is over there.”
- The word-search grid is reproduced from the scan; letters the scan renders ambiguously are printed as seen rather than guessed.
