/* Writing standard for Grade 3 Unit 1 Lesson 6 Workbook (pages 18–20).
   Each activity is a <section data-writing-activity> with a <form class="practice-form">.
   This layer adds: local drafts that survive reload, a labelled model shown on request,
   a side-by-side comparison that never overwrites the pupil’s text, and a reset that
   clears only the activity it belongs to. Nothing is marked automatically: the comparison
   only shows whether a response matches the labelled inferred model, and open-ended
   items say that answers vary. */
(() => {
  'use strict';
  const file = location.pathname.split('/').pop();
  if (file !== 'grade3-unit1-lesson6-workbook.html') return;

  const KEY = 'grade3-unit1-lesson6-workbook-drafts-v1';
  const OPEN_ENDED = new Set(['wb-6']);
  let storageOk = true;
  let drafts = {};

  try {
    drafts = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    storageOk = false;
    drafts = {};
  }

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(drafts));
      return true;
    } catch (e) {
      storageOk = false;
      return false;
    }
  };

  const inputsOf = section => Array.from(section.querySelectorAll('input[type="text"]'));
  const feedbackOf = section => section.querySelector('.practice-feedback');
  const modelItems = section => Array.from(section.querySelectorAll('.answer ol li')).map(li => li.textContent.trim());
  const norm = s => s.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '').toLowerCase();

  const say = (section, message) => {
    const fb = feedbackOf(section);
    if (fb) fb.textContent = message;
  };

  const storageMessage = () => storageOk
    ? ''
    : ' Your answer is shown on this page but could not be saved in this browser. Keep a copy before you leave.';

  /* Restore saved drafts into every activity. */
  document.querySelectorAll('[data-writing-activity]').forEach(section => {
    const id = section.dataset.writingActivity;
    const saved = drafts[id] || {};
    inputsOf(section).forEach(input => {
      if (Object.prototype.hasOwnProperty.call(saved, input.name)) input.value = saved[input.name];
      input.addEventListener('input', () => {
        drafts[id] = drafts[id] || {};
        drafts[id][input.name] = input.value;
        if (save()) say(section, '');
        else say(section, 'Saving failed.' + storageMessage());
      });
    });

    /* Compare: show each response beside its model without changing either. */
    const check = section.querySelector('.check-practice');
    if (check) {
      check.addEventListener('click', () => {
        const models = modelItems(section);
        const inputs = inputsOf(section);
        if (!models.length) return say(section, 'No model is provided for this activity.');
        if (OPEN_ENDED.has(id)) {
          return say(section, 'Answers vary. Compare your sentences with the examples above; they are illustrative and not official answers.' + storageMessage());
        }
        const rows = inputs.map((input, i) => {
          const mine = input.value.trim();
          const model = models[i] || '';
          if (!mine) return `Item ${i + 1}: no answer yet · model: ${model}`;
          return norm(mine) === norm(model)
            ? `Item ${i + 1}: matches the inferred model`
            : `Item ${i + 1}: different from the inferred model (yours: ${mine}; model: ${model})`;
        });
        say(section, rows.join(' · ') + '. The model is inferred, not an official key.' + storageMessage());
      });
    }

    /* Reset clears only this activity’s drafts. */
    const reset = section.querySelector('button[type="reset"]');
    if (reset) {
      reset.addEventListener('click', () => {
        setTimeout(() => {
          inputsOf(section).forEach(input => { input.value = ''; });
          delete drafts[id];
          if (!save()) storageOk = false;
          say(section, 'This exercise is cleared. Other exercises are unchanged.' + storageMessage());
        }, 0);
      });
    }
  });
})();
