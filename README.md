# Informatica in gioco

Giochi didattici in italiano: **Archivio Ombra** per SQL e **Programma il robot** per C++. Le query SQL vengono eseguite nel browser con SQLite (`sql.js`/WebAssembly).

## Avvio locale

Da questa cartella:

```bash
python3 scripts/serve-preview.py
```

Poi apri `http://127.0.0.1:8081`. Lascia il processo in esecuzione mentre usi Archivio Ombra. Non aprire direttamente `index.html`: WebAssembly richiede un server HTTP locale.

## Struttura

- `dist/index.html`: home dei giochi
- `dist/archivio-ombra.html`: interfaccia di Archivio Ombra
- `dist/styles.css`: identità visiva responsive
- `dist/app.js`: database, caso, validazione e motore di gioco
- `dist/vendor/`: runtime SQLite locale
- `dist/assets/`: grafica originale

Il caso contiene otto missioni e copre `SELECT`, `WHERE`, `ORDER BY`, `JOIN`, `NULL`, sottoquery e aggregazioni. Ogni soluzione corretta resta visibile e deve essere rielaborata dal giocatore in un taccuino, così gli indizi raccolti possono essere riutilizzati nelle missioni successive.

## Controlli automatici

Per verificare che nessuna query iniziale completi accidentalmente una missione e che tutte le soluzioni siano riconosciute:

```bash
node tests/validate-game.cjs
```

Il gioco blocca istruzioni SQL distruttive e query multiple: il database del caso è interrogabile in sola lettura.

## Programma il robot · C++

Aprire `dist/programma-il-robot.html` per la mappa, oppure `dist/robot-livello.html?livello=1` per iniziare. Funziona anche aprendo i file direttamente nel browser.

Il percorso ha 45 livelli: 27 tappe numerate, inclusi i collaudi, e 18 missioni nei labirinti. I primi sei sono comuni; dopo Collaudo si separano Officina avanzata e Labirinti. La mappa scorre verticalmente dentro il pannello. I progressi sono salvati con gli stessi identificatori dei primi nove livelli. Ogni tappa verifica i propri prerequisiti, anche aprendo direttamente il relativo URL. I labirinti con sensori richiedono sia la missione precedente sia le funzioni costruite in officina.

L’officina avanzata introduce parametri, sovraccarico di avanza, dietrofront, valori bool, controlli dei bordi, sensori e avanzamento condizionale. Le missioni verificano for, while e do…while anche con percorsi e basi di lunghezza diversa. Le funzioni precedenti si consultano dai suggerimenti e vengono caricate dal salvataggio; l’editor mostra solo la funzione dell’esercizio.

`robot-levels.js` contiene consegne, percorsi e prerequisiti; `robot-engine.js` interpreta un sottoinsieme didattico di C++ senza eseguire JavaScript fornito dall’utente. Supporta funzioni void/int/bool, parametri per valore, chiamate, assegnazioni, espressioni aritmetiche e logiche, return, if/else, for, while e do…while. Le funzioni costruite e verificate in officina vengono riutilizzate nelle missioni successive. Non è un compilatore C++ completo; istruzioni, ricorsione e movimenti sono limitati.

Controllo della logica: `node tests/validate-robot.cjs`. Controllo della mappa: `node tests/validate-robot-map.cjs`.

La testata del robot include istruzioni, Home dei giochi e controlli musicali in stile pixel. Il brano originale «Circuiti in movimento» è generato da `scripts/generate-robot-theme.py`. Musica inizialmente disattivata; volume e scelta di ascolto sono indipendenti da Archivio Ombra e salvati nel browser.

## Pubblicazione su GitHub Pages

Il ramo `gh-pages` contiene il sito pronto, con i file di `dist/` alla radice. In Settings → Pages selezionare Deploy from a branch, ramo `gh-pages`, cartella `/ (root)`. Il ramo `main` conserva sorgenti e controlli automatici.

I progressi e le preferenze sono salvati nel browser del singolo visitatore; non occorre un server applicativo.
