/* Shared in-lesson navigator: turns long lesson pages into short, navigable steps. */
(() => {
  const main = document.querySelector('main.wrap') || document.querySelector('main') || document.querySelector('.wrap');
  if (!main || document.body.dataset.navPage === 'menu') return;
  const style = document.createElement('style');
  style.textContent = `
    .content-nav{position:fixed;right:12px;top:112px;width:220px;max-height:calc(100vh - 130px);overflow:auto;z-index:20;background:#fff;border:1px solid #e5e9f4;border-radius:14px;padding:10px;box-shadow:0 10px 28px #25304a18}.content-nav~*{} body{padding-right:242px}
    .content-nav-head{display:flex;flex-direction:column;align-items:flex-start;gap:5px}
    .content-nav-title{font-weight:900;font-size:.9rem;line-height:1.3}
    .content-nav-count{color:var(--muted,#626b83);font-weight:800;font-size:.9rem}
    .content-nav-track{height:5px;background:#edf0f7;border-radius:99px;overflow:hidden;margin:9px 0}
    .content-nav-track span{display:block;height:100%;width:0;background:var(--accent,#00a896);border-radius:99px;transition:width .2s}
    .content-nav-links{display:flex;flex-direction:column;gap:5px;margin:9px 0}
    .content-nav-links button{background:var(--soft,#eaf5ff);color:var(--ink,#202642);box-shadow:none;border:1px solid transparent;padding:8px 9px;text-align:left;width:100%;font-size:.84rem;line-height:1.25;white-space:normal}
    .content-nav-links button[aria-current=step]{background:var(--accent,#00a896);color:white}
    .content-nav-controls{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:12px;margin:24px 0 10px;padding:14px 16px;background:linear-gradient(120deg,#fff,#f3f7ff);border:1px solid #dfe5f1;border-radius:18px;box-shadow:0 8px 22px #25304a10}.content-nav-controls button{min-width:132px;padding:12px 20px;font-size:.95rem;border-radius:12px}.lesson-step-footer{clear:both;display:flex;justify-content:center;align-items:center;gap:14px;width:100%;margin:28px auto 14px;padding:8px 0}.lesson-step-footer .content-nav-controls{flex:0 1 520px;width:min(100%,520px);margin:0;justify-content:center}.lesson-step-footer .content-nav-controls button{flex:1;max-width:220px}.lesson-step-footer button:disabled{opacity:.45;cursor:not-allowed;transform:none}.lesson-step-footer button[data-prev]{background:#64748b}.lesson-step-footer button[data-next]{background:var(--accent,#00a896)}
    /* English is LTR by default; only explicitly marked Arabic vocabulary meanings use RTL. */
    main [dir=ltr], .wrap [dir=ltr]{unicode-bidi:isolate}
    main :is(input,textarea), .wrap :is(input,textarea){unicode-bidi:isolate;text-align:start;direction:ltr}
    main :is(p,li,h1,h2,h3,h4,h5,h6,label,summary,blockquote,.question,.panel,.answer,.explanation), .wrap :is(p,li,h1,h2,h3,h4,h5,h6,label,summary,blockquote,.question,.panel,.answer,.explanation){text-align:start}
    .content-step-hidden{display:none!important}
    .content-nav-hint{font-size:.72rem;line-height:1.3;color:var(--muted,#626b83);margin:6px 0 0}
    .content-nav button:focus-visible{outline:3px solid #202642;outline-offset:3px}
    @media(max-width:760px){body{padding-right:0}.content-nav{position:static;left:auto;right:auto;top:auto;bottom:auto;width:auto;max-height:none;overflow:visible;margin:10px 0;z-index:auto}.content-nav-links{flex-direction:row;overflow-x:auto}.content-nav-links button{width:auto;white-space:nowrap}.content-nav-controls{flex-direction:row}.lesson-step-footer{margin-bottom:16px}.content-nav-hint{display:none}}
  `;
  document.head.appendChild(style);

  // The whole platform is English/LTR. Arabic is permitted only in vocabulary
  // meanings explicitly marked class="ar" lang="ar" dir="rtl".
  if (!main.hasAttribute('lang')) main.setAttribute('lang', 'en');
  if (!main.hasAttribute('dir')) main.setAttribute('dir', 'ltr');
  const ltrTargets = 'p,li,h1,h2,h3,h4,h5,h6,label,summary,blockquote,td,th,dd,dt,legend,figcaption,.question,.panel,.answer,.explanation';
  main.querySelectorAll(ltrTargets).forEach((el) => {
    if (!el.matches('.ar[lang="ar"][dir="rtl"]')) el.setAttribute('dir', 'ltr');
  });
  main.querySelectorAll('input:not([dir]),textarea:not([dir]),[dir="auto"]').forEach((el) => {
    el.setAttribute('dir', 'ltr');
  });

  const titleOf = (node, i) => {
    const h = node.querySelector('h2,h3');
    return h ? h.textContent.replace(/^Page\s+\d+\s*[·—-]?\s*/i,'').trim() : 'Part ' + (i+1);
  };
  const nav = document.createElement('section');
  nav.className = 'content-nav';
  nav.setAttribute('aria-label','Navigate lesson contents');
  nav.innerHTML = '<div class="content-nav-head"><span class="content-nav-title">Explore this lesson step by step</span><span class="content-nav-count" aria-live="polite"></span></div><div class="content-nav-track"><span></span></div><div class="content-nav-links" aria-label="Lesson parts"></div><p class="content-nav-hint">Choose a part, or use Previous and Next. Answers stay hidden until you reveal them.</p><div class="content-nav-controls"><button type="button" data-prev>← Previous</button><button type="button" data-next>Next →</button></div>';
  const links = nav.querySelector('.content-nav-links');
  const count = nav.querySelector('.content-nav-count');
  const bar = nav.querySelector('.content-nav-track span');
  const controls = nav.querySelector('.content-nav-controls');
  const prev = nav.querySelector('[data-prev]');
  const next = nav.querySelector('[data-next]');
  const footer = document.createElement('div');
  footer.className = 'lesson-step-footer';
  footer.setAttribute('aria-label','Lesson page navigation');
  footer.appendChild(controls);

  // General lesson content: use direct panels where possible. If a page has one large
  // panel, split it into semantic heading-led steps without rewriting its content.
  const quiz = main.querySelector('form#quiz');
  const directPanels = Array.from(main.children).filter(el => el.classList?.contains('panel') || el.classList?.contains('section'));
  let panels = directPanels;
  if (!quiz && panels.length < 2) {
    const container = panels[0] || main.querySelector('section.panel, .lesson-content, article');
    if (container) {
      const headings = Array.from(container.querySelectorAll(':scope > h2, :scope > h3'));
      if (headings.length > 1) {
        const groups = [];
        let currentGroup = null;
        Array.from(container.children).forEach((node) => {
          if (/^H[23]$/.test(node.tagName)) {
            currentGroup = document.createElement('section');
            currentGroup.className = 'panel lesson-generated-step';
            currentGroup.appendChild(node);
            groups.push(currentGroup);
          } else if (currentGroup) {
            currentGroup.appendChild(node);
          } else {
            if (!groups.length) {
              currentGroup = document.createElement('section');
              currentGroup.className = 'panel lesson-generated-step';
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
    // Generated heading-led steps stay inside their original container. Insert the
    // navigator before that container (not before a nested child), avoiding a
    // NotFoundError that previously stopped the whole script on one-panel pages.
    const insertionTarget = panels[0].parentElement === main ? panels[0] : (directPanels[0] || panels[0]);
    main.insertBefore(nav, insertionTarget);
    main.appendChild(footer);
    let active = 0;
    const buttons = panels.map((panel,i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = titleOf(panel,i);
      b.addEventListener('click', () => show(i));
      links.appendChild(b); return b;
    });
    function show(i) {
      active = Math.max(0,Math.min(i,panels.length-1));
      panels.forEach((p,j)=>{p.classList.toggle('content-step-hidden',j!==active);p.setAttribute('aria-hidden',j!==active?'true':'false')});
      buttons.forEach((b,j)=>{if(j===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
      count.textContent = 'PART ' + (active+1) + ' / ' + panels.length;
      bar.style.width = ((active+1)/panels.length*100)+'%';
      prev.disabled = active===0; next.textContent = active===panels.length-1?'Back to first part ↺':'Next →';
      next.setAttribute('aria-label',active===panels.length-1?'Return to first part':'Next part');
    }
    prev.addEventListener('click',()=>show(active-1));
    next.addEventListener('click',()=>show(active===panels.length-1?0:active+1));
    show(0);
  }

  // Tests: paginate questions while preserving answer controls and scoring logic.
  if (quiz) {
    const questions = Array.from(quiz.querySelectorAll('.question'));
    if (questions.length > 1) {
      if (!nav.isConnected) {
        let insertionTarget = quiz;
        while (insertionTarget.parentElement && insertionTarget.parentElement !== main) insertionTarget = insertionTarget.parentElement;
        main.insertBefore(nav, insertionTarget);
      }
      quiz.insertAdjacentElement('afterend',footer);
      nav.querySelector('.content-nav-title').textContent='Your test · one question at a time';
      links.replaceChildren();
      let current=0;
      const qButtons=questions.map((q,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label','Go to question '+(i+1));b.addEventListener('click',()=>showQuestion(i));links.appendChild(b);return b});
      function showQuestion(i){current=Math.max(0,Math.min(i,questions.length-1));questions.forEach((q,j)=>q.classList.toggle('content-step-hidden',j!==current));qButtons.forEach((b,j)=>{if(j===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});count.textContent='QUESTION '+(current+1)+' / '+questions.length;bar.style.width=((current+1)/questions.length*100)+'%';prev.disabled=current===0;next.textContent=current===questions.length-1?'Back to question 1 ↺':'Next question →'}
      prev.onclick=()=>showQuestion(current-1);next.onclick=()=>showQuestion(current===questions.length-1?0:current+1);showQuestion(0);
    }
  }
})();