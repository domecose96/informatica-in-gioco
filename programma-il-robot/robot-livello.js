function mountRobotLevel(level, replayIntro) {
  const find = selector => document.querySelector(selector);
  const form = find('#robot-form'), editor = find('#robot-code');
  const feedback = find('#robot-feedback'), finish = find('#robot-finish');
  const board = find('#robot-board'), actor = find('#robot-actor'), goal = find('#robot-goal');
  const directionControls = find('#robot-directions'), stepValues = find('#robot-step-values');
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const starter = RobotEngine.starter(level, ROBOT_LEVELS, read);
  const access = robotLevelAccess(level, read);

  const coinMode = level.coinMode;
  let coinSeed = Math.floor(Math.random() * 4294967296);
  const changeCoinSeed = () => { coinSeed = (coinSeed + 1 + Math.floor(Math.random() * 4294967295)) >>> 0; };
  const coinTiles = level.coinTiles || (coinMode === 'collect' ? [[1,4],[2,4],[3,4]] : []);
  const checksRecharge = level.number === 22;
  const hasChargeTrials = checksRecharge || (level.transition && level.caricaMassima !== undefined);
  const checksConsumption = level.number === 24;
  const checksBattery = level.number === 23;
  const checksBase = level.number === 15;
  const returnsToBase = [17, 25, 27, 35].includes(level.number);
  const hasEnergy = level.caricaMassima !== undefined;
  const chargeIndicator = find('#robot-charge-indicator');
  chargeIndicator.hidden = !checksBase && !hasEnergy;

  function showCharge(state, label, bars = 0) {
    chargeIndicator.dataset.charge = state;
    const sprite = chargeIndicator.querySelector('.charge-sprite');
    sprite.hidden = false;
    const chargeImage = state === 'charging' ? 'ricarica'
      : state === 'empty' ? 'scarica'
      : bars <= 1 ? 'scarica' : `${Math.min(4, bars)}-tacche`;
    sprite.src = `assets/robot-batteria-${chargeImage}.webp`;
    chargeIndicator.setAttribute('aria-label', label);
    chargeIndicator.title = label;
  }

  const checksWall = level.number === 19;
  const checksCoordinates = [12, 15, 18, 19].includes(level.number);
  const previewOptions = RobotEngine.previewOptions(level);
  const trials = coinMode === 'collect'
    ? [{...level.checks[0], name:'Tre monete', start:level.start, steps:3},
       {...level.checks[0], name:'Casella vuota', start:{x:0,y:3}, steps:3}]
    : coinMode ? [level.checks[0]]
    : level.functionName === 'arrivato'
    ? [{...level.checks[0], name: 'Prima della stella', start: level.start},
       {...level.checks[0], name: 'Sulla stella', start: level.goal}]
    : checksConsumption
    ? [
        {...level.checks[0], name: 'Avanti', commands: ['avanza','giraDestra','avanza'], energia:12},
        {...level.checks[0], name: 'Indietro', commands: ['indietro','giraSinistra','indietro'], energia:12},
        {...level.checks[0], name: 'Gira a destra', commands: ['giraDestra','avanza','giraSinistra'], energia:12},
        {...level.checks[0], name: 'Gira a sinistra', commands: ['giraSinistra','avanza','giraDestra'], energia:12}
      ]
    : checksBattery
    ? [12, 9, 6, 3, 0].map(energia => ({...level.checks[0], name: energia ? `${energia} mosse` : 'Scarico', energia}))
    : hasChargeTrials
    ? [
        {...level.checks[0], name: 'Robot carico', energia: level.caricaMassima},
        {...level.checks[0], name: 'Robot scarico', energia: 0}
      ]
    : checksBase
    ? [
        { ...level.checks[0], name: 'Base', args: [1, 2] },
        { ...level.checks[0], name: 'Fuori base', args: [3, 2] }
      ]
    : checksCoordinates
    ? [
        { ...level.checks[0], name: level.number === 12 ? 'Dentro' : 'Libera', args: [2, 3] },
        ...(level.number !== 12 ? [{ ...level.checks[0], name: 'Muro', args: [3, 2] }] : []),
        ...(checksWall ? [] : [{ ...level.checks[0], name: 'Fuori', args: [previewOptions.size, 1] }])
      ]
    : level.checks;
  const initialMessage = coinMode === 'place' ? 'Ogni esecuzione estrae di nuovo le posizioni delle monete.'
    : coinMode === 'collect' ? 'Scegli la prova, poi esegui: il banco fa tre passi e controlla la moneta dopo ciascuno.'
    : checksConsumption ? 'Il banco esegue tre comandi tra passi e svolte: energia scende da 12 a 9 e la batteria passa a tre tacche.' : checksBattery ? 'Scegli la carica iniziale. Il banco esegue passi e svolte e controlla la batteria a ogni comando.' : checksRecharge ? 'Scegli lo stato del robot, poi verifica ricarica().' : checksCoordinates
    ? 'Scegli una prova, poi esegui il codice.'
    : level.functionName === 'arrivato' ? 'Scegli la posizione del robot rispetto alla stella, poi esegui il codice.'
    : level.number === 6 ? 'Completa collaudo(), poi esegui il codice.'
    : 'Scegli una direzione, poi esegui il codice.';
  let selectedTrial = trials[0], runId = 0;
  document.title = `${level.title} · Programma il robot`;
  find('#level-kicker').textContent = `${level.checkpoint ? 'COLLAUDO INTERMEDIO' : (level.transition || level.coinFinal) ? 'COLLAUDO FINALE' : level.optional ? 'SFIDA FACOLTATIVA' : level.maze ? 'LABIRINTI' : level.advanced ? 'OFFICINA AVANZATA' : 'OFFICINA'} · LIVELLO ${level.displayNumber}`;
  find('#level-title').textContent = level.title;
  find('#level-task').textContent = level.task;
  find('#level-hint').textContent = level.hint;
  find('#robot-variables').replaceChildren(...level.variables.map(([name, description]) => {
    const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = name; dd.textContent = description; row.append(dt, dd); return row;
  }));
  if (level.number <= 5) {
    const guide = document.createElement('div'); guide.className = 'robot-direction-guide';
    const title = document.createElement('p'); title.textContent = 'Un passo cambia x e y così:'; guide.append(title);
    const table = document.createElement('table'); table.setAttribute('aria-label', 'Valori di dx e dy per un passo nelle quattro direzioni');
    const header = document.createElement('tr');
    for (const label of ['Direzione', 'dx: cambia x', 'dy: cambia y']) { const th = document.createElement('th'); th.textContent = label; header.append(th); } table.append(header);
    for (const direction of ROBOT_DIRECTIONS) { const row = document.createElement('tr'); for (const text of [direction.arrow + ' ' + direction.name, String(direction.dx), String(direction.dy)]) { const cell = document.createElement('td'); cell.textContent = text; row.append(cell); } table.append(row); }
    guide.append(table); find('.robot-hint-panel').append(guide);
  }
  find('#simulation-title').textContent = level.maze ? 'Pista di missione' : 'Banco di prova';
  const nextNumber = Number.parseInt(level.displayNumber, 10) + 1;
  const nextDisplayNumber = level.optional ? `${nextNumber}L` : String(nextNumber).padStart(2, '0');
  const nextLevel = ROBOT_LEVELS.find(item => item.displayNumber === nextDisplayNumber);
  function updateFinishLink() {
    const canContinue = nextLevel && robotLevelAccess(nextLevel, read).unlocked;
    finish.href = canContinue ? `robot-livello.html?livello=${nextLevel.number}` : 'index.html#percorso-robot';
    finish.textContent = canContinue ? `Vai al livello ${nextLevel.displayNumber} →` : 'Torna alla mappa →';
  }
  const savedCode = read(level.progressKey);
  editor.value = ((level.referenceHelpers || level.advanced || (level.number >= 3 && level.number <= 5)) && savedCode
    ? RobotEngine.extractFunction(savedCode, level.functionName, level.arity || 0)
    : savedCode) || RobotEngine.starter(level, ROBOT_LEVELS, read);
  if (!savedCode && level.number > 2) {
    requestAnimationFrame(() => {
      const signature = level.functionName === 'main' ? 'int main()' : `${level.returnType || "void"} ${level.functionName}(${level.parameters || ""})`;
      const bodyStart = editor.value.lastIndexOf(signature);
      const caret = editor.value.indexOf('\n', bodyStart) + 5;
      editor.setSelectionRange(caret, caret);
      editor.scrollTop = editor.scrollHeight;
    });
  }
  const references = RobotEngine.referenceFunctions(level, ROBOT_LEVELS, read, savedCode || '');
  const visibleReferences = references.filter(reference => reference.name !== 'collaudo');
  if (visibleReferences.length) {
    const container = find('#robot-function-references');
    const buttons = find('#robot-function-buttons');
    const preview = find('#robot-function-preview');
    const code = find('#robot-function-code');
    container.hidden = false;
    const categories = [
      {label:'Movimenti', names:['avanza','indietro','giraDestra','giraSinistra','giraIndietro','avanzaSicuro']},
      {label:'Sensori', names:['dentroGriglia','cellaMuro','casellaLibera','davantiLibero','destraLibera','sinistraLibera']},
      {label:'Energia e arrivo', names:['cellaBase','consumaEnergia','batteriaScarica','ricarica','arrivato']},
      {label:'Guida automatica', names:['passoAutomatico']},
      {label:'Monete', names:['distribuisciMonete','raccogliMoneta']}
    ];
    const groups = categories.map(category => ({...category,
      references:visibleReferences.filter(reference => category.names.includes(reference.name))
    })).filter(group => group.references.length);
    const uncategorized = visibleReferences.filter(reference => !categories.some(category => category.names.includes(reference.name)));
    if (uncategorized.length) groups.push({label:'Altre funzioni',references:uncategorized});
    function renderReferences(items) {
      buttons.replaceChildren();
      preview.hidden = true;
      code.textContent = '';
      for (const reference of items) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = reference.label;
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'robot-function-preview');
        button.addEventListener('click', () => {
          const open = button.getAttribute('aria-expanded') !== 'true';
          for (const sibling of buttons.children) sibling.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-expanded', String(open));
          preview.hidden = !open;
          code.textContent = reference.code || `Completa il livello ${reference.displayNumber} per salvare ${reference.name}().`;
          preview.setAttribute('aria-label', `Funzione ${reference.name}`);
        });
        buttons.append(button);
      }
    }
    if (visibleReferences.length > 6 && groups.length > 1) {
      const navigation = document.createElement('div');
      navigation.className = 'robot-function-groups';
      navigation.setAttribute('role','group');
      navigation.setAttribute('aria-label','Gruppi di funzioni');
      for (const [index, group] of groups.entries()) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${group.label} (${group.references.length})`;
        button.setAttribute('aria-pressed',String(index === 0));
        button.setAttribute('aria-controls','robot-function-buttons');
        button.addEventListener('click', () => {
          for (const sibling of navigation.children) sibling.setAttribute('aria-pressed','false');
          button.setAttribute('aria-pressed','true');
          buttons.setAttribute('aria-label',group.label);
          renderReferences(group.references);
        });
        navigation.append(button);
      }
      container.prepend(navigation);
      buttons.setAttribute('aria-label',groups[0].label);
      renderReferences(groups[0].references);
    } else renderReferences(visibleReferences);
  }
  const apiDialog = find('#robot-api');
  const apiButton = find('#robot-api-open');
  const apiClose = find('#robot-api-close');
  const apiLines = [
    '// Variabili già dichiarate dal gioco',
    'int x;  // colonna del robot',
    'int y;  // riga del robot'
  ];
  if (level.number > 1) {
    apiLines.push('int dx; // cambia x: +1 destra, -1 sinistra, 0 nessun cambio', 'int dy; // cambia y: +1 basso, -1 alto, 0 nessun cambio');
  }
  if (level.number >= 12) {
    apiLines.push(
      '', '// Dimensioni della griglia mostrata. Il gioco le imposta a ogni prova.',
      `const int LARGHEZZA = ${level.size};`,
      `const int ALTEZZA = ${level.size};`
    );
  }
  if (level.exposeGoal) {
    apiLines.push('', '// Coordinate della stella',
      `const int ARRIVO_X = ${level.goal.x};`,
      `const int ARRIVO_Y = ${level.goal.y};`);
  }
  if (hasEnergy) {
    apiLines.push('', '// Batteria del robot',
      'int energia; // carica rimasta',
      `const int CARICA_MASSIMA = ${level.caricaMassima};`);
  }
  for (const name of [...(checksWall || [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 44, 45].includes(level.number) ? ['mappa'] : []), ...(level.baseTiles ? ['mappaBase'] : [])]) {
    const isWallMap = name === 'mappa';
    const tiles = isWallMap ? level.tiles : level.baseTiles;
    const positions = new Set(tiles.map(([x, y]) => `${x},${y}`));
    const legend = isWallMap ? '0 = libera, 1 = muro' : '0 = fuori base, 1 = base azzurra';
    apiLines.push('', `// Matrice della prova: ${legend}`,
      `const int ${name}[ALTEZZA][LARGHEZZA] = {`);
    for (let row = 0; row < level.size; row++) {
      const cells = Array.from({length: level.size}, (_, column) => {
        const marked = positions.has(`${column},${row}`);
        return Number(isWallMap ? !marked : marked);
      });
      apiLines.push(`    {${cells.join(', ')}},`);
    }
    apiLines.push('};');
  }
  if (visibleReferences.length) {
    apiLines.push('', '// Funzioni dei livelli precedenti disponibili qui');
    for (const reference of visibleReferences) {
      const helper = ROBOT_LEVELS[reference.number - 1];
      apiLines.push(`${helper.returnType || 'void'} ${helper.functionName}(${helper.parameters || ''});`);
    }
  }
  if (coinMode === 'collect') apiLines.push('', '// Passi impostati dal banco per la prova selezionata', 'const int PASSI_PROVA = 3; // 1 nella prova Casella vuota');
  if (coinMode) {
    apiLines.push('', '// Monete della prova', `const int NUMERO_MONETE = ${level.coinTotal};`,
      'int monete[ALTEZZA][LARGHEZZA]; // 0 = vuota, 1 = moneta',
      'int moneteRaccolte; // parte da zero', 'int casuale(int limite); // da 0 a limite escluso');
  }
  find('#robot-api-code').textContent = apiLines.join('\n');
  apiButton.addEventListener('click', () => {
    hint.open = false;
    apiDialog.showModal();
  });
  apiClose.addEventListener('click', () => apiDialog.close());
  apiDialog.addEventListener('close', () => apiButton.focus());
  editor.maxLength = 12000;
  const hint = find('.robot-hint');
  document.addEventListener('click', event => { if (hint.open && !hint.contains(event.target)) hint.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hint.open = false; });
  board.style.setProperty('--board-size', level.size);
  for (const axis of board.querySelectorAll('.board-columns, .board-rows')) {
    for (let i = 0; i < level.size; i++) {
      const label = document.createElement('span'); label.textContent = i; axis.append(label);
    }
  }
  function place(element, point) { element.style.setProperty('--x', point.x); element.style.setProperty('--y', point.y); }
  if (level.number === 4 || level.number === 5) find('.board-legend span').textContent = level.number === 4 ? '↻ Ruota a destra' : '↺ Ruota a sinistra';
  const collaudoWalls = [];
  const walls = level.tiles && new Set(level.tiles.map(([x,y]) => `${x},${y}`));
  if (walls) for (let y = 0; y < level.size; y++) for (let x = 0; x < level.size; x++) {
    if (level.number === 6 || !walls.has(`${x},${y}`)) {
      const wall = document.createElement('span'); wall.className = 'robot-wall'; wall.setAttribute('aria-hidden','true'); place(wall,{x,y}); board.prepend(wall); if (level.number === 6) collaudoWalls.push({wall,x,y});
    }
  }
  for (const [x,y] of level.baseTiles || []) {
    const tile = document.createElement('span'); tile.className = 'robot-base'; tile.setAttribute('aria-hidden','true'); place(tile,{x,y}); board.prepend(tile);
  }
  if (level.baseTiles) {const item=document.createElement('span'); item.textContent='▧ Base'; find('.board-legend').append(item);}
  let battery;
  if (level.battery) {
    battery = document.createElement('span'); battery.className = 'robot-battery'; battery.textContent = '▣'; battery.setAttribute('aria-hidden','true'); place(battery,level.battery); board.append(battery);
    const item = document.createElement('span'); item.textContent = '▣ Batteria'; find('.board-legend').append(item);
  }
  const coinCounter = find('#robot-coin-counter');
  coinCounter.hidden = !coinMode;
  directionControls.hidden = (coinMode && coinMode !== 'collect') || level.number === 1 || level.number === 6 || (level.maze && !hasChargeTrials);
  if (coinMode === 'collect' || hasChargeTrials || checksBattery || checksConsumption || level.functionName === 'arrivato') {
    directionControls.classList.add('coordinate-trials');
    directionControls.style.setProperty('--coordinate-trial-count', trials.length);
    directionControls.setAttribute('aria-label', (coinMode === 'collect' || level.functionName === 'arrivato') ? 'Posizione del robot' : 'Stato della batteria del robot');
  }
  stepValues.hidden = level.number === 1 || !!(coinMode && !hasEnergy && coinMode !== 'collect');
  if (checksCoordinates) {
    directionControls.classList.add('coordinate-trials');
    directionControls.style.setProperty('--coordinate-trial-count', trials.length);
    directionControls.setAttribute('aria-label', 'Prove delle coordinate');
    find('#robot-arrow').hidden = true;
    find('.board-legend span:first-child').textContent = '✦ Punto da verificare';
    find('.board-legend span:nth-child(2)').hidden = true;
  }
  if (level.sideSensor) find('.board-legend span:first-child').textContent = '✦ Casella osservata';
  if (checksBattery || checksConsumption) {
    goal.hidden = true;
    find('.board-legend span:first-child').textContent = '1 tacca ogni 3 comandi';
  }
  if (coinMode) {
    goal.hidden = !(level.exposeGoal && level.goal);
    find('.board-legend span:first-child').textContent = goal.hidden ? '▣ Moneta' : '▣ Moneta · ✦ Traguardo';
  }
  const collectionSequence = find('#robot-collection-sequence');
  function highlightCollectionStep(index) {
    if (coinMode === 'collect') collectionSequence.setAttribute('data-active',String(index >= 0));
  }
  const consumptionSteps = [];
  if (checksConsumption) {
    directionControls.classList.add('consumption-sequence');
    directionControls.setAttribute('aria-label', 'Sequenza del banco, eseguita automaticamente');
    const labels = {avanza:'Avanza', giraDestra:'Gira a destra', indietro:'Indietro', giraSinistra:'Gira a sinistra'};
    for (const [index, command] of selectedTrial.commands.entries()) {
      const step = document.createElement('span');
      step.className = 'robot-demo-step';
      step.textContent = `${index + 1}. ${labels[command]}`;
      step.setAttribute('aria-current','false');
      directionControls.append(step);
      consumptionSteps.push(step);
    }
  }
  function highlightConsumptionStep(index) {
    consumptionSteps.forEach((step, i) => {
      step.setAttribute('aria-current',i === index ? 'step' : 'false');
      step.classList.toggle('completed',i < index);
    });
  }
  for (const trial of checksConsumption ? [] : trials) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = coinMode === 'collect' || hasChargeTrials || checksBattery || checksConsumption || level.functionName === 'arrivato' ? trial.name : checksCoordinates ? `${trial.name} (${trial.args.join(', ')})` : `${trial.arrow} ${trial.name}`;
    button.dataset.direction = trial.name;
    button.addEventListener('click', () => { selectedTrial = trial; clearTrial(); }); directionControls.append(button);
  }
  if (coinMode === 'collect') {
    collectionSequence.hidden = false;
    collectionSequence.textContent = '3 passi automatici';
    collectionSequence.setAttribute('title','Il banco controlla la moneta dopo ogni passo.');
    collectionSequence.setAttribute('aria-label','Tre passi automatici, con controllo della moneta dopo ciascun passo');
    directionControls.style.setProperty('--coordinate-trial-count',3);
    directionControls.append(collectionSequence);
  }
  function target(trial) {
    if (level.number === 6) return RobotEngine.collaudoCourse(level,trial).goal;
    if (coinMode) return level.goal || previewStart(trial);
    if (checksCoordinates) return {x: trial.args[0], y: trial.args[1]};
    if (level.sideSensor) {
      const start=RobotEngine.trialStart(level,trial);
      const dx=level.sideSensor==='right'?-trial.dy:trial.dy;
      const dy=level.sideSensor==='right'?trial.dx:-trial.dx;
      return {x:start.x+dx,y:start.y+dy};
    }
    if (level.number===30) {
      const start=RobotEngine.trialStart(level,trial);
      const free=(dx,dy)=>level.tiles.some(([x,y])=>x===start.x+dx&&y===start.y+dy);
      const side=free(-trial.dy,trial.dx)?{dx:-trial.dy,dy:trial.dx}:free(trial.dx,trial.dy)?trial:free(trial.dy,-trial.dx)?{dx:trial.dy,dy:-trial.dx}:{dx:-trial.dx,dy:-trial.dy};
      return free(side.dx,side.dy)?{x:start.x+side.dx,y:start.y+side.dy}:start;
    }
    if (level.goal) return level.goal;
    if (checksConsumption) {
      const start = RobotEngine.trialStart(level, trial);
      return start;
    }
    const start = RobotEngine.trialStart(level, trial);
    if ([11,12,13,15].includes(level.number)) return start;
    if (level.number === 14) {
      const next={x:start.x+trial.dx,y:start.y+trial.dy};
      return level.tiles.some(([x,y])=>x===next.x&&y===next.y)?next:start;
    }
    if (level.number === 3) return {x:start.x-trial.dx,y:start.y-trial.dy};
    if (level.number === 4 || level.number === 5) return start;
    const distance = level.forwardRoom || 1;
    return {x:start.x+distance*trial.dx,y:start.y+distance*trial.dy};
  }
  const robotSprite = actor.querySelector('img');
  if (coinMode) {
    const happySprite = new Image();
    happySprite.src = 'assets/robot-cuoricini.png';
  }
  const chargingSprite = level.baseTiles && new Image();
  if (chargingSprite) chargingSprite.src = 'assets/robot-in-ricarica.webp';

  function previewStart(trial) {
    return trial.start ?? (checksBase ? target(trial) : RobotEngine.trialStart(level, trial));
  }

  const coinMarkers = new Map();
  let initialCoins = coinTiles.map(tile => tile.join(','));
  function prepareCoins() {
    if (!['hunt','sweep','expedition'].includes(coinMode) || !access.unlocked) return;
    try {
      const functions = RobotEngine.program(level, RobotEngine.blank('main'), references);
      initialCoins = RobotEngine.run(functions, 'main', level.start, level.checks[0], {...level, coinSeed}).coins;
    } catch {
      initialCoins = [];
    }
  }
  prepareCoins();
  function showCoins(position) {
    const remaining = position.coins || initialCoins;
    for (const [cell, marker] of coinMarkers) marker.hidden = !remaining.includes(cell);
    for (const cell of remaining) {
      if (coinMarkers.has(cell)) continue;
      const [x,y] = cell.split(',').map(Number);
      const marker = document.createElement('span');
      marker.className = 'robot-battery';
      marker.textContent = '▣';
      marker.setAttribute('aria-hidden','true');
      place(marker,{x,y});
      board.prepend(marker);
      coinMarkers.set(cell,marker);
    }
    if (position.command === 'raccogliMoneta' && position.coinCollected !== false) {
      robotSprite.src = 'assets/robot-cuoricini.png';
    }
    const count = `Raccolte ${position.moneteRaccolte || 0}/${level.coinTotal} · Disponibili ${remaining.length}`;
    if (coinCounter.textContent !== count) coinCounter.textContent = count;
    board.setAttribute('aria-label', `Robot in (${position.x}, ${position.y}). ${coinCounter.textContent}.${hasEnergy ? ' ' + stepValues.textContent + '.' : ''}`);
  }

  function showTrial(trial, position) {
    if (coinMode === 'collect' && !position) highlightCollectionStep(-1);
    if (checksConsumption && !position) highlightConsumptionStep(-1);
    if (level.number === 6) {
      const course = RobotEngine.collaudoCourse(level, trial), free = new Set(course.tiles.map(([x,y])=>`${x},${y}`));
      for (const {wall,x,y} of collaudoWalls) wall.hidden = free.has(`${x},${y}`);
    }
    const start = previewStart(trial);
    position ??= {...start, ...trial, ...(hasEnergy ? {energia: trial.energia ?? level.energiaIniziale ?? level.caricaMassima} : {})};
    const direction = ROBOT_DIRECTIONS.find(d => d.dx === position.dx && d.dy === position.dy);
    find('#robot-arrow').textContent = direction?.arrow || '?';
    const chargingAtBase = (returnsToBase || checksRecharge || level.rechargeOnEntry) && level.baseTiles.some(([x, y]) => x === position.x && y === position.y);
    stepValues.textContent = coinMode && !hasEnergy ? (coinMode === 'collect' ? `Posizione del robot · (${position.x}, ${position.y})` : '')
      : chargingAtBase ? (level.transition || level.rechargeOnEntry ? `Batteria · ${position.energia}/${level.caricaMassima} alla stazione` : 'Batteria · in ricarica')
      : hasEnergy
      ? `Batteria · ${position.energia ?? level.caricaMassima}/${level.caricaMassima}${position.energia === 0 ? ' · scarica' : ''}`
      : checksCoordinates
      ? `Punto da verificare · colonna = ${trial.args[0]} · riga = ${trial.args[1]}`
      : `Passo verso ${direction?.name || trial.name} · dx = ${position.dx} · dy = ${position.dy}${level.number === 10 ? ` · passi = ${level.forwardRoom}` : ""}`;
    const directionText = stepValues.textContent.match(/^(Passo verso .*?|Punto da verificare)( · (?:dx = -?\d+ · dy = -?\d+|colonna = -?\d+ · riga = -?\d+))(.*)$/);
    if (directionText) {
      const prefix = document.createElement('span'), values = document.createElement('strong'), suffix = document.createElement('span');
      prefix.textContent = directionText[1]; values.textContent = directionText[2]; suffix.textContent = directionText[3];
      stepValues.replaceChildren(prefix, values, suffix);
    }
    for (const button of directionControls.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.direction === trial.name));
    place(goal, target(trial));
    goal.textContent = level.number === 4 ? '↻' : level.number === 5 ? '↺' : '✦';
    const inside = position.x >= 0 && position.y >= 0 && position.x < level.size && position.y < level.size;
    const displayedPosition = inside ? position : start;
    place(actor, displayedPosition);
    if (chargingSprite) {
      const charging = (!coinMode || level.rechargeOnEntry) && level.baseTiles.some(([x, y]) => x === displayedPosition.x && y === displayedPosition.y);
      robotSprite.src = charging ? chargingSprite.src
        : hasEnergy && position.energia === 0 ? 'assets/robot-scarico.webp'
        : 'assets/robot-officina.webp';
      if (checksBase || (returnsToBase && (!hasEnergy || !level.codeEnergy))) {
        showCharge(charging ? 'charging' : 'empty', charging ? 'Batteria in ricarica' : 'Batteria scarica');
      }
    }
    if (checksBattery || checksConsumption || (hasEnergy && !chargingSprite)) {
      robotSprite.src = position.energia === 0 ? 'assets/robot-scarico.webp' : 'assets/robot-officina.webp';
    }
    if (hasEnergy && (!returnsToBase || level.codeEnergy)) {
      if (chargingAtBase && !level.transition && !level.rechargeOnEntry) showCharge('charging', 'Batteria in ricarica');
      else {
      const maximum = level.caricaMassima;
      const energy = position.energia ?? maximum;
      const state = energy <= 0 ? 'empty' : energy >= maximum ? 'full' : 'partial';
      const label = state === 'empty' ? 'Batteria scarica' : state === 'full' ? 'Batteria carica' : 'Batteria parzialmente carica';
      showCharge(state, `${label} · ${energy}/${maximum}`, Math.ceil(energy / maximum * 4));
      }
    }
    if (coinMode) {
      showCoins(position);
      return;
    }
    if (battery) battery.classList.toggle('collected', !!position.collected);
    if (checksCoordinates) {
      goal.hidden = trial.args.some(value => value < 0 || value >= level.size);
      board.setAttribute('aria-label', `Griglia ${level.size} per ${level.size}. Coordinate da verificare (${trial.args.join(', ')}).${checksBase ? ` Robot in (${displayedPosition.x}, ${displayedPosition.y}).` : ''}`);
      return;
    }
    board.setAttribute('aria-label', `Griglia ${level.size} per ${level.size}. Robot in (${position.x}, ${position.y}), rivolto verso ${direction?.name || trial.name}. Traguardo (${target(trial).x}, ${target(trial).y}).${level.battery ? ` Batteria in (${level.battery.x}, ${level.battery.y})${position.collected ? ', raccolta' : ''}.` : ''}${level.maze || level.number===6 ? ' I blocchi scuri sono muri.' : ''}`);
  }
  function report(message, state = '') { feedback.textContent = message; feedback.dataset.state = state; if (state) window.RobotAudio?.effect(state); }
  function clearTrial() {
    runId++; finish.hidden = true;
    form.querySelector('[type="submit"]').disabled = false;
    actor.classList.add('robot-reset'); showTrial(selectedTrial); void actor.offsetWidth; actor.classList.remove('robot-reset');
    report(checksConsumption ? `Sequenza del banco: ${selectedTrial.commands.map(command => command + '()').join(' → ')}.` : checksRecharge ? (selectedTrial.energia > 0 ? 'Robot carico: ricarica() deve lasciarlo fermo senza modificare energia.' : 'Robot scarico: ricarica() deve riportarlo alla base e ripristinare energia.') : level.number === 1 ? 'Esegui il codice per fare un passo verso destra.' : level.checkpoint === 'sensors' ? 'Percorri i due tratti con i sensori e fermati sulla stella.' : level.transition ? (selectedTrial.energia > 0 ? 'Prova a batteria carica. Segui la pista fino alla stazione, poi raggiungi la stella.' : 'Prova a batteria scarica. Ricaricati alla stazione, poi raggiungi la stella.') : coinMode === 'delivery' ? 'Raccogli tre monete e raggiungi la base con energia residua.' : coinMode === 'hunt' ? 'Scrivi il percorso nel main() e raccogli tutte le monete.' : level.maze ? 'Scrivi il percorso nel main(), poi esegui. Puoi consultare le tue funzioni in «Riferimenti».' : initialMessage);
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!access.unlocked) return; clearTrial();
    window.RobotAudio?.effect('run');
    const token = runId, trial = selectedTrial;
    if (coinMode === 'collect') highlightCollectionStep(0);
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    try {
      const functions = RobotEngine.program(level, editor.value, references);
      let preview, failure;
      const options = { ...level, ...previewOptions, ...RobotEngine.collaudoCourse(level,trial) };
      if (coinMode === 'place') changeCoinSeed();
      if (coinMode) Object.assign(options, {coinSeed, coinTiles});
      if (coinMode === 'collect') options.collectionSteps = trial.steps;
      if (checksBattery) options.batteryDemo = true;
      if (checksConsumption) { options.consumptionDemo = true; options.commands = trial.commands; }
      if (checksCoordinates) options.args = trial.args;
      if (hasChargeTrials || checksBattery || checksConsumption) options.energiaIniziale = trial.energia;
      try { preview = RobotEngine.run(functions,level.functionName,previewStart(trial),trial,options); } catch (error) { failure = error; preview = error.preview; }
      if (!failure) { try { RobotEngine.validate(level,functions); } catch (error) { failure = error; } }
      report(checksBattery ? 'Il banco esegue i comandi e verifica la carica…' : checksRecharge ? 'Verifica di ricarica()…' : checksCoordinates ? 'Verifica delle coordinate…' : 'Robot in movimento…');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const frames = preview?.trace.slice(1) || [];
      // Long runs show the first moves and then the actual final state.
      const frameLimit = ['sweep','expedition'].includes(level.coinMode) ? frames.length : 20;
      let consumptionStepIndex = 0;
      for (const frame of frames.slice(0, frameLimit)) {
        if (token !== runId) return;
        if (!reduced) await pause(180);
        if (token !== runId) return;
        if (frame.teleport) actor.classList.add('robot-reset');
        if (checksConsumption) highlightConsumptionStep(consumptionStepIndex++);
        if (coinMode === 'collect') highlightCollectionStep(frame.command === 'raccogliMoneta' ? 1 : 0);
        showTrial(trial,frame);
        const fullyChargedAtStation = hasEnergy && (level.transition || ['sweep','expedition'].includes(level.coinMode)) && frame.energia === level.caricaMassima
          && level.baseTiles.some(([x, y]) => x === frame.x && y === frame.y);
        if (fullyChargedAtStation) {
          report(['sweep','expedition'].includes(level.coinMode) ? `Stazione raggiunta. Batteria ricaricata · ${frame.energia}/${level.caricaMassima}.` : `Tappa 1 di 2 completata. Stazione raggiunta · ${frame.energia}/${level.caricaMassima}. Prossima tappa: la stella.`);
        }
        if (coinMode === 'collect') {
          report(frame.command === 'raccogliMoneta'
            ? (frame.coinCollected ? 'Moneta raccolta: conteggio aumentato di 1.' : 'Casella vuota: conteggio invariato.')
            : 'Il banco fa avanzare il robot di una casella.');
        }
        if (checksConsumption) {
          report(`${frame.command}() · Energia ${frame.energia}/${level.caricaMassima}. Anche le svolte consumano una unità.`);
        }
        if (checksBattery) {
          report(frame.energia === 0 ? 'Batteria scarica. batteriaScarica() restituisce true.'
            : `Comando eseguito. Restano ${frame.energia} unità: la batteria ha ancora carica.`);
        }
        if (checksRecharge) {
          report(frame.teleport ? 'Il robot è tornato alla base. Batteria ripristinata.'
            : frame.energia === 0 ? 'Batteria scarica. Il robot deve tornare alla base.'
            : 'Il robot è carico e resta nella sua casella.');
        }
        if (frame.teleport) {
          void actor.offsetWidth;
          actor.classList.remove('robot-reset');
        }
        window.RobotAudio?.effect('step');
        if (!reduced) await pause(fullyChargedAtStation ? 1200 : checksRecharge && frame.energia === 0 && !frame.teleport ? 1800 : checksBattery ? 300 : 720);
      }
      if (token !== runId) return;
      if (coinMode === 'collect') highlightCollectionStep(-1);
      if (checksConsumption) highlightConsumptionStep(-1);
      if (frames.length > frameLimit) {
        actor.classList.add('robot-reset');
        showTrial(trial, frames.at(-1));
        void actor.offsetWidth;
        actor.classList.remove('robot-reset');
      }
      if (failure) { report(failure.message,'error'); return; }
      let saved = true;
      try { localStorage.setItem(level.progressKey,editor.value); } catch { saved = false; }
      const message = level.success
        || (checksRecharge ? (trial.energia === 0 ? 'Ricarica completata! Il robot è tornato alla base con la batteria piena.' : 'Funzione verificata! Il robot carico resta nella sua casella.')
          : level.number === 17 ? 'Missione completata! Il robot si è fermato sulla stazione ed è in ricarica.'
          : level.number === 9 ? 'Corridoio completato! Sulla mappa trovi la missione Svolta al bordo.'
          : 'Missione completata! Il robot ha raggiunto il traguardo.');
      const result = checksCoordinates || checksBattery || level.returnType === 'bool' ? `Risultato: ${preview.value}. ` : '';
      updateFinishLink();
      report(result + message + (saved ? '' : ' Il browser non ha potuto salvare il progresso.'),'success'); finish.hidden = false;
    } catch (error) { if (token === runId) report(error.message,'error'); }
    finally { if (token === runId) submit.disabled = false; }
  });
  let allowFocusNavigation = false;
  editor.addEventListener('blur', () => { allowFocusNavigation = false; });
  editor.addEventListener('keydown', event => {
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === 'Escape') {
      allowFocusNavigation = true;
      return;
    }
    const navigate = allowFocusNavigation;
    allowFocusNavigation = false;
    if (event.key !== 'Tab' || navigate) return;

    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (event.shiftKey) {
      const lineStart = editor.value.slice(0, start).lastIndexOf('\n') + 1;
      const indent = /^(?:\t| {1,4})/.exec(editor.value.slice(lineStart));
      if (!indent) return;
      editor.setRangeText('', lineStart, lineStart + indent[0].length, 'preserve');
    } else {
      const indent = '    ';
      if (editor.value.length + indent.length > editor.maxLength) return;
      editor.setRangeText(indent, start, start, 'end');
      if (end > start) editor.setSelectionRange(start + indent.length, end + indent.length);
    }
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  });
  editor.addEventListener('input', clearTrial);
  find('#reset-code').addEventListener('click', () => {
    editor.value = starter;
      clearTrial();
    editor.focus();
  });
  clearTrial();
  if (!access.unlocked) {
    const names=access.missing.map(number=>ROBOT_LEVELS[number-1].title).join(' · ');
    find('#level-task').textContent=`Completa prima: ${names}. Puoi scegliere il percorso dalla mappa.`;
    report(`Livello bloccato. Richiede: ${names}.`);
    editor.disabled=true;
    form.querySelectorAll('button').forEach(button=>button.disabled=true);
    directionControls.querySelectorAll('button').forEach(button=>button.disabled=true);
  }
  if (level.number === 1 && access.unlocked) mountRobotTutorial(replayIntro, read);
}

function mountRobotTutorial(replayIntro, read) {
  const find = selector => document.querySelector(selector);
  const introKey = 'robot-level-one-intro-v3';
  const tutorial = find('#robot-tutorial');
  const launcher = find('#robot-tutorial-open');
  const highlight = find('.robot-tour-highlight');
  const card = find('.robot-tour-card');
  const next = find('#robot-tour-next');
  const steps = [
    ['#level-task', 'Consegna', 'Qui leggi cosa deve fare il robot per superare il livello.'],
    ['.robot-hint summary', 'Suggerimenti', 'Apri questo pulsante se ti serve un aiuto per l’esercizio.'],
    ['#robot-api-open', 'Riferimenti', 'Qui trovi le variabili e le funzioni che puoi usare nel livello.'],
    ['#robot-code', 'Editor C++', 'Scrivi la tua istruzione tra le graffe di avanza().'],
    ['#robot-board', 'Banco di prova', 'Qui vedi il robot, il traguardo e il risultato del tuo codice.'],
    ['#robot-form [type="submit"]', 'Esegui e verifica', 'Premi qui quando il codice è pronto. Puoi correggerlo e riprovare.']
  ];
  let step = 0;

  function position() {
    if (tutorial.hidden) return;
    const target = find(steps[step][0]).getBoundingClientRect();
    const { width, height } = card.getBoundingClientRect();
    const gap = 14;
    const clamp = (value, max) => Math.max(gap, Math.min(value, max - gap));
    const centerX = target.left + target.width / 2;
    const centerY = target.top + target.height / 2;
    const vertical = [
      ['below', centerX - width / 2, target.bottom + gap],
      ['above', centerX - width / 2, target.top - height - gap]
    ];
    const horizontal = [
      ['right', target.right + gap, centerY - height / 2],
      ['left', target.left - width - gap, centerY - height / 2]
    ];
    const candidates = step === 1 || step === 2
      ? [...vertical, ...horizontal]
      : [...horizontal, ...vertical];
    const placement = candidates.find(([side, x, y]) =>
      side === 'right' || side === 'left'
        ? x >= gap && x + width <= window.innerWidth - gap
        : y >= gap && y + height <= window.innerHeight - gap);
    const [side, x, y] = placement || ['none', centerX - width / 2, target.bottom + gap];
    const left = clamp(x, window.innerWidth - width);
    const top = clamp(y, window.innerHeight - height);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.dataset.side = side;
    card.style.setProperty('--tour-pointer-x', clamp(centerX - left, width) - card.clientLeft + 'px');
    card.style.setProperty('--tour-pointer-y', clamp(centerY - top, height) + 'px');
    Object.assign(highlight.style, {
      left: target.left - 4 + 'px',
      top: target.top - 4 + 'px',
      width: target.width + 8 + 'px',
      height: target.height + 8 + 'px'
    });
  }

  function showStep() {
    const [selector, title, copy] = steps[step];
    find('.robot-tour-step').textContent = (step + 1) + ' / ' + steps.length;
    find('#robot-tutorial-title').textContent = title;
    find('.robot-tour-copy').textContent = copy;
    next.textContent = step === steps.length - 1 ? 'Fine' : 'Avanti';
    requestAnimationFrame(() => {
      if (tutorial.hidden) return;
      find(selector).scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      position();
    });
  }

  function start() {
    step = 0;
    try { localStorage.setItem(introKey, 'seen'); } catch {}
    tutorial.hidden = false;
    showStep();
    next.focus({ preventScroll: true });
  }

  function finish() {
    tutorial.hidden = true;
    find('#robot-code').focus();
  }

  tutorial.hidden = true;
  launcher.hidden = false;
  launcher.addEventListener('click', start);
  next.addEventListener('click', () => {
    if (step === steps.length - 1) finish();
    else {
      step += 1;
      showStep();
    }
  });
  find('#robot-tour-skip').addEventListener('click', finish);
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !tutorial.hidden) finish();
  });
  if (replayIntro || !read(introKey)) start();
}
const levelParams = new URLSearchParams(window.location.search);
const requestedLevel = Number(levelParams.get('livello') || 1);
mountRobotLevel(ROBOT_LEVELS.find(level => level.number === requestedLevel) || ROBOT_LEVELS[0], levelParams.get('tutorial') === '1');
