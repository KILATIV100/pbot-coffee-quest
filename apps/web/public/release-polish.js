(()=>{
'use strict';
const $=s=>document.querySelector(s);
const shell=$('#gameShell'), toast=$('#toast'), lives=$('#lives'), beans=$('#beans'), tokens=$('#tokens'), level=$('#levelCode'), world=$('#worldName');
if(!shell)return;

const fx=document.createElement('div');fx.className='release-fx';fx.innerHTML=`<div class="screen-flash"></div><div class="world-intro"><small>P-BOT · BROVARY UNIVERSE</small><b></b><span></span></div><div class="boss-hud hidden"><div><small>THE OFFICIAL</small><b>БЮРОКРАТИЧНИЙ БУЛЬДОЗЕР</b></div><i><span></span></i></div>`;shell.appendChild(fx);
const flash=fx.querySelector('.screen-flash'), intro=fx.querySelector('.world-intro'), introTitle=intro.querySelector('b'), introMeta=intro.querySelector('span'), bossHud=fx.querySelector('.boss-hud'), bossFill=bossHud.querySelector('i span');

let audioCtx=null,master=null,musicGain=null,sfxGain=null,muted=localStorage.getItem('pbot-muted')==='1',musicTimer=0,lastWorld='',lastLevel='',lastLives=lives?.textContent,lastBeans=beans?.textContent,lastTokens=tokens?.textContent;
const AudioCtx=window.AudioContext||window.webkitAudioContext;

function ensureAudio(){
 if(audioCtx||!AudioCtx)return;
 audioCtx=new AudioCtx();master=audioCtx.createGain();musicGain=audioCtx.createGain();sfxGain=audioCtx.createGain();
 master.gain.value=muted?0:.65;musicGain.gain.value=.15;sfxGain.gain.value=.55;musicGain.connect(master);sfxGain.connect(master);master.connect(audioCtx.destination);
 startMusic();
}
function tone(freq,dur=.08,type='sine',vol=.12,delay=0){if(!audioCtx||muted)return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+dur+.02)}
function chord(root,quality='major'){const ints=quality==='minor'?[0,3,7]:[0,4,7];ints.forEach((i,n)=>tone(root*Math.pow(2,i/12),.34,'triangle',.035,n*.012))}
function sfx(kind){ensureAudio();if(kind==='bean'){tone(660,.05,'sine',.08);tone(880,.07,'sine',.05,.03)}else if(kind==='token'){tone(523,.08,'triangle',.1);tone(784,.12,'triangle',.09,.05);tone(1046,.16,'triangle',.07,.11)}else if(kind==='hurt'){tone(180,.18,'sawtooth',.14);tone(110,.2,'square',.06,.04)}else if(kind==='checkpoint'){tone(392,.08,'triangle',.09);tone(523,.1,'triangle',.08,.08);tone(659,.14,'triangle',.08,.16)}else if(kind==='boss'){tone(92,.28,'sawtooth',.16);tone(138,.22,'square',.07,.03)}else if(kind==='ui'){tone(440,.04,'sine',.035)}}
function startMusic(){if(!audioCtx||musicTimer)return;let step=0;const loop=()=>{if(document.hidden||muted)return;const code=level?.textContent||'01-01',wi=Math.max(0,(parseInt(code.slice(0,2))||1)-1);const roots=[220,246.94,261.63,196,233.08,293.66,174.61,329.63,207.65,185,277.18,311.13,164.81,349.23,146.83];const root=roots[wi%roots.length];const prog=[1,1.25,1.5,1.334][step%4];const f=root*prog;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type=wi>11?'sawtooth':'triangle';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.032,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+.58);o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+.62);step++};loop();musicTimer=setInterval(loop,620)}
function rumble(ms=35){try{navigator.vibrate?.(ms)}catch{}}
function pulseFlash(cls){flash.className='screen-flash '+cls;requestAnimationFrame(()=>flash.classList.add('on'));setTimeout(()=>flash.className='screen-flash',220)}
function showIntro(){if(!level||!world)return;const code=level.textContent||'',name=world.textContent||'';if(code===lastLevel&&name===lastWorld)return;lastLevel=code;lastWorld=name;introTitle.textContent=`${code} · ${name}`;introMeta.textContent=code==='15-03'?'ФІНАЛ · THE OFFICIAL':'НОВИЙ СЕКТОР';intro.classList.remove('show');void intro.offsetWidth;intro.classList.add('show');setTimeout(()=>intro.classList.remove('show'),2400);if(code==='15-03'){bossHud.classList.remove('hidden');bossFill.style.width='100%';sfx('boss')}else bossHud.classList.add('hidden')}

const mute=document.createElement('button');mute.id='audioBtn';mute.className='hud-round audio-btn';mute.setAttribute('aria-label','Звук');mute.textContent=muted?'🔇':'🔊';const hudRight=shell.querySelector('.hud-right');hudRight?.prepend(mute);mute.addEventListener('click',e=>{e.stopPropagation();ensureAudio();muted=!muted;localStorage.setItem('pbot-muted',muted?'1':'0');if(master)master.gain.setTargetAtTime(muted?0:.65,audioCtx.currentTime,.03);mute.textContent=muted?'🔇':'🔊';sfx('ui')});

['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,ensureAudio,{once:true,passive:true}));
shell.addEventListener('pointerdown',()=>sfx('ui'));

const hudObserver=new MutationObserver(()=>{
 const lv=lives?.textContent,bn=beans?.textContent,tk=tokens?.textContent;
 if(lastLives!=null&&lv!==lastLives){if(Number(lv)<Number(lastLives)){sfx('hurt');rumble([50,30,70]);pulseFlash('hurt');shell.classList.remove('shake');void shell.offsetWidth;shell.classList.add('shake');setTimeout(()=>shell.classList.remove('shake'),260)}lastLives=lv}
 if(lastBeans!=null&&bn!==lastBeans){sfx('bean');pulseFlash('reward');lastBeans=bn}
 if(lastTokens!=null&&tk!==lastTokens){sfx('token');rumble(28);pulseFlash('token');lastTokens=tk}
 showIntro();
});
[lives,beans,tokens,level,world].filter(Boolean).forEach(el=>hudObserver.observe(el,{childList:true,subtree:true,characterData:true}));

if(toast)new MutationObserver(()=>{const t=toast.textContent||'';if(/Чекпойнт/i.test(t)){sfx('checkpoint');rumble(20)}const m=t.match(/The Official:\s*(\d+)\/(\d+)/i);if(m){bossHud.classList.remove('hidden');bossFill.style.width=`${Math.max(0,Number(m[1])/Number(m[2])*100)}%`;sfx('boss');pulseFlash('boss')}}).observe(toast,{childList:true,subtree:true,characterData:true,attributes:true});

document.addEventListener('visibilitychange',()=>{if(audioCtx&&document.hidden)audioCtx.suspend();else if(audioCtx&&!muted)audioCtx.resume()});
setTimeout(showIntro,350);
})();