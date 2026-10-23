import * as THREE from './vendor/three.module.min.js';

const cube = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map();
export function material(color, glow = false) {
  const key = color + ':' + glow;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness: .65, metalness: .12, emissive: glow ? color : 0x000000, emissiveIntensity: glow ? .7 : 0}));
  return materials.get(key);
}
export function box(parent, x, y, z, w, h, d, color, glow = false) {
  const mesh = new THREE.Mesh(cube, material(color, glow));
  mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
  mesh.castShadow = !glow; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
export const crew = [
  {id:'123',name:'Cloud Captain',file:'viber-123',alt:'Lavender Viber with cream cap and blue eyes',body:0x9682bf,accent:0x91b4ff,hat:0xeee9d8},
  {id:'010',name:'Mint Condition',file:'viber-10',alt:'Green Viber with turquoise glasses and a cap',body:0x388978,accent:0x82e0ca,hat:0x416c4c},
  {id:'042',name:'Orange Crush',file:'viber-42',alt:'Orange Viber with green hat and turquoise eyes',body:0xe79c53,accent:0x7be0c8,hat:0x628b53},
  {id:'048',name:'Propeller Head',file:'viber-48',alt:'Teal Viber with propeller hat and mint glasses',body:0x3d9891,accent:0xb6f094,hat:0x56647c}
];
// Original voxel interpretations of the collection portraits, built from real 3D meshes.
export function makeRaider(index, elite = false) {
  const c = crew[index], model = new THREE.Group();
  box(model,0,.88,0,.64,.62,.42,c.body);
  box(model,0,1.52,0,1,.8,.74,c.body);
  box(model,0,1.48,.39,.98,.45,.1,0x263533);
  for (const x of [-.25,.25]) box(model,x,1.55,.46,.28,.15,.12,c.accent,true);
  box(model,0,1.31,.48,.31,.12,.1,c.hat);
  box(model,0,.94,.24,.35,.29,.1,c.accent,true);
  box(model,0,.65,.25,.57,.1,.13,c.hat);
  const arms = [], legs = [];
  for (const side of [-1,1]) {
    const arm = new THREE.Group(); arm.position.set(side*.46,1.08,0);
    box(arm,0,-.19,0,.19,.48,.24,c.hat); box(arm,0,-.46,.01,.23,.15,.27,0xba9b73);
    model.add(arm); arms.push(arm);
    const leg = new THREE.Group(); leg.position.set(side*.21,.59,0);
    box(leg,0,-.2,0,.26,.42,.28,0x354348); box(leg,0,-.47,.06,.29,.17,.4,c.body);
    model.add(leg); legs.push(leg);
  }
  let spinner;
  if(index===0){box(model,0,1.98,0,.83,.25,.7,c.hat);box(model,0,2.17,0,.18,.17,.17,c.hat)}
  if(index===1){box(model,0,1.98,0,1.03,.18,.8,c.hat);box(model,0,1.9,.35,1.12,.08,.43,c.hat);for(const x of [-.25,.25]){box(model,x,1.55,.47,.4,.34,.09,c.accent);box(model,x,1.55,.53,.25,.2,.04,0xe6eddb)}}
  if(index===2){for(const x of [-.33,.33]){box(model,x,2.08,0,.15,.45,.15,c.hat);box(model,x,2.31,0,.22,.19,.22,0xeee9d8)}}
  if(index===3){box(model,0,1.98,0,.85,.15,.77,c.hat);box(model,0,2.12,0,.1,.2,.1,c.hat);spinner=new THREE.Group();spinner.position.y=2.23;box(spinner,0,0,0,1.1,.05,.13,0xece9db);box(spinner,0,0,0,.13,.05,1.1,0xece9db);model.add(spinner)}
  if(elite){box(model,0,1.94,-.4,.85,.13,.12,0xffd376,true);model.scale.setScalar(1.18)}
  model.userData={arms,legs,spinner,index};
  return model;
}

// Classic open-grid arena. Textured surfaces stay visually simple so the
// animated Raiders remain the focus; the earlier maze pattern is preserved.
function concreteTexture(tile = false) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(512,512);
  let seed=17431;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const pore=random(),grain=(random()-.5)*19;
    const mottling=Math.sin(x*.024)*Math.cos(y*.031)*2+Math.sin((x+y)*.008)*1.5;
    const v=Math.max(0,Math.min(255,220+grain+mottling-(pore>.994?40:0)));
    const i=(y*512+x)*4;image.data[i]=v;image.data[i+1]=v;image.data[i+2]=v;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  for(let i=0;i<100;i++){
    const x=random()*512,y=random()*512;ctx.strokeStyle=`rgba(75,71,61,${random()*.035})`;ctx.lineWidth=random()*2+.3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*70-35,y+random()*9-4);ctx.stroke();
  }
  if(tile){
    ctx.fillStyle='#77756e';ctx.fillRect(0,0,512,2);ctx.fillRect(0,0,2,512);
    ctx.fillStyle='#f0efdf';ctx.fillRect(2,2,510,1);ctx.fillRect(2,2,1,510);
    ctx.strokeStyle='rgba(97,93,80,.10)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(438,0);ctx.lineTo(433,12);ctx.lineTo(440,18);ctx.lineTo(435,28);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
export function makeArena(scene,mobile){
  const colliders=[],solidMeshes=[],animated=[],portals=[];
  scene.background=new THREE.Color(0xc4e1e8);scene.fog=new THREE.Fog(0xd7e5df,35,90);
  scene.add(new THREE.HemisphereLight(0xeaf5ff,0xc8bda2,1.8));
  const sun=new THREE.DirectionalLight(0xfff2db,3.1);sun.position.set(-16,25,14);sun.castShadow=true;
  sun.shadow.mapSize.set(mobile?512:2048,mobile?512:2048);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun);
  const wallTexture=concreteTexture(),floorTexture=concreteTexture(true);
  function surface(texture,color,w,h){
    const map=texture.clone();map.repeat.set(w,h);map.needsUpdate=true;
    const bump=map.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
    return new THREE.MeshStandardMaterial({color,map,bumpMap:bump,bumpScale:.007,roughness:.91,metalness:0});
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(44,44),surface(floorTexture,0xeee2bf,22,22));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);solidMeshes.push(floor);
  function solid(x,z,w,d,h,color){
    const mesh=new THREE.Mesh(cube,surface(wallTexture,color,Math.max(w,d)/2.5,h/2.5));mesh.position.set(x,h/2,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);solidMeshes.push(mesh);colliders.push({x,z,w:w/2,d:d/2});return mesh;
  }
  // The original square perimeter and colourful wall bands, with concrete grain.
  const colors=[0x9bc3ab,0xbaacd6,0xe6b093,0xe2cf96];
  for(let side=0;side<4;side++)for(let segment=0;segment<8;segment++){
    const along=-19.25+segment*5.5,color=colors[(segment+side)%4];
    const x=side<2?along:(side===2?-22.5:22.5),z=side<2?(side===0?-22.5:22.5):along;
    const w=side<2?5.5:1,d=side<2?1:5.5;
    solid(x,z,w,d,3,color);
    box(scene,x,3.035,z,w+.025,.07,d+.025,0xf3ebd7);
    box(scene,x,.16,z,w+.015,.12,d+.015,0xc1bda9);
    box(scene,x,2.4,z,w+.02,.035,d+.02,0xece3cf);
  }
  // Original 16×16 map: four double-cell cover columns, with an open centre.
  // Column 3/12 and row 3–4/11–12, scaled to the current playable footprint.
  const cell=44/14;
  for(const [col,row,color] of [[3,3.5,0x9bc3ab],[12,3.5,0xbaacd6],[3,11.5,0xe6b093],[12,11.5,0xe2cf96]]){
    const x=(col-7.5)*cell,z=(row-7.5)*cell;
    solid(x,z,cell,cell*2,2.65,color);
    box(scene,x,2.69,z,cell+.06,.08,cell*2+.06,0xf1e9d6);
    box(scene,x,.12,z,cell+.035,.16,cell*2+.035,0xc4baa1);
  }
  scene.traverse(object=>{if(object.isMesh&&!solidMeshes.includes(object))solidMeshes.push(object)});
  return {colliders,solidMeshes,animated,portals};
}
