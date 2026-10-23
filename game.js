'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let W,H,mode='menu',sound=true,audio,musicTimer,player,enemies=[],keys={},score=0,wave=0,last=0,shot=0,flash=0,hurt=0,nextWave=0,time=0;
const crew=[
 {id:'123',name:'Cloud Captain',file:'viber-123',alt:'Lavender Viber with cream cap and blue eyes'},
 {id:'010',name:'Mint Condition',file:'viber-10',alt:'Green Viber with turquoise glasses and a cap'},
 {id:'042',name:'Orange Crush',file:'viber-42',alt:'Orange Viber with green hat and turquoise eyes'},
 {id:'048',name:'Propeller Head',file:'viber-48',alt:'Teal Viber with propeller hat and mint glasses'}
];
const portraits=crew.map(c=>{const image=new Image();image.src='assets/'+c.file+'.png';return image});
let selectedRaider=0,weaponIndex=0;
const touchDevice=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
const weapons=[
 {name:'PULSE BLASTER',cooldown:.23,damage:1,pellets:1,spread:0,range:24,color:'#b6a2d7',frequency:480},
 {name:'VIBE RIFLE',cooldown:.11,damage:1,pellets:1,spread:.025,range:24,color:'#e89970',frequency:720},
 {name:'BOOM SHOTGUN',cooldown:.8,damage:1,pellets:7,spread:.26,range:7,color:'#8cbfa9',frequency:160}
];
function setWeapon(index){weaponIndex=index;document.querySelectorAll('[data-weapon]').forEach(b=>{const on=Number(b.dataset.weapon)===index;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});$('weapon-name').textContent=weapons[index].name;if(mode==='playing')tone(220+index*100,.06,'triangle',.04)}
document.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>setWeapon(Number(b.dataset.weapon)));
function selectRaider(index){selectedRaider=index;const c=crew[index];$('hero-image').src=portraits[index].src;$('hero-image').alt=c.alt;$('hero-name').textContent=c.name;$('hero-id').textContent='NO. '+c.id;$('player-avatar').src=portraits[index].src;$('player-avatar').alt=c.alt;$('player-name').textContent=c.name;document.querySelectorAll('[data-raider]').forEach(b=>{const on=Number(b.dataset.raider)===index;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)})}
document.querySelectorAll('[data-raider]').forEach(b=>b.onclick=()=>selectRaider(Number(b.dataset.raider)));
const map=['1111111111111111','1000000000000001','1000000000000001','1001000000001001','1001000000001001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1001000000001001','1001000000001001','1000000000000001','1000000000000001','1111111111111111'];
function resize(){W=canvas.width=Math.min(innerWidth,1600);H=canvas.height=Math.round(W*innerHeight/innerWidth)}addEventListener('resize',resize);resize();
function tone(freq,duration,type='sine',vol=.08,end=freq){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),audio.currentTime+duration);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}
function initAudio(){if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();let beat=0;musicTimer=setInterval(()=>{if(mode!=='playing')return;const notes=[55,55,82.41,65.41,55,73.42,65.41,82.41];tone(notes[beat%8],.2,'triangle',.055);if(beat%2===0)tone(110,.12,'sine',.1,25);if(beat%4===2)tone(1600,.035,'square',.012,300);beat++},220)}audio.resume().catch(()=>{})}
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♫ SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',sound);if(sound)initAudio()};
function wall(x,y){return map[Math.floor(y)]?.[Math.floor(x)]!=='0'}
function move(obj,dx,dy){const r=.24;if(!wall(obj.x+dx+Math.sign(dx)*r,obj.y))obj.x+=dx;if(!wall(obj.x,obj.y+dy+Math.sign(dy)*r))obj.y+=dy}
function spawn(){wave++;$('wave').textContent=String(wave).padStart(2,'0');$('message').textContent='WAVE '+wave+' / STAY LOUD';setTimeout(()=>{if(mode==='playing')$('message').textContent=''},2400);for(let i=0;i<Math.min(4+wave*2,24);i++){let x,y,tries=0;do{x=1.5+Math.random()*12;y=1.5+Math.random()*12;tries++}while((wall(x,y)||Math.hypot(x-player.x,y-player.y)<4)&&tries<100);if(tries<100)enemies.push({x,y,hp:wave>3?2:1,phase:Math.random()*6,attack:0,skin:Math.floor(Math.random()*crew.length)})}tone(220,.35,'triangle',.1,660)}
function start(){initAudio();document.body.classList.add('in-game');setWeapon(weaponIndex);$('health').textContent='100';$('healthbar').style.width='100%';player={x:8,y:8,a:-Math.PI/2,hp:100};score=0;wave=0;enemies=[];shot=0;hurt=0;flash=0;nextWave=0;keys={};mode='playing';$('menu').hidden=true;$('end').hidden=true;$('hud').hidden=false;$('touch').hidden=!touchDevice();$('score').textContent='0000';spawn();if(!touchDevice())canvas.requestPointerLock?.()}
$('play').onclick=start;$('play-bottom').onclick=start;$('restart').onclick=start;$('pause').onclick=()=>pause();$('back-home').onclick=()=>{mode='menu';keys={};document.exitPointerLock?.();$('hud').hidden=true;$('end').hidden=true;$('touch').hidden=true;$('menu').hidden=false;document.body.classList.remove('in-game');window.scrollTo(0,0)};
function pause(){if(mode!=='playing')return;mode='paused';keys={};document.exitPointerLock?.();$('end').hidden=false;$('endtag').textContent='TAKE A BREATHER';$('endtitle').textContent='Raid on hold.';$('result').textContent='Your next wave can wait.';$('restart').hidden=true;$('resume').hidden=false}
function resume(){mode='playing';$('end').hidden=true;if(!touchDevice())canvas.requestPointerLock?.();audio?.resume()}
$('resume').onclick=resume;
function die(){mode='dead';document.exitPointerLock?.();$('touch').hidden=true;$('end').hidden=false;$('endtag').textContent='SIGNAL LOST';$('endtitle').textContent='You made some noise.';$('result').textContent=`${score} points · Wave ${wave} · Best ${best(score)} points`;$('restart').hidden=false;$('resume').hidden=true;tone(180,.7,'sawtooth',.1,30)}
function best(s){try{let b=Math.max(s,Number(localStorage.getItem('raidersBest'))||0);localStorage.setItem('raidersBest',b);return b}catch{return s}}
function fire(){
 if(mode!=='playing'||shot>0)return;
 const gun=weapons[weaponIndex];shot=gun.cooldown;flash=weaponIndex===2?.16:.08;
 tone(gun.frequency,weaponIndex===2?.24:.11,weaponIndex===2?'square':'sawtooth',.06,45);
 for(let pellet=0;pellet<gun.pellets;pellet++){
  const angle=player.a+(Math.random()-.5)*gun.spread;
  let target=null,dist=gun.range;
  for(const e of enemies){
   const d=Math.hypot(e.x-player.x,e.y-player.y),a=Math.atan2(e.y-player.y,e.x-player.x),delta=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));
   if(Math.abs(delta)<Math.max(.035,.38/d)&&d<dist){
    let clear=true;
    for(let t=.2;t<d;t+=.15)if(wall(player.x+Math.cos(a)*t,player.y+Math.sin(a)*t)){clear=false;break}
    if(clear){target=e;dist=d}
   }
  }
  if(target){target.hp-=gun.damage;if(target.hp<=0){enemies.splice(enemies.indexOf(target),1);score+=100;player.hp=Math.min(100,player.hp+3);$('score').textContent=String(score).padStart(4,'0');tone(680,.12,'triangle',.05,1200)}else tone(300,.08,'triangle',.035)}
 }
}
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.key.toLowerCase()]=true;if(mode==='playing'&&['1','2','3'].includes(e.key))setWeapon(Number(e.key)-1);if(e.code==='Space')fire();if(e.code==='Escape')pause()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&!touchDevice())pause()});addEventListener('mousemove',e=>{if(mode==='playing'&&document.pointerLockElement)player.a+=e.movementX*.0025});canvas.addEventListener('pointerdown',()=>{if(mode==='playing'){keys.fire=true;fire();if(!document.pointerLockElement&&!touchDevice())canvas.requestPointerLock?.()}});
addEventListener('pointerup',()=>keys.fire=false);addEventListener('pointercancel',()=>keys.fire=false);
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key.toLowerCase()]=true};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.key.toLowerCase()]=false}$('fire').onpointerdown=e=>{e.preventDefault();keys.fire=true;$('fire').setPointerCapture(e.pointerId);fire()};$('fire').onpointerup=$('fire').onpointercancel=()=>keys.fire=false;
function update(dt){shot=Math.max(0,shot-dt);flash=Math.max(0,flash-dt);hurt=Math.max(0,hurt-dt);let speed=(keys.shift?4:2.7)*dt;player.a+=((keys.arrowright?1:0)-(keys.arrowleft?1:0))*dt*2.2;let f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),s=(keys.d?1:0)-(keys.a?1:0),n=Math.max(1,Math.hypot(f,s));move(player,(Math.cos(player.a)*f-Math.sin(player.a)*s)*speed/n,(Math.sin(player.a)*f+Math.cos(player.a)*s)*speed/n);if(keys[' ']||keys.fire)fire();for(const e of enemies){let d=Math.hypot(player.x-e.x,player.y-e.y);if(d>.65)move(e,(player.x-e.x)/d*dt*(.55+Math.min(wave,12)*.055),(player.y-e.y)/d*dt*(.55+Math.min(wave,12)*.055));e.attack-=dt;if(d<.9&&e.attack<=0){player.hp-=12;e.attack=.8;hurt=.25;tone(90,.18,'square',.06,35);if(player.hp<=0){player.hp=0;die();break}}}if(!enemies.length){nextWave+=dt;if(nextWave>2){nextWave=0;spawn()}}$('health').textContent=Math.ceil(player.hp);$('healthbar').style.width=player.hp+'%'}
function render(){const active=mode!=='menu';let p=active?player:{x:8,y:8,a:time*.08};const horizon=H*.5;const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#8fcddd');sky.addColorStop(1,'#e8f0d7');ctx.fillStyle=sky;ctx.fillRect(0,0,W,horizon);ctx.fillStyle='#e6d9af';ctx.fillRect(0,horizon,W,H);ctx.strokeStyle='#a8b48666';ctx.lineWidth=1;for(let j=1;j<18;j++){let y=horizon+H/(j*.6+1);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(W/2+i*8,horizon);ctx.lineTo(W/2+i*W*.2,H);ctx.stroke()}
const step=3,z=[];for(let x=0;x<W;x+=step){let angle=p.a+Math.atan((x/W-.5)*1.4),d=.05;while(d<24&&!wall(p.x+Math.cos(angle)*d,p.y+Math.sin(angle)*d))d+=.045;d*=Math.cos(angle-p.a);z[Math.floor(x/step)]=d;let height=Math.min(H*3,H/d),shade=Math.max(.45,1-d*.025);const wx=p.x+Math.cos(angle)*d,wy=p.y+Math.sin(angle)*d;const palette=[[185,165,216],[141,192,166],[232,159,128],[231,205,133]];const c=palette[(Math.floor(wx/3)+Math.floor(wy/3))%4];ctx.fillStyle=`rgb(${c[0]*shade},${c[1]*shade},${c[2]*shade})`;ctx.fillRect(x,horizon-height/2,step+1,height);ctx.fillStyle='#fff8dc';ctx.fillRect(x,horizon-height/2,step+1,3);ctx.fillStyle='#fff6df88';ctx.fillRect(x,horizon+height*.35,step+1,2)}
let sprites=active?enemies:[{x:10,y:7,hp:1,phase:0},{x:11,y:5,hp:1,phase:2}];sprites=[...sprites].sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y));for(const e of sprites){let d=Math.hypot(e.x-p.x,e.y-p.y),a=Math.atan2(e.y-p.y,e.x-p.x)-p.a;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)>1.1)continue;let sx=W/2+Math.tan(a)*W/1.4,sz=Math.min(H*2,H/(d*Math.cos(a))),sy=horizon+sz*.05+Math.sin(time*5+e.phase)*sz*.03;ctx.save();ctx.beginPath();for(let x=Math.max(0,Math.floor((sx-sz*.4)/step)*step);x<Math.min(W,sx+sz*.4);x+=step)if(d*Math.cos(a)<(z[Math.floor(x/step)]||99)+.1)ctx.rect(x,0,step,H);ctx.clip();raider(sx,sy,sz,e.skin??0);ctx.restore()}
if(active){drawWeapon();if(hurt>0){ctx.fillStyle=`rgba(237,100,75,${hurt})`;ctx.fillRect(0,0,W,H)}}}
function drawWeapon(){
 const gun=weapons[weaponIndex],scale=H/750,bob=Math.sin(time*8)*3,recoil=flash>0?12:0;
 ctx.save();ctx.translate(W*.57,H+bob+recoil);ctx.scale(scale,scale);
 // Angular, toy-like first-person weapon silhouettes, each with a distinct barrel and stock.
 ctx.fillStyle='#304638';ctx.strokeStyle='#263b32';ctx.lineWidth=3;
 const body=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.stroke()};
 if(weaponIndex===0){body([[-80,0],[-38,-150],[0,-210],[45,-195],[90,0]],gun.color);ctx.fillStyle='#334e42';ctx.fillRect(-8,-217,34,35);ctx.fillStyle='#c5e87a';ctx.fillRect(-15,-175,38,48);ctx.fillStyle='#f7f5ec';ctx.fillRect(7,-118,40,12)}
 if(weaponIndex===1){body([[-50,0],[-18,-130],[-12,-255],[4,-280],[20,-255],[30,-125],[96,0]],'#425d4c');body([[-33,-185],[-18,-240],[28,-220],[55,-100],[1,-85]],gun.color);ctx.fillStyle='#304638';ctx.fillRect(-6,-282,18,58);ctx.fillStyle='#d9f0a1';ctx.fillRect(7,-164,20,36);ctx.fillStyle='#304638';ctx.fillRect(-4,-215,22,12)}
 if(weaponIndex===2){body([[-100,0],[-60,-125],[-45,-216],[10,-245],[65,-200],[110,0]],gun.color);ctx.fillStyle='#354e43';ctx.fillRect(-36,-240,30,75);ctx.fillRect(2,-240,30,75);ctx.fillStyle='#e99e7e';ctx.fillRect(-41,-132,90,32);ctx.strokeRect(-41,-132,90,32);for(let i=0;i<5;i++){ctx.fillStyle='#936f55';ctx.fillRect(-32+i*16,-128,4,23)}}
 body([[-120,0],[-66,-63],[-25,-46],[-36,0]],'#d1a978');body([[90,0],[58,-65],[27,-51],[35,0]],'#d1a978');
 if(flash>0){ctx.fillStyle='#fff7b3';ctx.beginPath();ctx.arc(weaponIndex===1?3:13,weaponIndex===1?-288:weaponIndex===2?-250:-224,Math.random()*16+(weaponIndex===2?30:14),0,Math.PI*2);ctx.fill()}
 ctx.restore();
}

function raider(x,y,s,index){
 const image=portraits[index];if(!image?.complete||!image.naturalWidth)return;
 // Preserve the collection image as supplied, on a floating collectible-style arena panel.
 const size=s*.76,left=x-size/2,top=y-s*.43;
 ctx.save();ctx.fillStyle='#283b3225';ctx.beginPath();ctx.ellipse(x,y+s*.44,size*.38,size*.1,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fff8e8';ctx.fillRect(left-4,top-4,size+8,size+8);ctx.drawImage(image,left,top,size,size);
 ctx.strokeStyle='#304638';ctx.lineWidth=Math.max(1,s*.007);ctx.strokeRect(left-4,top-4,size+8,size+8);ctx.restore();
}
function loop(t){const dt=Math.min((t-last)/1000,.04);last=t;time+=dt;if(mode==='playing')update(dt);if(mode!=='menu')render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
