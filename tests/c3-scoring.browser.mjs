import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'test-results', 'c3-scoring');
fs.mkdirSync(evidenceDir, { recursive: true });
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'c3-scoring.fixture.json'), 'utf8'));
const checks = [];
const errors = [];
const results = [];
const mutations = [];
const pass = (name, detail) => { checks.push({ name, status: 'PASS', detail }); console.log('PASS', name, detail); };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;

const wrongValue = (correct, optionCount) => {
  if (/^\d+$/.test(correct)) return String((Number(correct) + 1) % optionCount);
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return letters[(letters.indexOf(correct) + 1) % optionCount];
};
const wrongForQuestion = (quiz, correct, index) => {
  const zeroBased = quiz.kind === 'legacy-generated';
  const name = 'q' + (zeroBased ? index : index + 1);
  if (quiz.writtenQuestions && quiz.writtenQuestions[name]) {
    return quiz.writtenQuestions[name].wrong;
  }
  const optionCount = Array.isArray(quiz.optionCounts) ? quiz.optionCounts[index] : quiz.optionCount;
  return wrongValue(correct, optionCount);
};
const selectionsFor = (quiz, mode) => quiz.correct.map((correct, index) => {
  if (mode === 'empty') return null;
  if (mode === 'allWrong') return wrongForQuestion(quiz, correct, index);
  if (mode === 'allCorrect') return correct;
  if (mode === 'oneWrong') return index === 0 ? wrongForQuestion(quiz, correct, index) : correct;
  if (mode === 'firstOnly') return index === 0 ? correct : null;
  if (mode === 'alternating') return index % 2 === 0 ? correct : wrongForQuestion(quiz, correct, index);
  throw new Error(`Unknown selection mode: ${mode}`);
});
const expectedFor = (quiz, mode, written = {}) => {
  const selections = selectionsFor(quiz, mode);
  const score = selections.reduce((total, value, index) => total + (value === quiz.correct[index] ? 1 : 0), 0);
  const answered = selections.filter(value => value !== null).length;
  const expected = { score, answered, total: quiz.objectiveTotal };
  if (quiz.kind === 'modern') expected.unanswered = quiz.objectiveTotal - answered;
  if (quiz.kind === 'legacy-objective-written') {
    expected.writtenCompleted = (quiz.writtenNames || []).filter(name => String(written[name] || '').trim()).length;
  }
  if (quiz.kind === 'legacy-mixed') {
    // This legacy page publishes only the combined score out of all ten items.
    delete expected.answered;
    expected.total = quiz.totalQuestions;
    const name = String(written.q9 || '').trim();
    const sentence = String(written.q10 || '').trim();
    expected.score += (name.length >= 4 && /name is/i.test(name) ? 1 : 0) + (sentence.length >= 5 && /^i am\s+/i.test(sentence) ? 1 : 0);
  }
  return expected;
};
const applyAnswers = async (page, quiz, selections, written = {}) => {
  await page.evaluate(({ quiz, selections, written }) => {
    const zeroBased = quiz.kind === 'legacy-generated';
    selections.forEach((value, index) => {
      const name = 'q' + (zeroBased ? index : index + 1);
      if (quiz.writtenQuestions && quiz.writtenQuestions[name]) {
        const textField = document.querySelector(`#quiz input[type="text"][name="${name}"], #quiz textarea[name="${name}"]`);
        if (!textField) throw new Error(`Missing written question field ${name}`);
        textField.value = value === null ? '' : value;
        textField.dispatchEvent(new Event('input', { bubbles: true }));
        textField.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      const inputs = Array.from(document.querySelectorAll(`#quiz input[type="radio"][name="${name}"]`));
      if (!inputs.length) throw new Error(`Missing radio group ${name}`);
      inputs.forEach(input => { input.checked = false; });
      if (value !== null) {
        const input = inputs.find(item => item.value === value);
        if (!input) throw new Error(`Missing option ${name}=${value}`);
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    for (const [name, value] of Object.entries(written)) {
      const input = document.querySelector(`#quiz [name="${name}"]`);
      if (!input) throw new Error(`Missing written field ${name}`);
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, { quiz, selections, written });
};
const readResult = async (page, quiz) => {
  const text = (await page.locator(quiz.result).innerText()).replace(/\s+/g, ' ').trim();
  const number = pattern => {
    const match = text.match(pattern);
    assert.ok(match, `${quiz.file}: result did not match ${pattern}: ${text}`);
    return Number(match[1]);
  };
  if (quiz.kind === 'legacy-objective-written') {
    return {
      score: number(/Score: (\d+) \/ 15 objective questions/),
      answered: number(/Answered: (\d+) \/ 15/),
      total: 15,
      writtenCompleted: number(/Written answers completed: (\d+) \/ 5/)
    };
  }
  if (quiz.kind === 'modern') {
    const total = quiz.objectiveTotal;
    return {
      score: number(new RegExp(`Score: (\\d+) / ${total}`)),
      answered: number(new RegExp(`Answered: (\\d+) / ${total}`)),
      total,
      unanswered: number(/Unanswered: (\d+)\./)
    };
  }
  if (quiz.kind === 'legacy-mixed') {
    assert.match(text, /^\d+\/10$/, `${quiz.file}: exact mixed score format`);
    return { score: Number(text.split('/')[0]), total: 10 };
  }
  if (quiz.file === 'grade5-unit1-lesson1-test.html') {
    return { score: number(/Your score: (\d+) \/ 20/), answered: number(/Answered: (\d+) \/ 20/), total: 20 };
  }
  const total = quiz.objectiveTotal;
  return { score: number(new RegExp(`Score: (\\d+) / ${total}`)), answered: number(new RegExp(`Answered: (\\d+) / ${total}`)), total };
};
const assertResult = (actual, expected, label) => {
  assert.deepEqual(actual, expected, `${label}: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`);
};
const submit = async (page, quiz) => {
  await page.locator(quiz.submit).evaluate(el => el.click());
};
const scenario = async (page, quiz, mode, written = {}) => {
  await page.goto(origin + quiz.file, { waitUntil: 'load' });
  await applyAnswers(page, quiz, selectionsFor(quiz, mode), written);
  await submit(page, quiz);
  const actual = await readResult(page, quiz);
  const expected = expectedFor(quiz, mode, written);
  assertResult(actual, expected, `${quiz.file} ${mode}`);
  results.push({ file: quiz.file, mode, written, expected, actual });
  return actual;
};

// These mutations are served only inside Chromium through request interception.
// Repository files are never edited. Each mutation must be rejected by the same
// exact numeric assertion used for the real page, not by a syntax/network error.
const mutationFor = quiz => {
  if (quiz.file === 'grade3-unit1-lesson1-test.html') return { target: quiz.file, find: "if(v.value===a){score++;", replace: "if(v.value===a){score+=2;" };
  if (quiz.kind === 'modern') return { target: quiz.file.replace('-test.html', '.js'), find: 'correctCount++;', replace: 'correctCount += 2;' };
  if (quiz.file === 'grade4-unit1-lesson1-test.html') return { target: quiz.file, find: "if(chosen&&chosen.value===correct['q'+i])score++;", replace: "if(chosen&&chosen.value===correct['q'+i])score+=2;" };
  if (quiz.file === 'grade5-unit1-lesson1-test.html') return { target: quiz.file, find: 'if(Number(a.value)===q[2])correct++;', replace: 'if(Number(a.value)===q[2])correct+=2;' };
  return { target: quiz.file, find: 'if(+a.value===q[2])score++', replace: 'if(+a.value===q[2])score+=2' };
};
const runMutation = async (page, quiz) => {
  const mutation = mutationFor(quiz);
  const source = fs.readFileSync(path.join(root, mutation.target), 'utf8');
  assert.equal(source.split(mutation.find).length - 1, 1, `${quiz.file}: mutation target must be unique`);
  const mutated = source.replace(mutation.find, mutation.replace);
  const url = origin + mutation.target;
  await page.route(url, route => route.fulfill({ contentType: mime[path.extname(mutation.target)], body: mutated }));
  try {
    await page.goto(origin + quiz.file, { waitUntil: 'load' });
    const written = quiz.kind === 'legacy-mixed' ? { q9: 'My name is Sara', q10: 'I am ten years old.' } : {};
    await applyAnswers(page, quiz, selectionsFor(quiz, 'allCorrect'), written);
    await submit(page, quiz);
    const actual = await readResult(page, quiz);
    const expected = expectedFor(quiz, 'allCorrect', written);
    let rejection = null;
    try { assertResult(actual, expected, `${quiz.file} mutated`); } catch (error) { rejection = error; }
    assert.ok(rejection instanceof assert.AssertionError, `${quiz.file}: mutation must fail the exact numeric assertion`);
    assert.notEqual(actual.score, expected.score, `${quiz.file}: mutation must change the numeric score`);
    mutations.push({ file: quiz.file, target: mutation.target, expectedScore: expected.score, mutatedScore: actual.score, rejectedByNumericAssertion: true });
  } finally {
    await page.unroute(url);
  }
};

let browser;
try {
  let launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  } else if (process.platform === 'linux') {
    const chromiumPackage = require('@sparticuz/chromium');
    const bundled = chromiumPackage.default;
    const packageDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
    const libs = await chromiumPackage.inflate(path.join(packageDir, 'bin', 'al2023.tar.br'));
    chromiumPackage.setupLambdaEnvironment(path.join(libs, 'lib'));
    launchOptions = { ...launchOptions, executablePath: await bundled.executablePath(), args: bundled.args };
  }
  browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) errors.push({ url: response.url(), status: response.status() });
  });

  for (const quiz of fixture.quizzes) {
    await page.goto(origin + quiz.file, { waitUntil: 'load' });
    assert.equal(await page.locator('#quiz .question').count(), quiz.totalQuestions, `${quiz.file}: pinned question count`);
    if (quiz.kind === 'modern') {
      const rendered = await page.locator('#quiz .question').evaluateAll(nodes => nodes.map(node => node.dataset.correct));
      assert.deepEqual(rendered, quiz.correct, `${quiz.file}: rendered key matches the pinned source-reviewed fixture`);
    }
    for (const mode of ['empty', 'allWrong', 'allCorrect', 'oneWrong', 'firstOnly', 'alternating']) {
      await scenario(page, quiz, mode);
    }
    if (quiz.kind === 'legacy-objective-written') {
      await scenario(page, quiz, 'allCorrect', { w16: '   ', w17: '\t', w18: '', w19: ' ', w20: '\n' });
      await scenario(page, quiz, 'allCorrect', { w16: 'One', w17: 'Two', w18: 'Three' });
      await scenario(page, quiz, 'allCorrect', { w16: 'One', w17: 'Two', w18: 'Three', w19: 'Four', w20: 'Five' });
    }
    if (quiz.kind === 'legacy-mixed') {
      await scenario(page, quiz, 'allCorrect', { q9: 'My name is Sara', q10: 'I am ten years old.' });
      await scenario(page, quiz, 'allCorrect', { q9: 'MY NAME IS JO', q10: 'i am happy' });
      await scenario(page, quiz, 'allCorrect', { q9: 'name is', q10: 'I am a' });
      await scenario(page, quiz, 'allCorrect', { q9: 'My name is Sara' });
      await scenario(page, quiz, 'allCorrect', { q10: 'I am ten years old.' });
      await scenario(page, quiz, 'allCorrect', { q9: 'My name', q10: 'I am' });
      await scenario(page, quiz, 'allCorrect', { q9: '   ', q10: '   ' });
      await scenario(page, quiz, 'allWrong', { q9: 'My name is Sara', q10: 'I am ten years old.' });
    }
    if (quiz.reset) {
      await page.goto(origin + quiz.file, { waitUntil: 'load' });
      const written = quiz.kind === 'legacy-mixed' ? { q9: 'My name is Sara', q10: 'I am ten years old.' } : {};
      await applyAnswers(page, quiz, selectionsFor(quiz, 'allCorrect'), written);
      await submit(page, quiz);
      await page.locator(quiz.reset).evaluate(el => el.click());
      assert.equal(await page.locator('#quiz input:checked').count(), 0, `${quiz.file}: reset clears selections`);
      const nonEmptyWritten = await page.locator('#quiz input[type="text"], #quiz textarea').evaluateAll(
        nodes => nodes.filter(node => node.value !== '').length
      );
      assert.equal(nonEmptyWritten, 0, `${quiz.file}: reset clears written fields`);
      await submit(page, quiz);
      assertResult(await readResult(page, quiz), expectedFor(quiz, 'empty'), `${quiz.file} after reset`);
      results.push({ file: quiz.file, mode: 'afterReset', expected: expectedFor(quiz, 'empty'), actual: await readResult(page, quiz) });
    }
    pass('Exact numeric scoring', `${quiz.file}: empty, all wrong, all correct, one wrong, first-only, alternating${quiz.kind === 'legacy-objective-written' ? ', written completion/whitespace' : ''}${quiz.kind === 'legacy-mixed' ? ', written rule boundaries' : ''}${quiz.reset ? ', reset then empty rescore' : ''}`);
  }

  for (const quiz of fixture.quizzes) await runMutation(page, quiz);
  pass('Scoring mutation regression', `Seven in-memory scoring-formula mutations were rejected by exact numeric assertions: ${mutations.map(item => `${item.file} expected ${item.expectedScore}, mutated ${item.mutatedScore}`).join('; ')}`);

  assert.deepEqual(errors, [], 'No browser JavaScript or local HTTP errors');
  const report = { suite: 'c3-scoring-browser', date: new Date().toISOString(), status: 'PASS', sourceCommit: fixture.sourceCommit, checks, results, mutations, errors };
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
