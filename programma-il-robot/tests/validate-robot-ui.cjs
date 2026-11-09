const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const path=require('node:path').resolve(__dirname,'..');
const {ROBOT_LEVELS:levels,robotLevelAccess}=require(path+'/robot-levels.js');
const engine=require(path+'/robot-engine.js');
const {solutions}=require(path+'/tests/validate-robot.cjs');
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.events={};this.selectors=new Map();this.attrs={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classList={add(){},remove(){},toggle(){}};}
  append(...nodes){this.children.push(...nodes);}
  prepend(node){this.children.unshift(node);}
  replaceChildren(...nodes){this.children=nodes;}
  querySelector(key){if(!this.selectors.has(key))this.selectors.set(key,new Element(key));return this.selectors.get(key);}
  querySelectorAll(key){return this.children.filter(node=>node.tag===key);}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}
  setSelectionRange(){}
  createElement(tag){return new Element(tag);}
}
const read=f=>fs.readFileSync(path+'/'+f,'utf8');
const allSaved=new Map(levels.map(l=>[l.progressKey,solutions[l.number-1]]));
const failures=[];
let trialCount=0;
async function runLevel(level, saved, expected, source) {
 const document=new Element();
 const context=vm.createContext({document, window:{location:{search:'?livello='+level.number}}, Image:Element, URLSearchParams, localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},requestAnimationFrame(){},matchMedia:()=>({matches:true}),setTimeout});
 for(const file of ['robot-levels.js','robot-engine.js','robot-livello.js'])vm.runInContext(read(file),context);
 const q=key=>document.querySelector(key);
 const form=q('#robot-form'), feedback=q('#robot-feedback'), editor=q('#robot-code');
 if(!expected){assert.equal(editor.disabled,true);return;}
 assert.equal(editor.disabled,undefined);
 if(level.number===43){ assert.equal(q('#robot-goal').hidden,false); assert.equal(q('#robot-goal').textContent,'✦'); }
 if(source)editor.value=source;
 for(const button of q('#robot-directions').children.filter((_,i)=>i===0 || (!source && !q('#robot-directions').hidden))){
  button.events.click();
  await form.events.submit({preventDefault(){}});
  trialCount++;
  if([40,41].includes(level.number)) assert.equal(q('#robot-coin-counter').textContent,'Raccolte 3/3 · Disponibili 0');
  if(level.number===39) assert.equal(q('#robot-coin-counter').textContent,button.textContent==='Tre monete'?'Raccolte 3/3 · Disponibili 0':'Raccolte 0/3 · Disponibili 3');
  if(feedback.dataset.state!=='success') failures.push([level.displayNumber,button.textContent,feedback.textContent]);
 }
 return q('#robot-finish').href;
}
(async()=>{
 const required=new Set();
 const active=new Set();
 function visit(l){
   assert.ok(!active.has(l.number),'Ciclo di prerequisiti');
   if(required.has(l.number))return;
   active.add(l.number);
   for(const id of l.requires)visit(levels[id-1]);
   active.delete(l.number);
   required.add(l.number);
 }
 visit(levels[34]); assert.equal(required.size,24);
 for(const l of levels){
  const next = await runLevel(l,new Map(allSaved),true);
  const nextDisplay=String(parseInt(l.displayNumber)+1).padStart(l.optional?1:2,'0')+(l.optional?'L':'');
  const destination=levels.find(item=>item.displayNumber===nextDisplay);
  assert.equal(next,destination?'robot-livello.html?livello='+destination.number:'index.html#percorso-robot');
  const prereqs=new Map(allSaved); prereqs.delete(l.progressKey);
  if(l.requires.length){
   prereqs.delete(levels[l.requires[0]-1].progressKey);
   await runLevel(l,prereqs,false);
  }
  if(l.maze){
    for(const p of [l.start,...(l.goal?[l.goal]:[]),...(l.baseTiles||[]).map(([x,y])=>({x,y}))]){
      assert.ok(l.tiles.some(([x,y])=>p.x===x&&p.y===y),l.title);
    }
  }
 }
 const mainSaved=new Map();
 for(const l of levels.filter(l=>!l.optional).sort((a,b)=>parseInt(a.displayNumber)-parseInt(b.displayNumber))){
  const source=engine.extractFunction(solutions[l.number-1],l.functionName,l.arity||0);
  const next=await runLevel(l,mainSaved,true,source);
  assert.deepEqual(failures,[],l.displayNumber);
  const destination=levels.find(item=>!item.optional&&parseInt(item.displayNumber)===parseInt(l.displayNumber)+1);
  assert.equal(next,destination?'robot-livello.html?livello='+destination.number:'index.html#percorso-robot');
 }
 console.log(trialCount+' prove UI',failures);
 assert.deepEqual(failures,[]);
})();
