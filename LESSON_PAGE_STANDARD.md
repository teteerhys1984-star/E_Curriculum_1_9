# Lesson page standard

Every new lesson content page must load the shared lesson system. Do not copy navigation CSS or write page-specific Previous/Next logic.

## Required script
Add immediately before `</body>` on every Pupil's Book, Workbook, Vocabulary, and Lesson Test page:

```html
<script src="lesson-content-navigation.js" defer></script>
```

Do not add it to lesson-selection/menu pages. Menu pages can opt out with `<body data-nav-page="menu">`.

## Content structure
- Put content inside `<main class="wrap">` or `<div class="wrap">`.
- Book/workbook/vocabulary pages should organize meaningful chunks as sibling `<section class="panel">` blocks with an `<h2>` or `<h3>` heading.
- If a page has one large panel, use multiple sibling `<h2>`/`<h3>` headings so the shared script can split it into steps.
- Tests should use `<form id="quiz">` and mark each independently navigable question with `class="question"`.
- Keep answer reveal and scoring logic in the lesson page. Shared navigation must not replace assessment logic.
- Keep English text in `dir="ltr"` and restrict Arabic to word-level meanings marked `class="ar" lang="ar" dir="rtl"` on Vocabulary pages only.

## Writing practice standard (mandatory for all grades and lessons)

Before publishing or declaring Writing audited, inspect the original Pupil's/Student's Book and Workbook sources and record a source-based inventory of every activity requiring a written response. Identify its book, printed page, exercise, classification, source evidence, model or exception, and test coverage. Distinguish written production from oral, listening-only, matching or other non-writing tasks; explain borderline classifications.

- Provide a complete, source-verified student-facing model where the source supports one. Clearly label illustrative examples for personal or open-ended prompts as examples where answers vary, not unique answers.
- Explicitly disclose each audio-, image- or other source-dependent exception, its reason and current handling. An incomplete or partial example must not be presented as a verified complete model. Do not invent missing answers, recordings or evidence.
- Provide accessible response entry and editing, model reveal/hide when a model exists, and comparison without overwriting the student's response. Provide a deliberate activity-level reset that clears that activity without erasing other work. If no model can be verified, disclose that instead of presenting a fabricated reveal.
- Preserve drafts locally across reload and navigation; report storage failure and do not overwrite existing student responses when revealing a model. Preserve existing storage keys and migrate existing work safely if implementation changes them.
- Keep student-facing practice models distinct from teacher-only assessment answer keys. Do not copy a teacher-only key into a practice model. Do not use fake autograding or pretend a personal answer or unsupported source-dependent answer has a unique correct result.
- Test and record the actual scope of source/inventory checks and browser interactions separately, including model or exception, editing, persistence and isolated reset. Do not imply untested activities were browser-tested.

### Writing readiness record

`docs/english-curriculum-audit/writing-readiness.json` records source-audited lessons and their known exceptions; `node tests/writing-readiness.mjs` checks the records against the existing lesson registry and prints a state for every registered lesson. An absent audit record means **Writing not yet audited**, never compliant. A valid audit record with no listed exception means **Writing audited**; one with any exception means **Writing audited with documented exceptions**, not fully verified. These states cover Writing only, not overall lesson readiness.

When auditing a lesson, add its activity count, an inventory reference, and every unresolved exception with its book, page, activity, reason, handling and local evidence. Update those records and the focused regression fixtures only when a source-based review justifies the change. New lessons must be audited before being presented as Writing-complete. The checker validates record structure and local evidence paths; it cannot verify pedagogical accuracy or discover omitted activities, and it does not change the public registry or block legacy unaudited lessons from existing publication.

## Independent Lesson Test Policy (Mandatory for All Grades & Lessons)

Every **Lesson Test** (`*-test.html`) across Grades 1 to 9 must be an **independent pedagogical assessment**, completely separate from the textbook's printed exercises while measuring the exact same lesson learning objectives:

1. **Never copy textbook questions**: Do not copy any question, prompt, sentence item, or option pair from the Pupil's/Student's Book or Workbook into the Lesson Test.
2. **Never use textbook visuals, tables, or passages as test stimuli**: Do not base Lesson Test questions on cropped book illustrations, textbook charts/tables, or textbook reading passages. When assessing reading comprehension or chart/schedule interpretation, author a fresh, self-contained short passage or table exclusively for the test.
3. **No superficial rewording**: Do not merely swap character names, numbers, or word order in a sentence or exercise taken from the book.
4. **Author wholly original items**: Write brand-new questions with original phrasing, contexts, characters, schedules, and examples.
5. **Test the lesson's actual learning objectives**: Every question must assess a documented learning objective from the lesson — lesson vocabulary, grammar and structures, reading/functional comprehension and language use, and sentence-writing skills where appropriate. Declare the target objective on each question (`data-objective`).
6. **Match the learner's age and grade**: Keep sentence length, context, and cognitive demand appropriate for the target school grade.
7. **Single clear answer and reliable answer key**: Every scored item must have one unambiguous correct answer (avoiding multi-solution word-order scrambles or unsettled claims) backed by an accurate, verified teacher answer key.
8. **Stay strictly within taught curriculum content**: Never introduce vocabulary or grammar structures the pupil has not studied yet, and never make an answer depend on outside general knowledge beyond the lesson's language content.
9. **Maintain question variety and balanced length**: Combine varied question formats (such as contextual multiple choice, time or schedule reading, unseen short-passage comprehension, True/False, grammatical error correction, and guided sentence construction) instead of repeating a single question template. Choose a balanced question count suited to the lesson's objectives rather than padding artificially to 20.
10. **Keep original textbook pages untouched and fully solvable**: Pupil's/Student's Book and Workbook pages remain complete, faithful to the printed book, and answerable on screen. This independence policy applies to **Lesson Test** pages only.

## Expected behavior
The shared script provides the right-side step index, progress indicator, and centered Previous/Next controls beneath the content. Check desktop and narrow/mobile widths before considering a new lesson complete. Lesson Tests must also persist in-progress and scored attempts locally in the browser and clear that saved state cleanly when the pupil resets/retries the test.

## Registering a lesson in the curriculum

`platform-shell.js` holds the authoritative curriculum registry: the `LESSONS` object near the top of the file. It is the single source of truth for which lessons are published and ready. Every learner-facing and teacher-facing curriculum number is derived from it — the homepage hero totals and grade cards, the prepared-lessons directory, the `lessons.html` badges, summaries, grade switcher and lesson list, the `round-tests.html` coverage and individual Lesson Test directory, and the `teacher.html` and `teacher-resources.html` totals, per-grade cards and status matrix.

Add exactly one entry per published lesson:

```js
'grade4-unit1-lesson6': { grade: 4, unit: 1, lesson: 6, title: 'Where I Live', bookLabel: "Pupil's Book", answerKey: true },
```

- `title` is the lesson's real printed title, exactly as its lesson hub names it. Never invent or paraphrase one.
- `bookLabel` is `Pupil's Book` for Grades 1–6 and `Student's Book` for Grades 7–9.
- `answerKey` is `true` only when that lesson's `*-test.html` publishes a `#teacher-gate` answer-key area.
- Register a lesson only when all five pages exist, follow this standard, and pass their automated checks. A folder, a scan or a placeholder page is not a ready lesson, and lesson numbers must stay unbroken inside a unit so the published "Lessons 1–N" ranges stay true.

Never restate a count, a lesson range or a title list inside a page. Tag the markup with the existing derivation hooks instead — `data-curriculum-count`, `data-curriculum-count-words`, `data-curriculum-totals`, `data-curriculum-grade`, `data-curriculum-summary`, `data-curriculum-pages`, `data-curriculum-titles` and `data-curriculum-grade-count-words` — and keep the static text accurate, so the page still reads correctly with scripting disabled and cannot disagree with the registry once the shell runs.

`npm test` runs `tests/curriculum-registry.mjs`, which reconciles the registry against the published lesson pages and every display surface, and `npm run test:browser` runs `tests/curriculum-consistency.browser.mjs`, which renders all nine grade views plus every registered lesson page and requires the rendered text to match the registry. Both fail in either direction: a display left stale, and a complete lesson left unregistered.

## Before opening a PR
1. Confirm all four lesson sections load the shared script.
2. Confirm every step is reachable from the side index and Previous/Next.
3. Confirm the Lesson Test complies with all ten rules of the **Independent Lesson Test Policy** above and is covered by automated independence, objective-mapping, answer-key, persistence, scoring, and retry checks.
4. Confirm answer reveal, quiz scoring, saving, retrying, and links work end to end.
5. Check Vocabulary RTL cells and English LTR pages across desktop and mobile viewports.
6. Confirm the lesson is registered in `LESSONS` in `platform-shell.js` with its real title, correct `bookLabel` and correct `answerKey`, and that the derived counts on the homepage, `lessons.html`, `round-tests.html` and both teacher pages all moved together.
7. Record any visual testing that was not performed; never claim a page was tested if it was not.
