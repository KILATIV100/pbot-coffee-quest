(() => {
  const VISUAL_BUILD='rc2-02-02';
  const CITY_PATH=`/assets/stage2/rc2/city-atlas.svg?v=${VISUAL_BUILD}`;
  const CITY={
    platformPark:[12,84,232,90],
    platformLake:[268,84,232,90],
    platformCity:[524,84,232,90],
    platformCharme:[780,84,232,90],
    tree:[0,192,256,192],bench:[256,192,256,192],busstop:[512,192,256,192],sign:[768,192,256,192],
    reeds:[0,384,256,192],tower:[256,384,256,192],pylon:[512,384,256,192],lamp:[768,384,256,192],
    rack:[0,576,256,192],fountain:[256,576,256,192],industrial:[512,576,256,192],monument:[768,576,256,192]
  };
  let cityReady=false;
  let cityProps=[];

  function loadCity(){
    const im=new Image();
    im.onload=()=>{
      if(im.naturalWidth!==1024||im.naturalHeight!==768){console.error('RC2.2 city atlas size mismatch',im.naturalWidth,im.naturalHeight);return;}
      images.city=im;cityReady=true;
      document.documentElement.dataset.rc22='ready';
    };
    im.onerror=()=>console.error('RC2.2 city atlas failed',CITY_PATH);
    im.decoding='async';im.src=CITY_PATH;
  }
  loadCity();

  ZONES[0].hint='Дворова лінія · зелені платформи';
  ZONES[1].hint='Озеро · парк · вертикальний маршрут';
  ZONES[2].name='ЦЕНТР БРОВАРІВ';ZONES[2].hint='Зупинка · міський вузол';
  ZONES[3].hint='CHARME · індустріальний ритм';
  ZONES[4].hint='Розвилка · фінальний трафік';

  function platformSkinFor(x){
    if(x<1050)return 'platformPark';
    if(x<2200)return 'platformLake';
    if(x<3500)return 'platformCity';
    if(x<4900)return 'platformCharme';
    return x<5550?'platformCity':'platformCharme';
  }
  function prop(kind,x,bottom,dw,dh,layer='back',alpha=1,flip=false){return {kind,x,y:bottom-dh,dw,dh,layer,alpha,flip};}

  const baseReset=reset;
  reset=function(){
    baseReset();
    for(const p of platforms)p.skin=platformSkinFor(p.x);
    cityProps=[
      prop('tower',70,GROUND,210,158,'back',.62),prop('tree',410,GROUND,168,126,'back',.92),prop('bench',540,GROUND,150,112,'front',.9),
      prop('tree',930,GROUND,162,122,'back',.86),prop('reeds',1070,GROUND+2,188,141,'back',.82),prop('busstop',1215,GROUND,190,143,'front',.96),
      prop('tree',1810,GROUND,165,124,'back',.88),prop('reeds',1940,GROUND+2,210,158,'back',.8),prop('lamp',2120,GROUND,135,101,'front',.9),
      prop('pylon',2240,GROUND,180,135,'back',.92),prop('busstop',2600,GROUND,186,140,'front',.96),prop('lamp',3030,GROUND,132,99,'front',.9),
      prop('fountain',3260,GROUND+2,184,138,'back',.86),prop('sign',3460,GROUND,150,112,'front',.92),
      prop('industrial',3600,GROUND,230,172,'back',.7),prop('rack',3900,GROUND,164,123,'front',.92),prop('lamp',4170,GROUND,136,102,'front',.9),
      prop('industrial',4510,GROUND,220,165,'back',.72),prop('monument',4760,GROUND,158,119,'back',.88),
      prop('sign',4935,GROUND,162,122,'front',.92),prop('pylon',5330,GROUND,180,135,'back',.88),prop('rack',5620,GROUND,160,120,'front',.9),
      prop('monument',5760,GROUND,170,128,'back',.9),prop('lamp',6030,GROUND,132,99,'front',.9)
    ];
    updateRouteProgress();
  };

  function drawCityProp(p){
    if(!cityReady||!images.city)return;
    drawCell(images.city,CITY[p.kind],p.x,p.y,p.dw,p.dh,{alpha:p.alpha,flip:p.flip});
  }
  function drawCityLayer(layer){for(const p of cityProps)if(p.layer===layer)drawCityProp(p);}

  drawPlatform=function(p){
    if(!cityReady||!images.city){
      const seg=112,n=Math.max(1,Math.ceil(p.w/seg));
      for(let i=0;i<n;i++){const w=Math.min(seg,p.w-i*seg);drawCell(images.props,PROP.barrier,p.x+i*seg,p.y,w,p.h+20,{alpha:.98});}
      return;
    }
    const src=CITY[p.skin||platformSkinFor(p.x)],seg=178,n=Math.max(1,Math.ceil(p.w/seg));
    for(let i=0;i<n;i++){
      const w=Math.min(seg,p.w-i*seg);
      drawCell(images.city,src,p.x+i*seg,p.y-4,w,p.h+8,{alpha:.99});
    }
  };

  const baseWorldProps=drawWorldProps;
  drawWorldProps=function(){drawCityLayer('back');baseWorldProps();drawCityLayer('front');};

  function currentPbotFrame(){
    if(player.state==='crouch')return 'crouch';
    if(player.state==='jump')return 'jump';
    if(player.state==='run')return 'run'+(1+(Math.floor(runClock)%5));
    return 'idle';
  }
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function(){
    if(player&&Math.abs(player.vx)>205&&!player.crouching){
      const key=currentPbotFrame(),h=104,w=104,dir=player.facing||1;
      const baseX=player.x+player.w/2-w/2,baseY=player.y+player.h-h;
      drawCell(images.pbot,P[key],baseX-dir*28,baseY,w,h,{flip:dir<0,alpha:nitroTime>0?.16:.09,glow:nitroTime>0});
      if(nitroTime>0||shoesTime>0)drawCell(images.pbot,P[key],baseX-dir*52,baseY+2,w,h,{flip:dir<0,alpha:.07,glow:nitroTime>0});
    }
    baseDrawPlayer();
  };

  const baseDrawEnemies=drawEnemies;
  drawEnemies=function(){
    const c=view();
    for(const e of enemies){
      if(!e.alive)continue;
      const sx=e.x+e.w/2-c.x,sy=e.y+e.h/2-c.y;
      ctx.save();
      if(e.kind==='spam'&&e.tele>0){
        ctx.globalAlpha=.35+.35*Math.sin(performance.now()/45);ctx.strokeStyle='#ff5964';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,38+e.tele*22,0,Math.PI*2);ctx.stroke();
      } else if(e.kind==='scooter'&&Math.abs(player.x-e.x)<360){
        ctx.globalAlpha=.22;ctx.strokeStyle='#f4cf57';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(sx-(e.v>0?55:-55),sy+22);ctx.lineTo(sx-(e.v>0?125:-125),sy+22);ctx.stroke();
      } else if(e.kind==='drone'&&Math.abs(player.x-e.x)<260){
        ctx.globalAlpha=.28;ctx.strokeStyle='#ff6b76';ctx.lineWidth=2;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(sx,sy+18);ctx.lineTo(player.x+player.w/2-c.x,player.y+player.h/2-c.y);ctx.stroke();
      }
      ctx.restore();
    }
    baseDrawEnemies();
  };

  function updateRouteProgress(){
    const fill=document.getElementById('routeProgressFill'),label=document.getElementById('routeProgressLabel');
    if(!fill||!label||!player)return;
    const p=clamp(player.x/(WORLD-player.w),0,1),pct=Math.round(p*100);
    fill.style.transform=`scaleX(${p})`;label.textContent=`${pct}%`;
  }
  const baseUpdate=update;
  update=function(dt){baseUpdate(dt);if(player)updateRouteProgress();};
})();
