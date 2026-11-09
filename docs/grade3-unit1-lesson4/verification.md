# Grade 3 · Unit 1 · Lesson 4 — implementation verification

Lesson: **My Five Senses**

Branch: `arena/412788d3-e-curriculum-1-9`

Authoritative source: the six supplied PNG scans (images 1–6) only. The page-by-page transcription and response-space inventory is in [source-checklist.md](source-checklist.md).

## Pages delivered

| Page | Path |
|---|---|
| Lesson home | [grade3-unit1-lesson4.html](../../grade3-unit1-lesson4.html) |
| Pupil’s Book | [grade3-unit1-lesson4-pupil-book.html](../../grade3-unit1-lesson4-pupil-book.html) |
| Workbook | [grade3-unit1-lesson4-workbook.html](../../grade3-unit1-lesson4-workbook.html) |
| Vocabulary | [grade3-unit1-lesson4-vocabulary.html](../../grade3-unit1-lesson4-vocabulary.html) |
| Independent Lesson Test | [grade3-unit1-lesson4-test.html](../../grade3-unit1-lesson4-test.html) |

Local assets: [source manifest](../../assets/grade3-unit1-lesson4/source-manifest.json), [crop manifest](../../assets/grade3-unit1-lesson4/crops-manifest.json). Six originals are byte-identical to the uploads; **27 activity crops** are direct crops, not redrawn illustrations.

## Source coverage

### Pupil’s Book — six activities, pages 12–14

1. **Listen and read.** Six dialogue panels in original order with every printed bubble. Listening is marked audio-required; no recording was supplied.
2. **Let’s learn!** All five sense verbs against their five pictures, checked interactively.
3. **Listen and repeat.** The printed film strip 10–50; each numeral or word accepted.
4. **Listen and tick ✓.** The full five-picture × five-sense grid, reproduced unscored because the ticks depend on the missing recording.
5. **Listen and sing.** All nine printed song lines in order, plus an optional personal line field and an optional drawing space, both disclosed as editorial and unscored.
6. **Listen to the following sounds and words, then repeat them.** The `oa` badge, `coat` and `goat` with both pictures, and two letter fields.

### Workbook — six exercises, pages 12–14

1. **Look and complete.** Five dotted word shapes reproduced exactly, five whole-word fields, checked.
2. **Fill in the spaces.** The five-word printed bank and five sentences, checked with hidden guidance.
3. **Read and circle.** Four printed bracketed pairs, checked; the book’s odd spacing preserved.
4. **Listen and circle the number you hear.** Four rows of printed options, **unscored**, no invented order.
5. **Write the missing numbers.** The pumpkin strip with printed 31–50 values kept and nine interactive blanks, checked.
6. **Look and write.** The printed model sentence and three cue pictures, checked with bounded answers.

Nothing printed was unreadable at source resolution.

## Vocabulary and test

- Vocabulary: **46 lesson-only English entries** with editorial Arabic meanings and a source page reference for each. English stays LTR; only meaning cells are `class="ar" lang="ar" dir="rtl"`. No Lesson 5 word appears.
- Test: **exactly 20 independent questions** — 12 multiple choice, 4 True/False, 4 written responses, **11 objectives**. New situations, a new room row, a new number pattern and an unseen passage are used; no textbook item is copied or lightly reworded.
- Every question carries one defensible key, `data-objective`, `data-objective-label` and an explanation. Written answers accept only bounded equivalents after case/space/final-punctuation normalisation.
- Verified scoring: 20/20 with the published key; 19/20 after one wrong edit; stale-score clearing on edit; partial and unanswered counting; persistence across reload; reset clearing all fields, the score and storage; and a teacher gate that stays closed on a wrong password.

## Integration and protected existing content

- Added to `platform-shell.js`, the Grade 3 listing (**five** lessons), the home and teacher directories, `round-tests.html`, the teacher status matrix (**twelve** rows, eleven published key areas), `package.json` scripts and the CI evidence path.
- Lesson 3’s menu previously said Lesson 4 “has not been supplied”; that sentence and its disabled Next control were corrected to point at Lesson 4, so the 3 → 4 → 5 chain is honest in both directions.
- The original C-3 baseline hashes are unchanged. [c3-content-extension.json](../../tests/c3-content-extension.json) explicitly allows the ten new pages and the exact reviewed shared-integration edits; the integrity checker reverses those edits before comparing with the original hashes.
- Grade 3 Lessons 1–3 pages, scripts and state are unmodified apart from the corrected Lesson 3 menu sentence; their suites still pass.

## Actual validation results

| Command | Result |
|---|---|
| `npm test` | **PASS** (exit 0) — Lesson 3, 4 and 5 static suites (7 groups each), site link/asset audit, English-only and language-direction audit, and C-3 integrity: 52 original pages preserved, 15 reviewed additions. |
| `npm run test:browser` | **PASS** (exit 0) — the full chained browser suite, 112 PASS assertions, including this lesson, Lesson 3, shared accessibility, scoring, teacher portal, navigation and root-page audits. |
| `npm run test:lesson4:static` | **PASS** — 7 groups. |
| `npm run test:lesson4:browser` | **PASS** — 10 groups: listing, all five pages, rendered fidelity (41 source blocks, 12 instructions), 46 vocabulary pairs, Pupil’s Book practice, drawing, all six Workbook exercises, the 20-question test, five viewports (1440/1024/768/390/320) and zero console/HTTP errors. Report: `test-results/grade3-unit1-lesson4/report.json` (PASS, 2026-11-09T21:09:02Z, Chromium 153.0.8010.0). |
| `git diff --check` | **PASS** — exit 0, no whitespace errors. |

SHA-256 verification (executed): all six originals match their manifest entries and PNG header dimensions, and all 27 crops match their recorded hashes, sizes and crop boxes; each crop is referenced by a page.

## Drawing verification

The optional drawing space added to Activity 5 uses the same interaction contract as Lesson 3: pointer/touch strokes, keyboard drawing (arrows move, Space toggles), pen colours, eraser, undo, PNG download (`my-senses-song.png`), per-page `localStorage` persistence and clear. Verified in Chromium: pointer stroke, keyboard stroke, undo, download filename, persistence across reload, clear, and confirmation that nothing leaks into the Workbook page bucket.

## Limitations and honest boundaries

- **Original audio is unavailable.** Activities 1, 3, 4, 5 and 6 and Workbook Exercise 4 keep their printed text and are marked accordingly; the tick grid and number-circling task are unscored rather than guessed.
- Book answer guidance is labelled **inferred from the visible text/pictures**, not a publisher key.
- Personal writing, speaking lines and drawings are not auto-graded; they have no single correct answer.
- The teacher password is the project’s display convenience, **not secure authentication**.
- No merge and no deployment were performed.
