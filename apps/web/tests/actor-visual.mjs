import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.QA_OUT||'qa-story';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle'});await p.evaluate(()=>PBOT_ACTORS.loading);
const result=await p.evaluate(()=>{
 const poses=[['idle',0],['run',.1],['run',.2],['run',.3],['crouch',0],['jump',0],['hurt',.1],['finish',0]];
 const rows=['pbot','hero','vitalii'],c=document.createElement('canvas');c.width=1280;c.height=660;const x=c.getContext('2d');let bounds=[];
 rows.forEach((key,r)=>poses.forEach(([state,t],j)=>{
  const baseX=j*160,baseY=r*220;
  x.fillStyle=j%2?'#e4f0f3':'#14354a';x.fillRect(baseX,baseY,160,220);x.fillStyle=j%2?'#14354a':'#e4f0f3';x.font='12px sans-serif';x.fillText(key+' / '+state,baseX+9,baseY+20);
  const p={x:baseX+60,y:baseY+103,w:40,h:74,standH:74,facing:j%2?-1:1,animState:state,animTime:t,inv:state==='hurt'?.15:0};
  PBOT_ACTORS.render(x,p,key);x.strokeStyle='#69cfa9';x.lineWidth=1;x.beginPath();x.moveTo(baseX+6,baseY+178);x.lineTo(baseX+154,baseY+178);x.stroke();
  const temp=document.createElement('canvas');temp.width=160;temp.height=220;const q=temp.getContext('2d');PBOT_ACTORS.render(q,{...p,x:60,y:103},key);const data=q.getImageData(0,0,160,220).data;let pixels=0,edge=0;
  for(let y=0;y<220;y++)for(let xx=0;xx<160;xx++)if(data[(y*160+xx)*4+3]>32){pixels++;if(xx===0||xx===159||y===0||y===219)edge++;}
  bounds.push({key,state,pixels,edge});
 }));return {png:c.toDataURL('image/png').split(',')[1],bounds};
});
await fs.writeFile(out+'/actor-frames.png',Buffer.from(result.png,'base64'));await fs.writeFile(out+'/actor-bounds.json',JSON.stringify(result.bounds,null,2));assert.ok(result.bounds.every(q=>q.pixels>500&&q.edge===0),'Sprites are visible and not clipped at frame canvas edges');await b.close();
