const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {ROBOT_LEVELS:levels}=require(process.cwd()+'/dist/robot-levels.js');
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={};this.dataset={};this.events={};this.items=new Map();this.classList={add(){}};}
 append(...nodes){this.children.push(...nodes);}
 prepend(node){this.children.unshift(node);}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(key,fn){this.events[key]=fn;}
 querySelector(key){if(!this.items.has(key))this.items.set(key,new Element(key));return this.items.get(key);}
}
const saved=new Map();
const doc=new Element();
doc.createElement=tag=>new Element(tag);
doc.createElementNS=(_,tag)=>doc.createElement(tag);
const up=new Element('button'),down=new Element('button');
up.dataset.scroll=-1; down.dataset.scroll=1;
doc.querySelectorAll=()=>[up,down];
const viewport=doc.querySelector('#level-map');
viewport.clientHeight=420; viewport.scrollTop=0;
viewport.scrollTo=({top})=>{viewport.scrollTop=top;viewport.events.scroll();};
const canvas=doc.querySelector('#robot-route-map');
canvas.querySelector('.route-zone-maze').offsetTop=170;
canvas.querySelector('.route-zone-advanced').offsetTop=365;
for (const l of levels)if(![34,37,35].includes(l.number))saved.set(l.progressKey,'done');
canvas.querySelector('.route-zone-coins').offsetTop=2075;
canvas.querySelector('.route-zone-energy').offsetTop=935;
canvas.querySelector('.route-zone-guidance').offsetTop=1505;
const ctx=vm.createContext({document:doc,localStorage:{getItem:key=>saved.get(key)},matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}}});
for(const f of ['robot-levels.js','robot-map.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),ctx);
assert.equal(canvas.children.length,45);
assert.equal(canvas.querySelector('svg').children.length,51);
assert.equal(new Set(canvas.children.map(e=>e.style.left+','+e.style.top)).size,45);
const last=canvas.children[34].children[0];
assert.equal(last.tag,'button');assert.equal(last.disabled,true);
const stops=[0];
while(down.attrs['aria-disabled']!==true){down.events.click();stops.push(viewport.scrollTop);assert.ok(stops.length<=13);}
assert.equal(stops.length,13);
for(const expected of stops.slice(0,-1).reverse()){up.events.click();assert.equal(viewport.scrollTop,expected);}
console.log('45 tessere, 51 tratti, 13 righe, collaudo bloccato e frecce verificati');

const point=id=>({x:parseFloat(canvas.children[id-1].style.left)*10,y:parseFloat(canvas.children[id-1].style.top)});
assert.equal(point(44).x,300);
for (const id of [45,35,43]) assert.equal(point(id).x,500);
for (const ids of [[17,25,26,27],[31,32,33,34,37],[40,41,42]]) for(const id of ids)assert.ok(point(id).x<=300);
for(const id of [15,24,23,22,36,28,29,30,38,39])assert.ok(point(id).x>=500);
// No route may pass through an unrelated level square.
for(const edge of canvas.querySelector('svg').children){
 const tokens=edge.attrs.d.match(/[MHV]|-?\d+(?:\.\d+)?/g);
 let x,y;
 while(tokens.length){
  const command=tokens.shift();
  if(command==='M'){x=Number(tokens.shift());y=Number(tokens.shift());continue;}
  const nx=command==='H'?Number(tokens.shift()):x;
  const ny=command==='V'?Number(tokens.shift()):y;
  for(const level of levels){
   if([Number(edge.attrs['data-from']),Number(edge.attrs['data-to'])].includes(level.number))continue;
   const p=point(level.number);
   const inside=command==='H'?Math.abs(p.y-y)<25&&p.x>Math.min(x,nx)+1&&p.x<Math.max(x,nx)-1
     :Math.abs(p.x-x)<25&&p.y>Math.min(y,ny)+1&&p.y<Math.max(y,ny)-1;
   assert.ok(!inside,`Tratto ${edge.attrs.d} attraversa ${level.displayNumber}`);
  }
  x=nx;y=ny;
 }
}
// Preview data is written only when explicitly requested.
if(process.env.ROBOT_MAP_PREVIEW) fs.writeFileSync('/tmp/robot-map-layout.json',JSON.stringify({levels:levels.map(l=>({...point(l.number),label:l.displayNumber,title:l.title,transition:!!(l.transition||l.coinFinal||l.number===6),branch:l.branch})),edges:canvas.querySelector('svg').children.map(e=>e.attrs)}));

assert.equal(point(16).x,point(21).x);
assert.ok(point(21).y>point(16).y);
assert.equal(point(12).y,point(19).y);
assert.ok(point(19).x<point(12).x);
assert.equal(point(19).x,point(18).x);
assert.ok(point(18).y>point(19).y);
assert.equal(point(18).y,point(13).y);
assert.ok(point(13).x>point(18).x);
assert.equal(point(13).x,point(14).x);
assert.ok(point(14).y>point(13).y);
// Forks meet the first squares directly, with no empty horizontal rail above them.
for (const [checkpoint,normal,maze] of [[44,15,17],[45,28,31],[35,38,40]]) {
 const row=point(normal).y;
 assert.equal(point(maze).y,row);
 const branches=canvas.querySelector('svg').children.filter(edge=>Number(edge.attrs['data-from'])===checkpoint);
 assert.equal(branches.length,2);
 for (const edge of branches) assert.ok(edge.attrs.d.startsWith(`M${point(checkpoint).x} ${row}H`));
}

const rows=[...new Set(levels.map(level=>point(level.number).y))].sort((a,b)=>a-b);
for(let i=1;i<rows.length;i++)assert.ok(rows[i]-rows[i-1]<=190,'Nessuna riga vuota tra i capitoli');
// Energy alternates vertical, horizontal and upward steps.
assert.equal(point(15).x,point(24).x);
assert.ok(point(24).y>point(15).y);
assert.equal(point(24).y,point(23).y);
assert.equal(point(23).y,point(22).y);
assert.ok(point(22).x>point(23).x);
assert.equal(point(22).x,point(36).x);
assert.equal(point(36).y-point(22).y,190);

assert.equal(point(28).x,point(29).x);
assert.equal(point(29).x,point(30).x);
assert.equal(point(29).y-point(28).y,190);
assert.equal(point(30).y-point(29).y,190);

assert.equal(point(43).y,point(42).y);
assert.equal(point(43).y,point(39).y);
assert.ok(point(43).x>point(42).x && point(43).x<point(39).x);
