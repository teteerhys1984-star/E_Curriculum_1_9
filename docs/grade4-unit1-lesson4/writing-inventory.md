# Grade 4 · Unit 1 · Lesson 4 — Writing inventory

**Book:** *My House.* Pupil's Book printed pages 12–14; Workbook printed pages 14–16.
**Sources inspected (12 scans for the batch, 6 for this lesson):**
`assets/grade4-unit1-lesson4/source/` — `pupil-book-page-12.png`, `-13`, `-14`,
`workbook-page-14.png`, `-15`, `-16`.

All six scans are present, read at full size, and match
`assets/grade4-unit1-lesson4/source-manifest.json` byte-for-byte (SHA-256 and byte counts).

## Pupil's Book (pages 12–14) — six writing activities

| ID | Page | Exercise | Exact prompt | Classification | Source-verified model? |
|---|---|---|---|---|---|
| `pb-1` | 12 | 1 | Listen and number. | Audio-dependent written numbers | **No** — recording unavailable; documented exception, not graded |
| `pb-3` | 12 | 3 | Look and describe the house. | Open-ended / digital description | Labelled illustrative sample |
| `pb-6` | 13 | 6 | Before you read, answer these questions. | Personal / open-ended | Labelled illustrative sample |
| `pb-9` | 14 | 8 | Look at the picture and fill in with the suitable words. (*is – are – isn't*) | Constrained (word bank) | Yes — existing `Show suggested grammar completions` |
| `pb-10` | 14 | 9 | Reorder. | Constrained reordering | Yes — existing `Show suggested word orders` |
| `pb-11` | 14 | 10 | Describe your dream house. | Personal / open-ended | Labelled illustrative sample |

Excluded Pupil's Book activities: 2 *Listen and tick* (ticking), 4 *Ask and answer* (oral), 5 *Read and match* (matching), 7 *Read the text and do the tasks below* (choosing/circling), *Let's Learn* (presentation), *Pronunciation* (listening/oral).

## Workbook (pages 14–16) — five writing activities

| ID | Page | Exercise | Exact prompt | Classification | Source-verified model? |
|---|---|---|---|---|---|
| `wb-2` | 14 | 2 | Look and say what is wrong. | Open-ended / digital response | Labelled illustrative sample |
| `wb-3` | 14 | 3 | Look and describe. | Open-ended / digital response | Labelled illustrative sample |
| `wb-6` | 15 | 6 | Write. | Personal / open-ended | Labelled illustrative sample |
| `wb-8` | 16 | 8 | Fill in the spaces with these words. (*is – are*) | Constrained (word bank) | Yes — existing `Show grammar completions` |
| `wb-9` | 16 | 9 | Complete. | Personal / open-ended | Labelled illustrative sample |

Excluded Workbook exercises: 1 *Match* (matching), 4 *Listen and choose* (listening), 5 *Match* (matching), 7 *Read and do the task below* (tick/cross).

**Total for this lesson: 11 writing activities (6 Pupil's Book, 5 Workbook).**

## Changes in this batch

- Added `lesson4-writing-practice.js` to both pages with per-activity storage `efc_writing_<page>_v1:<id>`, visible persistence status, labelled illustrative samples for open-ended/personal prompts, documented exception for `pb-1`, and synchronous reset.
- Preserved all existing IDs, `efc_grade4_unit1_lesson4:practice:<path>` migration, and page-level reset.
