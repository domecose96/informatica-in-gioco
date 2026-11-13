/* Controlli locali della guida e dell'audio, indipendenti dagli altri giochi. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),panel=$('audio-panel'),building=$('building-dialog');
  const tracks=[$('background-music'),$('mission-music')];
  const titles=['Tra le case','Segnale debole'];
  const currentTrack=()=>Number(building.open&&building.classList.contains('mission-screen'));
  let activeTrack=currentTrack(),mix=activeTrack,fadeFrame=0,playRequest=0;
  let settings={enabled:false,music:.2,effects:.4},context;
  try{const saved=JSON.parse(localStorage.getItem('rete-zero-audio-v1'));if(saved){settings.enabled=saved.enabled===true;for(const key of ['music','effects'])if(Number.isFinite(saved[key]))settings[key]=Math.max(0,Math.min(1,saved[key]));}}catch(_){}
  const silent=()=>!settings.enabled||(settings.music===0&&settings.effects===0);
  function save(){try{localStorage.setItem('rete-zero-audio-v1',JSON.stringify(settings));}catch(_) {}}
  function syncVolume(){
    const volume=settings.enabled?settings.music*.65:0;
    tracks[0].volume=volume*(1-mix);
    tracks[1].volume=volume*mix;
  }
  function sync(){
    syncVolume();
    for(const key of ['music','effects']){
      $(key+'-volume').value=Math.round(settings[key]*100);
      $(key+'-output').textContent=Math.round(settings[key]*100)+'%';
    }
    const muted=silent();
    $('audio-mute').dataset.muted=String(muted);
    $('audio-mute').setAttribute('aria-pressed',String(muted));
    $('audio-mute').setAttribute('aria-label',muted?'Attiva audio':'Silenzia tutto');
    $('audio-status').textContent=muted?'Audio disattivato'
      :tracks[activeTrack].paused&&settings.music>0?'Musica in attesa di riproduzione':'Audio attivo';
    $('audio-open').dataset.muted=String(muted);
    $('audio-track').textContent=titles[activeTrack];
  }
  async function play(){
    const request=++playRequest;
    cancelAnimationFrame(fadeFrame);
    activeTrack=currentTrack();
    const target=activeTrack;
    const incoming=tracks[target],outgoing=tracks[1-target];
    if(!settings.enabled||settings.music===0||document.hidden){
      tracks.forEach(track=>track.pause());
      mix=target;
      sync();
      return;
    }
    if(outgoing.paused)mix=target;
    sync();
    try{await incoming.play();}catch(_){
      if(request===playRequest)sync();
      return;
    }
    if(request!==playRequest)return;
    sync();
    const from=mix;
    const started=performance.now();
    function fade(now){
      const progress=Math.min(1,(now-started)/700);
      mix=from+(target-from)*progress;
      syncVolume();
      if(progress<1)fadeFrame=requestAnimationFrame(fade);
      else outgoing.pause();
    }
    if(from===target)outgoing.pause();
    else fadeFrame=requestAnimationFrame(fade);
  }
  new MutationObserver(()=>{
    if(currentTrack()!==activeTrack)play();
  }).observe(building,{attributes:true,attributeFilter:['open','class']});
  function effect(){if(silent()||settings.effects===0)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context??=new Audio();const sound=()=>{const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime;osc.type='sine';osc.frequency.setValueAtTime(620,at);osc.frequency.exponentialRampToValueAtTime(430,at+.07);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(settings.effects*.045,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.09);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+.1);osc.onended=()=>{osc.disconnect();gain.disconnect();};};if(context.state==='suspended')context.resume().then(sound).catch(()=>{});else sound();}catch(_) {}}
  function messageSound(){
    if(silent()||settings.effects===0)return;
    try {
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      context??=new Audio();
      const sound=()=>{
        const start=context.currentTime;
        [660,880].forEach((frequency,index)=>{
          const tone=context.createOscillator(),gain=context.createGain();
          const at=start+index*.12;
          tone.type='sine';
          tone.frequency.value=frequency;
          gain.gain.setValueAtTime(.001,at);
          gain.gain.exponentialRampToValueAtTime(.15*settings.effects,at+.02);
          gain.gain.exponentialRampToValueAtTime(.001,at+.16);
          tone.connect(gain).connect(context.destination);
          tone.start(at);
          tone.stop(at+.17);
        });
      };
      if(context.state==='suspended')context.resume().then(sound).catch(()=>{});
      else sound();
    } catch (_) {}
  }
  document.addEventListener('retezero:message',messageSound);
  function closeAudio(){panel.hidden=true;$('audio-open').setAttribute('aria-expanded','false');}
  $('audio-open').addEventListener('click',()=>{panel.hidden=!panel.hidden;$('audio-open').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden&&settings.enabled)play();});
  $('audio-close').addEventListener('click',()=>{closeAudio();$('audio-open').focus();});
  $('audio-mute').addEventListener('click',()=>{const wasSilent=silent();if(wasSilent&&settings.music===0&&settings.effects===0){settings.music=.2;settings.effects=.4;}settings.enabled=wasSilent;save();play();});
  for(const key of ['music','effects'])$(key+'-volume').addEventListener('input',event=>{settings[key]=Number(event.target.value)/100;settings.enabled=true;save();play();});
  document.addEventListener('click',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!$('audio-open').contains(event.target))closeAudio();if(event.target.closest('button,a')&&!event.target.closest('#audio-panel,#audio-open'))effect();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){closeAudio();$('audio-open').focus();}});
  $('help-open').addEventListener('click',()=>{closeAudio();$('help-dialog').showModal();});
  const closeHelp=()=>{$('help-dialog').close();$('help-open').focus();};$('help-close').addEventListener('click',closeHelp);$('help-start').addEventListener('click',closeHelp);
  document.addEventListener('visibilitychange',play);
  // La riproduzione inizia solo dopo un gesto dell'utente, anche con preferenze salvate.
  document.addEventListener('pointerdown',()=>{if(settings.enabled)play();},{once:true});
  sync();
})();
