# Verification — Grade 5, Unit 1, Lesson 6 “Healthy Lifestyle”

Everything below was run in this repository on the task branch, after the lesson was built from the six supplied scans. The Lesson Test follows the permanent **Independent Lesson Test Policy** ([`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md)).

## 1. Files and scope

| File | Purpose |
|---|---|
| `grade5-unit1-lesson6.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson6-pupil-book.html` | Pupil’s Book pp. 21–23: activities 1–8, the Pronunciation box and the Let’s Learn box |
| `grade5-unit1-lesson6-workbook.html` | Workbook pp. 22–24: exercises 1–9 |
| `grade5-unit1-lesson6-vocabulary.html` | Food groups, healthy habits and should / shouldn’t, with Arabic meanings only inside marked RTL cells |
| `grade5-unit1-lesson6-test.html` | Independent 18-question Lesson Test with persistence, scoring, reset and a teacher key |
| `grade5-unit1-lesson6.css` / `grade5-unit1-lesson6.js` | `l6-*` styling; answer persistence, step counters, scoring, reset and the teacher gate |
| `tests/grade5-unit1-lesson6.quiz.json` | Structured specification of all 18 questions |
| `tests/grade5-unit1-lesson6.mjs` | Lesson-specific static checks (sources, crops, pages, controls, test fixture) |
| `tests/grade5-unit1-lesson6.browser.mjs` | End-to-end Playwright spec |
| `docs/grade5-unit1-lesson6/source-checklist.md` | Source-by-source review of the six scans |
| `assets/grade5-unit1-lesson6/source/` | The six supplied scans, byte-for-byte |
| `assets/grade5-unit1-lesson6/crops/` | Fourteen derived crops referenced by the book pages |

## 2. Lesson Test design

- **18 wholly original questions**: 13 multiple choice (3 options each), 3 True/False, 2 written short answers. No textbook sentence, character, picture or passage is reused.
- Objectives covered: healthy food and habits vocabulary (Q1, Q8, Q9, Q11), the four food groups (Q2, Q3, Q10), advice with should / shouldn’t (Q4, Q6, Q7, Q12), suggestions with Why don’t you …? (Q5), reading an unseen passage “Rami’s Healthy Day” (Q13–Q16), sentence writing (Q17–Q18).
- Every question carries `data-objective`, `data-objective-label`, `data-correct` and `data-evidence`; the key renders one entry per question from those attributes.
- Answer positions stay balanced: no option value is used more than eight times across the sixteen keyed radio items.

## 3. Commands and results

| Command | Result |
|---|---|
| `node tests/grade5-unit1-lesson6.mjs` | **PASS** — 6 checks: six scans byte-for-byte, 14 crops re-cut exactly from the unchanged originals, five connected pages follow the page standard, every printed control and disclosure pinned, Arabic only in marked cells, and the 18 rendered questions match the fixture |
| `node tests/grade5-unit1-lesson6.browser.mjs` | **PASS** — 6 checks: five pages render LTR with no desktop overflow; every Pupil’s Book control answerable, counters move, answers survive reload and navigation, all 3 reveals open; Workbook controls answerable with the missing recordings disclosed; the 18-question test scores 18/18, 0/18 and 16/18, resets cleanly and the gate lists 18 entries; navigation complete; phone and 320 px layouts clean |
| `npm test` | **PASS** — 38 static checks in `check-site.mjs`, both new lesson-specific static suites, and `PASS C-3 content integrity: 52 original HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence; 35 explicitly reviewed new pages added` |
| `npm run test:browser` | **PASS** — the complete browser chain, with no assertion or console error |
| `git diff --check` | **PASS** — no whitespace errors |

## 4. Integrity evidence

- `node tests/check-site.mjs` re-hashes every scan and every crop: six scans and fourteen crops per lesson match their manifests, and every crop referenced by a page exists.
- `tests/c3-content-integrity.mjs` protects the original 52 baseline pages; the new pages are listed explicitly in `tests/c3-content-extension.json`, and the shared integration edits (index, lessons list, round tests, teacher pages) are recorded as exact before/after pairs.
- The six stored scans were re-hashed against the original uploads and matched byte-for-byte.

## 5. Honesty notes

- The recordings for Pupil’s Book activities 1 a and 1 b and Workbook exercises 4 and 6 were not supplied. Those items are reproduced as printed, are **not scored**, and say so on the page.
- Workbook exercise 3 is a speaking task (“Good for you / Bad for you”); the page prints no key and none is invented.
- The word bank on Pupil’s Book page 23 prints “why don’t you” in lower case while item 2 begins a sentence with a capital letter; both are kept as printed.
- The personal tasks (Pupil’s Book 7 and 8, Workbook 9) store the learner’s own answers; the page states that the book prints no key.
