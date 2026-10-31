(() => {
  'use strict';

  const STORAGE_KEY = 'efc_recent_visit_v1';

  const LESSONS = {
    'grade3-unit1-lesson1': { grade: 3, unit: 1, lesson: 1, title: 'Back to School', bookLabel: "Pupil's Book" },
    'grade3-unit1-lesson2': { grade: 3, unit: 1, lesson: 2, title: 'School Subjects', bookLabel: "Pupil's Book" },
    'grade4-unit1-lesson1': { grade: 4, unit: 1, lesson: 1, title: 'Nice to Meet You', bookLabel: "Pupil's Book" },
    'grade4-unit1-lesson2': { grade: 4, unit: 1, lesson: 2, title: 'My Family', bookLabel: "Pupil's Book" },
    'grade5-unit1-lesson1': { grade: 5, unit: 1, lesson: 1, title: 'At School', bookLabel: "Pupil's Book" },
    'grade5-unit1-lesson2': { grade: 5, unit: 1, lesson: 2, title: 'Family', bookLabel: "Pupil's Book" },
    'grade8-unit1-lesson1': { grade: 8, unit: 1, lesson: 1, title: 'Future Plans', bookLabel: "Student's Book" }
  };

  const SECTION_META = {
    '': { key: 'menu', label: 'Lesson Menu', icon: 'grid' },
    'pupil-book': { key: 'pupil-book', label: "Pupil's Book", icon: 'book' },
    'workbook': { key: 'workbook', label: 'Workbook', icon: 'edit' },
    'vocabulary': { key: 'vocabulary', label: 'Vocabulary', icon: 'list' },
    'test': { key: 'test', label: 'Lesson Test', icon: 'check' }
  };

  const ICONS = {
    brand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
  };

  function getFileName() {
    const raw = (window.location.pathname || '').split('/').pop() || 'index.html';
    return raw.endsWith('.html') ? raw : 'index.html';
  }

  function clampGrade(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 9 ? n : null;
  }

  function parsePageContext() {
    const file = getFileName();
    const params = new URLSearchParams(window.location.search || '');
    const queryGrade = clampGrade(params.get('grade'));

    const lessonMatch = file.match(/^(grade(\d+)-unit(\d+)-lesson(\d+))(?:-([a-z-]+))?\.html$/);
    if (lessonMatch) {
      const slug = lessonMatch[1];
      const suffix = lessonMatch[5] || '';
      const meta = LESSONS[slug] || {
        grade: Number(lessonMatch[2]),
        unit: Number(lessonMatch[3]),
        lesson: Number(lessonMatch[4]),
        title: `Lesson ${lessonMatch[4]}`,
        bookLabel: "Pupil's Book"
      };
      const section = SECTION_META[suffix] || SECTION_META[''];
      const sectionLabel = suffix === 'pupil-book' ? meta.bookLabel : section.label;
      return {
        type: suffix ? 'lesson-section' : 'lesson-hub',
        file,
        slug,
        suffix,
        grade: meta.grade,
        unit: meta.unit,
        lesson: meta.lesson,
        lessonTitle: meta.title,
        bookLabel: meta.bookLabel,
        sectionKey: section.key,
        sectionLabel
      };
    }

    if (file === 'lessons.html') {
      return { type: 'lessons', file, grade: queryGrade || 1 };
    }
    if (file === 'round-tests.html') {
      return { type: 'round-tests', file, grade: queryGrade || 1 };
    }
    if (file === 'lesson-menu.html') {
      const lessonNum = Math.max(1, Number(params.get('lesson')) || 1);
      return { type: 'template-menu', file, grade: queryGrade || 1, lesson: lessonNum };
    }
    if (file === 'lesson.html') {
      const lessonNum = Math.max(1, Number(params.get('lesson')) || 1);
      const sec = params.get('section') || 'pupil-book';
      return { type: 'template-section', file, grade: queryGrade || 1, lesson: lessonNum, sectionKey: sec };
    }
    return { type: 'home', file, grade: queryGrade };
  }

  function applyBodySectionAttributes(ctx) {
    document.body.classList.add('has-platform-shell');
    if (ctx.type === 'lesson-section') {
      if (ctx.suffix === 'pupil-book') document.body.classList.add('book-pupil');
      if (ctx.suffix === 'workbook') document.body.classList.add('book-workbook');
      if (ctx.suffix === 'vocabulary') document.body.classList.add('book-vocabulary');
      if (ctx.suffix === 'test') document.body.classList.add('book-test');
    }
  }

  function injectHeader(ctx) {
    if (document.querySelector('.site-header')) return;

    const main = document.querySelector('main') || document.querySelector('.wrap');
    if (main && !main.id) {
      main.id = 'main-content';
    }
    const skipTarget = main && main.id ? `#${main.id}` : '#main-content';

    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = skipTarget;
      skip.textContent = 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    const activeGrade = ctx.grade || null;
    const curriculumHref = activeGrade ? `lessons.html?grade=${activeGrade}` : 'lessons.html';
    const roundHref = activeGrade ? `round-tests.html?grade=${activeGrade}` : 'round-tests.html';

    const isHome = ctx.type === 'home';
    const isCurriculum = ctx.type === 'lessons' || ctx.type === 'lesson-hub' || ctx.type === 'lesson-section' || ctx.type === 'template-menu' || ctx.type === 'template-section';
    const isRoundTests = ctx.type === 'round-tests';

    const header = document.createElement('header');
    header.className = 'site-header';
    header.setAttribute('dir', 'ltr');

    const navItems = [
      { href: 'index.html', label: 'Home', active: isHome },
      { href: curriculumHref, label: activeGrade ? `Grade ${activeGrade} Curriculum` : 'Grades 1–9 Curriculum', active: isCurriculum },
      { href: roundHref, label: 'Round Tests', active: isRoundTests }
    ];

    const desktopLinksHtml = navItems.map(item =>
      `<a class="site-nav-link${item.active ? ' is-active' : ''}" href="${item.href}"${item.active ? ' aria-current="page"' : ''}>${item.label}</a>`
    ).join('');

    const mobileLinksHtml = navItems.map(item =>
      `<a href="${item.href}"${item.active ? ' aria-current="page"' : ''}><span>${item.label}</span><span aria-hidden="true">→</span></a>`
    ).join('');

    header.innerHTML = `
      <div class="site-header-inner">
        <a class="site-brand" href="index.html">
          <span class="site-brand-mark">${ICONS.brand}</span>
          <span class="site-brand-text">
            <span class="site-brand-name">English Full Curriculum</span>
            <span class="site-brand-sub">Grades 1–9 School Platform</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          ${desktopLinksHtml}
        </nav>
        <button type="button" class="site-mobile-toggle" aria-expanded="false" aria-controls="site-mobile-drawer">
          <span data-menu-icon>${ICONS.menu}</span>
          <span>Menu</span>
        </button>
      </div>
      <nav id="site-mobile-drawer" class="site-mobile-drawer" aria-label="Mobile navigation">
        <div class="site-mobile-drawer-links">
          ${mobileLinksHtml}
        </div>
      </nav>
    `;

    const banner = document.querySelector('.engineer-contact-banner, .banner');
    if (banner && banner.parentNode === document.body) {
      banner.insertAdjacentElement('afterend', header);
    } else {
      const skip = document.querySelector('.skip-link');
      if (skip && skip.parentNode === document.body) {
        skip.insertAdjacentElement('afterend', header);
      } else {
        document.body.insertBefore(header, document.body.firstChild);
      }
    }

    const toggleBtn = header.querySelector('.site-mobile-toggle');
    const drawer = header.querySelector('#site-mobile-drawer');
    const iconSpan = header.querySelector('[data-menu-icon]');
    if (toggleBtn && drawer) {
      const setOpen = open => {
        toggleBtn.setAttribute('aria-expanded', String(open));
        drawer.classList.toggle('is-open', open);
        if (iconSpan) iconSpan.innerHTML = open ? ICONS.close : ICONS.menu;
      };
      toggleBtn.addEventListener('click', () => {
        const next = toggleBtn.getAttribute('aria-expanded') !== 'true';
        setOpen(next);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
          setOpen(false);
          toggleBtn.focus();
        }
      });
    }
  }

  function buildBreadcrumbTrail(ctx) {
    if (ctx.type === 'home') return null;

    const items = [{ label: 'Home', href: 'index.html' }];
    if (ctx.type === 'lessons') {
      items.push({ label: `Grade ${ctx.grade} Curriculum` });
      return items;
    }
    if (ctx.type === 'round-tests') {
      items.push({ label: `Grade ${ctx.grade} Curriculum`, href: `lessons.html?grade=${ctx.grade}` });
      items.push({ label: 'Round Tests' });
      return items;
    }
    if (ctx.type === 'template-menu') {
      items.push({ label: `Grade ${ctx.grade} Curriculum`, href: `lessons.html?grade=${ctx.grade}` });
      items.push({ label: `Lesson ${ctx.lesson} Preview` });
      return items;
    }
    if (ctx.type === 'template-section') {
      const secTitles = {
        'pupil-book': ctx.grade >= 7 ? "Student's Book" : "Pupil's Book",
        'workbook': 'Workbook',
        'vocabulary': 'Vocabulary',
        'test': 'Lesson Test'
      };
      items.push({ label: `Grade ${ctx.grade} Curriculum`, href: `lessons.html?grade=${ctx.grade}` });
      items.push({ label: `Lesson ${ctx.lesson}`, href: `lesson-menu.html?grade=${ctx.grade}&lesson=${ctx.lesson}` });
      items.push({ label: secTitles[ctx.sectionKey] || 'Section Preview' });
      return items;
    }
    if (ctx.type === 'lesson-hub') {
      items.push({ label: `Grade ${ctx.grade} · Unit ${ctx.unit}`, href: `lessons.html?grade=${ctx.grade}` });
      items.push({ label: `Lesson ${ctx.lesson}: ${ctx.lessonTitle}` });
      return items;
    }
    if (ctx.type === 'lesson-section') {
      items.push({ label: `Grade ${ctx.grade} · Unit ${ctx.unit}`, href: `lessons.html?grade=${ctx.grade}` });
      items.push({ label: `Lesson ${ctx.lesson}: ${ctx.lessonTitle}`, href: `${ctx.slug}.html` });
      items.push({ label: ctx.sectionLabel });
      return items;
    }
    return null;
  }

  function injectBreadcrumbs(ctx) {
    if (document.querySelector('.breadcrumbs')) return;
    const trail = buildBreadcrumbTrail(ctx);
    if (!trail || trail.length < 2) return;

    const main = document.querySelector('main.wrap') || document.querySelector('main') || document.querySelector('.wrap');
    if (!main) return;

    const nav = document.createElement('nav');
    nav.className = 'breadcrumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.setAttribute('dir', 'ltr');

    const ol = document.createElement('ol');
    ol.className = 'breadcrumb-list';

    trail.forEach((item, idx) => {
      const li = document.createElement('li');
      const isLast = idx === trail.length - 1;
      if (!isLast && item.href) {
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.setAttribute('aria-current', 'page');
        span.textContent = item.label;
        li.appendChild(span);
      }
      ol.appendChild(li);
    });

    nav.appendChild(ol);
    main.insertBefore(nav, main.firstChild);
  }

  function ensureLessonSectionTabs(ctx) {
    if (ctx.type !== 'lesson-section') return;

    const existing = document.querySelector('.section-links');
    if (existing) {
      existing.querySelectorAll('a').forEach(link => {
        link.classList.add('section-link');
      });
      return;
    }

    const main = document.querySelector('main.wrap') || document.querySelector('main');
    if (!main) return;

    const tabs = [
      { suffix: '', label: 'Lesson menu', icon: ICONS.grid },
      { suffix: 'pupil-book', label: ctx.bookLabel, icon: ICONS.book },
      { suffix: 'workbook', label: 'Workbook', icon: ICONS.edit },
      { suffix: 'vocabulary', label: 'Vocabulary', icon: ICONS.list },
      { suffix: 'test', label: 'Lesson Test', icon: ICONS.check }
    ];

    const nav = document.createElement('nav');
    nav.className = 'section-links';
    nav.setAttribute('aria-label', 'Lesson sections');
    nav.setAttribute('dir', 'ltr');

    tabs.forEach(tab => {
      const a = document.createElement('a');
      a.className = 'section-link';
      a.href = tab.suffix ? `${ctx.slug}-${tab.suffix}.html` : `${ctx.slug}.html`;
      if (tab.suffix === ctx.suffix) {
        a.setAttribute('aria-current', 'page');
      }
      a.innerHTML = `${tab.icon}<span>${tab.label}</span>`;
      nav.appendChild(a);
    });

    let anchor = main.querySelector(':scope > .hero') || main.querySelector(':scope > h1') || main.querySelector(':scope > .top');
    if (anchor && anchor.tagName === 'H1') {
      while (anchor.nextElementSibling && anchor.nextElementSibling.tagName === 'P') {
        anchor = anchor.nextElementSibling;
        anchor.classList.add('page-lead');
      }
    }
    if (anchor) {
      anchor.insertAdjacentElement('afterend', nav);
    } else {
      main.insertBefore(nav, main.firstChild);
    }
  }

  function wrapStandaloneTables() {
    const main = document.querySelector('main') || document.querySelector('.wrap');
    if (!main) return;
    main.querySelectorAll('table').forEach(table => {
      if (table.closest('.table-scroll')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.setAttribute('dir', 'ltr');
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function saveRecentVisit(ctx) {
    if (ctx.type !== 'lesson-hub' && ctx.type !== 'lesson-section') return;
    if (!LESSONS[ctx.slug]) return;
    try {
      const record = {
        href: ctx.file,
        lessonHref: `${ctx.slug}.html`,
        slug: ctx.slug,
        grade: ctx.grade,
        unit: ctx.unit,
        lesson: ctx.lesson,
        lessonTitle: ctx.lessonTitle,
        sectionLabel: ctx.type === 'lesson-hub' ? 'Lesson Menu' : ctx.sectionLabel,
        updatedAt: Date.now()
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* Storage unavailable or blocked; fail silently */
    }
  }

  function readRecentVisit() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const meta = LESSONS[parsed.slug];
      if (!meta) return null;
      const validSuffixes = ['', '-pupil-book', '-workbook', '-vocabulary', '-test'];
      const suffixIdx = validSuffixes.findIndex(s => `${parsed.slug}${s}.html` === parsed.href);
      if (suffixIdx === -1) return null;
      const suffixKey = validSuffixes[suffixIdx].replace(/^-/, '');
      const canonicalLabel =
        suffixKey === '' ? 'Lesson Menu'
        : suffixKey === 'pupil-book' ? meta.bookLabel
        : SECTION_META[suffixKey].label;
      return {
        href: parsed.href,
        lessonHref: `${parsed.slug}.html`,
        grade: meta.grade,
        unit: meta.unit,
        lesson: meta.lesson,
        lessonTitle: meta.title,
        sectionLabel: canonicalLabel
      };
    } catch {
      return null;
    }
  }

  function clearRecentVisit() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Ignore storage removal errors */
    }
  }

  window.EFCPlatform = {
    LESSONS,
    readRecentVisit,
    clearRecentVisit
  };

  function init() {
    const ctx = parsePageContext();
    applyBodySectionAttributes(ctx);
    injectHeader(ctx);
    injectBreadcrumbs(ctx);
    ensureLessonSectionTabs(ctx);
    wrapStandaloneTables();
    saveRecentVisit(ctx);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
