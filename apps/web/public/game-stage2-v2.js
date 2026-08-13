const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const VW = 960, VH = 540, WORLD = 3600, GROUND = 432;

const assetPaths = {
  bg: '/assets/backgrounds/world01-level01.webp',
  pbot: '/assets/characters/pbot/sheet.webp'
};
const images = {};
const frames = [];
const pbotRects = [
  [16,67,75,148],[101,70,85,142],[193,71,85,140],[287,72,86,138],
  [388,74,80,140],[479,78,85,137],[572,79,84,136],[665,54,89,143]
];
let ready = false;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function makeTransparentFrame(img, rect) {
  const [sx, sy, sw, sh] = rect;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const g = c.getContext('2d', {willReadFrequently:true});
  g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const id = g.getImageData(0, 0, sw, sh);
  const d = id.data;
  const cornerSamples = [0, sw - 1, (sh - 1) * sw, sh * sw - 1].map(n => {
    const i = n * 4;
    return [d[i], d[i+1], d[i+2]];
  });
  const seen = new Uint8Array(sw * sh);
  const q = [];
  const isBackground = (i) => cornerSamples.some(([r,g,b]) =>
    Math.abs(d[i]-r) + Math.abs(d[i+1]-g) + Math.abs(d[i+2]-b) < 48
  );
  const push = (x,y) => {
    if (x < 0 || y < 0 || x >= sw || y >= sh) return;
    const n = y * sw + x;
    if (seen[n]) return;
    const i = n * 4;
    if (!isBackground(i)) return;
    seen[n] = 1;
    q.push(n);
  };
  for (let x=0; x<sw; x++) { push(x,0); push(x,sh-1); }
  for (let y=0; y<sh; y++) { push(0,y); push(sw-1,y); }
  for (let head=0; head<q.length; head++) {
    const n = q[head];
    const x = n % sw, y = Math.floor(n / sw);
    d[n*4+3] = 0;
    push(x-1,y); push(x+1,y); push(x,y-1); push(x,y+1);
  }
  g.putImageData(id,0,0);
  return c;
}

Promise.all(Object.entries(assetPaths).map(async ([k,v]) => images[k] = await loadImage(v)))
  .then(() => {
    pbotRects.forEach(r => frames.push(makeTransparentFrame(images.pbot, r)));
    ready = true;
    $('#startBtn').textContent = 'ПОЧАТИ';
  })
  .catch(err => {
    console.error('Stage2 assets failed', err);
    $('#startBtn').textContent = 'ПОВТОРИТИ';
  });

const input = {left:false,right:false,down:false,jump:false,jumpPress:false};
let mode = 'intro', last = 0, cam = 0, toastTime = 0, nitro = 0, inv = 0, runClock = 0;
let player, beans, tokens, enemies, checkpoint;

const solids = [
  {x:0,y:GROUND,w:1320,h:108},
  {x:1450,y:GROUND,w:1020,h:108},
  {x:2710,y:GROUND,w:890,h:108},
  {x:660,y:320,w:265,h:18,one:true},
  {x:1135,y:350,w:170,h:18,one:true},
  {x:1540,y:305,w:320,h:18,one:true},
  {x:1970,y:315,w:300,h:18,one:true},
  {x:2840,y:300,w:340,h:18,one:true}
];

function reset() {
  cam = toastTime = nitro = inv = runClock = 0;
  player = {x:105,y:GROUND-106,w:52,h:106,vx:0,vy:0,on:false,coyote:0,jumps:2,lives:3,beans:0,tokens:0,spawnX:105,spawnY:GROUND-106};
  beans = [180,350,535,720,865,1040,1250,1510,1680,1840,2030,2200,2380,2540,2780,2960,3160,3370]
    .map((x,i)=>({x,y:[350,300,260][i%3],got:false,t:i*.55}));
  tokens = [{x:1815,y:246,got:false},{x:3050,y:245,got:false}];
  enemies = [
    {kind:'paper',x:1210,y:GROUND-88,w:74,h:88,v:52,min:1160,max:1370,alive:true,t:0},
    {kind:'scooter',x:2240,y:GROUND-64,w:110,h:64,v:-140,min:2130,max:2460,alive:true,t:0},
    {kind:'drone',x:3000,y:236,w:96,h:64,v:78,min:2910,max:3260,alive:true,t:0}
  ];
  checkpoint = {x:2510,y:GROUND-116,w:54,h:116,on:false};
  updateHud();
  toast('PERKY: Маршрут відкрито. Місто прокидається.', 3.1);
}
function updateHud(){ $('#beans').textContent=player?.beans||0; $('#tokens').textContent=player?.tokens||0; $('#lives').textContent=player?.lives||3; }
function toast(text, seconds=2.3){ $('#toast').textContent=text; $('#toast').classList.add('on'); toastTime=seconds; }
function intersects(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
function damage(){
  if(inv>0) return;
  player.lives--; inv=1.15; updateHud();
  if(player.lives<=0){ player.lives=3; player.x=player.spawnX; player.y=player.spawnY; player.vx=player.vy=0; toast('PERKY: Відкат до checkpoint.'); }
}

function update(dt){
  if(mode!=='play') return;
  if(toastTime>0 && (toastTime-=dt)<=0) $('#toast').classList.remove('on');
  nitro=Math.max(0,nitro-dt); inv=Math.max(0,inv-dt);
  const dir=(input.right?1:0)-(input.left?1:0), max=nitro?332:258;
  if(dir) player.vx=Math.max(-max,Math.min(max,player.vx+dir*2400*dt)); else player.vx*=Math.pow(.035,dt);
  player.vy+=(player.vy<0?1660:2260)*dt;
  if(player.on){ player.coyote=.13; player.jumps=2; } else player.coyote=Math.max(0,player.coyote-dt);
  if(input.jumpPress){
    input.jumpPress=false;
    if(player.coyote>0 || player.jumps>0){
      const ground=player.coyote>0;
      if(!ground) player.jumps--; else player.jumps=1;
      player.vy=ground?(nitro?-690:-610):(nitro?-585:-510);
      player.on=false; player.coyote=0;
    }
  }
  const oldY=player.y;
  player.x=Math.max(0,Math.min(WORLD-player.w,player.x+player.vx*dt));
  player.y+=player.vy*dt; player.on=false;
  for(const s of solids){
    if(s.one && player.vy<0) continue;
    if(player.vy>=0 && oldY+player.h<=s.y+12 && intersects(player,s)){
      player.y=s.y-player.h; player.vy=0; player.on=true;
    }
  }
  if(player.on && Math.abs(player.vx)>20) runClock+=dt*11;
  if(player.y>VH+80){ damage(); player.x=player.spawnX; player.y=player.spawnY; player.vx=player.vy=0; }
  for(const b of beans){ b.t+=dt*4; if(!b.got && intersects(player,{x:b.x-14,y:b.y-16,w:28,h:32})){ b.got=true; player.beans++; updateHud(); } }
  for(const t of tokens){ if(!t.got && intersects(player,{x:t.x-20,y:t.y-20,w:40,h:40})){ t.got=true; player.tokens++; updateHud(); toast('Brovary Token знайдено ✦'); } }
  if(nitro<=0 && intersects(player,{x:900,y:285,w:48,h:70})){ nitro=8; toast('PerkUp Nitro: швидкість + стрибок',2.7); }
  for(const e of enemies){
    if(!e.alive) continue;
    e.t+=dt; e.x+=e.v*dt; if(e.x<e.min||e.x>e.max)e.v*=-1;
    if(e.kind==='drone') e.y=236+Math.sin(e.t*2.5)*24;
    if(intersects(player,e)){
      if(player.vy>110 && oldY+player.h<=e.y+18){ e.alive=false; player.vy=-355; toast(e.kind==='scooter'?'Самокатник знешкоджений':'Ворог вимкнений'); }
      else damage();
    }
  }
  if(!checkpoint.on && intersects(player,checkpoint)){ checkpoint.on=true; player.spawnX=2485; player.spawnY=GROUND-106; toast('Checkpoint збережено'); }
  if(player.x>3470){ player.x=3470; player.vx=0; toast('Z0–Z2 завершено · попереду CHARME Mobility',4); }
  const target=Math.max(0,Math.min(WORLD-VW,player.x-320));
  cam+=(target-cam)*Math.min(1,dt*5.2);
}

function rounded(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
function drawBackground(){
  const segW=1250;
  for(let i=0;i<3;i++){
    const x=i*1200-cam*.55;
    ctx.save();
    if(i===1){ ctx.translate(x+segW,0); ctx.scale(-1,1); ctx.drawImage(images.bg,0,0,images.bg.width,images.bg.height,0,0,segW,VH); }
    else ctx.drawImage(images.bg,0,0,images.bg.width,images.bg.height,x,0,segW,VH);
    ctx.restore();
  }
  const haze=ctx.createLinearGradient(0,230,0,VH); haze.addColorStop(0,'rgba(2,10,13,0)'); haze.addColorStop(1,'rgba(2,10,13,.18)'); ctx.fillStyle=haze; ctx.fillRect(0,0,VW,VH);
}
function drawPavement(){
  ctx.save(); ctx.translate(-cam,0);
  for(const [x,w] of [[0,1320],[1450,1020],[2710,890]]){
    const g=ctx.createLinearGradient(0,GROUND,0,VH); g.addColorStop(0,'rgba(210,207,192,.94)'); g.addColorStop(.12,'rgba(112,116,108,.94)'); g.addColorStop(1,'rgba(50,55,53,.98)');
    ctx.fillStyle=g; ctx.fillRect(x,GROUND,w,VH-GROUND); ctx.fillStyle='rgba(239,231,204,.92)'; ctx.fillRect(x,GROUND,w,7);
  }
  const trench=1320; ctx.fillStyle='#32251e'; ctx.beginPath(); ctx.moveTo(trench,GROUND);ctx.lineTo(1450,GROUND);ctx.lineTo(1425,VH);ctx.lineTo(1342,VH);ctx.closePath();ctx.fill();
  ctx.fillStyle='#16758b';ctx.fillRect(2470,GROUND,240,VH-GROUND);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=3;for(let y=GROUND+15;y<VH;y+=24){ctx.beginPath();ctx.moveTo(2480,y);ctx.quadraticCurveTo(2590,y-8,2700,y);ctx.stroke();}
  ctx.restore();
}
function drawBench(wx,y=365){ const x=wx-cam;ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=12;ctx.fillStyle='#865236';rounded(x,y,160,18,6);ctx.fill();rounded(x+6,y-33,148,18,6);ctx.fill();ctx.fillStyle='#29393b';ctx.fillRect(x+22,y+15,10,42);ctx.fillRect(x+128,y+15,10,42);ctx.restore(); }
function drawPlanter(wx,y=368){const x=wx-cam;ctx.fillStyle='#b9a98d';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+126,y);ctx.lineTo(x+110,y+64);ctx.lineTo(x+16,y+64);ctx.closePath();ctx.fill();ctx.fillStyle='#3d7b49';for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(x+15+i*13,y-5-(i%3)*6,16,0,Math.PI*2);ctx.fill();}}
function drawLamp(wx){const x=wx-cam;ctx.fillStyle='#26383b';ctx.fillRect(x,218,8,214);ctx.beginPath();ctx.arc(x+4,218,20,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f5d179';ctx.beginPath();ctx.arc(x+4,218,11,0,Math.PI*2);ctx.fill();}
function drawKiosk(wx,label,accent){const x=wx-cam,y=332;ctx.save();ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=16;ctx.fillStyle='#17343a';rounded(x,y,195,100,12);ctx.fill();ctx.fillStyle=accent;rounded(x+10,y+10,175,34,9);ctx.fill();ctx.fillStyle='#082529';ctx.font='1000 22px system-ui';ctx.textAlign='center';ctx.fillText(label,x+97,y+35);ctx.restore();}
function drawNews(wx){const x=wx-cam,y=318;ctx.fillStyle='#162e34';rounded(x,y,165,114,10);ctx.fill();ctx.fillStyle='#f3e9d7';rounded(x+10,y+10,145,72,5);ctx.fill();ctx.fillStyle='#182b31';ctx.font='900 12px system-ui';ctx.fillText('НЕ ХУ#ОВІ',x+28,y+38);ctx.fillText('БРОВАРИ',x+41,y+58);ctx.fillStyle='#53e2d6';ctx.fillRect(x+22,y+88,120,6);}
function drawBusStop(wx){const x=wx-cam,y=300;ctx.fillStyle='rgba(14,48,58,.52)';ctx.strokeStyle='#e5ece8';ctx.lineWidth=5;rounded(x,y,300,128,12);ctx.fill();ctx.stroke();ctx.fillStyle='#243438';rounded(x-14,y-18,328,25,9);ctx.fill();ctx.fillStyle='#51e4d7';ctx.font='900 15px system-ui';ctx.fillText('BROVARY · STOP',x+18,y+29);}
function drawStairs(wx){const x=wx-cam;ctx.fillStyle='#c8c2ad';for(let i=0;i<7;i++)ctx.fillRect(x+i*25,GROUND-18-i*17,185-i*25,18);}
function drawWorldProps(){drawBench(285);drawLamp(535);drawKiosk(690,'PerkUP','#f1ba4c');drawPlanter(1040);drawNews(1170);drawBusStop(1545);drawStairs(1885);drawKiosk(2070,'CHARME','#e5c483');drawLamp(2760);drawBench(3210);}
function drawBean(b){ctx.save();ctx.translate(b.x-cam,b.y+Math.sin(b.t)*5);ctx.rotate(.45);const g=ctx.createRadialGradient(-4,-6,2,0,0,16);g.addColorStop(0,'#ffd26e');g.addColorStop(.35,'#b36c25');g.addColorStop(1,'#6f3516');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,10,15,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawToken(t){ctx.save();ctx.translate(t.x-cam,t.y);ctx.shadowColor='#ffd95b';ctx.shadowBlur=18;ctx.fillStyle='#f4bd3d';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1b6';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#273338';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Б',0,1);ctx.restore();}
function drawNitro(){if(nitro>0)return;const x=920-cam,y=322;ctx.save();ctx.shadowColor='#55eadc';ctx.shadowBlur=22;ctx.fillStyle='#153d43';rounded(x,y,34,46,8);ctx.fill();ctx.fillStyle='#55eadc';ctx.fillRect(x+6,y+8,22,24);ctx.fillStyle='#09292d';ctx.font='900 9px system-ui';ctx.fillText('N2',x+10,y+24);ctx.restore();}
function drawCheckpoint(){const x=checkpoint.x-cam,y=checkpoint.y;ctx.save();ctx.shadowColor=checkpoint.on?'#55eadc':'rgba(0,0,0,.3)';ctx.shadowBlur=checkpoint.on?22:8;ctx.fillStyle='#23383d';rounded(x,y,42,116,12);ctx.fill();ctx.fillStyle=checkpoint.on?'#55eadc':'#e2bb58';ctx.beginPath();ctx.arc(x+21,y+24,10,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawCollectibles(){beans.forEach(b=>{if(!b.got)drawBean(b)});tokens.forEach(t=>{if(!t.got)drawToken(t)});drawNitro();drawCheckpoint();}
function drawSpam(e){const x=e.x-cam,y=e.y;ctx.fillStyle='#24363b';rounded(x,y,e.w,e.h,15);ctx.fill();ctx.fillStyle='#55eadc';rounded(x+10,y+12,e.w-20,20,8);ctx.fill();ctx.fillStyle='#f1eee3';ctx.fillRect(x+13,y+50,e.w-26,24);}
function drawScooter(e){const x=e.x-cam,y=e.y;ctx.save();ctx.translate(e.v<0?x+e.w:x,y);if(e.v<0)ctx.scale(-1,1);ctx.strokeStyle='#22383c';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(28,41);ctx.lineTo(75,41);ctx.lineTo(88,10);ctx.lineTo(103,10);ctx.stroke();ctx.fillStyle='#ef8f36';ctx.beginPath();ctx.arc(24,52,13,0,Math.PI*2);ctx.arc(86,52,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1e3034';rounded(45,1,35,35,12);ctx.fill();ctx.restore();}
function drawDrone(e){const x=e.x-cam,y=e.y;ctx.save();ctx.shadowColor='#55eadc';ctx.shadowBlur=18;ctx.fillStyle='#26383d';rounded(x+22,y+18,54,34,15);ctx.fill();ctx.strokeStyle='#55eadc';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+24,y+28);ctx.lineTo(x,y+8);ctx.moveTo(x+74,y+28);ctx.lineTo(x+98,y+8);ctx.stroke();ctx.fillStyle='#55eadc';ctx.beginPath();ctx.arc(x+49,y+35,7,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawEnemies(){for(const e of enemies)if(e.alive)(e.kind==='paper'?drawSpam(e):e.kind==='scooter'?drawScooter(e):drawDrone(e));}
function drawPerky(){if(player.x>1150)return;const x=player.x-cam-68,y=Math.max(190,player.y-55);ctx.save();ctx.shadowColor='#55eadc';ctx.shadowBlur=22;ctx.fillStyle='#2c2a25';ctx.beginPath();ctx.ellipse(x+25,y+28,24,28,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#55eadc';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#55eadc';ctx.beginPath();ctx.arc(x+18,y+25,4,0,Math.PI*2);ctx.arc(x+32,y+25,4,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawPlayer(){const idx=!player.on?7:Math.abs(player.vx)>22?1+(Math.floor(runClock)%6):0,fr=frames[idx]||frames[0];if(!fr)return;const targetH=input.down&&player.on?84:116,targetW=targetH*fr.width/fr.height;ctx.save();ctx.globalAlpha=inv&&Math.floor(inv*12)%2?.45:1;ctx.translate(player.x-cam+player.w/2,player.y+player.h);if(player.vx<0)ctx.scale(-1,1);ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=10;ctx.drawImage(fr,-targetW/2,-targetH,targetW,targetH);ctx.restore();}
function draw(){if(mode!=='play'||!ready)return;ctx.clearRect(0,0,VW,VH);drawBackground();drawPavement();drawWorldProps();drawCollectibles();drawEnemies();drawPerky();drawPlayer();}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
function start(){if(!ready){$('#startBtn').textContent='ЗАВАНТАЖЕННЯ…';return;}mode='play';$('#intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();}
$('#startBtn').onclick=start;$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');$('#intro').classList.remove('hidden');};
for(const b of document.querySelectorAll('[data-key]')){const n=b.dataset.key;const down=e=>{e.preventDefault();b.classList.add('held');if(n==='jump'&&!input.jump)input.jumpPress=true;input[n]=true;};const up=e=>{e.preventDefault();b.classList.remove('held');input[n]=false;};b.onpointerdown=down;b.onpointerup=up;b.onpointercancel=up;}
addEventListener('keydown',e=>{const n=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(!n)return;e.preventDefault();if(n==='jump'&&!input.jump)input.jumpPress=true;input[n]=true;});
addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')input.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')input.right=false;if(e.code==='ArrowDown'||e.code==='KeyS')input.down=false;if(['Space','ArrowUp','KeyW'].includes(e.code))input.jump=false;});
