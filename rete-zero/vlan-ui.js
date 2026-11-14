'use strict';
(() => {
  const V=RZVlan;
  const coreName='Switch centrale';
  const coreRouterPort='Gi0/5';
  const routerUplink='Gi0/0';
  const lessons=[
    {title:'VLAN e porte access',concepts:[
      ['Un dominio di broadcast per VLAN','Una VLAN separa il traffico di livello 2. Una porta access collega normalmente una postazione a una sola VLAN e scambia frame senza tag.'],
      ['Assegna la porta',[
        ['enable','Da SW-1> passa alla modalità EXEC privilegiata SW-1#.'],
        ['configure terminal','Da SW-1# passa alla configurazione globale SW-1(config)#.'],
        ['interface <porta>','Da SW-1(config)# seleziona la porta indicata nella scheda tecnica. Il prompt diventa SW-1(config-if)#.'],
        ['switchport mode access','Sul prompt SW-1(config-if)# imposta la porta in modalità access.'],
        ['switchport access vlan 30','Sul prompt SW-1(config-if)# assegna la porta alla VLAN indicata nella scheda tecnica.'],
        ['show vlan brief','Torna a SW-1# con end e controlla le assegnazioni attuali.']
      ]],
      ['Dai un nome alla VLAN',[
        ['vlan 10','Dal prompt SW-1(config)# seleziona la VLAN 10 e passa a SW-1(config-vlan)#.'],
        ['name Accoglienza','Da SW-1(config-vlan)# assegna il nome. Puoi usare fino a 32 caratteri senza spazi.'],
        ['show vlan brief','Usa end per tornare a SW-1# e controlla il nome nella colonna Name.']
      ]]],
      task:'Su SW-1 correggi le porte di Accoglienza e della postazione tecnica. Usa la scheda tecnica per trovare le VLAN e controlla con show vlan brief.',ready:V.accessReady},
    {title:'Trunk 802.1Q e diagnosi',concepts:[
      ['Un collegamento per più VLAN','Il trunk trasporta più VLAN. Il tag 802.1Q identifica la VLAN. Di norma i frame della VLAN nativa passano senza tag, quindi la VLAN nativa deve coincidere ai due estremi.'],
      ['Controlla i due estremi',[
        ['switchport mode trunk','In configurazione interfaccia (config-if)#, imposta il collegamento come trunk.'],
        ['switchport trunk allowed vlan 10,30,99','In (config-if)#, imposta le VLAN ammesse sul trunk di esempio.'],
        ['switchport trunk native vlan 99','In (config-if)#, imposta la VLAN nativa.'],
        ['show interfaces trunk','Torna con end al prompt EXEC privilegiato (#) e controlla VLAN ammesse e nativa.'],
        ['ping <IP>','Dal prompt C:\\> del PC di partenza, verifica il collegamento.']
      ]]],
      task:'Ripristina il trunk del piano 1 e correggi la VLAN nativa del piano 3. Verifica con un ping tra le due postazioni tecniche.',ready:net=>V.trunksReady(net)&&V.ping(net,4,2).ok&&net.verified.includes(0)},
    {title:'Routing tra VLAN',concepts:[
      ['Il gateway della VLAN','Ogni VLAN usa una sottorete IP distinta. Lo switch inoltra a livello 2. Il router collega le sottoreti attraverso un trunk e una sottointerfaccia per ciascuna VLAN.'],
      ['Router-on-a-stick',[
        ['interface GigabitEthernet0/0.30','Da Router(config)# apri la sottointerfaccia della VLAN 30. Il prompt diventa Router(config-if)#.'],
        ['encapsulation dot1Q 30','Da Router(config-if)# associa la sottointerfaccia al tag 30.'],
        ['ip address 192.168.30.1 255.255.255.0','Da Router(config-if)# assegna l’indirizzo del gateway. Nel laboratorio l’interfaccia fisica è già attiva.'],
        ['ping <IP>','Dal prompt C:\\> del PC di partenza, verifica il collegamento.']
      ]]],
      task:'Attiva i quattro gateway. Verifica con un ping da Accoglienza a Servizi al pubblico.',ready:net=>V.routingReady(net)&&V.ping(net,0,3).ok&&net.verified.includes(2)},
    {title:'Permessi tra reparti',concepts:[
      ['La VLAN separa, il router filtra','Applica al router una politica che consenta soltanto le richieste previste. Le regole sono direzionali. Una risposta a una richiesta permessa può tornare senza autorizzare una nuova richiesta nella direzione opposta.'],
      ['Configura e applica il filtro',[
        ['ip access-list extended REPARTI','Da Router(config)# crea l’ACL e passa a Router(config-ext-nacl)#.'],
        ['permit icmp <rete sorgente> 0.0.0.255 <rete destinazione> 0.0.0.255 echo','Da Router(config-ext-nacl)# aggiungi un permesso per ogni direzione indicata. Il simulatore gestisce le risposte.'],
        ['ip access-group REPARTI in','Usa exit per tornare a Router(config)#, poi seleziona ciascuna sottointerfaccia e applica il filtro da Router(config-if)#.'],
        ['ping <IP>','Dal prompt C:\\> del PC di partenza, verifica i collegamenti consentiti e quelli bloccati.']
      ]]],
      task:'Consenti Accoglienza → Servizi al pubblico e Amministrazione → Ufficio tecnico. Blocca le altre richieste tra VLAN e verifica anche i ping che devono fallire.',ready:V.ready}
  ];
  const options=(values,selected,label=value=>value)=>values.map(value=>`<option value="${value}"${value===selected?' selected':''}>${label(value)}</option>`).join('');
  const vlanOptions=[1,...V.vlans,99];
  function panel(net,sections){
    const hosts=V.hosts.map(host=>host.name);
    return `<div class="vlan-config">
      ${sections.includes(0)?`<details open><summary>Porte access</summary>
        ${V.hosts.map((host,i)=>`<label>Piano ${host.floor} · Fa0/${host.port} · ${host.name}
          <select data-access="${i}">${options(vlanOptions,net.access[i])}</select></label>`).join('')}
        <button type="button" class="secondary" data-inspect="access">show vlan brief</button></details>`:''}
      ${sections.includes(1)?`<details open><summary>Trunk tra i piani e lo switch centrale</summary>
        ${net.trunks.map((link,i)=>`<fieldset><legend>Piano ${i+1} · Gi0/1 ↔ Centrale · Gi0/${i+1}</legend>
          ${[['local','Switch del piano'],['core',coreName]].map(([key,label])=>`<div>${label}
            <div class="vlan-tags">${vlanOptions.map(vlan=>`<label><input type="checkbox" data-trunk="${i}" data-side="${key}" value="${vlan}"${link[key].includes(vlan)?' checked':''}> ${vlan}</label>`).join('')}</div>
            <label>VLAN nativa <select data-native="${i}" data-side="${key}">${options(vlanOptions,link[key==='local'?'nativeLocal':'nativeCore'])}</select></label></div>`).join('')}
          </fieldset>`).join('')}
        <button type="button" class="secondary" data-inspect="trunk">show interfaces trunk</button></details>`:''}
      ${sections.includes(2)?`<details open><summary>Gateway sul router · Gi0/0</summary>
        ${V.vlans.map(vlan=>`<label><input type="checkbox" data-gateway="${vlan}"${net.gateways.includes(vlan)?' checked':''}>
          Gi0/0.${vlan} · VLAN ${vlan} · 192.168.${vlan}.1/24</label>`).join('')}</details>`:''}
      ${sections.includes(3)?`<details open><summary>Permessi ICMP tra VLAN</summary>
        <label><input type="checkbox" data-filter${net.policy!==null?' checked':''}> Applica il filtro al router</label>
        ${V.vlans.map(from=>`<fieldset><legend>Da VLAN ${from}</legend><div class="vlan-tags">
          ${V.vlans.filter(to=>to!==from).map(to=>`<label><input type="checkbox" data-policy="${from}" value="${to}"${net.policy?.some(([a,b])=>a===from&&b===to)?' checked':''}${net.policy===null?' disabled':''}> Consenti verso ${to}</label>`).join('')}
          </div></fieldset>`).join('')}</details>`:''}
      <fieldset class="vlan-ping"><legend>Collaudo ping</legend>
        <label>Da <select id="vlan-source">${options(hosts.map((_,i)=>i),0,i=>hosts[i])}</select></label>
        <label>A <select id="vlan-target">${options(hosts.map((_,i)=>i),3,i=>hosts[i])}</select></label>
        <button type="button" class="secondary" data-ping>Esegui ping</button>
      </fieldset>
      <pre id="vlan-output" class="feedback" role="status"></pre>
    </div>`;
  }
  function bind(net,changed,locked){
    const root=document.querySelector('.vlan-config'), output=document.getElementById('vlan-output');
    if(locked)root.querySelectorAll('details select, details input').forEach(control=>control.disabled=true);
    root.addEventListener('change',event=>{
      const el=event.target,{access,trunk,native,side,gateway,filter,policy}=el.dataset,value=Number(el.value);
      if(access!==undefined)net.access[access]=value;
      else if(trunk!==undefined){
        const allowed=net.trunks[trunk][side];
        net.trunks[trunk][side]=el.checked?[...allowed,value]:allowed.filter(vlan=>vlan!==value);
      }else if(native!==undefined)net.trunks[native][side==='local'?'nativeLocal':'nativeCore']=value;
      else if(gateway!==undefined)net.gateways=el.checked?[...net.gateways,Number(gateway)]:net.gateways.filter(vlan=>vlan!==Number(gateway));
      else if(filter!==undefined){
        net.policy=el.checked?[]:null;
        root.querySelectorAll('[data-policy]').forEach(control=>{control.checked=false;control.disabled=!el.checked;});
      }else if(policy!==undefined)net.policy=el.checked?[...net.policy,[Number(policy),value]]:net.policy.filter(([a,b])=>a!==Number(policy)||b!==value);
      else return;
      net.verified=[];
      output.textContent='';
      changed();
    });
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button)return;
      if(button.dataset.inspect==='access'){
        output.textContent=V.hosts.map((host,i)=>`SW-${host.floor} Fa0/${host.port} · VLAN ${net.access[i]}`).join('\n');
      }else if(button.dataset.inspect==='trunk'){
        output.textContent=net.trunks.map((link,i)=>`Piano ${i+1} ↔ Centrale\n  Ammesse ${link.local.join(',')} / ${link.core.join(',')} · Native ${link.nativeLocal} / ${link.nativeCore}`).join('\n');
      }else if(button.hasAttribute('data-ping')){
        const from=Number(document.getElementById('vlan-source').value),to=Number(document.getElementById('vlan-target').value);
        const result=locked?V.ping(net,from,to):V.verify(net,from,to);
        output.textContent=`ping ${V.hosts[to].ip}\n${result.reason}`;
        changed();
      }
    });
  }
  function schoolLab() {
    const device = (id, name, icon, switchPorts = '', number = 0) => `<li data-vlan-node="${id}"><button type="button" class="routing-device-node" data-vlan-device="${id}" data-vlan-number="${number}" aria-pressed="false"><img src="assets/icons/${icon}.png" alt=""><span>${name}</span>${switchPorts}</button></li>`;
    const computers = V.hosts.map((host, i) => device('pc', host.name, 'pc', '', i)).join('');
    const floorPorts = '<span class="routing-router-ports vlan-switch-ports"></span>';
    const corePorts = `<span class="routing-router-ports vlan-switch-ports"><span class="vlan-port-left"></span><span>${coreRouterPort}</span></span>`;
    const routerPorts = `<span class="routing-router-ports vlan-switch-ports"><span class="vlan-port-left">${routerUplink}</span></span>`;
    return `<div class="routing-school-practice">
      <div class="routing-sheet-anchor">
        <button type="button" id="open-routing-sheet" class="text-button" aria-expanded="false" aria-controls="routing-sheet">Scheda tecnica</button>
        <div id="routing-sheet" role="region" aria-labelledby="open-routing-sheet" hidden></div>
      </div>
      <div class="routing-school-network"><div class="routing-path">
        <h3>Dispositivi del laboratorio</h3>
        <ol class="vlan-lab-topology">${computers}${device('floor','SW-1','switch',floorPorts)}${device('core',coreName,'switch',corePorts)}${device('router','Router','router',routerPorts)}</ol>
      </div></div>
      <div class="routing-console training-terminal">
        <div class="terminal-screen" id="vlan-console" aria-live="polite" tabindex="0"></div>
        <form id="routing-form"><label class="terminal-prompt"><span id="vlan-prompt" aria-hidden="true"></span><input id="vlan-command" aria-label="Comando" placeholder="Seleziona un dispositivo nello schema" disabled autocomplete="off" spellcheck="false"></label></form>
      </div>
    </div>`;
  }
  function bindSchoolLab(net, changed, index, rememberCommand, locked) {
    const find = id => document.getElementById(id);
    const input = find('vlan-command');
    const output = find('vlan-console');
    const devices = [...document.querySelectorAll('[data-vlan-device]')];
    const sessions = new Map();
    const topology = document.querySelector('.vlan-lab-topology');
    const floorSwitch = topology.querySelector('[data-vlan-device="floor"]');
    const accessPorts = floorSwitch.querySelector('.vlan-switch-ports');
    const corePort = topology.querySelector('[data-vlan-device="core"] .vlan-port-left');
    let floor = 0;
    let session;

    function renderSwitchPorts() {
      floorSwitch.querySelector('span').textContent = `SW-${floor+1}`;
      const ports = V.hosts.filter(host => host.floor === floor+1);
      accessPorts.innerHTML = ports.map(host =>
        `<span class="vlan-port-left">Fa0/${host.port}</span>`
      ).join('') + '<span>Gi0/1</span>';
      topology.classList.toggle('vlan-two-pcs', ports.length === 2);
      corePort.textContent = `Gi0/${floor+1}`;
    }

    function reference() {
      const hosts = V.hosts.map((host, i) => `<dt>PC ${i+1} · ${host.name} · SW-${host.floor} Fa0/${host.port}</dt><dd>${host.ip}/24 · VLAN ${host.vlan}</dd>`).join('');
      const trunks = V.vlans.map((_, i) => `<dt>SW-${i+1} Gi0/1 ↔ Centrale Gi0/${i+1}</dt><dd>VLAN ${V.trunkVlans(i+1).join(', ')} · nativa 99</dd>`).join('');
      const routerLink = `<dt>${coreName} ${coreRouterPort} ↔ Router ${routerUplink}</dt><dd>Trunk preconfigurato</dd>`;
      const gateways = V.vlans.map(vlan => `<dt>Gi0/0.${vlan}</dt><dd>192.168.${vlan}.1 / 255.255.255.0</dd>`).join('');
      const checks = V.checks.map(([a,b,ok]) => `<dt>${V.hosts[a].name} → ${V.hosts[b].name}</dt><dd>${ok?'Consentito':'Bloccato'}</dd>`).join('');
      find('routing-sheet').innerHTML = `<dl>${hosts}${index>=1?trunks+routerLink:''}${index>=2?gateways:''}${index>=3?checks:''}</dl>`;
    }

    function prompt() {
      if (session.kind==='pc') return 'C:\\>';
      const mode = {user:'>',exec:'#',config:'(config)#',port:'(config-if)#',vlan:'(config-vlan)#',acl:'(config-ext-nacl)#'};
      return session.name+mode[session.mode];
    }

    function renderTerminal() {
      output.replaceChildren(...session.lines);
      output.scrollTop=output.scrollHeight;
      find('vlan-prompt').textContent=prompt();
    }

    function updateDiagram() {
      renderSwitchPorts();
      devices.forEach(button=>{
        const isPC=button.dataset.vlanDevice==='pc';
        const deviceNumber=Number(button.dataset.vlanNumber);
        if (isPC) button.parentElement.hidden=V.hosts[deviceNumber].floor!==floor+1;
        const active=button.dataset.vlanDevice===session?.kind&&(!isPC||deviceNumber===session.number);
        button.setAttribute('aria-pressed',String(active));
      });
    }

    function select(kind, number) {
      const key=kind+number;
      if(!sessions.has(key)) {
        const name={pc:'PC',floor:`SW-${number+1}`,core:coreName,router:'Router'}[kind];
        sessions.set(key,{kind,number,name,mode:'user',lines:[]});
      }
      session=sessions.get(key);
      if (kind==='floor') floor=number;
      if (kind==='pc') floor=V.hosts[number].floor-1;
      updateDiagram();
      input.disabled=false;
      input.placeholder='Digita un comando';
      renderTerminal();
      input.focus({preventScroll:true});
    }

    function updateNetwork(update) {
      update();
      net.verified=[];
      changed();
    }

    function showVlanBrief(kind, number, namesByVlan) {
      const names = ['default', 'ACCOGLIENZA', 'AMMINISTRAZIONE', 'UFFICIO_TECNICO', 'SERVIZI_AL_PUBBLICO', 'NATIVA'];
      const lines = [
        'VLAN Name                             Status    Ports',
        '---- -------------------------------- --------- -------------------------------'
      ];
      vlanOptions.forEach((vlan, index) => {
        const ports = V.hosts.flatMap((host, i) =>
          kind === 'floor' && host.floor === number + 1 && net.access[i] === vlan ? [`Fa0/${host.port}`] : []
        );
        lines.push(`${String(vlan).padEnd(5)}${(namesByVlan?.[vlan] ?? names[index]).padEnd(33)}${'active'.padEnd(10)}${ports.join(', ')}`.trimEnd());
      });
      return lines.join('\n');
    }

    function showInterfacesTrunk(kind, number) {
      const links = net.trunks.flatMap((link, index) => {
        if (kind === 'core') return [{port: `Gi0/${index + 1}`, allowed: link.core, native: link.nativeCore}];
        if (index === number) return [{port: 'Gi0/1', allowed: link.local, native: link.nativeLocal}];
        return [];
      });
      return [
        'Port        Mode             Encapsulation  Status        Native vlan',
        ...links.map(({port, native}) => `${port.padEnd(12)}on               802.1q         trunking      ${native}`),
        '',
        'Port        Vlans allowed on trunk',
        ...links.map(({port, allowed}) => `${port.padEnd(12)}${allowed.slice().sort((a, b) => a - b).join(',') || 'none'}`)
      ].join('\n');
    }

    function run(raw) {
      const command = raw.toLowerCase().replace(/\s+/g, ' ');
      const {kind,number,mode,port}=session;
      const switchId = kind === 'core' ? 'core' : `floor-${number + 1}`;
      let match;
      if (command === '?' && kind !== 'pc' && kind !== 'router') {
        if (mode === 'config') return 'interface <porta> · vlan <ID> · end · exit';
        if (mode === 'vlan') return 'name <nome> · end · exit';
      }
      if(command==='?')return kind==='pc'?'ping <IP> · pc <1–5>':'enable · configure terminal · interface <porta> · show vlan brief · show interfaces trunk · end · exit';
      if((match=/^(pc|sw) ([1-5])$/.exec(command))){
        const target=Number(match[2])-1;
        if(match[1]==='sw'&&target>=V.floors.length)return '% Scegli uno switch da 1 a 4.';
        select(match[1]==='pc'?'pc':'floor',target);
        return '';
      }
      if(kind==='pc'){
        if((match=/^ping (\S+)$/.exec(command))){
          const destination=V.hosts.findIndex(host=>host.ip===match[1]);
          if(destination<0)return '% Indirizzo di destinazione assente dalla scheda tecnica.';
          const result=locked?V.ping(net,number,destination):V.verify(net,number,destination);
          changed();
          return result.reason;
        }
        return '% Usa ping <IP> oppure pc <numero>.';
      }
      if(command==='enable'&&mode==='user'){session.mode='exec';return '';}
      if(['configure terminal','conf t'].includes(command)&&mode==='exec'){session.mode='config';return 'Enter configuration commands, one per line.  End with CNTL/Z.';}
      if(command==='end'&&mode!=='user'){session.mode='exec';return '';}
      if(command==='exit'&&mode!=='user'){session.mode={exec:'user',config:'exec',port:'config',vlan:'config',acl:'config'}[mode];return '';}
      if(['exec','user'].includes(mode)&&kind!=='router'){
        if(command==='show vlan brief')return showVlanBrief(kind, number, net.vlanNames?.[switchId]);
        if(command==='show interfaces trunk')return showInterfacesTrunk(kind, number);
      }
      if(mode==='config'||mode==='port'){
        if((match=/^(?:interface|int) (\S+)$/.exec(command))){
          const value=match[1].replace(/^fastethernet/,'fa').replace(/^gigabitethernet/,'gi');
          const access=/^fa0\/([12])$/.exec(value);
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
        if(mode==='config'&&kind==='router'&&index>=3&&command==='ip access-list extended reparti'){
          session.mode='acl';
          return '';
        }
      }
      if(locked)return '% Prova già superata. Puoi consultare la configurazione ed eseguire ping.';
      if (kind !== 'router' && mode === 'config' && (match = /^vlan (\d+)$/.exec(command))) {
        const vlan = Number(match[1]);
        if (!vlanOptions.includes(vlan)) return '% VLAN assente nel laboratorio.';
        session.vlan = vlan;
        session.mode = 'vlan';
        return '';
      }
      if (mode === 'vlan' && /^name [a-z0-9_-]{1,32}$/.test(command)) {
        if (session.vlan === 1) return '% VLAN 1 may not be modified.';
        net.vlanNames ??= {};
        net.vlanNames[switchId] ??= {};
        net.vlanNames[switchId][session.vlan] = raw.split(/\s+/)[1];
        changed();
        return '';
      }
      if(mode==='acl'&&index>=3){
        if((match=/^(no )?permit icmp 192\.168\.(10|20|30|40)\.0 0\.0\.0\.255 192\.168\.(10|20|30|40)\.0 0\.0\.0\.255 echo$/.exec(command))){
          const [from,to]=match.slice(2).map(Number);
          if(from===to)return '% La regola deve collegare due VLAN diverse.';
          net.aclRules??=net.policy?.slice()??[];
          const existing=net.aclRules.findIndex(([a,b])=>a===from&&b===to);
          const removing=Boolean(match[1]);
          if(removing===(existing>=0))updateNetwork(()=>{
            if(removing)net.aclRules.splice(existing,1);
            else net.aclRules.push([from,to]);
            if(V.vlans.every(vlan=>net.aclInterfaces?.includes(vlan)))net.policy=net.aclRules.slice();
          });
          return '';
        }
        if(command==='deny icmp any any echo')return 'Le richieste ICMP senza permesso sono già bloccate dalla regola implicita.';
      }
      if(mode==='port'){
        if(kind==='floor'&&port.startsWith('fa')){
          if(command==='switchport mode access')return '';
          if((match=/^switchport access vlan (1|10|20|30|40|99)$/.exec(command))){
            const hostIndex=V.hosts.findIndex(host=>host.floor===number+1&&host.port===Number(port.split('/')[1]));
            updateNetwork(()=>{net.access[hostIndex]=Number(match[1]);});
            return '';
          }
        }
        if(index>=1&&kind!=='router'&&port.startsWith('gi')){
          const link=net.trunks[kind==='core'?Number(port.split('/')[1])-1:number];
          const side=kind==='core'?'core':'local';
          if(command==='switchport mode trunk')return '';
          if((match=/^switchport trunk allowed vlan (add )?([\d,]+)$/.exec(command))){
            const vlans=match[2].split(',').map(Number);
            if(vlans.some(vlan=>!vlanOptions.includes(vlan)))return '% VLAN assente nel laboratorio.';
            updateNetwork(()=>{link[side]=[...new Set(match[1]?[...link[side],...vlans]:vlans)];});
            return '';
          }
          if((match=/^switchport trunk native vlan (1|10|20|30|40|99)$/.exec(command))){
            updateNetwork(()=>{link[side==='core'?'nativeCore':'nativeLocal']=Number(match[1]);});
            return '';
          }
        }
        if(index>=2&&kind==='router'){
          const vlan=Number(port.split('.')[1]);
          if(command===`encapsulation dot1q ${vlan}`){session.tagged??=new Set();session.tagged.add(vlan);return '';}
          if(command===`ip address 192.168.${vlan}.1 255.255.255.0`){
            if(!session.tagged?.has(vlan)&&!net.gateways.includes(vlan))return '% Imposta prima il tag con encapsulation dot1Q.';
            if(!net.gateways.includes(vlan))updateNetwork(()=>{net.gateways.push(vlan);});
            return '';
          }
          if(index>=3&&command==='ip access-group reparti in'){
            if(!net.aclRules)return '% Crea prima l’ACL REPARTI.';
            net.aclInterfaces??=[];
            if(!net.aclInterfaces.includes(vlan))updateNetwork(()=>{
              net.aclInterfaces.push(vlan);
              if(V.vlans.every(id=>net.aclInterfaces.includes(id)))net.policy=net.aclRules.slice();
            });
            return '';
          }
        }
      }
      return `${' '.repeat(prompt().length + 1)}^\n% Invalid input detected at '^' marker.`;
    }

    devices.forEach(button=>button.addEventListener('click',()=>{
      const kind=button.dataset.vlanDevice;
      select(kind,kind==='floor'?floor:Number(button.dataset.vlanNumber));
    }));
    find('routing-form').addEventListener('submit',event=>{
      event.preventDefault();
      if(!session)return;
      const raw=input.value.trim();
      if(!raw)return;
      const origin=session;
      const line=document.createElement('p');
      line.className='terminal-command';
      line.textContent=prompt()+' '+raw;
      origin.lines.push(line);
      rememberCommand(raw);
      const result=run(raw);
      if(result){
        const response=document.createElement('p');
        response.textContent=result;
        origin.lines.push(response);
      }
      input.value='';
      renderTerminal();
    });
    reference();
    updateDiagram();
  }
  globalThis.RZVlanUI={lessons,panel,bind,schoolLab,bindSchoolLab};
})();
