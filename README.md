# Giochi informatica

Due giochi didattici autonomi, con una home comune per sceglierli.

```text
GIOCHI INFORMATICA/
├── index.html                 Home comune
├── giochi.css                 Stile della home
├── archivio-ombra/            SQL: gioco, immagini, audio e SQLite
│   ├── index.html
│   ├── assets/
│   ├── vendor/
│   ├── scripts/
│   └── tests/
├── programma-il-robot/        C++: gioco, mappa, motore e risorse
│   ├── index.html
│   ├── robot-livello.html
│   ├── assets/
│   ├── scripts/
│   └── tests/
└── scripts/                   Anteprima e preparazione della pubblicazione
```

## Avvio dell’intero sito

```bash
python3 scripts/serve-preview.py
```

Apri http://127.0.0.1:8081/ e lascia il server in esecuzione.

## Giochi indipendenti

Puoi copiare o pubblicare una sola delle due cartelle: ciascuna contiene tutti i file necessari e il proprio README. I giochi non leggono file dalla cartella dell’altro gioco o dalla home comune.

Per avviarne uno soltanto, esegui dalla sua cartella:

```bash
python3 scripts/serve-preview.py --port 8082
```

Apri http://127.0.0.1:8082/. Archivio Ombra richiede HTTP per caricare SQLite/WebAssembly; il robot funziona anche aprendo direttamente il suo index.html.

## Controlli

```bash
node archivio-ombra/tests/validate-game.cjs
node archivio-ombra/tests/validate-training.cjs
node archivio-ombra/tests/validate-case02.cjs
node programma-il-robot/tests/validate-robot-ui.cjs
node programma-il-robot/tests/validate-robot-map.cjs
python3 scripts/validate-layout.py
```

La simulazione dell’interfaccia robot esegue anche i controlli del motore.

## Pubblicazione

```bash
python3 scripts/build-site.py
```

La cartella generata `dist/` contiene esclusivamente i file web. Il ramo GitHub Pages `gh-pages` pubblica questi file alla radice; `main` conserva sorgenti, documentazione e test. Tre piccole pagine di reindirizzamento nella sola distribuzione mantengono validi i vecchi link dei giochi e dei livelli.

Sito: https://domecose96.github.io/informatica-in-gioco/

Progressi e preferenze restano nel browser del visitatore. Le chiavi dei salvataggi non sono cambiate. Non occorre un server applicativo.
