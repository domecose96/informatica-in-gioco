const assert = require('node:assert/strict');
const net = require('../network.js');
for (const invalid of ['', '192.168.1', '256.1.1.1', '-1.1.1.1', '1.2.3.4.5', 'a.b.c.d']) assert.equal(net.ipv4(invalid), null);
assert.equal(net.address(net.ipv4('192.168.30.127')), '192.168.30.127');
assert.deepEqual(net.subnet('192.168.30.85',26),{network:net.ipv4('192.168.30.64'),broadcast:net.ipv4('192.168.30.127'),capacity:62,size:64});
const first={ip:'192.168.10.20',prefix:'24',gateway:'192.168.10.254'};
assert.equal(net.verify(0,first).ok,true);
for(const ip of ['192.168.11.20','192.168.10.0','192.168.10.255','192.168.10.254','192.168.10.10'])assert.equal(net.verify(0,{...first,ip}).ok,false,ip);
assert.equal(net.verify(0,{...first,gateway:'192.168.11.1'}).ok,false);
assert.equal(net.verify(0,{...first,prefix:'25'}).ok,false);
const radio={ip:'192.168.20.66',prefix:'26',gateway:'192.168.20.65',dns:'192.168.20.126'};
for(let last=0;last<256;last++)assert.equal(net.verify(1,{...radio,ip:'192.168.20.'+last}).ok,last>=66&&last<=125&&![70,71].includes(last),'Radio .'+last);
assert.equal(net.verify(1,{...radio,gateway:'192.168.20.1'}).ok,false);
assert.equal(net.verify(1,{...radio,dns:'192.168.20.71'}).ok,false);
const ports=Object.fromEntries([126,254].map((last,index)=>['GigabitEthernet0/'+index,{
 ip:'192.168.30.'+last,mask:'255.255.255.128',enabled:true
}]));
assert.equal(net.verify(2,{ports}).ok,true);
for(const name of Object.keys(ports)){
 for(const [key,value] of [['ip','192.168.30.1'],['mask','255.255.255.224'],['enabled',false]]){
  assert.equal(net.verify(2,{ports:{...ports,[name]:{...ports[name],[key]:value}}}).ok,false,name+' '+key);
 }
}
console.log('OK: IPv4, indirizzi riservati, conflitti e due sottoreti /25 verificati.');
// Il banco gestisce anche gli estremi dello spazio IPv4 e /31-/32.
assert.equal(net.calculate('not-an-ip',24),null);
assert.equal(net.calculate('192.168.1.1',33),null);
for(let prefix=0;prefix<=30;prefix++){
 const result=net.calculate('203.0.113.173',prefix);
 assert.equal(net.ipv4(result.broadcast)-net.ipv4(result.network)+1,2**(32-prefix));
 assert.equal(net.ipv4(result.first),net.ipv4(result.network)+1);
 assert.equal(net.ipv4(result.last),net.ipv4(result.broadcast)-1);
 assert.equal(result.hosts,result.total-2);
 assert.equal(result.binary.length,32);
}
assert.equal(net.calculate('255.255.255.255',0).network,'0.0.0.0');
assert.equal(net.calculate('255.255.255.255',0).broadcast,'255.255.255.255');
assert.equal(net.calculate('192.0.2.1',31).hosts,2);
assert.equal(net.calculate('192.0.2.1',31).first,'192.0.2.0');
assert.equal(net.calculate('192.0.2.1',31).last,'192.0.2.1');
assert.equal(net.calculate('192.0.2.1',31).broadcast,null);
assert.equal(net.calculate('192.0.2.1',32).hosts,1);
assert.equal(net.calculate('192.0.2.1',32).first,'192.0.2.1');
assert.equal(net.calculate('192.0.2.1',32).mask,'255.255.255.255');
console.log('OK: banco di calcolo verificato per tutti i prefissi /0–/32.');

const plan={
 prefix0:'27',network0:'192.168.20.128',first0:'192.168.20.129',last0:'192.168.20.158',broadcast0:'192.168.20.159',
 prefix1:'28',network1:'192.168.20.160',first1:'192.168.20.161',last1:'192.168.20.174',broadcast1:'192.168.20.175',
 reserve:'192.168.20.176'
};
assert.equal(net.verifyVlsmPlan(plan),true);
assert.equal(net.verifyVlsmPlan({...plan,network1:'192.168.20.144'}),false);
assert.equal(net.verifyVlsmPlan({...plan,reserve:'192.168.20.160'}),false);
const rescuePorts=Object.fromEntries(net.rescuePorts.map(({name,network,prefix})=>{
 const {mask,last}=net.calculate(network,prefix);
 return [name,{mask,ip:last,enabled:true}];
}));
const pings=Object.fromEntries(Object.keys(rescuePorts).map(name=>[name,true]));
assert.equal(net.verify(3,{ports:rescuePorts,pings}).ok,true);
for(const name of Object.keys(pings)){
 assert.equal(net.verify(3,{ports:rescuePorts,pings:{...pings,[name]:false}}).ok,false);
 assert.equal(net.verify(3,{ports:{...rescuePorts,[name]:{...rescuePorts[name],enabled:false}},pings}).ok,false);
}
assert.equal(net.verify(3,{ports:rescuePorts}).ok,false);

globalThis.ReteZero=net;
require('../routing.js');
const {municipalDistrict,interfaces,makeRouters,trace,majorNetwork}=globalThis.RZRouting;
const routers=makeRouters(municipalDistrict);
routers.forEach((router,i)=>{
 router.rip={version:2,noSummary:true,networks:[...new Set(interfaces(municipalDistrict,i).map(port=>majorNetwork(port.ip)))]};
});
assert.deepEqual(interfaces(municipalDistrict,3).slice(0,2).map(({network,prefix})=>[network,prefix]),[
 ['192.168.30.0',25],['192.168.30.128',25]
]);
assert.equal(trace(municipalDistrict,routers,3,municipalDistrict.hosts[0],true,municipalDistrict.hosts[3]).ok,true);
assert.equal(trace(municipalDistrict,routers,3,municipalDistrict.hosts[2],true,municipalDistrict.additionalLans[0].host).ok,true);
console.log('OK: piano VLSM, gateway, collaudo e rotte RIP delle due /25 verificati.');
