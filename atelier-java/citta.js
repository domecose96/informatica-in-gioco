const cityTitle = 'La città di notte';
const cityMoon = { x: 212, y: 28, radius: 14 };
const haloRadius = 24;
const cityHaloValues = [cityMoon.x, cityMoon.y, haloRadius].map(String);

function cityHaloMatches(values) {
  return cityHaloValues.every((value, index) => value === values?.[index]);
}
const cityMoonColor = 'rgb(244,226,184)';
const haloOval = [cityMoon.x - haloRadius, cityMoon.y - haloRadius, haloRadius * 2, haloRadius * 2];
const moonOval = [cityMoon.x - cityMoon.radius, cityMoon.y - cityMoon.radius, cityMoon.radius * 2, cityMoon.radius * 2];
const cityBuildings = [
  [20, 67, 60, 89], [95, 47, 60, 109], [170, 59, 60, 97]
];
const cityWindowColor = '#28354d';
const cityLightColor = '#ffd58a';
const cityWindows = cityBuildings.flatMap(([x, y]) =>
  Array.from({ length: 12 }, (_, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    return [x + 9 + column * 16, y + 13 + row * 16, 10, 9];
  })
);
const cityWindowCode = cityBuildings.map(([x, y]) => {
  const draw = 'g.fillRect(' + (x + 9) + ' + colonna * 16, ' + (y + 13) + ' + riga * 16, 10, 9);';
  return 'for (int riga = 0; riga < 4; riga++) {\n'
    + '    for (int colonna = 0; colonna < 3; colonna++) {\n'
    + '        ' + draw + '\n'
    + '    }\n}';
}).join('\n\n');

const cityMoonDrawingStep = 2;
const cityButtonStep = 3;
const cityLightsStep = 4;
const cityListenerStep = 5;
function cityListenerCode(line = '') {
  return 'luna.addActionListener(evento -> {\n    ' + line + '\n    repaint();\n});';
}

function restoreCityListener(body) {
  if (typeof body !== 'string') return undefined;
  const oldListener = /^\s*luna\s*\.\s*addActionListener\s*\([^{}]*->\s*\{([\s\S]*)\}\s*\)\s*;\s*$/.exec(body);
  const sharedListener = /^\s*ActionListener\s+cambia\s*=\s*[^{}]*->\s*\{([\s\S]*?)\}\s*;/.exec(body);
  const lines = (oldListener?.[1] ?? sharedListener?.[1] ?? body).trim()
    .replace(/^\/\/ Prima aggiorna le luci, poi ridisegna\s*$/, '')
    .replace(/(?:^|(?<=;))\s*repaint\s*\(\s*\)\s*;\s*$/, '')
    .trim();
  return cityListenerCode(lines.replace(/\n/g, '\n    '));
}

const citySteps = [
  {
    title: 'Costruisci i palazzi',
    instruction: 'Disegna tre rettangoli pieni fino alla strada. Sono larghi 60 unità. Leggi dalla sagoma i due angoli opposti di ciascun palazzo per ricavarne la posizione e l’altezza.',
    hint: 'In fillRect(x, y, larghezza, altezza), x e y indicano l’angolo in alto a sinistra. Sottrai la y del tetto dalla y della strada per calcolare l’altezza.',
    color: '#33405e',
    goal: cityBuildings.map(rect => 'g.fillRect(' + rect.join(', ') + ');').join('\n')
  },
  {
    title: 'Disponi le finestre',
    instruction: 'Ogni palazzo ha quattro piani e tre finestre per piano. Disegna rettangoli di 10 × 9 unità. Parti dall’angolo in alto a sinistra della prima finestra di ogni palazzo. Aumenta x di 16 per ogni colonna verso destra e y di 16 per ogni piano verso il basso.',
    hint: 'Leggi sulla tela l’angolo in alto a sinistra della prima finestra di ciascun palazzo. Fai un for per i piani e, al suo interno, un for per le colonne. Usa gli indici moltiplicati per 16.',
    color: cityWindowColor,
    goal: cityWindowCode
  },
  {
    title: 'Disegna la luna e l’alone',
    instruction: 'Leggi le coordinate del puntino al centro della sagoma e riportale nei campi x e y. Nel campo r scrivi metà del diametro dell’alone (48). Usa g.setPaint(alone) e fillOval() per disegnare l’alone. Poi imposta il colore con g.setColor(coloreLuna) e disegna il disco di diametro 28.',
    hint: 'Leggi x e y sul punto al centro della sagoma e dividi il diametro dell’alone per due. In ogni fillOval() parti dall’angolo in alto a sinistra del riquadro, che trovi sottraendo il raggio a x e y del centro.',
    exercise: 'moonDrawing',
    goal: 'g.setPaint(alone);\ng.fillOval(' + haloOval.join(', ') + ');\n'
      + 'g.setColor(coloreLuna);\ng.fillOval(' + moonOval.join(', ') + ');'
  },
  {
    title: 'Posiziona il pulsante della luna',
    instruction: 'Crea un JButton chiamato luna con etichetta "Luna". Usa luna.setBounds() con gli stessi quattro argomenti del fillOval() del disco, il cerchio più piccolo. Il gioco sovrappone il pulsante trasparente al disco. Nel passaggio finale lo userai per cambiare le luci con un clic sulla luna. Cerca setBounds nel Manuale per vedere come funziona in Swing.',
    hint: 'Crea il pulsante con JButton luna = new JButton("Luna");. In luna.setBounds(x, y, larghezza, altezza) riusa il riquadro del cerchio più piccolo.',
    exercise: 'button',
    goal: 'JButton luna = new JButton("Luna");\nluna.setBounds(' + moonOval.join(', ') + ');'
  },
  {
    title: 'Scegli le luci a caso',
    instruction: 'Completa il ciclo di cambiaLuci(). Usa il generatore random e l’array luciAccese, già pronti. Per ognuna delle 36 finestre, salva il risultato di random.nextBoolean(). Quando premi Verifica, la tela disegna in giallo le finestre con true e in scuro quelle con false.',
    hint: 'luciAccese[i] è il posto in cui salvare lo stato della finestra corrente. A ogni giro del ciclo, assegnagli il valore restituito da random.nextBoolean().',
    exercise: 'lights',
    readyCode: `import java.util.Random;

// Campo della classe per generare valori casuali.
// random.nextBoolean() restituisce true o false a caso.
Random random = new Random();

// Un valore booleano per finestra. All’inizio sono tutti false.
boolean[] luciAccese = new boolean[36];

// Durante il disegno, i indica la finestra corrente.
// Il gioco sceglie il colore della finestra prima di chiamare fillRect().
if (luciAccese[i]) {
    g.setColor(new Color(255, 213, 138)); // Finestra accesa
} else {
    g.setColor(new Color(40, 53, 77));    // Finestra spenta
}`,
    starter: 'for (int i = 0; i < luciAccese.length; i++) {\n    // Scegli lo stato di questa finestra\n}',
    goal: 'for (int i = 0; i < luciAccese.length; i++) {\n    luciAccese[i] = random.nextBoolean();\n}'
  },
  {
    title: 'Collega la luna',
    instruction: 'Collega il pulsante della luna al metodo del passaggio 5, richiamandolo prima di repaint(). Premi Verifica, poi clicca sulla luna per vedere se le luci cambiano.',
    hint: 'Quale metodo hai completato nel passaggio precedente per scegliere lo stato delle finestre? Il clic deve aggiornare quello stato prima che repaint() ridisegni la tela.',
    exercise: 'moon',
    starter: cityListenerCode(),
    goal: cityListenerCode('cambiaLuci();')
  }
];
const cityDrawing = createDrawingStages(citySteps.slice(0, 2));
let cityLightPattern = cityWindows.map(() => false);

function cityButtonMatches(code) {
  const source = code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ' ')
    .replace(/^\s*import\s+javax\s*\.\s*swing\s*\.\s*JButton\s*;/, '');
  const button = /(^|;)\s*JButton\s+luna\s*=\s*new\s+JButton\s*\(\s*"Luna"\s*\)\s*;/;
  const bounds = /(^|;)\s*luna\s*\.\s*setBounds\s*\(/;
  const declaration = button.exec(source);
  const placement = bounds.exec(source);
  if (!declaration || !placement || declaration.index >= placement.index) return false;

  const drawing = source.replace(button, '$1 ').replace(bounds, '$1 g.fillRect(');
  const commands = readDrawingCode(drawing);
  return commands.length === 1 && commands[0][0] === 'fillRect'
    && moonOval.every((value, index) => commands[0][1][index] === value);
}

function matchesMoonOval(command, oval) {
  return command?.[0] === 'fillOval' && oval.every((value, index) => command[1][index] === value);
}

function hasMoonHalo(commands) {
  return commands[0]?.[0] === 'setPaint' && matchesMoonOval(commands[1], haloOval);
}

function hasMoonColor(command) {
  return command?.[0] === 'setColor' && command[1][0] === cityMoonColor;
}

function hasMoonDisk(commands) {
  return hasMoonColor(commands[2]) && matchesMoonOval(commands[3], moonOval);
}

function cityMoonDrawingIssue(commands) {
  if (commands[0]?.[0] !== 'setPaint') return 'Prima di disegnare l’alone, seleziona la sfumatura con g.setPaint(alone).';
  if (!hasMoonHalo(commands)) return 'Controlla il fillOval() dell’alone. Il cerchio grande ha diametro 48 ed è centrato sul puntino della sagoma.';
  if (!hasMoonColor(commands[2])) return 'Dopo l’alone, imposta il colore del disco con g.setColor(coloreLuna).';
  if (!hasMoonDisk(commands)) return 'Controlla il fillOval() del disco della luna. Il cerchio piccolo ha diametro 28 e ha lo stesso centro dell’alone.';
  return commands.length === 4 ? '' : 'Lascia le due istruzioni per l’alone e le due per il disco della luna.';
}

function cityExerciseMatches(exercise, commands) {
  if (exercise === 'moonDrawing') {
    return !cityMoonDrawingIssue(commands);
  }
  if (exercise === 'lights') {
    return commands.length === cityWindows.length && new Set(commands).size === cityWindows.length;
  }
  const actions = commands.join(',');
  return actions === 'cambiaLuci,repaint';
}

function shuffleCityLights(code) {
  const positions = readDrawingCode(code, 'lights');
  for (const index of positions) cityLightPattern[index] = Math.random() < .5;
}

function drawCity(canvas, phase, commands = [], verified = false, interactive = false, haloReady = false) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(canvas.width / paintingSize[0], canvas.height / paintingSize[1]);
  const sky = ctx.createLinearGradient(0, 0, 0, 156);
  sky.addColorStop(0, '#101729');
  sky.addColorStop(.6, '#263651');
  sky.addColorStop(1, '#49516a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ...paintingSize);
  ctx.fillStyle = '#a9b5c6';
  for (const [x, y] of [[16,24], [35,42], [48,16], [72,33], [83,13], [126,15], [151,26], [177,17], [235,52], [237,17]]) {
    ctx.fillRect(x, y, 1, 1);
  }
  const moonFinished = phase > cityMoonDrawingStep || (phase === cityMoonDrawingStep && verified);
  const drawingMoon = phase === cityMoonDrawingStep && !verified;
  const showHalo = moonFinished || (drawingMoon && haloReady && hasMoonHalo(commands));
  const showDisk = moonFinished || (showHalo && hasMoonDisk(commands));
  const { x, y, radius } = cityMoon;

  if (showHalo) {
    const halo = ctx.createRadialGradient(x, y, haloRadius / 2, x, y, haloRadius);
    halo.addColorStop(0, '#f4e2b84f');
    halo.addColorStop(1, '#f4e2b800');
    drawCommands(ctx, [['fillOval', haloOval]], halo);
  }
  if (showDisk) {
    drawCommands(ctx, [['fillOval', moonOval]], cityMoonColor);
    ctx.fillStyle = '#e8d3aa';
    ctx.beginPath();
    ctx.arc(x - 4, y + 4, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#25324b';
  for (const rect of [[0,109,14,47], [73,94,24,62], [147,103,25,53], [225,88,25,68]]) ctx.fillRect(...rect);
  ctx.fillStyle = '#1d263c';
  ctx.fillRect(0, 156, 250, 19);
  ctx.fillStyle = '#5a637a';
  ctx.fillRect(0, 156, 250, 1);
  ctx.fillStyle = '#444c62';
  for (let x = 10; x < 250; x += 24) ctx.fillRect(x, 167, 12, 1);

  let hasGuide;
  if (phase >= cityMoonDrawingStep) {
    cityDrawing.draw(ctx, 2, [], true);
    for (const [index, window] of cityWindows.entries()) {
      ctx.fillStyle = interactive && cityLightPattern[index] ? cityLightColor : cityWindowColor;
      ctx.fillRect(...window);
    }
    const guides = [];
    if (drawingMoon && !showHalo) guides.push(['fillOval', haloOval]);
    if (drawingMoon && !showDisk) guides.push(['fillOval', moonOval]);
    hasGuide = guides.length > 0;
    if (hasGuide) {
      drawCommands(ctx, guides, '#f4e2b8', true);
      ctx.fillStyle = '#f4e2b8';
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    hasGuide = cityDrawing.draw(ctx, phase, commands, verified);
  }
  ctx.restore();
  return hasGuide;
}

function finishedCity() {
  const canvas = document.createElement('canvas');
  canvas.width = paintingSize[0] * 4;
  canvas.height = paintingSize[1] * 4;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', cityTitle + ', quadro finito');
  const completed = isFrameCompleted(frames[2]);
  canvas.toggleAttribute('data-city-interactive', completed);
  drawCity(canvas, citySteps.length, [], true, completed);
  return canvas;
}

function createCityMoon() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'city-moon';
  button.hidden = true;
  button.setAttribute('aria-label', 'Luna. Cambia le luci della città');
  button.addEventListener('click', () => runCityMoon(button));
  return button;
}
