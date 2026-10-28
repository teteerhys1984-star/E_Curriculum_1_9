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
- Keep mixed Arabic/English text in semantic elements and form fields so automatic direction can be applied.

## Expected behavior
The shared script provides the right-side step index, progress indicator, and centered Previous/Next controls beneath the content. Check desktop and narrow/mobile widths before considering a new lesson complete.

## Before opening a PR
1. Confirm all four lesson sections load the shared script.
2. Confirm every step is reachable from the side index and Previous/Next.
3. Confirm answer reveal, quiz scoring, and links still work.
4. Check mixed Arabic/English paragraphs and inputs.
5. Record any visual testing that was not performed; never claim a page was tested if it was not.
