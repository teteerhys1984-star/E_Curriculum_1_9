# Grade 3 · Unit 1 · Lesson 6 — Writing inventory

**Book:** *My Daily Routine.* Pupil's Book printed pages 18–20; Workbook printed pages 18–20.
**Sources inspected (6 scans, read at full size and as per-activity crops):**
`assets/grade3-unit1-lesson6/source/` — `pupil-book-page-18.png`, `-19`, `-20`,
`workbook-page-18.png`, `-19`, `-20`. All six match `assets/grade3-unit1-lesson6/source-manifest.json`
(SHA-256 and byte counts). Each printed page number matches its filename. No page is missing or
unreadable, so no re-upload was requested. The scans are the only authority for prompts and words.

## Classification rule

A printed activity counts as **Writing** only where the book requires the pupil to produce a written
word or sentence. Reading aloud, speaking, listening, ticking, matching and singing are excluded, with
the reason given. Matching by letter choice (Workbook 4) is excluded even though it has a response field.

## Pupil's Book (pages 18–20)

| # | Printed page | Printed instruction (verbatim) | What the pupil does | Writing? |
|---|---|---|---|---|
| 1 | 18 | `1. Listen and read.` | Reads six speech bubbles aloud | No — reading aloud / listening |
| 2 | 19 | `2. Let’s learn!` | Reads a frequency table (flowers per word) | No — reading only |
| 3 | 19 | `3. Ask and answer.` | Oral pair question and answer | No — speaking |
| 4 | 19 | `4. Listen and tick ✓.` | Ticks a circle after hearing a recording | No — audio-dependent |
| 6 | 20 | `6. Listen and sing.` | Sings a printed song to a recording | No — audio-dependent, song |
| 7 | 20 | `7. Listen to the following sounds and words, then repeat them.` | Repeats the gr sound and words | No — audio-dependent, repeat |

**Pupil's Book writing activities: 0.** Activity 5 is absent from the printed sequence and is not invented.

## Workbook (pages 18–20)

| # | Printed page | Printed instruction (verbatim) | What the pupil does | Writing? |
|---|---|---|---|---|
| 1 | 18 | `1. Look, read and write.` | Writes one frequency word in each of five sentences (star/cross cues) | **Yes — word writing** (`wb-1`, 5 fields) |
| 2 | 18 | `2. Read, complete with (never/ always) and say.` | Writes never or always in four sentences; then says them aloud (oral part not recorded) | **Yes — word writing** (`wb-2`, 4 fields) |
| 3 | 19 | `3. Listen and tick ✓.` | Ticks six picture pairs after hearing a recording | No — audio-dependent (`wb-listen`, no checker) |
| 4 | 19 | `4. Read and match.` | Chooses an ending letter a–e for five sentences | No — matching (`wb-4`, 5 selects, inferred pairs) |
| 5 | 20 | `5. Reorder.` | Writes three sentences from word tiles | **Yes — sentence writing** (`wb-5`, 3 fields) |
| 6 | 20 | `6. Write about your family.` | Item 1 printed; writes items 2–4 from picture cues | **Yes — sentence writing** (`wb-6`, 3 fields) |

**Workbook writing activities: 4** (`wb-1`, `wb-2`, `wb-5`, `wb-6`). Total writing activities: **4**.

## Printed response types and their handling

| Activity | Printed key? | Handling on the page |
|---|---|---|
| Workbook 1 | No (stars and cross are printed; the frequency mapping is inferred from the Pupil's Book table) | Inferred model, labelled; comparison only; drafts saved; no marking |
| Workbook 2 | No | Inferred model, labelled; comparison only |
| Workbook 5 | No (tiles fix the words; the order is inferred) | Inferred model, labelled; comparison only |
| Workbook 6 | Item 1 printed; items 2–4 open | Illustrative examples labelled “not official answers”; “Answers vary” message; no comparison score |
| Workbook 4 | No | Inferred letter pairs, checkable against the inferred model; labelled as inferred |
| Workbook 3, Pupil's Book 4, 6, 7 | Recording not supplied | Not scored; no answer or key published |

## Writing exceptions (recorded in `docs/english-curriculum-audit/writing-readiness.json`)

1. **Workbook p. 18, Exercise 1** — no printed key; the star-to-frequency mapping is inferred.
2. **Workbook p. 18, Exercise 2** — no printed key; the never/always choices are inferred from sense.
3. **Workbook p. 20, Exercise 5** — no printed key; the order is inferred from the tiles.
4. **Workbook p. 20, Exercise 6** — items 2–4 are open; examples are illustrative only.

The audio-dependent items (Pupil's Book 4, 6, 7 and Workbook 3) are not writing activities. They are
recorded as audio exceptions in `source-checklist.md` and are not counted here.

## Writing features on each writing activity

Each writing activity has: an answer field for each item; a labelled model shown on request (`Show model`);
a comparison that shows each response beside the model without changing either; edit and retry (nothing is
locked); draft persistence in this browser; and an activity-level reset that clears only that activity.
No activity is marked automatically, and no score is shown for writing.
