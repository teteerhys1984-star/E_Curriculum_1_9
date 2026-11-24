/* Writing standard for Grade 3 and Grade 4 Unit 1 Lesson 5 book pages.
   Only genuine written-production activities are grouped here. Printed activity text,
   existing answer guidance and the lesson-local storage keys stay unchanged: this layer
   adds labelled models, per-activity persistence, an honest status line and an explicit
   synchronous reset. Existing drafts saved by the lesson scripts are migrated, never lost. */
(() => {
  'use strict';
  const file = location.pathname.split('/').pop();
  const supported = new Set([
    'grade3-unit1-lesson5-pupil-book.html',
    'grade3-unit1-lesson5-workbook.html',
    'grade4-unit1-lesson5-pupil-book.html',
    'grade4-unit1-lesson5-workbook.html'
  ]);
  if (!supported.has(file)) return;
  const main = document.querySelector('main.wrap');
  if (!main) return;

  const isGrade3 = file.startsWith('grade3-');
  const page = file.replace(/^grade[34]-unit1-lesson5-/, '').replace('.html', '');

  /* Per-activity student-facing models and exceptions.
     A model is added only where the source settles the answer; open or personal
     prompts carry an explicit "answers vary" label; audio- or layout-dependent
     items carry a disclosed exception and no fabricated model. */
  const config = {
    /* Grade 3 — Revision 1. Pupil's Book p. 16 is the only written-production page. */
    'grade3-unit1-lesson5-pupil-book.html': {
      'pb-2': {
        note: 'The original recording was not supplied, so the three empty Sally cells cannot be verified from the printed table and no answer model is provided. Those cells are saved as practice only and are not checked. The “My name is……” column is about you, so it has no fixed answer either.'
      }
    },
    /* Grade 3 — Revision 1 Workbook p. 17. Both exercises keep their printed guidance. */
    'grade3-unit1-lesson5-workbook.html': {
      'wb-5': {},
      'wb-6': {
        note: 'The printed columns disagree: the sound pairs run oo, ou, oa, ea; the pictures run broom, house, goat, boy eating; the word frames run “… … t”, “g … … t”, “br … … m”, “h.o. .u. se”. The book’s own blue example line jumps from ou to h.o. .u. se, so the picture-to-word matching cannot be verified from the page. Only the word-level sound mapping below is inferred and labelled; nothing is graded as a unique answer.'
      }
    },
    /* Grade 4 — School Subjects, Pupil's Book pp. 15–20. */
    'grade4-unit1-lesson5-pupil-book.html': {
      'pb-1': {
        note: 'The original recording was not supplied, so which number belongs in each of the nine printed bubbles cannot be verified. Your numbers are saved as practice only and are not graded; no answer model is provided.'
      },
      'pb-7': {
        model: ['Show the verified word order', '1. My favourite subject is geography. · 2. I am good at English. · 3. Science is useful.', 'Each sentence uses every printed word once. The book prints no key; these orders follow the printed words and the Let’s Learn models on the same page.']
      },
      'pb-8': {
        model: ['Show a sample answer (answers vary)', 'I like English and geography. My favourite subject is geography. Science is interesting. Maths is difficult. I love Arabic. I am good at art.', 'This is one possible answer. Your own subjects, opinions and order will differ, so there is no single correct version.']
      },
      'pb-10': {
        model: ['Show the verified corrections (item 5 is a labelled example)', '1. are · 2. likes · 3. wakes · 4. is · 5. has got', 'Items 1–4 change the underlined word to its correct form. Item 5 cannot be repaired by a form change: “Sally is brown eyes” needs “has got”, the structure printed in the Lesson’s Activity 3 (“She’s got blue eyes”). It is therefore given as an example, not as a unique key.'],
        note: 'Item 5 is the one item whose answer the scan does not settle by a single-word substitution. The correction “has got” is offered as a labelled example, not as a verified unique answer, and this activity is not graded.'
      },
      'pb-11': {
        model: ['Show the verified words', '1. History · 2. Arabic · 3. meet · 4. eyes · 5. o’clock', 'Each word uses every letter printed in its frame exactly once.']
      },
      'pb-12': {
        model: ['Show a sample project card (answers vary)', 'Name: Sara · Date of Birth: 12 March · Weight: 32 kg · Height: 138 cm · Address: 14 School Street · Eye Colour: brown · Hair Colour: black', 'These are your own personal details, so they cannot be verified and no unique answer exists. A sample clock design: a round face with twelve numbers and the hands at half past four.']
      }
    },
    /* Grade 4 — School Subjects, Workbook pp. 17–21. Block ids follow the page
       sections; the exercise number each model belongs to is named in its label. */
    'grade4-unit1-lesson5-workbook.html': {
      'wb-1': {
        model: ['Show the verified subjects (Exercise 1)', '2. Science · 3. Geography · 4. Art · 5. History · 6. Music · 7. English · 8. Sports', 'Item 1 is printed answered as “Arabic”. Each of the other answers uses every letter in its frame exactly once, and every subject is printed in the same book.']
      },
      'wb-2': {
        model: ['Show the verified picture words (Exercise 2)', 'Geography · Science · Arabic · Sports · English · History · Music · Art', 'Read from the printed pictures in reading order: globe with compass; microscope and flask; the word “Arabic”; ball, glove and trainer; the word “ENGLISH”; guidebook and old building; violin and sheet music; palette and easel.']
      },
      'wb-3': {
        model: ['Show a sample dialogue (Exercise 3 — answers vary)', 'Sarah: My favourite subject is Science. · What’s your favourite subject, Peter? · Peter: My favourite subject is maths.', 'The printed first turn (“Lucy: My favourite subject is history.”) fixes the pattern. Which subject Sarah and Peter name is a personal choice, so those two words are examples, not a unique key.']
      },
      'wb-5': {
        model: ['Show the verified words, with two labelled example blanks (Exercise 5)', '1. I like English. · 4. I am good at maths. · 5. Music is interesting. · 6. Science is useful.', 'Items 2 (“Geography is ……”) and 3 (“Art is ……”) ask for an adjective the book never prints, so the example “interesting” is illustrative only. Items 1, 4, 5 and 6 are fixed by the printed pictures and sentence frames.'],
        note: 'Two of the six blanks are unresolved: the source prints no word bank and no completed adjective for “Geography is ……” or “Art is ……”. Those two are saved as practice only and are not presented as verified answers.'
      },
      'wb-7': {
        model: ['Show the verified word orders (Exercise 8)', '1. English is easy. · 2. I am good at music.', 'Each sentence uses every printed word once.']
      },
      'wb-8': {
        model: ['Show a sample answer (Exercise 9 — answers vary)', '1. My favourite subject is science. · 2. We have science on Monday and Thursday. · 3. I like it because it is interesting and useful. · 4. I want to be a scientist when I grow up.', 'These are your own subject, days and reasons, so no unique answer exists.']
      },
      'wb-10': {
        model: ['Show sample sentences (Exercise 2 — answers vary)', '1. He is good at art. · 2. There is a house next to a tree. · 3. He gets up at seven o’clock. · 4. I am good at maths.', 'Each picture allows more than one true sentence — for example “He has got a paintbrush.” for picture 1 — so these are labelled samples, not a unique key.']
      },
      'wb-11': {
        model: ['Show the verified word orders (Exercise 3)', '1. She has got green eyes. · 2. I make my bed in the morning. · 3. There isn’t a sofa in the bathroom. · 4. Hello Jane! Nice to meet you. · 5. Geography isn’t difficult.', 'Each sentence uses every printed word once.']
      },
      'wb-12': {
        model: ['Show a sample dialogue (Exercise 4 — answers vary)', '1. My name is Omar. · 2. I am from Syria. · 3. My teacher’s name is Miss Layla. · 4. She has got long black hair. · 5. My favourite subject is geography. · 6. I get up at seven and have breakfast.', 'The answers are your own personal details, so they cannot be verified and no unique answer exists.']
      }
    }
  };
  const activities = config[file] || {};

  const make = (tag, text, attrs = {}) => {
    const el = document.createElement(tag);
    el.textContent = text;
    Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
    return el;
  };
  const addModel = (target, model) => {
    const details = make('details', '', { class: 'activity writing-model', 'data-student-model': '' });
    details.append(make('summary', model[0]), make('p', model[1]));
    if (model[2]) details.append(make('p', model[2], { class: 'source-note' }));
    target.append(details);
  };

  const groups = [];
  const group = (target, id) => {
    const options = activities[id] || {};
    if (options.model) addModel(target, options.model);
    if (options.note && !target.querySelector('[data-writing-exception]')) {
      target.append(make('p', options.note, { class: 'notice', 'data-writing-exception': '' }));
    }
    /* A written response can be a typed word or a chosen word (e.g. Grade 3 Workbook
       Exercise 6 fills dotted words by choosing the sound pair), so both count. */
    const controls = [...target.querySelectorAll('input[type="text"], input[type="number"], textarea')];
    const choices = [...target.querySelectorAll('input[type="radio"], input[type="checkbox"], select')];
    if (!controls.length && !choices.length) throw new Error(`Missing writing controls ${id}`);
    // Reuse the activity's own printed reset control so no duplicate button appears.
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
    groups.push({ id, target, controls, choices, status, reset });
  };

  main.querySelectorAll('[data-writing-activity]').forEach(target => group(target, target.dataset.writingActivity));

  /* Legacy drafts. Grade 3 keeps one page store keyed by field name; Grade 4 keeps one
     page store keyed by field id. Both are read for migration and trimmed on reset so a
     cleared activity never reappears from the other store. */
  const legacyKey = isGrade3
    ? `efc_grade3_unit1_lesson5_practice_v1:${page}`
    : `efc_grade4_unit1_lesson5:practice:${location.pathname}`;
  const legacyFieldKey = control => (isGrade3 ? control.name : control.id);
  const readLegacy = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(legacyKey) || 'null');
      if (!isGrade3) {
        const values = {};
        for (const [id, entry] of Object.entries(stored || {})) {
          if (entry && typeof entry.value === 'string') values[id] = entry.value;
        }
        return values;
      }
      const fields = stored && typeof stored.fields === 'object' && stored.fields ? stored.fields : {};
      return Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === 'string'));
    } catch { return {}; }
  };
  const clearLegacy = controls => {
    try {
      if (!isGrade3) {
        const stored = JSON.parse(localStorage.getItem(legacyKey) || 'null');
        if (!stored || typeof stored !== 'object') return;
        controls.forEach(control => { if (control.id) delete stored[control.id]; });
        localStorage.setItem(legacyKey, JSON.stringify(stored));
        return;
      }
      const stored = JSON.parse(localStorage.getItem(legacyKey) || 'null');
      if (!stored || typeof stored.fields !== 'object' || !stored.fields) return;
      controls.forEach(control => { if (control.name) delete stored.fields[control.name]; });
      localStorage.setItem(legacyKey, JSON.stringify(stored));
    } catch { /* Storage is optional; the visible status reports it. */ }
  };

  const prefix = `efc_writing_${file.replace('.html', '')}_v1:`;
  const legacyValues = readLegacy();
  groups.forEach(({ id, target, controls, choices, status, reset }) => {
    const key = prefix + id;
    let available = true;
    let saved = null;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) saved = { text: parsed, chosen: {} };
      else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.text)) saved = parsed;
      else if (raw) available = false;
    } catch { available = false; }
    const fromText = saved && saved.text.length === controls.length && saved.text.every(value => typeof value === 'string')
      ? saved.text
      : controls.map(control => legacyValues[legacyFieldKey(control)] || '');
    controls.forEach((control, index) => {
      if (typeof fromText[index] === 'string' && fromText[index] !== '') control.value = fromText[index];
    });
    const chosen = (saved && saved.chosen) || {};
    choices.forEach(control => {
      const name = control.name || control.id;
      if (!name || !(name in chosen)) return;
      if (control.type === 'radio') control.checked = chosen[name] === control.value;
      else if (control.type === 'checkbox') control.checked = Boolean(chosen[name]);
      else control.value = String(chosen[name]);
    });
    const hasLegacyDraft = controls.some(control => legacyValues[legacyFieldKey(control)]);

    const report = () => {
      status.textContent = available
        ? 'This activity saves in this browser. Compare with the model, keep editing, or reset just this activity.'
        : 'Browser storage is unavailable, so your answers here may be lost when you leave or reload.';
    };
    const snapshot = () => {
      const values = {};
      choices.forEach(control => {
        const name = control.name || control.id;
        if (!name) return;
        if (control.type === 'radio') { if (control.checked) values[name] = control.value; }
        else if (control.type === 'checkbox') values[name] = control.checked;
        else values[name] = control.value;
      });
      return { text: controls.map(control => control.value), chosen: values };
    };
    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(snapshot()));
        available = true;
      } catch { available = false; }
      report();
    };
    controls.forEach(control => {
      control.addEventListener('input', save);
      control.addEventListener('change', save);
    });
    choices.forEach(control => {
      control.addEventListener('change', save);
      control.addEventListener('input', save);
    });

    const closeModels = () => {
      target.querySelectorAll('details[data-student-model]').forEach(details => { details.open = false; });
      target.querySelectorAll('button[aria-controls][aria-expanded="true"]').forEach(button => button.click());
    };
    const activityControls = [...target.querySelectorAll('input, select, textarea')];

    /* Synchronous reset: clears this activity's fields, its own key and its legacy
       entries, closes any model, and clears feedback before the click returns. Other
       activities are untouched. */
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

    const form = target.closest('form') || target.querySelector('form');
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
    if (!saved && (hasLegacyDraft || snapshot().text.some(value => value !== ''))) save();
    report();
  });

  /* The page-level "clear saved study status" control also clears every activity store,
     so one page reset can never leave a draft that reappears on reload. */
  const pageReset = document.getElementById('reset-book-practice');
  if (pageReset) {
    pageReset.addEventListener('click', () => {
      groups.forEach(({ id, target, controls, choices, status }) => {
        try { localStorage.removeItem(prefix + id); } catch { /* Storage is optional. */ }
        target.querySelectorAll('details[data-student-model]').forEach(details => { details.open = false; });
        controls.forEach(control => control.removeAttribute('aria-invalid'));
        choices.forEach(control => control.removeAttribute('aria-invalid'));
        if (status) status.textContent = 'This activity saves in this browser. Compare with the model, keep editing, or reset just this activity.';
      });
    });
  }
})();
