(() => {
  let audioCtx=null;
  let ambienceNext=0;
  let prev={beans:0,tokens:0,lives:3,checkpoint:false,finished:false,on:false,nitro:false,shoes:false};

  function ensureAudio(){
    if(!audioCtx){
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(Ctx) audioCtx=new Ctx();
    }
    if(audioCtx?.state==='suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }
  function tone(freq=440,dur=.08,type='sine',gain=.035,delay=0){
    const ac=ensureAudio();if(!ac)return;
    const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur+.02);
  }
  function sfx(kind){
    if(kind==='jump'){tone(285,.07,'triangle',.025);tone(420,.08,'sine',.018,.025);}
    else if(kind==='land') tone(92,.055,'sine',.018);
    else if(kind==='bean'){tone(620,.055,'sine',.024);tone(825,.07,'sine',.018,.035);}
    else if(kind==='token'){tone(520,.07,'triangle',.03);tone(780,.09,'sine',.026,.05);tone(1040,.11,'sine',.02,.11);}
    else if(kind==='boost'){tone(310,.07,'sawtooth',.018);tone(465,.08,'triangle',.024,.045);tone(690,.1,'sine',.02,.1);}
    else if(kind==='pulse'){tone(180,.12,'sine',.025);tone(360,.16,'triangle',.02,.035);}
    else if(kind==='hit'){tone(110,.11,'square',.024);tone(78,.14,'sawtooth',.016,.02);}
    else if(kind==='checkpoint'){tone(440,.07,'triangle',.026);tone(660,.08,'triangle',.025,.06);tone(880,.12,'sine',.02,.12);}
    else if(kind==='finish'){[392,523,659,784].forEach((f,i)=>tone(f,.18,'triangle',.03,i*.09));}
  }
  function ambientTick(){
    if(!audioCtx||mode!=='play'||!player)return;
    const roots=[110,123.47,146.83,164.81,130.81];
    const root=roots[Math.max(0,zoneIndex)]||roots[0];
    tone(root,.72,'sine',.0055);tone(root*1.5,.44,'triangle',.0034,.11);tone(root*2,.26,'sine',.0022,.3);
  }
  function haptic(pattern){try{navigator.vibrate?.(pattern)}catch{}}

  const baseReset=reset;
  reset=function(){
    baseReset();
    props=props.filter(p=>!(p.kind==='checkpoint'&&p.decor));
    ambienceNext=0;
    prev={beans:player.beans,tokens:player.tokens,lives:player.lives,checkpoint:checkpoint.on,finished:player.finished,on:player.on,nitro:nitroTime>0,shoes:shoesTime>0};
  };

  drawPlatform=function(p){
    const seg=112,n=Math.max(1,Math.ceil(p.w/seg));
    for(let i=0;i<n;i++){
      const w=Math.min(seg,p.w-i*seg);
      drawCell(images.props,PROP.barrier,p.x+i*seg,p.y,w,92,{alpha:.98});
    }
  };

  const basePulse=activatePulse;
  activatePulse=function(){
    const before=pulseTime;
    basePulse();
    if(before<=0&&pulseTime>0){sfx('pulse');haptic(12);}
  };

  const baseUpdate=update;
  update=function(dt){
    const beforeVy=player?.vy??0;
    const beforeOn=player?.on??false;
    baseUpdate(dt);
    if(!player)return;

    if(player.beans>prev.beans)sfx('bean');
    if(player.tokens>prev.tokens){sfx('token');haptic([10,25,10]);}
    if(player.lives<prev.lives){sfx('hit');haptic(45);}
    if(!prev.checkpoint&&checkpoint.on){sfx('checkpoint');haptic([15,30,15]);}
    if(!prev.finished&&player.finished){sfx('finish');haptic([20,35,20,35,45]);}
    if(!prev.nitro&&nitroTime>0)sfx('boost');
    if(!prev.shoes&&shoesTime>0)sfx('boost');
    if(!beforeOn&&player.on&&Math.abs(beforeVy)>180)sfx('land');
    if(beforeVy>=-120&&player.vy<-420)sfx('jump');

    if(audioCtx&&audioCtx.currentTime>=ambienceNext){ambientTick();ambienceNext=audioCtx.currentTime+3.25;}

    prev.beans=player.beans;prev.tokens=player.tokens;prev.lives=player.lives;prev.checkpoint=checkpoint.on;prev.finished=player.finished;prev.on=player.on;prev.nitro=nitroTime>0;prev.shoes=shoesTime>0;
  };

  document.addEventListener('pointerdown',ensureAudio,{passive:true});
  document.addEventListener('keydown',ensureAudio,{passive:true});
})();
