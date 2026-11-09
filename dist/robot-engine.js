/* Bounded C++ teaching interpreter: student code is parsed, never evaluated as JS. */
const RobotEngine = (() => {
  const key = (name, arity = 0) => arity ? `${name}/${arity}` : name;
  const builtins = ['casellaBase', 'casuale'];
  const readOnlyNames = ['LARGHEZZA', 'ALTEZZA', 'larghezza', 'altezza', 'CARICA_MASSIMA', 'ARRIVO_X', 'ARRIVO_Y', 'NUMERO_MONETE', 'PASSI_PROVA'];
  function parse(source) {
    const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ' ');
    const tokens = code.match(/\s+|[A-Za-z_]\w*|\d+|\+\+|--|\+=|-=|<=|>=|==|!=|&&|\|\||./g).filter(t => !/^\s+$/.test(t));
    let cursor = 0;
    const peek = () => tokens[cursor], take = () => tokens[cursor++];
    function expect(value) { if (take() !== value) throw new Error(`Atteso «${value}». Controlla sintassi e parentesi.`); }
    function identifier() { const name = take(); if (!/^[A-Za-z_]\w*$/.test(name || '') || ['int','bool','void','for','while','do','if','else','return','true','false'].includes(name)) throw new Error('Serve un nome valido.'); return name; }
    const precedence = {'||':1,'&&':2,'==':3,'!=':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
    function expression(min = 0, depth = 0) {
      if (depth > 40) throw new Error('Espressione troppo annidata.');
      let left;
      if (['!','-','+'].includes(peek())) left = {type:'unary',op:take(),operand:expression(7,depth+1)};
      else if (peek() === '(') { take(); left=expression(0,depth+1); expect(')'); }
      else if (/^\d+$/.test(peek() || '')) left={type:'literal',value:Number(take())};
      else if (['true','false'].includes(peek())) left={type:'literal',value:take()==='true'};
      else {
        const name=identifier();
        if (peek()==='(') {
          take(); const args=[];
          if(peek()!==')') { do { args.push(expression(0,depth+1)); if(peek()!==',') break; take(); } while(true); }
          expect(')'); left={type:'call',name,args};
        } else if (['mappa', 'mappaBase', 'monete'].includes(name) && peek() === '[') {
          take(); const row = expression(0, depth + 1); expect(']');
          expect('['); const column = expression(0, depth + 1); expect(']');
          left = {type:'mapCell', name, row, column};
        } else left={type:'variable',name};
      }
      while (precedence[peek()] !== undefined && precedence[peek()] >= min) {
        const op=take(); left={type:'binary',op,left,right:expression(precedence[op]+1,depth+1)};
      }
      return left;
    }
    function assignment(declaration = null) {
      const name=identifier();
      let cell;
      if (!declaration && name === 'monete' && peek() === '[') {
        take(); const row = expression(); expect(']');
        expect('['); const column = expression(); expect(']');
        cell = {row, column};
      }
      const op=take();
      if(!['=','+=','-=','++','--'].includes(op) || (declaration && op!=='=')) throw new Error('Controlla l’assegnazione: usa =, +=, -=, ++ o --.');
      return {type:'assign',name,op,declaration,cell,expression:['++','--'].includes(op)?{type:'literal',value:1}:expression()};
    }
    function block(depth=0) {
      if(depth>12) throw new Error('Troppe parentesi annidate.');
      expect('{'); const body=[];
      while(peek() && peek()!=='}') body.push(statement(depth+1));
      expect('}'); return body;
    }
    const nested = depth => peek()==='{' ? block(depth) : [statement(depth+1)];
    function condition() { expect('('); const result=expression(); expect(')'); return result; }
    function statement(depth) {
      if(depth>24) throw new Error('Troppe istruzioni annidate.');
      if(peek()==='for') {
        take();expect('(');expect('int');const init=assignment('int');expect(';');const test=expression();expect(';');const update=assignment();expect(')');
        return {type:'for',init,condition:test,update,body:nested(depth)};
      }
      if(peek()==='while') {take();const test=condition();return {type:'while',condition:test,body:nested(depth)};}
      if(peek()==='do') {take();const body=nested(depth);expect('while');const test=condition();expect(';');return {type:'do',condition:test,body};}
      if(peek()==='if') {take();const test=condition(), body=nested(depth);let otherwise=[];if(peek()==='else'){take();otherwise=nested(depth);}return {type:'if',condition:test,body,otherwise};}
      if(peek()==='return') {take();const result=peek()===';'?null:expression();expect(';');return {type:'return',expression:result};}
      if(['int','bool'].includes(peek())) {const node=assignment(take());expect(';');return node;}
      if(tokens[cursor+1]==='(') {const node=expression();expect(';');return {type:'expression',expression:node};}
      const node=assignment();expect(';');return node;
    }
    const functions=new Map();
    while(peek()) {
      const type=take();if(!['void','int','bool'].includes(type)) throw new Error('Usa funzioni void, int o bool con una firma valida.');
      const name=identifier(); if(builtins.includes(name)) throw new Error(`${name}() è un lettore fornito dal gioco: non ridefinirlo.`);
      expect('(');const params=[];
      if(peek()!==')') do {const type=take();if(!['int','bool'].includes(type)) throw new Error('I parametri devono essere int o bool.');params.push({type,name:identifier()});if(peek()!==',')break;take();} while(true);
      expect(')');
      if(new Set(params.map(p=>p.name)).size!==params.length) throw new Error('I parametri devono avere nomi distinti.');
      if(name==='main' && (type!=='int'||params.length)) throw new Error('Usa int main() senza parametri.');
      const id=key(name,params.length);if(functions.has(id)) throw new Error(`La funzione ${name}() è definita due volte con gli stessi parametri.`);
      functions.set(id,{name,type,params,body:block()});
    }
    return functions;
  }
  const collectionMain = () => 'int main() {\n    for (int i = 0; i < PASSI_PROVA; i++) {\n        avanzaSicuro();\n        raccogliMoneta();\n    }\n    return 0;\n}';
  function run(functions, entry, start, direction, options = {}) {
    const globals={x:start.x,y:start.y,dx:direction.dx,dy:direction.dy,LARGHEZZA:options.size||5,ALTEZZA:options.size||5};
    // Keep previously saved solutions readable under the old names.
    Object.defineProperties(globals, {
      larghezza: {get: () => globals.LARGHEZZA},
      altezza: {get: () => globals.ALTEZZA}
    });
    if (options.caricaMassima !== undefined) {
      globals.CARICA_MASSIMA = options.caricaMassima;
      globals.energia = options.energiaIniziale ?? (entry === 'ricarica' ? 0 : options.caricaMassima);
    }
    if (options.exposeGoal && options.goal) {
      globals.ARRIVO_X = options.goal.x;
      globals.ARRIVO_Y = options.goal.y;
    }
    const coins = options.coinMode && new Set((options.coinTiles || []).map(([x,y]) => `${x},${y}`));
    let randomState = options.coinSeed ?? 1;
    if (coins) {
      globals.NUMERO_MONETE = options.coinTotal;
      globals.moneteRaccolte = 0;
    }
    const snapshot = () => ({...globals, ...(coins ? {coins:[...coins]} : {})});
    if (options.collectionSteps) globals.PASSI_PROVA = options.collectionSteps;
    const trace=[snapshot()],calls=[],loops=[];
    let steps=0,loopIterations=0,collected=false,usedBackAtBattery=false,movementDepth=0;
    const tiles=options.tiles&&new Set(options.tiles.map(([x,y])=>`${x},${y}`));
    const base=new Set((options.baseTiles||[]).map(([x,y])=>`${x},${y}`));
    const inside=(x,y)=>x>=0&&y>=0&&x<globals.LARGHEZZA&&y<globals.ALTEZZA;
    const convert=(value,type)=>{if(type==='bool')return !!value;const n=Math.trunc(Number(value));if(!Number.isSafeInteger(n)||n < -2147483648||n>2147483647)throw new Error('Il calcolo supera i limiti di un intero.');return n;};
    function budget(){if(++steps>(['sweep','expedition'].includes(options.coinMode) ? 12000 : 4000))throw new Error('Troppe istruzioni: controlla che il ciclo termini.');}
    function lookup(name,scopes){for(let i=scopes.length-1;i>=0;i--)if(Object.hasOwn(scopes[i],name))return scopes[i];if(Object.hasOwn(globals,name))return globals;throw new Error(`La variabile ${name} non è dichiarata.`);}
    function value(node,scopes,depth){
      budget();
      if(node.type==='literal')return node.value;
      if(node.type==='variable')return lookup(node.name,scopes)[node.name];
      if (node.type === 'mapCell') {
        const row = value(node.row, scopes, depth), column = value(node.column, scopes, depth);
        if (!Number.isInteger(row) || !Number.isInteger(column) || !inside(column,row)) {
          throw new Error(`Indice fuori dalla matrice ${node.name}. Controlla riga e colonna.`);
        }
        if (node.name === 'mappaBase') return Number(base.has(`${column},${row}`));
        if (node.name === 'monete') {
          if (!coins) throw new Error('La matrice monete non è disponibile qui.');
          return Number(coins.has(`${column},${row}`));
        }
        return tiles && !tiles.has(`${column},${row}`) ? 1 : 0;
      }
      if(node.type==='call')return call(node.name,node.args.map(a=>value(a,scopes,depth)),depth+1);
      if(node.type==='unary'){const a=value(node.operand,scopes,depth);return node.op==='!'?!a:node.op==='-'?-a:+a;}
      const a=value(node.left,scopes,depth);
      if(node.op==='&&')return !!a&&!!value(node.right,scopes,depth);
      if(node.op==='||')return !!a||!!value(node.right,scopes,depth);
      const b=value(node.right,scopes,depth);
      switch(node.op){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':if(!b)throw new Error('Divisione per zero.');return Math.trunc(a/b);case '%':if(!b)throw new Error('Divisione per zero.');return a%b;case '<':return a<b;case '>':return a>b;case '<=':return a<=b;case '>=':return a>=b;case '==':return a===b;case '!=':return a!==b;}
    }
    function assign(node,scopes,depth,fn){
      if (node.cell) {
        if (!coins || !['distribuisciMonete', 'raccogliMoneta'].includes(fn) || node.op !== '=') {
          throw new Error('Modifica la matrice monete con = nella funzione dedicata.');
        }
        const row = value(node.cell.row, scopes, depth), column = value(node.cell.column, scopes, depth);
        const amount = value(node.expression, scopes, depth);
        if (!inside(column, row) || (amount !== 0 && amount !== 1)) throw new Error('Usa coordinate interne e scrivi 0 oppure 1 nella matrice monete.');
        const cell = `${column},${row}`;
        if (amount === 1) coins.add(cell);
        else coins.delete(cell);
        return;
      }
      const scope=node.declaration?scopes.at(-1):lookup(node.name,scopes);
      if(node.declaration&&Object.hasOwn(scope,node.name))throw new Error(`La variabile ${node.name} esiste già.`);
      if(scope===globals&&readOnlyNames.includes(node.name))throw new Error(`La costante ${node.name} è fornita dal gioco e non si modifica.`);
      if (scope === globals && (fn === 'collaudo' || (fn === 'main' && options.maze))
          && ['x','y','dx','dy','energia'].includes(node.name)) {
        throw new Error('Guida il robot con le funzioni, senza modificare direttamente posizione, direzione o energia.');
      }
      if (scope === globals && node.name === 'moneteRaccolte' && fn !== 'raccogliMoneta') {
        throw new Error('Aggiorna moneteRaccolte dentro raccogliMoneta().');
      }
      const amount=value(node.expression,scopes,depth);
      const result=node.op==='='?amount:Number(scope[node.name])+(['-=','--'].includes(node.op)?-amount:+amount);
      if(node.declaration) scope.__types[node.name]=node.declaration;
      scope[node.name]=convert(result,scope.__types?.[node.name]||'int');
    }
    const local=()=>{const s=Object.create(null);Object.defineProperty(s,'__types',{value:Object.create(null)});return s;};
    function execute(body,scopes,depth,fn){
      for(const node of body){
        budget();
        if(node.type==='return')return {returned:true,value:node.expression?value(node.expression,scopes,depth):undefined};
        if(node.type==='assign')assign(node,scopes,depth,fn);
        if(node.type==='expression')value(node.expression,scopes,depth);
        if(node.type==='if'){const r=execute(value(node.condition,scopes,depth)?node.body:node.otherwise,[...scopes,local()],depth,fn);if(r)return r;}
        if(['for','while','do'].includes(node.type)){
          const nested=[...scopes,local()];if(node.init)assign(node.init,nested,depth,fn);
          const loop={type:node.type,functionName:fn,iterations:0,calls:0};loops.push(loop);const before=calls.length;
          while((node.type==='do'&&loop.iterations===0)||value(node.condition,nested,depth)){
            budget();loopIterations++;loop.iterations++;
            const r=execute(node.body,[...nested,local()],depth,fn);if(r)return r;
            if(node.update)assign(node.update,nested,depth,fn);
          }
          loop.calls=calls.slice(before).filter(name=>name==='avanza').length;
        }
      }
      return null;
    }
    function call(name,args=[],depth=0){
      budget();if(depth>20)throw new Error('Una funzione richiama sé stessa troppe volte.');
      calls.push(name);
      if (name === 'casuale') {
        if (!coins || args.length !== 1 || !Number.isInteger(args[0]) || args[0] <= 0) {
          throw new Error('Usa casuale(limite) con un limite intero positivo nei livelli delle monete.');
        }
        randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
        return Math.floor(randomState / 4294967296 * args[0]);
      }
      if(builtins.includes(name)){
        if(args.length!==2)throw new Error(`${name}() richiede due coordinate.`);
        const [x,y]=args;
        return base.has(`${x},${y}`);
      }
      const fn=functions.get(key(name,args.length));if(!fn)throw new Error(`Manca la funzione ${name}() con ${args.length} parametri.`);
      const scope=local();fn.params.forEach((p,i)=>{scope[p.name]=convert(args[i],p.type);scope.__types[p.name]=p.type;});
      const primitive = !args.length && ['avanza','indietro','giraDestra','giraSinistra'].includes(name);
      const consumesEnergy = options.codeEnergy && primitive && globals.energia !== undefined;
      const outerMovement = movementDepth === 0;
      if (consumesEnergy && outerMovement && globals.energia <= 0) {
        if (['delivery','sweep','expedition'].includes(options.coinMode)) throw new Error('Batteria scarica prima della consegna. Conta anche le svolte e pianifica il passaggio alla base.');
        if (options.number === 25) throw new Error('Batteria scarica prima di raggiungere la base. Il percorso scelto richiede troppa energia: riprova contando anche le svolte.');
        return;
      }
      const movement = !args.length && (name === 'avanza' || name === 'indietro');
      if (movement && !options.codeEnergy && globals.energia <= 0) throw new Error(options.number === 17 ? 'Batteria scarica. Hai al massimo 3 movimenti per raggiungere la base.' : 'Batteria scarica. Usa ricarica() per tornare alla stazione.');
      const before={...globals};
      let result;
      if (consumesEnergy) movementDepth++;
      try { result=execute(fn.body,[scope],depth,name); }
      finally { if (consumesEnergy) movementDepth--; }
      if(primitive && (!consumesEnergy || outerMovement)){
        const {x,y,dx,dy}=globals;
        if(Math.abs(dx)+Math.abs(dy)!==1)throw new Error('La direzione deve essere un passo orizzontale o verticale di una casella.');
        if(options.size&&!inside(x,y))throw new Error(`Il robot esce dalla griglia in (${x}, ${y}).`);
        if(tiles&&!tiles.has(`${x},${y}`))throw new Error(`Muro in (${x}, ${y}): cambia percorso.`);
        if(options.battery&&x===options.battery.x&&y===options.battery.y)collected=true;
        if(name==='indietro'&&options.battery&&before.x===options.battery.x&&before.y===options.battery.y&&(x!==before.x||y!==before.y))usedBackAtBattery=true;
        if(trace.length>=65)throw new Error('Troppi movimenti: accorcia il percorso e controlla i cicli.');
        if (movement && !options.codeEnergy && options.caricaMassima !== undefined && (x !== before.x || y !== before.y)) globals.energia--;
        if (consumesEnergy) {
          call('consumaEnergia', [], depth + 1);
          if ((options.transition || options.rechargeOnEntry) && (x !== before.x || y !== before.y) && base.has(`${x},${y}`)) {
            globals.energia = globals.CARICA_MASSIMA;
          }
        }
        trace.push({...snapshot(),collected,command:name});
      }
      if (coins && name === 'raccogliMoneta' && globals.moneteRaccolte !== before.moneteRaccolte) {
        trace.push({...snapshot(), command:name});
      }
      if (name === 'ricarica') trace.push({...globals, command:name, teleport:globals.x !== before.x || globals.y !== before.y});
      if(fn.type!=='void'&&!(name==='main'&&!result)){
        if(!result||result.value===undefined)throw new Error(`${name}() deve restituire un valore con return.`);
        return convert(result.value,fn.type);
      }
      return name==='main'?0:undefined;
    }
    let returned;
    try {
      if (['hunt','sweep','expedition'].includes(options.coinMode)) {
        let scattered = false;
        for (let attempt = 0; attempt < 16; attempt++) {
          coins.clear();
          call('distribuisciMonete');
          checkDistribution(options, start, snapshot());
          if (!['sweep','expedition'].includes(options.coinMode) || coinsScattered([...coins])) {
            scattered = true;
            break;
          }
        }
        if (!scattered) throw new Error('Distribuisci le monete su righe e colonne diverse usando casuale().');
        trace[0] = snapshot();
      }
      if (options.batteryDemo) {
        const route = ['avanza','avanza','avanza','avanza','giraSinistra','avanza','giraSinistra',
          'avanza','avanza','avanza','avanza','giraDestra','avanza','giraDestra','avanza','avanza'];
        let commandIndex = 0;
        while (globals.energia > 0) {
          if (commandIndex >= route.length) throw new Error('consumaEnergia() deve diminuire energia di 1 per comando.');
          call(route[commandIndex++]);
          if (call(entry) !== (globals.energia === 0)) throw new Error('batteriaScarica() deve controllare energia senza modificarla.');
        }
        returned = call(entry);
      }
      if (options.consumptionDemo) {
        for (const command of options.commands || [options.command || 'avanza']) call(command);
      }
      else if (options.coinMode === 'collect' && options.collectionSteps) {
        const suppliedMain = parse(collectionMain()).get('main');
        const originalMain = functions.get('main');
        functions.set('main', suppliedMain);
        try { returned = call('main'); }
        finally {
          if (originalMain) functions.set('main', originalMain);
          else functions.delete('main');
        }
      }
      else if (!options.batteryDemo) returned = call(entry, options.args || []);
      if (options.coinMode === 'place') checkDistribution(options, start, snapshot());
    } catch (error) { error.preview = {trace, ...globals}; throw error; }
    if(trace.length===1)trace.push({...snapshot(),collected});
    return {...snapshot(),trace,calls,loops,loopIterations,collected,usedBackAtBattery,value:returned};
  }
  const blank = (name, level = {}) => name === 'main' ? 'int main() {\n    // Scrivi qui le chiamate ai comandi.\n    \n    return 0;\n}' : `${level.returnType || 'void'} ${name}(${level.parameters || ''}) {\n    \n}`;
  function extractFunction(source, name, arity = 0) {
    const clean=source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,text=>text.replace(/[^\n]/g,' '));
    const pattern=new RegExp(`(?:void|int|bool)\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{`,'g');
    let match;
    while((match=pattern.exec(clean))) {
      const count=match[1].trim()?match[1].split(',').length:0;
      if(count!==arity)continue;
      let end=pattern.lastIndex,depth=1;
      while(end<clean.length&&depth){if(clean[end]==='{')depth++;if(clean[end]==='}')depth--;end++;}
      if(!depth)return source.slice(match.index,end);
    }
    return null;
  }
  function starter(level, levels, read) {

    if (level.number === 2) return read(levels[0].progressKey) || blank('avanza');
    if (level.referenceHelpers) return blank(level.functionName, level);
    const helpers = (level.helpers || []).map(number => {
      const previous = levels[number - 1];
      try {
        const source = read(previous.progressKey);
        if (source) return extractFunction(source, previous.functionName) || blank(previous.functionName);
      } catch { /* Fall back to an editable stub if storage is unavailable. */ }
      return blank(previous.functionName);
    });
    return [...helpers, blank(level.functionName, level)].join('\n\n');
  }
  function referenceFunctions(level, levels, read, fallback = '') {
    if (!level.referenceHelpers && !level.advanced) return [];
    const required = level.helpers || [];
    const previousLevels = level.advanced
      ? levels.filter(previous => previous.number !== 1 && !previous.maze
          && !(previous.functionName === level.functionName && (previous.arity || 0) === (level.arity || 0))
          && Number(previous.displayNumber) < Number(level.displayNumber))
        .sort((a, b) => Number(a.displayNumber) - Number(b.displayNumber))
      : required.map(number => levels[number - 1]);
    const references = previousLevels.flatMap(previous => {
      let code = extractFunction(read(previous.progressKey) || '', previous.functionName, previous.arity || 0)
        || extractFunction(fallback, previous.functionName, previous.arity || 0);
      if (!code && !required.includes(previous.number)) return [];
      const executionCode = code;
      if (code && level.codeEnergy && !previous.arity
          && ['avanza','indietro','giraDestra','giraSinistra'].includes(previous.functionName)) {
        const opening = code.indexOf('{'), closing = code.lastIndexOf('}');
        const body = code.slice(opening + 1, closing).trim().split('\n').map(line => '        ' + line.trim()).join('\n');
        code = code.slice(0, opening) + '{\n    if (energia > 0) {\n' + body
          + '\n        consumaEnergia();\n    }\n}';
      }
      return [{ executionCode, displayNumber: previous.displayNumber, label: `${previous.functionName}(${(previous.parameters || '').replace(/\b(?:int|bool)\s+/g, '')})`, name: previous.functionName, arity: previous.arity || 0, code, number: previous.number }];
    });
    return [...new Map(references.map(reference => [key(reference.name, reference.arity), reference])).values()];
  }
  function program(level, source, references = []) {
    const functions = parse(source);
    if (level.coinMode === 'collect' && functions.has('main')) {
      if (JSON.stringify(functions.get('main')) !== JSON.stringify(parse(collectionMain()).get('main'))) {
        throw new Error('Mantieni il main() del banco e completa raccogliMoneta().');
      }
      functions.delete('main');
    }
    if (!level.referenceHelpers && !level.advanced) return functions;
    if (functions.size !== 1 || !functions.has(key(level.functionName, level.arity))) {
      throw new Error(`Nell’editor scrivi solo ${level.functionName}(): gli altri comandi sono già disponibili nei suggerimenti.`);
    }
    for (const reference of references) {
      if (!reference.code) throw new Error(`Manca la funzione salvata ${reference.name}(). Completa il livello ${reference.displayNumber} per usarla in questo livello.`);
      const id = key(reference.name, reference.arity);
      functions.set(id, parse(reference.executionCode || reference.code).get(id));
    }
    return functions;
  }
  function trialStart(level, {dx, dy}) {
    if (level.start) return level.start;
    const center = Math.floor(level.size / 2);
    const room = level.forwardRoom || 0;
    const coordinate = step => Math.max(-step * room, Math.min(center, level.size - 1 - step * room));
    return {x: coordinate(dx), y: coordinate(dy)};
  }

  function validate(level, functions) {
    const entryFunction = functions.get(key(level.functionName, level.arity));
    const returnType = level.returnType || (level.functionName === 'main' ? 'int' : 'void');
    if (entryFunction?.type !== returnType) {
      throw new Error(`Mantieni la firma ${returnType} ${level.functionName}(${level.parameters || ''}).`);
    }
    if (level.checkpoint) return validateCheckpoint(level, functions);
    if (level.coinMode) return validateCoins(level, functions);
    if (level.advanced) return validateAdvanced(level, functions);
    const directions = level.maze ? [level.checks[0]] : level.checks;
    const starts = level.number >= 2 && level.number <= 5 ? [{x:2,y:2}, {x:1,y:3}] : [null];
    const results = [];
    // Functions built earlier must keep working; editing a helper cannot bypass a maze.
    for (const number of level.helpers || []) {
      if (number >= 10) { validateAdvanced(levelCatalogue()[number - 1], functions); continue; }
      const helper = ['','','avanza','indietro','giraDestra','giraSinistra'][number];
      if (!functions.has(helper)) throw new Error(`Mantieni anche la funzione ${helper}() già costruita.`);
      for (const direction of level.checks) checkPrimitive(number, functions, helper, {x:2,y:2}, direction);
    }
    for (const fixedStart of starts) for (const trial of directions) {
      const start = fixedStart || trialStart(level, trial);
      let result;
      if (level.number <= 5) result = checkPrimitive(level.number, functions, level.functionName, start, trial);
      else {
        const entry = functions.get(level.functionName).body;
        result = run(functions, level.functionName, start, trial, level.maze ? level : {size:level.size});
        const goal = level.goal || {x:start.x+2*trial.dx,y:start.y+2*trial.dy};
        if (result.x !== goal.x || result.y !== goal.y) throw new Error(`Il robot arriva a (${result.x}, ${result.y}). Il traguardo è (${goal.x}, ${goal.y}).`);
        if (level.number === 6 && (result.dx !== trial.dx || result.dy !== trial.dy || result.calls.filter(name => ['avanza','indietro','giraDestra','giraSinistra'].includes(name)).join(',') !== 'avanza,giraDestra,avanza,indietro,giraSinistra,avanza')) throw new Error('Segui le sei chiamate del collaudo nell’ordine richiesto, mantenendo l’orientamento iniziale.');
        if (level.battery && (!result.collected || !result.usedBackAtBattery)) throw new Error('Raccogli la batteria ed esci dal vicolo usando indietro(), poi raggiungi la stella.');
        if (level.number === 20) {
          const loop = result.loops.find(item => item.type === 'for' && item.functionName === 'main'
            && item.iterations === 4 && item.calls === 4);
          if (!loop || !hasNode(entry, 'if')) throw new Error('Usa un for di quattro passi e un if per decidere quando svoltare.');
          let checked = false;
          for (const call of result.calls) {
            if (call === 'dentroGriglia') checked = true;
            if (call === 'avanza') {
              if (!checked) throw new Error('Controlla la prossima casella con dentroGriglia() prima di ogni passo.');
              checked = false;
            }
          }
        }
        if (level.number === 9 && result.loops.filter(loop => loop.type === 'for' && loop.functionName === 'main' && loop.calls === 6).length !== 2) throw new Error('Usa due cicli for per ripetere i passi: uno per ciascun tratto del corridoio.');
      }
      results.push({trial, start, ...result});
    }
    if (level.number === 25) {
      const result = results[0];
      if (!hasNode(functions.get('main').body, 'while') && !hasNode(functions.get('main').body, 'do')) throw new Error('Usa un ciclo con i sensori per guidare il percorso.');
      if (!result.calls.includes('davantiLibero') || !result.calls.includes('cellaBase')) throw new Error('Controlla il primo tratto con davantiLibero() e l’arrivo con cellaBase().');
      if (result.energia !== 0 || result.calls.filter(name => name === 'consumaEnergia').length !== 6) throw new Error('Raggiungi la base usando soltanto 5 passi e una svolta, senza consumare energia due volte.');
    }
    if ([26, 27].includes(level.number)) {
      const entry = functions.get('main').body;
      const result = results[0];
      if (!hasNode(entry, 'while')) throw new Error('Usa un ciclo while per guidare il robot con i sensori.');
      if (!result.calls.includes('batteriaScarica')) throw new Error('Riusa batteriaScarica() per controllare la carica.');
      if (level.number === 26 && !result.calls.includes('davantiLibero')) throw new Error('Usa davantiLibero() per seguire il corridoio.');
      if (level.number === 26) {
        if (result.energia !== 0) throw new Error('Il robot deve fermarsi quando la carica arriva a zero.');
        for (const energiaIniziale of [0, 1, 3, 6]) {
          const preview = run(functions, 'main', level.start, level.checks[0], {...level, energiaIniziale});
          const expected = energiaIniziale <= 4 ? {x:energiaIniziale,y:4} : {x:4,y:3};
          if (preview.x !== expected.x || preview.y !== expected.y || preview.energia !== 0
              || preview.calls.filter(name => ['avanza','indietro','giraDestra','giraSinistra'].includes(name)).length !== energiaIniziale) throw new Error('Controlla la batteria prima di ogni comando: la carica iniziale può cambiare.');
        }
      } else {
        if (!result.calls.includes('arrivato')) throw new Error('Usa arrivato() per fermarti sulla stella.');
        if (!hasNode(entry,'if') || !result.calls.includes('ricarica')) throw new Error('Controlla la batteria con un if e richiama ricarica() quando è scarica.');
        if (!result.trace.some(frame=>frame.teleport && frame.x===0 && frame.y===4 && frame.energia===12) || result.energia !== 9) throw new Error('Ricarica alla base prima di ripartire: dopo tre passi devono restare 9 unità.');
        for (const goal of [level.goal, {x:2,y:4}]) {
          const charged = run(functions,'main',{x:0,y:4},level.checks[0],{...level,goal,energiaIniziale:12});
          if (charged.calls.includes('ricarica')) throw new Error('Se il robot è già carico, parti senza richiamare ricarica().');
          if (charged.x !== goal.x || charged.y !== goal.y || charged.energia !== 12 - goal.x) {
            throw new Error('Fermati sulla stella anche quando cambia posizione. Usa arrivato().');
          }
        }
      }
    }
    if (level.number >= 31) validateAutonomousMission(level, functions);
    if ([16, 17, 21].includes(level.number)) validateSensorMission(level, functions);
    return results;
  }
  function checkPrimitive(number, functions, name, start, trial) {
    const result = run(functions, name, start, trial);
    let target = {...start, dx:trial.dx, dy:trial.dy};
    if (number <= 2) { target.x += trial.dx; target.y += trial.dy; }
    if (number === 3) { target.x -= trial.dx; target.y -= trial.dy; }
    if (number === 4) { target.dx = -trial.dy; target.dy = trial.dx; }
    if (number === 5) { target.dx = trial.dy; target.dy = -trial.dx; }
    if (['x','y','dx','dy'].some(key => result[key] !== target[key])) throw new Error(`${name}(), verso ${trial.name}: attesi x=${target.x}, y=${target.y}, dx=${target.dx}, dy=${target.dy}; ottenuti x=${result.x}, y=${result.y}, dx=${result.dx}, dy=${result.dy}.`);
    return result;
  }
  const levelCatalogue = () => typeof ROBOT_LEVELS !== 'undefined' ? ROBOT_LEVELS : require('./robot-levels.js').ROBOT_LEVELS;
  function hasNode(nodes, type) { return nodes.some(n=>n.type===type || (n.body&&hasNode(n.body,type)) || (n.otherwise&&hasNode(n.otherwise,type))); }
  function previewOptions(level) {
    if (level.number === 10) return {size:level.size,args:[level.forwardRoom]};
    if (level.number === 12) return {size:level.size,args:[2,2]};
    return {size:level.size,tiles:level.tiles,baseTiles:level.baseTiles,battery:level.battery};
  }
  function coinsScattered(cells) {
    const points = cells.map(cell => cell.split(',').map(Number));
    const columns = points.map(point => point[0]), rows = points.map(point => point[1]);
    return Math.max(...columns) - Math.min(...columns) >= 2
      && Math.max(...rows) - Math.min(...rows) >= 2;
  }
  function checkDistribution(level, start, result) {
    const allowed = new Set(level.tiles.map(tile => tile.join(',')));
    const excluded = new Set([...level.baseTiles.map(tile => tile.join(',')), `${start.x},${start.y}`]);
    if (result.coins.length !== level.coinTotal || result.moneteRaccolte !== 0
        || result.coins.some(cell => !allowed.has(cell) || excluded.has(cell))) {
      throw new Error('Piazza tre monete su caselle libere e diverse, fuori dalla partenza e dalla base.');
    }
    if (['x','y'].some(key => result[key] !== start[key])
        || result.energia !== (level.energiaIniziale ?? level.caricaMassima)) {
      throw new Error('La distribuzione deve lasciare invariati posizione e batteria.');
    }
  }

  function validateCoins(level, functions) {
    const trial = level.checks[0];
    if (level.coinMode === 'expedition') {
      return [1, 58, 2027, 813].map(coinSeed => {
        const result = run(functions, 'main', level.start, trial, {...level, coinSeed});
        if (result.coins.length || result.moneteRaccolte !== level.coinTotal) {
          throw new Error('Esplora anche le deviazioni e raccogli tutte le monete prima di concludere.');
        }
        if (result.x !== level.goal.x || result.y !== level.goal.y) {
          throw new Error('Dopo la raccolta raggiungi la stella: la base di ricarica è una tappa diversa.');
        }
        if (!result.calls.includes('arrivato') || !result.calls.includes('davantiLibero')
            || !result.loops.some(loop => loop.functionName === 'main' && loop.iterations > 0)) {
          throw new Error('Riusa i sensori e arrivato() in un ciclo per esplorare e riconoscere il traguardo.');
        }
        return result;
      });
    }
    if (level.coinMode === 'sweep') {
      return [1, 58, 2027, 813].map(coinSeed => {
        const result = run(functions, 'main', level.start, trial, {...level, coinSeed});
        const visited = new Set(result.trace.map(frame => `${frame.x},${frame.y}`));
        if (result.coins.length || result.moneteRaccolte !== level.coinTotal || visited.size !== level.tiles.length) {
          throw new Error('Esplora tutte le righe a serpentina e raccogli ogni moneta, anche quando cambia posizione.');
        }
        const destination = level.goal || {x:level.size-1,y:0};
        if (result.x !== destination.x || result.y !== destination.y) {
          throw new Error('Completa la serpentina e fermati in alto a destra.');
        }
        const movements = result.trace.filter(frame => frame.command === 'avanza' || frame.command === 'indietro');
        const route = [];
        for (let row = level.size - 1; row >= 0; row--) {
          const headingRight = (level.size - 1 - row) % 2 === 0;
          const columns = Array.from({length:level.size}, (_, column) => headingRight ? column : level.size - 1 - column);
          for (const column of columns) {
            if ((row === level.start.y && column === level.start.x)
                || !level.tiles.some(([x,y]) => x === column && y === row)) continue;
            route.push(`${column},${row}`);
          }
        }
        if (movements.map(frame => `${frame.x},${frame.y}`).join(';') !== route.join(';')) {
          throw new Error('Segui le righe a serpentina fino all’angolo in alto a destra.');
        }
        if (!result.loops.some(loop => loop.functionName === 'main' && loop.iterations > 0)) {
          throw new Error('Riusa un ciclo per ripetere i passi e la raccolta lungo le righe.');
        }
        return result;
      });
    }
    if (level.coinMode === 'delivery') {
      const result = run(functions, 'main', level.start, trial, level);
      if (result.coins.length || result.moneteRaccolte !== level.coinTotal) {
        throw new Error('Raccogli tutte le monete prima di consegnarle alla base.');
      }
      if (result.x !== level.goal.x || result.y !== level.goal.y || result.energia <= 0) {
        throw new Error('Termina la consegna alla base con energia ancora disponibile.');
      }
      return [result];
    }
    if (level.coinMode === 'collect') {
      const start = {x:level.start.x + 1, y:level.start.y};
      const cell = [start.x, start.y], elsewhere = [start.x + 1, start.y];
      const repeat = new Map(functions);
      repeat.set('main', parse('int main() { raccogliMoneta(); raccogliMoneta(); return 0; }').get('main'));
      return [false, true].map(hasCoin => {
        const coinTiles = hasCoin ? [cell, elsewhere] : [elsewhere];
        const result = run(repeat, 'main', start, trial, {...level, coinTiles});
        if (result.moneteRaccolte !== Number(hasCoin) || result.coins.join(';') !== elsewhere.join(',')
            || result.x !== start.x || result.y !== start.y || result.dx !== trial.dx || result.dy !== trial.dy
            || result.energia !== level.caricaMassima) {
          throw new Error('Rimuovi solo la moneta sotto il robot e contala una sola volta. Il robot deve restare fermo.');
        }
        return result;
      });
    }
    const results = [1, 58, 2027].map(coinSeed => {
      const result = run(functions, level.functionName, level.start, trial, {...level, coinSeed});
      if (level.coinMode === 'place') {
        if (!result.calls.includes('casuale') || result.dx !== trial.dx || result.dy !== trial.dy) {
          throw new Error('Usa casuale() per scegliere le coordinate, senza ruotare il robot.');
        }
      } else if (result.coins.length || result.moneteRaccolte !== level.coinTotal
          || result.trace.at(-1).command !== 'raccogliMoneta' || !result.loops.some(loop => loop.functionName === 'main' && loop.iterations > 0)) {
        throw new Error('Usa un ciclo e raccogliMoneta(). Fermati appena hai raccolto tutte le monete.');
      }
      return result;
    });
    if (level.coinMode === 'place' && new Set(results.map(result => result.coins.slice().sort().join(';'))).size < 2) {
      throw new Error('Usa i valori estratti per cambiare la disposizione delle monete.');
    }
    return results;
  }
  function validateAdvanced(level, functions) {
    const fn=functions.get(key(level.functionName,level.arity));
    if(!fn || fn.type!==(level.returnType||'void'))throw new Error(`Mantieni la firma ${level.returnType||'void'} ${level.functionName}(${level.parameters||''}).`);
    const results=[];
    function test(start,trial,options,expected) {
      const r=run(functions,level.functionName,start,trial,options);
      for(const [field,value] of Object.entries(expected))if(r[field]!==value){
        if (level.number === 22 && options.energiaIniziale > 0) {
          throw new Error(`Robot carico (energia = ${options.energiaIniziale}): ricarica() deve lasciare invariati posizione e batteria. Controlla energia prima di cercare la base.`);
        }
        throw new Error(`${level.functionName}(): prova non superata (${field}: atteso ${value}, ottenuto ${r[field]}). Controlla anche bordi e casi limite.`);
      }
      results.push({trial,start,...r});return r;
    }
    const dirs=level.checks, center={x:4,y:4};
    if (level.functionName === 'arrivato') {
      for (const goal of [level.goal, {x:1,y:4}]) {
        for (const start of [goal, {x:0,y:goal.y}, {x:goal.x,y:0}, {x:0,y:0}]) {
          test(start,dirs[0],{...level,goal},{...start,dx:dirs[0].dx,dy:dirs[0].dy,value:start.x===goal.x && start.y===goal.y});
        }
      }
    } else if ([28,29].includes(level.number)) {
      for (const trial of dirs) for (const blocked of [false,true]) {
        const side = level.number === 28 ? {dx:-trial.dy,dy:trial.dx} : {dx:trial.dy,dy:-trial.dx};
        const point = {x:2+side.dx,y:2+side.dy};
        const tiles=Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).filter(([x,y])=>!blocked||x!==point.x||y!==point.y);
        const result=test({x:2,y:2},trial,{size:5,tiles,codeEnergy:true,caricaMassima:12,energiaIniziale:12},
          {x:2,y:2,dx:trial.dx,dy:trial.dy,energia:12,value:!blocked});
        if (!result.calls.includes('casellaLibera')) throw new Error('Riusa casellaLibera() per osservare il lato senza girare il robot.');
      }
      for (const trial of dirs) {
        const side = level.number === 28 ? {dx:-trial.dy,dy:trial.dx} : {dx:trial.dy,dy:-trial.dx};
        const start={x:side.dx===1?4:side.dx===-1?0:2,y:side.dy===1?4:side.dy===-1?0:2};
        test(start,trial,{size:5,codeEnergy:true,caricaMassima:12,energiaIniziale:12},{...start,dx:trial.dx,dy:trial.dy,energia:12,value:false});
      }
    } else if (level.number === 30) {
      for (const trial of dirs) for (const open of [[1,1,1,1],[0,1,1,1],[0,0,1,1],[0,0,0,1],[0,0,0,0]]) for (const energiaIniziale of [0,1,2,12]) {
        const offsets=[[-trial.dy,trial.dx],[trial.dx,trial.dy],[trial.dy,-trial.dx],[-trial.dx,-trial.dy]];
        const tiles=[[2,2],...offsets.flatMap(([dx,dy],i)=>open[i]?[[2+dx,2+dy]]:[])];
        const options={size:5,tiles,codeEnergy:true,caricaMassima:12,energiaIniziale};
        const expected=automaticStep({x:2,y:2,dx:trial.dx,dy:trial.dy,energia:energiaIniziale},options);
        const result=test({x:2,y:2},trial,options,expected.state);
        if (JSON.stringify(movementTrace(result.trace))!==JSON.stringify(movementTrace(expected.trace))) throw new Error('Rispetta la priorità destra, avanti, sinistra e dietrofront, poi prova un solo passo.');
        if (!result.calls.includes('batteriaScarica')) throw new Error('Controlla batteriaScarica() prima di scegliere il passo.');
        if (energiaIniziale>0 && (!result.calls.includes('destraLibera') || !result.calls.includes('avanzaSicuro'))) throw new Error('Riusa i sensori laterali e avanzaSicuro() invece di riscriverli.');
      }
    } else if (level.number === 24) {
      for (const energiaIniziale of [12, 9, 6, 3, 1, 0]) {
        test({x:2,y:2}, dirs[0], {size:5, caricaMassima:12, energiaIniziale, codeEnergy:true},
          {x:2,y:2,dx:dirs[0].dx,dy:dirs[0].dy,energia:Math.max(0,energiaIniziale-1)});
      }
    } else if(level.number===10) {
      for(const trial of dirs)for(const steps of [0,1,level.forwardRoom]){
        const start = trialStart(level, trial);
        const r=test(start,trial,{size:level.size,args:[steps]},{x:start.x+steps*trial.dx,y:start.y+steps*trial.dy,dx:trial.dx,dy:trial.dy});
        if(steps>1&&(!r.loops.length||r.calls.filter(n=>n==='avanza').length<steps+1))throw new Error('Riusa avanza() dentro un ciclo che dipende dal parametro passi.');
      }
    } else if(level.number===11) {
      for(const trial of dirs){const r=test(center,trial,{size:9},{...center,dx:-trial.dx,dy:-trial.dy});if(r.calls.filter(n=>n==='giraDestra'||n==='giraSinistra').length<2)throw new Error('Combina le rotazioni già costruite per fare il dietrofront.');}
    } else if(level.number===12) {
      for(const size of [5,7])for(const [x,y] of [[0,0],[size-1,size-1],[-1,0],[0,-1],[size,1],[1,size],[2,3]])test({x:2,y:2},dirs[0],{size,args:[x,y]},{x:2,y:2,dx:1,dy:0,value:x>=0&&y>=0&&x<size&&y<size});
    } else if ([18, 19].includes(level.number)) {
      for (const size of [5, 7]) {
        for (const [x, y] of [[2, 3], [3, 2], [size - 1, size - 1], [-1, 0], [size, 1], [1, -1], [1, size]]) {
          const inside = x >= 0 && x < size && y >= 0 && y < size;
          if (level.number === 19 && !inside) continue;
          const wall = size === 5 ? [3, 2] : [2, 3];
          const tiles = Array.from({length: size * size}, (_, i) => [i % size, Math.floor(i / size)])
            .filter(([col, row]) => col !== wall[0] || row !== wall[1]);
          const isWall = x === wall[0] && y === wall[1];
          const result = test({x:2,y:2}, dirs[0], {size, tiles, args:[x,y]},
            {x:2,y:2,dx:1,dy:0,value:level.number === 19 ? isWall : inside && !isWall});
          if (level.number === 18 && (!result.calls.includes('dentroGriglia') || (inside && !result.calls.includes('cellaMuro')))) {
            throw new Error('Usa dentroGriglia() e consulta cellaMuro() per i punti interni.');
          }
        }
      }
    } else if(level.number===13||level.number===14) {
      for(const trial of dirs)for(const blocked of [false,true]){
        const start={x:2,y:2},ahead={x:2+trial.dx,y:2+trial.dy};
        const tiles=Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).filter(([x,y])=>!blocked||x!==ahead.x||y!==ahead.y);
        const movement=level.number===14&&!blocked;
        const r=test(start,trial,{size:5,tiles},{x:movement?ahead.x:2,y:movement?ahead.y:2,dx:trial.dx,dy:trial.dy,...(level.number===13?{value:!blocked}:{})});
        if(!r.calls.includes(level.number===13?'casellaLibera':'davantiLibero'))throw new Error('Riusa la funzione di controllo già costruita.');
      }
      for(const trial of dirs){const start={x:trial.dx===1?4:trial.dx===-1?0:2,y:trial.dy===1?4:trial.dy===-1?0:2};test(start,trial,{size:5},{...start,dx:trial.dx,dy:trial.dy,...(level.number===13?{value:false}:{})});}
      if(level.number===14&&!hasNode(fn.body,'if'))throw new Error('Usa if per decidere quando far avanzare il robot.');
    } else if (level.number === 23) {
      for (const energiaIniziale of [12, 11, 9, 6, 3, 1, 0]) {
        test(level.start, dirs[0], {size:level.size, caricaMassima:12, energiaIniziale},
          {...level.start,dx:1,dy:0,energia:energiaIniziale,value:energiaIniziale === 0});
      }
    } else if (level.number === 22) {
      for (const [caricaMassima, x, y] of [[12,1,0], [9,4,4], [6,0,1]]) {
        const result = test(level.start, dirs[0], {size:level.size, caricaMassima, energiaIniziale:0, baseTiles:[[x,y]]},
          {x,y,energia:caricaMassima,dx:1,dy:0});
        if (!result.calls.includes('cellaBase')) throw new Error('Usa cellaBase() per trovare la stazione di ricarica.');
        for (const energiaIniziale of [1, 3, caricaMassima]) {
          test(level.start, dirs[0], {size:level.size, caricaMassima, energiaIniziale, baseTiles:[[x,y]]},
            {...level.start,energia:energiaIniziale,dx:1,dy:0});
        }

      }
    } else if(level.number===15) {
      for (const baseTiles of [level.baseTiles, [[2,1]], [[4,4]]]) {
        for (const [x,y] of [[1,2],[2,2],[3,2],[2,1],[4,4],[0,0]]) {
          const expected = baseTiles.some(([column,row]) => column === x && row === y);
          test({x:2,y:2}, dirs[0], {size:5, baseTiles, args:[x,y]}, {x:2,y:2,dx:1,dy:0,value:expected});
        }
      }
    }
    return results;
  }
  const movementTrace = trace => trace.filter(frame=>frame.command && frame.command!=='ricarica').map(({x,y,dx,dy,energia})=>({x,y,dx,dy,energia}));
  function automaticStep(initial, options) {
    const state={...initial},trace=[];
    const tiles=new Set(options.tiles.map(([x,y])=>`${x},${y}`));
    const free=(dx,dy)=>tiles.has(`${state.x+dx},${state.y+dy}`);
    if(state.energia<=0)return {state,trace};
    const right=free(-state.dy,state.dx),forward=free(state.dx,state.dy),left=free(state.dy,-state.dx);
    const turns=right?['right']:forward?[]:left?['left']:['right','right'];
    for(const turn of turns)if(state.energia>0){const {dx,dy}=state;state.dx=turn==='right'?-dy:dy;state.dy=turn==='right'?dx:-dx;state.energia--;trace.push({...state,command:'turn'});}
    if (state.energia > 0 && free(state.dx, state.dy)) {
      state.x += state.dx;
      state.y += state.dy;
      state.energia--;
      if ((options.transition || options.rechargeOnEntry) && options.baseTiles.some(([x, y]) => x === state.x && y === state.y)) {
        state.energia = options.caricaMassima;
      }
      trace.push({...state, command:'avanza'});
    }
    return {state,trace};
  }
  function automaticRoute(start, options) {
    let state = start;
    const trace = [];
    for (let i = 0; i < 20; i++) {
      if (state.x === options.goal.x && state.y === options.goal.y) return trace;
      const step = automaticStep(state, options);
      if (!step.trace.length) break;
      state = step.state;
      trace.push(...step.trace);
    }
    throw new Error('La pista di verifica non è percorribile con la carica disponibile.');
  }
  function validateCheckpoint(level, functions) {
    const body = functions.get('main').body;
    if (!hasNode(body,'while') && !hasNode(body,'do')) throw new Error('Usa un ciclo per ripetere il movimento con i controlli già costruiti.');
    const results = [];
    if (level.checkpoint === 'sensors') {
      let start = level.start, goal = level.goal, tiles = level.tiles;
      for (const trial of level.checks) {
        const result = run(functions,'main',start,trial,{...level,tiles,goal});
        if (result.x !== goal.x || result.y !== goal.y) throw new Error('Percorri entrambi i tratti del corridoio e fermati sulla stella.');
        if (!result.calls.includes('davantiLibero') || !result.calls.includes('avanzaSicuro') || !result.calls.includes('giraSinistra')) throw new Error('Riusa davantiLibero(), avanzaSicuro() e giraSinistra() nel corridoio.');
        results.push({trial,start,...result});
        const rotate = ({x,y}) => ({x:4-y,y:x});
        start = rotate(start); goal = rotate(goal);
        tiles = tiles.map(([x,y]) => { const p = rotate({x,y}); return [p.x,p.y]; });
      }
    } else {
      for (const energiaIniziale of [0,1,12]) for (const goal of [level.goal,{x:3,y:4}]) {
        const result = run(functions,'main',level.start,level.checks[0],{...level,energiaIniziale,goal});
        if (result.x !== goal.x || result.y !== goal.y || result.energia !== 12-(goal.x-1)) throw new Error('Ricaricati alla stazione e fermati sulla stella, anche quando la carica iniziale o il traguardo cambiano.');
        if (!hasNode(body,'if') || !result.calls.includes('batteriaScarica') || !result.calls.includes('arrivato') || !result.calls.includes('avanzaSicuro')) throw new Error('Riusa batteriaScarica(), arrivato() e avanzaSicuro(). Un if gestisce la ricarica iniziale.');
        const recharges = result.calls.filter(name => name === 'ricarica').length;
        if (recharges !== (energiaIniziale===0 ? 1 : 0)) throw new Error('Richiama ricarica() soltanto quando il robot è scarico.');
        results.push({trial:level.checks[0],start:level.start,...result});
      }
    }
    return results;
  }
  function validateAutonomousMission(level, functions) {
    const entry=functions.get('main').body;
    if(!hasNode(entry,'while')&&!hasNode(entry,'do'))throw new Error('Ripeti il controllo e il movimento in un ciclo fino al traguardo.');
    const preview=run(functions,'main',level.start,level.checks[0],level);
    if(!level.exposeGoal && !preview.calls.includes('cellaBase'))throw new Error('Usa cellaBase(x, y) per riconoscere l’arrivo.');
    if (level.exposeGoal && !preview.calls.includes('arrivato')) throw new Error('Usa arrivato() per fermarti sulla stella.');
    const required=level.number===31?['destraLibera']:level.number===32?['sinistraLibera']:level.number===33?['destraLibera','davantiLibero','sinistraLibera','giraIndietro']:['passoAutomatico'];
    if(required.some(name=>!preview.calls.includes(name)))throw new Error(`Riusa ${required.map(name=>name+'()').join(', ')} per guidare questa missione.`);
    if(level.number<=32){
      let start={...level.start},goal={...level.goal},tiles=level.tiles;
      let baseTiles=level.baseTiles;
      for(let turn=0;turn<4;turn++){
        const direction=[{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0},{dx:0,dy:-1}][turn];
        const result=run(functions,'main',start,direction,{...level,tiles,goal,baseTiles});
        const [baseX,baseY] = baseTiles[0];
        const stepsAfterStation = Math.abs(baseX - goal.x) + Math.abs(baseY - goal.y);
        const remainingEnergy = level.caricaMassima - stepsAfterStation - 1; // Un quarto di giro.
        if(result.x!==goal.x||result.y!==goal.y||result.energia!==remainingEnergy)throw new Error('Usa il sensore laterale rispetto all’orientamento del robot: il percorso può ruotare.');
        const rotate=({x,y})=>({x:4-y,y:x});
        start=rotate(start);goal=rotate(goal);
        const rotateTiles = points => points.map(([x,y])=>{const p=rotate({x,y});return[p.x,p.y];});
        tiles=rotateTiles(tiles);
        baseTiles=rotateTiles(baseTiles);
      }
    } else {
      const variants = [level];
      if (level.number === 37) {
        variants.push({...level, goal:{x:4,y:1}}, {...level, goal:{x:2,y:2}});
      } else if (!level.transition) {
        variants.push({...level, start:{x:0,y:4}, goal:{x:2,y:2}, tiles:levelCatalogue()[32].tiles, baseTiles:levelCatalogue()[32].baseTiles});
      }
      for(const options of variants){
        const {dx,dy}=options.checks[0];
        const expected = automaticRoute({...options.start,dx,dy,energia:options.energiaIniziale}, options);
        const result=run(functions,'main',options.start,options.checks[0],options);
        if(result.x!==options.goal.x||result.y!==options.goal.y||JSON.stringify(movementTrace(result.trace))!==JSON.stringify(movementTrace(expected)))throw new Error('Segui la regola della destra a ogni decisione e fermati appena raggiungi il traguardo.');
      }
    }
    if(level.number===35){
      if(!hasNode(entry,'if')||!preview.calls.includes('batteriaScarica')||preview.calls.includes('ricarica'))throw new Error('Controlla la batteria prima del percorso e richiama ricarica() soltanto quando è scarica.');
      if (!preview.calls.includes('arrivato')) throw new Error('Usa arrivato() per riconoscere il traguardo dopo la ricarica.');
      const activeLoops = preview.loops.filter(loop => loop.functionName === 'main' && loop.iterations > 0);
      if (activeLoops.length < 2 || !preview.calls.includes('cellaBase')) {
        throw new Error('Dividi il percorso in due cicli. Usa cellaBase(x, y) per fermare il primo alla stazione, poi raggiungi la stella con il secondo.');
      }
      const empty=run(functions,'main',level.start,level.checks[0],{...level,energiaIniziale:0});
      const [baseX,baseY]=level.baseTiles[0];
      const visitedStation = preview.trace.some(frame =>
        frame.x === baseX && frame.y === baseY && frame.energia === level.caricaMassima);
      if (!visitedStation) throw new Error('Anche con la batteria carica devi passare dalla stazione prima di raggiungere la stella.');
      const rechargeFrame=empty.trace.find(frame=>frame.command==='ricarica');
      if(empty.calls.filter(name=>name==='ricarica').length!==1
          || !rechargeFrame?.teleport || rechargeFrame.x!==baseX || rechargeFrame.y!==baseY
          || rechargeFrame.energia!==level.caricaMassima) {
        throw new Error('Con batteria scarica usa ricarica() per raggiungere la stazione e ripristinare la carica.');
      }
      const expectedAfterRecharge = automaticRoute(rechargeFrame, level);
      if (empty.x !== level.goal.x || empty.y !== level.goal.y || !empty.calls.includes('passoAutomatico')
          || JSON.stringify(movementTrace(empty.trace)) !== JSON.stringify(movementTrace(expectedAfterRecharge))) {
        throw new Error('Dopo la ricarica, riparti dalla stazione e raggiungi il traguardo usando passoAutomatico().');
      }
    }
  }
  function validateSensorMission(level, functions) {
    const kind=level.number===16?'while':'do';
    if(!hasNode(functions.get('main').body,kind))throw new Error(`Usa il ciclo ${kind==='do'?'do…while':'while'} richiesto dalla missione.`);
    for(const length of (level.number === 17 ? [1,2,3] : kind === "do" ? [1,3,5] : [0,1,3,5])) {
      const distance=kind==='do'?Math.max(1,length):length;
      const start={x:0,y:6},trial=level.checks[0];
      const roadLength = distance + (level.number === 17 ? 2 : 1);
      const options={number:level.number,caricaMassima:level.caricaMassima,energiaIniziale:level.energiaIniziale,size:7,tiles:Array.from({length:roadLength},(_,x)=>[x,6]),baseTiles:level.number === 17 ? [[distance,6]] : []};
      const r=run(functions,'main',start,trial,options);
      if(r.x!==distance||r.y!==6)throw new Error('Il percorso cambia lunghezza: usa il sensore come condizione, senza fissare il numero di passi.');
      const loop=r.loops.find(loop=>loop.type===kind&&loop.functionName==='main');
      if(!loop||loop.iterations!==distance||loop.calls!==distance)throw new Error('Il ciclo deve guidare ogni passo e fermarsi quando cambia la risposta del sensore.');
      const sensor = ({16:'casellaLibera', 17:'cellaBase', 21:'davantiLibero'})[level.number];
      if(!r.calls.includes(sensor))throw new Error(`Usa ${sensor}() per controllare il ciclo.`);
    }
  }
  return { collectionMain, parse, run, starter, validate, blank, extractFunction, referenceFunctions, program, previewOptions, trialStart };
})();
if (typeof module !== 'undefined') module.exports = RobotEngine;
