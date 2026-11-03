/* Shared C-3 accessibility behaviour for existing answer reveals and teacher-key gates.
   This file does not create, remove or rewrite lesson content, answers or scoring. */
(() => {
  'use strict';

  const clean = value => (value || '').replace(/\s+/g, ' ').trim();

  function panelIsOpen(panel) {
    if (!panel) return false;
    if (panel.hasAttribute('hidden')) return false;
    if (panel.style.display === 'none') return false;
    if (panel.classList.contains('answer') || panel.classList.contains('answers') || panel.classList.contains('answer-key')) {
      const classBased = document.body.dataset.answerToggle === 'class' || panel.classList.contains('answers');
      if (classBased && !panel.classList.contains('show')) return false;
    }
    return getComputedStyle(panel).display !== 'none';
  }

  function setPanelOpen(panel, open) {
    const classBased = document.body.dataset.answerToggle === 'class' || panel.classList.contains('answers');
    if (classBased) {
      panel.classList.toggle('show', open);
      panel.removeAttribute('hidden');
    } else {
      panel.hidden = !open;
    }
  }

  function ensureStatus(button) {
    let status = button.nextElementSibling;
    if (!status || !status.hasAttribute('data-reveal-status')) {
      status = document.createElement('span');
      status.className = 'sr-only';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('data-reveal-status', '');
      button.insertAdjacentElement('afterend', status);
    }
    return status;
  }

  function syncReveal(button, announce = false) {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    const open = panelIsOpen(panel);
    button.setAttribute('aria-expanded', String(open));
    const show = button.dataset.show || clean(button.textContent);
    const hide = button.dataset.hide || (/^show\b/i.test(show) ? show.replace(/^show\b/i, 'Hide') : 'Hide ' + show.charAt(0).toLowerCase() + show.slice(1));
    button.dataset.show = show;
    button.dataset.hide = hide;
    button.textContent = open ? hide : show;
    if (announce) ensureStatus(button).textContent = open ? 'Answer shown.' : 'Answer hidden.';
  }

  const revealButtons = Array.from(document.querySelectorAll('button.reveal, button[data-answer], button[data-a], button[data-reveal], button[data-toggle-answer]'));
  revealButtons.forEach(button => {
    button.type = 'button';
    if (!button.hasAttribute('aria-controls')) {
      const target = button.dataset.reveal || button.dataset.answer || button.dataset.a;
      if (target) button.setAttribute('aria-controls', target);
    }
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    // Register the empty live region before the first interaction. Creating a
    // live region and filling it in the same click is not reliably announced.
    ensureStatus(button);
    if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', String(panelIsOpen(panel)));
    syncReveal(button, false);
    button.addEventListener('click', () => {
      const open = !panelIsOpen(panel);
      setPanelOpen(panel, open);
      syncReveal(button, true);
    });
    const observer = new MutationObserver(() => syncReveal(button, false));
    observer.observe(panel, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  });

  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', event => {
      if (form.classList.contains('practice-form')) event.preventDefault();
    });
    form.addEventListener('reset', () => {
      form.querySelectorAll('button.reveal, button[data-answer], button[data-a], button[data-reveal], button[data-toggle-answer]').forEach(button => {
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        if (!panel) return;
        setPanelOpen(panel, false);
        syncReveal(button, true);
      });
    });
  });

  // Teacher gates keep their existing password logic. Only mirror the real panel state into ARIA.
  const gateButtons = Array.from(document.querySelectorAll('button[aria-controls]')).filter(button => !revealButtons.includes(button));
  gateButtons.forEach(button => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    const sync = () => button.setAttribute('aria-expanded', String(panelIsOpen(panel)));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(panel, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  });
})();
