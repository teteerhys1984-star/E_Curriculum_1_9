/* My Lovely School — lesson-local practice, drawing and independent assessment.
   Shared scripts own navigation and reveal accessibility. No pupil work is sent anywhere. */
(() => {
  'use strict';
  const main = document.querySelector('main.wrap');
  if (!main) return;
  const page = document.body.dataset.navPage || 'page';
  const practiceKey = 'efc_grade3_unit1_lesson3_practice_v1:' + page;
  const testKey = 'efc_grade3_unit1_lesson3_test_v1';
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
      if (feedback) feedback.textContent = el.closest('#wb-listen')
        ? 'Listening selections saved as practice only. The unavailable audio is needed to check them.'
        : form.dataset.practice ? 'Work saved. Choose the check button when you are ready.'
        : 'Personal practice saved in this browser; there is no single correct answer.';
    };
    el.addEventListener('input', record);
    el.addEventListener('change', record);
  });

  const keys = {
    'pb-match': { 'pb-match-1': ['c'], 'pb-match-2': ['b'], 'pb-match-3': ['a'] },
    'wb-words': { 'wb1-1a': ['read'], 'wb1-1b': ['library'], 'wb1-2a': ['laboratory', 'lab'], 'wb1-3a': ['draw'], 'wb1-3b': ['art room'] },
    'wb-look': { 'wb3-blank-2': ['on the left of', 'to the left of'], 'wb3-blank-3': ['classroom'], 'wb3-blank-4': ['twelve', '12'] },
    'wb-order': { 'wb5-order-1': ['2'], 'wb5-order-2': ['3'], 'wb5-order-3': ['5'], 'wb5-order-4': ['4'] }
  };
  const sortGroups = {
    school: ['classroom', 'laboratory', 'playground'],
    house: ['living room', 'bedroom', 'kitchen']
  };
  function evaluatePractice(form) {
    const fields = Array.from(form.querySelectorAll('input[name], select[name]'));
    if (form.dataset.practice === 'wb-sort') {
      const values = fields.map(el => normalize(el.value));
      return fields.map(el => {
        const value = normalize(el.value);
        const category = el.name.startsWith('wb6-school') ? 'school' : 'house';
        return value.length > 0 && sortGroups[category].includes(value) && values.filter(v => v === value).length === 1;
      });
    }
    const expected = keys[form.dataset.practice] || {};
    return fields.map(el => {
      const value = normalize(el.value);
      return value.length > 0 && (expected[el.name] || []).some(answer => normalize(answer) === value);
    });
  }
  main.querySelectorAll('form[data-practice]').forEach(form => {
    form.addEventListener('submit', event => event.preventDefault());
    form.querySelector('.check-practice')?.addEventListener('click', () => {
      const results = evaluatePractice(form);
      const fields = Array.from(form.querySelectorAll('input[name], select[name]'));
      fields.forEach((el, i) => el.setAttribute('aria-invalid', String(!results[i])));
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
        if (form.id === 'wb-draw') clearDrawing();
        savePractice();
      }, 0);
    });
  });

  /* Drawing is an actual student response, not a generated picture of a room. */
  const canvas = document.getElementById('room-canvas');
  let clearDrawing = () => {};
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const status = document.getElementById('drawing-status');
    let strokes = Array.isArray(practice.drawing) ? practice.drawing.filter(stroke =>
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
    const saveDrawing = () => { practice.drawing = strokes; savePractice(); };
    const begin = point => {
      active = { color, width: color === '#ffffff' ? 30 : 5, points: [point] };
      strokes.push(active); redraw();
    };
    const extend = point => { if (active) { active.points.push(point); redraw(); } };
    const finish = () => { if (active) { active = null; saveDrawing(); } };
    const pointOf = event => {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
    };
    clearDrawing = () => { strokes = []; active = null; keyboardDrawing = false; redraw(); saveDrawing(); status.textContent = 'Drawing cleared. Keyboard drawing is off.'; };
    redraw();
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointerId !== null) return;
      event.preventDefault(); canvas.focus({ preventScroll: true });
      pointerId = event.pointerId; canvas.setPointerCapture(pointerId);
      cursor = pointOf(event); begin(cursor);
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      cursor = pointOf(event); extend(cursor);
    });
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
        status.textContent = 'Keyboard drawing is ' + (keyboardDrawing ? 'on' : 'off') + '. Pen position: ' + Math.round(cursor[0]) + ', ' + Math.round(cursor[1]) + '.';
        return;
      }
      if (event.key === 'Escape') { keyboardDrawing = false; finish(); status.textContent = 'Keyboard drawing is off.'; return; }
      const movement = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
      if (!movement) return;
      event.preventDefault();
      const step = event.shiftKey ? 0.2 : 1;
      cursor = [Math.max(0, Math.min(canvas.width, cursor[0] + movement[0] * step)), Math.max(0, Math.min(canvas.height, cursor[1] + movement[1] * step))];
      extend(cursor);
      status.textContent = 'Pen position: ' + Math.round(cursor[0]) + ', ' + Math.round(cursor[1]) + '. Drawing ' + (keyboardDrawing ? 'on' : 'off') + '.';
    });
    canvas.addEventListener('blur', () => { keyboardDrawing = false; finish(); });
    document.querySelectorAll('[data-draw-color]').forEach(button => button.addEventListener('click', () => {
      finish(); color = button.dataset.drawColor;
      document.querySelectorAll('[data-draw-color], #draw-eraser').forEach(tool => tool.setAttribute('aria-pressed', String(tool === button)));
      status.textContent = button.textContent + ' selected.';
    }));
    document.getElementById('draw-eraser').addEventListener('click', () => {
      finish(); color = '#ffffff';
      document.querySelectorAll('[data-draw-color], #draw-eraser').forEach(tool => tool.setAttribute('aria-pressed', String(tool.id === 'draw-eraser')));
      status.textContent = 'Eraser selected.';
    });
    document.getElementById('draw-undo').addEventListener('click', () => { finish(); strokes.pop(); redraw(); saveDrawing(); status.textContent = 'Last stroke undone.'; });
    document.getElementById('draw-clear').addEventListener('click', clearDrawing);
    document.getElementById('draw-download').addEventListener('click', () => {
      finish();
      const link = document.createElement('a');
      link.download = 'my-favourite-room.png'; link.href = canvas.toDataURL('image/png'); link.click();
      status.textContent = 'Your drawing is ready to download.';
    });
  }

  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const questions = Array.from(quiz.querySelectorAll('.question'));
  const score = document.getElementById('score');
  const guide = document.getElementById('answer-guide');
  const password = document.getElementById('teacher-password');
  const unlock = document.getElementById('unlock-solutions');
  const lock = document.getElementById('lock-solutions');
  const gateFeedback = document.getElementById('gate-feedback');
  const saved = readStore(testKey);
  let state = {
    answers: saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers) ? { ...saved.answers } : {},
    submitted: saved.submitted === true
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
