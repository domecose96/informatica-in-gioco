const fs = require('fs');
const path = require('path');
const assert = require('assert');
const initSqlJs = require('../vendor/sql-wasm.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const seedMatch = source.match(/const trainingSeed = `([\s\S]*?)`;/);
assert(seedMatch, 'Impossibile leggere il database del laboratorio');

const solutions = [
  `CREATE TABLE fascicoli (
    codice TEXT PRIMARY KEY,
    titolo TEXT NOT NULL,
    settore TEXT NOT NULL,
    stato TEXT NOT NULL
  )`,
  `INSERT INTO fascicoli (codice, titolo, settore, stato) VALUES
    ('F-101', 'Catasto storico', 'Storico', 'disponibile'),
    ('F-204', 'Fondo riservato', 'Storico', 'disponibile'),
    ('A-117', 'Delibere 2025', 'Amministrativo', 'disponibile'),
    ('TMP-999', 'Doppione importato', 'Importazione', 'disponibile')`,
  `SELECT codice, titolo, stato FROM fascicoli
   WHERE settore = 'Storico' ORDER BY codice`,
  `UPDATE fascicoli SET stato = 'riservato' WHERE codice = 'F-204'`,
  `ALTER TABLE fascicoli ADD COLUMN scaffale TEXT`,
  `DELETE FROM fascicoli WHERE codice = 'TMP-999'`,
  `CREATE TABLE consultazioni (
    id INTEGER PRIMARY KEY,
    fascicolo_codice TEXT NOT NULL,
    operatore TEXT NOT NULL,
    data TEXT NOT NULL,
    FOREIGN KEY (fascicolo_codice) REFERENCES fascicoli(codice)
  )`,
  `INSERT INTO consultazioni (id, fascicolo_codice, operatore, data) VALUES
    (1, 'F-101', 'Anna Bianchi', '2026-10-29'),
    (2, 'F-204', 'Luca Verdi', '2026-10-30'),
    (3, 'A-117', 'Sara Conti', '2026-10-31')`,
  `DROP TABLE importazione_temporanea`
];

(async () => {
  const SQL = await initSqlJs({locateFile:file => path.join(root, 'vendor', file)});
  const db = new SQL.Database();
  db.run(seedMatch[1]);

  solutions.forEach(sql => db.run(sql));
  const scalar = sql => db.exec(sql)[0]?.values[0]?.[0];
  const columns = db.exec('PRAGMA table_info(fascicoli)')[0].values;
  const foreignKeys = db.exec('PRAGMA foreign_key_list(consultazioni)')[0].values;

  assert.strictEqual(scalar('SELECT COUNT(*) FROM fascicoli'), 3);
  assert.strictEqual(scalar("SELECT COUNT(*) FROM fascicoli WHERE codice='F-204' AND stato='riservato'"), 1);
  assert(columns.some(column => column[1] === 'scaffale' && column[2] === 'TEXT'));
  assert.strictEqual(scalar('SELECT COUNT(*) FROM consultazioni'), 3);
  assert(foreignKeys.some(key => key[2] === 'fascicoli' && key[3] === 'fascicolo_codice' && key[4] === 'codice'));
  assert.strictEqual(scalar("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='importazione_temporanea'"), 0);
  console.log(`OK: completate ${solutions.length} prove del laboratorio SQL.`);
})().catch(error => {console.error(error);process.exit(1)});
