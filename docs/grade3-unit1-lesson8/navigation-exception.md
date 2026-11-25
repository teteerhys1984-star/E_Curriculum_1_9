# Lesson 8 — temporary next-lesson navigation exception

**Status:** temporary. Recorded for the Grade 3 Unit 1 release that publishes Lessons 7 and 8.

**Conflict.** The shared Grade 3 contract (`tests/grade3-lesson.mjs`) requires every menu hub, other
than Lesson 5, to link forward to the next lesson. Lesson 9 is not published yet, so Lesson 8 cannot
link forward without pointing at a missing page.

**Exception.** Lesson 8's hub shows the same honest state Lesson 5 uses, “Next lesson · not yet published”,
and does not link to `grade3-unit1-lesson9.html`. The exception is the set
`NEXT_LESSON_NOT_YET_PUBLISHED = new Set(['8'])` in `tests/grade3-lesson.mjs`. It applies to nothing else.

**Change in this release.** The earlier Lesson 6 exception is removed, because Lesson 7 is now published.
The Lesson 6 hub links forward to `grade3-unit1-lesson7.html`, and Lesson 7's hub links forward to Lesson 8.

**Required follow-up when Lesson 9 is published.** Remove `'8'` from `NEXT_LESSON_NOT_YET_PUBLISHED`,
add the link to `grade3-unit1-lesson9.html` on the Lesson 8 hub, and update the Lesson 8 browser assertion.
