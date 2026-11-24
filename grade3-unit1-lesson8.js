/* Grade 3 Unit 1 Lesson 8 — independent Lesson Test scoring and the teacher answer gate.
   Shared scripts own navigation and reveal accessibility. Pupil work is kept only in this browser.
   Writing practice lives in lesson8-writing-practice.js. */
(() => {
  'use strict';
  const main = document.querySelector('main.wrap');
  if (!main) return;
  const testKey = 'efc_grade3_unit1_lesson8_test_v1';
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
