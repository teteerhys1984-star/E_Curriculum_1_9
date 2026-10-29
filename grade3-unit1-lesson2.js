/* Lesson-local practice and assessment. Step navigation is owned by lesson-content-navigation.js. */
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
    return question.dataset.kind === 'inferred' ? 'مستنتج من المصدر' : 'صريح في المصدر / قراءة مباشرة';
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
    item.dir = 'rtl';
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
        feedback.textContent = 'لم تختر إجابة بعد. هذا السؤال غير مُجاب ولا يُحتسب صحيحًا.';
        if (!firstIncomplete) firstIncomplete = question;
        return;
      }
      answeredCount++;
      if (chosen.value === question.dataset.correct) {
        correctCount++;
        feedback.classList.add('correct');
        feedback.textContent = '✓ إجابة صحيحة. ' + evidenceLabel(question) + '. ' + question.dataset.evidence;
      } else {
        feedback.classList.add('incorrect');
        feedback.textContent = '✗ إجابة غير صحيحة. الإجابة: ' + correctLabel(question) + '. ' + evidenceLabel(question) + '. ' + question.dataset.evidence;
        if (!firstIncomplete) firstIncomplete = question;
      }
    });
    const summary = document.createElement('strong');
    summary.textContent = 'النتيجة: ' + correctCount + ' / ' + questions.length;
    const details = document.createElement('p');
    details.textContent = 'الأسئلة المُجابة: ' + answeredCount + ' / ' + questions.length + ' · غير المُجابة: ' + (questions.length - answeredCount) + '. تصحيح آلي للأسئلة العشرين فقط؛ لا يشمل الاستماع أو الكتابة الشخصية.';
    const explanation = document.createElement('p');
    explanation.textContent = 'راجع التغذية الراجعة أسفل كل سؤال من فهرس الأسئلة. مفتاح المعلم يبقى منفصلًا ولا يُفتح عند التصحيح.';
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
    feedback.textContent = 'تم تغيير الإجابة. اضغط «تصحيح إجاباتي» لتحديث النتيجة.';
    feedback.className = 'feedback';
  });
  quiz.addEventListener('reset', () => {
    questions.forEach(question => {
      const feedback = question.querySelector('.feedback');
      feedback.textContent = ''; feedback.className = 'feedback';
    });
    invalidateScore();
    lockKey('أُعيد الاختبار وأُغلق مفتاح المعلم.');
  });

  // Same existing project password and deliberately client-side-only gate.
  // This is a display convenience, NOT a security boundary; the UI says so explicitly.
  function unlockKey() {
    const expected = String.fromCharCode(115,111,109,101,114,49,55,51);
    if (password.value === expected) {
      guide.hidden = false; lock.hidden = false;
      gateFeedback.textContent = 'تم إظهار المفتاح. هذه ليست مصادقة آمنة على خادم.';
    } else {
      lockKey(password.value ? 'كلمة المرور غير صحيحة. حاول مرة أخرى.' : 'أدخل كلمة المرور أولًا.');
    }
  }
  document.getElementById('unlock-solutions').addEventListener('click', unlockKey);
  password.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); unlockKey(); }
  });
  lock.addEventListener('click', () => lockKey('أُخفي المفتاح.'));
})();
