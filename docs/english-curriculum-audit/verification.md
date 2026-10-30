# English Curriculum: Full-Site Language Audit

**Audit date:** 30 October 2026 (UTC)
**Branch:** `arena/9d234583-e-curriculum-1-9`
**Status:** Audit and repairs are stabilized; the latest static and rendered browser checks pass. The change set is intended for review through a pull request against `main`. No merge or deployment has occurred.

This report documents the English-language audit across the complete current site, including lesson pages, navigation, Vocabulary pages, assessments, tests, documentation, source assets, and rendered browser QA. Grade 3 Unit 1 Lesson 2 has a separate [source checklist](../grade3-unit1-lesson2/source-checklist.md) and [detailed verification report](../grade3-unit1-lesson2/verification.md).

## Requirements and outcome

- English-only learner-facing material across every existing grade, unit, lesson, page, activity, assessment, and site page.
- Arabic is retained only as a word-level meaning for an English vocabulary item inside a Vocabulary section. Those nodes carry `class="ar" lang="ar" dir="rtl"`; every page root remains `lang="en" dir="ltr"`.
- No Arabic explanations, sentence or paragraph translations, questions, instructions, feedback, accessible labels, or interface text remain. Grammar explanations and examples are in English.
- Existing English textbook wording, exercises, answers, learning goals, listening tasks, and navigation are preserved. Missing audio, missing photographs, ambiguous source items, and inferred answers are disclosed rather than filled in with invented content.
- Grade 5 Unit 1 Lesson 1 distinguishes obligation from lack of necessity: **“don’t have to” means something is not necessary; it does not mean “must not”.**
- Grade 3 Unit 1 Lesson 2 Workbook page 6 keeps its original scan and all source crops byte-for-byte. The scan, the full listening-exercise crop, and the item-2 crop include Arabic calligraphy in one subject icon; none is displayed to learners. The learner-facing exercise uses a separate labelled English-normalised derivative with “AR”; no original is silently edited or discarded.

The initial text scan found **343 Arabic-bearing lines across 36 files**. The final scan leaves no disallowed Arabic in non-Vocabulary HTML, interface text, tests, code, or Markdown. An independent scan of **62 UTF-8 text files** found Arabic script in exactly the six Vocabulary pages listed below, all within marked word-level meanings or recall data. The node count is not a unique-word count; a repeated prompt may count separately.

| Vocabulary page | Visible Arabic meaning nodes | Arabic code points in page source |
|---|---:|---:|
| Grade 3 Unit 1 Lesson 1 | 19 | 167 |
| Grade 3 Unit 1 Lesson 2 | 36 | 326 |
| Grade 4 Unit 1 Lesson 1 | 19 | 97 |
| Grade 5 Unit 1 Lesson 1 | 19 | 244 |
| Grade 5 Unit 1 Lesson 2 | 37 | 265 |
| Grade 8 Unit 1 Lesson 1 | 50 | 562 |
| **Total** | **180** | **1,661** |

Two Vocabulary-page recall-data arrays account for **142 of those code points** (81 on Grade 3 Lesson 1 and 61 on Grade 5 Lesson 1); both arrays hold individual word meanings for recall interactions. No Arabic Unicode text remains elsewhere in the scanned repository text. The preserved Grade 3 Workbook p. 6 scan, full listening-exercise crop, and item-2 crop contain Arabic calligraphy in a subject icon; all three original image assets are retained but none is shown to learners, who see the labelled English-normalised derivative instead.

## Pages inspected

All **35 root HTML pages** were reviewed, statically audited, and loaded in Chromium:

- **Grade 3, Unit 1, Lesson 1:** menu, Pupil’s Book, Workbook, Vocabulary, Lesson Test.
- **Grade 3, Unit 1, Lesson 2:** menu, Pupil’s Book, Workbook, Vocabulary, Lesson Test.
- **Grade 4, Unit 1, Lesson 1:** menu, Pupil’s Book, Workbook, Vocabulary, Lesson Test.
- **Grade 5, Unit 1, Lesson 1:** menu, Pupil’s Book, Workbook, Vocabulary, Lesson Test.
- **Grade 5, Unit 1, Lesson 2:** menu, Pupil’s Book, Workbook, Vocabulary, Lesson Test.
- **Grade 8, Unit 1, Lesson 1:** menu, Student’s Book, Workbook, Vocabulary and English Grammar Notes, Lesson Test.
- **Site pages:** `index.html`, `lesson-menu.html`, `lesson.html`, `lessons.html`, and `round-tests.html`.

The two Grade 4 book pages were already English and did not require content edits. All other files in the above page groups were changed as listed below; global page metadata and shared labels were corrected where needed.

## Files changed

### Learner-facing HTML

- **Grade 3 Unit 1 Lesson 1:** `grade3-unit1-lesson1.html`, `grade3-unit1-lesson1-pupil-book.html`, `grade3-unit1-lesson1-workbook.html`, `grade3-unit1-lesson1-vocabulary.html`, `grade3-unit1-lesson1-test.html`.
- **Grade 3 Unit 1 Lesson 2:** `grade3-unit1-lesson2.html`, `grade3-unit1-lesson2-pupil-book.html`, `grade3-unit1-lesson2-workbook.html`, `grade3-unit1-lesson2-vocabulary.html`, `grade3-unit1-lesson2-test.html`.
- **Grade 4 Unit 1 Lesson 1:** `grade4-unit1-lesson1.html`, `grade4-unit1-lesson1-vocabulary.html`, `grade4-unit1-lesson1-test.html`.
- **Grade 5 Unit 1 Lesson 1:** `grade5-unit1-lesson1.html`, `grade5-unit1-lesson1-pupil-book.html`, `grade5-unit1-lesson1-workbook.html`, `grade5-unit1-lesson1-vocabulary.html`, `grade5-unit1-lesson1-test.html`.
- **Grade 5 Unit 1 Lesson 2:** `grade5-unit1-lesson2.html`, `grade5-unit1-lesson2-pupil-book.html`, `grade5-unit1-lesson2-workbook.html`, `grade5-unit1-lesson2-vocabulary.html`, `grade5-unit1-lesson2-test.html`.
- **Grade 8 Unit 1 Lesson 1:** `grade8-unit1-lesson1.html`, `grade8-unit1-lesson1-pupil-book.html`, `grade8-unit1-lesson1-workbook.html`, `grade8-unit1-lesson1-vocabulary.html`, `grade8-unit1-lesson1-test.html`.
- **Shared site pages:** `index.html`, `lesson-menu.html`, `lesson.html`, `lessons.html`, `round-tests.html`.

### Shared behavior, tests, source handling, and documentation

- `lesson-content-navigation.js` — English/LTR defaults and responsive, normal-flow mobile navigation; nested quiz forms are handled safely.
- `grade3-unit1-lesson2.js`, `grade3-unit1-lesson2.css` — English feedback, LTR layout, and locally bundled Arabic font styling for permitted vocabulary meanings.
- `tests/check-site.mjs` — root metadata/direction, marked Vocabulary exception, local links, source integrity, and a repository-wide scan of non-Vocabulary text.
- `tests/grade3-unit1-lesson2.browser.mjs`, `tests/grade3-unit1-lesson2.quiz.json` — source, interaction, scoring, navigation, and responsive coverage.
- `tests/english-curriculum.browser.mjs` — desktop/mobile full-site audit, rendered language/direction and local-font checks, targeted Grade 8/Grade 5 content checks, and assessment scoring smoke tests.
- `package.json` — runs both browser suites from `npm run test:browser`.
- `assets/grade3-unit1-lesson2/crops/workbook-page-6-listen-row-2-english-display.png` — labelled display-only derivative; the original scan, full listening-exercise crop, and item crop remain unchanged and are not displayed.
- `docs/grade3-unit1-lesson2/source-checklist.md`, `docs/grade3-unit1-lesson2/verification.md`, and their `evidence/` reports/screenshots; this report and the full-site evidence in `docs/english-curriculum-audit/evidence/`.

## Static and functional evidence

### Static and source-integrity checks

`npm test` runs `tests/check-site.mjs` plus JavaScript syntax checks. The final passing run verifies:

- **35 HTML pages** and **181 local page/asset references** resolve.
- All page roots are English/LTR; Arabic markup is limited to marked Vocabulary meanings.
- No Arabic script in non-Vocabulary code, documentation, tests, or learner-facing pages; the test scans **55 non-Vocabulary text files**.
- The Grade 3 Lesson 2 source page/activity counts, navigation structure, quiz fixture, and answer-key state.
- **Six SHA-256 source-image matches**, **27 original crops**, and one separately named English-normalised display derivative.
- All **43 local Markdown links** and **11 local CSS asset URLs** resolve.

The machine-readable static result is [static-report.json](../grade3-unit1-lesson2/evidence/static-report.json).

### Rendered Chromium checks

`npm run test:browser` runs the dedicated Grade 3 Lesson 2 suite and the full-curriculum browser audit in **Chromium 153.0.8010.0**.

- Rendered every root HTML page at **1366×900** and **390×844**. All 35 pages had `lang=en`/`dir=ltr` roots; browser assertions checked computed direction throughout, with RTL permitted only inside marked Vocabulary meanings. No unmarked Arabic or page-level horizontal overflow was found.
- Loaded and verified the locally bundled **Noto Sans Arabic** font for all six Vocabulary pages so the permitted Arabic meanings render legibly even when external Google Fonts are blocked.
- Opened all source-image disclosures and decoded **31 rendered images**; every displayed image had alt text.
- Verified Grade 8 Student’s Book photo prompts, the vocabulary summary, tense-navigation/explanations, and the unavailable-audio note in their actual rendered lesson steps.
- Verified the Grade 5 “don’t have to” explanation in the rendered Pupil’s Book page.
- Selected one option in every multiple-choice group and submitted five existing assessments (Grade 3 Lesson 1, Grade 4 Lesson 1, Grade 5 Lessons 1 and 2, and Grade 8 Lesson 1); each produced scoring feedback and kept teacher answers hidden.
- The Grade 3 Lesson 2 suite passed **12 checks** across **1366×900, 768×1024, 390×844, and 320×740**, including source transcription, interactions, all quiz scoring states, answer-key gating, keyboard input, links, and responsive rendering.
- No JavaScript page errors or local HTTP responses with status 400 or higher occurred in the passing browser run.

Machine-readable results: [full-curriculum browser report](evidence/browser-report.json), [Grade 3 Lesson 2 browser report](../grade3-unit1-lesson2/evidence/browser-report.json), and [static report](../grade3-unit1-lesson2/evidence/static-report.json).

## Screenshots and evidence

All screenshots below are captures of actual Chromium-rendered pages. More Grade 3 Lesson 2 viewport and quiz evidence is linked from its [verification report](../grade3-unit1-lesson2/verification.md).

- [Grade 8 Student’s Book, desktop](evidence/grade8-students-book-desktop.png) — page 6 photo-discussion prompts and English source note.
- [Grade 8 Student’s Book, mobile](evidence/grade8-students-book-mobile-390.png) — 390×844 responsive layout; navigation stays in normal flow.
- [Grade 8 Student’s Book key words](evidence/grade8-students-book-key-words-desktop.png) — printed vocabulary summary and its English definitions.
- [Grade 8 Student’s Book grammar instruction](evidence/grade8-students-book-grammar-desktop.png) — the printed tense-revision task.
- [Grade 8 Student’s Book listening note](evidence/grade8-students-book-listening-desktop.png) — original listening activity retained with unavailable-audio disclosure.
- [Grade 8 Vocabulary table](evidence/grade8-vocabulary-table-desktop.png) — printed word list, English definitions, and visible word-level Arabic meanings.
- [Grade 8 Present Simple notes](evidence/grade8-vocabulary-grammar-desktop.png), [Present Progressive](evidence/grade8-vocabulary-present-progressive-desktop.png), and [Future Tense](evidence/grade8-vocabulary-future-tense-desktop.png) — all grammar explanations in English.
- [Grade 5 Pupil’s Book](evidence/grade5-pupil-book-desktop.png) — obligation and lack-of-necessity explanation.
- [Grade 3 Workbook display](evidence/grade3-workbook-display-desktop.png) — English-normalised “AR” icon in the preserved listening activity.

## Limits and explicitly unverified items

- The six Grade 8 photographs referenced by the Student’s Book speaking task were not supplied in the source intake. The English prompt is preserved and pupils are directed to the printed book; no replacement photographs were invented.
- Official audio recordings are unavailable for the affected listening activities. Tasks remain in English; no recordings, scripts, transcripts, or audio-dependent answers were fabricated.
- Some answer guidance is derived from supplied text or images rather than an official publisher key and is labelled as inferred. Ambiguous items remain disclosed; the Grade 3 Wednesday dialogue/timetable difference is preserved rather than silently reconciled.
- The Arabic word meanings are editorial support, not publisher-provided text; a teacher review of translation accuracy is advisable.
- External Google Fonts were blocked in the smoke test. Local fonts were used where bundled; English typography may differ slightly from an online-font environment. The Arabic font was locally bundled and explicitly verified on all Vocabulary pages.
- No physical-device, screen-reader, print, Safari, or Firefox tests were performed. Chromium viewport checks are not a substitute for those environments.

## Git workflow

Work is on the existing Arena branch shown above. The audit has not been merged or deployed. The requested pull request is against `main`; it will remain open for review and await explicit approval. The screenshots and reports are retained under `docs/`, while transient browser output remains in ignored `test-results/`.
