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

export function makeArena(scene, mobile) {
  const colliders=[], solidMeshes=[], animated=[], portals=[];
  function solid(x,z,w,d,h,color){const mesh=box(scene,x,h/2,z,w,h,d,color);solidMeshes.push(mesh);colliders.push({x,z,w:w/2,d:d/2});return mesh}
  scene.background=new THREE.Color(0xb9e0ec);
  scene.fog=new THREE.Fog(0xc9e5df,28,72);
  const hemisphere=new THREE.HemisphereLight(0xf5fbff,0xc0ba8d,2.5);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(0xfff3d7,3.2);sun.position.set(-14,25,12);sun.castShadow=true;
  sun.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;sun.shadow.normalBias=.035;scene.add(sun);
  const floor=new THREE.InstancedMesh(cube,material(0xece2bd),22*22);const m=new THREE.Matrix4();let n=0;
  for(let x=-21;x<=21;x+=2)for(let z=-21;z<=21;z+=2){m.compose(new THREE.Vector3(x,-.12,z),new THREE.Quaternion(),new THREE.Vector3(1.98,.2,1.98));floor.setMatrixAt(n,m);floor.setColorAt(n++,new THREE.Color((Math.abs(x)<5||Math.abs(z)<5)?0xf0e7d0:(Math.floor((x+z)/2)%2?0xe4d8b4:0xeaddbf)))}
  floor.receiveShadow=true;scene.add(floor);solidMeshes.push(floor);
  for(const [x,z,w,d,color] of [[0,-22.5,46,1,0xb9a5d8],[0,22.5,46,1,0x8dbfa6],[-22.5,0,1,44,0xe6a07f],[22.5,0,1,44,0xe6cb84]]){
    solid(x,z,w,d,3,color);box(scene,x,3.05,z,w+.08,.12,d+.08,0xf8f0d6);
  }
  for(const x of [-19,-11,-3,5,13,21])for(const z of [-22.5,22.5]){box(scene,x,2.1,z,.16,1.4,1.08,0xffffff);box(scene,x,3.45,z,.32,.6,.32,0x7fa491)}
  // Central garden: rounded canopy, sculptural crystal, and waist-high cover.
  solid(0,0,4,4,.75,0xb1cbb1);box(scene,0,.8,0,3.65,.12,3.65,0x7ca78d);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.95),material(0xa48ad3));crystal.position.set(0,2.1,0);crystal.castShadow=true;scene.add(crystal);animated.push(crystal);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.45,.045,8,36),material(0xf2c16c,true));ring.rotation.x=Math.PI/2;ring.position.set(0,1.4,0);scene.add(ring);animated.push(ring);
  // Colour-block cover islands, archways, and trees give the arena depth and sight lines.
  for(const [x,z,c] of [[-8,-7,0xb7a4d3],[8,-7,0xe6a080],[-8,7,0x8fbfa4],[8,7,0xe3c67c]]){
    solid(x,z,2.8,2.8,1.25,c);box(scene,x,1.33,z,2.95,.16,2.95,0xf6eed5);
    solid(x+1.8,z-1.9,1.2,1.2,2.5,c);box(scene,x+1.8,2.6,z-1.9,1.32,.14,1.32,0xf6eed5);
  }
  for(const [x,z,c] of [[-15,0,0xb39ad4],[15,0,0xe6a080],[0,-15,0x8cbba1],[0,15,0xe2c67e]]){
    const sideways=x!==0;
    for(const sign of [-1,1])solid(x+(sideways?0:sign*2.4),z+(sideways?sign*2.4:0),.7,.7,4.8,c);
    box(scene,x,4.8,z,sideways?.9:5.5,.5,sideways?5.5:.9,c);
    box(scene,x,4.47,z,sideways?.35:4.5,.08,sideways?4.5:.35,0xf5e5ac,true);
  }
  for(const [x,z] of [[-18,-9],[18,-9],[-18,9],[18,9],[-10,-18],[10,18]]){
    solid(x,z,1,1,1.15,0xe4aa88);box(scene,x,1.4,z,.3,1.8,.3,0x92765b);
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,0),material(0x91b889));leaves.position.set(x,3,z);leaves.castShadow=true;scene.add(leaves);
  }
  // Portals mark the four enemy entry points.
  for(const [x,z] of [[-17,-17],[17,-17],[-17,17],[17,17]]){
    const portal=new THREE.Group();portal.position.set(x,0,z);
    const torus=new THREE.Mesh(new THREE.TorusGeometry(1.25,.16,8,32),material(0xb99ce6));torus.position.y=1.5;portal.add(torus);
    const center=new THREE.Mesh(new THREE.CircleGeometry(1.17,32),new THREE.MeshBasicMaterial({color:0xbda8e9,transparent:true,opacity:.22,side:THREE.DoubleSide}));center.position.y=1.5;portal.add(center);portal.lookAt(0,0,0);
    scene.add(portal);portals.push(portal);box(scene,x,.05,z,3,.15,3,0xd1bce9);
  }
  // Sky islands and soft voxel clouds sit beyond the playable boundary.
  for(let i=0;i<10;i++){const a=i*Math.PI/5,x=Math.sin(a)*39,z=Math.cos(a)*39;box(scene,x,2,z,6,3,6,i%2?0xaac49b:0xb7a6d3);box(scene,x,3.6,z,6.3,.4,6.3,0xd1dca4);box(scene,x,12+i%3*2,z,6,1.1,2.5,0xf1f4e8);box(scene,x+1.7,12.6+i%3*2,z,3,1.4,2.3,0xf1f4e8)}
  scene.traverse(object=>{if(object.isMesh&&!object.material.transparent&&!solidMeshes.includes(object))solidMeshes.push(object)});
  return {colliders,solidMeshes,portals,animated};
}
