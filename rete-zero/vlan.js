'use strict';
(() => {
  const floors=['Accoglienza','Ufficio tecnico','Amministrazione e Ufficio tecnico','Servizi al pubblico'];
  const vlans=[10,20,30,40];
  const hosts=[
    {name:'Accoglienza',floor:1,port:1,vlan:10,ip:'192.168.10.10'},
    {name:'Amministrazione',floor:3,port:2,vlan:20,ip:'192.168.20.10'},
    {name:'Ufficio tecnico',floor:3,port:1,vlan:30,ip:'192.168.30.10'},
    {name:'Servizi al pubblico',floor:4,port:1,vlan:40,ip:'192.168.40.10'},
    {name:'Tecnico al piano 1',floor:1,port:2,vlan:30,ip:'192.168.30.11'},
    {name:'Ufficio tecnico',floor:2,port:2,vlan:30,ip:'192.168.30.12'},
    {name:'Ufficio tecnico',floor:2,port:3,vlan:30,ip:'192.168.30.13'}
  ];
  const checks=[[4,2],[0,3],[1,2]];
  const palaceChecks=[[5,2],[0,3],[1,2]];
  const checksFor=net=>net.palaceScenario ? palaceChecks : checks;
  const trunkVlans=floor=>[...new Set(hosts.filter(host=>host.floor===floor).map(host=>host.vlan))];
  const fresh=()=>({
    topologyVersion:3,
    access:[1,20,30,40,10,30,30],
    trunks:vlans.map((_,i)=>({local:trunkVlans(i+1),core:i===0?[10]:i===2?[20]:trunkVlans(i+1),nativeLocal:1,nativeCore:1})),
    gateways:[],verified:[]
  });
  function freshPalace(){
    return {
      topologyVersion:3,
      palaceScenario:4,
      access:[null,20,30,40,30,20,20],
      deletedVlans:{'floor-1':[10]},
      trunks:vlans.map((_,index)=>({
        local:trunkVlans(index+1),
        core:index===1?[20]:trunkVlans(index+1),
        nativeLocal:index===3?null:1,
        nativeCore:1
      })),
      gateways:[],
      verified:[]
    };
  }
  function migrateLegacyNetwork(net){
    if(!net)return;
    net.access=net.access.map(vlan=>vlan===99?1:vlan);
    for(const link of net.trunks){
      link.local=link.local.filter(vlan=>vlan!==99);
      link.core=link.core.filter(vlan=>vlan!==99);
      if(link.nativeLocal===99)link.nativeLocal=1;
      if(link.nativeCore===99)link.nativeCore=1;
    }
    if(net.access.length<hosts.length){
      net.access.push(...hosts.slice(net.access.length).map(host=>host.vlan));
    }
    if(![2,3].includes(net.topologyVersion)){
      const [,floorTwo,floorThree]=net.trunks;
      for(const side of ['local','core']){
        floorTwo[side]=[...new Set([...floorTwo[side].filter(vlan=>vlan!==20),30])];
        floorThree[side]=[...new Set([...floorThree[side],20])];
      }
    }
    if(net.topologyVersion!==3){
      const previousChecks=[0,2,3];
      net.verified=previousChecks.flatMap((oldIndex,i)=>net.verified.includes(oldIndex)?[i]:[]);
      delete net.policy;
      delete net.aclRules;
      delete net.aclInterfaces;
      net.topologyVersion=3;
    }
  }
  const vlanExists=(net,switchId,vlan)=>!net.deletedVlans?.[switchId]?.includes(vlan);
  function upgradePalace(net, complete){
    if(complete||!net?.palaceScenario||net.palaceScenario===4)return;
    if(net.palaceScenario===true){
      net.deletedVlans??={};
      const missing=net.deletedVlans['floor-1']??=[];
      if(!missing.includes(10))missing.push(10);
      net.access[0]=null;
      net.verified=net.verified.filter(check=>check!==1);
    }else if(net.palaceScenario===2&&net.access[0]===1&&!vlanExists(net,'floor-1',10)){
      net.access[0]=null;
    }
    if(net.palaceScenario!==3&&net.access[5]===1&&net.access[6]===1)net.access[5]=net.access[6]=20;
    if(net.trunks[3].nativeLocal===40)net.trunks[3].nativeLocal=null;
    net.palaceScenario=4;
  }
  const accessReady=net=>hosts.every((host,i)=>net.access[i]===host.vlan&&vlanExists(net,`floor-${host.floor}`,host.vlan));
  function passesTrunk(net,floor,vlan){
    const link=net.trunks[floor-1];
    const nativeOnBothEnds=(link.nativeLocal===vlan)===(link.nativeCore===vlan);
    return link.coreTrunk!==false&&link.nativeLocal!=null&&link.nativeCore!=null&&nativeOnBothEnds&&link.local.includes(vlan)&&link.core.includes(vlan)
      &&vlanExists(net,`floor-${floor}`,vlan)&&vlanExists(net,'core',vlan);
  }
  const trunksReady=net=>vlans.every((_,i)=>{
    const link=net.trunks[i], required=trunkVlans(i+1);
    const nativeRestored=!net.palaceScenario||(link.nativeLocal===1&&link.nativeCore===1);
    return nativeRestored&&link.local.length===required.length&&link.core.length===required.length
      &&required.every(vlan=>passesTrunk(net,i+1,vlan));
  });
  const routingReady=net=>vlans.every(vlan=>net.gateways.includes(vlan));
  function ping(net,source,target){
    const a=hosts[source],b=hosts[target];
    if(!a||!b||source===target)return {ok:false,reason:'Scegli due postazioni diverse.'};
    if(net.access[source]!==a.vlan||net.access[target]!==b.vlan)return {ok:false,reason:'Una porta access è assegnata alla VLAN sbagliata.'};
    if(![a,b].every(host=>vlanExists(net,`floor-${host.floor}`,host.vlan)))return {ok:false,reason:'Una VLAN è assente dallo switch.'};
    if(a.vlan===b.vlan){
      const ok=a.floor===b.floor||[a,b].every(host=>passesTrunk(net,host.floor,host.vlan));
      return {ok,reason:ok?'Risposta ricevuta nella stessa VLAN.':'La VLAN non attraversa il collegamento tra gli switch.'};
    }
    if(![a,b].every(host=>passesTrunk(net,host.floor,host.vlan)&&net.gateways.includes(host.vlan)))
      return {ok:false,reason:'Percorso inter-VLAN incompleto. Controlla trunk e gateway.'};
    return {ok:true,reason:'Risposta ricevuta attraverso il router.'};
  }
  function verify(net,source,target){
    const result=ping(net,source,target);
    const index=checksFor(net).findIndex(([a,b])=>a===source&&b===target);
    if(index>=0&&result.ok&&!net.verified.includes(index))net.verified.push(index);
    return result;
  }
  const ready=net=>accessReady(net)&&trunksReady(net)&&routingReady(net)
    &&checksFor(net).every((_,i)=>net.verified.includes(i));
  globalThis.RZVlan={floors,vlans,hosts,checks,checksFor,trunkVlans,fresh,freshPalace,migrateLegacyNetwork,upgradePalace,vlanExists,accessReady,trunksReady,routingReady,ping,verify,ready};
})();
