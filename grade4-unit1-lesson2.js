/* Grade 4 Unit 1 Lesson 2: lesson-local practice and assessment.
   Step navigation is owned by lesson-content-navigation.js; this file only reveals
   practice answers and scores the lesson test defined in the page markup. */
(() => {
  'use strict';
  const main = document.querySelector('main.wrap');
  if (!main) return;

  function setReveal(button, open) {
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    if (!answer) return;
    answer.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? button.dataset.hide : button.dataset.show;
  }
  document.querySelectorAll('button.reveal').forEach(button => {
    button.addEventListener('click', () => setReveal(button, button.getAttribute('aria-expanded') !== 'true'));
  });
  document.querySelectorAll('form.practice-form').forEach(form => {
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => {
      form.querySelectorAll('button.reveal').forEach(button => setReveal(button, false));
    });
  });

  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const questions = Array.from(quiz.querySelectorAll('.question'));
  const score = document.getElementById('score');
  const gate = document.getElementById('teacher-gate');
  const password = document.getElementById('teacher-password');
  const gateFeedback = document.getElementById('gate-feedback');
  const guide = document.getElementById('answer-guide');
  const lock = document.getElementById('lock-solutions');
  const key = document.getElementById('teacher-key');

  function answerOf(question) {
    return question.querySelector('input[type="radio"]:checked');
  }
  function correctLabel(question) {
    const correct = question.dataset.correct;
    const input = question.querySelector('input[value="' + correct + '"]');
    return input ? input.parentElement.textContent.trim() : '';
  }
  function evidenceLabel(question) {
    return question.dataset.kind === 'inferred' ? 'Inferred from the source' : 'Explicit in the source / direct reading';
  }
  function invalidateScore() {
    score.replaceChildren();
  }
  function lockKey(message = '') {
    guide.hidden = true;
    lock.hidden = true;
    password.value = '';
    gateFeedback.textContent = message;
  }

  // Populate the key with textContent, never with unsanitized pupil input.
  questions.forEach((question, index) => {
    const item = document.createElement('li');
    item.dir = 'ltr';
    const answer = document.createElement('strong');
    answer.textContent = correctLabel(question);
    const kind = document.createElement('p');
    kind.className = 'evidence';
    kind.textContent = evidenceLabel(question);
    const reference = document.createElement('p');
    reference.className = 'evidence en';
    reference.dir = 'ltr'; reference.lang = 'en';
    reference.textContent = question.dataset.reference;
    const explanation = document.createElement('p');
    explanation.textContent = question.dataset.evidence;
    item.append(answer, kind, reference, explanation);
    key.appendChild(item);
  });

  function checkAnswers() {
    let correctCount = 0;
    let answeredCount = 0;
    let firstIncomplete = null;
    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      const chosen = answerOf(question);
      feedback.className = 'feedback';
      if (!chosen) {
        feedback.classList.add('unanswered');
        feedback.textContent = 'No answer selected yet. This question is unanswered and does not count as correct.';
        if (!firstIncomplete) firstIncomplete = question;
        return;
      }
      answeredCount++;
      if (chosen.value === question.dataset.correct) {
        correctCount++;
        feedback.classList.add('correct');
        feedback.textContent = '✓ Correct answer. ' + evidenceLabel(question) + '. ' + question.dataset.evidence;
      } else {
        feedback.classList.add('incorrect');
        feedback.textContent = '✗ Incorrect answer. The answer is: ' + correctLabel(question) + '. ' + evidenceLabel(question) + '. ' + question.dataset.evidence;
        if (!firstIncomplete) firstIncomplete = question;
      }
    });
    const summary = document.createElement('strong');
    summary.textContent = 'Score: ' + correctCount + ' / ' + questions.length;
    const details = document.createElement('p');
    details.textContent = 'Answered: ' + answeredCount + ' / ' + questions.length + ' · Unanswered: ' + (questions.length - answeredCount) + '. Automatic scoring covers only the 20 questions; it does not include listening or personal writing.';
    const explanation = document.createElement('p');
    explanation.textContent = 'Review the feedback below each question using the question index. The teacher key stays separate and does not open when you score the test.';
    score.replaceChildren(summary, details, explanation);
    score.focus({ preventScroll: true });
    score.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }
  document.getElementById('check-answers').addEventListener('click', checkAnswers);
  quiz.addEventListener('submit', event => { event.preventDefault(); checkAnswers(); });
  quiz.addEventListener('change', event => {
    if (!event.target.matches('input[type="radio"]')) return;
    invalidateScore();
    const feedback = event.target.closest('.question').querySelector('.feedback');
    feedback.textContent = 'Answer changed. Select “Check my answers” to update your score.';
    feedback.className = 'feedback';
  });
  quiz.addEventListener('reset', () => {
    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      feedback.textContent = ''; feedback.className = 'feedback';
    });
    invalidateScore();
    lockKey('The test was reset and the teacher key was closed.');
  });

  // Same existing project password and deliberately client-side-only gate.
  // This is a display convenience, NOT a security boundary; the UI says so explicitly.
  function unlockKey() {
    const expected = String.fromCharCode(115,111,109,101,114,49,55,51);
    if (password.value === expected) {
      guide.hidden = false; lock.hidden = false;
      gateFeedback.textContent = 'The answer key is open. This is not secure server-side authentication.';
    } else {
      lockKey(password.value ? 'Incorrect password. Please try again.' : 'Enter the password first.');
    }
  }
  document.getElementById('unlock-solutions').addEventListener('click', unlockKey);
  password.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); unlockKey(); }
  });
  lock.addEventListener('click', () => lockKey('The answer key is hidden.'));
})();
