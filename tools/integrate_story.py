from pathlib import Path
r=Path('apps/web');p=r/'public';s=(p/'final-game.js').read_text()
if "const BUILD='world01-story-20260915-3'" in s:
    print('Story integration already applied');raise SystemExit(0)
def rep(old,new):
 global s
 assert old in s,old[:100];s=s.replace(old,new)
rep("const BUILD='world01-art-20260915-2'","const BUILD='world01-story-20260915-3'")
rep('function startLevel(i){','function startLevel(i,resumeSaved=true){')
a=s.index(' if(i===0&&window.PBOT_WORLD01&&!window.PBOT_WORLD01.ready)');b=s.index(' clearInput();levelIndex=i;',a)
s=s[:a]+''' if(!window.PBOT_ACTORS.ready||(i===0&&!window.PBOT_WORLD01.ready)){
  const b=$('#playFirst');if(b){b.textContent='Завантаження героїв і міста…';b.disabled=true;}
  Promise.all([window.PBOT_ACTORS.loading,window.PBOT_WORLD01.loading]).then(()=>{if(b){b.disabled=false;b.textContent='ГРАТИ · 01-01'}startLevel(i,resumeSaved)}).catch(()=>{if(b){b.disabled=false;b.textContent='Помилка зображень · оновіть сторінку'}});return;
 }
'''+s[b:]
rep('resize();updateHud();toast(`${L.id} · ${L.world} · ${L.name}`)}','''resize();updateHud();toast(`${L.id} · ${L.world} · ${L.name}`);
 window.PBOT_ACTORS.update(state.player,0,false);
 window.PBOT_STORY.begin(state,save,{getMode:()=>mode,setMode:m=>{mode=m;document.documentElement.dataset.gameMode=m},clearInput,persist,notify:toast,burst,hud:updateHud,finish},resumeSaved);
}''')
rep("bindKey(e.key,true);if(e.key==='Escape')togglePause()","if(mode==='play')bindKey(({KeyA:'a',KeyD:'d',KeyW:'w',KeyS:'s',KeyE:'e',Space:' '})[e.code]||e.key,true);if(e.key==='Escape'&&!e.repeat)togglePause()")
rep('e=>bindKey(e.key,false)',"e=>bindKey(({KeyA:'a',KeyD:'d',KeyW:'w',KeyS:'s',KeyE:'e',Space:' '})[e.code]||e.key,false)")
rep('const on=e=>{e.preventDefault();b.setPointerCapture',"const on=e=>{e.preventDefault();if(mode!=='play')return;b.setPointerCapture")
rep('state.lives--;state.damageCount++;',"state.lives--;state.damageCount++;p.hurtTime=.28;p.animState='hurt';p.animTime=0;")
rep('function finish(){if(state.finished)return;state.finished=true;',"function finish(){if(state.finished||(levelIndex===0&&!window.PBOT_STORY.canFinish()))return;state.finished=true;state.player.animState='finish';state.player.animTime=0;window.PBOT_STORY.completed();")
rep("$('#completeMeta').textContent=`${state.L.id} · ${state.L.world} · ${state.L.name}`;","$('#completeMeta').textContent=levelIndex===0?'Сигнал відновлено. Наступна глава — «Паркові стежки».':`${state.L.id} · ${state.L.world} · ${state.L.name}`;")
rep('state.deadTimer-=dt;if(state.deadTimer<=0)respawn();return','state.deadTimer-=dt;window.PBOT_ACTORS.update(p,dt,false);if(state.deadTimer<=0)respawn();return')
rep('if(input.down&&p.onGround)p.vx*=.75;',"if(input.down&&p.onGround)p.vx*=.75;if(levelIndex===0&&state.quest?.phase>=6&&!dir)p.vx*=Math.pow(.02,dt);")
rep('if(!state.boss&&p.x>L.length-120)finish();','if(levelIndex===0)window.PBOT_STORY.update(state,dt);else if(!state.boss&&p.x>L.length-120)finish();window.PBOT_ACTORS.update(p,dt,state.finished);')
rep('function drawPlayer(p){ctx.save();',"function drawPlayer(p){if(window.PBOT_ACTORS?.render(ctx,p,save.selected)){if(images.actors.complete)atlas(images.actors,PERKY,p.x-42,p.y-42+Math.sin(state.time*3.2)*4,34,52,{flip:p.facing<0,alpha:.88});return;}ctx.save();")
rep("function togglePause(){clearInput();if(mode==='play')mode='pause';else if(mode==='pause')mode='play'}","function togglePause(){clearInput();if(mode==='play')mode='pause';else if(mode==='pause')mode='play';window.PBOT_STORY.refresh()}")
rep("clearInput();mode='menu';$('#gameShell')","window.PBOT_STORY.hide();clearInput();mode='menu';$('#gameShell')")
rep("$('#resumeBtn').onclick=()=>{if(state){","$('#resumeBtn').onclick=()=>{if(!state&&save.storyRun){startLevel(0,true);return;}if(state){")
rep("resize();clearInput();mode='play'}};","resize();clearInput();mode='play';window.PBOT_STORY.resume()}};")
rep("$('#resumeBtn').classList.toggle('hidden',!state||state.finished);","$('#resumeBtn').classList.toggle('hidden',(!state||state.finished)&&!save.storyRun);$('#resumeBtn').textContent='ПРОДОВЖИТИ ІСТОРІЮ';if($('#playFirst'))$('#playFirst').textContent=save.storyRun?'ПРОДОВЖИТИ · 01-01':'ГРАТИ · 01-01';")
rep('persist();state=null;renderMenu()','persist();state=null;window.PBOT_STORY.hide();save.storyRun=null;persist();renderMenu()')
rep('input,update,resize,save}','input,update,resize,get save(){return save}}')
(p/'final-game.js').write_text(s)
f=p/'world01-v2.js';w=f.read_text();a=w.index('    c.save();if(p.inv>0&&Math.floor(p.inv*10)%2)');b=w.index('    const helperX=',a)
w=w[:a]+'    window.PBOT_ACTORS.render(c,p,save.selected);\n'+w[b:]
a=w.index('    // Brief helper, not a permanent box');b=w.index('\n  }',a);w=w[:a]+w[b:]
w=w.replace('    // Foot anchor is shared by idle, run, crouch and jump.','    window.PBOT_STORY?.render(c,s);\n    // Foot anchor is shared by idle, run, crouch and jump.')
f.write_text(w)
i=(p/'index.html').read_text().replace('world01-art-20260915-2','world01-story-20260915-3').replace('WORLD 01 · ART REVIEW 02','WORLD 01 · STORY & ACTORS 03')
i=i.replace('  <script src="/world01-v2.js', '  <script src="/actors-v3.js?v=world01-story-20260915-3"></script>\n  <script src="/story-core.js?v=world01-story-20260915-3"></script>\n  <script src="/story-world01.js?v=world01-story-20260915-3"></script>\n  <script src="/world01-v2.js')
i=i.replace('</head>','  <link rel="stylesheet" href="/story-world01.css?v=world01-story-20260915-3">\n</head>')
for k,emoji in [('pbot','🤖'),('hero','🧑🏻'),('vitalii','🕶️')]:
 key='pbot-idle' if k=='pbot' else 'hero'
 i=i.replace('<span>'+emoji+'</span>','<span><img src="/assets/world01-v2/'+key+'.webp" alt=""></span>')
(p/'index.html').write_text(i)
f=r/'server.js';f.write_text(f.read_text().replace('world01-art-20260915-2','world01-story-20260915-3'))
