/* Shared in-lesson navigator: turns long lesson pages into short, navigable steps
   within an integrated, balanced two-column desktop workspace and normal-flow mobile bar. */
(() => {
  'use strict';

  const main = document.querySelector('main.wrap') || document.querySelector('main') || document.querySelector('.wrap');
  if (!main || document.body?.dataset?.navPage === 'menu' || document.body?.hasAttribute('data-no-content-nav')) {
    return;
  }

  const FULL_WIDTH_SELECTOR =
    '.breadcrumbs, .top, .nav, .lesson-menu-row, .brand, .hero, h1, .page-lead, .section-links, .notice, .note, a.back:last-child, .footer, .foot, footer';

  if (!document.getElementById('lesson-content-navigation-styles')) {
    const style = document.createElement('style');
    style.id = 'lesson-content-navigation-styles';
    style.textContent = `
      /* English is LTR by default; only explicitly marked Arabic vocabulary meanings use RTL. */
      main [dir=ltr], .wrap [dir=ltr] { unicode-bidi: isolate; }
      main :is(input, textarea), .wrap :is(input, textarea) { unicode-bidi: isolate; text-align: start; direction: ltr; }
      main :is(p, li, h1, h2, h3, h4, h5, h6, label, summary, blockquote, .question, .panel, .answer, .explanation),
      .wrap :is(p, li, h1, h2, h3, h4, h5, h6, label, summary, blockquote, .question, .panel, .answer, .explanation) { text-align: start; }
      .content-step-hidden { display: none !important; }
      @media (max-width: 979px) {
        .content-nav { position: static; }
      }
    `;
    document.head.appendChild(style);
  }

  // The whole platform is English/LTR. Arabic is permitted only in vocabulary
  // meanings explicitly marked class="ar" lang="ar" dir="rtl".
  if (!main.hasAttribute('lang')) main.setAttribute('lang', 'en');
  if (!main.hasAttribute('dir')) main.setAttribute('dir', 'ltr');
  const ltrTargets = 'p,li,h1,h2,h3,h4,h5,h6,label,summary,blockquote,td,th,dd,dt,legend,figcaption,.question,.panel,.answer,.explanation';
  main.querySelectorAll(ltrTargets).forEach(el => {
    if (!el.matches('.ar[lang="ar"][dir="rtl"]')) el.setAttribute('dir', 'ltr');
  });
  main.querySelectorAll('input:not([dir]),textarea:not([dir]),[dir="auto"]').forEach(el => {
    el.setAttribute('dir', 'ltr');
  });

  const titleOf = (node, i) => {
    const h = node.querySelector('h2,h3');
    return h ? h.textContent.replace(/^Page\s+\d+\s*[·—-]?\s*/i, '').trim() : 'Part ' + (i + 1);
  };

  const nav = document.createElement('section');
  nav.className = 'content-nav';
  nav.setAttribute('aria-label', 'Navigate lesson contents');
  nav.setAttribute('dir', 'ltr');
  nav.innerHTML =
    '<div class="content-nav-head"><span class="content-nav-title">Explore this lesson step by step</span><span class="content-nav-count" aria-live="polite"></span></div>' +
    '<div class="content-nav-track"><span></span></div>' +
    '<div class="content-nav-links" aria-label="Lesson parts"></div>' +
    '<p class="content-nav-hint">Choose a part, or use Previous and Next. Answers stay hidden until you reveal them.</p>' +
    '<div class="content-nav-controls"><button type="button" data-prev>← Previous</button><button type="button" data-next>Next →</button></div>';

  const links = nav.querySelector('.content-nav-links');
  const count = nav.querySelector('.content-nav-count');
  const bar = nav.querySelector('.content-nav-track span');
  const controls = nav.querySelector('.content-nav-controls');
  const prev = nav.querySelector('[data-prev]');
  const next = nav.querySelector('[data-next]');
  const footer = document.createElement('div');
  footer.className = 'lesson-step-footer';
  footer.setAttribute('aria-label', 'Lesson page navigation');
  footer.setAttribute('dir', 'ltr');
  footer.appendChild(controls);

  function syncGridPlacement() {
    if (!main.classList.contains('has-step-nav')) return;
    const children = Array.from(main.children);
    let startRow = 1;
    let seenContent = false;
    let col1Count = 0;

    for (const child of children) {
      if (child === nav) continue;
      if (child.hidden || child.classList.contains('content-step-hidden')) continue;
      const computed = window.getComputedStyle(child);
      if (computed.display === 'none') continue;

      if (child.matches(FULL_WIDTH_SELECTOR)) {
        if (!seenContent) startRow += 1;
      } else {
        seenContent = true;
        col1Count += 1;
      }
    }

    main.style.setProperty('--nav-grid-row', String(startRow));
    main.style.setProperty('--nav-grid-span', String(Math.max(1, col1Count)));
  }

  function insertStepFooterInMain() {
    const pageFooter = main.querySelector(':scope > .footer, :scope > .foot, :scope > footer');
    if (pageFooter) {
      main.insertBefore(footer, pageFooter);
    } else {
      main.appendChild(footer);
    }
  }

  const quiz = main.querySelector('form#quiz');
  const directPanels = Array.from(main.children).filter(
    el => el.classList?.contains('panel') || el.classList?.contains('section') || el.classList?.contains('group')
  );
  let panels = directPanels;

  if (!quiz && panels.length < 2) {
    const container = panels[0] || main.querySelector('section.panel, .lesson-content, article');
    if (container) {
      const headings = Array.from(container.querySelectorAll(':scope > h2, :scope > h3'));
      if (headings.length > 1) {
        const groups = [];
        let currentGroup = null;
        Array.from(container.children).forEach(node => {
          if (/^H[23]$/.test(node.tagName)) {
            currentGroup = document.createElement('section');
            currentGroup.className = 'panel lesson-generated-step';
            currentGroup.setAttribute('dir', 'ltr');
            currentGroup.appendChild(node);
            groups.push(currentGroup);
          } else if (currentGroup) {
            currentGroup.appendChild(node);
          } else {
            if (!groups.length) {
              currentGroup = document.createElement('section');
              currentGroup.className = 'panel lesson-generated-step';
              currentGroup.setAttribute('dir', 'ltr');
              groups.push(currentGroup);
            }
            currentGroup.appendChild(node);
          }
        });
        container.replaceChildren(...groups);
        panels = groups;
      }
    }
  }

  if (!quiz && panels.length >= 2) {
    if (main.classList.contains('wrap')) {
      main.classList.add('has-step-nav');
    }
    const insertionTarget = panels[0].parentElement === main ? panels[0] : (directPanels[0] || panels[0]);
    main.insertBefore(nav, insertionTarget);
    insertStepFooterInMain();

    let active = 0;
    const buttons = panels.map((panel, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = titleOf(panel, i);
      b.addEventListener('click', () => show(i));
      links.appendChild(b);
      return b;
    });

    function show(i) {
      active = Math.max(0, Math.min(i, panels.length - 1));
      panels.forEach((p, j) => {
        p.classList.toggle('content-step-hidden', j !== active);
        p.setAttribute('aria-hidden', j !== active ? 'true' : 'false');
      });
      buttons.forEach((b, j) => {
        if (j === active) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      count.textContent = 'PART ' + (active + 1) + ' / ' + panels.length;
      bar.style.width = ((active + 1) / panels.length * 100) + '%';
      prev.disabled = active === 0;
      next.textContent = active === panels.length - 1 ? 'Back to first part ↺' : 'Next →';
      next.setAttribute('aria-label', active === panels.length - 1 ? 'Return to first part' : 'Next part');
      syncGridPlacement();
    }

    prev.addEventListener('click', () => show(active - 1));
    next.addEventListener('click', () => show(active === panels.length - 1 ? 0 : active + 1));
    show(0);
  }

  // Tests: paginate questions while preserving answer controls and scoring logic.
  if (quiz) {
    const questions = Array.from(quiz.querySelectorAll('.question'));
    if (questions.length > 1) {
      if (main.classList.contains('wrap')) {
        main.classList.add('has-step-nav');
      }
      nav.classList.add('is-quiz-nav');
      if (!nav.isConnected) {
        let insertionTarget = quiz;
        while (insertionTarget.parentElement && insertionTarget.parentElement !== main) {
          insertionTarget = insertionTarget.parentElement;
        }
        main.insertBefore(nav, insertionTarget);
      }
      questions[questions.length - 1].insertAdjacentElement('afterend', footer);
      nav.querySelector('.content-nav-title').textContent = 'Test questions · 1 to ' + questions.length;
      const hintEl = nav.querySelector('.content-nav-hint');
      if (hintEl) {
        hintEl.textContent = 'Select any question number, or use Previous and Next. Answered items highlight automatically.';
      }
      links.replaceChildren();

      let current = 0;
      const qButtons = questions.map((q, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = String(i + 1);
        b.setAttribute('aria-label', 'Go to question ' + (i + 1));
        b.addEventListener('click', () => showQuestion(i));
        links.appendChild(b);
        return b;
      });

      function isQuestionAnswered(q) {
        if (q.querySelector('input:checked')) return true;
        return Array.from(
          q.querySelectorAll('textarea, input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), select')
        ).some(el => String(el.value || '').trim().length > 0);
      }

      function syncAnswered() {
        questions.forEach((q, idx) => {
          qButtons[idx].classList.toggle('is-answered', isQuestionAnswered(q));
        });
      }

      function showQuestion(i) {
        current = Math.max(0, Math.min(i, questions.length - 1));
        questions.forEach((q, j) => q.classList.toggle('content-step-hidden', j !== current));
        qButtons.forEach((b, j) => {
          if (j === current) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
        count.textContent = 'QUESTION ' + (current + 1) + ' / ' + questions.length;
        bar.style.width = ((current + 1) / questions.length * 100) + '%';
        prev.disabled = current === 0;
        next.textContent = current === questions.length - 1 ? 'Back to question 1 ↺' : 'Next question →';
        syncGridPlacement();
      }

      quiz.addEventListener('change', syncAnswered);
      quiz.addEventListener('input', syncAnswered);
      quiz.addEventListener('reset', () => window.setTimeout(syncAnswered, 0));
      syncAnswered();

      prev.onclick = () => showQuestion(current - 1);
      next.onclick = () => showQuestion(current === questions.length - 1 ? 0 : current + 1);
      showQuestion(0);
    }
  }

  if (main.classList.contains('has-step-nav') && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => syncGridPlacement());
    Array.from(main.children).forEach(child => {
      if (child !== nav) {
        observer.observe(child, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
      }
    });
  }
})();
