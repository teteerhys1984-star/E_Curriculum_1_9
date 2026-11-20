import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url), root = process.cwd();
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}); fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}/`, base=process.env.LESSON5_PUBLISHED ? 'grade8-unit1-lesson5' : 'docs/grade8-unit1-lesson5-draft/grade8-unit1-lesson5';
let browser;
try {
  const pkg=require('@sparticuz/chromium'), dir=path.resolve(path.dirname(require.resolve('@sparticuz/chromium')),'..');
  const libs=await pkg.inflate(path.join(dir,'bin','al2023.tar.br'));pkg.setupLambdaEnvironment(path.join(libs,'lib'));
  browser=await chromium.launch({headless:true,executablePath:await pkg.default.executablePath(),args:pkg.default.args});
  const page=await browser.newPage({viewport:{width:320,height:740}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const fixtures={
    'pupil-book':{'sb34':null,'sb36-match':['b','c','e','a','d'],'sb36-reading':null,'sb36-compare':null,'sb37-match':['c','a','b'],'sb37-fill':['would','strike','if','took'],'sb38-listen':null,'sb39-pronunciation':null,'sb39-writing':null},
    'workbook':{'wb18-speaking':null,'wb19-match':['c','a','b'],'wb19-reading':null,'wb19-vocab':['bored','lonely','happy','frustrations','emotions'],'wb20-match':['c','d','b','a'],'wb20-choose':['wouldn’t','didn’t spend','shared'],'wb20-fill':['would visit','would be','would feel','would not be'],'wb21-listen':null,'wb21-writing':null},
    'vocabulary':{'vocab-practice':['aggressive','retain','grief','evaluate','humiliate']}
  };
  let total=0;
  for(const [suffix,forms] of Object.entries(fixtures)){
    await page.goto(`${origin}${base}-${suffix}.html`);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${suffix} overflow at 320`);
    const actual=await page.locator('form.practice-form').evaluateAll(els=>els.map(el=>el.id));
    assert.deepEqual(actual,Object.keys(forms));
    for(const [id,answers] of Object.entries(forms)){
      const selector='#'+id;
      const controls=page.locator(`${selector} input[name], ${selector} select[name], ${selector} textarea[name]`);
      assert.ok(await controls.count()>0,`${id}: controls`);
      const unlabeled=await controls.evaluateAll(els=>els.filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')).map(el=>el.id));
      assert.deepEqual(unlabeled,[],`${id}: unlabeled`);
      if(answers){
        assert.equal(await controls.count(),answers.length,id);
        for(let i=0;i<answers.length;i++) await controls.nth(i).evaluate((el,answer)=>{
          el.value=el.tagName==='SELECT' ? Array.from(el.options).find(o=>o.value && o.value!==answer).value : 'definitely wrong';
          el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
        },answers[i]);
        await page.locator(`${selector} .check-practice`).evaluate(el=>el.click());
        assert.match(await page.locator(`${selector} .practice-feedback`).textContent(),/^0 of /,`${id}: wrong score`);
        for(let i=0;i<answers.length;i++) await controls.nth(i).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},answers[i]);
        await page.locator(`${selector} .check-practice`).evaluate(el=>el.click());
        assert.match(await page.locator(`${selector} .practice-feedback`).textContent(),new RegExp(`^${answers.length} of ${answers.length} checked`),`${id}: correct score`);
        await controls.first().evaluate(el=>{el.value='';el.dispatchEvent(new Event('change',{bubbles:true}));});
        await page.locator(`${selector} .check-practice`).evaluate(el=>el.click());
        assert.match(await page.locator(`${selector} .practice-feedback`).textContent(),new RegExp(`^${answers.length-1} of ${answers.length} checked`),`${id}: blank score`);
      } else {
        assert.equal(await page.locator(`${selector} .check-practice`).count(),0,`${id}: open/audio form must not be scored`);
        for(let i=0;i<await controls.count();i++) await controls.nth(i).evaluate(el=>{el.value=el.tagName==='SELECT'?el.options[1].value:'personal response';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
      }
      if (process.env.LESSON5_PUBLISHED && id.endsWith('-writing')) {
        const model = page.locator(`${selector} details[data-writing-kind="open"]`);
        assert.ok(fs.existsSync(await model.getAttribute('data-source')));
        assert.doesNotMatch(await model.innerText(), /Teacher guidance|answer key/i);
        await model.locator('summary').evaluate(el => el.click());
        assert.equal(await model.evaluate(el => el.open), true);
        assert.match(await model.textContent(), id === 'sb39-writing' ? /Hi Sami,If I were you/ : /Hi Sarah,Why don’t you/);
        assert.equal(await controls.first().inputValue(), 'personal response');
        await controls.first().evaluate(el => { el.value += ' revised'; el.dispatchEvent(new Event('input')); });
      }
      const expected=await controls.evaluateAll(els=>els.map(el=>el.value));
      await page.reload();
      assert.deepEqual(await controls.evaluateAll(els=>els.map(el=>el.value)),expected,`${id}: restored`);
      await page.locator(`${selector} button[type=reset]`).evaluate(el=>el.click()); await page.waitForTimeout(20);
      assert.ok((await controls.evaluateAll(els=>els.map(el=>el.value))).every(x=>x===''),`${id}: reset`);
      total++;
    }
  }
  for (const width of [320,390,768,1366]) {
    await page.setViewportSize({width,height:844});
    for (const suffix of ['', '-pupil-book','-workbook','-vocabulary','-test']) {
      await page.goto(`${origin}${base}${suffix}.html`);
      const buttons=page.locator('.content-nav-links button');
      for(let i=0;i<await buttons.count();i++){
        await buttons.nth(i).click();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${suffix}, step ${i+1}, width ${width}: overflow`);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${suffix}, width ${width}: overflow`);
    }
  }
  await page.goto(`${origin}${base}.html`);
  await page.keyboard.press('Tab');
  const focusStyle=await page.evaluate(()=>{const el=document.activeElement;const s=getComputedStyle(el);return {tag:el.tagName,visible:el.matches(':focus-visible'),outline:s.outlineStyle,width:s.outlineWidth};});
  assert.ok(['A','BUTTON'].includes(focusStyle.tag) && focusStyle.visible && focusStyle.outline!=='none' && parseFloat(focusStyle.width)>0,'keyboard focus must be visible');
  await page.goto(`${origin}${base}-pupil-book.html`);
  // Navigate with keys only from a focused step button into a printed match.
  const step = page.getByRole('button', {name:'Reading tasks and Vocabulary', exact:true}).first();
  await step.focus(); await page.keyboard.press('Enter');
  const match = page.locator('#sb36-match-1');
  await match.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  assert.equal(await match.inputValue(),'b');
  assert.ok(await match.evaluate(el=>el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'));
  await page.locator('#sb36-match button[type=reset]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(30);
  assert.equal(await match.inputValue(),'');
  await page.goto(`${origin}${base}-pupil-book.html`);
  await page.evaluate(()=>localStorage.setItem('efc_grade8_unit1_lesson5_v1:pupil-book',JSON.stringify({'sb38-listen':{'sb38-listen-1':'Sandy'}})));
  await page.reload();
  assert.equal(await page.locator('#sb38-listen-1').inputValue(),'Sandy','earlier free-text response is retained after conversion to select');
  await page.locator('#sb38-listen button[type=reset]').evaluate(el=>el.click());
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#sb38-listen-1 option[data-previous-response]').count(),0,'reset removes migrated response');
  await page.goto(`${origin}${base}-test.html`);
  await page.locator('#teacher-password').focus(); await page.keyboard.type('somer173'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#answer-key').isVisible(),true); await page.waitForTimeout(10); assert.equal(await page.locator('#unlock-teacher').getAttribute('aria-expanded'),'true'); await page.locator('#close-teacher').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#answer-key').isVisible(),false); await page.waitForTimeout(10); assert.equal(await page.locator('#unlock-teacher').getAttribute('aria-expanded'),'false'); assert.equal(await page.evaluate(()=>document.activeElement.id),'unlock-teacher');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${total} draft activity forms: all controls labelled, persistence/reset, checked and unscored forms; teacher gate keyboard operation`);
} finally {await browser?.close();await new Promise(r=>server.close(r));}
