/* Writing standard for Grade 3 and Grade 4 Unit 1 Lesson 3 book pages.
   Only genuine written-production activities are grouped here. Printed activity text,
   existing answer guidance and the lesson-local storage keys stay unchanged: this layer
   adds labelled models, per-activity persistence, status and an explicit reset, and it
   migrates any draft already saved by the lesson scripts so no pupil work is lost. */
(() => {
  'use strict';
  const file = location.pathname.split('/').pop();
  const supported = new Set([
    'grade3-unit1-lesson3-workbook.html',
    'grade4-unit1-lesson3-pupil-book.html',
    'grade4-unit1-lesson3-workbook.html'
  ]);
  if (!supported.has(file)) return;
  const main = document.querySelector('main.wrap');
  if (!main) return;

  const sections = [...main.querySelectorAll('section.panel')];
  const byId = id => sections.find(section => section.id === id);
  const make = (tag, text, attrs = {}) => {
    const el = document.createElement(tag);
    el.textContent = text;
    Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
    return el;
  };
  const addModel = (target, label, text, caveat) => {
    const details = make('details', '', { class: 'activity writing-model', 'data-student-model': '' });
    details.append(make('summary', label), make('p', text));
    if (caveat) details.append(make('p', caveat, { class: 'source-note' }));
    target.append(details);
  };
  const groups = [];
  const group = (target, id, options = {}) => {
    if (!target) throw new Error(`Missing writing activity ${id}`);
    target.dataset.writingActivity = id;
    if (options.model) addModel(target, options.model[0], options.model[1], options.model[2]);
    if (options.note) target.append(make('p', options.note, { class: 'notice', 'data-writing-exception': '' }));
    const controls = [...target.querySelectorAll('input[type="text"], textarea')];
    if (!controls.length) throw new Error(`Missing writing controls ${id}`);
    // Reuse a printed activity's own reset control so no duplicate reset button appears.
    let reset = target.querySelector('button[type="reset"]');
    if (reset) {
      reset.dataset.writingReset = '';
    } else {
      reset = make('button', 'Reset this activity', { type: 'button', class: 'secondary', 'data-writing-reset': '' });
      const actions = make('div', '', { class: 'writing-actions' });
      actions.append(reset);
      target.append(actions);
    }
    const status = make('p', '', { class: 'muted', role: 'status', 'data-writing-status': '' });
    target.append(status);
    groups.push({ id, target, controls, status, reset });
  };

  /* Grade 3 · Workbook. Every printed exercise requires a written response.
     Exercises 1, 3, 5 and 6 keep their existing inferred-answer reveals. */
  if (file === 'grade3-unit1-lesson3-workbook.html') {
    group(byId('wb-1'), 'wb-1');
    group(byId('wb-2'), 'wb-2', {
      note: 'The original recording was not supplied, so the numbering cannot be verified from the pictures and no answer model is provided. Your numbers are saved as practice only and are not graded.'
    });
    group(byId('wb-3'), 'wb-3');
    group(byId('wb-4'), 'wb-4', {
      model: ['Show a sample answer (answers vary)', '2- My favourite room is the library. I can read interesting books there.']
    });
    group(byId('wb-5'), 'wb-5');
    group(byId('wb-6'), 'wb-6');
  }

  /* Grade 4 · Pupil's Book. Activities 8 and 9 are constrained by their printed word
     banks and keep their suggested-answer reveals; Activity 10 is personal writing. */
  if (file === 'grade4-unit1-lesson3-pupil-book.html') {
    group(byId('pb-9'), 'pb-9');
    group(byId('pb-10'), 'pb-10');
    group(byId('pb-11'), 'pb-11', {
      model: ['Show a sample answer (answers vary)', 'I wake up at half past six in the morning. I wash my face then I get dressed. I have my breakfast. In the afternoon, I do my homework and play with my sister.']
    });
  }

  /* Grade 4 · Workbook. Exercise 2 keeps its printed word-bank model. Exercise 4 has no
     reveal in the book, so its times are read from the printed clock hands here. */
  if (file === 'grade4-unit1-lesson3-workbook.html') {
    group(byId('wb-2'), 'wb-2');
    group(byId('wb-4'), 'wb-4', {
      model: [
        'Show the times printed on the five clocks',
        '1. It’s half past ten. · 2. It’s quarter to one. · 3. It’s quarter past six. · 4. It’s four o’clock. · 5. It’s quarter past seven.',
        'Read from the printed hands: the long hand shows the minutes and the short hand the hour. In clock 2 the minute hand points at 9 and the hour hand sits next to 12, so the time is 12:45 — said as “quarter to one”. The book prints no answer key.'
      ]
    });
    group(byId('wb-5'), 'wb-5', {
      model: ['Show a sample answer (answers vary)', 'What time do you usually have breakfast? — I usually have breakfast at seven o’clock.']
    });
    group(byId('wb-8'), 'wb-8', {
      model: ['Show a sample answer (answers vary)', 'I wake up at 6.30 in the morning. I wash my face and brush my teeth. I go to school at 7.30. In the afternoon, I have lunch then I do my homework. In the evening, I have dinner before I go to bed.']
    });
  }

  /* Drafts saved before this layer existed live in the lesson-local stores. Read them so an
     earlier pupil draft is adopted instead of being discarded. */
  const legacyFieldKey = control => (file === 'grade3-unit1-lesson3-workbook.html' ? control.name : control.id);
  const readLegacy = () => {
    try {
      if (file === 'grade3-unit1-lesson3-workbook.html') {
        const page = document.body.dataset.navPage || 'workbook';
        const stored = JSON.parse(localStorage.getItem(`efc_grade3_unit1_lesson3_practice_v1:${page}`) || 'null');
        const fields = stored && typeof stored.fields === 'object' && stored.fields ? stored.fields : {};
        return Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === 'string'));
      }
      const stored = JSON.parse(localStorage.getItem(`efc_grade4_unit1_lesson3:practice:${location.pathname}`) || 'null');
      const values = {};
      for (const [id, entry] of Object.entries(stored || {})) {
        if (entry && typeof entry.value === 'string') values[id] = entry.value;
      }
      return values;
    } catch { return {}; }
  };
  const clearLegacy = controls => {
    try {
      if (file === 'grade3-unit1-lesson3-workbook.html') {
        const page = document.body.dataset.navPage || 'workbook';
        const key = `efc_grade3_unit1_lesson3_practice_v1:${page}`;
        const stored = JSON.parse(localStorage.getItem(key) || 'null');
        if (!stored || typeof stored.fields !== 'object' || !stored.fields) return;
        controls.forEach(control => { if (control.name) delete stored.fields[control.name]; });
        localStorage.setItem(key, JSON.stringify(stored));
        return;
      }
      const key = `efc_grade4_unit1_lesson3:practice:${location.pathname}`;
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (!stored || typeof stored !== 'object') return;
      controls.forEach(control => { if (control.id) delete stored[control.id]; });
      localStorage.setItem(key, JSON.stringify(stored));
    } catch { /* Storage is optional; the visible status reports it. */ }
  };

  // Per-page and per-activity storage keeps one reset from clearing another activity.
  const prefix = `efc_writing_${file.replace('.html', '')}_v1:`;
  const legacyValues = readLegacy();
  groups.forEach(({ id, target, controls, status, reset }) => {
    const key = prefix + id;
    let available = true;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { available = false; }
    const restored = Array.isArray(saved) && saved.length === controls.length && saved.every(value => typeof value === 'string')
      ? saved
      : controls.map(control => legacyValues[legacyFieldKey(control)] || '');
    controls.forEach((control, index) => {
      if (typeof restored[index] === 'string' && restored[index] !== '') control.value = restored[index];
    });

    const report = () => {
      status.textContent = available
        ? 'Responses are saved in this browser. Compare, edit, or reset when ready.'
        : 'Browser storage is unavailable; your responses may be lost when you leave or reload.';
    };
    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(controls.map(control => control.value)));
        available = true;
      } catch { available = false; }
      report();
    };
    controls.forEach(control => {
      control.addEventListener('input', save);
      control.addEventListener('change', save);
    });

    const closeModels = () => {
      target.querySelectorAll('details[data-student-model]').forEach(details => { details.open = false; });
      target.querySelectorAll('button[aria-controls][aria-expanded="true"]').forEach(button => button.click());
    };
    const clear = () => {
      controls.forEach(control => { control.value = ''; control.removeAttribute('aria-invalid'); });
      clearLegacy(controls);
      try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
      closeModels();
      const feedback = target.querySelector('.practice-feedback');
      if (feedback) { feedback.textContent = ''; feedback.className = 'feedback practice-feedback'; }
      report();
    };

    const form = target.querySelector('form');
    const afterReset = () => {
      closeModels();
      window.setTimeout(clear, 0);
    };
    if (reset.type === 'reset') {
      // The printed control already resets the form; keep the saved draft in step with it.
      form?.addEventListener('reset', afterReset);
    } else {
      reset.addEventListener('click', () => {
        if (form) form.reset();
        else clear();
        afterReset();
      });
    }
    if (!Array.isArray(saved)) save();
    report();
  });

  // The page-level reset clears every typed draft, so the writing drafts follow it.
  const pageReset = document.getElementById('reset-book-practice');
  if (pageReset) {
    pageReset.addEventListener('click', () => {
      groups.forEach(({ id, target, controls, status }) => {
        try { localStorage.removeItem(prefix + id); } catch { /* Storage is optional. */ }
        target.querySelectorAll('details[data-student-model]').forEach(details => { details.open = false; });
        controls.forEach(control => control.removeAttribute('aria-invalid'));
        if (status) status.textContent = 'Responses are saved in this browser. Compare, edit, or reset when ready.';
      });
    });
  }
})();
