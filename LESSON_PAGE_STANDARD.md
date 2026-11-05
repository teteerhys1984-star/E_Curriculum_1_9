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

## Before opening a PR
1. Confirm all four lesson sections load the shared script.
2. Confirm every step is reachable from the side index and Previous/Next.
3. Confirm the Lesson Test complies with all ten rules of the **Independent Lesson Test Policy** above and is covered by automated independence, objective-mapping, answer-key, persistence, scoring, and retry checks.
4. Confirm answer reveal, quiz scoring, saving, retrying, and links work end to end.
5. Check Vocabulary RTL cells and English LTR pages across desktop and mobile viewports.
6. Record any visual testing that was not performed; never claim a page was tested if it was not.
