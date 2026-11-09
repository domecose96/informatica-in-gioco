/* Città WebGL locale. Nessuna risorsa di rete richiesta durante il gioco. */
(function(root){
'use strict';
root.RZCity = function(host, markers, onEnter){
  const buildings=RZData.buildings;
  let engine=null;
  const buttons=new Map(),leaders=new Map(),discovered=new Set(['school']);
  const ns='http://www.w3.org/2000/svg',leaderLayer=document.createElementNS(ns,'svg');leaderLayer.classList.add('marker-leaders');leaderLayer.setAttribute('aria-hidden','true');markers.append(leaderLayer);
  buildings.forEach(site=>{
    const button=document.createElement('button');
    button.type='button';button.className='city-marker '+site.kind;button.dataset.building=site.id;
    button.innerHTML='<span class="marker-symbol" aria-hidden="true"></span><span class="marker-copy"><strong></strong><small></small></span><span class="marker-arrow" aria-hidden="true">↗</span>';
    button.querySelector('strong').textContent=site.label;
    button.querySelector('.marker-symbol').textContent={school:'01',hq:'HQ',hospital:'02',rescue:'03',townhall:'04'}[site.id];
    button.hidden=site.id!=='school';button.addEventListener('click',()=>{if(!discovered.has(site.id))return;engine?.travel(site.id);onEnter(site.id);});
    const line=document.createElementNS(ns,'line');leaderLayer.append(line);leaders.set(site.id,line);markers.append(button);buttons.set(site.id,button);
  });
  function fallback(){
    host.hidden=true;leaderLayer.style.display='none';markers.classList.add('flat');document.getElementById('map-fallback').hidden=false;
    document.querySelector('.navigation-tools').hidden=true;document.getElementById('compass-reset').hidden=true;document.querySelector('.map-instructions').hidden=true;
  }
  try {
    if(!root.THREE)throw new Error('Motore 3D non disponibile');
    const T=THREE, scene=new T.Scene();scene.background=new T.Color('#d0d6d1');scene.fog=new T.FogExp2('#d0d6d1',.0038);
    const {cameraLimits,createLayout}=RZSpatial,layout=createLayout(),treeCandidates=[];
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.7));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
    const camera=new T.PerspectiveCamera(43,1,.1,750);
    const hemi=new T.HemisphereLight(0xdaf3f5,0x668a79,1.9);scene.add(hemi);
    const sun=new T.DirectionalLight(0xffe4be,2.8);sun.position.set(-48,90,40);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:200});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun);
    const fill=new T.DirectionalLight(0xb5d4f3,1.2);fill.position.set(20,10,-15);scene.add(fill);
    const city=new T.Group();scene.add(city);
    const cache=new Map();
    function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness:.82,...extra}));return cache.get(key);}
    function box(parent,x,y,z,w,h,d,color,options={}){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color,options));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function cylinder(parent,x,y,z,r,h,color,segments=16,top=r){const mesh=new T.Mesh(new T.CylinderGeometry(top,r,h,segments),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function tree(x,z,size=1){treeCandidates.push({x,z,size});}
    function renderTree(x,z,size=1){const trunk=cylinder(city,x,.55,z,.10,.9,'#88765a',6);trunk.castShadow=false;const crown=new T.Mesh(new T.IcosahedronGeometry(.75*size,1),mat('#789b7c'));crown.position.set(x,1.4*size,z);crown.scale.y=1.3;city.add(crown);crown.castShadow=true;}
    // Una città estesa, con isolati abitati e cinque sole sedi operative.
    const roadsX=[-36,-15,15,36],roadsZ=[-29,-8,14,32];
    const riverX=z=>Math.sin(z*.09)*1.35;
    // L'area operativa è immersa in un tessuto urbano neutro, senza bordo del plastico.
    const contextRoadsX=[...roadsX],contextRoadsZ=[...roadsZ];
    for(let v=57;v<210;v+=21)contextRoadsX.push(-v,v);
    for(let v=50;v<180;v+=18)contextRoadsZ.push(-v,v);
    const contextCanvas=document.createElement('canvas');contextCanvas.width=2048;contextCanvas.height=1770;const gc=contextCanvas.getContext('2d');
    const gx=x=>(x+215)/430*2048,gz=z=>(z+186)/372*1770;
    gc.fillStyle='#c6ccca';gc.fillRect(0,0,2048,1770);
    gc.fillStyle='#b2bab7';for(const x of contextRoadsX)gc.fillRect(gx(x-1.8),0,3.6/430*2048,1770);for(const z of contextRoadsZ)gc.fillRect(0,gz(z-1.8),2048,3.6/372*1770);
    const contextTexture=new T.CanvasTexture(contextCanvas);contextTexture.colorSpace=T.SRGBColorSpace;contextTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    const contextFloor=new T.Mesh(new T.PlaneGeometry(430,372),new T.MeshStandardMaterial({map:contextTexture,roughness:1}));contextFloor.rotation.x=-Math.PI/2;contextFloor.position.y=-.2;contextFloor.receiveShadow=true;city.add(contextFloor);
    const groundCanvas=document.createElement('canvas');groundCanvas.width=2048;groundCanvas.height=1736;
    const ctx=groundCanvas.getContext('2d'),sx=2048/92,sz=1736/78;
    const px=x=>(x+46)*sx,pz=z=>(z+39)*sz;
    ctx.fillStyle='#bdcbb4';ctx.fillRect(0,0,2048,1736);
    // Piazze e lotti: un fondale cartografico ad alta risoluzione, con ombre reali.
    for(let x=-45;x<44;x+=11)for(let z=-38;z<38;z+=11){ctx.fillStyle=(Math.round(x+z)%3===0)?'#b3c5a9':'#c5cdb6';ctx.fillRect(px(x),pz(z),10*sx,10*sz);}
    ctx.fillStyle='#d5d9c9';for(const x of roadsX)ctx.fillRect(px(x-2.2),0,4.4*sx,1736);for(const z of roadsZ)ctx.fillRect(0,pz(z-2.2),2048,4.4*sz);
    ctx.fillStyle='#6d8380';for(const x of roadsX)ctx.fillRect(px(x-1.5),0,3*sx,1736);for(const z of roadsZ)ctx.fillRect(0,pz(z-1.5),2048,3*sz);
    ctx.strokeStyle='#d2d8bc';ctx.lineWidth=1.2;ctx.setLineDash([14,18]);for(const x of roadsX){ctx.beginPath();ctx.moveTo(px(x),0);ctx.lineTo(px(x),1736);ctx.stroke();}for(const z of roadsZ){ctx.beginPath();ctx.moveTo(0,pz(z));ctx.lineTo(2048,pz(z));ctx.stroke();}ctx.setLineDash([]);
    ctx.fillStyle='#e5e4ce';for(const x of roadsX)for(const z of roadsZ){for(let i=0;i<5;i++){ctx.fillRect(px(x-1.15+i*.47),pz(z-2.5),.23*sx,.65*sz);ctx.fillRect(px(x-1.15+i*.47),pz(z+1.85),.23*sx,.65*sz);}}
    ctx.fillStyle='#869e8d';ctx.font='500 17px monospace';ctx.fillText('QUARTIERE GALILEI',px(-34),pz(-33));ctx.fillText('BORGO SAN LUCA',px(17),pz(-33));ctx.fillText('CENTRO STORICO',px(-34),pz(36));ctx.fillText('DISTRETTO EST',px(17),pz(36));
    const groundTexture=new T.CanvasTexture(groundCanvas);groundTexture.colorSpace=T.SRGBColorSpace;groundTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    const ground=new T.Mesh(new T.PlaneGeometry(92,78),new T.MeshStandardMaterial({map:groundTexture,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.13;ground.receiveShadow=true;city.add(ground);
    const riverShape=new T.Shape();for(let z=-39;z<=39;z+=1){const x=riverX(z)-2.5;if(z===-39)riverShape.moveTo(x,z);else riverShape.lineTo(x,z);}for(let z=39;z>=-39;z-=1)riverShape.lineTo(riverX(z)+2.5,z);riverShape.closePath();
    const river=new T.Mesh(new T.ShapeGeometry(riverShape),mat('#739fa3',{metalness:.15,roughness:.35}));river.rotation.x=Math.PI/2;river.position.y=-.08;river.material.side=T.DoubleSide;city.add(river);
    for(const z of roadsZ){const x=riverX(z);box(city,x,.02,z,8.7,.30,3.3,'#9bada6');box(city,x,.20,z-1.65,9,.34,.14,'#c9d1bc');box(city,x,.20,z+1.65,9,.34,.14,'#c9d1bc');box(city,x,.18,z,8.5,.035,2.95,'#6d8380');for(let i=-3;i<=3;i+=2)box(city,x+i,.21,z,.65,.02,.05,'#e0dec5');}
    function nearRoad(x,z,margin=3.6){return roadsX.some(v=>Math.abs(x-v)<margin)||roadsZ.some(v=>Math.abs(z-v)<margin);}
    function nearSite(x,z,margin=7){return buildings.some(b=>Math.abs(x-b.position[0])<margin&&Math.abs(z-b.position[1])<margin);}
    function roadRoute(start,end){
      const closest=(arr,value)=>arr.reduce((best,v)=>Math.abs(v-value)<Math.abs(best-value)?v:best,arr[0]);
      const startRoad=closest(roadsZ,start[1]),endRoad=closest(roadsZ,end[1]),crossRoad=closest(roadsX,end[0]);
      return [[start[0],start[1]],[start[0],startRoad],[crossRoad,startRoad],[crossRoad,endRoad],[end[0],endRoad],[end[0],end[1]]];
    }
    const groups=new Map(),rings=new Map(),beacons=new Map(),windows=new Map(),cables=new Map();
    function windowGrid(g,width,height,depth,rows,cols){const lit=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const x=(col-(cols-1)/2)*(width/(cols+.5)), y=.85+row*.85;
      lit.push(box(g,x,y,depth/2+.025,.42,.47,.045,'#66898e',{emissive:'#25424a',emissiveIntensity:.2}));
      lit.push(box(g,x,y,-depth/2-.025,.42,.47,.045,'#66898e',{emissive:'#25424a',emissiveIntensity:.2}));
    }return lit;}
    function roof(g,y,w,d,color){box(g,0,y,0,w,.22,d,color);box(g,0,y+.2,0,w-.35,.18,d-.35,color);}
    function cross(g,x,y,z,size,color){box(g,x,y,z,size,.10,size*.3,color);box(g,x,y,z,size*.3,.11,size,color);}
    buildings.forEach(site=>{
      const [x,z]=site.position,g=new T.Group();g.position.set(x,0,z);g.userData.siteId=site.id;city.add(g);groups.set(site.id,g);
      if(site.id!=='hq'){
        box(g,0,.04,0,8.1,.2,7.0,'#ced5c7');box(g,0,.17,2.9,8.3,.1,1.1,'#e4dfcc');
        const nearest=roadsZ.reduce((a,v)=>Math.abs(v-z)<Math.abs(a-z)?v:a,roadsZ[0]);
        box(city,x,-.03,(z+nearest)/2,1.3,.08,Math.abs(z-nearest),'#d4d8c4');
      }
      let labelHeight=5;
      if(site.id==='school'){
        box(g,-.8,1.45,0,5.4,2.55,3.5,'#e7cba1');box(g,2.5,.95,-.5,1.6,1.6,4.4,'#c79678');roof(g,2.84,5.8,3.9,'#668e8e');
        box(g,-.8,.85,1.81,1.05,1.4,.08,'#527b7c');box(g,-.8,2,1.9,1.4,.4,.09,'#edf0d6');
        windows.set(site.id,windowGrid(g,4.7,2.5,3.5,2,4));
        const clock=cylinder(g,-.8,2.75,2.04,.32,.08,'#f3eacb',24);clock.rotation.x=Math.PI/2;box(g,-.8,2.79,2.09,.035,.22,.03,'#44656b');
        box(g,1.9,.25,2.8,2.3,.12,1.2,'#a8bba3');cylinder(g,-3.2,1.6,2.5,.035,2.8,'#7b8984',6);box(g,-2.84,2.65,2.5,.7,.43,.05,'#89c4c0');labelHeight=4.6;
      }else if(site.id==='hospital'){
        box(g,0,1.8,0,6.5,3.3,3.6,'#e8dfc9');box(g,0,1,2.1,2.8,1.5,1.4,'#e7c8b3');roof(g,3.58,6.9,4,'#d9a18b');
        windows.set(site.id,windowGrid(g,5.7,3.3,3.6,3,6));box(g,0,1.1,2.84,1.25,1.7,.08,'#5b8e97');
        cylinder(g,1.6,3.93,0,1.18,.08,'#8a9f96',32);cross(g,1.6,4.02,0,1.2,'#edf0d9');
        box(g,0,3.07,1.88,1.1,.7,.1,'#e7e5d4');box(g,0,3.07,1.96,.5,.15,.08,'#ae665a');box(g,0,3.07,1.96,.15,.5,.09,'#ae665a');labelHeight=5.1;
      }else if(site.id==='rescue'){
        box(g,0,1.15,0,6.3,2,4.1,'#d8b66d');roof(g,2.28,6.6,4.5,'#a47d57');
        for(let i=-1;i<=1;i++){box(g,i*1.8,1,2.1,1.3,1.5,.08,'#466a70');for(let j=0;j<4;j++)box(g,i*1.8,.5+j*.3,2.16,1.28,.025,.02,'#91aaa5');}
        box(g,2,2.85,-.5,1.6,1.3,2,'#d9c8a3');windows.set(site.id,windowGrid(g,5.6,2,4.1,1,5));
        cylinder(g,-2.3,3.7,-1,.04,3,'#69827d',6);for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(.5+i*.2,.025,5,20),mat('#758d83'));ring.position.set(-2.3,4.45+i*.13,-1);ring.rotation.x=Math.PI/2;g.add(ring);}labelHeight=5.6;
      }else if(site.id==='townhall'){
        box(g,0,1.75,0,5.5,3,3.7,'#e2d8c2');roof(g,3.36,6.1,4.3,'#9b9ba3');box(g,0,.35,2.8,5.8,.3,1.8,'#c6c4b1');box(g,0,.55,2.55,5.5,.18,1.5,'#e4dfcd');
        for(let i=0;i<5;i++)cylinder(g,-2+i,1.7,2.2,.13,2.1,'#e9dfc8',12);
        box(g,0,2.88,2.2,5.6,.28,.7,'#e2d7bd');box(g,0,.95,1.91,1.2,1.5,.1,'#59747c');windows.set(site.id,windowGrid(g,4.7,3,3.7,3,5));
        const roofGeo=new T.ConeGeometry(3.6,1,4);const roofMesh=new T.Mesh(roofGeo,mat('#90939c'));roofMesh.rotation.y=Math.PI/4;roofMesh.scale.z=.78;roofMesh.position.y=4.04;g.add(roofMesh);roofMesh.castShadow=true;labelHeight=5.5;
      }else{
        cylinder(g,0,.37,0,1.65,.4,'#d8ddc9',32);box(g,0,1.45,0,2.7,2,2.5,'#517b7e');roof(g,2.56,3.05,2.85,'#c2d6c4');
        windows.set(site.id,windowGrid(g,2.3,2,2.5,2,3));cylinder(g,.65,3.5,-.5,.055,1.8,'#819e92',6);const dish=new T.Mesh(new T.SphereGeometry(.48,16,8,0,Math.PI),mat('#d0dfd7'));dish.position.set(.65,4.2,-.5);dish.rotation.z=-.4;g.add(dish);labelHeight=5.3;
      }
      const ring=new T.Mesh(new T.RingGeometry(site.id==='hq'?2.3:4.1,site.id==='hq'?2.38:4.19,64),new T.MeshBasicMaterial({color:site.color,side:T.DoubleSide,transparent:true,opacity:.65}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;g.add(ring);rings.set(site.id,ring);
      const beacon=cylinder(g,0,labelHeight-.4,0,.09,.35,site.color,10);beacons.set(site.id,beacon);
      const footprint=new T.Box3().setFromObject(g);layout.reserve((footprint.min.x+footprint.max.x)/2,(footprint.min.z+footprint.max.z)/2,footprint.max.x-footprint.min.x,footprint.max.z-footprint.min.z);
      g.userData.labelHeight=labelHeight;g.traverse(mesh=>{if(mesh.isMesh)mesh.userData.siteId=site.id;});
      // I collegamenti di servizio seguono la rete stradale.
      if(Number.isInteger(site.mission)){
        const line=new T.Line(new T.BufferGeometry().setFromPoints([...roadRoute(buildings.find(b=>b.id==='hq').position,[x,z]).map(([rx,rz])=>new T.Vector3(rx,.24,rz))]),new T.LineDashedMaterial({color:0xb58c60,dashSize:.3,gapSize:.22}));line.computeLineDistances();scene.add(line);cables.set(site.id,line);
      }
    });
    // Facciate locali generate una sola volta: molti edifici, pochi draw call.
    function facade(color,rows,neutral=false){
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,128,256);
      for(let r=0;r<rows;r++)for(let col=0;col<4;col++){c.fillStyle=(r+col)%5===0?(neutral?'#c4c9c3':'#d6d3a9'):(neutral?'#a0aaa6':'#718b8a');c.fillRect(10+col*29,12+r*(232/rows),15,Math.min(23,146/rows));c.fillStyle=neutral?'#b2bab5':'#a4b1a2';c.fillRect(9+col*29,12+r*(232/rows)+Math.min(23,146/rows),17,2);}
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:texture,roughness:.95});
    }
    const tones=['#cfceb9','#c1b9a5','#d6c6ad','#b7c3b6','#cbb69e'];const facades=tones.map((color,i)=>facade(color,i%2?6:4));
    
    const dummy=new T.Object3D();let count=0;
    const apartmentGroups=facades.map(material=>{const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,130);mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);return {mesh,count:0};});
    const roofMesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat('#9ca99d'),240);roofMesh.castShadow=true;city.add(roofMesh);
    const rng=(a,b)=>{const v=Math.sin(a*12.9898+b*78.233)*43758.5453;return v-Math.floor(v);};
    for(let x=-42;x<=43;x+=4.8)for(let z=-35;z<=36;z+=4.8){
      if(nearRoad(x,z,3.2)||Math.abs(x-riverX(z))<4.8||nearSite(x,z,6.4))continue;
      if((x<-17&&z>0&&z<12)||(x>17&&z>-3&&z<10)){tree(x,z,1.2);tree(x+1.3,z+1,1);continue;}
      const r=rng(x,z),h=(z<-20?5:2.6)+r*(z<-20?7:4),w=2.7+r*.65,d=2.6+rng(z,x)*.65;
      layout.reserve(x,z,w+.2,d+.2);
      const group=apartmentGroups[Math.floor(r*facades.length)];dummy.position.set(x,h/2-.05,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,0);dummy.updateMatrix();group.mesh.setMatrixAt(group.count++,dummy.matrix);
      dummy.position.y=h+.06;dummy.scale.set(w+.2,.22,d+.2);dummy.updateMatrix();roofMesh.setMatrixAt(count++,dummy.matrix);
      if(r>.6)box(city,x+.4,h+.45,z,.9,.65,.9,'#a8b3a5');
    }
    apartmentGroups.forEach(({mesh,count})=>{mesh.count=count;mesh.instanceMatrix.needsUpdate=true;});roofMesh.count=count;roofMesh.instanceMatrix.needsUpdate=true;
    host.dataset.decorativeBuildings=String(count);
    const contextMaterials=['#b9c0bc','#c4c9c4','#aeb8b2'].map((color,i)=>facade(color,4+i,true));
    const contextGroups=contextMaterials.map(material=>{const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,1200);mesh.castShadow=false;mesh.receiveShadow=true;city.add(mesh);return {mesh,count:0};});
    const contextRoofs=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat('#b2bcb5'),3600);contextRoofs.receiveShadow=true;city.add(contextRoofs);let contextCount=0;
    for(let x=-197;x<=198;x+=8.5)for(let z=-170;z<=171;z+=8.5){
      if(Math.abs(x)<49&&Math.abs(z)<42)continue;
      if(contextRoadsX.some(road=>Math.abs(x-road)<4.8)||contextRoadsZ.some(road=>Math.abs(z-road)<4.8))continue;
      const random=rng(x,z),w=4+random*1.5,d=4+rng(z,x)*1.5,h=3+random*8;
      layout.reserve(x,z,w+.2,d+.2);const group=contextGroups[Math.floor(random*contextGroups.length)];dummy.position.set(x,h/2-.15,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,0);dummy.updateMatrix();group.mesh.setMatrixAt(group.count++,dummy.matrix);
      dummy.position.y=h;dummy.scale.set(w+.15,.2,d+.15);dummy.updateMatrix();contextRoofs.setMatrixAt(contextCount++,dummy.matrix);
    }
    contextGroups.forEach(({mesh,count})=>{mesh.count=count;mesh.instanceMatrix.needsUpdate=true;});contextRoofs.count=contextCount;contextRoofs.instanceMatrix.needsUpdate=true;host.dataset.contextBuildings=String(contextCount);
    // Lungofiume e parchi: alberi senza invadere strade o piazzali operativi.
    for(let z=-35;z<37;z+=4.8)for(const side of [-1,1]){const x=riverX(z)+side*5.7;if(!nearRoad(x,z,2.4)&&!nearSite(x,z,5))tree(x,z,1.15);}
    for(let x=-43;x<45;x+=7.6)for(const z of [-36.5,36.5])if(!nearRoad(x,z,2.6)&&!nearSite(x,z,5))tree(x,z,1.1);
    for(const [x,z] of [[-25,4],[-29,5],[-23,8],[24,3],[28,4],[24,7],[-40,22],[41,-16]])tree(x,z,1.35);
    // Campetto della scuola, parcheggi e aiuole civiche.
    const school=buildings.find(b=>b.id==='school').position;layout.reserve(school[0]-6,school[1],3.4,6.2);box(city,school[0]-6,.01,school[1],3.2,.13,6,'#88aa9b');box(city,school[0]-6,.1,school[1],.06,.02,5.7,'#e7e6cd');
    for(const site of buildings.filter(b=>b.id!=='hq')){const [x,z]=site.position;for(let i=0;i<4;i++)box(city,x+5.2,-.02,z-1.5+i*.85,1.8,.04,.045,'#e7e5ca');tree(x-5.3,z+2,1.05);}
    // Si piantano gli alberi solo dopo aver registrato tutti i volumi degli edifici.
    for(const candidate of treeCandidates){const {x,z,size}=candidate,radius=.75*size;
      if(nearRoad(x,z,radius+1.6)||Math.abs(x-riverX(z))<2.65+radius)continue;
      if(layout.plant(x,z,radius))renderTree(x,z,size);
    }
    host.dataset.treeCount=String(layout.treeCount);host.dataset.treeCollisions=String(layout.treeOverlaps());
    function car(color){const g=new T.Group();box(g,0,.32,0,.72,.38,1.25,color);box(g,0,.6,-.12,.62,.32,.65,color);box(g,0,.63,.22,.54,.2,.02,'#466f79');for(const x of [-.36,.36])for(const z of [-.38,.38]){const wheel=cylinder(g,x,.21,z,.14,.09,'#33484a',8);wheel.rotation.z=Math.PI/2;}return g;}
    const traffic=[];
    for(let i=0;i<9;i++){const vehicle=car(['#b77e60','#dae0cb','#7e98a1'][i%3]);city.add(vehicle);traffic.push({vehicle,road:roadsZ[i%roadsZ.length],offset:i*11,speed:.4+(i%3)*.16});}
    const van=car('#dfad5f');box(van,0,.93,-.15,.7,.2,.7,'#dce6d8');const headquarters=buildings.find(b=>b.id==='hq').position;van.position.set(headquarters[0],.13,headquarters[1]+2);city.add(van);
    let vanRoute=[],selected=null,angle=.43,elevation=.85,desiredAngle=angle,desiredElevation=elevation,zoom=1.4,desiredZoom=zoom,last=0,disposed=false,fitRadius=125;
    const reducedMotion=root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target=new T.Vector3(0,0,0),desiredTarget=target.clone();
    const pointer=new T.Vector2(),ray=new T.Raycaster();let pressed=null,dragging=false,hovered=null;
    function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;fitRadius=125*Math.max(1,1.15/camera.aspect);const offset=width>800?145:0;camera.setViewOffset(width,height,-offset,0,width,height);camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(host);const canvas=renderer.domElement;
    function pan(dx,dy){const scale=(fitRadius/zoom)*.00095;desiredTarget.x-=Math.cos(angle)*dx*scale;desiredTarget.z+=Math.sin(angle)*dx*scale;desiredTarget.x-=Math.sin(angle)*dy*scale;desiredTarget.z-=Math.cos(angle)*dy*scale;desiredTarget.x=T.MathUtils.clamp(desiredTarget.x,-cameraLimits.maxPanX,cameraLimits.maxPanX);desiredTarget.z=T.MathUtils.clamp(desiredTarget.z,-cameraLimits.maxPanZ,cameraLimits.maxPanZ);}
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;pressed={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.pointerId,rotate:e.shiftKey||e.button===2};dragging=false;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!pressed){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);hovered=ray.intersectObjects(city.children,true)[0]?.object.userData.siteId||null;if(!discovered.has(hovered))hovered=null;canvas.style.cursor=hovered?'pointer':'grab';return;}if(e.pointerId!==pressed.id)return;if(Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y)>5)dragging=true;if(dragging){const dx=e.clientX-pressed.lastX,dy=e.clientY-pressed.lastY;if(!pressed.rotate)pan(dx,dy);else{desiredAngle-=dx*.005;desiredElevation=T.MathUtils.clamp(desiredElevation+dy*.004,cameraLimits.minElevation,cameraLimits.maxElevation);}}pressed.lastX=e.clientX;pressed.lastY=e.clientY;});
    canvas.addEventListener('pointerup',e=>{if(!pressed||e.pointerId!==pressed.id)return;const dragged=dragging,rotateMode=pressed.rotate;pressed=null;dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(dragged||rotateMode)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(city.children,true)[0];if(hit?.object.userData.siteId&&discovered.has(hit.object.userData.siteId)){travel(hit.object.userData.siteId);onEnter(hit.object.userData.siteId);}});
    canvas.addEventListener('pointercancel',()=>{pressed=null;dragging=false;});canvas.addEventListener('pointerleave',()=>{hovered=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();desiredZoom=T.MathUtils.clamp(desiredZoom*Math.exp(-e.deltaY*.001),cameraLimits.minZoom,cameraLimits.maxZoom);},{passive:false});
    function travel(id){selected=id;const dest=buildings.find(b=>b.id===id);if(!dest)return;vanRoute=roadRoute([van.position.x,van.position.z],[dest.position[0],dest.position[1]+3]).map(([x,z])=>new T.Vector3(x,.13,z));}
    function focusSite(id){const dest=buildings.find(b=>b.id===id);if(!dest)return;desiredTarget.set(dest.position[0],0,dest.position[1]);desiredZoom=1.9;selected=id;}
    document.getElementById('zoom-in').addEventListener('click',()=>desiredZoom=Math.min(cameraLimits.maxZoom,desiredZoom*1.2));document.getElementById('zoom-out').addEventListener('click',()=>desiredZoom=Math.max(cameraLimits.minZoom,desiredZoom/1.2));
    document.getElementById('rotate-left').addEventListener('click',()=>desiredAngle-=Math.PI/8);document.getElementById('rotate-right').addEventListener('click',()=>desiredAngle+=Math.PI/8);
    document.getElementById('reset-camera').addEventListener('click',()=>{desiredAngle=.43;desiredElevation=.85;desiredZoom=1.4;desiredTarget.set(0,0,0);});
    const moves={'pan-up':[0,85],'pan-down':[0,-85],'pan-left':[85,0],'pan-right':[-85,0]};
    Object.entries(moves).forEach(([id,delta])=>document.getElementById(id).addEventListener('click',()=>pan(...delta)));
    document.getElementById('pan-home').addEventListener('click',()=>desiredTarget.set(0,0,0));
    document.getElementById('compass-reset').addEventListener('click',()=>{desiredAngle=angle+Math.atan2(-Math.sin(angle),Math.cos(angle));});
    host.addEventListener('keydown',event=>{const keys={ArrowUp:[0,85],ArrowDown:[0,-85],ArrowLeft:[85,0],ArrowRight:[-85,0]};if(keys[event.key]){event.preventDefault();pan(...keys[event.key]);}else if(event.key==='+'||event.key==='='){event.preventDefault();desiredZoom=Math.min(cameraLimits.maxZoom,desiredZoom*1.2);}else if(event.key==='-'){event.preventDefault();desiredZoom=Math.max(cameraLimits.minZoom,desiredZoom/1.2);}});
    for(const button of buttons.values())button.addEventListener('dblclick',()=>focusSite(button.dataset.building));
    const anchor=new T.Vector3();let elapsed=0;
    function frame(time){if(disposed)return;requestAnimationFrame(frame);if(document.hidden||time-last<33)return;const dt=Math.min((time-last)/1000,.08);last=time;elapsed+=dt;
      const smooth=reducedMotion?1:.15;angle+=(desiredAngle-angle)*smooth;elevation+=(desiredElevation-elevation)*smooth;zoom+=(desiredZoom-zoom)*smooth;target.lerp(desiredTarget,smooth);
      document.getElementById('zoom-in').disabled=desiredZoom>=cameraLimits.maxZoom-.001;document.getElementById('zoom-out').disabled=desiredZoom<=cameraLimits.minZoom+.001;
      host.dataset.panX=target.x.toFixed(2);host.dataset.panZ=target.z.toFixed(2);host.dataset.bearing=angle.toFixed(3);document.getElementById('compass-needle').setAttribute('transform',`rotate(${-angle*180/Math.PI} 36 36)`);host.dataset.zoom=zoom.toFixed(3);host.dataset.elevation=elevation.toFixed(3);
      const radius=fitRadius/zoom;camera.position.set(target.x+Math.sin(angle)*Math.cos(elevation)*radius,Math.sin(elevation)*radius,target.z+Math.cos(angle)*Math.cos(elevation)*radius);camera.lookAt(target);camera.updateMatrixWorld();
      if(vanRoute.length){const dest=vanRoute[0],delta=dest.clone().sub(van.position);if(delta.length()<.25)vanRoute.shift();else {van.rotation.y=Math.atan2(delta.x,delta.z);van.position.add(delta.normalize().multiplyScalar(reducedMotion?.5:dt*6));}}
      if(!reducedMotion)traffic.forEach((v,i)=>{v.vehicle.position.set(((elapsed*v.speed*3+v.offset)%86)-43,.13,v.road+(i%2?.55:-.55));v.vehicle.rotation.y=Math.PI/2;});
      const placed=[];
      for(const site of buildings){if(!discovered.has(site.id)){leaders.get(site.id).style.display='none';rings.get(site.id).visible=false;continue;}rings.get(site.id).visible=true;const g=groups.get(site.id);anchor.set(g.position.x,g.userData.labelHeight+.7,g.position.z).project(camera);const button=buttons.get(site.id),width=host.clientWidth,height=host.clientHeight,bw=button.offsetWidth||150,bh=button.offsetHeight||45;
        let x=(anchor.x+1)/2*width,y=(-anchor.y+1)/2*height;const anchorX=x,anchorY=y;
        const offscreen=anchor.z>1||x<0||x>width||y<0||y>height;button.classList.toggle('offscreen',offscreen);
        x=T.MathUtils.clamp(x,bw/2+8,width-bw/2-8);y=T.MathUtils.clamp(y,bh+8,height-65);
        for(const previous of placed)if(Math.abs(x-previous.x)<(bw+previous.w)/2+5&&Math.abs(y-previous.y)<bh+7)y=Math.min(height-65,previous.y+bh+10);
        placed.push({x,y,w:bw});const leader=leaders.get(site.id);leader.setAttribute('x1',anchorX);leader.setAttribute('y1',anchorY);leader.setAttribute('x2',x);leader.setAttribute('y2',y+4);leader.style.display=offscreen?'none':'';button.style.left=x+'px';button.style.top=y+'px';button.classList.toggle('selected',selected===site.id);rings.get(site.id).material.opacity=selected===site.id||hovered===site.id?.95:.6;
      }
      renderer.render(scene,camera);
    }
    resize();requestAnimationFrame(frame);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;observer.disconnect();fallback();});
    engine={travel,locate:focusSite,update(completed){buildings.forEach(site=>{const done=Number.isInteger(site.mission)&&site.mission<completed;if(!Number.isInteger(site.mission))return;beacons.get(site.id).visible=discovered.has(site.id);cables.get(site.id).visible=discovered.has(site.id);const color=done?'#72bb9a':'#e2ac76';rings.get(site.id).material.color.set(color);beacons.get(site.id).material=mat(color,{emissive:color,emissiveIntensity:.4});cables.get(site.id).material.color.set(color);cables.get(site.id).material.dashSize=done?100:.3;for(const pane of windows.get(site.id)||[])pane.material=mat(done?'#bfdfc6':'#66898e',{emissive:done?'#83946a':'#25424a',emissiveIntensity:done?.5:.1});});}};
  }catch(error){console.warn('Rete Zero: vista alternativa attiva.',error.message);fallback();}
  return {focus(id){engine?.travel(id);},locate(id){engine?.locate(id);},update(state){
    const graduated=state.studied.length===RZData.lessons.length;discovered.clear();for(const site of buildings)if(RZData.isBuildingDiscovered(site.id,state.completed,state.studied))discovered.add(site.id);
    for(const site of buildings){const button=buttons.get(site.id);button.hidden=!discovered.has(site.id);const done=Number.isInteger(site.mission)&&site.mission<state.completed;
      let status=site.id==='school'?`${state.studied.length}/4 prove`:site.id==='hq'?'Profilo tecnico':done?'Online ✓':!graduated?'Richiede tesserino':site.mission>state.completed?'In attesa':'Intervento';
      button.querySelector('small').textContent=status;button.setAttribute('aria-label',site.name+' — '+status);button.classList.toggle('repaired',done);button.classList.toggle('locked',Number.isInteger(site.mission)&&!RZData.canEnterMission(site.mission,state.completed,state.studied));
    }engine?.update(state.completed);
  }};
};
})(typeof globalThis!=='undefined'?globalThis:this);
