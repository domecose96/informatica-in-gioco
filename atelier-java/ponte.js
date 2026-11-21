const bridgeTitle = 'Il ponte sul fiume';
const bridgeRailColor = '#453349';
const bridgeSteps = [
  {
    title: 'Posa l’impalcato',
    instruction: 'Unisci le rive con un rettangolo pieno. Dalla sagoma ricava l’angolo in alto a sinistra e le dimensioni dell’impalcato.',
    hint: 'Leggi le coordinate dei due angoli opposti della sagoma. La differenza fra le x dà la larghezza, quella fra le y l’altezza. Usa fillRect(x, y, larghezza, altezza).',
    color: '#754754',
    goal: 'g.fillRect(22, 96, 206, 8);'
  },
  {
    title: 'Disegna le arcate',
    instruction: 'Disegna tre arcate uguali con la metà superiore di un ovale largo 62 e alto 48. Ricava dalla sagoma la posizione della prima. Per ogni arcata successiva aumenta la x di 64 unità e mantieni la stessa y.',
    hint: 'Per drawArc(), usa la x dell’estremità sinistra e la y del punto più alto. Parti da 0 gradi e usa un’ampiezza di 180 gradi per tracciare la metà superiore.',
    color: '#754754',
    goal: 'g.drawArc(30, 104, 62, 48, 0, 180);\ng.drawArc(94, 104, 62, 48, 0, 180);\ng.drawArc(158, 104, 62, 48, 0, 180);'
  },
  {
    title: 'Aggiungi le traverse',
    instruction: 'Disegna le due traverse orizzontali. Leggi sulla tela le coordinate delle estremità tratteggiate.',
    hint: 'In drawLine(x1, y1, x2, y2), usa la stessa x1 a sinistra e la stessa x2 a destra per entrambe le traverse. Ogni traversa è orizzontale, quindi per quella linea y1 e y2 sono uguali.',
    color: bridgeRailColor,
    goal: 'g.drawLine(25, 82, 225, 82);\ng.drawLine(25, 91, 225, 91);'
  },
  {
    title: 'Completa il parapetto',
    instruction: 'Collega la traversa superiore all’impalcato con sei montanti verticali equidistanti. Ricava dalla sagoma la posizione del primo e dell’ultimo.',
    hint: 'Fra sei montanti ci sono cinque intervalli. Sottrai la x del primo da quella dell’ultimo e dividi per cinque. Usa quel risultato per far crescere la x nel ciclo for, oppure per calcolare le sei posizioni.',
    color: bridgeRailColor,
    goal: 'for (int x = 25; x <= 225; x += 40) {\n  g.drawLine(x, 82, x, 96);\n}'
  },
  {
    title: 'Accendi i lampioni',
    instruction: 'Imposta il giallo caldo (RGB 255, 224, 155). Poi disegna un cerchio pieno di diametro 10 su ciascun palo, centrato nella sagoma.',
    hint: 'Imposta il colore con g.setColor(new Color(255, 224, 155)); prima dei due fillOval(). Per trovare l’angolo del riquadro, sottrai il raggio (5) sia dalla x sia dalla y del centro.',
    retry: 'Controlla di aver impostato il giallo caldo prima di disegnare e verifica le coordinate dei due cerchi.',
    color: bridgeRailColor,
    goal: 'g.setColor(new Color(255, 224, 155));\ng.fillOval(60, 61, 10, 10);\ng.fillOval(180, 61, 10, 10);'
  }
];

const paintingSize = [250, 175];
const drawingCommands = new Map([
  ['fillRect', 4], ['drawLine', 4], ['drawArc', 6], ['fillOval', 4], ['setColor', 1]
]);
const javaColors = new Map([
  ['BLACK', '#000000'], ['WHITE', '#ffffff'], ['GRAY', '#808080'], ['RED', '#ff0000'],
  ['BLUE', '#0000ff'], ['GREEN', '#00ff00'], ['YELLOW', '#ffff00'], ['ORANGE', '#ffc800']
]);

function readDrawingCode(source, cityExercise) {
  if (source.length > 4000) throw new Error('L’editor accetta al massimo 4000 caratteri.');
  const tokens = [];
  const pattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|\s+|\d+|[a-zA-Z_$][\w$]*|\+\+|--|\+=|-=|<=|>=|==|!=|[.(),;{}=+*/%<>-]|./gu;
  let line = 1;
  for (const match of source.matchAll(pattern)) {
    if (!/^(?:\s|\/\/|\/\*)/.test(match[0])) {
      tokens.push({ value: match[0], line });
    }
    line += match[0].split('\n').length - 1;
  }
  let cursor = 0;
  let depth = 0;
  const end = { value: '', line: source.split('\n').length };
  const peek = () => tokens[cursor] ?? end;
  const next = () => tokens[cursor++] ?? end;
  const fail = message => { throw new Error('Riga ' + peek().line + ' · ' + message); };
  const take = value => {
    if (peek().value !== value) fail('manca «' + value + '».');
    return next();
  };
  const optional = value => peek().value === value && Boolean(next());
  const name = () => {
    if (!/^[a-zA-Z_$]/.test(peek().value)) fail('scrivi il nome di una variabile.');
    return next().value;
  };
  function nested(read) {
    if (++depth > 32) fail('riduci il numero di espressioni o blocchi annidati.');
    const result = read();
    depth--;
    return result;
  }
  function atom() {
    if (optional('+')) return nested(atom);
    if (optional('-')) {
      const value = nested(atom);
      return scope => -value(scope);
    }
    if (optional('(')) {
      const value = nested(expression);
      take(')');
      return value;
    }
    if (/^\d+$/.test(peek().value)) {
      const value = Number(next().value);
      if (!Number.isSafeInteger(value) || value > 1000000) fail('numero troppo grande.');
      return () => value;
    }
    const token = peek();
    const variable = name();
    if (cityExercise === 'lights' && variable === 'luciAccese') {
      take('.');
      take('length');
      return () => cityWindows.length;
    }
    return scope => {
      if (!scope.has(variable)) throw new Error('Riga ' + token.line + ' · variabile «' + variable + '» non dichiarata.');
      return scope.get(variable);
    };
  }
  function product() {
    let left = atom();
    while (['*', '/', '%'].includes(peek().value)) {
      const operator = next().value;
      const previous = left;
      const right = atom();
      left = scope => {
        const a = previous(scope);
        const b = right(scope);
        if (operator === '*') return a * b;
        if (b === 0) throw new Error('Divisione per zero.');
        return operator === '/' ? Math.trunc(a / b) : a % b;
      };
    }
    return left;
  }
  function expression() {
    let left = product();
    while (['+', '-'].includes(peek().value)) {
      const operator = next().value;
      const previous = left;
      const right = product();
      left = scope => operator === '+' ? previous(scope) + right(scope) : previous(scope) - right(scope);
    }
    return left;
  }
  function colorExpression() {
    if (cityExercise === 'moonDrawing' && optional('coloreLuna')) return () => cityMoonColor;
    if (optional('new')) {
      take('Color');
      take('(');
      const red = expression();
      take(',');
      const green = expression();
      take(',');
      const blue = expression();
      take(')');
      return scope => {
        const channels = [red(scope), green(scope), blue(scope)];
        if (!channels.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
          throw new Error('I valori RGB devono essere interi tra 0 e 255.');
        }
        return 'rgb(' + channels.join(',') + ')';
      };
    }
    take('Color');
    take('.');
    const color = javaColors.get(peek().value);
    if (!color) fail('costante Color sconosciuta.');
    next();
    return () => color;
  }
  function condition() {
    const left = expression();
    const comparison = peek().value;
    const compare = {
      __proto__: null,
      '<': (a, b) => a < b, '<=': (a, b) => a <= b,
      '>': (a, b) => a > b, '>=': (a, b) => a >= b,
      '==': (a, b) => a === b, '!=': (a, b) => a !== b
    }[comparison];
    if (!compare) fail('scrivi un confronto nella condizione.');
    next();
    const right = expression();
    return scope => compare(left(scope), right(scope));
  }

  function loop() {
    take('(');
    take('int');
    const variable = name();
    take('=');
    const initial = expression();
    take(';');
    const test = condition();
    take(';');
    take(variable);
    const update = next().value;
    if (!['++', '--', '+=', '-=', '='].includes(update)) fail('usa ++, --, +=, -= oppure un’assegnazione per aggiornare il contatore.');
    const increment = ['++', '--'].includes(update) ? () => 1 : expression();
    take(')');
    const body = nested(statement);
    return (scope, run) => {
      const local = new Map(scope);
      local.set(variable, initial(scope));
      while (test(local)) {
        run.tick();
        body(local, run);
        const change = increment(local);
        const current = local.get(variable);
        local.set(variable, update === '=' ? change : ['++', '+='].includes(update) ? current + change : current - change);
      }
    };
  }
  function statement() {
    if (optional('{')) {
      const body = [];
      while (peek().value && peek().value !== '}') body.push(statement());
      take('}');
      return (scope, run) => {
        const local = new Map(scope);
        for (const entry of body) entry(local, run);
      };
    }
    if (optional('for')) return loop();
    if (optional('if')) {
      take('(');
      const test = condition();
      take(')');
      const whenTrue = nested(statement);
      const whenFalse = optional('else') ? nested(statement) : null;
      return (scope, run) => {
        run.tick();
        if (test(scope)) whenTrue(scope, run);
        else whenFalse?.(scope, run);
      };
    }
    if (optional('int')) {
      const variable = name();
      take('=');
      const value = expression();
      take(';');
      return (scope, run) => {
        run.tick();
        scope.set(variable, value(scope));
      };
    }
    if (cityExercise === 'lights' && optional('luciAccese')) {
      take('[');
      const index = expression();
      take(']');
      take('=');
      take('random');
      take('.');
      take('nextBoolean');
      take('(');
      take(')');
      take(';');
      return (scope, run) => {
        run.tick();
        const position = index(scope);
        if (!Number.isInteger(position) || position < 0 || position >= cityWindows.length) {
          throw new Error('L’indice della finestra deve essere tra 0 e ' + (cityWindows.length - 1) + '.');
        }
        run.commands.push(position);
      };
    }
    if (cityExercise === 'moon') {
      const action = name();
      if (action !== 'cambiaLuci' && action !== 'repaint') fail('usa cambiaLuci() o repaint().');
      take('(');
      take(')');
      take(';');
      return (scope, run) => {
        run.tick();
        run.commands.push(action);
      };
    }
    if (cityExercise === 'lights') fail('assegna random.nextBoolean() a un elemento di luciAccese.');
    take('g');
    take('.');
    if (cityExercise === 'moonDrawing' && optional('setPaint')) {
      take('(');
      take('alone');
      take(')');
      take(';');
      return (scope, run) => {
        run.tick();
        run.commands.push(['setPaint', ['alone']]);
      };
    }
    const method = peek().value;
    const argCount = drawingCommands.get(method);
    if (!argCount) fail('comando sconosciuto. Consulta il Manuale.');
    next();
    take('(');
    const args = [];
    for (let i = 0; i < argCount; i++) {
      if (i) take(',');
      args.push(method === 'setColor' ? colorExpression() : expression());
    }
    take(')');
    take(';');
    return (scope, run) => {
      run.tick();
      const values = args.map(arg => arg(scope));
      if (method !== 'setColor' && !values.every(value => Number.isInteger(value) && Math.abs(value) <= 10000)) {
        throw new Error('Usa valori interi tra −10000 e 10000 nei comandi di disegno.');
      }
      run.commands.push([method, values]);
    };
  }
  const statements = [];
  while (peek().value) statements.push(statement());
  let remaining = 512;
  const run = {
    commands: [],
    tick() {
      if (--remaining < 0) throw new Error('Il codice esegue troppi passaggi. Controlla dove si ferma il ciclo.');
    }
  };
  const scope = new Map();
  for (const entry of statements) entry(scope, run);
  return run.commands;
}

function traceDrawingShape(ctx, method, values) {
  const [x, y, w, h, angle, extent] = values;
  ctx.beginPath();
  if (method === 'drawLine') {
    ctx.moveTo(x, y);
    ctx.lineTo(w, h);
  } else if (method === 'fillRect') {
    ctx.rect(x, y, w, h);
  } else if (w > 0 && h > 0) {
    const start = method === 'drawArc' ? -angle * Math.PI / 180 : 0;
    const sweep = method === 'drawArc' ? -Math.max(-360, Math.min(360, extent)) * Math.PI / 180 : 2 * Math.PI;
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, start, start + sweep, sweep < 0);
  }
}

function drawCommands(ctx, commands, color, outline = false) {
  ctx.save();
  ctx.lineWidth = outline ? 1.2 : 2;
  ctx.strokeStyle = ctx.fillStyle = outline ? '#fff4da' : color;
  if (outline) ctx.setLineDash([3, 2]);
  for (const [method, values] of commands) {
    if (method === 'setColor') {
      if (!outline) ctx.strokeStyle = ctx.fillStyle = values[0];
      continue;
    }
    if (method === 'fillRect' && (values[2] <= 0 || values[3] <= 0)) continue;
    traceDrawingShape(ctx, method, values);
    if (outline || method === 'drawLine' || method === 'drawArc') ctx.stroke();
    else ctx.fill();

    if (!outline) continue;
    const [x, y, a, b] = values;
    let points;
    if (method === 'fillRect') points = [[x, y], [x + a, y + b]];
    if (method === 'drawLine') points = [[x, y], [a, b]];
    if (method === 'drawArc') points = [[x, y + b / 2], [x + a / 2, y], [x + a, y + b / 2]];
    if (method === 'fillOval') points = [[x + a / 2, y + b / 2]];
    for (const [column, row] of points) {
      ctx.beginPath();
      ctx.arc(column, row, .85, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBridge(canvas, phase, commands = [], verified = false) {
  const ctx = canvas.getContext('2d');
  const [width, height] = paintingSize;
  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);
  const sky = ctx.createLinearGradient(0, 0, 0, 114);
  sky.addColorStop(0, '#322e55');
  sky.addColorStop(.65, '#b76b79');
  sky.addColorStop(1, '#f6ac7e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f6c38b';
  ctx.beginPath();
  ctx.arc(194, 46, 22, 0, 2 * Math.PI);
  ctx.fill();
  const polygon = (color, points) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.fill();
  };
  polygon('#745172', [[0, 81], [28, 63], [44, 65], [77, 49], [105, 59], [149, 79], [181, 69], [218, 57], [250, 71], [250, 116], [0, 116]]);
  polygon('#52415f', [[0, 92], [36, 86], [82, 87], [127, 92], [145, 89], [187, 83], [210, 86], [250, 79], [250, 117], [0, 117]]);
  const water = ctx.createLinearGradient(0, 107, 0, height);
  water.addColorStop(0, '#796081');
  water.addColorStop(1, '#343957');
  ctx.fillStyle = water;
  ctx.fillRect(0, 108, width, height - 108);
  ctx.fillStyle = '#a98494';
  for (const [x, y, w] of [[14,116,22], [161,120,40], [7,137,44], [131,151,58], [180,143,57], [44,161,58], [23,170,35], [142,167,27], [193,158,41]]) {
    ctx.fillRect(x, y, w, 1);
  }
  polygon('#423447', [[0, 96], [22, 96], [22, 104], [12, 110], [0, 117]]);
  polygon('#423447', [[228, 96], [250, 96], [250, 120], [239, 113], [228, 104]]);
  if (phase >= 1) {
    ctx.fillStyle = '#754754';
    for (const x of [28, 91, 155, 219]) ctx.fillRect(x, 127, 4, 13);
  }
  if (phase >= 4) {
    ctx.fillStyle = bridgeRailColor;
    ctx.fillRect(64, 69, 2, 27);
    ctx.fillRect(184, 69, 2, 27);
  }
  const hasGuide = bridgeDrawing.draw(ctx, phase, commands, verified);
  ctx.restore();
  return hasGuide;
}

const drawingComparison = document.createElement('canvas');
[drawingComparison.width, drawingComparison.height] = paintingSize;
const drawingComparisonContext = drawingComparison.getContext('2d', { willReadFrequently: true });
function drawingPixels(commands, color) {
  drawingComparisonContext.clearRect(0, 0, ...paintingSize);
  drawCommands(drawingComparisonContext, commands, color);
  const { data } = drawingComparisonContext.getImageData(0, 0, ...paintingSize);
  return new Uint32Array(data.buffer);
}
function createDrawingStages(steps) {
  const targets = steps.map(step => readDrawingCode(step.goal));
  const targetPixels = targets.map((commands, index) => drawingPixels(commands, steps[index].color));
  const guides = targets.map((commands, index) => {
    let color = steps[index].color;
    const shapes = [];
    for (const command of commands) {
      if (command[0] === 'setColor') {
        color = command[1][0];
        continue;
      }
      const painted = [];
      drawingPixels([command], color).forEach((pixel, position) => {
        if (pixel !== 0) painted.push([position, pixel]);
      });
      shapes.push({ command, painted });
    }
    return shapes;
  });
  function matchesPixels(index, actual) {
    return targetPixels[index].every((pixel, position) => actual[position] === pixel);
  }
  return {
    matches(index, commands) {
      return matchesPixels(index, drawingPixels(commands, steps[index].color));
    },
    draw(ctx, phase, commands, verified) {
      for (let index = 0; index < phase; index++) {
        drawCommands(ctx, targets[index], steps[index].color);
      }
      if (phase === steps.length) return false;
      const color = steps[phase].color;
      let remaining = [];
      if (!verified) {
        const actual = drawingPixels(commands, color);
        if (!matchesPixels(phase, actual)) {
          remaining = guides[phase].filter(shape =>
            shape.painted.some(([position, pixel]) => actual[position] !== pixel)).map(shape => shape.command);
        }
      }
      drawCommands(ctx, remaining, color, true);
      drawCommands(ctx, commands, color);
      return remaining.length > 0;
    }
  };
}

function finishedBridge() {
  const canvas = document.createElement('canvas');
  canvas.width = paintingSize[0] * 4;
  canvas.height = paintingSize[1] * 4;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', bridgeTitle + ', quadro finito');
  drawBridge(canvas, bridgeSteps.length);
  return canvas;
}

const bridgeDrawing = createDrawingStages(bridgeSteps);
