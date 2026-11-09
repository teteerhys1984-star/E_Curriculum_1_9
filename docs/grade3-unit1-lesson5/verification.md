# Grade 3 · Unit 1 · Lesson 5 — implementation verification

Lesson: **Revision 1**

Branch: `arena/412788d3-e-curriculum-1-9`

Authoritative source: the six supplied PNG scans (images 7–12) only. The page-by-page transcription and response-space inventory is in [source-checklist.md](source-checklist.md).

## Pages delivered

| Page | Path |
|---|---|
| Lesson home | [grade3-unit1-lesson5.html](../../grade3-unit1-lesson5.html) |
| Pupil’s Book | [grade3-unit1-lesson5-pupil-book.html](../../grade3-unit1-lesson5-pupil-book.html) |
| Workbook | [grade3-unit1-lesson5-workbook.html](../../grade3-unit1-lesson5-workbook.html) |
| Vocabulary | [grade3-unit1-lesson5-vocabulary.html](../../grade3-unit1-lesson5-vocabulary.html) |
| Independent Lesson Test | [grade3-unit1-lesson5-test.html](../../grade3-unit1-lesson5-test.html) |

Local assets: [source manifest](../../assets/grade3-unit1-lesson5/source-manifest.json), [crop manifest](../../assets/grade3-unit1-lesson5/crops-manifest.json). Six originals are byte-identical to the uploads; **19 activity crops** are direct crops, including 4× label crops for the small printed labels on the school picture.

## Source coverage

### Pupil’s Book — five activities, pages 15–17

1. **Look, read then Tick ✓ or cross ✗.** The school picture with all five printed labels (Classroom ×2, Laboratory, Library, SCHOOL) plus five checked ✓/✗ statements (✗ ✓ ✗ ✓ ✗).
2. **Listen then complete the table.** The Sally table with its printed `2` preserved; the three audio-dependent cells stay empty and unscored.
3. **Listen and tick ✓.** The `oo / ou / ea / oa` phonics table, reproduced unscored with its printed words.
4. **Read, match then circle.** The three bracketed pairs checked against the printed sentences; the picture column kept in printed order with the mismatch disclosed, not “fixed”.
5. **Project.** The five-senses flower with a sense choice, personal petal notes and a drawing canvas.

### Workbook — six exercises, pages 15–17

1. **Read and match.** Five sentences to five pictures, checked.
2. **Odd one out.** Row 1’s printed circle on *gym* kept; rows 2–4 checked (Arabic, cake, computer).
3. **Listen and tick (✓).** Four picture pairs, unscored.
4. **Complete and say.** The dot-to-dot reproduced unchanged; three personal number-word lines saved but unscored.
5. **Write.** Science + Music, English + Maths and Art scored; the fourth open item kept personal.
6. **Look, match then write.** broom → `oo`, goat → `oa`, house → `ou`, eat → `ea`, with the book’s printed example line clearly attributed to the book and the printed column mismatch disclosed.

## Vocabulary and test

- Vocabulary: **53 lesson-only English entries** with editorial Arabic meanings and a source page reference each. English stays LTR; only meaning cells are RTL. No Lesson 4-only word is included.
- Test: **exactly 20 independent questions** — 12 multiple choice, 4 True/False, 4 written responses, **17 objectives**. New pupils, a new school passage, a new weekly subject table and new number/phonics items are used; no textbook item is copied.
- Verified scoring: 20/20 with the published key; 19/20 after one wrong edit; stale-score clearing; partial/unanswered counting; persistence; reset clearing fields, score and storage; and a teacher gate closed on a wrong password and open only on the project password.

## Integration and protected existing content

- Added to `platform-shell.js`, the Grade 3 listing (**five** lessons), home and teacher directories, `round-tests.html`, the teacher status matrix (**twelve** rows, eleven published key areas), `package.json` scripts and the CI evidence path.
- The Lesson 5 menu links back to Lesson 4 and shows no invented next lesson, because no later Grade 3 lesson has been supplied.
- C-3: [c3-content-extension.json](../../tests/c3-content-extension.json) lists the ten new pages and the exact reviewed integration edits; all 52 original baseline pages still hash-match after those edits are reversed.
- Lesson 4 and Lesson 5 keep separate practice buckets (`efc_grade3_unit1_lesson4_practice_v1:*`, `efc_grade3_unit1_lesson5_practice_v1:*`), separate test keys and separate teacher gates; the browser suites assert that neither lesson’s state appears on the other’s pages.

## Actual validation results

| Command | Result |
|---|---|
| `npm test` | **PASS** (exit 0) — all three Grade 3 static suites, site audit and C-3 integrity. |
| `npm run test:browser` | **PASS** (exit 0) — full chained suite, 112 PASS assertions. |
| `npm run test:lesson5:static` | **PASS** — 7 groups (27/19 crop manifests, 33 printed blocks, 11 instructions, 53 vocabulary pairs, 20-question key, independence, integration). |
| `npm run test:lesson5:browser` | **PASS** — 10 groups: listing, five pages, rendered fidelity, 53 vocabulary pairs, Pupil’s Book practice, project drawing, six Workbook exercises, the 20-question test, five viewports and zero console/HTTP errors. Report: `test-results/grade3-unit1-lesson5/report.json` (PASS, Chromium 153.0.8010.0). |
| `git diff --check` | **PASS** — exit 0. |

SHA-256 verification (executed): all six originals match their manifest hashes and PNG header dimensions, and all 19 crops match recorded hashes, sizes and boxes; each crop is referenced by a page.

## Drawing verification

The Project canvas uses the Lesson 3 contract (pointer/touch, keyboard arrows + Space, colours, eraser, undo, PNG download `my-senses-flower.png`, per-page persistence, clear). Verified in Chromium: pointer stroke, keyboard stroke, undo, download filename, persistence across reload, clear, no leak into the Workbook bucket, and no Lesson 4 practice state.

## Limitations and honest boundaries

- **Original audio is unavailable** for Pupil’s Book Activities 2 and 3 and Workbook Exercise 3. The Sally table cells, the phonics ticks and the four listening pairs are therefore unscored; no answers or transcripts were invented.
- Workbook Exercise 6’s printed sound column and dotted-word column disagree row by row. Both are shown as printed; the inferred word-level key is labelled inferred.
- The teacher password is a display convenience, **not secure authentication**.
- No merge and no deployment were performed.
