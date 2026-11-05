/* Archivio Ombra — original educational prototype */
const missions = [
  { skill:'SELECT · WHERE', title:'Ricostruisci l’allarme', text:'Il sistema di sicurezza ha registrato molti eventi nella notte del 31 ottobre. Isola l’allarme scattato all’Archivio Civico.', objective:'Trova l’evento di tipo “allarme” del 31 ottobre 2026.', tables:['eventi'], starter:"SELECT *\nFROM eventi\nWHERE data = '2026-10-31'", hints:["Aggiungi una seconda condizione con AND.","Filtra la colonna tipo usando il valore 'allarme'.","Dopo il filtro sulla data, collega con AND il confronto tra la colonna tipo e il valore richiesto dall’obiettivo."], validate: rows => rows.length === 1 && (has(rows,'id',4) || includes(rows,'descrizione','F-204')) },
  { skill:'JOIN · ORDER BY', title:'Chi era nell’archivio?', text:'L’allarme è scattato alle 22:14. Incrocia gli accessi del varco con l’anagrafe e scopri chi ha usato il badge poco prima.', objective:'Mostra nome, cognome e ora dei badge accettati dopo le 21:45.', tables:['accessi_archivio','cittadini'], starter:"SELECT c.nome, c.cognome, a.ora_badge\nFROM accessi_archivio a\nJOIN cittadini c ON c.id = a.cittadino_id\nWHERE a.data = '2026-10-31'", hints:["Filtra esito = 'accettato' e un orario maggiore di '21:45'.","Ordina per ora_badge per ricostruire la sequenza.","Completa il WHERE con due condizioni unite da AND, poi aggiungi ORDER BY sulla colonna dell’orario del badge."], validate: rows => rows.length === 3 && ['21:51','22:02','22:19'].every(t=>includes(rows,null,t)) },
  { skill:'WHERE · ORDER BY', title:'Segui l’auto in fuga', text:'Una telecamera su Via del Portico ha ripreso un veicolo pochi minuti dopo l’allarme. Cerca i passaggi diretti verso la tangenziale.', objective:'Trova la targa ripresa dopo le 22:14 in direzione “tangenziale”.', tables:['telecamere'], starter:"SELECT ora, targa, direzione\nFROM telecamere", hints:["Inizia costruendo un WHERE sulla data del 31 ottobre 2026.","Confronta l’ora con '22:14' e aggiungi la direzione 'tangenziale'.","Nel WHERE servono tre condizioni: data, orario successivo all’allarme e direzione. Ordina infine per ora."], validate: rows => rows.length > 0 && rows.length <= 2 && rows.every(r=>Object.values(r).some(v=>String(v)==='TO-314-XR')) },
  { skill:'JOIN', title:'Identifica il proprietario', text:'La targa TO-314-XR è la prima traccia concreta. Collegala al registro dei veicoli e poi all’anagrafe comunale.', objective:'Trova nome, cognome e professione del proprietario della targa.', tables:['veicoli','cittadini'], starter:"SELECT c.nome, c.cognome, c.professione\nFROM veicoli v\nJOIN cittadini c ON c.id = v.cittadino_id\nWHERE v.targa = '';", hints:["La relazione è veicoli.cittadino_id = cittadini.id.","Copia dal taccuino la targa trovata: TO-314-XR.","La JOIN è già pronta: completa soltanto il valore vuoto nel filtro sulla targa usando l’indizio annotato."], validate: rows => rows.length === 1 && includes(rows,null,'Marco') && includes(rows,null,'Riva') && includes(rows,null,'geometra comunale') },
  { skill:'NULL · JOIN', title:'Il prestito mai chiuso', text:'Essere proprietario dell’auto non basta. Controlla il registro dei prestiti: qualcuno aveva già richiesto proprio il fascicolo sottratto.', objective:'Trova chi ha preso F-204 e non lo ha mai restituito.', tables:['prestiti_documenti','cittadini'], starter:"SELECT c.nome, c.cognome, p.codice_fascicolo, p.data_restituzione\nFROM prestiti_documenti p\nJOIN cittadini c ON c.id = p.cittadino_id", hints:["Un valore mancante si cerca con IS NULL, non con = NULL.","Filtra codice_fascicolo = 'F-204' e data_restituzione IS NULL.","Aggiungi un WHERE con il codice del fascicolo e collega con AND il controllo IS NULL sulla data di restituzione."], validate: rows => rows.length === 1 && includes(rows,null,'Marco') && includes(rows,null,'F-204') },
  { skill:'JOIN MULTIPLA', title:'La chiamata prima del colpo', text:'Poco prima dell’ingresso, Marco ha telefonato a qualcuno. Incrocia due volte l’anagrafe con i tabulati per identificare il destinatario.', objective:'Trova chi ha ricevuto una chiamata da Marco Riva tra le 21:30 e le 22:00.', tables:['telefonate','cittadini'], starter:"SELECT dest.nome, dest.cognome, t.ora, t.durata_sec\nFROM telefonate t\nJOIN cittadini mitt ON mitt.id = t.mittente_id\nJOIN cittadini dest ON dest.id = t.destinatario_id", hints:["Filtra mitt.nome='Marco' e mitt.cognome='Riva'.","Usa t.ora BETWEEN '21:30' AND '22:00'.","Nel WHERE combina nome e cognome del mittente con l’intervallo orario espresso tramite BETWEEN."], validate: rows => rows.length === 1 && includes(rows,null,'Laura') && includes(rows,null,'Neri') && includes(rows,null,'21:48') },
  { skill:'SOTTOQUERY · COUNT', title:'Verifica l’alibi', text:'Laura sostiene di non conoscere l’archivio. Ma il registro telefonico può mostrare quante volte ha contattato dipendenti dell’Archivio Civico nell’ultima settimana.', objective:'Conta le chiamate di Laura verso persone con professione “archivista”.', tables:['telefonate','cittadini'], starter:"SELECT COUNT(*) AS contatti_archivio\nFROM telefonate t\nJOIN cittadini dest ON dest.id = t.destinatario_id", hints:["Per identificare Laura puoi confrontare mittente_id con una SELECT annidata su cittadini.","Nella sottoquery filtra nome e cognome; nella query esterna filtra la professione del destinatario.","Combina una sottoquery che ricava l’id di Laura Neri con la condizione sulla professione 'archivista'."], validate: rows => Number(valueOf(rows,'contatti_archivio')) === 3 },
  { skill:'VERDETTO', title:'Firma il rapporto', text:'Auto, prestito e tabulati raccontano la stessa storia. Restituisci in una sola riga i nomi completi del colpevole e della complice.', objective:'Crea le colonne “colpevole” e “complice” con i due nomi completi.', tables:['cittadini'], starter:"SELECT '' AS colpevole,\n       '' AS complice;", hints:["Rileggi tutti gli indizi nel taccuino e inserisci i due nomi fra gli apici.","Gli alias richiesti sono colpevole e complice.","Sostituisci le due stringhe vuote con i nomi dedotti dal taccuino, senza modificare gli alias già presenti."], validate: rows => rows.length === 1 && includes(rows,'colpevole','Marco Riva') && includes(rows,'complice','Laura Neri') }
];

const clueTexts = [
  'L’allarme del fascicolo F-204 è scattato alle 22:14.',
  'Marco Riva è entrato alle 21:51; Sara Conti alle 22:02.',
  'L’auto in fuga verso la tangenziale aveva targa TO-314-XR.',
  'La targa TO-314-XR appartiene a Marco Riva, geometra comunale.',
  'Marco Riva aveva preso in prestito F-204 senza restituirlo.',
  'Marco Riva ha chiamato Laura Neri alle 21:48.',
  'Laura Neri ha contattato tre diversi archivisti.',
  'Verdetto: Marco Riva è il colpevole e Laura Neri la complice.'
];

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
INSERT INTO telefonate VALUES (1,1,3,'2026-10-31','21:48',92),(2,3,2,'2026-10-26','11:20',145),(3,3,4,'2026-10-28','16:02',61),(4,3,6,'2026-10-30','09:14',203),(5,2,4,'2026-10-31','18:11',34),(6,5,7,'2026-10-31','20:05',180),(7,1,3,'2026-10-31','22:27',18),(8,3,7,'2026-10-29','12:05',51);
`;

let db, step = 0, hintLevel = 0, queryCount = 0, soundOn = true, solvedCurrent = false, collectedClues = [];
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
  $('runBtn').disabled=false;$('startBtn').disabled=false;$('startBtn').innerHTML='<span class="case-cta-copy"><small>CASO 01 · PRONTO</small><strong>Avvia il gioco</strong></span><span class="case-cta-seal" aria-hidden="true">01</span>';$('dbStatus').className='db-status ready';$('dbStatus').innerHTML='<i></i><span>Database pronto</span>';
}

function renderMission(){
  const m=missions[step]; hintLevel=0; solvedCurrent=false;
  $('stepCount').textContent=`INDIZIO ${step+1} DI ${missions.length}`;$('progressPercent').textContent=`${Math.round((step+1)/missions.length*100)}%`;$('progressBar').style.width=`${(step+1)/missions.length*100}%`;
  $('missionSkill').textContent=m.skill;$('missionTitle').textContent=m.title;$('missionText').textContent=m.text;$('missionObjective').textContent=m.objective;els.editor.value=m.starter;
  const guidance=step<2?'GUIDA ALTA':step<5?'GUIDA MEDIA':'GUIDA MINIMA';
  $('nextAction').textContent=step===0 ? "Esegui la query iniziale, osserva le righe ottenute e prova a restringere la ricerca fino a isolare un solo evento." : `${guidance}: completa ciò che manca usando l’obiettivo e gli indizi già raccolti, poi esegui la query.`;
  $('tableChips').innerHTML=m.tables.map(t=>`<button type="button" data-table="${t}">${t}</button>`).join('');
  $('hintBox').classList.add('hidden');$('hintBox').textContent='';$('hintBtn').textContent='＋ Richiedi un suggerimento';
  $('foundClue').classList.add('hidden');$('runBtn').disabled=!db;els.editor.readOnly=false;
  $('clueInput').value='';$('continueBtn').disabled=true;$('clueInputHelp').textContent='Scrivi con parole tue ciò che potrà servirti dopo.';$('clueInputHelp').className='';
  els.results.innerHTML='<div class="empty-state">I risultati della query appariranno qui.</div>';$('rowCount').textContent='0 righe';setFeedback(step===0 ? "Prima prova: esegui la query così com’è, studia il risultato e poi rendila più precisa." : step<2 ? "La struttura è quasi completa: aggiungi i filtri richiesti dall’obiettivo." : step<5 ? "La traccia contiene solo una parte della soluzione: costruisci i passaggi mancanti." : "Ora hai meno aiuti nell’editor: usa schema, taccuino e suggerimenti per costruire la query.");
  document.querySelectorAll('[data-table]').forEach(b=>b.onclick=()=>{els.editor.value=`SELECT *\nFROM ${b.dataset.table}\nLIMIT 20;`;els.editor.focus()});
}

function renderNotebook(){
  $('clueCount').textContent=`${collectedClues.length} / ${missions.length}`;
  $('clueList').innerHTML=collectedClues.length
    ? collectedClues.map((clue,i)=>`<p class="clue-note"><b>${i+1}.</b> ${escapeHtml(clue)}</p>`).join('')
    : '<p class="notebook-empty">Le prove corrette verranno annotate qui e resteranno disponibili per gli enigmi successivi.</p>';
}

function setFeedback(text,type=''){ els.feedback.textContent=text;els.feedback.className=`feedback ${type}`; }
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
  try{
    const started=performance.now();const result=db.exec(sql);const elapsed=Math.max(1,Math.round(performance.now()-started));queryCount++;renderResults(result,elapsed);const rows=rowsFrom(result);const structureOk=step===missions.length-1||usesRequiredTables(sql,missions[step].tables);
    if(structureOk&&missions[step].validate(rows)){
      solvedCurrent=true;beep(740,.11);setFeedback('Query corretta. Prima di continuare, osserva con calma le righe ottenute: contengono una prova che servirà nell’indagine.','success');
      $('foundClueText').textContent=clueTexts[step];$('foundClue').classList.remove('hidden');
      $('continueBtn').textContent=step===missions.length-1?'Salva e firma il rapporto':'Salva e continua';
      $('runBtn').disabled=true;els.editor.readOnly=true;$('foundClue').scrollIntoView({behavior:'smooth',block:'nearest'});
    } else { beep(230,.08);setFeedback(structureOk?`La query è valida e i ${rows.length} ${rows.length===1?'risultato è visibile':'risultati sono visibili'} qui sotto, ma non contengono ancora la prova richiesta. Modifica la query e riprova: non perdi nulla.`:'La query è valida, ma per questo indizio devi interrogare tutte le tabelle indicate a sinistra. I risultati restano visibili per aiutarti a correggerla.', ''); }
  }catch(err){beep(180,.12);setFeedback(`Errore SQL: ${err.message.replace('Error: ','')}`,'error')}
}

function finish(){document.body.classList.remove('game-active');els.workspace.classList.add('hidden');els.completion.classList.remove('hidden');$('queryStat').textContent=queryCount;window.scrollTo({top:0,behavior:'smooth'});}
function startGame(showGuide=true){document.body.classList.add('game-active');els.intro.classList.add('hidden');els.completion.classList.add('hidden');els.workspace.classList.remove('hidden');step=0;queryCount=0;collectedClues=[];renderNotebook();renderMission();window.scrollTo({top:0,behavior:'smooth'});if(showGuide)$('helpDialog').showModal();}
function goHome(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());document.body.classList.remove('game-active');els.workspace.classList.add('hidden');els.completion.classList.add('hidden');els.intro.classList.remove('hidden');window.scrollTo(0,0);}
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
  ${erEntity(745,35,220,145,'TELEFONATA',['id  · identificatore','data · ora','durata_sec'])}
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
  ${erCard(790,10,200,220,'telefonate',['id  INTEGER  PK','mittente_id  INTEGER  FK','destinatario_id  INTEGER  FK','data  TEXT','ora  TEXT','durata_sec  INTEGER'],false,30)}
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

$('startBtn').onclick=()=>startGame(true);$('replayBtn').onclick=()=>startGame(false);$('runBtn').onclick=runQuery;$('runBtn').disabled=true;
document.querySelector('.brand').onclick=e=>{e.preventDefault();goHome()};
$('resetQueryBtn').onclick=()=>{els.editor.value=missions[step].starter;els.editor.focus()};
$('hintBtn').onclick=()=>{const m=missions[step];const level=Math.min(hintLevel,m.hints.length-1);$('hintBox').textContent=(level===2?'INDIZIO MIRATO\n':'SUGGERIMENTO\n')+m.hints[level];$('hintBox').classList.remove('hidden');hintLevel++;$('hintBtn').textContent=hintLevel>=3?'↻ Rileggi l’ultimo indizio':'＋ Altro suggerimento';};
$('clueInput').addEventListener('input',()=>{const valid=$('clueInput').value.trim().length>=8;$('continueBtn').disabled=!valid;$('clueInputHelp').textContent=valid?'Pronto per essere aggiunto al taccuino.':'Scrivi almeno una breve frase con ciò che hai scoperto.';$('clueInputHelp').className=valid?'':'input-error'});
$('continueBtn').onclick=()=>{if(!solvedCurrent)return;const note=$('clueInput').value.trim();if(note.length<8){$('clueInputHelp').textContent='Scrivi prima l’indizio con parole tue.';$('clueInputHelp').className='input-error';return}if(!collectedClues[step])collectedClues.push(note);renderNotebook();if(step===missions.length-1){finish()}else{step++;renderMission();window.scrollTo({top:0,behavior:'smooth'})}};
$('schemaBtn').onclick=()=>{$('schemaDialog').showModal();renderRelationalSchema()};$('closeSchemaBtn').onclick=()=>$('schemaDialog').close();
$('helpBtn').onclick=()=>$('helpDialog').showModal();$('closeHelpBtn').onclick=()=>$('helpDialog').close();$('beginBtn').onclick=()=>{$('helpDialog').close();els.editor.focus()};
$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♪':'×';$('soundBtn').ariaLabel=soundOn?'Disattiva effetti sonori':'Attiva effetti sonori'};
els.editor.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();runQuery()}if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;e.target.value=e.target.value.slice(0,s)+'  '+e.target.value.slice(e.target.selectionEnd);e.target.selectionStart=e.target.selectionEnd=s+2}});
renderRelationalSchema();initDb().catch(err=>{$('dbStatus').className='db-status error';$('dbStatus').innerHTML='<i></i><span>Database non disponibile</span>';$('startBtn').innerHTML='Errore caricamento <span>!</span>';setFeedback('Impossibile avviare SQLite: '+err.message,'error')});
