# Lesson 6 — temporary next-lesson navigation exception

**Status:** approved by the project owner, temporary.

**Conflict.** The shared Grade 3 contract (`tests/grade3-lesson.mjs`) requires every menu hub,
other than Lesson 5, to link forward to the next lesson. `tests/check-site.mjs` requires every
local link in every repository HTML file to resolve. Lesson 7 is not published yet, so the two
rules cannot both be met for Lesson 6.

**Exception.** Lesson 6's hub shows the same honest state Lesson 5 uses,
“Next lesson · not yet published”, and does not link to `grade3-unit1-lesson7.html`.
The exception is the set `NEXT_LESSON_NOT_YET_PUBLISHED = new Set(['6'])` in
`tests/grade3-lesson.mjs`. It applies to nothing else. Every other applicable lesson still
requires its forward link, and the site-wide local-link check is unchanged.

**Required follow-up when Lesson 7 is published.** Remove `'6'` from
`NEXT_LESSON_NOT_YET_PUBLISHED`, add the link to `grade3-unit1-lesson7.html` on the Lesson 6
hub, and update `tests/navigation-exception.mjs` so it expects that link.
