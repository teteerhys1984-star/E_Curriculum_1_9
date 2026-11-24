# Grade 3 · Unit 1 · Lesson 5 — Writing inventory (Batch 5)

**Book:** *Revision 1.* Pupil's Book printed pages 15–17; Workbook printed pages 15–17.
**Sources inspected (6 scans, all read at full size and at enlarged crops):**
`assets/grade3-unit1-lesson5/source/` — `pupil-book-page-15.png`, `-16`, `-17`,
`workbook-page-15.png`, `-16`, `-17`.

All six scans are present and match `assets/grade3-unit1-lesson5/source-manifest.json`
byte-for-byte (SHA-256 and byte counts). Every printed page number on the scan matches its
filename and the manifest. No page is missing or unreadable, so no re-upload was requested.
The scans are the only authority: no answer, transcript or page content below was supplied
by any other source.

## Classification rule

A printed activity counts as **Writing** only where the book requires the pupil to produce a
written response — a word, a number or a sentence. Ticking/crossing, circling, matching,
listening-only, drawing/making and oral pair work are listed as excluded, with the reason.

## Pupil's Book (pages 15–17)

| # | Printed page | Prompt (verbatim) | What the pupil does | Writing? |
|---|---|---|---|---|
| 1 | 15 | `1. Look, read then Tick ✓ or cross ✗.` | Marks ✓ or ✗ in five green ovals against the school picture | No — ticking/crossing |
| 2 | 16 | `2. Listen then complete the table.` | Writes values in a four-row table; the right-hand column is headed `My name is………` | **Yes — table completion** |
| 3 | 16 | `3. Listen and tick ✓.` | Ticks one green oval beside each picture in an `oo / ou / ea / oa` table | No — ticking |
| 4 | 17 | `4. Read, match then circle.` | Circles one of two words printed in brackets in each of three sentences | No — circling |
| 5 | 17 | `Project.` — `Choose one of the five senses and make your own flower.` | Chooses a sense and makes/draws a five-petal flower | No printed writing space — making/drawing (borderline, disclosed below) |

**Pupil's Book writing activities: 1 (`pb-2`).**

### `pb-2` detail

| Row | Sally column | `My name is………` column |
|---|---|---|
| brothers | `2` printed in the scan | blank — pupil writes |
| sisters | blank | blank — pupil writes |
| favourite subject | blank | blank — pupil writes |
| favourite place at school | blank | blank — pupil writes |

The three blank Sally cells depend entirely on the listening recording. **The recording was
not supplied**, so no value can be verified or published; those cells are therefore practice
only and are recorded as a documented exception. The `My name is………` column is personal and
has no fixed answer.

## Workbook (pages 15–17)

| ID | Page | Exercise | Exact prompt | Printed response space | Classification | Source-verified model? |
|---|---|---|---|---|---|---|
| — | 15 | 1 | `1. Read and match.` | Five sentences to match to five pictures | Matching | No — matching, no written production |
| — | 15 | 2 | `2. Odd one out.` | Four word rows (row 1 printed circled at *gym*) | Circling | No — circling |
| — | 16 | 3 | `3. Listen and tick (✓).` | Eight empty blue circles | Listening + ticking | No — ticking, and the recording was not supplied |
| `wb-5` | 17 | 5 | `5. Write.` | Four sentences with five dotted blanks and picture cues (flask, treble clef, `EN` keyboard, maths badge, palette, pencil) | Constrained by printed pictures | **Yes** — 1 Science / Music; 2 English / Maths; 3 Art. Item 4's pencil cue gives Art and its second blank is genuinely open |
| `wb-6` | 17 | 6 | `6. Look, match then write.` | Four-column grid: pictures, sound pairs `oo / ou / oa / ea`, dotted word frames `… … t`, `g … … t`, `br … … m`, `h.o. .u. se` | Constrained in principle, but the printed columns disagree row by row | **No** — documented exception; the printed blue example line and the three columns do not align |

Excluded Workbook exercises: 1 *Read and match* (matching), 2 *Odd one out* (circling),
3 *Listen and tick* (ticking + missing recording).

**Workbook writing activities: 2 (`wb-5`, `wb-6`). Total for this lesson: 3.**

### `wb-6` — why the column mismatch cannot be resolved from the source

The book prints the sound pairs top to bottom as `oo`, `ou`, `oa`, `ea`, the pictures top to
bottom as broom, house, goat, boy eating, and the word frames top to bottom as
`… … t`, `g … … t`, `br … … m`, `h.o. .u. se`. Its own blue example line is drawn from the
`ou` row across to `h.o. .u. se`, which skips two rows. Words that fit the printed frames are
*coat* (`oa`), *goat* (`oa`), *broom* (`oo`), *house* (`ou`) and *eat* (`ea`); the picture
column cannot be reconciled with that frame order. The page therefore keeps the printed
columns in printed order, marks the book's own example line as the book's, and labels the
word-level mapping as inferred — it is never presented as a verified key.

## Correction made in this batch

**Workbook page 16, Exercise 4 `Complete and say.`** The earlier version of this lesson
printed three number-word fields and described them as "three printed empty lines". That is
not what the scan shows: below the `4 Complete and say.` heading the left half of page 16 is
empty, and the exercise consists only of the 1–50 dot-to-dot figure to join and the numbers to
say aloud. Pixel and contrast inspection of that region (x 60–395, y 575–995) found no ruled
or dotted answer lines. The fabricated fields and the false claim are removed; the activity is
classified as drawing + oral, not Writing.

## Compliance before this batch

| Requirement | Before | Evidence |
|---|---|---|
| Source-verified model, labelled sample, or documented exception | 1 / 3 | `wb-5` and `wb-6` had inferred-answer reveals; `pb-2` disclosed the missing recording |
| Model reveal / hide | 2 / 3 | Existing `Show … guidance` reveals on the Workbook; `pb-2` correctly has none |
| Response entry and editing | 3 / 3 | All printed fields editable |
| Compare without overwriting pupil work | 3 / 3 | Reveal panels never write into a field |
| Deliberate activity-level reset | 2 / 3 | Per-form `Clear …` buttons; no writing-layer status or per-activity persistence |
| Persistence across reload and navigation | 3 / 3 | Shared page store `efc_grade3_unit1_lesson5_practice_v1:<page>` |
| Teacher-only answers kept separate | 3 / 3 | No teacher key on a book page |
| No fake autograding | 3 / 3 | Audio-dependent cells are not checked |
| Per-activity storage, status and standard markers | 0 / 3 | One page-level store only |

## Changes in this batch

- Added `lesson5-writing-practice.js` to `grade3-unit1-lesson5-pupil-book.html` and
  `grade3-unit1-lesson5-workbook.html`: one writing group per activity, per-activity storage
  `efc_writing_<page>_v1:<id>`, visible persistence status, and a reset that reuses the printed
  `Clear …` control (no duplicate button) and runs synchronously.
- Migrated any draft already saved under `efc_grade3_unit1_lesson5_practice_v1:<page>` into the
  per-activity keys on first load; the old key and its field names are unchanged.
- Added the explicit `pb-2` exception statement (recording unavailable, cells not checked).
- Added the explicit `wb-6` exception statement beside the existing inferred reveal.
- Removed the invented `wb-4` number-word fields and corrected the source description.
- Kept every existing section id, field id, reveal and `data-source-id` block unchanged.
