/* Header shared by the robot map and exercises; independent of SQL audio. */
(() => {
  const find = selector => document.querySelector(selector);
  const open = find('#robot-audio-open'), panel = find('#robot-audio-panel');
  const audio = find('#robot-background-music'), toggle = find('#robot-music-toggle');
  const slider = find('#robot-music-volume'), output = find('#robot-music-output');
  const status = find('#robot-audio-status');
  const effectsSlider = find('#robot-effects-volume'), effectsOutput = find('#robot-effects-output');
  let effectsVolume = .55, context, effectsGain;
  let enabled = false, volume = .2;
  try {
    enabled = localStorage.getItem('robot.music.enabled') === 'true';
    const savedEffects = localStorage.getItem('robot.effects.volume');
    if (savedEffects !== null && Number.isFinite(Number(savedEffects))) effectsVolume = Math.max(0, Math.min(1, Number(savedEffects)));
    const saved = localStorage.getItem('robot.music.volume');
    if (saved !== null && Number.isFinite(Number(saved))) volume = Math.max(0, Math.min(1, Number(saved)));
  } catch { /* Controls still work without storage. */ }
  audio.volume = volume;
  effectsSlider.value = Math.round(effectsVolume * 100);
  slider.value = Math.round(volume * 100);
  function save() {
    try {
      localStorage.setItem('robot.music.enabled', String(enabled));
      localStorage.setItem('robot.music.volume', String(volume));
      localStorage.setItem('robot.effects.volume', String(effectsVolume));
      sessionStorage.setItem('robot.music.position', String(audio.currentTime));
    } catch { /* Storage is optional. */ }
  }
  function sync() {
    const muted = !enabled;
    output.textContent = `${Math.round(volume * 100)}%`;
    effectsOutput.textContent = `${Math.round(effectsVolume * 100)}%`;
    toggle.setAttribute('aria-pressed', String(muted));
    toggle.dataset.muted = String(muted);
    const label = enabled ? 'Silenzia tutto' : 'Attiva audio';
    toggle.setAttribute('aria-label', label); toggle.title = label;
    if (effectsGain) effectsGain.gain.setValueAtTime(enabled ? effectsVolume : 0, context.currentTime);
    status.textContent = !enabled ? 'Audio disattivato' : audio.paused && volume > 0 ? 'Audio attivo · musica in attesa' : 'Audio attivo';
  }
  function effect(kind = 'click') {
    if (!enabled || effectsVolume === 0) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio(); effectsGain = context.createGain(); effectsGain.connect(context.destination);
      }
      effectsGain.gain.setValueAtTime(effectsVolume, context.currentTime);
      const schedule = () => {
        if (!enabled || effectsVolume === 0) return;
        const patterns = {click:[[880,0,.035]],run:[[440,0,.06],[660,.06,.07]],step:[[220,0,.035]],success:[[523,0,.1],[659,.1,.1],[784,.2,.18]],error:[[160,0,.12],[110,.12,.17]]};
        for (const [frequency, offset, length] of patterns[kind] || patterns.click) {
          const oscillator = context.createOscillator(), gain = context.createGain();
          oscillator.type = kind === 'error' ? 'sawtooth' : 'square'; oscillator.frequency.value = frequency;
          const at = context.currentTime + offset;
          gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(.085, at + .006); gain.gain.exponentialRampToValueAtTime(.0001, at + length);
          oscillator.connect(gain); gain.connect(effectsGain); oscillator.start(at); oscillator.stop(at + length + .01);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        }
      };
      if (context.state === 'suspended') context.resume().then(schedule).catch(() => {}); else schedule();
    } catch { /* The game remains playable when Web Audio is unavailable. */ }
  }
  window.RobotAudio = { effect };

  async function play() {
    try { await audio.play(); } catch { /* The speaker button resumes when autoplay is blocked. */ }
    sync();
  }
  function closeAudio() { panel.hidden = true; open.setAttribute('aria-expanded', 'false'); }
  open.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
  });
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    if (enabled) { play(); effect('click'); }
    else audio.pause();
    save(); sync();
  });
  slider.addEventListener('input', () => { volume = Number(slider.value) / 100; audio.volume = volume; save(); sync(); });
  effectsSlider.addEventListener('input', () => { effectsVolume = Number(effectsSlider.value) / 100; save(); sync(); });
  effectsSlider.addEventListener('change', () => effect('click'));
  document.addEventListener('click', event => {
    if (event.target.closest('button, a, summary') && !find('.robot-audio-control').contains(event.target)) effect('click');
    if (enabled && audio.paused && volume > 0) play();
  });
  audio.addEventListener('loadedmetadata', () => {
    try {
      const seconds = Number(sessionStorage.getItem('robot.music.position') || 0);
      if (Number.isFinite(seconds) && seconds >= 0) audio.currentTime = seconds % audio.duration;
    } catch { /* Start from the beginning when the saved position is unavailable. */ }
    if (enabled) play();
  });
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('error', () => { status.textContent = 'Brano non disponibile: ricarica la pagina.'; });
  let lastSavedSecond = -1;
  audio.addEventListener('timeupdate', () => {
    const second = Math.floor(audio.currentTime);
    if (second !== lastSavedSecond) { lastSavedSecond = second; save(); }
  });
  window.addEventListener('pagehide', save);
  document.addEventListener('click', event => { if (!find('.robot-audio-control').contains(event.target)) closeAudio(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAudio(); });
  const instructions = find('#robot-instructions'), help = find('#robot-help-open');
  help.addEventListener('click', () => { closeAudio(); instructions.showModal(); find('#robot-help-close').focus(); });
  find('#robot-help-close').addEventListener('click', () => instructions.close());
  instructions.addEventListener('click', event => {
    if (event.target !== instructions) return;
    const box = instructions.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) instructions.close();
  });
  instructions.addEventListener('close', () => help.focus());
  sync();
})();
