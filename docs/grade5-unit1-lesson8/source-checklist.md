# Source checklist — Grade 5, Unit 1, Lesson 8 “Inventions”

Verified from the six supplied scans only. Nothing here was taken from memory, from another lesson, or from another grade.

## 1. Supplied images (byte-for-byte copies)

| Upload | Printed page | Repository file | Pixels | SHA-256 |
|---|---|---|---|---|
| image-1 | Pupil’s Book p. 27 | `assets/grade5-unit1-lesson8/source/pupil-book-page-27.png` | 751×1030 | `2ee901a09dae0969…` |
| image-2 | Pupil’s Book p. 28 | `assets/grade5-unit1-lesson8/source/pupil-book-page-28.png` | 756×1038 | `3d4e087a6908085e…` |
| image-3 | Pupil’s Book p. 29 | `assets/grade5-unit1-lesson8/source/pupil-book-page-29.png` | 736×1026 | `f7ec69bab5d62725…` |
| image-4 | Workbook p. 28 | `assets/grade5-unit1-lesson8/source/workbook-page-28.png` | 739×1014 | `a970718308782bd6…` |
| image-5 | Workbook p. 29 | `assets/grade5-unit1-lesson8/source/workbook-page-29.png` | 730×1033 | `ca8d2c7a33b0bd74…` |
| image-6 | Workbook p. 30 | `assets/grade5-unit1-lesson8/source/workbook-page-30.png` | 736×1021 | `591743dd47b0b87e…` |

All six files were copied with a binary copy and their SHA-256 values are pinned in `assets/grade5-unit1-lesson8/source-manifest.json`. They were never re-encoded, cropped in place or resized; `crops/` holds separate derived files. Each stored file was re-hashed against the original upload and matched byte-for-byte.

## 2. Title, pages and structure

- Title verified from the printed page header: **Inventions**, with the unit and lesson numbers printed beside it.
- Pupil’s Book: pages 27–29 (Lesson 8) or 30–32 (Lesson 9) as listed above; Workbook: pages 28–30 or 31–33, likewise.
- Pupil’s Book activities: 1 a (listen and number, five pictures), 1 b (listen again and match five inventors to five items), 2 (ask and answer, three printed bubbles), Pronunciation **u:** (five words), 3 (ask and answer over the comparison picture), 4 (five gaps with inventor / invention / invent), 5 (the reading text, then a: choose ×3 and b: true or false ×3), the Let’s Learn box, 6 (underline the past simple verb in five sentences), 7 (three sentences with the printed ✓ / ✗ / ? markers), 8 (write about your invention).
- Workbook exercises: 1 (write the number next to five pictures; printed panel 1 Vaccination · 2 Television · 3 Wi-Fi · 4 Radium · 5 Electric light), 2 (match four questions to four answers), 3 (talk about the inventions), 4 (practise a similar conversation), 5 (three gaps with invent / inventor / inventions), 6 (listen and tick the invention), 7 (find the past in the word search; eight base verbs), 8 (read the three boxes on Bell, Becquerel and Lamarr, then a: choose ×3 and b: true or false ×2), 9 (write about your favourite invention).
- Exercise order and printed numbering follow the scans exactly.

## 3. Items the scans do not settle

`source-defects.md` in this directory lists every such item with the exact printed string and the decision taken. Every decision is one of three kinds, and the page always says which one applies:

1. reproduce the printed text exactly and add a note describing it;
2. leave the item unscored and state the reason (missing recording, printed ordering that cannot be settled);
3. treat the item as open and show an illustrative example, clearly labelled as an illustration rather than a key.

## 4. Derived crops (originals untouched)

| Crop | Source scan | Geometry (width×height+x+y) |
|---|---|---|
| `pb27-inventions.png` | `pupil-book-page-27.png` | 725×165+20+215 |
| `pb27-panels.png` | `pupil-book-page-27.png` | 575×175+130+458 |
| `pb27-dialogue.png` | `pupil-book-page-27.png` | 730×235+15+640 |
| `pb28-umbrella.png` | `pupil-book-page-28.png` | 700×215+18+404 |
| `pb29-letslearn.png` | `pupil-book-page-29.png` | 680×175+30+60 |
| `pb29-inventorbox.png` | `pupil-book-page-29.png` | 650×270+30+690 |
| `wb28-pictures.png` | `workbook-page-28.png` | 690×285+15+175 |
| `wb29-wordsearch.png` | `workbook-page-29.png` | 650×320+58+698 |
| `wb30-infoboxes.png` | `workbook-page-30.png` | 710×290+15+175 |

Every crop is a plain rectangle of its unchanged source scan, and `tests/grade5-unit1-lesson8.mjs` re-cuts each one from the source and compares the SHA-256 values before the suite passes.
