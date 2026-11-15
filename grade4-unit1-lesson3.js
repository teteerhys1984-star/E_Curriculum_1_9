/* Grade 4 · Unit 1 · Lesson 3: local practice drafts, independent quiz scoring and teacher-key reveal. */
(() => {
  'use strict';
  const lessonKey = 'efc_grade4_unit1_lesson3';
  const main = document.querySelector('main.wrap');
  if (!main) return;

  const readStore = key => {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch { return null; }
  };
  const writeStore = (key, value) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };
  const removeStore = key => { try { window.localStorage.removeItem(key); } catch { /* Storage is optional. */ } };

  // Book and Workbook fields are page-local drafts. No answer key is stored with them.
  const practiceForms = Array.from(main.querySelectorAll('form.practice-form:not(#quiz)'));
  const practiceKey = `${lessonKey}:practice:${location.pathname}`;
  const practiceFields = () => practiceForms.flatMap(form => Array.from(form.querySelectorAll('input, select, textarea')));
  const clockInputs = Array.from(main.querySelectorAll('#pb-draw-write input[type="time"]'));
  let suppressPracticeSave = false;

  function updateDrawnClock(input) {
    const item = input.closest('.l3-clock-item');
    const svg = item?.querySelector('.l3-clock-face');
    const hourHand = svg?.querySelector('[data-hour-hand]');
    const minuteHand = svg?.querySelector('[data-minute-hand]');
    const output = item?.querySelector('output');
    if (!svg || !hourHand || !minuteHand) return;
    if (!input.value || !/^\d{2}:\d{2}$/.test(input.value)) {
      svg.classList.remove('has-time');
      svg.setAttribute('aria-label', `Blank clock preview for item ${clockInputs.indexOf(input) + 1}`);
      hourHand.removeAttribute('transform');
      minuteHand.removeAttribute('transform');
      if (output) output.textContent = 'Choose a time; the clock is blank.';
      return;
    }
    const [hours, minutes] = input.value.split(':').map(Number);
    const hour = hours % 12;
    const hourDegrees = hour * 30 + minutes * 0.5;
    const minuteDegrees = minutes * 6;
    hourHand.setAttribute('transform', `rotate(${hourDegrees} 80 80)`);
    minuteHand.setAttribute('transform', `rotate(${minuteDegrees} 80 80)`);
    svg.classList.add('has-time');
    const displayHour = hour || 12;
    const displayTime = `${displayHour}:${String(minutes).padStart(2, '0')}`;
    svg.setAttribute('aria-label', `Clock showing ${displayTime}`);
    if (output) output.textContent = `Clock hands drawn for ${displayTime}.`;
  }
  function savePractice() {
    if (suppressPracticeSave) return;
    const values = {};
    for (const field of practiceFields()) {
      if (!field.id) continue;
      values[field.id] = field.type === 'radio' || field.type === 'checkbox'
        ? { kind: field.type, checked: field.checked, value: field.value }
        : { kind: 'value', value: field.value };
    }
    const saved = writeStore(practiceKey, values);
    const status = document.querySelector('[data-practice-save-status]');
    if (status) status.textContent = saved ? 'Practice is saved in this browser.' : 'This browser could not save practice answers.';
  }
  function restorePractice() {
    const saved = readStore(practiceKey);
    if (!saved) return;
    for (const field of practiceFields()) {
      const entry = field.id ? saved[field.id] : null;
      if (!entry) continue;
      if (field.type === 'radio' || field.type === 'checkbox') field.checked = entry.checked === true;
      else if (typeof entry.value === 'string') field.value = entry.value;
    }
    const status = document.querySelector('[data-practice-save-status]');
    if (status) status.textContent = 'Your saved practice answers were restored.';
  }
  restorePractice();
  clockInputs.forEach(updateDrawnClock);
  for (const input of clockInputs) {
    input.addEventListener('input', () => updateDrawnClock(input));
    input.addEventListener('change', () => updateDrawnClock(input));
  }
  for (const field of practiceFields()) {
    field.addEventListener('input', savePractice);
    field.addEventListener('change', savePractice);
  }
  for (const form of practiceForms) {
    form.addEventListener('reset', () => {
      if (!suppressPracticeSave) window.setTimeout(() => {
        clockInputs.filter(input => form.contains(input)).forEach(updateDrawnClock);
        savePractice();
      }, 0);
    });
  }

  function closePracticeReveals() {
    for (const button of main.querySelectorAll('button.reveal, button[data-reveal], button[data-answer], button[data-a]')) {
      const id = button.getAttribute('aria-controls') || button.dataset.reveal || button.dataset.answer || button.dataset.a;
      const panel = id ? document.getElementById(id) : null;
      if (panel) panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (button.dataset.show) button.textContent = button.dataset.show;
    }
  }
  const resetPracticeButton = document.getElementById('reset-book-practice');
  if (resetPracticeButton) {
    resetPracticeButton.addEventListener('click', () => {
      suppressPracticeSave = true;
      practiceForms.forEach(form => form.reset());
      clockInputs.forEach(updateDrawnClock);
      closePracticeReveals();
      removeStore(practiceKey);
      suppressPracticeSave = false;
      const status = document.querySelector('[data-practice-save-status]');
      if (status) status.textContent = 'Practice answers cleared.';
    });
  }

  // The independent test supports radio and short written responses.
  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const questions = Array.from(quiz.querySelectorAll('.question'));
  const score = document.getElementById('score');
  const testKey = `${lessonKey}:test`;
  const guide = document.getElementById('answer-guide');
  const teacherList = document.getElementById('teacher-key');
  const password = document.getElementById('teacher-password');
  const gateFeedback = document.getElementById('gate-feedback');
  const unlock = document.getElementById('unlock-solutions');
  const lock = document.getElementById('lock-solutions');
  let state = { answers: {}, submitted: false };

  const normalizeAnswer = value => String(value || '').normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[’‘]/g, "'").replace(/[.!?]/g, '').replace(/\s+/g, ' ').trim();
  const textResponse = question => question.querySelector('input[type="text"], textarea');
  function optionLabel(question, value) {
    const input = Array.from(question.querySelectorAll('input[type="radio"]')).find(item => item.value === String(value));
    return input?.closest('label')?.querySelector('.en')?.textContent.trim() || input?.closest('label')?.textContent.trim() || '';
  }
  function correctLabel(question) {
    if (question.dataset.correctLabel) return question.dataset.correctLabel;
    if (question.dataset.format === 'short-answer' || question.dataset.format === 'sentence-construction') return question.dataset.correct;
    return optionLabel(question, question.dataset.correct);
  }
  function responseFor(question) {
    const selected = question.querySelector('input[type="radio"]:checked');
    if (selected) return { value: selected.value, answered: true, input: selected };
    const field = textResponse(question);
    const value = field ? field.value.trim() : '';
    return { value, answered: Boolean(value), input: field };
  }
  function isCorrect(question, response) {
    if (!response.answered) return false;
    if (question.dataset.format === 'short-answer' || question.dataset.format === 'sentence-construction') {
      const accepted = (question.dataset.accepted || question.dataset.correct || '').split('|').map(normalizeAnswer);
      return accepted.includes(normalizeAnswer(response.value));
    }
    return response.value === question.dataset.correct;
  }
  function populateTeacherKey() {
    if (!teacherList) return;
    teacherList.replaceChildren();
    questions.forEach((question, index) => {
      const item = document.createElement('li');
      item.dir = 'ltr';
      const answer = document.createElement('strong');
      answer.textContent = `${index + 1}. ${correctLabel(question)}`;
      const objective = document.createElement('p');
      objective.textContent = question.dataset.objectiveLabel || 'Lesson objective';
      const evidence = document.createElement('p');
      evidence.textContent = question.dataset.evidence || '';
      item.append(answer, objective, evidence);
      teacherList.appendChild(item);
    });
  }
  populateTeacherKey();

  function persistAttempt() {
    const saved = writeStore(testKey, state);
    const status = document.getElementById('test-save-status');
    if (status) status.textContent = saved
      ? 'This test attempt is saved in this browser until you reset it.'
      : 'This browser could not save the test attempt.';
  }
  function clearFeedback() {
    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      if (feedback) { feedback.textContent = ''; feedback.className = 'feedback'; }
    });
    if (score) score.replaceChildren();
  }
  function checkAnswers({ focusScore = true, persist = true } = {}) {
    let correctCount = 0;
    let answeredCount = 0;
    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      const response = responseFor(question);
      feedback.className = 'feedback';
      if (!response.answered) {
        feedback.textContent = 'Not answered yet. This question does not count as correct.';
        feedback.classList.add('unanswered');
        return;
      }
      answeredCount++;
      if (isCorrect(question, response)) {
        correctCount++;
        feedback.textContent = 'Correct. ' + (question.dataset.evidence || '');
        feedback.classList.add('correct');
      } else {
        feedback.textContent = 'Not correct. The expected answer is ' + correctLabel(question) + '. ' + (question.dataset.evidence || '');
        feedback.classList.add('incorrect');
      }
    });
    if (score) {
      const total = document.createElement('strong');
      total.textContent = `Score: ${correctCount} / ${questions.length}`;
      const detail = document.createElement('p');
      detail.textContent = `Answered: ${answeredCount} / ${questions.length}. Unanswered questions do not count as correct.`;
      const retry = document.createElement('p');
      retry.textContent = 'Your submitted attempt is saved in this browser. Reset the test to clear it and try again.';
      score.replaceChildren(total, detail, retry);
      if (focusScore) {
        score.focus({ preventScroll: true });
        score.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
    }
    state.submitted = true;
    if (persist) persistAttempt();
  }

  function lockKey(message = '') {
    if (guide) guide.hidden = true;
    if (lock) lock.hidden = true;
    if (unlock) unlock.hidden = false;
    if (password) password.value = '';
    if (gateFeedback) gateFeedback.textContent = message;
    if (unlock) unlock.setAttribute('aria-expanded', 'false');
    if (lock) lock.setAttribute('aria-expanded', 'false');
  }
  function unlockKey() {
    const expected = String.fromCharCode(115, 111, 109, 101, 114, 49, 55, 51);
    if (password && password.value === expected) {
      guide.hidden = false;
      unlock.hidden = true;
      lock.hidden = false;
      gateFeedback.textContent = 'The teacher key is open. This local reveal is not secure authentication.';
      unlock.setAttribute('aria-expanded', 'true');
      lock.setAttribute('aria-expanded', 'true');
    } else {
      lockKey(password?.value ? 'Incorrect password. Please try again.' : 'Enter the teacher password first.');
    }
  }
  if (unlock) unlock.addEventListener('click', unlockKey);
  if (password) password.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); unlockKey(); }
  });
  if (lock) lock.addEventListener('click', () => { lockKey('The teacher key is hidden.'); if (unlock) unlock.focus(); });

  const saved = readStore(testKey);
  if (saved && saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers)) {
    state = { answers: { ...saved.answers }, submitted: saved.submitted === true };
    for (const question of questions) {
      const value = state.answers[question.id];
      if (typeof value !== 'string') continue;
      const radio = Array.from(question.querySelectorAll('input[type="radio"]')).find(input => input.value === value);
      if (radio) radio.checked = true;
      else {
        const field = textResponse(question);
        if (field) field.value = value;
      }
    }
    if (state.submitted) checkAnswers({ focusScore: false, persist: false });
    else {
      const status = document.getElementById('test-save-status');
      if (status) status.textContent = 'Your saved test answers were restored.';
    }
  }

  quiz.addEventListener('change', event => {
    const question = event.target.closest('.question');
    if (!question) return;
    if (!event.target.matches('input[type="radio"], input[type="text"], textarea')) return;
    state.answers[question.id] = event.target.matches('input[type="radio"]') ? event.target.value : event.target.value;
    state.submitted = false;
    clearFeedback();
    persistAttempt();
  });
  quiz.addEventListener('input', event => {
    if (!event.target.matches('input[type="text"], textarea')) return;
    const question = event.target.closest('.question');
    if (!question) return;
    state.answers[question.id] = event.target.value;
    state.submitted = false;
    clearFeedback();
    persistAttempt();
  });
  quiz.addEventListener('submit', event => { event.preventDefault(); checkAnswers(); });
  const checkButton = document.getElementById('check-answers');
  if (checkButton) checkButton.addEventListener('click', () => checkAnswers());
  quiz.addEventListener('reset', () => {
    window.setTimeout(() => {
      state = { answers: {}, submitted: false };
      removeStore(testKey);
      clearFeedback();
      lockKey('The test was reset and the teacher key was closed.');
      const status = document.getElementById('test-save-status');
      if (status) status.textContent = 'Test answers cleared. You can start again.';
      const indexStatus = document.querySelector('[data-question-index-status]');
      if (indexStatus) indexStatus.textContent = 'Answers reset.';
    }, 0);
  });
  lockKey();
})();
