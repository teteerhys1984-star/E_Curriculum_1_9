/* Shared lesson navigation system — use on every current and future lesson page.
   Add data-lesson-nav="grade5-unit1-lesson2" and data-nav-page="menu|pupil-book|workbook|vocabulary|test" to body. */
(function () {
  const body = document.body;
  const lesson = body.dataset.lessonNav;
  const page = body.dataset.navPage;
  if (!lesson || !page) return;
  const pages = [
    { id: "menu", label: "Lesson Home", short: "Overview", href: lesson + ".html", emoji: "✦" },
    { id: "pupil-book", label: "Pupil’s Book", short: "Pupil’s Book", href: lesson + "-pupil-book.html", emoji: "📘" },
    { id: "workbook", label: "Workbook", short: "Workbook", href: lesson + "-workbook.html", emoji: "✏️" },
    { id: "vocabulary", label: "Vocabulary & Explanation", short: "Vocabulary", href: lesson + "-vocabulary.html", emoji: "🔤" },
    { id: "test", label: "Lesson Test", short: "Test", href: lesson + "-test.html", emoji: "🧠" }
  ];
  const current = pages.findIndex(p => p.id === page);
  if (current < 0) return;
  const style = document.createElement("style");
  style.textContent = `
    .lesson-flow{position:sticky;bottom:0;z-index:1000;margin:28px auto 0;padding:12px;max-width:1080px;border:1px solid #ffffff35;border-radius:20px;background:rgba(24,25,48,.94);backdrop-filter:blur(16px);box-shadow:0 -8px 32px #15142a22;color:#fff;font-family:inherit}
    .lesson-flow-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:12px;color:#e5e7ff}
    .lesson-flow-progress{height:5px;overflow:hidden;border-radius:99px;background:#ffffff20;flex:1;max-width:240px}
    .lesson-flow-progress span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#6ee7d2,#c4b5fd,#f9a8d4);transition:width .2s}
    .lesson-flow-links{display:flex;gap:8px;align-items:stretch;overflow-x:auto;padding:2px 1px 6px}
    .lesson-flow-link{display:flex;align-items:center;gap:7px;flex:1;min-width:max-content;justify-content:center;padding:10px 13px;border:1px solid #ffffff24;border-radius:13px;background:#ffffff0a;color:#f5f3ff;text-decoration:none;font-size:12px;font-weight:800;transition:transform .15s,border-color .15s,background .15s}
    .lesson-flow-link:hover{transform:translateY(-2px);border-color:#8df4db;background:#ffffff16}
    .lesson-flow-link[aria-current="page"]{background:linear-gradient(120deg,#5b4ad5,#bd4c9c);border-color:#ffffff55;color:#fff}
    .lesson-flow-actions{display:flex;justify-content:space-between;gap:10px;margin-top:8px}
    .lesson-flow-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 14px;border:1px solid #ffffff35;border-radius:12px;color:#fff;text-decoration:none;font-size:12px;font-weight:800}
    .lesson-flow-action[aria-disabled="true"]{opacity:.35;pointer-events:none}
    @media(min-width:900px){.lesson-flow{padding:14px 16px}.lesson-flow-link{font-size:13px}.lesson-flow-actions{margin-top:10px}}
    @media(prefers-reduced-motion:reduce){.lesson-flow-link,.lesson-flow-progress span{transition:none}}
  `;
  document.head.appendChild(style);
  const nav = document.createElement("nav");
  nav.className = "lesson-flow";
  nav.setAttribute("aria-label", "Lesson section navigation");
  const progress = Math.round(((current + 1) / pages.length) * 100);
  nav.innerHTML = '<div class="lesson-flow-top"><strong>YOUR LESSON PATH · ' + (current + 1) + ' / ' + pages.length + '</strong><div class="lesson-flow-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '"><span style="width:' + progress + '%"></span></div><span>' + progress + '%</span></div><div class="lesson-flow-links">' +
    pages.map(p => '<a class="lesson-flow-link" href="' + p.href + '" ' + (p.id === page ? 'aria-current="page"' : '') + '><span aria-hidden="true">' + p.emoji + '</span><span>' + p.short + '</span></a>').join("") +
    '</div><div class="lesson-flow-actions"><a class="lesson-flow-action" href="' + (current > 0 ? pages[current - 1].href : "lessons.html?grade=5") + '" ' + (current === 0 ? 'aria-disabled="true"' : '') + '>← Previous</a><a class="lesson-flow-action" href="' + (current < pages.length - 1 ? pages[current + 1].href : "lessons.html?grade=5") + '">' + (current < pages.length - 1 ? 'Next section →' : 'Finish lesson ✓') + '</a></div>';
  document.body.appendChild(nav);
})();