(() => {
  const ART_BUILD='rc2-04-00';

  const baseReset=reset;
  reset=function(){
    baseReset();
    // Legacy meme boards are not part of the gameplay plane.
    props=props.filter(p=>p.kind!=='billboard');
    for(const p of props){
      const bottom=p.y+p.dh;
      const scale=p.kind==='charme'?.80:p.kind==='perkup'?.84:1;
      if(scale!==1){p.dw*=scale;p.dh*=scale;p.y=bottom-p.dh;}
    }
  };

  const baseBackground=drawBackground;
  drawBackground=function(){
    ctx.save();
    ctx.filter='saturate(.66) contrast(.89) brightness(.88)';
    baseBackground();
    ctx.restore();
    const g=ctx.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'rgba(18,48,58,.14)');
    g.addColorStop(.55,'rgba(5,18,24,.035)');
    g.addColorStop(1,'rgba(2,10,14,.17)');
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  };

  const baseWorld=drawWorldProps;
  drawWorldProps=function(){ctx.save();ctx.filter='saturate(.82) contrast(.96)';baseWorld();ctx.restore();};

  const basePlayer=drawPlayer;
  drawPlayer=function(){
    if(!player)return basePlayer();
    const c=view(),ax=player.x+player.w/2-c.x,ay=player.y+player.h-c.y;
    ctx.save();ctx.translate(ax,ay);ctx.scale(1.16,1.16);ctx.translate(-ax,-ay);
    ctx.filter='drop-shadow(0 3px 2px rgba(2,10,14,.58))';basePlayer();ctx.restore();
  };

  drawPerky=function(){
    if(!player)return;
    const px=player.x-52+Math.sin(performance.now()/430)*5;
    const py=clamp(player.y-62+Math.sin(performance.now()/330)*4,122,370);
    drawCell(images.actors,PERKY,px,py,42,65,{flip:player.facing<0,glow:pulseTime>0,alpha:.82});
  };

  const baseEnemies=drawEnemies;
  drawEnemies=function(){ctx.save();ctx.filter='saturate(.88) contrast(1.06)';baseEnemies();ctx.restore();};
  document.documentElement.dataset.artBuild=ART_BUILD;
})();
