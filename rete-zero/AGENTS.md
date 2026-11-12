# Rete Zero · Regole delle schermate

Queste regole valgono per le lezioni e gli interventi aggiunti o modificati in Rete Zero. Le variazioni esplicitamente richieste dall’utente hanno la precedenza.

## Lezioni del Galilei

- Usa `schoolLayout` in `game.js` come struttura comune. Usa l’impaginazione di «CLI router» del Capitolo 01 come riferimento. Mantieni le tre aree con navigazione a sinistra, teoria al centro e prova a destra. Su schermi stretti riusa la navigazione «Impara» e «Mettiti alla prova».
- Indica capitolo e lezione nei punti già previsti. Mantieni l’accento azzurro del Capitolo 02 e gli stili condivisi.
- Nella teoria, spiega prima cosa succede. Metti poi la sintassi dei comandi nuovi in evidenza e la spiegazione di ciascuno sotto. Per i comandi già studiati basta indicare la modalità richiesta e il relativo prompt.
- Usa il riquadro `.worked-example` per gli esempi. Mantieni il messaggio di Elena in fondo alla colonna, anche quando l’esempio è assente.
- In alto a destra mostra l’istruzione corrente come frase, senza numerarla. Usa `.practice-footer` per tenere sotto il terminale il contatore «Passaggio X di Y» e in basso i pulsanti. Lascia che il terminale occupi lo spazio disponibile e tieni il prompt visibile.
- Riusa `.training-terminal`, `.terminal-screen` e `.terminal-prompt` per bordo, sfondo, angoli, colori e spaziature. Nelle prove della scuola esegui i comandi con Invio. Conserva il cursore e il focus da tastiera.
- Nei laboratori con più dispositivi, selezionali dalle icone nello schema. Evidenzia il dispositivo attivo con il contorno luminoso, porta il focus al suo prompt e aggiorna il nome nello schema quando cambia l’hostname.
- La scheda tecnica del laboratorio si apre sotto il suo pulsante, con lo stesso riquadro ambra degli indizi. L’apertura lascia in posizione schema, terminale e pulsanti.

## Interventi sul campo

- Riusa `missionHeader` e la struttura `.intervention-layout` con `.ticket-panel` e `.configuration`, come negli interventi del Capitolo 01. Mantieni intestazione compatta, stato e telefono di Elena, scheda tecnica a sinistra e area di lavoro a destra.
- Adatta il contenuto all’intervento dentro la struttura comune. Usa gli stili e la disposizione responsive già condivisi.

## Verifica

- Parti dai componenti e dagli stili esistenti quando aggiungi una schermata. Verifica soprattutto il contenuto o l’interazione appena introdotti e che le azioni principali restino raggiungibili.
