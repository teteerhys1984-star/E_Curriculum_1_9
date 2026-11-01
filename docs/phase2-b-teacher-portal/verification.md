# Phase 2-B — Teacher Portal: Verification Report

**Date:** 1 November 2026
**Base:** `main` at `5b375a047408f6844c3bb3ac0b8866bdc93640d6` (the merge commit of PR #50, *Phase 2-A: Unify lesson navigation and verify boundaries*)
**Work branch:** `arena/6791be7e-e-curriculum-1-9`
**Scope:** Phase 2-B only. No merge and no deployment were performed.

This report records only checks that were actually executed in this workspace. Both suites below were run to completion, and both exit codes are recorded.

---

## 1. What this phase adds

| File | Type | Purpose |
| :--- | :--- | :--- |
| [`teacher.html`](../../teacher.html) | New page | Teacher entry point: grade readiness, how the answer-key gate really works, classroom workflow, source-integrity notes. |
| [`teacher-resources.html`](../../teacher-resources.html) | New page | Verified directory of the 7 prepared lessons, 6 published answer-key areas, the open in-page reveals, the template-only grades, and an explicit list of material that does not exist. |
| [`tests/teacher-portal.browser.mjs`](../../tests/teacher-portal.browser.mjs) | New suite | 14 browser checks: layout, header, drawer, breadcrumbs, links, anchors, disclosure, storage, matrix, keyboard, reduced motion, print. |
| `docs/phase2-b-teacher-portal/verification.md` + `evidence/` | New documentation | This report, 6 screenshots and a machine-readable `report.json`. |
| [`platform-shell.js`](../../platform-shell.js) | Modified | Resolves `teacher.html` and `teacher-resources.html` as page contexts, adds their breadcrumb trail, and adds one **Teachers** item to the shared header. |
| [`index.html`](../../index.html) | Modified | One “For Teachers” entry section linking to both teacher pages. |
| [`tests/check-site.mjs`](../../tests/check-site.mjs) | Modified | 4 new static check groups for the teacher portal. |
| [`package.json`](../../package.json) | Modified | `test:browser` now also runs the teacher portal suite. |

### Deliberately not changed

No lesson page, question, answer, answer key, image, audio placeholder, Worksheet/Workbook text, `grade3-unit1-lesson2.js`, `grade4-unit1-lesson2.js`, `lesson-content-navigation.js`, `lesson-navigation.js`, `design-system.css`, asset, workflow or historical verification report was modified. `git diff --stat` reports 4 modified files (25, 2, 20 and 109 changed lines) and `git status` shows only the new pages, the new test and the new documentation folder.

Confirmed unchanged in particular:

- `grade4-unit1-lesson1-test.html` still has **no** answer-key area.
- `grade5-unit1-lesson2-test.html` and `grade8-unit1-lesson1-test.html` still have their key areas **without** an `id`, exactly as before this phase.
- The static password constant, the four `#teacher-gate` anchors and every `data-correct`/`data-a`/`data-answer` reveal are untouched.

---

## 2. Commands run and final exit codes

| Command | Final exit code |
| :--- | :--- |
| `npm test` | **0** |
| `npm run test:browser` | **0** |

`npm test` runs `tests/check-site.mjs` followed by `node --check` on `platform-shell.js`, `grade3-unit1-lesson2.js`, `grade4-unit1-lesson2.js` and `lesson-content-navigation.js`.

`npm run test:browser` runs six suites in order: Grade 4 Lesson 2, Grade 3 Lesson 2, the full-curriculum audit, the Phase 1 design foundation, the Phase 2-A navigation suite, and the new Phase 2-B teacher portal suite. 59 `PASS` lines were printed in total.

---

## 3. Static checks (`npm test`, exit 0)

Repository-wide results after this phase:

- **42 root HTML files** load `design-system.css` and `platform-shell.js`, with unique IDs, six verified local WOFF2 fonts and zero external font imports.
- Every local link, asset and fragment resolves; no page uses a loopback URL; no page contains disallowed Arabic.
- 128 Markdown links and 6 local CSS assets resolve.

New Phase 2-B static groups:

| Check | Result |
| :--- | :--- |
| Teacher portal pages are directory-only | PASS — both pages contain no `input`, no `form`, no `type="password"`, no embedded password or `fromCharCode`, no `<progress>`/`progressbar`/`aria-valuenow`, no `localStorage` call and no link into `docs/`. Both pages contain the “not authentication” and “shared classroom password” statements, and neither makes a password-protected, encrypted, “only teachers can”, restricted-access or “authenticated” claim. |
| Teacher resource links and counts are verified | PASS — all 35 lesson-page links resolve; the 7 matrix rows are compared against counts computed from the pages themselves (test items from `class="question"` or the `qs` array, reveals from the reveal controls); 4 key anchors deep-link to pages that really contain `id="teacher-gate"`; the 3 pages without that id are linked without a fragment. |
| Teacher entry points and page contexts | PASS — `index.html` links both teacher pages, the shared header carries one `Teachers` item, and `platform-shell.js` resolves both teacher routes. |
| Verification documentation present | PASS — this file exists. |

Verified displayed values (computed from the pages, not typed by hand):

| Lesson | Test items | Answer-key area | Book reveals | Workbook reveals | Listening key |
| :--- | ---: | :--- | ---: | ---: | :--- |
| G3 L1 Back to School | 20 | Published (model-answer guide) | 2 | 2 | None |
| G3 L2 School Subjects | 20 | Published (15 explicit, 5 inferred) | 0 | 4 | None |
| G4 L1 Nice to Meet You | 10 | Not published | 4 | 6 | None |
| G4 L2 My Family | 20 | Published (13 explicit, 7 inferred) | 4 | 3 | None |
| G5 L1 At School | 20 | Published | 9 | 8 | None |
| G5 L2 Family | 20 | Published (no linkable anchor) | 13 | 30 | None |
| G8 L1 Future Plans | 16 | Published (no linkable anchor) | 24 | 15 | None |

---

## 4. Browser checks (`npm run test:browser`, exit 0)

### 4.1 New suite — `tests/teacher-portal.browser.mjs` (14/14 PASS)

1. **Six approved viewports** — 12 page/viewport combinations (1440×900, 1366×768, 1024×768, 768×1024, 390×844, 320×740) with no horizontal overflow, no clipped controls and a full-width header.
2. **Header at the narrowest desktop width** — four items on one row at 768 px on `index.html`, `lessons.html?grade=4`, `teacher.html` and `teacher-resources.html`.
3. **Mobile drawer** — below 768 px the bar is hidden, the drawer lists four destinations, marks Teachers as current, closes on Escape and restores focus.
4. **Breadcrumb trail** — Home → Teacher Portal, and Home → Teacher Portal → Teacher Resources, with correct parents.
5. **Teacher link resolution** — 64 distinct local destinations requested over HTTP; all returned 200.
6. **Published key anchors** — the four `#teacher-gate` links land with the key area in view, and the answer container is still hidden before unlocking.
7. **Pages without a key anchor** — Grade 4 Lesson 1 has no key area and no password field; Grade 5 Lesson 2 and Grade 8 Lesson 1 keep their heading and password field with no invented anchor.
8. **No prompts and no storage writes** — zero inputs and zero forms; `efc_recent_visit_v1` is byte-identical after visiting both teacher pages.
9. **Honest disclosure** — both pages state the shared classroom password is not authentication and make no protection claim; the open reveals are disclosed as visible to pupils.
10. **Rendered status matrix** — 7 rows, expected columns, one “Not published”, “None” for every listening key.
11. **Keyboard access** — skip link is the first Tab stop and targets the main landmark; header links (including Teachers) and page buttons are reachable with a visible focus outline.
12. **Reduced motion and print** — reduced motion removes smooth scrolling and button transitions; print hides the header and contact strip.
13. **Screenshots captured** — 6 images.
14. **Browser and HTTP health** — zero page errors, zero console errors, no HTTP status ≥ 400.

### 4.2 Regression suites (all PASS)

- **Full-curriculum audit:** all **42** root pages rendered at 1366×900 and 390×844 with `lang="en"`, `dir="ltr"`, no unmarked Arabic, all images decoded with alt text and no page-level overflow.
- **Phase 1 design foundation:** all **42** pages audited at 320×740 and 1440×900 for overflow, unique live-DOM IDs and accessible labels; contrast, reduced motion, header/drawer and Continue Learning checks pass. (Its printed label still reads “Full 40-page …” because it was written before this phase; the audited count in the same line is 42.)
- **Phase 2-A navigation:** unchanged and passing with the new fourth header item present.
- **Grade 3 Lesson 2 and Grade 4 Lesson 2 suites:** unchanged and passing, including the existing teacher gate flows.

---

## 5. The 768 px header decision (measured, not assumed)

The Teachers header item was added **only after** measuring the rendered header. Measurements at 768 px (the narrowest width where the desktop bar is visible, because `.site-nav` is hidden at ≤767 px):

| Page | Items | One row | Right edge | Brand→nav gap | Internal scroll |
| :--- | ---: | :--- | :--- | ---: | :--- |
| `index.html` (longest label, “Grades 1–9 Curriculum”) | 4 | yes | 744 / 768 | 66 px | none |
| `teacher.html` | 4 | yes | 744 / 768 | 66 px | none |
| `teacher-resources.html` | 4 | yes | 744 / 768 | 66 px | none |
| `lessons.html?grade=4` | 4 | yes | 744 / 768 | 88 px | none |

The same measurement was repeated at 769, 800, 900, 1024, 1180, 1366 and 1440 px with no overflow at any width, so the conditional rule in the plan was satisfied and the header link was kept. The measured values are also asserted by the committed suite, so a future label change that breaks the 768 px layout fails the build.

Evidence: [`evidence/header-768-teacher.png`](evidence/header-768-teacher.png).

---

## 6. Key-access findings recorded during this phase

1. **The gate is a display aid.** Six lesson tests accept one shared classroom password typed into the page. The key text is already present in the published page (static markup in Grade 3 Lesson 1; `data-correct`/`data-evidence` attributes in Grade 3 Lesson 2 and Grade 4 Lesson 2; the `qs` array in Grade 5 Lesson 1 and Lesson 2 and Grade 8 Lesson 1), so it can be read without the password. Both teacher pages say this plainly and neither claims protection. No authentication was added, and no password is printed on either page.
2. **Two key areas cannot be linked by anchor.** The key areas of Grade 5 Lesson 2 and Grade 8 Lesson 1 are marked by an `<h2>` heading only, with no `id`. As agreed, they are linked without a fragment and the page copy tells the reader to scroll to “Teacher Area · Answer Key”. No lesson page was edited to add an anchor.
3. **Grade 4 Lesson 1 has no key at all.** Its 10-question test has no key area and no password field; the directory reports “Not published” and points to the practice reveals instead.
4. **Deep links settle after the step navigator lays out the page.** All four `#teacher-gate` links do reach the key area, but the browser finishes the hash scroll a moment after `load` because `lesson-content-navigation.js` rebuilds the step layout first. The suite waits for the key area to enter the viewport before asserting, and the measured landing positions were 78–527 px from the top across 390 px and 1440 px viewports.
5. **The open reveals are not secret.** Answer reveals on 8 book/Workbook pages need no password. The counts above (2/2, 0/4, 4/6, 4/3, 9/8, 13/30, 24/15) are the reveal controls that actually exist, and the directory states they are visible to pupils. Some Grade 3 Lesson 1 controls show worked examples and some Grade 5/Grade 8 controls show an audio status rather than an answer; both pages say so.

---

## 7. Repository counts recorded at this commit

- **42** root HTML files: 35 lesson pages (7 lessons × 5 sections), `index.html`, `lessons.html`, `lesson-menu.html`, `lesson.html`, `round-tests.html`, plus the 2 new teacher pages.
- **7** prepared lessons in Grades 3, 4, 5 and 8; **6** published answer-key areas; **5** template-only grades (1, 2, 6, 7, 9).
- **6** evidence images and one `report.json` under `docs/phase2-b-teacher-portal/evidence/`.

Historical reports (`docs/english-curriculum-audit/verification.md`, `docs/grade3-unit1-lesson2/verification.md`, `docs/grade4-unit1-lesson2/verification.md`) still state the file and page counts that were true when they were written. They were intentionally left unedited; the current counts are recorded here.

---

## 8. Known limitations and deferred work

- **No real access control.** The shared classroom password remains a display convenience. Anything genuinely confidential needs a server-side check, which this static site does not have; that is a later architectural step and was not attempted here.
- **Homepage test-count statistic.** `index.html` still advertises “20 questions per lesson test” while Grade 4 Lesson 1 has 10 and Grade 8 Lesson 1 has 16. Per instruction this correction belongs to a separate task; the teacher pages state the real counts, and the static suite now fails if the teacher pages disagree with the pages themselves.
- **Listening material.** No audio recording exists in the repository and no listening key exists anywhere. This is reported as unavailable on both teacher pages, not as pending work in this phase.
- **Phase 2-C and 2-D** were not started.

---

## 9. Evidence

| File | Content |
| :--- | :--- |
| [`evidence/teacher-desktop-1440.png`](evidence/teacher-desktop-1440.png) | Teacher entry page, 1440×900, full page |
| [`evidence/teacher-mobile-390.png`](evidence/teacher-mobile-390.png) | Teacher entry page, 390×844, full page |
| [`evidence/header-768-teacher.png`](evidence/header-768-teacher.png) | Shared header with four items at 768 px |
| [`evidence/teacher-resources-desktop-1440.png`](evidence/teacher-resources-desktop-1440.png) | Teacher resources directory, 1440×900, full page |
| [`evidence/teacher-resources-mobile-390.png`](evidence/teacher-resources-mobile-390.png) | Teacher resources directory, 390×844, full page |
| [`evidence/teacher-resources-matrix.png`](evidence/teacher-resources-matrix.png) | Rendered resource status matrix |
| [`evidence/report.json`](evidence/report.json) | Machine-readable result of the Phase 2-B browser suite |
