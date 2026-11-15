const byId = id => document.getElementById(id);
byId('help').addEventListener('click', () => byId('instructions').showModal());

const musicButtons = [byId('music'), byId('workshop-music')];
const musicSettings = byId('music-settings');
const soundtrack = byId('soundtrack');
const musicVolume = byId('music-volume');
const musicOutput = byId('music-output');
const effectsVolume = byId('effects-volume');
const effectsOutput = byId('effects-output');
const musicToggle = byId('music-toggle');
const musicStatus = byId('music-status');
const musicKey = 'atelier-java:music';
const volumeKey = 'atelier-java:music-volume';
const defaultVolume = 28;
const defaultEffectsVolume = 45;
const effectsVolumeKey = 'atelier-java:effects-volume';
const effects = { click: [440], retry: [330, 262], success: [523, 659], complete: [523, 659, 784] };
let effectsContext;
let effectsGain;
let audioEnabled = true;

try {
  audioEnabled = localStorage.getItem(musicKey) !== 'off';
  musicVolume.value = localStorage.getItem(volumeKey) ?? defaultVolume;
  effectsVolume.value = localStorage.getItem(effectsVolumeKey) ?? defaultEffectsVolume;
} catch {}
soundtrack.volume = Number(musicVolume.value) / 100;

function isAudioSilent() {
  return !audioEnabled || (Number(musicVolume.value) === 0 && Number(effectsVolume.value) === 0);
}

function syncMusic() {
  const silent = isAudioSilent();
  musicOutput.value = musicVolume.value + '%';
  effectsOutput.value = effectsVolume.value + '%';
  const action = silent ? 'Riattiva audio' : 'Silenzia audio';
  const masterLevel = silent ? 0 : Math.max(Number(musicVolume.value), Number(effectsVolume.value));
  musicToggle.dataset.waves = String(masterLevel === 0 ? 0 : masterLevel <= 20 ? 1 : masterLevel <= 50 ? 2 : 3);
  musicToggle.setAttribute('aria-label', action);
  musicToggle.title = action;
  musicStatus.textContent = soundtrack.error ? 'Brano non disponibile.' :
    silent ? 'Audio disattivato' : soundtrack.volume === 0 ? 'Solo effetti sonori' :
      soundtrack.paused ? 'Musica in attesa' : 'Musica in riproduzione';
  for (const button of musicButtons) {
    button.title = silent ? 'Audio disattivato' : 'Controlli audio';
  }
}

function playMusic() {
  if (audioEnabled && soundtrack.volume > 0 && soundtrack.paused) soundtrack.play().catch(syncMusic);
}

async function playEffect(name) {
  if (!audioEnabled || Number(effectsVolume.value) === 0 || !window.AudioContext) return;
  try {
    if (!effectsContext) {
      effectsContext = new AudioContext();
      effectsGain = effectsContext.createGain();
      effectsGain.connect(effectsContext.destination);
    }
    if (effectsContext.state !== 'running') await effectsContext.resume();
    if (!audioEnabled || Number(effectsVolume.value) === 0) return;
    effectsGain.gain.value = Number(effectsVolume.value) / 100;
    effects[name].forEach((frequency, index) => {
      const start = effectsContext.currentTime + index * .085;
      const tone = effectsContext.createOscillator();
      const envelope = effectsContext.createGain();
      tone.frequency.value = frequency;
      envelope.gain.setValueAtTime(.001, start);
      envelope.gain.linearRampToValueAtTime(name === 'click' ? .045 : .12, start + .008);
      envelope.gain.exponentialRampToValueAtTime(.001, start + .09);
      tone.connect(envelope).connect(effectsGain);
      tone.start(start);
      tone.stop(start + .095);
    });
  } catch {}
}

function applyMusicSettings() {
  soundtrack.volume = Number(musicVolume.value) / 100;
  try {
    localStorage.setItem(musicKey, audioEnabled ? 'on' : 'off');
    localStorage.setItem(volumeKey, musicVolume.value);
    localStorage.setItem(effectsVolumeKey, effectsVolume.value);
  } catch {}
  if (effectsGain) effectsGain.gain.value = audioEnabled ? Number(effectsVolume.value) / 100 : 0;
  if (!audioEnabled || soundtrack.volume === 0) soundtrack.pause();
  else playMusic();
  syncMusic();
}

for (const event of ['play', 'pause', 'error']) soundtrack.addEventListener(event, syncMusic);
syncMusic();

let musicAnchor;

function positionMusicSettings() {
  if (!musicAnchor) return;
  const rect = musicAnchor.getBoundingClientRect();
  musicSettings.style.setProperty('--music-top', rect.bottom + 8 + 'px');
  const right = Math.max(12, window.innerWidth - rect.right);
  musicSettings.style.setProperty('--music-right', right + 'px');
  const pointerOffset = window.innerWidth - right - (rect.left + rect.width / 2);
  musicSettings.style.setProperty('--music-pointer', Math.max(10, pointerOffset) + 'px');
}

for (const button of musicButtons) {
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    if (musicAnchor !== button) {
      musicAnchor = button;
      button.after(musicSettings);
    }
    positionMusicSettings();
    playMusic();
  });
}

musicSettings.addEventListener('toggle', () => {
  const open = musicSettings.matches(':popover-open');
  for (const button of musicButtons) {
    button.setAttribute('aria-expanded', String(open && button === musicAnchor));
  }
});
window.addEventListener('resize', positionMusicSettings);
document.addEventListener('scroll', () => {
  if (musicSettings.matches(':popover-open')) positionMusicSettings();
}, true);

musicToggle.addEventListener('click', () => {
  audioEnabled = isAudioSilent();
  if (audioEnabled && Number(musicVolume.value) === 0 && Number(effectsVolume.value) === 0) {
    musicVolume.value = defaultVolume;
    effectsVolume.value = defaultEffectsVolume;
  }
  applyMusicSettings();
  playEffect('click');
});
for (const control of [musicVolume, effectsVolume]) {
  control.addEventListener('input', () => {
    if (Number(control.value) > 0) audioEnabled = true;
    applyMusicSettings();
  });
}
effectsVolume.addEventListener('change', () => playEffect('success'));
document.addEventListener('click', event => {
  const control = event.target.closest('button, summary, a');
  if (control && !musicSettings.contains(control) && control.id !== 'lesson-check') playEffect('click');
});

const frames = [
  { title: 'La casa di sera', dialog: byId('workshop'), completedKey: 'atelier-java:la-casa-di-sera:completed' },
  { title: 'Opera in preparazione' },
  { title: 'Opera in preparazione' }
];
const workshop = frames[0].dialog;
const progressKey = 'atelier-java:la-casa-di-sera:progress';
const workshopOpenKey = 'atelier-java:workshop-open';
const exhibit = byId('enter');
const galleryPosition = byId('gallery-position');
const galleryCanvas = byId('gallery-canvas');
const galleryMystery = galleryCanvas.firstElementChild;
const completedFrames = new Set();
const workTitle = byId('work-title');
const galleryDots = byId('gallery-dots').children;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let frameIndex = 0;
let frameAnimation;

function showFrame(direction) {
  galleryDots[frameIndex].classList.remove('active');
  frameIndex = (frameIndex + direction + frames.length) % frames.length;
  galleryDots[frameIndex].classList.add('active');
  const frame = frames[frameIndex];
  exhibit.disabled = !frame.dialog;
  workTitle.textContent = frame.title;
  renderGalleryArtwork();
  frameAnimation?.cancel();
  if (!reducedMotion.matches) {
    frameAnimation = exhibit.animate(
      [{ opacity: .35, transform: `translateX(${direction * 16}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 180, easing: 'ease-out' }
    );
  }
}

byId('gallery-prev').addEventListener('click', () => showFrame(-1));
byId('gallery-next').addEventListener('click', () => showFrame(1));
exhibit.addEventListener('click', () => {
  const workshop = frames[frameIndex].dialog;
  if (!workshop) return;
  workshop.showModal();
  try { sessionStorage.setItem(workshopOpenKey, 'yes'); } catch {}
  if (workshop === frames[0].dialog && !tourSeen) startTour(fields[0]);
  playMusic();
});

const steps = [
  {
    shape: 'facade', title: 'Disegna la facciata',
    code: 'g.fillRect(20, 54, ?, 104);',
    parameters: [{ attribute: 'width', label: 'Larghezza', initial: 120, goal: 170, min: 1, max: 230 }],
    instruction: 'Imposta la larghezza della facciata usando il contorno tratteggiato.',
    hint: 'Il terzo argomento di fillRect() è la larghezza. Fai coincidere il bordo destro con il tratteggio.'
  },
  {
    shape: 'door', title: 'Posiziona la porta',
    code: 'g.fillRect(?, ?, 27, 40);',
    parameters: [
      { attribute: 'x', label: 'Coordinata x', initial: 108, goal: 140, min: 0, max: 223 },
      { attribute: 'y', label: 'Coordinata y', initial: 96, goal: 118, min: 0, max: 135 }
    ],
    instruction: 'Sposta la porta sulla sagoma alla base della casa.',
    hint: 'I primi due argomenti fissano l’angolo in alto a sinistra. Aumenta x per andare a destra e y per scendere.'
  },
  {
    shape: 'door', title: 'Dipingi la porta', color: true,
    code: 'g.setColor(?);\ng.fillRect(140, 118, 27, 40);',
    parameters: [{ attribute: 'fill', label: 'Colore', initial: 'Color.GRAY', goal: 'Color.BLUE' }],
    instruction: 'La porta è al suo posto ed è grigia. Sostituisci Color.GRAY con la costante del blu. Trovi il nome esatto in Manuale → Colori → setColor().',
    hint: 'Scrivi Color.BLUE al posto di Color.GRAY. BLUE è una costante di Java. La riga con fillRect() usa il colore appena impostato.'
  },
  {
    shape: 'window', title: 'Accendi la finestra',
    code: 'g.fillRect(?, ?, ?, 34);',
    parameters: [
      { attribute: 'x', label: 'Coordinata x', initial: 40, goal: 80, min: 0, max: 249 },
      { attribute: 'y', label: 'Coordinata y', initial: 84, goal: 72, min: 0, max: 141 },
      { attribute: 'width', label: 'Larghezza', initial: 35, goal: 52, min: 1, max: 250 }
    ],
    instruction: 'Sposta la finestra e regolane la larghezza per farla coincidere con la sagoma.',
    hint: 'Allinea prima il bordo sinistro e quello superiore con x e y. Poi usa il terzo argomento per allineare il bordo destro.'
  },
  {
    shape: 'roof', title: 'Disegna il tetto',
    code: 'g.fillPolygon(\n  new int[]{?, ?, ?},\n  new int[]{54, ?, 54}, 3);',
    parameters: [
      { label: 'x del vertice sinistro', initial: 32, goal: 20, min: 0, max: 250 },
      { label: 'x della punta', initial: 125, goal: 105, min: 0, max: 250 },
      { label: 'x del vertice destro', initial: 175, goal: 190, min: 0, max: 250 },
      { label: 'y della punta', initial: 35, goal: 14, min: 0, max: 53 }
    ],
    instruction: 'Allinea la base del tetto con la facciata e porta la punta sul vertice tratteggiato.',
    hint: 'La prima lista contiene le x dei tre vertici da sinistra a destra. Nella seconda lista, il valore centrale è la y della punta.'
  },
  {
    shape: 'moon', title: 'Metti la luna nel cielo',
    code: 'g.fillOval(?, ?, ?, ?);',
    parameters: [
      { attribute: 'x', label: 'Coordinata x', initial: 170, goal: 200, min: 0, max: 249 },
      { attribute: 'y', label: 'Coordinata y', initial: 34, goal: 16, min: 0, max: 174 },
      { attribute: 'width', label: 'Larghezza', initial: 42, goal: 32, min: 1, max: 250 },
      { attribute: 'height', label: 'Altezza', initial: 22, goal: 32, min: 1, max: 175 }
    ],
    instruction: 'Sposta la luna e modificala fino a ottenere un cerchio delle dimensioni indicate dalla sagoma.',
    hint: 'fillOval() usa gli stessi quattro argomenti di fillRect(). x e y si riferiscono al rettangolo che contiene l’ovale. Per un cerchio, larghezza e altezza devono coincidere.'
  }
];
const form = byId('rectangle-form');
const codeEditor = byId('lesson-code');
const target = byId('shape-target');
const doorColors = new Map([['Color.GRAY', '#808080'], ['Color.BLUE', '#0000ff'], ['Color.RED', '#ff0000']]);
let fields = [];
const previewLegend = document.querySelector('.preview-legend');
const feedback = byId('feedback');
const checkLabel = byId('lesson-check').firstElementChild;
const reset = form.querySelector('.lesson-reset');
const vincentTip = byId('vincent-tip');
const vincentPortrait = vincentTip.querySelector('img');
const guidePortrait = vincentPortrait.getAttribute('src');
const vincentDirection = byId('vincent-direction');
const vincentIntro = vincentDirection.textContent;
const lessonHelp = byId('lesson-help');
const vincentContinue = byId('vincent-continue');
const vincentTitle = byId('vincent-title');
const vincentHighlight = byId('vincent-highlight');
const tourOpen = byId('tour-open');
const narrowTour = window.matchMedia('(max-width: 740px)');
const tourKey = 'atelier-java:tutorial-seen';
const tourSteps = [
  [null, 'Vincent', vincentIntro],
  ['#lesson-instruction', 'La consegna', 'Qui leggi quale parte del quadro devi sistemare e cosa deve cambiare.'],
  ['#lesson-code', 'Editor Java', 'Modifica gli argomenti evidenziati nel codice e osserva subito l’effetto sulla tela. Nei passaggi successivi potrai correggere più valori.'],
  ['.lesson-preview figcaption', 'La tela', 'Il tratteggio indica la forma da ottenere nei passaggi di disegno. Premi Tela per confrontare il tuo lavoro con il quadro finito.'],
  ['.lesson-actions', 'Verifica', 'Premi Verifica per controllare i valori. Quando la prova è riuscita, premi Continua. La freccia circolare ripristina i valori iniziali.'],
  ['#manual-open', 'Il manuale Java', 'Da qui puoi consultare il significato di g, l’ordine degli argomenti di disegno e come usare i colori.'],
  ['#lesson-help', 'I suggerimenti di Vincent', 'Premi ? ogni volta che vuoi un suggerimento per il passaggio che stai svolgendo.']
];
let tourSeen = false;
try { tourSeen = localStorage.getItem(tourKey) === 'yes'; } catch {}
let tourIndex = 0;
let stepIndex = 0;
let stepVerified = false;
let replaying = false;
let tipReturnFocus;

function updateTourHighlight() {
  if (!vincentTip.open || !vincentTip.hasAttribute('data-tour')) return;
  const [selector] = tourSteps[tourIndex];
  vincentHighlight.hidden = !selector;
  vincentTip.removeAttribute('data-face-left');
  if (!selector) return;

  const element = document.querySelector(selector);
  const target = element.getBoundingClientRect();
  vincentTip.toggleAttribute('data-face-left', target.left + target.width / 2 < window.innerWidth / 2);

  Object.assign(vincentHighlight.style, {
    left: target.left - 4 + 'px',
    top: target.top - 4 + 'px',
    width: target.width + 8 + 'px',
    height: target.height + 8 + 'px'
  });
}

function renderTourStep() {
  const [selector, title, description] = tourSteps[tourIndex];
  vincentTitle.textContent = title;
  vincentDirection.textContent = description;
  vincentContinue.textContent = tourIndex === tourSteps.length - 1 ? 'Inizia' : 'Avanti';
  if (selector) {
    document.querySelector(selector).scrollIntoView({ block: narrowTour.matches ? 'center' : 'nearest', behavior: 'instant' });
  }
  updateTourHighlight();
}

function startTour(returnFocus) {
  tipReturnFocus = returnFocus;
  tourIndex = 0;
  tourSeen = true;
  try { localStorage.setItem(tourKey, 'yes'); } catch {}
  vincentTip.setAttribute('data-tour', '');
  vincentTip.showModal();
  renderTourStep();
}

tourOpen.addEventListener('click', () => startTour(tourOpen));
vincentContinue.addEventListener('click', event => {
  if (!vincentTip.hasAttribute('data-tour') || tourIndex === tourSteps.length - 1) return;
  event.preventDefault();
  tourIndex += 1;
  renderTourStep();
});
window.addEventListener('resize', updateTourHighlight);
byId('workshop').addEventListener('scroll', updateTourHighlight);

lessonHelp.addEventListener('click', () => {
  tipReturnFocus = lessonHelp;
  vincentTitle.textContent = 'Vincent';
  vincentDirection.textContent = steps[stepIndex].hint;
  vincentContinue.textContent = 'Torna alla prova';
  vincentTip.showModal();
});
function showCompletion() {
  tipReturnFocus = checkLabel.parentElement;
  vincentPortrait.src = 'assets/vincent.webp';
  vincentTitle.textContent = 'Complimenti!';
  vincentDirection.textContent = 'Hai ricostruito «La casa di sera». La tua opera è di nuovo appesa nel museo!';
  vincentContinue.textContent = 'Guarda il quadro';
  vincentTip.showModal();
}

vincentTip.addEventListener('close', () => {
  vincentPortrait.src = guidePortrait;
  vincentTip.removeAttribute('data-tour');
  vincentHighlight.hidden = true;
  vincentTip.removeAttribute('data-face-left');
  tipReturnFocus?.focus();
});
const manual = byId('workshop-manual');
const manualSearch = byId('manual-search');
const manualFilters = [...manual.querySelectorAll('.manual-filters button')];
const manualCards = [...manual.querySelectorAll('.manual-card')];
const manualEmpty = byId('manual-empty');
let manualCategory = 'tutti';

function filterManual() {
  const terms = manualSearch.value.toLocaleLowerCase('it').trim().split(/\s+/);
  let matchFound = false;
  for (const card of manualCards) {
    const text = card.textContent.toLocaleLowerCase('it');
    const matches = (manualCategory === 'tutti' || card.dataset.category === manualCategory)
      && terms.every(term => text.includes(term));
    card.hidden = !matches;
    if (!matches) card.open = false;
    matchFound ||= matches;
  }
  manualEmpty.textContent = matchFound ? '' : 'Nessuna scheda corrisponde alla ricerca.';
}

function selectManualCategory(category) {
  manualCategory = category;
  for (const button of manualFilters) {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
  }
  filterManual();
}

for (const button of manualFilters) {
  button.addEventListener('click', () => selectManualCategory(button.dataset.category));
}
manualSearch.addEventListener('input', filterManual);
byId('manual-open').addEventListener('click', () => {
  manualSearch.value = '';
  for (const card of manualCards) card.open = false;
  selectManualCategory('tutti');
  manual.showModal();
});

function drawShape(shape, step, values) {
  if (step.shape === 'roof') {
    const [left, peak, right, height] = values;
    shape.setAttribute('points', left + ',54 ' + peak + ',' + height + ' ' + right + ',54');
    return;
  }
  step.parameters.forEach((parameter, index) => {
    shape.setAttribute(parameter.attribute, step.color ? doorColors.get(values[index]) ?? doorColors.get(parameter.initial) : values[index]);
  });
  if (step.shape === 'moon') {
    shape.setAttribute('rx', Number(shape.getAttribute('width')) / 2);
    shape.setAttribute('ry', Number(shape.getAttribute('height')) / 2);
  }
}

function finishedArtwork() {
  const artwork = byId('workshop-canvas').cloneNode(true);
  artwork.removeAttribute('id');
  artwork.setAttribute('aria-label', 'La casa di sera, quadro finito');
  artwork.querySelector('#shape-target').remove();

  for (const step of steps) {
    const shape = artwork.querySelector('#' + step.shape);
    drawShape(shape, step, step.parameters.map(parameter => parameter.goal));
    shape.removeAttribute('visibility');
  }
  for (const shape of artwork.querySelectorAll('[id]')) shape.removeAttribute('id');

  return artwork;
}

byId('preview-open').addEventListener('click', () => {
  byId('finished-preview-art').replaceChildren(finishedArtwork());
  byId('finished-preview').showModal();
});

function isFrameCompleted(frame) {
  const key = frame.completedKey;
  if (!key) return false;
  if (completedFrames.has(key)) return true;
  try { return localStorage.getItem(key) === 'yes'; } catch { return false; }
}

function renderGalleryArtwork() {
  const completed = isFrameCompleted(frames[frameIndex]);
  galleryCanvas.replaceChildren(completed ? finishedArtwork() : galleryMystery);
  galleryPosition.textContent = 'Cornice ' + (frameIndex + 1) + ' di ' + frames.length +
    (completed ? ' · Quadro completato' : '');
}

function fieldValues(step) {
  return fields.map((field, index) => {
    if (step.color) return field.value.trim();
    return field.validity.valid ? field.valueAsNumber : step.parameters[index].initial;
  });
}

function saveProgress() {
  const progress = { stepIndex, verified: stepVerified, replaying, values: fields.map(field => field.value) };
  try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch {}
}

function restoreProgress() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(progressKey)); } catch {}
  if (saved?.replaying !== true && isFrameCompleted(frames[0])) {
    const lastStepIndex = steps.length - 1;
    saved = {
      stepIndex: lastStepIndex,
      verified: true,
      values: steps[lastStepIndex].parameters.map(parameter => String(parameter.goal))
    };
  }
  const step = steps[saved?.stepIndex];
  if (!step || !Number.isInteger(saved.stepIndex) || !Array.isArray(saved.values)
      || saved.values.length !== step.parameters.length || !saved.values.every(value => typeof value === 'string')) {
    renderStep();
    return;
  }

  stepIndex = saved.stepIndex;
  replaying = saved.replaying === true;
  renderStep();
  fields.forEach((field, index) => { field.value = saved.values[index]; });
  updateDrawing();
  if (saved.verified === true && fieldValues(step).every((value, index) =>
    fields[index].validity.valid && value === step.parameters[index].goal)) {
    markStepVerified();
  }
}

function renderStep() {
  const step = steps[stepIndex];
  steps.forEach((entry, index) => {
    const shape = byId(entry.shape);
    const values = entry.parameters.map(parameter => index < stepIndex ? parameter.goal : parameter.initial);
    drawShape(shape, entry, values);
    if (!entry.color) shape.setAttribute('visibility', index <= stepIndex ? 'visible' : 'hidden');
  });
  const outline = byId(step.shape).cloneNode();
  outline.removeAttribute('id');
  outline.removeAttribute('fill');
  outline.removeAttribute('visibility');
  if (!step.color) drawShape(outline, step, step.parameters.map(parameter => parameter.goal));
  target.replaceChildren(outline);
  target.setAttribute('visibility', step.color ? 'hidden' : 'visible');
  previewLegend.hidden = step.color;

  byId('lesson-progress').textContent = 'Passaggio ' + (stepIndex + 1) + ' di ' + steps.length;
  byId('lesson-title').textContent = step.title;
  byId('lesson-instruction').textContent = step.instruction;

  fields = step.parameters.map(parameter => {
    const input = document.createElement('input');
    input.required = true;
    input.value = parameter.initial;
    if (step.color) {
      input.type = 'text';
      input.className = 'color-code';
      input.spellcheck = false;
      input.autocapitalize = 'off';
      input.autocomplete = 'off';
    } else {
      input.type = 'number';
      input.step = '1';
      input.min = parameter.min;
      input.max = parameter.max;
    }
    input.setAttribute('aria-label', parameter.label);
    return input;
  });
  const codeParts = step.code.split('?');
  codeEditor.replaceChildren(codeParts[0]);
  fields.forEach((field, index) => codeEditor.append(field, codeParts[index + 1]));
  feedback.textContent = '';
  checkLabel.textContent = 'Verifica';
  setResetMode(false);
  stepVerified = false;
}

function updateDrawing(event) {
  const step = steps[stepIndex];
  drawShape(byId(step.shape), step, fieldValues(step));
  feedback.textContent = '';
  if (event) saveProgress();
}

codeEditor.addEventListener('click', event => {
  if (event.target !== codeEditor || !window.getSelection().isCollapsed) return;
  fields[0]?.focus({ preventScroll: true });
});
codeEditor.addEventListener('input', updateDrawing);
codeEditor.addEventListener('change', updateDrawing);

form.addEventListener('submit', event => {
  event.preventDefault();
  if (stepVerified) {
    playEffect('click');
    if (stepIndex === steps.length - 1) {
      workshop.close();
    } else {
      advanceStep();
    }
    return;
  }

  const step = steps[stepIndex];
  const values = fieldValues(step);
  const incorrect = step.parameters.findIndex((parameter, index) => values[index] !== parameter.goal);
  if (incorrect !== -1) {
    playEffect('retry');
    const parameter = step.parameters[incorrect];
    const direction = values[incorrect] < parameter.goal ? 'aumenta' : 'riduci';
    feedback.textContent = step.color ? 'Scrivi la costante del blu nel formato Color.NOME, rispettando le maiuscole.' :
      parameter.label + ' · ' + direction + ' il valore.';
    return;
  }

  markStepVerified();
  if (stepIndex < steps.length - 1) {
    saveProgress();
    playEffect('success');
    return;
  }

  replaying = false;
  const key = frames[0].completedKey;
  completedFrames.add(key);
  try { localStorage.setItem(key, 'yes'); } catch {}
  saveProgress();
  renderGalleryArtwork();
  playEffect('complete');
  showCompletion();
});

function advanceStep() {
  stepIndex += 1;
  renderStep();
  saveProgress();
  fields[0].focus();
}

function markStepVerified() {
  stepVerified = true;
  for (const field of fields) field.readOnly = true;
  target.setAttribute('visibility', 'hidden');
  const finished = stepIndex === steps.length - 1;
  feedback.textContent = finished ? 'Quadro completato! La casa di sera è pronta.' : 'Passaggio completato.';
  checkLabel.textContent = finished ? 'Torna al museo' : 'Continua';
  if (finished) setResetMode(true);
}

function setResetMode(finished) {
  const label = finished ? 'Rigioca' : 'Ripristina i valori del passaggio';
  reset.setAttribute('aria-label', label);
  reset.title = finished ? 'Ricomincia dal primo passaggio' : label;
  reset.toggleAttribute('data-restart', finished);
  reset.firstElementChild.textContent = finished ? label : '↺';
}

form.addEventListener('reset', event => {
  event.preventDefault();
  if (stepVerified && stepIndex === steps.length - 1) {
    replaying = true;
    stepIndex = 0;
  }
  renderStep();
  saveProgress();
  fields[0].focus();
});

workshop.addEventListener('close', () => {
  try { sessionStorage.removeItem(workshopOpenKey); } catch {}
});
restoreProgress();
renderGalleryArtwork();

let reopenWorkshop = false;
try { reopenWorkshop = sessionStorage.getItem(workshopOpenKey) === 'yes'; } catch {}
if (reopenWorkshop) workshop.showModal();
