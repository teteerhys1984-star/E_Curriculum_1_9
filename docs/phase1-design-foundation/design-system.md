# Phase 1 Design System — English Full Curriculum (Grades 1–9)

This document records the exact design tokens, self-hosted fonts, layout primitives, reusable UI components, and accessibility standards implemented in [`design-system.css`](../../design-system.css), [`platform-shell.js`](../../platform-shell.js), and [`lesson-content-navigation.js`](../../lesson-content-navigation.js).

---

## 1. Visual Direction & Core Principles

1. **Calm Academic Authority**: Deep navy primary surfaces (`#0f2137`) paired with refined teal/turquoise accents (`#0d827c` / `#0b6e69`) and warm neutral paper-like backgrounds (`#faf9f6`, `#f3f2ed`) designed for primary and intermediate students (Grades 1–9) and classroom teachers.
2. **Offline-Safe Static Stack**: Uses locally bundled WOFF2 font files in `assets/fonts/` and inline SVGs with zero external Google Fonts or third-party CDN dependencies.
3. **Strict Language & Direction Isolation**: Every HTML document root uses `<html lang="en" dir="ltr">`. Arabic script appears exclusively inside Vocabulary meaning cells marked `class="ar" lang="ar" dir="rtl"`.
4. **Laptop-First Responsive Layout**: Optimized for `1440×900`, `1366×768`, and `1024×768` desktop/laptop screens with clean normal-flow stacking on `768×1024`, `390×844`, and `320×740` viewports and zero horizontal page overflow.

---

## 2. Design Tokens (`:root` in `design-system.css`)

### 2.1 Brand, Neutral & Semantic Colours

| Category | Token | Exact Value | Role & Measured Contrast |
| :--- | :--- | :--- | :--- |
| Brand Navy | `--color-brand-950` | `#091526` | Top utility contact strip & mobile drawer surface |
| Brand Navy | `--color-brand-900` | `#0f2137` | Global `.site-header`, primary buttons, active tabs/steps (`16.24:1` with `#ffffff`) |
| Brand Navy | `--color-brand-800` | `#162f4d` | Primary button hover, `.badge-strand` text |
| Brand Navy | `--color-brand-700` | `#1f4068` | Interactive hover border accent |
| Brand Navy | `--color-brand-600` | `#2b5485` | Mid-navy accent |
| Brand Tint | `--color-brand-200` | `#cdd9e8` | Navy tint border (`--section-border` default) |
| Brand Tint | `--color-brand-100` | `#e6edf5` | Icon box hairline border |
| Brand Tint | `--color-brand-50` | `#f2f6fa` | Quick Start card & `.badge-strand` background |
| Accent Teal | `--color-accent-800` | `#085753` | `.btn-accent` hover, `.badge-available` text (`7.82:1` on `--color-accent-50`) |
| Accent Teal | `--color-accent-700` | `#0b6e69` | `.btn-accent` background (`6.09:1` with `#ffffff`), links, eyebrows |
| Accent Teal | `--color-accent-600` | `#0d827c` | Active borders, focus outline, progress fill, card hover border |
| Accent Teal | `--color-accent-500` | `#129990` | Prepared-grade indicator dot |
| Accent Tint | `--color-accent-200` | `#b2e5e1` | `.badge-available` & Continue Learning border |
| Accent Tint | `--color-accent-100` | `#daf3f1` | Workbook icon box border |
| Accent Tint | `--color-accent-50` | `#eef9f8` | `.badge-available`, checked option card, & active Continue Learning surface |
| Surfaces | `--color-bg-canvas` | `#faf9f6` | Warm off-white page background |
| Surfaces | `--color-bg-subtle` | `#f3f2ed` | Section switcher bar, table headers, upcoming badges |
| Surfaces | `--color-bg-surface` | `#ffffff` | Cards, content panels, inputs, tables |
| Surfaces | `--color-bg-elevated` | `#ffffff` | Elevated card/surface alias |
| Surfaces | `--color-bg-muted` | `#e8e6df` | Progress bar track |
| Text | `--color-text-primary` | `#111c2d` | Headings and primary reading copy (`17.10:1` on canvas) |
| Text | `--color-text-secondary` | `#3e4e63` | Lead paragraphs and descriptions (`8.49:1` on canvas) |
| Text | `--color-text-muted` | `#5c6b7f` | Metadata, breadcrumbs, `.badge-upcoming` (`4.85:1` on `--color-bg-subtle`) |
| Text | `--color-text-inverse` | `#f8fafc` | Header text on dark navy surfaces |
| Borders | `--color-border-subtle` | `#e5e3dc` | Card, panel, and table cell hairlines |
| Borders | `--color-border-default` | `#d5d2c8` | Standard interactive card/button borders |
| Borders | `--color-border-strong` | `#b5b1a4` | Form input borders |
| Borders | `--color-border-brand` | `#cbd6e4` | Brand-tinted border |
| Semantic Success | `--color-success-700` / `-50` / `-border` | `#13653f` / `#edf8f2` / `#b6e2ca` | `.result` summary, `.given-answer` badge, correct feedback |
| Semantic Warning | `--color-warning-800` / `-50` / `-border` | `#784905` / `#fdf8eb` / `#edd79f` | `.notice` and `.answer.pending` audio-unavailable disclosures |
| Semantic Danger | `--color-danger-700` / `-50` / `-border` | `#9e1c28` / `#fdf2f3` / `#f0bfc4` | `.feedback.incorrect` states |
| Semantic Info | `--color-info-700` / `-50` / `-border` | `#184a78` / `#eff6fc` / `#c3dbf2` | `.alert-info` template preview notes |

Section context overrides (`body.book-pupil`, `body.book-workbook`, `body.book-vocabulary`, `body.book-test`) adjust `--section-accent`, `--section-accent-hover`, `--section-tint`, and `--section-border` within the navy/teal family so students and teachers always know which book or section is open.

### 2.2 Typography Scale & Bundled Local Font Files

All six `@font-face` declarations in `design-system.css` resolve to local files in `assets/fonts/`:

| `@font-face` Family | Local Asset Path | Weight / Scope |
| :--- | :--- | :--- |
| `'Space Grotesk'` | `assets/fonts/space-grotesk-latin-wght-normal.woff2` | `300 700` — `--font-display` headings, eyebrows, scores, question numbers |
| `'DM Sans'` | `assets/fonts/dm-sans-latin-wght-normal.woff2` | `100 1000` — `--font-sans` body copy, UI controls, tables, assessments |
| `'Noto Sans Arabic'` | `assets/fonts/noto-sans-arabic-arabic-wght-normal.woff2` | `100 900` — `--font-arabic` isolated to `.ar[lang="ar"][dir="rtl"]` |
| `'Curriculum Symbols'` | `assets/fonts/curriculum-symbols.woff2` | `400` — arrows and check/cross symbols (`U+2190-2193, U+21BA, U+2713, U+2717, U+2726`) |
| `'Noto Emoji'` (part 1) | `assets/fonts/noto-emoji-2-400-normal.woff2` | `400` — monochrome symbol fallback subset |
| `'Noto Emoji'` (part 2) | `assets/fonts/noto-emoji-3-400-normal.woff2` | `400` — monochrome symbol fallback subset |

- `--font-display`: `'Space Grotesk', 'Curriculum Symbols', ui-sans-serif, system-ui, -apple-system, sans-serif`
- `--font-sans`: `'DM Sans', 'Noto Sans Arabic', 'Curriculum Symbols', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`
- `--font-arabic`: `'Noto Sans Arabic', system-ui, sans-serif`

| Size Token | Value | Primary Usage |
| :--- | :--- | :--- |
| `--text-xs` | `0.75rem` (`12px`) | Eyebrows, badges, breadcrumbs, table headers |
| `--text-sm` | `0.875rem` (`14px`) | Navigation links, buttons, card descriptions, feedback |
| `--text-base` | `1rem` (`16px`) | Standard reading text and form controls |
| `--text-md` | `1.0625rem` (`17px`) | Hero lead copy, reading blockquotes, `h3` inside panels |
| `--text-lg` | `1.2rem` (`19.2px`) | Card headings and question titles |
| `--text-xl` | `1.375rem` (`22px`) | Content panel `h2` headings |
| `--text-2xl` | `1.75rem` (`28px`) | Section headings and `.score` display |
| `--text-3xl` | `clamp(1.75rem, 3vw, 2.375rem)` | Page `h1` titles |

### 2.3 Spacing, Radii, Shadows & Layout Dimensions

- **Spacing Scale**: `--space-1` (`0.25rem` / `4px`), `--space-2` (`0.5rem` / `8px`), `--space-3` (`0.75rem` / `12px`), `--space-4` (`1rem` / `16px`), `--space-5` (`1.25rem` / `20px`), `--space-6` (`1.5rem` / `24px`), `--space-8` (`2rem` / `32px`), `--space-10` (`2.5rem` / `40px`), `--space-12` (`3rem` / `48px`), `--space-16` (`4rem` / `64px`).
- **Border Radii**: `--radius-xs` (`4px`), `--radius-sm` (`6px`), `--radius-md` (`8px`), `--radius-lg` (`12px`), `--radius-xl` (`16px`), `--radius-full` (`9999px`).
- **Shadows**: `--shadow-xs`, `--shadow-sm`, `--shadow-md`, and `--shadow-focus` (`0 0 0 3px rgba(13, 130, 124, 0.24)`).
- **Layout Dimensions**:
  - `--container-max`: `1160px` (`.wrap-wide` discovery pages and `main.wrap.has-step-nav` 2-column workspace)
  - `--container-reading`: `980px` (standard `.wrap` single-column hubs)
  - `--rail-width`: `268px` (desktop sticky step/question navigator column)
  - `--header-height`: `62px`

### 2.4 Responsive Breakpoints & Reduced Motion

- **`min-width: 980px`**: Two-column CSS Grid on `main.wrap.has-step-nav` (`minmax(0, 1fr)` content + `268px` sticky `.content-nav` rail) with zero `body` right-padding hacks.
- **`max-width: 1023px`**: Homepage `.hero-grid` stacks to 1 column; `.path` switches from 4 to 2 columns.
- **`max-width: 979px`**: `.content-nav` switches to `position: static` in normal document flow with wrapping step buttons (and a 10-column compact row on tablet tests).
- **`max-width: 767px`**: `.site-nav` switches to `.site-mobile-toggle` + `#site-mobile-drawer`; `.grades` becomes 2 columns; `.cards` / `.grid` stack to 1 column; quiz navigator returns to 5 columns.
- **`max-width: 540px` & `max-width: 380px`**: `.grades` and `.path` stack to 1 column; `.table-scroll` enables horizontal scrolling inside wide tables while keeping `documentElement.scrollWidth <= window.innerWidth` down to `320px`.
- **`prefers-reduced-motion: reduce`**: Disables smooth scrolling, collapses transitions/animations to `0.01ms`, and disables hover transforms.

---

## 3. Shared Component Summary

1. **Global Header & Mobile Drawer (`.site-header`, `#site-mobile-drawer`)**: Injected by `platform-shell.js` with brand mark, `Home`, `Grade N Curriculum` (or `Grades 1–9 Curriculum`), and `Round Tests` links, plus a `>= 44×44px` mobile menu button that toggles `#site-mobile-drawer` and closes on `Escape` while returning focus.
2. **Grade Switcher Strip (`.grade-switcher`, `.grade-chip`)**: Rendered on `lessons.html` and `round-tests.html` with `Grade 1`–`Grade 9` chips and `.grade-chip-dot` indicators on grades with prepared lessons (`3`, `4`, `5`, `8`).
3. **Contextual Breadcrumbs (`.breadcrumbs`)**: Injected on all non-home pages (`Home / Grade N · Unit 1 / Lesson K: Title / Section`), automatically using `Student's Book` for Grades 7–9 and `Pupil's Book` for Grades 1–6.
4. **5-Tab Lesson Section Switcher (`.section-links`, `.section-link`)**: Consistent navigation across `Lesson menu/home`, `Pupil’s/Student’s Book`, `Workbook`, `Vocabulary`, and `Lesson Test` with `aria-current="page"`.
5. **Step & Question Navigator (`.content-nav`, `.lesson-step-footer`)**:
   - Book and Vocabulary pages render `Part X / Y`, progress track, step buttons, and `← Previous` / `Next →` controls.
   - Lesson Tests render `.content-nav.is-quiz-nav` (`Test questions · 1 to 20`), a 5-column numbered grid with live `.is-answered` highlights for both choice and written inputs, and `← Previous` / `Next question →` directly beneath the active question card.
6. **Buttons, Badges, Cards, Forms, Tables & Disclosures**: `.btn` / `.btn-secondary` / `.btn-accent` / `.btn-ghost` / `.btn-sm`, `.badge-available` / `.badge-upcoming` / `.badge-strand`, `.grade` / `.lesson` / `.card` / `.panel` / `.question`, `.table-scroll`, and `.notice` / `.answer` / `.answer.pending` / `.result` / `.score`.

---

## 4. Visual Evidence (`Before` & `After` Screenshots)

- **Baseline (`before`)**:
  - Homepage: [`01-homepage-1440.png`](evidence/before/01-homepage-1440.png) · [`01-homepage-390.png`](evidence/before/01-homepage-390.png)
  - Curriculum Browsing: [`02-curriculum-browsing-1440.png`](evidence/before/02-curriculum-browsing-1440.png) · [`02-curriculum-browsing-390.png`](evidence/before/02-curriculum-browsing-390.png)
  - Lesson Hub: [`03-lesson-hub-1440.png`](evidence/before/03-lesson-hub-1440.png) · [`03-lesson-hub-390.png`](evidence/before/03-lesson-hub-390.png)
  - Student’s / Pupil’s Book: [`04-student-book-1440.png`](evidence/before/04-student-book-1440.png) · [`04b-pupil-book-g4-1440.png`](evidence/before/04b-pupil-book-g4-1440.png) · [`04b-pupil-book-g4-390.png`](evidence/before/04b-pupil-book-g4-390.png)
  - Workbook: [`05-workbook-1440.png`](evidence/before/05-workbook-1440.png) · [`05-workbook-390.png`](evidence/before/05-workbook-390.png)
  - Vocabulary: [`06-vocabulary-1440.png`](evidence/before/06-vocabulary-1440.png) · [`06-vocabulary-390.png`](evidence/before/06-vocabulary-390.png)
  - Assessment: [`07-assessment-1440.png`](evidence/before/07-assessment-1440.png) · [`07-assessment-390.png`](evidence/before/07-assessment-390.png)
- **Redesigned (`after` — `1440×900`, `1366×768`, and `390×844`)**:
  - Homepage (default Quick Start): [`01-homepage-desktop-1440.png`](evidence/after/01-homepage-desktop-1440.png) · [`01-homepage-desktop-1366.png`](evidence/after/01-homepage-desktop-1366.png) · [`01-homepage-mobile-390.png`](evidence/after/01-homepage-mobile-390.png)
  - Homepage (Continue Learning active): [`01b-homepage-continue-state-desktop-1440.png`](evidence/after/01b-homepage-continue-state-desktop-1440.png)
  - Curriculum Directory (`Grade 4`): [`02-curriculum-grade4-desktop-1440.png`](evidence/after/02-curriculum-grade4-desktop-1440.png) · [`02-curriculum-grade4-desktop-1366.png`](evidence/after/02-curriculum-grade4-desktop-1366.png) · [`02-curriculum-grade4-mobile-390.png`](evidence/after/02-curriculum-grade4-mobile-390.png)
  - Grade 4 Lesson 2 Hub: [`03-lesson-hub-g4l2-desktop-1440.png`](evidence/after/03-lesson-hub-g4l2-desktop-1440.png) · [`03-lesson-hub-g4l2-desktop-1366.png`](evidence/after/03-lesson-hub-g4l2-desktop-1366.png) · [`03-lesson-hub-g4l2-mobile-390.png`](evidence/after/03-lesson-hub-g4l2-mobile-390.png)
  - Pupil’s Book (`Grade 4 · Lesson 2`): [`04-pupil-book-g4l2-desktop-1440.png`](evidence/after/04-pupil-book-g4l2-desktop-1440.png) · [`04-pupil-book-g4l2-desktop-1366.png`](evidence/after/04-pupil-book-g4l2-desktop-1366.png) · [`04-pupil-book-g4l2-mobile-390.png`](evidence/after/04-pupil-book-g4l2-mobile-390.png)
  - Workbook (`Grade 4 · Lesson 2`): [`05-workbook-g4l2-desktop-1440.png`](evidence/after/05-workbook-g4l2-desktop-1440.png) · [`05-workbook-g4l2-desktop-1366.png`](evidence/after/05-workbook-g4l2-desktop-1366.png) · [`05-workbook-g4l2-mobile-390.png`](evidence/after/05-workbook-g4l2-mobile-390.png)
  - Vocabulary (`Grade 4 · Lesson 2`): [`06-vocabulary-g4l2-desktop-1440.png`](evidence/after/06-vocabulary-g4l2-desktop-1440.png) · [`06-vocabulary-g4l2-desktop-1366.png`](evidence/after/06-vocabulary-g4l2-desktop-1366.png) · [`06-vocabulary-g4l2-mobile-390.png`](evidence/after/06-vocabulary-g4l2-mobile-390.png)
  - Lesson Test (`Grade 4 · Lesson 2`): [`07-assessment-g4l2-desktop-1440.png`](evidence/after/07-assessment-g4l2-desktop-1440.png) · [`07-assessment-g4l2-desktop-1366.png`](evidence/after/07-assessment-g4l2-desktop-1366.png) · [`07-assessment-g4l2-mobile-390.png`](evidence/after/07-assessment-g4l2-mobile-390.png)
  - Older Grade 5 Lesson 1 Hub: [`08-legacy-hub-g5l1-desktop-1440.png`](evidence/after/08-legacy-hub-g5l1-desktop-1440.png) · [`08-legacy-hub-g5l1-desktop-1366.png`](evidence/after/08-legacy-hub-g5l1-desktop-1366.png) · [`08-legacy-hub-g5l1-mobile-390.png`](evidence/after/08-legacy-hub-g5l1-mobile-390.png)
  - Older Grade 3 Lesson 1 Hub & Test: [`09-legacy-hub-g3l1-desktop-1440.png`](evidence/after/09-legacy-hub-g3l1-desktop-1440.png) · [`09-legacy-hub-g3l1-desktop-1366.png`](evidence/after/09-legacy-hub-g3l1-desktop-1366.png) · [`09-legacy-hub-g3l1-mobile-390.png`](evidence/after/09-legacy-hub-g3l1-mobile-390.png) · [`10-legacy-test-g3l1-desktop-1440.png`](evidence/after/10-legacy-test-g3l1-desktop-1440.png) · [`10-legacy-test-g3l1-desktop-1366.png`](evidence/after/10-legacy-test-g3l1-desktop-1366.png) · [`10-legacy-test-g3l1-mobile-390.png`](evidence/after/10-legacy-test-g3l1-mobile-390.png)
  - Older Grade 5 Lesson 2 Pupil’s Book: [`11-legacy-pb-g5l2-desktop-1440.png`](evidence/after/11-legacy-pb-g5l2-desktop-1440.png) · [`11-legacy-pb-g5l2-desktop-1366.png`](evidence/after/11-legacy-pb-g5l2-desktop-1366.png) · [`11-legacy-pb-g5l2-mobile-390.png`](evidence/after/11-legacy-pb-g5l2-mobile-390.png)
