const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const VW=960, VH=540, WORLD=2600, GROUND=448;
const ASSET_VERSION='art6';
const PATHS={
  bg:`/assets/stage2/v3/level-bg.webp?v=${ASSET_VERSION}`,
  atlas:`/assets/stage2/v3/dynamic-atlas.webp?v=${ASSET_VERSION}`
};
const SPR={
  p0:[4,4,59,123],p1:[67,4,72,123],p2:[142,4,73,123],p3:[219,4,73,123],
  p4:[296,4,67,123],p5:[367,4,73,123],p6:[4,131,73,123],p7:[81,131,73,123],
  perky:[159,132,60,93],spam:[227,132,62,87],scooter:[295,131,80,76],drone:[378,130,91,65],
  bean:[4,257,50,61],token:[57,257,60,67],nitro:[122,257,49,90],shoes:[179,258,86,43],checkpoint:[269,258,39,89]
};
const images={};
let ready=false,mode='intro',last=0,cam=0,runClock=0,toastTime=0,nitroTime=0,shoesTime=0,inv=0,finished=false;
let player,beans,tokens,enemies,checkpoint,powerups;
const input={left:false,right:false,down:false,jump:false,jumpBuffer:0};

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const timer=setTimeout(()=>reject(new Error(`Asset timeout: ${src}`)),10000);
    img.onload=()=>{clearTimeout(timer);resolve(img)};
    img.onerror=()=>{clearTimeout(timer);reject(new Error(`Asset failed: ${src}`))};
    img.decoding='async'; img.src=src;
  });
}
function setLoadError(err){
  console.error('Stage 2 v4 asset error',err);
  const b=$('#startBtn'); b.textContent='ПОМИЛКА АСЕТІВ · ПОВТОРИТИ'; b.disabled=false;
}
Promise.all(Object.entries(PATHS).map(async([k,v])=>images[k]=await loadImage(v))).then(()=>{
  if(images.bg.naturalWidth!==1600||images.bg.naturalHeight!==332) throw new Error(`Bad bg dimensions ${images.bg.naturalWidth}x${images.bg.naturalHeight}`);
  if(images.atlas.naturalWidth!==500||images.atlas.naturalHeight!==351) throw new Error(`Bad atlas dimensions ${images.atlas.naturalWidth}x${images.atlas.naturalHeight}`);
  ready=true;
  const b=$('#startBtn'); b.textContent='ПОЧАТИ'; b.disabled=false;
  const intro=document.querySelector('.intro');
  if(intro) intro.style.backgroundImage=`linear-gradient(90deg,rgba(1,8,12,.75),rgba(1,8,12,.05)),url('${PATHS.bg}')`;
}).catch(setLoadError);

const solids=[
  {x:0,y:GROUND,w:2600,h:92},
  {x:1638,y:421,w:70,h:18,one:true},{x:1685,y:398,w:72,h:18,one:true},
  {x:1732,y:375,w:72,h:18,one:true},{x:1779,y:352,w:72,h:18,one:true},
  {x:1826,y:329,w:72,h:18,one:true},{x:1873,y:306,w:94,h:18,one:true},
  {x:1950,y:286,w:300,h:18,one:true},{x:2075,y:303,w:205,h:18,one:true}
];
function reset(){
  cam=runClock=toastTime=nitroTime=shoesTime=inv=0;finished=false;
  player={x:115,y:GROUND-92,w:44,h:92,vx:0,vy:0,on:false,coyote:0,jumps:1,lives:3,beans:0,tokens:0,spawnX:115,spawnY:GROUND-92,facing:1};
  beans=[[210,383],[340,355],[470,375],[610,346],[750,385],[905,365],[1080,382],[1220,350],[1370,382],[1515,360],[1695,330],[1775,305],[1860,277],[1975,250],[2120,257],[2260,348]].map(([x,y],i)=>({x,y,got:false,t:i*.47}));
  tokens=[{x:2140,y:235,got:false}];
  powerups={nitro:{x:515,y:347,w:42,h:76,got:false},shoes:{x:1795,y:292,w:88,h:46,got:false}};
  enemies=[
    {kind:'spam',x:790,y:GROUND-78,w:58,h:78,v:42,min:745,max:925,alive:true,t:0},
    {kind:'scooter',x:1235,y:GROUND-58,w:86,h:58,v:-145,min:1130,max:1435,alive:true,t:0},
    {kind:'drone',x:1965,y:220,w:76,h:54,v:72,min:1900,max:2180,alive:true,t:0}
  ];
  checkpoint={x:1490,y:GROUND-106,w:42,h:106,on:false};
  updateHud(); toast('PERKY: Місто прокидається. Рухаємося через Бровари.',3.2);
}
function updateHud(){ $('#beans').textContent=player?.beans??0;$('#tokens').textContent=player?.tokens??0;$('#lives').textContent=player?.lives??3; }
function toast(text,seconds=2.5){ $('#toast').textContent=text;$('#toast').classList.add('on');toastTime=seconds; }
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function respawn(){player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0;}
function damage(fromX){
  if(inv>0||finished)return; player.lives--;inv=1.15;player.vy=-320;player.vx=player.x<fromX?-220:220;updateHud();
  if(player.lives<=0){player.lives=3;respawn();toast('PERKY: Повертаю до checkpoint.');}
}
function update(dt){
  if(mode!=='play')return;
  if(toastTime>0&&(toastTime-=dt)<=0)$('#toast').classList.remove('on');
  nitroTime=Math.max(0,nitroTime-dt);shoesTime=Math.max(0,shoesTime-dt);inv=Math.max(0,inv-dt);input.jumpBuffer=Math.max(0,input.jumpBuffer-dt);
  const dir=(input.right?1:0)-(input.left?1:0);const max=(nitroTime?315:245)+(shoesTime?45:0);
  if(dir){player.facing=dir;player.vx=clamp(player.vx+dir*2100*dt,-max,max)}else player.vx*=Math.pow(.035,dt);
  player.vy+=(player.vy<0?1580:2180)*dt;
  if(player.on){player.coyote=.13;player.jumps=1}else player.coyote=Math.max(0,player.coyote-dt);
  if(input.jumpBuffer>0&&(player.coyote>0||player.jumps>0)){
    input.jumpBuffer=0;const ground=player.coyote>0;if(!ground)player.jumps--;else player.jumps=1;
    player.vy=ground?(nitroTime?-690:-610):(nitroTime?-570:-505);player.on=false;player.coyote=0;
  }
  const oldY=player.y,oldBottom=oldY+player.h;
  player.x=clamp(player.x+player.vx*dt,0,WORLD-player.w);player.y+=player.vy*dt;player.on=false;
  for(const s of solids){
    if(s.one&&player.vy<0)continue;
    if(player.vy>=0&&oldBottom<=s.y+12&&hit(player,s)){player.y=s.y-player.h;player.vy=0;player.on=true;}
  }
  if(player.on&&Math.abs(player.vx)>20)runClock+=dt*11;
  if(player.y>VH+80){damage(player.x);respawn();}
  for(const b of beans){b.t+=dt*4;if(!b.got&&hit(player,{x:b.x-14,y:b.y-16,w:28,h:32})){b.got=true;player.beans++;updateHud();}}
  for(const t of tokens){if(!t.got&&hit(player,{x:t.x-20,y:t.y-20,w:40,h:40})){t.got=true;player.tokens++;updateHud();toast('Brovary Token знайдено ✦');}}
  if(!powerups.nitro.got&&hit(player,powerups.nitro)){powerups.nitro.got=true;nitroTime=9;toast('PerkUp Nitro · швидкість + стрибок',2.8);}
  if(!powerups.shoes.got&&hit(player,powerups.shoes)){powerups.shoes.got=true;shoesTime=12;toast('CHARME Speed Shoes · mobility boost',3);}
  for(const e of enemies){
    if(!e.alive)continue;e.t+=dt;e.x+=e.v*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.v*=-1;}if(e.kind==='drone')e.y=220+Math.sin(e.t*2.5)*28;
    if(hit(player,e)){if(player.vy>110&&oldBottom<=e.y+20){e.alive=false;player.vy=-355;toast(e.kind==='scooter'?'Самокатник знешкоджений':'Ворог вимкнений');}else damage(e.x+e.w/2);}
  }
  if(!checkpoint.on&&hit(player,checkpoint)){checkpoint.on=true;player.spawnX=1460;player.spawnY=GROUND-92;toast('Checkpoint · маршрут збережено');}
  if(player.x>2265&&!finished){finished=true;player.vx=0;toast('Z0–Z3 ПРОЙДЕНО · далі Intel / secret route',4.5);}
  const target=clamp(player.x-315,0,WORLD-VW);cam+=(target-cam)*Math.min(1,dt*5.2);
}
function sprite(key,wx,wy,dw,dh,{flip=false,alpha=1,glow=false}={}){
  const r=SPR[key];if(!r)return;const x=wx-cam;ctx.save();ctx.globalAlpha*=alpha;if(glow){ctx.shadowColor='rgba(70,238,221,.8)';ctx.shadowBlur=18;}
  ctx.translate(x+(flip?dw:0),wy);if(flip)ctx.scale(-1,1);ctx.drawImage(images.atlas,r[0],r[1],r[2],r[3],0,0,dw,dh);ctx.restore();
}
function drawBackground(){
  const scale=VH/images.bg.height;const w=images.bg.width*scale;ctx.drawImage(images.bg,-cam,0,w,VH);
  const haze=ctx.createLinearGradient(0,0,0,VH);haze.addColorStop(0,'rgba(0,8,12,.01)');haze.addColorStop(1,'rgba(0,8,12,.10)');ctx.fillStyle=haze;ctx.fillRect(0,0,VW,VH);
}
function drawCollectibles(){
  for(const b of beans){if(!b.got)sprite('bean',b.x-13,b.y-15+Math.sin(b.t)*5,27,34,{glow:true});}
  for(const t of tokens){if(!t.got)sprite('token',t.x-20,t.y-20+Math.sin(performance.now()/350)*5,40,45,{glow:true});}
  if(!powerups.nitro.got)sprite('nitro',powerups.nitro.x,powerups.nitro.y,42,76,{glow:true});
  if(!powerups.shoes.got)sprite('shoes',powerups.shoes.x,powerups.shoes.y,88,44,{glow:true});
  sprite('checkpoint',checkpoint.x,checkpoint.y,42,106,{alpha:checkpoint.on?1:.82,glow:checkpoint.on});
}
function drawEnemies(){for(const e of enemies){if(!e.alive)continue;if(e.kind==='spam')sprite('spam',e.x-4,e.y-8,66,92,{flip:e.v<0});else if(e.kind==='scooter')sprite('scooter',e.x-7,e.y-18,100,80,{flip:e.v<0});else sprite('drone',e.x-8,e.y-8,92,66,{flip:e.v<0,glow:true});}}
function drawPerky(){if(player.x>2290)return;const px=player.x-65+Math.sin(performance.now()/420)*8,py=clamp(player.y-72+Math.sin(performance.now()/310)*6,115,350);sprite('perky',px,py,60,93,{flip:player.facing<0,glow:true});}
function drawPlayer(){
  const airborne=!player.on;let key='p0';if(airborne)key=player.vy<0?'p6':'p7';else if(Math.abs(player.vx)>25)key='p'+(1+(Math.floor(runClock)%5));
  const h=input.down&&player.on?94:116,r=SPR[key],w=h*r[2]/r[3];ctx.save();if(inv>0&&Math.floor(inv*12)%2===0)ctx.globalAlpha=.45;sprite(key,player.x+player.w/2-w/2,player.y+player.h-h,w,h,{flip:player.facing<0});ctx.restore();
}
function drawBoostChip(){if(nitroTime<=0&&shoesTime<=0)return;ctx.save();ctx.fillStyle='rgba(3,18,22,.72)';ctx.strokeStyle='rgba(83,236,219,.55)';ctx.beginPath();ctx.roundRect(20,67,205,32,16);ctx.fill();ctx.stroke();ctx.fillStyle='#dffbf8';ctx.font='800 12px system-ui';const bits=[];if(nitroTime>0)bits.push(`NITRO ${Math.ceil(nitroTime)}s`);if(shoesTime>0)bits.push(`CHARME ${Math.ceil(shoesTime)}s`);ctx.fillText(bits.join(' · '),34,88);ctx.restore();}
function draw(){if(!ready||mode!=='play')return;ctx.clearRect(0,0,VW,VH);drawBackground();drawCollectibles();drawEnemies();drawPerky();drawPlayer();drawBoostChip();}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
$('#startBtn').onclick=()=>{if(!ready){location.reload();return;}mode='play';document.querySelector('.intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset();};
$('#menuBtn').onclick=()=>{mode='intro';$('#gameShell').classList.add('hidden');document.querySelector('.intro').classList.remove('hidden');};
function press(name,down){if(name==='left')input.left=down;if(name==='right')input.right=down;if(name==='down')input.down=down;if(name==='jump'){if(down&&!input.jump)input.jumpBuffer=.12;if(!down&&input.jump&&player&&player.vy<-180)player.vy*=.55;input.jump=down;}}
for(const b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;const on=e=>{e.preventDefault();b.classList.add('held');press(k,true)},off=e=>{e.preventDefault();b.classList.remove('held');press(k,false)};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',e=>{if(e.buttons)off(e)});}
addEventListener('keydown',e=>{const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(!m)return;e.preventDefault();press(m,true)});
addEventListener('keyup',e=>{const m=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(m){e.preventDefault();press(m,false)}});
