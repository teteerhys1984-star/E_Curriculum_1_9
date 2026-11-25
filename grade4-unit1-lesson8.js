/* Grade 4 Unit 1 Lesson 8: local writing drafts, vocabulary reveal and independent test scoring. */
(() => {
  'use strict';
  const lessonKey = 'efc_grade4_unit1_lesson8';
  const readStore = key => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  };
  const writeStore = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  };
  const removeStore = key => {
    try { localStorage.removeItem(key); return true; }
    catch (_) { return false; }
  };
  const statusText = (ok, saved) => ok
    ? (saved ? 'Saved in this browser.' : 'This browser could not save the response.')
    : 'This browser could not save the response.';

  for (const group of document.querySelectorAll('[data-writing-activity]')) {
    const id = group.dataset.writingActivity;
    if (!id) continue;
    const key = `${lessonKey}:writing:${id}`;
    const inputs = Array.from(group.querySelectorAll('[data-writing-input]'));
    const status = group.querySelector('.writing-save-status');
    const say = (ok, saved) => { if (status) status.textContent = ok ? statusText(ok, saved) : statusText(ok, false); };
    const saved = readStore(key);
    if (saved && typeof saved === 'object' && Array.isArray(saved.values)) {
      inputs.forEach((input, index) => {
        if (typeof saved.values[index] === 'string') input.value = saved.values[index];
      });
      if (status) status.textContent = 'Your saved response was restored.';
    }
    const persist = () => say(true, writeStore(key, { values: inputs.map(input => input.value) }));
    inputs.forEach(input => {
      input.addEventListener('input', persist);
      input.addEventListener('change', persist);
    });
    const reset = group.querySelector('[data-writing-reset]');
    if (reset) reset.addEventListener('click', () => {
      inputs.forEach(input => { input.value = ''; });
      removeStore(key);
      const detail = group.querySelector('details[data-student-model]');
      if (detail) detail.open = false;
      if (status) status.textContent = 'Only this activity was cleared. Your other work was kept.';
    });
  }

  const vocabularyForm = document.getElementById('vocabulary-practice');
  if (vocabularyForm) {
    const selector = document.getElementById('vocab-entry');
    const output = document.getElementById('vocab-meaning');
    const status = document.getElementById('vocab-save-status');
    const key = `${lessonKey}:vocab`;
    const saved = readStore(key);
    if (saved && typeof saved === 'string') selector.value = saved;
    const persist = () => {
      const ok = writeStore(key, selector.value);
      if (status) status.textContent = ok ? 'Your vocabulary choice is saved in this browser.' : 'This browser could not save your choice.';
    };
    selector.addEventListener('change', () => { output.textContent = ''; persist(); });
    const reveal = document.getElementById('reveal-vocab-meaning');
    if (reveal) reveal.addEventListener('click', () => {
      const row = Array.from(document.querySelectorAll('tr[data-entry-id]')).find(item => item.dataset.entryId === selector.value);
      output.textContent = row?.querySelector('td.ar[lang="ar"][dir="rtl"]')?.textContent || '';
    });
    vocabularyForm.addEventListener('reset', () => {
      window.setTimeout(() => {
        removeStore(key);
        output.textContent = '';
        selector.selectedIndex = 0;
        if (status) status.textContent = 'Vocabulary practice reset.';
      }, 0);
    });
  }

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
    const ok = writeStore(testKey, state);
    const status = document.getElementById('test-save-status');
    if (status) status.textContent = ok
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
  if (lock) lock.addEventListener('click', () => { lockKey('The teacher key was hidden.'); if (unlock) unlock.focus(); });

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
    state.answers[question.id] = event.target.value;
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
    }, 0);
  });
  lockKey();
})();
