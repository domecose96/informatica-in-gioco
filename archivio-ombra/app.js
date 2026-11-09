/* Archivio Ombra — original educational prototype */
const missions = [
  { skill:'SELECT · WHERE', title:'Ricostruisci l’allarme', text:'Il sistema di sicurezza ha registrato molti eventi nella notte del 31 ottobre. Isola l’allarme scattato all’Archivio Civico.', objective:'Trova l’evento di tipo “allarme” del 31 ottobre 2026.', tables:['eventi'], starter:"SELECT *\nFROM eventi\nWHERE data = '2026-10-31'", hints:["Aggiungi una seconda condizione con AND.","Filtra la colonna tipo usando il valore 'allarme'.","Dopo il filtro sulla data, collega con AND il confronto tra la colonna tipo e il valore richiesto dall’obiettivo."], validate: rows => rows.length === 1 && (has(rows,'id',4) || includes(rows,'descrizione','F-204')) },
  { skill:'JOIN · ORDER BY', title:'I badge nella notte', text:'L’allarme è scattato alle 22:14. Incrocia tutti i tentativi di accesso con l’anagrafe: anche un badge rifiutato può aprire una pista.', objective:'Mostra nome, cognome, ora, varco ed esito di tutti i tentativi registrati dopo le 21:45.', tables:['accessi_archivio','cittadini'], starter:"SELECT c.nome, c.cognome, a.ora_badge, a.varco, a.esito\nFROM accessi_archivio a\nJOIN cittadini c ON c.id = a.cittadino_id\nWHERE a.data = '2026-10-31'", hints:["Confronta ora_badge con l’orario '21:45'.","Dopo il filtro sulla data aggiungi la condizione sull’orario e ricostruisci la sequenza cronologica.","Combina la condizione con AND, poi ordina usando ORDER BY a.ora_badge."], validate: rows => rows.length === 4 && includes(rows,'nome','Giulia') && includes(rows,'nome','Sara') && includes(rows,'nome','Laura') && includes(rows,'nome','Paolo') && includes(rows,'esito','rifiutato') && ['21:51','22:02','22:05','22:19'].every(t=>includes(rows,'ora_badge',t)) },
  { skill:'DISTINCT · WHERE', title:'Due auto nella notte', text:'Le telecamere hanno ripreso più di un veicolo diretto verso la tangenziale dopo l’allarme. La stessa auto può comparire in più fotogrammi: conserva ogni targa una sola volta.', objective:'Trova le targhe distinte riprese dopo le 22:14 in direzione “tangenziale”.', tables:['telecamere'], starter:"SELECT DISTINCT targa, direzione\nFROM telecamere", hints:["Inizia costruendo un WHERE sulla data del 31 ottobre 2026.","Confronta l’ora con '22:14' e aggiungi la direzione 'tangenziale'.","Nel WHERE servono tre condizioni: data, orario successivo all’allarme e direzione."], validate: rows => rows.length === 2 && includes(rows,'targa','TO-314-XR') && includes(rows,'targa','MI-770-KA') },
  { skill:'JOIN · IN', title:'I proprietari dei veicoli', text:'Le due targhe appartengono a persone diverse. Collegale all’anagrafe senza scegliere ancora quale pista sia quella giusta.', objective:'Trova nome, cognome, targa, modello e colore dei proprietari di TO-314-XR e MI-770-KA.', tables:['veicoli','cittadini'], starter:"SELECT c.nome, c.cognome, v.targa, v.modello, v.colore\nFROM veicoli v\nJOIN cittadini c ON c.id = v.cittadino_id", hints:["Per confrontare più targhe puoi usare IN.","Inserisci nell’elenco TO-314-XR e MI-770-KA.","Aggiungi WHERE v.targa IN ('TO-314-XR', 'MI-770-KA')."], validate: rows => rows.length === 2 && includes(rows,'nome','Marco') && includes(rows,'nome','Giulia') && includes(rows,'targa','TO-314-XR') && includes(rows,'targa','MI-770-KA') },
  { skill:'JOIN · ORDER BY', title:'Chi conosceva F-204?', text:'Il registro mostra più persone che avevano consultato il fascicolo e lo avevano regolarmente restituito. La conoscenza del documento apre più piste, ma non basta per accusare qualcuno.', objective:'Mostra tutte le persone che hanno preso F-204, con le date di prestito e restituzione.', tables:['prestiti_documenti','cittadini'], starter:"SELECT c.nome, c.cognome, p.data_prestito, p.data_restituzione\nFROM prestiti_documenti p\nJOIN cittadini c ON c.id = p.cittadino_id", hints:["Filtra il codice del fascicolo richiesto.","Usa p.codice_fascicolo = 'F-204'.","Aggiungi il WHERE sul codice e ordina per p.data_prestito."], validate: rows => rows.length === 3 && includes(rows,'nome','Marco') && includes(rows,'nome','Sara') && includes(rows,'nome','Giulia') && rows.every(r=>r.data_restituzione) },
  { skill:'DISTINCT · JOIN', title:'Una rete intorno all’archivio', text:'Anche i contatti telefonici aprono più piste. Cerca chi ha telefonato a persone che lavorano nell’archivio, mantenendo una sola riga per ogni nome.', objective:'Mostra una sola volta nome e cognome di chi ha chiamato personale con professione “archivista”.', tables:['telefonate','cittadini'], starter:"SELECT DISTINCT mitt.nome, mitt.cognome\nFROM telefonate t\nJOIN cittadini mitt ON mitt.id = t.mittente_id\nJOIN cittadini dest ON dest.id = t.destinatario_id", hints:["La professione da controllare appartiene alla tabella cittadini usata con alias dest.","Filtra dest.professione usando il valore 'archivista'.","Aggiungi un WHERE che confronti la professione del destinatario con quella richiesta."], validate: rows => rows.length === 2 && includes(rows,'nome','Sara') && includes(rows,'nome','Laura') },
  { skill:'JOIN MULTIPLA · IN · BETWEEN', title:'Dalle piste al colpevole', text:'Entrambi i proprietari hanno telefonato poco prima del furto, ma da luoghi diversi. Incrocia le auto sospette con la cella agganciata dal telefono: soltanto uno dei due era nella zona dell’archivio.', objective:'Trova nome, cognome, professione e cella del proprietario di uno dei due veicoli sospetti che ha chiamato tra le 21:30 e le 22:00 dalla zona “Archivio Civico”.', tables:['cittadini','veicoli','telefonate'], starter:"SELECT DISTINCT c.nome, c.cognome, c.professione, t.cella\nFROM cittadini c\nJOIN veicoli v ON v.cittadino_id = c.id\nJOIN telefonate t ON t.mittente_id = c.id", hints:["Confronta v.targa con entrambe le targhe annotate usando IN.","Filtra la data, limita t.ora con BETWEEN e osserva la colonna cella.","Nel WHERE combina le due targhe, la data del 31 ottobre, l’intervallo orario e t.cella = 'Archivio Civico'."], validate: rows => rows.length === 1 && includes(rows,'nome','Marco') && includes(rows,'cognome','Riva') && includes(rows,'professione','geometra comunale') && includes(rows,'cella','Archivio Civico') },
  { skill:'JOIN MULTIPLA · BETWEEN', title:'L’ultimo contatto', text:'Il colpevole ha telefonato a una delle persone già emerse nella rete di contatti poco prima del furto. Incrocia mittente, destinatario e orario per scoprire chi.', objective:'Trova chi ha ricevuto una chiamata da Marco Riva tra le 21:30 e le 22:00.', tables:['telefonate','cittadini'], starter:"SELECT dest.nome, dest.cognome, t.ora, t.durata_sec\nFROM telefonate t\nJOIN cittadini mitt ON mitt.id = t.mittente_id\nJOIN cittadini dest ON dest.id = t.destinatario_id", hints:["Filtra il mittente usando nome e cognome del colpevole.","Limita t.ora con BETWEEN '21:30' AND '22:00'.","Nel WHERE combina nome e cognome del mittente con l’intervallo orario."], validate: rows => rows.length === 1 && includes(rows,'nome','Laura') && includes(rows,'cognome','Neri') && includes(rows,'ora','21:48') }
];

const clueTexts = [
  'L’allarme del fascicolo F-204 è scattato alle 22:14.',
  'Giulia Ferri, Sara Conti e Paolo Serra hanno usato badge validi; Laura Neri ha tentato un accesso rifiutato.',
  'Due veicoli restano compatibili con la fuga: TO-314-XR e MI-770-KA.',
  'Le due piste conducono a Marco Riva e Giulia Ferri.',
  'Marco, Sara e Giulia avevano consultato e restituito F-204 in momenti diversi.',
  'Sara Conti e Laura Neri hanno entrambe contattato personale dell’archivio.',
  'L’auto sospetta e la chiamata agganciata alla cella dell’Archivio Civico convergono su Marco Riva.',
  'Laura Neri è l’ultimo contatto del colpevole e la complice del furto.'
];

const seed = `
CREATE TABLE cittadini (id INTEGER PRIMARY KEY, nome TEXT, cognome TEXT, professione TEXT, via TEXT, civico INTEGER);
INSERT INTO cittadini VALUES (1,'Marco','Riva','geometra comunale','Via delle Mura',8),(2,'Sara','Conti','archivista','Via Garibaldi',21),(3,'Laura','Neri','giornalista','Piazza del Grano',4),(4,'Paolo','Serra','archivista','Via Roma',15),(5,'Elena','Bassi','farmacista','Via del Portico',17),(6,'Davide','Moretti','archivista','Corso Italia',33),(7,'Giulia','Ferri','insegnante','Via Po',6);
CREATE TABLE eventi (id INTEGER PRIMARY KEY, data TEXT, ora TEXT, tipo TEXT, luogo TEXT, descrizione TEXT);
INSERT INTO eventi VALUES (1,'2026-10-31','18:03','chiusura','Archivio Civico','Chiusura ordinaria edificio'),(2,'2026-10-31','21:51','porta','Archivio Civico','Apertura varco dipendenti'),(3,'2026-10-31','22:02','porta','Archivio Civico','Apertura ingresso laterale'),(4,'2026-10-31','22:14','allarme','Archivio Civico','Sensore sala Fondo Riservato F-204'),(5,'2026-10-31','22:31','chiamata','Centrale Polizia','Segnalazione automatica ricevuta'),(6,'2026-11-01','00:10','sopralluogo','Archivio Civico','Arrivo pattuglia');
CREATE TABLE accessi_archivio (id INTEGER PRIMARY KEY, cittadino_id INTEGER, data TEXT, ora_badge TEXT, varco TEXT, esito TEXT);
INSERT INTO accessi_archivio VALUES (1,2,'2026-10-31','18:01','principale','accettato'),(2,4,'2026-10-31','18:04','principale','accettato'),(3,7,'2026-10-31','21:51','dipendenti','accettato'),(4,2,'2026-10-31','22:02','laterale','accettato'),(5,3,'2026-10-31','22:05','principale','rifiutato'),(6,4,'2026-10-31','22:19','dipendenti','accettato');
CREATE TABLE telecamere (id INTEGER PRIMARY KEY, data TEXT, ora TEXT, luogo TEXT, targa TEXT, direzione TEXT);
INSERT INTO telecamere VALUES (1,'2026-10-31','21:42','Via del Portico','VA-882-LP','centro'),(2,'2026-10-31','22:08','Piazza Archivio','FI-091-NN','stazione'),(3,'2026-10-31','22:18','Via del Portico','TO-314-XR','tangenziale'),(4,'2026-10-31','22:21','Viale Nord','TO-314-XR','tangenziale'),(5,'2026-10-31','22:24','Via del Portico','MI-770-KA','centro'),(6,'2026-10-31','22:20','Viale Nord','MI-770-KA','tangenziale');
CREATE TABLE veicoli (targa TEXT PRIMARY KEY, cittadino_id INTEGER, modello TEXT, colore TEXT);
INSERT INTO veicoli VALUES ('TO-314-XR',1,'Fiat Tipo','grigio'),('FI-091-NN',5,'Lancia Ypsilon','rosso'),('MI-770-KA',7,'Toyota Yaris','bianco'),('VA-882-LP',4,'Ford Focus','blu');
CREATE TABLE prestiti_documenti (id INTEGER PRIMARY KEY, cittadino_id INTEGER, codice_fascicolo TEXT, data_prestito TEXT, data_restituzione TEXT);
INSERT INTO prestiti_documenti VALUES (1,7,'A-117','2026-09-11','2026-09-18'),(2,1,'F-204','2026-10-12','2026-10-20'),(3,3,'G-881','2026-10-20','2026-10-27'),(4,5,'B-044','2026-10-02','2026-10-03'),(5,2,'F-204','2026-09-20','2026-09-21'),(6,7,'F-204','2026-10-25','2026-10-26');
CREATE TABLE telefonate (id INTEGER PRIMARY KEY, mittente_id INTEGER, destinatario_id INTEGER, data TEXT, ora TEXT, durata_sec INTEGER, cella TEXT);
INSERT INTO telefonate VALUES (1,1,3,'2026-10-31','21:48',92,'Archivio Civico'),(2,3,2,'2026-10-26','11:20',145,'Piazza del Grano'),(3,3,4,'2026-10-28','16:02',61,'Piazza del Grano'),(4,3,6,'2026-10-30','09:14',203,'Piazza del Grano'),(5,2,4,'2026-10-31','18:11',34,'Archivio Civico'),(6,5,7,'2026-10-31','20:05',180,'Via del Portico'),(7,1,3,'2026-10-31','22:27',18,'Tangenziale Nord'),(8,3,7,'2026-10-29','12:05',51,'Piazza del Grano'),(9,2,6,'2026-10-29','10:36',74,'Via Garibaldi'),(10,7,5,'2026-10-31','21:42',48,'Stazione Centrale');
`;

const case02Seed = `
CREATE TABLE persone (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, cognome TEXT NOT NULL, ruolo TEXT NOT NULL);
INSERT INTO persone VALUES (1,'Elena','Bassi','responsabile protocollo'),(2,'Davide','Moretti','magazziniere'),(3,'Giulia','Ferri','corriere comunale'),(4,'Paolo','Serra','custode'),(5,'Sara','Conti','tecnico comunale'),(6,'Luca','Verdi','addetto allo scalo');
CREATE TABLE plichi (id INTEGER PRIMARY KEY, protocollo TEXT UNIQUE NOT NULL, oggetto TEXT NOT NULL, destinatario_id INTEGER NOT NULL, priorita TEXT NOT NULL);
INSERT INTO plichi VALUES (1,'P-27','Progetto argine',5,'riservata'),(2,'P-12','Contratti pulizia',1,'ordinaria'),(3,'P-31','Inventario binari',6,'ordinaria'),(4,'P-44','Mappe catastali',4,'riservata');
CREATE TABLE movimenti (id INTEGER PRIMARY KEY, plico_id INTEGER NOT NULL, data TEXT NOT NULL, ora TEXT NOT NULL, luogo TEXT NOT NULL, stato TEXT NOT NULL, operatore_id INTEGER NOT NULL);
INSERT INTO movimenti VALUES
(1,1,'2026-11-06','18:42','Municipio','preso in carico',3),(2,1,'2026-11-06','19:08','Scalo merci','ingresso',3),(3,1,'2026-11-06','19:14','Magazzino 2','depositato',2),(4,1,'2026-11-06','19:26','Magazzino 2','consegnato',2),(5,1,'2026-11-06','19:31','Varco nord','uscita',4),
(6,2,'2026-11-06','17:05','Municipio','preso in carico',3),(7,2,'2026-11-06','17:34','Ufficio protocollo','consegnato',1),
(8,3,'2026-11-06','18:10','Scalo merci','preso in carico',6),(9,3,'2026-11-06','18:31','Magazzino 1','consegnato',6),
(10,4,'2026-11-06','18:22','Municipio','preso in carico',3),(11,4,'2026-11-06','18:58','Archivio','consegnato',4);
CREATE TABLE scansioni (id INTEGER PRIMARY KEY, plico_id INTEGER NOT NULL, data TEXT NOT NULL, ora TEXT NOT NULL, varco TEXT NOT NULL, peso_grammi INTEGER NOT NULL);
INSERT INTO scansioni VALUES (1,1,'2026-11-06','19:07','ingresso scalo',842),(2,1,'2026-11-06','19:30','uscita nord',518),(3,2,'2026-11-06','17:04','ingresso protocollo',326),(4,2,'2026-11-06','17:35','uscita protocollo',326),(5,3,'2026-11-06','18:09','ingresso scalo',611),(6,3,'2026-11-06','18:32','uscita magazzino',611),(7,4,'2026-11-06','18:21','ingresso archivio',473),(8,4,'2026-11-06','18:59','uscita archivio',473);
CREATE TABLE turni (id INTEGER PRIMARY KEY, persona_id INTEGER NOT NULL, data TEXT NOT NULL, inizio TEXT NOT NULL, fine TEXT NOT NULL, sede TEXT NOT NULL);
INSERT INTO turni VALUES (1,2,'2026-11-06','16:00','22:00','Magazzino 2'),(2,4,'2026-11-06','18:00','24:00','Scalo merci'),(3,3,'2026-11-06','17:00','20:00','Scalo merci'),(4,6,'2026-11-06','14:00','22:00','Scalo merci'),(5,1,'2026-11-06','08:00','18:00','Municipio'),(6,5,'2026-11-06','08:00','17:00','Municipio');
CREATE TABLE chiamate (id INTEGER PRIMARY KEY, mittente_id INTEGER NOT NULL, destinatario_id INTEGER NOT NULL, data TEXT NOT NULL, ora TEXT NOT NULL, durata_sec INTEGER NOT NULL, cella TEXT NOT NULL);
INSERT INTO chiamate VALUES (1,2,4,'2026-11-06','19:18',47,'Scalo merci'),(2,3,1,'2026-11-06','18:49',62,'Municipio'),(3,6,3,'2026-11-06','18:36',35,'Scalo merci'),(4,4,2,'2026-11-06','19:34',21,'Varco nord'),(5,1,5,'2026-11-06','17:15',96,'Municipio');
`;

const case02Missions = [
  {skill:'GROUP BY · COUNT',title:'Il protocollo più movimentato',text:'Quattro plichi hanno attraversato gli uffici nella stessa sera. Uno compare nel registro molte più volte degli altri.',objective:'Unisci plichi e movimenti. Conta i movimenti del 6 novembre per protocollo e ordinali dal totale più alto, chiamando il conteggio totale_movimenti.',tables:['plichi','movimenti'],starter:"SELECT p.protocollo,\n       COUNT(*) AS totale_movimenti\nFROM plichi p",hints:['Collega movimenti m con JOIN usando m.plico_id = p.id, poi filtra la data 2026-11-06.','Raggruppa per p.protocollo e ordina il conteggio dal più alto.','Completa con JOIN movimenti m ON m.plico_id = p.id, WHERE m.data = \'2026-11-06\', GROUP BY p.protocollo e ORDER BY totale_movimenti DESC.'],validate:r=>r.length===4&&r[0].protocollo==='P-27'&&Number(r[0].totale_movimenti)===5},
  {skill:'JOIN · ORDER BY',title:'La sequenza di P‑27',text:'Il numero dei passaggi è anomalo. Ricostruisci l’intera catena senza saltare operatori o luoghi.',objective:'Unisci movimenti a plichi e persone. Mostra ora, stato, luogo, nome e cognome dei movimenti di P‑27, in ordine cronologico.',tables:['plichi','movimenti','persone'],starter:"SELECT m.ora, m.stato, m.luogo,\n       pe.nome, pe.cognome\nFROM movimenti m",hints:['Collega plichi p tramite m.plico_id e persone pe tramite m.operatore_id.','Filtra il protocollo P-27 e ordina i passaggi per m.ora.','Usa JOIN plichi p ON p.id = m.plico_id, JOIN persone pe ON pe.id = m.operatore_id, WHERE p.protocollo = \'P-27\' e ORDER BY m.ora.'],validate:r=>r.length===5&&r[0].ora==='18:42'&&r[4].ora==='19:31'&&includes(r,'nome','Davide')&&includes(r,'nome','Paolo')},
  {skill:'GROUP BY · HAVING',title:'Isola l’anomalia',text:'Un plico ordinario non dovrebbe produrre più di tre registrazioni nella stessa sera.',objective:'Unisci plichi e movimenti. Per il 6 novembre mostra protocollo e numero di passaggi, conservando solo i protocolli con più di tre movimenti.',tables:['plichi','movimenti'],starter:"SELECT p.protocollo,\n       COUNT(*) AS passaggi\nFROM plichi p",hints:['Collega movimenti m, filtra la data e raggruppa per protocollo.','Il filtro sul conteggio va scritto con HAVING, dopo GROUP BY.','Completa con JOIN movimenti m ON m.plico_id = p.id, WHERE m.data = \'2026-11-06\', GROUP BY p.protocollo e HAVING COUNT(*) > 3.'],validate:r=>r.length===1&&r[0].protocollo==='P-27'&&Number(r[0].passaggi)===5},
  {skill:'SOTTOQUERY · BETWEEN',title:'Chi era ancora in servizio?',text:'Alle 19:26 il sistema segna la consegna. Più persone erano ancora presenti: non fermarti al primo nome.',objective:'Mostra nome, cognome e ruolo delle persone il cui id compare nei turni del 6 novembre, alle 19:26, con sede Scalo merci o Magazzino 2.',tables:['persone','turni'],starter:"SELECT nome, cognome, ruolo\nFROM persone\nWHERE id IN (\n  \n);",hints:['Nella sottoquery seleziona persona_id da turni e filtra la data 2026-11-06.','Limita sede alle due indicate e verifica l’orario con BETWEEN inizio AND fine.','Dentro IN usa SELECT persona_id FROM turni WHERE data = \'2026-11-06\' AND sede IN (\'Scalo merci\', \'Magazzino 2\') AND \'19:26\' BETWEEN inizio AND fine.'],validate:r=>r.length===4&&includes(r,'nome','Davide')&&includes(r,'nome','Paolo')&&includes(r,'nome','Giulia')&&includes(r,'nome','Luca')},
  {skill:'MIN · MAX · HAVING',title:'Il peso che non torna',text:'I varchi pesano automaticamente ogni collo. Soltanto una spedizione è uscita molto più leggera di quando è entrata.',objective:'Unisci plichi e scansioni. Per protocollo mostra peso_massimo, peso_minimo e la loro differenza; conserva solo differenze superiori a 200 grammi.',tables:['plichi','scansioni'],starter:"SELECT p.protocollo,\n       MAX(s.peso_grammi) AS peso_massimo\nFROM plichi p",hints:['Aggiungi MIN(s.peso_grammi) AS peso_minimo e calcola MAX(...) - MIN(...) AS differenza.','Collega scansioni s, raggruppa per protocollo e applica la condizione aggregata con HAVING.','Usa JOIN scansioni s ON s.plico_id = p.id, GROUP BY p.protocollo e HAVING MAX(s.peso_grammi) - MIN(s.peso_grammi) > 200.'],validate:r=>r.length===1&&r[0].protocollo==='P-27'&&Number(r[0].differenza)===324},
  {skill:'IN · SOTTOQUERY',title:'Gli operatori del plico',text:'Ora sai che la busta è stata alleggerita. Restringi il gruppo alle persone che hanno effettivamente registrato P‑27.',objective:'Mostra nome, cognome e ruolo delle persone il cui id compare tra gli operatori dei movimenti di P‑27.',tables:['persone','movimenti','plichi'],starter:"SELECT nome, cognome, ruolo\nFROM persone\nWHERE id IN (\n  \n);",hints:['La sottoquery deve restituire gli operatore_id dalla tabella movimenti.','Nella sottoquery collega movimenti a plichi e filtra il protocollo P-27.','Dentro IN usa SELECT m.operatore_id FROM movimenti m JOIN plichi p ON p.id = m.plico_id WHERE p.protocollo = \'P-27\'.'],validate:r=>r.length===3&&includes(r,'nome','Giulia')&&includes(r,'nome','Davide')&&includes(r,'nome','Paolo')},
  {skill:'JOIN MULTIPLA · BETWEEN',title:'La telefonata prima della consegna',text:'Tra deposito e consegna parte una sola chiamata fra due operatori già collegati a P‑27.',objective:'Mostra mittente, destinatario e ora delle chiamate tra le 19:15 e le 19:30; entrambi gli interlocutori devono comparire nei movimenti di P‑27.',tables:['chiamate','persone','movimenti','plichi'],starter:"SELECT DISTINCT mitt.nome AS mittente,\n       dest.nome AS destinatario, c.ora\nFROM chiamate c",hints:['Collega persone due volte: mitt al mittente_id e dest al destinatario_id; poi filtra l’orario con BETWEEN.','Controlla mittente e destinatario con due condizioni IN e due sottoquery sui movimenti di P-27.','Per entrambi gli ID usa IN (SELECT m.operatore_id FROM movimenti m JOIN plichi p ON p.id = m.plico_id WHERE p.protocollo = \'P-27\').'],validate:r=>r.length===1&&r[0].mittente==='Davide'&&r[0].destinatario==='Paolo'&&r[0].ora==='19:18'},
  {skill:'JOIN MULTIPLA · DEDUZIONE',title:'Firma falsa e uscita',text:'La consegna contestata è stata firmata nel magazzino; pochi minuti dopo il plico alleggerito è passato dal varco del custode.',objective:'Mostra il nome completo del magazziniere della consegna come colpevole e quello del custode dell’uscita successiva come complice, limitando l’analisi a P‑27.',tables:['plichi','movimenti','persone'],starter:"SELECT col.nome || ' ' || col.cognome AS colpevole,\n       comp.nome || ' ' || comp.cognome AS complice\nFROM plichi p",hints:["Collega un movimento consegna allo stesso plico, poi la persona col che lo ha registrato; filtra P-27 e lo stato 'consegnato'.",'Collega un secondo movimento uscita allo stesso plico: deve avere stato uscita e ora successiva alla consegna.','Collega persone comp all’operatore dell’uscita e filtra col.ruolo = \'magazziniere\' e comp.ruolo = \'custode\'.'],validate:r=>r.length===1&&includes(r,'colpevole','Davide Moretti')&&includes(r,'complice','Paolo Serra')}
];

// Il Caso 02 riduce progressivamente l'aiuto: le prime quattro missioni
// offrono pochi riferimenti utili, dalla quinta resta soltanto lo scheletro.
const case02Starters=[
  "SELECT p.protocollo,\n       COUNT(*) AS totale_movimenti\nFROM plichi p",
  "SELECT m.ora, m.stato, m.luogo\nFROM movimenti m",
  "SELECT p.protocollo,\n       COUNT(*) AS passaggi\nFROM plichi p",
  "SELECT nome, cognome, ruolo\nFROM persone\nWHERE id IN (\n  \n)",
  "SELECT\nFROM",
  "SELECT\nFROM",
  "SELECT\nFROM",
  "SELECT\nFROM"
];
case02Missions.forEach((mission,index)=>{mission.starter=case02Starters[index]});

const case02ClueTexts = [
  'P‑27 ha cinque movimenti: è il protocollo più movimentato della sera.',
  'Giulia Ferri prende in carico P‑27; Davide Moretti lo deposita e lo dichiara consegnato; Paolo Serra registra l’uscita.',
  'Soltanto P‑27 supera i tre passaggi nella stessa sera.',
  'Alle 19:26 erano ancora presenti Davide, Paolo, Giulia e Luca: restano più piste.',
  'P‑27 passa da 842 a 518 grammi: mancano 324 grammi.',
  'Gli operatori direttamente collegati a P‑27 sono Giulia Ferri, Davide Moretti e Paolo Serra.',
  'Davide Moretti chiama Paolo Serra alle 19:18, tra il deposito e la falsa consegna.',
  'Davide Moretti ha falsificato la consegna; Paolo Serra ha fatto uscire il contenuto dal varco nord.'
];

const trainingSeed = `
PRAGMA foreign_keys = ON;
CREATE TABLE importazione_temporanea (riga TEXT);
INSERT INTO importazione_temporanea VALUES ('file acquisito'),('record da verificare');
`;

const trainingMissions = [
  {skill:'CREATE TABLE · PRIMARY KEY',title:'Progetta la tabella fascicoli',text:'Prima consegna: trasforma il registro cartaceo in una struttura capace di conservare ogni fascicolo senza duplicati.',objective:'Crea fascicoli con codice TEXT chiave primaria e i campi titolo, settore e stato, tutti TEXT NOT NULL.',tables:[],explore:[],command:/^create\s+table\s+fascicoli\b/i,starter:"CREATE TABLE fascicoli (\n  \n);",hints:['Definisci un campo per riga nella forma nome TIPO vincolo.','codice deve essere la PRIMARY KEY; titolo, settore e stato devono essere TEXT NOT NULL.',"CREATE TABLE fascicoli (\n  codice TEXT PRIMARY KEY,\n  titolo TEXT NOT NULL,\n  settore TEXT NOT NULL,\n  stato TEXT NOT NULL\n);"],preview:'PRAGMA table_info(fascicoli)',validateDb:()=>{const columns=columnsOf('fascicoli');return tableExists('fascicoli')&&columns.find(column=>column.name==='codice')?.pk===1&&['titolo','settore','stato'].every(name=>columns.find(column=>column.name===name)?.notnull===1)}},
  {skill:'INSERT INTO · VALUES',title:'Trascrivi i primi fascicoli',text:'La struttura è pronta, ma il registro è ancora vuoto. Trascrivi le quattro schede consegnate dall’ufficio archivio.',objective:'Inserisci F-101 Catasto storico, F-204 Fondo riservato, A-117 Delibere 2025 e TMP-999 Doppione importato. Usa i settori Storico, Storico, Amministrativo e Importazione; stato disponibile per tutti.',tables:['fascicoli'],command:/^insert\s+into\s+fascicoli\b/i,starter:"INSERT INTO fascicoli (codice, titolo, settore, stato)\nVALUES",hints:['Ogni riga va scritta tra parentesi; separa più righe con una virgola.','I quattro valori seguono l’ordine codice, titolo, settore, stato.',"VALUES\n  ('F-101', 'Catasto storico', 'Storico', 'disponibile'),\n  ('F-204', 'Fondo riservato', 'Storico', 'disponibile'),\n  ('A-117', 'Delibere 2025', 'Amministrativo', 'disponibile'),\n  ('TMP-999', 'Doppione importato', 'Importazione', 'disponibile');"],preview:'SELECT * FROM fascicoli ORDER BY codice',validateDb:()=>scalar('SELECT COUNT(*) FROM fascicoli')===4&&['F-101','F-204','A-117','TMP-999'].every(code=>scalar('SELECT COUNT(*) FROM fascicoli WHERE codice = ?',[code])===1)},
  {skill:'SELECT · WHERE · ORDER BY',title:'Verifica ciò che hai inserito',text:'Prima di modificare il registro, controlla che i fascicoli storici siano presenti e leggibili.',objective:'Mostra codice, titolo e stato dei fascicoli del settore “Storico”, ordinati per codice.',tables:['fascicoli'],command:/^select\b/i,starter:"SELECT codice, titolo, stato\nFROM fascicoli",hints:['Aggiungi un filtro WHERE sul settore.','Il valore testuale Storico va racchiuso tra apici; poi ordina per codice.',"WHERE settore = 'Storico'\nORDER BY codice;"],validate:rows=>rows.length===2&&rows[0].codice==='F-101'&&rows[1].codice==='F-204'},
  {skill:'UPDATE · SET · WHERE',title:'Classifica il fascicolo riservato',text:'L’ufficio segnala un errore: F-204 non è disponibile al pubblico e deve cambiare stato senza modificare gli altri record.',objective:'Aggiorna soltanto F-204 impostando stato = “riservato”.',tables:['fascicoli'],command:/^update\s+fascicoli\b/i,starter:"UPDATE fascicoli",hints:['Servono SET per il nuovo valore e WHERE per scegliere una sola riga.','Imposta stato a riservato e identifica il record tramite il codice.',"SET stato = 'riservato'\nWHERE codice = 'F-204';"],preview:"SELECT codice, titolo, stato FROM fascicoli ORDER BY codice",validateDb:()=>scalar("SELECT COUNT(*) FROM fascicoli WHERE codice='F-204' AND stato='riservato'")===1&&scalar("SELECT COUNT(*) FROM fascicoli WHERE codice<>'F-204' AND stato='disponibile'")===3},
  {skill:'ALTER TABLE · ADD COLUMN',title:'Aggiungi la collocazione',text:'Il responsabile chiede di registrare anche la posizione fisica dei fascicoli. Estendi la struttura senza perdere i dati.',objective:'Aggiungi a fascicoli la colonna scaffale di tipo TEXT.',tables:['fascicoli'],command:/^alter\s+table\s+fascicoli\b/i,starter:"ALTER TABLE fascicoli",hints:['ALTER TABLE modifica una struttura esistente.','Usa ADD COLUMN seguito dal nome e dal tipo del nuovo campo.','ADD COLUMN scaffale TEXT;'],preview:'PRAGMA table_info(fascicoli)',validateDb:()=>columnsOf('fascicoli').some(column=>column.name==='scaffale'&&String(column.type).toUpperCase()==='TEXT')},
  {skill:'DELETE FROM · WHERE',title:'Rimuovi il doppione',text:'TMP-999 è una riga provvisoria prodotta dall’importazione, non un vero fascicolo. Ripulisci il registro senza toccare gli altri dati.',objective:'Elimina soltanto il record con codice TMP-999.',tables:['fascicoli'],command:/^delete\s+from\s+fascicoli\b/i,starter:"DELETE FROM fascicoli",hints:['DELETE senza WHERE eliminerebbe tutte le righe.','Usa la chiave primaria codice per individuare il doppione.','WHERE codice = \'TMP-999\';'],preview:'SELECT codice, titolo, settore, stato FROM fascicoli ORDER BY codice',validateDb:()=>scalar("SELECT COUNT(*) FROM fascicoli WHERE codice='TMP-999'")===0&&scalar('SELECT COUNT(*) FROM fascicoli')===3},
  {skill:'CREATE TABLE · FOREIGN KEY',title:'Collega le consultazioni',text:'Il registro dei fascicoli funziona. Ora costruisci una seconda tabella per sapere chi consulta ogni documento e quando.',objective:'Crea consultazioni con id INTEGER PRIMARY KEY, fascicolo_codice TEXT NOT NULL, operatore TEXT NOT NULL, data TEXT NOT NULL e chiave esterna verso fascicoli(codice).',tables:['fascicoli'],command:/^create\s+table\s+consultazioni\b/i,starter:"CREATE TABLE consultazioni (\n  \n);",hints:['Definisci prima i quattro campi richiesti, uno per riga.','Aggiungi FOREIGN KEY (fascicolo_codice) REFERENCES fascicoli(codice).',"CREATE TABLE consultazioni (\n  id INTEGER PRIMARY KEY,\n  fascicolo_codice TEXT NOT NULL,\n  operatore TEXT NOT NULL,\n  data TEXT NOT NULL,\n  FOREIGN KEY (fascicolo_codice) REFERENCES fascicoli(codice)\n);"],preview:'PRAGMA foreign_key_list(consultazioni)',validateDb:()=>tableExists('consultazioni')&&columnsOf('consultazioni').length===4&&queryRows('PRAGMA foreign_key_list(consultazioni)').some(row=>row.table==='fascicoli'&&row.from==='fascicolo_codice'&&row.to==='codice')},
  {skill:'INSERT · CHIAVE ESTERNA',title:'Registra le consultazioni',text:'La relazione è pronta. Trascrivi i tre movimenti consegnati dall’ufficio e verifica che ogni codice rimandi a un fascicolo esistente.',objective:'Registra: id 1, F-101, Anna Bianchi, 2026-10-29; id 2, F-204, Luca Verdi, 2026-10-30; id 3, A-117, Sara Conti, 2026-10-31.',tables:['consultazioni','fascicoli'],command:/^insert\s+into\s+consultazioni\b/i,starter:"INSERT INTO consultazioni (id, fascicolo_codice, operatore, data)\nVALUES",hints:['Scrivi una parentesi per ogni consultazione e separa le righe con virgole.','Rispetta l’ordine id, fascicolo_codice, operatore, data.',"VALUES\n  (1, 'F-101', 'Anna Bianchi', '2026-10-29'),\n  (2, 'F-204', 'Luca Verdi', '2026-10-30'),\n  (3, 'A-117', 'Sara Conti', '2026-10-31');"],preview:'SELECT c.id, c.operatore, c.data, f.codice, f.titolo FROM consultazioni c JOIN fascicoli f ON f.codice=c.fascicolo_codice ORDER BY c.id',validateDb:()=>scalar('SELECT COUNT(*) FROM consultazioni')===3&&['F-101','F-204','A-117'].every(code=>scalar('SELECT COUNT(*) FROM consultazioni WHERE fascicolo_codice = ?',[code])===1)},
  {skill:'DROP TABLE',title:'Consegna un archivio pulito',text:'Il database è completo. Prima della consegna, elimina la tabella tecnica usata soltanto durante l’importazione.',objective:'Elimina definitivamente la tabella importazione_temporanea.',tables:['fascicoli','consultazioni'],command:/^drop\s+table\s+importazione_temporanea\b/i,starter:"DROP TABLE",hints:['DROP TABLE elimina una struttura che non serve più.','Indica il nome esatto della tabella temporanea.','DROP TABLE importazione_temporanea;'],preview:"SELECT name AS tabella FROM sqlite_master WHERE type='table' ORDER BY name",validateDb:()=>!tableExists('importazione_temporanea')}
];

const trainingVerificationTexts = [
  'Struttura verificata: fascicoli ha una chiave primaria e tre campi obbligatori.',
  'Popolamento verificato: il registro contiene le quattro schede richieste.',
  'Controllo riuscito: il filtro restituisce F-101 e F-204 nell’ordine corretto.',
  'Aggiornamento riuscito: soltanto F-204 risulta riservato.',
  'Struttura aggiornata: scaffale è disponibile e i dati sono rimasti intatti.',
  'Pulizia riuscita: TMP-999 è stato rimosso e restano tre fascicoli validi.',
  'Relazione verificata: consultazioni fa riferimento a fascicoli(codice).',
  'Registro popolato: tre consultazioni sono collegate a fascicoli esistenti.',
  'Consegna completata: la tabella temporanea è stata rimossa e il database è pronto per il controllo finale.'
];

let SQLRuntime, db, currentCase='mystery', activeMissions=missions, activeClueTexts=clueTexts, step = 0, hintLevel = 0, queryCount = 0, solvedCurrent = false, collectedClues = [];
const $ = id => document.getElementById(id);
const els = {hub:$('caseHub'),trainingIntro:$('trainingIntro'),case02Intro:$('case02Intro'),intro:$('intro'),workspace:$('workspace'),completion:$('completion'),editor:$('sqlEditor'),results:$('results'),feedback:$('feedback'),feedbackText:$('feedbackText')};

const readVolume=(key,fallback)=>{try{const value=Number(localStorage.getItem(key));return Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback}catch(e){return fallback}};
const readFlag=key=>{try{return localStorage.getItem(key)==='true'}catch(e){return false}};
const music=$('ambientMusic');
const audio={ctx:null,fxGain:null,started:false,muted:readFlag('ao-muted'),musicVolume:readVolume('ao-music-volume',.20),effectsVolume:readVolume('ao-effects-volume',.55)};
const effectiveEffectsVolume=()=>audio.muted?0:audio.effectsVolume;
const applyMusicVolume=()=>{music.volume=audio.muted?0:Math.min(1,audio.musicVolume*.32)};

function setGain(gain,value,time=.08){if(!gain||!audio.ctx)return;gain.gain.cancelScheduledValues(audio.ctx.currentTime);gain.gain.setTargetAtTime(value,audio.ctx.currentTime,time)}
function ensureAudio(){
  try{
    if(!audio.ctx){audio.ctx=new (window.AudioContext||window.webkitAudioContext)();audio.fxGain=audio.ctx.createGain();audio.fxGain.connect(audio.ctx.destination);audio.fxGain.gain.value=effectiveEffectsVolume()}
    if(audio.ctx.state==='suspended')audio.ctx.resume();
    setGain(audio.fxGain,effectiveEffectsVolume(),.03);applyMusicVolume();
    if(!audio.started||music.paused){
      const playback=music.play();
      if(playback)playback.then(()=>{audio.started=true;syncAudioStatus()}).catch(()=>{audio.started=false;$('audioStatus').textContent='Premi ♪ per avviare'});
    }else syncAudioStatus();
  }catch(e){$('audioStatus').textContent='Non disponibile'}
}
function isAudioSilent(){return audio.muted || (audio.musicVolume === 0 && audio.effectsVolume === 0)}
function syncAudioStatus(){const musicLevel=Math.round(audio.musicVolume*100);$('audioStatus').textContent=isAudioSilent()?'Tutto in muto':!audio.started?'Pronto':musicLevel?'In riproduzione':'Musica a zero'}
function persistAudio(){try{localStorage.setItem('ao-music-volume',String(audio.musicVolume));localStorage.setItem('ao-effects-volume',String(audio.effectsVolume));localStorage.setItem('ao-muted',String(audio.muted))}catch(e){}}
function syncAudioControls(){const storedMusic=Math.round(audio.musicVolume*100),storedEffects=Math.round(audio.effectsVolume*100),musicLevel=audio.muted?0:storedMusic,effectsLevel=audio.muted?0:storedEffects;const musicControl=$('musicVolume'),effectsControl=$('effectsVolume');musicControl.value=musicLevel;effectsControl.value=effectsLevel;musicControl.disabled=false;effectsControl.disabled=false;$('musicVolumeValue').textContent=`${musicLevel}%`;$('effectsVolumeValue').textContent=`${effectsLevel}%`;const muteButton=$('muteAllBtn'),silent=isAudioSilent(),action=silent?'Riattiva tutto':'Silenzia tutto',masterLevel=Math.max(musicLevel,effectsLevel),waveCount=masterLevel===0?0:masterLevel<=20?1:masterLevel<=50?2:3;muteButton.setAttribute('aria-pressed',String(silent));muteButton.setAttribute('data-waves',String(waveCount));muteButton.setAttribute('aria-label',action);muteButton.title=`${action} · musica ${musicLevel}%`;$('soundBtn').title=isAudioSilent()?'Audio in muto':`Musica ${musicLevel}%`;syncAudioStatus()}
function toggleMuteAll(){const silent=isAudioSilent();if(silent && audio.musicVolume===0 && audio.effectsVolume===0){audio.musicVolume=.20;audio.effectsVolume=.55}audio.muted=!silent;applyMusicVolume();setGain(audio.fxGain,effectiveEffectsVolume(),.03);persistAudio();syncAudioControls()}

function includes(rows,key,needle){ return rows.some(r => Object.entries(r).some(([k,v]) => (!key || k===key) && String(v).toLowerCase().includes(String(needle).toLowerCase()))); }
function has(rows,key,value){ return rows.some(r => String(r[key])===String(value)); }
function valueOf(rows,key){ return rows[0]?.[key]; }
function rowsFrom(result){ if(!result.length) return []; const last=result[result.length-1]; return last.values.map(vals=>Object.fromEntries(last.columns.map((c,i)=>[c,vals[i]]))); }
function queryRows(sql,params=[]){const statement=db.prepare(sql);try{statement.bind(params);const rows=[];while(statement.step())rows.push(statement.getAsObject());return rows}finally{statement.free()}}
function scalar(sql,params=[]){const row=queryRows(sql,params)[0];return row?Object.values(row)[0]:undefined}
function tableExists(name){return scalar("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?",[name])===1}
function columnsOf(name){return queryRows(`PRAGMA table_info(${name})`)}
function beep(freq=540,duration=.06,level=.045){if(audio.muted||!audio.effectsVolume)return;try{ensureAudio();const o=audio.ctx.createOscillator(),g=audio.ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(level,audio.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.ctx.currentTime+duration);o.connect(g).connect(audio.fxGain);o.start();o.stop(audio.ctx.currentTime+duration)}catch(e){}}

function resetDatabase(mode=currentCase){
  if(db)db.close();
  db=new SQLRuntime.Database();
  db.run(mode==='training'?trainingSeed:mode==='case02'?case02Seed:seed);
}

async function initDb(){
  SQLRuntime=await initSqlJs({locateFile:file=>`vendor/${file}`});
  resetDatabase('mystery');
  $('runBtn').disabled=false;$('startBtn').disabled=false;$('startTrainingBtn').disabled=false;$('beginTrainingBtn').disabled=false;$('startCaseTwoBtn').disabled=false;
  $('startBtn').innerHTML='<span class="case-cta-copy"><small>CASO 01 · PRONTO</small><strong>Avvia il gioco</strong></span><span class="case-cta-seal" aria-hidden="true">01</span>';
  $('startCaseTwoBtn').innerHTML='<span class="case-cta-copy"><small>CASO 02 · PROTOCOLLO APERTO</small><strong>Inizia l’indagine</strong></span><span class="case-cta-seal" aria-hidden="true">02</span>';
  $('dbStatus').className='footer-status db-status ready';$('dbStatus').innerHTML='<i></i><span>DATABASE PRONTO</span>';
}

function renderMission(){
  const m=activeMissions[step]; hintLevel=0; solvedCurrent=false;
  const training=currentCase==='training',case02=currentCase==='case02';
  $('briefingLabel').innerHTML=training?'<b>01</b> LEGGI LA CONSEGNA':'<b>01</b> LEGGI QUI COSA CERCARE';
  $('queryLabel').innerHTML=training?'<b>02</b> SCRIVI IL COMANDO SQL':'<b>02</b> COMPLETA LA QUERY QUI SOTTO';
  $('queryFilename').textContent=training?'laboratorio_sql.sql':case02?'protocollo_p27.sql':'query_indagine.sql';
  $('notebookCaseLabel').textContent=training?'CASO 00 · LABORATORIO':case02?'CASO P–27':'CASO F–204';
  $('stepCount').textContent=`${training?'FASE':'INDIZIO'} ${step+1} DI ${activeMissions.length}`;updateProgress(step);setNotebookOpen(false);
  $('missionSkill').textContent=m.skill;$('missionTitle').textContent=m.title;$('missionText').textContent=m.text;$('missionObjective').textContent=m.objective;els.editor.value=m.starter;
  $('nextAction').textContent=training
    ?'Scrivi il comando richiesto, eseguilo e usa il risultato per controllare il lavoro. Se ti blocchi, apri i suggerimenti progressivi.'
    :currentCase==='case02'
      ?(step===0?'Completa raggruppamento e ordinamento per confrontare tutti i protocolli, poi esegui la query.':'Collega o raggruppa i dati richiesti dall’obiettivo, poi esegui la query e annota la prova.')
      :step===0
        ?'Esegui la query iniziale, osserva le righe ottenute e prova a restringere la ricerca fino a isolare un solo evento.'
        :'Completa ciò che manca usando l’obiettivo e gli indizi già raccolti, poi esegui la query.';
  $('tableChips').innerHTML=(m.explore??m.tables).map(t=>`<button type="button" data-table="${t}">${t}</button>`).join('');
  setHintsOpen(false);$('hintBtn').setAttribute('aria-label',training?'Apri i suggerimenti':'Apri gli indizi');$('hintBtn').title=training?'Suggerimenti':'Indizi';
  $('notebookBtn').classList.toggle('hidden',training);if($('trainingSuccessDialog').open)$('trainingSuccessDialog').close();
  $('foundClue').classList.add('hidden');$('runBtn').disabled=!db;$('runBtn').querySelector('.run-step').textContent='03';$('runBtn').querySelector('.run-step').classList.remove('advance');$('runBtn').querySelector('.run-label').textContent='Esegui e verifica';els.editor.readOnly=false;
  $('clueInput').value='';$('continueBtn').disabled=true;
  $('notebookEyebrow').textContent=training?'REGISTRO DEL LABORATORIO':'STRUMENTI DELL’INVESTIGATORE';
  $('notebookTitle').textContent=training?'Diario di costruzione':'Taccuino degli indizi';
  $('notebookCloseBtn').setAttribute('aria-label',training?'Chiudi il diario':'Chiudi taccuino');
  $('foundClueLabel').textContent=training?'✓ FASE COMPLETATA':'✓ PROVA TROVATA';
  $('foundClueHelp').textContent=training?'Controlla il risultato: corrisponde alla consegna?':'Osserva la tabella: cosa hai scoperto?';
  $('clueInputLabel').textContent=training?'04 · ANNOTA COSA HAI FATTO':'04 · SCRIVI L’INDIZIO';
  $('hintBoxTitle').innerHTML=training?'<i aria-hidden="true">✦</i> SUGGERIMENTI SQL':'<i aria-hidden="true">✦</i> INDIZI DELL’INVESTIGATORE';
  $('hintCloseBtn').setAttribute('aria-label',training?'Chiudi suggerimenti':'Chiudi indizi');
  document.querySelector('.investigation-tools').setAttribute('aria-label',training?'Strumenti del laboratorio':'Strumenti dell’investigatore');
  $('hintPrevBtn').setAttribute('aria-label',training?'Suggerimento precedente':'Indizio precedente');
  $('hintNextBtn').setAttribute('aria-label',training?'Suggerimento successivo':'Indizio successivo');
  $('clueInput').placeholder=training?'Esempio: Ho creato la tabella con…':'Esempio: L’allarme è scattato alle…';
  $('clueInputHelp').textContent=training?'Riassumi il comando e il risultato in una breve frase.' :'Scrivi liberamente ciò che hai scoperto.';$('clueInputHelp').className='';
  els.results.innerHTML='<div class="empty-state">I risultati del comando appariranno qui.</div>';$('rowCount').textContent='0 righe';setFeedback(training?'Completa il comando e premi «Esegui e verifica». Se è corretto, il pulsante diventerà «Continua».':'Completa la query e premi «Esegui e verifica». Se è corretta, salva l’indizio nel taccuino: il pulsante diventerà «Continua».');
  document.querySelectorAll('[data-table]').forEach(b=>b.onclick=()=>{els.editor.value=`SELECT *\nFROM ${b.dataset.table}\nLIMIT 20;`;els.editor.focus()});
}

function renderNotebook(){
  const training=currentCase==='training';
  $('clueCount').textContent=`${collectedClues.length} / ${activeMissions.length}`;
  $('notebookButtonCount').textContent=`${collectedClues.length} / ${activeMissions.length}`;
  $('notebookBtn').setAttribute('aria-label',`${training?'Apri il diario di costruzione':'Apri il taccuino'}: ${collectedClues.length} ${collectedClues.length===1?'nota':'note'} su ${activeMissions.length}`);
  $('notebookBtn').title=training?'Diario di costruzione':'Taccuino';
  $('clueList').innerHTML=collectedClues.length
    ? collectedClues.map((clue,i)=>`<p class="clue-note${i===collectedClues.length-1?' latest':''}"><b>${i+1}.</b> ${escapeHtml(clue)}</p>`).join('')
    : `<p class="notebook-empty">${training?'Qui raccoglierai le tue annotazioni tecniche, una per ogni fase completata.':'Le prove corrette verranno annotate qui e resteranno disponibili per gli enigmi successivi.'}</p>`;
}

function updateProgress(completed){
  const percent=Math.round(completed/activeMissions.length*100);
  $('progressPercent').textContent=`${percent}%`;
  $('progressBar').style.width=`${completed/activeMissions.length*100}%`;
}

function renderHint(){
  const hints=activeMissions[step].hints;
  hintLevel=Math.max(0,Math.min(hintLevel,hints.length-1));
  $('hintText').textContent=hints[hintLevel];
  $('hintCounter').textContent=`${hintLevel+1} / ${hints.length}`;
  $('hintPrevBtn').disabled=hintLevel===0;
  $('hintNextBtn').disabled=hintLevel===hints.length-1;
}

function setHintsOpen(open){
  const training=currentCase==='training';
  if(open)setNotebookOpen(false);
  $('hintBox').classList.toggle('hidden',!open);
  $('hintBtn').setAttribute('aria-expanded',String(open));
  $('hintBtn').classList.toggle('active',open);
  $('hintBtn').setAttribute('aria-label',open?(training?'Chiudi i suggerimenti':'Chiudi gli indizi'):(training?'Apri i suggerimenti':'Apri gli indizi'));
  if(open)renderHint();
}

function setNotebookOpen(open){
  if(open)setHintsOpen(false);
  $('notebookDrawer').classList.toggle('hidden',!open);
  $('notebookBtn').setAttribute('aria-expanded',String(open));
  $('notebookBtn').classList.toggle('active',open);
}

function setAudioPanel(open){
  $('audioPanel').classList.toggle('hidden',!open);
  $('soundBtn').setAttribute('aria-expanded',String(open));
  $('soundBtn').setAttribute('aria-label',open?'Chiudi controlli audio':'Apri controlli audio');
  if(open){ensureAudio();syncAudioControls()}
}

function setFeedback(text,type=''){ els.feedbackText.textContent=text;els.feedback.className=`feedback ${type}`; }
function escapeHtml(v){return String(v??'NULL').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderResults(result,elapsed=0){
  if(!result.length){els.results.innerHTML='<div class="empty-state">Query eseguita: nessuna riga restituita.</div>';$('rowCount').textContent=`0 righe · ${elapsed} ms`;return;}
  const r=result[result.length-1]; $('rowCount').textContent=`${r.values.length} ${r.values.length===1?'riga':'righe'} · ${elapsed} ms`;
  els.results.innerHTML=`<table><thead><tr>${r.columns.map(c=>`<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${r.values.map(row=>`<tr>${row.map(v=>`<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function inspectSql(sql){
  const withoutComments=sql.replace(/--.*$/gm,' ').replace(/\/\*[\s\S]*?\*\//g,' ').trim();
  const singleStatement=withoutComments.replace(/;\s*$/,'').trim();
  if((singleStatement.match(/'/g)||[]).length%2!==0)return "Controlla gli apici: una stringa è stata aperta con ' ma non è stata chiusa. Verifica soprattutto date e parole tra apici.";
  let depth=0;for(const char of singleStatement){if(char==='(')depth++;if(char===')')depth--;if(depth<0)break}if(depth!==0)return 'Controlla le parentesi: ogni parentesi aperta deve essere chiusa.';
  if(singleStatement.length>4000)return 'La query è troppo lunga.';
  if(singleStatement.includes(';'))return 'Esegui una sola istruzione SQL alla volta.';
  if(currentCase==='training'){
    if(!/^(create\s+table|insert\s+into|select|update|alter\s+table|delete\s+from|drop\s+table)\b/i.test(singleStatement))return 'Usa uno dei comandi previsti dal laboratorio: CREATE TABLE, INSERT, SELECT, UPDATE, ALTER TABLE, DELETE o DROP TABLE.';
    if(/\b(attach|detach|vacuum|pragma|replace)\b/i.test(singleStatement))return 'Questo comando non fa parte del laboratorio guidato.';
    return '';
  }
  if(!/^(select|with|explain)\b/i.test(singleStatement))return 'Sono consentite soltanto query di lettura.';
  if(/\b(insert|update|delete|drop|alter|create|replace|attach|detach|vacuum|pragma)\b/i.test(singleStatement))return 'Il database del caso è in sola lettura.';
  return '';
}

function usesRequiredTables(sql,tables){return tables.every(table=>new RegExp(`\\b${table}\\b`,'i').test(sql));}

function runQuery(){
  if(!db)return setFeedback('Il database si sta ancora caricando. Attendi un istante e riprova.','error');
  if(solvedCurrent)return;
  const sql=els.editor.value.trim(); if(!sql)return setFeedback('Scrivi prima una query.','error');
  const inspectionError=inspectSql(sql);if(inspectionError)return setFeedback(inspectionError,'error');
  const m=activeMissions[step],training=currentCase==='training';let savepointOpen=false;
  try{
    if(training){db.run('SAVEPOINT mission_attempt');savepointOpen=true}
    const started=performance.now();const result=db.exec(sql);const elapsed=Math.max(1,Math.round(performance.now()-started));queryCount++;const rows=rowsFrom(result);
    const normalized=sql.replace(/--.*$/gm,' ').replace(/\/\*[\s\S]*?\*\//g,' ').trim();
    const structureOk=training?m.command.test(normalized):(step===activeMissions.length-1||usesRequiredTables(sql,m.tables));
    const solved=structureOk&&(m.validateDb?m.validateDb():m.validate(rows));
    if(training){db.run(solved?'RELEASE mission_attempt':'ROLLBACK TO mission_attempt');if(!solved)db.run('RELEASE mission_attempt');savepointOpen=false}
    let displayResult=result;
    if(m.preview){try{displayResult=db.exec(m.preview)}catch(e){}}
    renderResults(displayResult,elapsed);
    if(solved){
      solvedCurrent=true;beep(740,.11);setFeedback(training?'Comando corretto. Operazione verificata.':'Query corretta. Prima di continuare, osserva con calma le righe ottenute: contengono una prova che servirà nell’indagine.','success');
      updateProgress(step+1);
      $('runBtn').disabled=!training;els.editor.readOnly=true;
      if(training){
        $('runBtn').querySelector('.run-label').textContent=step===activeMissions.length-1?'Concludi':'Continua';
        $('runBtn').querySelector('.run-step').innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5 5.5-5 5.5"/></svg>';$('runBtn').querySelector('.run-step').classList.add('advance');
      }else{
        $('foundClueText').textContent=activeClueTexts[step];$('foundClue').classList.remove('hidden');
        $('continueBtn').textContent='Salva';
        setNotebookOpen(true);$('foundClue').scrollIntoView({behavior:'smooth',block:'nearest'});
      }
    } else {beep(230,.08);setFeedback(training?'Il comando è valido, ma non produce ancora esattamente la struttura o i dati richiesti. La modifica è stata annullata automaticamente: correggi e riprova.':structureOk?`La query è valida e i ${rows.length} ${rows.length===1?'risultato è visibile':'risultati sono visibili'} qui sotto, ma non contengono ancora la prova richiesta. Modifica la query e riprova: non perdi nulla.`:'La query è valida, ma per questo indizio devi interrogare tutte le tabelle indicate a sinistra. I risultati restano visibili per aiutarti a correggerla.','');}
  }catch(err){if(savepointOpen){try{db.run('ROLLBACK TO mission_attempt');db.run('RELEASE mission_attempt')}catch(e){}}beep(180,.12);setFeedback(`Errore SQL: ${err.message.replace('Error: ','')}`,'error')}
}

function finish(){
  if($('trainingSuccessDialog').open)$('trainingSuccessDialog').close();
  document.body.classList.remove('game-active');els.workspace.classList.add('hidden');els.completion.classList.remove('hidden');$('queryStat').textContent=queryCount;
  const training=currentCase==='training',case02=currentCase==='case02';
  $('completionEyebrow').textContent=training?'CASO 00 · CONTROLLO FINALE':case02?'CASO 02 · RISOLTO':'CASO 01 · RISOLTO';
  if(training)$('completionTitle').innerHTML='Il registro è pronto.<br><span>Ma F‑204 non c’è.</span>';else if(case02)$('completionTitle').textContent='Il protocollo fantasma ha due firme.';else $('completionTitle').textContent='Hai fatto parlare i dati.';
  $('completionText').innerHTML=training?'Nel database la scheda del fascicolo <strong>F‑204</strong> esiste ed è classificata come riservata. Durante la verifica fisica dell’archivio, però, il fascicolo cartaceo non si trova: <strong>qualcuno lo ha sottratto</strong>. Il Caso 01 può iniziare.':case02?'Le registrazioni indicano <strong>Davide Moretti</strong> come autore della falsa consegna e <strong>Paolo Serra</strong> come complice al varco nord. Aggregazioni, sottoquery e incroci temporali hanno ricostruito il percorso di P‑27.':'Le prove indicano <strong>Marco Riva</strong> come autore del furto e <strong>Laura Neri</strong> come complice. Hai usato filtri, ordinamenti e JOIN per ricostruire la notte.';
  $('missionStat').textContent=activeMissions.length;$('missionStatLabel').textContent=training?'fasi SQL':'indizi';$('completionStatLabel').textContent=training?'laboratorio completato':'caso risolto';$('completionSeal').textContent=case02?'02':'01';
  $('replayBtn').querySelector('small').textContent=training?'NUOVA INDAGINE':'CASO ARCHIVIATO';$('replayBtn').querySelector('strong').textContent=training?'Apri il Caso 01':'Torna alla home';window.scrollTo(0,0);
}
function configureHelp(mode=currentCase){
  const training=mode==='training',case02=mode==='case02',dialog=$('helpDialog');
  dialog.querySelector('.help-head>div').innerHTML=training
    ?'<p class="eyebrow">ISTRUZIONI DEL LABORATORIO</p><h2>Costruisci in tre mosse</h2><p>Leggi la consegna, scrivi il comando SQL e controlla ciò che hai costruito.</p>'
    :'<p class="eyebrow">BRIEFING DELL’INVESTIGATORE</p><h2>Indaga in tre mosse</h2><p>Il codice è già iniziato. A te il compito di trasformare i dati in prove.</p>';
  dialog.querySelector('.help-steps').innerHTML=training
    ?'<article><b>01</b><div><span>LEGGI</span><h3>Comprendi la consegna</h3><p>Ogni fase indica quale struttura o dato devi creare, modificare o verificare.</p></div></article><article><b>02</b><div><span>SCRIVI</span><h3>Completa il comando</h3><p>Inserisci il comando SQL e premi <strong>Esegui e verifica</strong>.</p></div></article><article><b>03</b><div><span>CONTROLLA</span><h3>Osserva il risultato</h3><p>Quando il comando è corretto, lo stesso pulsante diventa <strong>Continua</strong>.</p></div></article>'
    :'<article><b>01</b><div><span>OSSERVA</span><h3>Leggi la missione</h3><p>L’obiettivo ti dice quale informazione devi far emergere dal database.</p></div></article><article><b>02</b><div><span>INTERROGA</span><h3>Completa la query</h3><p>Modifica il codice e premi <strong>Esegui e verifica</strong>. Un tentativo errato mostra comunque risultati utili.</p></div></article><article><b>03</b><div><span>DEDUCI</span><h3>Annota la prova</h3><p>Salva la risposta nel taccuino; poi lo stesso pulsante diventa <strong>Continua</strong>.</p></div></article>';
  dialog.querySelector('.help-demo').innerHTML=training
    ?'<div class="demo-bar"><i></i><i></i><i></i><span>laboratorio_sql.sql</span></div><div class="demo-code"><span>1</span><code><em>CREATE TABLE</em> fascicoli (<br>&nbsp;&nbsp;codice TEXT <mark>PRIMARY KEY</mark><br>);</code></div><div class="demo-result"><span>VERIFICA</span><strong>Struttura creata correttamente</strong></div><div class="demo-note"><span>✓</span><div><small>AVANZAMENTO</small><p>Il pulsante diventa Continua.</p></div></div>'
    :case02
      ?'<div class="demo-bar"><i></i><i></i><i></i><span>protocollo_p27.sql</span></div><div class="demo-code"><span>1</span><code><em>SELECT</em> p.codice, <mark>COUNT</mark>(*) AS passaggi<br><em>FROM</em> movimenti m<br><em>JOIN</em> plichi p ON p.id = m.plico_id<br><em>GROUP BY</em> p.codice;</code></div><div class="demo-result"><span>RISULTATO</span><strong>P‑27 · 5 passaggi registrati</strong></div><div class="demo-note"><span>✓</span><div><small>TACCUINO</small><p>P‑27 ha un percorso anomalo.</p></div></div>'
      :'<div class="demo-bar"><i></i><i></i><i></i><span>prova_01.sql</span></div><div class="demo-code"><span>1</span><code><em>SELECT</em> ora, descrizione<br><em>FROM</em> eventi<br><em>WHERE</em> tipo = <mark>\'allarme\'</mark>;</code></div><div class="demo-result"><span>RISULTATO</span><strong>22:14 · Fondo Riservato F-204</strong></div><div class="demo-note"><span>✓</span><div><small>TACCUINO</small><p>L’allarme è scattato alle 22:14.</p></div></div>';
  dialog.querySelector('.help-footer>p').innerHTML=training?'<span>?</span>Se ti blocchi, usa i suggerimenti progressivi. Ogni tentativo errato viene annullato senza danneggiare il database.':'<span>?</span>Se ti blocchi, usa i suggerimenti progressivi: l’ultimo orienta il ragionamento senza mostrare la query completa.';
  $('beginBtn').querySelector('small').textContent=training?'ISTRUZIONI COMPLETATE':'BRIEFING COMPLETATO';
  $('beginBtn').querySelector('strong').textContent=training?'Inizia il laboratorio':'Entra nell’archivio';
  $('beginBtn').querySelector('.case-cta-seal').textContent=training?'00':case02?'02':'01';
}
function startGame(mode='mystery',showGuide=true){
  currentCase=mode;activeMissions=mode==='training'?trainingMissions:mode==='case02'?case02Missions:missions;activeClueTexts=mode==='training'?trainingVerificationTexts:mode==='case02'?case02ClueTexts:clueTexts;resetDatabase(mode);
  $('brandSubtitle').textContent=mode==='training'?'LABORATORIO SQL · CASO 00':mode==='case02'?'SQL MYSTERY · CASO 02':'SQL MYSTERY · CASO 01';
  setSchemaAvailable(true);
  document.body.classList.add('game-active');document.body.classList.toggle('case02-active',mode==='case02');els.hub.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.case02Intro.classList.add('hidden');els.intro.classList.add('hidden');els.completion.classList.add('hidden');els.workspace.classList.remove('hidden');step=0;queryCount=0;collectedClues=[];renderNotebook();renderMission();window.scrollTo(0,0);if(showGuide){configureHelp(mode);$('helpDialog').showModal()}
}
function setSchemaAvailable(available){$('schemaBtn').classList.toggle('hidden',!available)}
function openCaseOne(){currentCase='mystery';setSchemaAvailable(true);$('brandSubtitle').textContent='SQL MYSTERY · CASO 01';els.hub.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.case02Intro.classList.add('hidden');els.completion.classList.add('hidden');els.intro.classList.remove('hidden');window.scrollTo(0,0)}
function openCaseTwo(){currentCase='case02';setSchemaAvailable(true);$('brandSubtitle').textContent='SQL MYSTERY · CASO 02';els.hub.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.intro.classList.add('hidden');els.completion.classList.add('hidden');els.case02Intro.classList.remove('hidden');window.scrollTo(0,0)}
function openTraining(){currentCase='training';setSchemaAvailable(true);$('brandSubtitle').textContent='LABORATORIO SQL · CASO 00';els.hub.classList.add('hidden');els.case02Intro.classList.add('hidden');els.trainingIntro.classList.remove('hidden');window.scrollTo(0,0)}
function goHome(){currentCase='mystery';setSchemaAvailable(false);document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());$('brandSubtitle').textContent='SQL MYSTERY · ARCHIVIO DEI CASI';document.body.classList.remove('game-active','case02-active');els.workspace.classList.add('hidden');els.completion.classList.add('hidden');els.intro.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.case02Intro.classList.add('hidden');els.hub.classList.remove('hidden');window.scrollTo(0,0);}
function renderConceptualSchema(){ $('schemaGrid').innerHTML=`
<svg viewBox="0 0 1000 510" role="img" aria-labelledby="erConceptTitle erConceptDesc" preserveAspectRatio="xMidYMid meet">
  <title id="erConceptTitle">Modello entità-relazioni concettuale del database comunale</title>
  <desc id="erConceptDesc">Cittadino partecipa a cinque associazioni distinte: usa badge, possiede, effettua come mittente, riceve come destinatario e prende in prestito. Le chiavi esterne non sono mostrate perché appartengono alla successiva traduzione relazionale.</desc>
  <g aria-hidden="true">
    <!-- ACCESSO — USA BADGE — CITTADINO -->
    <path class="er-link required" d="M255 115 H270"/><path class="er-link optional" d="M360 115 H370 V190 H380"/>
    ${erAssociation(315,115,90,54,'USA','BADGE')}
    <text class="er-cardinality er-many-label" x="364" y="178">N</text><text class="er-cardinality er-one-label" x="259" y="106">1</text>

    <!-- VEICOLO — POSSIEDE — CITTADINO -->
    <path class="er-link required" d="M255 370 H270"/><path class="er-link optional" d="M360 370 H370 V270 H380"/>
    ${erAssociation(315,370,90,54,'POSSIEDE','')}
    <text class="er-cardinality er-many-label" x="364" y="286">N</text><text class="er-cardinality er-one-label" x="259" y="360">1</text>

    <!-- CITTADINO — EFFETTUA — TELEFONATA: ruolo mittente -->
    <path class="er-link optional" d="M620 185 H638 V105 H645"/><path class="er-link required" d="M735 105 H745 V95"/>
    ${erAssociation(690,105,90,54,'EFFETTUA','MITTENTE')}
    <text class="er-cardinality er-many-label" x="625" y="178">N</text><text class="er-cardinality er-one-label" x="738" y="87">1</text>

    <!-- CITTADINO — RICEVE — TELEFONATA: ruolo destinatario -->
    <path class="er-link optional" d="M620 230 H638 V245 H645"/><path class="er-link required" d="M735 245 H745 V145"/>
    ${erAssociation(690,245,90,54,'RICEVE','DESTINATARIO')}
    <text class="er-cardinality er-many-label" x="625" y="224">N</text><text class="er-cardinality er-one-label" x="738" y="157">1</text>

    <!-- CITTADINO — PRENDE — PRESTITO -->
    <path class="er-link optional" d="M620 280 H635 V370 H645"/><path class="er-link required" d="M735 370 H745"/>
    ${erAssociation(690,370,90,54,'PRENDE','')}
    <text class="er-cardinality er-many-label" x="625" y="294">N</text><text class="er-cardinality er-one-label" x="738" y="360">1</text>
  </g>
  ${erEntity(380,155,240,150,'CITTADINO',['id  · identificatore','nome · cognome','professione','via · civico'],true)}
  ${erEntity(35,55,220,120,'ACCESSO ARCHIVIO',['id  · identificatore','data · ora_badge','varco · esito'])}
  ${erEntity(35,320,220,110,'VEICOLO',['targa · identificatore','modello · colore'])}
  ${erEntity(745,35,220,145,'TELEFONATA',['id  · identificatore','data · ora','durata_sec','cella'])}
  ${erEntity(745,320,220,120,'PRESTITO DOCUMENTO',['id  · identificatore','codice_fascicolo','data_prestito · restituzione'])}
  <text class="er-independent" x="325" y="420">ENTITÀ INDIPENDENTI DAL CITTADINO</text>
  ${erEntity(325,432,165,68,'EVENTO',['data · ora · tipo'])}
  ${erEntity(510,432,190,68,'TELECAMERA',['data · ora · targa'])}
</svg>`; }

function erAssociation(cx,cy,w,h,line1,line2){
  const points=`${cx} ${cy-h/2},${cx+w/2} ${cy},${cx} ${cy+h/2},${cx-w/2} ${cy}`;
  return `<g><polygon class="er-association" points="${points}"/><text class="er-association-title" text-anchor="middle" x="${cx}" y="${cy+(line2?-3:3)}">${line1}</text>${line2?`<text class="er-association-role" text-anchor="middle" x="${cx}" y="${cy+10}">${line2}</text>`:''}</g>`;
}

function erEntity(x,y,w,h,title,fields,main=false){
  const rows=fields.map((field,i)=>`<text class="er-field${i===0?' er-identifier':''}" x="${x+14}" y="${y+57+i*21}">${field}</text>`).join('');
  return `<g><rect class="${main?'er-card-main':'er-card'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><path class="er-header" d="M${x+4} ${y+4}h${w-8}v32h-${w-8}z"/><text class="er-title" x="${x+14}" y="${y+26}">${title}</text>${rows}</g>`;
}

function renderRelationalSchema(){ $('schemaGrid').innerHTML=`
<svg viewBox="0 0 1000 590" role="img" aria-labelledby="erTitle erDesc" preserveAspectRatio="xMidYMid meet">
  <title id="erTitle">Schema relazionale SQL del database comunale</title><desc id="erDesc">La vista mostra le tabelle, le chiavi primarie e le chiavi esterne. Telefonate contiene due chiavi esterne distinte verso cittadini punto id: mittente id rappresenta chi effettua la chiamata e destinatario id chi la riceve.</desc>
  <defs>
    <marker id="crowFoot" markerWidth="18" markerHeight="18" refX="1" refY="9" orient="auto" markerUnits="userSpaceOnUse">
      <path class="er-crow-foot" d="M1 9 L17 1 M1 9 L17 9 M1 9 L17 17"/>
    </marker>
  </defs>
  <g aria-hidden="true">
    <!-- cittadini.id → accessi_archivio.cittadino_id -->
    <path class="er-link optional" d="M390 112 H356"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M274 112 H246"/>
    ${erRelationTag(315,112,82,'USA BADGE')}
    <circle class="er-fk-anchor" cx="230" cy="112" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="377" y="105">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="258" y="105">N</text>

    <!-- cittadini.id → veicoli.cittadino_id -->
    <path class="er-link optional" d="M390 312 H356"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M274 312 H246"/>
    ${erRelationTag(315,312,82,'POSSIEDE')}
    <circle class="er-fk-anchor" cx="230" cy="312" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="377" y="305">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="258" y="305">N</text>

    <!-- cittadini.id → telefonate.mittente_id -->
    <path class="er-link optional" d="M610 95 H655"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M745 95 H774"/>
    ${erRelationTag(700,95,90,'MITTENTE')}
    <circle class="er-fk-anchor er-fk-sender" cx="790" cy="95" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="623" y="88">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="758" y="88">N</text>

    <!-- cittadini.id → telefonate.destinatario_id -->
    <path class="er-link optional" d="M610 145 H650"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M750 145 H774"/>
    ${erRelationTag(700,145,100,'DESTINATARIO')}
    <circle class="er-fk-anchor er-fk-recipient" cx="790" cy="145" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="623" y="138">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="758" y="138">N</text>

    <!-- cittadini.id → prestiti_documenti.cittadino_id -->
    <path class="er-link optional" d="M610 312 H665"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M735 312 H774"/>
    ${erRelationTag(700,312,70,'PRENDE')}
    <circle class="er-fk-anchor" cx="790" cy="312" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="623" y="305">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="758" y="305">N</text>

    <circle class="er-pk-anchor" cx="390" cy="112" r="3"/><circle class="er-pk-anchor" cx="390" cy="312" r="3"/>
    <circle class="er-pk-anchor" cx="610" cy="95" r="3"/><circle class="er-pk-anchor" cx="610" cy="145" r="3"/><circle class="er-pk-anchor" cx="610" cy="312" r="3"/>
  </g>
  ${erCard(390,80,220,260,'cittadini',['id  INTEGER  PK','nome  TEXT','cognome  TEXT','professione  TEXT','via  TEXT','civico  INTEGER'],true)}
  ${erCard(10,35,220,165,'accessi_archivio',['id  INTEGER  PK','cittadino_id  INTEGER  FK','data  TEXT','ora_badge  TEXT','varco  TEXT','esito  TEXT'],false,19)}
  ${erCard(10,235,220,135,'veicoli',['targa  TEXT  PK','cittadino_id  INTEGER  FK','modello  TEXT','colore  TEXT'])}
  ${erCard(790,10,200,220,'telefonate',['id  INTEGER  PK','mittente_id  INTEGER  FK','destinatario_id  INTEGER  FK','data  TEXT','ora  TEXT','durata_sec  INTEGER','cella  TEXT'],false,23)}
  ${erCard(790,235,200,155,'prestiti_documenti',['id  INTEGER  PK','cittadino_id  INTEGER  FK','codice_fascicolo  TEXT','data_prestito  TEXT','data_restituzione  TEXT'],false,21)}
  <path class="er-section-divider" d="M10 397 H365 M635 397 H990"/>
  <text class="er-independent" text-anchor="middle" x="500" y="400">FONTI DI PROVA INDIPENDENTI</text>
  ${erCard(390,410,230,170,'eventi',['id  INTEGER  PK','data  TEXT','ora  TEXT','tipo  TEXT','luogo  TEXT','descrizione  TEXT'],false,19)}
  ${erCard(650,410,320,170,'telecamere',['id  INTEGER  PK','data  TEXT','ora  TEXT','luogo  TEXT','targa  TEXT','direzione  TEXT'],false,19)}
</svg>`; }

function erCard(x,y,w,h,title,fields,main=false,rowGap=22){
  const rows=fields.map((field,i)=>{const cls=field.includes(' PK')?'er-field er-pk':field.includes(' FK')?'er-field er-fk':'er-field';return `<text class="${cls}" x="${x+14}" y="${y+55+i*rowGap}">${field}</text>`}).join('');
  return `<g><rect class="${main?'er-card-main':'er-card'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><path class="er-header" d="M${x+4} ${y+4}h${w-8}v32h-${w-8}z"/><text class="er-title" x="${x+14}" y="${y+26}">${title}</text>${rows}</g>`;
}

function erRelationTag(cx,cy,w,label){
  return `<g class="er-relation-tag"><rect x="${cx-w/2}" y="${cy-10}" width="${w}" height="20" rx="10"/><text text-anchor="middle" x="${cx}" y="${cy+3}">${label}</text></g>`;
}

function renderTrainingSchema(){$('schemaGrid').innerHTML=`
<svg viewBox="0 0 1000 420" role="img" aria-labelledby="labSchemaTitle labSchemaDesc" preserveAspectRatio="xMidYMid meet">
  <title id="labSchemaTitle">Schema del database del Caso 00</title><desc id="labSchemaDesc">Ogni consultazione riguarda un solo fascicolo. Più consultazioni possono riferirsi allo stesso fascicolo tramite la chiave esterna fascicolo_codice.</desc>
  <defs><marker id="labCrowFoot" markerWidth="18" markerHeight="18" refX="1" refY="9" orient="auto" markerUnits="userSpaceOnUse"><path class="er-crow-foot" d="M1 9 L17 1 M1 9 L17 9 M1 9 L17 17"/></marker></defs>
  <g aria-hidden="true"><path class="er-link required" d="M460 215 H485"/><path class="er-link optional" marker-end="url(#labCrowFoot)" d="M595 215 H602"/>${erRelationTag(540,215,110,'RIGUARDA')}<text class="er-cardinality er-one-label" text-anchor="middle" x="471" y="204">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="600" y="198">N</text></g>
  ${erCard(120,105,340,220,'fascicoli',['codice  TEXT  PK','titolo  TEXT  NOT NULL','settore  TEXT  NOT NULL','stato  TEXT  NOT NULL','scaffale  TEXT'],true,27)}
  ${erCard(620,105,300,220,'consultazioni',['id  INTEGER  PK','fascicolo_codice  TEXT  FK','operatore  TEXT  NOT NULL','data  TEXT  NOT NULL'],false,31)}
  <text class="er-independent" text-anchor="middle" x="500" y="375">OGNI CONSULTAZIONE RIGUARDA UN SOLO FASCICOLO</text>
</svg>`}

function renderCase02Schema(){$('schemaGrid').innerHTML=`
<svg viewBox="0 0 1000 625" role="img" aria-labelledby="case02SchemaTitle case02SchemaDesc" preserveAspectRatio="xMidYMid meet">
  <title id="case02SchemaTitle">Schema del database del Caso 02</title><desc id="case02SchemaDesc">Persone è collegata ai plichi come destinatario, ai movimenti come operatore, ai turni e alle chiamate. Plichi è collegata ai movimenti e alle scansioni.</desc>
  <defs><marker id="case02CrowFoot" markerWidth="18" markerHeight="18" refX="1" refY="9" orient="auto" markerUnits="userSpaceOnUse"><path class="er-crow-foot" d="M1 9 L17 1 M1 9 L17 9 M1 9 L17 17"/></marker></defs>
  <g aria-hidden="true">
    <!-- persone.id → chiamate.mittente_id -->
    <path class="er-link required" d="M270 198 H300 V62 H470"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M560 62 H724"/>
    ${erRelationTag(515,62,90,'MITTENTE')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="286" y="191">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="708" y="54">N</text>

    <!-- persone.id → chiamate.destinatario_id -->
    <path class="er-link required" d="M270 232 H320 V108 H460"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M570 108 H724"/>
    ${erRelationTag(515,108,110,'DESTINATARIO')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="286" y="225">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="708" y="100">N</text>

    <!-- persone.id → plichi.destinatario_id -->
    <path class="er-link required" d="M270 270 H285"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M365 270 H374"/>
    ${erRelationTag(325,270,80,'RICEVE')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="279" y="259">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="374" y="259">N</text>

    <!-- persone.id → movimenti.operatore_id -->
    <!-- Breve interruzione sotto plichi per distinguere l'incrocio con scansioni. -->
    <path class="er-link required" d="M270 310 H300 V365 H503 M517 365 H545"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M635 365 H690 V328 H724"/>
    ${erRelationTag(590,365,90,'REGISTRA')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="286" y="303">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="708" y="320">N</text>

    <!-- plichi.id → movimenti.plico_id -->
    <path class="er-link required" d="M630 260 H650"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M716 260 H724"/>
    ${erRelationTag(683,260,66,'TRACCIA')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="642" y="252">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="724" y="252">N</text>

    <!-- persone.id → turni.persona_id -->
    <path class="er-link required" d="M145 340 V390"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M145 410 V434"/>
    ${erRelationTag(145,400,64,'SVOLGE')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="158" y="353">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="163" y="434">N</text>

    <!-- plichi.id → scansioni.plico_id -->
    <path class="er-link required" d="M510 340 V390"/><path class="er-link optional" marker-end="url(#case02CrowFoot)" d="M510 410 V434"/>
    ${erRelationTag(510,400,96,'È PESATO')}
    <text class="er-cardinality er-one-label" text-anchor="middle" x="523" y="353">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="528" y="434">N</text>
  </g>
  ${erCard(740,10,240,166,'chiamate',['id  INTEGER  PK','mittente_id  INTEGER  FK','destinatario_id  INTEGER  FK','data  TEXT','ora  TEXT','durata_sec  INTEGER','cella  TEXT'],false,16)}
  ${erCard(20,180,250,160,'persone',['id  INTEGER  PK','nome  TEXT','cognome  TEXT','ruolo  TEXT'])}
  ${erCard(390,180,240,160,'plichi',['id  INTEGER  PK','protocollo  TEXT  UNIQUE','oggetto  TEXT','destinatario_id  INTEGER  FK','priorita  TEXT'],true,20)}
  ${erCard(740,206,240,175,'movimenti',['id  INTEGER  PK','plico_id  INTEGER  FK','data  TEXT','ora  TEXT','luogo  TEXT','stato  TEXT','operatore_id  INTEGER  FK'],false,17)}
  ${erCard(20,450,250,165,'turni',['id  INTEGER  PK','persona_id  INTEGER  FK','data  TEXT','inizio  TEXT','fine  TEXT','sede  TEXT'],false,19)}
  ${erCard(390,450,240,165,'scansioni',['id  INTEGER  PK','plico_id  INTEGER  FK','data  TEXT','ora  TEXT','varco  TEXT','peso_grammi  INTEGER'],false,19)}
</svg>`}

const sqlManualCategories=[['all','Tutti'],['struttura','Struttura'],['vincoli','Vincoli'],['dati','Dati'],['ricerca','Ricerca'],['relazioni','Relazioni'],['calcoli','Calcoli'],['avanzati','Avanzati']];
const sqlManualCommands=[
  {c:'struttura',n:'CREATE TABLE',d:'Crea una nuova tabella definendo colonne e tipi di dato.',s:'CREATE TABLE tabella (\n  id INTEGER PRIMARY KEY,\n  nome TEXT NOT NULL\n);'},
  {c:'struttura',n:'ALTER TABLE',d:'Modifica la struttura di una tabella esistente, per esempio aggiungendo una colonna.',s:'ALTER TABLE fascicoli\nADD COLUMN scaffale TEXT;'},
  {c:'struttura',n:'DROP TABLE',d:'Elimina definitivamente una tabella e tutti i dati che contiene.',s:'DROP TABLE IF EXISTS bozze;'},
  {c:'struttura',n:'Tipi di dato',d:'Descrivono il contenuto delle colonne. In SQLite i principali sono INTEGER, REAL, TEXT, BLOB e NULL.',s:'prezzo REAL,\ndata TEXT,\ndocumento BLOB'},
  {c:'vincoli',n:'PRIMARY KEY',d:'Identifica in modo univoco ogni riga. Non può contenere duplicati.',s:'codice TEXT PRIMARY KEY'},
  {c:'vincoli',n:'FOREIGN KEY',d:'Collega una colonna alla chiave primaria di un’altra tabella.',s:'FOREIGN KEY (cittadino_id)\nREFERENCES cittadini(id)'},
  {c:'vincoli',n:'NOT NULL',d:'Rende obbligatorio il valore di una colonna.',s:'cognome TEXT NOT NULL'},
  {c:'vincoli',n:'UNIQUE',d:'Impedisce che due righe abbiano lo stesso valore nella colonna.',s:'email TEXT UNIQUE'},
  {c:'vincoli',n:'CHECK e DEFAULT',d:'CHECK impone una regola; DEFAULT assegna un valore quando non viene specificato.',s:"stato TEXT DEFAULT 'aperto'\nCHECK (stato IN ('aperto','chiuso'))"},
  {c:'dati',n:'INSERT INTO',d:'Inserisce una o più nuove righe in una tabella.',s:"INSERT INTO fascicoli (codice, titolo, settore, stato)\nVALUES ('F-204', 'Fondo riservato', 'Storico', 'disponibile');"},
  {c:'dati',n:'UPDATE',d:'Modifica le righe che rispettano la condizione WHERE.',s:"UPDATE fascicoli\nSET stato = 'riservato'\nWHERE codice = 'F-204';"},
  {c:'dati',n:'DELETE FROM',d:'Elimina le righe selezionate da WHERE. Senza WHERE elimina tutte le righe.',s:"DELETE FROM fascicoli\nWHERE codice = 'TMP-999';"},
  {c:'ricerca',n:'SELECT e FROM',d:'Sceglie le colonne da mostrare e la tabella da interrogare.',s:'SELECT codice, titolo\nFROM fascicoli;'},
  {c:'ricerca',n:'DISTINCT',d:'Rimuove i valori duplicati dal risultato.',s:'SELECT DISTINCT settore\nFROM fascicoli;'},
  {c:'ricerca',n:'WHERE',d:'Filtra le righe usando confronti come =, <>, >, <, >= e <=.',s:"SELECT * FROM eventi\nWHERE ora >= '22:00';"},
  {c:'ricerca',n:'AND, OR, NOT',d:'Combinano o negano più condizioni. Le parentesi rendono esplicito l’ordine.',s:"SELECT * FROM eventi\nWHERE data = '2026-10-31'\n  AND (tipo = 'allarme' OR tipo = 'accesso');"},
  {c:'ricerca',n:'LIKE',d:'Cerca un modello di testo. % corrisponde a zero o più caratteri, _ a un solo carattere.',s:"SELECT nome, cognome FROM cittadini\nWHERE cognome LIKE 'Riv%';"},
  {c:'ricerca',n:'IN e BETWEEN',d:'IN confronta con un elenco; BETWEEN controlla un intervallo inclusivo.',s:"SELECT * FROM eventi\nWHERE tipo IN ('allarme', 'accesso')\n  AND ora BETWEEN '21:00' AND '23:00';"},
  {c:'ricerca',n:'IS NULL',d:'Verifica l’assenza di un valore. NULL non si confronta con =.',s:'SELECT * FROM prestiti_documenti\nWHERE data_restituzione IS NULL;'},
  {c:'ricerca',n:'ORDER BY e LIMIT',d:'Ordina il risultato e limita il numero di righe restituite.',s:'SELECT * FROM eventi\nORDER BY ora DESC\nLIMIT 5;'},
  {c:'relazioni',n:'INNER JOIN',d:'Restituisce soltanto le righe che hanno una corrispondenza in entrambe le tabelle.',s:'SELECT c.nome, a.ora_badge\nFROM accessi_archivio a\nJOIN cittadini c ON c.id = a.cittadino_id;'},
  {c:'relazioni',n:'LEFT JOIN',d:'Mantiene tutte le righe della tabella a sinistra, anche quando manca una corrispondenza.',s:'SELECT c.nome, v.targa\nFROM cittadini c\nLEFT JOIN veicoli v ON v.cittadino_id = c.id;'},
  {c:'relazioni',n:'JOIN su più tabelle',d:'Aggiungi una clausola JOIN con la sua condizione ON per ogni tabella da collegare. Nel Caso 02, movimenti collega ogni plico alla persona che ha registrato il passaggio.',s:'SELECT p.protocollo, m.ora, m.stato, o.nome, o.cognome\nFROM plichi AS p\nJOIN movimenti AS m ON m.plico_id = p.id\nJOIN persone AS o ON o.id = m.operatore_id\nORDER BY p.protocollo, m.data, m.ora;'},
  {c:'calcoli',n:'Funzioni aggregate',d:'COUNT, SUM, AVG, MIN e MAX calcolano un valore su più righe.',s:'SELECT COUNT(*) AS accessi,\n       MIN(ora_badge) AS primo_accesso\nFROM accessi_archivio;'},
  {c:'calcoli',n:'GROUP BY',d:'Raggruppa le righe prima di applicare una funzione aggregata.',s:'SELECT cittadino_id, COUNT(*) AS totale\nFROM accessi_archivio\nGROUP BY cittadino_id;'},
  {c:'calcoli',n:'HAVING',d:'Filtra i gruppi prodotti da GROUP BY; WHERE filtra invece le singole righe.',s:'SELECT cittadino_id, COUNT(*) AS totale\nFROM accessi_archivio\nGROUP BY cittadino_id\nHAVING COUNT(*) > 1;'},
  {c:'avanzati',n:'Sottoquery',d:'Usa il risultato di una SELECT all’interno di un’altra istruzione.',s:'SELECT nome, cognome\nFROM cittadini\nWHERE id IN (\n  SELECT cittadino_id FROM accessi_archivio\n);'},
  {c:'avanzati',n:'UNION',d:'Unisce i risultati compatibili di due SELECT. UNION ALL conserva i duplicati.',s:'SELECT mittente_id AS cittadino_id FROM telefonate\nUNION\nSELECT destinatario_id FROM telefonate;'},
  {c:'avanzati',n:'CREATE VIEW',d:'Salva una query con un nome e la rende consultabile come una tabella virtuale.',s:'CREATE VIEW accessi_serali AS\nSELECT * FROM accessi_archivio\nWHERE ora_badge >= \'21:00\';'},
  {c:'avanzati',n:'CREATE INDEX',d:'Crea una struttura che accelera le ricerche frequenti su una o più colonne.',s:'CREATE INDEX idx_accessi_data\nON accessi_archivio(data);'},
  {
    c:'avanzati',
    n:'Transazioni',
    d:'BEGIN apre la transazione. UPDATE cambia lo stato del fascicolo. COMMIT conferma le modifiche. ROLLBACK annulla le modifiche della transazione ancora aperta.',
    s:[
      '-- Esempio 1: conferma la modifica',
      'BEGIN;',
      'UPDATE fascicoli',
      "SET stato = 'riservato' WHERE codice = 'F-204';",
      'COMMIT;',
      '',
      '-- Esempio 2: prova una modifica e annullala',
      'BEGIN;',
      'UPDATE fascicoli',
      "SET stato = 'disponibile' WHERE codice = 'F-204';",
      'ROLLBACK;'
    ].join('\n')
  }
];
const caseLibrary = $('caseLibrary');
const previousCases = $('previousCasesBtn');
const nextCases = $('nextCasesBtn');

function updateCaseScrollControls() {
  const end = caseLibrary.scrollWidth - caseLibrary.clientWidth;
  previousCases.setAttribute('aria-disabled', caseLibrary.scrollLeft <= 1);
  nextCases.setAttribute('aria-disabled', caseLibrary.scrollLeft >= end - 1);
}

function scrollCases(button, direction) {
  if (button.getAttribute('aria-disabled') === 'true') return;
  const step = caseLibrary.children[1].offsetLeft - caseLibrary.children[0].offsetLeft;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  caseLibrary.scrollBy({left: direction * step, behavior: reducedMotion ? 'instant' : 'smooth'});
}

previousCases.onclick = () => scrollCases(previousCases, -1);
nextCases.onclick = () => scrollCases(nextCases, 1);
caseLibrary.addEventListener('scroll', updateCaseScrollControls, {passive:true});
new ResizeObserver(updateCaseScrollControls).observe(caseLibrary);

let manualCategory='all';
function renderSqlManual(){
  const term=$('manualSearch').value.trim().toLocaleLowerCase('it');
  const items=sqlManualCommands.filter(item=>(manualCategory==='all'||item.c===manualCategory)&&(!term||`${item.n} ${item.d} ${item.s}`.toLocaleLowerCase('it').includes(term)));
  $('manualCount').textContent=`${items.length} ${items.length===1?'comando':'comandi'}`;
  $('manualGrid').innerHTML=items.map(item=>`<details class="manual-card"><summary><span><small>${sqlManualCategories.find(category=>category[0]===item.c)[1]}</small><strong>${item.n}</strong></span><i aria-hidden="true">+</i></summary><p>${item.d}</p><pre><code>${item.s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</code></pre></details>`).join('');
  $('manualEmpty').classList.toggle('hidden',items.length>0);
}
function openSqlManual(){manualCategory='all';$('manualSearch').value='';$('manualFilters').innerHTML=sqlManualCategories.map(([value,label])=>`<button type="button" data-manual-category="${value}" class="${value==='all'?'active':''}">${label}</button>`).join('');renderSqlManual();$('manualDialog').showModal();setTimeout(()=>$('manualSearch').focus(),0)}

$('startTrainingBtn').onclick=openTraining;$('beginTrainingBtn').onclick=()=>startGame('training',true);$('openCaseOneBtn').onclick=openCaseOne;$('startBtn').onclick=()=>startGame('mystery',true);$('openCaseTwoBtn').onclick=openCaseTwo;$('startCaseTwoBtn').onclick=()=>startGame('case02',true);$('replayBtn').onclick=()=>currentCase==='training'?openCaseOne():goHome();$('runBtn').onclick=()=>{if(solvedCurrent){if(currentCase!=='training'&&!collectedClues[step]){setNotebookOpen(true);setFeedback('Salva prima l’indizio nel taccuino; poi potrai continuare.','success');return}if(step===activeMissions.length-1)finish();else{step++;renderMission();window.scrollTo(0,0)}}else runQuery()};$('runBtn').disabled=true;
document.querySelector('.brand').onclick=e=>{e.preventDefault();goHome()};
$('resetQueryBtn').onclick=()=>{els.editor.value=activeMissions[step].starter;els.editor.focus()};
$('hintBtn').onclick=()=>setHintsOpen($('hintBox').classList.contains('hidden'));
$('hintCloseBtn').onclick=()=>setHintsOpen(false);
$('hintPrevBtn').onclick=()=>{hintLevel--;renderHint()};
$('hintNextBtn').onclick=()=>{hintLevel++;renderHint()};
$('clueInput').addEventListener('input',()=>{const training=currentCase==='training',valid=$('clueInput').value.trim().length>0;$('continueBtn').disabled=!valid;$('clueInputHelp').textContent=valid?(training?'Annotazione pronta per il diario.':'Pronto per essere aggiunto al taccuino.'):(training?'Scrivi liberamente cosa hai fatto.':'Scrivi liberamente: basta anche un solo carattere.');$('clueInputHelp').className=valid?'':'input-error'});
$('notebookBtn').onclick=()=>setNotebookOpen($('notebookDrawer').classList.contains('hidden'));
$('notebookCloseBtn').onclick=()=>setNotebookOpen(false);
document.addEventListener('keydown',event=>{if(event.key==='Escape'){setNotebookOpen(false);setHintsOpen(false);setAudioPanel(false)}});
$('trainingContinueBtn').onclick=()=>{if(currentCase!=='training'||!solvedCurrent)return;if($('trainingSuccessDialog').open)$('trainingSuccessDialog').close();if(step===activeMissions.length-1){finish()}else{step++;renderMission();window.scrollTo(0,0)}};
$('trainingSuccessDialog').addEventListener('cancel',event=>event.preventDefault());
$('continueBtn').onclick=()=>{if(!solvedCurrent)return;const note=$('clueInput').value.trim();if(!note){$('clueInputHelp').textContent='Scrivi liberamente: basta anche un solo carattere.';$('clueInputHelp').className='input-error';return}if(!collectedClues[step])collectedClues.push(note);renderNotebook();$('clueInput').value='';$('clueInputHelp').textContent='Indizio salvato. Ora puoi continuare.';$('clueInputHelp').className='';$('continueBtn').disabled=true;$('runBtn').disabled=false;$('runBtn').querySelector('.run-label').textContent=step===activeMissions.length-1?'Concludi':'Continua';$('runBtn').querySelector('.run-step').innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5 5.5-5 5.5"/></svg>';$('runBtn').querySelector('.run-step').classList.add('advance');setFeedback(step===activeMissions.length-1?'Indizio salvato. Premi «Concludi» per chiudere il caso.':'Indizio salvato nel taccuino. Premi «Continua» per passare al prossimo.','success')};
$('schemaBtn').onclick=()=>{const training=currentCase==='training',case02=currentCase==='case02';$('schemaDialog').classList.toggle('training-schema',training);$('schemaEyebrow').textContent=training?'CASO 00 · LABORATORIO SQL':case02?'CASO 02 · PROTOCOLLO P‑27':'CASO 01 · DATABASE COMUNALE';$('schemaTitle').textContent='Schema del database';$('schemaNote').innerHTML=training?'Ogni <strong>consultazione</strong> riguarda un solo <strong>fascicolo</strong>; più consultazioni possono riferirsi allo stesso fascicolo tramite <strong>consultazioni.fascicolo_codice</strong>.':case02?'I riferimenti mostrati sono obbligatori (NOT NULL). Lo schema SQLite non dichiara vincoli FOREIGN KEY.':'I riferimenti a cittadini ammettono NULL. Lo schema SQLite non dichiara vincoli FOREIGN KEY.';$('schemaDialog').showModal();training?renderTrainingSchema():case02?renderCase02Schema():renderRelationalSchema()};$('closeSchemaBtn').onclick=()=>$('schemaDialog').close();
$('manualBtn').onclick=openSqlManual;$('closeManualBtn').onclick=()=>$('manualDialog').close();$('manualSearch').addEventListener('input',renderSqlManual);$('manualFilters').addEventListener('click',event=>{const button=event.target.closest('[data-manual-category]');if(!button)return;manualCategory=button.dataset.manualCategory;$('manualFilters').querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));renderSqlManual()});
$('helpBtn').onclick=()=>{configureHelp(currentCase);$('helpDialog').showModal()};$('closeHelpBtn').onclick=()=>$('helpDialog').close();$('beginBtn').onclick=()=>{$('helpDialog').close();els.editor.focus()};
$('soundBtn').onclick=()=>setAudioPanel($('audioPanel').classList.contains('hidden'));
$('musicVolume').addEventListener('input',event=>{audio.muted=false;audio.musicVolume=Number(event.target.value)/100;applyMusicVolume();ensureAudio();persistAudio();syncAudioControls()});
$('effectsVolume').addEventListener('input',event=>{audio.muted=false;audio.effectsVolume=Number(event.target.value)/100;ensureAudio();setGain(audio.fxGain,effectiveEffectsVolume(),.03);applyMusicVolume();persistAudio();syncAudioControls()});
$('muteAllBtn').onclick=toggleMuteAll;
document.addEventListener('pointerdown',ensureAudio,{once:true,capture:true});
document.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&!button.disabled&&button.id!=='runBtn'&&button.id!=='soundBtn')beep(420,.025,.018);if(!event.target.closest('.audio-control'))setAudioPanel(false)});
syncAudioControls();
els.editor.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();$('runBtn').click()}if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;e.target.value=e.target.value.slice(0,s)+'  '+e.target.value.slice(e.target.selectionEnd);e.target.selectionStart=e.target.selectionEnd=s+2}});
renderRelationalSchema();initDb().catch(err=>{$('dbStatus').className='footer-status db-status error';$('dbStatus').innerHTML='<i></i><span>DATABASE NON DISPONIBILE</span>';$('startBtn').innerHTML='Errore caricamento <span>!</span>';setFeedback('Impossibile avviare SQLite: '+err.message,'error')});

// Home returns to the shared hub when present; standalone copies keep their own home.
(() => {
  const home = document.querySelector('[data-games-home]');
  if (!home || location.protocol === 'file:') return;
  const hub = new URL('../index.html', location.href);
  fetch(hub, {cache: 'no-store'})
    .then(response => response.ok ? response.text() : '')
    .then(html => {
      if (html.includes('<meta name="games-hub" content="informatica-in-gioco">')) {
        home.href = hub.href;
      }
    }).catch(() => {});
})();
