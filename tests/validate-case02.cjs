const fs = require('fs');
const path = require('path');
const assert = require('assert');
const initSqlJs = require('../dist/vendor/sql-wasm.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const missionMatch = source.match(/const case02Missions = (\[[\s\S]*?\n\]);/);
const seedMatch = source.match(/const case02Seed = `([\s\S]*?)`;/);
assert(missionMatch && seedMatch, 'Impossibile leggere il Caso 02');

function includes(rows, key, needle) {
  return rows.some(row => Object.entries(row).some(([column, value]) =>
    (!key || column === key) && String(value).toLowerCase().includes(String(needle).toLowerCase())
  ));
}
const missions = eval(missionMatch[1]);
const expectedStarters = [
  'SELECT p.protocollo,\n       COUNT(*) AS totale_movimenti\nFROM plichi p',
  'SELECT m.ora, m.stato, m.luogo\nFROM movimenti m',
  'SELECT p.protocollo,\n       COUNT(*) AS passaggi\nFROM plichi p',
  'SELECT nome, cognome, ruolo\nFROM persone\nWHERE id IN (\n  \n)',
  'SELECT\nFROM',
  'SELECT\nFROM',
  'SELECT\nFROM',
  'SELECT\nFROM'
];
missions.forEach((mission, index) => { mission.starter = expectedStarters[index]; });
const solutions = [
  `SELECT p.protocollo, COUNT(*) AS totale_movimenti
   FROM plichi p JOIN movimenti m ON m.plico_id = p.id
   WHERE m.data = '2026-11-06'
   GROUP BY p.protocollo ORDER BY totale_movimenti DESC`,
  `SELECT m.ora, m.stato, m.luogo, pe.nome, pe.cognome
   FROM movimenti m
   JOIN plichi p ON p.id = m.plico_id
   JOIN persone pe ON pe.id = m.operatore_id
   WHERE p.protocollo = 'P-27' ORDER BY m.ora`,
  `SELECT p.protocollo, COUNT(*) AS passaggi
   FROM plichi p JOIN movimenti m ON m.plico_id = p.id
   WHERE m.data = '2026-11-06'
   GROUP BY p.protocollo HAVING COUNT(*) > 3`,
  `SELECT nome, cognome, ruolo FROM persone WHERE id IN (
     SELECT persona_id FROM turni
     WHERE data = '2026-11-06'
       AND sede IN ('Scalo merci', 'Magazzino 2')
       AND '19:26' BETWEEN inizio AND fine
   )`,
  `SELECT p.protocollo,
          MAX(s.peso_grammi) AS peso_massimo,
          MIN(s.peso_grammi) AS peso_minimo,
          MAX(s.peso_grammi) - MIN(s.peso_grammi) AS differenza
   FROM plichi p JOIN scansioni s ON s.plico_id = p.id
   GROUP BY p.protocollo
   HAVING MAX(s.peso_grammi) - MIN(s.peso_grammi) > 200`,
  `SELECT nome, cognome, ruolo FROM persone WHERE id IN (
     SELECT m.operatore_id FROM movimenti m
     JOIN plichi p ON p.id = m.plico_id
     WHERE p.protocollo = 'P-27'
   )`,
  `SELECT DISTINCT mitt.nome AS mittente, dest.nome AS destinatario, c.ora
   FROM chiamate c
   JOIN persone mitt ON mitt.id = c.mittente_id
   JOIN persone dest ON dest.id = c.destinatario_id
   WHERE c.ora BETWEEN '19:15' AND '19:30'
     AND c.mittente_id IN (
       SELECT m.operatore_id FROM movimenti m JOIN plichi p ON p.id = m.plico_id WHERE p.protocollo = 'P-27'
     )
     AND c.destinatario_id IN (
       SELECT m.operatore_id FROM movimenti m JOIN plichi p ON p.id = m.plico_id WHERE p.protocollo = 'P-27'
     )`,
  `SELECT col.nome || ' ' || col.cognome AS colpevole,
          comp.nome || ' ' || comp.cognome AS complice
   FROM plichi p
   JOIN movimenti consegna ON consegna.plico_id = p.id
   JOIN persone col ON col.id = consegna.operatore_id
   JOIN movimenti uscita ON uscita.plico_id = p.id
     AND uscita.stato = 'uscita' AND uscita.ora > consegna.ora
   JOIN persone comp ON comp.id = uscita.operatore_id
   WHERE p.protocollo = 'P-27'
     AND consegna.stato = 'consegnato'
     AND col.ruolo = 'magazziniere'
     AND comp.ruolo = 'custode'`
];

(async () => {
  const SQL = await initSqlJs({locateFile: file => path.join(root, 'dist/vendor', file)});
  const db = new SQL.Database();
  db.run(seedMatch[1]);
  const getRows = sql => {
    const result = db.exec(sql);
    if (!result.length) return [];
    const last = result[result.length - 1];
    return last.values.map(values => Object.fromEntries(last.columns.map((column, i) => [column, values[i]])));
  };

  missions.forEach((mission, index) => {
    assert.strictEqual(mission.starter, expectedStarters[index], `La traccia ${index + 1} non rispetta la progressione degli aiuti`);
    try {
      assert.strictEqual(mission.validate(getRows(mission.starter)), false, `La traccia ${index + 1} non deve già risolvere il livello`);
    } catch (error) {
      assert(/syntax|no such column|incomplete input/i.test(error.message), `Errore inatteso nella traccia ${index + 1}: ${error.message}`);
    }
    assert.strictEqual(mission.validate(getRows(solutions[index])), true, `La soluzione ${index + 1} deve risolvere il livello`);
  });
  assert.strictEqual(solutions.length, missions.length);
  console.log(`OK: 4 tracce guidate, 4 tracce minime e ${solutions.length} soluzioni del Caso 02 verificate.`);
})().catch(error => { console.error(error); process.exit(1); });
