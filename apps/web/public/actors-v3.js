/* Sprite repair from intact, already shipped owner references. Build clean
   frames once at load; render only fixed-anchor canvases, never chroma-key a
   moving character or shrink the whole head when crouching. */
(() => {
 'use strict';
 const defs={pbot:{run:[1,2,3,4,5,2],idle:[0],jump:[7],fall:[7],crouch:[6],hurt:[0],finish:[7]},hero:{run:[1,2,3,4,5,6,7,8],idle:[0],jump:[9],fall:[9],crouch:[9],hurt:[0],finish:[0]},vitalii:{run:[1,2,3,4,5,6,7,8],idle:[0],jump:[9],fall:[9],crouch:[9],hurt:[0],finish:[0]}};
 const frames={};let ready=false;
 const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const load=src=>new Promise((res,rej)=>{const i=new Image(),timer=setTimeout(()=>rej(new Error('Actor timeout: '+src)),15000);i.onload=()=>{clearTimeout(timer);res(i)};i.onerror=()=>{clearTimeout(timer);rej(new Error('Actor failed: '+src))};i.src=src;});
 function normalize(im,ax,ay,scale){const c=cv(192,224);c.getContext('2d').drawImage(im,96-ax*scale,216-ay*scale,im.width*scale,im.height*scale);return c;}
 function cleanRobot(im,left,right){
  const c=cv(right-left,194),ctx=c.getContext('2d');ctx.drawImage(im,left,35,c.width,194,0,0,c.width,194);
  const img=ctx.getImageData(0,0,c.width,c.height),d=img.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
  const candidate=n=>{const j=n*4;return Math.max(d[j],d[j+1],d[j+2])<15&&d[j+1]>=d[j];};
  const add=n=>{if(n>=0&&n<w*h&&!seen[n]&&candidate(n)){seen[n]=1;queue[tail++]=n;}};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
  while(head<tail){const n=queue[head++],x=n%w,y=Math.floor(n/w);if(x)add(n-1);if(x<w-1)add(n+1);if(y)add(n-w);if(y<h-1)add(n+w);}
  // Remove disconnected matte fragments before measuring the shared foot anchor.
  const foreground=new Uint8Array(w*h);
  for(let start=0;start<w*h;start++){
    if(seen[start]||foreground[start])continue;head=0;tail=0;queue[tail++]=start;foreground[start]=1;
    const push=n=>{if(!seen[n]&&!foreground[n]){foreground[n]=1;queue[tail++]=n;}};
    while(head<tail){const n=queue[head++],xx=n%w,yy=Math.floor(n/w);if(xx)push(n-1);if(xx<w-1)push(n+1);if(yy)push(n-w);if(yy<h-1)push(n+w);}
    if(tail<24)for(let j=0;j<tail;j++)seen[queue[j]]=1;
  }
  let bottom=0;
  for(let n=0;n<w*h;n++){if(seen[n])d[n*4+3]=0;else bottom=Math.max(bottom,Math.floor(n/w)+1);}
  ctx.putImageData(img,0,0);return {c,bottom};
 }
 function humanFrames(im,bent){
  const base=cv(206,541);base.getContext('2d').drawImage(im,0,0,206,541);
  const polys={body:[[40,0],[181,0],[187,163],[163,183],[157,306],[159,325],[47,325],[46,193],[18,179],[21,130]],armL:[[13,146],[61,141],[52,224],[42,293],[38,347],[0,347],[0,228]],armR:[[155,143],[205,149],[206,347],[151,347],[164,269],[162,212]],legL:[[44,305],[106,305],[91,414],[81,485],[98,541],[0,541],[0,498],[29,394]],legR:[[105,306],[160,306],[176,419],[177,482],[206,541],[129,541],[126,482],[116,397]]};
  const parts={};for(const [key,poly] of Object.entries(polys)){const c=cv(206,541),cx=c.getContext('2d');cx.beginPath();poly.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.closePath();cx.clip();cx.drawImage(base,0,0);parts[key]=c;}
  const result=[normalize(base,103,541,.34)];
  for(let n=0;n<8;n++){const c=cv(600,650),cx=c.getContext('2d'),phase=n*Math.PI/4;cx.translate(197,30+Math.cos(phase*2)*4);
   const part=(key,x,y,a)=>{cx.save();cx.translate(x,y);cx.rotate(a);cx.drawImage(parts[key],-x,-y);cx.restore();};
   part('legL',72,314,Math.sin(phase)*.24);part('legR',133,314,-Math.sin(phase)*.24);part('armL',43,168,-Math.sin(phase)*.23);part('body',103,316,0);part('armR',169,167,Math.sin(phase)*.23);
   const px=cx.getImageData(0,0,600,650).data;let bottom=0;for(let y=649;y>=0&&!bottom;y--)for(let x=0;x<600;x++)if(px[(y*600+x)*4+3]>180){bottom=y+1;break;}
   result.push(normalize(c,300,bottom,.34));
  }
  result.push(normalize(bent,bent.width/2,bent.height,.34));return result;
 }
 const loading=Promise.all([load('/assets/characters/pbot/sheet.webp'),load('/assets/world01-v2/hero.webp'),load('/assets/world01-v2/hero-jump.webp')]).then(([pbot,hero,bent])=>{
  const edges=[0,96,190,285,380,474,568,665,760],heads=[53,147,244,339,434,530,623,714];frames.pbot=[];
  for(let n=0;n<8;n++){const {c,bottom}=cleanRobot(pbot,edges[n],edges[n+1]);let pose=c;
  if(n===6){pose=cv(c.width,c.height);const z=pose.getContext('2d'),split=113,shift=Math.max(0,bottom-split)*.45;z.drawImage(c,0,0,c.width,split,0,shift,c.width,split);z.drawImage(c,0,split,c.width,bottom-split,0,split+shift,c.width,bottom-split-shift);}
  frames.pbot.push(normalize(pose,heads[n]-edges[n],bottom,1.21));}
  frames.hero=humanFrames(hero,bent);
  // The old Vitalii image was an erased duplicate of this same black-clothes
  // character. Restore that design; do not assign a different NPC's identity.
  frames.vitalii=frames.hero;ready=true;
  for(const key of Object.keys(defs)){const el=document.querySelector(`[data-character="${key}"] span`);if(el){const i=new Image();i.alt='';i.src=frames[key][0].toDataURL('image/png');el.replaceChildren(i);}}
 });loading.catch(e=>console.error(e.message));
 function update(p,dt,finished){const next=finished?'finish':p.hurtTime>0?'hurt':p.crouching?'crouch':!p.onGround?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>18?'run':'idle';if(p.animState!==next){p.animState=next;p.animTime=0}else p.animTime=(p.animTime||0)+dt;p.hurtTime=Math.max(0,(p.hurtTime||0)-dt);}
 function render(c,p,selected){if(!ready)return false;const key=defs[selected]?selected:'pbot',seq=defs[key][p.animState]||[0],frame=frames[key][seq[Math.floor((p.animTime||0)*10)%seq.length]],scale=.48*(p.standH/74);c.save();c.translate(p.x+p.w/2,p.y+p.h);if(p.facing<0)c.scale(-1,1);if(p.inv>0)c.globalAlpha*=.72+.28*Math.abs(Math.cos(p.inv*10));c.drawImage(frame,-96*scale,-216*scale,192*scale,224*scale);c.restore();return true;}
 window.PBOT_ACTORS={get ready(){return ready},loading,update,render,defs};
})();
