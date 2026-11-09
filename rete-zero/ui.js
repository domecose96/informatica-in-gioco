/* Controlli locali della guida e dell'audio, indipendenti dagli altri giochi. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),music=$('background-music'),panel=$('audio-panel');
  let settings={enabled:false,music:.2,effects:.4},context;
  try{const saved=JSON.parse(localStorage.getItem('rete-zero-audio-v1'));if(saved){settings.enabled=saved.enabled===true;for(const key of ['music','effects'])if(Number.isFinite(saved[key]))settings[key]=Math.max(0,Math.min(1,saved[key]));}}catch(_){}
  const silent=()=>!settings.enabled||(settings.music===0&&settings.effects===0);
  function save(){try{localStorage.setItem('rete-zero-audio-v1',JSON.stringify(settings));}catch(_) {}}
  function sync(){music.volume=settings.enabled?settings.music*.65:0;for(const key of ['music','effects']){$(key+'-volume').value=Math.round(settings[key]*100);$(key+'-output').textContent=Math.round(settings[key]*100)+'%';}$('audio-mute').dataset.muted=String(silent());$('audio-mute').setAttribute('aria-pressed',String(silent()));$('audio-mute').setAttribute('aria-label',silent()?'Attiva audio':'Silenzia tutto');$('audio-status').textContent=silent()?'Audio disattivato':music.paused&&settings.music>0?'Musica in attesa di riproduzione':'Audio attivo';$('audio-open').dataset.muted=String(silent());}
  async function play(){if(settings.enabled&&settings.music>0){try{await music.play();}catch(_){}}else music.pause();sync();}
  function effect(){if(silent()||settings.effects===0)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context??=new Audio();const sound=()=>{const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime;osc.type='sine';osc.frequency.setValueAtTime(620,at);osc.frequency.exponentialRampToValueAtTime(430,at+.07);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(settings.effects*.045,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.09);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+.1);osc.onended=()=>{osc.disconnect();gain.disconnect();};};if(context.state==='suspended')context.resume().then(sound).catch(()=>{});else sound();}catch(_) {}}
  function closeAudio(){panel.hidden=true;$('audio-open').setAttribute('aria-expanded','false');}
  $('audio-open').addEventListener('click',()=>{panel.hidden=!panel.hidden;$('audio-open').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden&&settings.enabled)play();});
  $('audio-close').addEventListener('click',()=>{closeAudio();$('audio-open').focus();});
  $('audio-mute').addEventListener('click',()=>{const wasSilent=silent();if(wasSilent&&settings.music===0&&settings.effects===0){settings.music=.2;settings.effects=.4;}settings.enabled=wasSilent;save();play();});
  for(const key of ['music','effects'])$(key+'-volume').addEventListener('input',event=>{settings[key]=Number(event.target.value)/100;settings.enabled=true;save();play();});
  document.addEventListener('click',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!$('audio-open').contains(event.target))closeAudio();if(event.target.closest('button,a')&&!event.target.closest('#audio-panel,#audio-open'))effect();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){closeAudio();$('audio-open').focus();}});
  $('help-open').addEventListener('click',()=>{closeAudio();$('help-dialog').showModal();});
  const closeHelp=()=>{$('help-dialog').close();$('help-open').focus();};$('help-close').addEventListener('click',closeHelp);$('help-start').addEventListener('click',closeHelp);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)music.pause();else if(settings.enabled)play();});
  // La riproduzione inizia solo dopo un gesto dell'utente, anche con preferenze salvate.
  document.addEventListener('pointerdown',()=>{if(settings.enabled)play();},{once:true});
  sync();
})();
