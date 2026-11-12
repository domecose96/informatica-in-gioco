/* Logica IPv4 della simulazione, indipendente dall'interfaccia. */
(function (root) {
  'use strict';
  function ipv4(value) {
    if (typeof value !== 'string' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim())) return null;
    const parts = value.trim().split('.').map(Number);
    if (parts.some(n => n > 255)) return null;
    return parts.reduce((n, octet) => n * 256 + octet, 0);
  }
  function address(n) {
    return [24, 16, 8, 0].map(shift => (n >>> shift) & 255).join('.');
  }
  function subnet(ip, prefix) {
    const n = ipv4(ip);
    if (n === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
    const size = 2 ** (32 - prefix);
    const network = Math.floor(n / size) * size;
    return { network, broadcast: network + size - 1, capacity: Math.max(0, size - 2), size };
  }
  function hostIn(ip, network, prefix) {
    const n = ipv4(ip), range = subnet(network, prefix);
    return n !== null && range !== null && n > range.network && n < range.broadcast;
  }
  function fail(message) { return {ok:false, message}; }
  const municipalPorts = Array.from({length:4}, (_, index) => ({
    name:'GigabitEthernet0/'+index,
    network:'192.168.30.'+(index*64)
  }));
  function verifyMunicipalPort(ports, index) {
    const {name,network}=municipalPorts[index];
    const port=ports?.[name];
    const expected=calculate(network,26);
    if(!port?.ip)return fail('Configura l’indirizzo di '+name+' per il reparto '+(index+1)+'.');
    if(port.mask!==expected.mask)return fail(name+' deve usare la maschera /26.');
    if(ipv4(port.ip)!==ipv4(expected.last))return fail('Assegna a '+name+' l’ultimo indirizzo utilizzabile della sottorete del reparto '+(index+1)+'.');
    if(!port.enabled)return fail('Abilita '+name+' con no shutdown.');
    return {ok:true};
  }
  function verify(index, data) {
    if (index === 0) {
      if (ipv4(data.ip) === null) return fail('Indirizzo IPv4 non valido: servono quattro numeri tra 0 e 255, separati da punti.');
      if (data.prefix !== '24') return fail('La rete dell’ospedale usa /24. Il terminale deve usare lo stesso prefisso.');
      if (!hostIn(data.ip, '192.168.10.0', 24)) return fail('Il terminale deve essere un host di 192.168.10.0/24: usa un indirizzo da .1 a .254. .0 è la rete, .255 è il broadcast.');
      if ([254,10].some(last => ipv4(data.ip) === ipv4('192.168.10.' + last))) return fail('Questo indirizzo è già occupato: .254 è il gateway e .10 è il server. Ogni dispositivo deve avere un IP unico.');
      if (ipv4(data.gateway) !== ipv4('192.168.10.254')) return fail('Il gateway indicato nella scheda tecnica è 192.168.10.254. È il punto di uscita dalla rete locale.');
      return {ok:true,message:'Risposta dal server 192.168.10.10. Terminale e server sono nella stessa sottorete; il nuovo IP è libero. L’ospedale torna in contatto con la centrale.'};
    }
    if (index === 1) {
      if (ipv4(data.ip) === null) return fail('Inserisci un indirizzo IPv4 valido per la radio mobile.');
      if (data.prefix !== '26') return fail('Il prefisso della protezione civile è /26: non cambiarlo per aggirare il conflitto.');
      if (!hostIn(data.ip, '192.168.20.64', 26)) return fail('La radio appartiene a 192.168.20.64/26. Gli host vanno da .65 a .126; .64 è la rete e .127 il broadcast.');
      if ([65,70,71,126].some(last => ipv4(data.ip) === ipv4('192.168.20.' + last))) return fail('IP già occupato. .65 è il gateway, .70 la sala operativa, .71 il ponte radio e .126 il DNS. Assegna alla radio mobile un altro host libero.');
      if (ipv4(data.gateway)!==ipv4('192.168.20.65')) return fail('Il gateway della radio deve essere 192.168.20.65, come indicato nella scheda tecnica.');
      if (ipv4(data.dns)!==ipv4('192.168.20.126')) return fail('Imposta il server DNS 192.168.20.126 indicato nella scheda tecnica.');
      return {ok:true,message:'Conflitto risolto. La radio mobile ha un indirizzo unico nella sottorete /26. «Centrale, qui squadra Nord. Finalmente vi sentiamo.»'};
    }
    if (index === 2) {
      for(const portIndex of municipalPorts.keys()){
        const result=verifyMunicipalPort(data.ports,portIndex);
        if(!result.ok)return result;
      }
      return {ok:true,message:'Le quattro porte LAN sono attive. Ogni reparto ha la propria sottorete /26 e un gateway. Il Municipio è di nuovo online.'};
    }
    return fail('Intervento non riconosciuto.');
  }
  function calculate(ip, prefix) {
    const range = subnet(ip, prefix);
    if (!range) return null;
    const special = prefix >= 31;
    return {
      ip: address(ipv4(ip)), prefix,
      mask: address(2 ** 32 - range.size),
      network: address(range.network),
      broadcast: special ? null : address(range.broadcast),
      first: address(range.network + (special ? 0 : 1)),
      last: address(range.broadcast - (special ? 0 : 1)),
      hosts: special ? range.size : range.capacity,
      total: range.size,
      binary: ipv4(ip).toString(2).padStart(32, '0'),
      note: prefix === 31 ? 'Rete /31 punto-punto: entrambi gli indirizzi possono essere utilizzati; non c’è broadcast di sottorete.' : prefix === 32 ? 'Una /32 identifica un singolo indirizzo host; non ha broadcast di sottorete.' : 'Il primo e l’ultimo indirizzo sono riservati a rete e broadcast.'
    };
  }
  const api = {ipv4, address, subnet, hostIn, verify, calculate, municipalPorts, verifyMunicipalPort};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReteZero = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
