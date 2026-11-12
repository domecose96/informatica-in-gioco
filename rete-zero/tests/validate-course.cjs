const assert=require('node:assert/strict');
const {lessons,buildings,practice,isLessonUnlocked,canEnterMission}=require('../data.js');
assert.equal(new Set(buildings.map(b=>b.id)).size,5);
assert.equal(lessons.length,7);
assert.equal(lessons[0].binaryExample,'192.168.0.0');
const terminalSteps={cli:2,'cli-router':7};
for(let i=0;i<lessons.length;i++){
 if(lessons[i].terminal){
  assert.equal(lessons[i].terminal.steps.length,terminalSteps[lessons[i].id]);
  assert.equal(new Set(lessons[i].terminal.steps.map(step=>step.command)).size,terminalSteps[lessons[i].id]);
  assert.equal(practice(i,{}).ok,false);
  continue;
 }
 assert.equal(practice(i,lessons[i].solution).ok,true);
 assert.equal(practice(i,{}).ok,false);
 for(const field of lessons[i].fields){
  const wrong={...lessons[i].solution,[field.key]:'sbagliato'};
  assert.equal(practice(i,wrong).ok,false);
 }
}
const certificate=lessons.map(l=>l.id);
assert.equal(isLessonUnlocked(0,[]),true);
assert.equal(isLessonUnlocked(1,[]),false);
assert.equal(isLessonUnlocked(1,[lessons[0].id]),true);
assert.equal(isLessonUnlocked(5,certificate.slice(0,4)),false);
assert.equal(isLessonUnlocked(5,certificate.slice(0,5)),true);
assert.equal(isLessonUnlocked(6,certificate.slice(0,5)),false);
assert.equal(isLessonUnlocked(6,certificate.slice(0,6)),true);
assert.equal(canEnterMission(0,0,[]),false);
assert.equal(canEnterMission(0,0,certificate.slice(0,-1)),false);
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
console.log('OK: sette moduli, laboratorio CLI, tesserino e progressione dei tre interventi verificati.');
