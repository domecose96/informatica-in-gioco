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
  { id: 'casa', title: 'La casa di sera', completedKey: 'atelier-java:la-casa-di-sera:completed' },
  {
    id: 'ponte', title: bridgeTitle, storagePrefix: 'atelier-java:il-ponte-sul-fiume',
    drawing: bridgeDrawing, steps: bridgeSteps, draw: drawBridge, finished: finishedBridge,
    intro: 'Per il ponte scrivi tu il codice. Passa il puntatore sulla sagoma o tocca la tela per leggere le coordinate. Quando il disegno coincide, premi Verifica. Se ti blocchi, premi ?.'
  },
  {
    id: 'citta', title: cityTitle, storagePrefix: 'atelier-java:la-citta-di-notte',
    drawing: cityDrawing, steps: citySteps, draw: drawCity, finished: finishedCity,
    intro: 'Disegna i palazzi e le finestre seguendo le sagome. Poi programma le luci casuali e collegale alla luna. Se ti blocchi, premi ? o consulta il Manuale.'
  },
  {
    id: 'biglietteria', title: ticketTitle, storagePrefix: 'atelier-java:biglietteria',
    steps: ticketSteps, checkCode: ticketCodeMatches, preview: renderTicketPreview, finished: finishedTicketOffice,
    previewClass: 'ticket-desk', demoFocus: 'select',
    demoInstruction: 'Scegli Intero, scrivi 3 e premi Calcola per stampare i biglietti.',
    intro: 'Il museo sta per aprire. Ricostruisci sul monitor la biglietteria, un pezzo alla volta. Mi servono tre biglietti interi per provare la stampante.'
  },
  {
    id: 'mostra', title: exhibitionTitle, storagePrefix: 'atelier-java:mostra-interattiva',
    steps: exhibitionSteps, checkCode: exhibitionCodeMatches, preview: renderExhibitionPreview, finished: finishedExhibition,
    previewClass: 'exhibition-scene', demoFocus: 'button:last-child',
    demoInstruction: 'Premi Successivo per vedere il Ponte, poi Precedente per tornare alla Casa.',
    intro: 'Riapriamo la mostra del museo. Metti l’opera al centro, sistema i pulsanti in basso e provali per visitare la sala.'
  }
];
for (const frame of frames.slice(1)) frame.completedKey = frame.storagePrefix + ':completed';
const workshop = byId('workshop');
const workshopTitle = byId('workshop-title');
let activeFrame = frames[0];
const progressKey = 'atelier-java:la-casa-di-sera:progress';
const workshopOpenKey = 'atelier-java:workshop-open';
const exhibit = byId('enter');
const exhibitPiece = exhibit.parentElement;
const galleryPosition = byId('gallery-position');
const galleryExhibitionActions = byId('gallery-exhibition-actions');
const galleryExhibitionTitle = byId('gallery-exhibition-title');
const galleryCanvas = byId('gallery-canvas');
const galleryMystery = byId('gallery-mystery');
const galleryLock = byId('gallery-lock');
const finishedPreviewArt = byId('finished-preview-art');
const galleryMoon = createCityMoon();
const workshopMoon = createCityMoon();
exhibit.after(galleryMoon);
byId('drawing-viewport').append(workshopMoon);
new ResizeObserver(positionGalleryMoon).observe(galleryCanvas);
const galleryExhibitionObserver = new ResizeObserver(positionGalleryExhibitionActions);
galleryExhibitionObserver.observe(galleryCanvas);
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
  workTitle.textContent = frame.title;
  frameAnimation?.cancel();
  renderGalleryArtwork();
  if (!reducedMotion.matches) {
    frameAnimation = exhibitPiece.animate(
      [{ opacity: .35, transform: `translateX(${direction * 16}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 180, easing: 'ease-out' }
    );
  }
}

byId('gallery-prev').addEventListener('click', () => showFrame(-1));
byId('gallery-next').addEventListener('click', () => showFrame(1));
exhibit.addEventListener('click', () => openWorkshop(frames[frameIndex]));

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
    instruction: 'La porta è grigia. Sostituisci Color.GRAY con la costante del blu. La trovi in Manuale → Colori → Colori predefiniti.',
    hint: 'Le costanti dei colori si scrivono come Color.NOME. Usa la costante del blu come argomento di setColor().'
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
const houseCanvas = byId('workshop-canvas');
const drawingEditor = byId('bridge-code');
const haloGuide = byId('halo-guide');
const haloFields = [...haloGuide.querySelectorAll('input')];
const drawingCanvas = byId('bridge-canvas');
const drawingViewport = byId('drawing-viewport');
const drawingCoordinates = byId('drawing-coordinates');
const drawingCursor = byId('drawing-cursor');
const target = byId('shape-target');
const doorColors = new Map([
  ['Color.GRAY', 'rgb(128,128,128)'], ['Color.BLUE', 'rgb(0,0,255)'], ['Color.RED', 'rgb(255,0,0)']
]);

function readDoorColor(code) {
  if (!/^new\s+Color\s*\([^;{}]*\)$/.test(code)) return doorColors.get(code);
  try {
    const [command] = readDrawingCode('g.setColor(' + code + ');');
    return command[1][0];
  } catch {
    return undefined;
  }
}
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
  ['.lesson-preview figcaption', 'La tela', 'Il tratteggio indica la forma da ottenere nei passaggi di disegno. Punta o tocca la tela per leggere le coordinate. Premi Tela per vedere il quadro finito.'],
  ['.lesson-actions', 'Verifica', 'Premi Verifica per controllare i valori. Quando la prova è riuscita, premi Continua. La freccia circolare ripristina i valori iniziali.'],
  ['#manual-open', 'Il manuale Java', 'Da qui puoi consultare il significato di g, l’ordine degli argomenti di disegno e come usare i colori.'],
  ['#lesson-help', 'I suggerimenti di Vincent', 'Premi ? ogni volta che vuoi un suggerimento per il passaggio che stai svolgendo.']
];
let tourSeen = false;
try { tourSeen = localStorage.getItem(tourKey) === 'yes'; } catch {}
let tourIndex = 0;
let stepIndex = 0;
let houseProgress;
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

function showVincent(title, message, action, returnFocus) {
  tipReturnFocus = returnFocus;
  vincentTitle.textContent = title;
  vincentDirection.textContent = message;
  vincentContinue.textContent = action;
  vincentTip.showModal();
}

lessonHelp.addEventListener('click', () => {
  const step = activeFrame.steps ? activeFrame.steps[drawingProgress.index] : steps[stepIndex];
  if (step.hint) showVincent('Vincent', step.hint, 'Torna alla prova', lessonHelp);
});

function showCompletion() {
  vincentPortrait.src = 'assets/vincent-ok.webp';
  const extraMessage = {
    citta: ' Anche nel museo puoi cliccare sulla luna per cambiare le luci.',
    biglietteria: ' Hai stampato tre biglietti interi per un totale di 18 €.',
    mostra: ' I visitatori possono scorrere le opere della mostra.'
  }[activeFrame.id] ?? '';
  showVincent('Complimenti!', 'Hai ricostruito «' + activeFrame.title + '». La tua opera è di nuovo appesa nel museo!' + extraMessage,
    'Guarda il quadro', checkLabel.parentElement);
}

vincentTip.addEventListener('close', () => {
  vincentPortrait.src = guidePortrait;
  vincentTip.removeAttribute('data-tour');
  vincentHighlight.hidden = true;
  vincentTip.removeAttribute('data-face-left');
  tipReturnFocus?.focus();
});
const manual = byId('workshop-manual');
const interfacePreview = byId('ticket-preview');
const manualSearch = byId('manual-search');
const codeHelpOpen = byId('code-help-open');
const codeHelp = byId('code-help');
const codeHelpContent = byId('code-help-content');
const manualFilters = [...manual.querySelectorAll('.manual-filters button')];
const manualCards = [...manual.querySelectorAll('.manual-card')];
const manualEmpty = byId('manual-empty');
let manualCategory = 'tutti';
let manualFrameIndex = 0;

function availableInManual(card) {
  const firstFrame = card.dataset.fromFrame;
  return !firstFrame || frames.slice(0, manualFrameIndex + 1).some(frame => frame.id === firstFrame);
}

function filterManual() {
  const terms = manualSearch.value.toLocaleLowerCase('it').trim().split(/\s+/);
  let matchFound = false;
  for (const card of manualCards) {
    const text = card.textContent.toLocaleLowerCase('it');
    const matches = availableInManual(card)
      && (manualCategory === 'tutti' || card.dataset.category === manualCategory)
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
function openManual(index) {
  manualFrameIndex = index;
  manualSearch.value = '';
  for (const card of manualCards) card.open = false;
  const categories = new Set(manualCards.filter(availableInManual).map(card => card.dataset.category));
  for (const button of manualFilters) {
    const category = button.dataset.category;
    button.hidden = category !== 'tutti' && !categories.has(category);
  }
  selectManualCategory('tutti');
  manual.showModal();
}

byId('gallery-manual-open').addEventListener('click', () => {
  const furthestCompleted = frames.findLastIndex(isFrameCompleted);
  openManual(Math.max(frameIndex, furthestCompleted));
});
byId('manual-open').addEventListener('click', () => openManual(frames.indexOf(activeFrame)));

codeHelpOpen.addEventListener('click', () => {
  const step = activeFrame.steps ? activeFrame.steps[drawingProgress.index] : steps[stepIndex];
  codeHelpContent.firstElementChild.textContent = step.readyCode;
  codeHelpContent.scrollTop = 0;
  codeHelpContent.scrollLeft = 0;
  codeHelp.showModal();
});

function drawShape(shape, step, values) {
  if (step.shape === 'roof') {
    const [left, peak, right, height] = values;
    shape.setAttribute('points', left + ',54 ' + peak + ',' + height + ' ' + right + ',54');
    return;
  }
  step.parameters.forEach((parameter, index) => {
    shape.setAttribute(parameter.attribute, step.color ? readDoorColor(values[index]) ?? readDoorColor(parameter.initial) : values[index]);
  });
  if (step.shape === 'moon') {
    shape.setAttribute('rx', Number(shape.getAttribute('width')) / 2);
    shape.setAttribute('ry', Number(shape.getAttribute('height')) / 2);
  }
}

function finishedArtwork(frame, inGallery = false, galleryNavigation) {
  if (frame.finished) return frame.finished(inGallery, galleryNavigation);
  const artwork = houseCanvas.cloneNode(true);
  artwork.removeAttribute('hidden');
  artwork.removeAttribute('tabindex');
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
  const artwork = finishedArtwork(activeFrame);
  byId('finished-preview-title').textContent = activeFrame.preview ? activeFrame.title : 'Anteprima del quadro finito';
  if (activeFrame.id === 'citta' && isFrameCompleted(activeFrame)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'city-preview';
    const moon = createCityMoon();
    moon.hidden = false;
    wrapper.append(artwork, moon);
    finishedPreviewArt.replaceChildren(wrapper);
  } else {
    finishedPreviewArt.replaceChildren(artwork);
  }
  byId('finished-preview').showModal();
});

function isFrameCompleted(frame) {
  const key = frame.completedKey;
  if (!key) return false;
  if (completedFrames.has(key)) return true;
  try { return localStorage.getItem(key) === 'yes'; } catch { return false; }
}

function firstIncompleteFrame() {
  return frames.findIndex(frame => !isFrameCompleted(frame));
}

function isFrameUnlocked(index) {
  const firstIncomplete = firstIncompleteFrame();
  return index >= 0 && (firstIncomplete === -1 || index <= firstIncomplete);
}

window.addEventListener('storage', event => {
  if (event.key === null || frames.some(frame => frame.completedKey === event.key)) renderGalleryArtwork();
});

function renderGalleryArtwork() {
  const frame = frames[frameIndex];
  const unlocked = isFrameUnlocked(frameIndex);
  const completed = unlocked && isFrameCompleted(frame);
  const lockMessage = unlocked ? '' : 'Completa il quadro ' + (firstIncompleteFrame() + 1) + ' per proseguire.';
  exhibit.disabled = !unlocked;
  galleryLock.textContent = lockMessage;
  const exhibitionFinished = completed && frame.id === 'mostra';
  galleryExhibitionActions.hidden = !exhibitionFinished;
  galleryExhibitionActions.replaceChildren();
  galleryExhibitionTitle.textContent = '';
  const navigation = exhibitionFinished ? {
    controls: galleryExhibitionActions,
    announce: title => { galleryExhibitionTitle.textContent = title; }
  } : undefined;
  const artwork = completed ? finishedArtwork(frame, true, navigation) : galleryMystery;
  galleryCanvas.replaceChildren(unlocked ? artwork : galleryLock);
  exhibit.toggleAttribute('data-exhibition-finished', exhibitionFinished);
  positionGalleryExhibitionActions();
  const cityFinished = completed && frame.id === 'citta';
  galleryMoon.hidden = !cityFinished;
  exhibit.toggleAttribute('data-city-finished', cityFinished);
  positionGalleryMoon();
  galleryPosition.textContent = 'Cornice ' + (frameIndex + 1) + ' di ' + frames.length +
    (unlocked ? (completed ? ' · Quadro completato' : '') : ' · ' + lockMessage);
}

function positionGalleryExhibitionActions() {
  if (galleryExhibitionActions.hidden) return;
  const row = galleryCanvas.querySelector('.exhibition-controls').getBoundingClientRect();
  const piece = exhibitPiece.getBoundingClientRect();
  galleryExhibitionActions.style.left = row.left - piece.left + 'px';
  galleryExhibitionActions.style.top = row.top - piece.top + 'px';
  galleryExhibitionActions.style.width = row.width + 'px';
  galleryExhibitionActions.style.height = row.height + 'px';
}

function positionGalleryMoon() {
  if (galleryMoon.hidden) return;
  const canvas = galleryCanvas.firstElementChild;
  const bounds = canvas.getBoundingClientRect();
  const gallery = galleryMoon.parentElement;
  const galleryBounds = gallery.getBoundingClientRect();
  const scale = Math.min(bounds.width / paintingSize[0], bounds.height / paintingSize[1]);
  const left = bounds.left - galleryBounds.left - gallery.clientLeft
    + (bounds.width - paintingSize[0] * scale) / 2;
  const top = bounds.top - galleryBounds.top - gallery.clientTop
    + (bounds.height - paintingSize[1] * scale) / 2;
  galleryMoon.style.left = left + cityMoon.x * scale + 'px';
  galleryMoon.style.top = top + cityMoon.y * scale + 'px';
  galleryMoon.style.width = cityMoon.radius * 2 * scale + 'px';
}

function fieldValues(step) {
  return fields.map((field, index) => {
    if (step.color) return field.value.trim();
    return field.validity.valid ? field.valueAsNumber : step.parameters[index].initial;
  });
}

function saveProgress() {
  houseProgress = { stepIndex, verified: stepVerified, replaying, values: fields.map(field => field.value) };
  try { localStorage.setItem(progressKey, JSON.stringify(houseProgress)); } catch {}
}

function restoreProgress() {
  let saved = houseProgress;
  if (!saved) {
    try { saved = JSON.parse(localStorage.getItem(progressKey)); } catch {}
  }
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
  if (step.color && saved.verified === true) {
    const color = fields[0].value.trim();
    const { goal } = step.parameters[0];
    if (color === 'blu' || readDoorColor(color) === readDoorColor(goal)) fields[0].value = goal;
  }
  updateDrawing();
  if (saved.verified === true && houseStepMatches(step, fieldValues(step))) {
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
  const currentShape = byId(step.shape);
  currentShape.before(target);
  const outline = currentShape.cloneNode();
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
  codeHelpOpen.hidden = !step.readyCode;
  lessonHelp.hidden = !step.hint;

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

function houseParameterMatches(step, index, value) {
  const { goal } = step.parameters[index];
  return fields[index].validity.valid && value === goal;
}

function houseStepMatches(step, values) {
  return values.every((value, index) => houseParameterMatches(step, index, value));
}

function updateDrawing(event) {
  const step = steps[stepIndex];
  const values = fieldValues(step);
  drawShape(byId(step.shape), step, values);
  const showGuide = !step.color && !houseStepMatches(step, values);
  target.setAttribute('visibility', showGuide ? 'visible' : 'hidden');
  previewLegend.hidden = !showGuide;
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
  if (activeFrame.steps) {
    checkDrawing();
    return;
  }
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
  const incorrect = values.findIndex((value, index) => !houseParameterMatches(step, index, value));
  if (incorrect !== -1) {
    playEffect('retry');
    const parameter = step.parameters[incorrect];
    const direction = values[incorrect] < parameter.goal ? 'aumenta' : 'riduci';
    feedback.textContent = step.color ? 'Controlla come si scrive la costante del blu in Manuale → Colori → Colori predefiniti.' :
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
  saveProgress();
  completeFrame();
});

function completeFrame() {
  const frame = activeFrame;
  const key = frame.completedKey;
  completedFrames.add(key);
  try { localStorage.setItem(key, 'yes'); } catch {}
  renderGalleryArtwork();
  playEffect('complete');
  if (frame.id === 'citta' || frame.preview) {
    // Lascia visibile il risultato della prova prima di aprire il dialogo.
    window.setTimeout(() => {
      if (activeFrame === frame && workshop.open && drawingProgress.verified && !vincentTip.open) showCompletion();
    }, 500);
  } else {
    showCompletion();
  }
}

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
  previewLegend.hidden = true;
  const finished = stepIndex === steps.length - 1;
  feedback.textContent = finished ? 'Quadro completato! La casa di sera è pronta.' : 'Passaggio completato.';
  checkLabel.textContent = finished ? 'Torna al museo' : 'Continua';
  if (finished) setResetMode(true);
}

function setResetMode(finished) {
  const label = finished ? 'Rigioca' : 'Ripristina i valori del passaggio';
  let resetLabel = label;
  if (!finished && activeFrame.steps) {
    resetLabel = activeFrame.steps[drawingProgress.index].starter
      ? 'Ripristina il codice iniziale del passaggio'
      : 'Svuota l’editor del passaggio';
  }
  reset.setAttribute('aria-label', resetLabel);
  reset.title = finished ? 'Ricomincia dal primo passaggio' : resetLabel;
  reset.toggleAttribute('data-restart', finished);
  reset.firstElementChild.textContent = finished ? label : '↺';
}

form.addEventListener('reset', event => {
  event.preventDefault();
  if (activeFrame.steps) {
    resetDrawing();
    return;
  }
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
const drawingProgressByFrame = new Map();
const seenDrawingIntros = new Set();
let drawingProgress;

function loadDrawingProgress(frame) {
  if (drawingProgressByFrame.has(frame.id)) return drawingProgressByFrame.get(frame.id);
  let saved;
  try { saved = JSON.parse(localStorage.getItem(frame.storagePrefix + ':progress')); } catch {}
  const final = frame.steps.length - 1;
  const completed = isFrameCompleted(frame) && saved?.replaying !== true;
  const hasDraft = Number.isInteger(saved?.index) && typeof saved.code === 'string' && saved.code.length <= 4000;
  if (hasDraft && frame.id === 'biglietteria') {
    saved = restoreTicketProgress(saved);
    if (saved.checkedTicketCode !== undefined) {
      saved.checkedPreviewCode ??= saved.checkedTicketCode;
      delete saved.checkedTicketCode;
    }
  }
  if (frame.id === 'citta' && saved?.cityVersion !== 6) {
    if (completed) {
      const code = citySteps[cityListenerStep].goal;
      return { ...saved, index: final, verified: true, code, moonCode: code, replaying: false };
    }
    if (hasDraft && saved.index >= cityMoonDrawingStep) {
      const version = saved.cityVersion;
      const oldButtonStep = version === 4 ? 3 : 2;
      if (version === 4 && saved.index === 2) {
        saved = { ...saved, index: cityMoonDrawingStep, verified: false, code: '' };
      } else if (version >= 3 && saved.index === oldButtonStep) {
        const buttonDraft = saved.code.replace(/\bg\s*\.\s*fillOval\s*\([^;]*;/, '').trim();
        saved = { ...saved, index: cityMoonDrawingStep, verified: false, code: '', buttonDraft };
      } else if (version >= 3) {
        saved.index = cityLightsStep + saved.index - (oldButtonStep + 1);
        if (saved.index === cityListenerStep && (version === 4 || (version === 3 && !saved.listenerEditor))) {
          saved.code = restoreCityListener(saved.code);
        }
      } else {
        const lightsDraft = saved.index === 2 ? saved.code : saved.randomCode;
        const listenerDraft = saved.index === 3 ? saved.code : undefined;
        return { ...saved, index: cityMoonDrawingStep, verified: false, code: '', lightsDraft, listenerDraft };
      }
    }
  }
  const valid = hasDraft && Boolean(frame.steps[saved.index]);
  if (valid && saved.code.trim() === frame.steps[saved.index].legacyStarter) saved.code = '';
  let verified = false;
  if (valid && saved.verified === true) {
    try { verified = drawingCodeMatches(frame, saved.index, saved.code); } catch {}
    if (verified && frame.steps[saved.index].exercise === 'moonDrawing') {
      saved.haloValues ??= [...cityHaloValues];
      verified = cityHaloMatches(saved.haloValues);
    }
  }
  if (completed && (!verified || saved.index !== final)) {
    return { ...saved, index: final, verified: true, code: frame.steps[final].goal, replaying: false };
  }
  if (!valid) return { index: 0, verified: false, code: frame.steps[0].starter ?? '', replaying: false };
  return { ...saved, verified, replaying: saved.replaying === true };
}

function saveDrawingProgress() {
  if (activeFrame.id === 'citta') drawingProgress.cityVersion = 6;
  if (activeFrame.id === 'biglietteria') drawingProgress.ticketVersion = ticketProgressVersion;
  drawingProgressByFrame.set(activeFrame.id, drawingProgress);
  try { localStorage.setItem(activeFrame.storagePrefix + ':progress', JSON.stringify(drawingProgress)); } catch {}
}

function showDrawingIntro(frame) {
  const key = frame.storagePrefix + ':intro-seen';
  let seen = seenDrawingIntros.has(frame.id);
  try { seen ||= localStorage.getItem(key) === 'yes'; } catch {}
  if (seen) return;
  seenDrawingIntros.add(frame.id);
  try { localStorage.setItem(key, 'yes'); } catch {}
  showVincent('Vincent', frame.intro, 'Inizia', drawingEditor);
}

let drawingPoint;
function setDrawingPoint(x, y) {
  const [width, height] = paintingSize;
  const clamp = (value, limit) => Math.max(0, Math.min(limit, Math.round(value)));
  drawingPoint = [clamp(x, width), clamp(y, height)];
  const [column, row] = drawingPoint;
  drawingCoordinates.textContent = 'x ' + column + ' · y ' + row;
  drawingCursor.style.left = column / width * 100 + '%';
  drawingCursor.style.top = row / height * 100 + '%';
  drawingCursor.hidden = false;
}

function readDrawingPoint(event) {
  if (drawingCoordinates.hidden) return;
  const surface = activeFrame.steps ? drawingCanvas : houseCanvas;
  const bounds = surface.getBoundingClientRect();
  const [width, height] = paintingSize;
  setDrawingPoint((event.clientX - bounds.left) / bounds.width * width,
    (event.clientY - bounds.top) / bounds.height * height);
}
drawingViewport.addEventListener('pointermove', readDrawingPoint);
drawingViewport.addEventListener('pointerdown', readDrawingPoint);
drawingViewport.addEventListener('keydown', event => {
  const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (!direction || drawingCoordinates.hidden) return;
  event.preventDefault();
  const [x, y] = drawingPoint ?? [0, 0];
  const distance = event.shiftKey ? 10 : 1;
  setDrawingPoint(x + direction[0] * distance, y + direction[1] * distance);
});

function resetDrawingCoordinates(surface) {
  drawingCoordinates.hidden = false;
  drawingCoordinates.textContent = 'x — · y —';
  drawingCursor.hidden = true;
  drawingPoint = undefined;
  surface.setAttribute('tabindex', '0');
}

function renderDrawingStep() {
  const { index, verified, code } = drawingProgress;
  const step = activeFrame.steps[index];
  byId('lesson-progress').textContent = 'Passaggio ' + (index + 1) + ' di ' + activeFrame.steps.length;
  byId('lesson-title').textContent = step.title;
  const guidedHalo = step.exercise === 'moonDrawing';
  codeHelpOpen.hidden = !step.readyCode;
  lessonHelp.hidden = !step.hint;
  haloGuide.hidden = !guidedHalo;
  haloGuide.disabled = !guidedHalo;
  if (guidedHalo) {
    haloFields.forEach((field, position) => {
      field.value = drawingProgress.haloValues?.[position] ?? '';
      field.readOnly = verified;
    });
  }
  drawingEditor.value = code;
  drawingEditor.readOnly = verified;
  const finished = verified && index === activeFrame.steps.length - 1;
  const moonStep = step.exercise === 'moon';
  const waitingForMoon = moonStep && !verified && drawingProgress.checkedMoonCode === code;
  const waitingForDemo = Boolean(activeFrame.preview && !verified && drawingProgress.checkedPreviewCode === code);
  byId('lesson-instruction').textContent = step.instruction;
  checkLabel.textContent = finished ? 'Torna al museo' : verified ? 'Continua' : 'Verifica';
  feedback.textContent = finished ? 'Quadro completato!' : verified ? 'Passaggio completato.' : '';
  if (waitingForMoon) feedback.textContent = 'Codice corretto. Prova a cliccare sulla luna.';
  if (waitingForDemo) feedback.textContent = 'Codice corretto. ' + activeFrame.demoInstruction;
  setResetMode(finished);
  workshopMoon.hidden = !(step.exercise === 'moon' || step.exercise === 'lights' || (step.exercise === 'button' && verified));
  workshopMoon.disabled = !(moonStep && (verified || waitingForMoon));
  workshopMoon.setAttribute('aria-label', workshopMoon.disabled ? 'Luna' : 'Luna. Cambia le luci della città');
  const showCityLights = step.exercise === 'moon' || (step.exercise === 'lights' && verified);
  drawingCanvas.toggleAttribute('data-city-interactive', showCityLights);
  if (activeFrame.preview) {
    previewLegend.hidden = true;
    activeFrame.preview(interfacePreview, index + Number(verified), waitingForDemo || finished,
      waitingForDemo ? completeDrawingStep : undefined, finished);
  } else {
    previewDrawingCode();
  }
}

function previewDrawingCode() {
  if (activeFrame.preview) return;
  const step = activeFrame.steps[drawingProgress.index];
  if (step.exercise && step.exercise !== 'moonDrawing') {
    previewLegend.hidden = !drawCity(drawingCanvas, drawingProgress.index, [], drawingProgress.verified, drawingCanvas.hasAttribute('data-city-interactive'));
    return;
  }
  try {
    const commands = readDrawingCode(drawingEditor.value, step.exercise);
    const haloReady = step.exercise === 'moonDrawing' && cityHaloMatches(drawingProgress.haloValues);
    previewLegend.hidden = !activeFrame.draw(drawingCanvas, drawingProgress.index, commands,
      drawingProgress.verified, !workshopMoon.hidden, haloReady);
  } catch {
    previewLegend.hidden = !activeFrame.draw(drawingCanvas, drawingProgress.index);
  }
}

let allowDrawingFocusNavigation = false;
drawingEditor.addEventListener('blur', () => { allowDrawingFocusNavigation = false; });
drawingEditor.addEventListener('keydown', event => {
  if (drawingEditor.readOnly || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key === 'Escape') {
    if (!event.repeat && allowDrawingFocusNavigation) return;
    event.preventDefault();
    allowDrawingFocusNavigation = true;
    return;
  }
  const navigate = allowDrawingFocusNavigation;
  allowDrawingFocusNavigation = false;
  if (event.key !== 'Tab' || navigate) return;

  event.preventDefault();
  const { selectionStart: start, selectionEnd: end, value } = drawingEditor;
  if (event.shiftKey) {
    const lineStart = value.slice(0, start).lastIndexOf('\n') + 1;
    const indent = /^(?:\t| {1,4})/.exec(value.slice(lineStart));
    if (!indent) return;
    drawingEditor.setRangeText('', lineStart, lineStart + indent[0].length, 'preserve');
  } else {
    const indent = '    ';
    if (value.length + indent.length > drawingEditor.maxLength) return;
    drawingEditor.setRangeText(indent, start, start, 'end');
    if (end > start) drawingEditor.setSelectionRange(start + indent.length, end + indent.length);
  }
  drawingEditor.dispatchEvent(new Event('input', { bubbles: true }));
});

haloGuide.addEventListener('input', () => {
  drawingProgress.haloValues = haloFields.map(field => field.value);
  feedback.textContent = '';
  previewDrawingCode();
  saveDrawingProgress();
});

drawingEditor.addEventListener('input', () => {
  drawingProgress.code = drawingEditor.value;
  if (drawingProgress.checkedMoonCode !== undefined || drawingProgress.checkedPreviewCode !== undefined) {
    delete drawingProgress.checkedMoonCode;
    delete drawingProgress.checkedPreviewCode;
    renderDrawingStep();
  } else {
    feedback.textContent = '';
    previewDrawingCode();
  }
  saveDrawingProgress();
});

function drawingCodeMatches(frame, index, code) {
  if (frame.checkCode) return frame.checkCode(index, code);
  const { exercise } = frame.steps[index];
  if (exercise === 'button') return cityButtonMatches(code);
  if (exercise === 'moon') {
    const source = code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ' ');
    const listener = /^\s*luna\s*\.\s*addActionListener\s*\(\s*[a-zA-Z_$][\w$]*\s*->\s*\{([\s\S]*?)\}\s*\)\s*;\s*$/.exec(source);
    return Boolean(listener && cityExerciseMatches(exercise, readDrawingCode(listener[1], exercise)));
  }
  const commands = readDrawingCode(code, exercise);
  return exercise ? cityExerciseMatches(exercise, commands) : frame.drawing.matches(index, commands);
}

function runCityMoon(button) {
  const frame = frames[2];
  const inWorkshop = button === workshopMoon;
  const progress = inWorkshop ? drawingProgress : loadDrawingProgress(frame);
  const code = inWorkshop ? drawingEditor.value : progress.moonCode ?? citySteps[cityListenerStep].goal;
  if (inWorkshop && !progress.verified && progress.checkedMoonCode !== code) return;
  try {
    if (!drawingCodeMatches(frame, cityListenerStep, code)) throw new Error('Prima di provare il clic, collega al pulsante il metodo del passaggio precedente.');
    changeCityLights(progress);
    if (inWorkshop && !progress.verified) {
      progress.moonCode = code;
      delete progress.checkedMoonCode;
      completeDrawingStep();
    }
  } catch (error) {
    if (inWorkshop) feedback.textContent = error.message;
  }
}

function changeCityLights(progress) {
  const code = progress.randomCode ?? citySteps[cityLightsStep].goal;
  shuffleCityLights(drawingCodeMatches(frames[2], cityLightsStep, code) ? code : citySteps[cityLightsStep].goal);
  for (const canvas of document.querySelectorAll('canvas[data-city-interactive]')) {
    drawCity(canvas, citySteps.length, [], true, true);
  }
}

function checkDrawing() {
  const { index, verified } = drawingProgress;
  const last = index === activeFrame.steps.length - 1;
  if (verified) {
    playEffect('click');
    if (last) {
      workshop.close();
      return;
    }
    drawingProgress.index++;
    drawingProgress.verified = false;
    const nextStep = activeFrame.steps[drawingProgress.index];
    const draft = {
      button: drawingProgress.buttonDraft,
      lights: drawingProgress.lightsDraft,
      moon: restoreCityListener(drawingProgress.listenerDraft)
    }[nextStep.exercise];
    drawingProgress.code = draft ?? nextStep.starter ?? '';
    if (nextStep.exercise === 'button') delete drawingProgress.buttonDraft;
    if (nextStep.exercise === 'lights') delete drawingProgress.lightsDraft;
    if (nextStep.exercise === 'moon') delete drawingProgress.listenerDraft;
    renderDrawingStep();
    saveDrawingProgress();
    (haloGuide.hidden ? drawingEditor : haloFields[0]).focus();
    return;
  }

  const step = activeFrame.steps[index];
  try {
    if (step.exercise === 'moonDrawing') {
      if (!cityHaloMatches(drawingProgress.haloValues)) {
        throw new Error('Controlla i tre campi della sfumatura. Leggi il centro sulla tela e usa metà del diametro come raggio.');
      }
      const issue = cityMoonDrawingIssue(readDrawingCode(drawingEditor.value, step.exercise));
      if (issue) throw new Error(issue);
    } else if (!drawingCodeMatches(activeFrame, index, drawingEditor.value)) {
      const message = {
        button: 'Crea il JButton luna e usa in setBounds() il riquadro del disco.',
        lights: 'Assegna un valore casuale a ciascuna finestra, una volta sola.',
        moon: 'Controlla che il pulsante richiami il metodo del passaggio precedente prima di repaint().'
      }[step.exercise];
      throw new Error(message ?? step.retry
        ?? 'Il disegno non coincide con la sagoma. Controlla le coordinate o chiedi un aiuto a Vincent.');
    }
    if (step.exercise === 'lights') {
      drawingProgress.randomCode = drawingEditor.value;
      changeCityLights(drawingProgress);
    }
    if (activeFrame.preview && last) {
      drawingProgress.code = drawingEditor.value;
      drawingProgress.checkedPreviewCode = drawingEditor.value;
      saveDrawingProgress();
      renderDrawingStep();
      interfacePreview.querySelector(activeFrame.demoFocus).focus();
      return;
    }
    if (step.exercise === 'moon') {
      drawingProgress.code = drawingEditor.value;
      drawingProgress.checkedMoonCode = drawingEditor.value;
      saveDrawingProgress();
      renderDrawingStep();
      workshopMoon.focus();
      return;
    }
  } catch (error) {
    feedback.textContent = error.message;
    playEffect('retry');
    return;
  }
  completeDrawingStep();
}

function completeDrawingStep() {
  const last = drawingProgress.index === activeFrame.steps.length - 1;
  drawingProgress.code = drawingEditor.value;
  drawingProgress.verified = true;
  delete drawingProgress.checkedPreviewCode;
  if (last) drawingProgress.replaying = false;
  saveDrawingProgress();
  renderDrawingStep();
  if (last) completeFrame();
  else playEffect('success');
}

function resetDrawing() {
  if (drawingProgress.verified && drawingProgress.index === activeFrame.steps.length - 1) {
    drawingProgress.index = 0;
    drawingProgress.replaying = true;
  }
  drawingProgress.verified = false;
  drawingProgress.code = activeFrame.steps[drawingProgress.index].starter ?? '';
  delete drawingProgress.haloValues;
  delete drawingProgress.checkedMoonCode;
  delete drawingProgress.checkedPreviewCode;
  renderDrawingStep();
  saveDrawingProgress();
  (haloGuide.hidden ? drawingEditor : haloFields[0]).focus();
}

function openWorkshop(frame, restoring = false) {
  if (!isFrameUnlocked(frames.indexOf(frame))) return;
  if (activeFrame !== frame && !activeFrame.steps) saveProgress();
  activeFrame = frame;
  const usesEditor = Boolean(frame.steps);
  const hasInterface = Boolean(frame.preview);
  workshopTitle.textContent = frame.title;
  tourOpen.hidden = usesEditor;
  codeEditor.hidden = usesEditor;
  drawingEditor.hidden = !usesEditor;
  houseCanvas.toggleAttribute('hidden', usesEditor);
  drawingCanvas.hidden = !usesEditor || hasInterface;
  interfacePreview.hidden = !hasInterface;
  interfacePreview.className = frame.previewClass ?? '';
  drawingViewport.toggleAttribute('data-interface', hasInterface);
  if (hasInterface) {
    drawingCoordinates.hidden = true;
    drawingCursor.hidden = true;
  } else {
    resetDrawingCoordinates(usesEditor ? drawingCanvas : houseCanvas);
  }
  drawingCanvas.setAttribute('aria-label', frame.title + '. Usa le frecce per spostare il cursore e leggere le coordinate.');
  if (usesEditor) {
    drawingProgress = loadDrawingProgress(frame);
    renderDrawingStep();
  } else {
    haloGuide.hidden = true;
    haloGuide.disabled = true;
    workshopMoon.hidden = true;
    drawingCanvas.removeAttribute('data-city-interactive');
    restoreProgress();
  }

  workshop.showModal();
  try { sessionStorage.setItem(workshopOpenKey, frame.id); } catch {}
  if (usesEditor) {
    showDrawingIntro(frame);
  } else if (!restoring && !tourSeen) {
    startTour(fields[0]);
  }
  if (!restoring) playMusic();
}

restoreProgress();
renderGalleryArtwork();

let savedWorkshop;
try { savedWorkshop = sessionStorage.getItem(workshopOpenKey); } catch {}
const resumeIndex = frames.findIndex(frame => frame.id && frame.id === (savedWorkshop === 'yes' ? 'casa' : savedWorkshop));
if (resumeIndex >= 0) {
  const unlocked = isFrameUnlocked(resumeIndex);
  const selectedIndex = unlocked ? resumeIndex : firstIncompleteFrame();
  if (selectedIndex !== frameIndex) showFrame(selectedIndex - frameIndex);
  if (unlocked) openWorkshop(frames[resumeIndex], true);
  else {
    try { sessionStorage.removeItem(workshopOpenKey); } catch {}
  }
}
