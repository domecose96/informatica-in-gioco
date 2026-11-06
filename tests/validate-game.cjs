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
  "SELECT cittadino_id,ora_badge,varco FROM accessi_archivio WHERE data='2026-10-31' AND esito='accettato' AND ora_badge>'21:45' ORDER BY ora_badge",
  "SELECT ora,targa,direzione FROM telecamere WHERE data='2026-10-31' AND ora>'22:14' AND direzione='tangenziale' ORDER BY ora",
  "SELECT targa,cittadino_id,modello,colore FROM veicoli WHERE targa='TO-314-XR'",
  "SELECT cittadino_id,codice_fascicolo,data_prestito,data_restituzione FROM prestiti_documenti WHERE codice_fascicolo='F-204' AND data_restituzione IS NULL",
  "SELECT mittente_id,COUNT(DISTINCT destinatario_id) AS contatti_archivio FROM telefonate WHERE destinatario_id IN (2,4,6) GROUP BY mittente_id HAVING COUNT(DISTINCT destinatario_id)=3",
  "SELECT c.nome,c.cognome,c.professione FROM cittadini c JOIN veicoli v ON v.cittadino_id=c.id JOIN prestiti_documenti p ON p.cittadino_id=c.id WHERE v.targa='TO-314-XR' AND p.codice_fascicolo='F-204' AND p.data_restituzione IS NULL",
  "SELECT dest.nome,dest.cognome,t.ora,t.durata_sec FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE mitt.nome='Marco' AND mitt.cognome='Riva' AND dest.id=3 AND t.ora BETWEEN '21:30' AND '22:00'"
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
  const earlyEvidence = JSON.stringify(solvedRows.slice(0,6)).toLowerCase();
  assert(!earlyEvidence.includes('marco') && !earlyEvidence.includes('laura'),'I nomi non devono comparire prima delle ultime due prove');
  assert(includes(solvedRows[6],'nome','Marco') && !includes(solvedRows[6],null,'Laura'),'La penultima prova deve rivelare soltanto il colpevole');
  assert(includes(solvedRows[7],'nome','Laura'),'L’ultima prova deve rivelare la complice');
  console.log(`OK: ${missions.length} query iniziali respinte e ${solutions.length} soluzioni accettate.`);
})().catch(error=>{console.error(error);process.exit(1)});
