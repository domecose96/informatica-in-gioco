/* Archivio Ombra — original educational prototype */
const missions = [
  { skill:'SELECT · WHERE', title:'Ricostruisci l’allarme', text:'Il sistema di sicurezza ha registrato molti eventi nella notte del 31 ottobre. Isola l’allarme scattato all’Archivio Civico.', objective:'Trova l’evento di tipo “allarme” del 31 ottobre 2026.', tables:['eventi'], starter:"SELECT *\nFROM eventi\nWHERE data = '2026-10-31';", hints:["Aggiungi una seconda condizione con AND.","Filtra la colonna tipo usando il valore 'allarme'.","SELECT * FROM eventi\nWHERE data = '2026-10-31' AND tipo = 'allarme';"], validate: rows => has(rows,'id',4) || includes(rows,'descrizione','F-204') },
  { skill:'JOIN · ORDER BY', title:'Chi era nell’archivio?', text:'L’allarme è scattato alle 22:14. Incrocia gli accessi del varco con l’anagrafe e scopri chi ha usato il badge poco prima.', objective:'Mostra nome, cognome e ora dei badge accettati dopo le 21:45.', tables:['accessi_archivio','cittadini'], starter:"SELECT c.nome, c.cognome, a.ora_badge\nFROM accessi_archivio a\nJOIN cittadini c ON c.id = a.cittadino_id\nWHERE a.data = '2026-10-31';", hints:["Filtra esito = 'accettato' e un orario maggiore di '21:45'.","Ordina per ora_badge per ricostruire la sequenza.","SELECT c.nome, c.cognome, a.ora_badge\nFROM accessi_archivio a\nJOIN cittadini c ON c.id = a.cittadino_id\nWHERE a.data='2026-10-31' AND a.esito='accettato'\nAND a.ora_badge > '21:45'\nORDER BY a.ora_badge;"], validate: rows => includes(rows,null,'Marco') && includes(rows,null,'Sara') },
  { skill:'WHERE · ORDER BY', title:'Segui l’auto in fuga', text:'Una telecamera su Via del Portico ha ripreso un veicolo pochi minuti dopo l’allarme. Cerca i passaggi diretti verso la tangenziale.', objective:'Trova la targa ripresa dopo le 22:14 in direzione “tangenziale”.', tables:['telecamere'], starter:"SELECT ora, targa, direzione\nFROM telecamere\nWHERE data = '2026-10-31';", hints:["Confronta la colonna ora con '22:14'.","Aggiungi direzione = 'tangenziale'.","SELECT ora, targa, direzione FROM telecamere\nWHERE data='2026-10-31' AND ora > '22:14'\nAND direzione='tangenziale' ORDER BY ora;"], validate: rows => includes(rows,null,'TO-314-XR') },
  { skill:'JOIN', title:'Identifica il proprietario', text:'La targa TO-314-XR è la prima traccia concreta. Collegala al registro dei veicoli e poi all’anagrafe comunale.', objective:'Trova nome, cognome e professione del proprietario della targa.', tables:['veicoli','cittadini'], starter:"SELECT c.nome, c.cognome, c.professione\nFROM veicoli v\nJOIN cittadini c ON c.id = v.cittadino_id\nWHERE v.targa = 'TO-314-XR';", hints:["La relazione è veicoli.cittadino_id = cittadini.id.","La query iniziale è già completa: eseguila.","SELECT c.nome, c.cognome, c.professione FROM veicoli v JOIN cittadini c ON c.id=v.cittadino_id WHERE v.targa='TO-314-XR';"], validate: rows => includes(rows,null,'Marco') && includes(rows,null,'Riva') },
  { skill:'NULL · JOIN', title:'Il prestito mai chiuso', text:'Essere proprietario dell’auto non basta. Controlla il registro dei prestiti: qualcuno aveva già richiesto proprio il fascicolo sottratto.', objective:'Trova chi ha preso F-204 e non lo ha mai restituito.', tables:['prestiti_documenti','cittadini'], starter:"SELECT c.nome, c.cognome, p.codice_fascicolo, p.data_restituzione\nFROM prestiti_documenti p\nJOIN cittadini c ON c.id = p.cittadino_id", hints:["Un valore mancante si cerca con IS NULL, non con = NULL.","Filtra codice_fascicolo = 'F-204' e data_restituzione IS NULL.","SELECT c.nome,c.cognome,p.codice_fascicolo FROM prestiti_documenti p JOIN cittadini c ON c.id=p.cittadino_id WHERE p.codice_fascicolo='F-204' AND p.data_restituzione IS NULL;"], validate: rows => includes(rows,null,'Marco') && includes(rows,null,'F-204') },
  { skill:'JOIN MULTIPLA', title:'La chiamata prima del colpo', text:'Poco prima dell’ingresso, Marco ha telefonato a qualcuno. Incrocia due volte l’anagrafe con i tabulati per identificare il destinatario.', objective:'Trova chi ha ricevuto una chiamata da Marco Riva tra le 21:30 e le 22:00.', tables:['telefonate','cittadini'], starter:"SELECT dest.nome, dest.cognome, t.ora, t.durata_sec\nFROM telefonate t\nJOIN cittadini mitt ON mitt.id = t.mittente_id\nJOIN cittadini dest ON dest.id = t.destinatario_id", hints:["Filtra mitt.nome='Marco' e mitt.cognome='Riva'.","Usa t.ora BETWEEN '21:30' AND '22:00'.","SELECT dest.nome,dest.cognome,t.ora FROM telefonate t JOIN cittadini mitt ON mitt.id=t.mittente_id JOIN cittadini dest ON dest.id=t.destinatario_id WHERE mitt.nome='Marco' AND mitt.cognome='Riva' AND t.ora BETWEEN '21:30' AND '22:00';"], validate: rows => includes(rows,null,'Laura') && includes(rows,null,'Neri') },
  { skill:'SOTTOQUERY · COUNT', title:'Verifica l’alibi', text:'Laura sostiene di non conoscere l’archivio. Ma il registro telefonico può mostrare quante volte ha contattato dipendenti dell’Archivio Civico nell’ultima settimana.', objective:'Conta le chiamate di Laura verso persone con professione “archivista”.', tables:['telefonate','cittadini'], starter:"SELECT COUNT(*) AS contatti_archivio\nFROM telefonate t\nJOIN cittadini dest ON dest.id = t.destinatario_id\nWHERE t.mittente_id = (\n  SELECT id FROM cittadini WHERE nome='Laura' AND cognome='Neri'\n);", hints:["Aggiungi un filtro sulla professione del destinatario.","Usa AND dest.professione = 'archivista'.","SELECT COUNT(*) AS contatti_archivio FROM telefonate t JOIN cittadini dest ON dest.id=t.destinatario_id WHERE t.mittente_id=(SELECT id FROM cittadini WHERE nome='Laura' AND cognome='Neri') AND dest.professione='archivista';"], validate: rows => Number(valueOf(rows,'contatti_archivio')) === 3 },
  { skill:'VERDETTO', title:'Firma il rapporto', text:'Auto, prestito e tabulati raccontano la stessa storia. Restituisci in una sola riga i nomi completi del colpevole e della complice.', objective:'Crea le colonne “colpevole” e “complice” con i due nomi completi.', tables:['cittadini'], starter:"SELECT 'Marco Riva' AS colpevole,\n       'Laura Neri' AS complice;", hints:["Puoi selezionare direttamente due stringhe e assegnare loro un alias.","Gli alias richiesti sono colpevole e complice.","SELECT 'Marco Riva' AS colpevole, 'Laura Neri' AS complice;"], validate: rows => includes(rows,'colpevole','Marco Riva') && includes(rows,'complice','Laura Neri') }
];

const schema = {
  cittadini:['id INTEGER PK','nome TEXT','cognome TEXT','professione TEXT','via TEXT','civico INTEGER'],
  eventi:['id INTEGER PK','data TEXT','ora TEXT','tipo TEXT','luogo TEXT','descrizione TEXT'],
  accessi_archivio:['id INTEGER PK','cittadino_id INTEGER FK','data TEXT','ora_badge TEXT','varco TEXT','esito TEXT'],
  telecamere:['id INTEGER PK','data TEXT','ora TEXT','luogo TEXT','targa TEXT','direzione TEXT'],
  veicoli:['targa TEXT PK','cittadino_id INTEGER FK','modello TEXT','colore TEXT'],
  prestiti_documenti:['id INTEGER PK','cittadino_id INTEGER FK','codice_fascicolo TEXT','data_prestito TEXT','data_restituzione TEXT'],
  telefonate:['id INTEGER PK','mittente_id INTEGER FK','destinatario_id INTEGER FK','data TEXT','ora TEXT','durata_sec INTEGER']
};

const seed = `
CREATE TABLE cittadini (id INTEGER PRIMARY KEY, nome TEXT, cognome TEXT, professione TEXT, via TEXT, civico INTEGER);
INSERT INTO cittadini VALUES (1,'Marco','Riva','geometra comunale','Via delle Mura',8),(2,'Sara','Conti','archivista','Via Garibaldi',21),(3,'Laura','Neri','giornalista','Piazza del Grano',4),(4,'Paolo','Serra','archivista','Via Roma',15),(5,'Elena','Bassi','farmacista','Via del Portico',17),(6,'Davide','Moretti','archivista','Corso Italia',33),(7,'Giulia','Ferri','insegnante','Via Po',6);
CREATE TABLE eventi (id INTEGER PRIMARY KEY, data TEXT, ora TEXT, tipo TEXT, luogo TEXT, descrizione TEXT);
INSERT INTO eventi VALUES (1,'2026-10-31','18:03','chiusura','Archivio Civico','Chiusura ordinaria edificio'),(2,'2026-10-31','21:51','porta','Archivio Civico','Apertura varco dipendenti'),(3,'2026-10-31','22:02','porta','Archivio Civico','Apertura ingresso laterale'),(4,'2026-10-31','22:14','allarme','Archivio Civico','Sensore sala Fondo Riservato F-204'),(5,'2026-10-31','22:31','chiamata','Centrale Polizia','Segnalazione automatica ricevuta'),(6,'2026-11-01','00:10','sopralluogo','Archivio Civico','Arrivo pattuglia');
CREATE TABLE accessi_archivio (id INTEGER PRIMARY KEY, cittadino_id INTEGER, data TEXT, ora_badge TEXT, varco TEXT, esito TEXT);
INSERT INTO accessi_archivio VALUES (1,2,'2026-10-31','18:01','principale','accettato'),(2,4,'2026-10-31','18:04','principale','accettato'),(3,1,'2026-10-31','21:51','dipendenti','accettato'),(4,2,'2026-10-31','22:02','laterale','accettato'),(5,3,'2026-10-31','22:05','principale','rifiutato'),(6,1,'2026-10-31','22:19','dipendenti','accettato');
CREATE TABLE telecamere (id INTEGER PRIMARY KEY, data TEXT, ora TEXT, luogo TEXT, targa TEXT, direzione TEXT);
INSERT INTO telecamere VALUES (1,'2026-10-31','21:42','Via del Portico','VA-882-LP','centro'),(2,'2026-10-31','22:08','Piazza Archivio','FI-091-NN','stazione'),(3,'2026-10-31','22:18','Via del Portico','TO-314-XR','tangenziale'),(4,'2026-10-31','22:21','Viale Nord','TO-314-XR','tangenziale'),(5,'2026-10-31','22:24','Via del Portico','MI-770-KA','centro');
CREATE TABLE veicoli (targa TEXT PRIMARY KEY, cittadino_id INTEGER, modello TEXT, colore TEXT);
INSERT INTO veicoli VALUES ('TO-314-XR',1,'Fiat Tipo','grigio'),('FI-091-NN',5,'Lancia Ypsilon','rosso'),('MI-770-KA',7,'Toyota Yaris','bianco'),('VA-882-LP',4,'Ford Focus','blu');
CREATE TABLE prestiti_documenti (id INTEGER PRIMARY KEY, cittadino_id INTEGER, codice_fascicolo TEXT, data_prestito TEXT, data_restituzione TEXT);
INSERT INTO prestiti_documenti VALUES (1,7,'A-117','2026-09-11','2026-09-18'),(2,1,'F-204','2026-10-12',NULL),(3,3,'G-881','2026-10-20','2026-10-27'),(4,5,'B-044','2026-10-02','2026-10-03');
CREATE TABLE telefonate (id INTEGER PRIMARY KEY, mittente_id INTEGER, destinatario_id INTEGER, data TEXT, ora TEXT, durata_sec INTEGER);
INSERT INTO telefonate VALUES (1,1,3,'2026-10-31','21:48',92),(2,3,2,'2026-10-26','11:20',145),(3,3,4,'2026-10-28','16:02',61),(4,3,6,'2026-10-30','09:14',203),(5,2,4,'2026-10-31','18:11',34),(6,5,7,'2026-10-31','20:05',180),(7,1,3,'2026-10-31','22:27',18);
`;

let db, step = 0, hintLevel = 0, queryCount = 0, soundOn = true;
const $ = id => document.getElementById(id);
const els = {intro:$('intro'),workspace:$('workspace'),completion:$('completion'),editor:$('sqlEditor'),results:$('results'),feedback:$('feedback')};

function includes(rows,key,needle){ return rows.some(r => Object.entries(r).some(([k,v]) => (!key || k===key) && String(v).toLowerCase().includes(String(needle).toLowerCase()))); }
function has(rows,key,value){ return rows.some(r => String(r[key])===String(value)); }
function valueOf(rows,key){ return rows[0]?.[key]; }
function rowsFrom(result){ if(!result.length) return []; const last=result[result.length-1]; return last.values.map(vals=>Object.fromEntries(last.columns.map((c,i)=>[c,vals[i]]))); }
function beep(freq=540,duration=.06){ if(!soundOn) return; try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration)}catch(e){} }

async function initDb(){
  const SQL = await initSqlJs({locateFile:file=>`vendor/${file}`});
  db = new SQL.Database(); db.run(seed);
  $('runBtn').disabled=false;
}

function renderMission(){
  const m=missions[step]; hintLevel=0;
  $('stepCount').textContent=`INDIZIO ${step+1} DI ${missions.length}`;$('progressPercent').textContent=`${Math.round((step+1)/missions.length*100)}%`;$('progressBar').style.width=`${(step+1)/missions.length*100}%`;
  $('missionSkill').textContent=m.skill;$('missionTitle').textContent=m.title;$('missionText').textContent=m.text;$('missionObjective').textContent=m.objective;els.editor.value=m.starter;
  $('tableChips').innerHTML=m.tables.map(t=>`<button type="button" data-table="${t}">${t}</button>`).join('');
  $('hintBox').classList.add('hidden');$('hintBox').textContent='';$('hintBtn').textContent='＋ Richiedi un suggerimento';
  els.results.innerHTML='<div class="empty-state">I risultati della query appariranno qui.</div>';$('rowCount').textContent='0 righe';setFeedback('Scrivi una query e avvia l’indagine.');
  document.querySelectorAll('[data-table]').forEach(b=>b.onclick=()=>{els.editor.value=`SELECT *\nFROM ${b.dataset.table}\nLIMIT 20;`;els.editor.focus()});
}

function setFeedback(text,type=''){ els.feedback.textContent=text;els.feedback.className=`feedback ${type}`; }
function escapeHtml(v){return String(v??'NULL').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderResults(result){
  if(!result.length){els.results.innerHTML='<div class="empty-state">Query eseguita: nessuna riga restituita.</div>';$('rowCount').textContent='0 righe';return;}
  const r=result[result.length-1]; $('rowCount').textContent=`${r.values.length} ${r.values.length===1?'riga':'righe'}`;
  els.results.innerHTML=`<table><thead><tr>${r.columns.map(c=>`<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${r.values.map(row=>`<tr>${row.map(v=>`<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function runQuery(){
  const sql=els.editor.value.trim(); if(!sql)return setFeedback('Scrivi prima una query.','error');
  if(!/^(select|with|pragma|explain)\b/i.test(sql)) return setFeedback('Per proteggere le prove, in questo caso sono consentite solo query di lettura.','error');
  try{
    const result=db.exec(sql);queryCount++;renderResults(result);const rows=rowsFrom(result);
    if(missions[step].validate(rows)){
      beep(740,.11);setFeedback(step===missions.length-1?'Rapporto corretto. Caso risolto!':'Indizio confermato. Ottimo lavoro: il fascicolo si arricchisce.','success');
      $('runBtn').disabled=true;setTimeout(()=>{ if(step===missions.length-1){finish()}else{step++;renderMission();$('runBtn').disabled=false} },1100);
    } else { beep(230,.08);setFeedback(`Query valida: ${rows.length} righe trovate, ma manca ancora la prova richiesta. Controlla l’obiettivo.`, ''); }
  }catch(err){beep(180,.12);setFeedback(`Errore SQL: ${err.message.replace('Error: ','')}`,'error')}
}

function finish(){els.workspace.classList.add('hidden');els.completion.classList.remove('hidden');$('queryStat').textContent=queryCount;window.scrollTo({top:0,behavior:'smooth'});}
function startGame(){els.intro.classList.add('hidden');els.completion.classList.add('hidden');els.workspace.classList.remove('hidden');step=0;queryCount=0;renderMission();window.scrollTo({top:0,behavior:'smooth'});}
function renderSchema(){ $('schemaGrid').innerHTML=Object.entries(schema).map(([name,cols])=>`<article class="schema-table"><h3>${name}</h3><ul>${cols.map(c=>`<li>${c.replace(' PK',' <b>PK</b>').replace(' FK',' <em>FK</em>')}</li>`).join('')}</ul></article>`).join(''); }

$('startBtn').onclick=startGame;$('replayBtn').onclick=startGame;$('runBtn').onclick=runQuery;$('runBtn').disabled=true;
$('resetQueryBtn').onclick=()=>{els.editor.value=missions[step].starter;els.editor.focus()};
$('hintBtn').onclick=()=>{const m=missions[step];const level=Math.min(hintLevel,m.hints.length-1);$('hintBox').textContent=(level===2?'SOLUZIONE POSSIBILE\n':'SUGGERIMENTO\n')+m.hints[level];$('hintBox').classList.remove('hidden');hintLevel++;$('hintBtn').textContent=hintLevel>=3?'↻ Rileggi la soluzione':'＋ Altro suggerimento';};
$('schemaBtn').onclick=()=>$('schemaDialog').showModal();$('closeSchemaBtn').onclick=()=>$('schemaDialog').close();
$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♪':'×';$('soundBtn').ariaLabel=soundOn?'Disattiva effetti sonori':'Attiva effetti sonori'};
els.editor.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();runQuery()}if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;e.target.value=e.target.value.slice(0,s)+'  '+e.target.value.slice(e.target.selectionEnd);e.target.selectionStart=e.target.selectionEnd=s+2}});
renderSchema();initDb().catch(err=>setFeedback('Impossibile avviare SQLite: '+err.message,'error'));
