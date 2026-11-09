const assert=require('node:assert/strict');
const {lessons,buildings,practice,canEnterMission}=require('../data.js');
assert.equal(new Set(buildings.map(b=>b.id)).size,5);
assert.equal(lessons.length,4);
for(let i=0;i<lessons.length;i++){
 assert.equal(practice(i,lessons[i].solution).ok,true);
 assert.equal(practice(i,{}).ok,false);
 for(const field of lessons[i].fields){
  const wrong={...lessons[i].solution,[field.key]:'sbagliato'};
  assert.equal(practice(i,wrong).ok,false);
 }
}
const certificate=lessons.map(l=>l.id);
assert.equal(canEnterMission(0,0,[]),false);
assert.equal(canEnterMission(0,0,certificate.slice(0,3)),false);
assert.equal(canEnterMission(0,0,['ip','ip','ip','ip']),false);
assert.equal(canEnterMission(0,0,certificate),true);
assert.equal(canEnterMission(1,0,certificate),false);
assert.equal(canEnterMission(1,1,certificate),true);
assert.equal(canEnterMission(2,1,certificate),false);
assert.equal(canEnterMission(2,2,certificate),true);
assert.equal(canEnterMission(0,3,certificate),true);
assert.equal(canEnterMission(3,3,certificate),false);
// Le sedi principali appartengono a quartieri separati, non a un unico piazzale.
for(let a=0;a<buildings.length;a++)for(let b=a+1;b<buildings.length;b++)assert.ok(Math.hypot(buildings[a].position[0]-buildings[b].position[0],buildings[a].position[1]-buildings[b].position[1])>15);
console.log('OK: quattro prove, tesserino e progressione dei tre interventi verificati.');
