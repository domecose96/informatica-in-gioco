const assert = require('node:assert/strict');
const engine = require('../robot-engine.js');
const { ROBOT_LEVELS: levels, robotLevelAccess } = require('../robot-levels.js');
const forward = 'void avanza() { x += dx; y += dy; }';
const backward = 'void indietro() { x -= dx; y -= dy; }';
const right = 'void giraDestra() { int prima = dx; dx = -dy; dy = prima; }';
const left = 'void giraSinistra() { int prima = dx; dx = dy; dy = -prima; }';
const helpers = [forward,backward,right,left].join('\n\n');
const route = body => `${helpers}\nint main() { ${body} return 0; }`;
const arrival = 'bool arrivato(){ return x == ARRIVO_X && y == ARRIVO_Y; }';
const solutions = [
  'void avanza() { x += 1; }',
  forward,
  `${forward}\n${backward}`,
  `${forward}\n${backward}\n${right}`,
  helpers,
  `${helpers}\nvoid collaudo() { avanza(); giraDestra(); avanza(); indietro(); giraSinistra(); avanza(); }`,
  route('avanza(); avanza(); giraSinistra(); avanza(); avanza(); giraDestra(); avanza(); avanza();'),
  route('avanza(); avanza(); giraSinistra(); avanza(); avanza(); indietro(); giraDestra(); avanza(); avanza();'),
  route('for (int i = 0; i < 6; i++) { avanza(); } giraSinistra(); for (int i = 0; i < 6; i++) { avanza(); }')
];
const bounds = 'bool dentroGriglia(int colonna, int riga) { return colonna >= 0 && riga >= 0 && colonna < LARGHEZZA && riga < ALTEZZA; }';
const wall = 'bool cellaMuro(int colonna, int riga) { return mappa[riga][colonna] == 1; }';
const freeCell = 'bool casellaLibera(int colonna, int riga) { return dentroGriglia(colonna, riga) && !cellaMuro(colonna, riga); }';
const sensor = 'bool davantiLibero() { return casellaLibera(x + dx, y + dy); }';
const safe = 'void avanzaSicuro() { if (davantiLibero()) { avanza(); } }';
const base = 'bool cellaBase(int colonna, int riga) { return mappaBase[riga][colonna] == 1; }';
solutions.push(
  `${forward}\nvoid avanza(int passi) { for (int i=0; i<passi; i++) { avanza(); } }`,
  `${right}\nvoid giraIndietro() { giraDestra(); giraDestra(); }`,
  bounds,
  `${bounds}\n${wall}\n${freeCell}\n${sensor}`,
  `${forward}\n${bounds}\n${wall}\n${freeCell}\n${sensor}\n${safe}`,
  base,
  `${helpers}\n${bounds}\n${wall}\n${freeCell}\nint main() { while (casellaLibera(x + dx, y + dy)) { avanza(); } return 0; }`,
  `${helpers}\n${base}\nint main() { do { avanza(); } while (!cellaBase(x, y)); return 0; }`,
  `${bounds}\n${wall}\n${freeCell}`, wall,
  `${helpers} ${bounds} int main() { for (int i = 0; i < 4; i++) { if (!dentroGriglia(x + dx, y + dy)) { giraSinistra(); } avanza(); } return 0; }`,
  `${helpers} ${bounds} ${wall} ${freeCell} ${sensor} int main() { do { avanza(); } while (davantiLibero()); return 0; }`,
  `${forward} ${base} bool batteriaScarica() { return energia == 0; } void ricarica() { if (!batteriaScarica()) { return; } for (int riga = 0; riga < ALTEZZA; riga++) { for (int colonna = 0; colonna < LARGHEZZA; colonna++) { if (cellaBase(colonna, riga)) { x = colonna; y = riga; energia = CARICA_MASSIMA; return; } } } }`,
  'bool batteriaScarica() { return energia == 0; }',
  'void consumaEnergia() { if (energia > 0) { energia--; } }'
);
solutions.push(`${helpers} ${bounds} ${wall} ${freeCell} ${sensor} ${safe} ${base} ${solutions[23]} int main(){ while(davantiLibero()){ avanzaSicuro(); } giraSinistra(); while(!cellaBase(x,y)){ avanzaSicuro(); } return 0; }`);
solutions.push(`${helpers} ${bounds} ${wall} ${freeCell} ${sensor} ${safe} ${base} ${solutions[23]} ${solutions[22]} int main(){ while(!batteriaScarica()){ if(davantiLibero()){ avanzaSicuro(); } else { giraSinistra(); } } return 0; }`);
solutions.push(`${helpers} ${bounds} ${wall} ${freeCell} ${sensor} ${safe} ${base} ${solutions[23]} ${solutions[22]} ${engine.extractFunction(solutions[21],'ricarica')} ${arrival} int main(){ if(batteriaScarica()){ ricarica(); } while(!arrivato()){ indietro(); } return 0; }`);
const rightSensor = 'bool destraLibera(){ return casellaLibera(x - dy, y + dx); }';
const leftSensor = 'bool sinistraLibera(){ return casellaLibera(x + dy, y - dx); }';
const decisionBody = 'if(destraLibera()){ giraDestra(); } else if(davantiLibero()){} else if(sinistraLibera()){ giraSinistra(); } else { giraIndietro(); } avanzaSicuro();';
const autoStep = `void passoAutomatico(){ if(batteriaScarica()){ return; } ${decisionBody} }`;
const autonomousHelpers = `${helpers} ${bounds} ${wall} ${freeCell} ${sensor} ${safe} ${base} ${solutions[23]} ${solutions[22]} ${engine.extractFunction(solutions[21],'ricarica')} ${engine.extractFunction(solutions[9],'avanza',1)} ${engine.extractFunction(solutions[10],'giraIndietro')}`;
solutions.push(`${autonomousHelpers} ${rightSensor}`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor}`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor} ${autoStep}`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${arrival} int main(){ while(!arrivato()){ if(destraLibera()){giraDestra();} avanzaSicuro(); } return 0; }`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor} ${arrival} int main(){ int aperture=0; while(!arrivato()){ if(sinistraLibera()){ aperture++; if(aperture==2){giraSinistra();} } avanzaSicuro(); } return 0; }`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor} ${arrival} int main(){ while(!arrivato()){ ${decisionBody} } return 0; }`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor} ${autoStep} ${arrival} int main(){ while(!arrivato()){ passoAutomatico(); } return 0; }`);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor} ${autoStep} ${arrival} int main(){ if(batteriaScarica()){ricarica();} while(!cellaBase(x,y)){ passoAutomatico(); } while(!arrivato()){ passoAutomatico(); } return 0; }`);
solutions.push(arrival);
solutions.push(`${autonomousHelpers} ${rightSensor} ${leftSensor} ${autoStep} ${arrival} int main(){ while(!arrivato()){ passoAutomatico(); } return 0; }`);
const distribute = `void distribuisciMonete() {
  int piazzate = 0;
  while (piazzate < NUMERO_MONETE) {
    int colonna = casuale(LARGHEZZA);
    int riga = casuale(ALTEZZA);
    if (casellaLibera(colonna, riga) && !cellaBase(colonna, riga)
        && (colonna != x || riga != y) && monete[riga][colonna] == 0) {
      monete[riga][colonna] = 1;
      piazzate++;
    }
  }
}`;
const collect = `void raccogliMoneta() {
  if (monete[y][x] == 1) {
    monete[y][x] = 0;
    moneteRaccolte++;
  }
}`;
solutions.push(
  `${bounds} ${wall} ${freeCell} ${base} ${distribute}`,
  collect,
  `${helpers} ${bounds} ${wall} ${freeCell} ${base} ${sensor} ${solutions[23]} ${distribute} ${collect}
  int main() {
    while (moneteRaccolte < NUMERO_MONETE) {
      if (!davantiLibero()) { giraSinistra(); }
      avanza();
      raccogliMoneta();
    }
    return 0;
  }`
);
solutions.push(`${helpers} ${base} ${solutions[23]} ${collect}
  int main() {
    giraSinistra(); avanza(); raccogliMoneta(); giraDestra(); avanza(); giraDestra(); avanza(); giraSinistra();
    while (!cellaBase(x, y)) {
      avanza();
      raccogliMoneta();
    }
    return 0;
  }`);
const sweepBody = `
  for (int riga = 0; riga < ALTEZZA; riga++) {
    while (davantiLibero()) { avanzaSicuro(); raccogliMoneta(); }
    if (riga < ALTEZZA - 1) {
      if (riga % 2 == 0) {
        giraSinistra(); avanzaSicuro(); raccogliMoneta(); giraSinistra();
      } else {
        giraDestra(); avanzaSicuro(); raccogliMoneta(); giraDestra();
      }
    }
  }
`;
const coinHelpers = `${helpers} ${bounds} ${wall} ${freeCell} ${base} ${sensor} ${safe} ${solutions[23]} ${distribute} ${collect}`;
solutions.push(
  `${coinHelpers} int main() { ${sweepBody} return 0; }`,
  `${coinHelpers} ${rightSensor} ${leftSensor} ${solutions[22]}
    void giraIndietro(){ giraDestra(); giraDestra(); }
    ${autoStep} ${arrival}
    int main() {
      while (moneteRaccolte < NUMERO_MONETE || !arrivato()) {
        passoAutomatico();
        raccogliMoneta();
      }
      return 0;
    }`
);
solutions.push(
  `${autonomousHelpers} int main(){ while(davantiLibero()){ avanzaSicuro(); } giraSinistra(); while(davantiLibero()){ avanzaSicuro(); } return 0; }`,
  `${autonomousHelpers} ${arrival} int main(){ if(batteriaScarica()){ ricarica(); } while(!arrivato()){ avanzaSicuro(); } return 0; }`
);
const saved = new Map();
for (const level of levels) {
  const starter = engine.starter(level, levels, key => saved.get(key));
  if (level.number > 2 && !level.referenceHelpers) {
    const parsed = engine.parse(starter);
    for (const number of level.helpers || []) {
      const helper = levels[number-1].functionName;
      assert.ok(parsed.has(helper), `Level ${level.number}: carry ${helper}`);
      assert.deepEqual(parsed.get(helper),engine.parse(solutions[number-1]).get(helper));
    }
  }
  assert.ok(engine.validate(level, engine.parse(solutions[level.number-1])).length);
  saved.set(level.progressKey, solutions[level.number-1]);
}
assert.equal(engine.starter(levels[1],levels,key=>saved.get(key)),solutions[0]);
assert.throws(()=>engine.validate(levels[1],engine.parse(solutions[0])),/attesi/);
assert.throws(()=>engine.validate(levels[2],engine.parse(`${forward}\nvoid indietro() { x += dx; y += dy; }`)),/attesi/);
assert.throws(()=>engine.validate(levels[3],engine.parse(`${forward}\n${backward}\nvoid giraDestra() { dx = -dy; dy = dx; }`)));
assert.throws(()=>engine.validate(levels[6],engine.parse(route('giraSinistra(); avanza();'))),/Muro/);
assert.throws(()=>engine.validate(levels[7],engine.parse(route('avanza(); avanza(); giraSinistra(); avanza(); giraDestra(); avanza(); avanza();'))),/batteria/);
assert.throws(()=>engine.validate(levels[8],engine.parse(route('avanza(); avanza(); avanza(); avanza(); avanza(); avanza(); giraSinistra(); avanza(); avanza(); avanza(); avanza(); avanza(); avanza();'))),/for/);
assert.throws(() => engine.validate(levels[8], engine.parse(route(
  'int i = 0; while (i < 6) { avanza(); i++; } giraSinistra(); i = 0; while (i < 6) { avanza(); i++; }'
))), /due cicli for/);
assert.throws(() => engine.validate(levels[0], engine.parse('bool avanza() { x++; return true; }')), /firma void avanza/);
assert.throws(()=>engine.run(engine.parse('void avanza() { avanza(); }'),'avanza',{x:2,y:2},{dx:1,dy:0}),/volte/);
assert.throws(()=>engine.run(engine.parse('int main() { for (int i=0; i<6; i--) { } return 0; }'),'main',{x:0,y:0},{dx:1,dy:0}),/ciclo/);
assert.throws(()=>engine.run(engine.parse('void avanza() { alert(1); }'),'avanza',{x:2,y:2},{dx:1,dy:0}),/Manca la funzione/);
assert.throws(()=>engine.parse('void avanza() { x += 1 }'),/;/);
assert.throws(()=>engine.run(engine.parse('void avanza() { x = sconosciuta; }'),'avanza',{x:0,y:0},{dx:1,dy:0}),/non è dichiarata/);
console.log('Robot: 9 solutions, saved functions, wrong movements, walls, battery, loops and parser limits verified.');
module.exports = { solutions };

const collaudo = levels[5];
const onlyCollaudo = engine.extractFunction(solutions[5], 'collaudo');
const references = engine.referenceFunctions(collaudo, levels, key => saved.get(key));
assert.equal(engine.starter(collaudo, levels, key => saved.get(key)), engine.blank('collaudo'));
assert.equal(references.length, 4);
engine.validate(collaudo, engine.program(collaudo, onlyCollaudo, references));
assert.throws(() => engine.program(collaudo, onlyCollaudo, engine.referenceFunctions(collaudo, levels, () => null)), /Manca la funzione salvata/);
engine.validate(collaudo, engine.program(collaudo, onlyCollaudo, engine.referenceFunctions(collaudo, levels, () => null, solutions[5])));
console.log('Collaudo: editor singolo, quattro riferimenti salvati e recupero delle vecchie soluzioni verificati.');

for (const level of levels.filter(item => item.maze)) {
  const onlyMain = engine.extractFunction(solutions[level.number - 1], 'main');
  assert.equal(engine.starter(level, levels, key => saved.get(key)), engine.blank('main'));
  const references = engine.referenceFunctions(level, levels, key => saved.get(key));
  assert.equal(references.length, level.helpers.length);
  engine.validate(level, engine.program(level, onlyMain, references));
  if (!level.coinMode) engine.validate(level, engine.program(level, onlyMain, engine.referenceFunctions(level, levels, () => null, solutions[level.number - 1])));
}
console.log('Labirinti: solo main(), quattro riferimenti e vecchie soluzioni preservate.');

const read = number => key => number.includes(Number(key.split('.')[2])) ? 'saved' : null;
assert.throws(()=>engine.validate(levels[11],engine.parse('bool dentroGriglia(int c,int r) { return c>=0 && r>=0 && c<5 && r<5; }')),/prova non superata/);
assert.throws(()=>engine.validate(levels[12],engine.parse(`${bounds} bool davantiLibero() { return true; }`)),/prova non superata|Riusa/);
assert.throws(()=>engine.validate(levels[15],engine.parse(`${helpers} ${bounds} ${wall} ${freeCell} ${sensor} ${safe} int main(){ for(int i=0;i<6;i++){ avanzaSicuro(); } return 0; }`)),/while/);
assert.throws(()=>engine.validate(levels[16],engine.parse(`${helpers} ${base} int main(){ while(!cellaBase(x, y)){ avanza(); } return 0; }`)),/do/);
assert.throws(()=>engine.run(engine.parse('int main(){while(true){} return 0;}'),'main',{x:0,y:0},{dx:1,dy:0}),/ciclo/);
assert.throws(()=>engine.run(engine.parse('int main(){do {} while(true); return 0;}'),'main',{x:0,y:0},{dx:1,dy:0}),/ciclo/);
assert.throws(() => engine.validate(levels[17], engine.parse(`${bounds} ${wall} bool casellaLibera(int colonna, int riga) { return !cellaMuro(colonna, riga); }`)), /Indice fuori|Usa dentroGriglia/);
assert.throws(() => engine.validate(levels[18], engine.parse(wall.replace('[riga][colonna]', '[colonna][riga]'))), /prova non superata/);
const through11 = [...Array.from({length:12}, (_, i) => i + 1), 18, 19, 20];
const recharge = levels[21];
const chargeRun = engine.run(engine.parse(solutions[21]), 'ricarica', recharge.start, recharge.checks[0], recharge);
assert.deepEqual(chargeRun.trace.map(frame => frame.energia), [0, 12]);
assert.equal(chargeRun.trace.at(-1).teleport, true);
console.log('Parametri, bool, sensori, while e do…while verificati.');

const energyCheck = levels[22];
assert.equal(energyCheck.displayNumber, '17');
assert.equal(levels[21].displayNumber, '18');
const energyFunctions = engine.parse(solutions[22]);
engine.validate(energyCheck, energyFunctions);
assert.throws(() => engine.validate(energyCheck, engine.parse('bool batteriaScarica() { energia--; return energia == 0; }')), /prova non superata/);
const batteryDemo = engine.run(engine.parse(helpers + solutions[23] + solutions[22]), 'batteriaScarica', energyCheck.start, energyCheck.checks[0], {...energyCheck, batteryDemo:true});
assert.equal(batteryDemo.value, true);
assert.deepEqual(batteryDemo.trace.map(frame => frame.energia).filter((energy,index,array) => index === 0 || energy !== array[index-1]), Array.from({length:13}, (_,index) => 12-index));
console.log('Batteria: 12 movimenti, controllo di ogni carica e prerequisito del livello 17 verificati.');

assert.equal(levels[23].displayNumber, '16');
assert.throws(() => engine.validate(levels[23], engine.parse('void consumaEnergia() {}')), /prova non superata/);
assert.throws(() => engine.validate(levels[23], engine.parse('void consumaEnergia(){ if(energia > 0){energia -= 2;} }')), /prova non superata/);
const consumptionStarter = engine.starter(levels[23], levels, key => saved.get(key));
assert.equal(consumptionStarter, engine.blank('consumaEnergia'));
const completeReferences = engine.referenceFunctions(levels[22], levels, key => saved.get(key));
const batteryProgram = engine.program(levels[22], solutions[22], completeReferences);
const batteryRun = engine.run(batteryProgram, 'batteriaScarica', levels[22].start, levels[22].checks[0], {...levels[22],batteryDemo:true});
assert.equal(batteryRun.energia, 0);
console.log('15: consumaEnergia() scritta dallo studente e riusata nel 16.');

const integrated = engine.program(levels[23], solutions[23], engine.referenceFunctions(levels[23], levels, key => saved.get(key)));
for (const command of ['avanza','indietro','giraDestra','giraSinistra']) {
  const result = engine.run(integrated, command, {x:2,y:2}, {dx:1,dy:0}, {...levels[23],energiaIniziale:12});
  assert.equal(result.energia, 11);
  assert.equal(result.calls.filter(name=>name==='consumaEnergia').length, 1);
  const empty = engine.run(integrated, command, {x:2,y:2}, {dx:1,dy:0}, {...levels[23],energiaIniziale:0});
  assert.deepEqual([empty.x,empty.y,empty.dx,empty.dy,empty.energia], [2,2,1,0,0]);
}
const composedTurn = engine.parse(solutions[23] + 'void giraDestra(){int prima = dx; dx = -dy; dy = prima;} void giraSinistra(){giraDestra();giraDestra();giraDestra();}');
const turn = engine.run(composedTurn, 'giraSinistra', {x:2,y:2}, {dx:1,dy:0}, {...levels[23],energiaIniziale:12});
assert.equal(turn.energia, 11);
assert.equal(turn.calls.filter(name=>name==='consumaEnergia').length, 1);
assert.deepEqual([turn.dx,turn.dy],[0,-1]);
console.log('Quattro comandi: un consumo per azione, nessun consumo doppio con funzioni composte, blocco a zero.');

for (const commands of [['avanza','giraDestra','avanza'],['indietro','giraSinistra','indietro'],['giraDestra','avanza','giraSinistra'],['giraSinistra','avanza','giraDestra']]) {
  const demo = engine.run(integrated, 'consumaEnergia', {x:2,y:2}, {dx:1,dy:0}, {...levels[23],consumptionDemo:true,commands});
  assert.deepEqual(demo.trace.map(frame=>frame.energia),[12,11,10,9]);
  assert.deepEqual(demo.trace.slice(1).map(frame=>frame.command),commands);
}
console.log('15: quattro sequenze miste, tre comandi e tre tacche finali.');

const completeProgram = engine.program(levels[21], engine.extractFunction(solutions[21], 'ricarica'), engine.referenceFunctions(levels[21], levels, key => saved.get(key)));
const energyOptions = {size:5,codeEnergy:true,caricaMassima:12,energiaIniziale:12};
const multiple = engine.run(completeProgram, 'avanza', {x:0,y:2}, {dx:1,dy:0}, {...energyOptions,args:[3]});
assert.equal(multiple.energia, 9);
assert.equal(multiple.calls.filter(name=>name==='consumaEnergia').length, 3);
const reverse = engine.run(completeProgram, 'giraIndietro', {x:2,y:2}, {dx:1,dy:0}, energyOptions);
assert.equal(reverse.energia, 10);
const safeMovement = engine.run(completeProgram, 'avanzaSicuro', {x:2,y:2}, {dx:1,dy:0}, energyOptions);
assert.equal(safeMovement.energia, 11);
const blockedMovement = engine.run(completeProgram, 'avanzaSicuro', {x:4,y:2}, {dx:1,dy:0}, energyOptions);
assert.equal(blockedMovement.energia, 12);
const fullTest = engine.run(completeProgram, 'collaudo', {x:1,y:1}, {dx:1,dy:0}, energyOptions);
assert.equal(fullTest.energia, 6);
console.log('Funzioni composte: avanza(passi), giraIndietro(), avanzaSicuro() e collaudo() consumano tramite i comandi eseguiti.');

const evolvedConsumption = engine.parse(solutions[22]);
const lastUnit = engine.run(evolvedConsumption, 'batteriaScarica', {x:2,y:2}, {dx:1,dy:0}, {...energyCheck,energiaIniziale:1});
assert.equal(lastUnit.energia,1);
assert.equal(lastUnit.value,false);
const partialCharge = engine.run(evolvedConsumption, 'batteriaScarica', {x:2,y:2}, {dx:1,dy:0}, {...energyCheck,energiaIniziale:3});
assert.equal(partialCharge.energia,3);
assert.equal(partialCharge.value,false);
assert.match(engine.starter(energyCheck,levels,key=>saved.get(key)),/^bool batteriaScarica/);
console.log('16: controllo senza consumo e consumo singolo nella dimostrazione.');

const alwaysRecharges = engine.parse(solutions[21].replace('if (!batteriaScarica()) { return; }', ''));
assert.throws(() => engine.validate(recharge, alwaysRecharges), /Robot carico.*lasciare invariati/);
console.log('17: il trasferimento a batteria carica produce un messaggio specifico.');

for (const energiaIniziale of [0,1,3,6,9,12]) {
  const result = engine.run(completeProgram, 'batteriaScarica', {x:2,y:2}, {dx:1,dy:0}, {...energyOptions,energiaIniziale});
  assert.equal(result.energia, energiaIniziale);
  assert.equal(result.value, energiaIniziale === 0);
  assert.equal(result.calls.includes('consumaEnergia'), false);
}
assert.throws(() => engine.validate(energyCheck,engine.parse('bool batteriaScarica(){ energia = 0; return true; }')), /prova non superata/);
const rechargeReferences = engine.referenceFunctions(recharge,levels,key=>saved.get(key));
assert.ok(rechargeReferences.some(reference=>reference.name==='batteriaScarica'));
assert.match(rechargeReferences.find(reference=>reference.name==='consumaEnergia').code,/^void consumaEnergia/);
console.log('Controllo batteria: nessun consumo o modifica, anche con carica residua; entrambe le funzioni disponibili nel 17.');

assert.equal(levels[24].displayNumber,'8L');
const maze8Program=engine.program(levels[24],engine.extractFunction(solutions[24],'main'),engine.referenceFunctions(levels[24],levels,key=>saved.get(key)));
const maze8=engine.validate(levels[24],maze8Program)[0];
assert.deepEqual(maze8.trace.map(frame=>frame.energia),[6,5,4,3,2,1,0]);
assert.deepEqual([maze8.x,maze8.y],[2,1]);
assert.ok(!maze8.calls.includes('batteriaScarica')&&!maze8.calls.includes('ricarica'));
console.log('7L e 8L: base, consumo di passi e svolte, prerequisiti fino al 15 e riferimenti verificati.');

const longRouteSource = 'int main(){ giraSinistra(); while(davantiLibero()){ avanzaSicuro(); } giraDestra(); while(davantiLibero()){ avanzaSicuro(); } giraDestra(); while(!cellaBase(x,y)){ avanzaSicuro(); } return 0; }';
const longRouteProgram = engine.program(levels[24],longRouteSource,engine.referenceFunctions(levels[24],levels,key=>saved.get(key)));
assert.throws(()=>engine.run(longRouteProgram,'main',levels[24].start,levels[24].checks[0],levels[24]),error=>{
  assert.match(error.message,/Batteria scarica.*percorso/);
  assert.equal(error.preview.energia,0);
  assert.deepEqual([error.preview.x,error.preview.y],[0,0]);
  return true;
});
const longWithCharge=engine.run(longRouteProgram,'main',levels[24].start,levels[24].checks[0],{...levels[24],energiaIniziale:12});
assert.deepEqual([longWithCharge.x,longWithCharge.y,longWithCharge.energia],[2,1,2]);
console.log('8L: percorso breve da 6 comandi, percorso lungo da 10, arresto visibile a batteria scarica.');

for(const id of [26,27]) {
  const level=levels[id-1];
  const references=engine.referenceFunctions(level,levels,key=>saved.get(key));
  const program=engine.program(level,engine.extractFunction(solutions[id-1],'main'),references);
  const result=engine.validate(level,program)[0];
  assert.equal(result.energia,id===26?0:9);
  assert.equal(robotLevelAccess(level,read(levels.filter(l=>l.number!==(id===26?23:22)).map(l=>l.number))).unlocked,false);
  assert.ok(references.some(ref=>ref.name==='batteriaScarica'));
  assert.equal(references.some(ref=>ref.name==='ricarica'),id===27);
  if(id===27)assert.equal(result.trace.filter(frame=>frame.teleport).length,1);
}
console.log('9L e 10L: sensore batteria, condizioni di arresto, ricarica prima della ripartenza e prerequisiti verificati.');

for (const id of [28,29,30,31,32,33,34,35]) {
  const level=levels[id-1],references=engine.referenceFunctions(level,levels,key=>saved.get(key));
  const program=engine.program(level,engine.extractFunction(solutions[id-1],level.functionName),references);
  assert.ok(engine.validate(level,program).length);
}
for(const [id,required] of [[28,22],[29,28],[30,29],[31,28],[32,29],[33,29],[34,30],[37,30],[35,30]]){
  assert.equal(robotLevelAccess(levels[id-1],read(levels.filter(level=>level.number!==required).map(level=>level.number))).unlocked,false,`${id} requires ${required}`);
}
const rightReferences=engine.referenceFunctions(levels[27],levels,key=>saved.get(key));
assert.throws(()=>engine.validate(levels[27],engine.program(levels[27],'bool destraLibera(){ return davantiLibero(); }',rightReferences)),/prova non superata/);
const leftReferences=engine.referenceFunctions(levels[28],levels,key=>saved.get(key));
assert.throws(()=>engine.validate(levels[28],engine.program(levels[28],'bool sinistraLibera(){ giraSinistra(); return davantiLibero(); }',leftReferences)),/prova non superata/);
const autoReferences=engine.referenceFunctions(levels[29],levels,key=>saved.get(key));
assert.throws(()=>engine.validate(levels[29],engine.program(levels[29],'void passoAutomatico(){ if(batteriaScarica()){return;} if(davantiLibero()){avanzaSicuro();} else {giraDestra();avanzaSicuro();} }',autoReferences)),/prova non superata|priorità/);
assert.throws(()=>engine.validate(levels[32],engine.parse(solutions[32].replace(decisionBody,'if(sinistraLibera()){giraSinistra();} avanzaSicuro();'))),/Riusa|regola/);
const closing=engine.program(levels[34],engine.extractFunction(solutions[34],'main'),engine.referenceFunctions(levels[34],levels,key=>saved.get(key)));
const closingResult=engine.validate(levels[34],closing)[0];
const singleStage = engine.parse(solutions[34].replace('while(!cellaBase(x,y)){ passoAutomatico(); } ', ''));
assert.throws(() => engine.validate(levels[34], singleStage), /due cicli/);
assert.deepEqual([closingResult.x,closingResult.y,closingResult.energia],[4,3,5]);
const stationEntry = closingResult.trace.findIndex(frame => frame.x === 1 && frame.y === 2);
assert.ok(stationEntry > 0);
assert.equal(closingResult.trace[stationEntry].energia, levels[34].caricaMassima);
assert.equal(closingResult.trace[stationEntry + 1].energia, levels[34].caricaMassima - 1);
const closingLevel = levels[34];
const emptyRun = engine.run(closing, 'main', closingLevel.start, closingLevel.checks[0], {...closingLevel, energiaIniziale: 0});
assert.deepEqual(emptyRun.trace.slice(0, 3).map(frame => frame.energia), [0, 12, 11]);
assert.deepEqual([emptyRun.x, emptyRun.y, emptyRun.energia], [4, 3, 7]);
assert.equal(closingLevel.transition,true);
console.log('Guida autonoma: sensori nei quattro orientamenti, priorità e vicoli, refactoring, prerequisiti incrociati e collaudo finale verificati.');

const energyMission = levels[25];
for (const mutation of ['energia = 12;', 'for (int i = 0; energia < 12; energia++) {}']) {
  const source = solutions[25].replace('int main(){', `int main(){ ${mutation}`);
  assert.throws(() => engine.validate(energyMission, engine.parse(source)), /modificare direttamente/);
}
const bypassAfterRecharge = solutions[34].replace(
  'ricarica();}', 'ricarica(); giraDestra(); giraSinistra();}'
);
assert.throws(() => engine.validate(closingLevel, engine.parse(bypassAfterRecharge)), /Dopo la ricarica/);

for (const id of [38, 39, 40, 41, 42, 43]) {
  const level = levels[id - 1];
  const source = engine.extractFunction(solutions[id - 1], level.functionName);
  const references = engine.referenceFunctions(level, levels, key => saved.get(key));
  const program = engine.program(level, source, references);
  assert.ok(engine.validate(level, program).length);
  assert.equal(robotLevelAccess(level, read(levels.map(item => item.number).filter(n => n !== level.requires[0]))).unlocked, false);
}
const huntLevel = levels[39];
const hunt = engine.parse(solutions[39]);
for (let coinSeed = 0; coinSeed < 100; coinSeed++) {
  const result = engine.run(hunt, 'main', huntLevel.start, huntLevel.checks[0], {...huntLevel, coinSeed});
  assert.equal(result.trace[0].coins.length, 3);
  assert.equal(result.moneteRaccolte, 3);
  assert.equal(result.coins.length, 0);
  assert.equal(result.trace.filter(frame => frame.command === 'raccogliMoneta').length, 3);
}
assert.throws(() => engine.validate(levels[38], engine.parse('void raccogliMoneta() { moneteRaccolte++; }')), /Rimuovi solo/);
console.log('Monete: quattro livelli, 100 disposizioni, raccolta senza duplicati e prerequisiti verificati.');

const delivery = levels[40];
assert.equal(engine.validate(delivery, engine.parse(solutions[40]))[0].energia, 2);
const directDelivery = `${helpers} ${base} ${solutions[23]} ${collect}
int main(){ while(!cellaBase(x,y)){ avanza(); raccogliMoneta(); } return 0; }`;
assert.throws(() => engine.validate(delivery, engine.parse(directDelivery)), /tutte le monete/);

for (const id of [42,43]) {
  const level = levels[id-1];
  const program = engine.program(level, engine.extractFunction(solutions[id-1],'main'),
    engine.referenceFunctions(level,levels,key=>saved.get(key)));
  assert.equal(robotLevelAccess(level,read(levels.map(item=>item.number))).unlocked,true);
  for (let coinSeed=0;coinSeed<100;coinSeed++) {
    const result = engine.run(program,'main',level.start,level.checks[0],{...level,coinSeed});
    const initial = result.trace[0].coins.map(cell=>cell.split(',').map(Number));
    for (const axis of [0,1]) {
      const coordinates = initial.map(point=>point[axis]);
      assert.ok(Math.max(...coordinates)-Math.min(...coordinates)>=2);
    }
    assert.equal(result.moneteRaccolte,3);
    assert.equal(result.coins.length,0);
    if (id===42) assert.equal(new Set(result.trace.map(frame=>frame.x+','+frame.y)).size,23);
    if (id===42) assert.equal(result.energia,10);
    else { assert.equal(result.x,3); assert.equal(result.y,4); }
    const station = result.trace.find(frame=>frame.command==='avanza' && (id===42 ? frame.x===2 && frame.y===4 : frame.x===4 && frame.y===2));
    assert.equal(station.energia,12);
  }
  const incomplete = id===42
    ? solutions[id-1].replace(sweepBody, 'while(davantiLibero()){avanzaSicuro();raccogliMoneta();}')
    : solutions[id-1].replace('moneteRaccolte < NUMERO_MONETE || !arrivato()', '!arrivato()');
  assert.throws(()=>engine.validate(level,engine.parse(incomplete)));
  if (id===43) {
    assert.ok(!level.baseTiles.some(([x,y])=>x===level.goal.x && y===level.goal.y));
    assert.throws(()=>engine.validate(level,engine.parse(solutions[id-1].replace('moneteRaccolte < NUMERO_MONETE || !arrivato()', 'moneteRaccolte < NUMERO_MONETE'))));
  }
}
console.log('18L e collaudo 27: 200 disposizioni sparse, serpentina ed esplorazione con ricariche e stella separate verificate.');

// Intermediate checkpoints gate their chapter without changing saved level IDs.
for (const [checkpointId, nextId, required] of [[44,15,[14]],[45,28,[36]]]) {
  const checkpoint = levels[checkpointId-1];
  assert.deepEqual(checkpoint.requires,required);
  assert.equal(checkpoint.transition,true);
  assert.equal(checkpoint.maze,true);
  assert.equal(robotLevelAccess(levels[nextId-1],read(levels.filter(item=>item.number!==checkpointId).map(item=>item.number))).unlocked,false);
  for (const prerequisite of required) {
    assert.equal(robotLevelAccess(checkpoint,read(levels.filter(item=>item.number!==prerequisite).map(item=>item.number))).unlocked,false);
  }
  const program = engine.program(checkpoint,engine.extractFunction(solutions[checkpointId-1],'main'),engine.referenceFunctions(checkpoint,levels,key=>saved.get(key)));
  assert.ok(engine.validate(checkpoint,program).length>=4);
}
assert.throws(()=>engine.validate(levels[43],engine.parse(solutions[43].replace('giraSinistra(); while','giraDestra(); while'))));
assert.throws(()=>engine.validate(levels[44],engine.parse(solutions[44].replace('if(batteriaScarica()){ ricarica(); }','ricarica();'))),/batteriaScarica|soltanto/);
console.log('Collaudi 14 e 20: sensori ruotati, carica 0/1/12, traguardi variabili e sblocchi dei capitoli verificati.');

const normalNumbers = levels.filter(level=>!level.displayNumber.endsWith('L')).map(level=>Number(level.displayNumber)).sort((a,b)=>a-b);
assert.deepEqual(normalNumbers,Array.from({length:27},(_,i)=>i+1));
assert.equal(new Set(levels.map(level=>level.displayNumber)).size,levels.length);
assert.equal(levels[43].displayNumber,'14');
assert.equal(levels[44].displayNumber,'20');
assert.equal(levels[34].displayNumber,'24');
assert.equal(levels[42].displayNumber,'27');
console.log('Numerazione continua 01–27: collaudi integrati, etichette univoche e ID dei salvataggi preservati.');

// All 27 main stages can be completed with no optional mission saved.
const mainPath=levels.filter(l=>!l.optional).sort((a,b)=>parseInt(a.displayNumber)-parseInt(b.displayNumber));
const mainSaved=new Map();
for(const l of mainPath){
 assert.equal(robotLevelAccess(l,k=>mainSaved.get(k)).unlocked,true,`Main ${l.displayNumber} must not require L missions`);
 assert.ok(l.requires.every(id=>!levels[id-1].optional));
 const refs=engine.referenceFunctions(l,levels,k=>mainSaved.get(k));
 const program=engine.program(l,engine.extractFunction(solutions[l.number-1],l.functionName,l.arity||0),refs);
 assert.ok(engine.validate(l,program).length,`Main-only helpers: ${l.displayNumber}`);
 mainSaved.set(l.progressKey,solutions[l.number-1]);
}
assert.equal(levels.filter(l=>l.optional).length,18);
for(const l of levels.filter(l=>l.optional)){
 assert.ok(l.requires.length>0 && l.requires.every(id=>!levels[id-1].optional));
 assert.equal(robotLevelAccess(l,()=>null).unlocked,false);
 assert.equal(robotLevelAccess(l,k=>mainSaved.get(k)).unlocked,true);
 const refs=engine.referenceFunctions(l,levels,k=>mainSaved.get(k));
 assert.ok(engine.validate(l,engine.program(l,engine.extractFunction(solutions[l.number-1],'main'),refs)).length);
 for(const id of l.requires)assert.equal(robotLevelAccess(l,k=>k===levels[id-1].progressKey?null:mainSaved.get(k)).unlocked,false);
}
assert.throws(()=>engine.validate(levels[31],engine.parse(solutions[31].replace('aperture==2','aperture==1'))));
assert.throws(()=>engine.validate(levels[36],engine.parse(solutions[36].replace('while(!arrivato())','do').replace('passoAutomatico(); } return','passoAutomatico(); } while(!arrivato()); return'))));
console.log('27 livelli principali senza sfide L; 18 sfide indipendenti, strumenti salvati, seconda apertura e arresto anticipato verificati.');
