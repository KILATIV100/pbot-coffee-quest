(() => {
  const ART_BUILD='rc2-03-03';

  const baseReset=reset;
  reset=function(){
    baseReset();
    // Legacy meme billboards compete with gameplay and repeat the same message.
    props=props.filter(p=>p.kind!=='billboard');
    for(const p of props){
      const bottom=p.y+p.dh;
      if(p.kind==='perkup'||p.kind==='charme'){p.dw*=.94;p.dh*=.94;p.y=bottom-p.dh;}
    }
  };

  const baseBackground=drawBackground;
  drawBackground=function(){
    ctx.save();
    ctx.filter='saturate(.72) contrast(.92) brightness(.91)';
    baseBackground();
    ctx.restore();
    const g=ctx.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'rgba(22,58,69,.08)');
    g.addColorStop(.58,'rgba(5,20,26,.02)');
    g.addColorStop(1,'rgba(3,12,16,.12)');
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  };

  const baseWorld=drawWorldProps;
  drawWorldProps=function(){ctx.save();ctx.filter='saturate(.88) contrast(.98)';baseWorld();ctx.restore();};

  const basePlayer=drawPlayer;
  drawPlayer=function(){
    if(!player)return basePlayer();
    const c=view(),ax=player.x+player.w/2-c.x,ay=player.y+player.h-c.y;
    ctx.save();ctx.translate(ax,ay);ctx.scale(1.12,1.12);ctx.translate(-ax,-ay);
    ctx.filter='drop-shadow(0 2px 1px rgba(2,10,14,.45))';basePlayer();ctx.restore();
  };

  drawPerky=function(){
    if(!player)return;
    const px=player.x-57+Math.sin(performance.now()/430)*6;
    const py=clamp(player.y-70+Math.sin(performance.now()/330)*4,115,365);
    drawCell(images.actors,PERKY,px,py,48,74,{flip:player.facing<0,glow:pulseTime>0,alpha:.9});
  };

  const baseEnemies=drawEnemies;
  drawEnemies=function(){ctx.save();ctx.filter='saturate(.92) contrast(1.04)';baseEnemies();ctx.restore();};
  document.documentElement.dataset.artBuild=ART_BUILD;
})();
