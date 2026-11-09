const fs = require('fs');
const path = require('path');
const assert = require('assert');
const initSqlJs = require('../vendor/sql-wasm.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
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
  "SELECT c.nome,c.cognome,p.data_prestito,p.data_restituzione FROM prestiti_documenti p JOIN cittadini c ON c.id=p.cittadino_id WHERE p.codice_fascicolo='F-204' ORDER BY p.data_prestito",
  "SELECT DISTINCT mitt.nome,mitt.cognome FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE dest.professione='archivista'",
  "SELECT DISTINCT c.nome,c.cognome,c.professione,t.cella FROM cittadini c JOIN veicoli v ON v.cittadino_id=c.id JOIN telefonate t ON t.mittente_id=c.id WHERE v.targa IN ('TO-314-XR','MI-770-KA') AND t.data='2026-10-31' AND t.ora BETWEEN '21:30' AND '22:00' AND t.cella='Archivio Civico'",
  "SELECT dest.nome,dest.cognome,t.ora,t.durata_sec FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE mitt.nome='Marco' AND mitt.cognome='Riva' AND t.ora BETWEEN '21:30' AND '22:00'"
];

(async()=>{
  const SQL = await initSqlJs({locateFile:file=>path.join(root,'vendor',file)});
  const db = new SQL.Database();db.run(seedMatch[1]);
  const getRows = sql => {const result=db.exec(sql);if(!result.length)return [];const last=result[result.length-1];return last.values.map(values=>Object.fromEntries(last.columns.map((column,i)=>[column,values[i]])))};
  const solvedRows = solutions.map(getRows);
  const callsWithoutCellFilter = getRows("SELECT DISTINCT c.nome,c.cognome,t.cella FROM cittadini c JOIN veicoli v ON v.cittadino_id=c.id JOIN telefonate t ON t.mittente_id=c.id WHERE v.targa IN ('TO-314-XR','MI-770-KA') AND t.data='2026-10-31' AND t.ora BETWEEN '21:30' AND '22:00'");
  missions.forEach((mission,index)=>{
    assert.strictEqual(mission.validate(getRows(mission.starter)),false,`La query iniziale ${index+1} non deve risolvere il livello`);
    assert.strictEqual(mission.validate(solvedRows[index]),true,`La soluzione ${index+1} deve risolvere il livello`);
  });
  assert(includes(solvedRows[1],'nome','Giulia') && includes(solvedRows[1],'nome','Sara') && includes(solvedRows[1],'nome','Laura') && includes(solvedRows[1],'nome','Paolo') && new Set(solvedRows[1].map(row=>row.nome)).size===4 && !includes(solvedRows[1],'nome','Marco') && includes(solvedRows[1],'esito','rifiutato'),'Gli accessi devono mostrare quattro persone distinte senza anticipare il colpevole');
  assert(solvedRows[2].length===2,'Le telecamere devono restituire due targhe distinte senza duplicati');
  assert(includes(solvedRows[3],'nome','Marco') && includes(solvedRows[3],'nome','Giulia'),'I veicoli devono condurre a due proprietari');
  assert(solvedRows[4].length===3 && solvedRows[4].every(row=>row.data_restituzione),'Il fascicolo deve risultare restituito da tutte e tre le persone');
  assert(includes(solvedRows[5],'nome','Sara') && includes(solvedRows[5],'nome','Laura'),'I contatti devono mantenere due piste aperte');
  assert(callsWithoutCellFilter.length===2 && includes(callsWithoutCellFilter,'nome','Marco') && includes(callsWithoutCellFilter,'nome','Giulia'),'Senza la cella telefonica devono restare due proprietari sospetti');
  assert(includes(solvedRows[6],'nome','Marco') && includes(solvedRows[6],'cella','Archivio Civico') && !includes(solvedRows[6],null,'Giulia'),'La penultima prova deve distinguere il colpevole tramite la cella telefonica');
  assert(includes(solvedRows[7],'nome','Laura'),'L’ultima prova deve rivelare la complice');
  console.log(`OK: ${missions.length} query iniziali respinte e ${solutions.length} soluzioni accettate.`);
})().catch(error=>{console.error(error);process.exit(1)});
