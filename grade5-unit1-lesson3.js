/* Grade 5 · Unit 1 · Lesson 3 (Daily Routines): lesson-local practice behaviour.
   Step navigation is owned by lesson-content-navigation.js and answer reveals are owned by
   lesson-accessibility.js. This file only:
     1. keeps the small "n of n answered" counters in step with the controls on the page;
     2. remembers every answer typed or chosen on these pages, so a learner who moves between
        the steps, reloads, or opens another lesson-3 page and comes back finds the same work;
     3. scores the twenty-question lesson test from the data-correct attributes in its markup.
   No answer key, prompt or option is ever written by this file. */
(() => {
  'use strict';

  const STORAGE_PREFIX = 'efc_lesson3_answers_v1:';
  const pageKey = STORAGE_PREFIX + (document.body?.dataset?.navPage || 'page');

  const readStore = () => {
    try {
      const raw = window.localStorage.getItem(pageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  };

  const writeStore = store => {
    try {
      window.localStorage.setItem(pageKey, JSON.stringify(store));
    } catch (error) {
      /* Storage can be blocked; the page still works without it. */
    }
  };

  const store = readStore();

  /* ---------- 1. Remember every answer control ---------- */
  const controls = Array.from(
    document.querySelectorAll(
      'main input[type="radio"][name], main input[type="text"][id], main textarea[id], main select[id]'
    )
  ).filter(element => !element.closest('#quiz'));

  const keyOf = element => element.name || element.id;

  controls.forEach(element => {
    const key = keyOf(element);
    if (!key) return;
    // A <select> has no .type of "radio", but it does have a .value, so both the restore
    // and the record paths below work for any control that holds one value.
    if (element.type === 'radio') {
      if (store[key] === element.value) element.checked = true;
    } else if (store[key] !== undefined) {
      element.value = store[key];
    }
    const record = () => {
      if (element.type === 'radio') {
        if (element.checked) store[keyOf(element)] = element.value;
      } else {
        store[keyOf(element)] = element.value;
      }
      writeStore(store);
    };
    element.addEventListener(element.type === 'radio' ? 'change' : 'input', record);
    element.addEventListener('change', record);
  });

  /* ---------- 2. Counters that describe the copied work ---------- */
  const countRadioGroups = group => {
    // Radios are counted per group name; text inputs, selects and textareas are counted
    // one by one. A counter therefore describes exactly the controls inside its own
    // printed activity, whatever kind of control the book's task needs.
    const names = Array.from(group.querySelectorAll('input[type="radio"][name]'), input => input.name);
    const unique = Array.from(new Set(names));
    const radioAnswered = unique.filter(name => group.querySelector('input[name="' + name + '"]:checked')).length;
    const written = Array.from(group.querySelectorAll('input[type="text"], select, textarea'));
    const writtenAnswered = written.filter(element => String(element.value || '').trim().length > 0).length;
    return { answered: radioAnswered + writtenAnswered, total: unique.length + written.length };
  };

  const syncStatus = () => {
    document.querySelectorAll('[data-status-for]').forEach(status => {
      // Each counter describes the printed activity it sits in, so it counts the radio
      // groups of its own panel only and never the whole lesson.
      const scope = document.querySelector('[data-scope="' + status.dataset.statusFor + '"]');
      if (!scope) {
        status.hidden = true;
        return;
      }
      const counts = countRadioGroups(scope);
      if (!counts.total) {
        status.hidden = true;
        return;
      }
      status.hidden = false;
      status.textContent = counts.answered + ' of ' + counts.total + ' answered. Your choices are kept on this page.';
    });
  };

  if (document.querySelector('[data-status-for]')) {
    document.querySelectorAll('main').forEach(main => {
      main.addEventListener('change', event => {
        if (event.target.matches('input[type="radio"], input[type="text"], select, textarea')) syncStatus();
      });
      main.addEventListener('input', event => {
        if (event.target.matches('input[type="text"], textarea')) syncStatus();
      });
      main.addEventListener('reset', () => window.setTimeout(syncStatus, 0));
    });
    syncStatus();
  }

  /* ---------- 3. The lesson test ---------- */
  const quiz = document.getElementById('quiz');
  if (!quiz) return;

  const questions = Array.from(quiz.querySelectorAll('.question'));
  const scoreBox = document.getElementById('score');
  const gate = document.getElementById('teacher-gate');
  const password = document.getElementById('teacher-password');
  const gateFeedback = document.getElementById('gate-feedback');
  const key = document.getElementById('answer-key');
  const lock = document.getElementById('lock-key');
  const unlock = document.getElementById('unlock-key');

  const answerOf = question => question.querySelector('input[type="radio"]:checked');

  const correctLabel = question => {
    const input = question.querySelector('input[value="' + question.dataset.correct + '"]');
    return input ? input.parentElement.textContent.trim() : '';
  };

  const evidenceLabel = question =>
    question.dataset.kind === 'inferred' ? 'Inferred from the source' : 'Explicit in the source / direct reading';

  const clearScore = () => {
    if (scoreBox) scoreBox.replaceChildren();
  };

  // The shared stylesheet hides .answer either through the [hidden] attribute or, because
  // this page sets body[data-answer-toggle="class"], through the .show class. Both are set
  // together so the reveal behaves the same way as the other lessons in the project.
  const setKeyOpen = open => {
    if (!key) return;
    key.hidden = !open;
    key.classList.toggle('show', open);
  };

  const closeKey = (message = '') => {
    setKeyOpen(false);
    if (lock) lock.hidden = true;
    if (password) password.value = '';
    if (gateFeedback) gateFeedback.textContent = message;
  };

  const populateKey = () => {
    if (!key) return;
    const list = key.querySelector('ol');
    if (!list) return;
    list.replaceChildren();
    questions.forEach((question, index) => {
      const item = document.createElement('li');
      item.dir = 'ltr';
      const answer = document.createElement('strong');
      answer.textContent = correctLabel(question);
      const kind = document.createElement('p');
      kind.className = 'source-note';
      kind.textContent = evidenceLabel(question);
      const reference = document.createElement('p');
      reference.className = 'source-note';
      reference.textContent = question.dataset.reference || '';
      const explanation = document.createElement('p');
      explanation.textContent = question.dataset.evidence || '';
      item.append(answer, kind, reference, explanation);
      list.appendChild(item);
    });
  };

  const checkAnswers = () => {
    if (!scoreBox) return;
    let correctCount = 0;
    let answeredCount = 0;
    let firstOpen = null;

    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      const chosen = answerOf(question);
      feedback.className = 'feedback';
      if (!chosen) {
        feedback.classList.add('unanswered');
        feedback.textContent = 'No answer chosen yet. This question is unanswered and does not count as correct.';
        if (!firstOpen) firstOpen = question;
        return;
      }
      answeredCount++;
      if (chosen.value === question.dataset.correct) {
        correctCount++;
        feedback.classList.add('correct');
        feedback.textContent = '✓ Correct. ' + evidenceLabel(question) + '. ' + (question.dataset.evidence || '');
      } else {
        feedback.classList.add('incorrect');
        feedback.textContent =
          '✗ Not correct. The answer is: ' + correctLabel(question) + '. ' + evidenceLabel(question) + '. ' + (question.dataset.evidence || '');
        if (!firstOpen) firstOpen = question;
      }
    });

    const summary = document.createElement('strong');
    summary.textContent = 'Score: ' + correctCount + ' / ' + questions.length;
    const detail = document.createElement('p');
    detail.textContent =
      'Answered: ' + answeredCount + ' / ' + questions.length + ' · Unanswered: ' + (questions.length - answeredCount) + '.';
    const note = document.createElement('p');
    note.className = 'source-note';
    note.textContent = 'The score covers the multiple-choice questions only. Listening and free writing tasks are not part of this score.';
    scoreBox.replaceChildren(summary, detail, note);
    scoreBox.focus({ preventScroll: true });
    if (firstOpen) firstOpen.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  };

  if (scoreBox) {
    const checkButton = document.getElementById('check-answers');
    if (checkButton) checkButton.addEventListener('click', checkAnswers);
    const resetButton = document.getElementById('reset-test');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        window.setTimeout(() => {
          questions.forEach(question => {
            const feedback = question.querySelector('.feedback');
            feedback.textContent = '';
            feedback.className = 'feedback';
          });
          clearScore();
          closeKey('The test was reset and the answer key was closed.');
        }, 0);
      });
    }
    quiz.addEventListener('submit', event => {
      event.preventDefault();
      checkAnswers();
    });
    quiz.addEventListener('change', event => {
      if (!event.target.matches('input[type="radio"]')) return;
      clearScore();
      const feedback = event.target.closest('.question').querySelector('.feedback');
      feedback.className = 'feedback';
      feedback.textContent = 'Answer changed. Choose “Check my answers” to update the score.';
    });
  }

  /* ---------- Teacher gate: the password already used in this project ----------
     Deliberately client-side only, exactly like the other lessons. The page says so. */
  if (unlock && password && key) {
    populateKey();
    const expected = String.fromCharCode(115, 111, 109, 101, 114, 49, 55, 51);
    const tryUnlock = () => {
      if (password.value === expected) {
        setKeyOpen(true);
        if (lock) lock.hidden = false;
        if (gateFeedback) gateFeedback.textContent = 'The answer key is open. This is not secure server-side authentication.';
      } else {
        closeKey(password.value ? 'Incorrect password. Please try again.' : 'Enter the password first.');
      }
    };
    unlock.addEventListener('click', tryUnlock);
    password.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        tryUnlock();
      }
    });
    if (lock) lock.addEventListener('click', () => {
      closeKey('The answer key is hidden.');
      unlock.focus();
    });
  }
})();
