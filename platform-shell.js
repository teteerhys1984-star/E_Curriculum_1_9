(() => {
  'use strict';

  const STORAGE_KEY = 'efc_recent_visit_v1';

  /* AUTHORITATIVE CURRICULUM REGISTRY.
     This is the single source of truth for which lessons are published and ready.
     Every displayed lesson count, lesson range, lesson title and readiness summary
     across index.html, lessons.html, round-tests.html, teacher.html and
     teacher-resources.html is derived from this object through the helpers below —
     never retyped per page.

     A lesson may be listed here only when its implementation is complete and
     reachable: the lesson hub plus the Pupil's/Student's Book, Workbook, Vocabulary
     and Lesson Test pages all exist, follow LESSON_PAGE_STANDARD.md, and pass the
     registration checks in tests/curriculum-registry.mjs. Adding a folder, a scan or
     a placeholder page is not enough, and tests fail if a fully implemented lesson is
     left unregistered here.

     answerKey records whether that lesson's test page publishes a teacher answer-key
     area (a `#teacher-gate` section); it is verified against the test page itself. */
  const LESSONS = {
    'grade3-unit1-lesson1': { grade: 3, unit: 1, lesson: 1, title: 'Back to School', bookLabel: "Pupil's Book", answerKey: true },
    'grade3-unit1-lesson2': { grade: 3, unit: 1, lesson: 2, title: 'School Subjects', bookLabel: "Pupil's Book", answerKey: true },
    'grade3-unit1-lesson3': { grade: 3, unit: 1, lesson: 3, title: 'My Lovely School', bookLabel: "Pupil's Book", answerKey: true },
    'grade3-unit1-lesson4': { grade: 3, unit: 1, lesson: 4, title: 'My Five Senses', bookLabel: "Pupil's Book", answerKey: true },
    'grade3-unit1-lesson5': { grade: 3, unit: 1, lesson: 5, title: 'Revision 1', bookLabel: "Pupil's Book", answerKey: true },
    'grade3-unit1-lesson6': { grade: 3, unit: 1, lesson: 6, title: 'My Daily Routine', bookLabel: "Pupil's Book", answerKey: true },
    'grade4-unit1-lesson1': { grade: 4, unit: 1, lesson: 1, title: 'Nice to Meet You', bookLabel: "Pupil's Book", answerKey: false },
    'grade4-unit1-lesson2': { grade: 4, unit: 1, lesson: 2, title: 'My Family', bookLabel: "Pupil's Book", answerKey: true },
    'grade4-unit1-lesson3': { grade: 4, unit: 1, lesson: 3, title: 'Daily Routine', bookLabel: "Pupil's Book", answerKey: true },
    'grade4-unit1-lesson4': { grade: 4, unit: 1, lesson: 4, title: 'My House', bookLabel: "Pupil's Book", answerKey: true },
    'grade4-unit1-lesson5': { grade: 4, unit: 1, lesson: 5, title: 'School Subjects', bookLabel: "Pupil's Book", answerKey: true },
    'grade4-unit1-lesson6': { grade: 4, unit: 1, lesson: 6, title: 'Where I Live', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson1': { grade: 5, unit: 1, lesson: 1, title: 'At School', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson2': { grade: 5, unit: 1, lesson: 2, title: 'Family', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson3': { grade: 5, unit: 1, lesson: 3, title: 'Daily Routines', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson4': { grade: 5, unit: 1, lesson: 4, title: 'The Five Senses', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson5': { grade: 5, unit: 1, lesson: 5, title: 'Clothes', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson6': { grade: 5, unit: 1, lesson: 6, title: 'Healthy Lifestyle', bookLabel: "Pupil's Book", answerKey: true },
    'grade5-unit1-lesson7': { grade: 5, unit: 1, lesson: 7, title: 'Hobbies', bookLabel: "Pupil's Book", answerKey: true },
    'grade8-unit1-lesson1': { grade: 8, unit: 1, lesson: 1, title: 'Future Plans', bookLabel: "Student's Book", answerKey: true },
    'grade8-unit1-lesson2': { grade: 8, unit: 1, lesson: 2, title: 'School Challenges', bookLabel: "Student's Book", answerKey: true },
    'grade8-unit1-lesson3': { grade: 8, unit: 1, lesson: 3, title: 'Let’s Discover', bookLabel: "Student's Book", answerKey: true },
    'grade8-unit1-lesson4': { grade: 8, unit: 1, lesson: 4, title: 'Interesting Destinations', bookLabel: "Student's Book", answerKey: true },
    'grade8-unit1-lesson5': { grade: 8, unit: 1, lesson: 5, title: 'Safety Online!', bookLabel: "Student's Book", answerKey: true }
  };

  /* Every published lesson ships the same five connected pages. The page total shown
     on the homepage and in the teacher portal is derived from this list, so a new
     section changes every aggregate at once. */
  const LESSON_SECTIONS = ['', 'pupil-book', 'workbook', 'vocabulary', 'test'];
  const PAGES_PER_LESSON = LESSON_SECTIONS.length;
  const GRADE_MIN = 1;
  const GRADE_MAX = 9;
  const GRADE_TOTAL = GRADE_MAX - GRADE_MIN + 1;
  const ROUND_SIZE = 5;

  function compareLessons(a, b) {
    return a.grade - b.grade || a.unit - b.unit || a.lesson - b.lesson;
  }

  function registeredLessons() {
    return Object.keys(LESSONS)
      .map(slug => Object.assign({ slug }, LESSONS[slug]))
      .sort(compareLessons);
  }

  function lessonsForGrade(grade) {
    return registeredLessons().filter(entry => entry.grade === Number(grade));
  }

  function readyGrades() {
    const grades = registeredLessons().map(entry => entry.grade);
    return Array.from(new Set(grades)).sort((a, b) => a - b);
  }

  function templateGrades() {
    const ready = new Set(readyGrades());
    const grades = [];
    for (let grade = GRADE_MIN; grade <= GRADE_MAX; grade++) {
      if (!ready.has(grade)) grades.push(grade);
    }
    return grades;
  }

  function listSentence(items) {
    if (!items.length) return '';
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  function gradeSummary(grade) {
    const lessons = lessonsForGrade(grade);
    const units = Array.from(new Set(lessons.map(entry => entry.unit))).sort((a, b) => a - b);
    const readyCount = lessons.length;
    const firstLesson = readyCount ? lessons[0].lesson : null;
    const lastLesson = readyCount ? lessons[readyCount - 1].lesson : null;
    const titles = lessons.map(entry => entry.title);
    const unitLabel = units.length === 1 ? `Unit ${units[0]}` : '';
    return {
      grade: Number(grade),
      readyCount,
      isReady: readyCount > 0,
      pages: readyCount * PAGES_PER_LESSON,
      lessons,
      units,
      unit: units.length === 1 ? units[0] : null,
      unitLabel,
      firstLesson,
      lastLesson,
      lessonRange: readyCount ? `${firstLesson}\u2013${lastLesson}` : '',
      titles,
      titleList: listSentence(titles),
      answerKeys: lessons.filter(entry => entry.answerKey).length,
      roundCoverage: Math.min(readyCount, ROUND_SIZE)
    };
  }

  /* "6 lessons ready" — the homepage grade-card badge. */
  function readinessBadge(grade) {
    const summary = gradeSummary(grade);
    if (!summary.readyCount) return 'In preparation';
    return `${summary.readyCount} ${summary.readyCount === 1 ? 'lesson' : 'lessons'} ready`;
  }

  /* "Unit 1 Lessons 1–6 ready: A, B, C, D, E and F" — the homepage grade-card summary.
     The trailing full stop belongs to the page so a card may append its own note. */
  function readinessSummary(grade) {
    const summary = gradeSummary(grade);
    if (!summary.readyCount) return '';
    return `${summary.unitLabel} Lessons ${summary.lessonRange} ready: ${summary.titleList}`;
  }

  /* "6 lessons prepared" — the teacher portal grade-card badge. */
  function preparedBadge(grade) {
    const summary = gradeSummary(grade);
    if (!summary.readyCount) return 'Template only';
    return `${summary.readyCount} ${summary.readyCount === 1 ? 'lesson' : 'lessons'} prepared`;
  }

  function platformTotals() {
    const lessons = registeredLessons();
    const ready = readyGrades();
    return {
      grades: GRADE_TOTAL,
      lessons: lessons.length,
      pages: lessons.length * PAGES_PER_LESSON,
      pagesPerLesson: PAGES_PER_LESSON,
      sections: LESSON_SECTIONS.slice(),
      readyGrades: ready,
      preparedGradeCount: ready.length,
      templateGradeCount: GRADE_TOTAL - ready.length,
      templateGrades: templateGrades(),
      answerKeyAreas: lessons.filter(entry => entry.answerKey).length,
      readyGradeList: listSentence(ready.map(grade => `Grade ${grade}`)),
      readyGradeNumbers: listSentence(ready.map(grade => String(grade))),
      roundSize: ROUND_SIZE
    };
  }

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
    if (file === 'teacher.html') {
      return { type: 'teacher', file };
    }
    if (file === 'teacher-resources.html') {
      return { type: 'teacher-resources', file };
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

    const isTeacher = ctx.type === 'teacher' || ctx.type === 'teacher-resources';

    const navItems = [
      { href: 'index.html', label: 'Home', active: isHome },
      { href: curriculumHref, label: activeGrade ? `Grade ${activeGrade} Curriculum` : 'Grades 1–9 Curriculum', active: isCurriculum },
      { href: roundHref, label: 'Round Tests', active: isRoundTests },
      { href: 'teacher.html', label: 'Teachers', active: isTeacher }
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
    if (ctx.type === 'teacher') {
      items.push({ label: 'Teacher Portal' });
      return items;
    }
    if (ctx.type === 'teacher-resources') {
      items.push({ label: 'Teacher Portal', href: 'teacher.html' });
      items.push({ label: 'Teacher Resources' });
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

  const NUMBER_WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ];
  const TENS_WORDS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function numberToWords(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 999) return String(value);
    if (n < 20) return NUMBER_WORDS[n];
    if (n < 100) {
      const tens = TENS_WORDS[Math.floor(n / 10)];
      return n % 10 ? `${tens}-${NUMBER_WORDS[n % 10]}` : tens;
    }
    const hundreds = `${NUMBER_WORDS[Math.floor(n / 100)]} hundred`;
    return n % 100 ? `${hundreds} and ${numberToWords(n % 100)}` : hundreds;
  }

  /* Spelled-out counts sit inside running prose, so a value that opens a sentence keeps
     its capital letter. The static markup already carries the correct casing, which makes
     this idempotent across repeated runs. */
  function matchCapitalisation(node, next) {
    const current = (node.textContent || '').trimStart();
    return /^[A-Z]/.test(current) ? next.charAt(0).toUpperCase() + next.slice(1) : next;
  }

  const TOTALS_FORMATS = {
    'verified-lessons-pages': totals => `${totals.lessons} verified lessons \u00b7 ${totals.pages} pages`,
    'lessons-pages': totals => `${totals.lessons} lessons \u00b7 ${totals.pages} pages`,
    'ready-grades': totals => totals.readyGradeList,
    'ready-grade-numbers': totals => totals.readyGradeNumbers,
    'template-grade-numbers': totals => listSentence(totals.templateGrades.map(grade => String(grade)))
  };

  const COUNT_KEYS = new Set([
    'grades', 'lessons', 'pages', 'answerKeyAreas',
    'preparedGradeCount', 'templateGradeCount', 'pagesPerLesson'
  ]);

  /* Rendered readiness copy for the shared grade cards on index.html and teacher.html.
     The static markup already carries the correct text so the pages are complete
     without scripting; this pass re-derives it from the registry so a stale card can
     never disagree with the published curriculum. */
  function bindCurriculumMetadata(ctx) {
    const totals = platformTotals();
    const teacherFlavour = Boolean(ctx) && ctx.type === 'teacher';

    document.querySelectorAll('[data-curriculum-count]').forEach(node => {
      const key = node.getAttribute('data-curriculum-count');
      if (!COUNT_KEYS.has(key)) return;
      node.textContent = String(totals[key]);
    });

    document.querySelectorAll('[data-curriculum-count-words]').forEach(node => {
      const key = node.getAttribute('data-curriculum-count-words');
      if (!COUNT_KEYS.has(key)) return;
      node.textContent = matchCapitalisation(node, numberToWords(totals[key]));
    });

    document.querySelectorAll('[data-curriculum-totals]').forEach(node => {
      const format = TOTALS_FORMATS[node.getAttribute('data-curriculum-totals')];
      if (!format) return;
      node.textContent = format(totals);
    });

    document.querySelectorAll('[data-curriculum-grade]').forEach(card => {
      const summary = gradeSummary(card.getAttribute('data-curriculum-grade'));
      const badge = card.querySelector('.grade-top .badge') || card.querySelector('.badge');
      if (badge && summary.isReady) {
        badge.textContent = teacherFlavour ? preparedBadge(summary.grade) : readinessBadge(summary.grade);
      }
      const summaryNode = card.querySelector('[data-curriculum-summary]');
      if (summaryNode && summary.isReady) {
        summaryNode.replaceChildren();
        summaryNode.append(`${summary.unitLabel} Lessons ${summary.lessonRange} ready: `);
        summary.titles.forEach((title, index) => {
          if (index) summaryNode.append(index === summary.titles.length - 1 ? ' and ' : ', ');
          const emphasised = document.createElement('em');
          emphasised.textContent = title;
          summaryNode.append(emphasised);
        });
      }
      const pagesNode = card.querySelector('[data-curriculum-pages]');
      if (pagesNode) pagesNode.textContent = String(summary.pages);
      const titlesNode = card.querySelector('[data-curriculum-titles]');
      if (titlesNode && summary.isReady) titlesNode.textContent = summary.titleList;
      const spelledNode = card.querySelector('[data-curriculum-grade-count-words]');
      if (spelledNode) spelledNode.textContent = matchCapitalisation(spelledNode, numberToWords(summary.readyCount));
    });
  }

  window.EFCPlatform = {
    LESSONS,
    LESSON_SECTIONS,
    PAGES_PER_LESSON,
    GRADE_MIN,
    GRADE_MAX,
    registeredLessons,
    lessonsForGrade,
    readyGrades,
    templateGrades,
    gradeSummary,
    platformTotals,
    readinessBadge,
    readinessSummary,
    preparedBadge,
    numberToWords,
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
    bindCurriculumMetadata(ctx);
    saveRecentVisit(ctx);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
