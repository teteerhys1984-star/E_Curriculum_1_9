# Source-by-source review — Grade 3, Unit 1, Lesson 2

## Reference and method

- The title visible in the source is **School Subjects**.
- The six supplied images are the authoritative source; OCR output was not used as a substitute.
- Images 1–3 are Student’s Book pages 6–8. Images 4–6 are Workbook pages 6–8.
- All six source-image files are preserved unchanged. Their SHA-256 hashes and dimensions are recorded in the [source manifest](../../assets/grade3-unit1-lesson2/source-manifest.json).
- The scans and their crops were visually reviewed. There are 27 source crops plus one clearly named English-normalised display derivative.
- Vocabulary translations, English editorial notes, and interface controls are supporting additions, not quotations from the books. Arabic appears in the Vocabulary page only as individual word or vocabulary-item meanings.
- “Explicit” means the source text, table, or picture gives the answer directly. “Inferred” means a matching, table reading, or sequence completion, with its basis explained. No listening answer has been invented.
- The Workbook page 6 source scan, full listening-exercise crop (`crops/workbook-page-6-listen-and-tick.png`), and item-2 crop (`crops/workbook-page-6-listen-row-2.png`) contain Arabic calligraphy inside one subject icon. All three original image assets are preserved byte-for-byte and none is displayed on the learner-facing page; item 2 uses a separate display derivative that replaces only the calligraphy with the Latin label “AR”.

## Student’s Book — [interactive page](../../grade3-unit1-lesson2-pupil-book.html)

| Page | Activity / item | Implementation | Status and note |
|---|---|---|---|
| 6 | Title `2 School Subjects` | Lesson title retained; grade and unit details are added outside the transcription | Preserved |
| 6 | 1 — `Listen and read.` | All five activities are kept in source order; the six dialogues are arranged left-to-right and top-to-bottom | Preserved; source images retained |
| 6 | Dialogue 1 | `What lessons have we got today?` / `Today we've got Maths and Science.` | Wording and speakers preserved; no speaker names invented |
| 6 | Dialogue 2 | `What's your favourite lesson?` / `My favourite lesson is Sports.` | Wording and speakers preserved |
| 6 | Dialogue 3 | `Have we got Arabic today?` / `No, we haven't. We've got Social Studies.` | The negative answer and alternative subject are preserved |
| 6 | Dialogue 4 | `Hello, pupils! Open your books. We've got English today.` | Teacher illustration, speech bubble, and characters retained; no personal name added |
| 6 | Dialogue 5 | `Tomorrow, I've got Music. I like Music.` | Thought bubble and illustration retained |
| 6 | Dialogue 6 | `On Tuesday, we've got Art. We need crayons.` | Tuesday, colours, and illustration retained |
| 6 | Activity 1 and audio | Listening instruction retained with a notice that the recording was not supplied | No recording, transcript, or substitute answer key |
| 7 | 2 — `Let’s learn!` | `What lessons have we got today?` / `Today we have got Science and Maths.` / `My favourite lesson is Maths.` | Preserved; `have got` is not replaced with the wording from Activity 1 |
| 7 | 3 — `Ask and answer.` | `What lessons have you got on Wednesday?` / `On Wednesday, I've got Art and English.` | Question and answer preserved as printed |
| 7 | Timetable, Monday | Science, Maths, Arabic, English | Four rows and columns preserved |
| 7 | Timetable, Tuesday | Arabic, Art, Sports | Three entries, as in the source; no fourth cell added |
| 7 | Timetable, Wednesday | Music, Art, English, Arabic | Four entries preserved; the shorter spoken answer is noted separately |
| 7 | Timetable, Thursday | Art, Maths, Social Studies, Science | Four rows and columns preserved |
| 8 | 4 — `Listen and repeat.` | 21–30 with the words twenty-one through thirty | All numbers and words retained in order |
| 8 | 5 — sound instructions | `Listen to the following sounds and words, then repeat them.` | Preserved, with an unavailable-audio notice |
| 8 | Sound, words, and pictures | `ou`, `house`, `mouse`, a house, and a mouse | Preserved; no pronunciation recording is assumed |

**The source’s only content discrepancy:** the spoken Wednesday answer names Art and English, while the Wednesday timetable contains four subjects. Both are preserved, with a visible note not to treat the spoken example as a complete list of that day’s lessons. The source has not been silently corrected or forced into one interpretation.

## Workbook — [interactive page](../../grade3-unit1-lesson2-workbook.html)

| Page | Exercise / item | Implementation | Answer type / status |
|---|---|---|---|
| 6 | 1 — `Listen and tick (✓).` | All four pairs of choices are kept in order | Requires the recording; no key is assumed |
| 6 | Listening item 1 | Maths / Science | Preserved |
| 6 | Listening item 2 | English / Arabic | Preserved. The original calligraphy icon is replaced only in the learner-facing display derivative; the source scan, full-exercise crop, and item crop are retained unchanged and are not displayed. |
| 6 | Listening item 3 | Music / Sports | Preserved |
| 6 | Listening item 4 | Social Studies / Art | Preserved; this row was added after checking the original crop |
| 6 | 2 — `Read and match.` | All three questions and all three options are retained | Matches are inferred from the text |
| 6 | Question 1 | `What lessons have we got today?` → b: `Today, we’ve got Art and Music.` | Inferred |
| 6 | Question 2 | `What's your favourite lesson?` → c: `My favourite lesson is English.` | Inferred |
| 6 | Question 3 | `What have you got on Tuesday?` → a: `On Tuesday, I’ve got Maths.` | Inferred; kept distinct from the Student’s Book timetable |
| 7 | 3 — `Read and match.` | Left: 21, 30, 29. Right: 28, 23, 22. Centre: all six words in printed order | Every number, word, and option is retained |
| 7 | Number matches | 29→twenty-nine; 22→twenty-two; 30→thirty; 21→twenty-one; 28→twenty-eight; 23→twenty-three | Direct word/value matches; answers are optionally revealed |
| 7 | 4 — `Write the missing numbers.` | 21, 22, blank, 24, blank, blank, 27, 28, blank, 30; original apple path retained | Exactly four blanks; printed numbers are not turned into blanks |
| 7 | Exercise 4 completion | 23, 25, 26, 29, in order | Inferred from the sequence and labelled accordingly |
| 8 | 5 — `Look and complete.` | Sunday, Monday, Tuesday; four lesson columns; printed pictures and subjects | Preserved in a horizontally scrollable table |
| 8 | Sunday | Maths, Art, EN-book icon with a blank, Arabic | Only the third blank is completed: English; inferred from the picture and lesson subjects |
| 8 | Monday | Flask icon with a blank, Music, Arabic, English | Only the first blank is completed: Science; inferred from the picture and lesson subjects |
| 8 | Tuesday | Arabic, player icon with a blank, Social Studies, arithmetic icon with a blank | The two blanks are Sports and Maths; inferred |
| 8 | 6 — `Write about yourself.` | `What's your favourite lesson?` and the sentence starter `My` with a writing line | Preserved; open personal response, not automatically scored |

Listening and personal writing are excluded from the automated test score. Learner responses are not sent to a server or saved.

## Vocabulary — [page](../../grade3-unit1-lesson2-vocabulary.html)

The page is organised into five English sections: school subjects; days and time words; numbers 21–30; other lesson vocabulary; and English examples and notes.

- The eight subjects—Maths, Science, Arabic, English, Sports, Social Studies, Music, and Art—are all present in the source. Their Arabic meanings are word-level entries with references to source pages.
- The days, time words, numbers, and other lesson vocabulary are retained. Number translations and vocabulary meanings are supporting additions, not printed text.
- `ou`, `house`, and `mouse` are retained. The page does not claim that every spelling containing `ou` has the same sound.
- The English examples `What lessons have we got today?`, `Today we have got Science and Maths.`, `What's your favourite lesson?`, and `My favourite lesson is Maths.` are retained without Arabic sentence translations.
- No games, flip cards, or generated pronunciation recordings have been added.

## Lesson Test — [page](../../grade3-unit1-lesson2-test.html)

The test has 20 questions with three options per question. Its questions are new teaching prompts based only on the supplied material: 15 direct readings and 5 labelled inferences. It does not test listening choices or the open personal response.

| Question | Page / activity | Basis | Answer | Classification |
|---|---|---|---|---|
| 1 | PB 6 / 1 | Lessons in the first dialogue | Maths and Science | Explicit |
| 2 | PB 6 / 1 | Favourite lesson in the second dialogue | Sports | Explicit |
| 3 | PB 6 / 1 | `No, we haven't. We've got Social Studies.` | Social Studies | Explicit |
| 4 | PB 6 / 1 | Teacher’s instruction to open books | Open your books | Explicit |
| 5 | PB 6 / 1 | Tomorrow’s lesson | Music | Explicit |
| 6 | PB 6 / 1 | Need for crayons in Art | Crayons | Explicit; the football distractor is based on the sports illustration, not invented textbook wording |
| 7 | PB 7 / 2 | `My favourite lesson is Maths.` | Maths | Explicit |
| 8 | PB 7 / 3 | The two subjects in the Wednesday dialogue answer | Art and English | Explicit; asks about the sentence, not the whole timetable |
| 9 | PB 7 / timetable | First entry in Monday’s column | Science | Direct reading |
| 10 | PB 7 / timetable | Subjects in Tuesday’s column | Arabic, Art, Sports | Direct reading |
| 11 | PB 7 / timetable | The other two subjects in Wednesday’s column | Music and Arabic | Direct reading |
| 12 | PB 7 / timetable | Subject in Thursday’s column | Social Studies | Direct reading |
| 13 | WB 7 / 3 | Number matching `twenty-eight` | 28 | Direct reading; both sides are printed in the source |
| 14 | PB 8 / 4; WB 7 / 3 | Word matching 30 | thirty | Explicit |
| 15 | PB 8 / 5 | Two words paired with the `ou` sound | house and mouse | Explicit |
| 16 | WB 6 / 2 | Match to the favourite-lesson question | c — My favourite lesson is English. | Inferred from question and answer meaning |
| 17 | WB 6 / 2 | Match to the question about today’s lessons | b — Today, we’ve got Art and Music. | Inferred from question and answer meaning |
| 18 | WB 7 / 4 | Number immediately after printed 24 in the apple sequence | 25 | Inferred from the sequence; not printed in the blank |
| 19 | WB 8 / 5 | EN book icon on Sunday | English | Inferred from the picture |
| 20 | WB 8 / 5 | Player icon on Tuesday | Sports | Inferred from the picture |

The teacher key is separate from the pupil test and uses the project’s existing password gate. It explains the evidence and classification for each item. This browser-side display gate is **not secure authentication**; the password and answers can be read from the static site source. The project’s password and other lessons have not been changed.

## Suggested human review

1. Verify the audio choices and pronunciation against the original recordings if they become available. There are no approved listening answers at present.
2. Ask a teacher to review the Arabic vocabulary meanings; they are not official translations in the supplied images.
3. Review the Wednesday spoken-answer/table difference. It is documented but not resolved by an unsupported interpretation.
4. Test on school devices and with screen readers, in addition to the automated checks documented in the [verification report](verification.md).
