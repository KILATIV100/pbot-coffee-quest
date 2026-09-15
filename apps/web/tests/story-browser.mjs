import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const OUT=process.env.QA_OUT||'qa-story';await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});const report={checks:[],errors:[],httpErrors:[],scope:'World 01; real browser UI plus deterministic simulation input for long traversal'};
let page;
const check=(name,value)=>{report.checks.push({name,pass:!!value});assert.ok(value,name);};
async function shot(name){await page.waitForTimeout(150);await page.screenshot({path:`${OUT}/${name}.png`});}
async function open(context){page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({status:r.status(),url:r.url()});});await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle'});}
async function state(){return page.evaluate(()=>({player:__PBOT_QA__.getState()?.player,quest:__PBOT_QA__.getState()?.quest,beans:__PBOT_QA__.getState()?.scoreBeans,damage:__PBOT_QA__.getState()?.damageCount,mode:__PBOT_QA__.getMode(),save:__PBOT_QA__.save}));}
async function drive(target,jump=false){const result=await page.evaluate(({target,jump})=>{
 const qa=__PBOT_QA__,s=qa.getState(),p=s.player,I=qa.input;Object.keys(I).forEach(k=>I[k]=false);let hold=0,jumped=false;
 for(let i=0;i<60*90;i++){
  if(qa.getMode()!=='play')return {ok:false,reason:'not_play',mode:qa.getMode()};
  const dx=target-(p.x+p.w/2);I.left=dx< -6;I.right=dx>6;I.down=false;
  if(jump&&!jumped&&p.onGround){I.jumpPressed=true;hold=28;jumped=true;}
  const gap=s.gaps.find(g=>g.x>2500&&p.x+p.w>g.x-20&&p.x<g.x+g.w);
  if(gap&&p.onGround){I.jumpPressed=true;hold=28;}
  if(gap&&!p.onGround&&p.vy>0&&p.jumps===1){I.jumpPressed=true;hold=25;}
  I.jump=hold-->0;
  if(p.pulse<=0&&s.enemies.some(e=>!e.dead&&Math.abs(e.x-p.x)<175))I.actionPressed=true;
  qa.update(1/60);
  if(Math.abs(dx)<12&&p.onGround){Object.keys(I).forEach(k=>I[k]=false);for(let n=0;n<16;n++)qa.update(1/60);return {ok:true,x:p.x,y:p.y,beans:s.scoreBeans,quest:s.quest,damage:s.damageCount};}
 }
 Object.keys(I).forEach(k=>I[k]=false);return {ok:false,x:p.x,y:p.y,target,quest:s.quest,damage:s.damageCount};
 },{target,jump});report.checks.push({name:`traverse ${target}${jump?' jump':''}`, ...result});assert.ok(result.ok,JSON.stringify(result));await page.waitForTimeout(50);}
async function talk(label){await page.keyboard.press('KeyF');await page.locator('#storyDialog').waitFor({state:'visible'});if(label)await page.getByRole('button',{name:label,exact:true}).click();}
try{
 let context=await browser.newContext({viewport:{width:1440,height:900}});await open(context);
 check('build identity',await page.locator('meta[name=build]').getAttribute('content')==='world01-story-20260915-3');
 await page.locator('#playFirst').click();await page.locator('#storyDialog').waitFor({state:'visible'});await shot('01-intro-desktop');
 const before=(await state()).player.x;await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');check('dialog pauses player simulation',(await state()).player.x===before);
 await page.getByRole('button',{name:'Рушаймо',exact:true}).click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(600);check('real keyboard selects run animation',(await state()).player.animState==='run');await page.keyboard.up('ArrowRight');await page.waitForTimeout(450);
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(100);let st=await state();check('crouch state and hitbox',st.player.crouching&&st.player.h<st.player.standH&&st.player.animState==='crouch');await page.keyboard.up('ArrowDown');
 await drive(759);await talk();await shot('02-perkup-dialog');await page.getByRole('button',{name:'Пізніше',exact:true}).click();check('decline does not accept quest',(await state()).quest.phase===0);await talk('Допоможу');
 await drive(1100);check('beans earned by traversal',(await state()).beans>=8);await drive(759);await talk('Передати зерна й забрати заряд');check('PerkUp handed in',(await state()).quest.phase===2);
 await drive(1321);await talk('Знайду фрагменти');await drive(1510);await drive(1604,true);await drive(1838);check('three shards collected on route',(await state()).quest.shards.length===3);await drive(1321);await talk();await shot('03-news-story');await page.getByRole('button',{name:'Передати 3 фрагменти',exact:true}).click();
 await drive(1510);await drive(1604,true);await drive(1910);await drive(2336);await talk('Заберу посилку');
 await drive(2390,true);await drive(2480,true);await drive(2560,true);await drive(2681,true);check('parcel reached using jumps',(await state()).quest.parcel===true);await shot('04-parcel-on-scaffold');await drive(2336);await talk('Передати посилку');check('CHARME handed in',(await state()).quest.phase===6);
 await page.keyboard.press('KeyJ');await page.locator('#questJournal').waitFor({state:'visible'});await shot('05-journal');await page.keyboard.press('Escape');
 await drive(3234);await talk();await shot('06-terminal');await page.getByRole('button',{name:'ВІДНОВИТИ СИГНАЛ',exact:true}).click();check('terminal manually activated',(await state()).quest.phase===7);
 const earned=(await state()).save.tokens;await page.reload({waitUntil:'networkidle'});await page.locator('#resumeBtn').click();await page.waitForTimeout(200);st=await state();check('reload resumes phase and does not pay twice',st.quest.phase===7&&st.save.tokens===earned);check('all one-time reward receipts',Object.keys(st.save.questRewards).length===3);
 await drive(4470);await talk('ЗАВЕРШИТИ РОЗДІЛ');await page.locator('#completeScreen').waitFor({state:'visible'});await shot('07-chapter-complete');st=await state();check('chapter completed and next level unlocked',st.save.story01Complete&&st.save.unlocked>=2&&st.save.storyRun===null);
 await page.locator('#nextBtn').click();check('next level transition',(await page.locator('#levelCode').textContent())==='01-02');await context.close();
 // Character state and transparency inspection uses the same actor sheets as gameplay.
 for(const actor of ['pbot','hero','vitalii']){
  context=await browser.newContext({viewport:{width:1440,height:900}});await open(context);await page.locator(`[data-character=${actor}]`).click();await page.locator('#playFirst').click();await page.getByRole('button',{name:'Рушаймо',exact:true}).click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(700);await shot(`actor-${actor}-run`);check(actor+' running state',(await state()).player.animState==='run');await page.keyboard.up('ArrowRight');await page.waitForTimeout(400);await page.keyboard.down('ArrowDown');await page.waitForTimeout(100);await shot(`actor-${actor}-crouch`);await page.keyboard.up('ArrowDown');await page.keyboard.press('Space');await page.waitForTimeout(100);check(actor+' jump state',['jump','fall'].includes((await state()).player.animState));await context.close();
 }
 context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});await open(context);await page.locator('#playFirst').tap();await page.locator('#storyDialog').waitFor({state:'visible'});await shot('08-mobile-intro');
 let box=await page.locator('.dialog-card').boundingBox();check('mobile dialog fits viewport',box&&box.y>=0&&box.y+box.height<=390&&box.x>=0&&box.x+box.width<=844);
 await page.getByRole('button',{name:'Рушаймо',exact:true}).tap();const btn=await page.locator('[data-key=right]').boundingBox();await page.mouse.move(btn.x+btn.width/2,btn.y+btn.height/2);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();check('mobile pointer movement',(await state()).player.x>140);
 await drive(759);await page.locator('#interactBtn').tap();await shot('09-mobile-npc');await page.getByRole('button',{name:'Допоможу',exact:true}).tap();check('mobile interaction accepts quest',(await state()).quest.phase===1);
 await page.locator('#questTracker').tap();await shot('10-mobile-journal');await page.locator('#journalClose').tap();await context.close();
 check('no JavaScript exceptions',report.errors.length===0);check('no failed HTTP responses',report.httpErrors.length===0);
 report.pass=true;
}catch(e){report.pass=false;report.failure=String(e);if(page&&!page.isClosed()){try{report.lastState=await state();await shot('failure');}catch{}}process.exitCode=1;}
finally{await fs.writeFile(`${OUT}/result.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
