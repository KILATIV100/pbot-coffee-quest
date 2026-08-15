const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const VW=960, VH=540, WORLD=5400, GROUND=472;
const BUILD='rc1-01-01';

const PATHS={
  bg:`/assets/stage2/rc1/bg-loop.webp?v=${BUILD}`,
  pbot:`/assets/stage2/rc1/pbot-atlas.webp?v=${BUILD}`,
  props:`/assets/stage2/rc1/props-atlas.webp?v=${BUILD}`,
  actors:`/assets/stage2/p0/actors-p0.webp?v=${BUILD}`
};

const P={
  idle:[0,0,140,140],run1:[140,0,140,140],run2:[280,0,140,140],run3:[420,0,140,140],
  run4:[0,140,140,140],run5:[140,140,140,140],crouch:[280,140,140,140],jump:[420,140,140,140]
};
const PROP={
  perkup:[0,0,150,115],charme:[150,0,150,115],billboard:[300,0,150,115],checkpoint:[450,0,150,115],
  nitro:[0,115,150,115],bean:[150,115,150,115],token:[300,115,150,115],barrier:[450,115,150,115],
  scooter:[0,230,150,115],spam:[150,230,150,115],drone:[300,230,150,115],finish:[450,230,150,115]
};
const PERKY=[24,9,124,191];
const images={};
let ready=false, mode='intro', last=0, cam=0, runClock=0, toastTime=0, nitroTime=0, shoesTime=0, inv=0, pulseTime=0;
let player, beans, tokens, enemies, checkpoint, finishGate, nitroPickup, props, spamShots;
const input={left:false,right:false,down:false,jump:false,jumpBuffer:0,action:false};

function loadImage(src,expected){
  return new Promise((resolve,reject)=>{
    const im=new Image();
    const timer=setTimeout(()=>reject(new Error(`Asset timeout: ${src}`)),10000);
    im.onload=()=>{clearTimeout(timer);if(expected&&(im.naturalWidth!==expected[0]||im.naturalHeight!==expected[1]))reject(new Error(`Bad asset ${src}: ${im.naturalWidth}x${im.naturalHeight}`));else resolve(im)};
    im.onerror=()=>{clearTimeout(timer);reject(new Error(`Asset failed: ${src}`))};
    im.decoding='async'; im.src=src;
  });
}
function setLoadError(err){console.error('RC1 asset error',err);const b=$('#startBtn');b.textContent='ПОМИЛКА АСЕТІВ · ПОВТОРИТИ';b.disabled=false;}
Promise.all([
  loadImage(PATHS.bg,[1440,480]).then(i=>images.bg=i),
  loadImage(PATHS.pbot,[560,280]).then(i=>images.pbot=i),
  loadImage(PATHS.props,[600,345]).then(i=>images.props=i),
  loadImage(PATHS.actors,[360,348]).then(i=>images.actors=i)
]).then(()=>{
  ready=true;
  const b=$('#startBtn');b.textContent='ПОЧАТИ';b.disabled=false;
  const intro=$('.intro');
  if(intro) intro.style.backgroundImage=`linear-gradient(90deg,rgba(1,8,12,.74),rgba(1,8,12,.04)),url('${PATHS.bg}')`;
}).catch(setLoadError);

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

function reset(){
  cam=runClock=toastTime=nitroTime=shoesTime=inv=pulseTime=0;
  player={x:100,y:GROUND-92,w:42,h:92,standH:92,crouchH:58,vx:0,vy:0,on:false,coyote:0,jumps:0,doubleJump:false,lives:3,beans:0,tokens:0,spawnX:100,spawnY:GROUND-92,facing:1,crouching:false,state:'idle',finished:false};
  props=[
    {kind:'billboard',x:245,y:GROUND-120,dw:178,dh:136,solid:false},
    {kind:'perkup',x:650,y:GROUND-165,dw:220,dh:169,solid:false,interact:'nitro-zone'},
    {kind:'barrier',x:1180,y:GROUND-80,dw:125,dh:96,solid:true,box:{x:1205,y:GROUND-48,w:80,h:48}},
    {kind:'charme',x:2520,y:GROUND-166,dw:220,dh:169,solid:false,interact:'charme-zone'},
    {kind:'barrier',x:3320,y:GROUND-80,dw:125,dh:96,solid:true,box:{x:3345,y:GROUND-48,w:80,h:48}},
  ];
  beans=[330,470,610,790,940,1080,1325,1480,1640,1810,1980,2140,2320,2760,2940,3130,3520,3700,3890,4140,4380,4660].map((x,i)=>({x,y:GROUND-70-(i%3)*12,got:false,t:i*.45}));
  tokens=[{x:2260,y:GROUND-145,got:false,unlockDouble:true},{x:4210,y:GROUND-150,got:false,secret:true}];
  nitroPickup={x:835,y:GROUND-95,w:72,h:70,got:false};
  checkpoint={x:2050,y:GROUND-122,w:78,h:120,on:false};
  finishGate={x:5050,y:GROUND-165,w:160,h:160,active:true};
  enemies=[
    {kind:'spam',x:1450,y:GROUND-86,w:66,h:78,v:48,min:1380,max:1660,alive:true,t:0,cool:1.1},
    {kind:'scooter',x:3020,y:GROUND-60,w:92,h:58,v:-150,min:2860,max:3260,alive:true,t:0},
    {kind:'drone',x:3860,y:GROUND-205,w:78,h:52,v:78,min:3700,max:4140,alive:true,t:0}
  ];
  spamShots=[];
  updateHud();
  toast('PERKY: RC1. Збирай зерна, активуй модулі й дістанься Розвилки.',3.4);
}

function updateHud(){ $('#beans').textContent=player?.beans??0; $('#tokens').textContent=player?.tokens??0; $('#lives').textContent=player?.lives??3; }
function toast(text,seconds=2.5){const el=$('#toast');if(!el)return;el.textContent=text;el.classList.add('on');toastTime=seconds;}
function solidBoxes(){return props.filter(p=>p.solid&&p.box).map(p=>p.box);}
function setCrouch(on){
  if(!player)return;
  if(on&&!player.crouching&&player.on){const bottom=player.y+player.h;player.crouching=true;player.h=player.crouchH;player.y=bottom-player.h;}
  else if(!on&&player.crouching){
    const bottom=player.y+player.h,cand={x:player.x,y:bottom-player.standH,w:player.w,h:player.standH};
    if(!solidBoxes().some(s=>hit(cand,s))){player.crouching=false;player.h=player.standH;player.y=bottom-player.h;}
  }
}
function respawn(){player.crouching=false;player.h=player.standH;player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0;inv=1.2;}
function damage(fromX){
  if(inv>0||player.finished)return;
  player.lives--;inv=1.15;player.vy=-320;player.vx=player.x<fromX?-220:220;updateHud();
  if(player.lives<=0){player.lives=3;respawn();toast('PERKY: Повертаю до checkpoint.');}
}
function updateState(){
  if(player.finished){player.state='idle';return}
  if(player.crouching){player.state='crouch';return}
  if(!player.on){player.state='jump';return}
  if(Math.abs(player.vx)>28){player.state='run';return}
  player.state='idle';
}
function activatePulse(){
  if(pulseTime>0)return;
  pulseTime=2.0;
  const secret=tokens.find(t=>t.secret&&!t.got);
  if(secret&&Math.abs(secret.x-player.x)<850)toast('PERKY PULSE: секретний Brovary Token поруч.',2.2);
  else if(!player.doubleJump)toast('PERKY PULSE: знайди модуль подвійного стрибка.',2.2);
  else toast('PERKY PULSE: маршрут чистий. Рухайся до Розвилки.',2.0);
}

function update(dt){
  if(mode!=='play')return;
  if(toastTime>0&&(toastTime-=dt)<=0)$('#toast')?.classList.remove('on');
  nitroTime=Math.max(0,nitroTime-dt);shoesTime=Math.max(0,shoesTime-dt);inv=Math.max(0,inv-dt);pulseTime=Math.max(0,pulseTime-dt);input.jumpBuffer=Math.max(0,input.jumpBuffer-dt);
  if(input.action){input.action=false;activatePulse();}
  setCrouch(input.down&&player.on&&!player.finished);
  const dir=(input.right?1:0)-(input.left?1:0);
  const max=(nitroTime?330:245)+(shoesTime?45:0);
  const speed=player.crouching?max*.38:max;
  if(!player.finished){if(dir){player.facing=dir;player.vx=clamp(player.vx+dir*2100*dt,-speed,speed)}else player.vx*=Math.pow(.035,dt)}else player.vx*=Math.pow(.01,dt);
  player.vy+=(player.vy<0?1580:2180)*dt;
  if(player.on){player.coyote=.13;player.jumps=0}else player.coyote=Math.max(0,player.coyote-dt);
  if(input.jumpBuffer>0&&!player.finished){
    if(player.crouching)setCrouch(false);
    const canGround=player.coyote>0,canAir=player.doubleJump&&player.jumps<1;
    if(canGround||canAir){input.jumpBuffer=0;if(!canGround)player.jumps++;player.vy=canGround?(nitroTime?-690:-610):(nitroTime?-570:-505);player.on=false;player.coyote=0;}
  }
  const oldY=player.y,oldBottom=oldY+player.h;
  player.x=clamp(player.x+player.vx*dt,0,WORLD-player.w);
  player.y+=player.vy*dt;player.on=false;
  if(player.vy>=0&&oldBottom<=GROUND+12&&player.y+player.h>=GROUND){player.y=GROUND-player.h;player.vy=0;player.on=true;}
  for(const s of solidBoxes()){
    if(!hit(player,s))continue;
    if(player.vy>=0&&oldBottom<=s.y+14){player.y=s.y-player.h;player.vy=0;player.on=true;}
    else if(oldY+player.h>s.y+8){if(player.vx>0)player.x=s.x-player.w; else if(player.vx<0)player.x=s.x+s.w; player.vx=0;}
  }
  if(player.on&&Math.abs(player.vx)>20&&!player.crouching)runClock+=dt*11;
  if(player.y>VH+100){player.lives--;updateHud();respawn();}

  for(const b of beans){b.t+=dt*4;if(!b.got&&hit(player,{x:b.x-18,y:b.y-16,w:36,h:32})){b.got=true;player.beans++;updateHud();}}
  for(const t of tokens){if(!t.got&&hit(player,{x:t.x-24,y:t.y-22,w:48,h:44})){t.got=true;player.tokens++;if(t.unlockDouble){player.doubleJump=true;toast('DOUBLE JUMP MODULE активовано.',2.6)}else toast('Секретний Brovary Token знайдено ✦',2.6);updateHud();}}
  if(!nitroPickup.got&&hit(player,nitroPickup)){nitroPickup.got=true;nitroTime=9;toast('PerkUp Nitro · speed + jump',2.6);}
  const charmeZone={x:2580,y:GROUND-165,w:145,h:165};
  if(shoesTime<=0&&!player.charmeTaken&&hit(player,charmeZone)){player.charmeTaken=true;shoesTime=14;toast('CHARME Speed Shoes · mobility boost',2.8);}

  for(const e of enemies){
    if(!e.alive)continue;e.t+=dt;e.x+=e.v*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1}
    if(e.kind==='drone')e.y=GROUND-205+Math.sin(e.t*2.5)*30;
    if(e.kind==='spam'){e.cool-=dt;if(e.cool<=0&&Math.abs(player.x-e.x)<520){e.cool=1.75;spamShots.push({x:e.x+(e.v>0?45:-8),y:e.y+26,vx:player.x<e.x?-260:260,life:2.4});}}
    if(hit(player,e)){
      if(player.vy>115&&oldBottom<=e.y+22){e.alive=false;player.vy=-350;toast(e.kind==='scooter'?'Самокатник знешкоджений':'Ворог вимкнений');}
      else damage(e.x+e.w/2);
    }
  }
  for(const s of spamShots){s.x+=s.vx*dt;s.life-=dt;if(s.life>0&&hit(player,{x:s.x-9,y:s.y-5,w:18,h:10})){if(!player.crouching){damage(s.x);s.life=0;}}}
  spamShots=spamShots.filter(s=>s.life>0&&s.x>-100&&s.x<WORLD+100);

  if(!checkpoint.on&&hit(player,checkpoint)){checkpoint.on=true;player.spawnX=checkpoint.x-35;player.spawnY=GROUND-player.standH;toast('Checkpoint активовано');}
  if(finishGate.active&&!player.finished&&hit(player,finishGate)){
    if(player.beans<12){toast(`РОЗВИЛКА: потрібно 12 зерен · ${player.beans}/12`,2.6);player.x=finishGate.x-player.w-6;player.vx=0;}
    else{player.finished=true;finishGate.active=false;player.vx=0;toast('LEVEL 01-01 ПРОЙДЕНО · Місто прокидається',4.2);submitRun();}
  }
  updateState();
  const target=clamp(player.x-300,0,WORLD-VW);cam+=(target-cam)*Math.min(1,dt*5.5);
}

function submitRun(){
  const score=player.beans*100+player.tokens*600+player.lives*1000;
  fetch('/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({playerName:'P-BOT',characterId:'pbot',worldId:1,score,beans:player.beans,timeMs:Math.round(performance.now())})}).catch(()=>{});
}
function drawCell(img,r,wx,wy,dw,dh,{flip=false,alpha=1,glow=false,screen=false}={}){
  const x=screen?wx:wx-cam;ctx.save();ctx.globalAlpha*=alpha;if(glow){ctx.shadowColor='rgba(70,238,221,.82)';ctx.shadowBlur=18;}ctx.translate(x+(flip?dw:0),wy);if(flip)ctx.scale(-1,1);ctx.drawImage(img,r[0],r[1],r[2],r[3],0,0,dw,dh);ctx.restore();
}
function drawBackground(){
  const dh=VH,dw=images.bg.width*(dh/images.bg.height),par=cam*.68;
  const start=Math.floor(par/dw)-1;
  for(let i=start;i<start+5;i++){
    const x=i*dw-par;ctx.save();if(i&1){ctx.translate(x+dw,0);ctx.scale(-1,1);ctx.drawImage(images.bg,0,0,dw,dh)}else ctx.drawImage(images.bg,x,0,dw,dh);ctx.restore();
  }
}
function drawShadow(wx,bottom,w=34,a=.23){const x=wx-cam;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#071015';ctx.beginPath();ctx.ellipse(x,bottom,w,7,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawPropSprite(p){drawCell(images.props,PROP[p.kind],p.x,p.y,p.dw,p.dh,{glow:p.glow});}
function drawWorldProps(){for(const p of props)drawPropSprite(p);}
function drawCollectibles(){
  for(const b of beans)if(!b.got)drawCell(images.props,PROP.bean,b.x-26,b.y-20+Math.sin(b.t)*4,52,40,{glow:true});
  for(const t of tokens)if(!t.got)drawCell(images.props,PROP.token,t.x-27,t.y-22+Math.sin(performance.now()/320)*4,54,41,{glow:pulseTime>0||t.unlockDouble});
  if(!nitroPickup.got)drawCell(images.props,PROP.nitro,nitroPickup.x-14,nitroPickup.y-18,96,74,{glow:true});
}
function drawCheckpointSprite(){drawCell(images.props,PROP.checkpoint,checkpoint.x-38,checkpoint.y-5,150,115,{glow:checkpoint.on,alpha:checkpoint.on?1:.92});}
function drawFinishSprite(){drawCell(images.props,PROP.finish,finishGate.x-20,finishGate.y+20,190,146,{glow:true});}
function drawEnemies(){
  for(const e of enemies){if(!e.alive)continue;const key=e.kind;const sizes=key==='spam'?[132,101]:key==='scooter'?[142,109]:[134,103];drawShadow(e.x+e.w/2,e.y+e.h+4,30);drawCell(images.props,PROP[key],e.x-32,e.y-25,sizes[0],sizes[1],{flip:e.v<0,glow:key==='drone'});}
  for(const s of spamShots){const x=s.x-cam;ctx.save();ctx.shadowColor='#ff3b47';ctx.shadowBlur=12;ctx.fillStyle='#ff4a52';ctx.beginPath();ctx.roundRect(x-10,s.y-4,20,8,4);ctx.fill();ctx.restore();}
}
function drawPerky(){const px=player.x-72+Math.sin(performance.now()/400)*8,py=clamp(player.y-85+Math.sin(performance.now()/300)*5,105,350);drawCell(images.actors,PERKY,px,py,58,89,{flip:player.facing<0,glow:pulseTime>0});}
function drawPlayer(){
  let key='idle';if(player.state==='crouch')key='crouch';else if(player.state==='jump')key='jump';else if(player.state==='run')key='run'+(1+(Math.floor(runClock)%5));
  const h=player.crouching?88:104,w=h;
  drawShadow(player.x+player.w/2,player.y+player.h+5,28,player.crouching?.18:.24);
  ctx.save();if(inv>0&&Math.floor(inv*12)%2===0)ctx.globalAlpha=.45;drawCell(images.pbot,P[key],player.x+player.w/2-w/2,player.y+player.h-h,w,h,{flip:player.facing<0,glow:nitroTime>0});ctx.restore();
}
function drawBoostChip(){
  const bits=[];if(nitroTime>0)bits.push(`⚡ NITRO ${Math.ceil(nitroTime)}s`);if(shoesTime>0)bits.push(`👟 CHARME ${Math.ceil(shoesTime)}s`);if(player?.doubleJump)bits.push('⇈ DOUBLE');if(pulseTime>0)bits.push('◎ PULSE');if(!bits.length)return;
  ctx.save();ctx.fillStyle='rgba(3,18,22,.78)';ctx.strokeStyle='rgba(83,236,219,.55)';ctx.beginPath();ctx.roundRect(20,68,Math.min(480,135+bits.join(' · ').length*4.7),32,16);ctx.fill();ctx.stroke();ctx.fillStyle='#e9fffc';ctx.font='800 12px system-ui';ctx.fillText(bits.join(' · '),34,89);ctx.restore();
}
function draw(){if(!ready||mode!=='play')return;ctx.clearRect(0,0,VW,VH);drawBackground();drawWorldProps();drawCollectibles();drawCheckpointSprite();drawFinishSprite();drawEnemies();drawPerky();drawPlayer();drawBoostChip();}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

$('#startBtn').onclick=()=>{if(!ready){location.reload();return}mode='play';$('.intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();};
$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');$('.intro').classList.remove('hidden');};
function press(name,down){
  if(name==='left')input.left=down;if(name==='right')input.right=down;if(name==='down')input.down=down;
  if(name==='jump'){if(down&&!input.jump)input.jumpBuffer=.12;if(!down&&input.jump&&player&&player.vy<-180)player.vy*=.55;input.jump=down;}
  if(name==='action'&&down)input.action=true;
}
for(const b of document.querySelectorAll('[data-key]')){
  const k=b.dataset.key;
  const on=e=>{e.preventDefault();b.classList.add('held');try{b.setPointerCapture(e.pointerId)}catch{}press(k,true)};
  const off=e=>{e.preventDefault();b.classList.remove('held');press(k,false)};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('contextmenu',e=>e.preventDefault());
}
addEventListener('keydown',e=>{
  const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'?'jump':e.code==='KeyE'||e.code==='KeyR'?'action':null;
  if(m){e.preventDefault();press(m,true)}
});
addEventListener('keyup',e=>{
  const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'?'jump':null;
  if(m){e.preventDefault();press(m,false)}
});
