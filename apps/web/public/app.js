const API = window.__APP_CONFIG__?.apiBase || 'http://localhost:3001';
const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');

const localWorlds = [
  ['Розвилка','The Crossroads','#42d6c8'],['Парк Перемоги','Green Core','#64d66d'],['Приозерний','Old Park','#6dc7e8'],['Старі Бровари','Memory Streets','#d8a86b'],['Шевченків шлях','Memory Route','#8eb0ff'],['Ярмарок Броварів','Market Pulse','#ffb84d'],['Трамвай 23','Retro Transit','#f08f63'],['Аеродром','Sky Gate','#8fc9ff'],['Станція Бровари','Rail Junction','#b5b9c8'],['Торгмаш','Industrial Pulse','#d89055'],['Радіодистрикт','Signal Noise','#b96dff'],['Спорт-Сіті','Velocity','#ff667e'],['Термінал-Сіті','Urban Neon','#52e0c4'],['ЖК Майбутнього','Green Living','#7ae388'],['Future Brovary Core','City 20XX','#44d9ff']
].map((w,i)=>({id:i+1,name:w[0],subtitle:w[1],accent:w[2]}));

const characters = [
  {
    id:'pbot', name:'P-BOT', runFrames:6,
    preview:'/assets/characters/pbot/idle.webp', sheet:'/assets/characters/pbot/sheet.webp',
    frames:{idle:[45,191,213,424],'run-1':[288,200,244,405],'run-2':[552,202,244,402],'run-3':[819,206,246,396],'run-4':[1109,212,230,402],'run-5':[1369,222,244,392],'run-6':[1636,227,239,388],jump:[1900,154,254,408]}
  },
  {
    id:'brovary-hero', name:'Brovary Hero', runFrames:6,
    preview:'/assets/characters/brovary-hero/idle.webp', sheet:'/assets/characters/brovary-hero/sheet.webp',
    frames:{idle:[103,100,171,369],'run-1':[339,120,252,348],'run-2':[634,114,262,354],'run-3':[932,121,245,350],'run-4':[1215,125,263,347],'run-5':[52,541,261,353],'run-6':[354,541,246,346],crouch:[654,642,223,261],jump:[921,478,211,361],fall:[1158,517,322,340]}
  },
  {
    id:'vitalii', name:'Vitalii', runFrames:5,
    preview:'/assets/characters/vitalii/idle.webp', sheet:'/assets/characters/vitalii/sheet.webp',
    frames:{idle:[76,103,161,390],'run-1':[271,130,252,354],'run-2':[527,136,226,352],'run-3':[735,130,252,356],'run-4':[1000,132,227,353],'run-5':[1217,134,249,351],crouch:[191,634,207,253],jump:[498,517,205,354],fall:[778,538,323,310]}
  }
];

let worlds = localWorlds;
let selectedCharacter = characters[0];
let selectedWorld = worlds[0];
let spriteCache = new Map();
let phase = 'menu';
let startTime = 0;
let last = 0;
let runT = 0;
let lives = 3;
let player, level, camX=0;
let coyote=0, jumpBuffer=0, jumpsLeft=2, jumpHeld=0;
let landSquash=0, jumpSquash=0;
const keys = {left:false,right:false,down:false,jump:false,jumpPressed:false};

function image(src){
  if(spriteCache.has(src)) return spriteCache.get(src);
  const img = new Image(); img.src=src; spriteCache.set(src,img); return img;
}
characters.forEach(c=>image(c.preview));

function renderMenu(){
  $('#characters').innerHTML='';
  for(const c of characters){
    const b=document.createElement('button');
    b.className='character-card'+(c.id===selectedCharacter.id?' selected':'');
    b.innerHTML=`<img src="${c.preview}" alt=""><b>${c.name}</b>`;
    b.onclick=()=>{selectedCharacter=c;renderMenu()};
    $('#characters').appendChild(b);
  }
  $('#worlds').innerHTML='';
  for(const w of worlds){
    const b=document.createElement('button');
    b.className='world-card'+(w.id===selectedWorld.id?' selected':'');
    b.style.setProperty('--accent',w.accent);
    b.innerHTML=`<small>WORLD ${String(w.id).padStart(2,'0')}</small><b>${w.name}</b><small>${w.subtitle}</small>`;
    b.onclick=()=>{selectedWorld=w;renderMenu()};
    $('#worlds').appendChild(b);
  }
}

async function loadRemoteData(){
  try{
    const r=await fetch(`${API}/api/worlds`); if(r.ok){const j=await r.json(); if(j.worlds?.length){worlds=j.worlds;selectedWorld=worlds[0]}}
  }catch{}
  renderMenu();
}

const backgrounds={1:'/assets/backgrounds/brovary-city.webp'};

function makeLevel(worldId){
  const width=3600;
  const groundY=760;
  const seed=worldId*991;
  const rnd=(n)=>{const x=Math.sin(seed+n*12.9898)*43758.5453;return x-Math.floor(x)};
  const platforms=[{x:0,y:groundY,w:620,h:80},{x:720,y:groundY-40,w:420,h:120},{x:1230,y:groundY,w:400,h:80},{x:1730,y:groundY-80,w:450,h:160},{x:2300,y:groundY,w:460,h:80},{x:2880,y:groundY-35,w:720,h:115}];
  for(let i=0;i<9;i++) platforms.push({x:420+i*330,y:560-Math.floor(rnd(i)*150),w:150+Math.floor(rnd(i+20)*90),h:26,type:i%4===0?'moving':'solid',phase:rnd(i+70)*6.28});
  const beans=[]; for(let i=0;i<20;i++) beans.push({x:180+i*165,y:420+Math.floor(rnd(i+100)*210),got:false,bob:rnd(i+200)*6.28});
  const hazards=[{x:620,y:groundY+45,w:100,h:30},{x:1140,y:groundY+45,w:90,h:30},{x:1630,y:groundY+45,w:100,h:30},{x:2180,y:groundY+45,w:120,h:30},{x:2760,y:groundY+45,w:120,h:30}];
  const checks=[{x:1320,y:groundY-48,on:false},{x:2420,y:groundY-48,on:false}];
  return {width,height:960,groundY,platforms,beans,hazards,checks,finish:{x:3460,y:groundY-120,w:40,h:120},spawn:{x:110,y:groundY-58}};
}

function resetLevel(){
  level=makeLevel(selectedWorld.id); lives=3; camX=0; startTime=performance.now(); runT=0;
  player={x:level.spawn.x,y:level.spawn.y,w:42,h:58,standH:58,vx:0,vy:0,onGround:false,crouching:false,spawn:{...level.spawn}};
  coyote=0;jumpBuffer=0;jumpsLeft=2;jumpHeld=0;landSquash=0;jumpSquash=0;
  updateHud();
}
function updateHud(){
  $('#beans').textContent=`${level.beans.filter(b=>b.got).length}/${level.beans.length}`;
  $('#lives').textContent=lives;
  $('#worldLabel').textContent=`${String(selectedWorld.id).padStart(2,'0')} · ${selectedWorld.name}`;
}

function rects(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y}
function hurt(){
  lives--; updateHud();
  if(lives<=0){showResult(false);return}
  player.x=player.spawn.x;player.y=player.spawn.y;player.vx=0;player.vy=0;
}

function setCrouch(on){
  if(on && player.onGround){player.crouching=true;player.h=34;return}
  if(!on && player.crouching){
    const test={x:player.x,y:player.y-(player.standH-player.h),w:player.w,h:player.standH};
    if(!level.platforms.some(p=>rects(test,p))){player.y-=player.standH-player.h;player.h=player.standH;player.crouching=false}
  }
}

function update(dt){
  if(phase!=='play')return;
  setCrouch(keys.down);
  const accel=player.crouching?1500:3100, maxSp=player.crouching?95:250, friction=2100;
  const gravUp=1800, gravDown=2450, jumpV=-720, dJumpV=-565;
  let want=(keys.right?1:0)-(keys.left?1:0);
  if(want){player.vx+=want*accel*dt;player.vx=Math.max(-maxSp,Math.min(maxSp,player.vx));}
  else {const f=friction*dt;player.vx=Math.abs(player.vx)<=f?0:player.vx-Math.sign(player.vx)*f}

  player.vy+=(player.vy<0?gravUp:gravDown)*dt; player.vy=Math.min(player.vy,980);
  if(player.onGround){coyote=.14;jumpsLeft=2}else coyote=Math.max(0,coyote-dt);
  if(keys.jumpPressed){keys.jumpPressed=false;jumpBuffer=.12}
  jumpBuffer=Math.max(0,jumpBuffer-dt);
  if(jumpBuffer>0&&!player.crouching&&(coyote>0||jumpsLeft>0)){
    const grounded=coyote>0; jumpBuffer=0;
    if(!grounded)jumpsLeft=Math.max(0,jumpsLeft-1); else jumpsLeft=1;
    player.vy=grounded?jumpV:dJumpV;player.onGround=false;coyote=0;jumpHeld=grounded?.22:.12;jumpSquash=.12;
  }
  if(keys.jump&&jumpHeld>0&&player.vy<0){player.vy-=520*dt;jumpHeld-=dt}else jumpHeld=0;

  for(const p of level.platforms){if(p.type==='moving')p._y=p.y+Math.sin(performance.now()/700+p.phase)*36;else p._y=p.y}

  player.x+=player.vx*dt; player.x=Math.max(0,Math.min(level.width-player.w,player.x));
  const prevY=player.y; player.y+=player.vy*dt; player.onGround=false;
  for(const p of level.platforms){
    const py=p._y??p.y; const pr={x:p.x,y:py,w:p.w,h:p.h};
    if(player.vy>=0 && prevY+player.h<=py+12 && rects(player,pr)){
      player.y=py-player.h;player.vy=0;player.onGround=true;landSquash=.11;
    } else if(player.vy<0 && prevY>=py+p.h-10 && rects(player,pr)){
      player.y=py+p.h;player.vy=40;
    }
  }

  if(Math.abs(player.vx)>18&&player.onGround&&!player.crouching)runT+=dt*10;
  for(const b of level.beans){
    b.bob+=dt*4;if(!b.got&&rects(player,{x:b.x,y:b.y+Math.sin(b.bob)*5,w:24,h:24})){b.got=true;updateHud()}
  }
  if(level.hazards.some(h=>rects(player,h)))hurt();
  for(const c of level.checks){if(!c.on&&rects(player,{x:c.x,y:c.y,w:40,h:50})){c.on=true;player.spawn={x:c.x,y:c.y-10}}}
  if(rects(player,level.finish)){showResult(true);return}
  if(player.y>1030)hurt();
  camX += ((player.x-145)-camX)*Math.min(1,dt*5);camX=Math.max(0,Math.min(level.width-canvas.width,camX));
  landSquash=Math.max(0,landSquash-dt);jumpSquash=Math.max(0,jumpSquash-dt);
}

function currentFrame(){
  let state='idle';
  if(player.crouching) state=selectedCharacter.frames.crouch?'crouch':'idle';
  else if(!player.onGround) state=(player.vy<80||!selectedCharacter.frames.fall)?'jump':'fall';
  else if(Math.abs(player.vx)>18) state=`run-${1+(Math.floor(runT)%selectedCharacter.runFrames)}`;
  const rect=selectedCharacter.frames[state]||selectedCharacter.frames.idle;
  return {img:image(selectedCharacter.sheet),rect};
}

function drawBackground(){
  const bgPath=backgrounds[selectedWorld.id]||backgrounds[1]; const bg=image(bgPath);
  if(bg.complete&&bg.naturalWidth){
    const h=canvas.height, ratio=h/bg.naturalHeight, tileW=bg.naturalWidth*ratio;
    const parallax=(camX*.18)%tileW;
    for(let x=-parallax-tileW;x<canvas.width+tileW;x+=tileW)ctx.drawImage(bg,x,0,tileW,h);
    ctx.fillStyle='rgba(3,10,13,.10)';ctx.fillRect(0,0,canvas.width,canvas.height);
  } else {
    const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,selectedWorld.accent||'#44d9ff');g.addColorStop(.5,'#79c7b2');g.addColorStop(1,'#19352e');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
  }
}

function draw(){
  if(phase!=='play')return;
  ctx.clearRect(0,0,canvas.width,canvas.height); drawBackground();
  ctx.save();ctx.translate(-camX,0);
  ctx.fillStyle='rgba(15,29,32,.22)';for(let x=0;x<level.width;x+=260){const h=70+((x/10)%90);ctx.fillRect(x,690-h,180,h)}
  for(const p of level.platforms){const py=p._y??p.y;ctx.fillStyle=p.type==='moving'?'#2a595b':'#263b39';ctx.fillRect(p.x,py,p.w,p.h);ctx.fillStyle=selectedWorld.accent||'#4ee2d3';ctx.fillRect(p.x,py,p.w,5)}
  ctx.fillStyle='#ff5b63';for(const h of level.hazards){const count=Math.ceil(h.w/20);for(let i=0;i<count;i++){const x=h.x+i*h.w/count;ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+h.w/count/2,h.y);ctx.lineTo(x+h.w/count,h.y+h.h);ctx.fill()}}
  for(const b of level.beans){if(b.got)continue;const y=b.y+Math.sin(b.bob)*5;ctx.fillStyle='#d59b48';ctx.beginPath();ctx.ellipse(b.x+12,y+12,9,12,.4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6f4321';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x+11,y+3);ctx.quadraticCurveTo(b.x+14,y+12,b.x+10,y+21);ctx.stroke()}
  for(const c of level.checks){ctx.strokeStyle=c.on?'#4ee2d3':'#798388';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(c.x,c.y+50);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.fillStyle=c.on?'#4ee2d3':'#798388';ctx.fillRect(c.x,c.y,28,18)}
  const f=level.finish;ctx.strokeStyle=selectedWorld.accent||'#4ee2d3';ctx.lineWidth=7;ctx.strokeRect(f.x,f.y,f.w,f.h);ctx.fillStyle='rgba(78,226,211,.15)';ctx.fillRect(f.x,f.y,f.w,f.h);

  const frame=currentFrame(); const spr=frame.img; const [fx,fy,fw,fh]=frame.rect;
  const drawH=player.crouching?72:104; const ratio=fw/fh; const drawW=drawH*ratio;
  let sx=1,sy=1;if(landSquash>0){sx=1.08;sy=.92}if(jumpSquash>0){sx=.93;sy=1.07}
  ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h);ctx.scale(sx,sy);if(player.vx<0)ctx.scale(-1,1);
  if(spr.complete&&spr.naturalWidth)ctx.drawImage(spr,fx,fy,fw,fh,-drawW/2,-drawH,drawW,drawH);else{ctx.fillStyle='#fff';ctx.fillRect(-18,-58,36,58)}
  ctx.restore();
  ctx.restore();
}

function frame(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(frame)}
requestAnimationFrame(frame);

async function showResult(win){
  phase='result';
  const got=level.beans.filter(b=>b.got).length; const timeMs=Math.round(performance.now()-startTime); const score=Math.max(0,got*100+Math.max(0,20000-Math.round(timeMs/10))+(win?2500:0));
  $('#result').classList.remove('hidden');
  $('#result').innerHTML=`<div class="result-card"><h2>${win?'Світ пройдено':'Систему перезапущено'}</h2><p>☕ ${got}/${level.beans.length} · ${Math.round(timeMs/1000)} с</p><h3>${score} pts</h3><button id="again">${win?'Ще раз':'Повторити'}</button><button id="toMenu">До мапи</button></div>`;
  $('#again').onclick=()=>{ $('#result').classList.add('hidden'); resetLevel(); phase='play'; };
  $('#toMenu').onclick=backToMenu;
  if(win){try{await fetch(`${API}/api/runs`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({playerName:'Player',characterId:selectedCharacter.id,worldId:selectedWorld.id,beans:got,timeMs,score})})}catch{}}
}

function startGame(){
  $('#menu').classList.add('hidden');$('#gameShell').classList.remove('hidden');$('#result').classList.add('hidden');
  resetLevel();phase='play';last=performance.now();
}
function backToMenu(){phase='menu';$('#gameShell').classList.add('hidden');$('#menu').classList.remove('hidden');$('#result').classList.add('hidden');renderMenu()}
$('#play').onclick=startGame;$('#back').onclick=backToMenu;

const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ArrowUp:'jump',KeyW:'jump',Space:'jump'};
addEventListener('keydown',e=>{const k=keyMap[e.code];if(!k)return;e.preventDefault();if(k==='jump'&&!keys.jump)keys.jumpPressed=true;keys[k]=true});
addEventListener('keyup',e=>{const k=keyMap[e.code];if(!k)return;e.preventDefault();keys[k]=false});
for(const btn of document.querySelectorAll('[data-key]')){
  const k=btn.dataset.key;const down=e=>{e.preventDefault();btn.classList.add('held');if(k==='jump'&&!keys.jump)keys.jumpPressed=true;keys[k]=true};const up=e=>{e.preventDefault();btn.classList.remove('held');keys[k]=false};
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up);
}

loadRemoteData();
