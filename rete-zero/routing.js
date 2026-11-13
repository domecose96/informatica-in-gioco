'use strict';
(() => {
  const {ipv4, calculate, subnet}=ReteZero;
  const lab={
    labels:['Router A','Router B'],
    names:['RouterA','RouterB'],
    lans:['192.168.50.0','192.168.60.0'],
    hosts:['192.168.50.10','192.168.60.10'],
    gateways:['192.168.50.254','192.168.60.254'],
    links:[['10.30.0.1','10.30.0.2']]
  };
  const ripLab={
    ...lab,
    labels:['Router A','Router B','Router C'],
    names:['RouterA','RouterB','RouterC'],
    lans:[lab.lans[0],null,lab.lans[1]],
    hosts:[lab.hosts[0],null,lab.hosts[1]],
    gateways:[lab.gateways[0],null,lab.gateways[1]],
    links:[lab.links[0],['10.30.0.5','10.30.0.6']]
  };
  function majorPrefix(ip){
    const first=Number(ip.split('.')[0]);
    return first<128?8:first<192?16:24;
  }
  function majorNetwork(ip){
    return calculate(ip,majorPrefix(ip)).network;
  }
  function ripRoutes(topology,routers,start){
    if(routers[start].rip?.version!==2)return [];
    const enabled=(index,port)=>routers[index].rip?.version===2
      &&routers[index].rip.networks.includes(majorNetwork(port.ip));
    const learned=new Map();
    const seen=new Set([start]);
    const queue=[{index:start,metric:0}];
    for(const {index,metric,next} of queue){
      for(const port of interfaces(topology,index).filter(port=>enabled(index,port))){
        if(metric&&!port.next&&!learned.has(port.network)){
          learned.set(port.network,{network:port.network,prefix:port.prefix,next,metric});
        }
        if(!port.next||seen.has(port.neighbor)||metric>=15)continue;
        const peer=interfaces(topology,port.neighbor).find(peer=>peer.ip===port.next);
        if(!enabled(port.neighbor,peer))continue;
        seen.add(port.neighbor);
        queue.push({index:port.neighbor,metric:metric+1,next:next??port.next});
      }
    }
    return [...learned.values()].filter(route=>!routers[start].routes.some(entry=>entry.network===route.network&&entry.prefix===route.prefix));
  }
  const district={
    labels:['Ospedale','Centrale','Protezione civile'],
    names:['Ospedale','Centrale','ProtezioneCivile'],
    lans:['192.168.10.0',null,'192.168.20.64'],
    hosts:['192.168.10.20',null,'192.168.20.66'],
    gateways:['192.168.10.254',null,'192.168.20.65'],
    links:[['10.30.1.1','10.30.1.2'],['10.30.1.5','10.30.1.6']],
    prefixes:[24,null,26]
  };
  const municipalDistrict={
    ...district,
    labels:[...district.labels,'Municipio'],
    names:[...district.names,'Municipio'],
    lans:[...district.lans,'192.168.30.0'],
    hosts:[...district.hosts,'192.168.30.10'],
    gateways:[...district.gateways,'192.168.30.62'],
    prefixes:[...district.prefixes,26],
    branches:[{from:1,to:3,addresses:['10.30.1.9','10.30.1.10']}],
    additionalLans:[{router:3,host:'192.168.30.74',gateway:'192.168.30.126',prefix:26}]
  };
  function interfaces(topology,index){
    const result=[];
    const prefix=topology.prefixes?.[index]??24;
    if(topology.lans[index]){
      const lan=calculate(topology.lans[index],prefix);
      const gateway=topology.gateways?.[index]??lan.first;
      result.push({ip:gateway,prefix,network:lan.network});
    }
    for(const lan of topology.additionalLans??[]){
      if(lan.router===index)result.push({ip:lan.gateway,prefix:lan.prefix,network:calculate(lan.gateway,lan.prefix).network});
    }
    if(topology.links[index-1])result.push({ip:topology.links[index-1][1],prefix:30,neighbor:index-1,next:topology.links[index-1][0]});
    if(index<topology.links.length)result.push({ip:topology.links[index][0],prefix:30,neighbor:index+1,next:topology.links[index][1]});
    for(const {from,to,addresses} of topology.branches??[]){
      if(index===from)result.push({ip:addresses[0],prefix:30,neighbor:to,next:addresses[1]});
      if(index===to)result.push({ip:addresses[1],prefix:30,neighbor:from,next:addresses[0]});
    }
    return result;
  }
  function makeRouters(topology){
    return topology.names.map(name=>({name,routes:[]}));
  }
  function matches(ip,network,prefix){
    return subnet(ip,prefix)?.network===subnet(network,prefix)?.network;
  }
  function walk(topology,routers,start,destination){
    const hops=[];
    const seen=new Set();
    let index=start;
    while(!seen.has(index)){
      seen.add(index);
      const ports=interfaces(topology,index);
      const connected=ports.find(port=>matches(destination,port.ip,port.prefix));
      const route=[...routers[index].routes,...ripRoutes(topology,routers,index)].filter(entry=>matches(destination,entry.network,entry.prefix))
        .sort((a,b)=>b.prefix-a.prefix)[0];
      if(connected&&(!route||connected.prefix>=route.prefix))return {ok:true,hops};
      const outgoing=ports.find(port=>port.next&&port.next===route?.next);
      if(!outgoing)return {ok:false,hops,stop:index};
      index=outgoing.neighbor;
      hops.push({index,ip:outgoing.next});
    }
    return {ok:false,hops,stop:index,loop:true};
  }
  function trace(topology,routers,start,destination,fromPc,sourceHost=topology.hosts[start]){
    const forward=walk(topology,routers,start,destination);
    const ports=interfaces(topology,start);
    const origin=(fromPc&&ports.find(port=>matches(sourceHost,port.ip,port.prefix))||ports[0]).ip;
    const replyTo=fromPc?sourceHost:origin;
    const hops=fromPc?[{index:start,ip:origin}]:[];
    for(const hop of forward.hops){
      const reply=walk(topology,routers,hop.index,replyTo);
      hops.push({...hop,responds:reply.ok});
    }
    const destinationIndex=topology.additionalLans?.find(lan=>lan.host===destination)?.router??topology.hosts.indexOf(destination);
    const reached=forward.ok&&destinationIndex>=0;
    const reply=reached?walk(topology,routers,destinationIndex,replyTo):null;
    return {ok:Boolean(reply?.ok),forward,reply,hops};
  }
  const maskPrefixes=Array.from({length:33},(_,prefix)=>calculate('0.0.0.0',prefix).mask);
  function changeRoute(topology,routers,index,parts,remove){
    const [network,mask,next,...extra]=parts;
    const prefix=maskPrefixes.indexOf(mask);
    if(extra.length||prefix<0||ipv4(network)===null||calculate(network,prefix).network!==network)
      return '% Inserisci indirizzo di rete, maschera e IP del prossimo router.';
    const ports=interfaces(topology,index);
    if(ports.some(port=>port.ip===next))
      return '% Questo IP appartiene al router corrente. Usa l’IP del router vicino sul collegamento tra i due.';
    if(!ports.some(port=>port.next&&port.next===next))
      return '% Il prossimo router deve essere direttamente collegato.';
    const router=routers[index];
    const same=entry=>entry.network===network&&entry.prefix===prefix&&entry.next===next;
    if(remove)router.routes=router.routes.filter(entry=>!same(entry));
    else if(!router.routes.some(same))router.routes.push({network,prefix,next});
    return '';
  }
  function routeTable(topology,routers,index){
    const ports=interfaces(topology,index);
    const interfaceName=slot=>'GigabitEthernet0/'+slot;
    const routes=ports.flatMap((port,slot)=>{
      const details='is directly connected, '+interfaceName(slot);
      return [
        {code:'C',network:calculate(port.ip,port.prefix).network,prefix:port.prefix,details},
        {code:'L',network:port.ip,prefix:32,details}
      ];
    });
    const statics=routers[index].routes;
    routes.push(...statics.map(route=>({
      ...route,
      code:route.prefix===0?'S*':'S',
      details:'[1/0] via '+route.next
    })));
    for(const route of ripRoutes(topology,routers,index)){
      const outgoingSlot=ports.findIndex(port=>port.next===route.next);
      // RIP routes are recomputed immediately when the table is displayed.
      const details=`[120/${route.metric}] via ${route.next}, 00:00:00, ${interfaceName(outgoingSlot)}`;
      routes.push({...route,code:'R',details});
    }
    routes.sort((a,b)=>ipv4(a.network)-ipv4(b.network)||a.prefix-b.prefix);
    const defaultRoute=statics.find(route=>route.prefix===0);
    const lines=[
      'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
      '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
      '       * - candidate default',
      '',
      defaultRoute?`Gateway of last resort is ${defaultRoute.next} to network 0.0.0.0`:'Gateway of last resort is not set',
      ''
    ];
    const groups=new Map();
    for(const route of routes){
      const prefix=majorPrefix(route.network);
      const groupNetwork=route.prefix>=prefix
        ?majorNetwork(route.network)+'/'+prefix
        :route.network+'/'+route.prefix;
      if(!groups.has(groupNetwork))groups.set(groupNetwork,[]);
      groups.get(groupNetwork).push(route);
    }
    for(const [network,group] of groups){
      const masks=new Set(group.map(route=>route.prefix));
      const subnetted=masks.size>1||network!==group[0].network+'/'+group[0].prefix;
      if(masks.size>1)lines.push(`     ${network} is variably subnetted, ${group.length} subnets, ${masks.size} masks`);
      else if(subnetted)
        lines.push(`     ${network.split('/')[0]}/${group[0].prefix} is subnetted, ${group.length} subnets`);
      for(const route of group){
        lines.push(`${route.code.padEnd(subnetted?9:5)}${route.network}/${route.prefix} ${route.details}`);
      }
    }
    return lines.join('\n');
  }
  globalThis.RZRouting={lab,ripLab,district,municipalDistrict,interfaces,makeRouters,trace,changeRoute,routeTable,majorNetwork,ripRoutes};
})();
