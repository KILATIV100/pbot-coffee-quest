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
      const seg=112,n=Math.max(1,Math.ceil(p.w/seg));
      for(let i=0;i<n;i++){const w=Math.min(seg,p.w-i*seg);drawCell(images.props,PROP.barrier,p.x+i*seg,p.y,w,Math.max(58,p.h+18),{alpha:.72});}
      return;
    }
    const src=WP[p.worldSkin||'awning'];
    const dh=clamp(p.w*.625,92,144);
    const topOffset=dh*(24/160);
    drawCell(images.worldPlatforms,src,p.x,p.y-topOffset,p.w,dh,{alpha:.98});
  };
})();
