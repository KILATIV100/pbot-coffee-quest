const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const VW = 960, VH = 540, WORLD = 2600, GROUND = 448;

const PATHS = {
  bg: '/assets/stage2/v3/level-bg.webp',
  atlas: '/assets/stage2/v3/dynamic-atlas.webp'
};

const SPR = {
  p0:[4,4,59,123], p1:[67,4,72,123], p2:[142,4,73,123], p3:[219,4,73,123],
  p4:[296,4,67,123], p5:[367,4,73,123], p6:[4,131,73,123], p7:[81,131,73,123],
  perky:[159,132,60,93], spam:[227,132,62,87], scooter:[295,131,80,76], drone:[378,130,91,65],
  bean:[4,257,50,61], token:[57,257,60,67], nitro:[122,257,49,90], shoes:[179,258,86,43], checkpoint:[269,258,39,89]
};

const images = {};
let ready = false;
let mode = 'intro';
let last = 0;
let cam = 0;
let runClock = 0;
let toastTime = 0;
let nitroTime = 0;
let shoesTime = 0;
let inv = 0;
let finished = false;
let player, beans, tokens, enemies, checkpoint, powerups;

const input = {left:false,right:false,down:false,jump:false,jumpBuffer:0};

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error(`Asset failed: ${src}`));
    img.src=src;
  });
}

Promise.all(Object.entries(PATHS).map(async([k,v])=>images[k]=await loadImage(v)))
  .then(()=>{
    ready=true;
    $('#startBtn').textContent='ПОЧАТИ';
    drawIntroPreview();
  })
  .catch(err=>{
    console.error(err);
    $('#startBtn').textContent='ПОВТОРИТИ';
  });

function drawIntroPreview(){
  if(!images.bg) return;
  const intro=document.querySelector('.intro');
  if(intro) intro.style.backgroundImage=`linear-gradient(90deg,rgba(1,8,12,.78),rgba(1,8,12,.10)),url('${PATHS.bg}')`;
}

const solids = [
  {x:0,y:GROUND,w:2325,h:92},
  {x:1638,y:421,w:70,h:18,one:true},
  {x:1685,y:398,w:72,h:18,one:true},
  {x:1732,y:375,w:72,h:18,one:true},
  {x:1779,y:352,w:72,h:18,one:true},
  {x:1826,y:329,w:72,h:18,one:true},
  {x:1873,y:306,w:94,h:18,one:true},
  {x:1950,y:286,w:300,h:18,one:true},
  {x:2075,y:303,w:205,h:18,one:true}
];

function reset(){
  cam=runClock=toastTime=nitroTime=shoesTime=inv=0;
  finished=false;
  player={x:115,y:GROUND-92,w:44,h:92,vx:0,vy:0,on:false,coyote:0,jumps:1,lives:3,beans:0,tokens:0,spawnX:115,spawnY:GROUND-92,facing:1};
  beans=[
    [210,383],[340,355],[470,375],[610,346],[750,385],[905,365],
    [1080,382],[1220,350],[1370,382],[1515,360],[1695,330],[1775,305],
    [1860,277],[1975,250],[2120,257],[2260,348]
  ].map(([x,y],i)=>({x,y,got:false,t:i*.47}));
  tokens=[{x:2140,y:235,got:false}];
  powerups={
    nitro:{x:515,y:347,w:42,h:76,got:false},
    shoes:{x:1795,y:292,w:88,h:46,got:false}
  };
  enemies=[
    {kind:'spam',x:790,y:GROUND-78,w:58,h:78,v:42,min:745,max:925,alive:true,t:0},
    {kind:'scooter',x:1235,y:GROUND-58,w:86,h:58,v:-145,min:1130,max:1435,alive:true,t:0},
    {kind:'drone',x:1965,y:220,w:76,h:54,v:72,min:1900,max:2180,alive:true,t:0}
  ];
  checkpoint={x:1490,y:GROUND-106,w:42,h:106,on:false};
  updateHud();
  toast('PERKY: Z0–Z3 онлайн. Рухаємося через місто.',3.2);
}

function updateHud(){
  $('#beans').textContent=player?.beans??0;
  $('#tokens').textContent=player?.tokens??0;
  $('#lives').textContent=player?.lives??3;
}
function toast(text,seconds=2.5){
  $('#toast').textContent=text;
  $('#toast').classList.add('on');
  toastTime=seconds;
}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function damage(fromX){
  if(inv>0||finished) return;
  player.lives--;
  inv=1.15;
  player.vy=-320;
  player.vx=player.x<fromX?-220:220;
  updateHud();
  if(player.lives<=0){
    player.lives=3;
    respawn();
    toast('PERKY: Повертаю до checkpoint.');
  }
}
function respawn(){
  player.x=player.spawnX; player.y=player.spawnY; player.vx=player.vy=0;
}

function update(dt){
  if(mode!=='play') return;
  if(toastTime>0&&(toastTime-=dt)<=0) $('#toast').classList.remove('on');
  nitroTime=Math.max(0,nitroTime-dt);
  shoesTime=Math.max(0,shoesTime-dt);
  inv=Math.max(0,inv-dt);
  input.jumpBuffer=Math.max(0,input.jumpBuffer-dt);

  if(finished){
    player.vx*=Math.pow(.03,dt);
    return;
  }

  const dir=(input.right?1:0)-(input.left?1:0);
  if(dir) player.facing=dir;
  const boost=nitroTime>0||shoesTime>0;
  const max=boost?330:255;
  const accel=boost?2700:2300;
  if(dir) player.vx=clamp(player.vx+dir*accel*dt,-max,max);
  else player.vx*=Math.pow(.025,dt);

  player.vy+=(player.vy<0?1640:2240)*dt;
  if(player.on){player.coyote=.14;player.jumps=1;} else player.coyote=Math.max(0,player.coyote-dt);

  if(input.jumpBuffer>0&&(player.coyote>0||player.jumps>0)){
    const grounded=player.coyote>0;
    if(grounded) player.jumps=1; else player.jumps--;
    player.vy=grounded?(nitroTime>0?-690:-605):(nitroTime>0?-575:-505);
    player.on=false; player.coyote=0; input.jumpBuffer=0;
  }

  const oldBottom=player.y+player.h;
  player.x=clamp(player.x+player.vx*dt,0,WORLD-player.w);
  player.y+=player.vy*dt;
  player.on=false;
  for(const s of solids){
    if(s.one&&player.vy<0) continue;
    if(player.vy>=0&&oldBottom<=s.y+14&&hit(player,s)){
      player.y=s.y-player.h; player.vy=0; player.on=true;
    }
  }
  if(player.on&&Math.abs(player.vx)>25) runClock+=dt*11;

  if(player.y>VH+60||player.x>2360&&player.y>GROUND-10){
    damage(player.x+100); respawn();
  }

  for(const b of beans){
    b.t+=dt*4;
    if(!b.got&&hit(player,{x:b.x-14,y:b.y-16,w:28,h:32})){
      b.got=true; player.beans++; updateHud();
    }
  }
  for(const t of tokens){
    if(!t.got&&hit(player,{x:t.x-20,y:t.y-20,w:40,h:40})){
      t.got=true; player.tokens++; updateHud(); toast('Brovary Token знайдено ✦');
    }
  }

  const n=powerups.nitro;
  if(!n.got&&hit(player,n)){
    n.got=true; nitroTime=9; toast('PerkUp Nitro · швидкість + стрибок',2.8);
  }
  const sh=powerups.shoes;
  if(!sh.got&&hit(player,sh)){
    sh.got=true; shoesTime=12; toast('CHARME Speed Shoes · mobility boost',3);
  }

  for(const e of enemies){
    if(!e.alive) continue;
    e.t+=dt; e.x+=e.v*dt;
    if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1;}
    if(e.kind==='drone') e.y=220+Math.sin(e.t*2.5)*28;
    if(hit(player,e)){
      if(player.vy>110&&oldBottom<=e.y+20){
        e.alive=false; player.vy=-355;
        toast(e.kind==='scooter'?'Самокатник знешкоджений':'Ворог вимкнений');
      }else damage(e.x+e.w/2);
    }
  }

  if(!checkpoint.on&&hit(player,checkpoint)){
    checkpoint.on=true;
    player.spawnX=1460; player.spawnY=GROUND-92;
    toast('Checkpoint · маршрут збережено');
  }

  if(player.x>2265){
    finished=true; player.vx=0;
    toast('Z0–Z3 ПРОЙДЕНО · далі Intel / secret route',4.5);
  }

  const target=clamp(player.x-315,0,WORLD-VW);
  cam+=(target-cam)*Math.min(1,dt*5.2);
}

function sprite(key,wx,wy,dw,dh,{flip=false,alpha=1,glow=false}={}){
  const r=SPR[key]; if(!r||!images.atlas) return;
  const x=wx-cam;
  ctx.save(); ctx.globalAlpha*=alpha;
  if(glow){ctx.shadowColor='rgba(70,238,221,.8)';ctx.shadowBlur=18;}
  ctx.translate(x+(flip?dw:0),wy);
  if(flip) ctx.scale(-1,1);
  ctx.drawImage(images.atlas,r[0],r[1],r[2],r[3],0,0,dw,dh);
  ctx.restore();
}

function drawBackground(){
  ctx.fillStyle='#65c9ef';ctx.fillRect(0,0,VW,VH);
  ctx.drawImage(images.bg,0,0,images.bg.width,images.bg.height,-cam,0,WORLD,VH);
  const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'rgba(0,12,18,.02)');g.addColorStop(1,'rgba(0,12,18,.08)');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
}

function drawCollectibles(){
  for(const b of beans){if(b.got)continue;const bob=Math.sin(b.t)*5;sprite('bean',b.x-13,b.y-15+bob,27,34,{glow:true});}
  for(const t of tokens){if(t.got)continue;const bob=Math.sin(performance.now()/350)*5;sprite('token',t.x-20,t.y-20+bob,40,45,{glow:true});}
  if(!powerups.nitro.got){sprite('nitro',powerups.nitro.x,powerups.nitro.y,42,76,{glow:true});}
  if(!powerups.shoes.got){sprite('shoes',powerups.shoes.x,powerups.shoes.y,88,44,{glow:true});}
  sprite('checkpoint',checkpoint.x,checkpoint.y,42,106,{alpha:checkpoint.on?1:.78,glow:checkpoint.on});
}

function drawEnemies(){
  for(const e of enemies){
    if(!e.alive)continue;
    if(e.kind==='spam') sprite('spam',e.x-4,e.y-8,66,92,{flip:e.v<0});
    else if(e.kind==='scooter') sprite('scooter',e.x-7,e.y-18,100,80,{flip:e.v<0});
    else sprite('drone',e.x-8,e.y-8,92,66,{flip:e.v<0,glow:true});
  }
}

function drawPerky(){
  if(player.x>2290)return;
  const px=player.x-58+Math.sin(performance.now()/420)*8;
  const py=clamp(player.y-70+Math.sin(performance.now()/310)*6,120,350);
  sprite('perky',px,py,57,88,{flip:player.facing<0,glow:true});
}

function drawPlayer(){
  const airborne=!player.on;
  let key='p0';
  if(airborne) key=player.vy<0?'p6':'p7';
  else if(Math.abs(player.vx)>25) key='p'+(1+(Math.floor(runClock)%5));
  const h=input.down&&player.on?94:116;
  const r=SPR[key]; const w=h*r[2]/r[3];
  ctx.save();
  if(inv>0&&Math.floor(inv*12)%2===0)ctx.globalAlpha=.45;
  sprite(key,player.x+player.w/2-w/2,player.y+player.h-h,w,h,{flip:player.facing<0});
  ctx.restore();
}

function draw(){
  if(!ready||mode!=='play') return;
  ctx.clearRect(0,0,VW,VH);
  drawBackground();
  drawCollectibles();
  drawEnemies();
  drawPerky();
  drawPlayer();

  if(nitroTime>0||shoesTime>0){
    ctx.save();ctx.fillStyle='rgba(3,18,22,.72)';ctx.strokeStyle='rgba(83,236,219,.55)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(20,67,190,32,16);ctx.fill();ctx.stroke();
    ctx.fillStyle='#dffbf8';ctx.font='800 12px system-ui';
    const bits=[];if(nitroTime>0)bits.push(`NITRO ${Math.ceil(nitroTime)}s`);if(shoesTime>0)bits.push(`CHARME ${Math.ceil(shoesTime)}s`);
    ctx.fillText(bits.join(' · '),34,88);ctx.restore();
  }
}

function loop(t){
  const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

$('#startBtn').onclick=()=>{
  if(!ready){location.reload();return;}
  mode='play';document.querySelector('.intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();
};
$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');document.querySelector('.intro').classList.remove('hidden');};

function press(name,down){
  if(name==='left')input.left=down;
  if(name==='right')input.right=down;
  if(name==='down')input.down=down;
  if(name==='jump'){
    if(down&&!input.jump)input.jumpBuffer=.12;
    if(!down&&input.jump&&player&&player.vy<-180)player.vy*=.55;
    input.jump=down;
  }
}
for(const b of document.querySelectorAll('[data-key]')){
  const k=b.dataset.key;
  const on=e=>{e.preventDefault();b.classList.add('held');press(k,true);};
  const off=e=>{e.preventDefault();b.classList.remove('held');press(k,false);};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',e=>{if(e.buttons)off(e);});
}
addEventListener('keydown',e=>{
  const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;
  if(!m)return;e.preventDefault();press(m,true);
});
addEventListener('keyup',e=>{
  const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;
  if(m){e.preventDefault();press(m,false);}
});