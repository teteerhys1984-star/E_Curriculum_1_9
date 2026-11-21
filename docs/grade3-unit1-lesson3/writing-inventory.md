# Grade 3 · Unit 1 · Lesson 3 — Writing inventory

**Book:** *My Lovely School.* Pupil's Book printed pages 9–11; Workbook printed pages 9–11.
**Sources inspected (12 scans for the batch, 6 for this lesson):**
`assets/grade3-unit1-lesson3/source/` — `pupil-book-page-9.png`, `-10`, `-11`,
`workbook-page-9.png`, `-10`, `-11`.

All six scans are present, read at full size and at enlarged crops, and match
`assets/grade3-unit1-lesson3/source-manifest.json` byte-for-byte (SHA-256).
Every printed page number on the scans matches its filename. No page is missing or unreadable,
so no re-upload was requested.

## Classification rule

A printed activity is counted as **Writing** only where the book requires the pupil to
produce a written response (words, numbers or a drawing-and-writing frame). Oral pair work,
listening-only tasks, pure reading, matching and vocabulary recognition are listed as
excluded, not as Writing.

## Pupil's Book (pages 9–11) — no written production

| # | Printed page | Prompt | What pupils do | Why it is excluded |
|---|---|---|---|---|
| 1 | 9 | Listen and read. | Read/listen to six dialogue panels | Reading and listening only; no response space |
| 2 | 10 | Let's learn! | Read the presentation frame | Presentation only |
| 3 | 10 | Ask and answer. | Say four printed exchanges in pairs | Oral pair work |
| 4 | 10 | Look, read and match. | Match three sentences to three pictures | Matching, no written production |
| 5 | 11 | Listen and sing. | Sing nine printed lines | Listening/oral |
| 6 | 11 | Listen to the following sounds and words, then repeat them. | Repeat *meat / eat* (**ea**) | Phonics repetition |

**Pupil's Book writing activities: 0.** The page therefore does not load the writing layer.

## Workbook (pages 9–11) — six writing activities

| ID | Book | Page | Exercise | Exact prompt | Printed response spaces | Classification | Source-verified model? |
|---|---|---|---|---|---|---|---|
| `wb-1` | Workbook | 9 | 1 | Read and write the missing words. Word bank: *draw · library · art room · read · laboratory* | 5 blanks in 3 sentences | Constrained (word bank) | Yes — `read / library`, `laboratory`, `draw / art room` (derived from the printed bank; the book prints no key) |
| `wb-2` | Workbook | 9 | 2 | Listen and number. | 6 blank circles | Audio-dependent written numbers | **No** — the recording was not supplied; pictures cannot fix the order. Documented exception, not graded |
| `wb-3` | Workbook | 10 | 3 | Look, read and write. | 3 blanks + one printed example (`gym`) | Constrained by the printed pictures | Yes — `on the left of`, `classroom`, `twelve` (the number 12 is printed) |
| `wb-4` | Workbook | 10 | 4 | Draw your favourite room and write about it. | 2 writing gaps + drawing frame | Personal / open-ended | No fixed answer — labelled illustrative sample only |
| `wb-5` | Workbook | 11 | 5 | Read, order then act. | 4 order boxes + printed `1` | Constrained ordering | Yes — `2, 3, 5, 4, 1` in printed line order |
| `wb-6` | Workbook | 11 | 6 | Write the words in the correct box. Word bank: *classroom · living room · laboratory · bedroom · playground · kitchen* | 6 lines in 2 boxes | Constrained classification | Yes — *school*: classroom, laboratory, playground; *house*: living room, bedroom, kitchen |

**Workbook writing activities: 6. Total for this lesson: 6.**

## Compliance before this batch

| Requirement | Before | Evidence |
|---|---|---|
| Source-verified model or labelled sample or documented exception | 5 / 6 | `wb-1`, `wb-3`, `wb-5`, `wb-6` had inferred-answer guidance; `wb-2` documented the missing recording; **`wb-4` had no sample** |
| Model reveal / hide | 5 / 6 | Existing `Show … guidance` reveals; `wb-4` had none |
| Response entry and editing | 6 / 6 | All printed fields were editable |
| Compare / reveal without overwriting pupil work | 6 / 6 | Reveal panels do not write into the fields |
| Deliberate reset of the activity | 6 / 6 | Per-form `Clear this exercise` |
| Persistence after reload | 6 / 6 | Shared page store `efc_grade3_unit1_lesson3_practice_v1:workbook` |
| Teacher-only answers kept separate | 6 / 6 | No teacher key on the book page; the gated key stays on the test page |
| No fake automatic grading | 6 / 6 | Only constrained items are checked; the personal frame is not graded |
| Per-activity storage, status and standard markers | 0 / 6 | One page-level store; no writing status/announcement per activity |

## Changes in this batch

- Added `lesson3-writing-practice.js` to the Workbook page: one writing group per exercise,
  per-activity storage key `efc_writing_grade3-unit1-lesson3-workbook_v1:<id>`, a visible
  persistence status, and an explicit reset that reuses the printed `Clear this exercise`
  control (no duplicate button).
- Preserved every existing section ID, field ID, the lesson storage key
  `efc_grade3_unit1_lesson3_practice_v1:workbook` and any draft already saved there
  (existing drafts are migrated into the new per-activity keys on first load).
- Added the missing illustrative sample for `wb-4`
  (*"2- My favourite room is the library. I can read interesting books there."*) labelled
  **Show a sample answer (answers vary)**.
- Added the explicit exception statement for `wb-2` (recording unavailable, not graded).
- Kept all existing inferred-answer reveals unchanged; none of them writes into a pupil field.

## After this batch

| Requirement | After |
|---|---|
| Source-verified model / labelled sample / documented exception | 6 / 6 |
| Model reveal and hide | 6 / 6 |
| Response entry and editing | 6 / 6 |
| Compare without overwriting | 6 / 6 |
| Deliberate per-activity reset | 6 / 6 |
| Persistence after reload | 6 / 6 |
| Teacher-only answers separated | 6 / 6 |
| No fake automatic grading | 6 / 6 |
| IDs, storage keys and progress preserved | 6 / 6 |

**Remaining blocked or unverified: 1 activity.** `wb-2` (Workbook page 9, *Listen and
number*) cannot be verified from the images because the listening recording was never
supplied. It is documented on the page, saved as practice only, and is not scored. No answer
was invented.
