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
  function verify(index, data) {
    if (index === 0) {
      if (ipv4(data.ip) === null) return fail('Indirizzo IPv4 non valido: servono quattro numeri tra 0 e 255, separati da punti.');
      if (data.prefix !== '24') return fail('La rete dell’ospedale usa /24. Il terminale deve usare lo stesso prefisso.');
      if (!hostIn(data.ip, '192.168.10.0', 24)) return fail('Il terminale deve essere un host di 192.168.10.0/24: usa un indirizzo da .1 a .254. .0 è la rete, .255 è il broadcast.');
      if ([1,10].some(last => ipv4(data.ip) === ipv4('192.168.10.' + last))) return fail('Questo indirizzo è già occupato: .1 è il gateway e .10 è il server. Ogni dispositivo deve avere un IP unico.');
      if (ipv4(data.gateway) !== ipv4('192.168.10.1')) return fail('Il gateway indicato nella scheda tecnica è 192.168.10.1. È il punto di uscita dalla rete locale.');
      return {ok:true,message:'Risposta dal server 192.168.10.10. Terminale e server sono nella stessa sottorete; il nuovo IP è libero. L’ospedale torna in contatto con la centrale.'};
    }
    if (index === 1) {
      if (ipv4(data.ip) === null) return fail('Inserisci un indirizzo IPv4 valido per la radio mobile.');
      if (data.prefix !== '26') return fail('Il prefisso della protezione civile è /26: non cambiarlo per aggirare il conflitto.');
      if (!hostIn(data.ip, '192.168.20.64', 26)) return fail('La radio appartiene a 192.168.20.64/26. Gli host vanno da .65 a .126; .64 è la rete e .127 il broadcast.');
      if ([65,70,71].some(last => ipv4(data.ip) === ipv4('192.168.20.' + last))) return fail('IP già occupato. .65 è il gateway, .70 la sala operativa e .71 il ponte radio. Assegna alla radio mobile un altro host libero.');
      return {ok:true,message:'Conflitto risolto. La radio mobile ha un indirizzo unico nella sottorete /26. «Centrale, qui squadra Nord. Finalmente vi sentiamo.»'};
    }
    if (index === 2) {
      if (data.prefix !== '26') return fail('Servono quattro sottoreti uguali da una /24. Prendi due bit per la rete: /24 + 2 = /26, con 62 host utilizzabili per reparto.');
      if (ipv4(data.network) !== ipv4('192.168.30.64')) return fail('I quattro blocchi /26 iniziano a .0, .64, .128 e .192. Il secondo reparto usa il secondo blocco, a partire da .64.');
      if (ipv4(data.broadcast) !== ipv4('192.168.30.127')) return fail('Il secondo blocco comprende gli indirizzi da .64 a .127. L’ultimo, .127, è il broadcast.');
      if (String(data.capacity).trim() !== '62') return fail('Una /26 lascia 6 bit agli host: 2⁶ = 64 indirizzi. Tolti rete e broadcast, restano 62 host utilizzabili.');
      return {ok:true,message:'Piano approvato: quattro reti /26, ciascuna con 62 host. Il reparto 2 usa 192.168.30.64/26, broadcast 192.168.30.127. Tutte le sedi dell’episodio sono di nuovo collegate.'};
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
  const api = {ipv4, address, subnet, hostIn, verify, calculate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReteZero = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
