# Verification — Grade 5, Unit 1, Lesson 7 “Hobbies”

Everything below was run in this repository on the task branch, after the lesson was built from the six supplied scans. The Lesson Test follows the permanent **Independent Lesson Test Policy** ([`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md)).

## 1. Files and scope

| File | Purpose |
|---|---|
| `grade5-unit1-lesson7.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson7-pupil-book.html` | Pupil’s Book pp. 24–26: activities 1–8, the Pronunciation box and the Let’s Learn box |
| `grade5-unit1-lesson7-workbook.html` | Workbook pp. 25–27: exercises 1–8 |
| `grade5-unit1-lesson7-vocabulary.html` | Hobbies, free-time activities and can / can’t, with Arabic meanings only inside marked RTL cells |
| `grade5-unit1-lesson7-test.html` | Independent 18-question Lesson Test with persistence, scoring, reset and a teacher key |
| `grade5-unit1-lesson7.css` / `grade5-unit1-lesson7.js` | `l7-*` styling; answer persistence, step counters, scoring, reset and the teacher gate |
| `tests/grade5-unit1-lesson7.quiz.json` | Structured specification of all 18 questions |
| `tests/grade5-unit1-lesson7.mjs` | Lesson-specific static checks (sources, crops, pages, controls, test fixture) |
| `tests/grade5-unit1-lesson7.browser.mjs` | End-to-end Playwright spec |
| `docs/grade5-unit1-lesson7/source-checklist.md` | Source-by-source review of the six scans |
| `assets/grade5-unit1-lesson7/source/` | The six supplied scans, byte-for-byte |
| `assets/grade5-unit1-lesson7/crops/` | Eleven derived crops referenced by the book pages |

## 2. Lesson Test design

- **18 wholly original questions**: 13 multiple choice (3 options each), 3 True/False, 2 written short answers. No textbook sentence, character, picture or passage is reused.
- Objectives covered: hobby and free-time vocabulary (Q1–Q4, Q10–Q12), ability with can and can’t (Q5, Q6, Q8, Q9), questions with Can …? (Q7), reading an unseen passage “Lina’s Drawing” (Q13–Q16), sentence writing (Q17–Q18).
- Every question carries `data-objective`, `data-objective-label`, `data-correct` and `data-evidence`; the key renders one entry per question from those attributes.
- Answer positions stay balanced: no option value is used more than eight times across the sixteen keyed radio items.

## 3. Commands and results

| Command | Result |
|---|---|
| `node tests/grade5-unit1-lesson7.mjs` | **PASS** — 6 checks: six scans byte-for-byte, 11 crops re-cut exactly from the unchanged originals, five connected pages follow the page standard, every printed control and disclosure pinned, Arabic only in marked cells, and the 18 rendered questions match the fixture |
| `node tests/grade5-unit1-lesson7.browser.mjs` | **PASS** — 6 checks: five pages render LTR with no desktop overflow; every Pupil’s Book control answerable, counters move, answers survive reload and navigation, all 3 reveals open; Workbook controls answerable with the missing recordings disclosed; the 18-question test scores 18/18, 0/18 and 16/18, resets cleanly and the gate lists 18 entries; navigation complete; phone and 320 px layouts clean |
| `npm test` | **PASS** — 38 static checks in `check-site.mjs`, both new lesson-specific static suites, and `PASS C-3 content integrity: 52 original HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence; 35 explicitly reviewed new pages added` |
| `npm run test:browser` | **PASS** — the complete browser chain, with no assertion or console error |
| `git diff --check` | **PASS** — no whitespace errors |

## 4. Integrity evidence

- `node tests/check-site.mjs` re-hashes every scan and every crop: six scans and eleven crops for this lesson match their manifests, and every crop referenced by a page exists.
- `tests/c3-content-integrity.mjs` protects the original 52 baseline pages; the new pages are listed explicitly in `tests/c3-content-extension.json`, and the shared integration edits are recorded as exact before/after pairs.
- The six stored scans were re-hashed against the original uploads and matched byte-for-byte.

## 5. Honesty notes

- The recordings for Pupil’s Book activities 1 and 2 and Workbook exercises 4 and 5 were not supplied. Those items are reproduced as printed, are **not scored**, and say so on the page.
- The printed example sentence for Workbook exercise 2 (“She can listen to music in her free time.”) is reproduced as the book’s model; the other descriptions are labelled as sentences read from the pictures.
- Workbook exercise 1 a item 2 asks “When does she cook?”. The text says “in her free time and at the weekends”, so the printed option “In her free time” is the supported answer and “On Sunday” is not stated.
- The personal tasks (Pupil’s Book 4, 5, 7 and 8; Workbook 3, 7 and 8) store the learner’s own answers; the page states that the book prints no key.
