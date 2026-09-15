(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#game'), ctx=canvas.getContext('2d');
const W=960,H=540,DPR=Math.min(devicePixelRatio||1,2);
function resize(){const r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0)}
addEventListener('resize',resize);resize();

const WORLDS=[
['Розвилка','Місто прокидається','Паркові стежки','Розвилка історій','#1f8ed6','#6bd35f','🏙️'],
['Парк Перемоги','Зелений коридор','Колесо огляду','Серце парку','#20a66a','#91d957','🌳'],
['Приозерний','Набережна','Містки над водою','Озеро після заходу','#1e77bd','#54d4c2','🌊'],
['Старі Бровари','Тихі вулиці','Двори памʼяті','Старий центр','#b57948','#efc36a','🏘️'],
['Шевченків шлях','Початок маршруту','Підйом','Дорога памʼяті','#5b7cc2','#f3cf58','🛣️'],
['Ярмарок Броварів','Ранкова площа','Торгові ряди','Нічний ярмарок','#d55f78','#f6ba49','🎪'],
['Трамвай 23','Депо','Стара лінія','Останній рейс','#69748a','#ff9b42','🚋'],
['Аеродром','Злітна смуга','Ангари','Sky Gate','#4a7ed7','#9edaff','✈️'],
['Станція Бровари','Платформа','Стрілки','Rail Junction','#56636f','#e9ca58','🚉'],
['Торгмаш','Цехи','Конвеєр','Industrial Pulse','#7b8793','#f29b38','🏭'],
['Радіодистрикт','Сигнал','Перешкоди','Signal Noise','#634eaa','#65e0ff','📡'],
['Спорт-Сіті','Розминка','Трибуни','Velocity','#1e9d82','#e4f04f','🏟️'],
['Термінал-Сіті','Неонова лінія','Mall Run','Urban Neon','#4629a6','#ff4ecd','🌃'],
['ЖК Майбутнього','Green Living','Вертикальний парк','Еко-квартал','#149b73','#7cff9c','🏢'],
['Future Brovary Core','20XX','AI District','The Official','#101b45','#00e5ff','⚡']
];
const LEVELS=[];WORLDS.forEach((w,wi)=>{for(let li=0;li<3;li++)LEVELS.push({wi,li,id:`${String(wi+1).padStart(2,'0')}-${String(li+1).padStart(2,'0')}`,name:w[li+1],world:w[0],c1:w[4],c2:w[5],icon:w[6],length:4200+wi*120+li*380,beans:50+wi*4+li*15,tokens:1+li,boss:wi===14&&li===2})});

const saveKey='pbot-brovary-final-v1';
const defaultSave={unlocked:1,stars:{},best:{},beans:0,tokens:0,selected:'pbot',upgrades:{speed:0,jump:0,pulse:0}};
let save=load();function load(){try{return Object.assign({},defaultSave,JSON.parse(localStorage.getItem(saveKey)||'{}'))}catch{return structuredClone(defaultSave)}}
function persist(){localStorage.setItem(saveKey,JSON.stringify(save))}

const input={left:false,right:false,down:false,jump:false,action:false,jumpPressed:false,actionPressed:false};
function bindKey(k,v){if(['ArrowLeft','a','A'].includes(k))input.left=v;if(['ArrowRight','d','D'].includes(k))input.right=v;if(['ArrowDown','s','S'].includes(k))input.down=v;if(['ArrowUp','w','W',' '].includes(k)){if(v&&!input.jump)input.jumpPressed=true;input.jump=v}if(['e','E','Shift'].includes(k)){if(v&&!input.action)input.actionPressed=true;input.action=v}}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();bindKey(e.key,true);if(e.key==='Escape')togglePause()},{passive:false});addEventListener('keyup',e=>bindKey(e.key,false));
$$('[data-key]').forEach(b=>{const key=b.dataset.key;const on=e=>{e.preventDefault();if(key==='jump'){if(!input.jump)input.jumpPressed=true;input.jump=true}else if(key==='action'){if(!input.action)input.actionPressed=true;input.action=true}else input[key]=true;b.classList.add('held')};const off=e=>{e.preventDefault();if(key==='jump')input.jump=false;else if(key==='action')input.action=false;else input[key]=false;b.classList.remove('held')};b.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,off))});

const IMG={bg:'/assets/backgrounds/world01-level01.webp',pbot:'/assets/stage2/rc1/pbot-atlas.webp',props:'/assets/stage2/rc1/props-atlas.webp',actors:'/assets/stage2/p0/actors-p0.webp',hero:'/assets/characters/brovary-hero/idle.webp',vitalii:'/assets/characters/vitalii/idle.webp'};
const images={};Object.entries(IMG).forEach(([k,src])=>{const im=new Image();im.decoding='async';im.src=src;images[k]=im});
const P={idle:[0,0,140,140],run1:[140,0,140,140],run2:[280,0,140,140],run3:[420,0,140,140],run4:[0,140,140,140],run5:[140,140,140,140],crouch:[280,140,140,140],jump:[420,140,140,140]};
const PROP={perkup:[0,0,150,115],charme:[150,0,150,115],billboard:[300,0,150,115],checkpoint:[450,0,150,115],nitro:[0,115,150,115],bean:[150,115,150,115],token:[300,115,150,115],barrier:[450,115,150,115],scooter:[0,230,150,115],spam:[150,230,150,115],drone:[300,230,150,115],finish:[450,230,150,115]};
const PERKY=[24,9,124,191];
function atlas(im,cell,x,y,w,h,{flip=false,alpha=1,filter='none'}={}){if(!im?.complete||!im.naturalWidth)return false;const [sx,sy,sw,sh]=cell;ctx.save();ctx.globalAlpha=alpha;ctx.filter=filter;ctx.translate(x+(flip?w:0),y);ctx.scale(flip?-1:1,1);ctx.drawImage(im,sx,sy,sw,sh,0,0,w,h);ctx.restore();return true}

let mode='menu',levelIndex=0,state=null,last=0,acc=0;
const hud={beans:$('#beans'),tokens:$('#tokens'),lives:$('#lives'),world:$('#worldName'),level:$('#levelCode'),progress:$('#routeProgressFill'),label:$('#routeProgressLabel')};
function rand(seed){let t=seed+0x6D2B79F5;return()=>{t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),1800)}
function burst(x,y,n,color){if(!state)return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*140;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:.3+Math.random()*.45,max:.75,r:2+Math.random()*3,color})}}

function buildLevel(i){
 const L=LEVELS[i],r=rand(i*991+17),plats=[],haz=[],beans=[],tokens=[],enemies=[],checkpoints=[],gaps=[],decor=[];
 for(let x=620;x<L.length-620;x+=360+r()*190){if(r()<.38){const w=90+r()*85;gaps.push({x,w});haz.push({x,y:448,w,h:92,type:'pit'})}if(r()<.63)plats.push({x:x+50,y:320-r()*85,w:120+r()*100,h:24});}
 gaps.sort((a,b)=>a.x-b.x);let cursor=0;for(const g of gaps){if(g.x-cursor>50)plats.push({x:cursor,y:448,w:g.x-cursor,h:120});cursor=g.x+g.w;}if(L.length-cursor>0)plats.push({x:cursor,y:448,w:L.length-cursor,h:120});
 const safeX=x=>{for(const g of gaps){if(x>g.x-45&&x<g.x+g.w+45)return Math.min(L.length-160,g.x+g.w+70)}return x};
 for(let n=0;n<L.beans;n++){const x=safeX(220+(L.length-460)*(n/Math.max(1,L.beans-1)));const arc=(n%9===4||n%9===5)?70:0;beans.push({x,y:390-arc-r()*25,taken:false});}
 for(let n=0;n<L.tokens;n++)tokens.push({x:safeX((n+1)*L.length/(L.tokens+1)),y:245-r()*55,taken:false});
 for(let x=900;x<L.length-650;x+=720+r()*290)enemies.push({x:safeX(x),y:410,w:56,h:44,v:(r()<.5?-1:1)*(35+L.wi*2),hp:1+(L.wi>8?1:0),dead:false,kind:r()<.33?'drone':r()<.18?'scooter':'spam'});
 [0.33,0.66].forEach(p=>checkpoints.push({x:safeX(L.length*p),hit:false}));
 const kinds=['billboard','perkup','charme','billboard','perkup'];for(let x=520,j=0;x<L.length-500;x+=820,j++)decor.push({kind:kinds[(j+L.wi)%kinds.length],x:safeX(x),y:338,scale:.8+((j%3)*.06)});
 return {L,plats,haz,beans,tokens,enemies,checkpoints,gaps,decor};
}
function startLevel(i){levelIndex=i;const data=buildLevel(i),L=data.L;state={...data,time:0,camera:0,scoreBeans:0,scoreTokens:0,lives:3,finished:false,deadTimer:0,shake:0,particles:[],shockwaves:[],player:{x:90,y:360,w:40,h:60,vx:0,vy:0,onGround:false,jumps:0,inv:0,cpX:90,pulse:0,coyote:0,jumpBuffer:0,facing:1},boss:L.boss?{x:L.length-430,y:318,w:170,h:130,hp:8,max:8,phase:1,cool:1.8,slam:3.4,awake:false}:null};mode='play';$('#menuScreen').classList.add('hidden');$('#gameShell').classList.remove('hidden');updateHud();toast(`${L.id} · ${L.world} · ${L.name}`)}

function updateHud(){if(!state)return;const L=state.L;hud.beans.textContent=`${state.scoreBeans}/${L.beans}`;hud.tokens.textContent=state.scoreTokens;hud.lives.textContent=state.lives;hud.world.textContent=L.world;hud.level.textContent=L.id;const p=Math.min(1,state.player.x/L.length);hud.progress.style.width=(p*100)+'%';hud.label.textContent=Math.round(p*100)+'%'}
function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function groundCollision(p){p.onGround=false;for(const q of state.plats){if(p.vy>=0&&p.x+p.w>q.x&&p.x<q.x+q.w&&p.y+p.h<=q.y+20&&p.y+p.h+p.vy/60>=q.y){p.y=q.y-p.h;p.vy=0;p.onGround=true;p.jumps=0}}}
function kill(fromX){const p=state.player;if(p.inv>0||state.deadTimer>0)return;state.lives--;state.shake=10;p.vx=fromX==null?0:(p.x<fromX?-190:190);p.vy=-250;burst(p.x+p.w/2,p.y+p.h/2,12,'#ff5964');updateHud();if(state.lives<=0){state.lives=3;p.cpX=90;toast('Спроба перезапущена')}state.deadTimer=.65;p.inv=1.8}
function respawn(){const p=state.player;p.x=p.cpX;p.y=330;p.vx=0;p.vy=0;p.coyote=0;state.deadTimer=0;burst(p.x,p.y,14,'#57e7da')}
function finish(){if(state.finished)return;state.finished=true;const L=state.L;let stars=1;if(state.scoreBeans>=L.beans)stars++;if(state.lives===3)stars++;save.unlocked=Math.max(save.unlocked,Math.min(45,levelIndex+2));save.stars[L.id]=Math.max(save.stars[L.id]||0,stars);save.best[L.id]=Math.min(save.best[L.id]||Infinity,state.time);save.beans+=state.scoreBeans;save.tokens+=state.scoreTokens;persist();setTimeout(()=>showComplete(stars),500)}
function showComplete(stars){mode='complete';$('#completeTitle').textContent=state.L.boss?'BROVARY ЗВІЛЬНЕНО':'РІВЕНЬ ПРОЙДЕНО';$('#completeMeta').textContent=`${state.L.id} · ${state.L.world} · ${state.L.name}`;$('#completeStars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#completeStats').textContent=`☕ ${state.scoreBeans} · ✦ ${state.scoreTokens} · ${state.time.toFixed(1)} c`;$('#completeScreen').classList.remove('hidden')}

function update(dt){if(mode!=='play'||!state||state.finished)return;state.time+=dt;const p=state.player,L=state.L;if(p.inv>0)p.inv-=dt;if(state.shake>0)state.shake=Math.max(0,state.shake-dt*28);if(state.deadTimer>0){state.deadTimer-=dt;if(state.deadTimer<=0)respawn();return}
 const speed=215+save.upgrades.speed*18,accel=1600;const dir=(input.right?1:0)-(input.left?1:0);if(dir)p.facing=dir;p.vx+=dir*accel*dt;p.vx*=Math.pow(.0015,dt);p.vx=Math.max(-speed,Math.min(speed,p.vx));if(input.down&&p.onGround)p.vx*=.75;
 if(input.jumpPressed)p.jumpBuffer=.12;input.jumpPressed=false;p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);p.coyote=p.onGround?.1:Math.max(0,p.coyote-dt);
 if(p.jumpBuffer>0&&(p.onGround||p.coyote>0||p.jumps<2)){p.vy=-(430+save.upgrades.jump*18);p.onGround=false;p.coyote=0;p.jumps=Math.max(1,p.jumps+1);p.jumpBuffer=0;burst(p.x+p.w/2,p.y+p.h,5,'#dce9e7')}
 if(!input.jump&&p.vy<0)p.vy+=700*dt;
 p.vy+=1080*dt;p.x+=p.vx*dt;p.x=Math.max(0,Math.min(L.length-p.w,p.x));p.y+=p.vy*dt;groundCollision(p);if(p.y>H+120)kill();
 for(const b of state.beans){if(!b.taken&&Math.hypot(p.x-b.x,p.y-b.y)<54){b.taken=true;state.scoreBeans++;burst(b.x,b.y,5,'#ffd76d')}}
 for(const t of state.tokens){if(!t.taken&&Math.hypot(p.x-t.x,p.y-t.y)<60){t.taken=true;state.scoreTokens++;burst(t.x,t.y,12,'#57e7da');toast('Brovary Token +1')}}
 for(const c of state.checkpoints){if(!c.hit&&p.x>c.x){c.hit=true;p.cpX=c.x;burst(c.x,380,16,'#57e7da');toast('Чекпойнт активовано')}}
 for(const e of state.enemies){if(e.dead)continue;e.x+=e.v*dt;if(e.x<120||e.x>L.length-140)e.v*=-1;const er={x:e.x,y:e.y,w:e.w,h:e.h};if(rect(p,er)){if(p.vy>120&&p.y+p.h<e.y+26){e.hp--;p.vy=-285;state.shake=5;burst(e.x+e.w/2,e.y+e.h/2,10,'#ff9f43');if(e.hp<=0){e.dead=true;toast('SPAM нейтралізовано')}}else kill(e.x)}}
 if(input.actionPressed&&p.pulse<=0){p.pulse=5-Math.min(2.4,save.upgrades.pulse*.45);state.shake=4;burst(p.x+p.w/2,p.y+p.h/2,18,'#76fff2');for(const e of state.enemies){if(!e.dead&&Math.abs(e.x-p.x)<190){e.hp-=2;if(e.hp<=0)e.dead=true}}if(state.boss&&Math.abs(state.boss.x-p.x)<270){state.boss.hp--;state.boss.phase=state.boss.hp<=2?3:state.boss.hp<=5?2:1;toast(`The Official: ${state.boss.hp}/${state.boss.max}`);burst(state.boss.x+50,state.boss.y+50,18,'#ff874d');if(state.boss.hp<=0)finish()}}input.actionPressed=false;if(p.pulse>0)p.pulse-=dt;
 if(state.boss&&!state.finished){const b=state.boss;if(p.x>L.length-900)b.awake=true;if(b.awake){b.cool-=dt;b.slam-=dt;if(b.cool<0){b.cool=Math.max(.68,1.65-b.phase*.23);state.enemies.push({x:b.x-70,y:395,w:50,h:42,v:-110-b.phase*20,hp:1,dead:false,kind:'drone'})}if(b.slam<0){b.slam=Math.max(1.8,3.8-b.phase*.55);state.shockwaves.push({x:b.x-15,y:425,w:44,h:18,v:-250-b.phase*45,life:4});state.shake=8;toast('THE OFFICIAL: ШТАМП!')}}}
 for(const s of state.shockwaves){s.x+=s.v*dt;s.life-=dt;if(s.life>0&&rect(p,s))kill(s.x)}state.shockwaves=state.shockwaves.filter(s=>s.life>0&&s.x>-100);
 for(const q of state.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=260*dt;q.life-=dt}state.particles=state.particles.filter(q=>q.life>0);
 if(!state.boss&&p.x>L.length-120)finish();state.camera+=(Math.max(0,Math.min(L.length-W,p.x-310))-state.camera)*(1-Math.pow(.001,dt));updateHud()}

function draw(){ctx.clearRect(0,0,W,H);if(!state)return;const {L}=state,cam=state.camera;const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,L.c1);g.addColorStop(.72,L.c2);g.addColorStop(1,'#18301f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(L.wi===0&&images.bg.complete){ctx.globalAlpha=.55;const scale=H/images.bg.height,iw=images.bg.width*scale;for(let x=-(cam*.12%iw)-iw;x<W+iw;x+=iw)ctx.drawImage(images.bg,x,0,iw,H);ctx.globalAlpha=1}else drawCity(cam,L);
 const sx=state.shake?(Math.random()-.5)*state.shake:0,sy=state.shake?(Math.random()-.5)*state.shake*.55:0;ctx.save();ctx.translate(-cam+sx,sy);drawWorld();ctx.restore();drawFx()}
function drawCity(cam,L){ctx.save();ctx.globalAlpha=.2;ctx.fillStyle='#082838';for(let i=0;i<18;i++){const x=((i*173-cam*.1)%1200)-120,h=90+(i*37)%150;ctx.fillRect(x,285-h,74,h);for(let r=0;r<4;r++)for(let c=0;c<3;c++){ctx.fillStyle='rgba(255,245,180,.35)';ctx.fillRect(x+10+c*20,300-h+r*22,8,10);ctx.fillStyle='#082838'}}ctx.restore();ctx.font='74px system-ui';ctx.globalAlpha=.12;for(let x=100-(cam*.2%600);x<W+200;x+=600)ctx.fillText(L.icon,x,250);ctx.globalAlpha=1}
function drawDecor(){const L=state.L;for(const d of state.decor){const cell=PROP[d.kind]||PROP.billboard,w=150*d.scale,h=115*d.scale,y=448-h;ctx.save();ctx.filter=L.wi===0?'saturate(.9) contrast(1.02)':`hue-rotate(${L.wi*21}deg) saturate(.72)`;atlas(images.props,cell,d.x,y,w,h,{alpha:.9});ctx.restore()}}
function drawPlayer(p){ctx.save();ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*12)%2?.35:1;if(save.selected==='pbot'&&images.pbot.complete){let key='idle';if(input.down&&p.onGround)key='crouch';else if(!p.onGround)key='jump';else if(Math.abs(p.vx)>28)key=['run1','run2','run3','run4','run5'][Math.floor(state.time*11)%5];atlas(images.pbot,P[key],p.x-22,p.y-35,84,84,{flip:p.facing<0,filter:'drop-shadow(0 4px 3px rgba(0,0,0,.45))'})}else{const im=save.selected==='vitalii'?images.vitalii:images.hero;if(im?.complete&&im.naturalWidth){const bob=p.onGround&&Math.abs(p.vx)>25?Math.sin(state.time*15)*2:0;ctx.translate(p.x+p.w/2,p.y+p.h+bob);ctx.scale(p.facing<0?-1:1,1);ctx.rotate(!p.onGround?Math.max(-.16,Math.min(.16,p.vx/900)):0);ctx.drawImage(im,-36,-86,72,86)}else{ctx.fillStyle=save.selected==='hero'?'#1f2937':'#2454a6';ctx.fillRect(p.x,p.y,p.w,p.h)}}ctx.restore();if(images.actors.complete){const px=p.x-42,py=p.y-42+Math.sin(state.time*3.2)*4;atlas(images.actors,PERKY,px,py,34,52,{flip:p.facing<0,alpha:.88,filter:p.pulse>0?'drop-shadow(0 0 8px #66fff1)':'drop-shadow(0 3px 2px rgba(0,0,0,.35))'})}}
function drawWorld(){const p=state.player,L=state.L;drawDecor();ctx.fillStyle='rgba(20,38,28,.88)';for(const q of state.plats){ctx.fillRect(q.x,q.y,q.w,q.h);ctx.fillStyle='#80c958';ctx.fillRect(q.x,q.y,q.w,8);ctx.fillStyle='rgba(20,38,28,.88)';if(q.y<440&&q.w>70)atlas(images.props,PROP.barrier,q.x,q.y-18,Math.min(150,q.w),46,{alpha:.48})}
 for(const h of state.haz){ctx.fillStyle='#ff5e57';for(let x=h.x;x<h.x+h.w;x+=18){ctx.beginPath();ctx.moveTo(x,h.y+8);ctx.lineTo(x+9,h.y-20);ctx.lineTo(x+18,h.y+8);ctx.fill()}}
 for(const c of state.checkpoints){if(!atlas(images.props,PROP.checkpoint,c.x-30,333,96,74,{alpha:c.hit?1:.78,filter:c.hit?'drop-shadow(0 0 9px #57e7da)':'none'})){ctx.fillStyle=c.hit?'#58f2df':'#f2c94c';ctx.fillRect(c.x,355,8,93)}}
 for(const b of state.beans){if(b.taken)continue;if(!atlas(images.props,PROP.bean,b.x-16,b.y-17,32,25,{filter:'drop-shadow(0 0 5px rgba(255,210,90,.55))'})){ctx.fillStyle='#6b3018';ctx.beginPath();ctx.ellipse(b.x,b.y,10,16,.55,0,Math.PI*2);ctx.fill()}}
 for(const t of state.tokens){if(t.taken)continue;if(!atlas(images.props,PROP.token,t.x-18,t.y-18,36,28,{filter:'drop-shadow(0 0 8px #ffd84c)'})){ctx.fillStyle='#ffd84c';ctx.beginPath();ctx.arc(t.x,t.y,15,0,Math.PI*2);ctx.fill()}}
 for(const e of state.enemies){if(e.dead)continue;const cell=PROP[e.kind]||PROP.spam,dh=e.kind==='drone'?46:e.kind==='scooter'?50:58,dw=e.kind==='drone'?60:e.kind==='scooter'?72:62;const yy=e.kind==='drone'?e.y-10:e.y-14;const ok=atlas(images.props,cell,e.x-8,yy,dw,dh,{flip:e.v<0,filter:'drop-shadow(0 4px 3px rgba(0,0,0,.38))'});if(!ok){ctx.fillStyle='#343a40';ctx.fillRect(e.x,e.y,e.w,e.h)}}
 for(const s of state.shockwaves){ctx.fillStyle='rgba(255,132,72,.82)';ctx.beginPath();ctx.ellipse(s.x,s.y,28,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffd166';ctx.stroke()}
 if(state.boss){const b=state.boss;ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='#263447';ctx.fillRect(0,15,b.w,b.h-15);ctx.fillStyle='#f39a37';ctx.fillRect(12,28,42,42);ctx.fillRect(b.w-54,28,42,42);ctx.fillStyle='#101822';ctx.fillRect(25,88,b.w-50,26);ctx.fillStyle='#fff';ctx.font='bold 13px system-ui';ctx.fillText('THE OFFICIAL',32,106);ctx.fillStyle='#ff954c';ctx.beginPath();ctx.arc(18,44,18,0,Math.PI*2);ctx.arc(b.w-18,44,18,0,Math.PI*2);ctx.fill();ctx.restore()}
 drawPlayer(p);
 if(p.pulse>0&&p.pulse>4.55-save.upgrades.pulse*.45){ctx.strokeStyle='#63f3e7';ctx.lineWidth=6;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,145*(1-(p.pulse%1)),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
 for(const q of state.particles){ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 if(!state.boss){atlas(images.props,PROP.finish,L.length-170,345,130,100,{filter:'drop-shadow(0 0 10px rgba(87,231,218,.35))'})}else{ctx.fillStyle='#1f3b2d';ctx.fillRect(L.length-90,300,14,148)}
}
function drawFx(){if(mode==='pause'){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 34px system-ui';ctx.textAlign='center';ctx.fillText('ПАУЗА',W/2,H/2);ctx.textAlign='left'}}
function loop(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;acc+=dt;while(acc>=1/60){update(1/60);acc-=1/60}draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

function togglePause(){if(mode==='play')mode='pause';else if(mode==='pause')mode='play'}
$('#menuBtn').onclick=()=>{if(mode==='play'||mode==='pause'){mode='menu';$('#gameShell').classList.add('hidden');$('#menuScreen').classList.remove('hidden');renderMenu()}};
$('#resumeBtn').onclick=()=>{if(state){$('#menuScreen').classList.add('hidden');$('#gameShell').classList.remove('hidden');mode='play'}};
$('#nextBtn').onclick=()=>{$('#completeScreen').classList.add('hidden');if(levelIndex<44)startLevel(levelIndex+1);else{mode='menu';$('#gameShell').classList.add('hidden');$('#menuScreen').classList.remove('hidden');renderMenu()}};
$('#mapBtn').onclick=()=>{$('#completeScreen').classList.add('hidden');mode='menu';$('#gameShell').classList.add('hidden');$('#menuScreen').classList.remove('hidden');renderMenu()};
function renderMenu(){const grid=$('#levelGrid');grid.innerHTML='';LEVELS.forEach((L,i)=>{const b=document.createElement('button');b.className='level-card';if(i>=save.unlocked)b.classList.add('locked');b.innerHTML=`<span class="lvl-icon">${L.icon}</span><b>${L.id}</b><strong>${L.world}</strong><small>${L.name}</small><em>${'★'.repeat(save.stars[L.id]||0)}${'☆'.repeat(3-(save.stars[L.id]||0))}</em>`;b.disabled=i>=save.unlocked;b.onclick=()=>startLevel(i);grid.appendChild(b)});$('#bankBeans').textContent=save.beans;$('#bankTokens').textContent=save.tokens;$('#campaign').textContent=`${Math.min(save.unlocked,45)}/45`;$('#resumeBtn').classList.toggle('hidden',!state);$$('[data-character]').forEach(x=>x.classList.toggle('selected',x.dataset.character===save.selected))}
$$('[data-character]').forEach(b=>b.onclick=()=>{save.selected=b.dataset.character;persist();renderMenu()});
$$('[data-upgrade]').forEach(b=>b.onclick=()=>{const k=b.dataset.upgrade,cost=5+save.upgrades[k]*5;if(save.tokens<cost)return toast(`Потрібно ${cost} токенів`);save.tokens-=cost;save.upgrades[k]++;persist();renderMenu();toast('Покращення активовано')});
$('#resetBtn').onclick=()=>{if(confirm('Скинути весь прогрес кампанії?')){save=structuredClone(defaultSave);persist();state=null;renderMenu()}};
renderMenu();
})();