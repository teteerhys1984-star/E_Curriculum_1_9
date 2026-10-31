# Phase 1 Design System — English Full Curriculum (Grades 1–9)

This document defines the shared design tokens, typography, layout rules, reusable UI components, and accessibility standards implemented in [`design-system.css`](../../design-system.css), [`platform-shell.js`](../../platform-shell.js), and [`lesson-content-navigation.js`](../../lesson-content-navigation.js).

---

## 1. Visual Direction & Core Principles

1. **Calm Academic Authority**: Deep navy primary surfaces paired with refined teal/turquoise accents and warm neutral paper-like backgrounds suitable for primary and lower-secondary students (Grades 1–9) and classroom teachers.
2. **Zero External Dependencies**: Offline-safe static architecture using locally bundled WOFF2 fonts in `assets/fonts/` (`DM Sans`, `Fraunces`, `Noto Sans Arabic`, and `Curriculum Symbols`) and inline SVGs. No external Google Fonts or third-party CDNs are loaded.
3. **Strict Content & Direction Integrity**: All platform UI and English teaching content run `<html lang="en" dir="ltr">`. Arabic script appears exclusively inside Vocabulary meaning cells marked with `class="ar" lang="ar" dir="rtl"`.
4. **Laptop-First Responsive Flow**: Primary desktop optimization (`1440×900`, `1366×768`, `1024×768`) with clean tablet (`768×1024`) and mobile (`390×844`, `320×740`) reflow and zero horizontal page overflow.

---

## 2. Design Tokens (`:root` in `design-system.css`)

### 2.1 Brand & Semantic Colours

| Category | Token | Value | Usage & Contrast Notes |
| :--- | :--- | :--- | :--- |
| Brand Primary | `--color-brand-950` | `#091728` | Top utility bar |
| Brand Primary | `--color-brand-900` | `#0F233C` | Main platform header, primary buttons, active tabs (`16.24:1` with `#FFFFFF`) |
| Brand Primary | `--color-brand-800` | `#163254` | Primary hover surfaces |
| Brand Primary | `--color-brand-700` | `#1F4470` | Secondary navy borders and focus accents |
| Brand Tint | `--color-brand-100` | `#DCE6F3` | Subtle navy dividers and badges |
| Brand Tint | `--color-brand-50` | `#F0F5FA` | Soft navy informational tint |
| Accent Teal | `--color-accent-700` | `#0A565E` | Accent hover state and focus ring |
| Accent Teal | `--color-accent-600` | `#0E6F79` | Accent buttons, active indicators, eyebrows (`6.09:1` with `#FFFFFF`) |
| Accent Teal | `--color-accent-500` | `#138490` | Progress bar fill and brand mark border |
| Accent Tint | `--color-accent-100` | `#D4EEF0` | Soft teal borders and answered-question pills |
| Accent Tint | `--color-accent-50` | `#EDF8F9` | Active card hover / Continue Learning highlight surface |
| Canvas & Surfaces | `--color-bg-canvas` | `#FAF9F6` | Warm off-white page canvas |
| Canvas & Surfaces | `--color-bg-surface` | `#FFFFFF` | Primary card, panel, and question surface |
| Canvas & Surfaces | `--color-bg-subtle` | `#F3F2EE` | Table headers, secondary panels, section switcher bar |
| Canvas & Surfaces | `--color-bg-muted` | `#EAE8E1` | Muted controls and disabled states |
| Borders | `--color-border-subtle` | `#E3E1D9` | Standard card/panel hairlines |
| Borders | `--color-border-default` | `#D0CEC4` | Interactive control borders |
| Borders | `--color-border-strong` | `#AEACA0` | Hover and high-emphasis input borders |
| Text | `--color-text-primary` | `#111C2D` | Headings and primary reading copy (`17.10:1` on canvas) |
| Text | `--color-text-secondary` | `#3D4A5C` | Lead paragraphs and supporting descriptions (`8.49:1` on canvas) |
| Text | `--color-text-muted` | `#5B6677` | Metadata, breadcrumbs, captions (`4.85:1+` on light surfaces) |
| Semantic Status | `--color-success-bg` / `-text` | `#ECFDF3` / `#14532D` | Verified / prepared lesson badges (`7.82:1`), correct feedback |
| Semantic Status | `--color-warning-bg` / `-text` | `#FFFBEB` / `#78350F` | Audio-pending disclosures and unscored notices |
| Semantic Status | `--color-danger-bg` / `-text` | `#FEF2F2` / `#7F1D1D` | Incorrect option feedback and validation alerts |
| Semantic Status | `--color-info-bg` / `-text` | `#EFF6FF` / `#1E3A8A` | Teacher / instructional callouts |

### 2.2 Typography Scale & Local Font Stack

- `--font-display`: `'Fraunces', Georgia, 'Times New Roman', serif` — editorial display headings (`h1`, hero titles, score readouts).
- `--font-sans`: `'DM Sans', 'Curriculum Symbols', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — UI navigation, body copy, form inputs, tables, assessments.
- `--font-arabic`: `'Noto Sans Arabic', Tahoma, Arial, sans-serif` — isolated to `.ar[lang="ar"][dir="rtl"]` vocabulary meaning cells.

| Token | Value | Role |
| :--- | :--- | :--- |
| `--text-xs` | `0.75rem` (`12px`) | Eyebrows, pill tags, status badges |
| `--text-sm` | `0.875rem` (`14px`) | Breadcrumbs, secondary metadata, compact buttons |
| `--text-base` | `1rem` (`16px`) | Standard student/teacher reading text and form controls |
| `--text-lg` | `1.125rem` (`18px`) | Lead paragraphs and card headings |
| `--text-xl` | `1.25rem` (`20px`) | Subsection titles (`h3`) |
| `--text-2xl` | `1.5rem` (`24px`) | Panel headings (`h2`) |
| `--text-3xl` | `clamp(1.65rem, 2.4vw, 2.15rem)` | Subpage `h1` |
| `--text-4xl` | `clamp(1.9rem, 3.1vw, 2.65rem)` | Homepage & curriculum hub `h1` |

### 2.3 Spacing, Radii, Shadows & Layout Widths

- **Spacing Scale**: `--space-1` (`4px`), `--space-2` (`8px`), `--space-3` (`12px`), `--space-4` (`16px`), `--space-5` (`20px`), `--space-6` (`24px`), `--space-8` (`32px`), `--space-10` (`40px`), `--space-12` (`48px`), `--space-16` (`64px`).
- **Border Radii**: `--radius-xs` (`4px`), `--radius-sm` (`6px`), `--radius-md` (`8px`), `--radius-lg` (`12px`), `--radius-xl` (`16px`), `--radius-pill` (`999px`).
- **Elevation**: Restrained crisp borders with subtle shadows (`--shadow-xs`, `--shadow-sm`, `--shadow-md`) and zero heavy drop-shadow blur.
- **Containers**: `--container-max` (`1200px` main shell and 2-column step workspace) and `--container-reading` (`900px`).

### 2.4 Breakpoints & Motion

- **Desktop 2-Column Step Rail**: `@media (min-width: 980px)` places lesson/test content in Column 1 (`minmax(0, 1fr)`) and sticky `.content-nav` in Column 2 (`296px`) with zero body right-padding hacks.
- **Tablet & Mobile Reflow**: Below `980px`, `.content-nav` becomes `position: static` above the active step with wrapping step buttons; below `900px`, `.site-header` switches from desktop nav links + grade strip to the accessible mobile menu button + drawer (`#site-mobile-drawer`).
- **Ultra-Narrow Safety (`320px`)**: `.table-scroll` wrappers enable clean horizontal scrolling inside wide tables while keeping `documentElement.scrollWidth <= window.innerWidth`.
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` disables smooth scroll and collapses CSS transition/animation durations.

---

## 3. Reusable Component Inventory

1. **Global Platform Header (`.site-header`)**: Injected consistently by `platform-shell.js` (or pre-mounted) with brand mark, primary links (`Home`, `Curriculum`, `Assessments`), quick `G1`–`G9` grade selector pills (highlighting prepared grades `G3`, `G4`, `G5`, `G8`), and keyboard-accessible mobile drawer (`Escape` closes and restores focus; touch targets `>= 44×44px`).
2. **Contextual Breadcrumbs (`.breadcrumbs`)**: Automatic hierarchy (`Home / Grade N · Unit 1 / Lesson K: Title / Section`) on curriculum, round-test, lesson-hub, and section pages.
3. **5-Tab Lesson Section Switcher (`.section-links`)**: Unified across all prepared and template lessons (`Lesson home`, `Pupil’s/Student’s Book`, `Workbook`, `Vocabulary`, `Lesson Test`) with `aria-current="page"`.
4. **Integrated Step & Quiz Navigator (`.content-nav` & `.content-nav.is-quiz-nav`)**:
   - Book & Vocabulary pages display step progress (`Part X / Y`), progress bar, numbered step list, and `Previous` / `Next` controls.
   - 20-question Lesson Tests render a compact 5-column numbered question grid (`1`–`20`) with live `.is-answered` state indicators as students answer items.
5. **Buttons (`.btn`, `.btn-primary`, `.btn-accent`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.btn-lg`)**: Minimum height `42px` (`36px` small, `46px` large), crisp focus rings, and consistent hover/disabled states.
6. **Cards & Panels (`.card`, `.grade`, `.panel`, `.question`, `.activity`)**: Structured academic cards with `.card-top` metadata rows, `.card-icon` inline SVG containers, and subtle border elevation.
7. **Status Badges (`.badge-available`, `.badge-upcoming`, `.badge-info`, `.badge-warning`, `.pill`)**: Honest visual distinction between **Prepared / Verified** curriculum lessons and **Template / Pending** placeholders.
8. **Form Controls & Tables**: Styled text/number/password inputs, custom-chevron `<select>`, radio/checkbox option cards (`.option`, `.choices label`), and `.table-scroll` tables preserving `.ar[lang="ar"][dir="rtl"]` vocabulary alignment.
9. **Alerts & Assessment Feedback (`.notice`, `.answer`, `.answer.pending`, `.result`, `.score`, `.teacher-gate`)**: Distinct visual treatments for audio-pending disclosures, self-check reveals, score summaries, and local teacher solution review gates.

---

## 4. Before & After Visual Evidence

Captured screenshots comparing the pre-Phase-1 baseline and the redesigned Phase 1 platform across desktop (`1440×900`) and mobile (`390×844`) are stored in:

- Baseline (`before`):
  - Homepage: [`01-homepage-1440.png`](evidence/before/01-homepage-1440.png) · [`01-homepage-390.png`](evidence/before/01-homepage-390.png)
  - Curriculum Browsing: [`02-curriculum-browsing-1440.png`](evidence/before/02-curriculum-browsing-1440.png) · [`02-curriculum-browsing-390.png`](evidence/before/02-curriculum-browsing-390.png)
  - Lesson Hub: [`03-lesson-hub-1440.png`](evidence/before/03-lesson-hub-1440.png) · [`03-lesson-hub-390.png`](evidence/before/03-lesson-hub-390.png)
  - Student’s / Pupil’s Book: [`04-student-book-1440.png`](evidence/before/04-student-book-1440.png) · [`04b-pupil-book-g4-1440.png`](evidence/before/04b-pupil-book-g4-1440.png) · [`04b-pupil-book-g4-390.png`](evidence/before/04b-pupil-book-g4-390.png)
  - Workbook: [`05-workbook-1440.png`](evidence/before/05-workbook-1440.png) · [`05-workbook-390.png`](evidence/before/05-workbook-390.png)
  - Vocabulary: [`06-vocabulary-1440.png`](evidence/before/06-vocabulary-1440.png) · [`06-vocabulary-390.png`](evidence/before/06-vocabulary-390.png)
  - Assessment: [`07-assessment-1440.png`](evidence/before/07-assessment-1440.png) · [`07-assessment-390.png`](evidence/before/07-assessment-390.png)
- Redesigned (`after`):
  - Homepage (default Quick Start): [`01-homepage-desktop-1440.png`](evidence/after/01-homepage-desktop-1440.png) · [`01-homepage-mobile-390.png`](evidence/after/01-homepage-mobile-390.png)
  - Homepage (device-local Continue Learning active): [`01b-homepage-continue-state-desktop-1440.png`](evidence/after/01b-homepage-continue-state-desktop-1440.png)
  - Curriculum Browser (`Grade 4`): [`02-curriculum-grade4-desktop-1440.png`](evidence/after/02-curriculum-grade4-desktop-1440.png) · [`02-curriculum-grade4-mobile-390.png`](evidence/after/02-curriculum-grade4-mobile-390.png)
  - Lesson Hub (`Grade 4 · Unit 1 · Lesson 2`): [`03-lesson-hub-g4l2-desktop-1440.png`](evidence/after/03-lesson-hub-g4l2-desktop-1440.png) · [`03-lesson-hub-g4l2-mobile-390.png`](evidence/after/03-lesson-hub-g4l2-mobile-390.png)
  - Pupil’s Book (`Grade 4 · Unit 1 · Lesson 2`): [`04-pupil-book-g4l2-desktop-1440.png`](evidence/after/04-pupil-book-g4l2-desktop-1440.png) · [`04-pupil-book-g4l2-mobile-390.png`](evidence/after/04-pupil-book-g4l2-mobile-390.png)
  - Workbook (`Grade 4 · Unit 1 · Lesson 2`): [`05-workbook-g4l2-desktop-1440.png`](evidence/after/05-workbook-g4l2-desktop-1440.png) · [`05-workbook-g4l2-mobile-390.png`](evidence/after/05-workbook-g4l2-mobile-390.png)
  - Vocabulary (`Grade 4 · Unit 1 · Lesson 2`): [`06-vocabulary-g4l2-desktop-1440.png`](evidence/after/06-vocabulary-g4l2-desktop-1440.png) · [`06-vocabulary-g4l2-mobile-390.png`](evidence/after/06-vocabulary-g4l2-mobile-390.png)
  - Assessment (`Grade 4 · Unit 1 · Lesson 2 Test`): [`07-assessment-g4l2-desktop-1440.png`](evidence/after/07-assessment-g4l2-desktop-1440.png) · [`07-assessment-g4l2-mobile-390.png`](evidence/after/07-assessment-g4l2-mobile-390.png)
  - Unified Earlier Lesson Hub (`Grade 5 · Unit 1 · Lesson 1`): [`08-legacy-hub-g5l1-desktop-1440.png`](evidence/after/08-legacy-hub-g5l1-desktop-1440.png) · [`08-legacy-hub-g5l1-mobile-390.png`](evidence/after/08-legacy-hub-g5l1-mobile-390.png)
