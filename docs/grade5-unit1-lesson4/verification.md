# Verification — Grade 5, Unit 1, Lesson 4 “The Five Senses”

Everything below was run in this repository on the task branch, after the lesson was built from the six supplied scans. The Lesson Test follows the permanent **Independent Lesson Test Policy** ([`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md)).

## 1. Files and scope

| File | Purpose |
|---|---|
| `grade5-unit1-lesson4.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson4-pupil-book.html` | Pupil’s Book pp. 12–14: activities 1–9 plus the Pronunciation box |
| `grade5-unit1-lesson4-workbook.html` | Workbook pp. 14–16: exercises 1–9 |
| `grade5-unit1-lesson4-vocabulary.html` | Five senses, body parts, sense adjectives and the grammar notes; Arabic meanings only, inside marked RTL cells |
| `grade5-unit1-lesson4-test.html` | Independent 18-question Lesson Test with persistence, scoring, reset and a teacher key |
| `grade5-unit1-lesson4.css` / `grade5-unit1-lesson4.js` | `l4-*` styling; answer persistence, step counters, scoring, reset and the teacher gate |
| `tests/grade5-unit1-lesson4.quiz.json` | Structured specification of all 18 questions |
| `tests/grade5-unit1-lesson4.browser.mjs` | End-to-end Playwright spec |
| `docs/grade5-unit1-lesson4/source-checklist.md` | Source-by-source review of the six scans |
| `assets/grade5-unit1-lesson4/source/` | The six supplied scans, byte-for-byte |
| `assets/grade5-unit1-lesson4/crops/` | Twelve derived crops referenced by the book pages |

## 2. Lesson Test design

- **18 wholly original questions**: 14 multiple-choice (3 options each), 2 True/False, 2 written short answers. No textbook sentence, character, picture or passage is reused.
- Objectives covered: vocabulary (Q1–3), sense verbs (Q4–6), adjectives (Q7–8), present simple `do/does` (Q9–12), reading an unseen passage “Kareem’s Four Boxes” (Q13–15), language use (Q16), sentence writing (Q17–18).
- Every question carries `data-objective`, `data-objective-label`, `data-correct` and `data-evidence`; the key renders one entry per question from those attributes.
- Answer positions stay balanced (no option value used more than eight times).

## 3. Commands and results

| Command | Result |
|---|---|
| `npm test` | **PASS** — 39 static checks, including the new “Grade 5 Lessons 4 and 5 …” checks and `PASS C-3 content integrity: 52 original HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence; 25 explicitly reviewed new pages added` |
| `node tests/grade5-unit1-lesson4.browser.mjs` | **PASS** — 6 checks: five pages render LTR with no desktop overflow; every Pupil’s Book control answerable, counters move, answers survive reload and navigation, all 7 reveals open; Workbook controls answerable with the missing recordings disclosed; the 18-question test scores 18/18, 0/18 and 16/18, resets cleanly and the gate lists 18 entries; navigation complete; phone and 320 px layouts clean |
| `npm run test:browser` | **PASS** — the complete browser chain (13 suites, 129 PASS lines), with no assertion or console error |

## 4. Integrity evidence

- `node tests/check-site.mjs` re-hashes every scan and every crop: six scans and twelve crops match their manifests, and every crop referenced by a page exists.
- `tests/c3-content-integrity.mjs` protects the original 52 baseline pages; the ten new pages are listed explicitly in `tests/c3-content-extension.json` and the shared integration edits (`index.html`, `lessons.html`, `teacher.html`, `teacher-resources.html`, `round-tests.html`) are recorded as exact before/after pairs, so nothing else could change silently.
- `git diff --check` reports no whitespace errors.

## 5. Honesty notes

- The recordings for Pupil’s Book activities 1–2 and Workbook exercises 5–6 were not supplied. Those items are reproduced as printed, are **not scored**, and say so on the page.
- No listening key, numbering or matching answer was invented anywhere in the lesson.
