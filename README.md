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

- [ ] Ausgefüllte Planungsvorlage: `docs/diagramm/planungsvorlage.html`
- [ ] Verwendete `model:generate`-Befehle dokumentiert
- [ ] Screenshot der angelegten Tabellen im DB-Tool: `docs/screenshots/`

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

- `backend/` und `frontend/` sind noch leer, sie werden erst ab Einheit 2 (Backend) bzw.
  Einheit 6 (Frontend) aufgesetzt. In Einheit 1 existiert nur die Ordnerstruktur.
- Die Datenbank läuft über XAMPP als MariaDB 10.4.32, nicht über MySQL Community Server.
  Der Sequelize-Dialect `mysql` funktioniert damit, MariaDB ist MySQL-kompatibel.
- Postman ist noch nicht installiert (wird für Einheit 5 gebraucht).
- Docker ist auf dem Arbeitsrechner nicht installiert. Es wird die native Variante A verwendet,
  damit ist Docker für dieses Projekt nicht erforderlich.
- Der npm-Global-Ordner musste dem Benutzer-PATH hinzugefügt werden, damit `ionic` in neuen
  Terminals gefunden wird.
