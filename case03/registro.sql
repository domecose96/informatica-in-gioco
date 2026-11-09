PRAGMA foreign_keys = ON;

CREATE TABLE voci_registro (
  id INTEGER PRIMARY KEY,
  riferimento TEXT NOT NULL UNIQUE,
  oggetto TEXT NOT NULL
);

CREATE TABLE copie_registro (
  voce_id INTEGER NOT NULL REFERENCES voci_registro(id),
  versione TEXT NOT NULL CHECK (versione IN ('sera', 'mattina')),
  stato TEXT NOT NULL,
  PRIMARY KEY (voce_id, versione)
);

CREATE TABLE account (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE rettifiche (
  id INTEGER PRIMARY KEY,
  voce_id INTEGER NOT NULL REFERENCES voci_registro(id),
  account_id INTEGER NOT NULL REFERENCES account(id),
  registrata_il TEXT NOT NULL,
  stato_precedente TEXT NOT NULL,
  stato_nuovo TEXT NOT NULL
);

CREATE TABLE autorizzazioni (
  account_id INTEGER NOT NULL REFERENCES account(id),
  voce_id INTEGER NOT NULL REFERENCES voci_registro(id),
  valida_da TEXT NOT NULL,
  valida_fino TEXT NOT NULL CHECK (valida_fino > valida_da),
  PRIMARY KEY (account_id, voce_id, valida_da)
);

INSERT INTO voci_registro VALUES
  (1, 'F-204', 'Fascicolo dell’archivio civico'),
  (2, 'P-27', 'Plico della stazione'),
  (3, 'V-12', 'Verbale di inventario');

INSERT INTO copie_registro VALUES
  (1, 'sera', 'da verificare'), (1, 'mattina', 'da verificare'),
  (2, 'sera', 'consegna contestata'), (2, 'mattina', 'consegna convalidata'),
  (3, 'sera', 'in revisione'), (3, 'mattina', 'archiviato');

INSERT INTO account VALUES (1, 'protocollo_a'), (2, 'protocollo_b');

INSERT INTO rettifiche VALUES
  (1, 3, 1, '2026-11-07 20:15', 'in revisione', 'archiviato'),
  (2, 2, 2, '2026-11-07 22:41', 'consegna contestata', 'consegna convalidata');

-- Finestra di validità con fine esclusa.
INSERT INTO autorizzazioni VALUES
  (1, 3, '2026-11-07 20:00', '2026-11-07 21:00'),
  (2, 2, '2026-11-07 21:00', '2026-11-07 22:00');
