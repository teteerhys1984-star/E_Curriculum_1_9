# Grade 4 · Unit 1 · Lesson 3 — Writing inventory

**Book:** *Daily Routine.* Pupil's Book printed pages 9–11; Workbook printed pages 11–13.
**Sources inspected (12 scans for the batch, 6 for this lesson):**
`assets/grade4-unit1-lesson3/source/` — `pupil-book-page-9.png`, `-10`, `-11`,
`workbook-page-11.png`, `-12`, `-13`.

All six scans are present, read at full size and at enlarged crops, and match
`assets/grade4-unit1-lesson3/source-manifest.json` byte-for-byte (SHA-256 and byte counts).
Every printed page number matches the manifest's `sourcePage` and the filename. No page is
missing or unreadable, so no re-upload was requested.

## Classification rule

A printed activity counts as **Writing** only where pupils must produce a written response.
Listening-only tasks, ticking/circling, pure reading, matching and oral pair work are listed
as excluded.

## Pupil's Book (pages 9–11)

| # | Printed page | Prompt | What pupils do | Writing? |
|---|---|---|---|---|
| 1 | 9 | Listen and tick. | Tick five routines for Lily and Mum | No — ticking |
| 2 | 9 | Listen and circle. | Circle one form in each pair | No — circling |
| 3 | 9 | Ask and answer. | Oral exchange about morning routines | No — speaking |
| 4 | 10 | Look and say the time. | Say four printed times | No — speaking |
| 5 | 10 | Look and say What time it is. | Say four printed times | No — speaking |
| 6 | 10 | Before you read the text, guess what time Dan … | Guess three times | No — no printed response space |
| 7 | 10 | Read the text and do the tasks below. a. Tick ✓ or cross ✗. b. Choose. | Tick/cross five sentences; choose three options | No — ticking and choosing |
| — | 11 | Let's Learn | Presentation of present simple | No |
| 8 | 11 | **Draw and write.** Word bank: *wake – wakes – watch – watches* | Draw clock hands and complete 4 sentences | **Yes — constrained** |
| 9 | 11 | **Let's write and sing.** Word bank: *get – have – get up – brush (×2) – wash* | Complete 6 song blanks | **Yes — constrained** |
| 10 | 11 | **Complete.** | Finish open daily-routine lines | **Yes — personal / open-ended** |

**Pupil's Book writing activities: 3.**

## Workbook (pages 11–13)

| ID | Book | Page | Exercise | Exact prompt | Printed response spaces | Classification | Source-verified model? |
|---|---|---|---|---|---|---|---|
| `wb-2` | Workbook | 11 | 2 | Fill in the spaces with words in the box. Box: *get (×2) – gets (×2) – wash – washes* | 6 blanks | Constrained (word box) | Yes — `get, wash, get, gets, washes, gets` |
| `wb-4` | Workbook | 12 | 4 | Write the time. | 5 dotted lines under 5 printed clocks | Constrained by the printed clock faces | Yes — read from the printed hands (below) |
| `wb-5` | Workbook | 12 | 5 | Ask and answer. | 2 dotted lines in the second exchange | Personal, pattern-modelled by the printed exchange | No fixed answer — labelled illustrative sample |
| `wb-8` | Workbook | 13 | 8 | Fill in the spaces. | 7 blanks | Personal / open-ended routine | No fixed answer — labelled illustrative sample |

Excluded Workbook exercises: 1 *Read and match* (matching), 3 *Listen and circle*, 6 *Listen
and choose* (listening), 7 *Read the text above and tick (✓)* (ticking).

**Workbook writing activities: 4. Total for this lesson: 7.**

### Exercise 4 — times read from the printed clocks

Hand lengths were measured on the scans: the long hand gives the minutes and the short hand
the hour (the same convention as the labelled clocks on Pupil's Book page 10, e.g.
*It's quarter to four*).

| Clock | Long (minute) hand | Short (hour) hand | Model |
|---|---|---|---|
| 1 | 6 → :30 | between 10 and 11 | It's half past ten. |
| 2 | 9 → :45 | beside 12 | It's quarter to one. (12:45) |
| 3 | 3 → :15 | just past 6 | It's quarter past six. |
| 4 | 12 → :00 | at 4 | It's four o'clock. |
| 5 | 3 → :15 | just past 7 | It's quarter past seven. |

Clock 2's hour hand is drawn closer to 12 than to 1 although the minute hand fixes :45; the
model states 12:45 and how it is said, and discloses that the book prints no answer key.

## Compliance before this batch

| Requirement | Before | Evidence |
|---|---|---|
| Source-verified model / labelled sample / documented exception | 3 / 7 | `pb-9`, `pb-10` and `wb-2` had suggested-answer reveals; **`pb-11`, `wb-4`, `wb-5` and `wb-8` had none** |
| Model reveal and hide | 3 / 7 | As above |
| Response entry and editing | 7 / 7 | All fields editable |
| Compare / reveal without overwriting | 7 / 7 | Reveals do not write into fields |
| Deliberate per-activity reset | 0 / 7 | Only one page-level button, `Reset this page's practice` |
| Persistence after reload | 7 / 7 | Page store `efc_grade4_unit1_lesson3:practice:<path>` |
| Teacher-only answers separated | 7 / 7 | No teacher key on the book pages; the gated key stays on the test page |
| No fake automatic grading | 7 / 7 | No automatic scoring on book writing |
| Per-activity storage and status | 0 / 7 | One page store, no per-activity status |

## Changes in this batch

- Added `lesson3-writing-practice.js` to both pages: 3 groups on the Pupil's Book, 4 on the
  Workbook, each with `efc_writing_<page>_v1:<id>` storage, a visible persistence status and
  a `Reset this activity` button (a printed reset control is reused where one exists). Both
  button kinds funnel through one synchronous `reset` handler that prevents the native reset
  and clears fields (including the printed clock pickers), the activity key, the legacy
  `efc_grade4_unit1_lesson3:practice:<path>` entries, the model and guidance panels, invalid
  markings, feedback and the status in one step.
- Preserved all section IDs, field IDs, the lesson store
  `efc_grade4_unit1_lesson3:practice:<path>`, and the existing page-level reset. Drafts already
  saved in the page store are migrated into the per-activity keys on first load, and the
  page-level reset now clears the writing keys as well.
- Added the missing **Exercise‑4 time model**, read from the printed clock hands with the
  convention stated on the page.
- Added labelled illustrative samples (**Show a sample answer (answers vary)**) for `pb-11`,
  `wb-5` and `wb-8`.
- Left the existing suggested-answer reveals for `pb-9`, `pb-10` and `wb-2` unchanged.

## After this batch

| Requirement | After |
|---|---|
| Source-verified model / labelled sample / documented exception | 7 / 7 |
| Model reveal and hide | 7 / 7 |
| Response entry and editing | 7 / 7 |
| Compare without overwriting | 7 / 7 |
| Deliberate per-activity reset | 7 / 7 |
| Persistence after reload | 7 / 7 |
| Teacher-only answers separated | 7 / 7 |
| No fake automatic grading | 7 / 7 |
| IDs, storage keys and progress preserved | 7 / 7 |

**Remaining blocked or unverified: 0.** Every writing activity now has a source-verified model,
a clearly labelled illustrative sample, or documented evidence. Listening-only exercises
(Workbook 3, 6; Pupil's Book 1, 2) remain excluded from Writing and are still disclosed on the
pages as audio-dependent.
