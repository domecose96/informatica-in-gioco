'use strict';
(() => {
  const V=RZVlan;
  const coreName='Switch centrale';
  const coreRouterPort='Gi0/5';
  const routerUplink='Gi0/0';
  const fieldHostNames=['Reception','Ragioneria','Officina IT','Sportello','Supporto IT','Banco reti','Banco sistemi'].map((name,index)=>`PC${index+1} - ${name}`);
  const fieldCoreName='PAL-CORE';
  const fieldRouterName='PAL-R1';
  const floorSwitchName=(floor,field)=>field?`PAL-SW${floor}`:`SW-${floor}`;
  const accessExercises=[
    {floor:1,vlan:10,name:'ACCOGLIENZA',hosts:[0]},
    {floor:2,vlan:30,name:'UFFICIO_TECNICO',hosts:[5,6]}
  ];
  const switchKey=floor=>`floor-${floor}`;
  const accessVlanNamed=(net,{floor,vlan,name})=>V.vlanExists(net,switchKey(floor),vlan)
    &&net.vlanNames?.[switchKey(floor)]?.[vlan]?.toUpperCase()===name;
  const exercisePortsReady=(net,exercise)=>exercise.hosts.every(i=>net.access[i]===exercise.vlan);
  const accessReady=(net,index)=>accessVlanNamed(net,accessExercises[index])
    &&exercisePortsReady(net,accessExercises[index])&&net.accessExercises?.[index].verified;
  function restorePc5Access(net){
    const {floor,vlan}=V.hosts[4];
    const id=switchKey(floor);
    net.access[4]=vlan;
    if(net.deletedVlans?.[id])net.deletedVlans[id]=net.deletedVlans[id].filter(value=>value!==vlan);
  }
  function prepareCourse(chapter){
    if(chapter.courseVersion===3)return;
    if(chapter.courseVersion===2){
      if(chapter.passed.includes(0))restorePc5Access(chapter.lab);
      chapter.courseVersion=3;
      return;
    }
    chapter.passed=chapter.passed.map(index=>index>0?index+1:index);
    const net=chapter.lab??=V.fresh();
    net.accessExercises=[{},{}];
    restorePc5Access(net);
    accessExercises.forEach((exercise,index)=>{
      if(chapter.passed.includes(index))return;
      const id=switchKey(exercise.floor);
      net.deletedVlans??={};
      if(!net.deletedVlans[id]?.includes(exercise.vlan))(net.deletedVlans[id]??=[]).push(exercise.vlan);
      if(net.vlanNames?.[id])delete net.vlanNames[id][exercise.vlan];
      for(const host of exercise.hosts)net.access[host]=1;
    });
    for(const index of [0,2]){
      const link=net.trunks[index];
      if(!chapter.passed.includes(2)&&link.core.length<V.trunkVlans(index+1).length)link.coreTrunk=false;
    }
    delete net.accessLesson;
    chapter.courseVersion=3;
  }
  const vlanCommands=[
    ['vlan <ID>','In configurazione globale crea o seleziona una VLAN. Il prompt diventa (config-vlan)#.'],
    ['name <nome>','In (config-vlan)# assegna un nome alla VLAN. Usa il trattino basso per separare le parole.'],
    ['exit','Da (config-vlan)# torna alla configurazione globale.']
  ];
  const portCommands=[
    ['switchport mode access','Imposta la porta o il gruppo di porte in modalità access.'],
    ['switchport access vlan <ID>','Assegna le porte selezionate alla VLAN indicata.'],
    ['show vlan brief','In modalità privilegiata mostra ID, nomi e porte access di ciascuna VLAN. Usa end per tornare al prompt privilegiato.']
  ];
  const lessons=[
    {title:'VLAN e porte access',concepts:[
      ['Un dominio di broadcast per VLAN','Una VLAN separa il traffico di livello 2. Una porta access collega normalmente una postazione a una sola VLAN e scambia frame senza tag.'],
      ['Crea e nomina la VLAN',[
        ['enable','Dal prompt Switch> passa alla modalità EXEC privilegiata Switch#.'],
        ['configure terminal','Da Switch# passa alla configurazione globale (config)#.'],
        ...vlanCommands
      ]],
      ['Configura e verifica la porta access',[
        ['interface <porta>','In configurazione globale seleziona la porta. Il prompt diventa (config-if)#.'],
        ...portCommands
      ]]],
      steps:[
        'Su SW-1 crea la VLAN 10 e chiamala ACCOGLIENZA.',
        'Imposta Fa0/1, la porta del PC 1, in modalità access e assegnala alla VLAN 10. Verifica con show vlan brief.'
      ],
      step:net=>Number(accessVlanNamed(net,accessExercises[0])),
      ready:net=>accessReady(net,0)},
    {title:'Porte access con interface range',concepts:[
      ['Una configurazione per più porte','Usa un intervallo quando più porte dello stesso switch devono ricevere la stessa configurazione.'],
      ['Crea la VLAN sullo switch',vlanCommands,'Ogni switch deve conoscere le VLAN che usa. In questo laboratorio le VLAN si configurano localmente.'],
      ['Configura e verifica un intervallo di porte',[
        ['interface range <prima porta> - <ultima porta>','In configurazione globale seleziona le porte consecutive dello stesso tipo. Il prompt diventa (config-if-range)#.'],
        ...portCommands
      ]]],
      steps:[
        'Su SW-2 crea la VLAN 30 e chiamala UFFICIO_TECNICO.',
        'Su SW-2 usa interface range per selezionare Fa0/2 e Fa0/3. Impostale in modalità access e assegnale alla VLAN 30. Controlla entrambe con show vlan brief.'
      ],
      step:net=>Number(accessVlanNamed(net,accessExercises[1])),
      ready:net=>accessReady(net,1)},
    {title:'Trunk 802.1Q e diagnosi',concepts:[
      ['Un collegamento per più VLAN','Un trunk trasporta più VLAN sullo stesso collegamento. Il tag 802.1Q identifica la VLAN di un frame. La VLAN nativa gestisce i frame senza tag e va impostata con lo stesso ID ai due estremi. La lista delle VLAN ammesse stabilisce quali VLAN possono attraversare il trunk.'],
      ['Configura una porta trunk',[
        ['switchport mode trunk','In configurazione interfaccia (config-if)# imposta la porta in modalità trunk.'],
        ['switchport trunk allowed vlan <elenco>','Sostituisce la lista delle VLAN ammesse. Separa gli ID con virgole.'],
        ['switchport trunk native vlan <ID>','Imposta la VLAN a cui appartengono i frame senza tag.']
      ],'Parti dal prompt della configurazione interfaccia (config-if)#.'],
      ['Verifica il collegamento',[
        ['show interfaces trunk','Dal prompt Switch> o Switch# mostra i trunk attivi, la VLAN nativa e le VLAN ammesse.'],
        ['ping <IP>','Dal prompt C:\\> del PC di partenza, verifica il collegamento.']
      ]]],
      steps:[
        'Sullo switch centrale dell’Atrio, imposta Gi0/1 e Gi0/3 in modalità trunk e configura le VLAN ammesse secondo la scheda tecnica.',
        'Sullo switch centrale esegui show interfaces trunk da Switch centrale> o Switch centrale#. Se sei in configurazione, usa prima end. Verifica le VLAN ammesse su Gi0/1 e Gi0/3.',
        'Cerca l’IP del PC 3 nella scheda tecnica del Piano 3. Poi torna al Piano 1 e verifica il collegamento con un ping dal PC 5.'
      ],
      step:net=>V.trunksReady(net)?(net.trunksInspected?2:1):0,
      ready:net=>V.trunksReady(net)&&net.trunksInspected&&V.ping(net,4,2).ok&&net.verified.includes(0)},
    {title:'Routing tra VLAN',concepts:[
      ['Il gateway della VLAN','Ogni VLAN usa una sottorete IP distinta. Lo switch inoltra a livello 2. Il router collega le sottoreti attraverso un trunk e una sottointerfaccia per ciascuna VLAN.'],
      ['Router-on-a-stick',[
        ['interface <interfaccia>.<numero>','In configurazione globale crea o seleziona una sottointerfaccia. Il prompt diventa (config-if)#.'],
        ['encapsulation dot1Q <ID>','In (config-if)# associa la sottointerfaccia alla VLAN indicata.'],
        ['show ip interface brief','Da Router# controlla indirizzo IP, stato e protocollo delle sottointerfacce.']
      ]]],
      steps:[
        'Sul router dell’Atrio, configura una VLAN alla volta. Seleziona la sottointerfaccia, imposta il tag con encapsulation dot1Q e poi assegna IP e maschera del gateway. Usa i valori della scheda tecnica. Gi0/0 è già attiva.',
        'Controlla la configurazione delle quattro sottointerfacce del router. Verifica che abbiano gli indirizzi IP indicati nella scheda tecnica e che risultino tutte up/up.',
        'Dal PC 1 (Accoglienza) esegui un ping verso il PC 4 (Servizi al pubblico). Trovi l’IP del PC 4 nella scheda tecnica del Piano 4.'
      ],
      step:net=>V.routingReady(net)?(net.gatewaysInspected?2:1):0,
      ready:net=>V.routingReady(net)&&net.gatewaysInspected&&V.ping(net,0,3).ok&&net.verified.includes(1)}
  ];
  const options=(values,selected,label=value=>value)=>values.map(value=>`<option value="${value}"${value===selected?' selected':''}>${label(value)}</option>`).join('');
  const vlanOptions=[1,...V.vlans];
  function pcReplyTtl(result, from, to) {
    return result.ok ? (V.hosts[from].vlan === V.hosts[to].vlan ? 128 : 127) : null;
  }
  function fieldReference(net){
    const rows=V.hosts.map(({floor,port,vlan,ip},i)=>
      `<tr><th scope="row">${fieldHostNames[i]}</th><td>${floorSwitchName(floor,true)} Fa0/${port}</td><td>${vlan}</td><td><code>${ip}</code></td></tr>`
    ).join('');
    const links=V.floors.map((_,i)=>
      `<dt>${floorSwitchName(i+1,true)} Gi0/1 ↔ ${fieldCoreName} Gi0/${i+1}</dt><dd>VLAN ${V.trunkVlans(i+1).join(', ')}${net.palaceScenario?' · VLAN nativa 1 su entrambi i lati':''}</dd>`
    ).join('');
    const gateways=V.vlans.map(vlan=>
      `<dt>${routerUplink}.${vlan}</dt><dd><code>192.168.${vlan}.1/24</code></dd>`
    ).join('');
    return `<strong>Postazioni</strong><table class="vlan-access-reference">
      <thead><tr><th scope="col">Postazione</th><th scope="col">Porta access</th><th scope="col">VLAN</th><th scope="col">Indirizzo IP</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p><strong>Trunk tra i piani</strong></p><dl class="evidence">${links}</dl>
      <p><strong>Gateway sul router</strong></p><dl class="evidence"><dt>Collegamento</dt><dd>${fieldCoreName} ${coreRouterPort} ↔ ${fieldRouterName} ${routerUplink}</dd>${gateways}</dl>`;
  }
  function labTopology(field=false) {
    const device = (id, name, icon, switchPorts = '', number = 0) => `<li data-vlan-node="${id}"><button type="button" class="routing-device-node" data-vlan-device="${id}" data-vlan-number="${number}" aria-pressed="false"><img src="assets/icons/${icon}.png" alt=""><span>${name}</span>${switchPorts}</button></li>`;
    const computers = V.hosts.map((host, i) => device('pc', field?fieldHostNames[i]:`PC ${i+1} · ${host.name}`, 'pc', '', i)).join('');
    const floorPorts = '<span class="routing-router-ports vlan-switch-ports"></span>';
    const floorTrunkPorts = V.floors.map((_, i) =>
      `<span class="vlan-port-top" style="--port-position:${(i+.5)/V.floors.length*100}%" title="Verso ${floorSwitchName(i+1,field)}, porta Gi0/1">Gi0/${i+1}</span>`
    ).join('');
    const corePorts = `<span class="routing-router-ports vlan-switch-ports">${floorTrunkPorts}<span class="vlan-port-right">${coreRouterPort}</span></span>`;
    const routerPorts = `<span class="routing-router-ports vlan-switch-ports"><span class="vlan-port-left">${routerUplink}</span></span>`;
    return `<div class="routing-sheet-anchor vlan-lab-controls">
        ${field?'<h3>Architettura di rete</h3>':''}
        ${field?'':'<button type="button" id="open-routing-sheet" class="text-button" aria-expanded="false" aria-controls="routing-sheet">Scheda tecnica</button>'}
        <div class="vlan-floor-picker">
          <label for="vlan-floor">Piano</label>
          <select id="vlan-floor">
            <option value="atrium">Atrio</option>
            ${V.floors.map((_, i) => `<option value="${i}"${i===0?' selected':''}>${i+1} · ${floorSwitchName(i+1,field)}</option>`).join('')}
          </select>
        </div>
        ${field?'':'<div id="routing-sheet" role="region" aria-labelledby="open-routing-sheet" hidden></div>'}
      </div>
      <div class="routing-school-network"><div class="routing-path vlan-lab-topology">
        <div id="vlan-floor-view">
          <ol class="vlan-floor-devices">${computers}${device('floor',floorSwitchName(1,field),'switch',floorPorts)}</ol>
          <div class="vlan-floor-uplink" aria-hidden="true"></div>
        </div>
        <div id="vlan-atrium-view" hidden>
          <div class="vlan-atrium-uplinks" aria-hidden="true">
            <div>${V.floors.map(()=>'<span class="vlan-floor-uplink"></span>').join('')}</div>
          </div>
          <ol>${device('core',field?fieldCoreName:coreName,'switch',corePorts)}${device('router',field?fieldRouterName:'Router','router',routerPorts)}</ol>
        </div>
      </div></div>
    `;
  }
  function labConsole(field=false){
    const prompt='<span id="vlan-prompt" aria-hidden="true"></span><input id="vlan-command" aria-label="Comando" placeholder="Digita un comando" disabled autocomplete="off" spellcheck="false">';
    if(field)return `<div class="field-console">
      <div id="vlan-device-tabs" class="field-console-devices" role="group" aria-label="Dispositivi della sede"></div>
      <div class="mission-cli">
        <div class="mission-terminal-output" id="vlan-console" aria-live="polite" tabindex="0"></div>
        <form id="routing-form" class="mission-terminal-form"><label>${prompt}</label><button type="submit">Esegui</button></form>
      </div>
    </div>`;
    return `<div class="routing-console training-terminal">
      <div class="terminal-screen" id="vlan-console" aria-live="polite" tabindex="0"></div>
      <form id="routing-form"><label class="terminal-prompt">${prompt}</label></form>
    </div>`;
  }
  function labPanel(){
    return `<div class="routing-school-practice">${labTopology()}${labConsole()}</div>`;
  }
  function bindLab(net, changed, index, rememberCommand, locked, runPcPing) {
    const field=index===null;
    const find = id => document.getElementById(id);
    const input = find('vlan-command');
    const output = find('vlan-console');
    const devices = [...document.querySelectorAll('[data-vlan-device]')];
    const sessions = new Map();
    const topology = document.querySelector('.vlan-lab-topology');
    const floorPicker = find('vlan-floor');
    const floorSwitch = topology.querySelector('[data-vlan-device="floor"]');
    const accessPorts = floorSwitch.querySelector('.vlan-switch-ports');
    const floorView = find('vlan-floor-view');
    const atriumView = find('vlan-atrium-view');
    let floor = 0;
    let session;
    let referenceFloor;
    const exercise=accessExercises[index];
    const accessLesson=exercise&&!locked?net.accessExercises[index]:undefined;

    function renderSwitchPorts(ports) {
      const inAtrium = session?.kind === 'core' || session?.kind === 'router';
      const selectedFloor = inAtrium ? 'atrium' : String(floor);
      if (!field && referenceFloor !== selectedFloor) {
        reference(inAtrium);
        referenceFloor = selectedFloor;
      }
      floorPicker.value = selectedFloor;
      floorView.hidden = inAtrium;
      atriumView.hidden = !inAtrium;
      floorSwitch.querySelector('span').textContent = floorSwitchName(floor+1,field);
      accessPorts.innerHTML = ports.map((host,i) =>
        `<span class="vlan-port-${i===0?'left':'right'}">Fa0/${host.port}</span>`
      ).join('') + `<span class="vlan-port-bottom" title="Verso ${field?fieldCoreName:coreName}, porta Gi0/${floor+1}">Gi0/1</span>`;
    }

    function trunkReference(level) {
      return `<dt>Trunk SW-${level} Gi0/1 ↔ Centrale Gi0/${level}</dt><dd>VLAN ammesse ${V.trunkVlans(level).join(', ')}</dd>`;
    }

    function reference(inAtrium) {
      const sheet=find('routing-sheet');
      if(!inAtrium){
        const rows=V.hosts.map((host,i)=>{
          if(host.floor!==floor+1)return '';
          return `<tr><th scope="row">PC ${i+1} · ${host.name}</th>
            <td><code>Fa0/${host.port}</code></td><td>${host.vlan}</td><td><code>${host.ip}</code></td></tr>`;
        }).join('');
        sheet.innerHTML=`<strong>Piano ${floor+1} · SW-${floor+1}</strong>
          <table class="vlan-access-reference">
            <thead><tr><th scope="col">Postazione</th><th scope="col">Porta access</th><th scope="col">VLAN</th><th scope="col">Indirizzo IP</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <dl>${trunkReference(floor+1)}</dl>
          ${index===0&&floor===0?'<p>La porta del PC 5 è già configurata.</p>':''}`;
        return;
      }
      if(index===2){
        sheet.innerHTML = `<strong>Atrio · Switch centrale</strong>
          <table class="vlan-access-reference">
            <thead><tr><th scope="col">Porta trunk</th><th scope="col">Configurazione attesa</th></tr></thead>
            <tbody>
              <tr><th scope="row"><code>Gi0/1</code> · SW-1</th><td>VLAN ammesse <code>${V.trunkVlans(1).join(',')}</code></td></tr>
              <tr><th scope="row"><code>Gi0/3</code> · SW-3</th><td>VLAN ammesse <code>${V.trunkVlans(3).join(',')}</code></td></tr>
            </tbody>
          </table>`;
        return;
      }
      const trunks = V.floors.map((_, i) => trunkReference(i+1)).join('');
      const routerLink = `<dt>${coreName} ${coreRouterPort} ↔ Router ${routerUplink}</dt><dd>Trunk preconfigurato</dd>`;
      const gateways = V.vlans.map(vlan => `<dt>Gi0/0.${vlan}</dt><dd>192.168.${vlan}.1 / 255.255.255.0</dd>`).join('');
      sheet.innerHTML = `<strong>Atrio · Switch centrale e router</strong><dl>${trunks}${routerLink}${index>=3?gateways:''}</dl>`;
    }

    function prompt() {
      if (session.kind==='pc') return 'C:\\>';
      const mode = {user:'>',exec:'#',config:'(config)#',port:'(config-if)#',range:'(config-if-range)#',vlan:'(config-vlan)#'};
      return session.name+mode[session.mode];
    }

    function renderTerminal() {
      output.replaceChildren(...session.lines);
      find('vlan-prompt').textContent=prompt();
      output.scrollTop=output.scrollHeight;
      requestAnimationFrame(()=>{
        if(output.isConnected)output.scrollTop=output.scrollHeight;
      });
    }

    function updateDiagram() {
      const ports=V.hosts.filter(host=>host.floor===floor+1).sort((a,b)=>a.port-b.port);
      renderSwitchPorts(ports);
      devices.forEach(button=>{
        const isPC=button.dataset.vlanDevice==='pc';
        const deviceNumber=Number(button.dataset.vlanNumber);
        if (isPC) {
          const host = V.hosts[deviceNumber];
          button.parentElement.hidden = host.floor !== floor+1;
          button.parentElement.classList.toggle('vlan-pc-right', host===ports[1]);
        }
        const active=button.dataset.vlanDevice===session?.kind&&(!isPC||deviceNumber===session.number);
        button.setAttribute('aria-pressed',String(active));
      });
    }

    function select(kind, number, focus = true) {
      const key=kind+number;
      if(!sessions.has(key)) {
        const name={pc:field?fieldHostNames[number]:'PC',floor:floorSwitchName(number+1,field),core:field?fieldCoreName:coreName,router:field?fieldRouterName:'Router'}[kind];
        sessions.set(key,{kind,number,name,mode:'user',lines:[]});
      }
      session=sessions.get(key);
      if (kind==='floor') floor=number;
      if (kind==='pc') floor=V.hosts[number].floor-1;
      updateDiagram();
      input.disabled=false;
      input.placeholder='Digita un comando';
      renderTerminal();
      if(field){
        updateFieldDevice();
        find('vlan-device-tabs').replaceChildren(...devices.flatMap(button=>{
          if(button.parentElement.hidden||button.closest('[hidden]'))return [];
          const tab=document.createElement('button');
          tab.type='button';
          tab.className='routing-device-link';
          tab.textContent=button.querySelector('span').textContent;
          tab.setAttribute('aria-pressed',button.getAttribute('aria-pressed'));
          tab.addEventListener('click',()=>button.click());
          return [tab];
        }));
      }
      if (focus) input.focus({preventScroll:true});
    }

    function fieldDeviceDetails(){
      const {kind,number}=session;
      if(kind==='pc'){
        const host=V.hosts[number];
        return [['Indirizzo IP',host.ip],['Subnet mask','255.255.255.0'],['Gateway predefinito',`192.168.${host.vlan}.1`],['Porta access',`${floorSwitchName(host.floor,true)} Fa0/${host.port}`]];
      }
      if(kind==='router'){
        return V.vlans.map(vlan=>[`${routerUplink}.${vlan}`,net.gateways.includes(vlan)?`192.168.${vlan}.1/24`:'Senza indirizzo']);
      }
      const trunkDetails=(allowed,native)=>`${allowed.join(', ')||'Nessuna'}${native==null?'':` · Nativa ${native}`}`;
      if(kind==='core'){
        return net.trunks.map((link,i)=>[`Gi0/${i+1} · ${floorSwitchName(i+1,true)}`,trunkDetails(link.core,link.nativeCore)]);
      }
      const link=net.trunks[number];
      return V.hosts.flatMap((host,i)=>host.floor===number+1?[[`Fa0/${host.port} · ${fieldHostNames[i]}`,net.access[i]==null?'':`VLAN ${net.access[i]}`]]:[])
        .concat([['Gi0/1 · Trunk',trunkDetails(link.local,link.nativeLocal)]]);
    }

    function updateFieldDevice(){
      find('mission-terminal-title').textContent=`Terminale / ${session.name}`;
      find('vlan-device-details').replaceChildren(...fieldDeviceDetails().map(([label,value])=>{
        const row=document.createElement('label');
        const detail=Object.assign(document.createElement('input'),{value,readOnly:true,tabIndex:-1});
        row.append(label,detail);
        return row;
      }));
    }

    function updateNetwork(update) {
      update();
      if(index===2)delete net.trunksInspected;
      if(index===3)delete net.gatewaysInspected;
      net.verified=[];
      if(field)updateFieldDevice();
      changed();
    }

    function showVlanBrief(kind, number, switchId) {
      const namesByVlan=net.vlanNames?.[switchId];
      const names = ['default', 'ACCOGLIENZA', 'AMMINISTRAZIONE', 'UFFICIO_TECNICO', 'SERVIZI_AL_PUBBLICO'];
      const lines = [
        'VLAN Name                             Status    Ports',
        '---- -------------------------------- --------- -------------------------------'
      ];
      vlanOptions.forEach((vlan, index) => {
        if(!V.vlanExists(net,switchId,vlan))return;
        const ports = V.hosts.flatMap((host, i) =>
          kind === 'floor' && host.floor === number + 1 && net.access[i] === vlan ? [`Fa0/${host.port}`] : []
        );
        lines.push(`${String(vlan).padEnd(5)}${(namesByVlan?.[vlan] ?? names[index]).padEnd(33)}${'active'.padEnd(10)}${ports.join(', ')}`.trimEnd());
      });
      return lines.join('\n');
    }

    function showInterfacesTrunk(kind, number) {
      const links = net.trunks.flatMap((link, index) => {
        if (kind === 'core') return [{port: `Gi0/${index + 1}`, allowed: link.core, native: link.nativeCore, active:link.coreTrunk!==false}];
        if (index === number) return [{port: 'Gi0/1', allowed: link.local, native: link.nativeLocal}];
        return [];
      });
      const activeLinks=links.filter(link=>link.active!==false);
      return [
        'Port        Mode             Encapsulation  Status        Native vlan',
        ...activeLinks.map(({port, native}) => `${port.padEnd(12)}on               802.1q         trunking      ${native??''}`),
        '',
        'Port        Vlans allowed on trunk',
        ...activeLinks.map(({port, allowed}) => `${port.padEnd(12)}${allowed.slice().sort((a, b) => a - b).join(',') || 'none'}`)
      ].join('\n');
    }

    function showRouterInterfaces(){
      const columns=(port,ip,ok,method,status,protocol)=>
        port.padEnd(22)+ip.padEnd(13)+ok.padEnd(4)+method.padEnd(7)+status.padEnd(7)+protocol;
      const row=(port,ip,method)=>columns(port,ip,'YES',method,'up','up');
      const lines=[
        columns('Interface','IP-Address','OK?','Method','Status','Protocol'),
        row('GigabitEthernet0/0','unassigned','unset')
      ];
      for(const vlan of V.vlans){
        const configured=net.gateways.includes(vlan);
        if(configured||session.tagged?.has(vlan)){
          lines.push(row('GigabitEthernet0/0.'+vlan,configured?'192.168.'+vlan+'.1':'unassigned',configured?'manual':'unset'));
        }
      }
      return lines.join('\n');
    }

    function run(raw, print) {
      const command = raw.toLowerCase().replace(/\s+/g, ' ');
      const {kind,number,mode,port}=session;
      const switchId = kind === 'core' ? 'core' : `floor-${number + 1}`;
      let match;
      if (command === '?' && kind !== 'pc' && kind !== 'router') {
        if (mode === 'config') return 'interface <porta> · interface range <prima porta> - <ultima porta> · vlan <ID> · no vlan <ID> · end · exit';
        if (mode === 'vlan') return 'name <nome> · end · exit';
      }
      if(command==='?'&&kind==='router'&&mode==='exec')return 'configure terminal · show ip interface brief · exit';
      if(command==='?')return kind==='pc'?`ping <IP> · pc <1–${V.hosts.length}>`:'enable · configure terminal · interface <porta> · show vlan brief · show interfaces trunk · end · exit';
      if((match=/^(pc|sw) ([1-9]\d*)$/.exec(command))){
        const [kind,target]=[match[1],Number(match[2])-1];
        if(kind==='sw'&&target>=V.floors.length)return '% Scegli uno switch da 1 a 4.';
        if(kind==='pc'&&target>=V.hosts.length)return `% Scegli un PC da 1 a ${V.hosts.length}.`;
        select(kind==='pc'?'pc':'floor',target);
        return '';
      }
      if(kind==='pc'){
        if((match=/^ping (\S+)$/.exec(command))){
          const destination=V.hosts.findIndex(host=>host.ip===match[1]);
          if(destination<0)return '% Indirizzo di destinazione assente dalla scheda tecnica.';
          const result=V.ping(net,number,destination);
          if(number===destination)return result.reason;
          return runPcPing(match[1],pcReplyTtl(result,number,destination),input,print).then(()=>{
            if(!locked&&input.isConnected&&input.closest('dialog')?.open){
              V.verify(net,number,destination);
              if(index===2&&number===4&&destination===2&&!result.ok&&V.trunksReady(net)){
                for(const i of [number,destination]){
                  const {floor,port,vlan}=V.hosts[i];
                  if(net.access[i]!==vlan)print(`Controlla la porta access Fa0/${port} su SW-${floor}: il PC ${i+1} deve essere in VLAN ${vlan}.`);
                }
              }
              changed();
            }
          });
        }
        return '% Usa ping <IP> oppure pc <numero>.';
      }
      if(command==='enable'&&mode==='user'){session.mode='exec';return '';}
      if(['configure terminal','conf t'].includes(command)&&mode==='exec'){session.mode='config';return 'Enter configuration commands, one per line.  End with CNTL/Z.';}
      if(command==='end'&&mode!=='user'){session.mode='exec';return '';}
      if(command==='exit'&&mode!=='user'){session.mode={exec:'user',config:'exec',port:'config',range:'config',vlan:'config'}[mode];return '';}
      if(kind==='router'&&mode==='exec'&&command==='show ip interface brief'){
        if(index===3&&!locked&&V.routingReady(net)&&!net.gatewaysInspected){
          net.gatewaysInspected=true;
          net.verified=net.verified.filter(check=>check!==1);
          changed();
        }
        return showRouterInterfaces();
      }
      if(['exec','user'].includes(mode)&&kind!=='router'){
        if(command==='show vlan brief'){
          if(accessLesson&&kind==='floor'&&number+1===exercise.floor&&accessVlanNamed(net,exercise)&&accessLesson.assigned&&exercisePortsReady(net,exercise)){
            accessLesson.verified=true;
            changed();
          }
          return showVlanBrief(kind, number, switchId);
        }
        if(command==='show interfaces trunk'){
          if(index===2&&kind==='core'&&!locked&&V.trunksReady(net)&&!net.trunksInspected){
            net.trunksInspected=true;
            net.verified=net.verified.filter(check=>check!==0);
            changed();
          }
          return showInterfacesTrunk(kind, number);
        }
      }
      if(kind==='floor'&&mode==='config'&&(match=/^(?:interface|int) range (?:fa|fastethernet)0\/(\d+) *- *(?:(?:fa|fastethernet)0\/|0\/)?(\d+)$/.exec(command))){
        const first=Number(match[1]),last=Number(match[2]);
        const range=V.hosts.flatMap((host,i)=>host.floor===number+1&&host.port>=first&&host.port<=last?[i]:[]);
        if(last<=first||range.length!==last-first+1)return '% Intervallo di porte non valido per questo switch.';
        session.range=range;
        session.mode='range';
        return '';
      }
      if(mode==='config'||mode==='port'||mode==='range'){
        if((match=/^(?:interface|int) (\S+)$/.exec(command))){
          const value=match[1].replace(/^fastethernet/,'fa').replace(/^gigabitethernet/,'gi');
          const access=/^fa0\/([123])$/.exec(value);
          const uplink=/^gi0\/([1-4])$/.exec(value);
          const subinterface=/^gi0\/0\.(10|20|30|40)$/.exec(value);
          if((kind==='floor'&&access&&V.hosts.some(host=>host.floor===number+1&&host.port===Number(access[1])))
            ||(uplink&&((kind==='floor'&&uplink[1]==='1')||kind==='core'))
            ||(kind==='router'&&subinterface)){
            session.port=value;
            session.mode='port';
            return '';
          }
          return '% Invalid interface type and number';
        }
      }
      if(locked)return field?'% Intervento completato. Puoi consultare la configurazione ed eseguire ping.':'% Prova già superata. Puoi consultare la configurazione ed eseguire ping.';
      if(kind!=='router'&&(match=/^no vlan (\d+)$/.exec(command))){
        if(mode!=='config')return '% Usa no vlan dalla configurazione globale (config)#.';
        const vlan=Number(match[1]);
        if(vlan===1)return '% VLAN 1 may not be deleted.';
        if(!vlanOptions.includes(vlan)||!V.vlanExists(net,switchId,vlan))return '';
        updateNetwork(()=>{
          net.deletedVlans??={};
          (net.deletedVlans[switchId]??=[]).push(vlan);
          if(net.vlanNames?.[switchId])delete net.vlanNames[switchId][vlan];
          if(accessLesson&&switchId===switchKey(exercise.floor)&&vlan===exercise.vlan)accessLesson.verified=false;
        });
        return '';
      }
      if (kind !== 'router' && mode === 'config' && (match = /^vlan (\d+)$/.exec(command))) {
        const vlan = Number(match[1]);
        if (!vlanOptions.includes(vlan)) return '% VLAN assente nel laboratorio.';
        if(!V.vlanExists(net,switchId,vlan)){
          updateNetwork(()=>{
            net.deletedVlans[switchId]=net.deletedVlans[switchId].filter(id=>id!==vlan);
            net.vlanNames??={};
            (net.vlanNames[switchId]??={})[vlan]=`VLAN${String(vlan).padStart(4,'0')}`;
          });
        }
        session.vlan = vlan;
        session.mode = 'vlan';
        return '';
      }
      if (mode === 'vlan' && /^name [a-z0-9_-]{1,32}$/.test(command)) {
        if (session.vlan === 1) return '% VLAN 1 may not be modified.';
        net.vlanNames ??= {};
        net.vlanNames[switchId] ??= {};
        net.vlanNames[switchId][session.vlan] = raw.split(/\s+/)[1];
        if(accessLesson&&switchId===switchKey(exercise.floor)&&session.vlan===exercise.vlan&&!accessVlanNamed(net,exercise)){
          accessLesson.verified=false;
        }
        changed();
        return '';
      }
      if(kind==='floor'&&(mode==='range'||(mode==='port'&&port.startsWith('fa')))){
        const hosts=mode==='range'?session.range:[V.hosts.findIndex(host=>host.floor===number+1&&host.port===Number(port.split('/')[1]))];
        const target=accessLesson&&hosts.length===exercise.hosts.length&&hosts.every(i=>exercise.hosts.includes(i));
        if(command==='switchport mode access'){
          if(target){
            accessLesson.modeSet=true;
            changed();
          }
          return '';
        }
        if((match=/^switchport access vlan (1|10|20|30|40)$/.exec(command))){
          const vlan=Number(match[1]);
          if(!V.vlanExists(net,switchId,vlan))return '% Crea prima la VLAN su questo switch.';
          if(target&&!accessLesson.modeSet)return '% Imposta prima la modalità access.';
          updateNetwork(()=>{
            for(const i of hosts)net.access[i]=vlan;
            if(accessLesson&&hosts.some(i=>exercise.hosts.includes(i))){
              accessLesson.assigned=Boolean(target&&vlan===exercise.vlan);
              accessLesson.verified=false;
            }
          });
          return '';
        }
      }
      if(mode==='port'){
        if((field||index>=2)&&kind!=='router'&&port.startsWith('gi')){
          const link=net.trunks[kind==='core'?Number(port.split('/')[1])-1:number];
          const side=kind==='core'?'core':'local';
          if(command==='switchport mode trunk'){
            if(kind==='core'&&link.coreTrunk===false)updateNetwork(()=>{link.coreTrunk=true;});
            return '';
          }
          if((match=/^switchport trunk allowed vlan (add )?([\d,]+)$/.exec(command))){
            const vlans=match[2].split(',').map(Number);
            if(vlans.some(vlan=>!vlanOptions.includes(vlan)))return '% VLAN assente nel laboratorio.';
            updateNetwork(()=>{link[side]=[...new Set(match[1]?[...link[side],...vlans]:vlans)];});
            return '';
          }
          if((match=/^switchport trunk native vlan (1|10|20|30|40)$/.exec(command))){
            updateNetwork(()=>{link[side==='core'?'nativeCore':'nativeLocal']=Number(match[1]);});
            return '';
          }
        }
        if((field||index>=3)&&kind==='router'){
          const vlan=Number(port.split('.')[1]);
          if(command===`encapsulation dot1q ${vlan}`){
            net.taggedVlans??=[];
            if(!net.taggedVlans.includes(vlan)){
              net.taggedVlans.push(vlan);
              changed();
            }
            return '';
          }
          if(command===`ip address 192.168.${vlan}.1 255.255.255.0`){
            if(!net.taggedVlans?.includes(vlan)&&!net.gateways.includes(vlan))return '% Imposta prima il tag con encapsulation dot1Q.';
            if(!net.gateways.includes(vlan))updateNetwork(()=>{net.gateways.push(vlan);});
            return '';
          }
        }
      }
      return `${' '.repeat(prompt().length + 1)}^\n% Invalid input detected at '^' marker.`;
    }

    floorPicker.addEventListener('change',()=>{
      if (floorPicker.value === 'atrium') select('core', 0, false);
      else select('floor', Number(floorPicker.value), false);
    });
    devices.forEach(button=>button.addEventListener('click',()=>{
      const kind=button.dataset.vlanDevice;
      select(kind,kind==='floor'?floor:Number(button.dataset.vlanNumber));
    }));
    find('routing-form').addEventListener('submit',async event=>{
      event.preventDefault();
      if(!session||input.readOnly)return;
      const raw=input.value.trim();
      if(!raw)return;
      const origin=session;
      const line=document.createElement('p');
      line.className='terminal-command';
      line.textContent=prompt()+' '+raw;
      origin.lines.push(line);
      rememberCommand(raw);
      input.value='';
      const response=document.createElement('p');
      function print(message){
        if(!response.textContent)origin.lines.push(response);
        response.textContent+=response.textContent?'\n'+message:message;
        if(session===origin&&input.isConnected)renderTerminal();
      }
      const result=run(raw,print);
      if(typeof result==='string'&&result)print(result);
      renderTerminal();
      if(result instanceof Promise)await result;
    });
    if(exercise)select('floor',exercise.floor-1,false);
    else if(field||index===2)select('core',0,false);
    else select('router',0,false);
  }
  globalThis.RZVlanUI={lessons,prepareCourse,labPanel,labTopology,labConsole,bindLab,fieldReference,fieldHostNames};
})();
