/* Shared in-lesson navigator: turns long lesson pages into short, navigable steps. */
(() => {
  const main = document.querySelector('main.wrap');
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
    .content-nav-controls{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:12px;margin:24px 0 10px;padding:14px 16px;background:linear-gradient(120deg,#fff,#f3f7ff);border:1px solid #dfe5f1;border-radius:18px;box-shadow:0 8px 22px #25304a10}.content-nav-controls button{min-width:132px;padding:12px 20px;font-size:.95rem;border-radius:12px}.lesson-step-footer{clear:both;display:flex;justify-content:space-between;align-items:center;gap:14px;margin:22px 0 12px;padding-top:8px}.lesson-step-footer .content-nav-controls{flex:1;margin:0}.lesson-step-footer button:disabled{opacity:.45;cursor:not-allowed;transform:none}.lesson-step-footer button[data-prev]{background:#64748b}.lesson-step-footer button[data-next]{background:var(--accent,#00a896)}
    .content-step-hidden{display:none!important}
    .content-nav-hint{font-size:.72rem;line-height:1.3;color:var(--muted,#626b83);margin:6px 0 0}
    .content-nav button:focus-visible{outline:3px solid #202642;outline-offset:3px}
    @media(max-width:760px){body{padding-right:0}.content-nav{left:8px;right:8px;top:auto;bottom:8px;width:auto;max-height:34vh}.content-nav-links{flex-direction:row;overflow-x:auto}.content-nav-links button{width:auto;white-space:nowrap}.content-nav-controls{flex-direction:row}.lesson-step-footer{margin-bottom:40vh}.content-nav-hint{display:none}}
  `;
  document.head.appendChild(style);

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

  // Book/workbook/vocabulary: one existing content panel per step; no content is rewritten.
  const panels = Array.from(main.querySelectorAll(':scope > .panel'));
  if (panels.length >= 2 && !main.querySelector('form#quiz')) {
    main.insertBefore(nav, panels[0]);
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

  // Tests: paginate the questions while keeping all answers and scoring logic intact.
  const quiz = main.querySelector('form#quiz');
  if (quiz) {
    const questions = Array.from(quiz.querySelectorAll('.question'));
    if (questions.length > 1) {
      const testNav = nav;
      // The test has score/teacher panels too; place the navigator immediately before the quiz.
      if (!testNav.isConnected) main.insertBefore(testNav,quiz);
      quiz.insertAdjacentElement('afterend',footer);
      testNav.querySelector('.content-nav-title').textContent='Your test · one question at a time';
      links.replaceChildren();
      let current=0;
      const qButtons=questions.map((q,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label','Go to question '+(i+1));b.addEventListener('click',()=>showQuestion(i));links.appendChild(b);return b});
      function showQuestion(i){current=Math.max(0,Math.min(i,questions.length-1));questions.forEach((q,j)=>q.classList.toggle('content-step-hidden',j!==current));qButtons.forEach((b,j)=>{if(j===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});count.textContent='QUESTION '+(current+1)+' / '+questions.length;bar.style.width=((current+1)/questions.length*100)+'%';prev.disabled=current===0;next.textContent=current===questions.length-1?'Back to question 1 ↺':'Next question →'}
      prev.onclick=()=>showQuestion(current-1);next.onclick=()=>showQuestion(current===questions.length-1?0:current+1);showQuestion(0);
    }
  }
})();