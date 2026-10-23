import * as THREE from './vendor/three.module.min.js';
import {box,material} from './world.js';

function seeded(seed=8723){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
export function isPath(x,z){return Math.abs(x)<1.65||Math.abs(z-9)<1.05||Math.abs(z+9)<1.05||Math.abs(x)>20||Math.abs(z)>20}
export function gardenGround(){
  const size=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(size,size),random=seeded();
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const wx=(x/size-.5)*44,wz=(y/size-.5)*44;
    const edge=(Math.sin(wx*2.7)+Math.cos(wz*3.6))*.12;
    const path=Math.abs(wx)<1.55+edge||Math.abs(wz-9)<1+edge||Math.abs(wz+9)<1+edge||Math.abs(wx)>20+edge||Math.abs(wz)>20+edge;
    const noise=(random()-.5)*32+Math.sin(x*.03)*Math.cos(y*.05)*7;
    const c=path?[187,157,103]:[91,143,54],i=(y*size+x)*4;
    image.data[i]=c[0]+noise;image.data[i+1]=c[1]+noise;image.data[i+2]=c[2]+noise*.7;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  for(let i=0;i<6500;i++){
    const x=random()*size,y=random()*size,wx=(x/size-.5)*44,wz=(y/size-.5)*44;
    if(!isPath(wx,wz))continue;
    ctx.fillStyle=random()>.4?'#76633c45':'#f2ddb780';ctx.beginPath();ctx.ellipse(x,y,random()*1.6+.3,random()*.9+.3,random()*3,0,Math.PI*2);ctx.fill();
  }
  // Worn paving at the entry, with irregular mossy borders instead of a sterile grid.
  for(let row=0;row<5;row++)for(let col=0;col<2;col++){
    const x=size/2-34+col*35,y=size*.60+row*37;
    ctx.fillStyle=['#b9b59e','#b5b49e','#c5bea5'][(row+col)%3];ctx.fillRect(x+random()*3,y,32,33);
    ctx.strokeStyle='#797e6655';ctx.strokeRect(x+1,y+1,30,31);
    for(let j=0;j<25;j++){ctx.fillStyle='#76815d40';ctx.fillRect(x+random()*30,y+random()*32,1,1)}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
function skyTexture(){
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const ctx=canvas.getContext('2d'),random=seeded(442);
  const gradient=ctx.createLinearGradient(0,0,0,1024);gradient.addColorStop(0,'#498dc8');gradient.addColorStop(.45,'#95cdeb');gradient.addColorStop(.57,'#daebdf');gradient.addColorStop(1,'#d9e4c3');ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,1024);
  for(let i=0;i<28;i++){
    const x=random()*2048,y=210+random()*270,s=16+random()*26;
    for(let j=0;j<5;j++){
      const cloud=ctx.createRadialGradient(x+j*s*.6,y-s*.2*Math.sin(j),0,x+j*s*.6,y,s);
      cloud.addColorStop(0,'#ffffff75');cloud.addColorStop(.5,'#fffdf045');cloud.addColorStop(1,'#ffffff00');ctx.fillStyle=cloud;ctx.fillRect(x+j*s*.6-s,y-s,s*2,s*2);
    }
  }
  const texture=new THREE.CanvasTexture(canvas);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function addGarden(scene,mobile,colliders){
  const random=seeded(9121),animated=[];const existing=new Set();scene.traverse(object=>existing.add(object));
  scene.background=skyTexture();
  const blocked=(x,z)=>colliders.some(c=>Math.abs(x-c.x)<c.w+.25&&Math.abs(z-c.z)<c.d+.25);
  // Thousands of individually lit blades in one draw call; no grass colliders.
  const blade=new THREE.BufferGeometry();
  blade.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,.012,.17,.015,0,.27,.035,0,0,-.035,0,0,.035,.015,.17,.012,.035,.27,0],3));
  blade.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);blade.computeVertexNormals();
  const count=mobile?5000:13500,grass=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide}),count);
  const dummy=new THREE.Object3D(),color=new THREE.Color();let used=0;
  for(let i=0;i<count*2&&used<count;i++){
    const x=(random()-.5)*43,z=(random()-.5)*43;if(isPath(x,z)||blocked(x,z))continue;
    dummy.position.set(x,.002,z);dummy.rotation.set(0,random()*Math.PI,0);dummy.scale.setScalar(.55+random()*.8);dummy.updateMatrix();grass.setMatrixAt(used,dummy.matrix);color.setHSL(.25+random()*.07,.6+random()*.23,.19+random()*.1);grass.setColorAt(used++,color);
  }
  grass.count=used;grass.receiveShadow=true;grass.frustumCulled=false;scene.add(grass);
  const flowerCount=mobile?250:800,flowerGeometry=new THREE.SphereGeometry(.045,5,3);
  const flowers=new THREE.InstancedMesh(flowerGeometry,material(0xffffff),flowerCount);used=0;
  for(let i=0;i<flowerCount*3&&used<flowerCount;i++){
    const x=(random()-.5)*43,z=(random()-.5)*43;if(isPath(x,z)||blocked(x,z))continue;
    dummy.position.set(x,.13+random()*.12,z);dummy.rotation.set(0,0,0);dummy.scale.set(1.5,.4,1.5);dummy.updateMatrix();flowers.setMatrixAt(used,dummy.matrix);flowers.setColorAt(used++,new THREE.Color(random()>.45?0xfff9d5:0xf2cf59));
  }
  flowers.count=used;scene.add(flowers);
  const stones=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.11,0),material(0xa5a38c),100);
  for(let i=0;i<100;i++){dummy.position.set((random()>.5?1:-1)*(1.6+random()*.5),.035,(random()-.5)*40);dummy.rotation.set(random(),random(),random());dummy.scale.set(1+random(),.45,1);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix)}scene.add(stones);
  // Moss patches on the existing cover bases and walls preserve collision geometry.
  for(const c of colliders){if(Math.max(c.w,c.d)>10)continue;
    for(let i=0;i<3;i++){const patch=box(scene,c.x+(random()-.5)*c.w, .04+random()*.16,c.z+c.d+.012,.25+random()*.5,.12+random()*.16,.025,0x6f9153);patch.castShadow=false}
  }
  // Small hanging ivy accents on the four existing cover blocks.
  for(const c of colliders){if(c.w>2||c.d<2)continue;
    for(let i=0;i<18;i++){
      const y=2.66-i*.065,x=c.x+c.w-.18+Math.sin(i*.8)*.1;
      const leaf=box(scene,x,y,c.z+c.d+.022,.13+random()*.09,.075,.04,i%2?0x73964e:0x86a75c);leaf.rotation.z=(random()-.5)*.8;leaf.castShadow=false;
    }
  }
  // Boundary fence and distant scenery sit beyond the playable square.
  for(const z of [-23.4,23.4])for(let x=-23;x<=23;x+=3){box(scene,x,3.35,z,.14,1,.14,0x9b7948);box(scene,x,3.32,z,3,.11,.1,0xb28d53);box(scene,x,3.7,z,3,.11,.1,0xb28d53)}
  for(const x of [-23.4,23.4])for(let z=-23;z<=23;z+=3){box(scene,x,3.35,z,.14,1,.14,0x9b7948);box(scene,x,3.32,z,.1,.11,3,0xb28d53);box(scene,x,3.7,z,.1,.11,3,0xb28d53)}
  const foliageGeo=new THREE.IcosahedronGeometry(1,1);
  for(let i=0;i<(mobile?14:22);i++){
    const a=i*Math.PI*2/(mobile?14:22),distance=28+random()*7,x=Math.sin(a)*distance,z=Math.cos(a)*distance;
    if(Math.hypot(x+9,z+34)<6||Math.hypot(x-11,z+31)<6)continue;
    box(scene,x,2.7,z,.7,5.4,.7,0x87704b);
    for(let j=0;j<3;j++){const crown=new THREE.Mesh(foliageGeo,material(j===0?0x668f45:j===1?0x7eaa50:0x92b85c));crown.position.set(x+(j-1)*1.1,5.4+j*.8,z);crown.scale.set(2.6,2.5,2.6);crown.castShadow=true;scene.add(crown)}
  }
  for(let i=0;i<10;i++){const hill=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),material(i%2?0x8bb16b:0x729f58));const a=i*Math.PI/5;hill.position.set(Math.sin(a)*48,-1,Math.cos(a)*48);hill.scale.set(12,7+random()*4,12);scene.add(hill)}
  function roof(parent,w,d,y,color){
    const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,w*.4);shape.lineTo(w/2,0);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});const mesh=new THREE.Mesh(geometry,material(color));mesh.position.set(0,y,-d/2);mesh.castShadow=true;parent.add(mesh);
  }
  function cottage(x,z,scale=1){
    const home=new THREE.Group();home.position.set(x,0,z);home.scale.setScalar(scale);scene.add(home);
    box(home,0,2.6,0,6,5.2,5,0xeee6c9);roof(home,7,6,5.2,0x8a9d61);
    for(const px of [-2.9,0,2.9])box(home,px,2.6,2.54,.18,5.2,.15,0x7c6041);
    for(const y of [.3,2.8,5.2])box(home,0,y,2.56,6,.18,.18,0x876443);
    box(home,0,1.2,2.6,1.1,2.4,.15,0x786045);
    for(const px of [-1.8,1.8]){box(home,px,3.9,2.62,1,.95,.12,0x5c7c75);box(home,px,3.9,2.71,.07,.95,.04,0xe5d6a9);box(home,px,3.9,2.71,1,.07,.04,0xe5d6a9)}
    roof(home,3,2,2.6,0xc28a5a);box(home,-1.3,1.3,3.4,.15,2.6,.15,0x967448);box(home,1.3,1.3,3.4,.15,2.6,.15,0x967448);
    const beam=box(home,-1.45,4,2.65,.13,3.1,.12,0x876443);beam.rotation.z=-.65;
    box(home,2,7,0,.7,2,.7,0xb29879);
  }
  cottage(11,-31,1.15);cottage(-29,7,.9);cottage(30,13,.85);
  const mill=new THREE.Group();mill.position.set(-9,0,-34);scene.add(mill);
  box(mill,0,5,0,3.4,10,3.4,0xe9dec1);roof(mill,4.5,4.2,10,0x8a9d61);
  for(const x of [-1.65,1.65])box(mill,x,5,1.74,.15,10,.13,0x8a6846);
  const blades=new THREE.Group();blades.position.set(0,8,1.95);mill.add(blades);
  for(let i=0;i<4;i++){
    const sail=new THREE.Group();sail.rotation.z=i*Math.PI/2;blades.add(sail);
    box(sail,0,2.6,0,.16,5,.13,0x96734b);box(sail,.45,3.2,.01,.8,3,.07,0xeee5c8);
    for(let j=0;j<5;j++)box(sail,.45,1.8+j*.68,.08,.9,.055,.06,0x987647);
  }
  box(blades,0,0,.15,.5,.5,.4,0xa9bb6d);blades.userData.rotationAxis='z';blades.userData.rotationSpeed=.22;animated.push(blades);
  // Batch static repeated scenery into instanced draws, including fences and foliage.
  scene.updateMatrixWorld(true);const batches=new Map();
  scene.traverse(object=>{
    if(existing.has(object)||!object.isMesh||object.isInstancedMesh)return;
    for(let parent=object;parent;parent=parent.parent)if(animated.includes(parent))return;
    const key=object.geometry.uuid+':'+object.material.uuid+':'+object.castShadow;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(object);
  });
  for(const meshes of batches.values()){
    if(meshes.length<2)continue;
    const first=meshes[0],batch=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);
    meshes.forEach((mesh,index)=>{batch.setMatrixAt(index,mesh.matrixWorld);mesh.removeFromParent()});
    batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;scene.add(batch);
  }
  return {animated,grassCount:grass.count,flowerCount:flowers.count};
}
