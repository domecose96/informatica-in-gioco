const fs = require('fs');
const path = require('path');
const assert = require('assert');
const initSqlJs = require('../dist/vendor/sql-wasm.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const missionMatch = source.match(/const missions = (\[[\s\S]*?\n\]);\n\nconst clueTexts/);
const seedMatch = source.match(/const seed = `([\s\S]*?)`;/);
assert(missionMatch && seedMatch, 'Impossibile leggere missioni o database dal gioco');

function includes(rows,key,needle){return rows.some(row=>Object.entries(row).some(([k,v])=>(!key||k===key)&&String(v).toLowerCase().includes(String(needle).toLowerCase())))}
function has(rows,key,value){return rows.some(row=>String(row[key])===String(value))}
function valueOf(rows,key){return rows[0]?.[key]}
const missions = eval(missionMatch[1]);

const solutions = [
  "SELECT * FROM eventi WHERE data='2026-10-31' AND tipo='allarme'",
  "SELECT c.nome,c.cognome,a.ora_badge,a.varco,a.esito FROM accessi_archivio a JOIN cittadini c ON c.id=a.cittadino_id WHERE a.data='2026-10-31' AND a.ora_badge>'21:45' ORDER BY a.ora_badge",
  "SELECT DISTINCT targa,direzione FROM telecamere WHERE data='2026-10-31' AND ora>'22:14' AND direzione='tangenziale'",
  "SELECT c.nome,c.cognome,v.targa,v.modello,v.colore FROM veicoli v JOIN cittadini c ON c.id=v.cittadino_id WHERE v.targa IN ('TO-314-XR','MI-770-KA')",
  "SELECT c.nome,c.cognome,p.data_prestito FROM prestiti_documenti p JOIN cittadini c ON c.id=p.cittadino_id WHERE p.codice_fascicolo='F-204' ORDER BY p.data_prestito",
  "SELECT DISTINCT mitt.nome,mitt.cognome FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE dest.professione='archivista'",
  "SELECT c.nome,c.cognome,c.professione FROM cittadini c JOIN veicoli v ON v.cittadino_id=c.id JOIN prestiti_documenti p ON p.cittadino_id=c.id WHERE v.targa IN ('TO-314-XR','MI-770-KA') AND p.codice_fascicolo='F-204' AND p.data_restituzione IS NULL",
  "SELECT dest.nome,dest.cognome,t.ora,t.durata_sec FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE mitt.nome='Marco' AND mitt.cognome='Riva' AND t.ora BETWEEN '21:30' AND '22:00'"
];

(async()=>{
  const SQL = await initSqlJs({locateFile:file=>path.join(root,'dist/vendor',file)});
  const db = new SQL.Database();db.run(seedMatch[1]);
  const getRows = sql => {const result=db.exec(sql);if(!result.length)return [];const last=result[result.length-1];return last.values.map(values=>Object.fromEntries(last.columns.map((column,i)=>[column,values[i]])))};
  const solvedRows = solutions.map(getRows);
  missions.forEach((mission,index)=>{
    assert.strictEqual(mission.validate(getRows(mission.starter)),false,`La query iniziale ${index+1} non deve risolvere il livello`);
    assert.strictEqual(mission.validate(solvedRows[index]),true,`La soluzione ${index+1} deve risolvere il livello`);
  });
  assert(includes(solvedRows[1],'nome','Giulia') && includes(solvedRows[1],'nome','Sara') && includes(solvedRows[1],'nome','Laura') && !includes(solvedRows[1],'nome','Marco') && includes(solvedRows[1],'esito','rifiutato'),'Gli accessi devono aprire tre piste coerenti senza anticipare il nome del colpevole');
  assert(solvedRows[2].length===2,'Le telecamere devono restituire due targhe distinte senza duplicati');
  assert(includes(solvedRows[3],'nome','Marco') && includes(solvedRows[3],'nome','Giulia'),'I veicoli devono condurre a due proprietari');
  assert(solvedRows[4].length===3 && solvedRows[4].every(row=>!('data_restituzione' in row)),'Il fascicolo deve essere collegato a tre persone senza rivelare la restituzione');
  assert(includes(solvedRows[5],'nome','Sara') && includes(solvedRows[5],'nome','Laura'),'I contatti devono mantenere due piste aperte');
  assert(includes(solvedRows[6],'nome','Marco') && !includes(solvedRows[6],null,'Laura'),'La penultima prova deve rivelare soltanto il colpevole');
  assert(includes(solvedRows[7],'nome','Laura'),'L’ultima prova deve rivelare la complice');
  console.log(`OK: ${missions.length} query iniziali respinte e ${solutions.length} soluzioni accettate.`);
})().catch(error=>{console.error(error);process.exit(1)});
