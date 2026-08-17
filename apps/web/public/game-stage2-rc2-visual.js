(() => {
  const VISUAL_BUILD='rc2-04-02';
  const CITY_PATH=`/assets/stage2/rc2/city-atlas.svg?v=${VISUAL_BUILD}`;
  const CITY={
    platformPark:[12,84,232,90],platformLake:[268,84,232,90],platformCity:[524,84,232,90],platformCharme:[780,84,232,90],
    tree:[0,192,256,192],bench:[256,192,256,192],busstop:[512,192,256,192],sign:[768,192,256,192],
    reeds:[0,384,256,192],tower:[256,384,256,192],pylon:[512,384,256,192],lamp:[768,384,256,192],
    rack:[0,576,256,192],fountain:[256,576,256,192],industrial:[512,576,256,192],monument:[768,576,256,192]
  };
  let cityReady=false;
  let cityProps=[];

  function loadCity(){
    const im=new Image();
    im.onload=()=>{if(im.naturalWidth!==1024||im.naturalHeight!==768){console.error('RC2.4G city atlas size mismatch');return;}images.city=im;cityReady=true;document.documentElement.dataset.visualBuild=VISUAL_BUILD;};
    im.onerror=()=>console.error('RC2.4G city atlas failed',CITY_PATH);
    im.decoding='async';im.src=CITY_PATH;
  }
  loadCity();

  ZONES[0].hint='Двори · зелений маршрут';
  ZONES[1].hint='Приозерний · вертикаль';
  ZONES[2].name='ЦЕНТР БРОВАРІВ';ZONES[2].hint='Міський вузол';
  ZONES[3].hint='CHARME · швидкість';
  ZONES[4].hint='Розвилка · фінал';

  function platformSkinFor(x){if(x<1050)return 'platformPark';if(x<2200)return 'platformLake';if(x<3500)return 'platformCity';if(x<4900)return 'platformCharme';return x<5550?'platformCity':'platformCharme';}
  function prop(kind,x,bottom,dw,dh,layer='back',alpha=1,flip=false){return {kind,x,y:bottom-dh,dw,dh,layer,alpha,flip};}

  const baseReset=reset;
  reset=function(){
    baseReset();
    for(const p of platforms)p.skin=platformSkinFor(p.x);
    // Curated sector compositions: fewer objects, clearer pauses, one hero cluster at a time.
    cityProps=[
      prop('tower',90,GROUND,148,111,'back',.34),
      prop('tree',420,GROUND,146,110,'back',.72),
      prop('bench',555,GROUND,118,88,'front',.78),

      prop('reeds',1090,GROUND+2,155,116,'back',.62),
      prop('busstop',1275,GROUND,148,111,'front',.82),
      prop('tree',1840,GROUND,142,106,'back',.68),
      prop('lamp',2100,GROUND,104,78,'front',.72),

      prop('pylon',2290,GROUND,138,103,'back',.68),
      prop('busstop',2675,GROUND,145,109,'front',.82),
      prop('fountain',3240,GROUND+2,142,106,'back',.7),

      prop('rack',3990,GROUND,118,88,'front',.76),
      prop('lamp',4270,GROUND,102,76,'front',.7),
      prop('industrial',4550,GROUND,168,126,'back',.5),
      prop('monument',4770,GROUND,124,93,'back',.66),

      prop('sign',5070,GROUND,122,91,'front',.72),
      prop('pylon',5440,GROUND,142,106,'back',.62),
      prop('rack',5700,GROUND,116,87,'front',.72),
      prop('lamp',6030,GROUND,100,75,'front',.68)
    ];
    updateRouteProgress();
  };

  function drawCityProp(p){if(!cityReady||!images.city)return;drawCell(images.city,CITY[p.kind],p.x,p.y,p.dw,p.dh,{alpha:p.alpha,flip:p.flip});}
  function drawCityLayer(layer){for(const p of cityProps)if(p.layer===layer)drawCityProp(p);}

  // Kept as fallback; RC2.4 world layer replaces gameplay platforms when ready.
  drawPlatform=function(p){
    if(!cityReady||!images.city){const seg=112,n=Math.max(1,Math.ceil(p.w/seg));for(let i=0;i<n;i++){const w=Math.min(seg,p.w-i*seg);drawCell(images.props,PROP.barrier,p.x+i*seg,p.y,w,p.h+20,{alpha:.55});}return;}
    const src=CITY[p.skin||platformSkinFor(p.x)],seg=178,n=Math.max(1,Math.ceil(p.w/seg));
    for(let i=0;i<n;i++){const w=Math.min(seg,p.w-i*seg);drawCell(images.city,src,p.x+i*seg,p.y-4,w,p.h+8,{alpha:.9});}
  };

  const baseWorldProps=drawWorldProps;
  drawWorldProps=function(){drawCityLayer('back');baseWorldProps();drawCityLayer('front');};

  function currentPbotFrame(){if(player.state==='crouch')return 'crouch';if(player.state==='jump')return 'jump';if(player.state==='run')return 'run'+(1+(Math.floor(runClock)%5));return 'idle';}
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function(){
    if(player&&Math.abs(player.vx)>205&&!player.crouching){
      const key=currentPbotFrame(),h=104,w=104,dir=player.facing||1,baseX=player.x+player.w/2-w/2,baseY=player.y+player.h-h;
      drawCell(images.pbot,P[key],baseX-dir*28,baseY,w,h,{flip:dir<0,alpha:nitroTime>0?.14:.07,glow:nitroTime>0});
      if(nitroTime>0||shoesTime>0)drawCell(images.pbot,P[key],baseX-dir*48,baseY+2,w,h,{flip:dir<0,alpha:.05,glow:nitroTime>0});
    }
    baseDrawPlayer();
  };

  const baseDrawEnemies=drawEnemies;
  drawEnemies=function(){
    const c=view();
    for(const e of enemies){
      if(!e.alive)continue;const sx=e.x+e.w/2-c.x,sy=e.y+e.h/2-c.y;ctx.save();
      if(e.kind==='spam'&&e.tele>0){ctx.globalAlpha=.28+.28*Math.sin(performance.now()/45);ctx.strokeStyle='#ff5964';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,34+e.tele*18,0,Math.PI*2);ctx.stroke();}
      else if(e.kind==='scooter'&&Math.abs(player.x-e.x)<360){ctx.globalAlpha=.18;ctx.strokeStyle='#f4cf57';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx-(e.v>0?48:-48),sy+22);ctx.lineTo(sx-(e.v>0?110:-110),sy+22);ctx.stroke();}
      else if(e.kind==='drone'&&Math.abs(player.x-e.x)<260){ctx.globalAlpha=.22;ctx.strokeStyle='#ff6b76';ctx.lineWidth=2;ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(sx,sy+18);ctx.lineTo(player.x+player.w/2-c.x,player.y+player.h/2-c.y);ctx.stroke();}
      ctx.restore();
    }
    baseDrawEnemies();
  };

  function updateRouteProgress(){const fill=document.getElementById('routeProgressFill'),label=document.getElementById('routeProgressLabel');if(!fill||!player)return;const p=clamp(player.x/(WORLD-player.w),0,1);fill.style.transform=`scaleX(${p})`;if(label)label.textContent='';}
  const baseUpdate=update;
  update=function(dt){baseUpdate(dt);if(player)updateRouteProgress();};
})();
