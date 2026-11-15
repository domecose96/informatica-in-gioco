# Archivio Ombra · SQL Mystery

Gioco investigativo in italiano con SQLite (`sql.js`/WebAssembly) eseguito nel browser. Questa cartella è autonoma: puoi copiarla o pubblicarla da sola.

## Avvio

```bash
python3 scripts/serve-preview.py
```

Apri http://127.0.0.1:8081/. Non aprire il gioco direttamente tramite file: SQLite/WebAssembly richiede un server HTTP.

## File

- `index.html`: archivio dei casi e interfaccia di gioco.
- `app.js`: interfaccia, flusso del gioco e validazione delle query.
- `case03.js`: dati, schema, missioni e verifiche di L’ultima rettifica.
- `styles.css`: stile del gioco.
- `assets/`: immagini utilizzate, icona e musica.
- `vendor/`: runtime SQLite locale.
- `tests/`: verifiche dei casi e del laboratorio.

Sono disponibili il laboratorio introduttivo (9 prove) e tre indagini da 8 missioni: Il fascicolo scomparso, Protocollo fantasma e L’ultima rettifica.

## Verifica

```bash
node tests/validate-game.cjs
node tests/validate-training.cjs
node tests/validate-case02.cjs
node tests/validate-case03.cjs
```

Per pubblicare il gioco basta servire questa cartella con un hosting statico. `tests/`, `scripts/` e questo README servono allo sviluppo e non sono necessari online. I dati e le preferenze sono locali al browser. Le indagini accettano query in sola lettura; il laboratorio insegna anche i comandi di modifica del database.
