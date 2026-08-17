(() => {
  const WORLD_BUILD='rc2-03-02';
  const WORLD_PATH=`/assets/stage2/rc23/world-platforms.svg?v=${WORLD_BUILD}`;
  const WP={
    planter:[0,0,256,160],shelter:[256,0,256,160],boardwalk:[512,0,256,160],awning:[768,0,256,160],
    charmeDock:[0,160,256,160],gantry:[256,160,256,160],overpass:[512,160,256,160],utility:[768,160,256,160]
  };
  let worldReady=false;
  const worldImg=new Image();
  worldImg.onload=()=>{if(worldImg.naturalWidth===1024&&worldImg.naturalHeight===320){images.worldPlatforms=worldImg;worldReady=true;document.documentElement.dataset.worldBuild=WORLD_BUILD;}else console.error('RC2.3C world atlas size mismatch');};
  worldImg.onerror=()=>console.error('RC2.3C world atlas failed',WORLD_PATH);
  worldImg.decoding='async';worldImg.src=WORLD_PATH;

  const SKINS=['planter','shelter','shelter','boardwalk','awning','awning','gantry','charmeDock','charmeDock','utility','overpass','gantry'];

  const baseReset=reset;
  reset=function(){
    baseReset();
    platforms.forEach((p,i)=>{p.worldSkin=SKINS[i]||'awning';});
  };

  drawPlatform=function(p){
    if(!worldReady||!images.worldPlatforms){
      const src=CITY[p.skin||'platformCity'];
      if(images.city&&src){drawCell(images.city,src,p.x,p.y-4,p.w,Math.max(62,p.h+8),{alpha:.96});return;}
      return;
    }
    const src=WP[p.worldSkin||'awning'];
    const dh=clamp(p.w*.625,92,144);
    const topOffset=dh*(24/160);
    drawCell(images.worldPlatforms,src,p.x,p.y-topOffset,p.w,dh,{alpha:.98});
  };

  // Reduce visual clutter around structures so every platform reads as an object, not a tile strip.
  const baseWorldProps=drawWorldProps;
  drawWorldProps=function(){
    ctx.save();baseWorldProps();ctx.restore();
  };
})();
