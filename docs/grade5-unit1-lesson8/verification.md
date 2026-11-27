# Verification — Grade 5, Unit 1, Lesson 8 “Inventions”

Everything below was run on the task branch after the lesson was built from the six supplied scans. The Lesson Test follows the permanent **Independent Lesson Test Policy** ([`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md)).

## 1. Files and scope

| File | Purpose |
|---|---|
| `grade5-unit1-lesson8.html` | Lesson menu (`data-nav-page="menu"`, no step navigator) |
| `grade5-unit1-lesson8-pupil-book.html` | Pupil’s Book pages, in printed order |
| `grade5-unit1-lesson8-workbook.html` | Workbook pages, in printed order |
| `grade5-unit1-lesson8-vocabulary.html` | 33 headwords with Arabic meanings, plus grammar notes |
| `grade5-unit1-lesson8-test.html` | 18-question independent lesson test and teacher key |
| `grade5-unit1-lesson8.css` | Lesson stylesheet (shared design tokens, lesson-prefixed classes) |
| `grade5-unit1-lesson8.js` | Answer persistence, counters, test scoring, reset and teacher gate |
| `assets/grade5-unit1-lesson8/` | Six unmodified source scans, `9` derived crops, and both manifests |
| `tests/grade5-unit1-lesson8.mjs` | Static checks: sources, crops, page standard, controls, vocabulary, test/fixture agreement |
| `tests/grade5-unit1-lesson8.quiz.json` | The 18 questions as data, compared question by question with the rendered page |
| `tests/grade5-unit1-lesson8.browser.mjs` | Browser checks: persistence, counters, reveals, scoring, reset, gate, phone layout |
| `docs/grade5-unit1-lesson8/` | This verification note, the source checklist and the source-defect record |

## 2. Answerable controls (pinned by the tests)

| Page | Radios | Text lines | Number fields | Selects | Textareas | Tick boxes | Reveals |
|---|---|---|---|---|---|---|---|
| Pupil’s Book | 15 | 11 | 5 | 5 | 1 | 0 | 3 |
| Workbook | 13 | 14 | 5 | 4 | 0 | 3 | 3 |

Every control persists to `localStorage` under a lesson-specific prefix and survives a reload and a round trip to another lesson page. Counters start at zero and move when the corresponding group is answered.

## 3. Sources and crops

- Six scans, byte-for-byte, each with a pinned SHA-256 value.
- 9 crops, each an exact rectangle of its unchanged source; the test re-cuts every crop and compares hashes.
- Every crop referenced by a page exists; no page loads an image that is not in the manifest.

## 4. Honesty notices

- The missing recordings are disclosed in two places on the Pupil’s Book page and one place on the Workbook page. No audio file was created and no audio element appears anywhere.
- No book page carries a `data-correct` attribute: keys live only in the reveal panels, and each panel states whether it is a printed answer, a picture-derived answer, or an open prompt.
- Unscored by decision: see `source-defects.md`.

## 5. The lesson test

- 18 questions: 13 multiple-choice · 3 true or false · 2 written.
- At least six declared objectives, each question mapped to one.
- No question cites a page, exercise or activity number; no question reuses a lesson image.
- Answer positions balanced (no position used more than eight times).
- The teacher key sits outside the pupil form, lists all 18 items with their objective and explanation, and the page states plainly that the gate is not authentication.

## 6. Commands

```bash
node --check grade5-unit1-lesson8.js
node tests/grade5-unit1-lesson8.mjs
node tests/grade5-unit1-lesson8.browser.mjs
```
