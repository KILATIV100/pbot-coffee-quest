// WORLD 01 / LEVEL 01 — «Місто прокидається»
// Natural-city side-scroller: the city itself is the level geometry.

backgrounds[1]='/assets/backgrounds/world01-level01.webp';
const legacyMakeLevel=makeLevel;
let invulnW1=0, speedBoostW1=0, jumpBoostW1=0, flashTextW1='', flashTW1=0;

function makeWorld01Level01(){
  const groundY=770;
  const terrain=[
    {x:0,y:groundY,w:650,h:190},{x:725,y:groundY,w:595,h:190},
    {x:1400,y:groundY,w:560,h:190},{x:2045,y:groundY,w:775,h:190}
  ];
  const props=[
    {kind:'bench',x:455,y:groundY-52,w:118,h:52,solid:true},
    {kind:'crate',brand:'PERKUP',x:875,y:groundY-58,w:62,h:58,solid:true},
    {kind:'crate',brand:'PERKUP',x:941,y:groundY-88,w:62,h:88,solid:true},
    {kind:'planter',x:1110,y:groundY-42,w:112,h:42,solid:true},
    {kind:'busStop',x:1460,y:groundY-145,w:205,h:145,roof:{x:1450,y:groundY-148,w:225,h:22}},
    {kind:'charmeBox',x:1715,y:groundY-64,w:72,h:64,solid:true},
    {kind:'charmeBox',x:1790,y:groundY-92,w:72,h:92,solid:true},
    {kind:'newsKiosk',x:2180,y:groundY-112,w:126,h:112,solid:true},
    {kind:'crate',brand:'PERKUP',x:2370,y:groundY-55,w:62,h:55,solid:true},
    {kind:'crate',brand:'CHARME',x:2435,y:groundY-84,w:70,h:84,solid:true},
    {kind:'planter',x:2520,y:groundY-43,w:118,h:43,solid:true}
  ];
  const solids=terrain.map(x=>({...x}));
  for(const p of props){
    if(p.solid)solids.push({x:p.x,y:p.y,w:p.w,h:p.h});
    if(p.roof)solids.push({...p.roof});
  }
  const beans=[
    [170,690],[245,690],[320,690],[505,650],[555,620],
    [785,690],[850,655],[915,610],[980,575],[1055,650],[1160,660],
    [1435,650],[1500,610],[1565,585],[1630,610],[1735,625],[1810,590],
    [2070,690],[2140,650],[2235,600],[2305,570],[2380,610],[2460,560],
    [2550,620],[2630,670],[2700,690]
  ].map(([x,y],i)=>({x,y,got:false,bob:i*.37}));
  const specials=[
    {kind:'news',x:355,y:620,w:30,h:30,taken:false},
    {kind:'nitro',x:995,y:540,w:30,h:34,taken:false},
    {kind:'shoe',x:1832,y:535,w:38,h:28,taken:false},
    {kind:'token',x:1580,y:545,w:28,h:28,taken:false},
    {kind:'token',x:2265,y:540,w:28,h:28,taken:false},
    {kind:'token',x:2500,y:505,w:28,h:28,taken:false}
  ];
  const enemies=[
    {kind:'spamBot',x:1190,y:groundY-38,w:42,h:38,vx:55,minX:1035,maxX:1260,alive:true},
    {kind:'scooter',x:1885,y:groundY-30,w:58,h:30,vx:-82,minX:1690,maxX:1930,alive:true},
    {kind:'spamBot',x:2320,y:groundY-38,w:42,h:38,vx:62,minX:2080,maxX:2390,alive:true}
  ];
  return {
    id:'01-01',worldId:1,name:'Місто прокидається',width:2820,height:960,groundY,
    terrain,props,solids,platforms:solids,beans,specials,enemies,hazards:[],
    checks:[{x:1510,y:groundY-55,on:false},{x:2340,y:groundY-55,on:false}],
    finish:{x:2730,y:groundY-132,w:56,h:132},spawn:{x:80,y:groundY-58}
  };
}

makeLevel=function(worldId){return worldId===1?makeWorld01Level01():legacyMakeLevel(worldId)};

resetLevel=function(){
  level=makeLevel(selectedWorld.id);lives=3;camX=0;startTime=performance.now();runT=0;
  player={x:level.spawn.x,y:level.spawn.y,w:42,h:58,standH:58,vx:0,vy:0,onGround:false,crouching:false,spawn:{...level.spawn}};
  coyote=0;jumpBuffer=0;jumpsLeft=2;jumpHeld=0;landSquash=0;jumpSquash=0;
  invulnW1=0;speedBoostW1=0;jumpBoostW1=0;flashTextW1='';flashTW1=0;updateHud();
};

const legacyUpdateHud=updateHud;
updateHud=function(){
  legacyUpdateHud();
  if(selectedWorld.id===1&&level)$('#worldLabel').textContent=`01-01 · ${level.name}`;
};

setCrouch=function(on){
  if(on&&player.onGround){player.crouching=true;player.h=34;return}
  if(!on&&player.crouching){
    const test={x:player.x,y:player.y-(player.standH-player.h),w:player.w,h:player.standH};
    const solids=level.solids||level.platforms;
    if(!solids.some(p=>rects(test,p))){player.y-=player.standH-player.h;player.h=player.standH;player.crouching=false}
  }
};

function w1Flash(msg){flashTextW1=msg;flashTW1=2.2}
function w1Special(s){
  s.taken=true;
  if(s.kind==='nitro'){jumpBoostW1=8;w1Flash('PerkUP Nitro Boost · вище стрибок!')}
  else if(s.kind==='shoe'){speedBoostW1=8;w1Flash('CHARME Speed Shoes · швидкість +25%!')}
  else if(s.kind==='news')w1Flash('Не ху#ові Бровари · секретний маршрут попереду');
  else w1Flash('Brovary Token знайдено!');
}

const legacyUpdate=update;
update=function(dt){
  if(selectedWorld.id!==1)return legacyUpdate(dt);
  if(phase!=='play')return;
  setCrouch(keys.down);
  invulnW1=Math.max(0,invulnW1-dt);speedBoostW1=Math.max(0,speedBoostW1-dt);jumpBoostW1=Math.max(0,jumpBoostW1-dt);flashTW1=Math.max(0,flashTW1-dt);
  const sm=speedBoostW1>0?1.25:1, accel=(player.crouching?1500:3100)*sm, maxSp=(player.crouching?95:250)*sm, friction=2100;
  const gravUp=1800,gravDown=2450,jumpV=jumpBoostW1>0?-820:-720,dJumpV=jumpBoostW1>0?-635:-565;
  const want=(keys.right?1:0)-(keys.left?1:0);
  if(want){player.vx+=want*accel*dt;player.vx=Math.max(-maxSp,Math.min(maxSp,player.vx))}
  else{const f=friction*dt;player.vx=Math.abs(player.vx)<=f?0:player.vx-Math.sign(player.vx)*f}
  player.vy+=(player.vy<0?gravUp:gravDown)*dt;player.vy=Math.min(player.vy,980);
  if(player.onGround){coyote=.14;jumpsLeft=2}else coyote=Math.max(0,coyote-dt);
  if(keys.jumpPressed){keys.jumpPressed=false;jumpBuffer=.12}jumpBuffer=Math.max(0,jumpBuffer-dt);
  if(jumpBuffer>0&&!player.crouching&&(coyote>0||jumpsLeft>0)){
    const grounded=coyote>0;jumpBuffer=0;if(!grounded)jumpsLeft=Math.max(0,jumpsLeft-1);else jumpsLeft=1;
    player.vy=grounded?jumpV:dJumpV;player.onGround=false;coyote=0;jumpHeld=grounded?.22:.12;jumpSquash=.12;
  }
  if(keys.jump&&jumpHeld>0&&player.vy<0){player.vy-=520*dt;jumpHeld-=dt}else jumpHeld=0;

  player.x+=player.vx*dt;player.x=Math.max(0,Math.min(level.width-player.w,player.x));
  const prevY=player.y,prevBottom=player.y+player.h;player.y+=player.vy*dt;player.onGround=false;
  for(const p of level.solids){
    if(player.vy>=0&&prevBottom<=p.y+12&&rects(player,p)){player.y=p.y-player.h;player.vy=0;player.onGround=true;landSquash=.11}
    else if(player.vy<0&&prevY>=p.y+p.h-10&&rects(player,p)){player.y=p.y+p.h;player.vy=40}
  }
  if(Math.abs(player.vx)>18&&player.onGround&&!player.crouching)runT+=dt*10;
  for(const b of level.beans){b.bob+=dt*4;if(!b.got&&rects(player,{x:b.x,y:b.y+Math.sin(b.bob)*5,w:24,h:24})){b.got=true;updateHud()}}
  for(const s of level.specials){if(!s.taken&&rects(player,s))w1Special(s)}
  for(const e of level.enemies){
    if(!e.alive)continue;e.x+=e.vx*dt;
    if(e.x<e.minX){e.x=e.minX;e.vx=Math.abs(e.vx)}if(e.x>e.maxX){e.x=e.maxX;e.vx=-Math.abs(e.vx)}
    if(rects(player,e)){
      if(player.vy>120&&prevBottom<=e.y+12){e.alive=false;player.vy=-390;w1Flash(e.kind==='scooter'?'Самокат знешкоджено':'Spam Bot вимкнено')}
      else if(invulnW1<=0){invulnW1=1.1;hurt();return}
    }
  }
  for(const c of level.checks)if(!c.on&&rects(player,{x:c.x,y:c.y,w:40,h:55})){c.on=true;player.spawn={x:c.x,y:c.y-10};w1Flash('Чекпоінт збережено')}
  if(rects(player,level.finish)){showResult(true);return}
  if(player.y>1040)hurt();
  camX+=((player.x-145)-camX)*Math.min(1,dt*5);camX=Math.max(0,Math.min(level.width-canvas.width,camX));
  landSquash=Math.max(0,landSquash-dt);jumpSquash=Math.max(0,jumpSquash-dt);
};

const legacyDrawBackground=drawBackground;
drawBackground=function(){
  if(selectedWorld.id!==1)return legacyDrawBackground();
  const bg=image(backgrounds[1]);
  if(bg.complete&&bg.naturalWidth){
    const sw=Math.min(bg.naturalWidth,bg.naturalHeight*(canvas.width/canvas.height));
    const progress=level.width>canvas.width?camX/(level.width-canvas.width):0;
    const sx=(bg.naturalWidth-sw)*progress;
    ctx.drawImage(bg,sx,0,sw,bg.naturalHeight,0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(3,10,13,.06)';ctx.fillRect(0,0,canvas.width,canvas.height);
  }else legacyDrawBackground();
};

function w1Terrain(t){
  ctx.fillStyle='#575b59';ctx.fillRect(t.x,t.y,t.w,20);ctx.fillStyle='#c8c1ad';ctx.fillRect(t.x,t.y,t.w,7);ctx.fillStyle='#3c403d';ctx.fillRect(t.x,t.y+20,t.w,t.h-20);
  ctx.strokeStyle='rgba(255,255,255,.14)';for(let x=t.x+34;x<t.x+t.w;x+=68){ctx.beginPath();ctx.moveTo(x,t.y);ctx.lineTo(x,t.y+20);ctx.stroke()}
}
function w1Prop(p){
  ctx.save();
  if(p.kind==='bench'){ctx.fillStyle='#7a4a27';ctx.fillRect(p.x,p.y+6,p.w,15);ctx.fillRect(p.x+8,p.y+26,p.w-16,10);ctx.fillStyle='#263435';ctx.fillRect(p.x+15,p.y+36,8,16);ctx.fillRect(p.x+p.w-23,p.y+36,8,16)}
  else if(p.kind==='crate'||p.kind==='charmeBox'){
    ctx.fillStyle=p.kind==='charmeBox'?'#eee1c7':'#9a642f';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.strokeStyle='#5f432b';ctx.lineWidth=4;ctx.strokeRect(p.x+2,p.y+2,p.w-4,p.h-4);
    ctx.beginPath();ctx.moveTo(p.x+5,p.y+5);ctx.lineTo(p.x+p.w-5,p.y+p.h-5);ctx.moveTo(p.x+p.w-5,p.y+5);ctx.lineTo(p.x+5,p.y+p.h-5);ctx.stroke();ctx.fillStyle='#171b1d';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText(p.brand||'CHARME',p.x+p.w/2,p.y+p.h/2+4)
  }else if(p.kind==='planter'){
    ctx.fillStyle='#89735c';ctx.fillRect(p.x,p.y+13,p.w,p.h-13);ctx.fillStyle='#2f7a49';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(p.x+12+i*15,p.y+12-(i%2)*7,12,0,Math.PI*2);ctx.fill()}
  }else if(p.kind==='busStop'){
    ctx.fillStyle='rgba(130,210,220,.18)';ctx.fillRect(p.x+12,p.y+20,p.w-24,p.h-20);ctx.strokeStyle='#273f45';ctx.lineWidth=7;ctx.strokeRect(p.x+12,p.y+20,p.w-24,p.h-20);ctx.fillStyle='#1f3438';ctx.fillRect(p.x-10,p.y-3,p.w+20,22);ctx.fillStyle='#d4c7a2';ctx.fillRect(p.x+38,p.y+92,120,12)
  }else if(p.kind==='newsKiosk'){
    ctx.fillStyle='#182024';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#0b5ea8';ctx.fillRect(p.x+8,p.y+10,p.w-16,54);ctx.fillStyle='#ffe72e';ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillText('БРОВАРИ',p.x+p.w/2,p.y+43);ctx.fillStyle='#d44343';ctx.fillRect(p.x+10,p.y+76,p.w-20,7)
  }ctx.restore();
}
function w1Enemy(e){
  if(!e.alive)return;ctx.save();ctx.translate(e.x,e.y);
  if(e.kind==='spamBot'){ctx.fillStyle='#313a40';ctx.fillRect(3,7,e.w-6,e.h-9);ctx.fillStyle='#44d9ff';ctx.fillRect(10,13,e.w-20,8);ctx.fillStyle='#15191c';ctx.beginPath();ctx.arc(10,e.h-2,7,0,Math.PI*2);ctx.arc(e.w-10,e.h-2,7,0,Math.PI*2);ctx.fill()}
  else{ctx.fillStyle='#222';ctx.fillRect(6,16,38,7);ctx.strokeStyle='#222';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(40,18);ctx.lineTo(46,2);ctx.stroke();ctx.beginPath();ctx.arc(10,26,7,0,Math.PI*2);ctx.arc(45,26,7,0,Math.PI*2);ctx.stroke()}ctx.restore();
}
function w1SpecialDraw(s){
  if(s.taken)return;ctx.save();ctx.translate(s.x+s.w/2,s.y+s.h/2);const pulse=1+Math.sin(performance.now()/180)*.08;ctx.scale(pulse,pulse);
  if(s.kind==='nitro'){ctx.fillStyle='#f3ead8';ctx.fillRect(-9,-14,18,27);ctx.fillStyle='#111';ctx.font='700 7px system-ui';ctx.textAlign='center';ctx.fillText('UP',0,3)}
  else if(s.kind==='shoe'){ctx.fillStyle='#f1dfb7';ctx.beginPath();ctx.moveTo(-17,4);ctx.lineTo(2,-6);ctx.lineTo(17,4);ctx.lineTo(13,10);ctx.lineTo(-15,10);ctx.closePath();ctx.fill()}
  else if(s.kind==='news'){ctx.fillStyle='#0b5ea8';ctx.fillRect(-13,-13,26,26);ctx.fillStyle='#ffe72e';ctx.fillRect(-9,5,18,3)}
  else{ctx.fillStyle='#44d9ff';ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:13;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}ctx.restore();
}

const legacyDraw=draw;
draw=function(){
  if(selectedWorld.id!==1)return legacyDraw();
  if(phase!=='play')return;ctx.clearRect(0,0,canvas.width,canvas.height);drawBackground();ctx.save();ctx.translate(-camX,0);
  for(const t of level.terrain)w1Terrain(t);for(const p of level.props)w1Prop(p);
  for(const b of level.beans){if(b.got)continue;const y=b.y+Math.sin(b.bob)*5;ctx.fillStyle='#d59b48';ctx.beginPath();ctx.ellipse(b.x+12,y+12,9,12,.4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6f4321';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x+11,y+3);ctx.quadraticCurveTo(b.x+14,y+12,b.x+10,y+21);ctx.stroke()}
  for(const s of level.specials)w1SpecialDraw(s);for(const e of level.enemies)w1Enemy(e);
  for(const c of level.checks){ctx.strokeStyle=c.on?'#4ee2d3':'#405158';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(c.x,c.y+55);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.fillStyle=c.on?'#4ee2d3':'#405158';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(c.x+34,c.y+12);ctx.lineTo(c.x,c.y+23);ctx.closePath();ctx.fill()}
  const f=level.finish;ctx.strokeStyle='#44d9ff';ctx.lineWidth=7;ctx.beginPath();ctx.arc(f.x+f.w/2,f.y+45,30,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(68,217,255,.16)';ctx.fillRect(f.x,f.y+35,f.w,f.h-35);ctx.fillStyle='#fff';ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillText('РОЗВИЛКА',f.x+f.w/2,f.y+100);
  const fr=currentFrame(),spr=fr.img,[fx,fy,fw,fh]=fr.rect,dh=player.crouching?72:104,dw=dh*(fw/fh);let sx=1,sy=1;if(landSquash>0){sx=1.08;sy=.92}if(jumpSquash>0){sx=.93;sy=1.07}
  ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h);ctx.scale(sx,sy);if(player.vx<0)ctx.scale(-1,1);if(invulnW1>0&&Math.floor(invulnW1*12)%2)ctx.globalAlpha=.4;if(spr.complete&&spr.naturalWidth)ctx.drawImage(spr,fx,fy,fw,fh,-dw/2,-dh,dw,dh);ctx.restore();ctx.restore();
  if(speedBoostW1>0||jumpBoostW1>0){ctx.fillStyle='rgba(7,16,21,.78)';ctx.fillRect(12,70,150,32);ctx.fillStyle='#fff';ctx.font='700 12px system-ui';ctx.fillText(speedBoostW1>0?`👟 CHARME ${Math.ceil(speedBoostW1)}s`:`☕ NITRO ${Math.ceil(jumpBoostW1)}s`,24,91)}
  if(flashTW1>0){ctx.fillStyle='rgba(7,16,21,.84)';ctx.fillRect(45,118,450,42);ctx.fillStyle='#fff';ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText(flashTextW1,270,144)}
};
