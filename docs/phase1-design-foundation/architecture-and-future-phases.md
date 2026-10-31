# Phase 1 Architecture & Future-Phase Extension Plan

## 1. Phase 1 Architecture Summary

Phase 1 upgrades the English Full Curriculum (`Grades 1–9`) from fragmented per-page inline CSS into a cohesive, lightweight static platform without introducing build-step complexity, external CDNs, or unrequested backend dependencies.

### Shared Runtime Layers

| Layer | File | Responsibility |
| :--- | :--- | :--- |
| Design Tokens & Components | [`design-system.css`](../../design-system.css) | Local `@font-face` declarations, brand/semantic colour tokens, typography scale, responsive grid layouts, header/drawer, breadcrumbs, section tabs, cards, forms, tables, alerts, step/quiz rail, reduced-motion, and print styles. |
| Platform Shell & Navigation | [`platform-shell.js`](../../platform-shell.js) | Injects accessible `.skip-link`, global `.site-header` + mobile drawer, contextual `.breadcrumbs`, standardized 5-tab `.section-links`, `.table-scroll` wrappers, section body classes (`book-pupil`, `book-workbook`, `book-vocabulary`, `book-test`), and validated browser-local recent-visit tracking (`window.EFCPlatform`). |
| Step & Quiz Navigator | [`lesson-content-navigation.js`](../../lesson-content-navigation.js) | Enforces English `dir="ltr"` outside `.ar`, splits single-panel pages into step panels, mounts the integrated 2-column `.content-nav` rail (or 5-column `.is-quiz-nav` grid on tests), tracks `.is-answered` question states, and stacks cleanly in normal flow on viewports `< 980px`. |
| Lesson-Specific Activity Layouts | [`grade3-unit1-lesson2.css`](../../grade3-unit1-lesson2.css), [`grade4-unit1-lesson2.css`](../../grade4-unit1-lesson2.css) | Thin activity-specific styles (cropped scan figures, dialogue cards, family tree grid, fill-in lines) consuming `design-system.css` tokens. |

---

## 2. Authoring Contract for New Lessons (Phase 2 Ready)

Adding a new verified lesson (for example `grade4-unit1-lesson3`) requires zero duplicated global CSS:

1. Create the 5 standard HTML files (`<slug>.html`, `-pupil-book.html`, `-workbook.html`, `-vocabulary.html`, `-test.html`) following [`LESSON_PAGE_STANDARD.md`](../../LESSON_PAGE_STANDARD.md).
2. Include `<link rel="stylesheet" href="design-system.css">` and `<script src="platform-shell.js" defer></script>` in `<head>`.
3. Mark the lesson hub `<body data-nav-page="menu">` and load `<script src="lesson-content-navigation.js" defer></script>` on the four content subpages.
4. Register the new lesson metadata once in `LESSONS` inside [`platform-shell.js`](../../platform-shell.js) (`window.EFCPlatform.LESSONS`) and in the Grade curriculum list in [`lessons.html`](../../lessons.html) and [`index.html`](../../index.html). Breadcrumbs, 5-tab section links, status badges, and browser-local Continue Learning support activate automatically.

---

## 3. Intentional Phase 1 Scope Boundaries

In accordance with Phase 1 governance and academic integrity rules, the following are **intentionally out of scope** in Phase 1:

- **No Authentication or Accounts**: Zero login forms, registration flows, or simulated student profiles.
- **No Simulated Client-Side Security Roles**: Existing lesson tests keep their transparent local self-check / teacher review conveniences strictly for classroom projection, without claiming client-side access control security.
- **No Fake Progress Dashboards**: `window.EFCPlatform` stores only the single most recently opened prepared lesson page in `localStorage` (`efc_recent_visit_v1`) on the active browser, validated against the allowlist of real prepared pages, with an explicit **Clear saved place** action.
- **No Invented Curriculum or Audio Data**: Unsupplied official audio tracks remain explicitly disclosed as unscored/pending; template grades (`Grades 1, 2, 6, 7, 9`) and `Round 1` tests (which require 5 verified lessons per round) are transparently badged as upcoming/pending.

---

## 4. Clean Extension Seams for Future Phases

### Phase 2 — Curriculum Expansion & Official Audio Pipeline
- **Lesson Scaling**: Populate remaining Unit 1 lessons across Grades 1–9 using the shared 5-page template; once 5 lessons in a round are verified, unlock the corresponding 40-question Round Test in [`round-tests.html`](../../round-tests.html).
- **Verified Audio Integration**: Replace `.notice` / `.answer.pending` placeholders with a shared `<audio>` component styled in `design-system.css` only when official textbook recordings and verified listening keys are supplied.

### Phase 3 — Backend API, Real Authentication & Teacher Workflows
- **Authentication & Role Enforcement**: Introduce server-verified session authentication (`student`, `teacher`, `school_admin`) backed by an API/database layer. Move teacher answer keys and round-test keys behind server-authorized endpoints rather than static client bundles.
- **Progress Persistence Adapter**: Replace the browser-local `window.EFCPlatform` storage adapter with an authenticated progress service syncing completed exercises and quiz attempts across devices while keeping the existing homepage Continue Learning UI contract.
- **Classroom Management**: Add teacher class rosters, assigned lesson queues, and printable/exportable unit review sheets using the existing token and card primitives.

### Phase 4 — Analytics, School Administration & Subscriptions
- **Mastery & Item Analytics**: Server-aggregated question-level performance by grade, unit, and direct-vs-inference skill tags.
- **Institutional Licensing**: School/district provisioning and subscription management isolated cleanly from student-facing lesson pages.
