/* Grade 5 · Unit 1 · Lesson 5 (Clothes): lesson-local practice behaviour.
   Step navigation is owned by lesson-content-navigation.js and answer reveals are owned by
   lesson-accessibility.js. This file only:
     1. keeps the small "n of n answered" counters in step with the controls on the page;
     2. remembers every answer typed or chosen on these pages, so a learner who moves between
        the steps, reloads, or opens another lesson-5 page and comes back finds the same work;
     3. scores, persists, and resets the independent eighteen-question lesson 5 test. */
(() => {
  'use strict';

  const STORAGE_PREFIX = 'efc_lesson5_answers_v1:';
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

  const clearStore = () => {
    try {
      window.localStorage.removeItem(pageKey);
    } catch (error) {
      /* Ignore storage failure. */
    }
  };

  const store = readStore();

  /* ---------- 1. Remember every answer control on Pupil’s Book and Workbook ---------- */
  const controls = Array.from(
    document.querySelectorAll(
      'main input[type="radio"][name], main input[type="text"][id], main input[type="number"][id], main textarea[id], main select[id]'
    )
  ).filter(element => !element.closest('#quiz'));

  const keyOf = element => element.name || element.id;

  controls.forEach(element => {
    const key = keyOf(element);
    if (!key) return;
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
    const names = Array.from(group.querySelectorAll('input[type="radio"][name]'), input => input.name);
    const unique = Array.from(new Set(names));
    const radioAnswered = unique.filter(name => group.querySelector('input[name="' + name + '"]:checked')).length;
    const written = Array.from(group.querySelectorAll('input[type="text"], input[type="number"], select, textarea'));
    const writtenAnswered = written.filter(element => String(element.value || '').trim().length > 0).length;
    return { answered: radioAnswered + writtenAnswered, total: unique.length + written.length };
  };

  const syncStatus = () => {
    document.querySelectorAll('[data-status-for]').forEach(status => {
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
        if (event.target.matches('input[type="radio"], input[type="text"], input[type="number"], select, textarea')) syncStatus();
      });
      main.addEventListener('input', event => {
        if (event.target.matches('input[type="text"], input[type="number"], textarea')) syncStatus();
      });
      main.addEventListener('reset', () => window.setTimeout(syncStatus, 0));
    });
    syncStatus();
  }

  /* ---------- 3. The independent lesson test ---------- */
  const quiz = document.getElementById('quiz');
  if (!quiz) return;

  const questions = Array.from(quiz.querySelectorAll('.question'));
  const scoreBox = document.getElementById('score');
  const password = document.getElementById('teacher-password');
  const gateFeedback = document.getElementById('gate-feedback');
  const key = document.getElementById('answer-key');
  const lock = document.getElementById('lock-key');
  const unlock = document.getElementById('unlock-key');

  const FORMAT_LABELS = {
    'multiple-choice': 'Multiple choice',
    'true-false': 'True or False',
    'short-answer': 'Written response'
  };

  const isShortAnswer = question => question.dataset.format === 'short-answer';

  const normalizeWritten = value =>
    String(value || '')
      .replace(/[\u2018\u2019`]/g, "'")
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s+([?.!,])/g, '$1')
      .replace(/[.?!]+$/, '')
      .trim()
      .toLowerCase();

  const correctLabel = question => {
    if (isShortAnswer(question)) {
      return question.dataset.correct || '';
    }
    const input = question.querySelector('input[type="radio"][value="' + question.dataset.correct + '"]');
    return input ? input.parentElement.textContent.trim() : '';
  };

  const formatLabelFor = question => {
    const format = question.dataset.format || 'multiple-choice';
    return FORMAT_LABELS[format] || format;
  };

  const evaluateQuestion = question => {
    if (isShortAnswer(question)) {
      const textInput = question.querySelector('input[type="text"]');
      const raw = textInput ? textInput.value : '';
      if (raw.trim().length === 0) {
        return { answered: false, correct: false };
      }
      const accepted = String(question.dataset.accepted || question.dataset.correct || '')
        .split('|')
        .map(normalizeWritten)
        .filter(Boolean);
      return {
        answered: true,
        correct: accepted.includes(normalizeWritten(raw))
      };
    }

    const chosen = question.querySelector('input[type="radio"]:checked');
    if (!chosen) {
      return { answered: false, correct: false };
    }
    return {
      answered: true,
      correct: chosen.value === question.dataset.correct
    };
  };

  let testState = {
    answers: store && typeof store.answers === 'object' && store.answers ? { ...store.answers } : {},
    submitted: Boolean(store && store.submitted)
  };

  const persistTestState = () => {
    writeStore(testState);
  };

  const restoreSavedTestInputs = () => {
    Object.entries(testState.answers).forEach(([name, value]) => {
      if (typeof value !== 'string') return;
      const radios = Array.from(quiz.querySelectorAll('input[type="radio"]')).filter(
        el => el.name === name
      );
      if (radios.length > 0) {
        radios.forEach(radio => {
          radio.checked = radio.value === value;
        });
        return;
      }
      const textInputs = Array.from(quiz.querySelectorAll('input[type="text"]')).filter(
        el => el.name === name
      );
      textInputs.forEach(input => {
        input.value = value;
      });
    });
  };

  const clearScore = () => {
    if (scoreBox) {
      scoreBox.classList.remove('visible');
      scoreBox.replaceChildren();
    }
  };

  // The shared stylesheet hides .answer either through the [hidden] attribute or, because
  // this page sets body[data-answer-toggle="class"], through the .show class. Both are set
  // together so the reveal behaves the same way as the other lessons in the project.
  const setKeyOpen = open => {
    if (!key) return;
    key.hidden = !open;
    key.classList.toggle('show', open);
    if (unlock) unlock.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (lock) lock.setAttribute('aria-expanded', open ? 'true' : 'false');
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
    questions.forEach(question => {
      const item = document.createElement('li');
      item.dir = 'ltr';
      const answer = document.createElement('strong');
      answer.textContent = correctLabel(question);
      const objective = document.createElement('p');
      objective.className = 'source-note';
      objective.textContent =
        (question.dataset.objectiveLabel || 'Lesson objective') + ' · Format: ' + formatLabelFor(question);
      const explanation = document.createElement('p');
      explanation.textContent = question.dataset.evidence || '';
      item.append(answer, objective, explanation);
      list.appendChild(item);
    });
  };

  const checkAnswers = options => {
    if (!scoreBox) return;
    const focusScore = !options || options.focusScore !== false;
    let correctCount = 0;
    let answeredCount = 0;
    let firstOpen = null;

    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      const objectiveText = question.dataset.objectiveLabel || 'Lesson objective';
      const evidence = question.dataset.evidence || '';
      const result = evaluateQuestion(question);
      feedback.className = 'feedback';

      if (!result.answered) {
        feedback.classList.add('unanswered');
        feedback.textContent =
          'No answer chosen yet. This question is unanswered and does not count as correct.';
        if (!firstOpen) firstOpen = question;
        return;
      }

      answeredCount++;
      if (result.correct) {
        correctCount++;
        feedback.classList.add('correct');
        feedback.textContent = '✓ Correct. ' + objectiveText + '. ' + evidence;
      } else {
        feedback.classList.add('incorrect');
        feedback.textContent =
          '✗ Not correct. The answer is: ' + correctLabel(question) + '. ' + objectiveText + '. ' + evidence;
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
    note.textContent =
      'Your answers and score are saved on this browser until you reset the test to try again.';
    scoreBox.replaceChildren(summary, detail, note);
    scoreBox.classList.add('visible');
    if (focusScore) {
      scoreBox.focus({ preventScroll: true });
      if (firstOpen) firstOpen.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }

    testState.submitted = true;
    persistTestState();
  };

  const recordTestInput = target => {
    if (!target || !target.name) return;
    if (target.type === 'radio') {
      if (target.checked) {
        testState.answers[target.name] = target.value;
      }
    } else if (target.type === 'text') {
      if (target.value.trim().length > 0) {
        testState.answers[target.name] = target.value;
      } else {
        delete testState.answers[target.name];
      }
    } else {
      return;
    }
    testState.submitted = false;
    persistTestState();
    clearScore();
    const parentQuestion = target.closest('.question');
    if (parentQuestion) {
      const feedback = parentQuestion.querySelector('.feedback');
      if (feedback && feedback.textContent) {
        feedback.className = 'feedback';
        feedback.textContent = 'Answer changed. Choose “Check my answers” to update the score.';
      }
    }
  };

  restoreSavedTestInputs();
  if (testState.submitted) {
    checkAnswers({ focusScore: false });
  }

  if (scoreBox) {
    const checkButton = document.getElementById('check-answers');
    if (checkButton) checkButton.addEventListener('click', () => checkAnswers({ focusScore: true }));

    quiz.addEventListener('reset', () => {
      testState = { answers: {}, submitted: false };
      clearStore();
      quiz.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
      });
      quiz.querySelectorAll('input[type="text"], textarea').forEach(field => {
        field.value = '';
      });
      questions.forEach(question => {
        const feedback = question.querySelector('.feedback');
        if (!feedback) return;
        feedback.textContent = '';
        feedback.className = 'feedback';
      });
      clearScore();
      closeKey('The test was reset and the answer key was closed.');
    });

    quiz.addEventListener('submit', event => {
      event.preventDefault();
      checkAnswers({ focusScore: true });
    });

    quiz.addEventListener('change', event => {
      recordTestInput(event.target);
    });

    quiz.addEventListener('input', event => {
      if (event.target && event.target.type === 'text') {
        recordTestInput(event.target);
      }
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
    if (lock) {
      lock.addEventListener('click', () => {
        closeKey('The answer key is hidden.');
        unlock.focus();
      });
    }
  }
})();
