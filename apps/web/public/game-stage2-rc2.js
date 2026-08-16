const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const VW=960, VH=540, WORLD=6200, GROUND=472;
const BUILD='rc2-02-00';

const PATHS={
  bg:`/assets/stage2/rc1/bg-loop.webp?v=${BUILD}`,
  pbot:`/assets/stage2/rc1/pbot-atlas.webp?v=${BUILD}`,
  props:`/assets/stage2/rc1/props-atlas.webp?v=${BUILD}`,
  actors:`/assets/stage2/p0/actors-p0.webp?v=${BUILD}`
};
const P={idle:[0,0,140,140],run1:[140,0,140,140],run2:[280,0,140,140],run3:[420,0,140,140],run4:[0,140,140,140],run5:[140,140,140,140],crouch:[280,140,140,140],jump:[420,140,140,140]};
const PROP={perkup:[0,0,150,115],charme:[150,0,150,115],billboard:[300,0,150,115],checkpoint:[450,0,150,115],nitro:[0,115,150,115],bean:[150,115,150,115],token:[300,115,150,115],barrier:[450,115,150,115],scooter:[0,230,150,115],spam:[150,230,150,115],drone:[300,230,150,115],finish:[450,230,150,115]};
const PERKY=[24,9,124,191];
const images={};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

let ready=false, mode='intro', last=0, camX=0, camY=0, shake=0, runClock=0, toastTime=0;
let frameView={x:0,y:0};
let nitroTime=0, shoesTime=0, inv=0, pulseTime=0, zoneIndex=-1, levelTime=0;
let player, beans, tokens, enemies, checkpoint, finishGate, nitroPickup, props, platforms, spamShots, particles;
const input={left:false,right:false,down:false,jump:false,jumpBuffer:0,action:false};

const ZONES=[
  {from:0,to:1050,name:'КРОНА ПАРК',hint:'Розігрів · збери ритм'},
  {from:1050,to:2200,name:'ПРИОЗЕРНИЙ',hint:'Вертикальний маршрут'},
  {from:2200,to:3500,name:'МІСЬКИЙ РИТМ',hint:'Checkpoint · трафік'},
  {from:3500,to:4900,name:'CHARME DISTRICT',hint:'Швидкість · ризик'},
  {from:4900,to:6200,name:'РОЗВИЛКА',hint:'Фінальний забіг'}
];

function loadImage(src,expected){
  return new Promise((resolve,reject)=>{
    const im=new Image();
    const timer=setTimeout(()=>reject(new Error(`Asset timeout: ${src}`)),10000);
    im.onload=()=>{clearTimeout(timer);if(expected&&(im.naturalWidth!==expected[0]||im.naturalHeight!==expected[1]))reject(new Error(`Bad asset ${src}: ${im.naturalWidth}x${im.naturalHeight}`));else resolve(im)};
    im.onerror=()=>{clearTimeout(timer);reject(new Error(`Asset failed: ${src}`))};
    im.decoding='async'; im.src=src;
  });
}
function setLoadError(err){console.error('RC2 asset error',err);const b=$('#startBtn');b.textContent='ПОМИЛКА АСЕТІВ · ПОВТОРИТИ';b.disabled=false;}
Promise.all([
  loadImage(PATHS.bg,[1440,480]).then(i=>images.bg=i),
  loadImage(PATHS.pbot,[560,280]).then(i=>images.pbot=i),
  loadImage(PATHS.props,[600,345]).then(i=>images.props=i),
  loadImage(PATHS.actors,[360,348]).then(i=>images.actors=i)
]).then(()=>{
  ready=true;
  const b=$('#startBtn');b.textContent='ПОЧАТИ RC2';b.disabled=false;
  const intro=$('.intro');
  if(intro) intro.style.backgroundImage=`linear-gradient(90deg,rgba(1,8,12,.78),rgba(1,8,12,.06)),url('${PATHS.bg}')`;
}).catch(setLoadError);

function reset(){
  camX=camY=shake=runClock=toastTime=nitroTime=shoesTime=inv=pulseTime=levelTime=0;zoneIndex=-1;
  player={x:110,y:GROUND-92,w:42,h:92,standH:92,crouchH:58,vx:0,vy:0,on:false,wasOn:false,coyote:0,jumps:0,doubleJump:false,lives:3,beans:0,tokens:0,spawnX:110,spawnY:GROUND-92,facing:1,crouching:false,state:'idle',finished:false,land:0,step:0,charmeTaken:false};
  props=[
    {kind:'billboard',x:220,y:GROUND-125,dw:184,dh:141},
    {kind:'perkup',x:700,y:GROUND-168,dw:222,dh:170,interact:'nitro-zone'},
    {kind:'billboard',x:1500,y:GROUND-260,dw:170,dh:130},
    {kind:'checkpoint',x:2445,y:GROUND-126,dw:150,dh:115,decor:true},
    {kind:'billboard',x:2910,y:GROUND-188,dw:172,dh:132},
    {kind:'charme',x:3690,y:GROUND-168,dw:224,dh:172,interact:'charme-zone'},
    {kind:'perkup',x:4470,y:GROUND-168,dw:208,dh:159},
    {kind:'billboard',x:5220,y:GROUND-220,dw:170,dh:130}
  ];
  platforms=[
    {x:1120,y:GROUND-74,w:180,h:74,skin:'barrier'},
    {x:1370,y:GROUND-132,w:205,h:34,skin:'barrier'},
    {x:1670,y:GROUND-196,w:210,h:34,skin:'barrier'},
    {x:1980,y:GROUND-122,w:220,h:34,skin:'barrier'},
    {x:2680,y:GROUND-84,w:170,h:84,skin:'barrier'},
    {x:3140,y:GROUND-126,w:210,h:34,skin:'barrier'},
    {x:3380,y:GROUND-194,w:190,h:34,skin:'barrier'},
    {x:4010,y:GROUND-90,w:170,h:90,skin:'barrier'},
    {x:4250,y:GROUND-158,w:210,h:34,skin:'barrier'},
    {x:4580,y:GROUND-220,w:220,h:34,skin:'barrier'},
    {x:5030,y:GROUND-118,w:180,h:34,skin:'barrier'},
    {x:5410,y:GROUND-182,w:220,h:34,skin:'barrier'}
  ];
  beans=[
    [340,GROUND-70],[500,GROUND-78],[660,GROUND-74],[840,GROUND-85],[1030,GROUND-78],
    [1200,GROUND-122],[1460,GROUND-180],[1760,GROUND-244],[2060,GROUND-170],
    [2320,GROUND-78],[2580,GROUND-80],[2750,GROUND-132],[3000,GROUND-92],[3225,GROUND-176],[3470,GROUND-242],
    [3780,GROUND-82],[4090,GROUND-138],[4335,GROUND-206],[4660,GROUND-268],[4870,GROUND-82],
    [5120,GROUND-166],[5350,GROUND-82],[5510,GROUND-230],[5770,GROUND-94],[5960,GROUND-82]
  ].map(([x,y],i)=>({x,y,got:false,t:i*.43}));
  tokens=[
    {x:1770,y:GROUND-265,got:false,unlockDouble:true,secret:false},
    {x:4680,y:GROUND-292,got:false,unlockDouble:false,secret:true}
  ];
  nitroPickup={x:905,y:GROUND-104,w:72,h:70,got:false};
  checkpoint={x:2490,y:GROUND-122,w:78,h:120,on:false};
  finishGate={x:5920,y:GROUND-165,w:160,h:160,active:true};
  enemies=[
    {kind:'spam',x:1500,y:GROUND-86,w:66,h:78,v:48,min:1400,max:1630,alive:true,t:0,cool:1.1,tele:0},
    {kind:'drone',x:2100,y:GROUND-235,w:78,h:52,v:70,min:1940,max:2260,alive:true,t:0,baseY:GROUND-235},
    {kind:'scooter',x:2870,y:GROUND-60,w:92,h:58,v:-145,min:2800,max:3100,alive:true,t:0,charge:0},
    {kind:'spam',x:3550,y:GROUND-86,w:66,h:78,v:54,min:3460,max:3700,alive:true,t:0,cool:1.35,tele:0},
    {kind:'drone',x:4380,y:GROUND-270,w:78,h:52,v:82,min:4200,max:4680,alive:true,t:0,baseY:GROUND-270},
    {kind:'scooter',x:5250,y:GROUND-60,w:92,h:58,v:165,min:5150,max:5520,alive:true,t:0,charge:0}
  ];
  spamShots=[];particles=[];
  updateHud();
  toast('PERKY: RC2. Тримай темп — місто тепер має висоту, ризик і ритм.',3.5);
}

function updateHud(){ $('#beans').textContent=player?.beans??0; $('#tokens').textContent=player?.tokens??0; $('#lives').textContent=player?.lives??3; }
function toast(text,seconds=2.5){const el=$('#toast');if(!el)return;el.textContent=text;el.classList.add('on');toastTime=seconds;}
function solidBoxes(){return platforms.concat(props.filter(p=>p.solid&&p.box).map(p=>p.box));}
function setCrouch(on){
  if(!player)return;
  if(on&&!player.crouching&&player.on){const bottom=player.y+player.h;player.crouching=true;player.h=player.crouchH;player.y=bottom-player.h;}
  else if(!on&&player.crouching){const bottom=player.y+player.h,cand={x:player.x,y:bottom-player.standH,w:player.w,h:player.standH};if(!solidBoxes().some(s=>hit(cand,s))){player.crouching=false;player.h=player.standH;player.y=bottom-player.h;}}
}
function respawn(){player.crouching=false;player.h=player.standH;player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0;inv=1.25;shake=5;spawnBurst(player.x+20,player.y+88,12,'#62eee0');}
function damage(fromX){
  if(inv>0||player.finished)return;
  player.lives--;inv=1.1;player.vy=-360;player.vx=player.x<fromX?-250:250;shake=10;spawnBurst(player.x+20,player.y+45,14,'#ff5964');updateHud();
  if(player.lives<=0){player.lives=3;respawn();toast('PERKY: Скидаю до checkpoint.');}
}
function updateState(){if(player.finished)player.state='idle';else if(player.crouching)player.state='crouch';else if(!player.on)player.state='jump';else if(Math.abs(player.vx)>24)player.state='run';else player.state='idle';}
function activatePulse(){
  if(pulseTime>0)return;
  pulseTime=2.1;shake=Math.max(shake,3);spawnBurst(player.x+player.w/2,player.y+player.h/2,20,'#76fff2');
  const secret=tokens.find(t=>t.secret&&!t.got);
  if(secret&&Math.abs(secret.x-player.x)<1000)toast('PERKY PULSE: секретний Brovary Token у цьому секторі.',2.3);
  else if(!player.doubleJump)toast('PERKY PULSE: модуль подвійного стрибка вище маршруту.',2.3);
  else toast('PERKY PULSE: маршрут чистий. Тримай ритм.',2.0);
}
function spawnBurst(x,y,n,color){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=45+Math.random()*150;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-35,life:.35+Math.random()*.45,max:.8,r:2+Math.random()*3,color});}}
function spawnDust(x,y,n=5){for(let i=0;i<n;i++)particles.push({x:x+(Math.random()-.5)*32,y:y-2,vx:(Math.random()-.5)*70,vy:-30-Math.random()*55,life:.24+Math.random()*.18,max:.45,r:3+Math.random()*4,color:'#d8e8e7'});}

function resolvePlayer(dt){
  const oldX=player.x, oldY=player.y, oldBottom=oldY+player.h, impactVy=player.vy;
  player.x=clamp(player.x+player.vx*dt,0,WORLD-player.w);
  for(const s of solidBoxes())if(hit(player,s)){if(player.vx>0&&oldX+player.w<=s.x+10)player.x=s.x-player.w;else if(player.vx<0&&oldX>=s.x+s.w-10)player.x=s.x+s.w;player.vx=0;}
  player.y+=player.vy*dt;player.on=false;
  if(player.vy>=0&&oldBottom<=GROUND+12&&player.y+player.h>=GROUND){player.y=GROUND-player.h;player.vy=0;player.on=true;}
  for(const s of solidBoxes()){
    if(!hit(player,s))continue;
    if(player.vy>=0&&oldBottom<=s.y+16){player.y=s.y-player.h;player.vy=0;player.on=true;}
    else if(player.vy<0&&oldY>=s.y+s.h-10){player.y=s.y+s.h;player.vy=24;}
  }
  if(!player.wasOn&&player.on){player.land=.18;shake=Math.max(shake,Math.min(5,Math.abs(impactVy)*.008));spawnDust(player.x+player.w/2,player.y+player.h,7);}
  player.wasOn=player.on;
}

function updateZones(){const next=ZONES.findIndex(z=>player.x>=z.from&&player.x<z.to);if(next!==zoneIndex&&next>=0){zoneIndex=next;const z=ZONES[next];toast(`${z.name} · ${z.hint}`,2.1);}}
function updateEnemies(dt,oldBottom){
  for(const e of enemies){
    if(!e.alive)continue;e.t+=dt;
    if(e.kind==='spam'){
      e.x+=e.v*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1}
      e.cool-=dt;
      if(e.cool<.35&&e.cool>0&&Math.abs(player.x-e.x)<560)e.tele=.35;
      e.tele=Math.max(0,e.tele-dt);
      if(e.cool<=0&&Math.abs(player.x-e.x)<560){e.cool=1.7;e.tele=0;spamShots.push({x:e.x+(player.x<e.x?-6:48),y:e.y+28,vx:player.x<e.x?-285:285,life:2.2});}
    } else if(e.kind==='scooter'){
      const near=Math.abs(player.x-e.x)<360;e.charge=Math.max(0,e.charge-dt);
      const mult=near?1.55:1;e.x+=e.v*mult*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1;e.charge=.18}
    } else {
      e.x+=e.v*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1}
      const near=Math.abs(player.x-e.x)<260;const dive=near?Math.min(68,Math.max(0,(player.y+player.h)-(e.baseY+90))*.35):0;e.y=e.baseY+Math.sin(e.t*2.6)*24+dive;
    }
    if(hit(player,e)){
      if(player.vy>115&&oldBottom<=e.y+24){e.alive=false;player.vy=-390;shake=7;spawnBurst(e.x+e.w/2,e.y+e.h/2,12,'#7ff8ef');toast('Ворог вимкнений');}
      else damage(e.x+e.w/2);
    }
  }
  for(const s of spamShots){s.x+=s.vx*dt;s.life-=dt;if(s.life>0&&hit(player,{x:s.x-10,y:s.y-5,w:20,h:10})){if(!player.crouching){damage(s.x);s.life=0;}}}
  spamShots=spamShots.filter(s=>s.life>0&&s.x>-100&&s.x<WORLD+100);
}

function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=360*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);}

function update(dt){
  if(mode!=='play')return;levelTime+=dt;
  if(toastTime>0&&(toastTime-=dt)<=0)$('#toast')?.classList.remove('on');
  nitroTime=Math.max(0,nitroTime-dt);shoesTime=Math.max(0,shoesTime-dt);inv=Math.max(0,inv-dt);pulseTime=Math.max(0,pulseTime-dt);input.jumpBuffer=Math.max(0,input.jumpBuffer-dt);player.land=Math.max(0,player.land-dt);shake=Math.max(0,shake-dt*22);
  if(input.action){input.action=false;activatePulse();}
  setCrouch(input.down&&player.on&&!player.finished);

  const dir=(input.right?1:0)-(input.left?1:0);
  const max=(nitroTime?345:252)+(shoesTime?48:0);
  const speed=player.crouching?max*.36:max;
  const accel=player.on?1850:920, brake=player.on?2550:1180;
  if(!player.finished){
    if(dir){player.facing=dir;const turning=Math.sign(player.vx)!==dir&&Math.abs(player.vx)>40;player.vx=clamp(player.vx+dir*(turning?brake:accel)*dt,-speed,speed);}
    else player.vx*=Math.pow(player.on?.055:.31,dt);
  } else player.vx*=Math.pow(.01,dt);

  const rising=player.vy<0;player.vy+=(rising&&input.jump?1450:rising?1900:2240)*dt;
  if(player.on){player.coyote=.14;player.jumps=0}else player.coyote=Math.max(0,player.coyote-dt);
  if(input.jumpBuffer>0&&!player.finished){
    if(player.crouching)setCrouch(false);
    const canGround=player.coyote>0, canAir=player.doubleJump&&player.jumps<1;
    if(canGround||canAir){input.jumpBuffer=0;if(!canGround){player.jumps++;spawnBurst(player.x+20,player.y+65,8,'#62eee0');}player.vy=canGround?(nitroTime?-695:-620):(nitroTime?-585:-525);player.on=false;player.wasOn=false;player.coyote=0;shake=Math.max(shake,canGround?2:4);}
  }

  const oldBottom=player.y+player.h;resolvePlayer(dt);
  if(player.on&&Math.abs(player.vx)>24&&!player.crouching){runClock+=dt*(8.8+Math.abs(player.vx)/70);player.step-=dt;if(player.step<=0){player.step=.19;spawnDust(player.x+player.w/2,player.y+player.h,2);}}
  if(player.y>VH+160){player.lives--;updateHud();respawn();}

  for(const b of beans){b.t+=dt*4;if(!b.got&&hit(player,{x:b.x-18,y:b.y-16,w:36,h:32})){b.got=true;player.beans++;spawnBurst(b.x,b.y,8,'#ffd45a');updateHud();}}
  for(const t of tokens){if(!t.got&&hit(player,{x:t.x-24,y:t.y-22,w:48,h:44})){t.got=true;player.tokens++;spawnBurst(t.x,t.y,14,'#88fff6');if(t.unlockDouble){player.doubleJump=true;toast('DOUBLE JUMP MODULE активовано.',2.6)}else toast('Секретний Brovary Token знайдено ✦',2.6);updateHud();}}
  if(!nitroPickup.got&&hit(player,nitroPickup)){nitroPickup.got=true;nitroTime=9;spawnBurst(nitroPickup.x+32,nitroPickup.y+30,16,'#6ffff2');toast('PerkUp Nitro · speed + jump',2.6);}
  const charmeZone={x:3740,y:GROUND-170,w:155,h:170};if(shoesTime<=0&&!player.charmeTaken&&hit(player,charmeZone)){player.charmeTaken=true;shoesTime=14;spawnBurst(player.x+20,player.y+50,14,'#e7fbff');toast('CHARME Speed Shoes · mobility boost',2.8);}

  updateEnemies(dt,oldBottom);
  if(!checkpoint.on&&hit(player,checkpoint)){checkpoint.on=true;player.spawnX=checkpoint.x-35;player.spawnY=GROUND-player.standH;spawnBurst(checkpoint.x+35,checkpoint.y+55,18,'#62eee0');toast('Checkpoint активовано');}
  if(finishGate.active&&!player.finished&&hit(player,finishGate)){
    if(player.beans<16){toast(`РОЗВИЛКА: потрібно 16 зерен · ${player.beans}/16`,2.6);player.x=finishGate.x-player.w-6;player.vx=0;}
    else{player.finished=true;finishGate.active=false;player.vx=0;shake=8;spawnBurst(finishGate.x+60,finishGate.y+80,28,'#7ffff3');toast('RC2 LEVEL COMPLETE · Ритм міста стабілізовано',4.2);submitRun();}
  }
  updateZones();updateState();updateParticles(dt);

  const look=clamp(player.vx*.42,-95,125), targetX=clamp(player.x-330+look,0,WORLD-VW);
  const targetY=clamp((player.y-285)*.22,-36,54);
  camX=lerp(camX,targetX,1-Math.pow(.002,dt));camY=lerp(camY,targetY,1-Math.pow(.008,dt));
}

function submitRun(){const score=player.beans*100+player.tokens*650+player.lives*1000+Math.max(0,5000-Math.round(levelTime*18));fetch('/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({playerName:'P-BOT',characterId:'pbot',worldId:1,score,beans:player.beans,timeMs:Math.round(levelTime*1000)})}).catch(()=>{});}

function view(){return frameView;}
function drawCell(img,r,wx,wy,dw,dh,{flip=false,alpha=1,glow=false,screen=false,scaleY=1}={}){
  const c=view(),x=screen?wx:wx-c.x,y=screen?wy:wy-c.y;ctx.save();ctx.globalAlpha*=alpha;if(glow){ctx.shadowColor='rgba(70,238,221,.82)';ctx.shadowBlur=18;}ctx.translate(x+(flip?dw:0),y+dh*(1-scaleY));if(flip)ctx.scale(-1,1);ctx.drawImage(img,r[0],r[1],r[2],r[3],0,0,dw,dh*scaleY);ctx.restore();
}
function drawBackground(){
  const c=view();
  const farH=VH*1.06,farW=images.bg.width*(farH/images.bg.height),farPar=c.x*.22;
  for(let i=Math.floor(farPar/farW)-1;i<Math.floor(farPar/farW)+4;i++){const x=i*farW-farPar;ctx.save();ctx.globalAlpha=.32;ctx.drawImage(images.bg,x,-25-c.y*.05,farW,farH);ctx.restore();}
  const dh=VH,dw=images.bg.width*(dh/images.bg.height),par=c.x*.66;
  for(let i=Math.floor(par/dw)-1;i<Math.floor(par/dw)+5;i++){const x=i*dw-par;ctx.save();if(i&1){ctx.translate(x+dw,-c.y*.12);ctx.scale(-1,1);ctx.drawImage(images.bg,0,0,dw,dh)}else ctx.drawImage(images.bg,x,-c.y*.12,dw,dh);ctx.restore();}
  const z=ZONES[Math.max(0,zoneIndex)]||ZONES[0];const alpha=.045+(z.from/WORLD)*.03;ctx.save();ctx.fillStyle=`rgba(74,244,226,${alpha})`;ctx.fillRect(0,0,VW,VH);ctx.restore();
}
function drawShadow(wx,bottom,w=34,a=.23){const c=view(),x=wx-c.x,y=bottom-c.y;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#071015';ctx.beginPath();ctx.ellipse(x,y,w,7,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawPlatform(p){const seg=112,n=Math.max(1,Math.ceil(p.w/seg));for(let i=0;i<n;i++){const w=Math.min(seg,p.w-i*seg);drawCell(images.props,PROP.barrier,p.x+i*seg,p.y-58,w,92,{alpha:.98});}}
function drawWorldProps(){for(const p of props)drawCell(images.props,PROP[p.kind],p.x,p.y,p.dw,p.dh,{glow:p.glow});for(const p of platforms)drawPlatform(p);}
function drawCollectibles(){for(const b of beans)if(!b.got)drawCell(images.props,PROP.bean,b.x-26,b.y-20+Math.sin(b.t)*4,52,40,{glow:true});for(const t of tokens)if(!t.got)drawCell(images.props,PROP.token,t.x-27,t.y-22+Math.sin(performance.now()/320)*4,54,41,{glow:pulseTime>0||t.unlockDouble});if(!nitroPickup.got)drawCell(images.props,PROP.nitro,nitroPickup.x-14,nitroPickup.y-18,96,74,{glow:true});}
function drawCheckpointSprite(){drawCell(images.props,PROP.checkpoint,checkpoint.x-38,checkpoint.y-5,150,115,{glow:checkpoint.on,alpha:checkpoint.on?1:.92});}
function drawFinishSprite(){drawCell(images.props,PROP.finish,finishGate.x-20,finishGate.y+20,190,146,{glow:true});}
function drawEnemies(){
  for(const e of enemies){if(!e.alive)continue;const sizes=e.kind==='spam'?[132,101]:e.kind==='scooter'?[142,109]:[134,103];drawShadow(e.x+e.w/2,e.y+e.h+4,30);drawCell(images.props,PROP[e.kind],e.x-32,e.y-25,sizes[0],sizes[1],{flip:e.v<0,glow:e.kind==='drone'||e.tele>0||e.charge>0});}
  const c=view();for(const s of spamShots){const x=s.x-c.x,y=s.y-c.y;ctx.save();ctx.shadowColor='#ff3b47';ctx.shadowBlur=12;ctx.fillStyle='#ff4a52';ctx.beginPath();ctx.roundRect(x-10,y-4,20,8,4);ctx.fill();ctx.restore();}
}
function drawPerky(){const px=player.x-72+Math.sin(performance.now()/400)*8,py=clamp(player.y-85+Math.sin(performance.now()/300)*5,105,350);drawCell(images.actors,PERKY,px,py,58,89,{flip:player.facing<0,glow:pulseTime>0});}
function drawPlayer(){let key='idle';if(player.state==='crouch')key='crouch';else if(player.state==='jump')key='jump';else if(player.state==='run')key='run'+(1+(Math.floor(runClock)%5));let h=player.crouching?88:104,w=h;const squash=player.land>0?0.92:1;drawShadow(player.x+player.w/2,player.y+player.h+5,28,player.crouching?.18:.24);ctx.save();if(inv>0&&Math.floor(inv*12)%2===0)ctx.globalAlpha=.45;drawCell(images.pbot,P[key],player.x+player.w/2-w/2,player.y+player.h-h,w,h,{flip:player.facing<0,glow:nitroTime>0,scaleY:squash});ctx.restore();}
function drawParticles(){const c=view();for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-c.x,p.y-c.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();}}
function drawBoostChip(){const bits=[];if(nitroTime>0)bits.push(`⚡ NITRO ${Math.ceil(nitroTime)}s`);if(shoesTime>0)bits.push(`👟 CHARME ${Math.ceil(shoesTime)}s`);if(player?.doubleJump)bits.push('⇈ DOUBLE');if(pulseTime>0)bits.push('◎ PULSE');if(!bits.length)return;ctx.save();ctx.fillStyle='rgba(3,18,22,.78)';ctx.strokeStyle='rgba(83,236,219,.55)';ctx.beginPath();ctx.roundRect(20,68,Math.min(480,135+bits.join(' · ').length*4.7),32,16);ctx.fill();ctx.stroke();ctx.fillStyle='#e9fffc';ctx.font='800 12px system-ui';ctx.fillText(bits.join(' · '),34,89);ctx.restore();}
function drawZoneChip(){if(zoneIndex<0)return;const z=ZONES[zoneIndex];ctx.save();ctx.globalAlpha=.86;ctx.fillStyle='rgba(3,14,18,.58)';ctx.beginPath();ctx.roundRect(VW-212,68,192,34,17);ctx.fill();ctx.fillStyle='#bffcf6';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText(z.name,VW-116,90);ctx.restore();}
function draw(){if(!ready||mode!=='play')return;const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake*.55:0;frameView={x:camX-sx,y:camY-sy};ctx.clearRect(0,0,VW,VH);drawBackground();drawWorldProps();drawCollectibles();drawCheckpointSprite();drawFinishSprite();drawEnemies();drawPerky();drawPlayer();drawParticles();drawBoostChip();drawZoneChip();}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

$('#startBtn').onclick=()=>{if(!ready){location.reload();return}mode='play';$('.intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();};
$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');$('.intro').classList.remove('hidden');};
function press(name,down){if(name==='left')input.left=down;if(name==='right')input.right=down;if(name==='down')input.down=down;if(name==='jump'){if(down&&!input.jump)input.jumpBuffer=.13;if(!down&&input.jump&&player&&player.vy<-180)player.vy*=.58;input.jump=down;}if(name==='action'&&down)input.action=true;}
for(const b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;const on=e=>{e.preventDefault();b.classList.add('held');try{b.setPointerCapture(e.pointerId)}catch{}press(k,true)};const off=e=>{e.preventDefault();b.classList.remove('held');press(k,false)};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('contextmenu',e=>e.preventDefault());}
addEventListener('keydown',e=>{const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'?'jump':e.code==='KeyE'||e.code==='KeyR'?'action':null;if(m){e.preventDefault();press(m,true)}});
addEventListener('keyup',e=>{const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'?'jump':null;if(m){e.preventDefault();press(m,false)}});
