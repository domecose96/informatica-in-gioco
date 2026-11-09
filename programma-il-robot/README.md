# Programma il robot · C++

Gioco didattico autonomo per costruire e riutilizzare funzioni C++. Puoi copiare o pubblicare questa cartella senza Archivio Ombra.

## Avvio

Apri `index.html`, oppure avvia:

```bash
python3 scripts/serve-preview.py
```

Poi apri http://127.0.0.1:8081/.

## Percorso

27 livelli principali, inclusi i collaudi, e 18 sfide L facoltative. Ogni sfida si sblocca con le funzioni necessarie del percorso principale. Nessuna sfida L blocca un livello numerato o un collaudo.

Il percorso comprende movimenti, parametri, condizioni, cicli, sensori, batteria, ricarica, riconoscimento del traguardo, guida autonoma e monete.

## File

- `index.html`: mappa del percorso.
- `robot-livello.html`: editor e simulatore; `?livello=1` apre il primo esercizio.
- `robot-levels.js`: consegne, percorsi e prerequisiti; ID e chiavi dei progressi rimangono stabili.
- `robot-engine.js`: interprete di un sottoinsieme didattico di C++, con limiti di esecuzione.
- `robot-map.js`, `robot-livello.js`, `robot-ui.js`: interfaccia, mappa e audio.
- `assets/`: immagini e brano originale «Circuiti in movimento».
- `scripts/generate-robot-theme.py`: rigenera la musica.

## Verifica

```bash
node tests/validate-robot.cjs
node tests/validate-robot-map.cjs
node tests/validate-robot-ui.cjs
```

Per pubblicare il gioco basta servire questa cartella con un hosting statico. `tests/`, `scripts/` e questo README servono allo sviluppo e non sono necessari online. I progressi e le preferenze sono salvati nel browser. Il motore non è un compilatore C++ completo e non esegue JavaScript fornito dallo studente.
