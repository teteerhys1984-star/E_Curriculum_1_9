# Grade 4, Unit 1, Lesson 2 — verification record

**Branch:** `arena/c51c7002-e-curriculum-1-9`
**Status:** static checks and browser checks pass locally. Nothing has been merged or deployed.

## What was built

Five connected pages, using the existing lesson design system (`grade3-unit1-lesson2.css` copied to `grade4-unit1-lesson2.css` with a short lesson-specific additions block, plus the shared `lesson-content-navigation.js` and the existing quiz/reveal script pattern):

- [Lesson home](../../grade4-unit1-lesson2.html) — title, English introduction, four section links, objectives and a listening note.
- [Pupil’s Book](../../grade4-unit1-lesson2-pupil-book.html) — pages 6–8, activities 1–10 plus the Let’s Learn box, in source order.
- [Workbook](../../grade4-unit1-lesson2-workbook.html) — pages 8–10, exercises 1–8, in source order.
- [Vocabulary](../../grade4-unit1-lesson2-vocabulary.html) — reference tables with word-level Arabic meanings, English examples and page references.
- [Lesson test](../../grade4-unit1-lesson2-test.html) — 20 questions, 60 options, automatic scoring, per-question feedback and a password-gated teacher key.

The Grade 4 lesson list in `lessons.html` now shows `Lesson 2 · My Family` beside the existing Lesson 1 entry.

## Checks run

### Static (`npm test`)

- Every root HTML page still has an English LTR root and no Arabic outside marked Vocabulary meanings; the new Vocabulary page contains 47 Arabic word meanings, each in a `class="ar" lang="ar" dir="rtl"` cell and limited to a short word-level translation.
- All local links and assets resolve; no duplicate IDs; every image has alt text.
- The six supplied images match the recorded SHA-256 hashes byte for byte.
- Pupil’s Book activities 1–10 and Workbook exercises 1–8 are present in order; the two answers printed in the source stay marked as printed.
- The test markup matches the stored fixture `tests/grade4-unit1-lesson2.quiz.json` exactly (prompts, options, answer indices, references, explicit/inferred labels): 20 questions, 60 options, 13 direct readings, 7 inferences.
- `node --check` passes for the lesson script and the shared navigation script.

### Browser (`node tests/grade4-unit1-lesson2.browser.mjs`, Chromium 153.0.8010.0)

- Viewports: **1366×900, 768×1024, 390×844, 320×740**. No page-level horizontal overflow at any of them.
- Grade 4 list renders both lessons and the Lesson 2 link opens the lesson home.
- All 11 Pupil’s Book steps, 8 Workbook steps, 6 Vocabulary steps and 20 test questions are reachable from the side index and from Previous/Next.
- Written answers, matching selects and the family-table fields survive step changes.
- Quiz states: empty 0/20, all wrong 0/20, all correct 20/20, one wrong 19/20, one answered 1/20; a changed answer clears a stale score; reset clears everything.
- Teacher key rejects empty and wrong passwords, accepts the project’s existing password, shows 20 evidence entries and can be closed.
- Rendered language audit: no Arabic text, `dir` or `lang` outside the Vocabulary meaning cells; those cells compute to `direction: rtl`; English options and feedback compute to LTR.
- All images decode; no JavaScript page errors and no HTTP status of 400 or above on the tested routes.
- Each subpage returns to the Grade 4 lesson list and to the lesson menu by real clicks under the `/E_Curriculum_1_9/` project path.

### Full-curriculum suites (regression)

- `node tests/grade3-unit1-lesson2.browser.mjs` — all checks still pass.
- `node tests/english-curriculum.browser.mjs` — 40 root pages at 1366×900 and 390×844, images, language audit and the legacy quiz gates still pass; the new test page was added to its assessment loop.

## Corrections made during the independent audit

A strict re-read of the six images against the rendered pages found five defects, all fixed on this branch:

1. **Workbook exercise 5** prints **five** dotted lines under the example; the page had four fields. A fifth field was added and the printed count is now asserted by both suites.
2. **Workbook exercise 8** had been flattened into a stack of labelled boxes. It now keeps each printed sentence intact with one field per dotted gap, and the two end lines are kept as plain writing lines (see the next section).
3. **Crop defects.** Four crops were mis-framed: PB activity 1 clipped the heads of the standing parents; PB activity 3 included a clipped copy of the printed bullets; PB activity 5 included the clipped heading "6 Before you read"; WB exercise 1 started inside the reading passage and cut the "John's Family" panel. All four were re-cropped from the unchanged source scans.
4. **Vocabulary examples.** In three entries the example used textbook wording that the page had completed, for example "We usually read stories together" presented as the example for "write". Those examples now quote the printed frames with their dotted gaps.
5. **Alt text.** The Workbook exercise 5 illustration was described as "the family"; it is described now by the four people actually drawn.

## Two open source-fidelity questions, resolved against the scans

Both questions were settled by putting the supplied scan beside a screenshot of the rendered section, and by measuring the printed dots rather than relying on the transcription.

### Workbook exercise 8 — are the two extra fields real?

**Yes.** Measuring Workbook p. 10 shows eight dotted gaps *inside* the four printed sentences (each about 90 px wide) and then two more dotted rules below them at y = 761 and y = 792 that run the full width of the text column (613 px). The eight are answer gaps; the two are full-width writing lines printed under the last sentence with no words beside them. Keeping two fields for them is therefore faithful, and each is rendered at full width like the printed rule.

Two defects of our own were found in the same comparison and are fixed:

- The book prints “My father is an/a … He’s got … and … .” as **one** line. The page had split it into two paragraphs, which changed the printed sentence structure. It is now one paragraph holding the three gaps.
- The two end fields carried the visible wording “Unlabelled writing line 1 printed in the book”, which is text the book does not print. They now use the same “Writing line” label as Workbook exercise 5, with the fact that the book prints no words recorded in the source note instead of in a control label.

### Pupil’s Book exercise 5 — is the duplication printed?

**No, it is introduced by the page.** The book prints each of the four descriptions exactly once, on a coloured strip between the faces: Long blond hair, Short black hair, brown eyes, green eyes. The page uses the scanned picture, which already contains those strips, and then repeats the same four words as the label of each matching menu, so on screen each description appears twice.

No wording was invented and the four labels are in the printed top-to-bottom order, so this is a presentation artefact rather than a transcription error. It is now disclosed in the figure caption: the book prints each description once, and the rows below repeat the words so each can be matched from a menu. The menu width was also corrected, because “Choose a picture” was being clipped to “Choose a pictu”.

## Not verified

- **Audio activities.** Pupil’s Book 1 and 2 and Workbook 3 and 4 need the official recordings, which were not supplied. Their instructions and items are preserved, no answer is given, and they are not scored. No listening behaviour could be tested.
- **Real mobile devices and screen readers.** Testing used Chromium viewport emulation only. No physical device, iOS Safari, Firefox or assistive-technology session was run.
- **External Google Fonts.** Two legacy pages still import Google Fonts. The full-curriculum suite blocks external requests, so English typography in this lesson was verified only with the bundled local fonts and the browser fallback.
- Printed answers are not available for most exercises. The suggestions shown on the pages and in the teacher key are editorial and are labelled as such; they should be checked against the teacher’s edition before classroom use.
