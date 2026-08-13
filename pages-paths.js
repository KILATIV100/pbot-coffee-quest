// GitHub Pages project-site path fix + repaired sprite retry.
Object.assign(characters[0],{preview:'./assets/characters/pbot/idle.webp',sheet:'./assets/characters/pbot/sheet.webp'});
Object.assign(characters[1],{preview:'./assets/characters/brovary-hero/idle.webp',sheet:'./assets/characters/brovary-hero/sheet.webp'});
Object.assign(characters[2],{preview:'./assets/characters/vitalii/idle.webp',sheet:'./assets/characters/vitalii/sheet.webp'});
backgrounds[1]='./assets/backgrounds/world01-level01.webp';
characters.forEach(c=>{image(c.preview);image(c.sheet)});
if(typeof __repairSprite==='function'){
  Promise.all([__repairSprite(characters[0],'pbot'),__repairSprite(characters[1],'hero'),__repairSprite(characters[2],'vitalii')]).then(()=>renderMenu()).catch(()=>renderMenu());
}else renderMenu();
