# Grade 3 · Unit 1 · Lesson 4 — Writing inventory

**Book:** *My Five Senses.* Pupil's Book printed pages 12–14; Workbook printed pages 12–14.
**Sources inspected (12 scans for the batch, 6 for this lesson):**
`assets/grade3-unit1-lesson4/source/` — `pupil-book-page-12.png`, `-13`, `-14`,
`workbook-page-12.png`, `-13`, `-14`.

All six scans are present, read at full size, and match
`assets/grade3-unit1-lesson4/source-manifest.json` byte-for-byte (SHA-256).
Every printed page number on the scans matches its filename.

## Classification rule

A printed activity is counted as **Writing** only where the book requires the pupil to
produce a written response (words, numbers or sentences). Oral pair work, listening-only
tasks, pure reading, ticking and circling are listed as excluded.

## Pupil's Book (pages 12–14) — no written production

| # | Printed page | Prompt | What pupils do | Why it is excluded |
|---|---|---|---|---|
| 1 | 12 | Listen and read. | Read/listen to six dialogue panels | Reading and listening only |
| 2 | 13 | Let's learn! | Read five sense words | Presentation only |
| 3 | 13 | Listen and repeat. | Repeat numbers 10–50 | Oral repetition |
| 4 | 13 | Listen and tick ✓. | Tick sense column for 5 items | Listening and ticking |
| 5 | 14 | Listen and sing. | Sing nine printed lines | Listening/oral |
| 6 | 14 | Listen to the following sounds and words, then repeat them. | Repeat *coat / goat* (**oa**) | Phonics repetition |

**Pupil's Book writing activities: 0.** The page does not load `lesson4-writing-practice.js`.

## Workbook (pages 12–14) — four writing activities

| ID | Book | Page | Exercise | Exact prompt | Printed response spaces | Classification | Source-verified model? |
|---|---|---|---|---|---|---|---|
| `wb-1` | Workbook | 12 | 1 | Look and complete. | 5 dotted word shapes (`nose`, `eye`, `ear`, `mouth`, `hand`) | Constrained by pictures | Yes — existing `Show word guidance` reveal |
| `wb-2` | Workbook | 12 | 2 | Fill in the spaces. Word bank: *see · smell · hear · taste · touch* | 5 blanks | Constrained (word bank) | Yes — existing `Show sentence guidance` reveal |
| `wb-5` | Workbook | 14 | 5 | Write the missing numbers. | 9 dotted blanks (31–50) | Constrained sequence | Yes — existing `Show number guidance` reveal |
| `wb-6` | Workbook | 14 | 6 | Look and write. | 3 dotted lines + printed example `1- I can see a car.` | Constrained by picture pairs | Yes — existing `Show writing guidance` reveal |

Excluded Workbook exercises: 3 *Read and circle* (circling), 4 *Listen and circle the number you hear* (listening + circling).

**Workbook writing activities: 4. Total for this lesson: 4.**

## Changes in this batch

- Added `lesson4-writing-practice.js` to `grade3-unit1-lesson4-workbook.html`: one writing group per exercise (`wb-1`, `wb-2`, `wb-5`, `wb-6`), per-activity storage `efc_writing_grade3-unit1-lesson4-workbook_v1:<id>`, visible persistence status, and synchronous reset reusing the printed `Clear this exercise` button.
- Preserved all existing IDs, `efc_grade3_unit1_lesson4_practice_v1:workbook` migration, and existing guidance reveals.
