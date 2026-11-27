# Source defects and unresolved items — Grade 5, Unit 1, Lesson 9 “Music”

Every item below was seen in the supplied scans and is handled in one of four ways, always stated on the page itself.

Legend:

- **Reproduced** — the printed string is kept exactly and a note says what is odd about it.
- **Unscored** — the activity is answerable on screen but nothing is marked correct, because the missing recording (or an unsettled printed ordering) decides it.
- **Open** — the activity is personal or creative; the reveal shows an illustrative example that is explicitly not a key.
- **Separated** — two printed activities on the same page are kept apart and are never used to check each other.

## 1. The picture activity and the reading passage on Pupil’s Book p. 31

This is the most consequential decision in the lesson.

| Activity | Printed content |
|---|---|
| 4 (picture task) | Six children labelled **Dana, Lily, Tim, Danny, Sara, Jude**, each holding or playing a different instrument, in the drawing directly beside the activity. |
| 6 (reading) | A band called **MJ** whose members are named **Lily, Amer, Maha, Dana** and **Naya**; the text says Lily will sing and Dana will play the piano. |

Only **Lily** and **Dana** appear in both lists, and the two sources give them different roles: Lily sings in the passage but holds a violin in the picture; Dana plays the piano in the passage but holds a small round instrument above her head in the picture.

**Decision (approved):** the two activities stay strictly separate. Activity 4 is answered only from the printed picture and is **open**; its reveal gives picture-read examples and says the passage is not used to check them. Activity 6 a and 6 b are answered only from the passage and are **scored**. No page anywhere reconciles the two character lists, and no information is carried from one into the other. The Pupil’s Book page states this in as many words, and `tests/grade5-unit1-lesson9.browser.mjs` asserts that the statement is present.

## 2. Workbook p. 31, exercise 1 — spelling only

| Cell | Printed label | Drawing above it | Correct spelling |
|---|---|---|---|
| 1 | `tembourine` | a drum | **tambourine** |
| 2 | `peano` | a tambourine | **piano** |
| 3 | `flut` | a keyboard | **flute** |
| 4 | `drams` | a flute | **drums** |
| 5 | `keyboard` | a violin | **keyboard** (already correct) |
| 6 | `Violeen` | a piano | **violin** |

The printed page asks the pupil to *correct the mistake then match*, but the labels do not sit under the drawings they name and the page does not settle what the intended final order is.

**Decision (approved):** the exercise is treated as **spelling correction only**. The six corrected spellings are scored. The matching step is **not** marked, no matching answer is published, and the page says why. Cell 5 is already spelled correctly, which the reveal notes so that a pupil who writes *keyboard* again is not confused.

## 3. Missing recordings (never invented)

| Location | Activity | Handling |
|---|---|---|
| PB p. 30 | 1 listen and choose the speaker (×4) | **Unscored.** Four printed questions, each with the three printed names in its own printed order. |
| PB p. 30 | 2 listen and repeat (six instruments) | **Unscored.** Six printed labels reproduced; no audio created. |
| PB p. 30 | Pronunciation `æ` / `ɑː` | **Unscored.** Three words per set and the printed model sentence reproduced; no audio created. |
| WB p. 32 | 3 listen and number (eight instruments) | **Unscored.** Eight printed labels and eight empty number boxes; no order is invented. |
| WB p. 32 | 4 listen and choose (×4) | **Unscored.** Four printed questions with all their options; no option is chosen for the pupil. |
| WB p. 32 | 7 listen and classify (eight words into “car / cat”) | **Unscored.** The printed table (two columns, four empty rows each) and the eight printed words are reproduced; **no grouping is given**. |

No `<audio>` element exists on any page. Each of the six activities carries an explicit notice that the recording was not supplied.

## 4. Workbook p. 32, exercise 7 — why the grouping is not published

The eight printed words are `guitar, hand, hat, jar, father, smart, sat, star`. Setting aside the recording, the words themselves fall into **five** that match the long vowel of *car* (`guitar, jar, father, smart, star`) and **three** that match the short vowel of *cat* (`hand, hat, sat`).

The printed table offers four rows per column. Five does not fit into four, so the page cannot be completed as printed even if a pupil sorts by vowel. The lesson therefore:

- reproduces the table and all eight words;
- leaves every cell open and unscored;
- publishes **no** grouping, because the recording was supposed to decide it and a vowel sort contradicts the printed shape of the table;
- states in the page notice that no grouping is given.

This is recorded as a source defect, not corrected.

## 5. Printed strings kept exactly as they appear

| Where | Printed string | Handling |
|---|---|---|
| PB p. 31, reading | `at the " Smile Theatre"` (a space after the opening quotation mark) | **Reproduced**, with a note. |
| PB p. 31, reading | `a band called "MJ"` | **Reproduced** with its printed quotation marks. |
| PB p. 30, label 6 | `drum` (singular) | **Reproduced.** The sentences elsewhere print `drums`. |
| PB p. 32, activity 7 | `She is going to practise the piano` | **Reproduced** with the British spelling *practise* for the verb; the vocabulary note distinguishes it from the noun *practice*. |
| WB p. 33, exercise 8, item 5 | `Is Lily coming?` with no bracket and no gap | **Reproduced.** Five of the six numbered lines are choices; the page says so and marks only five. |
| WB p. 33, exercise 9, Lily’s list | `go to a concert` ✗ together with `buy a ticket for the concert` ✓ | **Reproduced** as printed, with a note. The sentences are still scored, because each one follows mechanically from its own printed tick or cross. |
| WB p. 31, exercise 2 a, item 4 | `Beethoven and Darwish are………` | **Reproduced** with the printed dots. |

## 6. Activities left open

| Location | Activity | Handling |
|---|---|---|
| PB p. 30 | 3 ask and answer | **Open.** The two printed bubbles are a model. |
| PB p. 31 | 4 look at the picture and say | **Open** (see §1). |
| PB p. 31 | 5 before you read (two questions) | **Open.** Personal questions; bullet 2 prints two questions in one line and keeps them in one field. |
| PB p. 32 | 8 look and write (items 2–4) | **Open.** Item 1 is printed on the page (`She is going to play the guitar.`); the other three admit more than one true sentence. |
| PB p. 32 | 10 complete | **Open.** Illustrative continuation only. |
| WB p. 32 | 5 read then act out | **Open.** The printed dialogue is a model. |
| WB p. 32 | 6 talk about yourself | **Open.** Only the first printed caption is in the first person; the page notes that the other two cannot be reused without changing them. |
| WB p. 33 | 10 write about your weekend | **Open.** Illustrative paragraph only. |

## 7. What the lesson does not do

- It does not reconcile the six children in the picture with the five named in the passage, and it does not use either list to check the other.
- It does not publish a spelling-plus-matching answer for Workbook exercise 1.
- It does not publish any grouping for the classify task.
- It does not add facts about any instrument, performer or composer that the six supplied pages do not print.
