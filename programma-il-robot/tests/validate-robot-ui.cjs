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
  getAttribute(k){return this.attrs[k];}
  addEventListener(k,fn){this.events[k]=fn;}
  showModal(){this.open=true;}
  focus(){this.focused=true;}
  setSelectionRange(){}
  createElement(tag){return new Element(tag);}
}
const read=f=>fs.readFileSync(path+'/'+f,'utf8');
assert.match(read('robot-livello.css'), /\.robot-wall\[hidden\][^{]*\{\s*display:\s*none\s*;/, 'I muri sulle caselle libere devono essere nascosti anche con display:grid');
const allSaved=new Map(levels.map(l=>[l.progressKey,solutions[l.number-1]]));
const failures=[];
let trialCount=0;
async function runLevel(level, saved, expected, source) {
 const shouldOpen=!saved.get('robot-level-one-intro-v3');
 const document=new Element();
 const context=vm.createContext({document, window:{addEventListener(){},location:{search:'?livello='+level.number}}, Image:Element, URLSearchParams, localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},requestAnimationFrame(){},matchMedia:()=>({matches:true}),setTimeout});
 for(const file of ['robot-levels.js','robot-engine.js','robot-livello.js'])vm.runInContext(read(file),context);
 const q=key=>document.querySelector(key);
 if(level.number===1){
  assert.equal(q('#robot-tutorial-open').hidden,false);
  assert.equal(!q('#robot-tutorial').hidden,shouldOpen);
  if(shouldOpen){
   assert.equal(saved.get('robot-level-one-intro-v3'),'seen');
   const next=q('#robot-tour-next');
   assert.equal(q('#robot-tutorial-title').textContent,'Consegna');
   for(let i=0;i<5;i++)next.events.click();
   assert.equal(next.textContent,'Fine');
   assert.equal(q('#robot-tutorial-title').textContent,'Esegui e verifica');
   next.events.click();
   assert.equal(q('#robot-tutorial').hidden,true);
   assert.equal(q('#robot-code').focused,true);
  }
 }
 const form=q('#robot-form'), feedback=q('#robot-feedback'), editor=q('#robot-code');
 if(!expected){assert.equal(editor.disabled,true);return;}
 assert.equal(editor.disabled,undefined);
 if(level.number===39){
  assert.ok(!editor.value.includes('int main()'),'Nel livello raccolta si completa solo la funzione');
  assert.equal(q('#robot-collection-sequence').textContent,'3 passi automatici');
 }
 if(level.number===43){ assert.equal(q('#robot-goal').hidden,false); assert.equal(q('#robot-goal').textContent,'✦'); }
 if(level.number===38){
  const navigation=q('#robot-function-references').children.find(node=>node.className==='robot-function-groups');
  assert.ok(navigation,'Le funzioni numerose devono essere raggruppate');
  const visited=new Set();
  for(const group of navigation.children){
   group.events.click();
   assert.equal(group.attrs['aria-pressed'],'true');
   const referenceButtons=q('#robot-function-buttons').children;
   assert.ok(referenceButtons.length>0);
   for(const button of referenceButtons){
    visited.add(button.textContent);
    button.events.click();
    assert.equal(q('#robot-function-preview').hidden,false);
    assert.ok(q('#robot-function-code').textContent.length>0);
   }
  }
  const expectedRefs=engine.referenceFunctions(level,levels,k=>saved.get(k)).filter(reference=>reference.name!=='collaudo');
  assert.equal(visited.size,expectedRefs.length,'Ogni funzione deve restare consultabile nei gruppi');
 }
 if(source)editor.value=source;
 const trialButtons = level.number===24 ? [{events:{click(){}},textContent:'Sequenza'}] : q('#robot-directions').children.filter((node,i)=>node.tag==='button' && (i===0 || (!source && !q('#robot-directions').hidden)));
 for(const button of trialButtons){
  button.events.click();
  if(level.number===24){
   assert.ok(!editor.value.includes('int main()'),'Solo consumaEnergia resta nell’editor');
   assert.deepEqual(q('#robot-directions').children.map(step=>step.textContent),['1. Avanza','2. Gira a destra','3. Avanza']);
  }
  if(level.number===6){
   const walls=q('#robot-board').children.filter(node=>node.className==='robot-wall');
   assert.equal(walls.length,25);
   assert.equal(walls.filter(node=>node.hidden).length,5,'Cinque caselle del corridoio libere da muri');
   assert.equal(walls.filter(node=>!node.hidden).length,20);
  }
  await form.events.submit({preventDefault(){}});
  if(level.number===24) assert.ok(q('#robot-directions').children.every(step=>step.attrs['aria-current']==='false'),'Gli indicatori si spengono al termine della sequenza');
  if(level.number===39){
   assert.equal(q('#robot-collection-sequence').attrs['data-active'],'false','L’indicatore si spegne al termine della sequenza');
   assert.equal(q('#robot-actor').style['--x'],3,'Tre passi in entrambe le prove');
   assert.equal(q('#robot-step-values').textContent,'Batteria · 9/12');
   if(button.textContent==='Casella vuota') assert.notEqual(q('#robot-actor').querySelector('img').src,'assets/robot-cuoricini.png','Niente cuoricini senza una moneta raccolta');
  }
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
