# Lesson page standard

All new lesson content pages must load the shared lesson system. Do not copy navigation CSS or write a page-specific Previous/Next implementation.

## Required script

Add this immediately before `</body>` on every Pupil's Book, Workbook, Vocabulary, and Lesson Test page:

```html
<script src="lesson-content-navigation.js" defer></script>
```

Do not add it to lesson-selection/menu pages. Menu pages may use `<body data-nav-page="menu">` to explicitly opt out.

## Content structure

- Put lesson content inside `<main class="wrap">` or `<div class="wrap">`.
- For book/workbook/vocabulary pages, organize meaningful chunks as sibling `<section class="panel">` blocks. Give each panel an `<h2>` or `<h3>` heading.
- If a page has one large panel, use multiple sibling `<h2>` / `<h3>` headings so the shared script can split it into steps.
- For tests, put questions inside `<form id="quiz">` and mark each independently navigable question with `class="question"`.
- Keep answer-reveal controls and scoring logic in the lesson itself; the shared navigation only hides/shows steps and should not replace assessment logic.
- Keep Arabic/English mixed text in semantic elements such as `p`, `li`, headings, labels, table cells, and form fields. The shared script applies automatic direction.

## Expected behavior

The shared script provides the right-side step index, progress indicator, and centered Previous/Next controls under the content. Check the page at desktop width and a narrow/mobile width before considering a new lesson complete.

## Before opening a PR

1. Confirm all four lesson sections load the shared script.
2. Confirm every step is reachable from the side index and Previous/Next.
3. Confirm answers, quiz scoring, and links still work.
4. Check mixed Arabic/English paragraphs and inputs.
5. Record any visual testing that was not performed; never claim a page was tested if it was not.
