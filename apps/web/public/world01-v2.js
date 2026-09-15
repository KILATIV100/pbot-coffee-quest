/* World 01 art-direction pass. Uses the owner's supplied raster artwork,
   not substitute icons, filter-tinted shops or floating placeholder blocks. */
(() => {
  'use strict';
  const BASE = '/assets/world01-v2/';
  const keys = ['city','perkup','charme','billboard','bench','lamp','flower-strip','tree','pink-tree','cypress','bush','curb','crate','barrier','checkpoint','bean','coin','ground','stop','planter','bridge','scaffold','news','portal','perky','hero','hero-jump','npc-shoes','npc-news','npc-coffee','drone','spam','spam-hurt','scooter'];
  const art = {}; let ready = false;
  const loading = Promise.all(keys.map(key => new Promise((resolve,reject) => {
    const im = new Image(); art[key] = im; im.decoding = 'async';
    const timeout = setTimeout(() => reject(new Error('Asset timeout: '+key)), 15000);
    im.onload = () => { clearTimeout(timeout); resolve(im); };
    im.onerror = () => { clearTimeout(timeout); reject(new Error('Asset failed: '+key)); };
    im.src = BASE + key + '.webp';
  }))).then(() => {ready=true;});
  // Record loading failures without an unhandled rejection, and expose retryable UI.
  loading.catch(error => { console.error(error.message); document.documentElement.dataset.world01Assets='error'; });

  const props = [
    ['tree',-100,437,252],['cypress',45,434,205],['lamp',59,437,205],
    ['billboard',174,437,143],['perkup',425,437,198],['npc-coffee',744,437,77],
    ['bench',785,437,62],['pink-tree',824,436,238],['stop',944,439,157],
    ['planter',866,448,42],['news',1196,436,119],['npc-news',1300,438,82],
    ['tree',1326,437,257],['lamp',1509,438,195],
    ['cypress',1863,439,186],['charme',1930,437,207],['npc-shoes',2315,438,84],
    ['planter',2342,448,46],['crate',2450,448,58],['crate',2517,448,105],
    ['scaffold',2600,448,161],['tree',2749,435,247],['barrier',2853,448,58],
    ['barrier',3079,448,53],['checkpoint',3208,448,92],
    ['pink-tree',3330,437,241],['bench',3490,437,65],['lamp',3635,438,203],
    ['perkup',3720,438,178],['bush',4050,443,53],['tree',4115,437,256],
    ['portal',4372,448,179]
  ];
  function build(base) {
    const L={...base,length:4640,beans:50,tokens:1};
    const gaps=[{x:1660,w:210},{x:2950,w:124}];
    const plats=[{x:0,y:448,w:1660,h:110},{x:1870,y:448,w:1080,h:110},{x:3074,y:448,w:1566,h:110},
      // Seats, roofs and scaffold decking are one-way collision surfaces.
      {x:785,y:407,w:125,h:12,skin:'bench'}, {x:866,y:430,w:98,h:12,skin:'planter'},
      {x:945,y:294,w:206,h:16,skin:'stop'},
      {x:1578,y:418,w:355,h:18,skin:'bridge'},
      {x:2345,y:414,w:95,h:10,skin:'planter'}, {x:2450,y:390,w:55,h:10,skin:'crate'},
      {x:2517,y:343,w:95,h:10,skin:'crate'}, {x:2607,y:297,w:148,h:14,skin:'scaffold'}];
    const beans=[];
    for(let i=0;i<38;i++){
      let x=218+i*109;
      if(x>2912&&x<3110)x=3123+(i%3)*28;
      beans.push({x,y:x>1540&&x<1940?383:410,taken:false});
    }
    [[833,391],[903,375],[952,334],[1001,257],[1052,257],[1111,257],
     [2390,376],[2480,354],[2548,307],[2630,261],[2680,261],[2730,261]]
      .forEach(([x,y])=>beans.push({x,y,taken:false}));
    const enemies=[
      {x:1260,y:388,w:47,h:60,v:35,min:1150,max:1400,hp:1,dead:false,kind:'spam'},
      {x:2170,y:388,w:47,h:60,v:-40,min:2060,max:2270,hp:1,dead:false,kind:'spam'},
      {x:2778,y:309,w:58,h:38,v:-35,min:2750,max:2890,hp:1,dead:false,kind:'drone'},
      {x:3470,y:402,w:61,h:46,v:-60,min:3330,max:3600,hp:1,dead:false,kind:'scooter'}];
    return {L,plats,gaps,haz:[],beans,tokens:[{x:2665,y:223,taken:false}],enemies,
      checkpoints:[{x:1465,hit:false},{x:3234,hit:false}],decor:props};
  }
  const rr=(c,x,y,w,h,r=8)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
  function image(c,key,x,bottom,h,{flip=false,alpha=1}={}) {
    const im=art[key];if(!im?.naturalWidth)return;
    const w=h*im.naturalWidth/im.naturalHeight;
    c.save();c.globalAlpha*=alpha;c.translate(x+(flip?w:0),bottom-h);if(flip)c.scale(-1,1);c.drawImage(im,0,0,w,h);c.restore();return w;
  }
  function shadow(c,x,y,rx,alpha=.17){c.save();c.fillStyle=`rgba(12,28,35,${alpha})`;c.beginPath();c.ellipse(x,y,rx,rx*.19,0,0,Math.PI*2);c.fill();c.restore();}
  function render({ctx:c,state:s,save,input,images,W,H}) {
    if(!ready)return;
    const cam=s.camera,t=s.time,p=s.player;
    // The background has its own depth. Do not scale a low-resolution gameplay screenshot.
    const bg=art.city, bh=429, bw=1440*bh/348, offset=-(cam*.19%bw);
    c.fillStyle='#55c4f4';c.fillRect(0,0,W,H);
    for(let x=offset-bw;x<W+bw;x+=bw)c.drawImage(bg,0,0,1440,348,x,0,bw,bh);
    // A light atmospheric layer, no global darkening or desaturation.
    let haze=c.createLinearGradient(0,140,0,433);haze.addColorStop(0,'rgba(213,247,255,0)');haze.addColorStop(1,'rgba(217,244,248,.16)');c.fillStyle=haze;c.fillRect(0,140,W,293);
    c.save();c.translate(-cam,0);
    // Canal and work-zone water are behind the cut edges of the walkway.
    for(const g of s.gaps){
      c.fillStyle='#136d87';c.fillRect(g.x,440,g.w,100);
      c.fillStyle='rgba(142,242,255,.65)';for(let j=0;j<7;j++){let xx=g.x+((j*51+t*17)%g.w);c.fillRect(xx,460+(j%3)*22,Math.min(27,g.x+g.w-xx),2);}
    }
    // Ground texture is clipped to real collision segments. No surface spans a gap.
    for(const q of s.plats.filter(q=>q.y===448)){
      if(q.x+q.w<cam-20||q.x>cam+W+20)continue;
      c.save();c.beginPath();c.rect(q.x,448,q.w,H-448);c.clip();
      const tex=art.ground;const tw=210,th=98;
      for(let x=Math.floor(Math.max(q.x,cam-220)/tw)*tw;x<Math.min(q.x+q.w,cam+W+220);x+=tw)c.drawImage(tex,x,448,tw,th);
      c.restore();
      c.fillStyle='#aaa79b';c.fillRect(q.x,430,q.w,17);c.fillStyle='#d7d3c2';c.fillRect(q.x,430,q.w,2);
      c.strokeStyle='rgba(74,75,69,.3)';c.lineWidth=.6;
      for(let x=Math.max(q.x,Math.floor(cam/48)*48);x<Math.min(q.x+q.w,cam+W+48);x+=48){c.beginPath();c.moveTo(x,431);c.lineTo(x+8,446);c.stroke();}
      c.fillStyle='#626a6c';c.fillRect(q.x,447,q.w,2);
    }
    // Midground foliage is grounded in the same city plane as the shops.
    for(let x=20;x<s.L.length;x+=420){if(x+360<cam||x>cam+W)continue;if(s.gaps.some(g=>x+310>g.x&&x<g.x+g.w))continue;image(c,'flower-strip',x,431,35);}
    for(const d of props){if(d[1]+440<cam||d[1]>cam+W+50)continue;if(d[0]==='checkpoint')continue;image(c,...d);}
    // Bridge surface matches the collision deck, with piers below the pavement.
    // Source railing/lamps begin 88px above the walkable deck.
    c.drawImage(art.bridge,1578,320,355,219);
    for(const cp of s.checkpoints){if(cp.x<cam-120||cp.x>cam+W+100)continue;shadow(c,cp.x+3,449,28);image(c,'checkpoint',cp.x-34,448,91);
      if(cp.hit){c.save();c.strokeStyle='#41e6d3';c.globalAlpha=.6;c.lineWidth=2;c.beginPath();c.ellipse(cp.x+3,447,29+Math.sin(t*3)*2,7,0,0,Math.PI*2);c.stroke();c.restore();}}
    // Distant birds are deliberately subtle and never pass in front of the HUD.
    for(let j=0;j<3;j++){const x=cam+170+j*44+Math.sin(t*.5+j)*25;c.strokeStyle='rgba(35,80,98,.45)';c.lineWidth=1.4;c.beginPath();c.moveTo(x,145+j*8);c.quadraticCurveTo(x+4,141+j*8,x+8,145+j*8);c.quadraticCurveTo(x+12,141+j*8,x+16,145+j*8);c.stroke();}
    for(const b of s.beans){if(b.taken||b.x<cam-40||b.x>cam+W+40)continue;let y=b.y+Math.sin(t*3+b.x*.03)*2;image(c,'bean',b.x-9,y+11,23);}
    for(const q of s.tokens){if(q.taken)continue;let y=q.y+Math.sin(t*2)*4;c.save();c.translate(q.x,y);c.scale(.8+Math.abs(Math.cos(t*2))*.2,1);image(c,'coin',-15,16,33);c.restore();}
    for(const e of s.enemies){if(e.dead||e.x<cam-100||e.x>cam+W+100)continue;const h=e.kind==='drone'?51:e.kind==='scooter'?60:72;const y=e.y+e.h+(e.kind==='drone'?Math.sin(t*4)*3:0);if(e.kind!=='drone')shadow(c,e.x+e.w/2,449,e.w*.45);image(c,e.kind,e.x-9,y,h,{flip:e.v<0});}
    window.PBOT_STORY?.render(c,s);
    // Foot anchor is shared by idle, run, crouch and jump.
    const foot=p.y+p.h;
    if(p.onGround)shadow(c,p.x+p.w/2,foot+2,22,.2);
    window.PBOT_ACTORS.render(c,p,save.selected);
    const helperX=p.x-48,helperY=p.y-7+Math.sin(t*3)*4;image(c,'perky',helperX,helperY,45,{flip:p.facing<0});
    if(p.pulse>4.5-Math.min(2.4,save.upgrades.pulse*.45)){
      const elapsed=(5-Math.min(2.4,save.upgrades.pulse*.45))-p.pulse;c.strokeStyle=`rgba(78,230,226,${Math.max(0,1-elapsed*2)})`;c.lineWidth=3;c.beginPath();c.arc(p.x+p.w/2,p.y+p.h/2,Math.max(0,elapsed)*330,0,Math.PI*2);c.stroke();
    }
    for(const q of s.particles){c.globalAlpha=Math.max(0,q.life/q.max);c.fillStyle=q.color;c.beginPath();c.arc(q.x,q.y,q.r*.8,0,Math.PI*2);c.fill();}c.globalAlpha=1;
    c.restore();

  }
  window.PBOT_WORLD01={get ready(){return ready},loading,build,render,art};
})();
