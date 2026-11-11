import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'grade8-unit1-lesson4';
const fixture = JSON.parse(fs.readFileSync(path.join(root,`tests/${slug}-fixture.json`),'utf8'));
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2'};
  res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}); fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  let options = {headless:true};
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  else if (process.platform==='linux') {
    const pkg=require('@sparticuz/chromium'); const dir=path.resolve(path.dirname(require.resolve('@sparticuz/chromium')),'..');
    const libs=await pkg.inflate(path.join(dir,'bin','al2023.tar.br'));pkg.setupLambdaEnvironment(path.join(libs,'lib'));
    options={...options,executablePath:await pkg.default.executablePath(),args:pkg.default.args};
  }
  browser=await chromium.launch(options);
  const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const go=async suffix=>{await page.goto(origin+slug+suffix+'.html',{waitUntil:'load'});};
  const step=async text=>page.getByRole('button',{name:text,exact:true}).first().click();

  // 1. All five pages load at desktop width with no overflow.
  for(const suffix of ['', '-pupil-book','-workbook','-vocabulary','-test']) {
    await go(suffix); assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),`${suffix}: desktop overflow`);
  }

  // 2. Student's Book: scored True/False, scored reported-speech choices, and the audio task that must stay unscored.
  await go('-pupil-book');
  await step('Key words and Task A: True or False');
  await page.locator('#sb27-tf1-b').check(); await page.locator('#sb27-tf2-b').check();
  await page.locator('#sb27-tf3-b').check(); await page.locator('#sb27-tf4-a').check();
  await page.locator('#sb-tf .check-practice').click();
  assert.match(await page.locator('#sb-tf .practice-feedback').innerText(),/4 of 4/);
  await page.reload(); await step('Key words and Task A: True or False');
  assert.ok(await page.locator('#sb27-tf4-a').isChecked(),'Student’s Book answers persist');
  await page.locator('#sb-tf [data-a]').click(); assert.ok(await page.locator('#sb-tf-guidance').isVisible());
  await page.locator('#sb-tf button[type=reset]').click(); await page.waitForTimeout(30);
  assert.ok(!(await page.locator('#sb27-tf4-a').isChecked())); assert.ok(!(await page.locator('#sb-tf-guidance').isVisible()));

  // The printed brackets make this task genuinely checkable, so it is scored.
  await step('Grammar B: Select the correct form');
  await page.locator('#sb28-b1-a').check(); await page.locator('#sb28-b2-b').check();
  await page.locator('#sb28-b3-b').check(); await page.locator('#sb28-b4-b').check();
  await page.locator('#sb-reported-b .check-practice').click();
  assert.match(await page.locator('#sb-reported-b .practice-feedback').innerText(),/4 of 4/,'reported-speech bracket key');
  await page.reload(); await step('Grammar B: Select the correct form');
  assert.ok(await page.locator('#sb28-b4-b').isChecked(),'grammar choices persist');

  await step('Listening: Check-in at a hotel room');
  await page.locator('#sb28-lb1-a').check();
  assert.equal(await page.locator('#sb-listening .check-practice').count(),0,'the listening task must never be scored');
  const bundle = await page.evaluate(()=>document.body.innerText);
  assert.match(bundle,/No recording or transcript was supplied/,'the missing-audio limitation must be stated');
  assert.ok(!/Correct\.|Score:/.test(await page.locator('#sb-listening').innerText()),'no invented listening key');
  await page.reload(); await step('Listening: Check-in at a hotel room');
  assert.ok(await page.locator('#sb28-lb1-a').isChecked(),'unscored selections still persist');
  console.log('PASS Student’s Book scoring, persistence, reveals, resets and the unscored audio task');

  // 3. Workbook: the corrected page-15 vocabulary matching, the corrected past-perfect gaps,
  //    and the corrected nine-gap reported-speech paragraph.
  await go('-workbook'); await step('Vocabulary: Match the words with their definitions');
  for(const [n,a] of [['1','c'],['2','d'],['3','a'],['4','e'],['5','b']]) await page.locator(`#wb15-voc${n}`).selectOption(a);
  await page.locator('#wb-vocabulary .check-practice').click();
  assert.match(await page.locator('#wb-vocabulary .practice-feedback').innerText(),/5 of 5/,'printed matching key');

  await step('Task B: Complete with the past perfect');
  for(const [n,a] of [['b1','had cleaned'],['b2','had left'],['b3','had had'],['b4','had broken'],['b5a','had'],['b5b','finished']])
    await page.locator(`#wb16-${n}`).fill(a);
  await page.locator('#wb-grammar-b .check-practice').click();
  assert.match(await page.locator('#wb-grammar-b .practice-feedback').innerText(),/6 of 6/,'past perfect key: four single gaps plus the two gaps of sentence 5');

  await step('Task D: Dialogue into reported speech');
  const gaps = ['needed','was','had never been','had stolen','was','hadn’t got','didn’t want','was trying','was going'];
  for(let i=0;i<9;i++) await page.locator(`#wb17-d${i+1}`).fill(gaps[i]);
  await page.reload(); await step('Task D: Dialogue into reported speech');
  assert.equal(await page.locator('#wb17-d9').inputValue(),'was going','all nine gaps persist');
  await page.locator('#wb-dialogue [data-a]').click();
  assert.match(await page.locator('#wb-dialogue-guidance').innerText(),/the book prints no key/,'model completion is labelled as guidance');
  assert.equal(await page.locator('#wb-dialogue .check-practice').count(),0,'the dialogue stays unscored');

  await step('Writing: An invitation and the Keep in mind box');
  await page.locator('#wb17-invitation').fill('Dear friends, join me by the sea …');
  await go('-vocabulary'); await go('-workbook'); await step('Writing: An invitation and the Keep in mind box');
  assert.equal(await page.locator('#wb17-invitation').inputValue(),'Dear friends, join me by the sea …','personal draft persists across pages');

  await step('Listening: Carl talking to Lucy');
  assert.equal(await page.locator('#wb-listening .check-practice').count(),0,'Workbook listening must never be scored');
  assert.match(await page.locator('#wb-listening-step').innerText(),/no recording or transcript was supplied/i,'the Workbook states the audio limitation');
  console.log('PASS Workbook matching, past perfect, nine-gap dialogue, writing persistence and unscored listening');

  // 4. Vocabulary page: Arabic renders inside the marked cells only, and practice scores.
  await go('-vocabulary');
  const arabic = await page.evaluate(()=>{
    const cells=[...document.querySelectorAll('.ar[lang="ar"][dir="rtl"]')];
    const sample=cells[0];
    return {count:cells.length, rtl:getComputedStyle(sample).direction, family:getComputedStyle(sample).fontFamily};
  });
  assert.equal(arabic.count,129,'15 listed + 114 additional Arabic meanings');
  assert.equal(arabic.rtl,'rtl'); assert.match(arabic.family,/Noto Sans Arabic/);
  await step('3 · Practice the vocabulary');
  const vocabKey={1:'b',2:'a',3:'c',4:'b',5:'a',6:'c',7:'b',8:'a'};
  for(const [n,a] of Object.entries(vocabKey)) await page.locator(`#vocab-p${n}-${a}`).check();
  await page.locator('#vocab-practice .check-practice').click();
  assert.match(await page.locator('#vocab-practice .practice-feedback').innerText(),/8 of 8/,'vocabulary practice key');
  const audit = await page.locator('#vocab-audit-step').innerText();
  assert.match(audit,/114/,'the audit page states the real additional count');
  assert.match(await page.locator('#vocab-textbook-step').innerText(),/15 items/,'the listed count is stated');
  console.log('PASS Vocabulary Arabic rendering, 129 marked meanings, practice scoring and audit totals');

  // 5. Independent test: scoring, persistence, reset and the disclosed teacher gate.
  await go('-test');
  for(let i=0;i<fixture.assessment.length;i++) {
    if(i) await page.locator('.content-nav-links button').nth(i).click();
    await page.locator(`#quiz-${i+1}-${fixture.assessment[i].answer}`).check();
  }
  await page.locator('#quiz button[type=submit]').click();
  assert.match(await page.locator('#quiz-result').innerText(),/14 \/ 14/,'all fourteen keyed answers score');
  await page.reload();
  assert.ok(await page.locator(`#quiz-1-${fixture.assessment[0].answer}`).isChecked());
  assert.match(await page.locator('#quiz-result').innerText(),/14 \/ 14/);
  assert.equal(await page.locator('#answer-key').isVisible(),false,'the key is hidden before the gate');
  await page.locator('#teacher-password').fill('wrong'); await page.locator('#unlock-teacher').click();
  assert.ok(await page.locator('#answer-key').isHidden(),'a wrong password does not open the key');
  await page.locator('#teacher-password').fill('somer173'); await page.locator('#unlock-teacher').click();
  assert.ok(await page.locator('#answer-key').isVisible(),'the correct password opens the key');
  const keyText = await page.locator('.teacher-key').innerText();
  assert.equal((keyText.match(/\n/g) || []).length + 1, 14,'the key lists all fourteen items');
  await page.locator('#quiz button[type=reset]').click(); await page.waitForTimeout(30);
  assert.ok(!(await page.locator(`#quiz-1-${fixture.assessment[0].answer}`).isChecked()),'reset clears selections');
  console.log('PASS independent test scoring, persistence, reset and the disclosed teacher gate');

  // 6. Mobile layout at 320×740 and keyboard operability of the reveal controls.
  await page.setViewportSize({width:320,height:740});
  for(const suffix of ['', '-pupil-book','-workbook','-vocabulary','-test']) {
    await go(suffix); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),`${suffix}: mobile overflow`);
  }
  await go('-workbook');
  await step('Vocabulary: Match the words with their definitions');
  const reveal = page.locator('#wb-vocabulary [data-a]');
  await reveal.focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('#wb-vocabulary-guidance').isVisible(),'the reveal control works from the keyboard');
  assert.equal(await reveal.getAttribute('aria-expanded'),'true','aria-expanded tracks the reveal');
  assert.deepEqual(errors,[],'no page errors or failed local requests');
  console.log('PASS five pages at 320×740 with no overflow, keyboard reveals and no console or network errors');
} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
