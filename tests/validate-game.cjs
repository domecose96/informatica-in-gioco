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
  "SELECT c.nome,c.cognome,a.ora_badge FROM accessi_archivio a JOIN cittadini c ON c.id=a.cittadino_id WHERE a.data='2026-10-31' AND a.esito='accettato' AND a.ora_badge>'21:45' ORDER BY a.ora_badge",
  "SELECT ora,targa,direzione FROM telecamere WHERE data='2026-10-31' AND ora>'22:14' AND direzione='tangenziale' ORDER BY ora",
  "SELECT c.nome,c.cognome,c.professione FROM veicoli v JOIN cittadini c ON c.id=v.cittadino_id WHERE v.targa='TO-314-XR'",
  "SELECT c.nome,c.cognome,p.codice_fascicolo,p.data_restituzione FROM prestiti_documenti p JOIN cittadini c ON c.id=p.cittadino_id WHERE p.codice_fascicolo='F-204' AND p.data_restituzione IS NULL",
  "SELECT dest.nome,dest.cognome,t.ora,t.durata_sec FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE mitt.nome='Marco' AND mitt.cognome='Riva' AND t.ora BETWEEN '21:30' AND '22:00'",
  "SELECT COUNT(*) AS contatti_archivio FROM telefonate t JOIN cittadini dest ON dest.id=t.destinatario_id WHERE t.mittente_id=(SELECT id FROM cittadini WHERE nome='Laura' AND cognome='Neri') AND dest.professione='archivista'",
  "SELECT 'Marco Riva' AS colpevole,'Laura Neri' AS complice"
];

(async()=>{
  const SQL = await initSqlJs({locateFile:file=>path.join(root,'dist/vendor',file)});
  const db = new SQL.Database();db.run(seedMatch[1]);
  const getRows = sql => {const result=db.exec(sql);if(!result.length)return [];const last=result[result.length-1];return last.values.map(values=>Object.fromEntries(last.columns.map((column,i)=>[column,values[i]])))};
  missions.forEach((mission,index)=>{
    assert.strictEqual(mission.validate(getRows(mission.starter)),false,`La query iniziale ${index+1} non deve risolvere il livello`);
    assert.strictEqual(mission.validate(getRows(solutions[index])),true,`La soluzione ${index+1} deve risolvere il livello`);
  });
  console.log(`OK: ${missions.length} query iniziali respinte e ${solutions.length} soluzioni accettate.`);
})().catch(error=>{console.error(error);process.exit(1)});
