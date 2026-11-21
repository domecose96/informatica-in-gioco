const exhibitionTitle = 'La mostra interattiva';
const exhibitionArtTitles = ['La casa di sera', bridgeTitle, cityTitle, ticketTitle];

const exhibitionSteps = [
  {
    title: 'Metti l’opera al centro',
    instruction: 'Imposta un BorderLayout sul pannello principale. Aggiungi opera nella zona CENTER. Il pannello e l’etichetta dell’opera sono già pronti.',
    hint: 'Passa new BorderLayout() a pannello.setLayout(). Quando aggiungi un componente con BorderLayout, il secondo argomento di add() indica la zona.',
    readyCode: `import java.awt.BorderLayout;
import java.awt.FlowLayout;
import javax.swing.*;

// Campi della classe. Scrivi le istruzioni dei passaggi nel costruttore.
private final JPanel pannello = new JPanel();
private final JLabel opera = new JLabel("La casa di sera", SwingConstants.CENTER);
private final JPanel comandi = new JPanel();`,
    goal: `pannello.setLayout(new BorderLayout());
pannello.add(opera, BorderLayout.CENTER);`,
    retry: 'Imposta BorderLayout sul pannello e aggiungi opera con BorderLayout.CENTER.'
  },
  {
    title: 'Riserva lo spazio per i comandi',
    instruction: 'Il pannello comandi è già dichiarato nel «Codice già pronto» del passaggio 1. Aggiungilo al pannello principale nella zona SOUTH. Sulla Tela comparirà una fascia sotto l’opera.',
    hint: 'Usa add() sullo stesso pannello del passaggio precedente. Passagli comandi e la costante della zona in basso.',
    goal: 'pannello.add(comandi, BorderLayout.SOUTH);',
    retry: 'Usa pannello.add() con comandi e BorderLayout.SOUTH.'
  },
  {
    title: 'Affianca i pulsanti',
    instruction: 'Imposta un FlowLayout con allineamento al centro sul pannello comandi. Aggiungi prima precedente e poi successivo. Entrambi i pulsanti sono già creati.',
    hint: 'Questa volta setLayout() e add() vanno chiamati su comandi. FlowLayout.CENTER centra la fila e l’ordine delle due chiamate add() decide quale pulsante appare a sinistra.',
    readyCode: `JButton precedente = new JButton("Precedente");
JButton successivo = new JButton("Successivo");`,
    goal: `comandi.setLayout(new FlowLayout(FlowLayout.CENTER));
comandi.add(precedente);
comandi.add(successivo);`,
    retry: 'Controlla il FlowLayout centrato e l’ordine dei pulsanti nel pannello comandi.'
  },
  {
    title: 'Fai scorrere le opere',
    instruction: 'I metodi mostraPrecedente() e mostraSuccessivo() sono in «Codice già pronto». Collega ogni pulsante al suo metodo. Premi Verifica, poi usa Successivo per andare al Ponte e Precedente per tornare alla Casa.',
    readyCode: `// Campi e metodi della classe. La Tela del gioco mostra anche le immagini.
private final String[] titoli = {
    ${exhibitionArtTitles.map(title => '"' + title + '"').join(',\n    ')}
};
private int indice = 0;

private void mostraPrecedente() {
    indice = (indice - 1 + titoli.length) % titoli.length;
    opera.setText(titoli[indice]);
}

private void mostraSuccessivo() {
    indice = (indice + 1) % titoli.length;
    opera.setText(titoli[indice]);
}`,
    legacyStarter: `precedente.addActionListener(evento -> {
    // Torna all’opera precedente.
});

successivo.addActionListener(evento -> {
    // Mostra l’opera successiva.
});`,
    goal: `precedente.addActionListener(evento -> {
    mostraPrecedente();
});

successivo.addActionListener(evento -> {
    mostraSuccessivo();
});`,
    retry: 'Controlla che ogni pulsante richiami il metodo della direzione giusta nel proprio addActionListener().'
  }
];

function exhibitionCodeMatches(index, source) {
  const goal = exhibitionSteps[index].goal;
  const variants = [goal];
  if (index === 2) variants.push(goal.replace('new FlowLayout(FlowLayout.CENTER)', 'new FlowLayout()'));
  if (index === 3) {
    variants.push(goal.replace(/-> \{\s*(mostra\w+\(\));\s*\}/g, '-> $1'));
  }
  const tokens = javaCodeTokens(source).join(' ');
  return variants.some(code => javaCodeTokens(code).join(' ') === tokens);
}

function renderExhibitionPreview(scene, built, interactive, onDemo, _finished, inGallery = false, galleryNavigation) {
  const part = (className, tag = 'span') => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  };
  const gallery = part('exhibition-wall');
  const frame = part('exhibition-frame');
  const plaque = part('exhibition-plaque');
  if (!inGallery) plaque.setAttribute('role', 'status');
  let index = 0;

  const showArtwork = () => {
    frame.replaceChildren(finishedArtwork(frames[index], true));
    plaque.textContent = exhibitionArtTitles[index];
    galleryNavigation?.announce(plaque.textContent);
  };

  if (built) {
    showArtwork();
  } else {
    frame.classList.add('exhibition-empty');
    frame.textContent = 'Qui andrà il quadro.';
    plaque.hidden = true;
  }
  gallery.append(frame, plaque);
  scene.replaceChildren(gallery);
  if (built < 2) return;

  const controls = part('exhibition-controls');
  scene.append(controls);
  if (built < 3) {
    controls.classList.add('exhibition-empty');
    controls.textContent = 'Qui andranno i comandi.';
    return;
  }

  let reachedBridge = false;
  for (const [label, direction] of [['Precedente', -1], ['Successivo', 1]]) {
    if (inGallery) {
      const placeholder = part('exhibition-control');
      placeholder.textContent = label;
      controls.append(placeholder);
      if (!galleryNavigation) continue;
    }

    const control = part('exhibition-control', 'button');
    control.textContent = label;
    (galleryNavigation?.controls ?? controls).append(control);

    control.type = 'button';
    control.disabled = !interactive;
    control.addEventListener('click', () => {
      const previousIndex = index;
      index = (index + direction + exhibitionArtTitles.length) % exhibitionArtTitles.length;
      showArtwork();
      if (previousIndex === 0 && direction === 1) {
        reachedBridge = true;
        if (onDemo) feedback.textContent = 'Hai raggiunto il Ponte. Premi Precedente per tornare alla Casa.';
      } else if (reachedBridge && previousIndex === 1 && direction === -1) {
        onDemo?.();
      } else {
        reachedBridge = false;
        if (onDemo) {
          feedback.textContent = index === 0 ? 'Dalla Casa, premi Successivo per passare al Ponte.'
            : 'Torna alla Casa, poi prova Successivo e Precedente.';
        }
      }
    });
  }
}

function finishedExhibition(inGallery = false, galleryNavigation) {
  const scene = document.createElement(inGallery ? 'span' : 'div');
  scene.className = 'exhibition-scene';
  renderExhibitionPreview(scene, exhibitionSteps.length, true, undefined, true, inGallery, galleryNavigation);
  return scene;
}
