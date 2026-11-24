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
      if(raw.graduationPending===true)state.graduationPending=true;
      if(Array.isArray(raw.missionLogs))state.missionLogs=raw.missionLogs;
      if(typeof raw.badgeName==='string')state.badgeName=raw.badgeName.trim().slice(0,40);
      if(Number.isInteger(raw.badgeAge)&&raw.badgeAge>=1&&raw.badgeAge<=120)state.badgeAge=raw.badgeAge;
      if(Object.hasOwn(avatars,raw.avatar))state.avatar=raw.avatar;
      if(raw.vlanMorningPending===true)state.vlanMorningPending=true;
      if(raw.vlan&&Array.isArray(raw.vlan.passed)){
        for(const net of [raw.vlan.lab,raw.vlan.field])RZVlan.migrateLegacyNetwork(net);
        RZVlan.upgradePalace(raw.vlan.field,raw.vlan.complete);
        RZVlanUI.prepareCourse(raw.vlan);
        raw.vlan.passed=[...new Set(raw.vlan.passed.filter(index=>Number.isInteger(index)&&index>=0&&index<RZVlanUI.lessons.length))];
        state.vlan=raw.vlan;
      }
      if(raw.routing&&typeof raw.routing==='object')state.routing=raw.routing;
      state.highestChapter=raw.highestChapter===2||raw.chapterSelectionUnlocked===true||state.routing?.municipalComplete===true?2:1;
      if(raw.lessonDrafts&&typeof raw.lessonDrafts==='object'&&!Array.isArray(raw.lessonDrafts))state.lessonDrafts=raw.lessonDrafts;
      state.fieldStage=[0,1,2].includes(raw.fieldStage)?raw.fieldStage:2;
      if(state.completed===missions.length&&[1,2].includes(raw.nextDayStage))state.nextDayStage=raw.nextDayStage;
      state.stormStage=[0,1,2].includes(raw.stormStage)?raw.stormStage:raw.completed>0?2:0;
      if(raw.fieldCurriculum!==2){
        if(Array.isArray(state.routing?.municipalRouters))for(const router of state.routing.municipalRouters){
          if(!Array.isArray(router?.routes))continue;
          router.routes=router.routes.filter(route=>!(route.prefix===26&&['192.168.30.0','192.168.30.64'].includes(route.network)));
        }
        if(state.completed>=3){
          const draft=state.drafts[2]??={};
          draft.ports=Object.fromEntries(ReteZero.municipalPorts.map(({name,network,prefix})=>{
            const {last,mask}=ReteZero.calculate(network,prefix);
            return [name,{ip:last,mask,enabled:true}];
          }));
          draft.routerStep=3;
        }
        if(state.completed===3&&(raw.nextDayStage>0||state.routing?.labConfigured)){
          state.completed=missions.length;
          if(!state.studied.includes('vlsm'))state.studied.push('vlsm');
          state.nextDayStage=raw.nextDayStage===1?1:2;
        }
        if(state.missionLogs)delete state.missionLogs[2];
      }
    }
  } catch (_) {}
  const startChapterThree=location.protocol==='file:'&&(
    new URL(location.href).searchParams.get('capitolo')==='3'||location.hash==='#inizio-capitolo-3'
  );
  window.addEventListener('hashchange',()=>{
    if(location.protocol==='file:'&&location.hash==='#inizio-capitolo-3')location.reload();
  });
  if(startChapterThree||(location.protocol==='file:'&&location.hash==='#ripristina-partita-completa')){
    state.completed=missions.length;
    state.studied=lessons.map(lesson=>lesson.id);
    state.stormStage=state.fieldStage=state.nextDayStage=2;
    state.welcomeRead=true;
    state.highestChapter=2;
    if(startChapterThree){
      state.vlan={passed:[]};
      delete state.vlanMorningPending;
      delete state.graduationPending;
    }else if(!state.vlan)state.vlanMorningPending=true;
    state.badgeName||='Tecnico di Valle Nord';
    state.badgeAge??=18;
    state.avatar||='uomo';
    Object.assign(state.routing??={},{labConfigured:true,diagnosisComplete:true,ripComplete:true,trained:true,complete:true,municipalComplete:true});
    if(startChapterThree){
      delete state.routing.municipalDispatchPending;
      delete state.routing.municipalMedalPending;
    }
    const restoredUrl=new URL(location.href);
    restoredUrl.hash='';
    if(startChapterThree){
      for(const key of ['capitolo','anteprima-fine-scuola','anteprima-fine-vlsm','anteprima-fine-assistenza','rifai-municipio'])restoredUrl.searchParams.delete(key);
    }
    history.replaceState(null,'',restoredUrl);
  }
  const previewSchoolEnding=location.protocol==='file:'
    &&new URL(location.href).searchParams.has('anteprima-fine-scuola');
  const previewVlsmEnding=location.protocol==='file:'
    &&new URL(location.href).searchParams.has('anteprima-fine-vlsm');
  if(previewSchoolEnding){
    state={
      ...state,
      studied:lessons.map(lesson=>lesson.id), completed:0,
      drafts:{}, lessonDrafts:{}, missionLogs:[],
      avatar:null, badgeName:'', badgeAge:null,
      welcomeRead:true, graduationPending:true,
      stormStage:0, fieldStage:0, nextDayStage:0,
      routing:undefined, vlan:undefined, vlanMorningPending:false
    };
  }
  const previewRoutingEnding=location.protocol==='file:'
    &&new URL(location.href).searchParams.has('anteprima-fine-assistenza');
  if(previewRoutingEnding){
    const {district,makeRouters,interfaces}=RZRouting;
    const districtRouters=makeRouters(district);
    districtRouters.forEach((router,from)=>{
      for(const target of [0,2]){
        if(from===target)continue;
        const neighbor=from===1?target:1;
        const {next}=interfaces(district,from).find(port=>port.neighbor===neighbor);
        router.routes.push({network:district.lans[target],prefix:district.prefixes[target],next});
      }
    });
    state={
      ...state,
      studied:lessons.map(lesson=>lesson.id), completed:missions.length,
      stormStage:2, fieldStage:2, nextDayStage:2, welcomeRead:true, graduationPending:false,
      badgeName:state.badgeName||'Tecnico di Valle Nord', badgeAge:state.badgeAge??18,
      avatar:state.avatar||'uomo', vlanMorningPending:false,
      routing:{labConfigured:true,diagnosisComplete:true,ripComplete:true,trained:true,
        districtRouters,districtChecks:{0:true,2:true}}
    };
  }
  const resumeAfterSchool=location.hash==='#rip-completato';
  const resumeDayThree=resumeAfterSchool||location.hash==='#giorno-3';
  const localReplayUrl=new URL(location.href);
  const replayMunicipio=location.protocol==='file:'&&localReplayUrl.searchParams.has('rifai-municipio');
  if(replayMunicipio){
    localReplayUrl.searchParams.delete('rifai-municipio');
    try{history.replaceState(null,'',localReplayUrl);}catch(_){}
    if(state.nextDayStage===2&&state.routing?.ripComplete&&state.routing.complete){
      delete state.routing.municipalRouters;
      delete state.routing.municipalComplete;
      delete state.routing.municipalMedalPending;
      delete state.vlanMorningPending;
    }
  }
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
  if(previewVlsmEnding){
    const ports={},pcs={},pings={};
    for(const {name,network,prefix} of ReteZero.rescuePorts){
      const {first,last,mask}=ReteZero.calculate(network,prefix);
      ports[name]={ip:last,mask,enabled:true};
      pcs[name]={ip:first,mask,gateway:last,dns:'0.0.0.0'};
      pings[name]=true;
    }
    state={
      ...state,
      studied:lessons.map(lesson=>lesson.id), completed:3,
      drafts:{3:{ports,pcs,pings,routerStep:2}}, missionLogs:[],
      avatar:state.avatar||'uomo', badgeName:state.badgeName||'Tecnico di Valle Nord', badgeAge:state.badgeAge??18,
      welcomeRead:true, graduationPending:false,
      stormStage:2, fieldStage:2, nextDayStage:0,
      routing:undefined, vlan:undefined, vlanMorningPending:false
    };
  }
  let activeBuilding=null,activeLesson=0,returnFocus=null;
  const graduated=()=>state.studied.length===lessons.length;
  const xp=()=>state.studied.length*25+state.completed*100+(state.routing?.complete?100:0)+(state.routing?.municipalComplete?100:0)+vlanPassed()*25+(state.vlan?.complete?100:0);
  function save(){if(previewSchoolEnding||previewVlsmEnding||previewRoutingEnding)return;try{localStorage.setItem(storageKey,JSON.stringify({...state,fieldCurriculum:2}));}catch(_){}}
  save();
  function makeButton(text,action,className='primary'){const b=document.createElement('button');b.type='button';b.className=className;b.textContent=text;b.addEventListener('click',action);return b;}
  const city=new RZCity($('city-canvas'),$('city-markers'),openBuilding);
  const fieldMessages=[
    'Il pronto soccorso è di nuovo in contatto con la centrale. La Protezione civile può riprendere il coordinamento, appena sistemiamo la radio della Squadra Nord.',
    'La Squadra Nord comunica di nuovo. Ora il Municipio deve riattivare le reti del Sindaco e del Vicesindaco.',
    'Le due reti del Municipio sono di nuovo online. Ci resta da ampliare la rete della Protezione civile.',
    'Sala operativa e Squadra mobile raggiungono i loro gateway. Abbiamo anche spazio per una futura squadra. Hai ottenuto la medaglia Tecnico operativo. Per oggi abbiamo finito.'
  ];
  const badgeReminder = 'Congratulazioni! Hai superato tutte le prove della scuola. Apri il tesserino e configura nome, età e avatar prima di poter intervenire sul campo.';
  const welcomeMessage=['Benvenuto a Valle Nord','Sono Elena Riva, la coordinatrice. Per iniziare, vai all’Istituto Galilei. Seleziona il segnaposto 01 sulla mappa oppure scegli «Scuola di reti» nel pannello Il tuo incarico. Lì ti aspettano le prime prove.','Giorno 01 · 07:40'];
  const graduationMessage=['Formazione completata',badgeReminder,'Giorno 01 · 18:30'];
  const stormAlert = ['Temporale a Valle Nord', 'Buongiorno. Il temporale di ieri sera ha causato un blackout. Dobbiamo ripristinare le comunicazioni tra ospedale, Protezione civile e Municipio.', 'Giorno 02 · 09:00'];
  const awaitingDispatch=()=>graduated()&&hasBadgeProfile()&&state.completed===0&&(state.stormStage??0)<2;
  let dispatchTimer, phoneHasGraduation=false;
  function scheduleDispatch(){
    if(dispatchTimer||phoneHasGraduation||document.querySelector('dialog[open]'))return;
    const graduation=graduated()&&state.graduationPending;
    if(!graduation&&!awaitingDispatch())return;
    dispatchTimer=window.setTimeout(()=>{
      dispatchTimer=undefined;
      if(document.querySelector('dialog[open]'))return;
      if(graduated()&&state.graduationPending){
        openPhone(graduationMessage,{withHistory:true});
        return;
      }
      if(!awaitingDispatch())return;
      const morningAfterStorm=(state.stormStage??0)===0;
      state.stormStage=2;
      save();
      renderShell();
      if(morningAfterStorm)openPhone(stormAlert,{withHistory:true});
      else notifyMessages(phoneMessages());
    },graduation?1200:(state.stormStage??0)===0?3000:0);
  }
  document.addEventListener('close',scheduleDispatch,true);
  $('phone-dialog').addEventListener('close',()=>{
    if(!phoneHasGraduation)return;
    phoneHasGraduation=false;
    delete state.graduationPending;
    save();
    renderShell();
    const badgeButton=$('school-open-badge');
    if(activeBuilding?.id==='school'&&badgeButton){
      badgeButton.disabled=false;
      badgeButton.focus({preventScroll:true});
    }
    scheduleDispatch();
  });
  const awaitingFieldDispatch=()=>state.completed>0&&(state.fieldStage??2)<2;
  const districtRestored=()=>graduated()&&state.completed===missions.length;
  const nextDayStarted=()=>districtRestored()&&state.nextDayStage===2;
  const schoolUpdateTitle='Aggiornamento alla scuola';
  const schoolUpdate=[schoolUpdateTitle,'Buongiorno. Torna al Galilei per l’aggiornamento sul routing. Oggi collegheremo due reti con rotte statiche, cercheremo un guasto e vedremo come i router imparano le rotte con RIP.', 'Giorno 03 · 08:00'];
  const schoolUpdateComplete=['Aggiornamento completato','Congratulazioni! Hai completato l’aggiornamento al Galilei. Hai collegato due reti, individuato un guasto e verificato il collegamento con RIPv2.', 'Giorno 03 · 13:45'];
  const routingRequest=['Richiesta di assistenza','L’ospedale deve inviare una richiesta alla Protezione civile passando dalla Centrale. Le reti locali funzionano. Controlla il percorso tra le sedi e ripristina la comunicazione in entrambe le direzioni.', 'Giorno 03 · 14:00'];
  const routingComplete=['Collegamento tra le sedi ripristinato','La richiesta è arrivata alla Protezione civile e la risposta è tornata all’ospedale.', 'Giorno 03 · 15:15'];
  const municipalTitle='Municipio in rete';
  const municipalRequest=[municipalTitle,'Il Municipio ha due sottoreti, una per il Sindaco e una per il Vicesindaco. Configura RIPv2 perché la Centrale impari a raggiungerle e il Municipio impari le rotte verso le altre sedi. Poi verifica il collegamento dal PC del Sindaco verso l’Ospedale e dal PC del Vicesindaco verso la Protezione civile.', 'Giorno 03 · 15:20'];
  const municipalReport=['Municipio collegato','Il Municipio comunica con Ospedale e Protezione civile attraverso la Centrale. Le rotte verso le due sedi sono state apprese tramite RIP. Hai ottenuto la medaglia Tecnico specialista.', 'Giorno 03 · 16:00'];
  const municipalDispatchPending=()=>state.routing?.municipalDispatchPending===true;
  function showRoutingCompletion(chapter){
    openPhone(routingComplete,{withHistory:true});
    const deliverRequest=()=>{
      if(state.routing!==chapter||!municipalDispatchPending())return;
      const dialog=document.querySelector('dialog[open]:not(#phone-dialog)');
      if(dialog){
        dialog.addEventListener('close',deliverRequest,{once:true});
        return;
      }
      delete chapter.municipalDispatchPending;
      save();
      renderShell();
      openPhone(municipalRequest,{withHistory:true});
    };
    window.setTimeout(deliverRequest,1000);
  }
  let fieldTimer,nextDayTimer,phoneHasFinalReport=false;
  let operationalMedalPending=false;
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
    if(operationalMedalPending){
      operationalMedalPending=false;
      celebrateMedal('operativo');
    }
    scheduleNextDay();
  });
  const vlanSchoolMessage=['Formazione VLAN','Torna al Galilei. Impara a separare i quattro reparti del Palazzo dei servizi con le VLAN e a collegarli con trunk e routing.','Giorno 04 · 08:00'];
  const vlanSchoolComplete=['Formazione VLAN completata','Hai completato la formazione al Galilei. Hai configurato VLAN, trunk e gateway e verificato il percorso di riserva con STP.','Giorno 04 · 10:15'];
  const vlanMissionMessage=['Palazzo dei servizi','Dopo la manutenzione alcune postazioni del Palazzo sono rimaste isolate. Individua i guasti su porte access e trunk, attiva i gateway e collauda i collegamenti della scheda tecnica.','Giorno 04 · 14:00'];
  const vlanDoneMessage=['Collaudo completato','Il Palazzo dei servizi è operativo. I collegamenti tra i piani e il routing tra VLAN sono stati verificati. Hai ottenuto la medaglia Tecnico di distretto.','Giorno 04 · 15:30'];
  const vlanLessons=RZVlanUI.lessons;
  const vlanSchoolCount=vlanLessons.length+1;
  const vlanPassed=()=> (state.vlan?.passed.length??0)+Number(Boolean(state.vlan?.stpComplete));
  const vlanTrained=()=>vlanPassed()===vlanSchoolCount;
  const vlanFieldAvailable=()=>vlanTrained()||Boolean(state.vlan?.complete);
  const municipalMedalPending=()=>Boolean(state.routing?.municipalComplete&&state.routing.municipalMedalPending&&state.vlanMorningPending);
  const awaitingVlanMorning=()=>state.routing?.municipalComplete&&state.vlanMorningPending&&!municipalMedalPending();
  let vlanMorningTimer;
  function scheduleVlanMorning(){
    if(!awaitingVlanMorning()||vlanMorningTimer||document.querySelector('dialog[open]'))return;
    const chapter=state.routing;
    vlanMorningTimer=window.setTimeout(()=>{
      vlanMorningTimer=undefined;
      if(state.routing!==chapter||!awaitingVlanMorning()||document.querySelector('dialog[open]'))return;
      delete state.vlanMorningPending;
      save();
      renderShell();
      openPhone(vlanSchoolMessage,{withHistory:true});
    },1000);
  }
  function showMunicipalCompletion(){
    const chapter=state.routing;
    $('phone-dialog').addEventListener('close',()=>{
      if(state.routing!==chapter||!municipalMedalPending())return;
      celebrateMedal('specialista',()=>{
        if(state.routing!==chapter)return;
        delete chapter.municipalMedalPending;
        save();
        renderShell();
        scheduleVlanMorning();
      });
    },{once:true});
    openPhone(municipalReport,{withHistory:true});
  }
  const vlanMedalPending=()=>Boolean(state.vlan?.complete&&state.vlan.medalPending);
  function showVlanCompletion(){
    const chapter=state.vlan;
    $('phone-dialog').addEventListener('close',()=>{
      if(state.vlan!==chapter||!vlanMedalPending())return;
      celebrateMedal('distretto',()=>{
        if(state.vlan!==chapter)return;
        delete chapter.medalPending;
        save();
      });
    },{once:true});
    openPhone(vlanDoneMessage,{withHistory:true});
  }
  document.addEventListener('close',scheduleVlanMorning,true);
  function phoneMessages(){
    const messages=[welcomeMessage];
    if(!graduated())return messages;
    messages.push(graduationMessage);
    if (hasBadgeProfile() && state.stormStage >= 1) messages.push(stormAlert);
    if (hasBadgeProfile() && !awaitingDispatch()) {
      const dispatchTimes=['09:01','10:16','11:31','13:01'];
      const restoreTimes=['10:15','11:30','13:00','15:00'];
      const destinations=['all’ospedale San Luca','alla sede della protezione civile','al Municipio','di nuovo alla Protezione civile'];
      for(let index=0;index<=state.completed;index++){
        const stage=index===state.completed?(state.fieldStage??2):2;
        if(index>0&&stage>=1)messages.push([missions[index-1].site+' · Collegamento ripristinato',fieldMessages[index-1],`Giorno 02 · ${restoreTimes[index-1]}`]);
        if(missions[index]&&stage===2)messages.push([missions[index].site,`Vai ${destinations[index]}. `+missions[index].radio.replace(/^«|»$/g,''),`Giorno 02 · ${dispatchTimes[index]}`]);
      }
    }
    if(nextDayStarted()){
      messages.push(schoolUpdate);
      if(state.routing?.ripComplete)messages.push(schoolUpdateComplete,routingRequest);
      if(state.routing?.ripComplete&&state.routing.complete){
        messages.push(routingComplete);
        if(!municipalDispatchPending())messages.push(municipalRequest);
      }
      if(state.routing?.municipalComplete){
        messages.push(municipalReport);
        if(!state.vlanMorningPending)messages.push(vlanSchoolMessage);
        if(vlanTrained())messages.push(vlanSchoolComplete);
        if(vlanFieldAvailable())messages.push(vlanMissionMessage);
        if(state.vlan?.complete)messages.push(vlanDoneMessage);
      }
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
  function openPhone(focusedMessage,{withHistory=false,throughFocused=false}={}){
    const history=!focusedMessage||withHistory||throughFocused?phoneMessages():[focusedMessage];
    const focusIndex=throughFocused?history.indexOf(focusedMessage):-1;
    const messages=focusIndex>=0?history.slice(0,focusIndex+1):history;
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
    phoneHasGraduation=Boolean(state.graduationPending&&messages.includes(graduationMessage));
    phoneHasFinalReport=!focusedMessage&&districtRestored()&&state.nextDayStage===0&&state.fieldStage===2;
    if (!$('phone-dialog').open) $('phone-dialog').showModal();
    const briefingIndex=focusedMessage?messages.indexOf(focusedMessage):2 * activeBuilding?.mission + 2;
    const briefing=list.children[briefingIndex];
    if (briefing) {
      list.scrollTop += briefing.getBoundingClientRect().top - list.getBoundingClientRect().top;
    } else {
      list.scrollTop = list.scrollHeight;
    }
  }
  function scheduleSchoolDispatch(message,isPending){
    const showRequest=()=>{
      if(!isPending())return;
      const phone=$('phone-dialog');
      if(phone.open){
        phone.addEventListener('close',showRequest,{once:true});
        return;
      }
      if(!document.querySelector('dialog[open]'))openPhone(message,{withHistory:true});
    };
    window.setTimeout(showRequest,2000);
  }
  function scheduleSchoolMessage(chapter,delay=1000){
    const showMessage=()=>{
      if(state.routing!==chapter||!chapter.ripComplete||chapter.complete)return;
      const phone=$('phone-dialog');
      if(phone.open){
        phone.addEventListener('close',showMessage,{once:true});
        return;
      }
      const dialog=document.querySelector('dialog[open]');
      if(dialog&&!(dialog===$('building-dialog')&&activeBuilding?.id==='school')){
        dialog.addEventListener('close',showMessage,{once:true});
        return;
      }
      openPhone(schoolUpdateComplete);
    };
    if(delay)window.setTimeout(showMessage,delay);
    else showMessage();
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
  const missionBuildings=['hospital','rescue','townhall','rescue'];
  function renderShell(){
    const [day, messageTime]=phoneMessages().at(-1)[2].split(' · ');
    const schoolEvening=awaitingDispatch()&&!state.graduationPending&&(state.stormStage??0)===0;
    const afterMunicipioNight=districtRestored()&&(state.nextDayStage===1||awaitingVlanMorning());
    const dayThree=nextDayStarted();
    const vlanAvailable=dayThree&&state.routing?.municipalComplete&&!state.vlanMorningPending;
    const map=$('map-stage');
    map.classList.toggle('storm',schoolEvening);
    const night=schoolEvening||afterMunicipioNight;
    map.classList.toggle('night',night);
    const cloudy = day === 'Giorno 03' && !night;
    city.setLighting(night ? 'night' : cloudy ? 'cloudy' : 'day');
    let weather={label:'Schiarite',icon:'clearing'};
    if(cloudy)weather={label:'Nuvoloso',icon:'cloud'};
    else if(dayThree||state.completed>=2)weather={label:'Sereno',icon:'sun'};
    else if(state.completed===1)weather={label:'Poco nuvoloso',icon:'clearing'};
    if(schoolEvening)weather={label:'Pioggia',icon:'rain'};
    if(afterMunicipioNight)weather={label:'Notte serena',icon:'moon'};
    const time=afterMunicipioNight||schoolEvening?'21:00':messageTime;
    const weatherPanel = document.querySelector('.weather');
    weatherPanel.setAttribute('aria-label', `Meteo della simulazione: ${weather.label.toLowerCase()}, ${day.toLowerCase()}, ore ${time}`);
    weatherPanel.querySelector('use').setAttribute('href', `#weather-${weather.icon}`);
    weatherPanel.querySelector('span').replaceChildren(
      document.createTextNode(weather.label),
      Object.assign(document.createElement('small'), {textContent:`${day.toUpperCase()} · ${time} · VALLE NORD`})
    );
    const rank=state.vlan?.complete?'Tecnico di distretto':state.routing?.municipalComplete?'Tecnico specialista':graduated()?(districtRestored()?'Tecnico di distretto':'Tecnico di rete'):'In formazione';
    $('phone-open').hidden=false;
    document.querySelector('.profile-chip').hidden=!graduated();
    $('profile-rank').replaceChildren(document.createTextNode('Il tuo tesserino'),Object.assign(document.createElement('small'),{textContent:graduated()?(hasBadgeProfile()?`${rank} · ${xp()} XP`:'Da configurare'):`Da ottenere · ${state.studied.length}/${lessons.length} prove`}));
    document.querySelector('.profile-chip').setAttribute('aria-label',graduated()?'Apri il tuo tesserino da tecnico':`Il tuo tesserino: completa le ${lessons.length} prove della scuola`);
    $('progress-label').textContent=dayThree?`INCARICHI · ${day.toUpperCase()}`:'PERCORSO';
    $('progress-count').textContent=dayThree?'':state.completed+' / '+missions.length;
    $('journey').replaceChildren();
    const stages=[{id:'school',title:'Scuola di reti',info:graduated()?'Completata ✓':`${state.studied.length}/${lessons.length} prove`,done:graduated(),active:!graduated()},...missions.map((mission,index)=>({id:missionBuildings[index],missionIndex:index,title:index===3?mission.title:mission.site,info:index<state.completed?'Online ✓':!graduated()?'Richiede tesserino':index===state.completed?(index===3?'Protezione civile · VLSM':mission.title):'In attesa',done:index<state.completed,active:graduated()&&index===state.completed}))];
    if(dayThree&&!vlanAvailable){
      const trained=Boolean(state.routing?.ripComplete);
      stages.splice(0,stages.length,{id:'school',title:schoolUpdateTitle,info:'Routing statico e RIP',active:!trained,done:trained});
      if(trained)stages.push({id:'hospital',title:'Richiesta di assistenza',info:'Ospedale · Centrale · Protezione civile',active:!state.routing.complete,done:state.routing.complete});
      if(trained&&state.routing.complete&&!municipalDispatchPending())stages.push({id:'townhall',title:municipalTitle,info:'Routing dinamico · RIPv2',active:!state.routing.municipalComplete,done:state.routing.municipalComplete});
    }
    let currentAssignment;
    if(vlanAvailable){
      const trained=vlanTrained();
      const trainingInfo=trained?'Completata ✓':vlanPassed()===vlanLessons.length?RZStp.title:'Switch, trunk e routing';
      stages.splice(0,stages.length,{
        id:'school',title:vlanSchoolMessage[0],info:trainingInfo,active:!trained,done:trained
      });
      if(trained)stages.push({
        id:'services',title:vlanMissionMessage[0],info:'Quattro piani · Quattro VLAN',
        active:!state.vlan?.complete,done:state.vlan?.complete
      });
      currentAssignment=stages.at(-1);
      $('instructions-title').textContent=currentAssignment.title;
    }else{
      $('instructions-title').textContent='Valle Nord';
    }
    stages.filter(stage=>(!awaitingDispatch() || stage.id==='school') && !(stage.active && awaitingFieldDispatch()) && (stage.missionIndex!==3||state.completed>=3) && (stage.id==='services'||isBuildingDiscovered(stage.id,state.completed,state.studied))).forEach((stage,i)=>{const b=makeButton('',()=>openBuilding(stage.id,false,stage.missionIndex),'journey-step'+(stage.active?' current':'')+(stage.done?' done':''));const num=document.createElement('span');num.className='step-number';num.textContent=stage.done?'✓':String(dayThree?i+1:i).padStart(2,'0');const text=document.createElement('span'),title=document.createElement('strong'),sub=document.createElement('small');title.textContent=stage.title;sub.textContent=stage.info;text.append(title,sub);b.append(num,text);$('journey').append(b);});
    $('world-status').textContent=!graduated()?'La scuola è aperta. Inizia da lì.':(awaitingDispatch()||awaitingFieldDispatch())?'In attesa di indicazioni dalla centrale.':state.completed<missions.length?`${missions[state.completed].site}: intervento disponibile.`:'Distretto riconnesso. Tutti gli interventi completati.';
    $('brief-instruction').textContent=!graduated()?'Completa la scuola, poi ripristina le tre sedi.':(awaitingDispatch()||awaitingFieldDispatch())?'Attendi il messaggio di Elena.':state.completed<missions.length?'Scegli la sede segnalata per il prossimo intervento.':'Le tre sedi sono di nuovo online.';
    if(graduated()&&!hasBadgeProfile()){
      const instruction='Configura il tesserino con nome, età e avatar per iniziare gli interventi.';
      $('world-status').textContent=instruction;
      $('brief-instruction').textContent=instruction;
    }
    if(dayThree){
      const instruction=!state.routing?.ripComplete?'Torna alla scuola di reti per l’aggiornamento.':state.routing.municipalComplete?'Il Municipio comunica con Ospedale e Protezione civile.':municipalDispatchPending()?'Attendi il prossimo messaggio di Elena.':state.routing?.complete?'Vai al Municipio e collegalo alle altre sedi con RIP.':'Verifica il percorso tra ospedale e Protezione civile.';
      $('world-status').textContent=instruction;
      $('brief-instruction').textContent=instruction;
    }
    if(state.routing?.municipalComplete){
      const instruction=municipalMedalPending()?'Il Municipio comunica con Ospedale e Protezione civile.':state.vlanMorningPending?'Attendi il messaggio di Elena al mattino.':vlanTrained()?(state.vlan?.complete?'Palazzo dei servizi collaudato.':'Raggiungi il Palazzo dei servizi.'):vlanPassed()===vlanLessons.length?'Torna al Galilei per la prova su STP.':'Elena ti aspetta al Galilei per la formazione VLAN.';
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
    if(dayThreeMarkers&&state.routing?.ripComplete&&state.routing.complete&&!municipalDispatchPending())dayThreeMarkers.set('townhall',municipalTitle);
    const visibleMarkers=currentAssignment
      ?new Map([[currentAssignment.id,currentAssignment.title]])
      :dayThreeMarkers;
    if(vlanAvailable&&state.vlan?.complete)visibleMarkers.set('services',vlanMissionMessage[0]);
    if(vlanAvailable&&vlanTrained())visibleMarkers.set('school','Formazione VLAN completata ✓');
    city.update(state,awaitingDispatch(),visibleMarkers);
  }
  function openBuilding(id,showBadge=false,missionIndex){
    const site=buildings.find(b=>b.id===id);if(!site)return;if(id==='services'?!(state.routing?.municipalComplete&&vlanFieldAvailable()):id!=='hq'&&!isBuildingDiscovered(id,state.completed,state.studied))return;
    const index=missionIndex??(id==='rescue'&&state.completed>=3?3:site.mission);
    if(index===3&&state.completed<3)return;
    if (Number.isInteger(site.mission) && !hasBadgeProfile()) {
      openBuilding('hq');
      return;
    }
    if (Number.isInteger(site.mission) && (awaitingDispatch() || (index===state.completed && awaitingFieldDispatch()))) return;
    if(nextDayStarted()&&Number.isInteger(site.mission)
      &&(!state.routing?.ripComplete||(id==='townhall'&&(!state.routing.complete||municipalDispatchPending()))))return;
    activeBuilding=site;returnFocus=document.activeElement;city.focus(id);
    $('building-dialog').classList.toggle('school-screen',id==='school');$('building-dialog').classList.toggle('mission-screen',Number.isInteger(site.mission));$('building-badge').textContent=site.badge+' / '+site.name;
    const routingSite=['hospital','hq','rescue'].indexOf(id);
    const routingLab=nextDayStarted()&&id==='school';
    const routingField=nextDayStarted()&&state.routing?.ripComplete&&routingSite>=0&&!showBadge;
    const municipalField=nextDayStarted()&&state.routing?.ripComplete&&state.routing.complete&&id==='townhall';
    if(id==='services'||(id==='school'&&state.routing?.municipalComplete&&!state.vlanMorningPending)){
      $('building-dialog').classList.toggle('mission-screen',id==='services');
      renderVlan(id==='services');
    }else if(routingLab||routingField||municipalField){
      $('building-dialog').classList.toggle('mission-screen',routingField||municipalField);
      $('building-badge').textContent='CAPITOLO 02 / '+site.name;
      renderRouting(routingLab,municipalField?3:routingField?routingSite:0,undefined,municipalField);
    }else if(id==='school'){activeLesson=Math.max(0,lessons.findIndex(l=>!state.studied.includes(l.id)));renderSchool();}
    else if(id==='hq')renderHeadquarters();else renderMission(site,index);
    if(!$('building-dialog').open)$('building-dialog').showModal();
  }
  function celebrateSchoolCompletion(){
    celebrateMedal('base',()=>{
      const graduationState=state;
      window.setTimeout(()=>{
        if(state!==graduationState||!state.graduationPending)return;
        const modal=document.querySelector('dialog[open]:not(#building-dialog)');
        if(!modal&&activeBuilding?.id==='school'&&$('building-dialog').open){
          openPhone(graduationMessage,{withHistory:true});
        }else scheduleDispatch();
      },1000);
    });
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
    if(lesson.id==='vlsm')$('practice-fields').classList.add('vlsm-practice-fields');
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
    function renderVlsmVisual(){
      const blocks=[
        ['Prima sottorete',20,'192.168.40.0',27],
        ['Seconda sottorete',10,'192.168.40.32',28],
        ['Riserva','—','192.168.40.48',28]
      ];
      conceptVisual.classList.add('subnet-visual');
      if(concept===1){
        const rows=blocks.slice(0,2).map(([,required,network,prefix])=>{
          const {total}=ReteZero.calculate(network,prefix);
          return `<tr><th scope="row">${required}</th><td>${required+2}</td><td>${total} indirizzi</td><td>/${prefix}</td></tr>`;
        });
        conceptVisual.innerHTML=`
          <div class="subnet-visual-heading"><span>DIMENSIONAMENTO VLSM</span></div>
          <div class="subnet-table-wrap"><table class="subnet-table" aria-label="Dimensionamento delle sottoreti VLSM">
            <thead><tr><th scope="col">IP richiesti, gateway incluso</th><th scope="col">Con rete e broadcast</th><th scope="col">Blocco minimo</th><th scope="col">Prefisso</th></tr></thead>
            <tbody>${rows.join('')}</tbody>
          </table></div>`;
        return;
      }
      const rows=blocks.map(([label,required,network,prefix])=>{
        const {first,last,broadcast,hosts}=ReteZero.calculate(network,prefix);
        return `<tr${label==='Riserva'?' class="focus-row"':''}><th scope="row">${label}</th><td>${network}/${prefix}</td><td>${required} / ${hosts}</td><td>${first} – ${last}</td><td>${broadcast}</td></tr>`;
      });
      conceptVisual.innerHTML=`
        <div class="subnet-visual-heading"><span>ASSEGNAZIONE VLSM</span></div>
        <div class="subnet-visual-summary"><span>Rete iniziale <strong>192.168.40.0/26</strong></span><span>Ordine <strong>Dal blocco più grande al più piccolo</strong></span></div>
        <div class="subnet-table-wrap"><table class="subnet-table" aria-label="Piano di indirizzamento VLSM">
          <thead><tr><th scope="col">Blocco</th><th scope="col">Rete e prefisso</th><th scope="col">IP richiesti / disponibili</th><th scope="col">Host utilizzabili</th><th scope="col">Broadcast</th></tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table></div>
        <p class="subnet-visual-note">La /28 parte da .32, subito dopo il broadcast .31. Restano 16 indirizzi contigui nel blocco di riserva.</p>`;
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
    function renderConcept(){const [title,body]=lesson.paragraphs[concept];$('concept-title').textContent=title;renderConceptBody(body);$('concept-count').textContent=`${concept+1} / ${lesson.paragraphs.length}`;$('concept-dots').textContent=lesson.paragraphs.map((_,i)=>i===concept?'●':'○').join(' ');$('concept-prev').disabled=concept===0;$('concept-next').disabled=concept===lesson.paragraphs.length-1;conceptVisual.hidden=!((lesson.binaryExample&&concept===1)||(lesson.maskVisual&&concept>0)||(lesson.subnetVisual&&concept===1)||(lesson.id==='vlsm'&&concept>0));if(lesson.maskVisual)renderMaskVisual();if(lesson.subnetVisual&&concept===1)renderSubnetVisual();if(lesson.id==='vlsm'&&concept>0)renderVlsmVisual();}
    $('concept-prev').addEventListener('click',()=>{concept=Math.max(0,concept-1);renderConcept();});$('concept-next').addEventListener('click',()=>{concept=Math.min(lesson.paragraphs.length-1,concept+1);renderConcept();});renderConcept();
    bindSchoolViews();
    const example=lesson.example;const workedExample=document.querySelector('.worked-example');workedExample.innerHTML=`<div><span class="eyebrow">ESEMPIO / ${example.title}</span><strong>${example.value}</strong></div><div class="example-result">${example.rows.map(([label,value])=>`<span>${label}<strong>${value}</strong></span>`).join('')}</div>`;if(lesson.maskVisual){workedExample.dataset.dynamicMask='true';updateMaskExample();}
    function updateSchoolAction(){
      if(graduated()){
        badge.querySelector('strong').textContent=hasBadgeProfile()?'Tesserino ottenuto':'Formazione completata';
        badge.querySelector('small').textContent=hasBadgeProfile()?'Pronto per il primo intervento.':'Configura il tesserino per operare.';
      }
      if(!state.studied.includes(lesson.id))return;
      if(activeLesson<lessons.length-1){
        $('practice-next').replaceChildren(makeButton('Continua',()=>{
          rememberLesson();
          activeLesson++;
          renderSchool();
          nav.querySelector('[aria-current="step"]').focus();
        },'primary next-activity action-triangle'));
        return;
      }
      if(!graduated())return;
      const badgeButton=makeButton('Apri il tesserino',()=>openBuilding('hq',true),'primary next-activity action-triangle');
      badgeButton.id='school-open-badge';
      badgeButton.disabled=Boolean(state.graduationPending);
      $('practice-next').replaceChildren(badgeButton);
    }
    function completeLesson(){
      const wasGraduated=graduated();
      if(!state.studied.includes(lesson.id))state.studied.push(lesson.id);
      const justGraduated=!wasGraduated&&graduated();
      if(justGraduated)state.graduationPending=true;
      save();
      renderShell();
      document.querySelector('.practice-status').textContent='SUPERATA ✓';
      document.querySelector('.school-seal strong').textContent=`${state.studied.length} / ${lessons.length}`;
      const current=nav.querySelector('[aria-current="step"]');
      current.firstChild.textContent='✓';
      const next=current.nextElementSibling;
      if(next?.classList.contains('course-button')){
        next.disabled=false;
        next.classList.remove('locked');
        next.removeAttribute('aria-label');
        next.removeAttribute('title');
      }
      updateSchoolAction();
      if(justGraduated)celebrateSchoolCompletion();
    }
    updateSchoolAction();
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
    const remember=command=>{
      history.push(command);
      remember.reset();
    };
    remember.reset=()=>{
      position=history.length;
      draft='';
    };
    return remember;
  }
  function renderTrainingTerminal(lesson,onComplete){
    const form=$('practice-form'),fields=$('practice-fields'),calculator=$('practice-calculator'),feedback=$('practice-feedback');calculator.hidden=true;fields.className='training-terminal';fields.replaceChildren();
    const routerLesson=lesson.id==='cli-router';
    const topology=document.createElement('div');
    topology.className='routing-school-network';
    const [icon,label]=routerLesson?['router','Router']:['pc','PC della LAN'];
    topology.innerHTML=`<div class="routing-path training-device-view"><ol aria-label="Dispositivo della prova">
      <li><div class="routing-device-node" aria-current="true">
        <img src="assets/icons/${icon}.png" alt=""><span>${label}</span>
      </div></li>
    </ol></div>`;
    form.classList.add('routing-school-practice');
    fields.before(topology);
    const screen=document.createElement('div');screen.className='terminal-screen';screen.setAttribute('aria-live','polite');
    const terminalRevision=lesson.id==='cli'?4:2;
    const saved=state.lessonDrafts[lesson.id]&&typeof state.lessonDrafts[lesson.id]==='object'?state.lessonDrafts[lesson.id]:{};let step=saved.terminalRevision===terminalRevision?Math.min(Number(saved.terminalStep)||0,lesson.terminal.steps.length):0;
    for(let i=0;i<step;i++){const command=document.createElement('p');command.className='terminal-command';command.textContent=lesson.terminal.steps[i].prompt+lesson.terminal.steps[i].command;screen.append(command);if(lesson.terminal.steps[i].response){const response=document.createElement('p');response.textContent=lesson.terminal.steps[i].response;screen.append(response);}}
    const prompt=document.createElement('label');prompt.className='terminal-prompt';const promptText=document.createElement('span');promptText.setAttribute('aria-hidden','true');promptText.textContent=lesson.terminal.steps[step]?.prompt||lesson.terminal.steps.at(-1).prompt;prompt.append(promptText);const input=document.createElement('input');input.name='command';input.autocomplete='off';input.spellcheck=false;input.placeholder=step<lesson.terminal.steps.length?'Digita un comando':'';input.disabled=step>=lesson.terminal.steps.length;prompt.append(input);fields.append(screen,prompt);
    const question=$('practice-question');
    question.setAttribute('aria-live','polite');
    function updateInstruction(){
      const current=lesson.terminal.steps[step];
      const completedTitle=routerLesson?'Configurazione del router completata.':'Configurazione del PC completata.';
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
  async function runPcPing(destination,ttl,control,print){
    const sent=4;
    const success=ttl!==null;
    const received=success?sent:0;
    const lost=sent-received;
    const times=[12,39,48,40];
    const lock=control instanceof HTMLButtonElement?'disabled':'readOnly';
    const wasLocked=control[lock];
    control[lock]=true;
    try{
      print(`Pinging ${destination} with 32 bytes of data:\n`);
      for(let attempt=0;attempt<sent;attempt++){
        await new Promise(resolve=>setTimeout(resolve,success?(attempt===0?250:650):1000));
        if(!control.isConnected||!$('building-dialog').open)return false;
        print(success
          ?`Reply from ${destination}: bytes=32 time=${times[attempt]}ms TTL=${ttl}`
          :'Request timed out.');
      }
      const lines=[
        `\nPing statistics for ${destination}:`,
        `    Packets: Sent = ${sent}, Received = ${received}, Lost = ${lost} (${lost/sent*100}% loss),`
      ];
      if(success){
        const average=Math.floor(times.reduce((sum,time)=>sum+time,0)/received);
        lines.push('Approximate round trip times in milli-seconds:',
          `    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Average = ${average}ms`);
      }
      print(lines.join('\n'));
      return success;
    }finally{
      control[lock]=wasLocked;
    }
  }
  function setupFieldRouter(index, config, allowed){
    const {ipv4,address}=ReteZero;
    const routerPorts=index===2?ReteZero.municipalPorts:ReteZero.rescuePorts;
    const ports=config.ports;
    if(index===3&&state.completed===3&&config.pings){
      for(const {name} of routerPorts){
        if(!config.pcs?.[name])delete config.pings[name];
      }
    }
    const panel=$('mission-fields');
    const terminalTitle=$('mission-terminal-title');
    const routerTitle=terminalTitle.textContent;
    const promptLabel=document.querySelector('.mission-terminal-form label span');
    let mode='user', selected, pcIndex=null;
    const pcLabels=['Sala operativa','Squadra mobile'];
    const prompt=()=> pcIndex!==null ? pcLabels[pcIndex]+'>' : (config.hostname||'Router')+{user:'>',privileged:'#',global:'(config)#',port:'(config-if)#'}[mode];
    panel.innerHTML=`
      <label>
        <span class="municipal-port-heading">
          <span id="municipal-port-ip-label">Indirizzo IP</span>
          <span id="mission-port-badges" class="municipal-port-badges">
            <span id="municipal-port-caption" role="status">Porta —</span>
            <span id="municipal-port-state" role="status">OFF</span>
          </span>
        </span>
        <input id="municipal-port-ip" aria-labelledby="municipal-port-ip-label" readonly placeholder="—">
      </label>
      <label>Subnet mask<input id="municipal-port-mask" readonly placeholder="—"></label>
      <label><span id="municipal-port-gateway-label">Gateway del reparto</span><input id="municipal-port-gateway" readonly placeholder="—"></label>
      <label>Server DNS<input name="dns" value="0.0.0.0" readonly placeholder="—"></label>
    `;
    const portBadges=$('mission-port-badges');
    const ipLabel=$('municipal-port-ip-label');
    const gatewayLabel=$('municipal-port-gateway-label');
    const portCaption=$('municipal-port-caption');
    const portIp=$('municipal-port-ip');
    const portMask=$('municipal-port-mask');
    const portGateway=$('municipal-port-gateway');
    const status=$('municipal-port-state');
    const dnsField=panel.querySelector('[name="dns"]');
    function renderPort(){
      const pc=pcIndex===null?null:routerPorts[pcIndex];
      const activePort=pc?.name??selected;
      const port=ports[activePort];
      const pcConfig=pc?config.pcs?.[pc.name]:null;
      terminalTitle.textContent=pc?'PC / '+pcLabels[pcIndex]:routerTitle;
      ipLabel.textContent=pc?'IP del PC':'Indirizzo IP';
      gatewayLabel.textContent=pc?'Gateway predefinito':'Gateway del reparto';
      portBadges.hidden=Boolean(pc);
      const caption=activePort?'Porta '+activePort.replace('GigabitEthernet','Gi'):'Porta —';
      if(portCaption.textContent!==caption)portCaption.textContent=caption;
      portIp.value=(pc?pcConfig?.ip:port?.ip)??'';
      portMask.value=(pc?pcConfig?.mask:port?.mask)??'';
      portGateway.value=pc?(pcConfig?.gateway??''):portIp.value;
      dnsField.value=pc?(pcConfig?.dns??''):'0.0.0.0';
      const enabled=port?.enabled===true;
      status.classList.toggle('is-on',enabled);
      const stateText=enabled?'ON':'OFF';
      if(status.textContent!==stateText)status.textContent=stateText;
      promptLabel.textContent=prompt();
    }
    function selectDevice(device){
      pcIndex=device==='router'?null:Number(device);
      renderPort();
    }
    renderPort();
    async function run(raw,print,ping){
      print(raw,true,prompt());
      const command=raw.toLowerCase().replace(/\s+/g,' ');
      const iface=/^(?:interface|int) (?:gi|gigabitethernet) ?0\/([01])$/.exec(command);
      const ipCommand=/^ip address (\S+) (\S+)$/.exec(command);
      if(!allowed){print('Completa prima il percorso richiesto.');return;}
      if(pcIndex!==null){
        const port=routerPorts[pcIndex];
        const pcConfig=config.pcs?.[port.name];
        if(command==='ipconfig'||command==='ipconfig /all'){
          print([
            'Indirizzo IPv4: '+(pcConfig?.ip??'0.0.0.0'),
            'Subnet mask: '+(pcConfig?.mask??'0.0.0.0'),
            'Gateway predefinito: '+(pcConfig?.gateway??'0.0.0.0'),
            ...(command.endsWith('/all')?['Server DNS: '+(pcConfig?.dns??'0.0.0.0')]:[])
          ].join('\n'));
          return;
        }
        const expected=ReteZero.calculate(port.network,port.prefix);
        const settings=/^ipconfig (\S+) (\S+) (\S+)(?: (\S+))?$/.exec(command);
        if(settings){
          const [,ip,mask,gateway,dns='0.0.0.0']=settings;
          if(ipv4(ip)!==ipv4(expected.first)||ipv4(mask)!==ipv4(expected.mask)
            ||ipv4(gateway)!==ipv4(expected.last)||ipv4(dns)===null){
            print('Controlla il primo IP utile, la maschera e l’ultimo IP utile per il gateway. Il DNS è facoltativo.');
            return;
          }
          const next={ip:expected.first,mask:expected.mask,gateway:expected.last,dns:address(ipv4(dns))};
          if(Object.keys(next).some(key=>next[key]!==pcConfig?.[key]))delete config.pings?.[port.name];
          (config.pcs??={})[port.name]=next;
          renderPort();
          updateMissionChecklist(index);
          save();
          return;
        }
        const destination=/^ping (\S+)$/.exec(command)?.[1];
        if(!destination){print('Usa ipconfig <IP> <maschera> <gateway> [DNS] oppure ping <gateway>.');return;}
        if(!pcConfig){print('Configura prima questo PC con ipconfig <IP> <maschera> <gateway>.');return;}
        const target=ipv4(destination);
        if(target===null){print(`Ping request could not find host ${destination}.`);return;}
        const reachable=target===ipv4(pcConfig.gateway)&&ReteZero.verifyRouterPort(ports,port,pcIndex).ok;
        if(await ping(address(target),reachable?255:null)){
          (config.pings??={})[port.name]=true;
          updateMissionChecklist(index);
          save();
        }
        return;
      }
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
        selected=routerPorts[Number(iface[1])].name;
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
        if(ports[selected]?.ip!==nextIp||ports[selected]?.mask!==nextMask){config.routerStep=0;delete config.pings?.[selected];}
        ports[selected]={...ports[selected],ip:nextIp,mask:nextMask};
      }else if((command==='no shutdown'||command==='shutdown')&&mode==='port'){
        const enabled=command==='no shutdown';
        if(Boolean(ports[selected]?.enabled)!==enabled){config.routerStep=0;delete config.pings?.[selected];}
        ports[selected]={...ports[selected],enabled};
      }else if(command==='show ip interface brief'&&mode==='privileged'){
        const lines=routerPorts.map(({name})=>{
          const port=ports[name],status=port?.enabled?'up':'administratively down';
          return name.padEnd(22)+(port?.ip||'unassigned').padEnd(17)+status.padEnd(23)+(port?.enabled?'up':'down');
        });
        print(['Interface             IP-Address       Status                 Protocol',...lines].join('\n'));
        const result=index===2?ReteZero.verify(index,config)
          :routerPorts.map((port,i)=>ReteZero.verifyRouterPort(ports,port,i)).find(check=>!check.ok)??{ok:true};
        if(result.ok)config.routerStep=Math.max(2,config.routerStep??0);
        const feedback=$('mission-feedback');
        feedback.className=result.ok?'feedback':'feedback error';
        feedback.textContent=result.ok?(index===3?'Porte controllate. Configura entrambi i PC e verifica i gateway con un ping.':'Porte controllate. Premi «Applica e verifica» per concludere.'):result.message;
      }else{print('% Comando non valido in questa modalità.');return;}
      renderPort();
      updateMissionChecklist(index);
      save();
    }
    return {selectDevice,run};
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
      const portChecks=ReteZero.municipalPorts.map((port,portIndex)=>
        ReteZero.verifyRouterPort(config?.ports,port,portIndex).ok);
      const allPortsReady=portChecks.every(Boolean);
      const routerStep=config?.routerStep??0;
      routerChecks=[...portChecks,allPortsReady&&routerStep>=2,allPortsReady&&routerStep>=3];
    }
    if(index===3){
      const ready=ReteZero.rescuePorts.map((port,i)=>ReteZero.verifyRouterPort(config?.ports,port,i).ok);
      routerChecks=[...ready,ready.every(Boolean)&&(config?.routerStep??0)>=2,ready.every(Boolean)&&ReteZero.rescuePorts.every(port=>config.pings?.[port.name]),config?.routerStep===3&&ReteZero.verify(3,config).ok];
    }
    Array.from(list.children).forEach((item,stepIndex)=>{
      const done=routerChecks ? routerChecks[stepIndex] : stepIndex<completed;
      const status=item.firstElementChild;
      status.textContent=done?'✓':'';
      status.setAttribute('aria-label',done?'Completato':'Da completare');
      item.classList.toggle('is-complete',done);
    });
  }
  function setupMissionTerminal(index,allowed,router){
    const terminalForm=document.querySelector('.mission-terminal-form'),output=document.querySelector('.mission-terminal-output'),configForm=$('mission-form'),input=terminalForm.elements.command;
    const logs=state.missionLogs??=[];
    const savedLog=logs[index];
    const log=logs[index]=Array.isArray(savedLog)
      ? savedLog.filter(entry=>entry&&typeof entry.message==='string'&&typeof entry.isCommand==='boolean')
      : [];
    let activeDevice='router';
    const history=[];
    const rememberCommand=setupCommandHistory(input,history);
    const legacyPcPrompts=['Sala operativa>','Squadra mobile>'];
    if(index===3){
      // Older saves mark the device only on the command that precedes each response.
      let previousDevice='router';
      for(const entry of log){
        if(entry.isCommand){
          const pc=legacyPcPrompts.indexOf(entry.prompt);
          previousDevice=pc===-1?'router':String(pc);
        }
        entry.device??=previousDevice;
      }
    }
    const appendLine=({message,isCommand,prompt})=>{
      const line=document.createElement('p');
      line.className=isCommand?'terminal-command':'';
      line.textContent=isCommand?(prompt||'C:\\>')+' '+message:message;
      output.append(line);
    };
    const scrollToLatest=()=>{output.scrollTop=output.scrollHeight;};
    function renderLog(){
      output.replaceChildren();
      history.length=0;
      for(const entry of log){
        if((entry.device??'router')!==activeDevice)continue;
        appendLine(entry);
        if(entry.isCommand)history.push(entry.message);
      }
      rememberCommand.reset();
      scrollToLatest();
    }
    renderLog();
    const devices=document.querySelectorAll('[data-field-device]');
    devices.forEach(button=>button.addEventListener('click',()=>{
      const device=button.dataset.fieldDevice;
      if(device!==activeDevice){
        activeDevice=device;
        router.selectDevice(device);
        devices.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.fieldDevice===device)));
        input.value='';
        renderLog();
      }
      input.focus({preventScroll:true});
    }));
    if(!output.childElementCount&&index<2&&index<state.completed){
      const saved=state.drafts[index];
      if(saved&&ReteZero.verify(index,saved).ok){
        const {mask}=ReteZero.calculate(saved.ip,Number(saved.prefix));
        const args=[saved.ip,mask];
        if(saved.gateway)args.push(saved.gateway);
        if(saved.gateway&&saved.dns&&saved.dns!=='0.0.0.0')args.push(saved.dns);
        const command='ipconfig '+args.join(' ');
        appendLine({message:command,isCommand:true});
        rememberCommand(command);
      }
    }
    const print=(message,isCommand=false,prompt,device=activeDevice)=>{
      const entry={message,isCommand,prompt,device};
      log.push(entry);
      if(device===activeDevice){
        appendLine(entry);
        scrollToLatest();
      }
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
      if(!raw||input.readOnly)return;
      rememberCommand(raw);
      input.value='';
      if(router){
        const device=activeDevice;
        router.run(raw,print,(destination,ttl)=>
          runPcPing(destination,ttl,input,message=>print(message,false,undefined,device)));
        return;
      }
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
    const sheetButton=$('mission-sheet');
    const sheet=$('mission-sheet-content');
    const setSheetOpen=open=>{
      sheet.hidden=!open;
      sheetButton.setAttribute('aria-expanded',String(open));
    };
    const setHintOpen=expanded=>{
      hintText.hidden=!expanded;
      hintButton.setAttribute('aria-expanded',String(expanded));
      const label=expanded?'Nascondi indizio':'Mostra indizio';
      hintButton.setAttribute('aria-label',label);
      hintButton.title=label;
    };
    sheetButton.addEventListener('click',()=>{
      setHintOpen(false);
      setSheetOpen(sheet.hidden);
    });
    hintButton.addEventListener('click',()=>{
      setSheetOpen(false);
      setHintOpen(hintText.hidden);
    });
  }
  function missionHeader({eyebrow,title,story,reference,done}){
    return `<div class="building-hero mission-hero"><div><p class="eyebrow">${eyebrow}</p><h2 id="building-title">${title}</h2><p>${story}</p></div><div class="mission-hero-tools"><div class="incident-badge ${done?'repaired':''}"><span>${done?'✓':'!'}</span><strong>${done?'COLLEGAMENTO RIPRISTINATO':'SEGNALAZIONE APERTA'}</strong><small>${reference}</small></div><button id="mission-phone" class="icon-button" type="button" aria-label="Apri i messaggi di Elena" title="Messaggi di Elena" aria-haspopup="dialog"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="#b5d9c4"><path transform="translate(24 0) scale(-1 1)" d="M5.1 3.5c.8-.6 1.9-.5 2.5.3l2.6 3.4c.5.7.5 1.6-.1 2.2l-1.6 1.7a14 14 0 0 0 4.4 4.4l1.7-1.6c.6-.6 1.5-.6 2.2-.1l3.4 2.6c.8.6.9 1.7.3 2.5l-1 1.2c-.8.9-2 1.3-3.1 1C9.7 19.4 4.6 14.3 2.9 7.6c-.3-1.1.1-2.3 1-3.1z"/></svg></button></div></div>`;
  }
  function missionLayout({header,extraClass='',hint='',sheet,ticket,terminalTitle,fields,terminal,notice='',footer,actions,afterFeedback=''}){
    return `${missionHeader(header)}
      <div class="intervention-layout ${extraClass}">
        <aside class="ticket-panel">
          <div class="config-heading">
            <button id="mission-sheet" class="icon-button" type="button" aria-expanded="false" aria-controls="mission-sheet-content">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6"/></svg>
              Scheda tecnica
            </button>
            <button id="mission-hint" class="icon-button" type="button" aria-label="Mostra indizio" title="Mostra indizio" aria-expanded="false" aria-controls="mission-hint-text">?</button>
            <div id="mission-sheet-content" role="region" aria-labelledby="mission-sheet" hidden>${sheet}</div>
            <div id="mission-hint-text" class="hint" hidden>${hint}</div>
          </div>
          ${ticket}
        </aside>
        <section class="configuration" aria-label="Configurazione di rete">
          <div class="config-heading">
            <div><span class="eyebrow">CONFIGURAZIONE DI RETE</span><h3 id="mission-terminal-title">${terminalTitle}</h3></div>
            <span class="onsite">SIMULAZIONE</span>
          </div>
          ${notice}
          <div class="mission-workspace with-prompt">
            <div class="mission-field-column">${fields}</div>
            ${terminal}
          </div>
          ${footer}
          ${afterFeedback}
          <div class="practice-actions mission-actions">${actions}</div>
        </section>
      </div>`;
  }
  function renderMission(site,index){
    const mission=missions[index],allowed=canEnterMission(index,state.completed,state.studied),done=index<state.completed;
    const isRadio=index===1;
    const usesRouter=index>=2;
    const lanLabels=index===2?['PC Sindaco','PC Vicesindaco']:['Sala operativa','Squadra mobile'];
    const lanPorts=index===2?ReteZero.municipalPorts:ReteZero.rescuePorts;
    const terminalLabel=isRadio?'Radio Squadra Nord':'PC Pronto soccorso';
    const consoleDevices=index===3
      ? [['0',lanLabels[0]],['router','Router'],['1',lanLabels[1]]]
      : [['router',usesRouter?'Router':terminalLabel]];
    const nodeTag=index===3?'button':'span';
    const localTopology=usesRouter?`<div class="routing-path field-local-path">
      <h3>Architettura di rete</h3>
      <ol>
        <li><${nodeTag} class="routing-node routing-local-node"${index===3?' type="button" data-field-device="0" aria-pressed="false"':''}><img src="assets/icons/pc.png" alt="" width="56" height="56">${lanLabels[0]}</${nodeTag}></li>
        <li><button class="routing-node routing-local-node field-local-router" type="button" data-field-device="router" aria-pressed="true">
          <img src="assets/icons/router.png" alt="" width="56" height="56">Router
          <span class="routing-router-ports">${lanPorts.map(({name})=>`<span>${name.replace("GigabitEthernet","Gi")}</span>`).join("")}</span>
        </button></li>
        <li><${nodeTag} class="routing-node routing-local-node"${index===3?' type="button" data-field-device="1" aria-pressed="false"':''}><img src="assets/icons/pc.png" alt="" width="56" height="56">${lanLabels[1]}</${nodeTag}></li>
      </ol>
    </div>`:`<div class="routing-path field-local-path">
      <h3>Architettura di rete</h3>
      <ol>
        <li><button type="button" class="routing-node routing-local-node" data-field-device="router" aria-pressed="true"><img src="assets/icons/${isRadio?'radio':'pc'}.png" alt="" width="56" height="56">${terminalLabel}</button></li>
        <li${isRadio?' class="field-radio-link"':''}>
          ${isRadio?'<span class="field-radio-symbol" role="img" aria-label="Collegamento radio">)))</span>':''}
          <span class="routing-node routing-local-node">
          <img src="assets/icons/switch.png" alt="" width="56" height="56">Switch
          <span class="routing-router-ports">${isRadio?'':'<span>Fa0/1</span>'}<span class="field-uplink">Gi0/1</span></span>
        </span></li>
        <li><span class="routing-node routing-local-node field-local-router">
          <img src="assets/icons/router.png" alt="" width="56" height="56">Router ${site.name}
          <span class="routing-router-ports"><span>Gi0/0</span></span>
        </span></li>
      </ol>
    </div>`;
    $('building-content').innerHTML=missionLayout({
      extraClass:'routing-intervention',
      header:{
        eyebrow:'EPISODIO '+String(index+1).padStart(2,'0')+' / '+site.name,
        title:mission.title+'.',
        story:mission.story,
        reference:'PRATICA VN–0'+(index+1)+' · '+mission.topic,
        done
      },
      sheet:'<dl id="mission-evidence" class="evidence"></dl>',
      ticket:`${localTopology}${mission.steps ? `<ul class="mission-steps" id="mission-steps" role="list" aria-label="Passaggi dell’intervento">${mission.steps.map(step => `<li><span class="mission-step-status" role="img"></span><span>${step}</span></li>`).join('')}</ul>` : `<div class="ticket-note">${index===2?'Progetta prima le sottoreti, poi verifica gli intervalli.':'Controlla gli indirizzi prima di sostituire apparati funzionanti.'}</div>`}`,
      terminalTitle:index===1?'Radio mobile / Squadra Nord':index===2?'Router / Municipio':index===3?'Router / Protezione civile':'Terminale / Pronto soccorso',
      notice:'<div id="mission-lock"></div>',
      fields:'<form id="mission-form"><div id="mission-fields" class="fields"></div></form>',
      terminal:`<div class="field-console"><div class="field-console-devices" role="group" aria-label="Dispositivi della sede">${consoleDevices.map(([device,label])=>`<button type="button" class="routing-device-link" data-field-device="${device}" aria-pressed="${device==='router'}">${label}</button>`).join('')}</div><div class="mission-cli"><div class="mission-terminal-output" aria-live="polite"></div><form class="mission-terminal-form"><label><span>C:\\&gt;</span><input name="command" autocomplete="off" spellcheck="false" placeholder="Digita un comando"></label><button type="submit">Esegui</button></form></div></div>`,
      footer:`<div id="mission-feedback" role="status" class="feedback">${done?'Intervento già completato. Puoi rivedere e provare una configurazione.':'Le modifiche riguardano soltanto la simulazione.'}</div>`,
      afterFeedback:'<div id="mission-next"></div>',
      actions:'<button class="secondary" id="mission-calculator" type="button">Banco di calcolo</button><button class="primary" id="verify-mission" type="submit" form="mission-form">Applica e verifica <span aria-hidden="true">▸</span></button>'
    });
    if(mission.steps)updateMissionChecklist(index);
    $('mission-phone').addEventListener('click', ()=>openPhone());
    $('mission-evidence').replaceChildren(...mission.evidence.flatMap(([label,value])=>[
      Object.assign(document.createElement('dt'),{textContent:label}),
      Object.assign(document.createElement('dd'),{textContent:value})
    ]));
    if(mission.evidenceNote){
      const note=document.createElement('p');
      note.className='mission-evidence-note';
      note.textContent=mission.evidenceNote;
      $('mission-evidence').after(note);
    }
    appendFields($('mission-fields'),mission.fields,state.drafts[index]);$('mission-hint-text').textContent=mission.hint;
    setupMissionHint();
    $('mission-calculator').addEventListener('click',()=>openCalculator({ip:index===0?'192.168.10.20':index===1?'192.168.20.70':index===2?'192.168.30.77':'192.168.20.128',prefix:[24,26,25,26][index]}));
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
      setupMissionTerminal(index,allowed,setupFieldRouter(index,config,allowed));
      updateMissionChecklist(index);
    }
    $('mission-fields').querySelectorAll('input:not([type="hidden"])').forEach(field=>{
      field.readOnly=true;
      field.tabIndex=-1;
    });
    if(!allowed){const lock=$('mission-lock');lock.className='lock-notice';const text=document.createElement('p');text.textContent=!graduated()?`Prima di intervenire completa le ${lessons.length} prove della scuola e ottieni il tesserino da tecnico.`:'Questo intervento segue quello della sede precedente. Puoi consultare la scheda, poi tornare alla missione aperta.';lock.append(text,makeButton(!graduated()?'Vai alla scuola →':'Apri l’intervento precedente →',()=>openBuilding(!graduated()?'school':missionBuildings[state.completed]),'secondary'));$('verify-mission').disabled=true;}
    $('mission-form').addEventListener('submit',event=>{
      event.preventDefault();
      if(!canEnterMission(index,state.completed,state.studied))return;
      const config=state.drafts[index]??Object.fromEntries(new FormData(event.currentTarget));
      const result=ReteZero.verify(index,config);
      const feedback=$('mission-feedback');
      if(result.ok&&index>=2&&(config.routerStep??0)<2){
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
      if(index>=2)config.routerStep=3;
      else state.drafts[index]={...config,hostStep:3};
      const fresh=state.completed===index;state.completed=Math.max(state.completed,index+1);if(fresh)state.fieldStage=0;save();renderShell();document.querySelector('.incident-badge').classList.add('repaired');document.querySelector('.incident-badge>span').textContent='✓';document.querySelector('.incident-badge strong').textContent='COLLEGAMENTO RIPRISTINATO';
      if(mission.steps)updateMissionChecklist(index);
      if(fresh&&districtRestored())operationalMedalPending=true;
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
  const medals={
    base:{label:'Tecnico di base',message:'Hai superato tutte le prove della formazione di base al Galilei.'},
    operativo:{label:'Tecnico operativo',message:'Hai ripristinato le comunicazioni nelle tre sedi di Valle Nord.'},
    specialista:{label:'Tecnico specialista',message:'Hai collegato il Municipio alla rete di Valle Nord. Ora le tre sedi possono coordinarsi.'},
    distretto:{label:'Tecnico di distretto',message:'Hai collaudato la rete del Palazzo dei servizi. I quattro piani possono comunicare attraverso VLAN e gateway.'},
    'servizi-rete':{label:'Tecnico dei servizi di rete'},
    'servizi-applicativi':{label:'Tecnico dei servizi applicativi'}
  };
  function celebrateMedal(image,afterClose){
    const medal=medals[image];
    const dialog=$('medal-dialog');
    dialog.dataset.medal=image;
    $('medal-image').src=`assets/medaglia-${image}.png`;
    $('medal-title').textContent=medal.label;
    $('medal-message').textContent=medal.message;
    if(afterClose)dialog.addEventListener('close',afterClose,{once:true});
    dialog.showModal();
  }
  function renderBadgeAwards(){
    const awards = [
      {image:'base', earned:graduated(), requirement:'Completa la scuola'},
      {image:'operativo', earned:state.completed>=missions.length, requirement:`Completa tutti gli interventi · ${state.completed}/${missions.length}`},
      {image:'specialista', earned:Boolean(state.routing?.municipalComplete), requirement:'Completa gli interventi del Capitolo 2'},
      {image:'distretto', earned:Boolean(state.vlan?.complete), requirement:'Completa il collaudo del Palazzo dei servizi'},
      {image:'servizi-rete', earned:false, requirement:'Prossimamente'},
      {image:'servizi-applicativi', earned:false, requirement:'Prossimamente'}
    ];
    const reservedCount=9-awards.length;
    const reserved='<li class="badge-award"><span class="badge-award-mark badge-award-placeholder" aria-hidden="true"></span><span class="visually-hidden">Posto riservato per una futura medaglia</span></li>';
    return awards.map(({image,earned,requirement}) => {
      const label=medals[image].label;
      const content=`<img class="badge-award-mark" src="assets/medaglia-${image}.png" alt="" width="68" height="68">`;
      return `<li class="badge-award${earned?' earned':''}">
        ${earned?`<button class="badge-replay" type="button" data-medal="${image}" aria-label="Rivedi la medaglia ${label}" aria-haspopup="dialog">${content}</button>`:`${content}<span class="visually-hidden">${label}. ${requirement}</span>`}
      </li>`;
    }).join('')+reserved.repeat(reservedCount);
  }
  const hasBadgeProfile=()=>Boolean(state.badgeName&&state.badgeAge&&state.avatar);
  function renderHeadquarters(editing=false){
    const dialog=$('building-dialog');
    if(editing){
      dialog.style.setProperty('--badge-overview-height',`${dialog.getBoundingClientRect().height}px`);
    }else{
      dialog.style.removeProperty('--badge-overview-height');
    }
    const isNew=graduated()&&!hasBadgeProfile();
    const showSettings=isNew||editing;
    const cardTag=showSettings?'form':'section';
    const nextMission=awaitingDispatch()?null:missions[state.completed];
    const routingSchoolPassed=routingLessonResults(state.routing).filter(Boolean).length;
    const routingMissions=[state.routing?.complete,state.routing?.municipalComplete];
    const routingMissionsDone=routingMissions.filter(Boolean).length;
    const chapterTwo=nextDayStarted();
    const chapterTwoComplete=chapterTwo&&Boolean(state.routing?.municipalComplete);
    const vlanAvailable=chapterTwoComplete&&!state.vlanMorningPending;
    const chapterLabel=vlanAvailable?'Cap. 03':chapterTwo?'Cap. 02':'Cap. 01';
    const chapterSchool=vlanAvailable?`${vlanPassed()}/${vlanSchoolCount}`:chapterTwo?`${routingSchoolPassed}/${routingLessons.length}`:`${state.studied.length}/${lessons.length}`;
    const chapterMissions=vlanAvailable?`${Number(Boolean(state.vlan?.complete))}/1`:chapterTwo?`${routingMissionsDone}/${routingMissions.length}`:`${state.completed}/${missions.length}`;
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
          <span>
            <strong>${state.studied.length+routingSchoolPassed+vlanPassed()}/${lessons.length+routingLessons.length+vlanSchoolCount}</strong>PROVE SCUOLA TOTALI
            <small>${chapterLabel} · ${chapterSchool}</small>
          </span>
          <span>
            <strong>${state.completed+routingMissionsDone+Number(Boolean(state.vlan?.complete))}/${missions.length+routingMissions.length+1}</strong>INTERVENTI TOTALI
            <small>${chapterLabel} · ${chapterMissions}</small>
          </span>
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
        <div><span class="eyebrow">${state.vlan?.complete?'CAPITOLO 03 COMPLETATO':chapterTwoComplete?'CAPITOLO 02 COMPLETATO':'IL PROSSIMO PASSO'}</span>
        <h3>${state.vlan?.complete?'Palazzo dei servizi in rete':chapterTwoComplete?'Valle Nord è di nuovo online':!graduated()?'Scuola di reti':awaitingDispatch()?'Mappa di Valle Nord':nextMission?nextMission.site:'Primo distretto completato'}</h3>
        <p>${state.vlan?.complete?'I collegamenti tra i piani e il routing tra VLAN sono operativi.':chapterTwoComplete?'Il Municipio è ora collegato all’ospedale e alla Protezione civile.':!graduated()?'Completa la formazione per ottenere l’abilitazione.':awaitingDispatch()?'Torna in città e attendi le indicazioni di Elena.':nextMission?nextMission.title:'Le tre sedi di Valle Nord sono di nuovo collegate.'}</p></div>
        <div class="badge-next-actions">
          <div id="hq-action"></div>
          ${state.vlan?.complete?'<small class="badge-next-notice">Nuovo capitolo in arrivo</small>':''}
        </div>
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
    document.querySelectorAll('.badge-replay').forEach(button=>{
      button.addEventListener('click',()=>celebrateMedal(button.dataset.medal));
    });
    const openSchool=!graduated()||(vlanAvailable&&!vlanTrained());
    $('hq-action').append(makeButton(openSchool?'Entra nella scuola':'Vai alla mappa',
      ()=>openSchool?openBuilding('school'):closeBuilding(),'primary action-triangle'));
  }
  function addSchoolChapterNavigation(nav, active){
    const chapters=document.createElement('nav');
    chapters.className='school-chapters';
    chapters.setAttribute('aria-label','Capitoli del Galilei');
    const titles=['Formazione di base','Oltre la rete locale'];
    if(state.routing?.municipalComplete&&!state.vlanMorningPending)titles.push('Un palazzo, quattro VLAN');
    titles.forEach((title,index)=>{
      const chapter=index+1;
      const button=makeButton('',()=>{
        if(chapter===active)return;
        if(chapter===1){
          activeLesson=0;
          renderSchool();
        }else if(chapter===3){
          renderVlan(false);
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
  function bindSchoolSheet(){
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
  }
  function addVlanLessonNavigation(index){
    const nav=document.querySelector('.course-nav');
    const chapter=state.vlan;
    const firstPending=vlanLessons.findIndex((_,i)=>!chapter.passed.includes(i));
    addSchoolChapterNavigation(nav,3);
    [...vlanLessons,RZStp].forEach(({title},i)=>{
      const done=i===vlanLessons.length?chapter.stpComplete:chapter.passed.includes(i);
      const button=makeButton('',()=>renderVlan(false,i),'course-button'+(i===index?' active':''));
      const marker=document.createElement('span');
      marker.textContent=done?'✓':String(i+1).padStart(2,'0');
      const label=document.createElement('span');
      label.textContent=title;
      button.append(marker,label);
      button.disabled=firstPending>=0&&i>firstPending&&!done;
      button.classList.toggle('locked',button.disabled);
      if(i===index)button.setAttribute('aria-current','step');
      nav.append(button);
    });
  }
  function bindVlanConcepts(concepts){
    $('concept-prev').innerHTML='<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M11.5 4 6.5 9l5 5"/></svg>';
    $('concept-next').innerHTML='<svg viewBox="0 0 18 18" aria-hidden="true"><path d="m6.5 4 5 5-5 5"/></svg>';
    let concept=0;
    function showConcept(){
      const [heading,body,intro]=concepts[concept];
      $('concept-title').textContent=heading;
      renderConceptBody(body,intro);
      $('concept-count').textContent=`${concept+1} / ${concepts.length}`;
      $('concept-dots').textContent=concepts.map((_,i)=>i===concept?'●':'○').join(' ');
      $('concept-prev').disabled=concept===0;
      $('concept-next').disabled=concept===concepts.length-1;
    }
    $('concept-prev').onclick=()=>{concept--;showConcept();};
    $('concept-next').onclick=()=>{concept++;showConcept();};
    showConcept();
  }
  function renderStp(){
    const chapter=state.vlan;
    if(chapter.passed.length<vlanLessons.length)return;
    const {title,concepts,tasks,createLab,step,markup,bind}=RZStp;
    let done=Boolean(chapter.stpComplete);
    const lab=chapter.stpLab??=createLab(done);
    $('building-content').innerHTML=schoolLayout({
      chapter:3,title,score:`${vlanPassed()} / ${vlanSchoolCount}`,
      status:done?'SUPERATA ✓':`PROVA ${vlanSchoolCount} / ${vlanSchoolCount}`,
      question:done?'Prova superata. Puoi consultare la configurazione dal terminale.':tasks[0],
      practiceContent:markup()+`
        <footer class="practice-footer">
          <div id="stp-progress" class="feedback" role="status"></div>
          <div class="practice-actions routing-actions">
            <button type="button" id="stp-tools" class="secondary">Strumenti</button>
            <button type="button" id="stp-finish" class="primary action-triangle">${done?'Vai alla mappa':'Verifica'}</button>
          </div>
        </footer>`
    });
    addVlanLessonNavigation(vlanLessons.length);
    const example=document.querySelector('.worked-example');
    example.innerHTML='<div><span class="eyebrow">ESEMPIO / SPANNING TREE</span><strong>Switch di esempio</strong></div><div class="example-result"><span>Comando<strong>show spanning-tree vlan 120</strong></span><span>Porta alternativa<strong>Gi0/8 · Altn BLK</strong></span></div>';
    document.querySelector('.elena-tip').innerHTML='<strong>Elena</strong> Confronta i ruoli delle porte prima e dopo aver disabilitato la porta attiva.';
    bindVlanConcepts(concepts);
    bindSchoolViews();
    bindSchoolSheet();
    $('stp-tools').addEventListener('click',()=>openCalculator());
    const finish=$('stp-finish');
    finish.addEventListener('click',()=>{
      if(done){
        closeBuilding();
        if(!chapter.complete)scheduleSchoolDispatch(vlanMissionMessage,()=>state.vlan===chapter&&!chapter.complete);
        return;
      }
      if(!lab.verified)return;
      chapter.stpComplete=true;
      done=true;
      refresh();
      renderShell();
      document.querySelector('.course-button[aria-current="step"]').firstChild.textContent='✓';
      document.querySelector('.school-seal strong').textContent=`${vlanPassed()} / ${vlanSchoolCount}`;
      document.querySelector('.practice-status').textContent='SUPERATA ✓';
      finish.textContent='Vai alla mappa';
      openPhone(vlanSchoolComplete,{throughFocused:true});
    });
    function refresh(){
      save();
      if(done){
        $('practice-question').textContent='Prova superata. Puoi consultare la configurazione dal terminale.';
        $('stp-progress').textContent='Prova completata';
        return;
      }
      const position=step(lab);
      let question=tasks[position];
      if(position===0&&!lab.links.every(Boolean))question='Su SW-2 riabilita entrambi i trunk. Poi controlla lo spanning tree della VLAN 30.';
      if(position===1&&!lab.links[1])question='Su SW-2 riabilita la porta alternativa.';
      else if(position===1&&!lab.links[0])question='Su SW-2 controlla di nuovo lo spanning tree. Verifica che la porta alternativa sia diventata la porta radice.';
      $('practice-question').textContent=question;
      $('stp-progress').textContent=lab.verified?'Obiettivo raggiunto':`Passaggio ${position+1} di ${tasks.length}`;
      finish.disabled=!lab.verified;
    }
    bind(lab,refresh,setupCommandHistory($('stp-command'),[]),runPcPing,()=>done);
  }
  function renderVlan(field,index){
    const {lessons:course,prepareCourse,labPanel,labTopology,labConsole,bindLab,fieldReference,fieldHostNames}=RZVlanUI;
    const chapter=state.vlan??={passed:[]};
    prepareCourse(chapter);
    const firstPending=course.findIndex((_,i)=>!chapter.passed.includes(i));
    index??=field?course.length-1:firstPending<0?course.length:firstPending;
    if(!field&&index===course.length){renderStp();return;}
    const lesson=course[index];
    const done=field?Boolean(chapter.complete):chapter.passed.includes(index);
    const net=field?(chapter.field??=RZVlan.freshPalace()):(chapter.lab??=RZVlan.fresh());
    const practiceStep=()=>lesson.step?.(net)??0;
    const action='<button id="vlan-finish" type="button" class="primary"></button>';
    if(field){
      $('building-content').innerHTML=missionLayout({
        header:{eyebrow:'GIORNO 04 · VALLE NORD',title:'Palazzo dei servizi',story:vlanMissionMessage[1],reference:'CAPITOLO 03 · VLAN',done},
        extraClass:'routing-intervention vlan-intervention',
        hint:net.palaceScenario>=2
          ?'<p>Usa <code>show vlan brief</code> sui primi due piani. Al piano 1 confronta le VLAN presenti con la scheda tecnica. Al piano 2 usa <code>interface range</code> sulle porte consecutive del banco. Con <code>show interfaces trunk</code> confronta le VLAN ammesse e la VLAN nativa ai due estremi.</p>'
          :'<p>Controlla le porte access e confronta i due estremi dei trunk. Verifica i gateway prima dei ping tra VLAN.</p>',
        sheet:fieldReference(net),
        ticket:`<div class="routing-school-practice vlan-field-topology">${labTopology(true)}</div>
          <ul class="mission-steps" id="vlan-checks" aria-label="Passaggi dell’intervento"></ul>`,
        terminalTitle:'Terminale',
        fields:'<div id="vlan-device-details" class="fields"></div>',
        terminal:labConsole(true),
        footer:'<div id="vlan-field-feedback" class="feedback" role="status"></div>',
        actions:'<button type="button" id="vlan-tools" class="secondary">Strumenti</button>'+action
      });
      setupMissionHint();
      $('mission-phone').addEventListener('click',()=>openPhone(vlanMissionMessage, {withHistory:true}));
      $('vlan-tools').addEventListener('click',()=>openCalculator());
    }else{
      $('building-content').innerHTML=schoolLayout({
        chapter:3,title:lesson.title,score:`${vlanPassed()} / ${vlanSchoolCount}`,
        status:done?'SUPERATA ✓':`PROVA ${index+1} / ${vlanSchoolCount}`,
        question:done?'Prova superata. Puoi consultare la configurazione dal terminale.':lesson.steps?.[practiceStep()]??lesson.task,practiceContent:labPanel()+`
          <footer class="practice-footer">
            <div id="vlan-progress" class="feedback" role="status"></div>
            <div class="practice-actions routing-actions"><button type="button" id="vlan-tools" class="secondary">Strumenti</button>${action}</div>
          </footer>`
      });
      addVlanLessonNavigation(index);
      bindSchoolSheet();
      $('vlan-tools').addEventListener('click',()=>openCalculator());
      const workedExample=document.querySelector('.worked-example');
      const examples=[
        ['CREAZIONE VLAN','Switch di esempio','vlan 120','Risultato','VLAN 120 creata sullo switch'],
        ['PORTE ACCESS','Switch(config)#','interface range Fa0/5 - 8','Porte selezionate','Da Fa0/5 a Fa0/8'],
        ['TRUNK','Switch(config-if)#','switchport trunk allowed vlan 120,130,200','VLAN ammesse','120, 130 e 200'],
        ['SOTTOINTERFACCIA','Router · Gi0/0.120','encapsulation dot1Q 120','VLAN associata','120']
      ];
      const [topic,device,example,label,result]=examples[index];
      workedExample.innerHTML=`<div><span class="eyebrow">ESEMPIO / ${topic}</span><strong>${device}</strong></div><div class="example-result"><span>Comando<strong>${example}</strong></span><span>${label}<strong>${result}</strong></span></div>`;
      document.querySelector('.elena-tip').innerHTML=index===0
        ?'<strong>Elena</strong> Dopo aver dato il nome alla VLAN, usa <code>exit</code> per tornare alla configurazione globale.'
        :'<strong>Elena</strong> Usa la scheda tecnica per individuare porte, VLAN e indirizzi. Dal prompt puoi cambiare piano con <code>sw &lt;numero&gt;</code> o scegliere una postazione con <code>pc &lt;numero&gt;</code>.';
      bindVlanConcepts(lesson.concepts);
      bindSchoolViews();
    }
    const finish=$('vlan-finish');
    const ready=field?RZVlan.ready:lesson.ready;
    function refresh(){
      save();
      finish.disabled=!done&&!ready(net);
      if(!field){
        if(!done&&lesson.steps){
          const step=practiceStep();
          $('practice-question').textContent=lesson.steps[step];
          $('vlan-progress').textContent=finish.disabled?`Passaggio ${step+1} di ${lesson.steps.length}`:'Obiettivo raggiunto';
        }else $('vlan-progress').textContent=done?'Prova completata':finish.disabled?'Passaggio '+(index+1)+' di '+course.length:'Obiettivo raggiunto';
      }
      if(field){
        $('vlan-field-feedback').textContent=done?'Intervento completato. Puoi consultare la configurazione.':finish.disabled?'Completa la configurazione e verifica i collegamenti indicati.':'Collegamenti verificati. Conferma il collaudo.';
        const checks=[
          [RZVlan.accessReady(net),net.palaceScenario>=2?'Ripristina VLAN e porte access dei piani 1 e 2':'Assegna le porte access ai reparti'],
          [RZVlan.trunksReady(net),'Ripristina i trunk dei quattro piani'],
          [RZVlan.routingReady(net),'Attiva i quattro gateway'],
          ...RZVlan.checksFor(net).map(([from,to],i)=>[net.verified.includes(i),`Ping da ${fieldHostNames[from]} a ${fieldHostNames[to]}`])
        ];
        $('vlan-checks').replaceChildren(...checks.map(([ok,label])=>{
          const item=document.createElement('li');
          const marker=document.createElement('span');
          marker.className='mission-step-status';
          marker.setAttribute('role','img');
          marker.setAttribute('aria-label',ok?'Completato':'Da completare');
          marker.textContent=ok?'✓':'';
          item.append(marker,Object.assign(document.createElement('span'),{textContent:label}));
          item.classList.toggle('is-complete',ok);
          return item;
        }));
      }
    }
    finish.textContent=field?(done?'Torna in città':'Conferma il collaudo'):'Lezione successiva';
    finish.addEventListener('click',()=>{
      if(!done&&!ready(net))return;
      if(field){
        if(chapter.complete){closeBuilding();return;}
        chapter.complete=true;
        chapter.medalPending=true;
        save();
        closeBuilding();
        renderShell();
        showVlanCompletion();
      }else{
        if(!done)chapter.passed.push(index);
        save();
        renderShell();
        renderVlan(false,index+1);
      }
    });
    finish.classList.add('action-triangle');
    bindLab(net,refresh,field?null:index,setupCommandHistory($('vlan-command'),[]),done,runPcPing);
    refresh();
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
      examples:[
        ['NOME DEL ROUTER','Router A','hostname Galilei','Nuovo prompt','Galilei(config)#'],
        ['ROTTA STATICA','192.168.80.0/24','ip route 192.168.80.0 255.255.255.0 10.0.0.2','Prossimo router','10.0.0.2'],
        ['VERIFICA CON PING','Dal PC A','ping 192.168.60.10','Risposta attesa','Reply from 192.168.60.10']
      ],
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
      examples:[
        ['TRACCIA DEL PERCORSO','Dal prompt del PC','tracert 192.168.80.10','Destinazione','192.168.80.10'],
        ['TABELLA DI INSTRADAMENTO','Router#','show ip route','Esempio di rotta statica','S 192.168.80.0/24 via 10.0.0.2'],
        ['RIMOZIONE DI UNA ROTTA','192.168.80.0/24','no ip route 192.168.80.0 255.255.255.0 10.0.0.2','Prossimo router','10.0.0.2']
      ],
      tip:'Prima di intervenire, osserva la traccia e confronta le rotte con la scheda tecnica.'
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
      examples:[
        ['ATTIVAZIONE RIPv2','Router A','RouterA(config)# router rip<br>RouterA(config-router)# version 2<br>RouterA(config-router)# no auto-summary','Risultato','RIPv2 senza riepilogo automatico'],
        ['RETE DIRETTAMENTE COLLEGATA','RIPv2','network 10.0.0.0','Sottorete dell’interfaccia','10.30.0.0/30'],
        ['ROTTA APPRESA CON RIP','Router A','RouterA# show ip route','Rotta verso la rete del PC B','R 192.168.60.0/24 [120/2] via 10.30.0.2']
      ],
      tip:'Apri la scheda tecnica del router selezionato per trovare le reti da dichiarare con network.'
    }
  ];
  function routingLessonResults(chapter={}){
    return [chapter.labConfigured||chapter.trained,chapter.diagnosisComplete||chapter.trained,chapter.ripComplete];
  }
  function setupRoutingLesson(lessonIndex,chapter){
    const nav=document.querySelector('.course-nav');
    addSchoolChapterNavigation(nav,2);
    const complete=routingLessonResults(chapter);
    routingLessons.forEach(({title},index)=>{
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
    const {concepts,examples,tip}=routingLessons[lessonIndex];
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
      const currentExample=examples[index];
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
    const done=()=>Boolean(isLab?routingLessonResults(chapter)[lessonIndex]:municipal?chapter.municipalComplete:chapter.complete);
    const renamed=()=>routers[0].name.toLowerCase()!==topology.names[0].toLowerCase();
    const hasWrongRoute=()=>diagnosis&&routers[1].routes.some(route=>route.network===wrongNetwork&&route.prefix===25);
    const diagnosisProgress=chapter.diagnosisProgress??{};
    const ripNetworks=index=>[...new Set(interfaces(topology,index).map(port=>majorNetwork(port.ip)))];
    const ripConfigured=index=>{
      const config=routers[index].rip;
      return config?.version===2&&config.noSummary&&ripNetworks(index).every(network=>config.networks.includes(network));
    };
    const last=routers.length-1;
    const staticField=!isLab&&!municipal;
    const centralField=staticField&&initialRouter===1;
    const fieldChecks=staticField?(chapter.districtChecks??={}):null;
    const localTargets=initialRouter===1?[0,last]:[initialRouter===0?last:0];
    const localRouteReady=target=>{
      const next=interfaces(topology,initialRouter).find(port=>port.neighbor===(initialRouter===1?target:1))?.next;
      return routers[initialRouter].routes.some(route=>route.network===topology.lans[target]
        &&route.prefix===topology.prefixes[target]&&route.next===next);
    };
    const fieldReady=()=>[0,last].every(from=>fieldChecks[from]
      &&trace(topology,routers,from,topology.hosts[from===0?last:0],true).ok);
    const municipalPCs=municipal?[
      {label:'PC Sindaco',index:last,pc:true,host:topology.hosts[last],lanSlot:0,target:0},
      {label:'PC Vicesindaco',index:last,pc:true,host:topology.additionalLans[0].host,lanSlot:1,target:2}
    ]:[];
    const verifiedMunicipalTargets=new Set();
    const fieldSteps=municipal?[
      ['Configura RIPv2 sul router del Municipio.',()=>ripConfigured(last)],
      ...municipalPCs.map(({label,target})=>[`Da ${label}, esegui ping verso ${topology.labels[target]}.`,()=>verifiedMunicipalTargets.has(target)])
    ]:staticField?[
      ...localTargets.map(target=>[`Sul router di questa sede, configura la rotta verso la rete ${topology.labels[target]}.`,()=>localRouteReady(target)]),
      ...(initialRouter===1?[]:[[`Dal PC di questa sede, esegui tracert verso ${topology.labels[localTargets[0]]}.`,()=>fieldChecks[initialRouter]]])
    ]:[];
    if(municipal){
      routers.slice(0,last).forEach((router,index)=>{
        router.rip??={version:2,noSummary:true,networks:ripNetworks(index)};
      });
    }
    let ripInspected=false;
    const ready=()=>!isLab||(rip?routers.every((_,index)=>ripConfigured(index))&&ripInspected
      :diagnosis?diagnosisProgress.inspected&&!hasWrongRoute():renamed());
    const pcs=topology.hosts.flatMap((host,index)=>host?[index]:[]);
    const choices=[
      ...(municipal?municipalPCs:pcs.map(index=>({label:isLab?(index?'PC B':'PC A'):'PC '+topology.labels[index],index,pc:true}))),
      ...topology.labels.map((name,index)=>({label:isLab?name:'Router '+name,index,pc:false}))
    ].filter(choice=>isLab||choice.index===initialRouter);
    let selected=choices.find(choice=>choice.index===initialRouter&&choice.pc)??choices.find(choice=>choice.index===initialRouter);
    const modes=routers.map(()=> 'user');
    const activePorts=routers.map(()=>null);
    const pcDns=index=>!isLab&&index===2?'192.168.20.126':'0.0.0.0';
    const histories=new Map();
    const title=isLab?routingLessons[lessonIndex].title:municipal?municipalTitle:'Richiesta di assistenza';
    const routingPath=`<div class="routing-path${municipal?' municipal-lan-path':''}">
            ${isLab?'':'<h3>Architettura di rete</h3>'}
            <ol id="routing-nodes"></ol>
            ${isLab?'<p id="routing-status" class="visually-hidden" role="status"></p>':''}
          </div>`;
    const routingConsole=`${isLab?'<div class="routing-console training-terminal">':'<div class="field-console"><div id="routing-local-devices" class="field-console-devices" role="group" aria-label="Dispositivi della sede"></div><div class="mission-cli">'}
            <div id="routing-output" class="${isLab?'terminal-screen':'mission-terminal-output'}" aria-live="polite" tabindex="0"></div>
            <form id="routing-form"${isLab?'':' class="mission-terminal-form"'}>
              <label${isLab?' class="terminal-prompt"':''}><span id="routing-prompt" aria-hidden="true"></span><input aria-label="Comando" autocomplete="off" spellcheck="false" placeholder="Digita un comando"></label>
              ${isLab?'':'<button type="submit">Esegui</button>'}
            </form>
          ${isLab?'</div>':'</div></div>'}`;
    const routingButtons=`
            <button id="routing-tools" type="button" class="secondary">Strumenti</button>
            <button id="routing-finish" type="button" class="primary" disabled>${isLab?'Verifica':'Conferma il ripristino'} <span aria-hidden="true">▸</span></button>
          `;
    const routingHint=staticField
      ? `<p>Configura solo il router di questa sede. Usa gli indirizzi della scheda tecnica e controlla la tabella con <code>show ip route</code>.</p><p>Per intervenire in un’altra sede, torna in città e aprila dalla mappa.</p>`
      : `
            ${municipal?`<p>Gli altri router hanno già RIPv2. Attivalo sul router del Municipio e dichiara le reti indicate nella scheda. La Centrale apprende entrambe le sottoreti locali e il Municipio apprende le rotte verso le sedi remote.</p><p>Controlla le righe <code>R</code> con <code>show ip route</code>, poi verifica i due collegamenti dai PC indicati.</p>`:`<p>Dal PC prova <code>tracert &lt;IP&gt;</code>. Sui router, <code>show ip route</code> mostra la tabella delle rotte.</p>
            <p>Usa <code>enable</code> e <code>configure terminal</code>, poi <code>ip route &lt;rete&gt; &lt;maschera&gt; &lt;IP del prossimo router&gt;</code>. Configura anche il ritorno.</p>
            <p>Puoi rinominare un router con <code>hostname &lt;nome&gt;</code> in configurazione globale.</p>`}
          `;
    if(isLab){
      $('building-content').innerHTML=schoolLayout({
        chapter:2,
        title,
        score:`${routingLessonResults(chapter).filter(Boolean).length} / ${routingLessons.length}`,
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
          <div class="practice-actions routing-actions">${routingButtons}</div>
        </footer>`
      });
      setupRoutingLesson(lessonIndex,chapter);
      bindSchoolSheet();
    }else{
      $('building-content').innerHTML=missionLayout({
        header:{
          eyebrow:`${(municipal?municipalRequest:routingRequest)[2].toUpperCase()} · VALLE NORD`,
          title,
          story:municipal?'Configura RIPv2 per collegare le due sottoreti del Municipio alle sedi remote. Verifica con un ping dal PC del Sindaco verso l’Ospedale e dal PC del Vicesindaco verso la Protezione civile.'
            :initialRouter===1?'Configura le due rotte statiche della Centrale, una per ogni sede.'
            :`Configura la rotta di questa sede verso ${topology.labels[localTargets[0]]} e verifica il percorso dal PC locale.`,
          reference:municipal?'CAPITOLO 02 · RIPv2':'CAPITOLO 02 · ROUTING STATICO',
          done:done()
        },
        extraClass:'routing-intervention',
        hint:routingHint,
        sheet:'<dl id="routing-addresses" class="evidence"></dl>',
        ticket:`${routingPath}
          <ul class="mission-steps" id="routing-checklist" role="list" aria-label="Passaggi di questa sede">${fieldSteps.map(([label])=>`<li><span class="mission-step-status" role="img"></span><span>${label}</span></li>`).join('')}</ul>`,
        terminalTitle:'Terminale',
        fields:'<div id="routing-device-addresses" class="fields"></div>',
        terminal:routingConsole,
        footer:'<div id="routing-status" role="status" class="feedback">Avvia una traccia per vedere quali router attraversa il pacchetto.</div>',
        actions:routingButtons
      });
      setupMissionHint();
      $('mission-phone').addEventListener('click',()=>openPhone());
    }
    const input=$('routing-form').querySelector('input');
    const output=$('routing-output'),path=$('routing-nodes'),status=$('routing-status'),finish=$('routing-finish');
    const question=isLab?$('practice-question'):null;
    const progress=$('routing-progress');
    let connectionChecked=false;
    function updateFieldChecklist(){
      if(isLab)return;
      Array.from($('routing-checklist').children).forEach((item,index)=>{
        const complete=done()||Boolean(fieldSteps[index][1]());
        item.classList.toggle('is-complete',complete);
        item.firstElementChild.textContent=complete?'✓':'';
        item.firstElementChild.setAttribute('aria-label',complete?'Completato':'Da completare');
      });
      finish.disabled=!done()&&!(municipal?verifiedMunicipalTargets.size===municipalPCs.length:fieldReady());
    }
    question?.setAttribute('aria-live','polite');
    function updateRoutingInstruction(){
      if(!question)return;
      if(done()){
        progress.textContent='Prova completata';
        question.textContent=rip?'Collegamento verificato con RIP. Puoi tornare alla mappa.':diagnosis?'Guasto risolto. Puoi passare alla lezione RIP.':'Collegamento verificato. Puoi passare alla diagnosi.';
        return;
      }
      const reaches=(from,to)=>trace(topology,routers,from,topology.hosts[to],true).forward.ok;
      const steps=rip?[
        ...routers.map((_,index)=>[ripConfigured(index),`Configura RIPv2 su ${topology.labels[index]} con le reti della scheda tecnica.`]),
        [ripInspected,'Sul Router A, consulta la tabella di instradamento e cerca la rotta RIP verso il PC B.'],
        [false,'Dal PC A, verifica il collegamento con un ping verso il PC B.']
      ]:diagnosis?[
        [diagnosisProgress.traced,'Dal PC A, traccia il percorso verso il PC B e individua l’interruzione.'],
        [diagnosisProgress.inspected,'Consulta la tabella di instradamento del Router B.'],
        [!hasWrongRoute(),'Il PC A appartiene alla rete 192.168.50.0/24. Sul Router B, rimuovi in configurazione globale la rotta statica 192.168.50.128/25: il suo intervallo esclude il PC A.'],
        [reaches(last,0),'Aggiungi la rotta di ritorno verso la rete del PC A.'],
        [false,'Dal PC A, ripeti la traccia verso il PC B per verificare il ripristino.']
      ]:[
        [renamed(),'Seleziona il Router A e assegnagli il nome Galilei in configurazione globale.'],
        [reaches(0,last),'Configura sul Router A la rotta verso la rete del PC B.'],
        [reaches(last,0),'Configura sul Router B la rotta di ritorno verso la rete del PC A.'],
        [false,'Dal PC A, verifica il collegamento con un ping verso il PC B.']
      ];
      if(connectionChecked){
        question.textContent='Collegamento riuscito. Premi «Verifica» per completare la prova.';
        progress.textContent='Collegamento riuscito';
        return;
      }
      const current=steps.findIndex(([complete])=>!complete);
      question.textContent=steps[current][1];
      progress.textContent=`Passaggio ${current+1} di ${steps.length}`;
    }
    const prompt=()=>selected.pc?'C:\\>':routers[selected.index].name+{user:'>',privileged:'#',global:'(config)#',rip:'(config-router)#',port:'(config-if)#'}[modes[selected.index]];
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
    function print(line,isCommand=false,device=selected){
      logs.set(device,[...(logs.get(device)??[]),{line,isCommand}].slice(-70));
      if(device===selected)renderOutput();
    }
    const labNodes=new Map();
    const localNodes=new Map();
    const localSelectors=new Map();
    const localLabel=choice=>choice.pc?(municipal?choice.label:'PC'):routers[choice.index].name;
    const pcPort=choice=>interfaces(topology,choice.index)[choice.lanSlot??0];
    const pcHost=choice=>choice.host??topology.hosts[choice.index];
    const municipalUplinkSlot=municipal?interfaces(topology,last).findIndex(port=>port.neighbor===1):-1;
    function routerDiagram(button,icon,choice,portId){
      const diagram=document.createElement('span');
      diagram.className='routing-router-diagram';
      const ports=document.createElement('span');
      ports.className='routing-router-ports';
      ports.id=portId;
      const {index}=choice;
      const routerPorts=interfaces(topology,index).map((port,slot)=>({port,slot}));
      if(isLab){
        const position=port=>port.neighbor??(index===0?-1:routers.length);
        routerPorts.sort((a,b)=>position(a.port)-position(b.port));
      }
      for(const {port,slot} of routerPorts){
        const badge=document.createElement('span');
        badge.textContent=`Gi0/${slot}`;
        const municipalPC=municipalPCs.find(pc=>pc.lanSlot===slot);
        badge.title=port.next?`Verso ${topology.labels[port.neighbor]}`
          :municipalPC?`Verso ${municipalPC.label}`
            :isLab?(index===0?'Verso PC A':'Verso PC B'):'Verso il PC locale';
        ports.append(badge);
      }
      diagram.append(icon,ports);
      button.setAttribute('aria-describedby',portId);
      return diagram;
    }
    function openLocalTerminal(choice){
      selectDevice(choice);
      input.focus({preventScroll:true});
    }
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
        icon.src=choice.pc?'assets/icons/pc.png':'assets/icons/router.png';
        icon.alt='';
        icon.width=44;
        icon.height=44;
        const label=document.createElement('span');
        button.append(choice.pc?icon:routerDiagram(button,icon,choice,`routing-lab-ports-${choice.index}`),label);
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
      if(!localNodes.size){
        const nodes=centralField
          ?[0,...choices,last]
          :[...choices,interfaces(topology,initialRouter).find(port=>port.next).neighbor];
        for(const entry of nodes){
          const remote=typeof entry==='number'?entry:null;
          const choice=remote===null?entry:null;
          const node=document.createElement('li');
          const item=choice?makeButton('',()=>openLocalTerminal(choice),'routing-node')
            :document.createElement('span');
          item.classList.add('routing-node','routing-local-node');
          const icon=new Image(72,72);
          icon.src='assets/icons/'+(choice?(choice.pc?'pc.png':'router.png'):'cloud.svg');
          icon.alt='';
          const label=document.createElement('span');
          label.textContent=choice?localLabel(choice):topology.labels[remote];
          item.append(choice&&!choice.pc?routerDiagram(item,icon,choice,'routing-local-ports'):icon,label);
          if(municipal&&choice?.pc){
            const subnet=document.createElement('small');
            const port=pcPort(choice);
            subnet.textContent=`${port.network}/${port.prefix}`;
            item.append(subnet);
          }
          node.append(item);
          path.append(node);
          localNodes.set(entry,{node,item,label});
        }
      }
      for(const [entry,{node}] of localNodes){
        const remote=typeof entry==='number';
        const choice=remote?null:entry;
        const reached=remote?visited.includes(entry):!choice.pc||choice===selected;
        node.classList.toggle('visited',Boolean(result&&reached));
        node.classList.toggle('interrupted',remote?interrupted===entry:Boolean(choice&&!choice.pc&&interrupted===initialRouter));
      }
    }
    function renderDevice(){
      const {index,pc}=selected;
      for(const [choice,{button,label}] of labNodes){
        label.textContent=deviceLabel(choice);
        button.setAttribute('aria-label',label.textContent);
        button.setAttribute('aria-pressed',String(choice===selected));
      }
      $('routing-prompt').textContent=prompt();
      renderOutput();
      const ports=interfaces(topology,index);
      let data;
      if(!isLab){
        const port=pc?pcPort(selected):ports[activePorts[index]];
        const mask=port?ReteZero.calculate(port.ip,port.prefix).mask:'—';
        data=[
          [pc?'IP del PC':'Indirizzo IP',pc?pcHost(selected):port?.ip??'—',!pc&&port?`Porta Gi0/${activePorts[index]}`:null],
          ['Subnet mask',mask],
          ['Gateway predefinito',pc?port.ip:'—'],
          ['Server DNS',pc?pcDns(index):'0.0.0.0']
        ];
      }else if(pc){
        data=[['IP del PC',topology.hosts[index]],['Gateway predefinito',ports[0].ip]];
      }else{
        data=ports.flatMap(port=>{
          if(!port.next)return [['IP LAN del router · gateway del PC',port.ip+'/'+port.prefix]];
          const neighbor=topology.labels[port.neighbor];
          return [
            [`IP locale sul collegamento con ${neighbor}`,port.ip+'/'+port.prefix],
            [`IP di ${neighbor} · prossimo salto`,port.next]
          ];
        });
      }
      const deviceDataLength=data.length;
      if(municipal){
        data.push(['Reti da dichiarare in RIP',ripNetworks(index).map(network=>`network ${network}`).join(' · ')]);
        for(const choice of municipalPCs){
          const port=pcPort(choice);
          data.push([`Gi0/${choice.lanSlot} · ${choice.label}`,`${pcHost(choice)} · Sottorete ${port.network}/${port.prefix} · Gateway ${port.ip}`]);
        }
      }
      if(!isLab){
        for(const port of ports){
          if(!port.next)continue;
          const neighbor=topology.labels[port.neighbor];
          data.push([`IP di ${neighbor} · prossimo salto`,port.next]);
          if(municipal){
            const {network}=ReteZero.calculate(port.ip,port.prefix);
            data.push(
              [`Gi0/${municipalUplinkSlot} · IP del Municipio verso ${neighbor}`,`${port.ip}/${port.prefix}`],
              [`Sottorete Municipio–${neighbor}`,`${network}/${port.prefix}`]
            );
          }
        }
      }
      for(const edge of pcs){
        if(municipal&&edge===index)continue;
        if(municipal&&edge!==index){
          data.push([`PC ${topology.labels[edge]} · destinazione ping`,topology.hosts[edge]]);
          continue;
        }
        const {network,mask}=ReteZero.calculate(topology.lans[edge],topology.prefixes?.[edge]??24);
        data.push([`Rete ${topology.labels[edge]}`,network+' / '+mask]);
        if(edge!==index)data.push([isLab?'Host remoto':`PC ${topology.labels[edge]}`,topology.hosts[edge]]);
      }
      if(isLab&&rip&&!pc)data.push(['Reti da dichiarare in RIP',ripNetworks(index).join(' · ')]);
      if(isLab)$('routing-sheet-device').textContent=deviceLabel(selected);
      else {
        $('mission-terminal-title').textContent='Terminale / '+localLabel(selected);
        const deviceAddresses=$('routing-device-addresses');
        deviceAddresses.replaceChildren(...data.splice(0,deviceDataLength).map(([label,value,portName])=>{
          const field=document.createElement('label');
          const address=document.createElement('input');
          field.className='routing-readonly-field';
          address.tabIndex=-1;
          if(portName){
            const heading=document.createElement('span');
            heading.className='municipal-port-heading';
            const badges=document.createElement('span');
            badges.className='municipal-port-badges';
            const port=document.createElement('span');
            port.textContent=portName;
            const stateBadge=document.createElement('span');
            stateBadge.textContent='ON';
            badges.append(port,stateBadge);
            heading.append(label,badges);
            field.append(heading);
          }else field.textContent=label;
          address.value=value;
          address.readOnly=true;
          if(label==='Server DNS')address.name='dns';
          field.append(address);
          return field;
        }));
      }
      if(!isLab){
        for(const choice of choices){
          const name=localLabel(choice);
          const active=String(choice===selected);
          const {item,label}=localNodes.get(choice);
          label.textContent=name;
          item.setAttribute('aria-label',name);
          item.setAttribute('aria-pressed',active);
          const selector=localSelectors.get(choice);
          selector.textContent=name;
          if(selector.tagName==='BUTTON')selector.setAttribute('aria-pressed',active);
        }
      }
      const addresses=$('routing-addresses');
      addresses.replaceChildren();
      for(const [label,value] of data){
        const term=document.createElement('dt'),description=document.createElement('dd');
        term.textContent=label;description.textContent=value;
        addresses.append(term,description);
      }
    }
    if(!isLab){
      const picker=$('routing-local-devices');
      for(const choice of choices){
        const selector=choices.length===1?document.createElement('span')
          :makeButton('',()=>openLocalTerminal(choice),'routing-device-link');
        localSelectors.set(choice,selector);
        picker.append(selector);
      }
    }
    const activeHistory=[];
    const remember=setupCommandHistory(input,activeHistory);
    function selectDevice(choice){
      if(choice===selected)return;
      selected=choice;
      activeHistory.splice(0,activeHistory.length,...(histories.get(selected)??[]));
      input.value='';
      renderDevice();
    }
    async function runTrace(destination, ping=false){
      const source=selected;
      const {index,pc}=source;
      if(!topology.hosts.includes(destination)&&!municipalPCs.some(choice=>choice.host===destination)){
        print('% Indica l’indirizzo di uno dei PC riportati nella scheda tecnica.');
        return;
      }
      const result=trace(topology,routers,index,destination,pc,pcHost(selected));
      if(ping){
        const ttl=result.ok?128-result.reply.hops.length-Number(pcHost(selected)!==destination):null;
        status.textContent='Ping in corso…';
        await runPcPing(destination,ttl,input,line=>print(line,false,source));
        if(!input.isConnected||!$('building-dialog').open)return;
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
        if(!pc||!ping||topology.hosts[source.target]!==destination)return;
        if(result.ok&&ripConfigured(last))verifiedMunicipalTargets.add(source.target);
        else verifiedMunicipalTargets.delete(source.target);
        updateFieldChecklist();
        if(!done()&&result.ok)status.textContent=`Collegamenti verificati: ${verifiedMunicipalTargets.size} di ${municipalPCs.length}.`;
        return;
      }
      if(staticField){
        if(pc&&destination===topology.hosts[localTargets[0]]){
          fieldChecks[index]=result.ok;
          save();
          updateFieldChecklist();
          if(result.ok&&!done()&&!fieldReady())status.textContent+=' Verifica il percorso anche dal PC dell’altra sede.';
        }
        return;
      }
      if(!pc||index!==0||destination!==topology.hosts[last])return;
      if(diagnosis&&!ping&&!result.ok&&returnStop===1&&hasWrongRoute()){
        diagnosisProgress.traced=true;
        chapter.diagnosisProgress=diagnosisProgress;
        save();
      }
      if(!isLab||ping!==diagnosis){
        connectionChecked=result.ok&&ready();
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
      const portMatch=!isLab&&!pc&&/^(?:interface|int) (?:gi|gigabitethernet) ?0\/(\d+)$/.exec([command,...parts].join(' '));
      const mode=modes[index];
      const exec=mode==='user'||mode==='privileged';
      let changed=false;
      if(pc){
        if((command==='tracert'||((isLab||municipal)&&command==='ping'))&&parts.length===1)await runTrace(args,command==='ping');
        else if(command==='ipconfig'&&(!args||args==='/all')){
          const port=pcPort(selected);
          print(`IPv4 Address   ${pcHost(selected)}\nSubnet Mask    ${ReteZero.calculate(port.ip,port.prefix).mask}\nDefault Gateway ${port.ip}`);
          if(args==='/all')print('DNS Servers    '+pcDns(index));
        }else print(isLab||municipal?'% Usa ipconfig, ping <IP> o tracert <IP>.'
          :`% Per verificare il percorso, usa tracert ${topology.hosts[localTargets[0]]}.\nPer vedere la configurazione del PC, usa ipconfig oppure ipconfig /all.`);
      }else if(command==='traceroute'&&exec&&parts.length===1)runTrace(args);
      else if(command==='enable'&&!args&&mode==='user')modes[index]='privileged';
      else if(command==='disable'&&!args&&mode==='privileged')modes[index]='user';
      else if(mode==='privileged'&&/^(?:conf|confi|config|configu|configur|configure)$/.test(command)&&args.length>0&&'terminal'.startsWith(args))modes[index]='global';
      else if((command==='exit'||command==='end')&&!args&&mode==='global')modes[index]='privileged';
      else if(portMatch&&(mode==='global'||mode==='port')){
        const slot=Number(portMatch[1]);
        if(interfaces(topology,index)[slot]){
          activePorts[index]=slot;
          modes[index]='port';
          renderDevice();
        }else print('% Interfaccia inesistente su questo router.');
      }
      else if(mode==='port'&&!args&&(command==='exit'||command==='end')){
        modes[index]=command==='exit'?'global':'privileged';
        activePorts[index]=null;
        renderDevice();
      }
      else if(!isLab&&command==='show'&&args==='ip interface brief'&&mode==='privileged'){
        const rows=interfaces(topology,index).map(({ip},slot)=>
          `GigabitEthernet0/${slot}`.padEnd(22)+ip.padEnd(17)+'up'.padEnd(23)+'up');
        print(['Interface             IP-Address       Status                 Protocol',...rows].join('\n'));
      }
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
        }else if(municipal&&command==='network'){
          print('% Consulta la voce «Comandi RIP sul router del Municipio» nella scheda tecnica.');
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
        renderDevice();
        if(isLab&&!diagnosis&&index===0&&!done())connectionChecked=false;
        save();
      }else if(!rip&&mode==='global'&&((command==='ip'&&parts[0]==='route')||(command==='no'&&parts[0]==='ip'&&parts[1]==='route'))){
        const error=diagnosis&&!done()&&!diagnosisProgress.inspected
          ?'% Prima traccia il guasto dal PC A e consulta la tabella del router indicato.'
          :changeRoute(topology,routers,index,parts.slice(command==='ip'?1:2),command==='no');
        if(error)print(error);
        else changed=true;
      }else print('% Comando non valido in questa modalità.');
      if(changed){
        if(staticField){delete fieldChecks[0];delete fieldChecks[last];}
        save();
        connectionChecked=false;
        updateFieldChecklist();
        renderPath();
        status.textContent=municipal
          ?'Configurazione RIP aggiornata. Verifica con un ping dal PC del Sindaco e uno dal PC del Vicesindaco.'
          :isLab&&!diagnosis?'Tabella modificata. Ripeti il ping dal PC A.':'Tabella modificata. Esegui una nuova traccia dal PC di partenza.';
      }
      if(!input.isConnected||!$('building-dialog').open)return;
      updateRoutingInstruction();
      $('routing-prompt').textContent=prompt();
      input.focus({preventScroll:true});
    });
    $('routing-tools').addEventListener('click',()=>openCalculator());
    finish.addEventListener('click',()=>{
      if(isLab&&!done()){
        if(input.readOnly)return;
        if(!connectionChecked||!ready()||!trace(topology,routers,0,topology.hosts[last],true).ok){
          progress.textContent=diagnosis
            ?'Completa i passaggi e verifica il percorso dal PC A con tracert.'
            :'Completa i passaggi ed esegui un ping riuscito dal PC A verso il PC B.';
          return;
        }
        if(rip){chapter.ripComplete=true;chapter.trained=true;}
        else chapter[diagnosis?'diagnosisComplete':'labConfigured']=true;
        save();
        renderShell();
        const currentLesson=document.querySelector('.course-button[aria-current="step"]');
        currentLesson.firstChild.textContent='✓';
        const nextLesson=currentLesson.nextElementSibling;
        if(nextLesson?.classList.contains('course-button')){
          nextLesson.disabled=false;
          nextLesson.classList.remove('locked');
        }
        document.querySelector('.school-seal strong').textContent=`${routingLessonResults(chapter).filter(Boolean).length} / ${routingLessons.length}`;
        document.querySelector('.practice-status').textContent='SUPERATA ✓';
        finish.firstChild.nodeValue=rip?'Vai alla mappa ':'Continua ';
        updateRoutingInstruction();
        if(rip)scheduleSchoolMessage(chapter,0);
        return;
      }
      if(isLab&&!rip){
        renderRouting(true,0,lessonIndex+1);
        document.querySelector('.course-button[aria-current]').focus();
        return;
      }
      if(done()){
        closeBuilding();
        if(isLab&&rip&&!chapter.complete){
          scheduleSchoolDispatch(routingRequest,()=>state.routing===chapter&&!chapter.complete);
        }
        return;
      }
      if(municipal){
        if(!ripConfigured(last)||!municipalPCs.every(({host,target})=>verifiedMunicipalTargets.has(target)
          &&trace(topology,routers,last,topology.hosts[target],true,host).ok))return;
        chapter.municipalComplete=true;
        chapter.municipalMedalPending=true;
        state.vlanMorningPending=true;
      }else if(staticField){
        if(!fieldReady())return;
        chapter.complete=true;
        chapter.municipalDispatchPending=true;
      }
      save();
      renderShell();
      closeBuilding();
      if(municipal)showMunicipalCompletion();
      else showRoutingCompletion(chapter);
    });
    finish.disabled=!isLab&&!done();
    if(done())finish.firstChild.nodeValue=isLab&&!rip?'Continua ':'Vai alla mappa ';
    renderPath();
    renderDevice();
    updateRoutingInstruction();
    updateFieldChecklist();
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
      const destinations={
        ArrowLeft:(index+cliTabs.length-1)%cliTabs.length,
        ArrowRight:(index+1)%cliTabs.length,
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
  const restartDialog=$('restart-dialog'),restartForm=$('restart-form');
  const confirmRestart=$('confirm-restart');
  const highestChapter=()=>districtRestored()?2:(state.highestChapter??1);
  const canRestartChapter=chapter=>{
    if(chapter==='3')return nextDayStarted()&&state.routing?.municipalComplete&&!state.vlanMorningPending;
    return chapter==='1'||(chapter==='2'&&highestChapter()>=2);
  };
  $('reset-progress').addEventListener('click',()=>{
    restartForm.reset();
    confirmRestart.disabled=true;
    for(const option of restartForm.elements.chapter){
      option.disabled=!canRestartChapter(option.value);
      option.closest('label').hidden=option.disabled;
    }
    $('restart-chapter-two-note').textContent=districtRestored()
      ?'Azzera i progressi dal Capitolo 02 in poi.'
      :'Il Capitolo 01 risulterà completato.';
    restartDialog.showModal();
  });
  restartForm.addEventListener('change',()=>{confirmRestart.disabled=!restartForm.elements.chapter.value;});
  $('cancel-restart').addEventListener('click',()=>restartDialog.close());
  restartForm.addEventListener('submit',event=>{
    event.preventDefault();
    const chapter=new FormData(restartForm).get('chapter');
    if(!canRestartChapter(chapter))return;
    if(chapter==='3'){
      delete state.vlan;
      state.vlanMorningPending=true;
      deliveredMessages.delete(JSON.stringify(vlanSchoolMessage.slice(0,2)));
      save();
      restartDialog.close();
      renderShell();
      scheduleVlanMorning();
      return;
    }
    state.highestChapter=highestChapter();
    for(const timer of [dispatchTimer,fieldTimer,nextDayTimer,vlanMorningTimer])window.clearTimeout(timer);
    dispatchTimer=fieldTimer=nextDayTimer=vlanMorningTimer=undefined;
    phoneHasFinalReport=phoneHasGraduation=false;
    delete state.graduationPending;
    deliveredMessages.clear();
    if(chapter==='2'){
      if(!districtRestored()){
        state.completed=missions.length;
        state.studied=lessons.map(lesson=>lesson.id);
        state.stormStage=state.fieldStage=2;
        state.welcomeRead=true;
        state.badgeName||='Tecnico di Valle Nord';
        state.badgeAge??=18;
        state.avatar||='uomo';
      }
      delete state.routing;
      delete state.vlan;
      delete state.vlanMorningPending;
      state.nextDayStage=1;
    }else{
      const {avatar,badgeName,badgeAge,highestChapter}=state;
      state={curriculum:curriculumVersion,completed:0,studied:[],drafts:{},lessonDrafts:{},nextDayStage:0,avatar,badgeName,badgeAge,highestChapter};
    }
    save();
    restartDialog.close();
    renderShell();
    if(chapter==='2')scheduleNextDay();
    else scheduleWelcomeMessage();
  });
  $('toggle-instructions').addEventListener('click',()=>{
    const panel=$('instructions-panel'),button=$('toggle-instructions'),collapsed=panel.classList.toggle('collapsed');
    button.textContent=collapsed?'+':'−';button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',collapsed?'Espandi istruzioni':'Riduci istruzioni');
  });
  renderShell();
  if(startChapterThree){
    openBuilding('school');
  }else if(previewSchoolEnding){
    openBuilding('school');
    activeLesson=lessons.length-1;
    renderSchool();
    celebrateSchoolCompletion();
  }else if(previewRoutingEnding){
    openBuilding('hospital');
  }else if(previewVlsmEnding){
    openBuilding('rescue',false,3);
  }else scheduleDispatch();
  scheduleFieldDispatch();
  scheduleNextDay();
  if(vlanMedalPending())showVlanCompletion();
  else if(municipalMedalPending())showMunicipalCompletion();
  else if(municipalDispatchPending())showRoutingCompletion(state.routing);
  else if(resumeDayThree&&!resumeAfterSchool)openPhone();
  scheduleWelcomeMessage();
  scheduleVlanMorning();
  if(replayMunicipio&&nextDayStarted()&&state.routing?.ripComplete&&state.routing.complete)openBuilding('townhall');
  if(location.hash==='#fine-aggiornamento'){
    history.replaceState(null,'',location.href.split('#')[0]);
    if(nextDayStarted()&&state.routing?.ripComplete){
      openBuilding('school');
      scheduleSchoolMessage(state.routing);
    }
  }
  if(location.protocol==='file:'){document.querySelector('[data-games-home]').href=new URL('../index.html',location.href).href;}else{
    const hub=new URL('../index.html',location.href);fetch(hub,{cache:'no-store'}).then(response=>response.ok?response.text():'').then(html=>{if(html.includes('<meta name="games-hub" content="informatica-in-gioco">'))document.querySelector('[data-games-home]').href=hub.href;}).catch(()=>{});
  }
})();
