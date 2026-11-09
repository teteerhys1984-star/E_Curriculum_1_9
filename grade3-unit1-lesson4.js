/* My Five Senses — lesson-local practice and independent assessment.
   Shared scripts own navigation and reveal accessibility. No pupil work is sent anywhere. */
(() => {
  'use strict';
  const main = document.querySelector('main.wrap');
  if (!main) return;
  const page = document.body.dataset.navPage || 'page';
  const practiceKey = 'efc_grade3_unit1_lesson4_practice_v1:' + page;
  const testKey = 'efc_grade3_unit1_lesson4_test_v1';
  const normalize = value => String(value || '').toLowerCase()
    .replace(/[\u2018\u2019`]/g, "'").trim().replace(/\s+/g, ' ')
    .replace(/\s+([?.!,])/g, '$1').replace(/[.?!]+$/, '').trim();
  const readStore = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  };
  let storageAvailable = true;
  const writeStore = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); storageAvailable = true; }
    catch { storageAvailable = false; }
  };
  const removeStore = key => { try { localStorage.removeItem(key); } catch { /* optional storage */ } };

  /* Practice controls: saved entries never contain a correct-answer marker. */
  const practice = readStore(practiceKey);
  if (!practice.fields || typeof practice.fields !== 'object') practice.fields = {};
  const controls = Array.from(main.querySelectorAll('input[name], select[name], textarea[name]'))
    .filter(el => !el.closest('#quiz') && el.type !== 'password');
  const savePractice = () => writeStore(practiceKey, practice);
  controls.forEach(el => {
    const saved = practice.fields[el.name];
    if (el.type === 'checkbox') el.checked = saved === true;
    else if (el.type === 'radio') el.checked = saved === el.value;
    else if (typeof saved === 'string') el.value = saved;
    const record = () => {
      if (el.type === 'checkbox') practice.fields[el.name] = el.checked;
      else if (el.type !== 'radio' || el.checked) practice.fields[el.name] = el.value;
      savePractice();
      el.removeAttribute('aria-invalid');
      const form = el.closest('form');
      const feedback = form?.querySelector('.practice-feedback');
      if (feedback) feedback.textContent = el.closest('[data-audio-only]')
        ? 'Your choice is saved as practice only. The unavailable recording is needed to check it.'
        : form.dataset.practice ? 'Work saved. Choose the check button when you are ready.'
        : 'Personal practice saved in this browser; there is no single correct answer.';
    };
    el.addEventListener('input', record);
    el.addEventListener('change', record);
  });

  const textKeys = {
    'pb-senses': { 'pb2-ear': ['hear'], 'pb2-mouth': ['taste'], 'pb2-eye': ['see'], 'pb2-nose': ['smell'], 'pb2-hand': ['touch'] },
    'pb-numbers': { 'pb3-10': ['ten', '10'], 'pb3-20': ['twenty', '20'], 'pb3-30': ['thirty', '30'], 'pb3-40': ['forty', '40'], 'pb3-50': ['fifty', '50'] },
    'pb-oa': { 'pb6-coat': ['oa'], 'pb6-goat': ['oa'] },
    'wb-words': { 'wb1-1': ['nose'], 'wb1-2': ['eye'], 'wb1-3': ['ear'], 'wb1-4': ['mouth'], 'wb1-5': ['hand'] },
    'wb-fill': { 'wb2-1': ['hear'], 'wb2-2': ['see'], 'wb2-3': ['touch'], 'wb2-4': ['taste'], 'wb2-5': ['smell'] },
    'wb-numbers': {
      'wb5-r1c3': ['33', 'thirty-three'], 'wb5-r1c4': ['34', 'thirty-four'], 'wb5-r1c6': ['36', 'thirty-six'],
      'wb5-r2c2': ['38', 'thirty-eight'], 'wb5-r2c3': ['39', 'thirty-nine'], 'wb5-r2c5': ['41', 'forty-one'], 'wb5-r2c6': ['42', 'forty-two'],
      'wb5-r3c3': ['45', 'forty-five'], 'wb5-r3c5': ['47', 'forty-seven']
    },
    'wb-look': {
      'wb6-2': ['i can smell a rose', 'i can smell the rose', 'i can smell a flower'],
      'wb6-3': ['i can taste an orange', 'i can taste the orange', 'i can taste an apple'],
      'wb6-4': ['i can touch a rabbit', 'i can touch the rabbit', 'i can touch a cat']
    }
  };
  const radioKeys = {
    'wb-circle': { 'wb3-1': 'taste', 'wb3-2': 'smell', 'wb3-3': 'hear', 'wb3-4': 'see' }
  };
  function practiceSlots(form) {
    const slots = [];
    const seen = new Set();
    form.querySelectorAll('input[name], select[name]').forEach(el => {
      if (el.type === 'checkbox') return;
      if (el.type === 'radio') {
        if (seen.has(el.name)) return;
        seen.add(el.name);
        const inputs = Array.from(form.querySelectorAll('input[type="radio"][name="' + el.name + '"]'));
        slots.push({ inputs, group: true });
        return;
      }
      slots.push({ inputs: [el], group: false });
    });
    return slots;
  }
  function evaluatePractice(form) {
    const expected = textKeys[form.dataset.practice] || {};
    const groups = radioKeys[form.dataset.practice] || {};
    return practiceSlots(form).map(slot => {
      if (slot.group) {
        const name = slot.inputs[0].name;
        const checked = slot.inputs.find(input => input.checked);
        const allowed = [].concat(groups[name] || expected[name] || []).map(normalize);
        return Boolean(checked) && allowed.includes(normalize(checked.value));
      }
      const el = slot.inputs[0];
      const value = normalize(el.value);
      return value.length > 0 && (expected[el.name] || []).some(answer => normalize(answer) === value);
    });
  }
  main.querySelectorAll('form[data-practice]').forEach(form => {
    form.addEventListener('submit', event => event.preventDefault());
    form.querySelector('.check-practice')?.addEventListener('click', () => {
      const slots = practiceSlots(form);
      const results = evaluatePractice(form);
      slots.forEach((slot, i) => slot.inputs.forEach(input => input.setAttribute('aria-invalid', String(!results[i]))));
      const correct = results.filter(Boolean).length;
      const feedback = form.querySelector('.practice-feedback');
      feedback.className = 'feedback practice-feedback ' + (correct === results.length ? 'correct' : 'unanswered');
      feedback.textContent = correct === results.length
        ? '✓ All ' + results.length + ' responses are correct. Well done!'
        : correct + ' of ' + results.length + ' responses are correct. Review the marked fields and try again, or open the answer guidance when ready.';
    });
  });
  main.querySelectorAll('form.practice-form').forEach(form => {
    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        form.querySelectorAll('input[name], select[name], textarea[name]').forEach(el => {
          delete practice.fields[el.name];
          el.removeAttribute('aria-invalid');
        });
        const feedback = form.querySelector('.practice-feedback');
        if (feedback) { feedback.textContent = ''; feedback.className = 'feedback practice-feedback'; }
        savePractice();
      }, 0);
    });
  });

  /* Drawing is an actual pupil response (the project flower and the Lesson 4 picture),
     not a generated illustration. Same interaction contract as Lesson 3. */
  document.querySelectorAll('canvas.drawing-canvas').forEach(canvas => {
    const form = canvas.closest('form');
    const ctx = canvas.getContext('2d');
    const status = form.querySelector('[id$="drawing-status"]');
    const practiceFor = () => practice;
    let strokes = Array.isArray(practiceFor().drawing) ? practiceFor().drawing.filter(stroke =>
      stroke && typeof stroke.color === 'string' && /^#[0-9a-f]{6}$/i.test(stroke.color) &&
      Number.isFinite(stroke.width) && Array.isArray(stroke.points) &&
      stroke.points.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
    ) : [];
    let color = '#0f2137';
    let active = null;
    let pointerId = null;
    let keyboardDrawing = false;
    let cursor = [480, 240];
    const paintStroke = stroke => {
      if (!stroke.points.length) return;
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const [x, y] = stroke.points[0];
      ctx.beginPath(); ctx.arc(x, y, stroke.width / 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y);
      stroke.points.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.stroke();
    };
    const redraw = () => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      strokes.forEach(paintStroke);
    };
    const saveDrawing = () => { practiceFor().drawing = strokes; savePractice(); };
    const begin = point => { active = { color, width: color === '#ffffff' ? 30 : 5, points: [point] }; strokes.push(active); redraw(); };
    const extend = point => { if (active) { active.points.push(point); redraw(); } };
    const finish = () => { if (active) { active = null; saveDrawing(); } };
    const pointOf = event => {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
    };
    const clearDrawing = () => { strokes = []; active = null; keyboardDrawing = false; redraw(); saveDrawing(); if (status) status.textContent = 'Drawing cleared. Keyboard drawing is off.'; };
    redraw();
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointerId !== null) return;
      event.preventDefault(); canvas.focus({ preventScroll: true });
      pointerId = event.pointerId; canvas.setPointerCapture(pointerId);
      cursor = pointOf(event); begin(cursor);
    });
    canvas.addEventListener('pointermove', event => { if (event.pointerId !== pointerId) return; cursor = pointOf(event); extend(cursor); });
    const endPointer = event => {
      if (event.pointerId !== pointerId) return;
      pointerId = null; finish();
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('keydown', event => {
      if (event.code === 'Space') {
        event.preventDefault(); keyboardDrawing = !keyboardDrawing;
        if (keyboardDrawing) begin(cursor); else finish();
        if (status) status.textContent = 'Keyboard drawing is ' + (keyboardDrawing ? 'on' : 'off') + '. Pen position: ' + Math.round(cursor[0]) + ', ' + Math.round(cursor[1]) + '.';
        return;
      }
      if (event.key === 'Escape') { keyboardDrawing = false; finish(); if (status) status.textContent = 'Keyboard drawing is off.'; return; }
      const movement = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
      if (!movement) return;
      event.preventDefault();
      cursor = [Math.max(0, Math.min(canvas.width, cursor[0] + movement[0])), Math.max(0, Math.min(canvas.height, cursor[1] + movement[1]))];
      extend(cursor);
      if (status) status.textContent = 'Pen position: ' + Math.round(cursor[0]) + ', ' + Math.round(cursor[1]) + '. Drawing ' + (keyboardDrawing ? 'on' : 'off') + '.';
    });
    canvas.addEventListener('blur', () => { keyboardDrawing = false; finish(); });
    form.querySelectorAll('[data-draw-color]').forEach(button => button.addEventListener('click', () => {
      finish(); color = button.dataset.drawColor;
      form.querySelectorAll('[data-draw-color], [id$="draw-eraser"]').forEach(tool => tool.setAttribute('aria-pressed', String(tool === button)));
      if (status) status.textContent = button.textContent + ' selected.';
    }));
    const eraser = form.querySelector('[id$="draw-eraser"]');
    if (eraser) eraser.addEventListener('click', () => {
      finish(); color = '#ffffff';
      form.querySelectorAll('[data-draw-color], [id$="draw-eraser"]').forEach(tool => tool.setAttribute('aria-pressed', String(tool === eraser)));
      if (status) status.textContent = 'Eraser selected.';
    });
    const undo = form.querySelector('[id$="draw-undo"]');
    if (undo) undo.addEventListener('click', () => { finish(); strokes.pop(); redraw(); saveDrawing(); if (status) status.textContent = 'Last stroke undone.'; });
    const clear = form.querySelector('[id$="draw-clear"]');
    if (clear) clear.addEventListener('click', clearDrawing);
    const download = form.querySelector('[id$="draw-download"]');
    if (download) download.addEventListener('click', () => {
      finish();
      const link = document.createElement('a');
      link.download = canvas.dataset.download || 'my-drawing.png'; link.href = canvas.toDataURL('image/png'); link.click();
      if (status) status.textContent = 'Your drawing is ready to download.';
    });
    form.addEventListener('reset', () => setTimeout(clearDrawing, 0));
  });

  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const questions = Array.from(quiz.querySelectorAll('.question'));
  const score = document.getElementById('score');
  const guide = document.getElementById('answer-guide');
  const password = document.getElementById('teacher-password');
  const unlock = document.getElementById('unlock-solutions');
  const lock = document.getElementById('lock-solutions');
  const gateFeedback = document.getElementById('gate-feedback');
  const savedTest = readStore(testKey);
  let state = {
    answers: savedTest.answers && typeof savedTest.answers === 'object' && !Array.isArray(savedTest.answers) ? { ...savedTest.answers } : {},
    submitted: savedTest.submitted === true
  };
  const persist = () => writeStore(testKey, state);
  const isWritten = question => question.dataset.format === 'short-answer';
  const answerOf = question => isWritten(question)
    ? question.querySelector('input[type="text"]').value
    : question.querySelector('input[type="radio"]:checked')?.value || '';
  const correctLabel = question => isWritten(question) ? question.dataset.correct
    : question.querySelector('input[value="' + question.dataset.correct + '"]')?.parentElement.textContent.trim() || '';
  const evaluate = question => {
    const answer = answerOf(question);
    if (!String(answer).trim()) return { answered: false, correct: false };
    const accepted = isWritten(question)
      ? (question.dataset.accepted || question.dataset.correct).split('|').map(normalize)
      : [question.dataset.correct];
    return { answered: true, correct: accepted.includes(normalize(answer)) };
  };
  const clearScore = () => score.replaceChildren();
  function closeKey(message = '') {
    guide.hidden = true; guide.classList.remove('show');
    lock.hidden = true; unlock.setAttribute('aria-expanded', 'false');
    password.value = ''; gateFeedback.textContent = message;
  }
  function checkAnswers(focus = true) {
    let correctCount = 0;
    let answeredCount = 0;
    questions.forEach(question => {
      const result = evaluate(question);
      const feedback = question.querySelector('.feedback');
      feedback.className = 'feedback';
      if (!result.answered) {
        feedback.classList.add('unanswered');
        feedback.textContent = 'No answer yet. This question does not count as correct.';
        return;
      }
      answeredCount++;
      const explanation = question.dataset.objectiveLabel + '. ' + question.dataset.evidence;
      if (result.correct) {
        correctCount++; feedback.classList.add('correct');
        feedback.textContent = '✓ Correct. ' + explanation;
      } else {
        feedback.classList.add('incorrect');
        feedback.textContent = '✗ Not correct. The answer is: ' + correctLabel(question) + '. ' + explanation;
      }
    });
    const summary = document.createElement('strong');
    summary.textContent = 'Score: ' + correctCount + ' / ' + questions.length;
    const detail = document.createElement('p');
    detail.textContent = 'Answered: ' + answeredCount + ' / ' + questions.length + ' · Unanswered: ' + (questions.length - answeredCount) + '.';
    const note = document.createElement('p');
    note.textContent = storageAvailable
      ? 'Your attempt is saved in this browser until you reset the test. Review feedback using the question index.'
      : 'Browser storage is unavailable. Your answers work on this page but cannot be saved after leaving it.';
    score.replaceChildren(summary, detail, note);
    state.submitted = true; persist();
    if (focus) { score.focus({ preventScroll: true }); score.scrollIntoView({ behavior: 'auto', block: 'nearest' }); }
  }
  questions.forEach(question => {
    const value = state.answers[question.id];
    if (typeof value === 'string') {
      if (isWritten(question)) question.querySelector('input[type="text"]').value = value;
      else question.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = input.value === value; });
    }
    // The teacher key is built from the published item metadata on every load,
    // independently of whether the pupil has saved any answers yet.
    const item = document.createElement('li');
    const answer = document.createElement('strong'); answer.textContent = correctLabel(question);
    const objective = document.createElement('p'); objective.className = 'source-note'; objective.textContent = question.dataset.objectiveLabel;
    const explanation = document.createElement('p'); explanation.textContent = question.dataset.evidence;
    item.append(answer, objective, explanation); document.getElementById('teacher-key').appendChild(item);
  });
  if (state.submitted) checkAnswers(false);
  document.getElementById('check-answers').addEventListener('click', () => checkAnswers());
  quiz.addEventListener('submit', event => { event.preventDefault(); checkAnswers(); });
  const recordAnswer = target => {
    if (!target.matches('input[type="text"], input[type="radio"]')) return;
    const question = target.closest('.question');
    if (!question) return;
    const value = answerOf(question);
    if (String(value).trim()) state.answers[question.id] = value;
    else delete state.answers[question.id];
    state.submitted = false; persist(); clearScore();
    const feedback = question.querySelector('.feedback');
    feedback.className = 'feedback';
    feedback.textContent = 'Answer changed. Choose “Check my answers” to update your score.';
  };
  quiz.addEventListener('input', event => { if (event.target.type === 'text') recordAnswer(event.target); });
  quiz.addEventListener('change', event => { if (event.target.type === 'radio') recordAnswer(event.target); });
  quiz.addEventListener('reset', () => {
    state = { answers: {}, submitted: false }; removeStore(testKey);
    quiz.querySelectorAll('input[type="text"]').forEach(input => { input.value = ''; });
    quiz.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; });
    questions.forEach(question => { const feedback = question.querySelector('.feedback'); feedback.textContent = ''; feedback.className = 'feedback'; });
    clearScore(); closeKey('The test was reset and the answer key was closed.');
  });
  // Existing project display gate, explicitly NOT a security boundary.
  const expectedPassword = String.fromCharCode(115, 111, 109, 101, 114, 49, 55, 51);
  const tryUnlock = () => {
    if (password.value !== expectedPassword) {
      closeKey(password.value ? 'Incorrect password. Please try again.' : 'Enter the password first.');
      return;
    }
    guide.hidden = false; guide.classList.add('show'); lock.hidden = false;
    unlock.setAttribute('aria-expanded', 'true');
    gateFeedback.textContent = 'The answer key is open. This is not secure server-side authentication.';
  };
  unlock.addEventListener('click', tryUnlock);
  password.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); tryUnlock(); } });
  lock.addEventListener('click', () => { closeKey('The answer key is hidden.'); unlock.focus(); });
  if (location.hash === '#teacher-gate') {
    window.addEventListener('load', () => document.getElementById('teacher-gate').scrollIntoView({ block: 'start' }), { once: true });
  }
})();
