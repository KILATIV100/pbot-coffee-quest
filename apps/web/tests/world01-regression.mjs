import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.QA_OUT||'qa-regression';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],bad=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
try{
 await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle'});
 const health=await (await page.request.get('http://127.0.0.1:3100/health')).json();assert.equal(await page.locator('meta[name=build]').getAttribute('content'),health.build);
 await page.locator('#playFirst').click();await page.getByRole('button',{name:'Рушаймо',exact:true}).click();await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>__PBOT_QA__.getMode()),'play');assert((await page.locator('#game').evaluate(c=>c.width))>0);
 const x=await page.evaluate(()=>__PBOT_QA__.getState().player.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(800);await page.keyboard.up('ArrowRight');assert((await page.evaluate(()=>__PBOT_QA__.getState().player.x))>x+100);
 const y=await page.evaluate(()=>__PBOT_QA__.getState().player.y);await page.keyboard.down('Space');await page.waitForTimeout(180);assert((await page.evaluate(()=>__PBOT_QA__.getState().player.y))<y-20);await page.keyboard.up('Space');await page.waitForTimeout(800);
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(100);assert((await page.evaluate(()=>__PBOT_QA__.getState().player.h))<74);await page.keyboard.up('ArrowDown');
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__PBOT_QA__.getMode()),'pause');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__PBOT_QA__.getMode()),'play');
 for(const key of ['hero','vitalii','pbot']){await page.locator('#menuBtn').click();await page.locator(`[data-character=${key}]`).click();await page.locator('#resumeBtn').click();assert.equal(await page.evaluate(()=>__PBOT_QA__.getMode()),'play');}
 await page.screenshot({path:out+'/desktop.png'});await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);const box=await page.locator('#game').boundingBox();assert(Math.abs(box.width/box.height-16/9)<.02);
 const before=await page.evaluate(()=>__PBOT_QA__.getState().player.x),button=await page.locator('[data-key=right]').boundingBox();await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();await page.waitForTimeout(350);await page.mouse.up();assert((await page.evaluate(()=>__PBOT_QA__.getState().player.x))>before+15);
 await page.screenshot({path:out+'/mobile.png'});assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,build:health.build,errors,bad,checks:['HTML/health identity','canvas size','real movement','jump','crouch hitbox','pause','menu/resume with 3 actors','16:9 mobile','pointer input']},null,2));
}finally{await fs.writeFile(out+'/console.json',JSON.stringify({errors,bad},null,2));await browser.close();}
