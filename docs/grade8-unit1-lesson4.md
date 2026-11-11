# Grade 8 · Unit 1 · Lesson 4 — Interesting Destinations

## Scope and source mapping

The site route is Grade 8, Unit 1, Lesson 4, following the existing Grade 8 directory. The supplied pages themselves say **Unit 4, Interesting Destinations**, on both the Student’s Book (p. 26) and the Workbook (p. 14). The printed unit number is retained in the transcriptions and the difference from the site route is disclosed on the lesson menu.

| Upload | Source | Printed page |
| --- | --- | --- |
| image-1.png | Student’s Book | 26 |
| image-2.png | Student’s Book | 27 |
| image-3.png | Student’s Book | 28 |
| image-4.png | Student’s Book | 29 |
| image-5.png | Student’s Book | 30 |
| image-6.png | Student’s Book | 31 |
| image-7.png | Student’s Book | 32 |
| image-8.png | Workbook | 14 |
| image-9.png | Workbook | 15 |
| image-10.png | Workbook | 16 |
| image-11.png | Workbook | 17 |

Originals are copied without re-encoding into `assets/grade8-unit1-lesson4/source/`. The source manifest records the mapping, byte counts, PNG dimensions and SHA-256 values; `source-sha256.txt` can be checked from the repository root with `sha256sum --check assets/grade8-unit1-lesson4/source-sha256.txt`. Fifteen independent, unscaled rectangular crops, their geometries and hashes are listed in `crops-manifest.json`. The static test compares decoded crop pixels against the source rectangle when ImageMagick is available.

## Implemented sections

- **Menu**: source mapping for all eleven pages, learning overview, the five section links and the teacher disclosure.
- **Student’s Book** (images 1–7): Great Pyramid / Bosra / Eiffel tower discussion; the *Iguazu Falls* reading with the printed stress; the seven-item Key words box; True/False; the crossword; the past-perfect table and five open answers; reported-speech gap-fill and bracket choices; the hotel check-in listening; the /s/ and /k/ pronunciation work; *My Best Vacation* writing; the Geography speaking questions; the *Climate & Weather* reading with tasks B–D; the Helen Keller story with its matching, True/False, correction and summary tasks; and Project 2.
- **Workbook** (images 8–11): the four speaking questions; the *Focus on Two Cities* reading; Tasks A and B; the words-to-definitions matching; the reported-speech rules panel; past-perfect completion; reported-speech rewrites; the dialogue turned into a nine-gap reported paragraph; the listening; and the invitation writing task with the *Keep in mind* linking box.
- **Vocabulary**: 15 textbook-listed items (Student’s Book p. 27 ×7, Workbook p. 15 ×5, Student’s Book p. 31 ×3) and 114 additional words and expressions gathered from all eleven pages, in nine source groups, each row with an Arabic meaning. A closing audit table divides the same 114 items across the eleven images.
- **Lesson Test**: fourteen new, explicitly editorial questions with two original reading stimuli. Objectives: Vocabulary ×3, Past perfect ×3, Reported speech ×3, Reading ×2, Pronunciation ×1, Linking words ×2. Published teacher key, scoring, retry and persistence. It is not a textbook test and reuses no book sentence.

Practice is saved locally per page and activity, with activity resets. Objective checks cover verifiable closed answers; open reading, speaking, writing, review and rewrite tasks are saved for human review, not marked against a single string. The test stores selections and the submitted score locally. Its classroom password gate is not authentication, because the key and password are published in the page source. In-page guidance is also available to pupils.

## Source-review decisions and limitations

- **No recording or transcript was supplied** for any of the three listening tasks (Student’s Book p. 28 B and C; Workbook p. 17). The printed questions and all their options are reproduced and stay answerable and persistent, but no listening answer is marked, no key is shown, and no transcript has been invented.
- **Student’s Book p. 26** is transcribed exactly as printed, including the missing spaces in “zone.You”, “unforgettable.You” and “Falls.They”, the typo “They slso said”, and “good and cheap that tourists decided” (no “so”). These are retained, not silently repaired.
- **Student’s Book p. 27 crossword**: the grid prints six squares for Down 3, which fits “rental”, while the Key words box on the same page prints the headword “rental car” and the clue says “a short period of time”. The grid is reproduced unchanged and both answers are accepted.
- **Student’s Book p. 28 A** repeats the reported-speech sentences of the Iguazu reading; “said that / said”, “told us / told” and “added that / added” are all accepted.
- **Student’s Book p. 29** prints “sentences” but gives only one sentence to underline. The spelling “Ras Al Ashmra” and the missing space in “Lattakia.I” are retained exactly.
- **Student’s Book p. 30 D** is a word puzzle asking for “Yes” or “No”; only “Yes” follows from the printed dates, and that is what is scored.
- **Student’s Book p. 31** is transcribed as printed, including “June 27,1880”, the missing stop in “under the water While” and “20thcentury” (no space after the superscript).
- **Workbook p. 15 B4** prints “It takes a long time to travel between Yaleton and Vancouver.” The reading presents Yaleton as a *neighborhood of Vancouver* and says nothing about travel time, so this item has no printed correct wording; the guidance accepts any correction that says Yaleton is part of Vancouver. Nothing is silently rewritten.
- **Workbook p. 15 Vocabulary** prints its instruction as “Match the follwing words with their definitions .” — the typo and the spaced full stop are retained. The book prints no answer line, so the letter matching is a teacher key derived from the printed definitions.
- **Workbook p. 16** closes the reported-speech rule panel with an empty diamond that the book leaves blank; it is reproduced as an empty row and documented rather than filled in.
- **Workbook p. 16 B5** prints two gaps in one sentence (“I ……… already ……… working”); both are graded separately.
- **Workbook p. 17 D** has nine printed gaps. The surrounding sentence says “I said I…………happy” although the dialogue says “I’m ready to help you”; the gap is still *was*, and the mismatch is noted rather than corrected.
