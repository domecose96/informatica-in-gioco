const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = {window:{}, Uint8Array, atob};
vm.runInNewContext(fs.readFileSync(path.join(root,'vendor/sql-wasm-local.js'),'utf8'),context);
const bytes = context.window.ArchivioSqlWasm;
assert.deepEqual(Buffer.from(bytes),fs.readFileSync(path.join(root,'vendor/sql-wasm.wasm')),'Il runtime locale deve coincidere con il file WASM');
require('../vendor/sql-wasm.js')({wasmBinary:bytes}).then(SQL=>{
 const db = new SQL.Database();
 db.run('CREATE TABLE prova (id INTEGER); INSERT INTO prova VALUES (42);');
 assert.equal(db.exec('SELECT id FROM prova')[0].values[0][0],42);
 db.close();
 console.log('SQLite locale: byte identici e query senza fetch verificate.');
}).catch(error=>{console.error(error);process.exitCode=1;});
