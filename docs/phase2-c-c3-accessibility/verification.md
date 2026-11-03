# Phase 2-C · C-3 Accessibility improvements — verification

## Scope and branch state

C-3 only: accessibility improvements for the existing English Full Curriculum site. No C-4 work, navigation redesign, lesson/question/answer/key text edits, scoring-formula changes, deployment, or merge.

The pre-merge follow-up is limited to the two requested review fixes: exact numeric scoring regression coverage for all seven lesson tests, and explicit print suppression of the two C-3 live-status span types. The optional idempotence guard, narrower gate selector and more specific reveal announcement wording were **not** implemented.

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

The PR changes 61 files after the pre-merge follow-up: 47 application files, eight test/configuration files, and six C-3 documentation/evidence files. Most HTML changes are repeated script includes or small accessibility attributes, not content rewrites.

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
| `tests/c3-accessibility.browser.mjs` | Full-site semantic audit, Chromium computed-name audit across every step, disclosure/live-region checks, keyboard checks, answered-state/reset checks, gate checks, print-status suppression and forced-colors check. Optional `C3_SECTION` runs reproduce focused failures; the default and CI run everything. |
| `tests/c3-scoring.browser.mjs`, `tests/c3-scoring.fixture.json` | Exact numeric scoring regression for all seven lesson tests, using keys pinned to `origin/main`, plus seven in-memory scoring-formula mutation checks. |
| `tests/c3-content-integrity.mjs`, `tests/c3-content-baseline.json` | Protect educational text, legacy quiz/recall arrays and modern assessment evidence against the verified C-2 baseline. |
| `tests/check-site.mjs` | Existing teacher-resource reveal counts also recognize the accessible `data-reveal` buttons. No existing assertion was removed. |
| `package.json` | Run content integrity, helper syntax, the C-3 accessibility suite and the C-3 scoring suite in the existing commands. |
| `.github/workflows/lesson-checks.yml` | Preserve C-3 accessibility and scoring evidence as Actions artifacts. |
| `docs/phase2-c-c3-accessibility/verification.md` | This report. |
| `docs/phase2-c-c3-accessibility/evidence/browser-report.json` | Fresh final C-3 accessibility browser result. |
| `docs/phase2-c-c3-accessibility/evidence/scoring-report.json` | Exact numeric scoring results and mutation-rejection evidence for all seven tests. |
| `docs/phase2-c-c3-accessibility/evidence/followup-print-red-green.json` | Print-status regression before and after the two CSS selectors were added. |
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

## Pre-merge follow-up: exact scoring and print-status fixes

### Exact numeric scoring coverage

`tests/c3-scoring.browser.mjs` now checks the actual published numbers for all seven lesson tests. Expected values come from `tests/c3-scoring.fixture.json`, pinned to `origin/main` at `4517619…`, not from the page under test. The modern Grade 3/Grade 4 Lesson 2 keys also match the existing source-reviewed quiz fixtures.

Every test is checked with: empty submission, all wrong, all correct, one wrong, first-only correct, and alternating correct/wrong. Where the page has a reset control, the suite also resets and resubmits an empty test. Grade 3 Lesson 1 additionally checks written completion counts and whitespace-only writing; Grade 4 Lesson 1 additionally checks the existing written-answer length/regex boundaries and case-insensitive matching.

Actual full-marks results:

| Test | Exact full-marks result |
|---|---|
| `grade3-unit1-lesson1-test.html` | `15 / 15` objective, `15 / 15` answered, written completion separately `0–5 / 5` |
| `grade3-unit1-lesson2-test.html` | `20 / 20`, answered `20 / 20`, unanswered `0` |
| `grade4-unit1-lesson1-test.html` | `10/10` with eight objective answers and both existing written rules satisfied |
| `grade4-unit1-lesson2-test.html` | `20 / 20`, answered `20 / 20`, unanswered `0` |
| `grade5-unit1-lesson1-test.html` | `20 / 20`, answered `20 / 20` |
| `grade5-unit1-lesson2-test.html` | `20 / 20`, answered `20 / 20` |
| `grade8-unit1-lesson1-test.html` | `16 / 16`, answered `16 / 16`; listening remains excluded |

The suite recorded **57 exact numeric result assertions** and **zero browser/HTTP errors**. No expected result was invented for an unavailable key: all seven keys were available from the pinned main baseline or the existing source-reviewed fixtures.

### Scoring-formula mutation regression

The same suite serves seven temporary mutated copies through Chromium request interception only. Repository scoring files are not edited. Each mutation doubles the objective-score increment, and the suite requires the exact numeric assertion to reject the mutated page:

| Test | Expected full marks | Mutated result | Rejected |
|---|---:|---:|---|
| Grade 3 Lesson 1 | 15 | 30 | yes |
| Grade 3 Lesson 2 | 20 | 40 | yes |
| Grade 4 Lesson 1 | 10 | 18 | yes |
| Grade 4 Lesson 2 | 20 | 40 | yes |
| Grade 5 Lesson 1 | 20 | 40 | yes |
| Grade 5 Lesson 2 | 20 | 40 | yes |
| Grade 8 Lesson 1 | 16 | 32 | yes |

This proves the new numeric assertions fail when a scoring formula changes, rather than merely checking that a result message appears.

### Print-status regression

`design-system.css` now explicitly hides `[data-reveal-status]` and `[data-question-index-status]` inside `@media print`. The new `C3_SECTION=print` regression first failed on the pre-fix CSS because status spans still produced print boxes, then passed after the two selectors were added. Final result: **42 pages**, **132 status spans on 21 pages**, zero print boxes, and the screen live regions remain present.

Evidence: [scoring-report.json](evidence/scoring-report.json) and [followup-print-red-green.json](evidence/followup-print-red-green.json).

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

Result: **PASS**, exit code **0**, in headless Chromium. All eight suites passed, with 78 named PASS checks:

| Suite | Result |
|---|---|
| `grade4-unit1-lesson2.browser.mjs` | PASS — 12 checks |
| `grade3-unit1-lesson2.browser.mjs` | PASS — 12 checks |
| `english-curriculum.browser.mjs` | PASS — 10 checks |
| `phase1-design-foundation.browser.mjs` | PASS — 7 checks |
| `phase2-a-navigation.browser.mjs` | PASS — 7 checks |
| `teacher-portal.browser.mjs` | PASS — 14 checks |
| `c3-accessibility.browser.mjs` | PASS — 8 checks |
| `c3-scoring.browser.mjs` | PASS — 8 checks |

Final C-3 coverage:

- **42 pages:** no duplicate live-DOM IDs, broken ARIA/label references, unnamed controls, named generic containers without a supporting role, or unnamed/missing formal quiz radio groups.
- **685 unique controls:** a non-placeholder accessibility-tree name verified through Chromium across every lesson step, not a sample and not only an HTML-attribute approximation.
- **125 reveals:** valid controlled panel, pre-registered empty polite live region, synchronized expanded state and shown/hidden announcements.
- **Keyboard:** Enter/Space reveal operation; Space selection and Enter reset on all seven tests; focus remains usable.
- **Seven tests:** visible answered mark, accessible state, live status, reset and whitespace handling.
- **Six keyed tests:** C-2 separation, wrong-password rejection, hidden initial key and synchronized open/closed state.
- **Layout:** all 42 pages at 320px and 1440px in the existing design suite; all 42 at 390px in the curriculum suite; seven tests additionally at 390px in C-3. The answered mark survives forced-colors emulation.
- **Print:** all 42 pages were checked under print emulation; the 132 reveal/question-index status spans on 21 pages create no print boxes, while existing C-2 checks still hide keys, gates, buttons and step navigation.
- **Scoring:** all seven lesson tests have exact numeric assertions from pinned keys, including empty/wrong/correct/partial/reset cases and the two legacy written-answer behaviours; seven in-memory scoring-formula mutations were rejected.
- **Health:** no JavaScript page errors, console errors or local HTTP errors in the C-3 suite; existing suites also passed their health checks.

Fresh evidence: [browser-report.json](evidence/browser-report.json), [scoring-report.json](evidence/scoring-report.json), [followup-print-red-green.json](evidence/followup-print-red-green.json) and [answered-state-forced-colors-390.png](evidence/answered-state-forced-colors-390.png). Unrelated teacher-portal screenshots regenerated by the old suite were restored so they do not pollute this PR.

## Limits and remaining risks

- These are automated DOM, Chromium accessibility-tree, keyboard-event, layout and forced-colors checks. They are **not** a manual NVDA, JAWS, VoiceOver or TalkBack session, and they do not prove how every screen reader will announce each live region.
- No real Firefox, Safari, iOS, Android or physical mobile-device session was run. Forced-colors emulation is not a replacement for testing Windows High Contrast on a real device.
- Pre-registering live regions improves announcement reliability but still needs human assistive-technology review before claiming full compatibility.
- The site remains English/LTR except for the already permitted, explicitly marked Arabic vocabulary meanings. Source ambiguities, unavailable audio and editorial-answer caveats were not changed.
- No full WCAG conformance claim is made. C-3 addresses the audited issues above; it is not a complete accessibility certification.
- No scores, accounts, reports, classroom management, navigation redesign, deployment or merge was added. PR #54 must remain open until explicit approval.
