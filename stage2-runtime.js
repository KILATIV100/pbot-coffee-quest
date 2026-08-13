// Stage 2 / WORLD 01 production runtime — Z0 + Z1 vertical slice.
// Landscape-first 960×540, natural city geometry, modular atlases.
(() => {
  const S2 = {
    activeWorld: 1,
    base: './assets/stage2/',
    envAtlas: './assets/stage2/atlases/environment-atlas.webp',
    gameplayAtlas: './assets/stage2/atlases/gameplay-atlas.webp',
    enemyAtlas: './assets/stage2/atlases/enemy-atlas.webp',
    bg: './assets/stage2/world01/z0-z1-panorama.webp',
    perkySheet: './assets/stage2/characters/perky/sheet.webp',
    flash: '', flashT: 0, nitroT: 0, invulnT: 0,
    rects: {
      env: {
        sidewalkLong:[22,43,401,105], railing:[982,59,165,98], bench:[35,213,244,147],
        planter:[317,212,186,153], streetlight:[555,178,102,202], busStop:[672,180,310,210],
        perkupKiosk:[994,174,292,217], newsBoard:[1330,188,238,206], stairsUp:[484,392,173,179]
      },
      gameplay: {
        coffeeBean:[70,85,160,170], perkupNitro:[595,55,155,200], waterEdge:[40,630,235,160]
      },
      enemy: { spamIdle:[115,18,390,207], spamAttack:[505,15,590,210], spamDefeated:[1110,15,475,210] }
    }
  };

  canvas.width = 960;
  canvas.height = 540;
  document.documentElement.classList.add('stage2-landscape');

  if (characters.length > 1) characters.splice(1);
  selectedCharacter = characters[0];
  Object.assign(characters[0], {
    preview:'./assets/stage2/characters/pbot/idle.webp',
    sheet:'./assets/stage2/characters/pbot/sheet.webp',
    runFrames:6,
    frames:{
      idle:[0,0,256,320],
      'run-1':[256,0,256,320], 'run-2':[512,0,256,320], 'run-3':[768,0,256,320],
      'run-4':[1024,0,256,320], 'run-5':[1280,0,256,320], 'run-6':[1536,0,256,320],
      jump:[1792,0,256,320]
    }
  });
  backgrounds[1] = S2.bg;
  [characters[0].preview, characters[0].sheet, S2.envAtlas, S2.gameplayAtlas, S2.enemyAtlas, S2.bg, S2.perkySheet].forEach(image);

  const legacyMakeLevel = makeLevel;
  const legacyReset = resetLevel;
  const legacyUpdateHud = updateHud;
  const legacyUpdate = update;
  const legacyDrawBackground = drawBackground;
  const legacyDraw = draw;

  function flash(msg){ S2.flash=msg; S2.flashT=2.4; }

  function stage2Level(){
    const groundY=432;
    const solids=[
      {x:0,y:groundY,w:1320,h:108},
      {x:1420,y:groundY,w:480,h:108},
      {x:330,y:groundY-48,w:150,h:48},
      {x:575,y:groundY-48,w:126,h:48},
      {x:920,y:groundY-142,w:235,h:18,oneWay:true},
      {x:1615,y:groundY-114,w:255,h:18,oneWay:true}
    ];
    const props=[
      {asset:'bench',x:330,y:groundY,w:150,h:84},
      {asset:'planter',x:575,y:groundY,w:126,h:96},
      {asset:'streetlight',x:735,y:groundY,w:64,h:153},
      {asset:'perkupKiosk',x:900,y:groundY,w:255,h:191},
      {asset:'railing',x:1185,y:groundY,w:145,h:86},
      {asset:'busStop',x:1600,y:groundY,w:280,h:190}
    ];
    const beans=[
      [150,365],[245,350],[405,328],[520,360],[650,330],[800,350],
      [970,260],[1055,255],[1160,330],[1260,355],[1368,330],[1490,355],[1640,290],[1740,275],[1810,325]
    ].map(([x,y],i)=>({x,y,w:28,h:28,got:false,bob:i*.41}));
    const specials=[{kind:'nitro',x:1120,y:270,w:40,h:56,taken:false}];
    const enemies=[{kind:'spamBot',x:1515,y:groundY-54,w:66,h:54,vx:44,minX:1480,maxX:1740,alive:true,attackT:0}];
    return {
      id:'01-01-z0-z1',worldId:1,name:'Місто прокидається · Z0–Z1',width:1900,height:540,groundY,
      solids,platforms:solids,props,beans,specials,enemies,hazards:[],checks:[],
      finish:{x:1842,y:groundY-92,w:46,h:92},spawn:{x:90,y:groundY-60},stage2Slice:true
    };
  }

  makeLevel=function(worldId){ return worldId===1 ? stage2Level() : legacyMakeLevel(worldId); };

  resetLevel=function(){
    if(selectedWorld.id!==1) return legacyReset();
    level=makeLevel(1); lives=3; camX=0; startTime=performance.now(); runT=0;
    player={x:level.spawn.x,y:level.spawn.y,w:42,h:60,standH:60,vx:0,vy:0,onGround:false,crouching:false,spawn:{...level.spawn}};
    coyote=0;jumpBuffer=0;jumpsLeft=2;jumpHeld=0;landSquash=0;jumpSquash=0;
    S2.flash='PERKY: Рухайся вперед. Місто прокидається.'; S2.flashT=3.5; S2.nitroT=0; S2.invulnT=0;
    updateHud();
  };

  updateHud=function(){
    legacyUpdateHud();
    if(selectedWorld.id===1 && level) $('#worldLabel').textContent='01-01 · Місто прокидається · Z0–Z1';
  };

  function collideVertical(prevY){
    player.onGround=false;
    for(const s of level.solids){
      if(s.oneWay && player.vy<0) continue;
      if(player.vy>=0 && prevY+player.h<=s.y+12 && rects(player,s)){
        player.y=s.y-player.h; player.vy=0; player.onGround=true; landSquash=.09;
      } else if(!s.oneWay && player.vy<0 && prevY>=s.y+s.h-8 && rects(player,s)){
        player.y=s.y+s.h; player.vy=30;
      }
    }
  }

  update=function(dt){
    if(selectedWorld.id!==1) return legacyUpdate(dt);
    if(phase!=='play') return;
    S2.flashT=Math.max(0,S2.flashT-dt); S2.nitroT=Math.max(0,S2.nitroT-dt); S2.invulnT=Math.max(0,S2.invulnT-dt);
    const accel=3200, maxSp=S2.nitroT>0?335:275, friction=2200;
    const gravUp=1750, gravDown=2300, jumpV=S2.nitroT>0?-690:-620, dJumpV=S2.nitroT>0?-585:-525;
    const want=(keys.right?1:0)-(keys.left?1:0);
    if(want){ player.vx+=want*accel*dt; player.vx=Math.max(-maxSp,Math.min(maxSp,player.vx)); }
    else { const f=friction*dt; player.vx=Math.abs(player.vx)<=f?0:player.vx-Math.sign(player.vx)*f; }
    player.vy+=(player.vy<0?gravUp:gravDown)*dt; player.vy=Math.min(player.vy,900);
    if(player.onGround){coyote=.14;jumpsLeft=2}else coyote=Math.max(0,coyote-dt);
    if(keys.jumpPressed){keys.jumpPressed=false;jumpBuffer=.12} jumpBuffer=Math.max(0,jumpBuffer-dt);
    if(jumpBuffer>0&&(coyote>0||jumpsLeft>0)){
      const grounded=coyote>0; jumpBuffer=0;
      if(!grounded) jumpsLeft=Math.max(0,jumpsLeft-1); else jumpsLeft=1;
      player.vy=grounded?jumpV:dJumpV; player.onGround=false;coyote=0;jumpHeld=grounded?.2:.1;jumpSquash=.1;
    }
    if(keys.jump&&jumpHeld>0&&player.vy<0){player.vy-=430*dt;jumpHeld-=dt}else jumpHeld=0;

    player.x+=player.vx*dt; player.x=Math.max(0,Math.min(level.width-player.w,player.x));
    const prevY=player.y, prevBottom=player.y+player.h; player.y+=player.vy*dt; collideVertical(prevY);
    if(Math.abs(player.vx)>18&&player.onGround) runT+=dt*10;

    for(const b of level.beans){
      b.bob+=dt*4;
      const by=b.y+Math.sin(b.bob)*4;
      if(!b.got&&rects(player,{x:b.x,y:by,w:b.w,h:b.h})){ b.got=true; updateHud(); }
    }
    for(const s of level.specials){
      if(!s.taken&&rects(player,s)){ s.taken=true; S2.nitroT=8; flash('PerkUp Nitro · стрибок і швидкість посилено'); }
    }
    for(const e of level.enemies){
      if(!e.alive) continue;
      e.x+=e.vx*dt; e.attackT+=dt;
      if(e.x<e.minX){e.x=e.minX;e.vx=Math.abs(e.vx)} if(e.x>e.maxX){e.x=e.maxX;e.vx=-Math.abs(e.vx)}
      if(rects(player,e)){
        if(player.vy>100 && prevBottom<=e.y+14){ e.alive=false; player.vy=-360; flash('Spam Bot вимкнено'); }
        else if(S2.invulnT<=0){ S2.invulnT=1.1; hurt(); return; }
      }
    }
    if(rects(player,level.finish)){ showResult(true); return; }
    if(player.y>560){ hurt(); return; }
    const look=Math.max(-50,Math.min(70,player.vx*.18));
    const target=player.x-canvas.width*.35+look;
    camX+=(target-camX)*Math.min(1,dt*5.5); camX=Math.max(0,Math.min(level.width-canvas.width,camX));
    landSquash=Math.max(0,landSquash-dt);jumpSquash=Math.max(0,jumpSquash-dt);
  };

  function atlasDraw(atlasPath, rect, x,y,w,h, flip=false){
    const a=image(atlasPath); if(!a.complete||!a.naturalWidth)return;
    const [sx,sy,sw,sh]=rect;
    ctx.save();
    if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(a,sx,sy,sw,sh,0,0,w,h)}
    else ctx.drawImage(a,sx,sy,sw,sh,x,y,w,h);
    ctx.restore();
  }
  function env(name,x,y,w,h){ atlasDraw(S2.envAtlas,S2.rects.env[name],x,y,w,h); }
  function gameplay(name,x,y,w,h){ atlasDraw(S2.gameplayAtlas,S2.rects.gameplay[name],x,y,w,h); }

  drawBackground=function(){
    if(selectedWorld.id!==1) return legacyDrawBackground();
    const bg=image(S2.bg);
    if(bg.complete&&bg.naturalWidth){
      const ratio=canvas.width/canvas.height, sw=Math.min(bg.naturalWidth,bg.naturalHeight*ratio);
      const progress=(level&&level.width>canvas.width)?camX/(level.width-canvas.width):0;
      const sx=(bg.naturalWidth-sw)*progress;
      ctx.drawImage(bg,sx,0,sw,bg.naturalHeight,0,0,canvas.width,canvas.height);
      const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,'rgba(0,20,35,.02)');g.addColorStop(1,'rgba(0,15,25,.16)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    } else legacyDrawBackground();
  };

  draw=function(){
    if(selectedWorld.id!==1) return legacyDraw();
    if(phase!=='play')return;
    ctx.clearRect(0,0,canvas.width,canvas.height); drawBackground();
    ctx.save(); ctx.translate(-camX,0);

    for(let x=0;x<1320;x+=300) env('sidewalkLong',x,410,310,81);
    for(let x=1420;x<1900;x+=300) env('sidewalkLong',x,410,310,81);
    gameplay('waterEdge',1300,398,145,98);

    for(const p of level.props){
      const top=p.y-p.h;
      env(p.asset,p.x,top,p.w,p.h);
    }

    for(const b of level.beans){
      if(b.got)continue; const by=b.y+Math.sin(b.bob)*4; gameplay('coffeeBean',b.x,by,28,30);
    }
    for(const s of level.specials){ if(!s.taken) gameplay('perkupNitro',s.x,s.y,40,54); }

    for(const e of level.enemies){
      if(!e.alive)continue;
      const state=(Math.sin(e.attackT*2.1)>.86)?'spamAttack':'spamIdle';
      const rr=S2.rects.enemy[state];
      atlasDraw(S2.enemyAtlas,rr,e.x-18,e.y-26,104,70,e.vx<0);
    }

    ctx.save();ctx.translate(level.finish.x,level.finish.y);ctx.strokeStyle='#55e7df';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,88);ctx.lineTo(0,5);ctx.stroke();ctx.fillStyle='rgba(5,20,30,.86)';ctx.fillRect(-92,-10,125,36);ctx.fillStyle='#fff';ctx.font='800 14px system-ui';ctx.fillText('Z2  →',-72,13);ctx.restore();

    if(player.x<1220){
      const ps=image(S2.perkySheet), idx=player.x>850?2:0;
      if(ps.complete&&ps.naturalWidth){
        const px=player.x-55, py=Math.max(185,player.y-78+Math.sin(performance.now()/350)*5);
        ctx.drawImage(ps,idx*256,0,256,280,px,py,58,64);
      }
    }

    const frame=currentFrame(), spr=frame.img, [fx,fy,fw,fh]=frame.rect;
    const drawH=112, drawW=drawH*(fw/fh);
    let sx=1,sy=1;if(landSquash>0){sx=1.06;sy=.94}if(jumpSquash>0){sx=.95;sy=1.05}
    ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h);ctx.scale(sx,sy);if(player.vx<0)ctx.scale(-1,1);
    if(spr.complete&&spr.naturalWidth)ctx.drawImage(spr,fx,fy,fw,fh,-drawW/2,-drawH,drawW,drawH);
    ctx.restore();
    ctx.restore();

    if(S2.flashT>0){
      const alpha=Math.min(1,S2.flashT*1.6);ctx.save();ctx.globalAlpha=alpha;ctx.font='800 16px system-ui';
      const m=ctx.measureText(S2.flash).width, w=Math.min(canvas.width-80,m+42), x=(canvas.width-w)/2;
      ctx.fillStyle='rgba(5,15,22,.82)';ctx.beginPath();ctx.roundRect(x,canvas.height-104,w,42,15);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(S2.flash,canvas.width/2,canvas.height-77);ctx.restore();
    }
  };

  try{ renderMenu(); }catch{}
})();
