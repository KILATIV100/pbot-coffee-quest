const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d', {alpha:false});
const VW=960, VH=540, WORLD=5400, GROUND=438;
const BUILD='working-01-01-r1';

const PATHS={
  bg:`/assets/stage2/v3/level-bg.webp?v=${BUILD}`,
  pbot:`/assets/stage2/p0/pbot-p0.webp?v=${BUILD}`,
  actors:`/assets/stage2/p0/actors-p0.webp?v=${BUILD}`
};

const P={
  idle:[17,8,74,121], run1:[113,8,90,121], run2:[215,8,90,120], run3:[318,8,92,121],
  run4:[12,175,84,121], run5:[111,175,92,121], crouch:[215,175,91,121], jump:[318,175,91,121]
};
const A={perky:[24,9,124,191], spam:[178,6,164,126], scooter:[44,222,102,104], drone:[192,224,155,100]};

const images={};
let ready=false, mode='intro', last=0, cam=0, runClock=0, toastTime=0, inv=0, pulseTime=0, pulseCooldown=0;
let player, beans, tokens, enemies, checkpoint, finishGate, powerups, modules, hazards, solids, props, secret;
const input={left:false,right:false,down:false,jump:false,jumpBuffer:0,pulse:false};

function loadImage(src, expected){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const timer=setTimeout(()=>reject(new Error(`Asset timeout: ${src}`)),12000);
    img.onload=()=>{
      clearTimeout(timer);
      if(expected&&(img.naturalWidth!==expected[0]||img.naturalHeight!==expected[1])){
        reject(new Error(`Bad asset size ${src}: ${img.naturalWidth}x${img.naturalHeight}`));
      } else resolve(img);
    };
    img.onerror=()=>{clearTimeout(timer);reject(new Error(`Asset failed: ${src}`));};
    img.decoding='async';
    img.src=src;
  });
}
function loadError(err){
  console.error(err);
  const b=$('#startBtn');
  b.disabled=false;
  b.textContent='ПОВТОРИТИ';
}
Promise.all([
  loadImage(PATHS.bg,[1600,332]).then(i=>images.bg=i),
  loadImage(PATHS.pbot,[420,330]).then(i=>images.pbot=i),
  loadImage(PATHS.actors,[360,348]).then(i=>images.actors=i)
]).then(()=>{
  ready=true;
  const b=$('#startBtn'); b.disabled=false; b.textContent='ПОЧАТИ';
  const intro=$('.intro');
  if(intro) intro.style.backgroundImage=`linear-gradient(90deg,rgba(2,10,14,.78),rgba(2,10,14,.05)),url('${PATHS.bg}')`;
}).catch(loadError);

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const screenX=x=>x-cam;

function reset(){
  cam=0; runClock=0; toastTime=0; inv=0; pulseTime=0; pulseCooldown=0;
  player={
    x:110,y:GROUND-92,w:44,h:92,standH:92,crouchH:58,vx:0,vy:0,on:false,coyote:0,
    jumpsLeft:0,lives:3,beans:0,tokens:0,spawnX:110,spawnY:GROUND-92,facing:1,crouching:false,
    finished:false,nitro:0,shoes:0,doubleJump:false,state:'idle'
  };

  solids=[
    {x:0,y:GROUND,w:3420,h:102,id:'ground-a'},
    {x:3580,y:GROUND,w:1820,h:102,id:'ground-b'},
    {x:1830,y:332,w:260,h:16,id:'bus-roof'},
    {x:2710,y:336,w:265,h:16,id:'charme-awning'},
    {x:3005,y:390,w:92,h:48,id:'crate'},
    {x:4010,y:345,w:230,h:16,id:'construction-walkway'}
  ];

  props=[
    {kind:'billboard',x:260,y:286,w:220,h:122},
    {kind:'perkup',x:610,y:278,w:285,h:160},
    {kind:'busstop',x:1810,y:320,w:300,h:118},
    {kind:'charme',x:2660,y:275,w:340,h:163},
    {kind:'barrier',x:3260,y:382,w:105,h:56},
    {kind:'scaffold',x:3900,y:285,w:355,h:153},
    {kind:'tree',x:1100,y:265,w:100,h:173},
    {kind:'tree',x:1540,y:250,w:116,h:188},
    {kind:'tree',x:4450,y:250,w:112,h:188},
    {kind:'bench',x:1320,y:382,w:130,h:56}
  ];

  beans=[
    [220,382],[360,354],[520,377],[730,350],[930,378],
    [1120,356],[1280,380],[1460,352],[1660,378],[1910,292],[2020,292],
    [2240,370],[2440,348],[2610,370],[2810,300],[2925,298],
    [3130,372],[3330,350],[3700,370],[3900,336],[4120,305],[4340,370],[4560,350],[4780,370]
  ].map(([x,y],i)=>({x,y,got:false,t:i*.43}));

  tokens=[
    {x:2050,y:270,got:false},
    {x:4165,y:280,got:false},
    {x:4650,y:340,got:false}
  ];

  powerups={
    nitro:{kind:'nitro',x:1010,y:GROUND-76,w:48,h:76,got:false},
    shoes:{kind:'shoes',x:2850,y:GROUND-52,w:94,h:52,got:false}
  };

  modules={
    doubleJump:{kind:'double',x:2380,y:GROUND-66,w:54,h:66,got:false}
  };

  enemies=[
    {kind:'spam',x:1380,y:GROUND-82,w:66,h:82,v:44,min:1320,max:1530,alive:true,t:0,alert:0},
    {kind:'scooter',x:2300,y:GROUND-62,w:96,h:62,v:-155,min:2170,max:2510,alive:true,t:0,alert:0},
    {kind:'drone',x:3650,y:265,w:86,h:56,v:76,min:3540,max:3880,alive:true,t:0,alert:0},
    {kind:'spam',x:4520,y:GROUND-82,w:66,h:82,v:-54,min:4430,max:4680,alive:true,t:0,alert:0}
  ];

  checkpoint={x:2170,y:GROUND-116,w:58,h:116,on:false};
  finishGate={x:5020,y:GROUND-164,w:130,h:164,active:true};
  hazards=[
    {kind:'trench',x:3420,y:GROUND,w:160,h:110},
    {kind:'lowbar',x:3900,y:342,w:210,h:34}
  ];
  secret={x:4110,y:300,w:110,h:38,revealed:false,claimed:false};

  updateHud();
  toast('PERKY: 01-01. Збери Nitro, модуль Double Jump і дійди до Розвилки.',4);
}

function toast(text,seconds=2.5){
  const el=$('#toast');
  el.textContent=text; el.classList.add('on'); toastTime=seconds;
}
function updateHud(){
  $('#beans').textContent=player?.beans??0;
  $('#tokens').textContent=player?.tokens??0;
  $('#lives').textContent=player?.lives??3;
  const a=$('#abilityState');
  if(a){
    const bits=[];
    if(player?.doubleJump) bits.push('2×JUMP');
    if(player?.nitro>0) bits.push(`NITRO ${Math.ceil(player.nitro)}s`);
    if(player?.shoes>0) bits.push(`CHARME ${Math.ceil(player.shoes)}s`);
    a.textContent=bits.length?bits.join(' · '):'PERKY PULSE';
  }
}

function setCrouch(on){
  if(!player)return;
  if(on&&!player.crouching&&player.on){
    const bottom=player.y+player.h;
    player.crouching=true; player.h=player.crouchH; player.y=bottom-player.h; player.vx*=.72;
  } else if(!on&&player.crouching){
    const bottom=player.y+player.h;
    const candidate={x:player.x,y:bottom-player.standH,w:player.w,h:player.standH};
    const blocked=hazards.some(h=>h.kind==='lowbar'&&hit(candidate,h));
    if(!blocked){
      player.crouching=false; player.h=player.standH; player.y=bottom-player.h;
    }
  }
}

function respawn(){
  player.crouching=false;player.h=player.standH;
  player.x=player.spawnX;player.y=player.spawnY;player.vx=0;player.vy=0;
  player.finished=false;
}
function damage(fromX,msg='Удар'){
  if(inv>0||player.finished)return;
  player.lives--; inv=1.15; player.vy=-300; player.vx=player.x<fromX?-210:210;
  updateHud(); toast(`PERKY: ${msg}.`,1.6);
  if(player.lives<=0){
    player.lives=3; respawn(); updateHud(); toast('PERKY: Повертаю до checkpoint.',2.5);
  }
}

function triggerPulse(){
  if(pulseCooldown>0||mode!=='play'||player.finished)return;
  pulseTime=2.2; pulseCooldown=7.5; secret.revealed=true;
  toast('PERKY PULSE: підсвічую небезпеки, бонуси й секретний маршрут.',2.8);
}

function updateState(){
  if(player.finished){player.state='victory';return;}
  if(player.crouching){player.state='crouch';return;}
  if(!player.on){player.state='jump';return;}
  if(Math.abs(player.vx)>25){player.state='run';return;}
  player.state='idle';
}

function resolveGround(oldBottom){
  player.on=false;
  for(const s of solids){
    if(player.vy>=0&&oldBottom<=s.y+12&&hit(player,s)){
      player.y=s.y-player.h; player.vy=0; player.on=true;
    }
  }
}

function update(dt){
  if(mode!=='play')return;
  if(toastTime>0&&(toastTime-=dt)<=0)$('#toast').classList.remove('on');
  inv=Math.max(0,inv-dt);pulseTime=Math.max(0,pulseTime-dt);pulseCooldown=Math.max(0,pulseCooldown-dt);
  player.nitro=Math.max(0,player.nitro-dt);player.shoes=Math.max(0,player.shoes-dt);
  input.jumpBuffer=Math.max(0,input.jumpBuffer-dt);

  if(input.pulse){input.pulse=false;triggerPulse();}
  setCrouch(input.down&&player.on&&!player.finished);

  const dir=(input.right?1:0)-(input.left?1:0);
  const max=(player.nitro>0?330:250)+(player.shoes>0?70:0);
  const accel=player.nitro>0?2700:2200;
  if(!player.finished){
    if(dir){
      player.facing=dir; player.vx=clamp(player.vx+dir*accel*dt,-max,max);
    } else player.vx*=Math.pow(.035,dt);
  } else player.vx*=Math.pow(.01,dt);
  if(player.crouching)player.vx=clamp(player.vx,-115,115);

  player.vy+=(player.vy<0?1580:2200)*dt;
  if(player.on){
    player.coyote=.13;
    player.jumpsLeft=player.doubleJump?1:0;
  } else player.coyote=Math.max(0,player.coyote-dt);

  if(input.jumpBuffer>0&&!player.finished){
    if(player.crouching)setCrouch(false);
    if(player.coyote>0){
      input.jumpBuffer=0; player.vy=player.nitro>0?-680:-610; player.on=false;player.coyote=0;
    } else if(player.jumpsLeft>0){
      input.jumpBuffer=0; player.jumpsLeft--; player.vy=player.nitro>0?-570:-515;
      toast('DOUBLE JUMP',.65);
    }
  }

  const oldBottom=player.y+player.h;
  player.x=clamp(player.x+player.vx*dt,0,WORLD-player.w);
  player.y+=player.vy*dt;
  resolveGround(oldBottom);

  const low=hazards.find(h=>h.kind==='lowbar');
  if(hit(player,low)&&!player.crouching){
    player.x=low.x-player.w-3;player.vx=-90;
    toast('PERKY: тут треба присісти.',1.1);
  }

  if(player.on&&Math.abs(player.vx)>20&&!player.crouching)runClock+=dt*11;

  if(player.y>VH+90){
    player.lives--;updateHud();respawn();toast('PERKY: яма. Повертаю до checkpoint.',2);
  }

  for(const b of beans){
    b.t+=dt*4;
    if(!b.got&&hit(player,{x:b.x-15,y:b.y-17,w:30,h:34})){
      b.got=true;player.beans++;updateHud();
    }
  }
  for(const t of tokens){
    if(!t.got&&hit(player,{x:t.x-20,y:t.y-20,w:40,h:40})){
      t.got=true;player.tokens++;updateHud();toast('Brovary Token ✦',1.2);
    }
  }

  if(!powerups.nitro.got&&hit(player,powerups.nitro)){
    powerups.nitro.got=true;player.nitro=10;updateHud();
    toast('PERKUP NITRO: швидкість + посилений стрибок.',2.8);
  }
  if(!powerups.shoes.got&&hit(player,powerups.shoes)){
    powerups.shoes.got=true;player.shoes=14;updateHud();
    toast('CHARME SPEED SHOES: mobility boost.',2.8);
  }
  if(!modules.doubleJump.got&&hit(player,modules.doubleJump)){
    modules.doubleJump.got=true;player.doubleJump=true;player.jumpsLeft=1;updateHud();
    toast('DOUBLE JUMP MODULE розблоковано.',2.8);
  }

  for(const e of enemies){
    if(!e.alive)continue;
    e.t+=dt;
    const dist=Math.abs((player.x+player.w/2)-(e.x+e.w/2));
    e.alert=dist<260?1:0;
    e.x+=e.v*dt*(e.alert?1.18:1);
    if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1;}
    if(e.kind==='drone')e.y=265+Math.sin(e.t*2.5)*34;
    if(hit(player,e)){
      if(player.vy>105&&oldBottom<=e.y+23){
        e.alive=false;player.vy=-355;toast('Ворог вимкнений.',.9);
      } else damage(e.x+e.w/2,e.kind==='scooter'?'самокатник':'ворог');
    }
  }

  if(!checkpoint.on&&hit(player,checkpoint)){
    checkpoint.on=true;player.spawnX=checkpoint.x-15;player.spawnY=GROUND-player.standH;
    toast('CHECKPOINT активовано.',1.7);
  }

  if(secret.revealed&&!secret.claimed&&hit(player,secret)){
    secret.claimed=true;player.tokens++;updateHud();toast('Секрет ХБ знайдено ✦',1.8);
  }

  if(finishGate.active&&!player.finished&&hit(player,finishGate)){
    if(player.beans<12){
      toast(`PERKY: ще ${12-player.beans} зерен до відкриття Розвилки.`,2);
      player.x=finishGate.x-player.w-8;
    } else {
      player.finished=true;finishGate.active=false;player.vx=0;updateState();
      toast('01-01 ПРОЙДЕНО · РОЗВИЛКА ВІДКРИТА',5);
      fetch('/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        playerName:'Гравець',characterId:'pbot',worldId:1,score:player.beans*100+player.tokens*500,
        beans:player.beans,timeMs:0
      })}).catch(()=>{});
    }
  }

  updateState();
  updateHud();
  const target=clamp(player.x-300,0,WORLD-VW);
  cam+=(target-cam)*Math.min(1,dt*5.4);
}

function drawPbot(rect,wx,wy,dw,dh,{flip=false,alpha=1}={}){
  const x=screenX(wx);
  ctx.save();ctx.globalAlpha*=alpha;
  ctx.translate(x+(flip?dw:0),wy);if(flip)ctx.scale(-1,1);
  ctx.drawImage(images.pbot,...rect,0,0,dw,dh);ctx.restore();
}
function drawActor(rect,wx,wy,dw,dh,{flip=false,alpha=1,glow=false}={}){
  const x=screenX(wx);ctx.save();ctx.globalAlpha*=alpha;
  if(glow){ctx.shadowColor='#42efe8';ctx.shadowBlur=16;}
  ctx.translate(x+(flip?dw:0),wy);if(flip)ctx.scale(-1,1);
  ctx.drawImage(images.actors,...rect,0,0,dw,dh);ctx.restore();
}
function drawShadow(wx,bottom,w=48,a=.22){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#071015';
  ctx.beginPath();ctx.ellipse(screenX(wx),bottom,w,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawBackground(){
  ctx.fillStyle='#6bc7ef';ctx.fillRect(0,0,VW,VH);
  const scale=VH/images.bg.height,w=images.bg.width*scale;
  const off=(cam*.28)%w;
  for(let i=-1;i<3;i++)ctx.drawImage(images.bg,i*w-off,0,w,VH);
  const mist=ctx.createLinearGradient(0,260,0,VH);
  mist.addColorStop(0,'rgba(235,250,245,0)');
  mist.addColorStop(1,'rgba(7,35,32,.10)');
  ctx.fillStyle=mist;ctx.fillRect(0,0,VW,VH);
}
function roundRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
function drawProp(p){
  const x=screenX(p.x),y=p.y;
  if(x>VW+400||x+p.w<-400)return;
  ctx.save();
  if(p.kind==='tree'){
    ctx.fillStyle='#6b4428';ctx.fillRect(x+p.w*.45,y+p.h*.46,p.w*.1,p.h*.54);
    const g=ctx.createRadialGradient(x+p.w*.5,y+p.h*.3,10,x+p.w*.5,y+p.h*.3,p.w*.55);
    g.addColorStop(0,'#9be14d');g.addColorStop(1,'#247c38');ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(x+p.w*.5,y+p.h*.3,p.w*.48,0,Math.PI*2);ctx.fill();
  } else if(p.kind==='bench'){
    ctx.strokeStyle='#25383e';ctx.lineWidth=6;ctx.fillStyle='#ae622d';
    ctx.fillRect(x+12,y+12,p.w-24,18);ctx.fillRect(x+12,y+35,p.w-24,14);
    ctx.beginPath();ctx.moveTo(x+20,y+45);ctx.lineTo(x+15,y+p.h);ctx.moveTo(x+p.w-20,y+45);ctx.lineTo(x+p.w-15,y+p.h);ctx.stroke();
  } else if(p.kind==='billboard'){
    roundRect(x,y,p.w,p.h,10,'#102027','#3d5660');ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#e9f8f4';ctx.font='900 19px system-ui';ctx.textAlign='center';ctx.fillText('НЕ ХУ#ОВІ',x+p.w/2,y+48);
    ctx.fillStyle='#f2c232';ctx.font='900 22px system-ui';ctx.fillText('БРОВАРИ',x+p.w/2,y+78);
    ctx.strokeStyle='#24383f';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x+35,y+p.h);ctx.lineTo(x+35,y+p.h+55);ctx.moveTo(x+p.w-35,y+p.h);ctx.lineTo(x+p.w-35,y+p.h+55);ctx.stroke();
  } else if(p.kind==='perkup'){
    roundRect(x,y,p.w,p.h,8,'#1b2423','#0e1414');ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#df8a35';ctx.fillRect(x+20,y+52,p.w-40,p.h-52);
    ctx.fillStyle='#12191a';ctx.fillRect(x+18,y+15,p.w-36,42);
    ctx.fillStyle='#f6f1e6';ctx.font='900 30px system-ui';ctx.textAlign='center';ctx.fillText('Perk',x+p.w*.45,y+47);
    ctx.fillStyle='#f3c52b';ctx.fillText('Up',x+p.w*.68,y+47);
    ctx.fillStyle='#9cebe0';ctx.font='800 12px system-ui';ctx.fillText('NITRO COFFEE',x+p.w/2,y+88);
  } else if(p.kind==='charme'){
    roundRect(x,y,p.w,p.h,8,'#ddd2c0','#6b635c');ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#141a1d';ctx.fillRect(x+25,y+14,p.w-50,46);
    ctx.fillStyle='#f6f0e8';ctx.font='900 28px serif';ctx.textAlign='center';ctx.fillText('CHARME',x+p.w/2,y+46);
    ctx.fillStyle='#222';ctx.fillRect(x+45,y+76,p.w-90,p.h-86);
    ctx.fillStyle='#e8c6a3';ctx.fillRect(x+57,y+88,(p.w-122)/2,p.h-110);ctx.fillRect(x+p.w/2+4,y+88,(p.w-122)/2,p.h-110);
  } else if(p.kind==='busstop'){
    ctx.strokeStyle='#314b52';ctx.lineWidth=8;ctx.fillStyle='rgba(125,202,211,.22)';
    ctx.fillRect(x+30,y+20,p.w-60,p.h-25);ctx.strokeRect(x+30,y+20,p.w-60,p.h-25);
    ctx.fillStyle='#2c4148';ctx.beginPath();ctx.roundRect(x+8,y,p.w-16,25,12);ctx.fill();
    ctx.fillStyle='#62492f';ctx.fillRect(x+75,y+p.h-35,p.w-150,15);
  } else if(p.kind==='barrier'){
    ctx.fillStyle='#e7e7e2';ctx.fillRect(x,y+10,p.w,p.h-20);ctx.fillStyle='#e54545';
    for(let i=-20;i<p.w+20;i+=34){ctx.save();ctx.translate(x+i,y+12);ctx.rotate(-.55);ctx.fillRect(0,0,16,p.h+10);ctx.restore();}
    ctx.fillStyle='#313b3f';ctx.fillRect(x+10,y+p.h-8,12,18);ctx.fillRect(x+p.w-22,y+p.h-8,12,18);
  } else if(p.kind==='scaffold'){
    ctx.strokeStyle='#46575b';ctx.lineWidth=8;ctx.beginPath();
    ctx.moveTo(x+25,y+p.h);ctx.lineTo(x+25,y);ctx.moveTo(x+p.w-25,y+p.h);ctx.lineTo(x+p.w-25,y);
    ctx.moveTo(x+25,y+58);ctx.lineTo(x+p.w-25,y+58);ctx.moveTo(x+25,y+110);ctx.lineTo(x+p.w-25,y+110);ctx.stroke();
    ctx.strokeStyle='#d3a33d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+15,y+60);ctx.lineTo(x+p.w-15,y+60);ctx.stroke();
  }
  ctx.restore();
}
function drawBean(b){
  const x=screenX(b.x),y=b.y+Math.sin(b.t)*4;ctx.save();ctx.translate(x,y);ctx.rotate(-.38);
  ctx.shadowColor='#f0b43c';ctx.shadowBlur=10;ctx.fillStyle='#8b4828';ctx.strokeStyle='#c67846';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,10,15,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#3b1e12';ctx.beginPath();ctx.moveTo(-1,-12);ctx.quadraticCurveTo(5,0,-1,12);ctx.stroke();ctx.restore();
}
function drawToken(t){
  const x=screenX(t.x),y=t.y+Math.sin(performance.now()/340)*4;
  ctx.save();ctx.shadowColor='#f5cf47';ctx.shadowBlur=13;ctx.fillStyle='#e7b528';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff0a0';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText('Б',x,y+5);ctx.restore();
}
function drawNitro(p){
  const x=screenX(p.x),y=p.y;ctx.save();ctx.shadowColor='#48eee0';ctx.shadowBlur=18;
  roundRect(x,y,p.w,p.h,13,'#172126','#48eee0');ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#48eee0';ctx.beginPath();ctx.moveTo(x+27,y+9);ctx.lineTo(x+14,y+35);ctx.lineTo(x+26,y+31);ctx.lineTo(x+20,y+57);ctx.lineTo(x+36,y+26);ctx.lineTo(x+26,y+29);ctx.closePath();ctx.fill();ctx.restore();
}
function drawShoes(p){
  const x=screenX(p.x),y=p.y;ctx.save();ctx.shadowColor='#e9c04c';ctx.shadowBlur=12;
  roundRect(x,y,p.w,p.h,18,'#ece0c6','#9c7d3f');ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#171717';ctx.font='900 12px system-ui';ctx.fillText('CHARME',x+12,y+31);ctx.restore();
}
function drawDouble(p){
  const x=screenX(p.x),y=p.y;ctx.save();ctx.shadowColor='#7ef8f0';ctx.shadowBlur=18;
  roundRect(x,y,p.w,p.h,16,'#102d34','#61ece4');ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#c9fffb';ctx.font='1000 22px system-ui';ctx.textAlign='center';ctx.fillText('2×',x+p.w/2,y+31);
  ctx.font='800 9px system-ui';ctx.fillText('JUMP',x+p.w/2,y+50);ctx.restore();
}
function drawCheckpoint(){
  const x=screenX(checkpoint.x),y=checkpoint.y;ctx.save();
  ctx.shadowColor=checkpoint.on?'#4cf3ed':'rgba(76,243,237,.35)';ctx.shadowBlur=checkpoint.on?22:8;
  roundRect(x+7,y+24,44,92,11,'#163038',checkpoint.on?'#4cf3ed':'#d5a93b');ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle=checkpoint.on?'#4cf3ed':'#d5a93b';ctx.beginPath();ctx.arc(x+29,y+18,17,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#071519';ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.fillText('CHECK',x+29,y+72);ctx.fillText('POINT',x+29,y+84);ctx.restore();
}
function drawFinish(){
  const x=screenX(finishGate.x),y=finishGate.y;ctx.save();ctx.shadowColor='#46eee3';ctx.shadowBlur=20;
  ctx.strokeStyle='#e1b437';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x+14,y+164);ctx.lineTo(x+14,y+58);ctx.quadraticCurveTo(x+65,y+5,x+116,y+58);ctx.lineTo(x+116,y+164);ctx.stroke();
  ctx.strokeStyle='#4cf3ed';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.beginPath();ctx.roundRect(x+32,y+66,66,82,18);ctx.stroke();ctx.setLineDash([]);
  roundRect(x+20,y+12,90,30,15,'rgba(5,22,27,.9)');ctx.fillStyle='#eefcfb';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('РОЗВИЛКА',x+65,y+32);ctx.restore();
}
function drawTrench(h){
  const x=screenX(h.x);ctx.save();ctx.fillStyle='#2a1c13';ctx.fillRect(x,GROUND-5,h.w,105);
  ctx.fillStyle='#111417';ctx.beginPath();ctx.ellipse(x+h.w/2,GROUND+8,h.w*.48,22,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#f2c13d';ctx.lineWidth=4;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(x-15,GROUND-5);ctx.lineTo(x+h.w+15,GROUND-5);ctx.stroke();ctx.restore();
}
function drawLowBar(h){
  const x=screenX(h.x);ctx.save();ctx.strokeStyle='#46585d';ctx.lineWidth=9;
  ctx.beginPath();ctx.moveTo(x+8,GROUND);ctx.lineTo(x+8,h.y);ctx.moveTo(x+h.w-8,GROUND);ctx.lineTo(x+h.w-8,h.y);ctx.moveTo(x,h.y);ctx.lineTo(x+h.w,h.y);ctx.stroke();
  ctx.strokeStyle='#e5ae37';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,h.y+12);ctx.lineTo(x+h.w,h.y+12);ctx.stroke();ctx.restore();
}
function drawEnemies(){
  for(const e of enemies){
    if(!e.alive)continue;
    if(e.alert){ctx.save();ctx.fillStyle='rgba(232,61,61,.18)';ctx.beginPath();ctx.arc(screenX(e.x+e.w/2),e.y+e.h/2,60,0,Math.PI*2);ctx.fill();ctx.restore();}
    drawShadow(e.x+e.w/2,GROUND+2,e.kind==='scooter'?48:34,.18);
    if(e.kind==='spam')drawActor(A.spam,e.x-5,e.y-2,76,84,{flip:e.v<0});
    else if(e.kind==='scooter')drawActor(A.scooter,e.x-6,e.y-18,108,84,{flip:e.v<0});
    else drawActor(A.drone,e.x-6,e.y-6,98,64,{flip:e.v<0,glow:true});
  }
}
function drawPerky(){
  const px=player.x-72+Math.sin(performance.now()/430)*7;
  const py=clamp(player.y-78+Math.sin(performance.now()/320)*5,120,345);
  drawActor(A.perky,px,py,62,95,{flip:player.facing<0,glow:pulseTime>0});
  if(pulseTime>0){
    ctx.save();ctx.strokeStyle=`rgba(76,243,237,${.35*pulseTime/2.2})`;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(screenX(px+31),py+40,90+(2.2-pulseTime)*150,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
}
function drawPlayer(){
  let r=P.idle,dh=116;
  if(player.state==='crouch'){r=P.crouch;dh=78;}
  else if(player.state==='jump')r=P.jump;
  else if(player.state==='run')r=[P.run1,P.run2,P.run3,P.run4,P.run5][Math.floor(runClock)%5];
  const dw=dh*r[2]/r[3];
  drawShadow(player.x+player.w/2,player.y+player.h+4,Math.max(24,dw*.34),.22);
  const y=player.y+player.h-dh;
  drawPbot(r,player.x+player.w/2-dw/2,y,dw,dh,{flip:player.facing<0,alpha:(inv>0&&Math.floor(inv*14)%2===0)?.42:1});
  if(player.nitro>0){
    ctx.save();ctx.strokeStyle='rgba(69,241,230,.8)';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(screenX(player.x)-8,player.y+45);ctx.lineTo(screenX(player.x)-38,player.y+45);ctx.stroke();ctx.restore();
  }
}
function drawSecret(){
  if(!secret.revealed||secret.claimed)return;
  const x=screenX(secret.x),y=secret.y;ctx.save();ctx.shadowColor='#4cf3ed';ctx.shadowBlur=20;
  ctx.fillStyle='rgba(4,27,32,.78)';ctx.strokeStyle='#4cf3ed';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,secret.w,secret.h,12);ctx.fill();ctx.stroke();
  ctx.fillStyle='#d9fffb';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('ХБ SECRET ✦',x+secret.w/2,y+24);ctx.restore();
}
function draw(){
  if(!ready||mode!=='play')return;
  ctx.clearRect(0,0,VW,VH);drawBackground();
  for(const p of props)drawProp(p);
  drawTrench(hazards[0]);drawLowBar(hazards[1]);
  for(const b of beans)if(!b.got)drawBean(b);
  for(const t of tokens)if(!t.got)drawToken(t);
  if(!powerups.nitro.got)drawNitro(powerups.nitro);
  if(!powerups.shoes.got)drawShoes(powerups.shoes);
  if(!modules.doubleJump.got)drawDouble(modules.doubleJump);
  drawCheckpoint();drawFinish();drawSecret();drawEnemies();drawPerky();drawPlayer();
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);

function press(name,down){
  if(name==='left')input.left=down;
  else if(name==='right')input.right=down;
  else if(name==='down')input.down=down;
  else if(name==='pulse'&&down&&!input.pulse)input.pulse=true;
  else if(name==='jump'){
    if(down&&!input.jump)input.jumpBuffer=.12;
    if(!down&&input.jump&&player&&player.vy<-170)player.vy*=.55;
    input.jump=down;
  }
}
function bindButton(b){
  const key=b.dataset.key;
  const down=e=>{
    e.preventDefault();e.stopPropagation();
    try{b.setPointerCapture(e.pointerId)}catch{}
    b.classList.add('held');press(key,true);
  };
  const up=e=>{
    e.preventDefault();e.stopPropagation();
    b.classList.remove('held');press(key,false);
    try{b.releasePointerCapture(e.pointerId)}catch{}
  };
  b.addEventListener('pointerdown',down,{passive:false});
  b.addEventListener('pointerup',up,{passive:false});
  b.addEventListener('pointercancel',up,{passive:false});
  b.addEventListener('lostpointercapture',()=>{b.classList.remove('held');press(key,false);});
  b.addEventListener('contextmenu',e=>e.preventDefault());
}
document.querySelectorAll('[data-key]').forEach(bindButton);
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  let m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':
    e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':
    e.code==='KeyE'||e.code==='KeyQ'?'pulse':null;
  if(!m)return;e.preventDefault();press(m,true);
});
addEventListener('keyup',e=>{
  let m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':
    e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':
    e.code==='KeyE'||e.code==='KeyQ'?'pulse':null;
  if(!m)return;e.preventDefault();press(m,false);
});
addEventListener('blur',()=>{for(const k of ['left','right','down','jump'])press(k,false);});

$('#startBtn').onclick=()=>{
  if(!ready){location.reload();return;}
  mode='play';$('.intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();
};
$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');$('.intro').classList.remove('hidden');};
