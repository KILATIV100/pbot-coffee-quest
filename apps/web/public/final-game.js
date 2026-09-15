(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#game'), ctx=canvas.getContext('2d');
const W=960,H=540, DPR=Math.min(devicePixelRatio||1,2);
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

let mode='menu',levelIndex=0,state=null,last=0,acc=0;
const bg=new Image();bg.src='/assets/backgrounds/world01-level01.webp';
const hud={beans:$('#beans'),tokens:$('#tokens'),lives:$('#lives'),world:$('#worldName'),level:$('#levelCode'),progress:$('#routeProgressFill'),label:$('#routeProgressLabel')};
function rand(seed){let t=seed+0x6D2B79F5;return()=>{t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),1800)}

function buildLevel(i){const L=LEVELS[i],r=rand(i*991+17),plats=[{x:0,y:448,w:L.length,h:120}],haz=[],beans=[],tokens=[],enemies=[],checkpoints=[];
 for(let x=520;x<L.length-500;x+=320+r()*170){if(r()<.34){const gap=90+r()*95;haz.push({x,y:448,w:gap,h:92,type:'pit'});plats.push({x:x+gap,y:448,w:180+r()*160,h:120})}if(r()<.58)plats.push({x:x+70,y:330-r()*80,w:120+r()*100,h:24});}
 for(let x=220;x<L.length-240;x+=120+r()*80)beans.push({x,y:390-r()*130,taken:false});
 for(let n=0;n<L.tokens;n++)tokens.push({x:(n+1)*L.length/(L.tokens+1),y:250-r()*90,taken:false});
 for(let x=900;x<L.length-600;x+=680+r()*300)enemies.push({x,y:410,w:42,h:38,v:(r()<.5?-1:1)*(35+L.wi*2),hp:1+(L.wi>8?1:0),dead:false,kind:r()<.33?'drone':'spam'});
 [0.33,0.66].forEach(p=>checkpoints.push({x:L.length*p,hit:false}));
 return {L,plats,haz,beans,tokens,enemies,checkpoints};}
function startLevel(i){levelIndex=i;const data=buildLevel(i),L=data.L;state={...data,time:0,camera:0,scoreBeans:0,scoreTokens:0,lives:3,finished:false,deadTimer:0,player:{x:90,y:360,w:36,h:54,vx:0,vy:0,onGround:false,jumps:0,inv:0,cpX:90,pulse:0},boss:L.boss?{x:L.length-420,y:330,w:150,h:118,hp:8,max:8,phase:0,cool:2}:null};mode='play';$('#menuScreen').classList.add('hidden');$('#gameShell').classList.remove('hidden');updateHud();toast(`${L.id} · ${L.world} · ${L.name}`)}

function updateHud(){if(!state)return;const L=state.L;hud.beans.textContent=`${state.scoreBeans}/${L.beans}`;hud.tokens.textContent=state.scoreTokens;hud.lives.textContent=state.lives;hud.world.textContent=L.world;hud.level.textContent=L.id;const p=Math.min(1,state.player.x/L.length);hud.progress.style.width=(p*100)+'%';hud.label.textContent=Math.round(p*100)+'%'}
function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function groundCollision(p){p.onGround=false;for(const q of state.plats){if(p.vy>=0&&p.x+p.w>q.x&&p.x<q.x+q.w&&p.y+p.h<=q.y+18&&p.y+p.h+p.vy/60>=q.y){p.y=q.y-p.h;p.vy=0;p.onGround=true;p.jumps=0}}}
function kill(){const p=state.player;if(p.inv>0||state.deadTimer>0)return;state.lives--;updateHud();if(state.lives<=0){state.lives=3;p.cpX=90;toast('Спроба перезапущена')}state.deadTimer=.65;p.inv=1.8}
function respawn(){const p=state.player;p.x=p.cpX;p.y=330;p.vx=0;p.vy=0;state.deadTimer=0}
function finish(){if(state.finished)return;state.finished=true;const L=state.L;let stars=1;if(state.scoreBeans>=L.beans)stars++;if(state.lives===3)stars++;save.unlocked=Math.max(save.unlocked,Math.min(45,levelIndex+2));save.stars[L.id]=Math.max(save.stars[L.id]||0,stars);save.best[L.id]=Math.min(save.best[L.id]||Infinity,state.time);save.beans+=state.scoreBeans;save.tokens+=state.scoreTokens;persist();setTimeout(()=>showComplete(stars),500)}
function showComplete(stars){mode='complete';$('#completeTitle').textContent=state.L.boss?'BROVARY ЗВІЛЬНЕНО':'РІВЕНЬ ПРОЙДЕНО';$('#completeMeta').textContent=`${state.L.id} · ${state.L.world} · ${state.L.name}`;$('#completeStars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#completeStats').textContent=`☕ ${state.scoreBeans} · ✦ ${state.scoreTokens} · ${state.time.toFixed(1)} c`;$('#completeScreen').classList.remove('hidden')}

function update(dt){if(mode!=='play'||!state||state.finished)return;state.time+=dt;const p=state.player,L=state.L;if(p.inv>0)p.inv-=dt;if(state.deadTimer>0){state.deadTimer-=dt;if(state.deadTimer<=0)respawn();return}
 const speed=215+save.upgrades.speed*18;const accel=1600;p.vx+=(input.right-input.left)*accel*dt;p.vx*=Math.pow(.0015,dt);p.vx=Math.max(-speed,Math.min(speed,p.vx));if(input.down&&p.onGround)p.vx*=.75;
 if(input.jumpPressed){if(p.onGround||p.jumps<2){p.vy=-(430+save.upgrades.jump*18);p.onGround=false;p.jumps++;}}input.jumpPressed=false;
 p.vy+=1080*dt;p.x+=p.vx*dt;p.x=Math.max(0,Math.min(L.length-p.w,p.x));p.y+=p.vy*dt;groundCollision(p);if(p.y>H+120)kill();
 for(const h of state.haz){if(rect(p,{x:h.x,y:h.y,w:h.w,h:h.h}))kill()}
 for(const b of state.beans){if(!b.taken&&Math.hypot(p.x-b.x,p.y-b.y)<54){b.taken=true;state.scoreBeans++}}
 for(const t of state.tokens){if(!t.taken&&Math.hypot(p.x-t.x,p.y-t.y)<60){t.taken=true;state.scoreTokens++;toast('Brovary Token +1')}}
 for(const c of state.checkpoints){if(!c.hit&&p.x>c.x){c.hit=true;p.cpX=c.x;toast('Чекпойнт активовано')}}
 for(const e of state.enemies){if(e.dead)continue;e.x+=e.v*dt;if(e.x<120||e.x>L.length-140)e.v*=-1;const er={x:e.x,y:e.y,w:e.w,h:e.h};if(rect(p,er)){if(p.vy>120&&p.y+p.h<e.y+24){e.dead=true;p.vy=-280;toast('SPAM нейтралізовано')}else kill()}}
 if(input.actionPressed&&p.pulse<=0){p.pulse=5-Math.min(2.4,save.upgrades.pulse*.45);for(const e of state.enemies){if(!e.dead&&Math.abs(e.x-p.x)<170)e.dead=true}if(state.boss&&Math.abs(state.boss.x-p.x)<220){state.boss.hp--;toast(`The Official: ${state.boss.hp}/${state.boss.max}`);if(state.boss.hp<=0)finish()}}input.actionPressed=false;if(p.pulse>0)p.pulse-=dt;
 if(state.boss&&!state.finished){const b=state.boss;b.cool-=dt;if(b.cool<0){b.cool=1.5-Math.min(.55,(8-b.hp)*.08);state.enemies.push({x:b.x-80,y:405,w:40,h:36,v:-110,hp:1,dead:false,kind:'drone'})}if(p.x>L.length-820)b.x=Math.min(L.length-240,b.x+Math.sin(state.time*2)*.2)}
 if(!state.boss&&p.x>L.length-120)finish();state.camera+=(Math.max(0,Math.min(L.length-W,p.x-310))-state.camera)*(1-Math.pow(.001,dt));updateHud()}

function draw(){ctx.clearRect(0,0,W,H);if(!state){return}const {L}=state,cam=state.camera;const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,L.c1);g.addColorStop(.72,L.c2);g.addColorStop(1,'#18301f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(L.wi===0&&bg.complete){ctx.globalAlpha=.38;const scale=H/bg.height;const iw=bg.width*scale;for(let x=-(cam*.12%iw)-iw;x<W+iw;x+=iw)ctx.drawImage(bg,x,0,iw,H);ctx.globalAlpha=1}else drawCity(cam,L);
 ctx.save();ctx.translate(-cam,0);drawWorld();ctx.restore();drawFx();}
function drawCity(cam,L){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#082838';for(let i=0;i<18;i++){const x=((i*173-cam*.1)%1200)-120,h=90+(i*37)%150;ctx.fillRect(x,285-h,74,h);for(let r=0;r<4;r++)for(let c=0;c<3;c++){ctx.fillStyle='rgba(255,245,180,.35)';ctx.fillRect(x+10+c*20,300-h+r*22,8,10);ctx.fillStyle='#082838'}}ctx.restore();ctx.font='74px system-ui';ctx.globalAlpha=.14;for(let x=100-(cam*.2%600);x<W+200;x+=600)ctx.fillText(L.icon,x,250);ctx.globalAlpha=1}
function drawWorld(){const p=state.player;ctx.fillStyle='rgba(20,38,28,.85)';for(const q of state.plats){ctx.fillRect(q.x,q.y,q.w,q.h);ctx.fillStyle='#80c958';ctx.fillRect(q.x,q.y,q.w,8);ctx.fillStyle='rgba(20,38,28,.85)'}
 for(const h of state.haz){ctx.fillStyle='#ff5e57';for(let x=h.x;x<h.x+h.w;x+=18){ctx.beginPath();ctx.moveTo(x,h.y+8);ctx.lineTo(x+9,h.y-20);ctx.lineTo(x+18,h.y+8);ctx.fill()}}
 for(const c of state.checkpoints){ctx.fillStyle=c.hit?'#58f2df':'#f2c94c';ctx.fillRect(c.x,355,8,93);ctx.fillStyle='rgba(3,20,30,.8)';ctx.fillRect(c.x+8,362,74,38);ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.fillText(c.hit?'CHECK ✓':'CHECK',c.x+17,386)}
 for(const b of state.beans){if(b.taken)continue;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(.55);ctx.fillStyle='#6b3018';ctx.beginPath();ctx.ellipse(0,0,10,16,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d5975c';ctx.beginPath();ctx.moveTo(-2,-14);ctx.quadraticCurveTo(4,0,-2,14);ctx.stroke();ctx.restore()}
 for(const t of state.tokens){if(t.taken)continue;ctx.fillStyle='#ffd84c';ctx.beginPath();ctx.arc(t.x,t.y,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#123';ctx.font='bold 14px system-ui';ctx.fillText('B',t.x-5,t.y+5)}
 for(const e of state.enemies){if(e.dead)continue;ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=e.kind==='drone'?'#1f2937':'#343a40';ctx.fillRect(0,0,e.w,e.h);ctx.fillStyle='#ff4d4f';ctx.fillRect(e.w*.25,8,e.w*.5,7);ctx.fillStyle='#fff';ctx.font='9px system-ui';ctx.fillText(e.kind==='drone'?'DRONE':'SPAM',3,e.h-6);ctx.restore()}
 if(state.boss){const b=state.boss;ctx.fillStyle='#263447';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#f39a37';ctx.fillRect(b.x+10,b.y+20,38,38);ctx.fillRect(b.x+102,b.y+20,38,38);ctx.fillStyle='#fff';ctx.font='bold 14px system-ui';ctx.fillText('THE OFFICIAL',b.x+22,b.y+78);ctx.fillStyle='#111';ctx.fillRect(b.x+15,b.y+90,120,10);ctx.fillStyle='#ff5b56';ctx.fillRect(b.x+15,b.y+90,120*(b.hp/b.max),10)}
 ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*12)%2?0.35:1;ctx.fillStyle=save.selected==='hero'?'#1f2937':save.selected==='vitalii'?'#2454a6':'#2a211d';ctx.beginPath();ctx.arc(0,-8,17,0,Math.PI*2);ctx.fill();ctx.fillRect(-14,8,28,26);ctx.fillStyle='#52f0df';ctx.fillRect(-8,14,16,10);ctx.fillStyle='#fff';ctx.fillRect(-8,-12,5,5);ctx.fillRect(3,-12,5,5);ctx.restore();
 if(p.pulse>0&&p.pulse>4.75-save.upgrades.pulse*.45){ctx.strokeStyle='#63f3e7';ctx.lineWidth=6;ctx.beginPath();ctx.arc(p.x+18,p.y+27,130*(1-(p.pulse%1)),0,Math.PI*2);ctx.stroke()}
 ctx.fillStyle='#1f3b2d';ctx.fillRect(L.length-90,300,14,148);ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';ctx.fillText(state.boss?'BOSS':'FINISH',L.length-160,288)}
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