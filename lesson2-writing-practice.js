/* Writing practice for Grade 3 and Grade 4 Unit 1 Lesson 2 book pages.
   Original instructional text and the existing answer reveals remain unchanged.
   Each activity keeps its own storage key so one reset never clears another. */
(() => {
  'use strict';
  const file = location.pathname.split('/').pop();
  const supported = new Set([
    'grade3-unit1-lesson2-workbook.html',
    'grade4-unit1-lesson2-pupil-book.html',
    'grade4-unit1-lesson2-workbook.html'
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
  const addModel = (target, label, text) => {
    const details = make('details', '', { class: 'activity writing-model', 'data-student-model': '' });
    details.append(make('summary', label), make('p', text));
    target.append(details);
  };
  const groups = [];
  const group = (target, id, options = {}) => {
    if (!target) throw new Error(`Missing writing activity ${id}`);
    target.dataset.writingActivity = id;
    if (options.model) addModel(target, options.model[0], options.model[1]);
    if (options.note) target.append(make('p', options.note, { class: 'notice', 'data-writing-exception': '' }));
    const controls = [...target.querySelectorAll('input[type="text"], textarea')];
    if (!controls.length) throw new Error(`Missing writing controls ${id}`);
    const status = make('p', '', { class: 'muted', role: 'status', 'data-writing-status': '' });
    const reset = make('button', 'Reset this activity', { type: 'button', class: 'secondary', 'data-writing-reset': '' });
    target.append(status, reset);
    groups.push({ id, target, controls, status, reset });
  };

  if (file === 'grade3-unit1-lesson2-workbook.html') {
    // Exercise 4 keeps its printed-sequence reveal; Exercise 5 keeps its inferred key.
    group(byId('wb-4'), 'wb-4');
    group(byId('wb-5'), 'wb-5');
    group(byId('wb-6'), 'wb-6', {
      model: ['Show a sample answer (answers vary)', "My favourite lesson is English."]
    });
  }

  if (file === 'grade4-unit1-lesson2-pupil-book.html') {
    // Activity 3: the book prints the third sentence with a dotted line and no
    // completed version, so no model answer can be verified from the images.
    group(byId('pb-3'), 'pb-3', {
      note: 'The source prints the third sentence with a dotted line and no completed version, so no model answer can be verified from the images. Your completed sentence is practice only and is not graded.'
    });
    group(byId('pb-6'), 'pb-6', {
      model: ['Show a sample answer (answers vary)', "My friend has got long black hair and brown eyes. She is tall."]
    });
    // Exercises 8 and 9 keep their existing suggested-answer reveals.
    group(byId('pb-9'), 'pb-9');
    group(byId('pb-10'), 'pb-10');
    group(byId('pb-11'), 'pb-11', {
      model: ['Show sample sentences (answers vary)', "My mother has got blond hair. My sister has got brown eyes. My brother has got short black hair."]
    });
  }

  if (file === 'grade4-unit1-lesson2-workbook.html') {
    // Exercise 1 keeps its answers-supported-by-the-text reveal.
    group(byId('wb-1'), 'wb-1');
    // Exercise 4: the matching depends on the missing recording, so no model exists.
    group(byId('wb-4'), 'wb-4', {
      note: 'The original recording was not supplied, so the two names cannot be matched or verified from the images and no answer model is provided. Ask your teacher for the recording.'
    });
    group(byId('wb-5'), 'wb-5', {
      model: ['Show a sample description (answers vary)', "The father has got short hair. The boy has got glasses. The girl has got long hair. The mother has got brown hair."]
    });
    group(byId('wb-8'), 'wb-8', {
      model: ['Show a sample completion (answers vary)', "My name is Sami. I'm ten. I live in Lattakia. I've got one sister and two brothers. My father is a teacher. He's got brown hair and he is tall. We are a happy family."]
    });
  }

  // Per-page and per-activity storage prevents one reset from clearing another activity.
  const prefix = `efc_writing_${file.replace('.html', '')}_v1:`;
  groups.forEach(({ id, target, controls, status, reset }) => {
    const key = prefix + id;
    let available = true;
    let saved;
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { available = false; }
    if (Array.isArray(saved) && saved.length === controls.length && saved.every(value => typeof value === 'string')) {
      controls.forEach((control, index) => { control.value = saved[index]; });
    }
    const report = () => { status.textContent = available ? 'Responses are saved in this browser. Compare, edit, or reset when ready.' : 'Browser storage is unavailable; your responses may be lost when you leave or reload.'; };
    const save = () => {
      try { localStorage.setItem(key, JSON.stringify(controls.map(control => control.value))); available = true; }
      catch { available = false; }
      report();
    };
    controls.forEach(control => { control.addEventListener('input', save); control.addEventListener('change', save); });
    reset.addEventListener('click', () => {
      controls.forEach(control => { control.value = ''; });
      target.querySelectorAll('details[data-student-model]').forEach(details => { details.open = false; });
      target.querySelectorAll('button[aria-controls][aria-expanded="true"]').forEach(button => button.click());
      save();
    });
    report();
  });
})();
