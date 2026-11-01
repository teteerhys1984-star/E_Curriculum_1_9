/* Shared lesson section navigation — use on every current and future lesson page.
   Add data-lesson-nav="gradeX-unitY-lessonZ" and data-nav-page="pupil-book|workbook|vocabulary|test" to body.
   Provides a bottom Previous / Next bar that complements the top .section-links (section jumping).
   The previous/next links at section boundaries resolve to the correct grade lessons page
   (grade is read dynamically from data-lesson-nav; no hardcoded grade). */
(function () {
  const body = document.body;
  const lesson = body.dataset.lessonNav;
  const page = body.dataset.navPage;
  if (!lesson || !page) return;

  const pages = [
    { id: "menu", label: "Lesson Home", short: "Overview", href: lesson + ".html" },
    { id: "pupil-book", label: "Pupil’s Book", short: "Pupil’s Book", href: lesson + "-pupil-book.html" },
    { id: "workbook", label: "Workbook", short: "Workbook", href: lesson + "-workbook.html" },
    { id: "vocabulary", label: "Vocabulary & Explanation", short: "Vocabulary", href: lesson + "-vocabulary.html" },
    { id: "test", label: "Lesson Test", short: "Test", href: lesson + "-test.html" }
  ];
  const current = pages.findIndex(p => p.id === page);
  if (current < 0) return;

  // Read grade dynamically from the lesson slug (e.g. "grade3-unit1-lesson2" -> 3).
  const gradeMatch = lesson.match(/grade(\d+)/);
  const gradeNum = gradeMatch ? gradeMatch[1] : '1';
  const gradeUrl = "lessons.html?grade=" + gradeNum;

  const style = document.createElement("style");
  style.textContent = `
    .lesson-flow{position:relative;margin:28px auto 0;padding:14px 16px;max-width:1080px;border:1px solid var(--color-border-default);border-radius:var(--radius-lg);background:var(--color-bg-elevated);box-shadow:var(--shadow-sm);color:var(--color-text-primary);font-family:var(--font-sans)}
    .lesson-flow-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:var(--text-xs);color:var(--color-text-muted)}
    .lesson-flow-actions{display:flex;justify-content:space-between;gap:10px}
    .lesson-flow-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;min-width:44px;padding:9px 14px;border:1px solid var(--color-border-default);border-radius:var(--radius-md);color:var(--color-text-primary);text-decoration:none;font-size:var(--text-xs);font-weight:600;background:var(--color-bg-surface);transition:transform .15s,border-color .15s,background .15s}
    .lesson-flow-action:hover{transform:translateY(-2px);border-color:var(--color-accent-600);background:var(--color-accent-50)}
    .lesson-flow-action[aria-disabled="true"]{opacity:.45;pointer-events:none}
    @media(prefers-reduced-motion:reduce){.lesson-flow-action{transition:none}}
  `;
  document.head.appendChild(style);

  const prevDisabled = current === 0;
  const nextDisabled = current === pages.length - 1;
  const prevHref = prevDisabled ? "" : pages[current - 1].href;
  const nextHref = nextDisabled ? gradeUrl : pages[current + 1].href;

  const nav = document.createElement("nav");
  nav.className = "lesson-flow";
  nav.setAttribute("aria-label", "Lesson section navigation");
  const previousControl = prevDisabled
    ? '<span class="lesson-flow-action" aria-disabled="true">← Previous</span>'
    : '<a class="lesson-flow-action" href="' + prevHref + '">← Previous</a>';
  nav.innerHTML =
    '<div class="lesson-flow-top"><strong>CURRENT SECTION: ' + pages[current].short + '</strong></div>' +
    '<div class="lesson-flow-actions">' + previousControl + '<a class="lesson-flow-action" href="' + nextHref + '">' + (nextDisabled ? 'Finish lesson' : 'Next section →') + '</a></div>';
  document.body.appendChild(nav);
})();
