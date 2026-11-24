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
    button.querySelector('.marker-symbol').textContent={school:'01',hq:'HQ',hospital:'02',rescue:'03',townhall:'04',services:'05'}[site.id];
    button.hidden=site.id!=='school';button.addEventListener('click',()=>{if(!discovered.has(site.id))return;engine?.travel(site.id);onEnter(site.id);});
    const line=document.createElementNS(ns,'line');leaderLayer.append(line);leaders.set(site.id,line);markers.append(button);buttons.set(site.id,button);
  });
  function fallback(){
    host.hidden=true;leaderLayer.style.display='none';markers.classList.add('flat');document.getElementById('map-fallback').hidden=false;
    document.querySelector('.navigation-tools').hidden=true;document.getElementById('compass-reset').hidden=true;document.querySelector('.map-instructions').hidden=true;
  }
  try {
    if(!root.THREE)throw new Error('Motore 3D non disponibile');
    const T=THREE, scene=new T.Scene();
    scene.background=new T.Color();
    scene.fog=new T.FogExp2(scene.background,.0038);
    const {cameraLimits,createLayout}=RZSpatial,layout=createLayout(),treeCandidates=[];
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.7));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
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
    function renderTree(x,z,size=1,parent=city){const trunk=cylinder(parent,x,.55,z,.10,.9,'#88765a',6);trunk.castShadow=false;const crown=new T.Mesh(new T.IcosahedronGeometry(.75*size,1),mat('#789b7c'));crown.position.set(x,1.4*size,z);crown.scale.y=1.3;parent.add(crown);crown.castShadow=true;}
    // Una città estesa, con isolati abitati e cinque sole sedi operative.
    const roadsX=[-36,-15,15,36],roadsZ=[-29,-8,14,32];
    const asphalt='#6d8380';
    const playground={x:25,z:3,width:14,depth:14};
    const riverX=z=>Math.sin(z*.09)*1.35;
    const fountainZ=8.2,fountainX=riverX(fountainZ)+5.7;
    // L'area operativa è immersa in un tessuto urbano neutro, senza bordo del plastico.
    // Gli assi stradali proseguono nella città sullo sfondo.
    const contextRoadsX=[...roadsX,58,80],contextRoadsZ=[...roadsZ];
    for(let x=-57;x>-210;x-=21)contextRoadsX.push(x);
    for(let x=101;x<210;x+=21)contextRoadsX.push(x);
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
    ctx.fillStyle=asphalt;for(const x of roadsX)ctx.fillRect(px(x-1.5),0,3*sx,1736);for(const z of roadsZ)ctx.fillRect(0,pz(z-1.5),2048,3*sz);
    ctx.strokeStyle='#d2d8bc';ctx.lineWidth=1.2;ctx.setLineDash([14,18]);for(const x of roadsX){ctx.beginPath();ctx.moveTo(px(x),0);ctx.lineTo(px(x),1736);ctx.stroke();}for(const z of roadsZ){ctx.beginPath();ctx.moveTo(0,pz(z));ctx.lineTo(2048,pz(z));ctx.stroke();}ctx.setLineDash([]);
    ctx.fillStyle='#e5e4ce';for(const x of roadsX)for(const z of roadsZ){for(let i=0;i<5;i++){ctx.fillRect(px(x-1.15+i*.47),pz(z-2.5),.23*sx,.65*sz);ctx.fillRect(px(x-1.15+i*.47),pz(z+1.85),.23*sx,.65*sz);}}
    ctx.fillStyle='#869e8d';ctx.font='500 17px monospace';ctx.fillText('QUARTIERE GALILEI',px(-34),pz(-33));ctx.fillText('BORGO SAN LUCA',px(17),pz(-33));ctx.fillText('CENTRO STORICO',px(-34),pz(36));ctx.fillText('DISTRETTO EST',px(17),pz(36));
    const groundTexture=new T.CanvasTexture(groundCanvas);groundTexture.colorSpace=T.SRGBColorSpace;groundTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    const ground=new T.Mesh(new T.PlaneGeometry(92,78),new T.MeshStandardMaterial({map:groundTexture,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.13;ground.receiveShadow=true;city.add(ground);
    const riverShape=new T.Shape();for(let z=-39;z<=39;z+=1){const x=riverX(z)-2.5;if(z===-39)riverShape.moveTo(x,z);else riverShape.lineTo(x,z);}for(let z=39;z>=-39;z-=1)riverShape.lineTo(riverX(z)+2.5,z);riverShape.closePath();
    const river=new T.Mesh(new T.ShapeGeometry(riverShape),mat('#739fa3',{metalness:.15,roughness:.35}));river.rotation.x=Math.PI/2;river.position.y=-.08;river.material.side=T.DoubleSide;city.add(river);
    const groundY=-.13,deckY=.94,bridgeSpan=3.15,bridgeEnd=6.3;
    const profileX=[-bridgeEnd,-bridgeSpan,bridgeSpan,bridgeEnd];
    function bridgeHeight(offset){
      const ramp=T.MathUtils.clamp((bridgeEnd-Math.abs(offset))/(bridgeEnd-bridgeSpan),0,1);
      return T.MathUtils.lerp(groundY,deckY,ramp);
    }
    function bridgeOffset(x,z){
      const crossing=roadsZ.find(road=>Math.abs(z-road)<=1.55);
      if(crossing===undefined)return 0;
      return bridgeHeight(x-riverX(crossing))-groundY;
    }
    function addBridgeDeck(parent,width,thickness,offset,color){
      const outline=new T.Shape();
      profileX.forEach((x,i)=>{
        const height=bridgeHeight(x)+offset;
        if(i===0)outline.moveTo(x,height);else outline.lineTo(x,height);
      });
      for(const x of [...profileX].reverse())outline.lineTo(x,bridgeHeight(x)+offset-thickness);
      outline.closePath();
      const deck=new T.Mesh(new T.ExtrudeGeometry(outline,{depth:width,bevelEnabled:false}),mat(color));
      deck.position.z=-width/2;deck.castShadow=deck.receiveShadow=true;parent.add(deck);
      return deck;
    }
    function addRail(parent,curve,radius,color){
      const rail=new T.Mesh(new T.TubeGeometry(curve,16,radius,6,false),mat(color));
      rail.castShadow=true;parent.add(rail);
    }
    for(const z of roadsZ){
      const bridge=new T.Group();
      bridge.name='Ponte sul fiume';
      bridge.position.set(riverX(z),0,z);city.add(bridge);
      const deck=addBridgeDeck(bridge,4.4,.24,0,'#c6bfa9');
      deck.name='Impalcato del ponte';
      addBridgeDeck(bridge,3,.035,.012,asphalt);
      for(const x of [-5.2,-3.85,-2.5,-1.25,0,1.25,2.5,3.85,5.2]){
        const stripe=box(bridge,x,bridgeHeight(x)+.023,0,.52,.018,.055,'#e0dec5');
        stripe.rotation.z=Math.atan2(bridgeHeight(x+.04)-bridgeHeight(x-.04),.08);
      }
      for(const x of [-3.2,3.2]){
        box(bridge,x,.31,0,.62,.88,4.12,'#a7a28b');
        box(bridge,x,.66,0,.76,.15,4.22,'#beb7a0');
      }
      const railColor='#486d70';
      for(const side of [-1,1]){
        const railZ=side*2.06;
        for(const x of [-5.85,-4.5,-bridgeSpan,bridgeSpan,4.5,5.85]){
          const height=bridgeHeight(x);
          box(bridge,x,height+.24,railZ,.1,.48,.1,railColor);
          box(bridge,x,height+.09,railZ,.17,.16,.17,'#b3ac95');
        }
        for(const direction of [-1,1]){
          addRail(bridge,new T.LineCurve3(
            new T.Vector3(direction*5.85,bridgeHeight(5.85)+.45,railZ),
            new T.Vector3(direction*bridgeSpan,deckY+.45,railZ)
          ),.044,railColor);
        }
        addRail(bridge,new T.QuadraticBezierCurve3(
          new T.Vector3(-bridgeSpan,deckY+.45,railZ),
          new T.Vector3(0,deckY+1.6,railZ),
          new T.Vector3(bridgeSpan,deckY+.45,railZ)
        ),.055,railColor);
        addRail(bridge,new T.LineCurve3(
          new T.Vector3(-bridgeSpan,deckY+.23,railZ),
          new T.Vector3(bridgeSpan,deckY+.23,railZ)
        ),.031,railColor);
        for(const x of [-2.1,-1.05,0,1.05,2.1]){
          const archHeight=1.025-.575*(x/bridgeSpan)**2;
          box(bridge,x,deckY+archHeight/2,railZ,.05,archHeight,.052,railColor);
        }
      }
    }
    const boat=new T.Group();
    boat.name='Barchetta sul fiume';
    city.add(boat);
    const hullOutline=new T.Shape();
    hullOutline.moveTo(0,-.89);hullOutline.lineTo(-.33,-.49);hullOutline.lineTo(-.36,.65);
    hullOutline.lineTo(.36,.65);hullOutline.lineTo(.33,-.49);hullOutline.closePath();
    const hull=new T.Mesh(new T.ExtrudeGeometry(hullOutline,{
      depth:.16,bevelEnabled:true,bevelThickness:.035,bevelSize:.042,bevelSegments:1
    }),mat('#88654c'));
    hull.rotation.x=-Math.PI/2;hull.castShadow=true;boat.add(hull);
    const boatDeck=new T.Mesh(new T.ShapeGeometry(hullOutline),mat('#d5b382'));
    boatDeck.rotation.x=-Math.PI/2;boatDeck.position.y=.196;boatDeck.scale.set(.86,.91,1);boat.add(boatDeck);
    box(boat,0,.26,.06,.48,.14,.55,'#e7d2a9');
    box(boat,0,.34,.24,.44,.14,.055,'#4c777f');
    box(boat,0,.24,-.38,.49,.086,.16,'#a77157');
    const wake=new T.Group();boat.add(wake);
    for(const side of [-1,1])for(let i=0;i<2;i++){
      const streak=box(wake,side*(.32+i*.15),.005,-.92-i*.44,.024,.005,.42,
        '#d0ebe1',{transparent:true,opacity:i===0?.67:.36,depthWrite:false});
      streak.rotation.y=-side*.32;streak.castShadow=false;
    }
    function moveBoat(elapsed,animated){
      const phase=Math.PI+.08+(animated?elapsed*.118:0);
      const z=36.5*Math.sin(phase);
      const alongRiver=36.5*Math.cos(phase);
      const sideways=-.58*Math.sin(phase)+1.35*.09*Math.cos(z*.09)*alongRiver;
      boat.position.set(riverX(z)+.58*Math.cos(phase),-.08+(animated?Math.sin(elapsed*3)*.014:0),z);
      boat.rotation.y=Math.atan2(sideways,alongRiver);
      wake.visible=animated;
      wake.position.y=-.08-boat.position.y;
    }
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
    function addHospitalHelipad(hospital){
      const padPaint='#f2eed6',rescueRed='#a95143',ivory='#f0dfbc',glass='#375c67';
      const padX=1.1;
      cylinder(hospital,padX,3.92,0,1.65,.09,'#68857e',40);
      const outline=new T.Mesh(new T.RingGeometry(1.42,1.49,40),mat(padPaint));
      outline.rotation.x=-Math.PI/2;outline.position.set(padX,3.973,0);hospital.add(outline);
      for(const offset of [-.47,.47])box(hospital,padX+offset,3.975,0,.16,.018,1.38,padPaint);
      box(hospital,padX,3.975,0,.78,.018,.16,padPaint);

      const helicopter=new T.Group();
      helicopter.position.set(padX,3.97,0);hospital.add(helicopter);
      const cabin=new T.Mesh(new T.IcosahedronGeometry(.5,1),mat(ivory));
      cabin.position.set(0,.43,.02);cabin.scale.set(.79,.61,1.28);cabin.castShadow=true;
      helicopter.add(cabin);
      const cockpit=new T.Mesh(new T.IcosahedronGeometry(.5,1),mat(glass));
      cockpit.position.set(0,.49,.29);cockpit.scale.set(.72,.48,.68);cockpit.castShadow=true;
      helicopter.add(cockpit);
      for(const side of [-1,1]){
        box(helicopter,side*.358,.40,-.06,.045,.13,.64,rescueRed);
        box(helicopter,side*.29,.045,0,.065,.075,.91,glass);
        for(const z of [-.27,.25])box(helicopter,side*.24,.16,z,.07,.24,.065,glass);
      }
      const boom=cylinder(helicopter,0,.42,-.81,.07,.94,ivory,8,.13);
      boom.rotation.x=Math.PI/2-.12;
      box(helicopter,0,.63,-1.23,.09,.38,.18,rescueRed).rotation.x=-.3;
      box(helicopter,.08,.58,-1.24,.04,.34,.049,glass).rotation.x=.55;
      cylinder(helicopter,0,.8,0,.038,.24,glass,8);
      const rotor=new T.Group();rotor.position.y=.92;rotor.rotation.y=.28;helicopter.add(rotor);
      box(rotor,0,0,0,2.16,.035,.085,glass);
      for(const x of [-.98,.98])box(rotor,x,.004,0,.19,.037,.087,rescueRed);
    }
    let servicesConstruction;
    function constructionSite(x,z){
      const site=new T.Group();
      site.name='Cantiere del Palazzo dei servizi';
      site.position.set(x,0,z);
      city.add(site);

      const concrete='#a8afa7', steel='#9a6840', yellow='#d6a34b';
      box(site,0,.01,0,8.1,.14,7,'#ad9777');
      box(site,.5,.2,0,5.8,.28,4,concrete);
      for(const column of [-1.9,.5,2.9]){
        for(const depth of [-1.65,1.65])box(site,column,1.5,depth,.28,2.5,.28,concrete);
      }
      box(site,.5,2.8,0,5.8,.24,3.9,concrete);
      for(const column of [-1.9,2.9]){
        box(site,column,3.3,-1.65,.28,.9,.28,concrete);
      }
      for(const side of [-1,1]){
        for(let i=-3;i<=3;i++)box(site,i,.45,side*3.25,.08,.83,.08,steel);
        box(site,0,.57,side*3.25,6.5,.12,.08,yellow);
      }

      const mastX=-3.05,mastZ=-2.45;
      box(site,mastX,.28,mastZ,1.35,.42,1.3,concrete);
      for(const dx of [-.25,.25]){
        for(const dz of [-.25,.25])box(site,mastX+dx,3.55,mastZ+dz,.085,6.35,.085,yellow);
      }
      for(let y=.8;y<6.6;y+=.65){
        for(const dz of [-.25,.25]){
          box(site,mastX,y,mastZ+dz,.58,.07,.07,yellow);
          box(site,mastX,y+.3,mastZ+dz,.075,.78,.075,yellow).rotation.z=.66;
        }
        for(const dx of [-.25,.25])box(site,mastX+dx,y,mastZ,.07,.07,.58,yellow);
      }
      box(site,mastX,6.76,mastZ,.85,.3,.85,steel);
      box(site,-.5,7.03,mastZ,7.3,.16,.34,yellow);
      box(site,-.5,7.39,mastZ,7.3,.09,.24,yellow);
      for(let i=-3;i<=2;i+=.55)box(site,i,7.2,mastZ,.07,.52,.09,yellow).rotation.z=.68;
      box(site,-3.94,6.84,mastZ,.45,.48,.52,concrete);
      box(site,1.75,6.95,mastZ,.28,.23,.34,steel);
      box(site,1.75,5.54,mastZ,.035,2.65,.035,'#414743');
      box(site,1.75,4.18,mastZ,.16,.14,.07,steel);
      return site;
    }
    const playArea=new T.Group();
    playArea.position.set(playground.x,0,playground.z);
    city.add(playArea);
    layout.reserve(playground.x,playground.z,playground.width,playground.depth);
    host.dataset.playgroundX=String(playground.x);
    box(playArea,0,.005,0,14,.15,14,'#9eb994');
    box(playArea,0,.09,0,10,.12,9,'#d6b48b');
    for(const x of [-2.1,2.1])for(const z of [-2.1,-.65]){
      cylinder(playArea,x,1.05,z,.075,2,'#56787d',8);
    }
    box(playArea,0,2.06,-1.37,4.45,.14,.12,'#56787d');
    for(const x of [-.9,.9]){
      for(const side of [-1,1])cylinder(playArea,x+side*.24,1.42,-1.37,.02,1.17,'#857469',6);
      box(playArea,x,.81,-1.37,.62,.10,.37,'#cf8b55');
    }
    for(const x of [-3.15,-2.15])for(const z of [.95,1.75])cylinder(playArea,x,.9,z,.065,1.7,'#808866',8);
    box(playArea,-2.65,1.76,1.35,1.25,.12,1.15,'#587f85');
    const slide=box(playArea,-2.65,.92,2.52,.8,.12,2.2,'#ba6e50');
    slide.rotation.x=.73;
    for(const x of [2,3.45])cylinder(playArea,x,.5,2.4,.39,.72,'#759ea1',12);
    box(playArea,2.75,1.05,2.4,2.2,.12,.28,'#c88956');
    for(const x of [-5.6,5.6])for(const z of [-5.5,5.5])renderTree(x,z,1.2,playArea);
    const parkPathStart=playground.z+playground.depth/2,parkPathEnd=14-1.5;
    box(city,playground.x,-.075,(parkPathStart+parkPathEnd)/2,1.55,.11,parkPathEnd-parkPathStart,'#dcd9c6');
    buildings.forEach(site=>{
      const [x,z]=site.position,g=new T.Group();g.position.set(x,0,z);g.userData.siteId=site.id;city.add(g);groups.set(site.id,g);
      if(site.id!=='hq'){
        box(g,0,.04,0,8.1,.2,7.0,'#ced5c7');box(g,0,.17,2.9,8.3,.1,1.1,'#e4dfcc');
        const nearest=roadsZ.reduce((a,v)=>Math.abs(v-z)<Math.abs(a-z)?v:a,roadsZ[0]);
        if(site.id!=='services')box(city,x,-.03,(z+nearest)/2,1.3,.08,Math.abs(z-nearest),'#d4d8c4');
      }
      let labelHeight=5;
      if(site.id==='school'){
        box(g,-.8,1.45,0,5.4,2.55,3.5,'#e7cba1');box(g,2.5,.95,-.5,1.6,1.6,4.4,'#c79678');roof(g,2.84,5.8,3.9,'#668e8e');
        box(g,-.8,.85,1.81,1.05,1.4,.08,'#527b7c');box(g,-.8,2,1.9,1.4,.4,.09,'#edf0d6');
        windows.set(site.id,windowGrid(g,4.7,2.5,3.5,2,4));
        const clock=cylinder(g,-.8,2.75,2.04,.32,.08,'#f3eacb',24);clock.rotation.x=Math.PI/2;box(g,-.8,2.79,2.09,.035,.22,.03,'#44656b');
        box(g,1.9,.25,2.8,2.3,.12,1.2,'#a8bba3');cylinder(g,-3.2,1.6,2.5,.035,2.8,'#7b8984',6);box(g,-2.84,2.65,2.5,.7,.43,.05,'#89c4c0');labelHeight=4.6;
      }else if(site.id==='hospital'){
        box(g,0,1.8,0,6.5,3.3,3.6,'#e8dfc9');roof(g,3.58,6.9,4,'#d9a18b');
        windows.set(site.id,windowGrid(g,5.7,3.3,3.6,3,6));
        box(g,0,1.1,2.18,2.55,1.82,1.18,'#d7c3ad');
        box(g,0,1.05,2.79,1.44,1.53,.09,'#4d7983');
        box(g,0,1.05,2.85,.045,1.53,.025,'#abbcb0');
        box(g,0,2.03,2.58,2.84,.17,1.32,'#8ba7a3');
        box(g,0,3.07,1.88,1.1,.7,.1,'#e7e5d4');box(g,0,3.07,1.96,.5,.15,.08,'#ae665a');box(g,0,3.07,1.96,.15,.5,.09,'#ae665a');
        addHospitalHelipad(g);
        labelHeight=6;
      }else if(site.id==='rescue'){
        box(g,0,1.15,0,6.3,2,4.1,'#d8b66d');roof(g,2.28,6.6,4.5,'#a47d57');
        for(let i=-1;i<=1;i++){box(g,i*1.8,1,2.1,1.3,1.5,.08,'#466a70');for(let j=0;j<4;j++)box(g,i*1.8,.5+j*.3,2.16,1.28,.025,.02,'#91aaa5');}
        box(g,2,2.85,-.5,1.6,1.3,2,'#d9c8a3');windows.set(site.id,windowGrid(g,5.6,2,4.1,1,5));
        cylinder(g,-2.3,3.7,-1,.04,3,'#69827d',6);for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(.5+i*.2,.025,5,20),mat('#758d83'));ring.position.set(-2.3,4.45+i*.13,-1);ring.rotation.x=Math.PI/2;g.add(ring);}labelHeight=5.6;
      }else if(site.id==='services'){
        servicesConstruction=constructionSite(x,z);
        // L'ingresso si raccorda al marciapiede della strada laterale.
        const paving='#9e9a86',joint='#858572',walkWidth=2.2;
        const turnZ=z+6,turnStart=turnZ-walkWidth/2,entrance=z+3.4;
        const west=x-walkWidth/2,sidewalk=roadsX.find(road=>road>x)-2.2;
        const steps=[
          {x,z:(turnStart+entrance)/2,width:walkWidth,depth:turnStart-entrance},
          {x:(west+sidewalk)/2,z:turnZ,width:sidewalk-west,depth:walkWidth}
        ];
        for(const step of steps){
          layout.reserve(step.x,step.z,step.width,step.depth);
          box(city,step.x,-.052,step.z,step.width,.12,step.depth,paving);
        }
        for(let seam=x+1.1;seam<sidewalk-.25;seam+=1.2){
          box(city,seam,.009,turnZ,.035,.01,walkWidth-.14,joint);
        }
        g.name=site.name;
        g.visible=false;
        box(g,0,2.7,0,5.8,5.2,4,'#cbd7cc');
        roof(g,5.45,6.2,4.4,'#65898b');
        windows.set(site.id,windowGrid(g,5.2,5.2,4,4,5));
        box(g,0,.7,2.05,1.1,1.25,.12,'#466a70');
        labelHeight=6;
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
        const route=roadRoute(buildings.find(b=>b.id==='hq').position,[x,z]);
        const points=[new T.Vector3(route[0][0],.24,route[0][1])];
        for(let i=1;i<route.length;i++){
          const [fromX,fromZ]=route[i-1],[toX,toZ]=route[i];
          const steps=Math.ceil(Math.hypot(toX-fromX,toZ-fromZ)/.4);
          for(let step=1;step<=steps;step++){
            const rx=T.MathUtils.lerp(fromX,toX,step/steps),rz=T.MathUtils.lerp(fromZ,toZ,step/steps);
            points.push(new T.Vector3(rx,.24+bridgeOffset(rx,rz),rz));
          }
        }
        const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:0xb58c60,dashSize:.3,gapSize:.22}));line.computeLineDistances();scene.add(line);cables.set(site.id,line);
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
      if(Math.hypot(x-fountainX,z-fountainZ)<5.2)continue;
      if(nearRoad(x,z,3.2)||Math.abs(x-riverX(z))<4.8||nearSite(x,z,6.4))continue;
      if((x<-17&&z>0&&z<12)||(x>17&&z>-3&&z<10)){tree(x,z,1.2);tree(x+1.3,z+1,1);continue;}
      // Le fasce di raccordo al confine est rimangono libere.
      if(x>roadsX.at(-1)&&[-19,23].some(centre=>Math.abs(z-centre)<6.5))continue;
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
    const flowerColors=['#d8a4a6','#ecce85','#c4a9cc','#e7dfbc'];
    const flowerShape=new T.IcosahedronGeometry(.23,0);
    layout.reserve(fountainX,fountainZ,5.2,5.2);
    const fountain=new T.Group();
    fountain.position.set(fountainX,0,fountainZ);
    city.add(fountain);
    cylinder(fountain,0,-.05,0,2.6,.18,'#c4baa2',40);
    cylinder(fountain,0,.025,0,2.45,.09,'#73966d',40);
    for(let i=0;i<20;i++){
      const angle=i*Math.PI/10;
      const radius=i%2===0?2.17:1.98;
      const flower=new T.Mesh(flowerShape,mat(flowerColors[Math.floor(i/2)%flowerColors.length]));
      flower.position.set(Math.cos(angle)*radius,.24,Math.sin(angle)*radius);
      flower.scale.y=.72;
      fountain.add(flower);
    }
    cylinder(fountain,0,-.015,0,1.64,.15,'#d9d2b9',32);
    cylinder(fountain,0,.14,0,1.4,.27,'#bbbba9',32);
    const water='#5497a6';
    cylinder(fountain,0,.28,0,1.25,.035,water,32);
    const basinRim=new T.Mesh(new T.TorusGeometry(1.31,.083,8,32),mat('#d3cdb8'));
    basinRim.rotation.x=-Math.PI/2;basinRim.position.y=.31;basinRim.castShadow=true;fountain.add(basinRim);
    cylinder(fountain,0,.55,0,.19,.55,'#babaa7',12,.13);
    cylinder(fountain,0,.85,0,.42,.14,'#c8c5ad',20,.51);
    cylinder(fountain,0,.93,0,.42,.035,water,24);
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2+Math.PI/4,dx=Math.cos(angle),dz=Math.sin(angle);
      const arc=new T.QuadraticBezierCurve3(
        new T.Vector3(dx*.16,.94,dz*.16),
        new T.Vector3(dx*.7,1.63,dz*.7),
        new T.Vector3(dx*1.05,.30,dz*1.05)
      );
      fountain.add(new T.Mesh(new T.TubeGeometry(arc,10,.032,6,false),mat('#84bdc9')));
    }
    // Lungofiume e parchi: alberi senza invadere strade o piazzali operativi.
    for(let z=-35;z<37;z+=4.8)for(const side of [-1,1]){const x=riverX(z)+side*5.7;if(!nearRoad(x,z,2.4)&&!nearSite(x,z,5))tree(x,z,1.15);}
    for(let x=-43;x<45;x+=7.6)for(const z of [-36.5,36.5])if(!nearRoad(x,z,2.6)&&!nearSite(x,z,5))tree(x,z,1.1);
    for(const [x,z] of [[-25,4],[-29,5],[-23,8],[24,3],[28,4],[24,7],[-40,22],[41,-16]])tree(x,z,1.35);
    // Campetto della scuola, parcheggi e aiuole civiche.
    const school=buildings.find(b=>b.id==='school').position;layout.reserve(school[0]-6,school[1],3.4,6.2);box(city,school[0]-6,.01,school[1],3.2,.13,6,'#88aa9b');box(city,school[0]-6,.1,school[1],.06,.02,5.7,'#e7e6cd');
    for(const site of buildings.filter(b=>b.id!=='hq')){const [x,z]=site.position;for(let i=0;i<4;i++)box(city,x+5.2,-.02,z-1.5+i*.85,1.8,.04,.045,'#e7e5ca');tree(x-5.3,z+2,1.05);}
    function flowerBed(parent,x,z){
      box(parent,x,-.013,z,2.2,.23,.82,'#9c9273');
      box(parent,x,.116,z,1.96,.035,.59,'#648566');
      for(let i=0;i<5;i++){
        const flower=new T.Mesh(flowerShape,mat(flowerColors[i%flowerColors.length]));
        flower.position.set(x-.75+i*.375,.32,z+(i%2?.12:-.12));
        flower.scale.y=.82;
        parent.add(flower);
      }
    }
    const [hospitalX,hospitalZ]=buildings.find(site=>site.id==='hospital').position;
    const frontWalkStart=hospitalZ+3.4;
    const hospitalSidewalk=roadsZ.find(road=>road>hospitalZ)-2.2;
    const frontWalkDepth=hospitalSidewalk-frontWalkStart;
    layout.reserve(hospitalX,frontWalkStart+frontWalkDepth/2,1.6,frontWalkDepth);
    box(city,hospitalX,-.051,frontWalkStart+frontWalkDepth/2,1.6,.12,frontWalkDepth,'#c8c5b3');

    const bayX=hospitalX+6.1,bayZ=hospitalZ+6.25;
    const bayStart=bayZ-1.75,bayDepth=hospitalSidewalk-bayStart;
    layout.reserve(bayX,bayStart+bayDepth/2,2.15,bayDepth);
    box(city,bayX,-.055,bayStart+bayDepth/2,2.15,.11,bayDepth,'#aab4aa');
    const ambulance=new T.Group();
    ambulance.position.set(bayX,0,bayZ);city.add(ambulance);
    const body='#ece9d4',stripe='#aa5046',tire='#374e52';
    box(ambulance,0,.61,-.32,1.02,.82,1.39,body);
    box(ambulance,0,.48,.68,.93,.54,.67,body);
    box(ambulance,0,.76,.52,.88,.43,.49,body);
    box(ambulance,0,.81,.77,.77,.27,.026,'#527680');
    box(ambulance,0,.53,1.022,.76,.13,.045,tire);
    box(ambulance,0,.99,.49,.63,.085,.16,'#477ca3');
    for(const side of [-1,1]){
      box(ambulance,side*.519,.56,-.3,.028,.16,1.35,stripe);
      box(ambulance,side*.448,.79,.59,.031,.23,.28,'#527680');
      box(ambulance,side*.34,.52,1.05,.15,.1,.032,'#f2dda2');
      box(ambulance,side*.38,.62,-1.025,.1,.17,.03,stripe);
      for(const z of [-.66,.65]){
        const wheel=cylinder(ambulance,side*.47,.198,z,.19,.15,tire,12);
        wheel.rotation.z=Math.PI/2;
      }
    }

    const benchX=hospitalX-3,benchZ=hospitalZ+4.1;
    const wood='#8d633e',metal='#506764';
    layout.reserve(benchX,benchZ,1.8,.7);
    for(const offset of [-.65,.65]){
      box(city,benchX+offset,.13,benchZ,.1,.46,.49,metal);
      box(city,benchX+offset,.42,benchZ-.22,.08,.6,.08,metal);
    }
    for(const offset of [-.16,0,.16])box(city,benchX,.39,benchZ+offset,1.72,.09,.14,wood);
    for(const height of [.59,.75])box(city,benchX,height,benchZ-.24,1.72,.115,.07,wood);
    for(const [dx,dz] of [[-3,5.45],[2.8,4.8]]){
      layout.reserve(hospitalX+dx,hospitalZ+dz,2.2,.82);
      flowerBed(city,hospitalX+dx,hospitalZ+dz);
    }
    const [rescueX,rescueZ]=buildings.find(site=>site.id==='rescue').position;
    tree(rescueX-5.5,rescueZ-4.6,1.2);
    tree(rescueX-6.3,rescueZ+5.6,1.35);
    tree(rescueX+5.6,rescueZ+4.7,1.2);
    // Si piantano gli alberi solo dopo aver registrato tutti i volumi degli edifici.
    for(const candidate of treeCandidates){const {x,z,size}=candidate,radius=.75*size;
      if(nearRoad(x,z,radius+1.6)||Math.abs(x-riverX(z))<2.65+radius)continue;
      if(layout.plant(x,z,radius))renderTree(x,z,size);
    }
    host.dataset.treeCount=String(layout.treeCount);host.dataset.treeCollisions=String(layout.treeOverlaps());
    function car(color){const g=new T.Group();box(g,0,.32,0,.72,.38,1.25,color);box(g,0,.6,-.12,.62,.32,.65,color);box(g,0,.63,.22,.54,.2,.02,'#466f79');for(const x of [-.36,.36])for(const z of [-.38,.38]){const wheel=cylinder(g,x,.21,z,.14,.09,'#33484a',8);wheel.rotation.z=Math.PI/2;}return g;}
    function trafficRoute(left,right,top,bottom,direction){
      const lane=direction*.7;
      const radius=2-lane;
      const corners=[
        new T.Vector3(left+lane,.13,top+lane),
        new T.Vector3(right-lane,.13,top+lane),
        new T.Vector3(right-lane,.13,bottom-lane),
        new T.Vector3(left+lane,.13,bottom-lane)
      ];
      if(direction<0)corners.reverse();

      const offsetCorner=(corner,neighbor)=>corner.clone().lerp(neighbor,radius/corner.distanceTo(neighbor));
      const entries=corners.map((corner,i)=>offsetCorner(corner,corners[(i+3)%4]));
      const exits=corners.map((corner,i)=>offsetCorner(corner,corners[(i+1)%4]));
      const path=new T.CurvePath();
      corners.forEach((corner,i)=>{
        path.add(new T.QuadraticBezierCurve3(entries[i],corner,exits[i]));
        path.add(new T.LineCurve3(exits[i],entries[(i+1)%4]));
      });
      return path;
    }
    const traffic=[];
    const carColors=['#b77e60','#dae0cb','#7e98a1'];
    const blocks=[
      [roadsX[1],roadsX[2],roadsZ[0],roadsZ[1]],
      [roadsX[0],roadsX[1],roadsZ[2],roadsZ[3]],
      [roadsX[2],roadsX[3],roadsZ[2],roadsZ[3]]
    ];
    blocks.forEach((bounds,index)=>{
      for(const direction of [1,-1]){
        const path=trafficRoute(...bounds,direction);
        const length=path.getLength();
        const speed=1.25+(index%3)*.35+(direction<0?.2:0);
        const phase=index*.19+(direction<0?.37:0);
        const offsets=direction===1?[phase,phase+.5]:[phase];
        for(const offset of offsets){
          const vehicle=car(carColors[traffic.length%carColors.length]);
          city.add(vehicle);
          traffic.push({vehicle,path,offset,length,speed});
        }
      }
    });
    function followRoad(vehicle,dx,dz){
      const {x,z}=vehicle.position;
      const rise=bridgeOffset(x,z);
      vehicle.position.y=.13+rise*(deckY-.11)/(deckY-groundY);
      vehicle.rotation.order='YXZ';
      vehicle.rotation.y=Math.atan2(dx,dz);
      const length=Math.hypot(dx,dz);
      const stepX=dx/length*.32,stepZ=dz/length*.32;
      vehicle.rotation.x=-Math.atan2(bridgeOffset(x+stepX,z+stepZ)-bridgeOffset(x-stepX,z-stepZ),.64);
    }
    function placeTraffic(elapsed){
      for(const {vehicle,path,offset,length,speed} of traffic){
        const progress=(offset+elapsed*speed/length)%1;
        vehicle.position.copy(path.getPoint(progress));
        const heading=path.getTangent(progress);
        followRoad(vehicle,heading.x,heading.z);
      }
    }
    placeTraffic(0);
    const van=car('#dfad5f');box(van,0,.93,-.15,.7,.2,.7,'#dce6d8');const headquarters=buildings.find(b=>b.id==='hq').position;van.position.set(headquarters[0],.13,headquarters[1]+2);city.add(van);
    let vanRoute=[],selected=null,angle=.43,elevation=.85,desiredAngle=angle,desiredElevation=elevation,zoom=1.4,desiredZoom=zoom,last=0,disposed=false,fitRadius=125;
    const reducedMotion=root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    moveBoat(0,!reducedMotion);
    const target=new T.Vector3(0,0,0),desiredTarget=target.clone();
    const pointer=new T.Vector2(),ray=new T.Raycaster();let pressed=null,dragging=false,hovered=null;
    function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;fitRadius=125*Math.max(1,1.15/camera.aspect);const offset=width>800?145:0;camera.setViewOffset(width,height,-offset,0,width,height);camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(host);const canvas=renderer.domElement;
    function pan(dx,dy){const scale=(fitRadius/zoom)*.00095;desiredTarget.x-=Math.cos(angle)*dx*scale;desiredTarget.z+=Math.sin(angle)*dx*scale;desiredTarget.x-=Math.sin(angle)*dy*scale;desiredTarget.z-=Math.cos(angle)*dy*scale;desiredTarget.x=T.MathUtils.clamp(desiredTarget.x,-cameraLimits.maxPanX,cameraLimits.maxPanX);desiredTarget.z=T.MathUtils.clamp(desiredTarget.z,-cameraLimits.maxPanZ,cameraLimits.maxPanZ);}
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;pressed={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.pointerId,rotate:e.shiftKey||e.button===2};dragging=false;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!pressed){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);hovered=ray.intersectObjects(city.children.filter(object=>object.visible),true)[0]?.object.userData.siteId||null;if(!discovered.has(hovered))hovered=null;canvas.style.cursor=hovered?'pointer':'grab';return;}if(e.pointerId!==pressed.id)return;if(Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y)>5)dragging=true;if(dragging){const dx=e.clientX-pressed.lastX,dy=e.clientY-pressed.lastY;if(!pressed.rotate)pan(dx,dy);else{desiredAngle-=dx*.005;desiredElevation=T.MathUtils.clamp(desiredElevation+dy*.004,cameraLimits.minElevation,cameraLimits.maxElevation);}}pressed.lastX=e.clientX;pressed.lastY=e.clientY;});
    canvas.addEventListener('pointerup',e=>{if(!pressed||e.pointerId!==pressed.id)return;const dragged=dragging,rotateMode=pressed.rotate;pressed=null;dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(dragged||rotateMode)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(city.children.filter(object=>object.visible),true)[0];if(hit?.object.userData.siteId&&discovered.has(hit.object.userData.siteId)){travel(hit.object.userData.siteId);onEnter(hit.object.userData.siteId);}});
    canvas.addEventListener('pointercancel',()=>{pressed=null;dragging=false;});canvas.addEventListener('pointerleave',()=>{hovered=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();desiredZoom=T.MathUtils.clamp(desiredZoom*Math.exp(-e.deltaY*.001),cameraLimits.minZoom,cameraLimits.maxZoom);},{passive:false});
    function travel(id){selected=id;const dest=buildings.find(b=>b.id===id);if(!dest)return;vanRoute=roadRoute([van.position.x,van.position.z],[dest.position[0],dest.position[1]+3]).map(([x,z])=>new T.Vector3(x,.13,z));}
    function focusSite(id){const dest=buildings.find(b=>b.id===id);if(!dest)return;desiredTarget.set(dest.position[0],0,dest.position[1]);desiredZoom=1.9;selected=id;}
    document.getElementById('zoom-in').addEventListener('click',()=>desiredZoom=Math.min(cameraLimits.maxZoom,desiredZoom*1.2));document.getElementById('zoom-out').addEventListener('click',()=>desiredZoom=Math.max(cameraLimits.minZoom,desiredZoom/1.2));
    document.getElementById('rotate-left').addEventListener('click',()=>desiredAngle+=Math.PI/8);document.getElementById('rotate-right').addEventListener('click',()=>desiredAngle-=Math.PI/8);
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
      if(vanRoute.length){
        const delta=vanRoute[0].clone().sub(van.position);
        delta.y=0;
        const distance=delta.length();
        if(distance<.25)vanRoute.shift();
        else{
          van.position.addScaledVector(delta,(reducedMotion?.5:dt*6)/distance);
          followRoad(van,delta.x,delta.z);
        }
      }
      if(!reducedMotion){
        placeTraffic(elapsed);
        moveBoat(elapsed,true);
      }
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
    function setLighting(mode){
      const night = mode === 'night';
      const cloudy = mode === 'cloudy';
      scene.background.set(night ? '#263c4d' : cloudy ? '#bcc9d2' : '#d7e9ef');
      scene.fog.color.copy(scene.background);
      sun.intensity = cloudy ? 1.15 : 2.8;
      renderer.toneMappingExposure = night ? .42 : cloudy ? 1.05 : 1.15;
    }
    setLighting('day');
    engine={travel,locate:focusSite,setLighting,update(completed,dayThreeMarkers,chapterComplete,municipalComplete,servicesComplete,servicesBuilt){
      servicesConstruction.visible=!servicesBuilt;
      groups.get('services').visible=servicesBuilt;
      buildings.forEach(site=>{
      const mission=Number.isInteger(site.mission);
      const done=mission&&site.mission<completed&&!(site.id==='rescue'&&completed===3);
      const siteComplete=site.id==='services'?servicesComplete:site.id==='townhall'?municipalComplete:chapterComplete;
      const currentColor=dayThreeMarkers?(site.id==='school'?'#b3dbe9':siteComplete?'#72bb9a':'#e2ac76'):null;
      rings.get(site.id).material.color.set(currentColor??(mission?(done?'#72bb9a':'#e2ac76'):site.color));
      if(!mission)return;beacons.get(site.id).visible=discovered.has(site.id);cables.get(site.id).visible=discovered.has(site.id);const color=currentColor??(done?'#72bb9a':'#e2ac76');beacons.get(site.id).material=mat(color,{emissive:color,emissiveIntensity:.4});cables.get(site.id).material.color.set(color);cables.get(site.id).material.dashSize=(dayThreeMarkers?site.id!=='school'&&siteComplete:done)?100:.3;for(const pane of windows.get(site.id)||[])pane.material=mat(done?'#bfdfc6':'#66898e',{emissive:done?'#83946a':'#25424a',emissiveIntensity:done?.5:.1});});}};
  }catch(error){console.warn('Rete Zero: vista alternativa attiva.',error.message);fallback();}
  return {setLighting(mode){engine?.setLighting(mode);},focus(id){engine?.travel(id);},locate(id){engine?.locate(id);},update(state,awaitingDispatch=false,dayThreeMarkers=null){
    const graduated=state.studied.length===RZData.lessons.length;
    const routingLessonsCompleted=state.routing?.ripComplete?3:state.routing?.diagnosisComplete||state.routing?.trained?2:state.routing?.labConfigured?1:0;
    const chapterComplete=Boolean(state.routing?.complete);
    const municipalComplete=Boolean(state.routing?.municipalComplete);
    const completedActivities=dayThreeMarkers
      ?routingLessonsCompleted+Number(chapterComplete)+Number(municipalComplete)
      :state.studied.length+state.completed;
    const totalActivities=dayThreeMarkers?5:RZData.lessons.length+RZData.missions.length;
    const overall=Math.round(completedActivities/totalActivities*100);
    discovered.clear();
    for(const site of buildings){
      const visible=dayThreeMarkers
        ?dayThreeMarkers.has(site.id)
        :(!awaitingDispatch||!Number.isInteger(site.mission))&&RZData.isBuildingDiscovered(site.id,state.completed,state.studied);
      if(visible)discovered.add(site.id);
    }
    for(const site of buildings){const button=buttons.get(site.id);button.hidden=!discovered.has(site.id);const done=Number.isInteger(site.mission)&&site.mission<state.completed&&!(site.id==='rescue'&&state.completed===3);
      let progress=site.id==='school'?Math.round(state.studied.length/RZData.lessons.length*100):site.id==='hq'?overall:done?100:0;
      let status=site.id==='school'?`${state.studied.length}/${RZData.lessons.length} prove · ${progress}%`:site.id==='hq'?`Avanzamento capitolo · ${progress}%`:done?'Online ✓ · 100%':!graduated?'Richiede tesserino':site.mission>state.completed?'In attesa':site.id==='rescue'&&state.completed===3?'Due squadre, una rete':'Intervento · 0%';
      const siteComplete=site.id==='services'?Boolean(state.vlan?.complete):site.id==='townhall'?municipalComplete:chapterComplete;
      if(site.id!=='hq'&&dayThreeMarkers?.has(site.id)){
        progress=site.id==='school'?Math.round(routingLessonsCompleted/3*100):siteComplete?100:0;
        status=siteComplete&&site.id!=='school'?'Collegamento ripristinato ✓':dayThreeMarkers.get(site.id);
      }
      button.classList.toggle('chapter-intervention',Boolean(dayThreeMarkers?.has(site.id)&&site.id!=='school'&&!siteComplete));
      button.style.setProperty('--progress',progress+'%');button.dataset.progress=String(progress);button.querySelector('small').textContent=status;button.setAttribute('aria-label',site.name+' — '+status);button.classList.toggle('progress-complete',progress===100&&(!dayThreeMarkers||site.id!=='school'));button.classList.toggle('repaired',dayThreeMarkers?site.id!=='school'&&siteComplete:done);button.classList.toggle('locked',Number.isInteger(site.mission)&&!RZData.canEnterMission(site.mission,state.completed,state.studied));
    }engine?.update(state.completed,dayThreeMarkers,chapterComplete,municipalComplete,Boolean(state.vlan?.complete),municipalComplete&&!state.vlanMorningPending);
  }};
};
})(typeof globalThis!=='undefined'?globalThis:this);
