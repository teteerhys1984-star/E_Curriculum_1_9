# Source checklist — Grade 5, Unit 1, Lesson 4 “The Five Senses”

Verified from the six supplied scans only. Nothing on this list was taken from memory, from Lesson 3, or from another grade.

## 1. Supplied images (byte-for-byte copies)

| Upload | Printed page | Repository file | Pixels | SHA-256 |
|---|---|---|---|---|
| `image-1` | Pupil’s Book p. 12 | `assets/grade5-unit1-lesson4/source/pupil-book-page-12.png` | 762×1050 | `5cecfc250cdfe63f…` |
| `image-2` | Pupil’s Book p. 13 | `assets/grade5-unit1-lesson4/source/pupil-book-page-13.png` | 732×1023 | `2de87d8f76cca2a4…` |
| `image-3` | Pupil’s Book p. 14 | `assets/grade5-unit1-lesson4/source/pupil-book-page-14.png` | 757×1017 | `18112e3024f82967…` |
| `image-4` | Workbook p. 14 | `assets/grade5-unit1-lesson4/source/workbook-page-14.png` | 751×1018 | `2edff3f77f6ab4b6…` |
| `image-5` | Workbook p. 15 | `assets/grade5-unit1-lesson4/source/workbook-page-15.png` | 727×1017 | `4dacb00925309cc7…` |
| `image-6` | Workbook p. 16 | `assets/grade5-unit1-lesson4/source/workbook-page-16.png` | 751×1014 | `45211c948eb69f12…` |

All six files were copied with a binary copy and their SHA-256 values are pinned in `assets/grade5-unit1-lesson4/source-manifest.json`. They were never re-encoded, cropped in place, or resized; `crops/` holds separate derived files.

## 2. Title, pages and structure

- Title verified from the page header on Pupil’s Book p. 12: **The Five Senses**. Unit number “4” is printed beside it.
- Pupil’s Book: pp. 12, 13, 14. Workbook: pp. 14, 15, 16 (the Workbook page numbers are printed in the page corners).
- Pupil’s Book activities: 1 (listen and choose ×5), 2 (listen and number ×5), 3 (look, ask and answer), Pronunciation (`fruit/juice`, `building/guitar`), 4 (five sense cards), 5 (before you read, two questions), 6 (text + a true/false ×4, b adjective/sense matching), Let’s Learn (sense verbs, `do/does`), 7 (choose between brackets ×5), 8 (Wh-questions ×4), 9 (write about the five senses).
- Workbook exercises: 1 (text with a true/false ×5 and b box fill ×5), 2 (match ×5), 3 (`do`/`does` ×4), 4 (match ×4), 5 (listen and choose ×5), 6 (listen and act), 7 (describe ×4), 8 (order words ×4), 9 (complete the paragraph).
- Exercise order and numbering follow the printed pages; the pages were split at the printed page breaks, not renumbered.

## 3. Items that the scans do not settle (and how the page handles them)

| Item | What the scan shows | Handling on the page |
|---|---|---|
| PB activity 1 | Five sentences with three options each; the recording decides the answer | Options reproduced exactly; **no key**, marked “Audio required; the recording was not supplied”, not scored |
| PB activity 2 | Five picture circles with empty number circles | Empty number fields, **no invented order**, not scored |
| PB activity 6b | A word box (bright, delicious, hot, bitter, sweet, cold, beautiful) with five sense columns | Matching offered as a free choice; the column layout is reproduced; no column is marked correct |
| WB exercises 5 and 6 | Listening tasks | Written prompts reproduced; audio disclosed as missing; not scored |
| Punctuation of the printed text | “sweet, bitter, bland and sour.” | Transcribed as printed, including the printed comma placement |

## 4. Derived crops (originals untouched)

| Crop | Source scan | Geometry |
|---|---|---|
| `pb12-pic-1-flowers.png` | `pupil-book-page-12.png` | 132×145+60+430 |
| `pb12-pic-2-house.png` | `pupil-book-page-12.png` | 132×145+200+430 |
| `pb12-pic-3-radio.png` | `pupil-book-page-12.png` | 132×145+342+430 |
| `pb12-pic-4-icecream.png` | `pupil-book-page-12.png` | 132×145+482+430 |
| `pb12-pic-5-pencil.png` | `pupil-book-page-12.png` | 132×145+622+430 |
| `pb12-ask-children.png` | `pupil-book-page-12.png` | 608×148+100+620 |
| `pb13-sense-cards.png` | `pupil-book-page-13.png` | 705×125+14+105 |
| `pb14-five-senses.png` | `pupil-book-page-14.png` | 302×245+418+652 |
| `wb16-pic-1-lemon.png` | `workbook-page-16.png` | 140×150+80+95 |
| `wb16-pic-2-rabbit.png` | `workbook-page-16.png` | 115×150+250+95 |
| `wb16-pic-3-glass.png` | `workbook-page-16.png` | 95×150+375+95 |
| `wb16-pic-4-pizza.png` | `workbook-page-16.png` | 185×150+500+95 |

Every crop is a plain `-crop` of the named source file, written to a new file. `assets/grade5-unit1-lesson4/crops-manifest.json` records the geometry, source file and source SHA-256 of each crop, plus the crop’s own SHA-256.
