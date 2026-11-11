import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'grade8-unit1-lesson3';
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
  for(const suffix of ['', '-pupil-book','-workbook','-vocabulary','-test']) {
    await go(suffix); assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),`${suffix}: desktop overflow`);
  }
  await go('-pupil-book');
  await step('Reading B: Choose the answer');
  await page.locator('#sb22-b1-c').check(); await page.locator('#sb22-b2-a').check(); await page.locator('#sb22-b3-c').check();
  await page.locator('#sb-reading-b .check-practice').click();
  assert.match(await page.locator('#sb-reading-b .practice-feedback').innerText(),/2 of 2/);
  assert.equal(await page.locator('#sb22-b2-a').getAttribute('aria-invalid'),null);
  await page.reload(); await step('Reading B: Choose the answer');
  assert.ok(await page.locator('#sb22-b2-a').isChecked());
  await page.locator('#sb-reading-b [data-a]').click(); assert.ok(await page.locator('#sb-reading-b-guidance').isVisible());
  await page.locator('#sb-reading-b button[type=reset]').click(); await page.waitForTimeout(30);
  assert.ok(!(await page.locator('#sb22-b2-a').isChecked())); assert.ok(!(await page.locator('#sb-reading-b-guidance').isVisible()));
  await step('Vocabulary: Find and complete');
  const words=['amusement','confirmed','arrival','souvenirs','accompanied','interaction'];
  for(let i=0;i<words.length;i++)await page.locator(`#sb22-v${i+1}`).fill(words[i]);
  await page.locator('#sb-vocabulary .check-practice').click(); assert.match(await page.locator('#sb-vocabulary .practice-feedback').innerText(),/6 of 6/);
  await step('Listening: An innovation'); await page.locator('#sb24-mc1-a').check();
  assert.equal(await page.locator('#sb-listening .check-practice').count(),0);
  await page.reload(); await step('Listening: An innovation'); assert.ok(await page.locator('#sb24-mc1-a').isChecked());
  console.log('PASS Student’s Book checking, invalid distance exclusion, guidance, resets, word search answers and unscored listening persistence');
  await go('-workbook'); await step('Vocabulary: Crossword');
  for(const [n,answer] of [[1,'hemisphere'],[2,'opportunity'],[3,'fascinated'],[4,'settled'],[5,'exception'],[6,'continent']]) await page.locator(`#wb11-crossword-${n}`).fill(answer);
  await page.locator('#wb-crossword .check-practice').click(); assert.match(await page.locator('#wb-crossword .practice-feedback').innerText(),/6 of 6/);
  await step('Grammar: Present perfect');
  for(const [i,a] of ["have not planned",'have you been',"hasn't seen",'has just started','has he spoken'].entries())await page.locator(`#wb12-perfect-${i+1}`).fill(a);
  await page.locator('#wb-perfect .check-practice').click();assert.match(await page.locator('#wb-perfect .practice-feedback').innerText(),/5 of 5/);
  await step('Writing: Your journey'); await page.locator('#wb13-email').fill('My personal draft.');
  await go('-vocabulary'); await go('-workbook'); await step('Writing: Your journey'); assert.equal(await page.locator('#wb13-email').inputValue(),'My personal draft.');
  await step('Listening: Sami and Sally'); assert.equal(await page.locator('#wb-listening .check-practice').count(),0);
  console.log('PASS Workbook crossword, contractions, personal draft persistence and unscored listening');
  await go('-test');
  for(const [i,q] of fixture.assessment.entries()) {
    if(i) await page.locator('.content-nav-links button').nth(i).click();
    await page.locator(`#quiz-${i+1}-${q.answer}`).check();
  }
  await page.locator('#quiz button[type=submit]').click();assert.match(await page.locator('#quiz-result').innerText(),/12 \/ 12/);
  await page.reload(); assert.ok(await page.locator(`#quiz-1-${fixture.assessment[0].answer}`).isChecked()); assert.match(await page.locator('#quiz-result').innerText(),/12 \/ 12/);
  await page.locator('#teacher-password').fill('wrong'); await page.locator('#unlock-teacher').click();assert.ok(await page.locator('#answer-key').isHidden());
  await page.locator('#teacher-password').fill('somer173');await page.locator('#unlock-teacher').click();assert.ok(await page.locator('#answer-key').isVisible());
  await page.locator('#quiz button[type=reset]').click(); await page.waitForTimeout(30);assert.ok(!(await page.locator(`#quiz-1-${fixture.assessment[0].answer}`).isChecked()));
  console.log('PASS independent test scoring, persistence, reset and disclosed teacher gate');
  await page.setViewportSize({width:320,height:740});
  for(const suffix of ['', '-pupil-book','-workbook','-vocabulary','-test']) {
    await go(suffix); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),`${suffix}: mobile overflow`);
  }
  assert.deepEqual(errors,[]);console.log('PASS five pages desktop/mobile layout and no page errors');
} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
