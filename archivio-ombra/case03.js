const case03Seed = `
PRAGMA foreign_keys = ON;
CREATE TABLE operatori(id INTEGER PRIMARY KEY, nome TEXT NOT NULL, ruolo TEXT NOT NULL);
CREATE TABLE pratiche(id INTEGER PRIMARY KEY, protocollo TEXT NOT NULL UNIQUE, richiedente TEXT NOT NULL, punteggio INTEGER NOT NULL);
CREATE TABLE ricevute(pratica_id INTEGER PRIMARY KEY REFERENCES pratiche(id), ora TEXT NOT NULL);
CREATE TABLE richieste(id INTEGER PRIMARY KEY, pratica_id INTEGER NOT NULL REFERENCES pratiche(id), richiedente_id INTEGER NOT NULL REFERENCES operatori(id), autorizzata_da INTEGER NOT NULL REFERENCES operatori(id), campo TEXT NOT NULL);
CREATE TABLE versioni(pratica_id INTEGER NOT NULL REFERENCES pratiche(id), versione INTEGER NOT NULL, ora_arrivo TEXT NOT NULL, civico INTEGER NOT NULL, registrata_alle TEXT NOT NULL, richiesta_id INTEGER REFERENCES richieste(id), applicata_da INTEGER NOT NULL REFERENCES operatori(id), PRIMARY KEY(pratica_id, versione));
INSERT INTO operatori VALUES (1,'Elisa Conti','impiegata'),(2,'Matteo Bellini','responsabile di turno'),(3,'Sara Villa','funzionaria'),(4,'Luca Rota','impiegato');
INSERT INTO pratiche VALUES (1,'SP-101','Il Telaio',95),(2,'SP-102','Officina Verde',91),(3,'SP-103','Laboratorio Ponte',87),(4,'SP-104','Spazio Aperto',84),(5,'SP-105','Circolo Arco',84),(6,'SP-106','Il Girasole',97);
INSERT INTO ricevute VALUES (1,'16:45'),(2,'17:12'),(3,'18:07'),(4,'17:35'),(5,'17:42'),(6,'18:13');
INSERT INTO richieste VALUES (11,1,4,3,'civico'),(12,3,1,3,'civico'),(13,5,4,3,'civico'),(14,4,4,3,'civico');
INSERT INTO versioni VALUES
(1,1,'16:45',12,'16:45',NULL,4),(1,2,'16:45',21,'22:11',11,4),
(2,1,'17:12',7,'17:12',NULL,1),
(3,1,'18:07',41,'18:07',NULL,1),(3,2,'18:07',14,'22:53',12,2),(3,3,'17:57',14,'23:18',12,2),
(4,1,'17:35',50,'17:35',NULL,4),(4,2,'17:35',5,'23:03',14,4),
(5,1,'17:42',9,'17:42',NULL,1),(5,2,'17:42',19,'23:42',13,4),
(6,1,'18:13',8,'18:13',NULL,1);
`;

const case03Ranking = `WITH ultime AS (
  SELECT v.*, ROW_NUMBER() OVER (
    PARTITION BY pratica_id ORDER BY versione DESC
  ) AS rn
  FROM versioni v
),
pubblicata AS (
  SELECT p.protocollo, p.richiedente,
         ROW_NUMBER() OVER (ORDER BY p.punteggio DESC, u.ora_arrivo, p.protocollo) AS posizione
  FROM pratiche p JOIN ultime u ON u.pratica_id = p.id
  WHERE u.rn = 1 AND u.ora_arrivo <= '18:00'
),
corretta AS (
  SELECT p.protocollo, p.richiedente,
         ROW_NUMBER() OVER (ORDER BY p.punteggio DESC, r.ora, p.protocollo) AS posizione
  FROM pratiche p JOIN ricevute r ON r.pratica_id = p.id
  WHERE r.ora <= '18:00'
)`;

const case03Missions = [
  {
    skill:'JOIN · GROUP BY · HAVING', title:'Una pratica riscritta',
    text:'Prima di pubblicare la graduatoria, l’ufficio ti consegna lo storico del registro. Più domande hanno ricevuto una correzione, ma una compare almeno tre volte.',
    objective:'Mostra protocollo e numero di versioni come totale_versioni. Conserva solo le pratiche con almeno tre versioni.',
    tables:['pratiche','versioni'],
    starter:'SELECT p.protocollo, COUNT(*) AS totale_versioni\nFROM pratiche p',
    hints:['Collega ogni pratica alle sue versioni tramite pratica_id.','Raggruppa per protocollo prima di contare le versioni.','Usa HAVING COUNT(*) >= 3 per filtrare il conteggio.'],
    solution:`SELECT p.protocollo, COUNT(*) AS totale_versioni FROM pratiche p JOIN versioni v ON p.id=v.pratica_id GROUP BY p.protocollo HAVING COUNT(*) >= 3`,
    clue:'SP-103 è l’unica pratica con tre versioni.'
  },
  {
    skill:'JOIN · ORDER BY', title:'Dieci minuti indietro',
    text:'Il protocollo SP-103 ha una versione in più. Ricostruisci che cosa è cambiato a ogni passaggio.',
    objective:'Per SP-103 mostra versione, registrata_alle, ora_arrivo e civico, dalla prima all’ultima versione.',
    tables:['pratiche','versioni'],
    starter:'SELECT v.versione, v.registrata_alle, v.ora_arrivo, v.civico\nFROM versioni v',
    hints:['Collega versioni a pratiche, dove trovi il protocollo.','Filtra SP-103. registrata_alle è l’ora della scrittura nel registro.','Ordina per versione crescente per leggere la storia della pratica.'],
    solution:`SELECT v.versione,v.registrata_alle,v.ora_arrivo,v.civico FROM versioni v JOIN pratiche p ON p.id=v.pratica_id WHERE p.protocollo='SP-103' ORDER BY v.versione`,
    clue:'Alle 22:53 cambia il civico. Alle 23:18 l’ora di arrivo viene anticipata dalle 18:07 alle 17:57.'
  },
  {
    skill:'SOTTOQUERY CORRELATA · MAX', title:'La ricevuta originale',
    text:'La ricevuta è stata emessa al momento della consegna. Confrontala con l’ultima versione del registro.',
    objective:'Trova tutte le pratiche con ora diversa dalla ricevuta nella loro ultima versione. Mostra protocollo, ora_ricevuta e ora_registro.',
    tables:['pratiche','ricevute','versioni'],
    starter:'SELECT p.protocollo, r.ora AS ora_ricevuta, v.ora_arrivo AS ora_registro\nFROM pratiche p',
    hints:['Collega sia ricevute sia versioni alla pratica.','Seleziona solo la versione con il numero più alto per ciascuna pratica.','Se usi MAX in una sottoquery, limita il calcolo alla pratica della riga esterna. Poi confronta i due orari.'],
    solution:`SELECT p.protocollo,r.ora AS ora_ricevuta,v.ora_arrivo AS ora_registro FROM pratiche p JOIN ricevute r ON r.pratica_id=p.id JOIN versioni v ON v.pratica_id=p.id WHERE v.versione=(SELECT MAX(s.versione) FROM versioni s WHERE s.pratica_id=p.id) AND v.ora_arrivo<>r.ora`,
    clue:'La ricevuta di SP-103 attesta le 18:07. Il registro finale riporta le 17:57, prima della scadenza delle 18.'
  },
  {
    skill:'WITH · LAG', title:'Un campo fuori mandato',
    text:'La modifica rimanda a una richiesta autorizzata. Confronta ogni versione con quella immediatamente precedente per vedere quale campo cambia.',
    objective:'Per SP-103 mostra le versioni che cambiano l’ora rispetto alla precedente. Restituisci versione, ora_precedente, ora_arrivo e campo_autorizzato.',
    tables:['pratiche','versioni','richieste'],
    starter:`WITH storico AS (
  SELECT v.*, LAG(v.ora_arrivo) OVER (
    PARTITION BY v.pratica_id ORDER BY v.versione
  ) AS ora_precedente
  FROM versioni v
)
SELECT
FROM storico s`,
    hints:['LAG costruisce il confronto prima dei filtri della SELECT esterna.','Collega pratiche per il protocollo e richieste tramite richiesta_id.','Confronta s.ora_arrivo con s.ora_precedente. Il campo autorizzato è richieste.campo.'],
    solution:`WITH storico AS (SELECT v.*,LAG(ora_arrivo) OVER(PARTITION BY pratica_id ORDER BY versione) AS ora_precedente FROM versioni v) SELECT s.versione,s.ora_precedente,s.ora_arrivo,r.campo AS campo_autorizzato FROM storico s JOIN pratiche p ON p.id=s.pratica_id JOIN richieste r ON r.id=s.richiesta_id WHERE p.protocollo='SP-103' AND s.ora_arrivo<>s.ora_precedente`,
    clue:'La versione 3 cambia l’orario usando una richiesta che autorizzava soltanto la correzione del civico.'
  },
  {
    skill:'JOIN MULTIPLA · ALIAS', title:'Tre firme, tre ruoli',
    text:'Sul modulo c’è il nome dell’impiegata. Lo storico registra separatamente chi ha presentato, autorizzato e applicato la rettifica.',
    objective:'Per la versione 3 di SP-103 mostra i nomi come richiesto_da, autorizzato_da e applicato_da.',
    tables:['pratiche','versioni','richieste','operatori'],
    starter:'SELECT\nFROM versioni v',
    hints:['Risalendo da versione a richiesta trovi due ID. Il terzo è nella versione.','Collega operatori tre volte con alias diversi.','Usa richiedente_id per chi ha richiesto, autorizzata_da per chi ha autorizzato, applicata_da per chi ha scritto nel registro.'],
    solution:`SELECT ch.nome AS richiesto_da,au.nome AS autorizzato_da,ap.nome AS applicato_da FROM versioni v JOIN pratiche p ON p.id=v.pratica_id JOIN richieste r ON r.id=v.richiesta_id JOIN operatori ch ON ch.id=r.richiedente_id JOIN operatori au ON au.id=r.autorizzata_da JOIN operatori ap ON ap.id=v.applicata_da WHERE p.protocollo='SP-103' AND v.versione=3`,
    clue:'Elisa Conti ha chiesto di correggere il civico. Sara Villa ha autorizzato quella richiesta. Matteo Bellini ha applicato la versione che cambia l’ora.'
  },
  {
    skill:'WITH · ROW_NUMBER', title:'L’ultimo posto',
    text:'Il bando assegna tre posti. Per la graduatoria valgono punteggio decrescente, ora di arrivo crescente e, a ulteriore parità, protocollo crescente. Le consegne entro le 18:00 sono ammesse.',
    objective:'Per ogni pratica, prendi l’ultima versione. Escludi le domande arrivate dopo le 18:00, poi assegna le posizioni con i criteri del bando. Mostra posizione, protocollo e richiedente per i primi tre, in ordine di posizione.',
    tables:['pratiche','versioni'],
    starter:'WITH ultime AS (\n  SELECT v.*, ROW_NUMBER() OVER (PARTITION BY pratica_id ORDER BY versione DESC) AS rn\n  FROM versioni v\n)\nSELECT\nFROM',
    hints:['Unisci pratiche alle righe con rn = 1.','In una seconda CTE, tieni solo le righe con rn = 1 e ora_arrivo fino alle 18:00, incluse. Assegna le posizioni solo a queste righe.','Calcola ROW_NUMBER con i tre criteri del bando, poi filtra posizione <= 3 nella SELECT esterna.'],
    solution:case03Ranking+` SELECT posizione,protocollo,richiedente FROM pubblicata WHERE posizione<=3 ORDER BY posizione`,
    clue:'Laboratorio Ponte risulta terzo e occupa l’ultimo posto disponibile.'
  },
  {
    skill:'WITH · NOT EXISTS', title:'Chi è rimasto fuori',
    text:'Rifai la graduatoria con le ricevute originali. Per questa verifica usa la stessa scadenza, gli stessi criteri e lo stesso limite di tre posti.',
    objective:'Mostra protocollo, richiedente e posizione nella graduatoria corretta di chi entra tra i primi tre con le ricevute, ma non risulta tra i primi tre con il registro.',
    tables:['pratiche','ricevute','versioni'],
    starter:'WITH ultime AS (\n  SELECT v.*, ROW_NUMBER() OVER (PARTITION BY pratica_id ORDER BY versione DESC) AS rn\n  FROM versioni v\n)\nSELECT\nFROM',
    hints:['Prepara due graduatorie: una col registro e una con le ricevute.','Applica gli stessi criteri di ordinamento, usando l’ora della fonte scelta per ciascuna graduatoria.','Confronta i primi tre per protocollo con NOT EXISTS. Una posizione superiore a 3 equivale a un’esclusione.'],
    solution:case03Ranking+` SELECT protocollo,richiedente,posizione FROM corretta c WHERE posizione<=3 AND NOT EXISTS(SELECT 1 FROM pubblicata p WHERE p.protocollo=c.protocollo AND p.posizione<=3)`,
    clue:'Spazio Aperto avrebbe ottenuto il terzo posto. Il Circolo Arco ha lo stesso punteggio, ma ha consegnato più tardi.'
  },
  {
    skill:'CTE · CONFRONTO · VERDETTO', title:'L’ultima rettifica',
    text:'Chiudi il fascicolo con un’unica riga che colleghi la firma di chi ha cambiato l’ora, la ricevuta originale e l’esclusione dalla graduatoria.',
    objective:'Per SP-103 mostra responsabile, ora_ricevuta, ora_registro e penalizzato. Usa il nome di chi ha applicato l’ultima versione e il richiedente escluso che hai ricavato dal confronto delle graduatorie.',
    tables:['pratiche','ricevute','versioni','operatori'],
    starter:'WITH ultime AS (\n  SELECT v.*, ROW_NUMBER() OVER (PARTITION BY pratica_id ORDER BY versione DESC) AS rn\n  FROM versioni v\n)\nSELECT\nFROM',
    hints:['Riparti dalla query della missione 7. Mantieni le due graduatorie e racchiudi la SELECT che individua il richiedente escluso in una nuova CTE.','Per SP-103 incrocia l’ultima versione con ricevute e operatori.','Collega alla riga del verdetto l’esito del confronto fra i primi tre. Assegna alle colonne gli alias della consegna.'],
    solution:case03Ranking+`,
    esclusa AS (
      SELECT c.richiedente FROM corretta c WHERE c.posizione<=3
      AND NOT EXISTS(SELECT 1 FROM pubblicata p WHERE p.protocollo=c.protocollo AND p.posizione<=3)
    )
    SELECT o.nome AS responsabile,r.ora AS ora_ricevuta,u.ora_arrivo AS ora_registro,e.richiedente AS penalizzato
    FROM pratiche p JOIN ultime u ON u.pratica_id=p.id AND u.rn=1
    JOIN ricevute r ON r.pratica_id=p.id JOIN operatori o ON o.id=u.applicata_da
    CROSS JOIN esclusa e WHERE p.protocollo='SP-103'`,
    clue:'Matteo Bellini ha applicato la rettifica. La ricevuta segna le 18:07, il registro indica le 17:57. La modifica ha tolto il terzo posto a Spazio Aperto.'
  }
];

function compareCase03Rows(rows, expected) {
  return rows.length === expected.length && expected.every((row, index) =>
    Object.entries(row).every(([column, value]) => rows[index][column] === value)
  );
}
