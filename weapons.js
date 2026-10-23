import * as THREE from './vendor/three.module.min.js';
import {box,material} from './world.js';

export const weapons = [
  {name:'PULSE BLASTER',short:'BLASTER',damage:26,pellets:1,spread:.004,range:55,cooldown:.24,capacity:16,reload:1.1,recoil:.045,color:0xb39ad6},
  {name:'VIBE RIFLE',short:'RIFLE',damage:16,pellets:1,spread:.014,range:65,cooldown:.095,capacity:30,reload:1.6,recoil:.025,color:0xe7a17e},
  {name:'BOOM SHOTGUN',short:'SHOTGUN',damage:12,pellets:8,spread:.11,range:18,cooldown:.82,capacity:6,reload:1.95,recoil:.11,color:0x89b6a5}
];
function barrel(parent,x,y,z,radius,length,color){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,12),material(color));mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh}
export function makeWeapon(index, skin) {
  const root=new THREE.Group(),gun=weapons[index],dark=0x324b42,cream=0xf2e9cf;
  const body=new THREE.Group();root.add(body);
  box(body,0,0,0,.2,.2,.4,gun.color);
  box(body,0,-.19,.09,.12,.25,.13,dark).rotation.x=-.22;
  box(body,0,.115,0,.14,.035,.32,cream);
  box(body,0,-.055,.23,.18,.16,.16,dark);
  box(body,0,-.02,.32,.22,.23,.07,gun.color);
  box(body,-.108,0,.02,.014,.07,.15,0xc4e78e,true);
  box(body,.108,0,.02,.014,.07,.15,0xc4e78e,true);
  let muzzle;
  if(index===0){
    box(body,0,.015,-.31,.16,.14,.23,cream);
    barrel(body,0,.015,-.46,.075,.14,dark);
    barrel(body,0,.015,-.535,.048,.015,0xc9f39e);
    box(body,0,.17,.04,.055,.09,.055,dark);
    box(body,0,.22,.035,.026,.02,.03,0xa8f2be,true);
    muzzle=new THREE.Vector3(0,.015,-.56);
  }else if(index===1){
    box(body,0,0,-.33,.16,.18,.36,gun.color);
    barrel(body,0,.015,-.65,.035,.38,dark);
    barrel(body,0,.015,-.85,.06,.08,dark);
    for(let i=0;i<5;i++)box(body,0,.11,-.2-i*.06,.18,.025,.022,cream);
    box(body,0,-.22,-.1,.1,.3,.16,dark).rotation.x=.14;
    for(const x of [-.055,.055])box(body,x,.19,.03,.015,.12,.04,dark);
    box(body,0,.245,.03,.12,.015,.04,dark);box(body,0,.135,.03,.12,.015,.04,dark);
    box(body,0,.19,.008,.008,.008,.008,0xf3a38a,true);
    box(body,0,-.06,.4,.16,.12,.23,gun.color);box(body,0,-.06,.53,.23,.23,.07,dark);
    muzzle=new THREE.Vector3(0,.015,-.9);
  }else{
    for(const x of [-.065,.065]){barrel(body,x,.025,-.46,.053,.65,dark);barrel(body,x,.025,-.79,.041,.02,0x172d26)}
    box(body,0,-.09,-.38,.21,.14,.22,gun.color);
    for(let i=0;i<5;i++)box(body,0,-.16,-.29-i*.04,.22,.025,.017,cream);
    box(body,0,.13,-.58,.027,.05,.025,0xf0b579,true);
    box(body,.115,0,.06,.025,.12,.22,dark);
    for(let i=0;i<3;i++)barrel(body,.14,-.01,-.01+i*.06,.018,.045,0xe8c45c).rotation.x=0;
    muzzle=new THREE.Vector3(0,.025,-.83);
  }
  // Hands, sleeves, and trigger guard stay attached to the view model.
  box(body,0,-.22,.19,.19,.2,.19,0xccaa84).rotation.x=-.25;
  box(body,.025,-.36,.32,.22,.25,.28,skin).rotation.x=-.6;
  box(body,-.12,-.14,index===0?-.18:-.36,.18,.13,.19,0xccaa84);
  box(body,-.24,-.25,index===0?-.04:-.22,.2,.18,.33,skin).rotation.y=-.4;
  box(body,.09,-.14,0,.025,.14,.18,dark);
  const flash=new THREE.Mesh(new THREE.OctahedronGeometry(.1),new THREE.MeshBasicMaterial({color:0xffed9c,transparent:true,opacity:.9}));
  flash.position.copy(muzzle);flash.scale.set(1,1,2);flash.visible=false;body.add(flash);
  const light=new THREE.PointLight(0xffdc88,0,3);light.position.copy(muzzle);body.add(light);
  root.userData={body,muzzle,flash,light};return root;
}
