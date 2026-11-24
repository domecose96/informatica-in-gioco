'use strict';
(() => {
  const title='STP e ridondanza';
  const ports=['Gi0/1','Gi0/2'];
  const names=['SW-1','SW-2','PC 1','PC 2'];
  const addresses=['192.168.30.11','192.168.30.12'];
  const concepts=[
    ['Perché serve STP','Due trunk tra gli stessi switch offrono un percorso di riserva. Se entrambi inoltrano i frame della stessa VLAN, un broadcast può circolare in anello. Spanning Tree Protocol (STP) evita l’anello lasciando un solo percorso attivo.'],
    ['Come si legge lo stato delle porte',[
      ['show spanning-tree vlan <ID>','Dal prompt dello switch (Switch#), mostra lo switch radice e i ruoli e gli stati delle porte per la VLAN indicata. Root FWD identifica la porta che inoltra verso la radice. Altn BLK indica una porta alternativa che non inoltra frame utente.']
    ],'Il laboratorio usa Rapid STP per la VLAN 30. Se il percorso attivo cade, la porta alternativa può passare in inoltro.']
  ];
  const tasks=[
    'Su SW-2 controlla lo spanning tree della VLAN 30. Individua la porta radice e quella alternativa.',
    'Su SW-2 disabilita la porta radice.',
    'Dal PC 1 esegui un ping verso il PC 2. Trovi l’indirizzo IP nella scheda tecnica.'
  ];
  const createLab=(done=false)=>({
    links:[!done,true],
    inspected:done,
    alternateInspected:done,
    verified:done,
    switchNames:names.slice(0,2)
  });
  const activeLink=lab=>lab.links.indexOf(true);
  const step=lab=>!lab.inspected?0:activeLink(lab)===1&&lab.alternateInspected?2:1;

  function inspect(lab,device){
    const active=activeLink(lab);
    const rows=ports.flatMap((port,i)=>{
      if(!lab.links[i])return [];
      const role=device===0?'Desg':i===active?'Root':'Altn';
      const status=role==='Altn'?'BLK':'FWD';
      return [`${port.padEnd(19)} ${role.padEnd(4)} ${status} 4         128.${i+1}    P2p`];
    });
    const localRoot=device===0||active===-1;
    const bridgeId=device===0?'0200.0000.0001':'0200.0000.0002';
    const rootAddress=localRoot?bridgeId:'0200.0000.0001';
    const rootPriority=localRoot&&device===1?32798:24606;
    const rootPath=localRoot?'             This bridge is the root':
      `             Cost        4\n             Port        ${active+1} (${ports[active]})`;
    return [
      'VLAN0030',
      '  Spanning tree enabled protocol rstp',
      `  Root ID    Priority    ${rootPriority}`,
      `             Address     ${rootAddress}`,rootPath,'',
      `  Bridge ID  Priority    ${device===0?24606:32798}`,
      `             Address     ${bridgeId}`,'',
      'Interface           Role Sts Cost      Prio.Nbr Type',
      '------------------- ---- --- --------- -------- ----------------',
      ...rows,'Fa0/1               Desg FWD 19        128.3    P2p Edge'
    ].join('\n');
  }
  function setLink(lab,index,enabled){
    if(lab.links[index]===enabled)return;
    lab.links=lab.links.map((current,i)=>i===index?enabled:current);
    lab.alternateInspected=false;
    lab.verified=false;
  }
  function recordPing(lab,source,destination,links){
    if(links===lab.links&&source===2&&destination===3&&step(lab)===2)lab.verified=true;
  }
  function markup(){
    const device=index=>{
      const isSwitch=index<2;
      const portLabels=isSwitch?ports.map((port,i)=>`<span class="stp-port" data-stp-port="${i}">${port}</span>`).join(''):'';
      const trunkLines=index===1?ports.map((port,i)=>`<span class="stp-link" data-stp-link="${i}" aria-hidden="true"></span>`).join(''):'';
      return `<li><button type="button" class="routing-device-node" data-stp-device="${index}" aria-pressed="false"><img src="assets/icons/${isSwitch?'switch':'pc'}.png" alt=""><span>${names[index]}</span>${portLabels}</button>${trunkLines}</li>`;
    };
    return `<div class="routing-school-practice" id="stp-lab">
      <div class="routing-sheet-anchor">
        <button type="button" id="open-routing-sheet" class="text-button" aria-expanded="false" aria-controls="routing-sheet">Scheda tecnica</button>
        <div id="routing-sheet" role="region" aria-labelledby="open-routing-sheet" hidden>
          <strong>Banco di prova · VLAN 30</strong>
          <dl>
            <dt>PC 1 → SW-1 Fa0/1</dt><dd>${addresses[0]}/24</dd>
            <dt>PC 2 → SW-2 Fa0/1</dt><dd>${addresses[1]}/24</dd>
            <dt>Trunk tra gli switch</dt><dd>Gi0/1 ↔ Gi0/1 · Gi0/2 ↔ Gi0/2</dd>
          </dl>
        </div>
      </div>
      <div class="routing-school-network">
        <div class="routing-path stp-topology" aria-label="Schema del laboratorio STP">
          <ol class="stp-devices">${device(2)}${device(0)}${device(1)}${device(3)}</ol>
        </div>
      </div>
      <div class="routing-console training-terminal">
        <div class="terminal-screen" id="stp-console" aria-label="Output del terminale" aria-live="polite" tabindex="0"></div>
        <form id="routing-form"><label class="terminal-prompt"><span id="stp-prompt" aria-hidden="true"></span><input id="stp-command" aria-label="Comando" placeholder="Digita un comando" autocomplete="off" spellcheck="false"></label></form>
      </div>
    </div>`;
  }
  function bind(lab,changed,remember,runPcPing,isLocked=()=>false){
    const root=document.getElementById('stp-lab');
    const input=root.querySelector('#stp-command');
    const output=root.querySelector('#stp-console');
    const prompt=root.querySelector('#stp-prompt');
    const devices=[...root.querySelectorAll('[data-stp-device]')];
    const links=[...root.querySelectorAll('[data-stp-link]')];
    const terminals=names.map(()=>({mode:'user',port:null,lines:[]}));
    let device=1;

    function scrollOutput(){output.scrollTop=output.scrollHeight;}
    function updatePrompt(){
      const label=device>=2?'C:\\>':lab.switchNames[device]+({user:'>',exec:'#',config:'(config)#',port:'(config-if)#'}[terminals[device].mode]);
      prompt.textContent=label;
      input.setAttribute('aria-label',`Comando su ${lab.switchNames[device]??names[device]}`);
    }
    function select(index,focus=true){
      device=index;
      devices.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.stpDevice)===index)));
      input.value='';
      remember.reset();
      updatePrompt();
      output.replaceChildren(...terminals[index].lines);
      scrollOutput();
      if(focus)input.focus({preventScroll:true});
    }
    function renderLinks(){
      links.forEach((link,i)=>{link.dataset.enabled=String(lab.links[i]);});
      root.querySelectorAll('[data-stp-port]').forEach(label=>{
        const i=Number(label.dataset.stpPort);
        label.dataset.enabled=String(lab.links[i]);
        label.setAttribute('aria-label',lab.links[i]?ports[i]:`${ports[i]} · Collegamento inattivo`);
      });
    }
    function updateSwitchName(index){
      devices.find(button=>Number(button.dataset.stpDevice)===index)
        .querySelector('img + span').textContent=lab.switchNames[index];
    }
    devices.forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.stpDevice))));
    root.querySelector('#routing-form').addEventListener('submit',async event=>{
      event.preventDefault();
      const raw=input.value.trim();
      if(!raw||input.readOnly)return;
      const source=device;
      const locked=isLocked();
      const terminal=terminals[source];
      function append(message,command=false){
        const line=document.createElement('p');
        if(command)line.className='terminal-command';
        line.textContent=message;
        terminal.lines.push(line);
        if(source===device){output.append(line);scrollOutput();}
      }
      append(`${prompt.textContent} ${raw}`,true);
      remember(raw);
      input.value='';
      const command=raw.toLowerCase().replace(/\s+/g,' ');
      if(source<2){
        const {mode}=terminal;
        const hostname=/^hostname ([a-z0-9][a-z0-9-]{0,62})$/i.exec(raw.replace(/\s+/g,' '));
        const port=/^(?:interface|int) (?:gi|gigabitethernet)0\/([12])$/.exec(command);
        if(command==='enable'&&mode==='user')terminal.mode='exec';
        else if(command==='disable'&&mode==='exec')terminal.mode='user';
        else if(['configure terminal','conf t'].includes(command)&&mode==='exec'){
          terminal.mode='config';
          append('Enter configuration commands, one per line.  End with CNTL/Z.');
        }else if(command==='end'&&(mode==='config'||mode==='port'))terminal.mode='exec';
        else if(command==='exit'&&mode!=='user')terminal.mode={exec:'user',config:'exec',port:'config'}[mode];
        else if(mode==='config'&&hostname){
          if(locked)append('% Prova già superata. Puoi consultare la configurazione.');
          else{
            lab.switchNames[source]=hostname[1];
            updateSwitchName(source);
            changed();
          }
        }else if(source===1&&port&&(mode==='config'||mode==='port')){
          terminal.port=Number(port[1])-1;
          terminal.mode='port';
        }else if(mode==='port'&&(command==='shutdown'||command==='no shutdown')){
          if(locked)append('% Prova già superata. Puoi consultare la configurazione.');
          else{
            setLink(lab,terminal.port,command==='no shutdown');
            renderLinks();
            changed();
          }
        }else if((mode==='user'||mode==='exec')&&/^show spanning-tree(?: vlan 30)?$/.test(command)){
          if(!locked&&source===1){
            if(lab.links.every(Boolean))lab.inspected=true;
            if(lab.inspected&&activeLink(lab)===1)lab.alternateInspected=true;
          }
          append(inspect(lab,source));
          changed();
        }else append('% Invalid input detected.');
        updatePrompt();
        scrollOutput();
        return;
      }
      const ping=/^ping (\S+)$/.exec(command);
      const destination=ping?addresses.indexOf(ping[1])+2:1;
      if(destination<2||destination===source){
        append('% Usa il ping verso l’indirizzo dell’altro PC indicato nella scheda tecnica.');
        return;
      }
      const sentOn=lab.links;
      const reply=await runPcPing(ping[1],activeLink(lab)>=0?128:null,input,append);
      if(!locked&&reply&&input.isConnected){
        recordPing(lab,source,destination,sentOn);
        changed();
        if(source===device)scrollOutput();
      }
    });
    renderLinks();
    lab.switchNames.forEach((_,index)=>updateSwitchName(index));
    select(device,false);
    changed();
  }
  globalThis.RZStp={title,concepts,tasks,createLab,step,markup,bind};
})();
