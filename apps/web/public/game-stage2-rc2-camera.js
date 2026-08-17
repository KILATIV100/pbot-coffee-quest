(() => {
  const CAMERA_BUILD='rc2-04-01';

  const baseRespawn=respawn;
  respawn=function(){
    baseRespawn();
    if(!player)return;
    camX=clamp(player.x-365,0,WORLD-VW);
    camY=clamp((player.y-300)*.14,-24,38);
    frameView={x:camX,y:camY};
  };

  const baseUpdate=update;
  update=function(dt){
    baseUpdate(dt);
    if(mode!=='play'||!player)return;

    // Keep P-BOT in a consistent readable band instead of pushing him to the screen edge.
    const look=clamp(player.vx*.16,-55,55);
    const targetX=clamp(player.x-365+look,0,WORLD-VW);
    const targetY=clamp((player.y-300)*.14,-24,38);
    const tx=1-Math.pow(.0008,dt);
    const ty=1-Math.pow(.006,dt);
    camX=lerp(camX,targetX,tx);
    camY=lerp(camY,targetY,ty);

    // Hard safe-frame only when smoothing cannot keep up after a sudden displacement.
    const sx=player.x-camX;
    if(sx<260)camX=clamp(player.x-260,0,WORLD-VW);
    else if(sx>440)camX=clamp(player.x-440,0,WORLD-VW);
  };

  document.documentElement.dataset.cameraBuild=CAMERA_BUILD;
})();
