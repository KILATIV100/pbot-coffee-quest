const $=s=>document.querySelector(s);
const canvas=$('#game'),ctx=canvas.getContext('2d');
const W=960,H=540,WORLD=3600,GROUND=432;

const ASSETS={city:'/assets/stage2/prod/bg-city.webp',park:'/assets/stage2/prod/bg-park.webp',pbot:'/assets/characters/pbot/sheet.webp'};
const imgs={},pbotFrames=[]; let assetsReady=false;
const PBOT=[[16,67,75,148],[101,70,85,142],[193,71,85,140],[287,72,86,138],[388,74,80,140],[479,78,85,137],[572,79,84,136],[665,54,89,143]];
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
function cleanFrame(img,r){
  const [sx,sy,sw,sh]=r,c=document.createElement('canvas');c.width=sw;c.height=sh;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
  const id=g.getImageData(0,0,sw,sh),d=id.data,seen=new Uint8Array(sw*sh),q=[];
  const refs=[[d[0],d[1],d[2]],[d[(sw-1)*4],d[(sw-1)*4+1],d[(sw-1)*4+2]],[d[(sh-1)*sw*4],d[(sh-1)*sw*4+1],d[(sh-1)*sw*4+2]];
  const isBg=i=>refs.some(v=>Math.abs(d[i]-v[0])+Math.abs(d[i+1]-v[1])+Math.abs(d[i+2]-v[2])<34);
  const push=(x,y)=>{if(x<0||y<0||x>=sw||y>=sh)return;const n=y*sw+x;if(seen[n])return;const i=n*4;if(!isBg(i))return;seen[n]=1;q.push(n)};
  for(let x=0;x<sw;x++){push(x,0);push(x,sh-1)}for(let y=0;y<sh;y++){push(0,y);push(sw-1,y)}
  for(let h=0;h<q.length;h++){const n=q[h],x=n%sw,y=(n/sw)|0,i=n*4;d[i+3]=0;push(x-1,y);push(x+1,y);push(x,y-1);push(x,y+1)}
  g.putImageData(id,0,0);return c;
}
Promise.all(Object.entries(ASSETS).map(async([k,v])=>imgs[k]=await loadImage(v))).then(()=>{PBOT.forEach(r=>pbotFrames.push(cleanFrame(imgs.pbot,r)));assetsReady=true;$('#startBtn').textContent='ПОЧАТИ';}).catch(e=>{console.error(e);$('#startBtn').textContent='ПОВТОРИТИ'});

let state='intro',last=0,cam=0,toastT=0,nitroT=0,invT=0,runT=0;
const keys={left:false,right:false,down:false,jump:false,jumpPress:false};
let player,beans,tokens,enemies,checkpoint;
const solids=[
 {x:0,y:GROUND,w:1320,h:108},{x:1450,y:GROUND,w:1020,h:108},{x:2710,y:GROUND,w:890,h:108},
 {x:655,y:319,w:270,h:20,one:true},{x:1135,y:348,w:170,h:18,one:true},{x:1540,y:306,w:320,h:18,one:true},{x:1970,y:316,w:300,h:18,one:true},{x:2840,y:302,w:340,h:18,one:true}
];
function reset(){
 cam=toastT=nitroT=invT=runT=0;player={x:105,y:GROUND-106,w:52,h:106,vx:0,vy:0,on:false,coyote:0,jumps:2,lives:3,beans:0,tokens:0,spawnX:105,spawnY:GROUND-106};
 beans=[180,350,535,720,865,1040,1250,1510,1680,1840,2030,2200,2380,2540,2780,2960,3160,3370].map((x,i)=>({x,y:[350,300,260][i%3],got:false,t:i*.55}));
 tokens=[{x:1815,y:246,got:false},{x:3050,y:245,got:false}];
 enemies=[{kind:'paper',x:1210,y:GROUND-88,w:74,h:88,v:52,min:1160,max:1370,alive:true,t:0},{kind:'scooter',x:2240,y:GROUND-64,w:110,h:64,v:-140,min:2130,max:2460,alive:true,t:0},{kind:'drone',x:3000,y:236,w:96,h:64,v:78,min:2910,max:3260,alive:true,t:0}];
 checkpoint={x:2510,y:GROUND-116,w:54,h:116,on:false};hud();say('PERKY: Маршрут відкрито. Місто прокидається.',3.1);
}
function hud(){$('#beans').textContent=player?.beans||0;$('#tokens').textContent=player?.tokens||0;$('#lives').textContent=player?.lives||3}
function say(s,t=2.3){$('#toast').textContent=s;$('#toast').classList.add('on');toastT=t}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function hurt(){if(invT)return;player.lives--;invT=1.15;hud();if(player.lives<=0){player.lives=3;player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0;say('PERKY: Відкат до checkpoint.',2.2)}}
function update(dt){if(state!=='play')return;if(toastT>0&&(toastT-=dt)<=0)$('#toast').classList.remove('on');nitroT=Math.max(0,nitroT-dt);invT=Math.max(0,invT-dt);
 const dir=(keys.right?1:0)-(keys.left?1:0),max=nitroT?332:258;if(dir)player.vx=Math.max(-max,Math.min(max,player.vx+dir*2400*dt));else player.vx*=Math.pow(.035,dt);player.vy+=(player.vy<0?1660:2260)*dt;
 if(player.on){player.coyote=.13;player.jumps=2}else player.coyote=Math.max(0,player.coyote-dt);if(keys.jumpPress){keys.jumpPress=false;if(player.coyote||player.jumps){const ground=player.coyote>0;if(!ground)player.jumps--;else player.jumps=1;player.vy=ground?(nitroT?-690:-610):(nitroT?-585:-510);player.on=false;player.coyote=0}}
 const oldY=player.y;player.x=Math.max(0,Math.min(WORLD-player.w,player.x+player.vx*dt));player.y+=player.vy*dt;player.on=false;for(const s of solids){if(s.one&&player.vy<0)continue;if(player.vy>=0&&oldY+player.h<=s.y+12&&hit(player,s)){player.y=s.y-player.h;player.vy=0;player.on=true}}
 if(player.on&&Math.abs(player.vx)>20)runT+=dt*11;if(player.y>H+80){hurt();player.x=player.spawnX;player.y=player.spawnY;player.vx=player.vy=0}
 for(const b of beans){b.t+=dt*4;if(!b.got&&hit(player,{x:b.x-14,y:b.y-16,w:28,h:32})){b.got=true;player.beans++;hud()}}for(const t of tokens)if(!t.got&&hit(player,{x:t.x-20,y:t.y-20,w:40,h:40})){t.got=true;player.tokens++;hud();say('Brovary Token знайдено ✦')}
 if(nitroT<=0&&hit(player,{x:900,y:285,w:48,h:70})){nitroT=8;say('PerkUp Nitro: швидкість + стрибок',2.7)}
 for(const e of enemies){if(!e.alive)continue;e.t+=dt;e.x+=e.v*dt;if(e.x<e.min||e.x>e.max)e.v*=-1;if(e.kind==='drone')e.y=236+Math.sin(e.t*2.5)*24;if(hit(player,e)){if(player.vy>110&&oldY+player.h<=e.y+18){e.alive=false;player.vy=-355;say(e.kind==='scooter'?'Самокатник знешкоджений':'Ворог вимкнений')}else hurt()}}
 if(!checkpoint.on&&hit(player,checkpoint)){checkpoint.on=true;player.spawnX=2485;player.spawnY=GROUND-106;say('Checkpoint збережено')}
 if(player.x>3470){player.x=3470;player.vx=0;say('Z0–Z2 завершено · попереду CHARME Mobility',4)}const target=Math.max(0,Math.min(WORLD-W,player.x-320));cam+=(target-cam)*Math.min(1,dt*5.2);
}

function seg(img,wx,ww){ctx.drawImage(img,0,0,img.width,img.height,wx-cam,0,ww,H)}
function drawBackground(){seg(imgs.city,0,1820);seg(imgs.park,1800,1800);const haze=ctx.createLinearGradient(0,0,0,H);haze.addColorStop(.55,'rgba(2,10,13,0)');haze.addColorStop(1,'rgba(2,10,13,.18)');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawPavement(){ctx.save();ctx.translate(-cam,0);for(const [x,w] of [[0,1320],[1450,1020],[2710,890]]){const g=ctx.createLinearGradient(0,GROUND-5,0,H);g.addColorStop(0,'rgba(218,214,197,.95)');g.addColorStop(.1,'rgba(126,128,119,.92)');g.addColorStop(1,'rgba(55,59,57,.95)');ctx.fillStyle=g;ctx.fillRect(x,GROUND,w,H-GROUND);ctx.fillStyle='rgba(236,229,205,.9)';ctx.fillRect(x,GROUND, w,7);ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1;for(let xx=x;xx<x+w;xx+=88){ctx.beginPath();ctx.moveTo(xx,GROUND+8);ctx.lineTo(xx+12,H);ctx.stroke()}}
 drawTrench(1320,GROUND,130);drawWaterGap(2470,GROUND,240);ctx.restore()}
function drawTrench(x,y,w){const g=ctx.createLinearGradient(0,y,0,H);g.addColorStop(0,'#4e3c2d');g.addColorStop(1,'#171717');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-22,H);ctx.lineTo(x+20,H);ctx.closePath();ctx.fill();ctx.strokeStyle='#e7a53d';ctx.lineWidth=6;ctx.setLineDash([18,12]);ctx.beginPath();ctx.moveTo(x+3,y+5);ctx.lineTo(x+w-3,y+5);ctx.stroke();ctx.setLineDash([])}
function drawWaterGap(x,y,w){const g=ctx.createLinearGradient(0,y,0,H);g.addColorStop(0,'#51c9d9');g.addColorStop(1,'#126e85');ctx.fillStyle=g;ctx.fillRect(x,y,w,H-y);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=3;for(let yy=y+12;yy<H;yy+=22){ctx.beginPath();ctx.moveTo(x+8,yy);ctx.quadraticCurveTo(x+w*.5,yy-7,x+w-8,yy);ctx.stroke()}}
function drawBench(wx,wy){const x=wx-cam;ctx.save();ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=12;ctx.fillStyle='#71452f';rr(x,wy,160,18,7);ctx.fill();ctx.fillStyle='#8e5837';rr(x+6,wy-33,148,18,6);ctx.fill();ctx.fillStyle='#2e3b3c';ctx.fillRect(x+22,wy+15,10,42);ctx.fillRect(x+128,wy+15,10,42);ctx.restore()}
function drawPlanter(wx,wy){const x=wx-cam;ctx.fillStyle='#bfae91';ctx.beginPath();ctx.moveTo(x,wy);ctx.lineTo(x+126,wy);ctx.lineTo(x+110,wy+64);ctx.lineTo(x+16,wy+64);ctx.closePath();ctx.fill();ctx.fillStyle='#376c43';for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(x+15+i*13,wy-5-(i%3)*6,16,0,Math.PI*2);ctx.fill()}}
function drawLamp(wx){const x=wx-cam;ctx.fillStyle='#26383b';ctx.fillRect(x,220,8,210);ctx.beginPath();ctx.arc(x+4,219,20,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f6d27a';ctx.beginPath();ctx.arc(x+4,219,11,0,Math.PI*2);ctx.fill()}
function drawBusStop(wx){const x=wx-cam,y=300;ctx.save();ctx.fillStyle='rgba(14,48,58,.52)';ctx.strokeStyle='#e5ece8';ctx.lineWidth=5;rr(x,y,300,128,12);ctx.fill();ctx.stroke();ctx.fillStyle='#243438';rr(x-14,y-18,328,25,9);ctx.fill();ctx.fillStyle='#51e4d7';ctx.font='900 15px system-ui';ctx.fillText('BROVARY · STOP',x+18,y+29);ctx.restore()}
function drawKiosk(wx,label,accent){const x=wx-cam,y=332;ctx.save();ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=16;ctx.fillStyle='#17343a';rr(x,y,195,100,12);ctx.fill();ctx.fillStyle=accent;rr(x+10,y+10,175,34,9);ctx.fill();ctx.fillStyle='#082529';ctx.font='1000 22px system-ui';ctx.textAlign='center';ctx.fillText(label,x+97,y+35);ctx.restore()}
function drawNews(wx){const x=wx-cam,y=318;ctx.fillStyle='#162e34';rr(x,y,165,114,10);ctx.fill();ctx.fillStyle='#f3e9d7';rr(x+10,y+10,145,72,5);ctx.fill();ctx.fillStyle='#182b31';ctx.font='900 12px system-ui';ctx.fillText('НЕ ХУ#ОВІ',x+28,y+38);ctx.fillText('БРОВАРИ',x+41,y+58);ctx.fillStyle='#53e2d6';ctx.fillRect(x+22,y+88,120,6)}
function drawStairs(wx){const x=wx-cam;ctx.fillStyle='#c8c2ad';for(let i=0;i<7;i++)ctx.fillRect(x+i*25,GROUND-18-i*17,185-i*25,18)}
function drawWorldProps(){drawBench(285,365);drawLamp(535);drawKiosk(690,'PerkUP','#f1ba4c');drawPlanter(1040,368);drawNews(1170);drawBusStop(1545);drawStairs(1885);drawKiosk(2070,'CHARME','#e5c483');drawLamp(2760);drawBench(3210,365)}
function bean(x,y,phase){ctx.save();ctx.translate(x-cam,y+Math.sin(phase)*5);ctx.rotate(.45);const g=ctx.createRadialGradient(-4,-6,2,0,0,16);g.addColorStop(0,'#ffd26e');g.addColorStop(.35,'#b36c25');g.addColorStop(1,'#6f3516');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,10,15,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e5a34d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-13);ctx.quadraticCurveTo(4,0,-2,13);ctx.stroke();ctx.restore()}
function token(x,y){ctx.save();ctx.translate(x-cam,y);ctx.shadowColor='#ffd95b';ctx.shadowBlur=18;ctx.fillStyle='#f4bd3d';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1b6';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#273338';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Б',0,1);ctx.restore()}
function drawNitro(){if(nitroT>0)return;const x=920-cam,y=322;ctx.save();ctx.shadowColor='#55eadc';ctx.shadowBlur=22;ctx.fillStyle='#153d43';rr(x,y,34,46,8);ctx.fill();ctx.fillStyle='#55eadc';ctx.fillRect(x+6,y+8,22,24);ctx.fillStyle='#09292d';ctx.font='900 9px system-ui';ctx.fillText('N2',x+10,y+24);ctx.restore()}
function drawCheckpoint(){const x=checkpoint.x-cam,y=checkpoint.y;ctx.save();ctx.shadowColor=checkpoint.on?'#55eadc':'rgba(0,0,0,.3)';ctx.shadowBlur=checkpoint.on?22:8;ctx.fillStyle='#23383d';rr(x,y,42,116,12);ctx.fill();ctx.fillStyle=checkpoint.on?'#55eadc':'#e2bb58';ctx.beginPath();ctx.arc(x+21,y+24,10,0,Math.PI*2);ctx.fill();ctx.fillRect(x+11,y+46,20,5);ctx.fillRect(x+11,y+59,20,5);ctx.restore()}
function drawCollectibles(){for(const b of beans)if(!b.got)bean(b.x,b.y,b.t);for(const t of tokens)if(!t.got)token(t.x,t.y);drawNitro();drawCheckpoint()}
function drawSpam(e){const x=e.x-cam,y=e.y;ctx.save();ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=12;ctx.fillStyle='#24363b';rr(x,y,e.w,e.h,15);ctx.fill();ctx.fillStyle='#55eadc';rr(x+10,y+12,e.w-20,20,8);ctx.fill();ctx.fillStyle='#0d2429';ctx.fillRect(x+20,y+18,7,7);ctx.fillRect(x+46,y+18,7,7);ctx.fillStyle='#f1eee3';ctx.fillRect(x+13,y+50,e.w-26,24);ctx.strokeStyle='#c7c0b2';ctx.beginPath();ctx.moveTo(x+19,y+57);ctx.lineTo(x+54,y+57);ctx.moveTo(x+19,y+64);ctx.lineTo(x+48,y+64);ctx.stroke();ctx.restore()}
function drawScooter(e){const x=e.x-cam,y=e.y;ctx.save();ctx.translate(e.v<0?x+e.w:x,y);if(e.v<0)ctx.scale(-1,1);ctx.strokeStyle='#22383c';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(28,41);ctx.lineTo(75,41);ctx.lineTo(88,10);ctx.lineTo(103,10);ctx.stroke();ctx.fillStyle='#ef8f36';ctx.beginPath();ctx.arc(24,52,13,0,Math.PI*2);ctx.arc(86,52,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1e3034';rr(45,1,35,35,12);ctx.fill();ctx.fillStyle='#f1b15a';ctx.fillRect(56,10,12,6);ctx.restore()}
function drawDrone(e){const x=e.x-cam,y=e.y;ctx.save();ctx.shadowColor='#55eadc';ctx.shadowBlur=18;ctx.fillStyle='#26383d';rr(x+22,y+18,54,34,15);ctx.fill();ctx.strokeStyle='#55eadc';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+24,y+28);ctx.lineTo(x,y+8);ctx.moveTo(x+74,y+28);ctx.lineTo(x+98,y+8);ctx.stroke();ctx.fillStyle='#55eadc';ctx.beginPath();ctx.arc(x+49,y+35,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d9e5e5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-7,y+8);ctx.lineTo(x+10,y+8);ctx.moveTo(x+88,y+8);ctx.lineTo(x+105,y+8);ctx.stroke();ctx.restore()}
function drawEnemies(){for(const e of enemies)if(e.alive)(e.kind==='paper'?drawSpam(e):e.kind==='scooter'?drawScooter(e):drawDrone(e))}
function drawPerky(){if(player.x>1150)return;const x=player.x-cam-68,y=Math.max(190,player.y-55);ctx.save();ctx.shadowColor='#55eadc';ctx.shadowBlur=22;ctx.fillStyle='#2c2a25';ctx.beginPath();ctx.ellipse(x+25,y+28,24,28,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#55eadc';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#55eadc';ctx.beginPath();ctx.arc(x+18,y+25,4,0,Math.PI*2);ctx.arc(x+32,y+25,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d6ab5d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+25,y+28,31,0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawPlayer(){const idx=!player.on?7:Math.abs(player.vx)>22?1+(Math.floor(runT)%6):0,fr=pbotFrames[idx]||pbotFrames[0];if(!fr)return;const targetH=keys.down&&player.on?84:116,targetW=targetH*fr.width/fr.height;ctx.save();ctx.globalAlpha=invT&&Math.floor(invT*12)%2?.45:1;ctx.translate(player.x-cam+player.w/2,player.y+player.h);if(player.vx<0)ctx.scale(-1,1);ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=10;ctx.drawImage(fr,-targetW/2,-targetH,targetW,targetH);ctx.restore()}
function drawForeground(){ctx.save();ctx.globalAlpha=.38;ctx.fillStyle='#183c40';for(const wx of [80,150,2750,2830,3380]){const x=wx-cam;ctx.beginPath();ctx.arc(x,475,60,0,Math.PI*2);ctx.fill()}ctx.restore()}
function draw(){if(state!=='play'||!assetsReady)return;ctx.clearRect(0,0,W,H);drawBackground();drawPavement();drawWorldProps();drawCollectibles();drawEnemies();drawPerky();drawPlayer();drawForeground()}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function start(){if(!assetsReady){$('#startBtn').textContent='ЗАВАНТАЖЕННЯ…';return}state='play';$('#intro').classList.add('hidden');$('#gameShell').classList.remove('hidden');reset()}
$('#startBtn').onclick=start;$('#menuBtn').onclick=()=>{state='intro';$('#gameShell').classList.add('hidden');$('#intro').classList.remove('hidden')};
for(const b of document.querySelectorAll('[data-key]')){const n=b.dataset.key,down=e=>{e.preventDefault();b.classList.add('held');if(n==='jump'&&!keys.jump)keys.jumpPress=true;keys[n]=true},up=e=>{e.preventDefault();b.classList.remove('held');keys[n]=false};b.onpointerdown=down;b.onpointerup=up;b.onpointercancel=up;b.onpointerleave=e=>{if(e.buttons===0)up(e)}}
addEventListener('keydown',e=>{const n=e.code==='ArrowLeft'||e.code==='KeyA'?'left':e.code==='ArrowRight'||e.code==='KeyD'?'right':e.code==='ArrowDown'||e.code==='KeyS'?'down':['Space','ArrowUp','KeyW'].includes(e.code)?'jump':null;if(!n)return;e.preventDefault();if(n==='jump'&&!keys.jump)keys.jumpPress=true;keys[n]=true});
addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false;if(e.code==='ArrowDown'||e.code==='KeyS')keys.down=false;if(['Space','ArrowUp','KeyW'].includes(e.code))keys.jump=false});
