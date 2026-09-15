/* Pure quest transitions. Renderers and dialogs cannot grant unearned rewards. */
(() => {
  'use strict';
  const SHARDS=[{id:'notice',x:1398,y:405},{id:'route',x:1536,y:405},{id:'signature',x:1838,y:377}];
  const PARCEL={id:'charme-parcel',x:2681,y:276};
  const NPCS={coffee:{x:759,y:437,art:'npc-coffee',name:'Бариста PerkUp'},news:{x:1321,y:438,art:'npc-news',name:'Редактор NEWS'},shoes:{x:2336,y:438,art:'npc-shoes',name:'Майстер CHARME'},terminal:{x:3234,y:448,art:'checkpoint',name:'Термінал маршруту'},exit:{x:4470,y:448,art:'portal',name:'Маршрут до парку'}};
  function clean(raw){const q={version:1,phase:0,shards:[],parcel:false,introSeen:false};if(!raw||typeof raw!=='object')return q;
    q.phase=Number.isInteger(raw.phase)?Math.max(0,Math.min(7,raw.phase)):0;
    q.shards=[...new Set(Array.isArray(raw.shards)?raw.shards.filter(id=>SHARDS.some(x=>x.id===id)):[])];
    q.parcel=raw.parcel===true;q.introSeen=raw.introSeen===true;
    if(q.phase>=4&&q.shards.length!==3)q.phase=3;
    if(q.phase>=6&&!q.parcel)q.phase=5;
    return q;
  }
  function transition(raw,cmd,ctx={}){
    const q=clean(raw),out={q,reward:null,changed:false};let next=q.phase;
    if(cmd==='intro'){q.introSeen=true;out.changed=true;return out;}
    if(cmd==='accept-coffee'&&q.phase===0)next=1;
    if(cmd==='handin-coffee'&&q.phase===1&&ctx.beans>=8){next=2;out.reward='coffee';}
    if(cmd==='accept-news'&&q.phase===2)next=3;
    if(cmd==='handin-news'&&q.phase===3&&q.shards.length===3){next=4;out.reward='news';}
    if(cmd==='accept-shoes'&&q.phase===4)next=5;
    if(cmd==='handin-shoes'&&q.phase===5&&q.parcel){next=6;out.reward='shoes';}
    if(cmd==='activate'&&q.phase===6)next=7;
    if(cmd.startsWith('shard:')&&q.phase===3){const id=cmd.slice(6);if(SHARDS.some(s=>s.id===id)&&!q.shards.includes(id)){q.shards.push(id);out.changed=true;}}
    if(cmd==='parcel'&&q.phase===5&&!q.parcel){q.parcel=true;out.changed=true;}
    if(next!==q.phase){q.phase=next;out.changed=true;}
    return out;
  }
  function objective(raw,beans=0){const q=clean(raw);return [
    ['РАНОК БЕЗ СИГНАЛУ','Поговори з баристою PerkUp','coffee'],
    ['ЗАРЯД ДЛЯ МІСТА',beans>=8?'Поверни 8 зерен баристі PerkUp':`Збери зерна: ${Math.min(8,beans)} / 8`,'coffee'],
    ['ПОВІДОМЛЕННЯ У ШУМІ','Поговори з редактором NEWS','news'],
    ['ПОВІДОМЛЕННЯ У ШУМІ',q.shards.length===3?'Поверни фрагменти редактору NEWS':`Знайди фрагменти: ${q.shards.length} / 3`,'news'],
    ['ПОСИЛКА ДЛЯ CHARME','Поговори з майстром CHARME','shoes'],
    ['ПОСИЛКА ДЛЯ CHARME',q.parcel?'Поверни посилку майстру CHARME':'Знайди посилку на риштуванні','shoes'],
    ['ПОВЕРНИ СИГНАЛ','Увімкни термінал біля другого чекпойнта','terminal'],
    ['МІСТО ЗНОВУ НА ЗВ’ЯЗКУ','Дійди до порталу й відкрий маршрут','exit']
  ][q.phase];}
  function status(q,npc,beans){const phase=clean(q).phase,start={coffee:0,news:2,shoes:4,terminal:6,exit:7}[npc];if(phase<start)return 'locked';
    if(npc==='terminal'||npc==='exit')return phase===start?'ready':'done';
    if(phase>start+1)return 'done';if(phase===start)return 'available';
    return (npc==='coffee'?beans>=8:npc==='news'?q.shards.length===3:q.parcel)?'ready':'active';
  }
  globalThis.PBOT_QUESTS={clean,transition,objective,status,SHARDS,PARCEL,NPCS};
})();
