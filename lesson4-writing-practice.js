/* Writing standard for Grade 3 and Grade 4 Unit 1 Lesson 4 book pages.
   Only genuine written-production activities (and digital writing frames on the pages)
   are grouped here. Printed activity text, existing answer guidance and the lesson-local
   storage keys stay unchanged: this layer adds labelled models, per-activity persistence,
   status and an explicit synchronous reset, migrating any existing draft so no pupil work
   is lost. */
(() => {
  'use strict';
  const file = location.pathname.split('/').pop();
  const supported = new Set([
    'grade3-unit1-lesson4-workbook.html',
    'grade4-unit1-lesson4-pupil-book.html',
    'grade4-unit1-lesson4-workbook.html'
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

  /* Grade 3 · Workbook (pp. 12–14). Exercises 1, 2, 5 and 6 require written responses
     and keep their existing inferred-answer reveals. */
  if (file === 'grade3-unit1-lesson4-workbook.html') {
    group(byId('wb-1'), 'wb-1');
    group(byId('wb-2'), 'wb-2');
    group(byId('wb-5'), 'wb-5');
    group(byId('wb-6'), 'wb-6');
  }

  /* Grade 4 · Pupil's Book (pp. 12–14). */
  if (file === 'grade4-unit1-lesson4-pupil-book.html') {
    group(byId('pb-1'), 'pb-1', {
      note: 'The original recording was not supplied, so the listening order cannot be verified from the pictures and no answer model is provided. Your numbers are saved as practice only and are not graded.'
    });
    group(byId('pb-3'), 'pb-3', {
      model: ['Show a sample description (answers vary)', 'There is a bathroom upstairs. There is a kitchen downstairs. There is a bedroom with a bunk bed.']
    });
    group(byId('pb-6'), 'pb-6', {
      model: ['Show a sample answer (answers vary)', 'a. My dream house would be big with a garden. b. There are six rooms.']
    });
    group(byId('pb-9'), 'pb-9');
    group(byId('pb-10'), 'pb-10');
    group(byId('pb-11'), 'pb-11', {
      model: ['Show a sample answer (answers vary)', 'My dream house is big and bright. It has three bedrooms, a living room, a kitchen and a small garden.']
    });
  }

  /* Grade 4 · Workbook (pp. 14–16). */
  if (file === 'grade4-unit1-lesson4-workbook.html') {
    group(byId('wb-2'), 'wb-2', {
      model: ['Show a sample answer (answers vary)', '2. There is a sofa in the kitchen. · 3. There is a refrigerator in the living room. · 4. There is a bed in the hall.']
    });
    group(byId('wb-3'), 'wb-3', {
      model: ['Show a sample answer (answers vary)', '1. There is a sofa in the living room. There isn’t a TV. · 2. There is a bed and a wardrobe in the bedroom. · 3. There is a bath and a sink in the bathroom. · 4. There is a house with four windows. · 5. There is a house with trees around it. · 6. There is a house with a garage.']
    });
    group(byId('wb-6'), 'wb-6', {
      model: ['Show a sample answer (answers vary)', '1. Yes, there is. · 2. No, there aren’t. · 3. Yes, there is. · 4. Is there a balcony? — Yes, there is.']
    });
    group(byId('wb-8'), 'wb-8');
    group(byId('wb-9'), 'wb-9', {
      model: ['Show a sample answer (answers vary)', 'My favourite room is my bedroom. There is a bed, a desk and a wardrobe. There are two windows and a computer on the desk.']
    });
  }

  const legacyFieldKey = control => (file === 'grade3-unit1-lesson4-workbook.html' ? control.name : control.id);
  const readLegacy = () => {
    try {
      if (file === 'grade3-unit1-lesson4-workbook.html') {
        const page = document.body.dataset.navPage || 'workbook';
        const stored = JSON.parse(localStorage.getItem(`efc_grade3_unit1_lesson4_practice_v1:${page}`) || 'null');
        const fields = stored && typeof stored.fields === 'object' && stored.fields ? stored.fields : {};
        return Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === 'string'));
      }
      const stored = JSON.parse(localStorage.getItem(`efc_grade4_unit1_lesson4:practice:${location.pathname}`) || 'null');
      const values = {};
      for (const [id, entry] of Object.entries(stored || {})) {
        if (entry && typeof entry.value === 'string') values[id] = entry.value;
      }
      return values;
    } catch { return {}; }
  };
  const clearLegacy = controls => {
    try {
      if (file === 'grade3-unit1-lesson4-workbook.html') {
        const page = document.body.dataset.navPage || 'workbook';
        const key = `efc_grade3_unit1_lesson4_practice_v1:${page}`;
        const stored = JSON.parse(localStorage.getItem(key) || 'null');
        if (!stored || typeof stored.fields !== 'object' || !stored.fields) return;
        controls.forEach(control => { if (control.name) delete stored.fields[control.name]; });
        localStorage.setItem(key, JSON.stringify(stored));
        return;
      }
      const key = `efc_grade4_unit1_lesson4:practice:${location.pathname}`;
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (!stored || typeof stored !== 'object') return;
      controls.forEach(control => { if (control.id) delete stored[control.id]; });
      localStorage.setItem(key, JSON.stringify(stored));
    } catch { /* Storage is optional; the visible status reports it. */ }
  };

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
    const activityControls = [...target.querySelectorAll('input, select, textarea')];

    /* Synchronous reset: clears fields, writing key, legacy draft, open models,
       invalid markings and feedback before returning. */
    const performReset = () => {
      activityControls.forEach(control => {
        if (control.type === 'checkbox' || control.type === 'radio') control.checked = false;
        else control.value = '';
        control.removeAttribute('aria-invalid');
      });
      closeModels();
      const feedback = target.querySelector('.practice-feedback');
      if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback practice-feedback';
      }
      clearLegacy(activityControls);
      try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
      report();
    };

    const form = target.querySelector('form');
    if (form) {
      form.addEventListener('reset', event => {
        event.preventDefault();
        performReset();
      });
    }
    if (reset.type !== 'reset') {
      reset.addEventListener('click', () => {
        if (form) form.reset();
        else performReset();
      });
    }
    if (!Array.isArray(saved) && restored.some(value => typeof value === 'string' && value !== '')) save();
    report();
  });

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
