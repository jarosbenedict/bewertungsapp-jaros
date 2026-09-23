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

- [ ] Alle Modelle (Team, Member, Project, Criterion, Juror, Evaluation) mit ausgefüllten `associate`-Methoden
- [ ] Unique-Constraint auf (projectId, criterionId, jurorId) bei Evaluation
- [ ] Mindestens ein Seeder mit Testdaten

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
- `backend/` enthält bisher nur die Einrichtung und die drei Modelle aus Einheit 2, die
  Routen folgen in Einheit 4.
- Die Datenbank läuft über XAMPP als MariaDB 10.4.32, nicht über MySQL Community Server.
  Der Sequelize-Dialect `mysql` funktioniert damit, MariaDB ist MySQL-kompatibel.
- Postman ist noch nicht installiert (wird für Einheit 5 gebraucht).
- Docker ist auf dem Arbeitsrechner nicht installiert. Es wird die native Variante A verwendet,
  damit ist Docker für dieses Projekt nicht erforderlich.
- Der npm-Global-Ordner musste dem Benutzer-PATH hinzugefügt werden, damit `ionic` in neuen
  Terminals gefunden wird.
