const viewport=document.querySelector('#level-map');
const canvas=document.querySelector('#robot-route-map');
const svg=canvas.querySelector('svg');
const controls=[...document.querySelectorAll('[data-scroll]')];
const status=document.querySelector('#robot-map-status');
const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
// Five shared columns; each chapter ends at a central checkpoint.
const coordinates=new Map([
 [1,{x:100,y:55}],[2,{x:300,y:55}],[3,{x:500,y:55}],[4,{x:700,y:55}],[5,{x:900,y:55}],
 [6,{x:900,y:240}],[7,{x:700,y:240}],[8,{x:500,y:240}],[9,{x:300,y:240}],[20,{x:100,y:240}],
 [16,{x:100,y:430}],[21,{x:100,y:620}],[10,{x:900,y:430}],[11,{x:700,y:430}],[12,{x:500,y:430}],
 [19,{x:300,y:430}],[18,{x:300,y:620}],[13,{x:500,y:620}],
 [14,{x:500,y:810}],[44,{x:300,y:810}],
 [17,{x:100,y:1000}],[25,{x:100,y:1190}],[15,{x:500,y:1000}],[24,{x:500,y:1190}],[23,{x:700,y:1190}],
 [26,{x:300,y:1190}],[27,{x:300,y:1380}],[22,{x:900,y:1190}],[36,{x:900,y:1380}],
 [45,{x:500,y:1380}],
 [31,{x:300,y:1570}],[32,{x:100,y:1570}],[28,{x:700,y:1570}],[29,{x:700,y:1760}],
 [33,{x:100,y:1760}],[34,{x:300,y:1760}],[30,{x:700,y:1950}],
 [37,{x:300,y:1950}],[35,{x:500,y:1950}],
 [40,{x:300,y:2140}],[41,{x:100,y:2140}],[38,{x:700,y:2140}],[39,{x:700,y:2330}],
 [42,{x:100,y:2330}],[43,{x:500,y:2330}]
]);
document.querySelector('.map-hint-overview').textContent=`27 livelli principali · 18 sfide facoltative`;
const access=new Map(ROBOT_LEVELS.map(level=>[level.number,robotLevelAccess(level,read)]));
function path(from,to,route) {
  const a=coordinates.get(from),b=coordinates.get(to);
  const line=document.createElementNS('http://www.w3.org/2000/svg','path');
  line.setAttribute('data-from',from);
  line.setAttribute('data-to',to);
  line.setAttribute('d',route||`M${a.x} ${a.y}H${b.x}V${b.y}`);
  const destination=ROBOT_LEVELS[to-1];
 const completed=!!read(ROBOT_LEVELS[from-1].progressKey)&&access.get(from).unlocked
  && (!((destination.transition || destination.coinFinal) || to === 40) || access.get(to).unlocked);
  line.setAttribute('class',`route-edge route-${(destination.transition || destination.coinFinal) ? 'transition' : destination.branch}${completed?' route-active':''}`);
  svg.append(line);
}
// A neutral stem separates a checkpoint from the next pair of tracks.
function fork(from, normal, maze) {
 const point=coordinates.get(from);
 const y=coordinates.get(normal).y;
 const stem=document.createElementNS('http://www.w3.org/2000/svg','path');
 stem.setAttribute('d',`M${point.x} ${point.y}V${y}`);
 stem.setAttribute('class',`route-edge route-transition${read(ROBOT_LEVELS[from-1].progressKey)&&access.get(from).unlocked?' route-active':''}`);
 svg.append(stem);
 const a=coordinates.get(normal),b=coordinates.get(maze);
 path(from,normal,`M${point.x} ${y}H${a.x}V${a.y}`);
 path(from,maze,`M${point.x} ${y}H${b.x}V${b.y}`);
}
for(let n=1;n<5;n++)path(n,n+1);
path(5,6,'M900 55H970V240H900');
path(6,7);
path(6,10);
path(7,8);path(8,9);path(9,20);
path(20,16,'M100 240H20V430H100');path(16,21);
// Movement and sensors: labyrinths on the left, functions on the right.
const movementRoute=[10,11,12,19,18,13,14,44];
for(let i=1;i<movementRoute.length;i++)path(movementRoute[i-1],movementRoute[i]);

// Energy and destination.
fork(44,15,17);
path(15,24);path(24,23);path(23,22);path(22,36);
path(36,45);
path(17,25);path(25,26);path(26,27);

// Autonomous guidance.
fork(45,28,31);
path(28,29);path(29,30);
path(30,35);
path(31,32);path(32,33);path(33,34);path(34,37);
// Coins.
fork(35,38,40);
path(38,39);path(40,41);path(41,42);

path(39,43);
for(const level of ROBOT_LEVELS) {
 const state=access.get(level.number),point=coordinates.get(level.number);
 const completed=state.unlocked&&!!read(level.progressKey);
 const item=document.createElement('div');item.className=`route-node route-${level.branch}${completed?' level-completed':''}`;
 if(level.number===6 || level.transition || level.coinFinal)item.classList.add('route-transition');
 item.style.left=`${point.x/1000*100}%`;item.style.top=`${point.y}px`;
 if(state.unlocked&&!completed)item.setAttribute('aria-current','step');
 const number=document.createElement(state.unlocked?'a':'button');number.className='level-number';number.textContent=level.displayNumber;
 if(level.number===6 || level.transition || level.coinFinal){
  const badge=document.createElement('span');
  badge.className='transition-badge';
  badge.textContent=state.unlocked?'Collaudo':'Bloccato';
  badge.setAttribute('aria-hidden','true');
  number.prepend(badge);
 }
 const label=document.createElement('strong');label.textContent=(level.checkpoint || level.coinFinal || level.transition) ? level.title.replace(/^Collaudo\s*/,'') : level.title;
 const detail=document.createElement('small');detail.className='route-function';detail.textContent=level.optional?'Facoltativo':level.maze?'Collaudo':`${level.functionName}(${level.arity?'…':''})`;
 if (level.number === 38) detail.classList.add('route-function-long');
 detail.title=detail.textContent;
 const progress=document.createElement('small');progress.className='level-status';progress.textContent=completed?'Completato':state.unlocked?'Disponibile':`Richiede ${state.missing.map(n=>ROBOT_LEVELS[n-1].displayNumber).join(' + ')}`;
 if(state.unlocked){number.href=`robot-livello.html?livello=${level.number}`;number.setAttribute('aria-label',`Apri il livello ${level.displayNumber}, ${level.title}`);}
 else {
  number.type='button';number.setAttribute('aria-disabled','true');
  if(level.number===6 || level.transition || level.coinFinal)number.disabled=true;
  const message=`${level.title}: completa prima ${state.missing.map(n=>ROBOT_LEVELS[n-1].title).join(' e ')}.`;
  number.setAttribute('aria-label',message);number.title=message;number.addEventListener('click',()=>{status.textContent=message;});
 }
 item.append(number,label,detail,progress);canvas.append(item);
}
const routeRows=[...new Set([...coordinates.values()].map(point=>point.y))].sort((a,b)=>a-b);
let rowStops=[];
const rowTitles = new Map([
 [coordinates.get(7).y, canvas.querySelector('.route-zone-maze')],
 [coordinates.get(10).y, canvas.querySelector('.route-zone-advanced')],
 [coordinates.get(15).y, canvas.querySelector('.route-zone-energy')],
 [coordinates.get(28).y, canvas.querySelector('.route-zone-guidance')],
 [coordinates.get(38).y, canvas.querySelector('.route-zone-coins')]
]);
let requestedScroll=null;
// Keep space below the final row so every row can reach the same position.
const routeHeight = Math.max(...routeRows) + 200;
svg.setAttribute('viewBox', `0 0 1000 ${routeHeight}`);
svg.style.height = `${routeHeight}px`;
function syncControls(){
 const position=requestedScroll??viewport.scrollTop;
 controls[0].setAttribute('aria-disabled',position<=rowStops[0]+1);
 controls[1].setAttribute('aria-disabled',position>=rowStops.at(-1)-1);
}
function sizeMap(){
 rowStops=routeRows.map((y,index)=>{
  if(index===0)return 0;
  const rowTop = y - routeRows[0] + 8;
  const title = rowTitles.get(y);
  return title ? Math.min(rowTop, title.offsetTop - 4) : rowTop;
 });
 canvas.style.height=`${Math.max(routeHeight,rowStops.at(-1)+viewport.clientHeight)}px`;
 syncControls();
}
controls.forEach(button=>button.addEventListener('click',()=>{
 const current=requestedScroll??viewport.scrollTop;
 const down=Number(button.dataset.scroll)>0;
 const target=down?rowStops.find(y=>y>current+1):rowStops.findLast(y=>y<current-1);
 if(target===undefined)return;
 requestedScroll=target;syncControls();
 viewport.scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}));
viewport.addEventListener('scroll',()=>{
 if(requestedScroll!==null&&Math.abs(viewport.scrollTop-requestedScroll)<1)requestedScroll=null;
 syncControls();
},{passive:true});
for(const event of ['wheel','pointerdown','touchstart'])viewport.addEventListener(event,()=>{requestedScroll=null;},{passive:true});
new ResizeObserver(sizeMap).observe(viewport);sizeMap();
if(read('robot.level.6.solution')){
 status.textContent='Prosegui nel percorso principale in azzurro. Le sfide L in giallo sono facoltative e si sbloccano con le funzioni richieste.';

}
