# Rete Zero — La città isolata

Gioco locale di Sistemi e reti: una città 3D da esplorare, una scuola e tre interventi negli edifici del primo distretto.

## Percorso

1. Entra nell’Istituto Galilei. Studia e supera sette moduli su IPv4, maschere, subnetting, rete/broadcast/host, default gateway, CLI host e CLI router.
2. Ottieni il tesserino da tecnico. Le risposte corrette assegnano 25 XP per prova, una sola volta.
3. Raggiungi ospedale, protezione civile e municipio in sequenza. Configura i dispositivi dal terminale e controlla i risultati prima di confermare il ripristino. Ogni intervento assegna 100 XP una sola volta.
4. La centrale mostra tesserino, avanzamento e prossimo incarico. Strumenti apre il banco IPv4 e il manuale dei comandi CLI dalla città e durante gli interventi.

I progressi restano nel browser. I progressi del precedente prototipo vengono conservati, se presenti. Ricomincia azzera solo questo gioco. Elena cambia messaggio con le prove completate e con ciascun intervento. Il primo distretto si conclude con tre sedi riconnesse; non sono ancora presenti altri distretti giocabili.

## Avvio e navigazione

Apri `index.html` direttamente nel browser: non sono necessari server, account o connessioni Internet. Three.js e la licenza sono inclusi localmente in `vendor/`.

- Clic su una sede o sulla sua etichetta: entra nell’attività.
- Trascinamento: sposta la vista in tutte le direzioni.
- Shift + trascinamento o tasto destro + trascinamento: ruota e inclina la vista.
- Frecce sulla mappa o sulla tastiera: spostamento; bussola: torna a nord.
- Pannello istruzioni trasparente e richiudibile; mappa a tutta finestra senza scorrimento.
- Rotella o pulsanti +/−: avvicina e allontana.
- Pulsante mirino: ripristina l’inquadratura generale.
- Inquadra sulla mappa, dentro un edificio: torna alla città e centra quella sede.

Il quartiere è circondato da un tessuto urbano grigio, senza bordo del plastico. Gli edifici di contorno non aprono missioni. Zoom, inclinazione e spostamento sono limitati per mantenere una vista utile della città. Gli alberi vengono piantati solo dopo aver registrato tutti gli ingombri, controllando anche il raggio delle chiome. Se WebGL non è disponibile, i pulsanti degli edifici restano accessibili in una vista alternativa. I dati e i pacchetti sono simulati; non vengono modificate reti reali. Il calcolatore distingue le normali LAN dai casi /31 punto-punto e /32 host. Il gateway è una configurazione del router, non un valore ricavabile automaticamente dalla maschera.

## Barra e audio

Home torna al laboratorio dei giochi. Come si gioca apre la guida, mentre la nota musicale apre volumi separati per musica ed effetti e il comando muto. La X compare anche con entrambi i volumi a zero. La composizione ambient originale “Segnali lontani” è inclusa localmente; la riproduzione parte solo dopo un gesto dell’utente e si interrompe quando la pagina è nascosta.

## Verifica

`node tests/validate-network.cjs`

`node tests/validate-course.cjs`

`node tests/validate-spatial.cjs`

`node tests/validate-discovery.cjs`

## Riferimenti

Three.js 0.160.1, licenza MIT in `vendor/THREE-LICENSE.txt`. Modelli, facciate e terreno sono generati localmente dal codice della città, senza mappe geografiche o servizi di tiles esterni.

- https://threejs.org/docs/pages/Raycaster
- https://www.rfc-editor.org/info/rfc1878/
- https://www.rfc-editor.org/info/rfc3021/

## Scuola e scoperta degli edifici

Il banco scolastico non scorre: ogni lezione presenta concetti sfogliabili, un esempio e una prova. Su schermi stretti le viste Impara e Mettiti alla prova si alternano. Tutti i contenuti restano consultabili e le risposte si conservano cambiando lezione. Nelle domande a scelta, usa Tab per passare alla domanda successiva e le frecce per scegliere una risposta.

All’inizio sulla mappa e nel percorso compare soltanto il Galilei. Il tesserino rivela centrale e ospedale; completando gli interventi si scoprono protezione civile e municipio. Gli altri edifici rimangono visibili come parte della città ma non anticipano attività. I segnalini circolari mostrano il nome al passaggio del puntatore o al focus della tastiera.
