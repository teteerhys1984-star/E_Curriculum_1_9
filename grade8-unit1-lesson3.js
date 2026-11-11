/* Let's Discover: lesson-local practice and independent assessment.
   Shared accessibility and navigation scripts own reveals and page navigation. */
(() => {
  'use strict';
  const main = document.querySelector('main.wrap');
  if (!main) return;
  const page = document.body.dataset.navPage || 'page';
  const key = 'efc_grade8_unit1_lesson3_v1:' + page;
  const read = () => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch { return {}; }
  };
  let state = read();
  let storageAvailable = true;
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
  };
  const normalize = text => String(text || '').toLowerCase().replace(/[’‘`]/g, "'")
    .trim().replace(/\s+/g, ' ').replace(/\s+([?.!,])/g, '$1').replace(/[.?!]+$/, '').trim();
  const forms = Array.from(main.querySelectorAll('form.practice-form, form#quiz'));
  forms.forEach(form => {
    const controls = Array.from(form.querySelectorAll('input[name],select[name],textarea[name]'));
    const entries = () => Object.fromEntries(controls.filter(el => el.type !== 'radio' || el.checked)
      .map(el => [el.name, el.value]));
    const old = state[form.id] && typeof state[form.id] === 'object' ? state[form.id] : {};
    controls.forEach(el => {
      const value = old[el.name];
      if (typeof value !== 'string') return;
      if (el.type === 'radio') el.checked = el.value === value;
      else el.value = value;
    });
    const progress = () => {
      const output = form.querySelector('[data-progress]');
      if (!output) return;
      const names = new Set(controls.map(el => el.name));
      const answered = Object.values(entries()).filter(v => v.trim()).length;
      output.textContent = `${answered} of ${names.size} responses entered. ${storageAvailable ? 'Saved in this browser.' : 'Browser storage is unavailable; responses will not persist.'}`;
    };
    const clearMarks = () => {
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      form.querySelectorAll('.g8l3-feedback, .quiz-item-feedback').forEach(el => { el.textContent = ''; });
      const feedback = form.querySelector('.practice-feedback');
      if (feedback) feedback.textContent = '';
      const result = form.querySelector('#quiz-result');
      if (result) result.textContent = '';
    };
    const record = () => { state[form.id] = entries(); if (form.id === 'quiz') delete state.quizScore; save(); clearMarks(); progress(); };
    controls.forEach(el => { el.addEventListener('input', record); el.addEventListener('change', record); });
    form.addEventListener('reset', () => setTimeout(() => {
      delete state[form.id]; if (form.id === 'quiz') delete state.quizScore; save(); clearMarks(); progress();
    }, 0));
    form.addEventListener('submit', event => event.preventDefault());
    form.querySelector('.check-practice')?.addEventListener('click', () => {
      let correct = 0;
      const items = Array.from(form.querySelectorAll('[data-practice-answer]'));
      items.forEach(item => {
        const fields = Array.from(item.querySelectorAll('input,select,textarea'));
        const selected = fields.find(el => el.type !== 'radio' || el.checked);
        const value = normalize(selected?.value);
        const ok = !!value && item.dataset.practiceAnswer.split('|').some(answer => normalize(answer) === value);
        if (ok) correct++;
        fields.forEach(el => el.setAttribute('aria-invalid', String(!ok)));
        item.querySelector('.g8l3-feedback').textContent = !value ? 'Not answered.' : ok ? 'Correct.' : 'Review and try again.';
      });
      const feedback = form.querySelector('.practice-feedback');
      feedback.textContent = `${correct} of ${items.length} checked responses correct. Personal, open and unscored items are excluded. You can revise or open the guidance.`;
      feedback.className = 'feedback practice-feedback ' + (correct === items.length ? 'correct' : 'unanswered');
    });
    if (form.id === 'quiz') form.addEventListener('submit', () => {
      const questions = Array.from(form.querySelectorAll('.question'));
      let correct = 0;
      questions.forEach(question => {
        const selected = question.querySelector('input:checked');
        const ok = selected?.value === question.dataset.correct;
        if (ok) correct++;
        question.querySelectorAll('input').forEach(el => el.setAttribute('aria-invalid', String(!ok)));
        question.querySelector('.quiz-item-feedback').textContent = !selected ? 'Not answered.' : ok ? 'Correct.' : 'Review this answer.';
      });
      form.querySelector('#quiz-result').textContent = `Score: ${correct} / ${questions.length}. Revise your answers and submit again, or reset to start over.`;
      state.quizScore = correct; save();
    });
    if (form.id === 'quiz' && Number.isInteger(state.quizScore) && state.quizScore >= 0 && state.quizScore <= form.querySelectorAll('.question').length) {
      form.querySelector('#quiz-result').textContent = `Score: ${state.quizScore} / ${form.querySelectorAll('.question').length}. Revise your answers and submit again, or reset to start over.`;
    }
    progress();
  });
  const password = document.getElementById('teacher-password');
  const unlock = document.getElementById('unlock-teacher');
  const teacherKey = document.getElementById('answer-key');
  const status = document.getElementById('teacher-status');
  if (password && unlock && teacherKey && status) {
    const open = () => {
      const ok = password.value === 'somer173';
      teacherKey.hidden = !ok;
      status.textContent = ok ? 'Teacher guidance is open. This is not a secure login.' : 'Incorrect password or empty entry.';
      password.value = '';
    };
    unlock.addEventListener('click', open);
    password.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); open(); } });
  }
})();
