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
const els = {hub:$('caseHub'),trainingIntro:$('trainingIntro'),intro:$('intro'),workspace:$('workspace'),completion:$('completion'),editor:$('sqlEditor'),results:$('results'),feedback:$('feedback'),feedbackText:$('feedbackText')};

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
function syncAudioStatus(){const musicLevel=Math.round(audio.musicVolume*100);$('audioStatus').textContent=audio.muted?'Tutto in muto':!audio.started?'Pronto':musicLevel?'In riproduzione':'Musica a zero'}
function persistAudio(){try{localStorage.setItem('ao-music-volume',String(audio.musicVolume));localStorage.setItem('ao-effects-volume',String(audio.effectsVolume));localStorage.setItem('ao-muted',String(audio.muted))}catch(e){}}
function syncAudioControls(){const storedMusic=Math.round(audio.musicVolume*100),storedEffects=Math.round(audio.effectsVolume*100),musicLevel=audio.muted?0:storedMusic,effectsLevel=audio.muted?0:storedEffects;const musicControl=$('musicVolume'),effectsControl=$('effectsVolume');musicControl.value=musicLevel;effectsControl.value=effectsLevel;musicControl.disabled=false;effectsControl.disabled=false;$('musicVolumeValue').textContent=`${musicLevel}%`;$('effectsVolumeValue').textContent=`${effectsLevel}%`;const muteButton=$('muteAllBtn'),action=audio.muted?'Riattiva tutto':'Silenzia tutto',waveCount=musicLevel===0?0:musicLevel<=20?1:musicLevel<=50?2:3;muteButton.setAttribute('aria-pressed',String(audio.muted));muteButton.setAttribute('data-waves',String(waveCount));muteButton.setAttribute('aria-label',action);muteButton.title=`${action} · musica ${musicLevel}%`;$('soundBtn').title=audio.muted?'Audio in muto':`Musica ${musicLevel}%`;syncAudioStatus()}
function toggleMuteAll(){audio.muted=!audio.muted;applyMusicVolume();setGain(audio.fxGain,effectiveEffectsVolume(),.03);persistAudio();syncAudioControls()}

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
  db.run(mode==='training'?trainingSeed:seed);
}

async function initDb(){
  SQLRuntime=await initSqlJs({locateFile:file=>`vendor/${file}`});
  resetDatabase('mystery');
  $('runBtn').disabled=false;$('startBtn').disabled=false;$('startTrainingBtn').disabled=false;$('beginTrainingBtn').disabled=false;
  $('startBtn').innerHTML='<span class="case-cta-copy"><small>CASO 01 · PRONTO</small><strong>Avvia il gioco</strong></span><span class="case-cta-seal" aria-hidden="true">01</span>';
  $('dbStatus').className='footer-status db-status ready';$('dbStatus').innerHTML='<i></i><span>DATABASE PRONTO</span>';
}

function renderMission(){
  const m=activeMissions[step]; hintLevel=0; solvedCurrent=false;
  const training=currentCase==='training';
  $('briefingLabel').innerHTML=training?'<b>01</b> LEGGI LA CONSEGNA':'<b>01</b> LEGGI QUI COSA CERCARE';
  $('queryLabel').innerHTML=training?'<b>02</b> SCRIVI IL COMANDO SQL':'<b>02</b> COMPLETA LA QUERY QUI SOTTO';
  $('queryFilename').textContent=training?'laboratorio_sql.sql':'query_indagine.sql';
  $('notebookCaseLabel').textContent=training?'CASO 00 · LABORATORIO':'CASO F–204';
  $('stepCount').textContent=`${training?'FASE':'INDIZIO'} ${step+1} DI ${activeMissions.length}`;updateProgress(step);setNotebookOpen(false);
  $('missionSkill').textContent=m.skill;$('missionTitle').textContent=m.title;$('missionText').textContent=m.text;$('missionObjective').textContent=m.objective;els.editor.value=m.starter;
  $('nextAction').textContent=training?'Scrivi il comando richiesto, eseguilo e usa il risultato per controllare il lavoro. Se ti blocchi, apri i suggerimenti progressivi.':step===0?"Esegui la query iniziale, osserva le righe ottenute e prova a restringere la ricerca fino a isolare un solo evento.":`Completa ciò che manca usando l’obiettivo e gli indizi già raccolti, poi esegui la query.`;
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
  const training=currentCase==='training';
  $('completionEyebrow').textContent=training?'CASO 00 · CONTROLLO FINALE':'CASO 01 · RISOLTO';
  if(training)$('completionTitle').innerHTML='Il registro è pronto.<br><span>Ma F‑204 non c’è.</span>';else $('completionTitle').textContent='Hai fatto parlare i dati.';
  $('completionText').innerHTML=training?'Nel database la scheda del fascicolo <strong>F‑204</strong> esiste ed è classificata come riservata. Durante la verifica fisica dell’archivio, però, il fascicolo cartaceo non si trova: <strong>qualcuno lo ha sottratto</strong>. Il Caso 01 può iniziare.':'Le prove indicano <strong>Marco Riva</strong> come autore del furto e <strong>Laura Neri</strong> come complice. Hai usato filtri, ordinamenti e JOIN per ricostruire la notte.';
  $('missionStat').textContent=activeMissions.length;$('missionStatLabel').textContent=training?'fasi SQL':'indizi';$('completionStatLabel').textContent=training?'laboratorio completato':'caso risolto';$('completionSeal').textContent='01';
  $('replayBtn').querySelector('small').textContent=training?'NUOVA INDAGINE':'CASO ARCHIVIATO';$('replayBtn').querySelector('strong').textContent=training?'Apri il Caso 01':'Torna alla home';window.scrollTo(0,0);
}
function configureHelp(mode=currentCase){
  const training=mode==='training',dialog=$('helpDialog');
  dialog.querySelector('.help-head>div').innerHTML=training
    ?'<p class="eyebrow">ISTRUZIONI DEL LABORATORIO</p><h2>Costruisci in tre mosse</h2><p>Leggi la consegna, scrivi il comando SQL e controlla ciò che hai costruito.</p>'
    :'<p class="eyebrow">BRIEFING DELL’INVESTIGATORE</p><h2>Indaga in tre mosse</h2><p>Il codice è già iniziato. A te il compito di trasformare i dati in prove.</p>';
  dialog.querySelector('.help-steps').innerHTML=training
    ?'<article><b>01</b><div><span>LEGGI</span><h3>Comprendi la consegna</h3><p>Ogni fase indica quale struttura o dato devi creare, modificare o verificare.</p></div></article><article><b>02</b><div><span>SCRIVI</span><h3>Completa il comando</h3><p>Inserisci il comando SQL e premi <strong>Esegui e verifica</strong>.</p></div></article><article><b>03</b><div><span>CONTROLLA</span><h3>Osserva il risultato</h3><p>Quando il comando è corretto, lo stesso pulsante diventa <strong>Continua</strong>.</p></div></article>'
    :'<article><b>01</b><div><span>OSSERVA</span><h3>Leggi la missione</h3><p>L’obiettivo ti dice quale informazione devi far emergere dal database.</p></div></article><article><b>02</b><div><span>INTERROGA</span><h3>Completa la query</h3><p>Modifica il codice e premi <strong>Esegui e verifica</strong>. Un tentativo errato mostra comunque risultati utili.</p></div></article><article><b>03</b><div><span>DEDUCI</span><h3>Annota la prova</h3><p>Salva la risposta nel taccuino; poi lo stesso pulsante diventa <strong>Continua</strong>.</p></div></article>';
  dialog.querySelector('.help-demo').innerHTML=training
    ?'<div class="demo-bar"><i></i><i></i><i></i><span>laboratorio_sql.sql</span></div><div class="demo-code"><span>1</span><code><em>CREATE TABLE</em> fascicoli (<br>&nbsp;&nbsp;codice TEXT <mark>PRIMARY KEY</mark><br>);</code></div><div class="demo-result"><span>VERIFICA</span><strong>Struttura creata correttamente</strong></div><div class="demo-note"><span>✓</span><div><small>AVANZAMENTO</small><p>Il pulsante diventa Continua.</p></div></div>'
    :'<div class="demo-bar"><i></i><i></i><i></i><span>prova_01.sql</span></div><div class="demo-code"><span>1</span><code><em>SELECT</em> ora, descrizione<br><em>FROM</em> eventi<br><em>WHERE</em> tipo = <mark>\'allarme\'</mark>;</code></div><div class="demo-result"><span>RISULTATO</span><strong>22:14 · Fondo Riservato F-204</strong></div><div class="demo-note"><span>✓</span><div><small>TACCUINO</small><p>L’allarme è scattato alle 22:14.</p></div></div>';
  dialog.querySelector('.help-footer>p').innerHTML=training?'<span>?</span>Se ti blocchi, usa i suggerimenti progressivi. Ogni tentativo errato viene annullato senza danneggiare il database.':'<span>?</span>Se ti blocchi, usa i suggerimenti progressivi: l’ultimo orienta il ragionamento senza mostrare la query completa.';
  $('beginBtn').querySelector('small').textContent=training?'ISTRUZIONI COMPLETATE':'BRIEFING COMPLETATO';
  $('beginBtn').querySelector('strong').textContent=training?'Inizia il laboratorio':'Entra nell’archivio';
  $('beginBtn').querySelector('.case-cta-seal').textContent=training?'00':'01';
}
function startGame(mode='mystery',showGuide=true){
  currentCase=mode;activeMissions=mode==='training'?trainingMissions:missions;activeClueTexts=mode==='training'?trainingVerificationTexts:clueTexts;resetDatabase(mode);
  $('brandSubtitle').textContent=mode==='training'?'LABORATORIO SQL · CASO 00':'SQL MYSTERY · CASO 01';
  document.body.classList.add('game-active');els.hub.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.intro.classList.add('hidden');els.completion.classList.add('hidden');els.workspace.classList.remove('hidden');step=0;queryCount=0;collectedClues=[];renderNotebook();renderMission();window.scrollTo(0,0);if(showGuide){configureHelp(mode);$('helpDialog').showModal()}
}
function openCaseOne(){currentCase='mystery';$('brandSubtitle').textContent='SQL MYSTERY · CASO 01';els.hub.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.completion.classList.add('hidden');els.intro.classList.remove('hidden');window.scrollTo(0,0)}
function openTraining(){currentCase='training';$('brandSubtitle').textContent='LABORATORIO SQL · CASO 00';els.hub.classList.add('hidden');els.trainingIntro.classList.remove('hidden');window.scrollTo(0,0)}
function goHome(){currentCase='mystery';document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());$('brandSubtitle').textContent='SQL MYSTERY · ARCHIVIO DEI CASI';document.body.classList.remove('game-active');els.workspace.classList.add('hidden');els.completion.classList.add('hidden');els.intro.classList.add('hidden');els.trainingIntro.classList.add('hidden');els.hub.classList.remove('hidden');window.scrollTo(0,0);}
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
<svg viewBox="0 0 1000 520" role="img" aria-labelledby="erTitle erDesc" preserveAspectRatio="xMidYMid meet">
  <title id="erTitle">Schema relazionale SQL del database comunale</title><desc id="erDesc">La vista mostra le tabelle, le chiavi primarie e le chiavi esterne. Telefonate contiene due chiavi esterne distinte verso cittadini punto id: mittente id rappresenta chi effettua la chiamata e destinatario id chi la riceve.</desc>
  <defs>
    <marker id="crowFoot" markerWidth="18" markerHeight="18" refX="1" refY="9" orient="auto" markerUnits="userSpaceOnUse">
      <path class="er-crow-foot" d="M1 9 L17 1 M1 9 L17 9 M1 9 L17 17"/>
    </marker>
  </defs>
  <g aria-hidden="true">
    <!-- cittadini.id → accessi_archivio.cittadino_id -->
    <path class="er-link required" d="M390 112 H356"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M274 112 H246"/>
    ${erRelationTag(315,112,82,'USA BADGE')}
    <circle class="er-fk-anchor" cx="230" cy="112" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="377" y="105">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="258" y="105">N</text>

    <!-- cittadini.id → veicoli.cittadino_id -->
    <path class="er-link required" d="M390 312 H356"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M274 312 H246"/>
    ${erRelationTag(315,312,82,'POSSIEDE')}
    <circle class="er-fk-anchor" cx="230" cy="312" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="377" y="305">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="258" y="305">N</text>

    <!-- cittadini.id → telefonate.mittente_id -->
    <path class="er-link required" d="M610 95 H655"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M745 95 H774"/>
    ${erRelationTag(700,95,90,'MITTENTE')}
    <circle class="er-fk-anchor er-fk-sender" cx="790" cy="95" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="623" y="88">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="758" y="88">N</text>

    <!-- cittadini.id → telefonate.destinatario_id -->
    <path class="er-link required" d="M610 145 H650"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M750 145 H774"/>
    ${erRelationTag(700,145,100,'DESTINATARIO')}
    <circle class="er-fk-anchor er-fk-recipient" cx="790" cy="145" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="623" y="138">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="758" y="138">N</text>

    <!-- cittadini.id → prestiti_documenti.cittadino_id -->
    <path class="er-link required" d="M610 312 H665"/><path class="er-link optional" marker-end="url(#crowFoot)" d="M735 312 H774"/>
    ${erRelationTag(700,312,70,'PRENDE')}
    <circle class="er-fk-anchor" cx="790" cy="312" r="3"/><text class="er-cardinality er-one-label" text-anchor="middle" x="623" y="305">1</text><text class="er-cardinality er-many-label" text-anchor="middle" x="758" y="305">N</text>

    <circle class="er-pk-anchor" cx="390" cy="112" r="3"/><circle class="er-pk-anchor" cx="390" cy="312" r="3"/>
    <circle class="er-pk-anchor" cx="610" cy="95" r="3"/><circle class="er-pk-anchor" cx="610" cy="145" r="3"/><circle class="er-pk-anchor" cx="610" cy="312" r="3"/>
  </g>
  ${erCard(390,80,220,260,'cittadini',['id  INTEGER  PK','nome  TEXT','cognome  TEXT','professione  TEXT','via  TEXT','civico  INTEGER'],true)}
  ${erCard(10,35,220,145,'accessi_archivio',['id  INTEGER  PK','cittadino_id  INTEGER  FK','data · ora_badge · varco','esito  TEXT'])}
  ${erCard(10,235,220,130,'veicoli',['targa  TEXT  PK','cittadino_id  INTEGER  FK','modello · colore'])}
  ${erCard(790,10,200,220,'telefonate',['id  INTEGER  PK','mittente_id  INTEGER  FK','destinatario_id  INTEGER  FK','data  TEXT','ora  TEXT','durata_sec  INTEGER','cella  TEXT'],false,30)}
  ${erCard(790,235,200,145,'prestiti_documenti',['id  INTEGER  PK','cittadino_id  INTEGER  FK','codice_fascicolo  TEXT','data_prestito · restituzione'])}
  <path class="er-section-divider" d="M10 397 H365 M635 397 H990"/>
  <text class="er-independent" text-anchor="middle" x="500" y="400">FONTI DI PROVA INDIPENDENTI</text>
  ${erCard(390,410,230,95,'eventi',['id  INTEGER  PK','data · ora · tipo · luogo'])}
  ${erCard(650,410,320,95,'telecamere',['id  INTEGER  PK','data · ora · targa · direzione'])}
</svg>`; }

function erCard(x,y,w,h,title,fields,main=false,rowGap=22){
  const rows=fields.map((field,i)=>{const cls=field.includes(' PK')?'er-field er-pk':field.includes(' FK')?'er-field er-fk':'er-field';return `<text class="${cls}" x="${x+14}" y="${y+55+i*rowGap}">${field}</text>`}).join('');
  return `<g><rect class="${main?'er-card-main':'er-card'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><path class="er-header" d="M${x+4} ${y+4}h${w-8}v32h-${w-8}z"/><text class="er-title" x="${x+14}" y="${y+26}">${title}</text>${rows}</g>`;
}

function erRelationTag(cx,cy,w,label){
  return `<g class="er-relation-tag"><rect x="${cx-w/2}" y="${cy-10}" width="${w}" height="20" rx="10"/><text text-anchor="middle" x="${cx}" y="${cy+3}">${label}</text></g>`;
}

function renderTrainingSchema(){$('schemaGrid').innerHTML=`
<svg viewBox="0 0 1000 500" role="img" aria-labelledby="labSchemaTitle labSchemaDesc" preserveAspectRatio="xMidYMid meet">
  <title id="labSchemaTitle">Schema obiettivo del laboratorio SQL</title><desc id="labSchemaDesc">La tabella fascicoli è collegata in relazione uno a molti alla tabella consultazioni tramite la chiave esterna fascicolo_codice.</desc>
  <defs><marker id="labCrowFoot" markerWidth="18" markerHeight="18" refX="1" refY="9" orient="auto" markerUnits="userSpaceOnUse"><path class="er-crow-foot" d="M1 9 L17 1 M1 9 L17 9 M1 9 L17 17"/></marker></defs>
  <g aria-hidden="true"><path class="er-link required" d="M430 235 H515"/><path class="er-link optional" marker-end="url(#labCrowFoot)" d="M650 235 H735"/>${erRelationTag(582,235,130,'È CONSULTATO')}<text class="er-cardinality er-one-label" x="448" y="224">1</text><text class="er-cardinality er-many-label" x="704" y="224">N</text></g>
  ${erCard(90,125,340,235,'fascicoli',['codice  TEXT  PK','titolo  TEXT  NOT NULL','settore  TEXT  NOT NULL','stato  TEXT  NOT NULL','scaffale  TEXT'],true,28)}
  ${erCard(735,125,250,235,'consultazioni',['id  INTEGER  PK','fascicolo_codice  TEXT  FK','operatore  TEXT NOT NULL','data  TEXT  NOT NULL'],false,31)}
  <text class="er-independent" text-anchor="middle" x="500" y="430">OBIETTIVO DEL LABORATORIO · CREAZIONE, POPOLAMENTO E MANUTENZIONE</text>
</svg>`}

$('startTrainingBtn').onclick=openTraining;$('beginTrainingBtn').onclick=()=>startGame('training',true);$('openCaseOneBtn').onclick=openCaseOne;$('startBtn').onclick=()=>startGame('mystery',true);$('replayBtn').onclick=()=>currentCase==='training'?openCaseOne():goHome();$('runBtn').onclick=()=>{if(solvedCurrent){if(currentCase!=='training'&&!collectedClues[step]){setNotebookOpen(true);setFeedback('Salva prima l’indizio nel taccuino; poi potrai continuare.','success');return}if(step===activeMissions.length-1)finish();else{step++;renderMission();window.scrollTo(0,0)}}else runQuery()};$('runBtn').disabled=true;
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
$('schemaBtn').onclick=()=>{const training=currentCase==='training';$('schemaTitle').textContent=training?'Schema obiettivo del laboratorio':'Schema del database';$('schemaNote').innerHTML=training?'La relazione collega <strong>fascicoli.codice</strong> alla chiave esterna <strong>consultazioni.fascicolo_codice</strong>.':'Ogni associazione parte da un punto distinto di <strong>cittadini</strong> e termina sulla relativa <strong>FK</strong>.';$('schemaDialog').showModal();training?renderTrainingSchema():renderRelationalSchema()};$('closeSchemaBtn').onclick=()=>$('schemaDialog').close();
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
