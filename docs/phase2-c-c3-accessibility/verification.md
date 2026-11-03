# Phase 2-C · C-3 Accessibility improvements — verification

## Scope

C-3 only. This change improves the accessibility of existing curriculum interactions without starting C-4, restructuring navigation, changing lesson/question/answer text, changing answer keys, adding scoring, or deploying the site.

Base verified before edits:

- `origin/main`: `451761991899793097c7bb7156ac2f969a74eaf2`
- PR #53 (C-2): `MERGED`, merge commit `451761991899793097c7bb7156ac2f969a74eaf2`
- The C-2 merge commit is an ancestor of `origin/main`.

## What changed

- Answered question index buttons now expose a visible check mark, an `answered` / `not answered` accessible name, and a polite live status. The state updates on selection, written input, change and reset. Whitespace-only writing is not treated as an answer.
- Existing practice reveals and teacher-key gates now use consistent `aria-controls` / `aria-expanded` behaviour. Legacy class-based reveals, hidden-attribute reveals and modern `.reveal` buttons are handled by `lesson-accessibility.js`.
- Reveal buttons announce shown/hidden state through a visually hidden live region. Teacher gate feedback remains a status region; the key panels themselves are no longer duplicated live regions.
- Unnamed text inputs, textareas and vocabulary recall inputs received accessible names from existing prompts or concise descriptive labels. Placeholders are no longer the only name.
- Legacy radio option groups received `radiogroup` semantics labelled by the existing question prompt. Modern fieldsets keep their legends.
- Labelled generic containers received supporting `role="group"` semantics where needed.
- The Grade 4 Lesson 1 reset button now calls the native form reset method without being shadowed by the button’s `id="reset"`, so answered-state reset works reliably.

## Content protection

`tests/c3-content-integrity.mjs` compares against `tests/c3-content-baseline.json`, captured from the verified C-2 base before C-3 edits. It checks:

- educational text in every HTML page, excluding UI button labels and accessibility-only markup;
- legacy quiz/recall data arrays and answer keys;
- modern assessment `data-correct`, `data-kind`, `data-reference` and `data-evidence` attributes.

Result: **PASS — 42 HTML files preserve educational text, answer keys, quiz/recall data and assessment evidence.**

## Automated checks actually run

### Static / source checks

Command:

```bash
npm test
```

Result: **PASS**.

Includes:

- existing link, source-integrity, language, design-system, teacher-portal and C-2 gate/print checks;
- C-3 content-integrity baseline;
- JavaScript syntax checks for `platform-shell.js`, `lesson-accessibility.js`, `grade3-unit1-lesson2.js`, `grade4-unit1-lesson2.js`, and `lesson-content-navigation.js`.

### Browser checks

Command:

```bash
npm run test:browser
```

Result: **PASS**.

The full existing browser suite ran, followed by the new C-3 suite:

- `tests/grade4-unit1-lesson2.browser.mjs`
- `tests/grade3-unit1-lesson2.browser.mjs`
- `tests/english-curriculum.browser.mjs`
- `tests/phase1-design-foundation.browser.mjs`
- `tests/phase2-a-navigation.browser.mjs`
- `tests/teacher-portal.browser.mjs`
- `tests/c3-accessibility.browser.mjs`

New C-3 browser results:

- **PASS** — all 42 pages: no unnamed controls, duplicate IDs, broken ARIA/label references, named generic containers without a supporting role, or unnamed quiz radio groups.
- **PASS** — 125 legacy and modern practice reveals expose a valid controlled panel, synchronize `aria-expanded`, and announce shown/hidden state.
- **PASS** — Enter and Space toggle representative legacy and modern reveals without moving focus away from the button.
- **PASS** — all 7 lesson tests expose a visible answered mark, accessible answered/not-answered name and live state; reset and whitespace-only writing clear the state.
- **PASS** — six existing keyed tests keep the C-2 separation, expose `aria-expanded`, reject wrong passwords and synchronize open/closed state.
- **PASS** — seven test pages avoid horizontal overflow at 390px; the answered check mark remains visible in forced-colors mode.
- **PASS** — no browser JavaScript errors in the C-3 suite.

Evidence:

- `docs/phase2-c-c3-accessibility/evidence/browser-report.json`
- `docs/phase2-c-c3-accessibility/evidence/answered-state-forced-colors-390.png`

## Limits of verification

These are automated DOM, browser, keyboard-event and forced-colors checks. They are **not** manual screen-reader testing. No NVDA, JAWS, VoiceOver or TalkBack session was run as part of this verification. Real screen-reader behaviour should still be reviewed before claiming full assistive-technology compatibility.

## Remaining constraints

- No C-4 work was started.
- Navigation structure was not redesigned; only the answered-state presentation and ARIA semantics of the existing question index changed.
- No deployment was performed.
- The PR must remain open until explicit approval is given. Do not merge without that approval.
