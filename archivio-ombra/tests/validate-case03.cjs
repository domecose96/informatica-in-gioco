const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const initSqlJs = require('../vendor/sql-wasm.js');

const source = fs.readFileSync(path.join(__dirname, '../case03.js'), 'utf8');
const { case03Seed, case03Missions, compareCase03Rows } = vm.runInNewContext(
  source + '\n({ case03Seed, case03Missions, compareCase03Rows })'
);

const expected = [
  [{protocollo:'SP-103', totale_versioni:3}],
  [
    {versione:1, registrata_alle:'18:07', ora_arrivo:'18:07', civico:41},
    {versione:2, registrata_alle:'22:53', ora_arrivo:'18:07', civico:14},
    {versione:3, registrata_alle:'23:18', ora_arrivo:'17:57', civico:14}
  ],
  [{protocollo:'SP-103', ora_ricevuta:'18:07', ora_registro:'17:57'}],
  [{versione:3, ora_precedente:'18:07', ora_arrivo:'17:57', campo_autorizzato:'civico'}],
  [{richiesto_da:'Elisa Conti', autorizzato_da:'Sara Villa', applicato_da:'Matteo Bellini'}],
  [
    {posizione:1, protocollo:'SP-101', richiedente:'Il Telaio'},
    {posizione:2, protocollo:'SP-102', richiedente:'Officina Verde'},
    {posizione:3, protocollo:'SP-103', richiedente:'Laboratorio Ponte'}
  ],
  [{protocollo:'SP-104', richiedente:'Spazio Aperto', posizione:3}],
  [{responsabile:'Matteo Bellini', ora_ricevuta:'18:07', ora_registro:'17:57', penalizzato:'Spazio Aperto'}]
];

async function verifyCase03() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  try {
    db.run(case03Seed);
    assert.deepEqual(db.exec('PRAGMA foreign_key_check'), []);
    assert.equal(case03Missions.length, expected.length);
    case03Missions.forEach((mission, index) => {
      const [result] = db.exec(mission.solution);
      const rows = result.values.map(values => Object.fromEntries(
        result.columns.map((column, position) => [column, values[position]])
      ));
      assert.deepEqual(rows, expected[index], mission.title);
      assert.ok(compareCase03Rows(rows, expected[index]));
      assert.ok(!compareCase03Rows([], expected[index]));
      const wrongRows = rows.map(row => ({...row}));
      wrongRows[0][result.columns[0]] = 'valore errato';
      assert.ok(!compareCase03Rows(wrongRows, expected[index]));
    });
    assert.ok(!compareCase03Rows([...expected[5]].reverse(), expected[5]));
  } finally {
    db.close();
  }
  console.log('Caso 03: otto query, graduatorie, verdetto e chiavi esterne verificati.');
}
verifyCase03().catch(error => { console.error(error); process.exitCode = 1; });
