/* Writing practice only for Grade 3 and Grade 4 Unit 1 Lesson 1 book pages.
   Original instructional text and the existing answer reveals remain unchanged. */
(() => {
  'use strict';
  const file = location.pathname.split('/').pop();
  const supported = new Set(['grade3-unit1-lesson1-workbook.html', 'grade4-unit1-lesson1-pupil-book.html', 'grade4-unit1-lesson1-workbook.html']);
  if (!supported.has(file)) return;
  const sections = [...document.querySelectorAll('main > section.panel')];
  const find = heading => sections.find(section => section.querySelector('h2')?.textContent.trim() === heading);
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
    const reset = make('button', 'Reset this activity', { type: 'button', 'data-writing-reset': '' });
    target.append(status, reset);
    groups.push({ id, target, controls, status, reset });
  };

  if (file === 'grade3-unit1-lesson1-workbook.html') {
    const fixed = find('Read and write');
    const entry = make('div', '', { class: 'activity' });
    ['Maya … a little sister.', 'I … two brothers.', 'He … a car.', 'We … a nice flat.'].forEach((text, index) => {
      const label = make('label', `${text} `);
      label.append(make('input', '', { type: 'text', class: 'blank', 'aria-label': `Exercise 4, item ${index + 1}: ${text}` }));
      const p = make('p', ''); p.append(label); entry.append(p);
    });
    fixed.append(entry);
    group(fixed, 'wb4');
    group(find('Write about you'), 'wb5', { model: ['Show sample response (answers vary)', "My name's John. I live in a flat. I live with my parents. I'm ten years old. I've got a little brother."] });
  }

  if (file === 'grade4-unit1-lesson1-pupil-book.html') {
    const audio = 'The original recording was not supplied, so the listening order cannot be verified and no answer model is provided. Ask your teacher for the recording.';
    group(find('Exercise 1 · Listen and number'), 'pb1', { note: audio });
    group(find('Exercise 2 · Listen again and order'), 'pb2', { note: audio });
    group(find('Exercise 5 · Before you read'), 'pb5', { model: ['Show sample responses (answers vary)', "a. I'm from Lebanon. b. Lebanon and Syria are Arab countries."] });
    const six = find('Exercise 6 · Read and do the tasks');
    group(six.querySelector('h3:last-of-type + .activity'), 'pb6b');
    group(find('Exercise 7 · Fill in am / is / are'), 'pb7');
    group(find('Exercise 8 · Reorder'), 'pb8');
    group(find('Exercise 9 · Write about yourself'), 'pb9', { model: ['Show sample response (answers vary)', "Hello, my name's Ahmed. I'm from Lebanon. I am ten years old. I am in grade 4. My father is a doctor."] });
  }

  if (file === 'grade4-unit1-lesson1-workbook.html') {
    const one = find('Exercise 1 · Fill in the spaces');
    const labels = ['Hi, I am blank', 'Nice to blank you', 'How are you blank', 'I am blank, thank you', 'What is your blank', 'Blank name is Allan', 'How blank are you'];
    one.querySelectorAll('input[type="text"]').forEach((el, index) => el.setAttribute('aria-label', labels[index]));
    group(one, 'wb1');
    group(find('Exercise 3 · Order these sentences'), 'wb3');
    group(find('Exercise 4 · Write the word under the number'), 'wb4');
    group(find('Exercise 5 · Listen and write the number'), 'wb5', { note: 'The original recording was not supplied, so these numbers cannot be verified and no answer model is provided. Ask your teacher for the recording.' });
    group(find('Exercise 6 · Order these words'), 'wb6');
    group(find('Exercise 7 · Fill in am / is / are'), 'wb7');
    const eight = find('Exercise 8 · Write the correct form');
    const link = make('a', 'View original Workbook page 7', { href: 'assets/grade4-unit1-lesson1/source/workbook-page-7.png', target: '_blank', rel: 'noopener' });
    const source = make('p', ''); source.append(link); eight.append(source);
    group(eight, 'wb8', { model: ['Show partial example (picture cues may vary)', 'She is Tala. He is Tom. It is my bag.'], note: 'The remaining picture cues do not establish a unique pronoun with confidence. This example is incomplete; discuss the remaining responses with your teacher.' });
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
