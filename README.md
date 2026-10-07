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
aber von einer anderen Tabelle ab. Sie wird deshalb in der POST-Route von `evaluations.js`
geprüft (Einheit 4).

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

- [x] CRUD für Team und Project
- [x] POST-Route für Evaluation inkl. Validierung
- [x] Aggregations-Route: Durchschnitt der Punktzahl pro Projekt und Kriterium
- [x] Kurze Endpunkt-Dokumentation (unten in diesem README)

### Aufbau der Routen

```
backend/
├── index.js              Express-App, hängt die Routen ein, 404- und Fehler-Handler
├── routes/
│   ├── index.js          sammelt alle Ressourcen unter einer Wurzel
│   ├── teams.js          CRUD Team + verschachtelt /:id/members und /:id/projects
│   ├── members.js        CRUD Member
│   ├── projects.js       CRUD Project + Auswertung
│   ├── criteria.js       CRUD Criterion
│   ├── jurors.js         CRUD Juror
│   └── evaluations.js    POST mit Validierung, Auswertung, CRUD
├── middleware/
│   └── errorHandler.js   404 für unbekannte Routen, zentrale Fehlerbehandlung
└── utils/
    ├── errors.js         HttpError mit Statuscode
    └── validation.js     Pflichtfelder, Zahlprüfung, Feldauswahl
```

Alle Routen liegen direkt auf der Wurzel (`GET /teams`), passend zur Vorlage. Die Routen
selbst enthalten kein `try/catch`: Express 5 leitet abgelehnte Promises automatisch an den
errorHandler weiter.

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

## Endpunkt-Dokumentation

Basis-URL: `http://localhost:3000`. Alle Antworten sind JSON. `:id` bedeutet eine ganze Zahl,
bei einem ungültigen Wert antwortet die API mit 400, nicht mit 500.

### Teams

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | `/` | – | Übersicht der Ressourcen |
| GET | `/teams` | – | alle Teams inkl. Mitglieder und Projekte |
| GET | `/teams/:id` | – | ein Team inkl. Mitglieder und Projekte |
| GET | `/teams/:id/members` | – | nur die Mitglieder eines Teams |
| GET | `/teams/:id/projects` | – | nur die Projekte eines Teams |
| POST | `/teams` | `{ name, klasse }` | angelegtes Team, 201 |
| PUT | `/teams/:id` | `{ name?, klasse? }` | aktualisiertes Team |
| DELETE | `/teams/:id` | – | 204, löscht Mitglieder und Projekte mit (CASCADE) |

### Members

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | `/members` | – | alle Mitglieder, optional `?teamId=` |
| GET | `/members/:id` | – | ein Mitglied inkl. Team |
| POST | `/members` | `{ teamId, vorname, nachname }` | angelegtes Mitglied, 201 |
| PUT | `/members/:id` | `{ teamId?, vorname?, nachname? }` | aktualisiertes Mitglied |
| DELETE | `/members/:id` | – | 204 |

### Projects

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | `/projects` | – | alle Projekte inkl. Team, optional `?teamId=` |
| GET | `/projects/:id` | – | Projekt inkl. Team und Bewertungen (mit Kriterium und Juror) |
| GET | `/projects/:id/evaluations` | – | Bewertungen eines Projekts |
| GET | `/projects/:id/auswertung` | – | Durchschnitt pro Kriterium, siehe unten |
| POST | `/projects` | `{ teamId, titel, beschreibung?, praesentiertAm? }` | angelegtes Projekt, 201 |
| PUT | `/projects/:id` | `{ teamId?, titel?, beschreibung?, praesentiertAm? }` | aktualisiertes Projekt |
| DELETE | `/projects/:id` | – | 204, löscht Bewertungen mit (CASCADE) |

`praesentiertAm` erwartet das Format `YYYY-MM-DD`, andere Formate liefern 400.

### Criteria

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | `/criteria` | – | alle Kriterien, optional `?withEvaluations=true` |
| GET | `/criteria/:id` | – | ein Kriterium |
| POST | `/criteria` | `{ name, maxScore, weight? }` | angelegtes Kriterium, 201 |
| PUT | `/criteria/:id` | `{ name?, maxScore?, weight? }` | aktualisiertes Kriterium |
| DELETE | `/criteria/:id` | – | 204, löscht die Bewertungen dieses Kriteriums mit |

`name` ist eindeutig (409 bei Duplikat), `maxScore` und `weight` müssen größer als 0 sein.

### Jurors

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | `/jurors` | – | alle Juroren |
| GET | `/jurors/:id` | – | ein Juror |
| POST | `/jurors` | `{ name, email }` | angelegter Juror, 201 |
| PUT | `/jurors/:id` | `{ name?, email? }` | aktualisierter Juror |
| DELETE | `/jurors/:id` | – | 204, oder 409 wenn noch Bewertungen hängen |

`email` ist eindeutig und wird auf Kleinschreibung normalisiert, ein ungültiges Format liefert
400. `DELETE` wird mit 409 abgelehnt, solange Bewertungen des Jurors existieren, damit die
Bewertungen nicht unbemerkt verschwinden.

### Evaluations

| Methode | Pfad | Body | Rückgabe |
|---|---|---|---|
| GET | `/evaluations` | – | alle Bewertungen, filterbar mit `?projectId=`, `?criterionId=`, `?jurorId=` |
| GET | `/evaluations/auswertung` | – | Durchschnitt gruppiert nach Projekt und Kriterium |
| GET | `/evaluations/:id` | – | eine Bewertung inkl. Projekt, Kriterium, Juror |
| POST | `/evaluations` | `{ projectId, criterionId, jurorId, score, comment? }` | angelegte Bewertung, 201 |
| PUT | `/evaluations/:id` | `{ score?, comment? }` | aktualisierte Bewertung |
| DELETE | `/evaluations/:id` | – | 204 |

Validierung der POST-Route, in dieser Reihenfolge:

1. Pflichtfelder `projectId`, `criterionId`, `jurorId`, `score` vorhanden → sonst 400 mit `missingFields`
2. alle drei IDs sind ganze Zahlen → sonst 400
3. alle drei referenzierten Datensätze existieren → sonst 400 mit `unbekannteReferenzen`
4. `score` ist eine ganze Zahl, nicht negativ und höchstens `Criterion.maxScore` → sonst 400
5. diese Kombination wurde noch nicht bewertet → sonst 409 mit `vorhandeneEvaluationId`

`projectId`, `criterionId` und `jurorId` können nachträglich nicht geändert werden, sie
identifizieren die Bewertung. Ein Versuch liefert 400, stattdessen die Bewertung löschen und
neu anlegen.

### Auswertung

`GET /projects/:id/auswertung` liefert den Durchschnitt der Punktzahl pro Kriterium mit
`AVG`, `COUNT`, `MIN` und `MAX` über `group: ['Criterion.id']`:

```json
{
  "project": { "id": 1, "titel": "Dezentrale Wahl-App", "teamId": 1, "team": "Team Blockchain", "praesentiertAm": "2026-06-12" },
  "kriterien": [
    {
      "criterionId": 1, "kriterium": "Inhalt", "maxScore": 10, "weight": 1,
      "anzahlBewertungen": 2, "durchschnitt": 8.5, "minimum": 8, "maximum": 9,
      "durchschnittProzent": 85
    }
  ],
  "gesamt": {
    "durchschnitt": 8.64, "summeGewicht": 3.5,
    "anzahlKriterien": 3, "anzahlBewerteterKriterien": 3, "summeBewertungen": 6
  }
}
```

Details zur Auswertung:

- Startpunkt ist `Criterion`, nicht `Evaluation`. Durch den `required: false`-Include entsteht
  ein LEFT JOIN, deshalb bleiben Kriterien ohne Bewertung mit `durchschnitt: null` und
  `anzahlBewertungen: 0` in der Antwort stehen und verschwinden nicht.
- `gesamt.durchschnitt` ist gewichtet: `SUM(Ø × weight) / SUM(weight)`, nicht der Mittelwert
  der Mittelwerte. Ohne Bewertungen ist der Wert `null`, nicht 0, damit er nicht als
  "schlecht bewertet" missverstanden wird.
- `durchschnittProzent` ist der Anteil am erreichbaren Maximum, praktisch für Balken im
  Frontend (Einheit 6/7).
- `GET /evaluations/auswertung` liefert dieselbe Rechnung über alle Projekte auf einmal,
  gruppiert nach `projectId` und `criterionId`, optional mit `?projectId=` eingeschränkt.

### Statuscodes

| Code | Bedeutung |
|---|---|
| 200 | Anfrage erfolgreich |
| 201 | Datensatz angelegt |
| 204 | Datensatz gelöscht, kein Body |
| 400 | Pflichtfeld fehlt, Wert ungültig, oder referenzierte ID im Body existiert nicht |
| 404 | Pfad existiert nicht, oder die `:id` in der URL gibt es nicht |
| 409 | Konflikt: Datensatz existiert bereits (Unique-Constraint) oder abhängige Datensätze verhindern das Löschen |
| 500 | Unerwarteter Serverfehler |

Die Abgrenzung 400 gegen 404: Geht es um die `:id` in der URL, ist es 404. Geht es um eine ID
im Body, die auf einen anderen Datensatz verweist, ist es 400, weil die angefragte URL selbst
existiert.

Alle Fehlerantworten haben die Form `{ "error": "...", "details": { ... } }`, `details` nur
wenn es Zusatzinformationen gibt.

## Bekannte Einschränkungen

- `frontend/` ist noch leer, es wird erst ab Einheit 6 aufgesetzt.
- Die API hat noch keine Authentifizierung, alle Routen sind offen. Der Schutz kommt in
  Einheit 7.
- `Juror.password` für den Login aus Einheit 7 existiert noch nicht, das Feld kommt mit dem
  JWT-Teil dazu.
- **Achtung Express 5:** `npm install express` hat Version 5 installiert, der Kurs geht von
  Express 4 aus. Der wichtigste Unterschied: bei einem POST **ohne Body** ist `req.body` in
  Express 5 `undefined` statt `{}`. `const { name } = req.body;` wirft dann einen `TypeError`.
  Deshalb läuft jeder Zugriff über `body(req)` aus `utils/validation.js`.
- `DELETE /teams/:id` löscht Mitglieder, Projekte und deren Bewertungen mit, weil die
  Fremdschlüssel auf `ON DELETE CASCADE` stehen. Das ist die Standard-CRUD-Antwort; wer das
  verhindern will, müsste die Projekte vorher einzeln löschen.
- Beim Löschen von Kriterien und Projekten verschwinden die zugehörigen Bewertungen
  ebenfalls per CASCADE.
- Die API ist noch nicht paginiert, `GET`-Routen liefern immer alle Datensätze. Bei den
  aktuellen Datenmengen unproblematisch, bei vielen Bewertungen müsste man `limit` und
  `offset` ergänzen.
- Die Datenbank läuft über XAMPP als MariaDB 10.4.32, nicht über MySQL Community Server.
  Der Sequelize-Dialect `mysql` funktioniert damit, MariaDB ist MySQL-kompatibel.
- Postman ist noch nicht installiert (wird für Einheit 5 gebraucht).
- Docker ist auf dem Arbeitsrechner nicht installiert. Es wird die native Variante A verwendet,
  damit ist Docker für dieses Projekt nicht erforderlich.
- Der npm-Global-Ordner musste dem Benutzer-PATH hinzugefügt werden, damit `ionic` in neuen
  Terminals gefunden wird.
