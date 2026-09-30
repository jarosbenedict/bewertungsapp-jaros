# Bewertungsapp – Benedict Jaros

Klasse: 4a APC

Kurs: ITL1 / Angewandte Informatik, 4. Jahrgang
Repository: `bewertungsapp-jaros` (Einzelabgabe)

## Setup

Backend:

```bash
cd backend
npm install
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm start
```

Frontend:

```bash
cd frontend
npm install
ionic serve
```

Eigene `config/config.json` lokal aus `config/config.example.json` ableiten, nicht committen.

## Einheit 1: Installation

- [x] Antworten auf die vier Verständnisfragen: `docs/screenshots/einheit1/einheit1-fragen.md`
- [x] Screenshot Toolchain (`versions.png`), DB-Server (`mysql.png`), DB-Tool (`phpmyadmin.png`)
      in `docs/screenshots/einheit1/`

| Baustein | Status | Version |
|---|---|---|
| Node.js | installiert | v24.13.1 |
| npm | installiert | 11.8.0 |
| Ionic CLI | global installiert | 7.2.1 |
| git | installiert | 2.47.0 |
| Datenbank | installiert, läuft | MariaDB 10.4.32 (XAMPP) |
| DB-Tool | installiert | phpMyAdmin (XAMPP) |
| Postman | offen | – |
| Docker | nicht installiert (Variante A, nicht benötigt) | – |

## Einheit 2: Datenmodell anlegen

- [x] Ausgefüllte Planungsvorlage: `docs/diagramm/planungsvorlage.html`
- [x] Verwendete `model:generate`-Befehle dokumentiert (unten)
- [ ] Screenshot der angelegten Tabellen im DB-Tool: `docs/screenshots/einheit2/`

### Projekt aufsetzen

```bash
cd backend
npm init -y
npm install express cors morgan sequelize cookie-parser mysql2
npm install --save-dev sequelize-cli
npx sequelize-cli init
```

Danach `config/config.json` aus `config/config.example.json` ableiten (nicht committen) und
`index.js` als Einstiegspunkt anlegen, Startbefehl in `package.json`: `"start": "node index.js"`.

### model:generate

Abgeleitet aus der ausgefüllten Planungsvorlage (Spaltenname = Sequelize-Attribut):

```bash
npx sequelize-cli model:generate --name Team --attributes name:string,klasse:string
npx sequelize-cli model:generate --name Member --attributes teamId:integer,vorname:string,nachname:string
npx sequelize-cli model:generate --name Project --attributes teamId:integer,titel:string,beschreibung:text,praesentiertAm:date
```

### Migrieren

```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

Ergebnis: Tabellen `teams`, `members`, `projects` (Pluralbildung automatisch) plus
`SequelizeMeta` für die Migrationhistorie. Die Fremdschlüssel-Assoziation im Code folgt in
Einheit 3, `model:generate` legt nur die Spalte an.

| Entität | Attribute (ohne id, createdAt, updatedAt) |
|---|---|
| Team | `name` STRING NOT NULL, `klasse` STRING NOT NULL |
| Member | `teamId` INTEGER (FK → Team.id), `vorname` STRING NOT NULL, `nachname` STRING NOT NULL |
| Project | `teamId` INTEGER (FK → Team.id), `titel` STRING NOT NULL, `beschreibung` TEXT, `praesentiertAm` DATE |

## Einheit 3: Assoziationen und weitere Modelle

- [x] Alle Modelle (Team, Member, Project, Criterion, Juror, Evaluation) mit ausgefüllten `associate`-Methoden
- [x] Unique-Constraint auf (projectId, criterionId, jurorId) bei Evaluation
- [x] Vier Seeder mit Testdaten
- [ ] Screenshot `db:migrate` ohne Fehler und der Tabellen in `docs/screenshots/einheit3/`

### Weitere Modelle generieren

```bash
npx sequelize-cli model:generate --name Criterion --attributes name:string,maxScore:integer,weight:float
npx sequelize-cli model:generate --name Juror --attributes name:string,email:string
npx sequelize-cli model:generate --name Evaluation --attributes projectId:integer,criterionId:integer,jurorId:integer,score:integer,comment:text
```

### Assoziationen

`model:generate` legt nur die Fremdschlüssel-Spalte an, die Beziehung selbst wird in den
Model-Dateien im Abschnitt `associate` ergänzt. `models/index.js` ruft die Methode
automatisch auf.

| Modell | `associate` |
|---|---|
| Team | `hasMany(Member, { foreignKey: 'teamId' })`, `hasMany(Project, { foreignKey: 'teamId' })` |
| Member | `belongsTo(Team, { foreignKey: 'teamId' })` |
| Project | `belongsTo(Team, { foreignKey: 'teamId' })`, `hasMany(Evaluation, { foreignKey: 'projectId' })` |
| Criterion | `hasMany(Evaluation, { foreignKey: 'criterionId' })` |
| Juror | `hasMany(Evaluation, { foreignKey: 'jurorId' })` |
| Evaluation | `belongsTo(Project, { foreignKey: 'projectId' })`, `belongsTo(Criterion, { foreignKey: 'criterionId' })`, `belongsTo(Juror, { foreignKey: 'jurorId' })` |

### Constraints

Die Migrationen setzen die Constraints aus der Planungsvorlage um:

- `Criteria.name` und `Jurors.email`: `UNIQUE`
- `Evaluations`: `UNIQUE (projectId, criterionId, jurorId)` namens
  `evaluations_project_criterion_juror_unique`, verhindert doppelte Bewertung desselben
  Kriteriums durch denselben Juror für dasselbe Projekt
- `Evaluations.score`: `CHECK (score >= 0)` namens `evaluations_score_non_negative`,
  zusätzlich zum Model-Validator `min: 0`, damit die Regel auch bei direktem SQL-Zugriff gilt
- Fremdschlüssel mit `ON DELETE CASCADE` und `ON UPDATE CASCADE` auf `Members.teamId`,
  `Projects.teamId`, `Evaluations.projectId`, `Evaluations.criterionId`, `Evaluations.jurorId`
- `Projects.praesentiertAm` ist `DATE` (nicht `DATETIME`), weil ein Präsentationstag keine
  Uhrzeit hat

Nicht als DB-Constraint möglich: die Obergrenze von `score` ist `Criterion.maxScore`, hängt
aber von einer anderen Tabelle ab. Diese Prüfung gehört in die POST-Route der Einheit 4.

`20260930054500-add-constraints-to-existing-tables.js` ergänzt diese Constraints nachträglich
für die in Einheit 2 angelegten Tabellen. Das ist bewusst eine eigene Migration statt einer
Änderung an den Einheit-2-Migrationen, damit der mit `lab2` getaggte Stand reproduzierbar
bleibt.

Die Fremdschlüssel werden in dieser Migration über `addConstraint` mit eigenem Namen angelegt
(`members_teamId_fkey`, `projects_teamId_fkey`). Grund: `changeColumn` mit `references` erzeugt
einen FK mit automatischem MySQL-Namen (`members_ibfk_1`), der im `down()` nicht mehr gezielt
entfernbar ist und das Zurückrollen der Migration verhindert.

### Seeder

```bash
npx sequelize-cli seed:generate --name standard-kriterien   # und demo-juroren, demo-teams, demo-bewertungen
npx sequelize-cli db:seed:all
```

| Seeder | Inhalt |
|---|---|
| `standard-kriterien` | 3 Kriterien: Inhalt, Präsentationstechnik, Technische Umsetzung (Gewicht 1.5) |
| `demo-juroren` | 2 Juroren mit E-Mail als späterer Login-Kennung |
| `demo-teams` | 2 Teams, 3 Mitglieder, 2 Projekte |
| `demo-bewertungen` | 10 Bewertungen, damit die Auswertung ab Einheit 4 etwas zu rechnen hat |

Zurücksetzen mit `npx sequelize-cli db:seed:undo:all` (jeder Seeder hat ein `down`).

Die Seeder vergeben feste IDs (1, 2, ...), damit die Fremdschlüssel der Bewertungen
reproduzierbar auf die richtigen Teams, Projekte und Juroren zeigen. Das `down` von
`demo-teams` räumt die Tabellen vollständig leer, also nur auf einer reinen Testdatenbank
ausführen.

### Datenmodell gesamt

| Entität | Attribute (ohne id, createdAt, updatedAt) |
|---|---|
| Team | `name` STRING NOT NULL, `klasse` STRING NOT NULL |
| Member | `teamId` FK NOT NULL, `vorname` STRING NOT NULL, `nachname` STRING NOT NULL |
| Project | `teamId` FK NOT NULL, `titel` STRING NOT NULL, `beschreibung` TEXT, `praesentiertAm` DATE |
| Criterion | `name` STRING NOT NULL UNIQUE, `maxScore` INTEGER NOT NULL, `weight` FLOAT NOT NULL Default 1.0 |
| Juror | `name` STRING NOT NULL, `email` STRING NOT NULL UNIQUE |
| Evaluation | `projectId` FK NOT NULL, `criterionId` FK NOT NULL, `jurorId` FK NOT NULL, `score` INTEGER NOT NULL, `comment` TEXT |

## Einheit 4: Backend-Routen

- [ ] CRUD für Team und Project
- [ ] POST-Route für Evaluation inkl. Validierung
- [ ] Aggregations-Route: Durchschnitt der Punktzahl pro Projekt und Kriterium
- [ ] Kurze Endpunkt-Dokumentation (Methode, Pfad, Body, Rückgabe) unten in diesem README oder in `docs/`

## Einheit 5: Postman-Test

- [ ] Collection: `docs/postman/bewertungsapp.postman_collection.json`
- [ ] Environment: `docs/postman/bewertungsapp.postman_environment.json`
- [ ] Mindestens zwei dokumentierte Negativtests
- [ ] Testbericht: `docs/postman/testbericht.md`

## Einheit 6: IONIC-Frontend

- [ ] Projektliste mit Team-Zuordnung
- [ ] Detailansicht eines Projekts mit bisherigen Bewertungen
- [ ] API-Service vollständig an eigenes Backend angebunden

## Einheit 7: Login und Endabgabe

- [ ] Bewertungsformular (Projekt, Kriterium, Punktzahl, Kommentar) mit Validierung
- [ ] Auswertungsseite mit Durchschnittswerten
- [ ] Juror-Login, Token-Storage mit `@capacitor/preferences`
- [ ] Nachweis: geschützte Route liefert ohne Token 401, mit gültigem Token die erwartete Antwort

## Endpunkt-Dokumentation (laufend ergänzen)

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | /teams | – | Liste aller Teams |

## Bekannte Einschränkungen

- `frontend/` ist noch leer, es wird erst ab Einheit 6 aufgesetzt.
- `backend/` enthält bisher die Einrichtung, alle sechs Modelle und die Seeder. Die Routen
  folgen in Einheit 4, deshalb läuft der Server in `index.js` bisher ohne Endpunkte.
- `Juror.password` für den Login aus Einheit 7 existiert noch nicht, das Feld kommt mit dem
  JWT-Teil dazu.
- **Achtung Express 5:** `npm install express` hat Version 5 installiert, der Kurs geht von
  Express 4 aus. Der wichtigste Unterschied für Einheit 4: bei einem POST **ohne Body** ist
  `req.body` in Express 5 `undefined` statt `{}`. `const { name } = req.body;` wirft dann einen
  `TypeError`. Deshalb in jeder POST-Route `const data = req.body ?? {};` verwenden.
- Die Punktzahl-Obergrenze (`score <= Criterion.maxScore`) ist noch nicht geprüft, sie gehört
  in die POST-Route der Einheit 4.
- Die Datenbank läuft über XAMPP als MariaDB 10.4.32, nicht über MySQL Community Server.
  Der Sequelize-Dialect `mysql` funktioniert damit, MariaDB ist MySQL-kompatibel.
- Postman ist noch nicht installiert (wird für Einheit 5 gebraucht).
- Docker ist auf dem Arbeitsrechner nicht installiert. Es wird die native Variante A verwendet,
  damit ist Docker für dieses Projekt nicht erforderlich.
- Der npm-Global-Ordner musste dem Benutzer-PATH hinzugefügt werden, damit `ionic` in neuen
  Terminals gefunden wird.
