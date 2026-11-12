'use strict';
(() => {
  const {missions,lessons,buildings,practice,isLessonUnlocked,canEnterMission,isBuildingDiscovered}=RZData;
  const $=id=>document.getElementById(id), storageKey='rete-zero-city-v2',curriculumVersion=3;
  const avatars={
    uomo:{file:'avatar-tecnico.png',role:'Tecnico'},
    donna:{file:'avatar-tecnica.png',role:'Tecnica'},
    occhiali:{file:'avatar-tecnico-occhiali.png',role:'Tecnico'},
    ricci:{file:'avatar-tecnica-ricci.png',role:'Tecnica'}
  };
  let state={curriculum:curriculumVersion,completed:0,studied:[],drafts:{},lessonDrafts:{},nextDayStage:0,avatar:null,badgeName:'',badgeAge:null};
  try {
    const raw=JSON.parse(localStorage.getItem(storageKey));
    if(raw&&typeof raw==='object'&&raw.curriculum===curriculumVersion){
      if(Number.isInteger(raw.completed)&&raw.completed>=0&&raw.completed<=missions.length)state.completed=raw.completed;
      if(Array.isArray(raw.studied))state.studied=[...new Set(raw.studied.filter(id=>lessons.some(l=>l.id===id)))];
      if(raw.drafts&&typeof raw.drafts==='object'&&!Array.isArray(raw.drafts))state.drafts=raw.drafts;
      if(raw.welcomeRead===true)state.welcomeRead=true;
      if(Array.isArray(raw.missionLogs))state.missionLogs=raw.missionLogs;
      if(typeof raw.badgeName==='string')state.badgeName=raw.badgeName.trim().slice(0,40);
      if(Number.isInteger(raw.badgeAge)&&raw.badgeAge>=1&&raw.badgeAge<=120)state.badgeAge=raw.badgeAge;
      if(Object.hasOwn(avatars,raw.avatar))state.avatar=raw.avatar;
      if(raw.routing&&typeof raw.routing==='object')state.routing=raw.routing;
      if(raw.lessonDrafts&&typeof raw.lessonDrafts==='object'&&!Array.isArray(raw.lessonDrafts))state.lessonDrafts=raw.lessonDrafts;
      state.fieldStage=[0,1,2].includes(raw.fieldStage)?raw.fieldStage:2;
      if(state.completed===missions.length&&[1,2].includes(raw.nextDayStage))state.nextDayStage=raw.nextDayStage;
      state.stormStage=[0,1,2].includes(raw.stormStage)?raw.stormStage:raw.completed>0?2:0;
    }
  } catch (_) {}
  const resumeAfterSchool=location.hash==='#rip-completato';
  const resumeDayThree=resumeAfterSchool||location.hash==='#giorno-3';
  if(resumeDayThree){
    state.completed=missions.length;
    state.studied=lessons.map(lesson=>lesson.id);
    state.stormStage=state.fieldStage=state.nextDayStage=2;
    state.badgeName||='Tecnico di Valle Nord';
    state.badgeAge??=18;
    state.avatar||='uomo';
    if(resumeAfterSchool)Object.assign(state.routing??={},{labConfigured:true,diagnosisComplete:true,ripComplete:true,trained:true});
    try{history.replaceState(null,'',location.href.split('#')[0]);}catch(_){}
  }
  let activeBuilding=null,activeLesson=0,returnFocus=null;
  const graduated=()=>state.studied.length===lessons.length;
  const xp=()=>state.studied.length*25+state.completed*100+(state.routing?.complete?100:0)+(state.routing?.municipalComplete?100:0);
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(_){}}
  save();
  function makeButton(text,action,className='primary'){const b=document.createElement('button');b.type='button';b.className=className;b.textContent=text;b.addEventListener('click',action);return b;}
  const city=new RZCity($('city-canvas'),$('city-markers'),openBuilding);
  const fieldMessages=[
    'Il pronto soccorso è di nuovo in contatto con la centrale. La Protezione civile può riprendere il coordinamento, appena sistemiamo la radio della Squadra Nord.',
    'La Squadra Nord comunica di nuovo e ha confermato che manca un ultimo intervento. Il Municipio deve riattivare la rete dei suoi quattro reparti.',
    'I quattro reparti del Municipio sono di nuovo online. Abbiamo ripristinato le comunicazioni dopo il blackout. Ti sei guadagnato la medaglia Tecnico operativo. Per oggi abbiamo finito.'
  ];
  const badgeReminder = 'Congratulazioni! Hai superato tutte le prove della scuola. Apri il tesserino e configura nome, età e avatar prima di poter intervenire sul campo.';
  const welcomeMessage=['Benvenuto a Valle Nord','Sono Elena Riva, la coordinatrice. Per iniziare, vai all’Istituto Galilei. Seleziona il segnaposto 01 sulla mappa oppure scegli «Scuola di reti» nel pannello Il tuo incarico. Lì ti aspettano le prime prove.','Giorno 01 · 07:40'];
  const graduationMessage=['Formazione completata',badgeReminder,'Giorno 01 · 18:30'];
  const stormAlert = ['Temporale a Valle Nord', 'Buongiorno. Il temporale di ieri sera ha causato un blackout. Dobbiamo ripristinare le comunicazioni tra ospedale, Protezione civile e Municipio.', 'Giorno 02 · 09:00'];
  const awaitingDispatch=()=>graduated()&&hasBadgeProfile()&&state.completed===0&&(state.stormStage??0)<2;
  let dispatchTimer;
  function scheduleDispatch(){
    if (!awaitingDispatch() || dispatchTimer || document.querySelector('dialog[open]:not(#phone-dialog)')) return;
    dispatchTimer=window.setTimeout(()=>{
      dispatchTimer=undefined;
      if (!awaitingDispatch() || document.querySelector('dialog[open]:not(#phone-dialog)')) return;
      state.stormStage=(state.stormStage??0)+1;
      save();
      renderShell();
      if (state.stormStage===1 || $('phone-dialog').open) openPhone();
      else notifyMessages(phoneMessages());
      scheduleDispatch();
    },(state.stormStage??0)===0?3000:2000);
  }
  document.addEventListener('close',scheduleDispatch,true);
  const awaitingFieldDispatch=()=>state.completed>0&&(state.fieldStage??2)<2;
  const districtRestored=()=>graduated()&&state.completed===missions.length;
  const nextDayStarted=()=>districtRestored()&&state.nextDayStage===2;
  const schoolUpdateTitle='Aggiornamento alla scuola';
  const schoolUpdate=[schoolUpdateTitle,'Buongiorno. Torna al Galilei per l’aggiornamento sul routing. Oggi collegheremo due reti con rotte statiche, cercheremo un guasto e vedremo come i router imparano le rotte con RIP.', 'Giorno 03 · 08:00'];
  const schoolUpdateComplete=['Aggiornamento completato','Congratulazioni! Hai completato l’aggiornamento al Galilei. Hai collegato due reti, individuato un guasto e verificato il collegamento con RIPv2.', 'Giorno 03 · 13:45'];
  const routingRequest=['Richiesta di assistenza','L’ospedale deve inviare una richiesta alla Protezione civile passando dalla Centrale. Le reti locali funzionano. Controlla il percorso tra le sedi e ripristina la comunicazione in entrambe le direzioni.', 'Giorno 03 · 14:00'];
  const routingComplete=['Collegamento tra le sedi ripristinato','La richiesta è arrivata alla Protezione civile e la risposta è tornata all’ospedale. Hai ottenuto la medaglia Tecnico specialista.', 'Giorno 03 · 15:15'];
  const municipalTitle='Municipio in rete';
  const municipalRequest=[municipalTitle,'Il Municipio deve scambiare dati con Ospedale e Protezione civile. La Centrale è pronta a scambiare aggiornamenti RIPv2. Configura RIP al Municipio e verifica che il suo PC raggiunga entrambe le sedi.', 'Giorno 03 · 15:20'];
  const municipalReport=['Municipio collegato','Il Municipio comunica con Ospedale e Protezione civile attraverso la Centrale. Le rotte verso le due sedi sono state apprese tramite RIP.', 'Giorno 03 · 16:00'];
  let fieldTimer,nextDayTimer,phoneHasFinalReport=false;
  const awaitingFinalReport=()=>districtRestored()&&state.nextDayStage===0&&!phoneHasFinalReport;
  function scheduleFieldDispatch(){
    if((!awaitingFieldDispatch()&&!awaitingFinalReport())||fieldTimer||document.querySelector('dialog[open]:not(#phone-dialog)'))return;
    fieldTimer=window.setTimeout(()=>{
      fieldTimer=undefined;
      if((!awaitingFieldDispatch()&&!awaitingFinalReport())||document.querySelector('dialog[open]:not(#phone-dialog)'))return;
      const first=state.fieldStage===0||awaitingFinalReport();
      state.fieldStage=first&&missions[state.completed]?1:2;
      save();
      renderShell();
      if(first || $('phone-dialog').open)openPhone();
      else notifyMessages(phoneMessages());
      scheduleFieldDispatch();
    },2000);
  }
  document.addEventListener('close',scheduleFieldDispatch,true);
  function scheduleNextDay(){
    if(!districtRestored()||state.nextDayStage!==1||nextDayTimer||document.querySelector('dialog[open]'))return;
    nextDayTimer=window.setTimeout(()=>{
      nextDayTimer=undefined;
      if(!districtRestored()||state.nextDayStage!==1||document.querySelector('dialog[open]'))return;
      state.nextDayStage=2;
      save();
      renderShell();
      openPhone();
    },3000);
  }
  document.addEventListener('close',scheduleNextDay,true);
  $('phone-dialog').addEventListener('close',()=>{
    if(!phoneHasFinalReport)return;
    phoneHasFinalReport=false;
    if(!districtRestored()||state.nextDayStage!==0)return;
    state.nextDayStage=1;
    save();
    renderShell();
    scheduleNextDay();
  });
  function phoneMessages(){
    const messages=[welcomeMessage];
    if(!graduated())return messages;
    messages.push(graduationMessage);
    if (hasBadgeProfile() && state.stormStage >= 1) messages.push(stormAlert);
    if (hasBadgeProfile() && !awaitingDispatch()) {
      const dispatchTimes=['09:01','10:15','11:30'];
      const restoreTimes=['10:15','11:30','13:00'];
      const destinations=['all’ospedale San Luca','alla sede della protezione civile','al municipio'];
      for(let index=0;index<=state.completed;index++){
        const stage=index===state.completed?(state.fieldStage??2):2;
        if(index>0&&stage>=1)messages.push([missions[index-1].site+' · Collegamento ripristinato',fieldMessages[index-1],`Giorno 02 · ${restoreTimes[index-1]}`]);
        if(missions[index]&&stage===2)messages.push([missions[index].site,`Vai ${destinations[index]}. `+missions[index].radio.replace(/^«|»$/g,''),`Giorno 02 · ${dispatchTimes[index]}`]);
      }
    }
    if(nextDayStarted()){
      messages.push(schoolUpdate);
      if(state.routing?.ripComplete)messages.push(schoolUpdateComplete,routingRequest);
      if(state.routing?.ripComplete&&state.routing.complete)messages.push(routingComplete,municipalRequest);
      if(state.routing?.municipalComplete)messages.push(municipalReport);
    }
    return messages;
  }
  const deliveredMessages = new Set();
  function notifyMessages(messages){
    const keys=messages.map(([context,message])=>JSON.stringify([context,message]));
    if (keys.some(key=>!deliveredMessages.has(key))) {
      keys.forEach(key=>deliveredMessages.add(key));
      document.dispatchEvent(new Event('retezero:message'));
    }
  }
  function openPhone(singleMessage){
    const messages=singleMessage?[singleMessage]:phoneMessages();
    if(!state.welcomeRead&&messages.includes(welcomeMessage)){
      state.welcomeRead=true;
      save();
    }
    notifyMessages(messages);
    const list = $('phone-messages');
    list.replaceChildren(...messages.map(([context, message, arrival]) => {
      const item = document.createElement('li');
      const heading = document.createElement('div');
      heading.className='phone-message-heading';
      const label = document.createElement('small');
      const timestamp = document.createElement('small');
      timestamp.className='phone-message-time';
      timestamp.textContent=arrival;
      const bubble = document.createElement('p');
      label.textContent = context;
      bubble.textContent = message.replace(/^«|»$/g, '');
      heading.append(label,timestamp);
      item.append(heading,bubble);
      return item;
    }));
    phoneHasFinalReport=!singleMessage&&districtRestored()&&state.nextDayStage===0&&state.fieldStage===2;
    if (!$('phone-dialog').open) $('phone-dialog').showModal();
    const briefing = singleMessage ? list.firstElementChild : list.children[2 * activeBuilding?.mission + 2];
    if (briefing) {
      list.scrollTop = briefing.getBoundingClientRect().top - list.getBoundingClientRect().top;
    } else {
      list.scrollTop = list.scrollHeight;
    }
  }
  function scheduleSchoolMessage(completion,message){
    window.setTimeout(()=>{
      if(completion.isConnected&&activeBuilding?.id==='school'&&$('building-dialog').open&&!$('phone-dialog').open){
        openPhone(message);
      }
    },2000);
  }
  function scheduleWelcomeMessage(){
    const startedState=state;
    window.setTimeout(()=>{
      if(state!==startedState||state.welcomeRead||state.studied.length||state.completed)return;
      const dialog=document.querySelector('dialog[open]');
      if(dialog){
        dialog.addEventListener('close',scheduleWelcomeMessage,{once:true});
        return;
      }
      openPhone(welcomeMessage);
    },2000);
  }
  $('phone-open').addEventListener('click', ()=>openPhone());
  function renderShell(){
    const weatherStages = [
      {label:'Schiarite', time:'07:40', icon:'clearing', day:'Giorno 01'},
      {label:'Schiarite', time:'09:00', icon:'clearing', day:'Giorno 02'},
      {label:'Poco nuvoloso', time:'10:15', icon:'clearing', day:'Giorno 02'},
      {label:'Sereno', time:'11:30', icon:'sun', day:'Giorno 02'},
      {label:'Sereno', time:'13:00', icon:'sun', day:'Giorno 02'}
    ];
    const schoolEvening=graduated()&&state.completed===0&&(state.stormStage??0)===0;
    const afterMunicipioNight=districtRestored()&&state.nextDayStage===1;
    const dayThree=nextDayStarted();
    const map=$('map-stage');
    map.classList.toggle('storm',schoolEvening);
    map.classList.toggle('night',schoolEvening||afterMunicipioNight);
    let weather=weatherStages[graduated()?state.completed+1:0];
    if(schoolEvening)weather={label:'Pioggia',time:'18:30',icon:'rain',day:'Giorno 01'};
    if(afterMunicipioNight)weather={label:'Notte serena',time:'21:00',icon:'moon',day:'Giorno 02'};
    if(dayThree)weather={label:'Sereno',time:state.routing?.ripComplete?'14:00':'08:00',icon:'sun',day:'Giorno 03'};
    const weatherPanel = document.querySelector('.weather');
    weatherPanel.setAttribute('aria-label', `Meteo della simulazione: ${weather.label.toLowerCase()}, ${weather.day.toLowerCase()}, ore ${weather.time}`);
    weatherPanel.querySelector('use').setAttribute('href', `#weather-${weather.icon}`);
    weatherPanel.querySelector('span').replaceChildren(
      document.createTextNode(weather.label),
      Object.assign(document.createElement('small'), {textContent:`${weather.day.toUpperCase()} · ${weather.time} · VALLE NORD`})
    );
    const rank=state.routing?.complete?'Tecnico specialista':graduated()?(state.completed===3?'Tecnico di distretto':'Tecnico di rete'):'In formazione';
    $('phone-open').hidden=false;
    document.querySelector('.profile-chip').hidden=!graduated();
    $('profile-rank').replaceChildren(document.createTextNode('Il tuo tesserino'),Object.assign(document.createElement('small'),{textContent:graduated()?`${rank} · ${xp()} XP`:`Da ottenere · ${state.studied.length}/${lessons.length} prove`}));
    document.querySelector('.profile-chip').setAttribute('aria-label',graduated()?'Apri il tuo tesserino da tecnico':`Il tuo tesserino: completa le ${lessons.length} prove della scuola`);
    $('progress-label').textContent=dayThree?`INCARICHI · ${weather.day.toUpperCase()}`:'PERCORSO';
    $('progress-count').textContent=dayThree?'':state.completed+' / '+missions.length;
    $('journey').replaceChildren();
    const stages=[{id:'school',title:'Scuola di reti',info:graduated()?'Completata ✓':`${state.studied.length}/${lessons.length} prove`,done:graduated(),active:!graduated()},...missions.map((mission,index)=>({id:buildings.find(b=>b.mission===index).id,title:mission.site,info:index<state.completed?'Online ✓':!graduated()?'Richiede tesserino':index===state.completed?mission.title:'In attesa',done:index<state.completed,active:graduated()&&index===state.completed}))];
    if(dayThree){
      const trained=Boolean(state.routing?.ripComplete);
      stages.splice(0,stages.length,{id:'school',title:schoolUpdateTitle,info:'Routing statico e RIP',active:!trained,done:trained});
      if(trained)stages.push({id:'hospital',title:'Richiesta di assistenza',info:'Ospedale · Centrale · Protezione civile',active:!state.routing.complete,done:state.routing.complete});
      if(trained&&state.routing.complete)stages.push({id:'townhall',title:municipalTitle,info:'Routing dinamico · RIPv2',active:!state.routing.municipalComplete,done:state.routing.municipalComplete});
    }
    stages.filter(stage=>(!awaitingDispatch() || stage.id==='school') && !(stage.active && awaitingFieldDispatch()) && isBuildingDiscovered(stage.id,state.completed,state.studied)).forEach((stage,i)=>{const b=makeButton('',()=>openBuilding(stage.id),'journey-step'+(stage.active?' current':'')+(stage.done?' done':''));const num=document.createElement('span');num.className='step-number';num.textContent=stage.done?'✓':String(dayThree?i+1:i).padStart(2,'0');const text=document.createElement('span'),title=document.createElement('strong'),sub=document.createElement('small');title.textContent=stage.title;sub.textContent=stage.info;text.append(title,sub);b.append(num,text);$('journey').append(b);});
    $('world-status').textContent=!graduated()?'La scuola è aperta. Inizia da lì.':(awaitingDispatch()||awaitingFieldDispatch())?'In attesa di indicazioni dalla centrale.':state.completed<3?`${missions[state.completed].site}: intervento disponibile.`:'Distretto riconnesso. Tre interventi completati.';
    $('brief-instruction').textContent=!graduated()?'Completa la scuola, poi ripristina le tre sedi.':(awaitingDispatch()||awaitingFieldDispatch())?'Attendi il messaggio di Elena.':state.completed<3?'Scegli la sede segnalata per il prossimo intervento.':'Le tre sedi sono di nuovo online.';
    if(dayThree){
      const instruction=!state.routing?.ripComplete?'Torna alla scuola di reti per l’aggiornamento.':state.routing.municipalComplete?'Il Municipio comunica con Ospedale e Protezione civile.':state.routing?.complete?'Vai al Municipio e collegalo alle altre sedi con RIP.':'Verifica il percorso tra ospedale e Protezione civile.';
      $('world-status').textContent=instruction;
      $('brief-instruction').textContent=instruction;
    }
    document.querySelectorAll('[data-routing-command]').forEach(row=>row.hidden=!dayThree);
    const activeRouterFilter=$('cli-router-panel').querySelector('button[aria-pressed="true"]');
    (activeRouterFilter.hidden?$('cli-router-panel').querySelector('.cli-mode-picker button'):activeRouterFilter).click();
    const dayThreeMarkers=dayThree
      ?state.routing?.ripComplete
        ?new Map([
          ['school','Aggiornamento completato ✓'],
          ['hospital','Richiesta di assistenza'],
          ['hq','Centrale'],
          ['rescue','Protezione civile · Destinazione']
        ])
        :new Map([['school',schoolUpdateTitle]])
      :null;
    if(dayThreeMarkers&&state.routing?.ripComplete&&state.routing.complete)dayThreeMarkers.set('townhall',municipalTitle);
    city.update(state,awaitingDispatch(),dayThreeMarkers);
  }
  function openBuilding(id,showBadge=false){
    const site=buildings.find(b=>b.id===id);if(!site)return;if(id!=='hq'&&!isBuildingDiscovered(id,state.completed,state.studied))return;
    if (Number.isInteger(site.mission) && !hasBadgeProfile()) {
      openBuilding('hq');
      return;
    }
    if (Number.isInteger(site.mission) && (awaitingDispatch() || (site.mission===state.completed && awaitingFieldDispatch()))) return;
    if(nextDayStarted()&&Number.isInteger(site.mission)
      &&(!state.routing?.ripComplete||(id==='townhall'&&!state.routing.complete)))return;
    activeBuilding=site;returnFocus=document.activeElement;city.focus(id);
    $('building-dialog').classList.toggle('school-screen',id==='school');$('building-dialog').classList.toggle('mission-screen',Number.isInteger(site.mission));$('building-badge').textContent=site.badge+' / '+site.name;
    const routingSite=['hospital','hq','rescue'].indexOf(id);
    const routingLab=nextDayStarted()&&id==='school';
    const routingField=nextDayStarted()&&state.routing?.ripComplete&&routingSite>=0&&!showBadge;
    const municipalField=nextDayStarted()&&state.routing?.ripComplete&&state.routing.complete&&id==='townhall';
    if(routingLab||routingField||municipalField){
      $('building-dialog').classList.toggle('mission-screen',routingField||municipalField);
      $('building-badge').textContent='CAPITOLO 02 / '+site.name;
      renderRouting(routingLab,municipalField?3:routingField?routingSite:0,undefined,municipalField);
    }else if(id==='school'){activeLesson=Math.max(0,lessons.findIndex(l=>!state.studied.includes(l.id)));renderSchool();}
    else if(id==='hq')renderHeadquarters();else renderMission(site);
    if(!$('building-dialog').open)$('building-dialog').showModal();
  }
  function closeBuilding(){$('building-dialog').close();activeBuilding=null;if(returnFocus?.isConnected)returnFocus.focus();}
  $('back-city').addEventListener('click',closeBuilding);$('close-building').addEventListener('click',closeBuilding);
  $('building-dialog').addEventListener('close',()=>activeBuilding=null);
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>b.dataset.action==='calculator'?openCalculator():openBuilding(b.dataset.action,b.dataset.action==='hq')));
  function renderConceptBody(body, intro=''){
    const paragraph=$('concept-text'),list=$('concept-commands');
    const hasCommands=Array.isArray(body);
    paragraph.hidden=hasCommands&&!intro;
    paragraph.textContent=hasCommands?intro:body;
    list.hidden=!hasCommands;
    list.replaceChildren();
    if(!hasCommands)return;
    for(const [command,description,example] of body){
      const item=document.createElement('li');
      const label=document.createElement('code');
      label.textContent=command;
      item.append(label, document.createElement('br'), description);
      if(example){
        const exampleCommand=document.createElement('code');
        exampleCommand.textContent=example;
        item.append(document.createElement('br'),'Esempio  ',exampleCommand);
      }
      list.append(item);
    }
  }
  function schoolLayout({chapter=1,title,score,scoreLabel='PROVE SUPERATE',status,question,practiceContent}){
    const chapterLabel='CAPITOLO '+String(chapter).padStart(2,'0');
    $('building-badge').textContent=chapterLabel+' / Istituto Galilei';
    return `<div class="school-workspace" data-school-chapter="${chapter}"><header class="school-heading"><div><p class="eyebrow school-chapter-label">${chapterLabel} · ISTITUTO GALILEI</p><h2 id="building-title">${title}</h2></div><div class="school-seal"><strong>${score}</strong><small>${scoreLabel}</small></div></header><div class="school-desk"><aside class="course-nav" aria-label="Lezioni della scuola"></aside><div class="school-main"><div class="study-mode" role="group" aria-label="Vista della lezione"><button id="show-theory" aria-pressed="true">Impara</button><button id="show-practice" aria-pressed="false">Mettiti alla prova</button></div><div class="lesson-columns" data-mode="theory"><section class="theory-card" aria-labelledby="concept-title"><div class="lesson-meta"><span>IMPARA</span><span id="concept-count">1 / 3</span></div><h3 id="concept-title"></h3><p id="concept-text"></p><ul id="concept-commands" hidden></ul><div id="concept-visual" class="concept-visual" hidden></div><div class="concept-navigation"><button id="concept-prev" aria-label="Concetto precedente">←</button><span id="concept-dots" aria-hidden="true"></span><button id="concept-next" aria-label="Concetto successivo">→</button></div><div class="worked-example"></div><p class="elena-tip"><strong>Elena</strong> Leggi, osserva l’esempio e prova. Puoi tornare su ogni concetto.</p></section><section class="practice" aria-labelledby="practice-question"><div class="practice-heading"><span class="eyebrow">METTITI ALLA PROVA</span><span class="practice-status">${status}</span></div><h3 id="practice-question">${question}</h3>${practiceContent}</section></div></div></div></div>`;
  }
  function bindSchoolViews(){
    for(const mode of ['theory','practice']){
      $('show-'+mode).addEventListener('click',()=>{
        document.querySelector('.lesson-columns').dataset.mode=mode;
        $('show-theory').setAttribute('aria-pressed',String(mode==='theory'));
        $('show-practice').setAttribute('aria-pressed',String(mode==='practice'));
      });
    }
  }
  function renderSchool(){
    const lesson=lessons[activeLesson];let concept=0;
    $('building-content').innerHTML=schoolLayout({
      title:lesson.short,
      score:`${state.studied.length} / ${lessons.length}`,
      status:state.studied.includes(lesson.id)?'SUPERATA ✓':`PROVA ${activeLesson+1} / ${lessons.length}`,
      question:lesson.question,
      practiceContent:`<form id="practice-form"><div class="fields" id="practice-fields"></div><div class="practice-actions"><button class="primary" type="submit">Verifica →</button><button class="secondary" type="button" id="practice-calculator">Calcolatore</button></div></form><div id="practice-feedback" class="feedback" role="status">Nessuna penalità: puoi riprovare.</div><div id="practice-next"></div>`
    });
    const practiceForm=$('practice-form'),practiceFooter=document.createElement('div'),practiceSubmit=practiceForm.querySelector('[type="submit"]');practiceSubmit.textContent='Verifica';practiceSubmit.classList.add('action-triangle');practiceFooter.className='practice-footer';practiceForm.append(practiceFooter);practiceFooter.append($('practice-feedback'),practiceForm.querySelector('.practice-actions'),$('practice-next'));
    const nav=document.querySelector('.course-nav');lessons.forEach((item,i)=>{const unlocked=isLessonUnlocked(i,state.studied),done=state.studied.includes(item.id);const b=makeButton('',()=>{if(!unlocked)return;rememberLesson();activeLesson=i;renderSchool();},'course-button'+(activeLesson===i?' active':'')+(!unlocked?' locked':''));const num=document.createElement('span');num.textContent=done?'✓':String(i+1).padStart(2,'0');const text=document.createElement('span');text.textContent=item.short;b.append(num,text);if(i===activeLesson)b.setAttribute('aria-current','step');if(!unlocked){b.disabled=true;b.setAttribute('aria-label',`${item.short}: completa prima il modulo ${i}`);b.title=`Completa prima il modulo ${i}`;}nav.append(b);});
    if(nextDayStarted())addSchoolChapterNavigation(nav,1);
    const badge=document.createElement('div');badge.className='certificate-status';badge.innerHTML=`<strong>${graduated()?'Tesserino ottenuto':'Il tuo tesserino'}</strong><small>${graduated()?'Pronto per il primo intervento.':`${lessons.length} prove per andare sul campo.`}</small>`;nav.append(badge);
    const conceptVisual=$('concept-visual');
    $('concept-prev').innerHTML='<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M11.5 4 6.5 9l5 5"/></svg>';
    $('concept-next').innerHTML='<svg viewBox="0 0 18 18" aria-hidden="true"><path d="m6.5 4 5 5-5 5"/></svg>';
    if(lesson.binaryExample){const decimal=lesson.binaryExample,binary=ReteZero.ipv4(decimal).toString(2).padStart(32,'0'),octets=binary.match(/.{8}/g);conceptVisual.innerHTML=`<div class="binary-example-heading"><span>DECIMALE</span><strong>${decimal}</strong></div><div class="binary-example-heading"><span>BINARIO / 32 BIT</span><strong>${octets.join('.')}</strong></div><div class="bit-row" aria-label="${decimal} in binario: ${octets.join(' punto ')}">${octets.map(octet=>`<span class="bit-octet">${[...octet].map(bit=>`<i class="bit-${bit}" title="Bit ${bit}: ${bit==='1'?'acceso':'spento'}">${bit}</i>`).join('')}</span>`).join('')}</div><div class="bit-legend"><span><i class="bit-1">1</i> acceso</span><span><i class="bit-0">0</i> spento</span></div>`;}
    const sampleAddress='192.168.10.77';
    const maskOptions=[0,128,192,224,240,248,252,254,255].map((last,index)=>[`/${24+index}`,`255.255.255.${last}`]);
    let selectedMask='255.255.255.0';
    function updateMaskExample(){
      const card=document.querySelector('.worked-example');
      if(!card?.dataset.dynamicMask)return;
      const [prefix,mask]=maskOptions.find(([,value])=>value===selectedMask)||maskOptions[0],bits=Number(prefix.slice(1)),hostBits=32-bits;
      card.innerHTML=`<div><span class="eyebrow">ESEMPIO / PREFISSO E MASCHERA</span><strong>${prefix}</strong></div><div class="example-result"><span>Bit rete<strong>${bits}</strong></span><span>Bit host<strong>${hostBits}</strong></span><span>Maschera<strong>${mask}</strong></span></div>`;
    }
    let selectedSplitCount=4;
    function renderSubnetVisual(){
      const prefix=24+Math.log2(selectedSplitCount),hostBits=32-prefix,blockSize=2**hostBits,base=ReteZero.ipv4('192.168.10.0');
      const maskLast=256-blockSize,mask=`255.255.255.${maskLast}`;
      conceptVisual.classList.add('subnet-visual');
      conceptVisual.dataset.splitCount=String(selectedSplitCount);
      conceptVisual.innerHTML=`<div class="subnet-visual-heading"><span>SIMULA LA SUDDIVISIONE</span><div role="group" aria-label="Numero di sottoreti">${[2,4,8].map(count=>`<button type="button" data-split="${count}" aria-pressed="${count===selectedSplitCount}" class="${count===selectedSplitCount?'selected':''}">${count} reti</button>`).join('')}</div></div><div class="subnet-visual-summary"><span>Da <strong>192.168.10.0/24</strong></span><span>Risultato <strong>/${prefix} · ${mask}</strong></span><span>Per ogni rete <strong>${blockSize} indirizzi · ${blockSize-2} host</strong></span></div><div class="subnet-table-wrap"><table class="subnet-table"><thead><tr><th>Sottorete</th><th>Rete</th><th>Host utilizzabili</th><th>Broadcast</th></tr></thead><tbody>${Array.from({length:selectedSplitCount},(_,index)=>{const network=base+index*blockSize,broadcast=network+blockSize-1;return `<tr${index===1?' class="focus-row"':''}><th>${index+1}</th><td>${ReteZero.address(network)}</td><td>${ReteZero.address(network+1)} – ${ReteZero.address(broadcast-1)}</td><td>${ReteZero.address(broadcast)}</td></tr>`;}).join('')}</tbody></table></div><p class="subnet-visual-note">La seconda sottorete è evidenziata: individua rete, intervallo host e broadcast nella prova.</p>`;
      conceptVisual.querySelectorAll('[data-split]').forEach(button=>button.addEventListener('click',()=>{selectedSplitCount=Number(button.dataset.split);renderSubnetVisual();}));
    }
    function renderMaskVisual(){
      const masks=maskOptions.map(([prefix,mask])=>{const bits=Number(prefix.slice(1)),hostBits=32-bits,last=mask.split('.').at(-1);return {prefix,mask,bits,hostBits,binary:Number(last).toString(2).padStart(8,'0'),total:2**hostBits,usable:bits===31?'P2P':bits===32?'1 singolo':String(2**hostBits-2)};});
      const selected=masks.find(item=>item.mask===selectedMask)||masks[0],range=ReteZero.subnet(sampleAddress,selected.bits);
      const selector=`<div class="mask-selector" role="group" aria-label="Scegli il prefisso da osservare"><span>OSSERVA</span>${masks.map(item=>`<button type="button" data-mask="${item.mask}" class="${item.mask===selected.mask?'selected':''}" aria-pressed="${item.mask===selected.mask}">${item.prefix}</button>`).join('')}</div>`;
      const maskBinary='1'.repeat(selected.bits)+'0'.repeat(selected.hostBits),ipPrefixBinary=ReteZero.ipv4('192.168.10.0').toString(2).padStart(32,'0').slice(0,24),displayBinary=ipPrefixBinary+maskBinary.slice(24),octets=displayBinary.match(/.{8}/g),hostMask=maskBinary.slice(selected.bits).match(/.{1,8}/g)?.join(' ')||'—';
      const split=`<div class="mask-split"><span class="mask-network-side"><small class="mask-network-label">IP ESEMPIO · 192.168.10</small><strong class="mask-network-value">${ipPrefixBinary.match(/.{8}/g).join(' ')}</strong></span><i class="mask-boundary" aria-hidden="true"></i><span><small>${selected.hostBits} BIT HOST · MASCHERA</small><strong>${hostMask}</strong></span></div>`;
      const bits=`<div class="bit-row mask-bit-row" aria-label="Primi tre ottetti dell'esempio 192.168.10 in binario; ultimo ottetto della maschera con ${selected.bits} bit di rete e ${selected.hostBits} bit host">${octets.map((octet,octetIndex)=>`<span class="bit-octet">${[...octet].map((bit,bitIndex)=>{const index=octetIndex*8+bitIndex,isHost=index>=selected.bits,isAddressBit=index<24;return `<i class="bit-${bit} ${isHost?'host-part':'network-part'}${index===selected.bits?' host-start':''}${isAddressBit?' address-example':''}">${bit}</i>`;}).join('')}</span>`).join('')}</div><p class="mask-bit-explainer"><strong>IP</strong> = valore binario dell’esempio <span>·</span> <strong>maschera</strong>: 1 rete, 0 host</p>`;
      conceptVisual.classList.add('mask-visual');
      if(concept===1){
        conceptVisual.innerHTML=`${selector}<div class="mask-current"><small>PREFISSO / MASCHERA</small><strong>${selected.prefix} · ${selected.mask}</strong></div>${split}${bits}`;
      }else{
        const firstHost=selected.bits<31?ReteZero.address(range.network+1):ReteZero.address(range.network),lastHost=selected.bits<31?ReteZero.address(range.broadcast-1):ReteZero.address(range.broadcast),hostRange=selected.bits<31?`${firstHost} – ${lastHost}`:selected.bits===31?`${firstHost} – ${lastHost} · P2P`:`${firstHost} · indirizzo singolo`;
        conceptVisual.innerHTML=`${selector}<div class="mask-current"><small>MASCHERA SELEZIONATA</small><strong>${selected.prefix} · ${selected.mask}</strong></div>${split}${bits}<div class="mask-host-summary"><span>Indirizzi nel blocco<strong>${selected.total}</strong></span><span>Host utilizzabili<strong>${selected.usable}</strong></span><span>Intervallo host<strong>${hostRange}</strong></span></div>`;
      }
      conceptVisual.querySelectorAll('.mask-selector button').forEach(button=>button.addEventListener('click',()=>{selectedMask=button.dataset.mask;renderMaskVisual();updateMaskExample();}));
    }
    function renderConcept(){const [title,body]=lesson.paragraphs[concept];$('concept-title').textContent=title;renderConceptBody(body);$('concept-count').textContent=`${concept+1} / ${lesson.paragraphs.length}`;$('concept-dots').textContent=lesson.paragraphs.map((_,i)=>i===concept?'●':'○').join(' ');$('concept-prev').disabled=concept===0;$('concept-next').disabled=concept===lesson.paragraphs.length-1;conceptVisual.hidden=!((lesson.binaryExample&&concept===1)||(lesson.maskVisual&&concept>0)||(lesson.subnetVisual&&concept===1));if(lesson.maskVisual)renderMaskVisual();if(lesson.subnetVisual&&concept===1)renderSubnetVisual();}
    $('concept-prev').addEventListener('click',()=>{concept=Math.max(0,concept-1);renderConcept();});$('concept-next').addEventListener('click',()=>{concept=Math.min(lesson.paragraphs.length-1,concept+1);renderConcept();});renderConcept();
    bindSchoolViews();
    const example=lesson.example;const workedExample=document.querySelector('.worked-example');workedExample.innerHTML=`<div><span class="eyebrow">ESEMPIO / ${example.title}</span><strong>${example.value}</strong></div><div class="example-result">${example.rows.map(([label,value])=>`<span>${label}<strong>${value}</strong></span>`).join('')}</div>`;if(lesson.maskVisual){workedExample.dataset.dynamicMask='true';updateMaskExample();}
    function showSchoolCompletion(){
      badge.querySelector('strong').textContent=hasBadgeProfile()?'Tesserino ottenuto':'Formazione completata';
      badge.querySelector('small').textContent=hasBadgeProfile()?'Pronto per il primo intervento.':'Configura il tesserino per operare.';
      $('practice-next').replaceChildren(
        makeButton('Apri il tesserino',()=>openBuilding('hq'),'primary next-activity action-triangle')
      );
    }
    function completeLesson(){
      const wasGraduated=graduated();
      if(!state.studied.includes(lesson.id))state.studied.push(lesson.id);
      save();
      renderShell();
      document.querySelector('.practice-status').textContent='SUPERATA ✓';
      document.querySelector('.school-seal strong').textContent=`${state.studied.length} / ${lessons.length}`;
      document.querySelectorAll('.course-button')[activeLesson].firstChild.textContent='✓';
      if(graduated()){
        showSchoolCompletion();
        if(!wasGraduated)scheduleSchoolMessage($('practice-next'),graduationMessage);
      }else{
        $('practice-next').replaceChildren(makeButton('Continua',()=>{
          activeLesson=lessons.findIndex(l=>!state.studied.includes(l.id));
          renderSchool();
        },'primary next-activity action-triangle'));
      }
    }
    if(graduated())showSchoolCompletion();
    if(lesson.terminal){renderTrainingTerminal(lesson,completeLesson);}else{
      appendFields($('practice-fields'),lesson.fields,state.lessonDrafts[lesson.id]);
      const calculator=$('practice-calculator');calculator.hidden=!lesson.calculatorExample;calculator.addEventListener('click',()=>openCalculator(lesson.calculatorExample));
      $('practice-form').addEventListener('submit',event=>{event.preventDefault();rememberLesson();const result=practice(activeLesson,state.lessonDrafts[lesson.id]);const feedback=$('practice-feedback');feedback.className='feedback '+(result.ok?'success':'error');feedback.textContent=result.message;if(result.ok)completeLesson();});
    }
  }
  function setupCommandHistory(input, history){
    let position=history.length;
    let draft='';
    input.addEventListener('keydown',event=>{
      if(event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
      if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
      if(!history.length)return;
      event.preventDefault();
      event.stopPropagation();
      const next=Math.max(0,Math.min(history.length,position+(event.key==='ArrowUp'?-1:1)));
      if(next===position)return;
      if(position===history.length)draft=input.value;
      position=next;
      input.value=position===history.length?draft:history[position];
      input.setSelectionRange(input.value.length,input.value.length);
    });
    return command=>{
      history.push(command);
      position=history.length;
      draft='';
    };
  }
  function renderTrainingTerminal(lesson,onComplete){
    const form=$('practice-form'),fields=$('practice-fields'),calculator=$('practice-calculator'),feedback=$('practice-feedback');calculator.hidden=true;fields.className='training-terminal';fields.replaceChildren();
    const screen=document.createElement('div');screen.className='terminal-screen';screen.setAttribute('aria-live','polite');
    const terminalRevision=lesson.id==='cli'?4:2;
    const saved=state.lessonDrafts[lesson.id]&&typeof state.lessonDrafts[lesson.id]==='object'?state.lessonDrafts[lesson.id]:{};let step=saved.terminalRevision===terminalRevision?Math.min(Number(saved.terminalStep)||0,lesson.terminal.steps.length):0;
    for(let i=0;i<step;i++){const command=document.createElement('p');command.className='terminal-command';command.textContent=lesson.terminal.steps[i].prompt+lesson.terminal.steps[i].command;screen.append(command);if(lesson.terminal.steps[i].response){const response=document.createElement('p');response.textContent=lesson.terminal.steps[i].response;screen.append(response);}}
    const prompt=document.createElement('label');prompt.className='terminal-prompt';const promptText=document.createElement('span');promptText.setAttribute('aria-hidden','true');promptText.textContent=lesson.terminal.steps[step]?.prompt||lesson.terminal.steps.at(-1).prompt;prompt.append(promptText);const input=document.createElement('input');input.name='command';input.autocomplete='off';input.spellcheck=false;input.placeholder=step<lesson.terminal.steps.length?'Digita un comando':'';input.disabled=step>=lesson.terminal.steps.length;prompt.append(input);fields.append(screen,prompt);
    const question=$('practice-question');
    question.setAttribute('aria-live','polite');
    function updateInstruction(){
      const current=lesson.terminal.steps[step];
      const completedTitle=lesson.id==='cli-router'?'Configurazione del router completata.':'Configurazione del PC completata.';
      question.textContent=current?.goal||completedTitle;
      if(!current)feedback.textContent=lesson.explanation;
      else feedback.textContent=`Passaggio ${step+1} di ${lesson.terminal.steps.length}`;
    }
    const submit=form.querySelector('[type="submit"]');submit.textContent='Esegui';submit.disabled=input.disabled;updateInstruction();
    const history=Array.isArray(saved.terminalHistory)&&saved.terminalRevision===terminalRevision
      ? saved.terminalHistory.filter(command=>typeof command==='string'&&command.trim())
      : lesson.terminal.steps.slice(0,step).map(({command})=>command);
    const rememberCommand=setupCommandHistory(input,history);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const raw=input.value.trim();
      const expected=lesson.terminal.steps[step];
      if(!expected)return;
      if(raw)rememberCommand(raw);
      const value=raw.toLowerCase().replace(/\s+/g,' ');
      const accepted=value===expected.command||expected.aliases?.includes(value);
      if(accepted)step++;
      state.lessonDrafts[lesson.id]={terminalStep:step,terminalRevision,terminalHistory:history};
      save();
      if(!accepted){
        feedback.className='feedback error';
        feedback.textContent=`Riprova. Obiettivo ${step+1}: ${expected.goal}`;
        input.focus({preventScroll:true});
        return;
      }
      const command=document.createElement('p');
      command.className='terminal-command';
      command.textContent=expected.prompt+raw;
      screen.append(command);
      if(expected.response){
        const response=document.createElement('p');
        response.textContent=expected.response;
        screen.append(response);
      }
      promptText.textContent=lesson.terminal.steps[step]?.prompt||lesson.terminal.steps.at(-1).prompt;
      input.value='';
      screen.scrollTop=screen.scrollHeight;
      updateInstruction();
      if(step===lesson.terminal.steps.length){
        input.disabled=true;
        submit.disabled=true;
        input.placeholder='';
        feedback.className='feedback success';
        feedback.textContent=lesson.explanation;
        onComplete();
      }else{
        input.placeholder='Digita un comando';
        feedback.className='feedback';
        input.focus();
      }
    });
  }
  function rememberLesson(){const lesson=lessons[activeLesson],form=$('practice-form');if(form&&!lesson.terminal){state.lessonDrafts[lesson.id]=Object.fromEntries(new FormData(form));save();}}
  function appendFields(container,fields,draft={}){
    fields.forEach(field=>{const hasChoices=Boolean(field.choices||field.options),saved=typeof draft?.[field.key]==='string'?draft[field.key]:(hasChoices?'':(field.value??''));
      if(hasChoices){
        const group=document.createElement('div'),title=document.createElement('span');
        const grid=document.createElement('div'),input=document.createElement('input');
        const options=field.choices||field.options;
        group.className='field-group';
        title.className='field-label';
        title.textContent=field.label;
        grid.className='choice-grid';
        grid.style.setProperty('--choice-count',String(options.length));
        grid.setAttribute('role','radiogroup');
        grid.setAttribute('aria-label',field.label);
        input.type='hidden';
        input.name=field.key;
        input.value=saved;
        const buttons=options.map(value=>{
          const button=document.createElement('button');
          button.type='button';
          button.className='choice-option';
          button.dataset.value=value;
          button.textContent=field.options?'/'+value:value;
          button.setAttribute('role','radio');
          button.addEventListener('click',()=>{
            input.value=value;
            input.dispatchEvent(new Event('change',{bubbles:true}));
          });
          return button;
        });
        const sync=()=>{
          const checked=buttons.find(button=>button.dataset.value===input.value);
          for(const button of buttons){
            const active=button===checked;
            button.classList.toggle('selected',active);
            button.setAttribute('aria-checked',String(active));
            button.tabIndex=button===(checked||buttons[0])?0:-1;
          }
        };
        grid.addEventListener('keydown',event=>{
          const offset={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
          const index=buttons.indexOf(event.target);
          if(!offset||index<0)return;
          event.preventDefault();
          const next=buttons[(index+offset+buttons.length)%buttons.length];
          next.click();
          next.focus();
        });
        input.addEventListener('change',sync);
        grid.append(...buttons);
        group.append(title,input,grid);
        container.append(group);
        sync();
        return;
      }
      const label=document.createElement('label'),input=document.createElement('input');label.textContent=field.label;input.type=field.type||'text';input.placeholder=field.placeholder||'';input.autocomplete='off';input.spellcheck=false;if(input.type==='number'){input.min='0';input.step='1';}else input.inputMode='decimal';input.name=field.key;input.value=saved;label.append(input);container.append(label);
    });
  }
  function setupMunicipalRouter(index, config, allowed){
    const {municipalPorts,ipv4,address}=ReteZero;
    const ports=config.ports;
    const panel=$('mission-fields');
    const promptLabel=document.querySelector('.mission-terminal-form label span');
    let mode='user', selected;
    const prompt=()=> (config.hostname||'Router')+{user:'>',privileged:'#',global:'(config)#',port:'(config-if)#'}[mode];
    panel.innerHTML=`
      <label>
        <span class="municipal-port-heading">
          <span id="municipal-port-ip-label">Indirizzo IP</span>
          <span class="municipal-port-badges">
            <span id="municipal-port-caption" role="status">Porta —</span>
            <span id="municipal-port-state" role="status">OFF</span>
          </span>
        </span>
        <input id="municipal-port-ip" aria-labelledby="municipal-port-ip-label" readonly placeholder="—">
      </label>
      <label>Subnet mask<input id="municipal-port-mask" readonly placeholder="—"></label>
      <label>Gateway del reparto<input id="municipal-port-gateway" readonly placeholder="—"></label>
      <label>Server DNS<input name="dns" value="0.0.0.0" readonly></label>
    `;
    const portCaption=$('municipal-port-caption');
    const portIp=$('municipal-port-ip');
    const portMask=$('municipal-port-mask');
    const portGateway=$('municipal-port-gateway');
    const status=$('municipal-port-state');
    function renderPort(){
      const port=ports[selected];
      const caption=selected?'Porta '+selected.replace('GigabitEthernet','Gi'):'Porta —';
      if(portCaption.textContent!==caption)portCaption.textContent=caption;
      portIp.value=port?.ip||'';
      portMask.value=port?.mask||'';
      portGateway.value=portIp.value;
      const enabled=port?.enabled===true;
      status.classList.toggle('is-on',enabled);
      const stateText=enabled?'ON':'OFF';
      if(status.textContent!==stateText)status.textContent=stateText;
      promptLabel.textContent=prompt();
    }
    renderPort();
    return (raw,print)=>{
      print(raw,true,prompt());
      const command=raw.toLowerCase().replace(/\s+/g,' ');
      const iface=/^(?:interface|int) (?:gi|gigabitethernet) ?0\/([0-3])$/.exec(command);
      const ipCommand=/^ip address (\S+) (\S+)$/.exec(command);
      if(!allowed){print('Completa prima il percorso richiesto.');return;}
      if(command==='enable'&&mode==='user')mode='privileged';
      else if(['configure terminal','configur terminal','conf terminal','conf t'].includes(command)){
        if(mode==='user'){
          print('% Digita prima enable. Quando compare Router#, puoi entrare in configurazione.');
          return;
        }
        if(mode!=='privileged'){
          print('% Comando non valido in questa modalità.');
          return;
        }
        mode='global';
      }
      else if(iface&&(mode==='global'||mode==='port')){
        selected=municipalPorts[Number(iface[1])].name;
        mode='port';
      }else if(command==='exit'&&mode==='port')mode='global';
      else if((command==='exit'&&mode==='global')||(command==='end'&&(mode==='global'||mode==='port')))mode='privileged';
      else if(command==='disable'&&mode==='privileged')mode='user';
      else if(mode==='global'&&/^hostname [a-z][a-z0-9-]{0,31}$/i.test(raw))config.hostname=raw.split(/\s+/)[1];
      else if(ipCommand&&mode==='port'){
        const ip=ipv4(ipCommand[1]),mask=ipv4(ipCommand[2]);
        if(ip===null||mask===null||!/^1*0*$/.test(mask.toString(2).padStart(32,'0'))){
          print('% Indirizzo IPv4 o maschera non valida.');
          return;
        }
        const nextIp=address(ip),nextMask=address(mask);
        if(ports[selected]?.ip!==nextIp||ports[selected]?.mask!==nextMask)config.routerStep=0;
        ports[selected]={...ports[selected],ip:nextIp,mask:nextMask};
      }else if((command==='no shutdown'||command==='shutdown')&&mode==='port'){
        const enabled=command==='no shutdown';
        if(Boolean(ports[selected]?.enabled)!==enabled)config.routerStep=0;
        ports[selected]={...ports[selected],enabled};
      }else if(command==='show ip interface brief'&&mode==='privileged'){
        const lines=municipalPorts.map(({name})=>{
          const port=ports[name],status=port?.enabled?'up':'administratively down';
          return name.padEnd(22)+(port?.ip||'unassigned').padEnd(17)+status.padEnd(23)+(port?.enabled?'up':'down');
        });
        print(['Interface             IP-Address       Status                 Protocol',...lines].join('\n'));
        const result=ReteZero.verify(index,config);
        if(result.ok)config.routerStep=Math.max(2,config.routerStep??0);
        const feedback=$('mission-feedback');
        feedback.className=result.ok?'feedback':'feedback error';
        feedback.textContent=result.ok?'Porte controllate. Premi «Applica e verifica» per concludere.':result.message;
      }else{print('% Comando non valido in questa modalità.');return;}
      renderPort();
      updateMissionChecklist(index);
      save();
    };
  }
  function hostMissionStep(index){
    const draft=state.drafts[index];
    return draft?.hostStep ?? (index===0 ? draft?.hospitalStep ?? 0 : 0);
  }
  function updateMissionChecklist(index){
    const list=$('mission-steps');
    if(!list)return;
    const config=state.drafts[index];
    const completed=index===0&&state.completed>0 ? list.children.length : hostMissionStep(index);
    let routerChecks;
    if(index===2){
      const portChecks=ReteZero.municipalPorts.map((_,portIndex)=>
        ReteZero.verifyMunicipalPort(config?.ports,portIndex).ok);
      const allPortsReady=portChecks.every(Boolean);
      const routerStep=config?.routerStep??0;
      routerChecks=[...portChecks,allPortsReady&&routerStep>=2,allPortsReady&&routerStep>=3];
    }
    Array.from(list.children).forEach((item,stepIndex)=>{
      const done=routerChecks ? routerChecks[stepIndex] : stepIndex<completed;
      const status=item.firstElementChild;
      status.textContent=done?'✓':'';
      status.setAttribute('aria-label',done?'Completato':'Da completare');
      item.classList.toggle('is-complete',done);
    });
  }
  function setupMissionTerminal(index,allowed,routerCommand){
    const terminalForm=document.querySelector('.mission-terminal-form'),output=document.querySelector('.mission-terminal-output'),configForm=$('mission-form'),input=terminalForm.elements.command;
    const logs=state.missionLogs??=[];
    const savedLog=logs[index];
    const log=logs[index]=Array.isArray(savedLog)
      ? savedLog.filter(entry=>entry&&typeof entry.message==='string'&&typeof entry.isCommand==='boolean')
      : [];
    const history=log.filter(entry=>entry.isCommand).map(entry=>entry.message);
    const appendLine=({message,isCommand,prompt})=>{
      const line=document.createElement('p');
      line.className=isCommand?'terminal-command':'';
      line.textContent=isCommand?(prompt||'C:\\>')+' '+message:message;
      output.append(line);
    };
    const scrollToLatest=()=>{output.scrollTop=output.scrollHeight;};
    log.forEach(appendLine);
    const terminal=output.closest('details');
    terminal.addEventListener('toggle',scrollToLatest);
    terminal.querySelector('summary').addEventListener('click',()=>{
      if(terminal.open)return;
      requestAnimationFrame(()=>{
        if(terminal.open&&input.isConnected)input.focus({preventScroll:true});
      });
    });
    if(log.length){
      terminal.open=true;
    }else if(index<2&&index<state.completed){
      const saved=state.drafts[index];
      if(saved&&ReteZero.verify(index,saved).ok){
        const {mask}=ReteZero.calculate(saved.ip,Number(saved.prefix));
        const args=[saved.ip,mask];
        if(saved.gateway)args.push(saved.gateway);
        if(saved.gateway&&saved.dns&&saved.dns!=='0.0.0.0')args.push(saved.dns);
        const command='ipconfig '+args.join(' ');
        appendLine({message:command,isCommand:true});
        history.push(command);
        terminal.open=true;
      }
    }
    const rememberCommand=setupCommandHistory(input,history);
    const print=(message,isCommand=false,prompt)=>{
      const entry={message,isCommand,prompt};
      log.push(entry);
      appendLine(entry);
      scrollToLatest();
      save();
    };
    const setField=(name,value)=>{
      const field=configForm.elements.namedItem(name);
      field.value=value;
      field.dispatchEvent(new Event('change',{bubbles:true}));
    };
    terminalForm.addEventListener('submit',event=>{
      event.preventDefault();
      input.focus({preventScroll:true});
      const raw=input.value.trim();
      if(!raw)return;
      rememberCommand(raw);
      input.value='';
      if(routerCommand){routerCommand(raw,print);return;}
      print(raw,true);
      const [name,ip,mask,gateway,dns,...extra]=raw.toLowerCase().split(/\s+/);
      if(name==='ipconfig'&&(!ip||(ip==='/all'&&!mask))){
        const data=Object.fromEntries(new FormData(configForm));
        const info=ReteZero.calculate(data.ip,Number(data.prefix));
        print([
          'FastEthernet0 Connection:(default port)',
          '',
          '   IPv4 Address....................: '+(data.ip||'0.0.0.0'),
          '   Subnet Mask.....................: '+(data.prefix?info?.mask||'0.0.0.0':'0.0.0.0'),
          '   Default Gateway.................: '+(data.gateway||'0.0.0.0'),
          ...(ip==='/all'?['   DNS Servers.....................: '+(data.dns||'0.0.0.0')]:[])
        ].join('\n'));
        if(allowed&&ip==='/all'&&hostMissionStep(index)===1){
          state.drafts[index].hostStep=2;
          save();
          updateMissionChecklist(index);
          const feedback=$('mission-feedback');
          feedback.className='feedback';
          feedback.textContent='Configurazione controllata. Premi «Applica e verifica» per concludere.';
        }
        return;
      }
      const prefix=[24,25,26,27].find(bits=>ReteZero.calculate('0.0.0.0',bits).mask===mask);
      if(name!=='ipconfig'||extra.length||prefix===undefined||!ReteZero.calculate(ip,prefix)
        ||(gateway&&!ReteZero.calculate(gateway,24))
        ||(dns&&!ReteZero.calculate(dns,24))){
        print('Invalid Command.');
        return;
      }
      if(!allowed){print('Completa prima il percorso richiesto.');return;}
      setField('ip',ip);
      setField('prefix',String(prefix));
      if(gateway)setField('gateway',gateway);
      if(dns)setField('dns',dns);
      const config=Object.fromEntries(new FormData(configForm));
      const result=ReteZero.verify(index,config);
      state.drafts[index]={...config,hostStep:result.ok?1:0};
      save();
      updateMissionChecklist(index);
      const feedback=$('mission-feedback');
      feedback.className=result.ok?'feedback':'feedback error';
      feedback.textContent=result.ok?'Configurazione impostata. Controllala con ipconfig /all.':result.message;
    });
  }
  function setupMissionHint(){
    const hintButton=$('mission-hint');
    const hintText=$('mission-hint-text');
    hintButton.addEventListener('click',()=>{
      const expanded=hintText.hidden;
      hintText.hidden=!expanded;
      hintButton.setAttribute('aria-expanded',String(expanded));
      const label=expanded?'Nascondi indizio':'Mostra indizio';
      hintButton.setAttribute('aria-label',label);
      hintButton.title=label;
    });
  }
  function missionHeader({eyebrow,title,story,reference,done}){
    return `<div class="building-hero mission-hero"><div><p class="eyebrow">${eyebrow}</p><h2 id="building-title">${title}</h2><p>${story}</p></div><div class="mission-hero-tools"><div class="incident-badge ${done?'repaired':''}"><span>${done?'✓':'!'}</span><strong>${done?'COLLEGAMENTO RIPRISTINATO':'SEGNALAZIONE APERTA'}</strong><small>${reference}</small></div><button id="mission-phone" class="icon-button" type="button" aria-label="Apri i messaggi di Elena" title="Messaggi di Elena" aria-haspopup="dialog"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="#b5d9c4"><path transform="translate(24 0) scale(-1 1)" d="M5.1 3.5c.8-.6 1.9-.5 2.5.3l2.6 3.4c.5.7.5 1.6-.1 2.2l-1.6 1.7a14 14 0 0 0 4.4 4.4l1.7-1.6c.6-.6 1.5-.6 2.2-.1l3.4 2.6c.8.6.9 1.7.3 2.5l-1 1.2c-.8.9-2 1.3-3.1 1C9.7 19.4 4.6 14.3 2.9 7.6c-.3-1.1.1-2.3 1-3.1z"/></svg></button></div></div>`;
  }
  function renderMission(site){
    const index=site.mission,mission=missions[index],allowed=canEnterMission(index,state.completed,state.studied),done=index<state.completed;
    $('building-content').innerHTML=`${missionHeader({
      eyebrow:'EPISODIO '+String(index+1).padStart(2,'0')+' / '+site.name,
      title:mission.title+'.',
      story:mission.story,
      reference:'PRATICA VN–0'+(index+1)+' · '+mission.topic,
      done
    })}<div class="intervention-layout"><aside class="ticket-panel"><div class="config-heading"><div><span class="eyebrow">ISTRUZIONI</span><h3>Scheda tecnica</h3></div><button id="mission-hint" class="icon-button" type="button" aria-label="Mostra indizio" title="Mostra indizio" aria-expanded="false" aria-controls="mission-hint-text">?</button><p id="mission-hint-text" class="hint" hidden></p></div><div id="mission-evidence" class="evidence"></div><div class="topology" role="group" aria-label="Collegamento dei dispositivi di rete"><span><img src="assets/icons/${index===1?'radio':'pc'}.png" alt="" width="72" height="72">${index===1?'RADIO MOBILE':'PC'}</span><i class="topology-${index===1?'radio-wave':'cable'}" role="img" aria-label="${index===1?'Collegamento radio':'Collegamento Ethernet'}"></i><span><img src="assets/icons/switch.png" alt="" width="72" height="72">SWITCH</span><i class="topology-cable" role="img" aria-label="Collegamento Ethernet"></i><span><img src="assets/icons/router.png" alt="" width="72" height="72">ROUTER</span></div>${mission.steps ? `<ul class="mission-steps" id="mission-steps" role="list" aria-label="Passaggi dell’intervento">${mission.steps.map(step => `<li><span class="mission-step-status" role="img"></span><span>${step}</span></li>`).join('')}</ul>` : `<div class="ticket-note">${index===2?'Progetta prima le sottoreti, poi verifica gli intervalli.':'Controlla gli indirizzi prima di sostituire apparati funzionanti.'}</div>`}</aside><section class="configuration"><div class="config-heading"><div><span class="eyebrow">${'CONFIGURAZIONE DI RETE'}</span><h3>${index===1?'Radio mobile / Squadra Nord':index===2?'Router / Municipio':'Terminale / Pronto soccorso'}</h3></div><span class="onsite">SIMULAZIONE</span></div><div id="mission-lock"></div><div class="mission-workspace with-prompt"><form id="mission-form"><div id="mission-fields" class="fields"></div></form><details class="mission-cli"><summary>${index===2?'Usa il prompt del router':'Usa il prompt del PC'}</summary><div class="mission-terminal-output" aria-live="polite"></div><form class="mission-terminal-form"><label><span>C:\\&gt;</span><input name="command" autocomplete="off" spellcheck="false" placeholder="Digita un comando"></label><button type="submit">Esegui</button></form></details></div><div id="mission-feedback" role="status" class="feedback">${done?'Intervento già completato. Puoi rivedere e provare una configurazione.':'Le modifiche riguardano soltanto la simulazione.'}</div><div id="mission-next"></div><div class="practice-actions mission-actions"><button class="secondary" id="mission-calculator" type="button">Banco di calcolo</button><button class="primary" id="verify-mission" type="submit" form="mission-form">Applica e verifica <span aria-hidden="true">▸</span></button></div></section></div>`;
    if(mission.steps)updateMissionChecklist(index);
    $('mission-phone').addEventListener('click', ()=>openPhone());
    $('mission-evidence').replaceChildren(...mission.evidence.map(text=>Object.assign(document.createElement('span'),{textContent:text})));
    appendFields($('mission-fields'),mission.fields,state.drafts[index]);$('mission-hint-text').textContent=mission.hint;
    setupMissionHint();
    $('mission-calculator').addEventListener('click',()=>openCalculator({ip:index===0?'192.168.10.20':index===1?'192.168.20.70':'192.168.30.77',prefix:index===0?24:26}));
    if(index<2){
      const dns=$('mission-form').elements.namedItem('dns');
      dns.value||='0.0.0.0';
      const prefix=$('mission-form').elements.namedItem('prefix');
      const maskLabel=document.createElement('label');
      const mask=document.createElement('input');
      maskLabel.textContent='Subnet mask';
      if(!prefix.value)prefix.value=mission.fields.find(field=>field.key==='prefix').value;
      const storedPrefix=prefix.cloneNode();
      prefix.parentElement.replaceWith(maskLabel);
      maskLabel.append(mask,storedPrefix);
      const renderMask=()=>{mask.value=ReteZero.calculate('0.0.0.0',Number(storedPrefix.value))?.mask||'';};
      storedPrefix.addEventListener('change',renderMask);
      renderMask();
      setupMissionTerminal(index,allowed);
    }else{
      const config=state.drafts[index]??={};
      config.ports??={};
      setupMissionTerminal(index,allowed,setupMunicipalRouter(index,config,allowed));
    }
    $('mission-fields').querySelectorAll('input:not([type="hidden"])').forEach(field=>{
      field.readOnly=true;
      field.tabIndex=-1;
    });
    if(!allowed){const lock=$('mission-lock');lock.className='lock-notice';const text=document.createElement('p');text.textContent=!graduated()?`Prima di intervenire completa le ${lessons.length} prove della scuola e ottieni il tesserino da tecnico.`:'Questo intervento segue quello della sede precedente. Puoi consultare la scheda, poi tornare alla missione aperta.';lock.append(text,makeButton(!graduated()?'Vai alla scuola →':'Apri l’intervento precedente →',()=>openBuilding(!graduated()?'school':buildings.find(b=>b.mission===state.completed).id),'secondary'));$('verify-mission').disabled=true;}
    $('mission-form').addEventListener('submit',event=>{
      event.preventDefault();
      if(!canEnterMission(index,state.completed,state.studied))return;
      const config=state.drafts[index]??Object.fromEntries(new FormData(event.currentTarget));
      const result=ReteZero.verify(index,config);
      const feedback=$('mission-feedback');
      if(result.ok&&index===2&&(config.routerStep??0)<2){
        feedback.className='feedback error';
        feedback.textContent='Controlla le porte con show ip interface brief prima di concludere.';
        return;
      }
      if(result.ok&&index<2&&!(index===0&&done)&&hostMissionStep(index)<2){
        feedback.className='feedback error';
        feedback.textContent=hostMissionStep(index)===1?'Esegui ipconfig /all per controllare la configurazione prima di concludere.':'Prima imposta la configurazione dal prompt.';
        return;
      }
      feedback.className='feedback '+(result.ok?'success':'error');
      feedback.textContent=result.message;
      if(!result.ok)return;
      if(index===2)config.routerStep=3;
      else state.drafts[index]={...config,hostStep:3};
      const fresh=state.completed===index;state.completed=Math.max(state.completed,index+1);if(fresh)state.fieldStage=0;save();renderShell();document.querySelector('.incident-badge').classList.add('repaired');document.querySelector('.incident-badge>span').textContent='✓';document.querySelector('.incident-badge strong').textContent='COLLEGAMENTO RIPRISTINATO';
      if(mission.steps)updateMissionChecklist(index);
      const mapButton=makeButton('Vai alla mappa',closeBuilding,'primary');
      const triangle=document.createElement('span');
      triangle.setAttribute('aria-hidden','true');
      triangle.textContent='▸';
      mapButton.append(triangle);
      $('verify-mission').replaceWith(mapButton);
      mapButton.focus({preventScroll:true});
    });
  }
  function badgePortrait(avatar){
    const file=avatars[avatar].file;
    return `<img src="assets/${file}" alt="" width="256" height="256">`;
  }
  function renderBadgeAwards(){
    const awards = [
      {label:'Tecnico di base', image:'base', earned:graduated(), requirement:'Completa la scuola'},
      {label:'Tecnico operativo', image:'operativo', earned:state.completed>=missions.length, requirement:`Completa tutti gli interventi · ${state.completed}/${missions.length}`},
      {label:'Tecnico specialista', image:'specialista', earned:Boolean(state.routing?.complete), requirement:'Ripristina il collegamento tra le sedi'},
      {label:'Tecnico di distretto', image:'distretto', earned:false, requirement:'Prossime attività'}
    ];
    return awards.map(({label,image,earned,requirement}) => {
      return `<li class="badge-award${earned?' earned':''}">
        <img class="badge-award-mark" src="assets/medaglia-${image}.png" alt="" width="56" height="56">
        <span><strong>${label}</strong><small>${earned?'Ottenuta':requirement}</small></span>
      </li>`;
    }).join('');
  }
  const hasBadgeProfile=()=>Boolean(state.badgeName&&state.badgeAge&&state.avatar);
  function renderHeadquarters(editing=false){
    const isNew=graduated()&&!hasBadgeProfile();
    const showSettings=isNew||editing;
    const cardTag=showSettings?'form':'section';
    const nextMission=awaitingDispatch()?null:missions[state.completed];
    $('building-content').innerHTML=`<header class="badge-heading">
      <p class="eyebrow">CENTRALE OPERATIVA / VALLE NORD</p>
      <div class="badge-title-row"><h2 id="building-title">Il tuo tesserino</h2>${showSettings?'':'<button type="button" id="badge-settings" class="secondary">Impostazioni</button>'}</div>
    </header>
    <div class="badge-layout${showSettings?' badge-layout-editing':''}">
      <${cardTag} class="technician-card credential" aria-label="Tesserino personale" ${showSettings?'id="badge-setup"':''}>
        <div class="card-top"><span>SERVIZI DI RETE · VALLE NORD</span><span>VN–041</span></div>
        <div class="card-person">
          <div class="credential-portrait">
            <div class="credential-photo" id="badge-photo"></div>
            ${showSettings?`<div class="badge-portrait-controls">
              <button type="button" id="badge-avatar-prev" aria-label="Avatar precedente">‹</button>
              <span id="badge-avatar-position" aria-live="polite"></span>
              <button type="button" id="badge-avatar-next" aria-label="Avatar successivo">›</button>
            </div>`:''}
          </div>
          <div class="badge-identity">
            ${showSettings?`<div class="badge-identity-fields">
              <label>Nome <input name="badgeName" maxlength="40" required autocomplete="off" placeholder="Nome del personaggio"></label>
              <label>Età <input name="badgeAge" type="number" min="1" max="120" required></label>
            </div>`:'<small>TITOLARE</small><h3 id="badge-holder"></h3><p id="badge-age"></p>'}
            <p id="badge-role"></p>
          <p>${graduated()?'Abilitazione agli interventi del distretto.':'Formazione presso l’Istituto Galilei.'}</p></div>
        </div>
        <div class="card-stats">
          <span><strong>${state.studied.length}/${lessons.length}</strong>PROVE SCUOLA</span>
          <span><strong>${state.completed}/${missions.length}</strong>INTERVENTI</span>
          <span><strong>${xp()}</strong>XP</span>
        </div>
        ${showSettings?`<div class="badge-setup-actions">
          ${isNew?'':'<button type="button" id="badge-cancel" class="secondary">Annulla</button>'}
          <button type="submit" class="primary">${isNew?'Ottieni il tesserino':'Salva modifiche'}</button>
        </div>`:''}
      </${cardTag}>
      ${showSettings?'':`<section class="badge-options" aria-label="Medaglie di competenza">
        <h3 class="eyebrow badge-awards-title">MEDAGLIE DI COMPETENZA</h3>
        <ul class="badge-awards">${renderBadgeAwards()}</ul>
      </section>`}
      ${showSettings?'':`<section class="badge-next">
        <div><span class="eyebrow">IL PROSSIMO PASSO</span>
        <h3>${!graduated()?'Scuola di reti':awaitingDispatch()?'Mappa di Valle Nord':nextMission?nextMission.site:'Primo distretto completato'}</h3>
        <p>${!graduated()?'Completa la formazione per ottenere l’abilitazione.':awaitingDispatch()?'Torna in città e attendi le indicazioni di Elena.':nextMission?nextMission.title:'Le tre sedi di Valle Nord sono di nuovo collegate.'}</p></div>
        <div id="hq-action"></div>
      </section>`}
    </div>`;
    function updateBadgePreview(name,age,avatar){
      if(!showSettings){
        $('badge-holder').textContent=name||'Nome del personaggio';
        $('badge-age').textContent=age?`${age} anni`:'';
      }
      const portrait=$('badge-photo');
      if(portrait.dataset.avatar!==avatar){
        portrait.dataset.avatar=avatar;
        portrait.innerHTML=avatar?badgePortrait(avatar):'<span>FOTO</span>';
      }
      const district=state.completed===missions.length?' del distretto':' di rete';
      $('badge-role').textContent=graduated()
        ? (avatars[avatar]?.role||'Tecnico')+district
        : 'Apprendista';
    }
    updateBadgePreview(state.badgeName,state.badgeAge,state.avatar||'');
    if(showSettings){
      const form=$('badge-setup');
      const name=form.elements.badgeName,age=form.elements.badgeAge;
      const avatarIds=Object.keys(avatars);
      let avatarIndex=Math.max(0,avatarIds.indexOf(state.avatar));
      function selectAvatar(offset){
        avatarIndex=(avatarIndex+offset+avatarIds.length)%avatarIds.length;
        $('badge-avatar-position').textContent=`${avatarIndex+1} / ${avatarIds.length}`;
        updateBadgePreview(null,null,avatarIds[avatarIndex]);
      }
      $('badge-avatar-prev').addEventListener('click',()=>selectAvatar(-1));
      $('badge-avatar-next').addEventListener('click',()=>selectAvatar(1));
      selectAvatar(0);
      name.value=state.badgeName||'';
      age.value=state.badgeAge??'';
      name.addEventListener('input',()=>name.setCustomValidity(''));
      form.addEventListener('submit',event=>{
        event.preventDefault();
        if(!name.value.trim()){
          name.setCustomValidity('Inserisci il nome del personaggio.');
          name.reportValidity();
          return;
        }
        state.badgeName=name.value.trim();
        state.badgeAge=age.valueAsNumber;
        state.avatar=avatarIds[avatarIndex];
        const firstBadge=!$('badge-cancel');
        save();
        renderShell();
        if(firstBadge){closeBuilding();scheduleDispatch();return;}
        renderHeadquarters();
        $('badge-settings').focus();
      });
      $('badge-cancel')?.addEventListener('click',()=>{
        renderHeadquarters();
        $('badge-settings').focus();
      });
      return;
    }
    $('badge-settings').addEventListener('click',()=>{
      renderHeadquarters(true);
      $('badge-setup').elements.badgeName.focus();
    });
    $('hq-action').append(makeButton(graduated()?'Vai alla mappa':'Entra nella scuola',()=>graduated()?closeBuilding():openBuilding('school'),'primary action-triangle'));
  }
  function addSchoolChapterNavigation(nav, active){
    const chapters=document.createElement('nav');
    chapters.className='school-chapters';
    chapters.setAttribute('aria-label','Capitoli del Galilei');
    ['Formazione di base','Oltre la rete locale'].forEach((title,index)=>{
      const chapter=index+1;
      const button=makeButton('',()=>{
        if(chapter===active)return;
        if(chapter===1){
          activeLesson=0;
          renderSchool();
        }else{
          renderRouting(true,0);
        }
        document.querySelector('.school-chapter-button[aria-current]').focus();
      },'school-chapter-button');
      button.dataset.chapter=chapter;
      if(chapter===active)button.setAttribute('aria-current','true');
      const label=document.createElement('span');
      label.textContent='Capitolo '+String(chapter).padStart(2,'0');
      const heading=document.createElement('strong');
      heading.textContent=title;
      button.append(label,heading);
      chapters.append(button);
    });
    nav.prepend(chapters);
  }
  const routingLessons=[
    {
      title:'Collegare due reti',
      concepts:[
        ['Dai un nome al router',[
          ['hostname <nome>','Assegna un nome al router. Per esempio, dopo hostname Galilei il prompt diventa Galilei(config)#.']
        ],'Quando lavori su due router, il nome nel prompt ti aiuta a capire quale stai configurando. Sul Router A, parti da Configurazione globale · Router(config)#.'],
        ['Configura le rotte',[
          ['ip route <rete> <maschera> <prossimo router>','Per raggiungere la rete del PC dall’altro lato, indica l’indirizzo di rete e la sua maschera. Inoltra i pacchetti all’IP dell’interfaccia del router vicino sul collegamento tra i due router.']
        ],'Il Router A deve sapere dove inoltrare i pacchetti per la rete del PC B. Anche il Router B ha bisogno di una rotta verso la rete del PC A, così la risposta può tornare. Imposta la rotta di ciascun router in Configurazione globale · Router(config)#.'],
        ['Verifica il collegamento',[
          ['ping <IP>','Dal prompt del PC A, usa l’indirizzo del PC B.']
        ],'Il PC A invia una richiesta al PC B. Se riceve una risposta, i pacchetti hanno percorso sia la strada di andata sia quella di ritorno.']
      ],
      example:['ROTTA STATICA','192.168.80.0/24','ip route 192.168.80.0 255.255.255.0 10.0.0.2','Prossimo router','10.0.0.2'],
      tip:'Apri la scheda tecnica per trovare le reti e gli indirizzi.'
    },
    {
      title:'Trovare il guasto',
      concepts:[
        ['Individua l’interruzione',[
          ['tracert <IP>','Dal prompt del PC A, usa l’indirizzo del PC B.']
        ],'Una traccia mostra i salti attraverso i router. Se la risposta non torna, il percorso della simulazione evidenzia il punto in cui si interrompe.'],
        ['Leggi la tabella',[
          ['show ip route','Mostra le reti direttamente connesse (C) e le rotte statiche (S).']
        ],'Confronta la tabella del router indicato con la rete che vuoi raggiungere. Per leggerla, parti dal prompt della modalità privilegiata (Router#).'],
        ['Correggi e riprova',[
          ['no ip route <rete> <maschera> <prossimo router>','Rimuove la rotta corrispondente ai valori che hai letto nella tabella.']
        ],'In Configurazione globale · Router(config)#, rimuovi la rotta errata e aggiungi quella corretta come nella prima lezione. Poi ripeti la traccia dal PC A per verificare che la risposta torni.']
      ],
      example:['RIMOZIONE DI UNA ROTTA','192.168.80.0/24','no ip route 192.168.80.0 255.255.255.0 10.0.0.2','Prossimo router','10.0.0.2'],
      tip:'La rete è già configurata. Prima di modificarla, osserva il percorso e confronta la tabella delle rotte con la scheda tecnica.'
    },
    {
      title:'Routing dinamico con RIP',
      concepts:[
        ['Attiva RIP',[
          ['router rip','In configurazione globale apre la modalità RIP (config-router)#.'],
          ['version 2','Seleziona RIPv2, che include le maschere negli aggiornamenti.'],
          ['no auto-summary','Disattiva il riepilogo automatico delle reti.']
        ],'In questo laboratorio tre router collegano due LAN. Con RIP ciascun router apprende le reti remote dagli altri router.'],
        ['Indica le reti collegate',[
          ['network <rete>','Abilita RIP sulle interfacce della rete indicata. Digita solo l’indirizzo della rete principale. Per il collegamento 10.30.0.0/30, usa network 10.0.0.0.']
        ],'La maschera si imposta sull’interfaccia. In questa prova gli indirizzi e le maschere delle interfacce sono già configurati.'],
        ['Controlla le rotte apprese',[
          ['show ip route','In modalità privilegiata cerca le righe R. In [120/2], 120 è la distanza amministrativa e 2 è il numero di salti RIP.'],
          ['ping <IP>','Dal PC A verifica che il PC B risponda.']
        ],'Le rotte appaiono quando i router lungo il percorso partecipano a RIP.']
      ],
      example:['RETE DIRETTAMENTE COLLEGATA','RIPv2','network 10.0.0.0','Sottorete dell’interfaccia','10.30.0.0/30'],
      tip:'Apri la scheda tecnica del router selezionato per trovare le reti da dichiarare con network.'
    }
  ];
  function setupRoutingLesson(lessonIndex,chapter){
    const nav=document.querySelector('.course-nav');
    addSchoolChapterNavigation(nav,2);
    routingLessons.forEach(({title},index)=>{
      const complete=[chapter.labConfigured||chapter.trained,chapter.diagnosisComplete||chapter.trained,chapter.ripComplete];
      const button=makeButton('',()=>{
        if(index===lessonIndex)return;
        renderRouting(true,0,index);
        document.querySelector('.course-button[aria-current]').focus();
      },'course-button'+(index===lessonIndex?' active':''));
      const marker=document.createElement('span');
      marker.textContent=complete[index]?'✓':String(index+1).padStart(2,'0');
      button.append(marker,title);
      button.disabled=index>0&&!complete[index-1];
      if(button.disabled)button.classList.add('locked');
      if(index===lessonIndex)button.setAttribute('aria-current','step');
      nav.append(button);
    });
    const {concepts,example,tip}=routingLessons[lessonIndex];
    let index=0;
    function renderConcept(){
      const [title,body,intro]=concepts[index];
      $('concept-title').textContent=title;
      renderConceptBody(body,intro);
      $('concept-count').textContent=`${index+1} / ${concepts.length}`;
      $('concept-dots').textContent=concepts.map((_,i)=>i===index?'●':'○').join(' ');
      $('concept-prev').disabled=index===0;
      $('concept-next').disabled=index===concepts.length-1;
      const workedExample=document.querySelector('.worked-example');
      const exampleIndex=lessonIndex===1?2:1;
      const currentExample=lessonIndex===0&&index===0
        ?['NOME DEL ROUTER','Router A','hostname Galilei','Nuovo prompt','Galilei(config)#']
        :index===exampleIndex?example:null;
      workedExample.hidden=!currentExample;
      workedExample.innerHTML=currentExample?`
        <div><span class="eyebrow">ESEMPIO / ${currentExample[0]}</span><strong>${currentExample[1]}</strong></div>
        <div class="example-result"><span>Comando<strong>${currentExample[2]}</strong></span><span>${currentExample[3]}<strong>${currentExample[4]}</strong></span></div>`:'';

    }
    $('concept-prev').innerHTML='<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M11.5 4 6.5 9l5 5"/></svg>';
    $('concept-next').innerHTML='<svg viewBox="0 0 18 18" aria-hidden="true"><path d="m6.5 4 5 5-5 5"/></svg>';
    $('concept-prev').addEventListener('click',()=>{index--;renderConcept();});
    $('concept-next').addEventListener('click',()=>{index++;renderConcept();});
    document.querySelector('.elena-tip').innerHTML='<strong>Elena</strong> '+tip;
    bindSchoolViews();
    renderConcept();
  }
  function renderRouting(isLab,initialRouter,requestedLesson,municipal=false){
    const {lab,ripLab,district,municipalDistrict,interfaces,makeRouters,trace,changeRoute,routeTable,majorNetwork,ripRoutes}=RZRouting;
    const chapter=state.routing??={};
    const lessonIndex=requestedLesson??(chapter.diagnosisComplete||chapter.trained?2:chapter.labConfigured?1:0);
    const rip=municipal||(isLab&&lessonIndex===2);
    const fieldTopology=municipal?municipalDistrict:district;
    const topology=isLab?(rip?ripLab:lab):{...fieldTopology,hosts:fieldTopology.hosts.map((host,index)=>{
      if(index!==0&&index!==2)return host;
      const mission=index===0?0:1;
      const draft=state.drafts[mission];
      if(!draft?.ip||!ReteZero.verify(mission,draft).ok)return host;
      return ReteZero.address(ReteZero.ipv4(draft.ip));
    })};
    const diagnosis=isLab&&lessonIndex===1;
    const routerKey=isLab?(rip?'ripRouters':diagnosis?'diagnosisRouters':'labRouters'):municipal?'municipalRouters':'districtRouters';
    const wrongNetwork='192.168.50.128';
    if(diagnosis&&!chapter.diagnosisRouters){
      const diagnosticRouters=makeRouters(topology);
      diagnosticRouters[0].routes.push({network:lab.lans[1],prefix:24,next:lab.links[0][1]});
      diagnosticRouters[1].routes.push({network:wrongNetwork,prefix:25,next:lab.links[0][0]});
      chapter.diagnosisRouters=diagnosticRouters;
    }
    const routers=chapter[routerKey]??=makeRouters(topology);
    const done=()=>Boolean(isLab?(rip?chapter.ripComplete:chapter.trained||(diagnosis?chapter.diagnosisComplete:chapter.labConfigured)):municipal?chapter.municipalComplete:chapter.complete);
    const renamed=()=>routers[0].name.toLowerCase()!==topology.names[0].toLowerCase();
    const hasWrongRoute=()=>diagnosis&&routers[1].routes.some(route=>route.network===wrongNetwork&&route.prefix===25);
    const diagnosisProgress=chapter.diagnosisProgress??{};
    const ripNetworks=index=>[...new Set(interfaces(topology,index).map(port=>majorNetwork(port.ip)))];
    const ripConfigured=index=>{
      const config=routers[index].rip;
      return config?.version===2&&config.noSummary&&ripNetworks(index).every(network=>config.networks.includes(network));
    };
    const last=routers.length-1;
    const municipalTargets=municipal?[topology.hosts[0],topology.hosts[2]]:[];
    const verifiedMunicipalTargets=new Set();
    if(municipal){
      routers.slice(0,last).forEach((router,index)=>{
        router.rip??={version:2,noSummary:true,networks:ripNetworks(index)};
      });
    }
    let ripInspected=false;
    const ready=()=>!isLab||(rip?routers.every((_,index)=>ripConfigured(index))&&ripInspected
      :diagnosis?diagnosisProgress.inspected&&!hasWrongRoute():renamed());
    const stations=isLab?[]:['hospital','hq','rescue'];
    const pcs=topology.hosts.flatMap((host,index)=>host?[index]:[]);
    const choices=[
      ...pcs.map(index=>({label:isLab?(index?'PC B':'PC A'):'PC '+topology.labels[index],index,pc:true})),
      ...topology.labels.map((name,index)=>({label:isLab?name:'Router '+name,index,pc:false}))
    ];
    let selected=choices.find(choice=>choice.index===initialRouter&&choice.pc)??choices.find(choice=>choice.index===initialRouter);
    const modes=routers.map(()=> 'user');
    const histories=new Map();
    const title=isLab?routingLessons[lessonIndex].title:municipal?municipalTitle:'Richiesta di assistenza';
    const routingPath=`<div class="routing-path${municipal?' municipal-routing-path':''}">
            <h3>Percorso del pacchetto</h3>
            <ol id="routing-nodes"></ol>
            ${isLab?'<p id="routing-status" role="status">Avvia una traccia per vedere quali router attraversa il pacchetto.</p>':''}
          </div>`;
    const routingConsole=`${isLab?'<div class="routing-console training-terminal">':'<details class="mission-cli" open><summary id="routing-console-summary">Usa il prompt</summary>'}
            <div id="routing-output" class="${isLab?'terminal-screen':'mission-terminal-output'}" aria-live="polite" tabindex="0"></div>
            <form id="routing-form"${isLab?'':' class="mission-terminal-form"'}>
              <label${isLab?' class="terminal-prompt"':''}><span id="routing-prompt" aria-hidden="true"></span><input aria-label="Comando" autocomplete="off" spellcheck="false" placeholder="Digita un comando"></label>
              ${isLab?'':'<button type="submit">Esegui</button>'}
            </form>
          ${isLab?'</div>':'</details>'}`;
    const routingActions=`<div class="${isLab?'practice-actions routing-actions':'practice-actions mission-actions'}">
            <button id="routing-tools" type="button" class="secondary">Strumenti</button>
            <button id="routing-finish" type="button" class="primary" disabled>${isLab?(rip?'Concludi l’aggiornamento':diagnosis?'Vai alla lezione RIP':'Vai alla diagnosi'):'Conferma il ripristino'} <span aria-hidden="true">▸</span></button>
          </div>`;
    const routingHint=`
            ${municipal?`<p>La Centrale, l’Ospedale e la Protezione civile hanno già RIPv2. Sul Router Municipio attiva <code>router rip</code>, imposta la versione e dichiara le reti direttamente collegate indicate nella scheda.</p><p>Controlla le righe <code>R</code> con <code>show ip route</code> e usa <code>ping</code> dal PC Municipio verso entrambi i PC remoti.</p>`:`<p>Dal PC prova <code>tracert &lt;IP&gt;</code>. Sui router, <code>show ip route</code> mostra la tabella delle rotte.</p>
            <p>Usa <code>enable</code> e <code>configure terminal</code>, poi <code>ip route &lt;rete&gt; &lt;maschera&gt; &lt;IP del prossimo router&gt;</code>. Configura anche il ritorno.</p>
            <p>Puoi rinominare un router con <code>hostname &lt;nome&gt;</code> in configurazione globale.</p>`}
          `;
    if(isLab){
      $('building-content').innerHTML=schoolLayout({
        chapter:2,
        title,
        score:`${chapter.ripComplete?3:chapter.diagnosisComplete||chapter.trained?2:chapter.labConfigured?1:0} / 3`,
        scoreLabel:'AGGIORNAMENTO',
        status:done()?'SUPERATA ✓':`PROVA ${lessonIndex+1} / 3`,
        question:'',
        practiceContent:`<div class="routing-school-practice">
          <div class="routing-sheet-anchor">
            <button type="button" id="open-routing-sheet" class="text-button" aria-expanded="false" aria-controls="routing-sheet">Scheda tecnica</button>
            <div id="routing-sheet" role="region" aria-labelledby="open-routing-sheet" hidden>
              <p id="routing-sheet-device" class="eyebrow"></p>
              <dl id="routing-addresses"></dl>
            </div>
          </div>
          <div class="routing-school-network">${routingPath}</div>
          ${routingConsole}
        </div>
        <footer class="practice-footer">
          <div id="routing-progress" class="feedback" role="status"></div>
          ${routingActions}
        </footer>`
      });
      setupRoutingLesson(lessonIndex,chapter);
      const sheet=$('routing-sheet');
      const trigger=$('open-routing-sheet');
      function setSheetOpen(open){
        sheet.hidden=!open;
        trigger.setAttribute('aria-expanded',String(open));
      }
      trigger.addEventListener('click',()=>setSheetOpen(sheet.hidden));
      trigger.closest('.practice').addEventListener('keydown',event=>{
        if(event.key!=='Escape'||sheet.hidden)return;
        event.preventDefault();
        setSheetOpen(false);
        trigger.focus({preventScroll:true});
      });
    }else{
      $('building-content').innerHTML=`${missionHeader({
        eyebrow:'GIORNO 03 / 14:00 · VALLE NORD',
        title,
        story:municipal?'Configura RIPv2 sul router del Municipio. Dal PC Municipio verifica con un ping che rispondano sia Ospedale sia Protezione civile.':'Ripristina la comunicazione tra ospedale e Protezione civile attraverso la Centrale.',
        reference:municipal?'CAPITOLO 02 · RIPv2':'CAPITOLO 02 · ROUTING STATICO',
        done:done()
      })}
      <div class="intervention-layout routing-intervention">
        <aside class="ticket-panel">
          <div class="config-heading">
            <div><span class="eyebrow">ISTRUZIONI</span><h3>Scheda tecnica</h3></div>
            <button id="mission-hint" class="icon-button" type="button" aria-label="Mostra indizio" title="Mostra indizio" aria-expanded="false" aria-controls="mission-hint-text">?</button>
            <div id="mission-hint-text" class="hint" hidden>${routingHint}</div>
          </div>
          <dl id="routing-addresses" class="evidence"></dl>
          ${routingPath}
        </aside>
        <section class="configuration" aria-label="Configurazione di rete">
          <div class="config-heading"><div><span class="eyebrow">CONFIGURAZIONE DI RETE</span><h3 id="routing-terminal-title">Terminale</h3></div><span class="onsite">SIMULAZIONE</span></div>
          <div class="mission-workspace with-prompt">
            <div class="fields routing-device-fields">
              <label for="routing-device">Dispositivo<select id="routing-device"></select></label>
              <div id="routing-device-addresses" class="fields"></div>
            </div>
            ${routingConsole}
          </div>
          <div id="routing-status" role="status" class="feedback">Avvia una traccia per vedere quali router attraversa il pacchetto.</div>
          ${routingActions}
        </section>
      </div>`;
      setupMissionHint();
      $('mission-phone').addEventListener('click',()=>openPhone());
    }
    const device=$('routing-device'),input=$('routing-form').querySelector('input');
    const output=$('routing-output'),path=$('routing-nodes'),status=$('routing-status'),finish=$('routing-finish');
    const question=isLab?$('practice-question'):null;
    const progress=$('routing-progress');
    question?.setAttribute('aria-live','polite');
    function updateRoutingInstruction(){
      if(!question)return;
      if(done()||!finish.disabled){
        progress.textContent='Prova completata';
        question.textContent=rip?'Collegamento verificato con RIP.':diagnosis?'Guasto risolto. Puoi passare alla lezione RIP.':'Collegamento verificato. Puoi passare alla diagnosi.';
        return;
      }
      const reaches=(from,to)=>trace(topology,routers,from,topology.hosts[to],true).forward.ok;
      const steps=rip?[
        ...routers.map((_,index)=>[ripConfigured(index),`Configura RIPv2 su ${topology.labels[index]} con le reti della scheda tecnica.`]),
        [ripInspected,'Sul Router A, consulta la tabella di instradamento e cerca la rotta RIP verso il PC B.'],
        [false,'Dal PC A, verifica il collegamento con un ping verso il PC B.']
      ]:diagnosis?[
        [diagnosisProgress.traced,'Dal PC A, traccia il percorso verso il PC B e individua l’interruzione.'],
        [diagnosisProgress.inspected,'Consulta la tabella di instradamento del router indicato dalla traccia.'],
        [!hasWrongRoute(),'Rimuovi la rotta errata in configurazione globale.'],
        [reaches(last,0),'Aggiungi la rotta di ritorno verso la rete del PC A.'],
        [false,'Dal PC A, ripeti la traccia verso il PC B per verificare il ripristino.']
      ]:[
        [renamed(),'Seleziona il Router A e assegnagli il nome Galilei in configurazione globale.'],
        [reaches(0,last),'Configura sul Router A la rotta verso la rete del PC B.'],
        [reaches(last,0),'Configura sul Router B la rotta di ritorno verso la rete del PC A.'],
        [false,'Dal PC A, verifica il collegamento con un ping verso il PC B.']
      ];
      const current=steps.findIndex(([complete])=>!complete);
      question.textContent=steps[current][1];
      progress.textContent=`Passaggio ${current+1} di ${steps.length}`;
    }
    const prompt=()=>selected.pc?'C:\\>':routers[selected.index].name+{user:'>',privileged:'#',global:'(config)#',rip:'(config-router)#'}[modes[selected.index]];
    const logs=new Map();
    const entries=()=>logs.get(selected)??[];
    function renderOutput(){
      output.replaceChildren(...entries().map(({line,isCommand})=>{
        const row=document.createElement('p');
        if(isCommand)row.className='terminal-command';
        row.textContent=line;
        return row;
      }));
      output.scrollTop=output.scrollHeight;
    }
    function print(line,isCommand=false){
      logs.set(selected,[...entries(),{line,isCommand}].slice(-70));
      renderOutput();
    }
    const labNodes=new Map();
    const deviceLabel=choice=>{
      if(choice.pc||!isLab)return choice.label;
      const name=routers[choice.index].name;
      return name===topology.names[choice.index]?choice.label:name;
    };
    if(isLab){
      const [pcA,pcB,...routerChoices]=choices;
      for(const choice of [pcA,...routerChoices,pcB]){
        const node=document.createElement('li');
        const button=makeButton('',()=>{
          selectDevice(choice);
          input.focus({preventScroll:true});
        },'routing-device-node');
        const icon=document.createElement('img');
        icon.src=choice.pc?'assets/icons/pc.png':'assets/icons/switch.png';
        icon.alt='';
        icon.width=44;
        icon.height=44;
        const label=document.createElement('span');
        button.append(icon,label);
        node.append(button);
        path.append(node);
        labNodes.set(choice,{node,button,label});
      }
    }
    function renderPath(result,destination){
      const visited=result?.forward.hops.map(hop=>hop.index)??[];
      const interrupted=result?.forward.stop??result?.reply?.stop;
      if(isLab){
        for(const [choice,{node}] of labNodes){
          const reached=choice.pc
            ?(selected.pc&&choice===selected)||(result?.forward.ok&&topology.hosts[choice.index]===destination)
            :choice.index===selected.index||visited.includes(choice.index);
          node.classList.toggle('visited',Boolean(result&&reached));
          node.classList.toggle('interrupted',!choice.pc&&choice.index===interrupted);
        }
        return;
      }
      path.replaceChildren(...topology.labels.map((label,index)=>{
        const node=document.createElement('li');
        const item=makeButton(label,()=>{
          if(municipal){selectDevice(choices.find(choice=>!choice.pc&&choice.index===index));input.focus();}
          else openBuilding(stations[index]);
        },'routing-node');
        const icon=document.createElement('img');
        icon.src='assets/icons/router.png';
        icon.alt='';
        icon.width=36;
        icon.height=36;
        item.prepend(icon);
        if(municipal)item.setAttribute('aria-pressed',String(!selected.pc&&selected.index===index));
        if(result&&(index===selected.index||visited.includes(index)))node.classList.add('visited');
        if(index===interrupted)node.classList.add('interrupted');
        node.append(item);
        return node;
      }));
    }
    function renderDevice(){
      const {index,pc}=selected;
      if(municipal)path.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(!pc&&i===index)));
      for(const [choice,{button,label}] of labNodes){
        label.textContent=deviceLabel(choice);
        button.setAttribute('aria-pressed',String(choice===selected));
      }
      $('routing-prompt').textContent=prompt();
      renderOutput();
      const data=pc?[[`IP del PC`,topology.hosts[index]],['Gateway predefinito',interfaces(topology,index)[0].ip]]
        :interfaces(topology,index).flatMap(port=>{
          if(!port.next)return [['IP LAN del router · gateway del PC',port.ip+'/'+port.prefix]];
          const neighbor=topology.labels[port.neighbor];
          return [
            [`IP locale sul collegamento con ${neighbor}`,port.ip+'/'+port.prefix],
            [`IP di ${neighbor} · prossimo salto`,port.next]
          ];
        });
      const deviceDataLength=data.length;
      for(const edge of pcs){
        const {network,mask}=ReteZero.calculate(topology.lans[edge],topology.prefixes?.[edge]??24);
        data.push([`Rete ${topology.labels[edge]}`,network+' / '+mask]);
        if(edge!==index)data.push([municipal?`PC ${topology.labels[edge]}`:'Host remoto',topology.hosts[edge]]);
      }
      if(rip&&!pc)data.push(['Reti da dichiarare in RIP',ripNetworks(index).join(' · ')]);
      if(isLab)$('routing-sheet-device').textContent=deviceLabel(selected);
      else {
        $('routing-terminal-title').textContent='Terminale / '+selected.label;
        $('routing-console-summary').textContent=pc?'Usa il prompt del PC':'Usa il prompt del router';
        const deviceAddresses=$('routing-device-addresses');
        deviceAddresses.replaceChildren(...data.splice(0,deviceDataLength).map(([label,value])=>{
          const field=document.createElement('label');
          const address=document.createElement('input');
          field.textContent=label;
          address.value=value;
          address.readOnly=true;
          field.append(address);
          return field;
        }));
      }
      const addresses=$('routing-addresses');
      addresses.replaceChildren();
      for(const [label,value] of data){
        const term=document.createElement('dt'),description=document.createElement('dd');
        term.textContent=label;description.textContent=value;
        addresses.append(term,description);
      }
    }
    if(device){
      choices.forEach((choice,index)=>device.add(new Option(choice.label,String(index))));
      device.value=String(choices.indexOf(selected));
      device.addEventListener('change',()=>selectDevice(choices[Number(device.value)]));
    }
    const activeHistory=[];
    const remember=setupCommandHistory(input,activeHistory);
    function selectDevice(choice){
      if(input.readOnly||choice===selected)return;
      selected=choice;
      if(device)device.value=String(choices.indexOf(choice));
      activeHistory.splice(0,activeHistory.length,...(histories.get(selected)??[]));
      input.value='';
      renderDevice();
    }
    async function runTrace(destination, ping=false){
      const {index,pc}=selected;
      if(!topology.hosts.includes(destination)){
        print('% Indica l’indirizzo di uno dei PC riportati nella scheda tecnica.');
        return;
      }
      const result=trace(topology,routers,index,destination,pc);
      if(ping){
        const sent=4;
        const received=result.ok?sent:0;
        const lost=sent-received;
        const ttl=result.ok?128-result.reply.hops.length-Number(topology.hosts[index]!==destination):null;
        const times=[12,39,48,40];
        if(device)device.disabled=true;
        const buttons=[...labNodes.values()].map(({button})=>button);
        input.readOnly=true;
        buttons.forEach(button=>button.disabled=true);
        status.textContent='Ping in corso…';
        print(`Pinging ${destination} with 32 bytes of data:\n`);
        try{
          for(let attempt=0;attempt<sent;attempt++){
            await new Promise(resolve=>setTimeout(resolve,result.ok?(attempt===0?250:650):1000));
            if(!input.isConnected||!$('building-dialog').open)return;
            print(result.ok
              ?`Reply from ${destination}: bytes=32 time=${times[attempt]}ms TTL=${ttl}`
              :'Request timed out.');
          }
          const lines=[
            `\nPing statistics for ${destination}:`,
            `    Packets: Sent = ${sent}, Received = ${received}, Lost = ${lost} (${lost/sent*100}% loss),`
          ];
          if(result.ok){
            const average=Math.floor(times.reduce((sum,time)=>sum+time,0)/received);
            lines.push('Approximate round trip times in milli-seconds:',
              `    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Average = ${average}ms`);
          }
          print(lines.join('\n'));
        }finally{
          input.readOnly=false;
          if(device)device.disabled=false;
          buttons.forEach(button=>button.disabled=false);
        }
      }else if(pc){
        const lines=['',`Tracing route to ${destination} over a maximum of 30 hops:`,''];
        const hops=[...result.hops];
        if(result.ok)hops.push({ip:destination});
        else if(hops.at(-1)?.responds!==false)hops.push({responds:false});
        hops.forEach((hop,i)=>{
          const number=String(i+1).padStart(3);
          lines.push(hop.responds===false
            ?`${number}    *       *       *       Request timed out.`
            :`${number}    1 ms    0 ms    0 ms    ${hop.ip}`);
        });
        if(result.ok)lines.push('','Trace complete.');
        print(lines.join('\n'));
      }else{
        print('Traccia verso '+destination);
        result.hops.forEach((hop,i)=>print(` ${i+1}  ${hop.responds===false?'* * *':hop.ip}`));
        print(result.ok?` ${result.hops.length+1}  ${destination}\nTraccia completata.`:' * * *  Nessuna risposta dalla destinazione.');
      }
      renderPath(result,destination);
      const stop=result.forward.stop;
      const returnStop=result.reply?.stop;
      status.textContent=result.ok?'Richiesta arrivata e risposta ricevuta.':stop!==undefined
        ?`${result.forward.loop?'Ciclo di instradamento':'Andata interrotta'} · ${topology.labels[stop]}.`
        :returnStop!==undefined?`Andata riuscita. Ritorno interrotto · ${topology.labels[returnStop]}.`:'La destinazione non ha risposto.';
      if(municipal){
        if(!pc||index!==last||!ping||!municipalTargets.includes(destination))return;
        if(result.ok&&ripConfigured(last))verifiedMunicipalTargets.add(destination);
        else verifiedMunicipalTargets.delete(destination);
        finish.disabled=!done()&&verifiedMunicipalTargets.size!==municipalTargets.length;
        if(!done()&&result.ok)status.textContent=`Sedi verificate dal Municipio: ${verifiedMunicipalTargets.size} di ${municipalTargets.length}.`;
        return;
      }
      if(!pc||index!==0||destination!==topology.hosts[last])return;
      if(diagnosis&&!ping&&!result.ok&&returnStop===1&&hasWrongRoute()){
        diagnosisProgress.traced=true;
        chapter.diagnosisProgress=diagnosisProgress;
        save();
      }
      if(!isLab||ping!==diagnosis){
        finish.disabled=!done()&&!(result.ok&&ready());
        if(result.ok&&!done()&&!ready()){
          status.textContent=rip?'Verifica la configurazione RIP e consulta la tabella del Router A, poi ripeti il ping.':diagnosis
            ?'Controlla la tabella dopo la traccia del guasto e rimuovi la rotta errata.'
            :'Collegamento verificato. Rinomina il Router A, poi ripeti il ping.';
        }
      }
    }
    $('routing-form').addEventListener('submit',async event=>{
      event.preventDefault();
      if(input.readOnly)return;
      const raw=input.value.trim();
      if(!raw)return;
      remember(raw);
      histories.set(selected,[...activeHistory]);
      print(prompt()+(isLab?'':' ')+raw,true);
      input.value='';
      const {index,pc}=selected;
      const [command,...parts]=raw.toLowerCase().split(/\s+/);
      const args=parts.join(' ');
      const mode=modes[index];
      const exec=mode==='user'||mode==='privileged';
      let changed=false;
      if(pc){
        if((command==='tracert'||((isLab||municipal)&&command==='ping'))&&parts.length===1)await runTrace(args,command==='ping');
        else if(command==='ipconfig'&&(!args||args==='/all')){
          const port=interfaces(topology,index)[0];
          print(`IPv4 Address   ${topology.hosts[index]}\nSubnet Mask    ${ReteZero.calculate(port.ip,port.prefix).mask}\nDefault Gateway ${port.ip}`);
          if(args==='/all')print('DNS Servers    '+(isLab||index===0?'0.0.0.0':'192.168.20.126'));
        }else print(isLab||municipal?'% Usa ipconfig, ping <IP> o tracert <IP>.':'% Usa ipconfig oppure tracert seguito dall’IP di destinazione.');
      }else if(command==='traceroute'&&exec&&parts.length===1)runTrace(args);
      else if(command==='enable'&&!args&&mode==='user')modes[index]='privileged';
      else if(command==='disable'&&!args&&mode==='privileged')modes[index]='user';
      else if(mode==='privileged'&&/^(?:conf|confi|config|configu|configur|configure)$/.test(command)&&args.length>0&&'terminal'.startsWith(args))modes[index]='global';
      else if((command==='exit'||command==='end')&&!args&&mode==='global')modes[index]='privileged';
      else if(rip&&mode==='global'&&command==='router'&&args==='rip'){
        routers[index].rip??={networks:[]};
        modes[index]='rip';
      }
      else if(mode==='rip'){
        const config=routers[index].rip;
        if(command==='end'&&!args)modes[index]='privileged';
        else if(command==='exit'&&!args)modes[index]='global';
        else if(command==='version'&&args==='2'){config.version=2;changed=true;}
        else if(command==='no'&&args==='auto-summary'){config.noSummary=true;changed=true;}
        else if(command==='network'&&parts.length===1&&ripNetworks(index).includes(args)){
          if(!config.networks.includes(args)){config.networks.push(args);changed=true;}
        }else print('% Usa version 2, no auto-summary o network con una rete della scheda tecnica.');
        if(changed){ripInspected=false;verifiedMunicipalTargets.clear();}
      }
      else if(command==='show'&&args==='ip route'&&mode==='privileged'){
        print(routeTable(topology,routers,index));
        if(rip&&index===0&&routers.every((_,routerIndex)=>ripConfigured(routerIndex))
          &&ripRoutes(topology,routers,index).some(route=>route.network===topology.lans[last]))ripInspected=true;
        if(diagnosis&&index===1&&diagnosisProgress.traced&&hasWrongRoute()){
          diagnosisProgress.inspected=true;
          save();
        }
      }
      else if(command==='hostname'&&mode==='global'&&/^[a-z][a-z0-9-]{0,31}$/i.test(args)){
        routers[index].name=raw.split(/\s+/)[1];
        if(isLab)renderDevice();
        if(isLab&&!diagnosis&&index===0&&!done())finish.disabled=true;
        save();
      }else if(!rip&&mode==='global'&&((command==='ip'&&parts[0]==='route')||(command==='no'&&parts[0]==='ip'&&parts[1]==='route'))){
        const error=diagnosis&&!done()&&!diagnosisProgress.inspected
          ?'% Prima traccia il guasto dal PC A e consulta la tabella del router indicato.'
          :changeRoute(topology,routers,index,parts.slice(command==='ip'?1:2),command==='no');
        if(error)print(error);
        else changed=true;
      }else print('% Comando non valido in questa modalità.');
      if(changed){
        save();
        finish.disabled=!done();
        renderPath();
        status.textContent=isLab&&!diagnosis?'Tabella modificata. Ripeti il ping dal PC A.':'Tabella modificata. Esegui una nuova traccia dal PC di partenza.';
      }
      if(!input.isConnected||!$('building-dialog').open)return;
      updateRoutingInstruction();
      $('routing-prompt').textContent=prompt();
      input.focus({preventScroll:true});
    });
    $('routing-tools').addEventListener('click',()=>openCalculator());
    finish.addEventListener('click',()=>{
      if(isLab&&!rip){
        if(!done()&&(!ready()||!trace(topology,routers,0,topology.hosts[last],true).ok))return;
        chapter[diagnosis?'diagnosisComplete':'labConfigured']=true;
        save();
        renderShell();
        renderRouting(true,0,lessonIndex+1);
        document.querySelector('.course-button[aria-current]').focus();
        return;
      }
      if(done()){
        closeBuilding();
        if(isLab&&rip&&!chapter.complete){
          window.setTimeout(()=>{
            if(state.routing===chapter&&!chapter.complete&&!document.querySelector('dialog[open]')){
              openPhone();
            }
          },2000);
        }
        return;
      }
      if(municipal){
        if(!ripConfigured(last)||!municipalTargets.every(destination=>verifiedMunicipalTargets.has(destination)
          &&trace(topology,routers,last,destination,true).ok))return;
        chapter.municipalComplete=true;
      }else{
        if(!ready()||!trace(topology,routers,0,topology.hosts[last],true).ok)return;
        if(rip){chapter.ripComplete=true;chapter.trained=true;}
        else chapter.complete=true;
      }
      save();
      renderShell();
      if(isLab){
        document.querySelector('.school-seal strong').textContent=`${routingLessons.length} / ${routingLessons.length}`;
        document.querySelector('.practice-status').textContent='SUPERATA ✓';
        document.querySelector('.course-button[aria-current]').firstChild.textContent='✓';
        finish.firstChild.nodeValue='Vai alla mappa ';
        updateRoutingInstruction();
        scheduleSchoolMessage(finish,schoolUpdateComplete);
        return;
      }
      closeBuilding();
      openPhone();
    });
    if(done()){
      finish.disabled=false;
      if(!isLab||rip)finish.firstChild.nodeValue='Vai alla mappa ';
    }
    renderPath();
    renderDevice();
    updateRoutingInstruction();
  }
  function showCalculatorReference(show){
    $('calc-panel').inert=show;
    $('calc-cli-reference').inert=!show;
    $('calc-title').textContent=show?'Comandi CLI':'Banco di calcolo';
    $('calc-description').textContent=show
      ?'Sintassi e modalità dei prompt di Rete Zero.'
      :'Calcola la sottorete a partire da un indirizzo IPv4 e dal suo prefisso.';
    const toggle=$('toggle-cli-reference');
    toggle.setAttribute('aria-expanded',String(show));
    toggle.firstChild.textContent=show?'Banco di calcolo ':'Comandi CLI ';
    $('calculator-dialog').scrollTop=0;
  }
  function openCalculator(example){
    if(example){$('calc-ip').value=example.ip;$('calc-prefix').value=String(example.prefix);}
    showCalculatorReference(false);
    calculate();
    if(!$('calculator-dialog').open)$('calculator-dialog').showModal();
  }
  $('close-calculator').addEventListener('click',()=>$('calculator-dialog').close());
  $('toggle-cli-reference').addEventListener('click',()=>showCalculatorReference($('calc-cli-reference').inert));
  const cliTabs=[...$('calc-cli-reference').querySelectorAll('[role="tab"]')];
  function selectCliTab(selected){
    for(const tab of cliTabs){
      const active=tab===selected;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
      $(tab.getAttribute('aria-controls')).inert=!active;
    }
  }
  cliTabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectCliTab(tab));
    tab.addEventListener('keydown',event=>{
      const dispatchTimes=['09:00','10:15','11:30'];
      const restoreTimes=['10:15','11:30','13:00'];
      const destinations={
        ArrowLeft:cliTabs.length-1-index,
        ArrowRight:cliTabs.length-1-index,
        Home:0,
        End:cliTabs.length-1
      };
      if(!Object.hasOwn(destinations,event.key))return;
      event.preventDefault();
      const next=cliTabs[destinations[event.key]];
      selectCliTab(next);
      next.focus();
    });
  });
  for(const panel of $('calc-cli-reference').querySelectorAll('.cli-device-panel')){
    const list=panel.querySelector('.cli-command-list');
    const filters=panel.querySelectorAll('.cli-mode-picker button');
    for(const filter of filters){
      filter.addEventListener('click',()=>{
        const targets=filter.getAttribute('aria-controls').split(/\s+/);
        for(const section of list.children){
          section.hidden=(section.hasAttribute('data-routing-command')&&!nextDayStarted())
            ||(!targets.includes(list.id)&&!targets.includes(section.id));
        }
        for(const button of filters){
          button.setAttribute('aria-pressed',String(button===filter));
        }
      });
    }
  }
  $('calculator-form').addEventListener('submit',event=>{event.preventDefault();calculate();});
  $('calc-prefix').addEventListener('change',calculate);
  function calculate(){
    const input=$('calc-ip');
    const prefixInput=$('calc-prefix');
    const prefixValid=prefixInput.validity.valid;
    const result=prefixValid ? ReteZero.calculate(input.value,prefixInput.valueAsNumber) : null;
    const target=$('calculator-results');
    prefixInput.setAttribute('aria-invalid',String(!prefixValid));
    input.setAttribute('aria-invalid',String(prefixValid&&!result));
    if(!result){
      const message=prefixValid
        ?'Indirizzo non valido. Inserisci quattro numeri tra 0 e 255, separati da punti.'
        :'Inserisci un prefisso intero da /0 a /32.';
      target.innerHTML=`<p class="feedback error">${message}</p>`;
      return;
    }
    const entries=[
      ['Indirizzo di rete',result.network],['Maschera di sottorete',result.mask],
      ['Broadcast',result.broadcast??'Non previsto'],['Primo host',result.first],
      ['Ultimo host',result.last],['Host utilizzabili',result.hosts.toLocaleString('it-IT')]
    ];
    const octets=result.binary.match(/.{8}/g).map((octet,index)=>{
      const digits=[...octet].map((bit,offset)=>{
        const type=index*8+offset<result.prefix?'network':'host';
        return `<span class="${type}-bit">${bit}</span>`;
      }).join('');
      return `<span class="binary-octet">${digits}</span>`;
    }).join('');
    target.innerHTML=`
      <dl class="calc-result-grid">
        ${entries.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
      </dl>
      <section class="binary-view" aria-labelledby="calc-binary-title">
        <div class="binary-heading">
          <h3 id="calc-binary-title" class="eyebrow">INDIRIZZO IN BINARIO</h3>
          <ul class="binary-legend" aria-label="Legenda">
            <li class="network-bit">Rete · ${result.prefix} bit</li>
            <li class="host-bit">Host · ${32-result.prefix} bit</li>
          </ul>
        </div>
        <div class="binary-digits" role="img" aria-label="${result.binary.match(/.{8}/g).join(' ')}">${octets}</div>
        <p>${result.note}</p>
      </section>
      <p class="gateway-note">Per il gateway predefinito, usa l’indirizzo dell’interfaccia del router collegata alla sottorete.</p>`;
  }
  $('reset-missions').addEventListener('click',()=>{
    const dayThree=nextDayStarted();
    if(!confirm(dayThree?'Ricominciare gli interventi del Capitolo 02? Le prove della scuola e il tesserino resteranno salvati.':'Ricominciare gli interventi dall’ospedale? Le prove della scuola e il tesserino resteranno salvati.'))return;
    if(dayThree){
      if(state.routing){
        for(const key of ['districtRouters','municipalRouters','complete','municipalComplete'])delete state.routing[key];
      }
      deliveredMessages.clear();
      save();
      renderShell();
      return;
    }
    window.clearTimeout(fieldTimer);
    fieldTimer=undefined;
    state.completed=0;
    state.fieldStage=2;
    state.stormStage=0;
    state.nextDayStage=0;
    delete state.routing;
    window.clearTimeout(nextDayTimer);
    nextDayTimer=undefined;
    state.drafts={};
    state.missionLogs=[];
    deliveredMessages.clear();
    save();
    renderShell();
    scheduleDispatch();
  });
  $('reset-progress').addEventListener('click',()=>{if(!confirm('Ricominciare Rete Zero? Le prove e gli interventi di questo gioco verranno azzerati.'))return;window.clearTimeout(fieldTimer);fieldTimer=undefined;window.clearTimeout(nextDayTimer);nextDayTimer=undefined;state={curriculum:curriculumVersion,completed:0,studied:[],drafts:{},lessonDrafts:{},nextDayStage:0};deliveredMessages.clear();save();renderShell();scheduleWelcomeMessage();});
  $('toggle-instructions').addEventListener('click',()=>{
    const panel=$('instructions-panel'),button=$('toggle-instructions'),collapsed=panel.classList.toggle('collapsed');
    button.textContent=collapsed?'+':'−';button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',collapsed?'Espandi istruzioni':'Riduci istruzioni');
  });
  renderShell();
  scheduleDispatch();
  scheduleFieldDispatch();
  scheduleNextDay();
  if(resumeDayThree&&!resumeAfterSchool)openPhone();
  scheduleWelcomeMessage();
  if(location.hash==='#fine-aggiornamento'){
    history.replaceState(null,'',location.href.split('#')[0]);
    if(nextDayStarted()&&state.routing?.ripComplete){
      openBuilding('school');
      scheduleSchoolMessage($('routing-finish'),schoolUpdateComplete);
    }
  }
  if(location.protocol==='file:'){document.querySelector('[data-games-home]').href=new URL('../index.html',location.href).href;}else{
    const hub=new URL('../index.html',location.href);fetch(hub,{cache:'no-store'}).then(response=>response.ok?response.text():'').then(html=>{if(html.includes('<meta name="games-hub" content="informatica-in-gioco">'))document.querySelector('[data-games-home]').href=hub.href;}).catch(()=>{});
  }
})();
