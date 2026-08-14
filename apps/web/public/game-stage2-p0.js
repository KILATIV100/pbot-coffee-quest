const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const VW = 960, VH = 540, WORLD = 2600, GROUND = 448;
const BUILD = 'p0-1';

const PATHS = {
  bg: `/assets/stage2/v3/level-bg.webp?v=${BUILD}`,
  pbot: `/assets/stage2/p0/pbot-p0.webp?v=${BUILD}`,
  actors: `/assets/stage2/p0/actors-p0.webp?v=${BUILD}`
};

const P = {
  idle:[17,8,74,121], run1:[113,8,90,121], run2:[215,8,90,120], run3:[318,8,92,121],
  run4:[12,175,84,121], run5:[111,175,92,121], crouch:[215,175,91,121], jump:[318,175,91,121]
};
const A = {perky:[24,9,124,191], spam:[178,6,164,126], scooter:[44,222,102,104], drone:[192,224,155,100]};
const images = {};
let ready=false, mode='intro', last=0, cam=0, runClock=0, toastTime=0, nitroTime=0, shoesTime=0, inv=0;
let player, beans, tokens, enemies, checkpoint, finishGate, powerups;
const input = {left:false,right:false,down:false,jump:false,jumpBuffer:0};

function loadImage(src, expected){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const timer=setTimeout(()=>reject(new Error(`Asset timeout: ${src}`)),10000);
    img.onload=()=>{clearTimeout(timer);if(expected&&(img.naturalWidth!==expected[0]||img.naturalHeight!==expected[1]))reject(new Error(`Bad asset size ${src}: ${img.naturalWidth}x${img.naturalHeight}`));else resolve(img)};
    img.onerror=()=>{clearTimeout(timer);reject(new Error(`Asset failed: ${src}`))};
    img.decoding='async';img.src=src;
  });
}
function setLoadError(err){console.error('P0 asset error',err);const b=$('#startBtn');b.textContent='ПОМИЛКА АСЕТІВ · ПОВТОРИТИ';b.disabled=false;}
Promise.all([
  loadImage(PATHS.bg,[1600,332]).then(i=>images.bg=i),
  loadImage(PATHS.pbot,[420,330]).then(i=>images.pbot=i),
  loadImage(PATHS.actors,[360,348]).then(i=>images.actors=i)
]).then(()=>{ready=true;const b=$('#startBtn');b.textContent='ПОЧАТИ';b.disabled=false;const intro=$('.intro');if(intro)intro.style.backgroundImage=`linear-gradient(90deg,rgba(1,8,12,.72),rgba(1,8,12,.06)),url('${PATHS.bg}')`;}).catch(setLoadError);

const solids=[{x:0,y:GROUND,w:WORLD,h:92,id:'street-ground'}];

function reset(){
  cam=runClock=toastTime=nitroTime=shoesTime=inv=0;
  player={x:115,y:GROUND-92,w:44,h:92,standH:92,crouchH:58,vx:0,vy:0,on:false,coyote:0,jumps:1,lives:3,beans:0,tokens:0,spawnX:115,spawnY:GROUND-92,facing:1,crouching:false,state:'idle',finished:false};
  beans=[[210,383],[340,355],[470,375],[610,346],[750,385],[905,365],[1080,382],[1220,350],[1370,382],[1515,360],[1695,350],[1810,360],[1940,350],[2070,360],[2200,350]].map(([x,y],i)=>({x,y,got:false,t:i*.47}));
  tokens=[{x:2135,y:325,got:false}];
  powerups={nitro:{x:515,y:GROUND-72,w:42,h:72,got:false},shoes:{x:1765,y:GROUND-44,w:88,h:44,got:false}};
  enemies=[{kind:'spam',x:790,y:GROUND-82,w:66,h:82,v:42,min:745,max:925,alive:true,t:0},{kind:'scooter',x:1235,y:GROUND-62,w:96,h:62,v:-145,min:1130,max:1435,alive:true,t:0},{kind:'drone',x:1965,y:275,w:82,h:54,v:72,min:1900,max:2180,alive:true,t:0}];
  checkpoint={x:1490,y:GROUND-112,w:54,h:112,on:false};
  finishGate={x:2350,y:GROUND-154,w:110,h:154,active:true};
  updateHud();toast('PERKY: P0 cleanup. Видимі колізії та окремий crouch активні.',3.4);
}
function updateHud(){$('#beans').textContent=player?.beans??0;$('#tokens').textContent=player?.tokens??0;$('#lives').textContent=player?.lives??3;}
function toast(text,seconds=2.5){const el=$('#toast');el.textContent=text;el.classList.add('on');toastTime=seconds;}
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setCrouch(on){if(!player)return;if(on&&!player.crouching&&player.on){const bottom=player.y+player.h;player.crouching=true;player.h=player.crouchH;player.y=bottom-player.h;}else if(!on&&player.crouching){const bottom=player.y+player.h;const candidate={x:player.x,y:bottom-player.standH,w:player.w,h:player.standH};const blocked=solids.some(s=>s.id!=='street-ground'&&hit(candidate,s));if(!blocked){player.crouching=false;player.h=player.standH;player.y=bottom-player.h;}}}
function respawn(){player.crouching=false;player.h=player.standH;player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0;}
function damage(fromX){if(inv>0||player.finished)return;player.lives--;inv=1.15;player.vy=-320;player.vx=player.x<fromX?-220:220;updateHud();if(player.lives<=0){player.lives=3;respawn();toast('PERKY: Повертаю до видимого checkpoint.');}}
function updateState(){if(player.finished){player.state='victory';return;}if(player.crouching){player.state='crouch';return;}if(!player.on){player.state='jump';return;}if(Math.abs(player.vx)>25){player.state='run';return;}player.state='idle';}
function update(dt){
  if(mode!=='play')return;
  if(toastTime>0&&(toastTime-=dt)<=0)$('#toast').classList.remove('on');
  nitroTime=Math.max(0,nitroTime-dt);shoesTime=Math.max(0,shoesTime-dt);inv=Math.max(0,inv-dt);input.jumpBuffer=Math.max(0,input.jumpBuffer-dt);
  setCrouch(input.down&&player.on&&!player.finished);
  const dir=(input.right?1:0)-(input.left?1:0),baseMax=(nitroTime?315:245)+(shoesTime?45:0),max=player.crouching?baseMax*.42:baseMax;
  if(!player.finished){if(dir){player.facing=dir;player.vx=clamp(player.vx+dir*2100*dt,-max,max)}else player.vx*=Math.pow(.035,dt)}else player.vx*=Math.pow(.01,dt);
  player.vy+=(player.vy<0?1580:2180)*dt;
  if(player.on){player.coyote=.13;player.jumps=1}else player.coyote=Math.max(0,player.coyote-dt);
  if(input.jumpBuffer>0&&!player.finished){if(player.crouching)setCrouch(false);if(player.coyote>0||player.jumps>0){input.jumpBuffer=0;const ground=player.coyote>0;if(!ground)player.jumps--;else player.jumps=1;player.vy=ground?(nitroTime?-690:-610):(nitroTime?-570:-505);player.on=false;player.coyote=0;}}
  const oldBottom=player.y+player.h;player.x=clamp(player.x+player.vx*dt,0,WORLD-player.w);player.y+=player.vy*dt;player.on=false;
  for(const s of solids){if(player.vy>=0&&oldBottom<=s.y+12&&hit(player,s)){player.y=s.y-player.h;player.vy=0;player.on=true;}}
  if(player.on&&Math.abs(player.vx)>20&&!player.crouching)runClock+=dt*11;
  if(player.y>VH+80){player.lives--;updateHud();respawn();toast('PERKY: Падіння. Повертаю до checkpoint.');}
  for(const b of beans){b.t+=dt*4;if(!b.got&&hit(player,{x:b.x-14,y:b.y-16,w:28,h:32})){b.got=true;player.beans++;updateHud();}}
  for(const t of tokens){if(!t.got&&hit(player,{x:t.x-20,y:t.y-20,w:40,h:40})){t.got=true;player.tokens++;updateHud();toast('Brovary Token знайдено ✦');}}
  if(!powerups.nitro.got&&hit(player,powerups.nitro)){powerups.nitro.got=true;nitroTime=9;toast('PerkUp Nitro · швидкість + стрибок',2.8);}
  if(!powerups.shoes.got&&hit(player,powerups.shoes)){powerups.shoes.got=true;shoesTime=12;toast('CHARME Speed Shoes · mobility boost',3);}
  for(const e of enemies){if(!e.alive)continue;e.t+=dt;e.x+=e.v*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1}if(e.kind==='drone')e.y=275+Math.sin(e.t*2.5)*28;if(hit(player,e)){if(player.vy>110&&oldBottom<=e.y+20){e.alive=false;player.vy=-355;toast(e.kind==='scooter'?'Самокатник знешкоджений':'Ворог вимкнений')}else damage(e.x+e.w/2)}}
  if(!checkpoint.on&&hit(player,checkpoint)){checkpoint.on=true;player.spawnX=checkpoint.x-18;player.spawnY=GROUND-player.standH;toast('Checkpoint активовано · термінал світиться');}
  if(finishGate.active&&!player.finished&&hit(player,finishGate)){player.finished=true;finishGate.active=false;player.vx=0;toast('Z0–Z3 ПРОЙДЕНО · ворота Розвилки активовано',4.5);}
  updateState();const target=clamp(player.x-315,0,WORLD-VW);cam+=(target-cam)*Math.min(1,dt*5.2);
}
function drawAtlas(img,r,wx,wy,dw,dh,{flip=false,alpha=1,glow=false}={}){const x=wx-cam;ctx.save();ctx.globalAlpha*=alpha;if(glow){ctx.shadowColor='rgba(70,238,221,.72)';ctx.shadowBlur=16}ctx.translate(x+(flip?dw:0),wy);if(flip)ctx.scale(-1,1);ctx.drawImage(img,r[0],r[1],r[2],r[3],0,0,dw,dh);ctx.restore();}
function drawBackground(){const scale=VH/images.bg.height,w=images.bg.width*scale;for(let i=0;i<3;i++){const x=i*w-cam*.72;ctx.save();if(i%2){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(images.bg,0,0,w,VH)}else ctx.drawImage(images.bg,x,0,w,VH);ctx.restore()}const haze=ctx.createLinearGradient(0,0,0,VH);haze.addColorStop(0,'rgba(0,8,12,.01)');haze.addColorStop(1,'rgba(0,8,12,.10)');ctx.fillStyle=haze;ctx.fillRect(0,0,VW,VH);}
function drawContactShadow(wx,bottom,w=64,alpha=.23){const x=wx-cam;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#071015';ctx.beginPath();ctx.ellipse(x,bottom,w,9,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawBean(x,y){x-=cam;ctx.save();ctx.translate(x,y);ctx.rotate(-.42);ctx.fillStyle='#8a4527';ctx.strokeStyle='#c67846';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,10,15,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#3e2014';ctx.beginPath();ctx.moveTo(-2,-12);ctx.quadraticCurveTo(5,0,-2,12);ctx.stroke();ctx.restore();}
function drawToken(x,y){x-=cam;ctx.save();ctx.shadowColor='#50e7df';ctx.shadowBlur=14;ctx.fillStyle='#e7b528';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0a0';ctx.font='900 16px system-ui';ctx.textAlign='center';ctx.fillText('Б',x,y+6);ctx.restore();}
function drawNitro(p){const x=p.x-cam,y=p.y;ctx.save();ctx.shadowColor='#4cf3ed';ctx.shadowBlur=16;ctx.fillStyle='#171b1c';ctx.beginPath();ctx.roundRect(x,y,p.w,p.h,12);ctx.fill();ctx.fillStyle='#4cf3ed';ctx.beginPath();ctx.moveTo(x+21,y+8);ctx.lineTo(x+12,y+30);ctx.lineTo(x+23,y+27);ctx.lineTo(x+16,y+47);ctx.lineTo(x+32,y+22);ctx.lineTo(x+23,y+24);ctx.closePath();ctx.fill();ctx.restore();}
function drawShoes(p){const x=p.x-cam,y=p.y;ctx.save();ctx.shadowColor='#f4c65c';ctx.shadowBlur=12;ctx.fillStyle='#f1e1c1';ctx.beginPath();ctx.roundRect(x,y,p.w,p.h,16);ctx.fill();ctx.fillStyle='#15191b';ctx.font='900 11px system-ui';ctx.fillText('CHARME',x+12,y+27);ctx.restore();}
function drawCheckpoint(){const x=checkpoint.x-cam,y=checkpoint.y;ctx.save();ctx.shadowColor=checkpoint.on?'#50e7df':'rgba(80,231,223,.35)';ctx.shadowBlur=checkpoint.on?22:8;ctx.fillStyle='#14282e';ctx.strokeStyle=checkpoint.on?'#50e7df':'#d4aa3a';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x+7,y+26,40,86,10);ctx.fill();ctx.stroke();ctx.fillStyle=checkpoint.on?'#50e7df':'#d4aa3a';ctx.beginPath();ctx.arc(x+27,y+20,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#061217';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText('CHECK',x+27,y+72);ctx.fillText('POINT',x+27,y+84);ctx.restore();}
function drawFinish(){const x=finishGate.x-cam,y=finishGate.y;ctx.save();ctx.shadowColor='#50e7df';ctx.shadowBlur=18;ctx.strokeStyle='#d4aa3a';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+12,y+154);ctx.lineTo(x+12,y+48);ctx.quadraticCurveTo(x+55,y+2,x+98,y+48);ctx.lineTo(x+98,y+154);ctx.stroke();ctx.strokeStyle='#50e7df';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.beginPath();ctx.roundRect(x+26,y+55,58,84,18);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(4,22,27,.82)';ctx.beginPath();ctx.roundRect(x+14,y+8,82,28,14);ctx.fill();ctx.fillStyle='#e8fffb';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('РОЗВИЛКА',x+55,y+27);ctx.restore();}
function drawWorldObjects(){drawCheckpoint();drawFinish();for(const b of beans){if(!b.got)drawBean(b.x,b.y+Math.sin(b.t)*5)}for(const t of tokens){if(!t.got)drawToken(t.x,t.y+Math.sin(performance.now()/350)*5)}if(!powerups.nitro.got)drawNitro(powerups.nitro);if(!powerups.shoes.got)drawShoes(powerups.shoes);}
function drawEnemies(){for(const e of enemies){if(!e.alive)continue;drawContactShadow(e.x+e.w/2,GROUND-3,e.kind==='scooter'?48:34,.18);if(e.kind==='spam')drawAtlas(images.actors,A.spam,e.x-8,e.y-15,82,94,{flip:e.v<0});else if(e.kind==='scooter')drawAtlas(images.actors,A.scooter,e.x-8,e.y-16,110,76,{flip:e.v<0});else drawAtlas(images.actors,A.drone,e.x-8,e.y-10,98,62,{flip:e.v<0,glow:true})}}
function drawPerky(){if(player.x>2290)return;const px=player.x-62+Math.sin(performance.now()/420)*8,py=clamp(player.y-84+Math.sin(performance.now()/310)*6,120,350);drawAtlas(images.actors,A.perky,px,py,58,90,{flip:player.facing<0,glow:true});}
function playerRect(){if(player.state==='idle')return P.idle;if(player.state==='crouch')return P.crouch;if(player.state==='jump'||player.state==='victory')return P.jump;const run=[P.run1,P.run2,P.run3,P.run4,P.run5];return run[Math.floor(runClock)%run.length];}
function drawPlayer(){const r=playerRect();let visualH=116;if(player.state==='crouch')visualH=104;if(player.state==='jump')visualH=118;const visualW=visualH*r[2]/r[3],bottom=player.y+player.h,wx=player.x+player.w/2-visualW/2,wy=bottom-visualH;drawContactShadow(player.x+player.w/2,bottom+2,32,player.on?.22:.08);ctx.save();if(inv>0&&Math.floor(inv*12)%2===0)ctx.globalAlpha=.45;drawAtlas(images.pbot,r,wx,wy,visualW,visualH,{flip:player.facing<0,glow:nitroTime>0});ctx.restore();}
function drawBoostChip(){if(nitroTime<=0&&shoesTime<=0)return;ctx.save();ctx.fillStyle='rgba(3,18,22,.72)';ctx.strokeStyle='rgba(83,236,219,.55)';ctx.beginPath();ctx.roundRect(20,67,205,32,16);ctx.fill();ctx.stroke();ctx.fillStyle='#dffbf8';ctx.font='800 12px system-ui';const bits=[];if(nitroTime>0)bits.push(`NITRO ${Math.ceil(nitroTime)}s`);if(shoesTime>0)bits.push(`CHARME ${Math.ceil(shoesTime)}s`);ctx.fillText(bits.join(' · '),34,88);ctx.restore();}
function draw(){if(!ready||mode!=='play')return;ctx.clearRect(0,0,VW,VH);drawBackground();drawWorldObjects();drawEnemies();drawPerky();drawPlayer();drawBoostChip();}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
$('#startBtn').onclick=()=>{if(!ready){location.reload();return;}mode='play';$('.intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();};
$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');$('.intro').classList.remove('hidden');};
function press(name,down){if(name==='left')input.left=down;if(name==='right')input.right=down;if(name==='down')input.down=down;if(name==='jump'){if(down&&!input.jump)input.jumpBuffer=.12;if(!down&&input.jump&&player&&player.vy<-180)player.vy*=.55;input.jump=down;}}
for(const b of document.querySelectorAll('[data-key]')){const k=b.dataset.key,on=e=>{e.preventDefault();b.classList.add('held');press(k,true)},off=e=>{e.preventDefault();b.classList.remove('held');press(k,false)};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',e=>{if(e.buttons)off(e)});}
addEventListener('keydown',e=>{const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(!m)return;e.preventDefault();press(m,true);});
addEventListener('keyup',e=>{const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(m){e.preventDefault();press(m,false);}});
