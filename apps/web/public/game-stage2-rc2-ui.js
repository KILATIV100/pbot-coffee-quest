(() => {
  const UI_BUILD='rc2-03-03';
  const shell=document.getElementById('gameShell');
  const progress=document.querySelector('.route-progress');
  const worldLabel=document.querySelector('.world-chip span');
  const zoneEl=document.createElement('div');
  let zoneTimer=0;
  zoneEl.id='zoneStatus';zoneEl.className='zone-status';zoneEl.setAttribute('aria-hidden','true');
  if(shell&&progress) progress.insertAdjacentElement('afterend',zoneEl);

  const compactText=(text='')=>{
    const s=String(text);
    if(s.startsWith('PERKY: RC2')) return 'Збирай зерна';
    if(s.includes('Скидаю до checkpoint')||s.includes('Повертаю до checkpoint')) return 'Повернення до checkpoint';
    if(s.startsWith('РОЗВИЛКА: потрібно')){const m=s.match(/(\d+)\/(\d+)/);return m?`Зерна ${m[1]}/${m[2]}`:'Потрібно більше зерен';}
    if(s.includes('DOUBLE JUMP MODULE')) return 'Double Jump';
    if(s.includes('Секретний Brovary Token')) return 'Brovary Token';
    if(s.includes('PerkUp Nitro')) return 'Nitro';
    if(s.includes('CHARME Speed Shoes')) return 'Speed Shoes';
    if(s.includes('Checkpoint активовано')) return 'Checkpoint';
    if(s.includes('RC2 LEVEL COMPLETE')) return 'Рівень пройдено';
    if(s.includes('Ворог вимкнений')) return 'Ворог вимкнений';
    if(s.startsWith('PERKY PULSE:')) return s.includes('Token')?'Token поруч':s.includes('подвійного')?'Double Jump вище':'Маршрут чистий';
    return s.length>34?`${s.slice(0,31).trim()}…`:s;
  };

  const baseToast=toast;
  toast=function(text,seconds=1.3){
    const s=String(text||'');
    if(ZONES.some(z=>s.startsWith(`${z.name} ·`))) return;
    const out=compactText(s);if(!out)return;
    baseToast(out,Math.min(seconds||1.3,1.55));
  };

  function renderZone(z){
    if(!z)return;
    if(worldLabel)worldLabel.textContent=z.name;
    if(zoneEl){
      zoneEl.innerHTML=`<b>${z.name}</b>`;zoneEl.classList.add('on');
      clearTimeout(zoneTimer);zoneTimer=setTimeout(()=>zoneEl.classList.remove('on'),1350);
    }
  }

  updateZones=function(){const next=ZONES.findIndex(z=>player.x>=z.from&&player.x<z.to);if(next!==zoneIndex&&next>=0){zoneIndex=next;renderZone(ZONES[next]);}};
  drawZoneChip=function(){};

  const baseReset=reset;
  reset=function(){
    baseReset();zoneIndex=-1;clearTimeout(zoneTimer);
    if(zoneEl){zoneEl.textContent='';zoneEl.classList.remove('on');}
    if(worldLabel)worldLabel.textContent='Бровари';
  };

  document.documentElement.dataset.uiBuild=UI_BUILD;
})();
