# English Curriculum Audit and Verification Report

**Audit date:** 30 October 2026 (UTC)
**Status:** Current static and rendered checks pass. The change set is intended for review through a pull request against `main`. No merge or deployment has been performed.

This report records the wider audit and the Grade 3, Unit 1, Lesson 2 evidence. The full-site [English Curriculum Audit](../english-curriculum-audit/verification.md) contains the exhaustive page/file lists; the separate [source checklist](source-checklist.md) records the Grade 3 page-by-page transcription review.

## Scope and outcome

- Audited every root HTML page in the repository: **35 pages**.
- Static checks verify English root metadata (`lang="en"`, `dir="ltr"`) and flag Arabic outside explicitly marked Vocabulary meanings. The six Vocabulary pages retain Arabic only for individual word or vocabulary-item meanings, in elements marked `class="ar" lang="ar" dir="rtl"`.
- No Arabic remains in non-Vocabulary learner-facing HTML, interface text, accessible labels, image alt text, tests, or Markdown documentation. Full-sentence translations and Arabic explanations were removed or translated into English.
- English source passages, questions, answer choices, objectives, listening tasks, navigation, and functionality were preserved. Grammar notes are in English.
- The Grade 5 Unit 1 Lesson 1 explanation distinguishes obligation from lack of necessity: **“don’t have to” means something is not necessary; it does not mean “must not”.**
- The Grade 3 Workbook page 6 source scan, full listening-exercise crop, and item-2 crop remain unchanged. Because one subject icon contains Arabic calligraphy, none of these original assets is displayed; the learner-facing page uses a separate, clearly named English-normalised display derivative labelled “AR”.

The initial repository scan found **343 Arabic-bearing text lines across 36 files**. The final automated audit confirms zero disallowed Arabic script in non-Vocabulary HTML and in the audited tests/docs/code; **55 non-Vocabulary text files** are scanned by `npm test`. The six Vocabulary pages contain **180 visible Arabic text nodes**, all explicitly marked as word-level meanings, plus 142 Arabic code points in two Vocabulary-page recall-data arrays. No Arabic remains in other repository text. The scan does not treat embedded text in images as HTML text; the known Workbook page 6 icon is documented above and handled with a derivative.

## Checks actually run

### Static checks

`npm test` runs the static site/source-integrity suite and JavaScript syntax checks. The passing suite verifies:

- 35 root HTML pages and **181 local page/asset references** resolve; duplicate IDs are absent and all images have alt attributes.
- English/LTR root metadata throughout; Arabic text and direction are restricted to marked Vocabulary meanings.
- The five Grade 3 Lesson 2 pages, page structure, step navigation, local links, source image checksums, source activity counts, and quiz fixture.
- Six source-image SHA-256 matches; **27 original source crops plus one English-normalised display derivative**.
- The Grade 3 Lesson 2 test contains 20 questions and 60 options, with 15 direct readings and 5 explicitly labelled inferences; prompts, choices, references, and answer indices match the fixture.
- All **43 local Markdown links** and **11 local CSS asset URLs** resolve.

The machine-readable result is [static-report.json](evidence/static-report.json).

### Rendered browser checks

`npm run test:browser` runs the Grade 3 Lesson 2 interaction suite and the full-curriculum browser audit using **Chromium 153.0.8010.0**.

**Grade 3 Unit 1 Lesson 2:**

- Opened the rendered Grade 3 listing and all five lesson pages; verified section indexes, Previous/Next behaviour, return links, source transcription, and image decoding.
- Tested the Workbook listening controls without scoring or inventing an answer; tested reveal/reset controls, written blanks, and personal writing persistence.
- Tested quiz states: empty **0/20**, all wrong **0/20**, all correct **20/20**, one wrong **19/20**, and one answered **1/20**; changing an answer clears a stale score, and reset clears answers and closes the key.
- Tested the teacher-key display gate with empty, incorrect, and existing project passwords; confirmed the key is initially hidden and can be re-locked.
- Tested keyboard radio selection and English feedback direction.
- The dedicated Grade 3 suite passed **12 checks** across **1366×900, 768×1024, 390×844, and 320×740**. No page-level horizontal overflow was found.

**Full curriculum:**

- The full-curriculum suite passed **7 checks** after loading all **35 HTML pages at 1366×900 and 390×844**. All rendered with `lang=en`/`dir=ltr` roots; computed direction was checked throughout, with RTL limited to marked Vocabulary meanings. No unmarked Arabic or page-level horizontal overflow was found.
- Opened source disclosures and decoded **31 rendered images**; all displayed images had alt text.
- Loaded and verified the locally bundled Noto Sans Arabic font on all six Vocabulary pages so the permitted word meanings render legibly without external font access.
- Selected one option in every multiple-choice group and submitted five existing Grade 3 Lesson 1, Grade 4 Lesson 1, Grade 5 Lessons 1 and 2, and Grade 8 Lesson 1 assessments; each produced scoring feedback and kept teacher answers hidden.
- Verified the Grade 8 Student’s Book photo prompts, key-word section, tense instruction, and unavailable-audio note in their actual navigable steps.
- Verified Grade 8 Vocabulary word meanings and English present-simple, present-progressive, and future-tense explanations.
- Verified the Grade 5 “don’t have to” distinction in the rendered Pupil’s Book page.
- No JavaScript page errors or local HTTP responses with status 400 or higher occurred during the passing runs.

The full-curriculum browser result is [browser-report.json](../english-curriculum-audit/evidence/browser-report.json). The Grade 3 Lesson 2 browser report is [browser-report.json](evidence/browser-report.json).

External Google Fonts requests were blocked in the full-curriculum smoke test so that it did not depend on outbound access; pages rendered with bundled fonts where supplied and browser fallbacks otherwise. The locally bundled Noto Sans Arabic font was explicitly loaded and verified on all six Vocabulary pages. English typography may differ slightly from an online-font environment.

## Screenshots reviewed

These are captures from the actual Chromium runs, not mock-ups.

| Screenshot | What it shows |
|---|---|
| [Grade 8 Student’s Book, desktop](../english-curriculum-audit/evidence/grade8-students-book-desktop.png) | Page 6 unit opener and the photo discussion prompts |
| [Grade 8 Student’s Book, mobile](../english-curriculum-audit/evidence/grade8-students-book-mobile-390.png) | 390×844 layout with the mobile step navigator in normal flow |
| [Grade 8 Vocabulary table](../english-curriculum-audit/evidence/grade8-vocabulary-table-desktop.png) | Printed key words, English definitions, and individually marked Arabic meanings |
| [Grade 8 English grammar notes](../english-curriculum-audit/evidence/grade8-vocabulary-grammar-desktop.png) | Present-simple explanation in English |
| [Grade 5 Pupil’s Book grammar](../english-curriculum-audit/evidence/grade5-pupil-book-desktop.png) | Obligation and the “don’t have to” distinction |
| [Grade 3 Workbook display derivative](../english-curriculum-audit/evidence/grade3-workbook-display-desktop.png) | Page 6 listening exercise with “AR” in place of calligraphy |
| [Grade 3 lesson menu](evidence/menu-desktop-1366.png) | Lesson section cards |
| [Grade 3 Pupil’s Book](evidence/pupil-book-desktop-1366.png) | Source dialogues and lesson layout |
| [Grade 3 Workbook](evidence/workbook-desktop-1366.png) | Listening choices and unavailable-audio note |
| [Grade 3 Vocabulary](evidence/vocabulary-desktop-1366.png) | English Vocabulary UI and marked word meanings |
| [Grade 3 mobile timetable](evidence/pupil-book-table-mobile-viewport.png) | Horizontally scrollable timetable at a mobile viewport |
| [Grade 3 mobile Workbook table](evidence/workbook-table-mobile-viewport.png) | Workbook table and blanks in their own scroll region |
| [Grade 3 test result](evidence/quiz-score-20-of-20.png) | English score and feedback after all 20 correct answers |
| [Grade 3 teacher key](evidence/teacher-key-open.png) | Key evidence and inference labels |

## Source and audio limitations

- The six Grade 8 photographs referenced by the Speaking activity are not included in the project’s source intake. The English instructions remain, and the page directs pupils to the printed book; no replacement photographs were invented.
- Official listening recordings are unavailable for the affected activities. Those tasks remain in English, are not scored where answers depend on audio, and have no fabricated recordings, scripts, transcripts, or answer keys.
- Some practice answers are deductions from the supplied material rather than publisher keys; they are labelled as inferred. The Wednesday dialogue/timetable difference is retained and documented, not silently reconciled.
- Arabic word meanings are supporting translations, not publisher-provided text; teacher review of their accuracy remains advisable.

## Re-run locally

Requirements: Node.js 22.17 or later; Python 3 is used by the optional static server.

```sh
npm ci --ignore-scripts
npm test
npm run test:browser
```

The browser tests write temporary captures and machine-readable reports to the ignored `test-results/` directory. Selected screenshots and reports are copied into the documentation evidence folders above.

## Files and workflow

The audit inspected all 35 root HTML pages, the two shared navigation scripts, lesson-specific CSS/JavaScript, image assets, fixtures, tests, Markdown documentation, and source-integrity files. Changes include English translations and language/direction corrections across the root pages; Vocabulary-only Arabic markup; shared LTR navigation defaults; the Grade 3 Workbook display derivative; the Grade 3 quiz fixture and browser/static checks; and these English reports and screenshots.

This work remains on the existing Arena branch. It has not been merged or deployed. No screen-reader, physical-device, print, Safari, or Firefox testing has been performed; the automated and Chromium evidence above should not be read as verification of those environments.
