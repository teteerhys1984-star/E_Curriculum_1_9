# Writing readiness and exceptions

This is a Writing-only record, not a claim that a whole lesson is complete. The prior audit report listed six table rows but counted eight activities: the first row grouped three distinct Grade 4 Lesson 1 listening activities. No activity has been added or reclassified to make the numbers fit.

## Source records

- Batch 1: [merged PR #73](https://github.com/teteerhys1984-star/E_Curriculum_1_9/pull/73), with its source-activity inventory; current handling is in `lesson1-writing-practice.js`. Grade 3 Lesson 1: 2 activities; Grade 4 Lesson 1: 14, including four exceptions.
- Batch 2: [merged PR #74](https://github.com/teteerhys1984-star/E_Curriculum_1_9/pull/74), with its source-activity inventory; current handling is in `lesson2-writing-practice.js`. Grade 3 Lesson 2: 3 activities; Grade 4 Lesson 2: 9, including two exceptions.
- Batch 3: [batch record](writing-batch3.md), [Grade 3 inventory](../grade3-unit1-lesson3/writing-inventory.md), [Grade 4 inventory](../grade4-unit1-lesson3/writing-inventory.md), and [merged PR #75](https://github.com/teteerhys1984-star/E_Curriculum_1_9/pull/75): 13 activities, one exception.
- Batch 4: [batch record](writing-batch4.md), [Grade 3 inventory](../grade3-unit1-lesson4/writing-inventory.md), [Grade 4 inventory](../grade4-unit1-lesson4/writing-inventory.md), and [merged PR #76](https://github.com/teteerhys1984-star/E_Curriculum_1_9/pull/76): 15 activities, one exception.
- Batch 5: [batch record](writing-batch5.md), [Grade 3 inventory](../grade3-unit1-lesson5/writing-inventory.md), [Grade 4 inventory](../grade4-unit1-lesson5/writing-inventory.md), with the current handling in `lesson5-writing-practice.js`. Grade 3 Lesson 5: 3 activities; Grade 4 Lesson 5: 15 activities. Six new exceptions, listed in the next section.

## Fourteen outstanding activities

All are Unit 1. Student interaction support exists; that is not a verified complete model.

| Batch | Grade / lesson | Book / printed page | Activity | Why unresolved | Current handling |
|---|---|---|---|---|---|
| 1 | G4 L1 | Pupil's Book p. 3 | Ex. 1, Listen and number | Recording not supplied; order cannot be verified. | Response entry, local persistence and reset; disclosed, no model; ask teacher for recording. |
| 1 | G4 L1 | Pupil's Book p. 3 | Ex. 2, Listen again and order | Recording not supplied; order cannot be verified. | Response entry, local persistence and reset; disclosed, no model; ask teacher for recording. |
| 1 | G4 L1 | Workbook p. 6 | Ex. 5, Listen and write the number | Recording not supplied; numbers cannot be verified. | Response entry, local persistence and reset; disclosed, no model; ask teacher for recording. |
| 1 | G4 L1 | Workbook p. 7 | Ex. 8, Write the correct form | Remaining picture cues do not establish unique pronouns with confidence. | Labelled partial example, original page link and teacher-review notice; remaining answers unverified. |
| 2 | G4 L2 | Pupil's Book p. 6 | Activity 3, Look and describe | The third sentence is dotted and no completed version is printed. | Explicit exception; sentence is practice only, not graded. |
| 2 | G4 L2 | Workbook p. 9 | Ex. 4, Listen and match | Two names cannot be matched or verified without the original recording. | Response entry, local persistence and reset; disclosed, no model; ask teacher for recording. |
| 3 | G3 L3 | Workbook p. 9 | Ex. 2, Listen and number | Recording not supplied; pictures do not establish the six-circle order. | Explicit exception; saved as practice only, not graded; no invented answer. |
| 4 | G4 L4 | Pupil's Book p. 12 | Ex. 1, Listen and number | Recording not supplied; pictures do not establish the listening order. | Explicit exception; numbers saved as practice only, not graded; no answer model. |
| 5 | G3 L5 | Pupil's Book p. 16 | Activity 2, Listen then complete the table | Recording not supplied; the three empty Sally cells cannot be verified from the print. | Explicit exception; cells saved as practice only, not checked; the personal “My name is……” column is disclosed as having no fixed answer. |
| 5 | G3 L5 | Workbook p. 17 | Ex. 6, Look, match then write | The printed sound pairs, pictures and word frames do not align row by row, and the book's own example line skips rows. | Columns kept as printed; the book's example is marked as the book's; only the word-level sound mapping is shown and labelled inferred; not graded. |
| 5 | G4 L5 | Pupil's Book p. 15 | Ex. 1, Listen and number | Recording not supplied; which number belongs in each of the nine bubbles cannot be verified. | Explicit exception; numbers saved as practice only, not graded; no answer model. |
| 5 | G4 L5 | Pupil's Book p. 18 | Revision 1 Ex. 2, Read and correct the underlined mistakes — item 5 | “Sally is brown eyes” cannot be repaired by changing the form of the underlined word, and the scan prints no completed version. | Items 1–4 verified; item 5 is a labelled example (“has got”) with the reason disclosed; not graded as a unique key. |
| 5 | G4 L5 | Workbook p. 18 | Ex. 5, Complete — items 2 and 3 | “Geography is ……” and “Art is ……” ask for an adjective the book never prints and provides no word bank for. | Items 1, 4, 5 and 6 verified; the two open adjectives are labelled illustrative and disclosed; not graded. |
| 5 | G4 L5 | Workbook p. 19 | Ex. 9, Write about your favourite subject | Personal writing: the subject, days and reasons are the pupil's own, so no unique answer exists. | Labelled illustrative sample marked “answers vary”; response entry, persistence and activity reset. |

See the cited batch record or PR for the inventory and `lessonN-writing-practice.js` for the current on-page notice. Original source scans are already in the repository for these activities.

## Mechanism and limits

`writing-readiness.json` holds reviewed lesson records and exceptions; `node tests/writing-readiness.mjs` reconciles them with `platform-shell.js` and reports each registered lesson as **Writing audited**, **Writing audited with documented exceptions**, or **Writing not yet audited**. State is derived from the existence of an audit and its exception list; no exception can be labelled fully verified by a status field. The checker rejects unregistered audited slugs, malformed records, duplicate exceptions, missing required fields and nonexistent local evidence. Focused tests pin the fourteen current exceptions until an evidence-based resolution updates both the record and tests.

This is a review/CI aid, not a public-site badge or a publication gate. It cannot establish that an inventory is exhaustive, that a model is correct, or that a referenced PR or document remains accurate; reviewers must inspect the source. Existing public registration and behavior are unchanged. Unaudited registered lessons stay explicitly unaudited in this report and checker.

Batch 5's static test records all 18 activity identifiers and checks source hashes, page sections, control counts and script wiring; it is not a 17-activity browser interaction test. Its browser test exercises four representative activities: Grade 3 Pupil's Book `pb-2` (audio exception), Grade 3 Workbook `wb-6` (layout exception), Grade 4 Pupil's Book `pb-7` (verified model) and Grade 4 Workbook `wb-11` (verified model), plus Grade 4 Workbook `wb-12` (personal, answers vary). It checks exception disclosure, model reveal/hide, non-overwriting comparison, editing, reload persistence and immediate isolated reset. The other 12 activities are not browser-tested.

Batch 4's static test records the 15 activity identifiers and checks source hashes, page sections and script wiring; it is not a 15-activity browser interaction test. The focused browser test exercises four representative activities: Grade 3 Workbook `wb-1`; Grade 4 Pupil's Book `pb-1` (audio exception) and `pb-11`; Grade 4 Workbook `wb-9`. It checks the exception disclosure where applicable, reveal/hide where a model exists, non-overwriting comparison, editing, reload persistence, and immediate reset plus reload. This does not establish browser interaction coverage for the other 11 activities.
