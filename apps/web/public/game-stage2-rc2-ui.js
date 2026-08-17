(() => {
  const UI_BUILD='rc2-03-00';
  const shell=document.getElementById('gameShell');
  const progress=document.querySelector('.route-progress');
  const worldLabel=document.querySelector('.world-chip span');
  const zoneEl=document.createElement('div');
  zoneEl.id='zoneStatus';zoneEl.className='zone-status';zoneEl.setAttribute('aria-hidden','true');
  if(shell&&progress) progress.insertAdjacentElement('afterend',zoneEl);

  const compactText=(text='')=>{
    const s=String(text);
    if(s.startsWith('PERKY: RC2')) return 'Рухайся вперед · збирай зерна';
    if(s.includes('Скидаю до checkpoint')||s.includes('Повертаю до checkpoint')) return 'Повернення до checkpoint';
    if(s.startsWith('РОЗВИЛКА: потрібно')){
      const m=s.match(/(\d+)\/(\d+)/);return m?`Потрібно зерен: ${m[1]}/${m[2]}`:'Потрібно більше зерен';
    }
    if(s.includes('DOUBLE JUMP MODULE')) return 'Double Jump активовано';
    if(s.includes('Секретний Brovary Token')) return 'Brovary Token знайдено';
    if(s.includes('PerkUp Nitro')) return 'Nitro активовано';
    if(s.includes('CHARME Speed Shoes')) return 'Speed Shoes активовано';
    if(s.includes('Checkpoint активовано')) return 'Checkpoint';
    if(s.includes('RC2 LEVEL COMPLETE')) return 'Рівень пройдено';
    if(s.includes('Ворог вимкнений')) return 'Ворог вимкнений';
    if(s.startsWith('PERKY PULSE:')) return s.replace('PERKY PULSE: ','').replace('секретний Brovary Token у цьому секторі.','Token поруч').replace('модуль подвійного стрибка вище маршруту.','Double Jump вище').replace('маршрут чистий. Тримай ритм.','Маршрут чистий');
    return s.length>42?`${s.slice(0,39).trim()}…`:s;
  };

  const baseToast=toast;
  toast=function(text,seconds=1.45){
    const s=String(text||'');
    // Zone transitions belong in the small zone chip, never in the action plane.
    if(ZONES.some(z=>s.startsWith(`${z.name} ·`))) return;
    baseToast(compactText(s),Math.min(seconds||1.45,1.75));
  };

  function renderZone(z){
    if(!z)return;
    if(worldLabel)worldLabel.textContent=z.name;
    if(zoneEl)zoneEl.innerHTML=`<b>${z.name}</b><span>${z.hint}</span>`;
  }

  updateZones=function(){
    const next=ZONES.findIndex(z=>player.x>=z.from&&player.x<z.to);
    if(next!==zoneIndex&&next>=0){zoneIndex=next;renderZone(ZONES[next]);}
  };

  // Remove duplicated canvas zone banner. DOM chip is smaller and stays out of gameplay.
  drawZoneChip=function(){};

  const baseReset=reset;
  reset=function(){
    baseReset();
    zoneIndex=-1;
    if(zoneEl)zoneEl.textContent='';
    if(worldLabel)worldLabel.textContent='Бровари';
  };

  document.documentElement.dataset.uiBuild=UI_BUILD;
})();
