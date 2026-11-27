# Source checklist — Grade 5, Unit 1, Lesson 9 “Music”

Verified from the six supplied scans only. Nothing here was taken from memory, from another lesson, or from another grade.

## 1. Supplied images (byte-for-byte copies)

| Upload | Printed page | Repository file | Pixels | SHA-256 |
|---|---|---|---|---|
| image-7 | Pupil’s Book p. 30 | `assets/grade5-unit1-lesson9/source/pupil-book-page-30.png` | 756×1033 | `c30566494b87ff85…` |
| image-8 | Pupil’s Book p. 31 | `assets/grade5-unit1-lesson9/source/pupil-book-page-31.png` | 736×1027 | `8bbc9d010b97e531…` |
| image-9 | Pupil’s Book p. 32 | `assets/grade5-unit1-lesson9/source/pupil-book-page-32.png` | 763×1036 | `b45b23474d1290b7…` |
| image-10 | Workbook p. 31 | `assets/grade5-unit1-lesson9/source/workbook-page-31.png` | 724×1042 | `12ebbb3f91abd51e…` |
| image-11 | Workbook p. 32 | `assets/grade5-unit1-lesson9/source/workbook-page-32.png` | 721×1006 | `7ff80f7c7f7b8afd…` |
| image-12 | Workbook p. 33 | `assets/grade5-unit1-lesson9/source/workbook-page-33.png` | 724×991 | `68dd3e43847f456c…` |

All six files were copied with a binary copy and their SHA-256 values are pinned in `assets/grade5-unit1-lesson9/source-manifest.json`. They were never re-encoded, cropped in place or resized; `crops/` holds separate derived files. Each stored file was re-hashed against the original upload and matched byte-for-byte.

## 2. Title, pages and structure

- Title verified from the printed page header: **Music**, with the unit and lesson numbers printed beside it.
- Pupil’s Book: pages 27–29 (Lesson 8) or 30–32 (Lesson 9) as listed above; Workbook: pages 28–30 or 31–33, likewise.
- Pupil’s Book activities: 1 (listen and choose the speaker ×4), 2 (listen and repeat, six labelled instrument pictures), 3 (ask and answer), Pronunciation **æ** and **ɑː** (three words each plus the model sentence), 4 (picture task with six named children), 5 (two pre-reading questions), 6 (the “MJ” reading, then a: choose ×4 and b: match ×3), the Let’s Learn box, 7 (four gaps with am / is / are), 8 (four pictures to write about), 9 (choose ×3), 10 (complete the paragraph).
- Workbook exercises: 1 (correct six printed misspellings, then match), 2 (the music reading, then a: choose ×4 and b: fill four gaps), 3 (listen and number eight instruments), 4 (listen and choose ×4), 5 (read then act out), 6 (talk about yourself), 7 (listen and classify eight words into “car / cat”), 8 (choose ×5 across a six-line dialogue), 9 (write five sentences from Lily’s list), 10 (write about your weekend).
- Exercise order and printed numbering follow the scans exactly.

## 3. Items the scans do not settle

`source-defects.md` in this directory lists every such item with the exact printed string and the decision taken. Every decision is one of three kinds, and the page always says which one applies:

1. reproduce the printed text exactly and add a note describing it;
2. leave the item unscored and state the reason (missing recording, printed ordering that cannot be settled);
3. treat the item as open and show an illustrative example, clearly labelled as an illustration rather than a key.

## 4. Derived crops (originals untouched)

| Crop | Source scan | Geometry (width×height+x+y) |
|---|---|---|
| `pb30-instruments.png` | `pupil-book-page-30.png` | 715×185+12+415 |
| `pb30-pron.png` | `pupil-book-page-30.png` | 690×175+20+760 |
| `pb31-band.png` | `pupil-book-page-31.png` | 465×275+295+20 |
| `pb31-reading.png` | `pupil-book-page-31.png` | 700×190+15+415 |
| `pb32-letslearn.png` | `pupil-book-page-32.png` | 710×175+15+40 |
| `pb32-pictures.png` | `pupil-book-page-32.png` | 712×325+15+382 |
| `wb31-ex1.png` | `workbook-page-31.png` | 715×135+8+143 |
| `wb31-reading.png` | `workbook-page-31.png` | 700×205+15+298 |
| `wb32-classify.png` | `workbook-page-32.png` | 710×270+6+752 |
| `wb33-list.png` | `workbook-page-33.png` | 690×215+10+300 |

Every crop is a plain rectangle of its unchanged source scan, and `tests/grade5-unit1-lesson9.mjs` re-cuts each one from the source and compares the SHA-256 values before the suite passes.
