/* World 01 narrative layer. Pause-safe dialogs, explicit quest reducer,
   local checkpoint snapshots and one-time (game-only) token rewards. */
(() => {
  'use strict';
  const Q=window.PBOT_QUESTS,$=s=>document.querySelector(s);
  let api=null,s=null,save=null,near=null,clock=0,previousFocus=null,dialogNPC=null;
  const shell=$('#gameShell');
  const root=document.createElement('div');root.id='storyUI';root.className='story-ui hidden';
  root.innerHTML=`
    <button id="questTracker" class="quest-tracker" aria-label="Відкрити журнал завдань"><small></small><span></span><em>J · журнал</em></button>
    <button id="interactBtn" class="interact-button hidden"><kbd>F</kbd><span>Поговорити</span></button>
    <section id="storyDialog" class="story-modal hidden" role="dialog" aria-modal="true" aria-labelledby="dialogName" aria-describedby="dialogText">
      <div class="dialog-card"><img id="dialogPortrait" alt=""><div class="dialog-copy"><small id="dialogEyebrow">МІСТО ПРОКИДАЄТЬСЯ</small><h2 id="dialogName"></h2><p id="dialogText"></p><small id="dialogReward"></small><div id="dialogChoices"></div></div><button id="dialogClose" class="dialog-close" aria-label="Закрити діалог">×</button></div>
    </section>
    <section id="questJournal" class="story-modal hidden" role="dialog" aria-modal="true" aria-labelledby="journalTitle">
      <div class="journal-card"><small>РОЗВИЛКА · РОЗДІЛ 01</small><h2 id="journalTitle">Ранок без сигналу</h2><p>Міська мережа замовкла. Допоможи сусідам відновити зв’язок і дізнайся, хто заблокував маршрут.</p><div id="journalItems"></div><p class="journal-keys">F — розмова / взаємодія · E — імпульс Perky · J — журнал</p><button id="journalClose" class="primary">ПОВЕРНУТИСЯ ДО ГРИ</button></div>
    </section>`;
  shell.appendChild(root);
  const tracker=$('#questTracker'),interactBtn=$('#interactBtn'),dialog=$('#storyDialog'),journal=$('#questJournal');
  const log=[['Заряд для міста','PerkUp: збери 8 зерен і повернись до баристи.'],['Повідомлення у шумі','NEWS: знайди 3 фрагменти біля мосту й поверни їх редактору.'],['Посилка для CHARME','Піднімися на риштування. Поверни посилку майстру.'],['Поверни сигнал','Запусти термінал біля другого чекпойнта та відкрий портал.']];
  const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
  const artURL=k=>'/assets/world01-v2/'+k+'.webp';
  function checkpoint(){
    if(!s||s.L.id!=='01-01'||s.finished||!api)return;
    const p=s.player;let spawn={x:p.cpX,y:448-p.standH};
    if(p.onGround&&!s.deadTimer&&s.plats.some(q=>p.x>=q.x&&p.x+p.w<=q.x+q.w&&Math.abs(p.y+p.h-q.y)<2))spawn={x:p.x,y:p.y+p.h-p.standH};
    else if(s.safeStorySpawn)spawn=s.safeStorySpawn;
    s.safeStorySpawn=spawn;
    save.storyRun={version:1,build:'story-v1',quest:Q.clean(s.quest),spawn,cpX:p.cpX,time:s.time,lives:s.lives,damageCount:s.damageCount,
      beans:s.beans.map((b,i)=>b.taken?i:-1).filter(i=>i>=0),tokens:s.tokens.map((b,i)=>b.taken?i:-1).filter(i=>i>=0),
      checkpoints:s.checkpoints.map(c=>c.hit),enemies:s.enemies.map(e=>e.dead)};
    api.persist();
  }
  function restore(raw){
    if(!raw||raw.version!==1)return;
    s.quest=Q.clean(raw.quest);const p=s.player;
    s.beans.forEach((b,i)=>b.taken=Array.isArray(raw.beans)&&raw.beans.includes(i));s.scoreBeans=s.beans.filter(b=>b.taken).length;
    s.tokens.forEach((b,i)=>b.taken=Array.isArray(raw.tokens)&&raw.tokens.includes(i));s.scoreTokens=s.tokens.filter(b=>b.taken).length;
    s.checkpoints.forEach((c,i)=>c.hit=raw.checkpoints?.[i]===true);s.enemies.forEach((e,i)=>e.dead=raw.enemies?.[i]===true);
    p.cpX=s.checkpoints.filter(c=>c.hit).at(-1)?.x||90;
    const spawn=raw.spawn;
    if(spawn&&Number.isFinite(spawn.x)&&Number.isFinite(spawn.y)&&s.plats.some(q=>spawn.x>=q.x&&spawn.x+p.w<=q.x+q.w&&Math.abs(spawn.y+p.standH-q.y)<2)){
      p.x=spawn.x;p.y=spawn.y;p.onGround=true;
    }else{p.x=p.cpX;p.y=448-p.standH;p.onGround=true;}
    s.camera=Math.max(0,Math.min(s.L.length-960,p.x-310));s.time=Math.max(0,Number(raw.time)||0);s.lives=Math.max(1,Math.min(3,Number(raw.lives)||3));s.damageCount=Math.max(0,Number(raw.damageCount)||0);p.inv=1.5;
  }
  function begin(state,store,bridge,resume=true){
    api=bridge;save=store;s=state;near=null;clock=0;dialog.classList.add('hidden');journal.classList.add('hidden');
    if(s.L.id!=='01-01'){root.classList.add('hidden');return;}
    s.quest=Q.clean(null);if(resume&&save.storyRun)restore(save.storyRun);
    root.classList.remove('hidden');refresh();
    if(!s.quest.introSeen)show('perky','Perky','Ранок у Броварах почався дивно: термінал парку мовчить, а замість новин — лише SPAM.\nПочнімо з PerkUp. Бариста біля кав’ярні бачила, що сталося.',[
      ['Рушаймо',()=>{apply('intro');close();}],['Як керувати?',()=>help()]
    ],'РОЗДІЛ 01 · РАНОК БЕЗ СИГНАЛУ');
    api.hud();
  }
  function help(){show('perky','Perky','Рухайся стрілками або A / D. Стрибок — пробіл: натисни двічі для подвійного стрибка.\nБіля людей натискай F. E — імпульс проти SPAM. На телефоні використовуй кнопки. Журнал — J.',[['Зрозуміло',()=>{apply('intro');close();}]],'КЕРУВАННЯ');}
  function apply(command){
    const result=Q.transition(s.quest,command,{beans:s.scoreBeans});if(!result.changed)return false;
    s.quest=result.q;
    if(result.reward){if(!save.questRewards||typeof save.questRewards!=='object'||Array.isArray(save.questRewards))save.questRewards={};if(!save.questRewards[result.reward]){save.questRewards[result.reward]=true;save.tokens=(Number(save.tokens)||0)+1;api.notify('Завдання виконано · +1 Brovary Token');}else api.notify('Завдання виконано · нагороду вже отримано');}
    checkpoint();refresh();return true;
  }
  function show(art,name,text,choices,eyebrow='РОЗМОВА',reward=''){
    previousFocus=document.activeElement;api.clearInput();s.player.vx=0;api.setMode('dialog');
    $('#dialogPortrait').src=artURL(art);$('#dialogName').textContent=name;$('#dialogEyebrow').textContent=eyebrow;$('#dialogText').textContent=text;$('#dialogReward').textContent=reward;
    const box=$('#dialogChoices');box.replaceChildren();choices.forEach(([label,fn],i)=>{const b=document.createElement('button');b.type='button';b.className=i===0?'primary':'ghost';b.textContent=label;b.onclick=fn;box.append(b)});
    dialog.classList.remove('hidden');journal.classList.add('hidden');interactBtn.classList.add('hidden');tracker.classList.add('hidden');box.querySelector('button')?.focus();
  }
  function close(){
    dialog.classList.add('hidden');journal.classList.add('hidden');dialogNPC=null;
    if(!api)return;api.clearInput();if(api.getMode()==='dialog'||api.getMode()==='journal')api.setMode('play');refresh();checkpoint();
    if(previousFocus?.isConnected&&!previousFocus.closest('.hidden'))previousFocus.focus();
  }
  $('#dialogClose').onclick=()=>{if(s&&!s.quest.introSeen)apply('intro');close()};$('#journalClose').onclick=close;
  function talk(id){
    if(!s||s.finished)return;const npc=Q.NPCS[id];if(!npc)return;dialogNPC=id;
    const q=s.quest,phase=q.phase,st=Q.status(q,id,s.scoreBeans),later=['Пізніше',close],back=['Повернутися',close];
    if(id==='coffee'){
      if(st==='available')return show(npc.art,npc.name,'Під час ранкового збою зерна розсипались уздовж вулиці. Збереш вісім?\nЗварю заряд для міського термінала. Зерна, які ти вже знайшов, теж зарахуються.',[['Допоможу',()=>{apply('accept-coffee');close();}],later],'ЗАВДАННЯ · ЗАРЯД ДЛЯ МІСТА','Нагорода: енергозаряд + 1 ігровий жетон');
      if(st==='active')return show(npc.art,npc.name,`У тебе ${Math.min(8,s.scoreBeans)} із 8 зерен. Подивись біля лавки та на даху зупинки.\nПринеси їх сюди — заряд не з’явиться сам собою. Навіть кава потребує трохи роботи.`,[['Добре',close],['Що сталося вранці?',()=>show(npc.art,npc.name,'На екранах з’явився штамп «МАРШРУТ НЕ ПОГОДЖЕНО». Потім зник сигнал. Редактор NEWS зберіг уривок повідомлення.',[back],'МІСЬКА ІСТОРІЯ')]],'ЗАВДАННЯ В РОБОТІ');
      if(st==='ready')return show(npc.art,npc.name,'Усі вісім на місці. Готую заряд!\nТепер знайди редактора NEWS біля кіоску. Без правильного коду термінал навіть кавою не розбудити.',[['Передати зерна й забрати заряд',()=>{apply('handin-coffee');close();}]],'ГОТОВО ДО ЗДАЧІ');
      return show(npc.art,npc.name,'Заряд уже у твоєму наборі. NEWS допоможе відновити код, а термінал — відкрити шлях до парку.',[back],'ДЯКУЮ ЗА ДОПОМОГУ');
    }
    if(id==='news'){
      if(st==='locked')return show(npc.art,npc.name,'Я розбираю пошкоджене повідомлення. Спочатку допоможи PerkUp з енергозарядом — без живлення навіть правильний код не спрацює.',[back],'ПОТРІБЕН ЗАРЯД');
      if(st==='available')return show(npc.art,npc.name,'SPAM розірвав ранкове повідомлення на три фрагменти. Вони лишилися між кіоском і дальнім кінцем мосту.\nЗнайди їх та поверни мені. Відновимо код і дізнаємось, хто вимкнув маршрут.',[['Знайду фрагменти',()=>{apply('accept-news');close();}],later],'ЗАВДАННЯ · ПОВІДОМЛЕННЯ У ШУМІ','Нагорода: код маршруту + 1 ігровий жетон');
      if(st==='active')return show(npc.art,npc.name,`Знайдено ${q.shards.length} із 3 фрагментів. Шукай сині картки по дорозі до мосту та за ним.\nSPAM можна прибрати імпульсом Perky: E або ◎.`,[['Продовжу пошук',close]],'ПОШУК ТРИВАЄ');
      if(st==='ready')return show(npc.art,npc.name,'Складаю повідомлення… «Наказ №0. Жодного руху без погодження». Підпис: THE OFFICIAL.\nКод маршруту врятовано. Зайди до майстра CHARME: він готує спорядження для дороги до парку.',[['Передати 3 фрагменти',()=>{apply('handin-news');close();}]],'ЗНАЙДЕНО СЛІД');
      return show(npc.art,npc.name,'Ми повернули справжнє повідомлення замість шуму. THE OFFICIAL — поки лише підпис. Далі шукатимемо джерело.',[back],'КОД ВІДНОВЛЕНО');
    }
    if(id==='shoes'){
      if(st==='locked')return show(npc.art,npc.name,'Посилка для міського маршруту десь на риштуванні. Та спершу допоможи PerkUp і NEWS повернути живлення та код.',[back],'ЗУСТРІНЕМОСЬ ЗГОДОМ');
      if(st==='available')return show(npc.art,npc.name,'Кур’єр залишив посилку на верхньому настилі риштування, праворуч від магазину.\nПіднімись по ящиках і принеси її. Усередині — модуль зчеплення для твого спорядження.',[['Заберу посилку',()=>{apply('accept-shoes');close();}],later],'ЗАВДАННЯ · ПОСИЛКА ДЛЯ CHARME','Нагорода: краще гальмування в цьому рівні + 1 ігровий жетон');
      if(st==='active')return show(npc.art,npc.name,'Посилка зверху: клумба → низький ящик → високий ящик → настил.\nНатисни стрибок удруге в повітрі. Після знахідки повернись сюди.',[['Підіймаюсь',close]],'ПОСИЛКА ЩЕ НАГОРІ');
      if(st==='ready')return show(npc.art,npc.name,'Саме ця посилка! Закріплюю модуль: тепер ти точніше зупинятимешся біля країв.\nЗаряд є, код є. Далі — термінал біля другого чекпойнта. Запусти його вручну.',[['Передати посилку',()=>{apply('handin-shoes');close();}]],'СПОРЯДЖЕННЯ ГОТОВЕ');
      return show(npc.art,npc.name,'Модуль уже працює. Перевір термінал за ділянкою ремонту — від нього залежить портал.',[back],'ВДАЛОЇ ДОРОГИ');
    }
    if(id==='terminal'){
      if(phase<6)return show(npc.art,npc.name,'МАРШРУТ ЗАБЛОКОВАНО\nПотрібні енергозаряд PerkUp, код від NEWS та завершена доставка CHARME. Підказки й поточна ціль — у журналі.',[['Відкрити журнал',()=>{close();openJournal();}],back],'ТЕРМІНАЛ · НЕМАЄ ДОСТУПУ');
      if(phase===6)return show(npc.art,npc.name,'Заряд під’єднано. Код прийнято.\nМережа готова до запуску. Відновити сигнал і відкрити маршрут до парку?', [['ВІДНОВИТИ СИГНАЛ',()=>{apply('activate');api.burst(npc.x,390,28,'#65eddf');api.notify('Сигнал відновлено · портал до парку відкритий');close();}],later],'ТЕРМІНАЛ · ГОТОВИЙ ДО ЗАПУСКУ');
      return show(npc.art,npc.name,'СИГНАЛ СТАБІЛЬНИЙ\nМаршрут до парку відкрито. Джерело перешкод поки лишається попереду.',[back],'МІСТО НА ЗВ’ЯЗКУ');
    }
    if(id==='exit'){
      if(phase<7)return show('perky','Perky','Портал ще без сигналу. Не вистачає завершених завдань або запуску термінала.\nВідкрий журнал — там видно, що робити далі.',[['Відкрити журнал',()=>{close();openJournal();}],back],'МАРШРУТ ЗАЧИНЕНО');
      return show('perky','Perky','Розвилка знову на зв’язку. Ми допомогли сусідам і знайшли перший слід THE OFFICIAL.\nДалі — «Паркові стежки». Там перевіримо, звідки приходять заборони.',[['ЗАВЕРШИТИ РОЗДІЛ',()=>{close();save.storyRun=null;save.story01Complete=true;api.finish();}],['Ще досліджу рівень',close]],'РОЗДІЛ ЗАВЕРШЕНО');
    }
  }
  function openJournal(){if(!s||s.L.id!=='01-01'||s.finished)return;previousFocus=document.activeElement;api.clearInput();api.setMode('journal');dialog.classList.add('hidden');journal.classList.remove('hidden');tracker.classList.add('hidden');interactBtn.classList.add('hidden');
    const list=$('#journalItems');list.replaceChildren();log.forEach(([title,desc],i)=>{const done=s.quest.phase>(i*2+1)||(i===3&&s.quest.phase===7),active=s.quest.phase>=i*2&&!done;const row=document.createElement('div');row.className='journal-item '+(done?'done':active?'active':'locked');const symbol=document.createElement('b');symbol.textContent=done?'✓':active?'●':'○';const text=document.createElement('div');const h=document.createElement('strong');h.textContent=title;const p=document.createElement('p');p.textContent=desc;text.append(h,p);row.append(symbol,text);list.append(row)});$('#journalClose').focus();}
  tracker.onclick=openJournal;interactBtn.onclick=()=>{if(near&&api.getMode()==='play')talk(near);};
  function refresh(){
    if(!s||s.L.id!=='01-01')return;const playing=api.getMode()==='play'&&!s.finished;const obj=Q.objective(s.quest,s.scoreBeans);
    tracker.classList.toggle('hidden',!playing);setText(tracker.querySelector('small'),obj[0]);setText(tracker.querySelector('span'),obj[1]);
    interactBtn.classList.toggle('hidden',!near||!playing||s.deadTimer>0);
    if(near)setText(interactBtn.querySelector('span'),near==='terminal'?'Термінал':near==='exit'?'Портал':'Поговорити');
  }
  function update(state,dt){
    if(!api||state!==s||s.L.id!=='01-01'||s.finished)return;const p=s.player;
    near=null;let dist=Infinity;
    for(const [id,npc] of Object.entries(Q.NPCS)){const dx=Math.abs(p.x+p.w/2-npc.x),dy=Math.abs(p.y+p.h-npc.y);if(dx<92&&dy<85&&dx<dist){near=id;dist=dx;}}
    if(!s.deadTimer){
      for(const shard of Q.SHARDS){if(s.quest.phase===3&&!s.quest.shards.includes(shard.id)&&Math.hypot(p.x+p.w/2-shard.x,p.y+p.h/2-shard.y)<42){if(apply('shard:'+shard.id)){api.burst(shard.x,shard.y,9,'#86deff');api.notify(`Фрагмент повідомлення · ${s.quest.shards.length}/3`);}}}
      if(s.quest.phase===5&&!s.quest.parcel&&Math.hypot(p.x+p.w/2-Q.PARCEL.x,p.y+p.h/2-Q.PARCEL.y)<43){apply('parcel');api.burst(Q.PARCEL.x,Q.PARCEL.y,12,'#ffd67c');api.notify('Посилка знайдена · поверни її майстру CHARME');}
    }
    clock+=dt;if(clock>4){clock=0;checkpoint();}refresh();
  }
  function render(c,state){
    if(!api||state!==s||s.L.id!=='01-01')return;const q=s.quest,t=s.time;
    for(const [id,npc] of Object.entries(Q.NPCS)){
      if(npc.x<s.camera-70||npc.x>s.camera+1030)continue;const st=Q.status(q,id,s.scoreBeans),isNear=near===id;
      const symbol=st==='ready'?'✓':st==='available'?'!':st==='active'?'…':st==='done'?'✓':'·';
      const yy=npc.y-(id==='exit'?188:id==='terminal'?110:104);
      c.save();c.fillStyle=st==='ready'?'#54efd5':st==='available'?'#ffdb77':'#0c3248';c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.3;
      c.beginPath();c.arc(npc.x,yy,13,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=st==='ready'||st==='available'?'#113343':'#f3fcff';c.textAlign='center';c.font='800 15px system-ui';c.fillText(symbol,npc.x,yy+5);
      if(isNear){c.font='700 11px system-ui';const text=id==='exit'?'F · Відкрити маршрут':id==='terminal'?'F · Термінал':'F · '+npc.name,w=c.measureText(text).width+20;c.fillStyle='rgba(6,30,42,.92)';c.beginPath();c.roundRect(npc.x-w/2,yy-43,w,24,8);c.fill();c.fillStyle='#fff';c.fillText(text,npc.x,yy-27);}
      c.restore();
    }
    if(q.phase===3)for(const shard of Q.SHARDS){if(q.shards.includes(shard.id))continue;c.save();c.translate(shard.x,shard.y+Math.sin(t*3)*2);c.rotate(.08*Math.sin(t*2));c.fillStyle='#ecfbff';c.strokeStyle='#22aac6';c.lineWidth=2;c.beginPath();c.roundRect(-11,-14,22,28,4);c.fill();c.stroke();c.fillStyle='#208aa6';for(let j=0;j<3;j++)c.fillRect(-6,-7+j*6,12,2);c.restore();}
    if(q.phase===5&&!q.parcel){const im=window.PBOT_WORLD01.art.crate;c.save();c.drawImage(im,Q.PARCEL.x-18,Q.PARCEL.y-19,36,36);c.strokeStyle='#ffe288';c.lineWidth=2;c.strokeRect(Q.PARCEL.x-20,Q.PARCEL.y-21,40,40);c.font='700 11px system-ui';c.textAlign='center';c.fillStyle='#062535';c.fillText('CHARME',Q.PARCEL.x,Q.PARCEL.y-27);c.restore();}
    if(q.phase>=7){c.save();c.strokeStyle='#62f3de';c.lineWidth=3;for(let j=0;j<3;j++){c.globalAlpha=.55-j*.12;c.beginPath();c.ellipse(3238,437-j*10,36+j*5,10,0,0,Math.PI*2);c.stroke();}c.restore();}
  }
  function keydown(e){
    if(!s||s.L.id!=='01-01'||s.finished)return;const mode=api.getMode();
    if(mode==='dialog'||mode==='journal'){
      if(e.code==='Tab'){const box=mode==='dialog'?dialog:journal;const buttons=[...box.querySelectorAll('button:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}return;}
      if(['Escape','KeyF','KeyJ'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;if(e.code==='Escape'||mode==='journal'){if(!s.quest.introSeen)apply('intro');close();}return;}
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyA','KeyD','KeyW','KeyS'].includes(e.code)){e.stopImmediatePropagation();if(e.code!=='Space')e.preventDefault();}return;
    }
    if(mode!=='play'||e.repeat)return;
    if(e.code==='KeyF'&&near){e.preventDefault();e.stopImmediatePropagation();talk(near);}
    if(e.code==='KeyJ'){e.preventDefault();e.stopImmediatePropagation();openJournal();}
  }
  addEventListener('keydown',keydown,true);addEventListener('pagehide',checkpoint);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint();});
  function hide(){checkpoint();root.classList.add('hidden');dialog.classList.add('hidden');journal.classList.add('hidden');near=null;}
  function resume(){if(s?.L.id==='01-01'){root.classList.remove('hidden');refresh();}}
  function completed(){if(s?.L.id==='01-01'){save.storyRun=null;save.story01Complete=true;api.persist();hide();}}
  window.PBOT_STORY={begin,update,render,hide,resume,refresh,checkpoint,completed,canFinish:()=>s?.L.id!=='01-01'||s.quest?.phase===7};
})();
