# Archivio Ombra — SQL Mystery

Prototipo originale di gioco investigativo in italiano. Le query vengono eseguite localmente nel browser con SQLite (`sql.js`/WebAssembly).

## Avvio locale

Da questa cartella:

```bash
python3 -m http.server 8080 --directory dist
```

Poi apri `http://localhost:8080`. Non aprire direttamente `index.html`: WebAssembly richiede un server HTTP locale.

## Struttura

- `dist/index.html`: interfaccia
- `dist/styles.css`: identità visiva responsive
- `dist/app.js`: database, caso, validazione e motore di gioco
- `dist/vendor/`: runtime SQLite locale
- `dist/assets/`: grafica originale

Il caso contiene otto missioni e copre `SELECT`, `WHERE`, `ORDER BY`, `JOIN`, `NULL`, sottoquery e aggregazioni.
