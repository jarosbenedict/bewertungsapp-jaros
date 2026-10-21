# Testbericht – Postman-Collection Bewertungsapp

Einheit 5, Benedict Jaros, 4a APC

## Aufbau

| Datei | Inhalt |
|---|---|
| `bewertungsapp.postman_collection.json` | 44 Requests in 7 Ordnern, 120 automatisierte Assertions |
| `bewertungsapp.postman_environment.json` | Environment `bewertungsapp-lokal` mit `baseUrl` |

Import in Postman: Environment zuerst importieren, dann die Collection. Ohne Environment
schlagen alle Requests fehl, weil `{{baseUrl}}` nicht aufgelöst werden kann.

`baseUrl` = `http://localhost:3000`. Ein Serverwechsel (anderer Port, Docker) erfordert nur
das Ändern dieser einen Variablen.

## Vorgehen

Die Collection ist so gebaut, dass sie **beliebig oft** hintereinander laufen kann:

- Testdaten werden mit eindeutigen Namen angelegt (`'Testteam ' + Date.now()` im Pre-request-Script).
- Die angelegten IDs werden als Collection-Variablen gespeichert (`testTeamId`, `testProjectId`, …)
  und in den folgenden Requests verwendet, damit nichts manuell nachgepflegt werden muss.
- Ordner `07 · Aufräumen` löscht alle Testdaten wieder. Die Seed-Daten der Einheit 3 bleiben
  dadurch unverändert.

Ausgeführt mit der Newman-CLI gegen das laufende Backend:

```
newman run docs/postman/bewertungsapp.postman_collection.json \
  -e docs/postman/bewertungsapp.postman_environment.json
```

## Ergebnis

```
iterations          1     failed 0
requests           44     failed 0
test-scripts       44     failed 0
prerequest-scripts  4     failed 0
assertions        120     failed 0
Dauer          1886 ms, durchschnittliche Antwortzeit 5 ms
```

Alle 44 Requests lieferten den erwarteten Statuscode, alle 120 Assertions waren erfolgreich.

## Ergebnisse pro Request

Die Spalte „erwartet" ist das, was im Tests-Tab geprüft wird, „erhalten" ist der tatsächliche
Statuscode aus dem Lauf.

### 01 · Teams

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 001 | GET alle Teams | 200 | 200 | OK |
| 002 | GET Team 1 | 200 | 200 | OK |
| 003 | POST Team gültig | 201 | 201 | OK |
| 004 | GET neues Team | 200 | 200 | OK |
| 005 | PUT Team | 200 | 200 | OK |
| 006 | GET Team nach Update | 200 | 200 | OK |
| 007 | NEG GET Team 9999 | 404 | 404 | OK |
| 008 | NEG GET Team abc | 400 | 400 | OK |
| 009 | NEG POST Team ohne `klasse` | 400 | 400 | OK |
| 010 | NEG POST Team ohne Body | 400 | 400 | OK |

### 02 · Members

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 011 | GET alle Members | 200 | 200 | OK |
| 012 | GET Members `?teamId=1` | 200 | 200 | OK |
| 013 | POST Member gültig | 201 | 201 | OK |
| 014 | NEG POST Member, `teamId` 9999 | 400 | 400 | OK |
| 015 | DELETE Member | 204 | 204 | OK |

### 03 · Projects

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 016 | GET alle Projects | 200 | 200 | OK |
| 017 | GET Project 1 mit Bewertungen | 200 | 200 | OK |
| 018 | POST Project gültig | 201 | 201 | OK |
| 019 | GET Auswertung Project 1 | 200 | 200 | OK |
| 020 | PUT Project | 200 | 200 | OK |
| 021 | NEG POST Project, `teamId` 9999 | 400 | 400 | OK |
| 022 | NEG POST Project, Datum `15.07.2026` | 400 | 400 | OK |

### 04 · Criteria

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 023 | GET alle Criteria | 200 | 200 | OK |
| 024 | POST Criterion gültig | 201 | 201 | OK |
| 025 | NEG POST Criterion, Name „Inhalt" doppelt | 409 | 409 | OK |
| 026 | NEG POST Criterion, `maxScore` 0 | 400 | 400 | OK |

### 05 · Jurors

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 027 | GET alle Jurors | 200 | 200 | OK |
| 028 | NEG POST Juror, E-Mail `keine-mail` | 400 | 400 | OK |
| 029 | NEG POST Juror, E-Mail doppelt | 409 | 409 | OK |
| 030 | NEG DELETE Juror 1 mit Bewertungen | 409 | 409 | OK |

### 06 · Evaluations

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 031 | GET alle Evaluations | 200 | 200 | OK |
| 032 | GET Auswertung aller Projekte | 200 | 200 | OK |
| 033 | POST Evaluation gültig | 201 | 201 | OK |
| 034 | NEG POST Evaluation ohne `score` | 400 | 400 | OK |
| 035 | NEG POST Evaluation, `projectId` 9999 | 400 | 400 | OK |
| 036 | NEG POST Evaluation, `score` 9 bei `maxScore` 5 | 400 | 400 | OK |
| 037 | NEG POST Evaluation doppelt | 409 | 409 | OK |
| 038 | PUT Evaluation | 200 | 200 | OK |
| 039 | GET Evaluation 1 | 200 | 200 | OK |
| 040 | DELETE Evaluation | 204 | 204 | OK |

### 07 · Aufräumen

| # | Request | Erwartet | Erhalten | Ergebnis |
|---|---|---|---|---|
| 041 | DELETE Testprojekt | 204 | 204 | OK |
| 042 | GET gelöschtes Projekt | 404 | 404 | OK |
| 043 | DELETE Testteam | 204 | 204 | OK |
| 044 | DELETE Testkriterium | 204 | 204 | OK |

## Die geforderten Negativtests im Detail

Die Aufgabenstellung verlangt mindestens zwei Negativtests mit automatisierter Prüfung.
Umgesetzt sind 15, hier die drei wichtigsten mit der tatsächlichen Antwort.

### 1. POST Team ohne Pflichtfeld `klasse` (Request 009)

Erwartet: 400 mit Fehlermeldung. Erhalten: **400**.

```json
{
  "error": "Pflichtfelder fehlen oder sind leer: klasse",
  "details": { "missingFields": ["klasse"] }
}
```

Geprüft wird der Statuscode, das Vorkommen von „klasse" in der Meldung und der Eintrag in
`details.missingFields`. Der Request hat zusätzlich gezeigt, dass das Feld nicht einfach
`null` gespeichert wird, sondern der Datensatz gar nicht erst entsteht.

### 2. POST Evaluation mit unbekanntem `projectId` (Request 035)

Erwartet: 400, weil die referenzierte ID nicht existiert. Erhalten: **400**.

```json
{
  "error": "Referenzierte IDs existieren nicht: projectId=9999",
  "details": { "unbekannteReferenzen": [{ "field": "projectId", "id": 9999 }] }
}
```

Bewusst 400 und nicht 404: die angefragte URL `/evaluations` existiert ja, der Fehler steckt
im Body.

### 3. POST Evaluation doppelt (Request 037)

Erwartet: 409. Erhalten: **409**.

```json
{
  "error": "Dieser Juror hat dieses Kriterium für dieses Projekt bereits bewertet",
  "details": { "vorhandeneEvaluationId": 1 }
}
```

Der Request wiederholt exakt die Kombination aus Request 033. Geprüft wird Statuscode,
Meldung und dass die ID der vorhandenen Bewertung mitgeliefert wird. Der Zahlenwert hängt
davon ab, welche IDs beim Lauf vergeben wurden, geprüft wird deshalb nur die Existenz des
Feldes, nicht ein fester Wert.

Die gleiche Antwort liefert die Kombination aus den Seed-Daten, dort ist
`vorhandeneEvaluationId` = 1.

### 4. GET Team mit nicht-numerischer ID (Request 008)

Erwartet: 400, nicht 500. Erhalten: **400**.

```json
{ "error": "id muss eine ganze Zahl sein (erhalten: \"abc\")" }
```

Das ist laut Aufgabenstellung der Fall, der beim Bauen der Route oft übersehen wird: Ein
`findByPk('abc')` würde in MySQL einen SQL-Fehler auslösen und ohne Prüfung als 500 enden.
Zusätzlich geprüft: `details` fehlt hier bewusst, die Meldung nennt den erhaltenen Wert direkt.

## Beim Testen gefundene Probleme

**In der API: keines.** Alle Endpunkte verhielten sich wie dokumentiert. Das war nicht
selbstverständlich, zwei Fehler waren vorher in der Einheit 4 aufgefallen und sind bereits
behoben: `toInt(true)` wurde zu `1` (jetzt strenge Regex-Prüfung), und kaputtes JSON im Body
lief in einen 500er statt 400 (jetzt `entity.parse.failed` → 400).

**In der Collection: vier Assertions waren falsch formuliert** und schlugen im ersten Lauf
fehl. Ursache war ein Typvergleich: `pm.collectionVariables.get()` liefert immer einen String,
`json.id` ist eine Zahl, deshalb schlug `pm.expect(json.id).to.eql('3')` fehl. Behoben durch
`Number(...)` vor dem Vergleich. Bei den Requests 014 und 021 war außerdem die erwartete
Fehlermeldung falsch: die Meldung lautet „Team mit id 9999 existiert nicht" und enthält das
Wort `teamId` nicht, geprüft wird jetzt `details.field`. Nach der Korrektur: 120 von 120
Assertions grün.

Das ist der eigentliche Nutzen der automatisierten Prüfung — die Fehler steckten im Test,
nicht in der API, und wären bei manuellem Durchklicken nicht aufgefallen.
