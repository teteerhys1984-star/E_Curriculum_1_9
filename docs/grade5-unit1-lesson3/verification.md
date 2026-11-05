# Verification — Grade 5, Unit 1, Lesson 3

Everything below was run in this repository after redesigning the Lesson 3 Test under the permanent **Independent Lesson Test Policy** ([`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md)).
Commands are given so the results can be reproduced.

## 1. Lesson 3 files and scope

| File | Purpose |
|---|---|
| `grade5-unit1-lesson3.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson3-pupil-book.html` | Pupil’s Book pages 9–11, activities 1–9 + Pronunciation (preserved untouched) |
| `grade5-unit1-lesson3-workbook.html` | Workbook pages 11–13, exercises 1–7 (preserved untouched) |
| `grade5-unit1-lesson3-vocabulary.html` | Vocabulary and grammar notes, Arabic meanings only (preserved untouched) |
| `grade5-unit1-lesson3-test.html` | Independent 18-question Lesson Test across 5 task types with persistence, scoring, reset, and teacher key |
| `grade5-unit1-lesson3.css` | All `l3-*` styles plus `.l3-test-*` stimulus blocks and the lesson page-link strip |
| `grade5-unit1-lesson3.js` | Answer persistence (book, workbook, and test), step counters, deterministic choice + written test scoring, synchronous reset, and teacher gate |
| `tests/grade5-unit1-lesson3.browser.mjs` | End-to-end Playwright spec for Lesson 3 |
| `tests/grade5-unit1-lesson3.quiz.json` | Structured specification for all 18 independent questions, objectives, formats, answers, and explanations |
| `docs/grade5-unit1-lesson3/source-checklist.md` | Source-by-source review of Pupil’s Book and Workbook pages |
| `assets/grade5-unit1-lesson3/source/` | The six supplied scans, byte-for-byte |
| `assets/grade5-unit1-lesson3/crops/` | Fifteen pinned source crops referenced by the Pupil’s Book and Workbook pages |

## 2. Independent Lesson Test design (`grade5-unit1-lesson3-test.html`)

- **18 wholly original questions** (zero copied textbook sentences, zero book character names, zero book images/crops, zero book reading passages or tables, zero superficial rewording).
- **Complete coverage of Lesson 3’s learning objectives**:
  - **Q1–Q3 (`vocabulary`)**: contextual daily routine phrases (`brush my teeth`, `pack a bag`) and workplace (`hospital`).
  - **Q4–Q6 (`telling-time`)**: reading digital clock displays and matching English time forms (`quarter past seven`, `ten to nine`, `half past two`).
  - **Q7 (`frequency-adverbs`)**: selecting the logical frequency adverb (`never`) in context.
  - **Q8–Q9 (`schedule-interpretation`)**: interpreting an original five-day habit table (*Mazen’s Habits, Monday to Friday*) via multiple choice and True/False.
  - **Q10–Q12 (`present-simple-grammar`)**: third-person singular `-es` (`does`), negative `doesn’t + base verb`, and plural question `Do …?`.
  - **Q13–Q15 (`reading-comprehension`)**: answering True/False, who-does-what, and clock-time comprehension questions on an unseen 5-sentence text (*Bilal’s School Day*).
  - **Q16 (`language-use`)**: selecting the appropriate conversational reply to `What time does your mother go to work?`.
  - **Q17–Q18 (`sentence-writing`)**: typed grammatical verb-error correction (`go` → `goes`) and typed word-order question construction (`Does Maysa tidy her bedroom?`).
- **Curriculum vocabulary boundary**: every content word is verified against the Grade 1–5 / Unit 1 Lessons 1–3 taught lexicon by `tests/check-site.mjs`.

## 3. Static suite — `npm test`

Result: **PASS**, exit 0, **33** static checks + C-3 content integrity + 6 JS syntax checks.

| Check | Result |
|---|---|
| All repository HTML local links and assets resolve | PASS — 47 HTML files, 652 references |
| English-only content and language direction | PASS — every root `lang="en" dir="ltr"`; Arabic only in marked RTL vocabulary cells |
| Documentation, tests and repository text are English | PASS — 101 non-Vocabulary text files scanned, no Arabic script |
| Independent Lesson Test Policy documented & consistent across general pages | PASS — documented in `LESSON_PAGE_STANDARD.md` and `architecture-and-future-phases.md`; aligned across `index.html`, `lesson-menu.html`, `lesson.html`, `round-tests.html`, `teacher.html`, and `teacher-resources.html` with regression checks blocking `built strictly from verified book evidence` |
| Grade 5 Lesson 3 independent test policy | PASS — 18 original questions across 3 formats + schedule table + unseen passage; zero copied book sentences, images, or names; all 8 objective tags covered; single valid answer per item; zero untaught vocabulary |
| Pupil-facing and teacher-matrix lesson-test counts | PASS — `grade5-unit1-lesson3=18` matches across `index.html`, `lessons.html`, and `teacher-resources.html` |
| Grade 5 Lesson 3 Pupil’s Book & Workbook controls and order | PASS — all printed activities and transcription rules intact |
| Grade 5 Lesson 3 sources are pinned | PASS — 6 scans + 15 crops SHA-256 verified |
| C-3 content integrity | PASS — 47 HTML files verified; zero protected pages changed hashes |

## 4. Browser suites — every spec actually run

| Spec | Result | What it covered |
|---|---|---|
| `node tests/grade5-unit1-lesson3.browser.mjs` | **PASS** (6 checks) | Lesson 3 pages end to end: PB, WB, Vocabulary, 18-item independent test persistence/scoring/reset/retry/key, desktop + 390 px + 320 px |
| `node tests/c3-scoring.browser.mjs` | **PASS** (9 checks) | Independent numeric scoring across all 8 quizzes (`empty`, `allWrong`, `allCorrect`, `oneWrong`, `firstOnly`, `alternating`, `afterReset`) + 8 in-memory scoring-formula mutations rejected (`grade5-unit1-lesson3` expected 18, mutated 36) |
| `node tests/c3-accessibility.browser.mjs` | **PASS** (8 checks) | 867 controls named across 47 pages, unique IDs, ARIA references, 140 reveals, 8 answered-state tests, 7 keyed gates, print suppression, 390 px & forced-colors |
| `node tests/english-curriculum.browser.mjs` | **PASS** (10 checks) | All 47 pages at 1366×900 and 390×844, 64 decoded images, 8 print-cleanup tests, 7 keyed gates |
| `node tests/teacher-portal.browser.mjs` | **PASS** (14 checks) | 12 portal viewport combinations, 72 destinations HTTP 200, 8-row status matrix, `#teacher-gate` deep links |
| `node tests/phase1-design-foundation.browser.mjs` | **PASS** (7 checks) | 6 viewports (`1440` down to `320`), 47-page control & overflow audit, WCAG AA contrast |
| `node tests/phase2-a-navigation.browser.mjs` | **PASS** (7 checks) | Stepper, Previous/Next, keyboard Tab & Enter across desktop/tablet/mobile |

## 5. Screenshots

`test-results/grade5-unit1-lesson3/`:

- `pupil-book-desktop.png`
- `workbook-desktop.png`
- `test-desktop.png`
- `pupil-book-mobile.png`
- `workbook-mobile.png`
- `test-mobile.png`
