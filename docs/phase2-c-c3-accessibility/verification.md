# Phase 2-C · C-3 Accessibility improvements — verification

## Scope and branch state

C-3 only: accessibility improvements for the existing English Full Curriculum site. No C-4 work, navigation redesign, lesson/question/answer/key text edits, scoring-formula changes, deployment, or merge.

Verified before application edits in this round:

- `origin/main`: `451761991899793097c7bb7156ac2f969a74eaf2`.
- PR #53 (C-2) is merged; its merge commit is that same SHA and is an ancestor of `origin/main`.
- The mandated session branch already had open PR #54 at `eb789158b3e654dfcbfc2c79be51d8aeccc9e2d1`. This round resumed and updated that PR instead of creating a duplicate PR or switching branches.
- The local checkout was fast-forwarded to the existing PR head, then audited. The previous PR description was not treated as proof; the checks below were executed again.

## Audit findings and fixes

### Findings on the verified `main` baseline

- The seven lesson-test question indexes indicated answered state only with colour.
- 28 form controls relied on placeholder text alone for their accessible name. Chromium's accessibility tree exposed the placeholder as a fallback name, so the regression test explicitly rejects placeholder-only naming rather than accepting any non-empty string.
- Legacy and modern answer reveals had inconsistent disclosure relationships and state announcements.
- Six teacher-key gates needed synchronized expanded state while preserving C-2 separation.
- Named generic containers and several quiz radio groups lacked appropriate grouping semantics.

### Additional findings on the existing PR head, fixed in this round

1. **Grade 4 Lesson 1 test:** eight existing `.opts` containers still had no named `radiogroup` ancestor. They now use `role="radiogroup"` and reference the existing question headings. The stronger test checks every native quiz radio group, not only group elements that already exist.
2. **Reveal announcements:** empty polite live regions were created only on the first click. They are now registered during initialization, before interaction, and updated on show/hide/reset. This avoids relying on a screen reader noticing a live region created and populated in the same activation.

### Implemented C-3 behaviour

- Answered question index buttons have a visible check mark, an `answered` / `not answered` accessible name, and a polite live status. State updates on keyboard selection, written input, change and reset. Whitespace-only writing is not treated as an answer.
- `lesson-accessibility.js` unifies existing practice reveals without creating, removing or rewriting answers. Buttons expose valid `aria-controls`, synchronized `aria-expanded`, state-dependent labels and pre-registered live regions.
- Teacher gates keep their existing password and scoring logic. C-2 gate separation, hidden initial keys, print suppression and the non-authentication disclosure remain intact. Locking the two modern keys returns focus to the unlock button.
- The 28 placeholder-only fields now use existing prompts or concise descriptive accessible names. Existing visible and screen-reader-only labels elsewhere are retained.
- Named generic containers received minimal supporting roles. Formal lesson-test radio groups have named group semantics; modern fieldsets keep their legends.
- The Grade 4 Lesson 1 reset button calls the native form reset method without being shadowed by its own `id="reset"`. This fixes reset behaviour; it does not alter scoring.

## Files changed and reasons

The PR changes 57 files: 47 application files, six test/configuration files, and four C-3 documentation/evidence files. Most HTML changes are repeated script includes or small accessibility attributes, not content rewrites.

### Shared application code and styling

| File | Reason |
|---|---|
| `lesson-accessibility.js` | Shared reveal, live-region, reset and gate-state behaviour; live regions now exist before first use. |
| `lesson-content-navigation.js` | Non-colour answered mark, accessible state names, live status and minimal group roles. No navigation redesign. |
| `grade3-unit1-lesson2.js`, `grade4-unit1-lesson2.js` | Delegate practice reveals to the shared helper; preserve scoring and key logic; restore focus after locking. |
| `design-system.css` | Show the answered check mark without relying on colour, including forced-colors emulation. |

### HTML pages

- All 42 root HTML pages load the shared accessibility helper once.
- The 28 field-name fixes are in nine pages: Grade 3 Lesson 1 test/vocabulary/workbook; Grade 4 Lesson 1 test; Grade 5 Lesson 1 pupil-book/vocabulary; Grade 8 Lesson 1 pupil-book/test/workbook.
- 125 practice reveals across 14 pages receive consistent disclosure behaviour. This includes the template `lesson.html`.
- Seven lesson-test pages receive answered-state and quiz-group improvements. `grade4-unit1-lesson1-test.html` received the additional eight group fixes in this round.
- Six keyed test pages receive gate ARIA synchronization. The keyless Grade 4 Lesson 1 test remains keyless.
- `index.html`, `teacher.html`, `teacher-resources.html`, `round-tests.html` and the shared navigator receive minimal supporting group roles where names already existed.

### Tests, configuration and evidence

| File | Reason |
|---|---|
| `tests/c3-accessibility.browser.mjs` | Full-site semantic audit, Chromium computed-name audit across every step, disclosure/live-region checks, keyboard checks, answered-state/reset checks, gate checks and forced-colors check. Optional `C3_SECTION` runs reproduce focused failures; the default and CI run everything. |
| `tests/c3-content-integrity.mjs`, `tests/c3-content-baseline.json` | Protect educational text, legacy quiz/recall arrays and modern assessment evidence against the verified C-2 baseline. |
| `tests/check-site.mjs` | Existing teacher-resource reveal counts also recognize the accessible `data-reveal` buttons. No existing assertion was removed. |
| `package.json` | Run content integrity, helper syntax and the C-3 browser suite in the existing commands. |
| `.github/workflows/lesson-checks.yml` | Preserve C-3 browser evidence as an Actions artifact. |
| `docs/phase2-c-c3-accessibility/verification.md` | This report. |
| `docs/phase2-c-c3-accessibility/evidence/browser-report.json` | Fresh final C-3 browser result. |
| `docs/phase2-c-c3-accessibility/evidence/red-checks.json` | Eight actual pre-fix failures against exact `main` and pre-fix PR snapshots. |
| `docs/phase2-c-c3-accessibility/evidence/answered-state-forced-colors-390.png` | Automated Chromium forced-colors screenshot at 390px. |

## Test-first evidence

Exact snapshots were materialized under ignored `test-results/` directories with `git archive`; no branch switch or `main` edit was used. The final regression test was copied into each snapshot.

- Six focused runs against `main` at `4517619…` exited **1** for the intended semantic, placeholder-only-name, live-region, answered-state, gate and forced-colors assertions.
- The baseline names run identified **28 unique placeholder-only controls**.
- Two focused runs against the existing PR head `eb78915…` exited **1** for the eight missing Grade 4 radio groups and the missing pre-registered reveal live region.
- After the two application fixes, the focused semantic, disclosure, computed-name and answered-state runs passed, followed by the complete suites below.

Commands and exact assertions are recorded in [red-checks.json](evidence/red-checks.json). Example reproduction inside a snapshot:

```bash
C3_SECTION=semantics node tests/c3-accessibility.browser.mjs
C3_SECTION=names node tests/c3-accessibility.browser.mjs
C3_SECTION=disclosures node tests/c3-accessibility.browser.mjs
C3_SECTION=answered node tests/c3-accessibility.browser.mjs
C3_SECTION=gates node tests/c3-accessibility.browser.mjs
C3_SECTION=layout node tests/c3-accessibility.browser.mjs
```

These focused options are for diagnosis. `npm run test:browser` does not set a filter and runs all C-3 sections.

## Automated checks actually run

### Static, source and syntax checks

```bash
npm ci --ignore-scripts
npm test
```

Result: **PASS**.

- 24 existing static/source/language/design/teacher/C-2 checks passed.
- C-3 content integrity passed for all 42 HTML files.
- JavaScript syntax checks passed for the existing scripts and `lesson-accessibility.js`.
- The content baseline itself was checked against a fresh `origin/main` HTML snapshot.
- An independent HTML-parser comparison against `origin/main` also passed for all 42 pages: educational text, form names/values, assessment evidence attributes and image src/alt are unchanged after whitespace normalization. Allowed differences are accessibility attributes, UI disclosure labels/handlers, helper loading and the reviewed native reset invocation.
- `git diff --check` passed. `package-lock.json` is unchanged; no dependency was added.

### Complete browser suite

```bash
npm run test:browser
```

Result: **PASS**, exit code **0**, in headless Chromium. All seven suites passed, with 69 named PASS checks:

| Suite | Result |
|---|---|
| `grade4-unit1-lesson2.browser.mjs` | PASS — 12 checks |
| `grade3-unit1-lesson2.browser.mjs` | PASS — 12 checks |
| `english-curriculum.browser.mjs` | PASS — 10 checks |
| `phase1-design-foundation.browser.mjs` | PASS — 7 checks |
| `phase2-a-navigation.browser.mjs` | PASS — 7 checks |
| `teacher-portal.browser.mjs` | PASS — 14 checks |
| `c3-accessibility.browser.mjs` | PASS — 7 checks |

Final C-3 coverage:

- **42 pages:** no duplicate live-DOM IDs, broken ARIA/label references, unnamed controls, named generic containers without a supporting role, or unnamed/missing formal quiz radio groups.
- **685 unique controls:** a non-placeholder accessibility-tree name verified through Chromium across every lesson step, not a sample and not only an HTML-attribute approximation.
- **125 reveals:** valid controlled panel, pre-registered empty polite live region, synchronized expanded state and shown/hidden announcements.
- **Keyboard:** Enter/Space reveal operation; Space selection and Enter reset on all seven tests; focus remains usable.
- **Seven tests:** visible answered mark, accessible state, live status, reset and whitespace handling.
- **Six keyed tests:** C-2 separation, wrong-password rejection, hidden initial key and synchronized open/closed state.
- **Layout:** all 42 pages at 320px and 1440px in the existing design suite; all 42 at 390px in the curriculum suite; seven tests additionally at 390px in C-3. The answered mark survives forced-colors emulation.
- **Health:** no JavaScript page errors, console errors or local HTTP errors in the C-3 suite; existing suites also passed their health checks.

Fresh evidence: [browser-report.json](evidence/browser-report.json) and [answered-state-forced-colors-390.png](evidence/answered-state-forced-colors-390.png). Unrelated teacher-portal screenshots regenerated by the old suite were restored so they do not pollute this PR.

## Limits and remaining risks

- These are automated DOM, Chromium accessibility-tree, keyboard-event, layout and forced-colors checks. They are **not** a manual NVDA, JAWS, VoiceOver or TalkBack session, and they do not prove how every screen reader will announce each live region.
- No real Firefox, Safari, iOS, Android or physical mobile-device session was run. Forced-colors emulation is not a replacement for testing Windows High Contrast on a real device.
- Pre-registering live regions improves announcement reliability but still needs human assistive-technology review before claiming full compatibility.
- The site remains English/LTR except for the already permitted, explicitly marked Arabic vocabulary meanings. Source ambiguities, unavailable audio and editorial-answer caveats were not changed.
- No full WCAG conformance claim is made. C-3 addresses the audited issues above; it is not a complete accessibility certification.
- No scores, accounts, reports, classroom management, navigation redesign, deployment or merge was added. PR #54 must remain open until explicit approval.
