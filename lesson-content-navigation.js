/* Shared in-lesson navigator: turns long lesson pages into short, navigable steps. */
(() => {
  const main = document.querySelector('main.wrap');
  if (!main || document.body.dataset.navPage === 'menu') return;
  const style = document.createElement('style');
  style.textContent = `
    .content-nav{background:#fff;border:1px solid #e5e9f4;border-radius:20px;padding:18px;margin:18px 0 24px;box-shadow:0 10px 28px #25304a0b}
    .content-nav-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .content-nav-title{font-weight:900;font-size:1.05rem}
    .content-nav-count{color:var(--muted,#626b83);font-weight:800;font-size:.9rem}
    .content-nav-track{height:7px;background:#edf0f7;border-radius:99px;overflow:hidden;margin:13px 0}
    .content-nav-track span{display:block;height:100%;width:0;background:var(--accent,#00a896);border-radius:99px;transition:width .2s}
    .content-nav-links{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .content-nav-links button{background:var(--soft,#eaf5ff);color:var(--ink,#202642);box-shadow:none;border:1px solid transparent;padding:8px 12px}
    .content-nav-links button[aria-current=step]{background:var(--accent,#00a896);color:white}
    .content-nav-controls{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
    .content-step-hidden{display:none!important}
    .content-nav-hint{font-size:.9rem;color:var(--muted,#626b83);margin:8px 0 0}
    .content-nav button:focus-visible{outline:3px solid #202642;outline-offset:3px}
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
  const prev = nav.querySelector('[data-prev]');
  const next = nav.querySelector('[data-next]');

  // Book/workbook/vocabulary: one existing content panel per step; no content is rewritten.
  const panels = Array.from(main.querySelectorAll(':scope > .panel'));
  if (panels.length >= 2) {
    main.insertBefore(nav, panels[0]);
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
      testNav.querySelector('.content-nav-title').textContent='Your test · one question at a time';
      links.replaceChildren();
      let current=0;
      const qButtons=questions.map((q,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label','Go to question '+(i+1));b.addEventListener('click',()=>showQuestion(i));links.appendChild(b);return b});
      function showQuestion(i){current=Math.max(0,Math.min(i,questions.length-1));questions.forEach((q,j)=>q.classList.toggle('content-step-hidden',j!==current));qButtons.forEach((b,j)=>{if(j===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});count.textContent='QUESTION '+(current+1)+' / '+questions.length;bar.style.width=((current+1)/questions.length*100)+'%';prev.disabled=current===0;next.textContent=current===questions.length-1?'Back to question 1 ↺':'Next question →'}
      prev.onclick=()=>showQuestion(current-1);next.onclick=()=>showQuestion(current===questions.length-1?0:current+1);showQuestion(0);
    }
  }
})();