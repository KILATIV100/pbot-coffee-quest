const $=s=>document.querySelector(s);
const canvas=$('#game'),ctx=canvas.getContext('2d');
const W=960,H=540,WORLD=3600,GROUND=430;

const A={
  city:'/assets/stage2/prod/bg-city.webp', park:'/assets/stage2/prod/bg-park.webp',
  atlas:'/assets/stage2/prod/stage2-atlas.webp', pbot:'/assets/stage2/prod/pbot-sheet.webp', perky:'/assets/stage2/prod/perky-idle.webp'
};
const imgs={}; let assetsReady=false;
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
Promise.all(Object.entries(A).map(async([k,v])=>imgs[k]=await loadImage(v))).then(()=>{assetsReady=true;$('#startBtn').textContent='ПОЧАТИ';}).catch(()=>{$('#startBtn').textContent='ПОВТОРИТИ';});

const R={
 sidewalk:[12,716,390,94], railing:[414,716,147,78], bench:[625,405,232,130], planter:[12,577,174,127], lamp:[286,12,74,198], bus:[12,224,280,169], perkup:[12,12,262,200], news:[544,12,218,181], stairs:[462,405,151,144], charme:[304,224,422,162], bridge:[198,577,291,125], tree:[372,12,160,185],
 bean:[620,577,88,111], token:[501,577,107,121], nitro:[874,12,90,180], checkpoint:[774,12,88,180],
 paper:[12,405,234,160], scooter:[738,224,186,160], drone:[258,405,192,160]
};
const PBOT=[[41,148,142,297],[220,155,164,283],[414,156,165,281],[611,159,166,277],[825,163,154,282],[1017,171,163,273],[1213,174,161,271],[1407,121,171,285]];

let state='intro',last=0,cam=0,toastT=0,nitroT=0,invT=0,runT=0;
const keys={left:false,right:false,down:false,jump:false,jumpPress:false};
let player,beans,tokens,enemies,checkpoint;

const solids=[
 {x:0,y:GROUND,w:1320,h:110},{x:1450,y:GROUND,w:1020,h:110},{x:2710,y:GROUND,w:890,h:110},
 {x:670,y:318,w:260,h:22,one:true},{x:1145,y:355,w:160,h:18,one:true},
 {x:1560,y:310,w:300,h:20,one:true},{x:1980,y:322,w:280,h:20,one:true},{x:2860,y:302,w:320,h:20,one:true}
];

const props=[
 {type:'bench',x:250,y:336,w:180,h:108},{type:'lamp',x:500,y:250,w:78,h:155},
 {type:'perkup',x:650,y:250,w:290,h:215},{type:'planter',x:1030,y:330,w:165,h:120},
 {type:'news',x:1190,y:305,w:190,h:160},{type:'bus',x:1510,y:245,w:360,h:220},
 {type:'stairs',x:1870,y:300,w:225,h:190},{type:'charme',x:2090,y:280,w:400,h:165},
 {type:'bridge',x:2820,y:290,w:390,h:180},{type:'tree',x:3250,y:280,w:160,h:190}
];

function reset(){
 cam=0;toastT=0;nitroT=0;invT=0;runT=0;
 player={x:110,y:GROUND-106,w:52,h:106,vx:0,vy:0,on:false,coyote:0,jumps:2,lives:3,beans:0,tokens:0,spawnX:110,spawnY:GROUND-106};
 beans=[180,365,555,760,880,1080,1280,1530,1660,1830,2030,2220,2390,2520,2780,2980,3150,3350].map((x,i)=>({x,y:i%3===0?330:i%3===1?280:355,got:false,b:i*.7}));
 tokens=[{x:1830,y:245,got:false},{x:3050,y:245,got:false}];
 enemies=[
  {kind:'paper',x:1225,y:GROUND-92,w:82,h:92,v:50,min:1160,max:1380,alive:true},
  {kind:'scooter',x:2260,y:GROUND-72,w:118,h:72,v:-125,min:2140,max:2450,alive:true},
  {kind:'drone',x:3010,y:235,w:105,h:72,v:75,min:2920,max:3260,alive:true,t:0}
 ];
 checkpoint={x:2505,y:GROUND-118,w:70,h:118,on:false};
 hud();say('PERKY: Сигнал стабільний. Рухаємося через Розвилку.',3.2);
}
function hud(){$('#beans').textContent=player?.beans||0;$('#tokens').textContent=player?.tokens||0;$('#lives').textContent=player?.lives||3}
function say(s,t=2.4){$('#toast').textContent=s;$('#toast').classList.add('on');toastT=t}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function hurt(){if(invT>0)return;player.lives--;invT=1.15;hud();if(player.lives<=0){player.lives=3;player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0;say('PERKY: Повертаємося до checkpoint.',2.2)}}

function update(dt){if(state!=='play')return;
 if(toastT>0&&(toastT-=dt)<=0)$('#toast').classList.remove('on');nitroT=Math.max(0,nitroT-dt);invT=Math.max(0,invT-dt);
 const dir=(keys.right?1:0)-(keys.left?1:0),max=nitroT?330:255;
 if(dir) player.vx=Math.max(-max,Math.min(max,player.vx+dir*2350*dt)); else player.vx*=Math.pow(.035,dt);
 player.vy+=(player.vy<0?1650:2250)*dt;
 if(player.on){player.coyote=.13;player.jumps=2}else player.coyote=Math.max(0,player.coyote-dt);
 if(keys.jumpPress){keys.jumpPress=false;if(player.coyote>0||player.jumps>0){const ground=player.coyote>0;if(!ground)player.jumps--;else player.jumps=1;player.vy=ground?(nitroT?-690:-610):(nitroT?-590:-510);player.on=false;player.coyote=0}}
 const oldY=player.y; player.x=Math.max(0,Math.min(WORLD-player.w,player.x+player.vx*dt)); player.y+=player.vy*dt; player.on=false;
 for(const s of solids){if(s.one&&player.vy<0)continue;if(player.vy>=0&&oldY+player.h<=s.y+12&&hit(player,s)){player.y=s.y-player.h;player.vy=0;player.on=true}}
 if(player.on&&Math.abs(player.vx)>20)runT+=dt*11;
 if(keys.down&&player.on){player.h=78}else player.h=106;
 if(player.y>H+100){hurt();player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0}
 for(const b of beans){b.b+=dt*4;if(!b.got&&hit(player,{x:b.x-14,y:b.y-14,w:28,h:28})){b.got=true;player.beans++;hud()}}
 for(const t of tokens){if(!t.got&&hit(player,{x:t.x-20,y:t.y-20,w:40,h:40})){t.got=true;player.tokens++;hud();say('Brovary Token знайдено ✦')}}
 if(nitroT<=0&&hit(player,{x:910,y:285,w:48,h:70})){nitroT=8;say('PerkUp Nitro: швидкість + стрибок',2.8)}
 for(const e of enemies){if(!e.alive)continue;e.x+=e.v*dt;if(e.x<e.min||e.x>e.max)e.v*=-1;if(e.kind==='drone'){e.t+=dt;e.y=235+Math.sin(e.t*2.5)*26}if(hit(player,e)){if(player.vy>100&&oldY+player.h<=e.y+20){e.alive=false;player.vy=-360;say(e.kind==='scooter'?'Самокатник нейтралізований':'Ворог вимкнений')}else hurt()}}
 if(!checkpoint.on&&hit(player,checkpoint)){checkpoint.on=true;player.spawnX=2485;player.spawnY=GROUND-106;say('Checkpoint збережено',2.2)}
 if(player.x>3470){player.x=3470;player.vx=0;say('Z0–Z2 пройдено · далі CHARME Mobility',4)}
 const target=Math.max(0,Math.min(WORLD-W,player.x-320));cam+=(target-cam)*Math.min(1,dt*5.2);
}

function asset(img,r,dx,dy,dw,dh,flip=false){const [sx,sy,sw,sh]=r;ctx.save();if(flip){ctx.translate(dx+dw,0);ctx.scale(-1,1);dx=0}ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);ctx.restore()}
function drawBackground(){
 ctx.drawImage(imgs.city,0,0,imgs.city.width,imgs.city.height,-cam*.5,0,1900,540);
 ctx.drawImage(imgs.park,0,0,imgs.park.width,imgs.park.height,1780-cam*.5,0,1900,540);
 const g=ctx.createLinearGradient(0,260,0,540);g.addColorStop(0,'rgba(4,15,19,0)');g.addColorStop(1,'rgba(4,15,19,.20)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawSidewalk(){const r=R.sidewalk;for(const [sx,len] of [[0,1320],[1450,1020],[2710,890]])for(let x=sx;x<sx+len;x+=310)asset(imgs.atlas,r,x-cam,GROUND-25,315,82)}
function drawProps(){for(const p of props)asset(imgs.atlas,R[p.type],p.x-cam,p.y,p.w,p.h)}
function drawCollectibles(){
 for(const b of beans){if(b.got)continue;ctx.save();ctx.translate(b.x-cam,b.y+Math.sin(b.b)*5);ctx.rotate(.08);asset(imgs.atlas,R.bean,-18,-21,36,38);ctx.restore()}
 for(const t of tokens){if(t.got)continue;ctx.save();ctx.translate(t.x-cam,t.y);ctx.shadowColor='#ffd74a';ctx.shadowBlur=20;asset(imgs.atlas,R.token,-22,-22,44,44);ctx.restore()}
 if(nitroT<=0){ctx.save();ctx.shadowColor='#56e7da';ctx.shadowBlur=24;asset(imgs.atlas,R.nitro,905-cam,278,58,78);ctx.restore()}
 asset(imgs.atlas,R.checkpoint,checkpoint.x-cam,checkpoint.y-18,86,136);
}
function drawEnemies(){for(const e of enemies){if(!e.alive)continue;const r=R[e.kind],flip=e.v<0;let dh=e.kind==='paper'?112:e.kind==='scooter'?95:92,dw=e.kind==='paper'?150:e.kind==='scooter'?170:160;asset(imgs.atlas,r,e.x-cam-(dw-e.w)/2,e.y-(dh-e.h),dw,dh,flip)}}
function drawPerky(){if(player.x>1000)return;const dx=player.x-cam-76,dy=Math.max(170,player.y-64);ctx.save();ctx.globalAlpha=.92;ctx.shadowColor='#43efe2';ctx.shadowBlur=20;ctx.drawImage(imgs.perky,dx,dy,66,88);ctx.restore()}
function drawPlayer(){const idx=!player.on?7:Math.abs(player.vx)>22?1+(Math.floor(runT)%6):0,r=PBOT[idx],targetH=keys.down&&player.on?82:116,targetW=targetH*r[2]/r[3];ctx.save();ctx.globalAlpha=invT>0&&Math.floor(invT*12)%2?.45:1;ctx.translate(player.x-cam+player.w/2,player.y+player.h);if(player.vx<0)ctx.scale(-1,1);ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=10;ctx.drawImage(imgs.pbot,...r,-targetW/2,-targetH,targetW,targetH);ctx.restore()}
function drawForeground(){ctx.save();ctx.globalAlpha=.75;asset(imgs.atlas,R.railing,120-cam*.45,438,200,70);asset(imgs.atlas,R.railing,2540-cam*.45,440,220,76);ctx.restore()}
function draw(){if(state!=='play'||!assetsReady)return;ctx.clearRect(0,0,W,H);drawBackground();drawSidewalk();drawProps();drawCollectibles();drawEnemies();drawPerky();drawPlayer();drawForeground()}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

function start(){if(!assetsReady){$('#startBtn').textContent='ЗАВАНТАЖЕННЯ…';return}state='play';$('#intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset()}
$('#startBtn').onclick=start;$('#menuBtn').onclick=()=>{state='intro';$('#gameShell').classList.add('hidden');$('#intro').classList.remove('hidden')};
for(const b of document.querySelectorAll('[data-key]')){const n=b.dataset.key;const down=e=>{e.preventDefault();b.classList.add('held');if(n==='jump'&&!keys.jump)keys.jumpPress=true;keys[n]=true};const up=e=>{e.preventDefault();b.classList.remove('held');keys[n]=false};b.onpointerdown=down;b.onpointerup=up;b.onpointercancel=up;b.onpointerleave=e=>{if(e.buttons===0)up(e)}}
addEventListener('keydown',e=>{let n=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(!n)return;e.preventDefault();if(n==='jump'&&!keys.jump)keys.jumpPress=true;keys[n]=true});
addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false;if(e.code==='ArrowDown'||e.code==='KeyS')keys.down=false;if(['Space','ArrowUp','KeyW'].includes(e.code))keys.jump=false});
