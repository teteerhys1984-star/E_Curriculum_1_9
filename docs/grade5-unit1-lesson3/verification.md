# Verification — Grade 5, Unit 1, Lesson 3

Everything below was run in this repository after the last edit to the lesson, not copied from an earlier run.
Commands are given so the results can be reproduced.

## 1. Pages added

| File | Purpose |
|---|---|
| `grade5-unit1-lesson3.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson3-pupil-book.html` | Pupil’s Book pages 9–11, activities 1–9 + Pronunciation |
| `grade5-unit1-lesson3-workbook.html` | Workbook pages 11–13, exercises 1–7 |
| `grade5-unit1-lesson3-vocabulary.html` | Vocabulary and grammar notes, Arabic meanings only |
| `grade5-unit1-lesson3-test.html` | Twenty-question test with scoring and a teacher key |
| `grade5-unit1-lesson3.css` | All `l3-*` styles plus the lesson page-link strip |
| `grade5-unit1-lesson3.js` | Answer persistence, step counters, test scoring, teacher gate |
| `tests/grade5-unit1-lesson3.browser.mjs` | End-to-end spec for this lesson |
| `tests/grade5-unit1-lesson3.quiz.json` | The twenty questions, options, answers, evidence and references |
| `docs/grade5-unit1-lesson3/source-checklist.md` | This lesson’s source-by-source review |
| `assets/grade5-unit1-lesson3/source/` | The six supplied scans, byte-for-byte |
| `assets/grade5-unit1-lesson3/crops/` | Fourteen source crops (fifteen files, all referenced) |

Files changed outside those: `index.html`, `lessons.html`, `platform-shell.js`, `round-tests.html`, `teacher-resources.html`, `package.json`, `tests/check-site.mjs`, `tests/c3-accessibility.browser.mjs`, `tests/c3-scoring.browser.mjs`, `tests/c3-scoring.fixture.json`, `tests/english-curriculum.browser.mjs`, `tests/teacher-portal.browser.mjs`, `tests/c3-content-baseline.json`. Each one only gains the Lesson 3 entry; no earlier lesson’s content was edited.

## 2. Static suite — `npm test`

Result: **PASS**, exit 0, **31** checks.

| Check | Result |
|---|---|
| All repository HTML local links and assets resolve | PASS — 47 HTML files, 619 references |
| English-only content and language direction | PASS — every root `lang="en" dir="ltr"`; Arabic only in marked RTL vocabulary cells |
| Documentation, tests and repository text are English | PASS — 98 files scanned, no Arabic script |
| Shared page standard | PASS — four content pages load the step navigator; menu opts out |
| Source activity counts and blanks | PASS |
| Original source images preserved byte-for-byte | PASS — 6 SHA-256 matches |
| Test structure / exact quiz fixture | PASS — 20 questions, 60 options, 16 explicit, 4 inferred |
| Teacher resource links and counts | PASS — 40 links resolve, 8 matrix rows match the pages |
| Teacher portal pages are directory-only | PASS |
| C-2 gate separation, disclosure, print selectors | PASS — seven keyed tests |
| Pupil-facing lesson-test counts | PASS — 8 lessons, every stated count matches the real page |
| Grade 5 Lesson 3 pages follow the standard | PASS |
| Grade 5 Lesson 3 exercise order | PASS — PB 1–9 + Pronunciation, WB 1–7, in printed order |
| Grade 5 Lesson 3 Pupil’s Book controls | PASS |
| Grade 5 Lesson 3 Workbook controls | PASS |
| Grade 5 Lesson 3 transcription traps | PASS |
| Grade 5 Lesson 3 sources are pinned | PASS — 6 scans + 15 crops hash-verified |

Also in `npm test`: `node --check` on the shared scripts and on `grade5-unit1-lesson3.js`, and the C-3 content-integrity suite — **PASS**, “47 HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence”. The baseline was regenerated with `--write` so the five new pages are recorded from their published state.

## 3. Browser suites — every spec actually run

| Spec | Result | What it covered |
|---|---|---|
| `node tests/grade5-unit1-lesson3.browser.mjs` | **PASS** (6 checks) | This lesson’s pages, end to end |
| `node tests/english-curriculum.browser.mjs` | **PASS** | 47 pages desktop + 390 px, 7 scored quizzes, 8 print-cleanup tests, 7 keyed gates |
| `node tests/c3-accessibility.browser.mjs` | **PASS** | Duplicate IDs, ARIA references, 140 reveals, 8 test pages, gates, mobile and forced colours |
| `node tests/c3-scoring.browser.mjs` | **PASS** | Exact numeric scoring for 8 quizzes including this one, plus 8 in-memory mutations rejected |
| `node tests/teacher-portal.browser.mjs` | **PASS** | 12 portal viewport combinations, 72 destinations HTTP 200, 8-row matrix |
| `node tests/phase1-design-foundation.browser.mjs` | **PASS** | Shared design system |
| `node tests/phase2-a-navigation.browser.mjs` | **PASS** | Shared navigation |
| `node tests/grade4-unit1-lesson2.browser.mjs` | **PASS** | Earlier lesson unaffected |
| `node tests/grade3-unit1-lesson2.browser.mjs` | **PASS** | Earlier lesson unaffected |

### What the Lesson 3 spec proves

- All five pages load with `lang="en"`, `dir="ltr"` and no horizontal overflow at 1366×900.
- **46** printed choices, **30** writing lines and **2** printed phrase selections on the Pupil’s Book page are all answerable, and every one of them survives a reload and a round trip to another lesson page.
- **7** matching selects, **6** ordering fields, **12** clock labels, **4** listening items over **8** options, **6** chart fields, **7** corrections, **3** routine boxes and **6** writing boxes on the Workbook page are all answerable, and all survive a reload.
- The twelve clock labels hold **no printed time text** — the assertion fails if `past`, `to` or `o’clock` ever appears inside a label.
- The passage reproduces exactly `(1) (2) (3) (4) (5) (7) (8)` and the assertion fails if a `(6)` is ever added.
- Workbook exercise 4 states that the recording was not supplied, and the page contains no `<audio>` element.
- The test scores **20/20**, **0/20** and **19/20 with one unanswered** exactly, a reset clears every feedback line and the score, a wrong password keeps the key closed, the shared password opens it, and the hide button closes it.
- Every page links to the other four, and the shared shell resolves the lesson title “Daily Routines”.
- At 390×844 all five pages stay inside the viewport and the clock labels remain reachable and usable.

## 4. Screenshots

`test-results/grade5-unit1-lesson3/`:

- `pupil-book-desktop.png`
- `workbook-desktop.png`
- `test-desktop.png`
- `pupil-book-mobile.png`
- `workbook-mobile.png`

## 5. Known limitations

1. **No audio.** Pupil’s Book activities 1 and 2 and Workbook exercise 4 need recordings that were not supplied. All printed content is present and answerable, nothing is scored, and no transcript was invented.
2. **Workbook exercise 3 placement.** The twelve labels are blank in the book and are drawn as brush strokes, so no label-by-label key is published. The bank of twelve expressions and the time shown by the hands (**twenty-five to five**) are stated.
3. **Workbook exercise 6a number (6).** Not printed in the book. Seven corrections are given for the seven visible markers; the eighth box has no invented content.
4. **Pupil’s Book 6a items 1 and 5.** The passage does not mention weekends or Saturdays, so these two are reported as not settled by the text.
5. **Teacher gate is a display aid.** As in every other lesson in this project the password is client-side and the key is present in the page source; the page says so.
6. **The test’s inferred questions.** Four of the twenty are labelled as inferences, where the book prints no key and the answer follows from a printed chart or the printed grammar box. Each one says so in its feedback and in the teacher key. A fifth candidate — "which order makes *Do they go to school on foot?*" — was **removed** in final review: both *to school on foot* and *on foot to school* are correct English, so the item had no single unambiguous answer. It was replaced by a direct comprehension question from Emma's passage (the time she wakes up), not by an invented one.
7. **Print.** The lesson-page link strip and the reveal buttons are hidden in print, matching the rest of the project.
