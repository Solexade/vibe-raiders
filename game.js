import * as THREE from './vendor/three.module.min.js';
import {RaiderAudio} from './audio.js';
import {box, crew, makeRaider, makeArena} from './world.js';
import {weapons,makeWeapon} from './weapons.js';

const $=id=>document.getElementById(id);
const canvas=$('game'), audio=new RaiderAudio();canvas.tabIndex=0;
const touchDevice=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
let mode='menu', selectedRaider=0, weaponIndex=0;
let renderer,scene,camera,arena,weaponScene,weaponCamera,weaponModel;
let player={x:0,z:12,hp:100,y:0,vy:0},yaw=0,pitch=0;
let enemies=[],effects=[],keys={},score=0,wave=0,kills=0,elapsed=0;
let ammo=weapons.map(w=>w.capacity),cooldown=0,reloadTime=0,recoil=0,flashTime=0;
let nextWave=0,invincible=0,hitTime=0,stepTime=0,messageTime=0,swapTime=0;
let aim=false, firing=false,last=0,clock=0,flow=[],flowTimer=0;
const weaponCache=new Map();
const raycaster=new THREE.Raycaster(),direction=new THREE.Vector3();
const origin2d=new THREE.Vector2(0,0),worldUp=new THREE.Vector3(0,1,0);
let rendererError='';

// The bright landing page keeps the collection's original 2D artwork.
function selectRaider(index){
  selectedRaider=index;const c=crew[index];
  $('hero-image').src=`assets/${c.file}.png`;$('hero-image').alt=c.alt;
  $('hero-name').textContent=c.name;$('hero-id').textContent='NO. '+c.id;
  $('player-avatar').src=`assets/${c.file}.png`;$('player-avatar').alt=c.alt;$('player-name').textContent=c.name;
  document.querySelectorAll('[data-raider]').forEach(button=>{const on=Number(button.dataset.raider)===index;button.classList.toggle('selected',on);button.setAttribute('aria-pressed',on)});
}
document.querySelectorAll('[data-raider]').forEach(button=>button.onclick=()=>selectRaider(Number(button.dataset.raider)));
$('sound').onclick=()=>{audio.muted=!audio.muted;$('sound').textContent=audio.muted?'SOUND OFF':'♫ SOUND ON';$('sound').setAttribute('aria-pressed',!audio.muted);audio.updateVolumes();if(!audio.muted)audio.init()};
for(const [id,key] of [['music-volume','musicVolume'],['effects-volume','effectsVolume']])$(id).oninput=event=>{audio[key]=Number(event.target.value);audio.updateVolumes()};

function init3D(){
  if(renderer)return true;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:!touchDevice(),powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,touchDevice()?1.25:1.5));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    scene=new THREE.Scene();arena=makeArena(scene,touchDevice());
    camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.08,100);camera.rotation.order='YXZ';
    weaponScene=new THREE.Scene();weaponCamera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.01,10);
    weaponScene.add(new THREE.HemisphereLight(0xffffff,0xa6aa8a,2.6));
    const key=new THREE.DirectionalLight(0xfff2d4,3);key.position.set(-2,4,2);weaponScene.add(key);
    resize();return true;
  }catch(error){
    rendererError='This browser could not start 3D graphics. Please enable WebGL / hardware acceleration or try a recent Chrome, Safari, or Firefox browser.';
    console.error('3D renderer initialization failed:',error);renderer=undefined;return false;
  }
}
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();weaponCamera.aspect=camera.aspect;weaponCamera.updateProjectionMatrix()}
addEventListener('resize',resize);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();$('result').textContent='The graphics connection was interrupted. Reload the page to restart the 3D arena.'});
function notice(text,duration=2.2){$('message').textContent=text;messageTime=duration}
function setWeapon(index,quiet=false){
  if(index<0||index>=weapons.length)return;
  weaponIndex=index;reloadTime=0;swapTime=.22;aim=false;
  if(weaponModel)weaponScene.remove(weaponModel);
  if(weaponScene){const key=selectedRaider+':'+index;if(!weaponCache.has(key))weaponCache.set(key,makeWeapon(index,crew[selectedRaider].body));weaponModel=weaponCache.get(key);weaponModel.scale.setScalar(.7);weaponScene.add(weaponModel)}
  document.querySelectorAll('[data-weapon]').forEach(button=>{const on=Number(button.dataset.weapon)===index;button.classList.toggle('active',on);button.setAttribute('aria-pressed',on)});
  if(!quiet)audio.switch();syncHUD();
}
document.querySelectorAll('[data-weapon]').forEach(button=>button.onclick=()=>{if(mode==='playing')setWeapon(Number(button.dataset.weapon))});
function syncHUD(){
  $('health').textContent=Math.ceil(player.hp);$('healthbar').style.width=player.hp+'%';
  $('score').textContent=String(score).padStart(4,'0');$('wave').textContent=String(wave).padStart(2,'0');
  $('weapon-name').textContent=weapons[weaponIndex].name;
  $('ammo').textContent=reloadTime>0?'RELOADING':`${ammo[weaponIndex]} / ${weapons[weaponIndex].capacity}`;
  $('reload').classList.toggle('loading',reloadTime>0);
  $('arena-meta').textContent=`${enemies.length} RAIDERS LEFT · ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;
}
function reload(){
  if(mode!=='playing'||reloadTime>0||ammo[weaponIndex]===weapons[weaponIndex].capacity)return;
  reloadTime=weapons[weaponIndex].reload;audio.reload();syncHUD();
}
$('reload').onclick=reload;
function lockPointer(){if(!touchDevice()&&canvas.requestPointerLock){try{const result=canvas.requestPointerLock();result?.catch(()=>notice('CLICK THE ARENA TO ENABLE MOUSE LOOK'))}catch{notice('USE ARROW KEYS TO TURN')}}}
function start(){
  audio.init();
  if(!init3D()){$('launch-error').hidden=false;$('launch-error').textContent=rendererError;return}
  for(const e of enemies)scene.remove(e.model);for(const e of effects)removeEffect(e);
  enemies=[];effects=[];keys={};score=0;wave=0;kills=0;elapsed=0;
  player={x:0,z:11,hp:100,y:0,vy:0};yaw=0;pitch=0;
  ammo=weapons.map(w=>w.capacity);cooldown=0;reloadTime=0;recoil=0;flashTime=0;nextWave=0;invincible=1;firing=false;aim=false;hitTime=0;flowTimer=0;
  mode='playing';document.body.classList.add('in-game');$('menu').hidden=true;$('end').hidden=true;$('hud').hidden=false;$('launch-error').hidden=true;
  $('touch').hidden=!touchDevice();setWeapon(weaponIndex,true);spawnWave();audio.setPlaying(true);canvas.focus({preventScroll:true});lockPointer();syncHUD();
}
$('play').onclick=start;$('play-bottom').onclick=start;$('restart').onclick=start;
function pause(){
  if(mode!=='playing')return;
  mode='paused';keys={};firing=false;aim=false;audio.setPlaying(false);document.exitPointerLock?.();
  $('end').hidden=false;$('endtag').textContent='TAKE A BREATHER';$('endtitle').textContent='Raid on hold.';
  $('result').textContent='Your next wave can wait.';$('restart').hidden=true;$('resume').hidden=false;$('resume').focus();
}
$('pause').onclick=pause;
$('resume').onclick=()=>{mode='playing';$('end').hidden=true;audio.init();audio.setPlaying(true);lockPointer()};
$('back-home').onclick=()=>{mode='menu';keys={};firing=false;audio.setPlaying(false);document.exitPointerLock?.();document.body.classList.remove('in-game');$('menu').hidden=false;$('hud').hidden=true;$('end').hidden=true;$('touch').hidden=true;window.scrollTo({top:0,behavior:'instant'});$('play').focus()};
function bestScore(){try{const best=Math.max(score,Number(localStorage.getItem('raidersBest'))||0);localStorage.setItem('raidersBest',best);return best}catch{return score}}
function die(){
  mode='dead';firing=false;keys={};audio.setPlaying(false);audio.death();document.exitPointerLock?.();$('touch').hidden=true;$('end').hidden=false;
  $('endtag').textContent='VIBE CHECK COMPLETE';$('endtitle').textContent='You made some noise.';
  $('result').textContent=`${score} points · ${kills} takedowns · Wave ${wave} · Best ${bestScore()} points`;
  $('restart').hidden=false;$('resume').hidden=true;$('restart').focus();
}

function canStand(x,z,r=.35){
  if(Math.abs(x)>21.5-r||Math.abs(z)>21.5-r)return false;
  return !arena.colliders.some(c=>Math.abs(x-c.x)<c.w+r&&Math.abs(z-c.z)<c.d+r);
}
function move(entity,dx,dz,r=.35){
  if(canStand(entity.x+dx,entity.z,r))entity.x+=dx;
  if(canStand(entity.x,entity.z+dz,r))entity.z+=dz;
}
function gridIndex(x,z){return {x:Math.max(0,Math.min(43,Math.floor(x+22))),z:Math.max(0,Math.min(43,Math.floor(z+22)))}}
function rebuildFlow(){
  const size=44;flow=new Int16Array(size*size).fill(-1);const start=gridIndex(player.x,player.z),queue=[[start.x,start.z]];
  flow[start.z*size+start.x]=0;
  for(let read=0;read<queue.length;read++){
    const [x,z]=queue[read];
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,nz=z+dz,index=nz*size+nx;
      if(nx<0||nx>=size||nz<0||nz>=size||flow[index]>=0||!canStand(nx-21.5,nz-21.5,.42))continue;
      flow[index]=flow[z*size+x]+1;queue.push([nx,nz]);
    }
  }
}
function addEnemy(x,z,index,elite=false){
  const model=makeRaider(index,elite);model.position.set(x,0,z);scene.add(model);
  const maxHP=(elite?130:48)+Math.max(0,wave-1)*5;
  const enemy={x,z,model,hp:maxHP,maxHP,attack:Math.random()*.5,phase:Math.random()*6,index,elite,damageTime:0};
  const health=new THREE.Group();box(health,0,0,0,.85,.075,.06,0x34483d);const fill=box(health,0,0,.04,.81,.045,.03,0xc2ed83,true);health.position.y=elite?2.9:2.55;health.visible=false;model.add(health);enemy.health=health;enemy.fill=fill;
  enemy.hitMeshes=[];model.traverse(child=>{if(child.isMesh&&child.parent!==health){child.userData.enemy=enemy;enemy.hitMeshes.push(child)}});
  enemies.push(enemy);return enemy;
}
function spawnWave(){
  wave++;const count=Math.min(4+wave*2,20);
  const corners=[[-17,-17],[17,-17],[-17,17],[17,17]];
  for(let i=0;i<count;i++){
    let x,z;for(let attempt=0;attempt<50;attempt++){
      const corner=corners[i%4];x=corner[0]+(Math.random()-.5)*3;z=corner[1]+(Math.random()-.5)*3;
      if(canStand(x,z,.6)&&Math.hypot(x-player.x,z-player.z)>8)break;
    }
    if(canStand(x,z,.6))addEnemy(x,z,Math.floor(Math.random()*crew.length),wave%3===0&&i===0);
  }
  audio.wave();notice(`WAVE ${wave} / ${wave%3===0?'ELITE RAID INCOMING':'LET THE GOOD VIBES ROLL'}`,3);syncHUD();rebuildFlow();
}
function removeEffect(e){scene.remove(e.mesh);if(e.dispose){e.mesh.geometry.dispose();e.mesh.material.dispose()}}
function particles(position,color,count=6){
  for(let i=0;i<count&&effects.length<100;i++){
    const mesh=box(scene,position.x,position.y,position.z,.065,.065,.065,color,true);
    effects.push({mesh,life:.35+Math.random()*.25,total:.6,velocity:new THREE.Vector3((Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4)});
  }
}
function trace(from,to,color){
  const geometry=new THREE.BufferGeometry().setFromPoints([from,to]);
  const mesh=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));scene.add(mesh);effects.push({mesh,life:.07,total:.07,dispose:true});
}
function damageEnemy(enemy,damage,point){
  enemy.hp-=damage;enemy.damageTime=.9;enemy.health.visible=true;enemy.fill.scale.x=Math.max(.001,.81*enemy.hp/enemy.maxHP);
  hitTime=.12;const dead=enemy.hp<=0;audio.hit(dead,Math.sin(Math.atan2(enemy.x-player.x,enemy.z-player.z)+yaw)*.6);
  if(dead){
    score+=enemy.elite?350:100;kills++;player.hp=Math.min(100,player.hp+3);particles(point,crew[enemy.index].body,12);
    scene.remove(enemy.model);enemies.splice(enemies.indexOf(enemy),1);
  }else particles(point,0xffd98b,3);
}
function shoot(){
  if(mode!=='playing'||cooldown>0||reloadTime>0||swapTime>0)return false;
  const gun=weapons[weaponIndex];if(ammo[weaponIndex]<=0){reload();return false}
  ammo[weaponIndex]--;cooldown=gun.cooldown;recoil=Math.min(.2,recoil+gun.recoil);flashTime=.055;audio.shot(weaponIndex);
  camera.updateMatrixWorld();scene.updateMatrixWorld();
  const targets=[...arena.solidMeshes,...enemies.flatMap(enemy=>enemy.hitMeshes)];
  for(let pellet=0;pellet<gun.pellets;pellet++){
    raycaster.setFromCamera(origin2d,camera);
    direction.set((Math.random()-.5)*gun.spread*(aim?.45:1),(Math.random()-.5)*gun.spread*(aim?.45:1),-1).normalize().applyQuaternion(camera.quaternion);
    raycaster.set(camera.position,direction);raycaster.far=gun.range;
    const hit=raycaster.intersectObjects(targets,false)[0];
    const end=hit?hit.point:camera.position.clone().addScaledVector(direction,gun.range);
    const muzzle=new THREE.Vector3(aim?.08:.28,-.2,-.7).applyQuaternion(camera.quaternion).add(camera.position);
    trace(muzzle,end,weaponIndex===0?0xc3b0ff:0xffe2a1);
    if(hit){const enemy=hit.object.userData.enemy;
      if(enemy&&enemies.includes(enemy)){const headshot=hit.point.y>1.45;damageEnemy(enemy,gun.damage*(headshot?1.4:1),hit.point)}
      else if(!enemy)particles(hit.point,0xfff1cf,2);
    }
  }
  syncHUD();return true;
}
function jump(){if(mode==='playing'&&player.y<=0)player.vy=4.8}
$('jump').onclick=jump;
$('aim').onclick=()=>{aim=!aim;$('aim').classList.toggle('active',aim);$('aim').setAttribute('aria-pressed',aim)};
function clearInputs(){keys={};firing=false;aim=false}
addEventListener('keydown',event=>{
  if(event.target.matches('input,button')&&['Enter',' '].includes(event.key))return;
  if(mode!=='playing')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  keys[event.key.toLowerCase()]=true;
  if(event.code==='Space'){event.preventDefault();shoot()}
  if(event.repeat)return;
  if(['1','2','3'].includes(event.key))setWeapon(Number(event.key)-1);
  if(event.code==='KeyR')reload();if(event.code==='KeyE')jump();if(event.code==='Escape')pause();
});
addEventListener('keyup',event=>keys[event.key.toLowerCase()]=false);
addEventListener('blur',()=>{clearInputs();pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInputs();pause()}});
document.addEventListener('pointerlockchange',()=>{if(mode==='playing'&&!document.pointerLockElement&&!touchDevice())pause()});
addEventListener('mousemove',event=>{if(mode==='playing'&&document.pointerLockElement===canvas){yaw-=event.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-event.movementY*.0022,-1.1,1.1)}});
let lookPointer=null,lookX=0,lookY=0;
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointerdown',event=>{
  if(mode!=='playing')return;
  if(event.pointerType==='touch'){lookPointer=event.pointerId;lookX=event.clientX;lookY=event.clientY;canvas.setPointerCapture(event.pointerId)}
  else if(event.button===2)aim=true;
  else if(event.button===0){if(document.pointerLockElement!==canvas)lockPointer();firing=true;shoot()}
});
canvas.addEventListener('pointermove',event=>{if(mode==='playing'&&event.pointerId===lookPointer){yaw-=(event.clientX-lookX)*.005;pitch=THREE.MathUtils.clamp(pitch-(event.clientY-lookY)*.005,-1.05,1.05);lookX=event.clientX;lookY=event.clientY}});
function releasePointer(event){if(event.pointerId===lookPointer)lookPointer=null;if(event.button===2)aim=false;if(event.pointerType!=='touch')firing=false}
addEventListener('pointerup',releasePointer);addEventListener('pointercancel',()=>{lookPointer=null;firing=false;keys={}});
for(const button of document.querySelectorAll('[data-key]')){
  button.onpointerdown=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys[button.dataset.key.toLowerCase()]=true};
  button.onpointerup=button.onpointercancel=()=>keys[button.dataset.key.toLowerCase()]=false;
}
$('fire').onpointerdown=event=>{event.preventDefault();$('fire').setPointerCapture(event.pointerId);firing=true;shoot()};
$('fire').onpointerup=$('fire').onpointercancel=()=>firing=false;

function update(dt){
  elapsed+=dt;cooldown=Math.max(0,cooldown-dt);swapTime=Math.max(0,swapTime-dt);flashTime=Math.max(0,flashTime-dt);recoil=THREE.MathUtils.damp(recoil,0,14,dt);
  invincible=Math.max(0,invincible-dt);hitTime=Math.max(0,hitTime-dt);messageTime-=dt;if(messageTime<=0)$('message').textContent='';
  if(reloadTime>0){reloadTime-=dt;if(reloadTime<=0){reloadTime=0;ammo[weaponIndex]=weapons[weaponIndex].capacity;audio.switch()}}
  const sprint=keys.shift&&!aim,speed=(sprint?6.5:4.3)*dt;
  yaw+=((keys.arrowleft?1:0)-(keys.arrowright?1:0))*dt*2;
  let f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),r=(keys.d?1:0)-(keys.a?1:0);const length=Math.max(1,Math.hypot(f,r));f/=length;r/=length;
  const beforeX=player.x,beforeZ=player.z;
  move(player,(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed);
  const walking=Math.hypot(player.x-beforeX,player.z-beforeZ)>.001;
  player.vy-=12*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
  if(walking&&player.y===0){stepTime-=dt;if(stepTime<=0){audio.stepSound(sprint);stepTime=sprint?.25:.38}}
  const bob=walking?Math.sin(elapsed*(sprint?15:11))*.035:Math.sin(elapsed*2)*.007;
  camera.position.set(player.x,1.65+player.y+bob,player.z);camera.rotation.set(pitch+recoil*.35,yaw,0,'YXZ');
  camera.fov=THREE.MathUtils.damp(camera.fov,aim?53:sprint?78:72,10,dt);camera.updateProjectionMatrix();
  if(firing||keys[' '])shoot();
  flowTimer-=dt;if(flowTimer<=0){rebuildFlow();flowTimer=.4}
  for(const enemy of [...enemies]){
    const distance=Math.hypot(player.x-enemy.x,player.z-enemy.z);
    enemy.attack-=dt;enemy.damageTime-=dt;enemy.health.visible=enemy.damageTime>0;
    let tx=player.x,tz=player.z;
    if(distance>2.2){const node=gridIndex(enemy.x,enemy.z);let value=Infinity;
      for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
        const x=node.x+dx,z=node.z+dz;if(x<0||x>=44||z<0||z>=44)continue;
        const v=flow[z*44+x];if(v>=0&&v<value&&canStand(x-21.5,z-21.5,.42)){value=v;tx=x-21.5;tz=z-21.5}
      }
    }
    if(distance>1.1){const d=Math.hypot(tx-enemy.x,tz-enemy.z);if(d>.05){const speed=(enemy.elite?1.7:1.35)+Math.min(wave,12)*.075;move(enemy,(tx-enemy.x)/d*dt*speed,(tz-enemy.z)/d*dt*speed,.4)}}
    // Lightweight separation prevents Raiders occupying exactly the same space.
    for(const other of enemies){if(other===enemy)continue;const dx=enemy.x-other.x,dz=enemy.z-other.z,d=Math.hypot(dx,dz);if(d>.01&&d<.8)move(enemy,dx/d*dt*.45,dz/d*dt*.45,.4)}
    enemy.model.position.set(enemy.x,Math.sin(elapsed*5+enemy.phase)*.025,enemy.z);
    enemy.model.rotation.y=Math.atan2(player.x-enemy.x,player.z-enemy.z);
    const stride=distance>1.1?Math.sin(elapsed*8+enemy.phase)*.45:0;
    enemy.model.userData.legs.forEach((leg,i)=>leg.rotation.x=stride*(i?1:-1));
    enemy.model.userData.arms.forEach((arm,i)=>arm.rotation.x=distance<1.7?-1.15:stride*(i?-1:1)*.7);
    if(enemy.model.userData.spinner)enemy.model.userData.spinner.rotation.y+=dt*9;
    if(distance<1.5&&enemy.attack<=0&&invincible<=0&&player.y<.9){
      player.hp=Math.max(0,player.hp-(enemy.elite?18:10));enemy.attack=.8;invincible=.35;audio.damage();$('damage-flash').style.opacity='.45';
      if(player.hp<=0){die();break}
    }
  }
  if(enemies.length===0){nextWave+=dt;if(nextWave<dt*1.5){notice('WAVE CLEAR / +10 SHIELD',2);player.hp=Math.min(100,player.hp+10)}if(nextWave>3){nextWave=0;spawnWave()}}
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){removeEffect(e);effects.splice(i,1);continue}if(e.velocity){e.velocity.y-=7*dt;e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.rotation.x+=dt*4;e.mesh.rotation.z+=dt*3;e.mesh.scale.setScalar(Math.max(.01,e.life/e.total)*.08)}else e.mesh.material.opacity=e.life/e.total}
  $('crosshair').classList.toggle('hit',hitTime>0);$('crosshair').classList.toggle('aiming',aim);
  $('damage-flash').style.opacity=String(Math.max(0,Number($('damage-flash').style.opacity||0)-dt*2));
  syncHUD();
}
function render(dt){
  if(!renderer)return;
  for(const model of arena.animated){model.rotation.y+=dt*.45;model.position.y+=Math.sin(clock*1.5)*dt*.06}
  arena.portals.forEach((portal,i)=>{portal.children[0].rotation.z=clock*.25+i;portal.children[1].material.opacity=.18+Math.sin(clock*2+i)*.05});
  if(weaponModel){
    const bob=mode==='playing'&&(keys.w||keys.s||keys.a||keys.d)?Math.sin(elapsed*10)*.009:0;
    const targetX=aim?0:.24,targetY=aim?[-.155,-.133,-.095][weaponIndex]:-.25;
    weaponModel.position.x=THREE.MathUtils.damp(weaponModel.position.x,targetX,12,dt);
    weaponModel.position.y=targetY+bob-(reloadTime>0?.16+Math.sin(reloadTime*5)*.05:0)-swapTime*.6;
    weaponModel.position.z=-.8+recoil;weaponModel.rotation.set(recoil*.8,reloadTime>0?-.35:0,reloadTime>0?-.45:Math.sin(clock*1.7)*.008);
    weaponModel.userData.flash.visible=mode==='playing'&&flashTime>0;weaponModel.userData.flash.rotation.z=clock*40;weaponModel.userData.light.intensity=flashTime>0?2:0;
  }
  renderer.autoClear=true;renderer.render(scene,camera);renderer.autoClear=false;renderer.clearDepth();renderer.render(weaponScene,weaponCamera);
}
function loop(t){
  const dt=Math.min((t-last)/1000,.04);last=t;
  if(mode==='playing'){clock+=dt;update(dt);render(dt)}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// A read-only status surface for diagnostics; gameplay state remains internal.
window.raiderStatus=()=>({mode,engine:'Three.js WebGL 3D',wave,score,kills,health:player.hp,enemies:enemies.length,weapon:weapons[weaponIndex].name,ammo:ammo[weaponIndex],reloading:reloadTime>0,position:{x:player.x,y:player.y,z:player.z},renderer:renderer?.info.render});
