const ticketTitle = 'La biglietteria del museo';
const ticketPrices = new Map([['Intero', 6], ['Ridotto', 4]]);
const ticketOptions = [...ticketPrices.keys()].map(label => '"' + label + '"').join(', ');

const ticketSteps = [
  {
    title: 'Prepara la finestra',
    instruction: 'Crea un JFrame di nome finestra con titolo "Biglietteria". Crea un JPanel di nome pannello e aggiungilo alla finestra. Le dimensioni saranno calcolate da pack(), già fornito in «Codice già pronto».',
    hint: 'JFrame crea la finestra. JPanel crea il contenitore dei campi. Usa finestra.add(pannello) per metterlo nella finestra.',
    readyCode: `import javax.swing.*;
import java.awt.GridLayout;

// Dopo aver aggiunto i componenti alla finestra:
finestra.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
finestra.pack();
finestra.setVisible(true);`,
    legacyStarter: '// Crea la finestra e il pannello, poi collegali.',
    goal: `JFrame finestra = new JFrame("Biglietteria");
JPanel pannello = new JPanel();
finestra.add(pannello);`,
    retry: 'Controlla il titolo della finestra e i nomi finestra e pannello. Aggiungi il pannello con finestra.add(pannello).'
  },
  {
    title: 'Imposta la griglia',
    instruction: 'Imposta sul pannello un GridLayout di 3 righe e 2 colonne. La tela mostrerà i sei posti per i componenti.',
    hint: 'Crea un GridLayout passando prima il numero di righe, poi il numero di colonne. Passalo a pannello.setLayout().',
    legacyStarter: '// Imposta la griglia.\n\n// Aggiungi etichetta e menu, poi etichetta e campo.',
    goal: 'pannello.setLayout(new GridLayout(3, 2));',
    retry: 'In questa tappa basta una riga. Usa setLayout() sul pannello e controlla che la griglia abbia 3 righe e 2 colonne.'
  },
  {
    title: 'Aggiungi il menu dei biglietti',
    instruction: 'Completa il menu tipo con le opzioni "Intero" e "Ridotto", in quest’ordine. Aggiungi al pannello l’etichetta "Biglietto" e poi il menu.',
    hint: 'Scrivi le due opzioni tra virgolette, separate da una virgola, dentro le parentesi graffe. Per riempire la prima riga, usa pannello.add() prima con una nuova JLabel e poi con tipo.',
    starter: 'JComboBox<String> tipo = new JComboBox<>(new String[]{/* opzioni */});',
    goal: `JComboBox<String> tipo = new JComboBox<>(new String[]{${ticketOptions}});
pannello.add(new JLabel("Biglietto"));
pannello.add(tipo);`,
    retry: 'Controlla le due opzioni del menu. Aggiungi prima la JLabel con testo "Biglietto", poi tipo.'
  },
  {
    title: 'Aggiungi il campo quantità',
    instruction: 'Crea un JTextField di nome quantita con una larghezza preferita di 5 colonne, circa 5 caratteri. Aggiungi al pannello l’etichetta "Quantità" e poi il campo, così occupano la seconda riga.',
    hint: 'pannello.add() riempie la prima cella libera. La prima riga è già occupata dal menu e dalla sua etichetta. Aggiungi prima la nuova JLabel e poi quantita per riempire la seconda riga.',
    goal: `JTextField quantita = new JTextField(5);
pannello.add(new JLabel("Quantità"));
pannello.add(quantita);`,
    retry: 'Controlla il nome quantita e la larghezza di 5 colonne. Aggiungi prima la JLabel con testo "Quantità", poi quantita.'
  },
  {
    title: 'Aggiungi il pulsante e il totale',
    instruction: 'Crea un JButton di nome calcola con etichetta "Calcola" e una JLabel di nome totale con il testo "Totale: —" oppure "Totale: -". Aggiungili al pannello in questo ordine, così occupano l’ultima riga.',
    hint: 'Crea il pulsante con new JButton(...), come per la luna. Crea il testo del totale con new JLabel(...), poi aggiungili al pannello. Il pulsante comparirà sul monitor e gli darai un’azione nel passaggio successivo.',
    legacyStarter: '// Crea calcola e totale, poi aggiungili al pannello.',
    goal: `JButton calcola = new JButton("Calcola");
JLabel totale = new JLabel("Totale: —");
pannello.add(calcola);
pannello.add(totale);`,
    retry: 'Controlla i tipi, i nomi e i testi dei due componenti. Aggiungi prima calcola e poi totale.'
  },
  {
    title: 'Collega il clic al calcolo',
    instruction: 'Completa il codice del pulsante Calcola. Leggi il biglietto selezionato e il numero scritto nel campo. Moltiplica il prezzo di un biglietto per quel numero e mostra il risultato con setText(). Premi Verifica, poi prova Intero con quantità 3. Il tuo codice deve mostrare 18 € e il gioco animerà la stampa dei tre biglietti.',
    hint: 'quantita.getText() restituisce un testo. Passalo a Integer.parseInt() per ottenere il numero da moltiplicare per il prezzo.',
    readyCode: `// Intero costa ${ticketPrices.get('Intero')} €, Ridotto costa ${ticketPrices.get('Ridotto')} €.
static int prezzoDi(String biglietto) {
    return biglietto.equals("Intero") ? ${ticketPrices.get('Intero')} : ${ticketPrices.get('Ridotto')};
}`,
    starter: `calcola.addActionListener(evento -> {
    String biglietto = /* leggi il menu */;
    int numero = /* leggi il campo e converti in intero */;
    int prezzo = prezzoDi(biglietto);
    int importo = /* calcola il totale */;
    // Aggiorna l’etichetta totale.
});`,
    goal: `calcola.addActionListener(evento -> {
    String biglietto = (String) tipo.getSelectedItem();
    int numero = Integer.parseInt(quantita.getText());
    int prezzo = prezzoDi(biglietto);
    int importo = prezzo * numero;
    totale.setText("Totale: " + importo + " €");
});`,
    retry: 'Controlla le quattro operazioni nel listener. Leggi il menu, converti la quantità, moltiplica e aggiorna totale con setText().'
  }
];

function javaCodeTokens(source) {
  // Mantiene intatti i testi Swing e ignora solo commenti e spazi tra token.
  const pattern = /"(?:\\.|[^"\\\n])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\s+|[\p{L}\p{N}_$]+|->|./gu;
  return [...source.matchAll(pattern)].map(match => match[0])
    .filter(token => !/^(?:\s|\/\/|\/\*)/.test(token));
}

const unavailableLabelNames = new Set(`
  abstract assert boolean break byte case catch char class const continue default do double else enum
  extends final finally float for goto if implements import instanceof int interface long native new
  package private protected public return short static strictfp super switch synchronized this throw throws
  transient try void volatile while true false null _
  finestra pannello tipo quantita calcola totale evento
`.trim().split(/\s+/));

function matchesSeparateTicketLabel(actual, goal) {
  const label = /(?:^|; )(?:final )?JLabel ([\p{L}_$][\p{L}\p{N}_$]*) = new JLabel \( "Biglietto" \) ;/u.exec(actual);
  if (!label || unavailableLabelNames.has(label[1])) return false;

  const [menu, , addMenu] = goal.split('\n');
  const declaration = label[0].replace(/^; /, '');
  const addLabel = `pannello.add(${label[1]});`;
  return [
    [menu, declaration, addLabel, addMenu],
    [declaration, menu, addLabel, addMenu],
    [declaration, addLabel, menu, addMenu]
  ].some(statements => javaCodeTokens(statements.join(' ')).join(' ') === actual);
}

function ticketCodeMatches(index, source) {
  const goal = ticketSteps[index].goal;
  const actual = javaCodeTokens(source).join(' ');
  if (javaCodeTokens(goal).join(' ') === actual) return true;
  if (index === 2) return matchesSeparateTicketLabel(actual, goal);
  if (index === 4) return javaCodeTokens(goal.replace('Totale: —', 'Totale: -')).join(' ') === actual;
  if (index === ticketSteps.length - 1) {
    return javaCodeTokens(goal.replace('prezzo * numero', 'numero * prezzo')).join(' ') === actual;
  }
  return false;
}

const ticketProgressVersion = 2;

function restoreTicketProgress(saved) {
  if (saved.ticketVersion === ticketProgressVersion) return saved;
  if (saved.index === 1 && saved.verified) {
    const legacyGoal = [
      ticketSteps[1].goal,
      ...ticketSteps[2].goal.split('\n').slice(1),
      ...ticketSteps[3].goal.split('\n').slice(1)
    ].join('\n');
    if (javaCodeTokens(saved.code).join(' ') === javaCodeTokens(legacyGoal).join(' ')) {
      return { ...saved, index: 3, code: ticketSteps[3].goal };
    }
  }
  return saved.index === 2 || saved.index === 3 ? { ...saved, index: saved.index + 2 } : saved;
}

function ticketPart(className, text = '') {
  const part = document.createElement('span');
  part.className = className;
  part.textContent = text;
  return part;
}

function buildTicketDesk(desk, screen) {
  const computer = ticketPart('ticket-computer');
  const monitor = ticketPart('ticket-monitor');
  monitor.append(screen);
  computer.append(monitor, ticketPart('ticket-stand'), ticketPart('ticket-keyboard'));

  const printer = ticketPart('ticket-printer');
  const machine = ticketPart('ticket-machine');
  machine.setAttribute('aria-hidden', 'true');
  const tray = ticketPart('ticket-tray');
  tray.setAttribute('aria-hidden', 'true');
  const status = ticketPart('ticket-print-status');
  status.setAttribute('role', 'status');
  printer.append(machine, tray, status);
  desk.replaceChildren(computer, printer);

  return (count, type) => {
    const tickets = Array.from({ length: Math.min(count, 3) }, () => ticketPart('ticket-paper'));
    tray.replaceChildren(...tickets);
    status.textContent = count ? count + ' × ' + type : '';
    printer.classList.toggle('has-tickets', count > 0);
  };
}

function renderTicketPreview(desk, built, interactive, onDemo, showExample) {
  const preview = document.createElement('div');
  preview.className = 'ticket-preview';
  const print = buildTicketDesk(desk, preview);
  const windowBar = document.createElement('strong');
  windowBar.className = 'ticket-window-bar';
  windowBar.textContent = 'Biglietteria';
  if (!built) {
    preview.classList.add('ticket-window-outline');
    const empty = document.createElement('p');
    empty.textContent = 'La finestra della biglietteria apparirà qui.';
    preview.replaceChildren(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'ticket-grid';
  preview.replaceChildren(windowBar, grid);
  if (built < 2) return;

  const showEmptyCells = count => {
    for (let index = 0; index < count; index++) {
      const cell = ticketPart('ticket-empty-cell');
      cell.setAttribute('aria-hidden', 'true');
      grid.append(cell);
    }
  };
  if (built === 2) {
    grid.setAttribute('aria-label', 'Griglia di 3 righe e 2 colonne');
    grid.setAttribute('role', 'group');
    showEmptyCells(6);
    return;
  }

  const controlId = desk.id || 'ticket-sample';
  const typeLabel = document.createElement('label');
  const type = document.createElement('select');
  typeLabel.textContent = 'Biglietto';
  type.setAttribute('aria-label', 'Biglietto');
  for (const name of ticketPrices.keys()) type.add(new Option(name, name));
  type.id = controlId + '-type';
  typeLabel.htmlFor = type.id;
  grid.append(typeLabel, type);
  if (built === 3) {
    showEmptyCells(4);
    return;
  }

  const quantityLabel = document.createElement('label');
  const quantity = document.createElement('input');
  quantityLabel.textContent = 'Quantità';
  quantity.setAttribute('aria-label', 'Quantità');
  quantity.type = 'text';
  quantity.inputMode = 'numeric';
  quantity.maxLength = 9;
  quantity.id = controlId + '-quantity';
  quantityLabel.htmlFor = quantity.id;
  grid.append(quantityLabel, quantity);
  if (built === 4) {
    showEmptyCells(2);
    return;
  }

  const calculate = document.createElement('button');
  const total = document.createElement('output');
  calculate.type = 'button';
  calculate.className = 'lesson-check';
  calculate.textContent = 'Calcola';
  calculate.disabled = !interactive;
  total.setAttribute('aria-live', 'polite');
  total.textContent = 'Totale: —';
  grid.append(calculate, total);
  if (showExample) {
    quantity.value = '3';
    total.textContent = 'Totale: ' + ticketPrices.get('Intero') * 3 + ' €';
    print(3, 'Intero');
  }
  calculate.addEventListener('click', () => {
    const text = quantity.value.trim();
    const count = Number(text);
    if (!/^\d+$/.test(text) || count < 1) {
      total.textContent = 'Scrivi una quantità intera maggiore di zero.';
      print(0);
      quantity.focus();
      return;
    }
    const price = ticketPrices.get(type.value);
    total.textContent = 'Totale: ' + price * count + ' €';
    print(count, type.value);
    if (type.value === 'Intero' && count === 3) onDemo?.();
  });
  quantity.addEventListener('keydown', event => {
    if (event.key === 'Enter' && interactive) {
      event.preventDefault();
      calculate.click();
    }
  });
}

function finishedTicketOffice(inGallery = false) {
  const desk = ticketPart('ticket-desk');
  if (!inGallery) {
    renderTicketPreview(desk, ticketSteps.length, true, undefined, true);
    return desk;
  }

  const screen = document.createElement('span');
  screen.className = 'ticket-preview';
  const title = document.createElement('strong');
  title.className = 'ticket-window-bar';
  title.textContent = 'Biglietteria';
  const grid = document.createElement('span');
  grid.className = 'ticket-grid';
  const cells = ['Biglietto', 'Intero', 'Quantità', '3',
    'Calcola', 'Totale: ' + ticketPrices.get('Intero') * 3 + ' €'];
  for (const [index, label] of cells.entries()) {
    const cell = document.createElement('span');
    cell.textContent = label;
    if (index === 1 || index === 3) cell.className = 'ticket-field';
    if (index === 4) cell.className = 'ticket-gallery-action';
    grid.append(cell);
  }
  screen.append(title, grid);
  buildTicketDesk(desk, screen)(3, 'Intero');
  return desk;
}
