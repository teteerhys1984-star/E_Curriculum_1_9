# Grade 8 · Unit 1 · Lesson 3 — Let's Discover

## Scope and source mapping

The site route is Grade 8, Unit 1, Lesson 3, following the existing Grade 8 directory. The supplied pages themselves say Module 2, Unit 3; the Workbook also says Journeys Around the World. The source headers are retained and the difference is disclosed on the lesson menu.

| Upload | Source | Printed page |
| --- | --- | --- |
| image-1.png | Student's Book | 20 |
| image-2.png | Student's Book | 21 |
| image-3.png | Student's Book | 22 |
| image-4.png | Student's Book | 23 |
| image-5.png | Student's Book | 24 |
| image-6.png | Student's Book | 25 |
| image-7.png | Workbook | 10 |
| image-8.png | Workbook | 11 |
| image-9.png | Workbook | 12 |
| image-10.png | Workbook | 13 |

Originals are copied without re-encoding into `assets/grade8-unit1-lesson3/source/`. The source manifest records the mapping, byte counts, PNG dimensions and SHA-256 values; `source-sha256.txt` can be checked from the repository root with `sha256sum --check assets/grade8-unit1-lesson3/source-sha256.txt`. Seven independent, unscaled rectangular crops, their geometries and hashes are listed in `crops-manifest.json`. The new static test compares decoded crop pixels against the source rectangle when ImageMagick is available.

## Implemented sections

- Menu: source mapping, learning overview, links, teacher disclosure.
- Student's Book: transport discussion; Spain reading and glossary; open reading questions and multiple choice; word search and six completions; present-perfect survey; Jerry's call and reported-speech choices; listening prompts; sequenced email.
- Workbook: speaking; Australia reading and glossary; open reading questions and true/false; six crossword entries; present-perfect rules and five completions; reported-speech tables, bracket choices and thirteen open rewrites; listening prompts; personal email.
- Vocabulary: separate English glossaries as printed on the respective source pages. No Arabic translations were supplied or invented.
- Lesson Test: twelve new, explicitly editorial questions with an original brief reading stimulus, true/false and multiple choice; target objectives, a published teacher key, scoring and retry. It is not a textbook test.

Practice is saved locally per page and activity, with activity resets. Objective checks cover verifiable closed answers; open reading, survey, speaking, writing and rewrites are saved for human review, not falsely marked against a single string. The test stores selections and submitted score locally. Its classroom password gate is not authentication, as the key and password are published in the page source. In-page guidance is also available to pupils.

## Source-review decisions and limitations

- Neither official listening recording was supplied. Both sets of six printed questions and their choices remain available for saved practice, but are not auto-scored; no transcript or listening key was inferred.
- Student's Book p. 22 B2: the passage says about 800 kilometers, while the three printed choices are eighty kilometers, eighty meters and forty kilometers. The printed choices are retained, with no marked correct choice or score.
- Student's Book p. 22 A2 asks whom the travellers contacted, but the reading only says the tourist company organized and confirmed the trip. Guidance calls the company an inference, not a stated contact.
- The p. 22 word search is preserved as an image and an accessible letter grid. The grid spells the intended words as `accompnied` and `cosfirmed`; correctly spelled forms from the passage are used for the separate sentence gaps. No grid letters are repaired.
- The p. 23 survey omits the auxiliary in items 4–7; the printed prompt is preserved and the auxiliary is explained separately. The reported paragraph's `it is delicious` is also retained.
- Student's Book p. 24 spells the inventor Hie and Hei in different items; both forms are preserved. The image cannot verify listening answers.
- Student's Book p. 25 mentions a trip to South Africa and a flight to Greece without explaining the itinerary. Both references and the lost-passport ending are retained; only the four sequencers are scored.
- Workbook p. 10's wording, including `them immediately` and its descriptions of Australia, is retained as textbook language rather than silently corrected or independently endorsed. Workbook p. 11's crossword asks for singular `exception` while the glossary prints plural `exceptions`.
- Workbook p. 12 prints `persone`; p. 13 item D7 prints `My job is easy to me`. Both are retained. The rewrites are open to teacher review, including acceptable `that`, contractions, pronouns and context-dependent time references; the source does not specify when Saturday is being reported.

## Checks

`npm test` and `npm run test:browser` include the lesson-specific static and Playwright suites. The tests cover source and crop integrity, source-text and activity fixtures, the independent test, navigation, checking, unscored audio and invalid item, saving, reset, teacher gate and desktop/mobile overflow. `tests/c3-content-integrity.mjs` protects the original baseline; the extension enumerates the five added pages and exact reversible directory edits. The static and browser workflows passed locally; older Grade 5 optional Pillow-based crop recuts were skipped because Pillow is not installed, while their hashes passed. The new lesson's seven crop pixel comparisons passed using ImageMagick.
