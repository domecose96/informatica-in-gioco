'use strict';
(() => {
  const floors=['Accoglienza','Amministrazione','Ufficio tecnico','Servizi al pubblico'];
  const vlans=floors.map((_,i)=>(i+1)*10);
  const hosts=[
    ...floors.map((name,i)=>({name,floor:i+1,port:1,vlan:vlans[i],ip:`192.168.${vlans[i]}.10`})),
    {name:'Tecnico al piano 1',floor:1,port:2,vlan:30,ip:'192.168.30.11'}
  ];
  const checks=[
    [4,2,true,'Stessa VLAN su piani diversi'],
    [4,0,false,'VLAN diverse sullo stesso piano'],
    [0,3,true,'Accoglienza verso Servizi al pubblico'],
    [1,2,true,'Amministrazione verso Ufficio tecnico'],
    [3,1,false,'Servizi al pubblico verso Amministrazione']
  ];
  const policy=[[10,40],[20,30]];
  const trunkVlans=floor=>[...new Set(hosts.filter(host=>host.floor===floor).map(host=>host.vlan)),99];
  const fresh=()=>({
    access:[1,20,30,40,10],
    trunks:vlans.map((vlan,i)=>({local:trunkVlans(i+1),core:i===0?[10,99]:trunkVlans(i+1),nativeLocal:99,nativeCore:i===2?1:99})),
    gateways:[],policy:null,verified:[]
  });
  const accessReady=net=>hosts.every((host,i)=>net.access[i]===host.vlan);
  function passesTrunk(net,floor,vlan){
    const link=net.trunks[floor-1];
    return link.nativeLocal===link.nativeCore&&link.local.includes(vlan)&&link.core.includes(vlan);
  }
  const trunksReady=net=>vlans.every((_,i)=>{
    const link=net.trunks[i], required=trunkVlans(i+1);
    return link.nativeLocal===99&&link.nativeCore===99&&link.local.length===required.length&&link.core.length===required.length
      &&required.every(vlan=>passesTrunk(net,i+1,vlan));
  });
  const routingReady=net=>vlans.every(vlan=>net.gateways.includes(vlan));
  const permitted=(net,from,to)=>net.policy===null||net.policy.some(([a,b])=>a===from&&b===to);
  const policyReady=net=>net.policy?.length===policy.length&&policy.every(([from,to])=>permitted(net,from,to));
  function ping(net,source,target){
    const a=hosts[source],b=hosts[target];
    if(!a||!b||source===target)return {ok:false,reason:'Scegli due postazioni diverse.'};
    if(net.access[source]!==a.vlan||net.access[target]!==b.vlan)return {ok:false,reason:'Una porta access è assegnata alla VLAN sbagliata.'};
    if(a.vlan===b.vlan){
      const ok=a.floor===b.floor||[a,b].every(host=>passesTrunk(net,host.floor,host.vlan));
      return {ok,reason:ok?'Risposta ricevuta nella stessa VLAN.':'La VLAN non attraversa il collegamento tra gli switch.'};
    }
    if(![a,b].every(host=>passesTrunk(net,host.floor,host.vlan)&&net.gateways.includes(host.vlan)))
      return {ok:false,reason:'Percorso inter-VLAN incompleto. Controlla trunk e gateway.'};
    const ok=permitted(net,a.vlan,b.vlan);
    return {ok,reason:ok?'Risposta ricevuta attraverso il router.':'Richiesta bloccata dalla regola tra VLAN.',filtered:!ok};
  }
  function verify(net,source,target){
    const result=ping(net,source,target);
    const index=checks.findIndex(([a,b])=>a===source&&b===target);
    if(index>=0&&result.ok===checks[index][2]&&(result.ok||result.filtered)&&!net.verified.includes(index))net.verified.push(index);
    return result;
  }
  const ready=net=>accessReady(net)&&trunksReady(net)&&routingReady(net)&&policyReady(net)
    &&checks.every((_,i)=>net.verified.includes(i));
  globalThis.RZVlan={floors,vlans,hosts,checks,policy,trunkVlans,fresh,accessReady,trunksReady,routingReady,policyReady,ping,verify,ready};
})();
