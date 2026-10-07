'use strict';

const express = require('express');
const router = express.Router();
const { fn, col } = require('sequelize');
const db = require('../models');
const { Evaluation, Project, Criterion, Juror } = db;
const { HttpError } = require('../utils/errors');
const { body, requireFields, requireAtLeastOne, toInt } = require('../utils/validation');

/**
 * Routen für die Assoziationsentität Evaluation.
 *
 * GET    /evaluations             alle Bewertungen, filterbar
 * GET    /evaluations/auswertung  Durchschnitt gruppiert nach Projekt und Kriterium
 * GET    /evaluations/:id         eine Bewertung
 * POST   /evaluations             neue Bewertung mit Validierung
 * PUT    /evaluations/:id         Bewertung korrigieren
 * DELETE /evaluations/:id         Bewertung löschen
 *
 * Achtung Reihenfolge: /auswertung muss vor /:id stehen, sonst würde
 * "auswertung" als id interpretiert.
 */

const EVALUATION_FELDER = ['projectId', 'criterionId', 'jurorId', 'score', 'comment'];

/**
 * Prüft, ob die drei referenzierten Datensätze existieren, und gibt sie
 * zurück. Fehlende Referenzen sind ein Fehler im Body, daher 400 und nicht
 * 404, die angefragte URL existiert ja.
 */
async function ladeReferenzen({ projectId, criterionId, jurorId }) {
  const [project, criterion, juror] = await Promise.all([
    Project.findByPk(projectId),
    Criterion.findByPk(criterionId),
    Juror.findByPk(jurorId)
  ]);

  const fehlend = [];
  if (!project) fehlend.push({ field: 'projectId', id: projectId });
  if (!criterion) fehlend.push({ field: 'criterionId', id: criterionId });
  if (!juror) fehlend.push({ field: 'jurorId', id: jurorId });

  if (fehlend.length > 0) {
    throw HttpError.badRequest(
      `Referenzierte IDs existieren nicht: ${fehlend.map((f) => `${f.field}=${f.id}`).join(', ')}`,
      { unbekannteReferenzen: fehlend }
    );
  }

  return { project, criterion, juror };
}

/**
 * Prüft die Punktzahl: ganze Zahl, nicht negativ, höchstens Criterion.maxScore.
 * Die Obergrenze kann kein DB-Constraint sein, weil sie in einer anderen
 * Tabelle steht, deshalb wird sie hier geprüft.
 */
function pruefeScore(score, criterion) {
  const zahl = toInt(score, 'score');
  if (zahl < 0) {
    throw HttpError.badRequest('score darf nicht negativ sein', { field: 'score', erhalten: zahl });
  }
  if (zahl > criterion.maxScore) {
    throw HttpError.badRequest(
      `score darf höchstens ${criterion.maxScore} sein (maxScore des Kriteriums "${criterion.name}")`,
      { field: 'score', erhalten: zahl, maxScore: criterion.maxScore }
    );
  }
  return zahl;
}

/**
 * Prüft, ob dieselbe Kombination schon bewertet wurde. Der Datenbank-
 * Unique-Constraint auf (projectId, criterionId, jurorId) bleibt als
 * Absicherung bestehen, hier gibt es nur die klarere Fehlermeldung.
 */
async function assertNochNichtBewertet(projectId, criterionId, jurorId, ausgenommenId = null) {
  const where = { projectId, criterionId, jurorId };
  const vorhanden = await Evaluation.findOne({ where });

  if (vorhanden && vorhanden.id !== ausgenommenId) {
    throw HttpError.conflict(
      'Dieser Juror hat dieses Kriterium für dieses Projekt bereits bewertet',
      { vorhandeneEvaluationId: vorhanden.id }
    );
  }
}

router.get('/', async (req, res) => {
  const where = {};
  for (const feld of ['projectId', 'criterionId', 'jurorId']) {
    if (req.query[feld] !== undefined) {
      where[feld] = toInt(req.query[feld], feld);
    }
  }

  const evaluations = await Evaluation.findAll({
    where,
    include: [Project, Criterion, Juror],
    order: [['projectId', 'ASC'], ['criterionId', 'ASC'], ['jurorId', 'ASC']]
  });
  res.json(evaluations);
});

/**
 * Gesamtauswertung für die Übersichtsseite: Durchschnitt pro Projekt und
 * Kriterium. group über zwei Spalten liefert eine Zeile je Kombination.
 * Optional mit ?projectId= auf ein Projekt einschränkbar.
 */
router.get('/auswertung', async (req, res) => {
  const where = {};
  if (req.query.projectId !== undefined) {
    where.projectId = toInt(req.query.projectId, 'projectId');
  }

  const rows = await Evaluation.findAll({
    where,
    attributes: [
      'projectId',
      'criterionId',
      [fn('AVG', col('Evaluation.score')), 'durchschnitt'],
      [fn('COUNT', col('Evaluation.id')), 'anzahlBewertungen']
    ],
    include: [
      { model: Project, attributes: ['id', 'titel'] },
      { model: Criterion, attributes: ['id', 'name', 'maxScore', 'weight'] }
    ],
    group: ['Evaluation.projectId', 'Evaluation.criterionId', 'Project.id', 'Criterion.id'],
    order: [['projectId', 'ASC'], ['criterionId', 'ASC']],
    raw: true
  });

  const zeilen = rows.map((row) => ({
    projectId: Number(row.projectId),
    projekt: row['Project.titel'],
    criterionId: Number(row.criterionId),
    kriterium: row['Criterion.name'],
    maxScore: row['Criterion.maxScore'],
    weight: row['Criterion.weight'],
    anzahlBewertungen: Number(row.anzahlBewertungen),
    durchschnitt: Number(Number(row.durchschnitt).toFixed(2))
  }));

  res.json(zeilen);
});

router.get('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const evaluation = await Evaluation.findByPk(id, { include: [Project, Criterion, Juror] });
  if (!evaluation) {
    throw HttpError.notFound(`Bewertung mit id ${id} nicht gefunden`);
  }
  res.json(evaluation);
});

// neue Bewertung anlegen
router.post('/', async (req, res) => {
  const data = body(req);
  requireFields(data, ['projectId', 'criterionId', 'jurorId', 'score']);

  const projectId = toInt(data.projectId, 'projectId');
  const criterionId = toInt(data.criterionId, 'criterionId');
  const jurorId = toInt(data.jurorId, 'jurorId');

  const { criterion } = await ladeReferenzen({ projectId, criterionId, jurorId });
  const score = pruefeScore(data.score, criterion);
  await assertNochNichtBewertet(projectId, criterionId, jurorId);

  const evaluation = await Evaluation.create({
    projectId,
    criterionId,
    jurorId,
    score,
    comment: data.comment === undefined || data.comment === null ? null : String(data.comment)
  });

  // Mit Verknüpfungen zurückgeben, damit der Client keine zweite Anfrage braucht
  const vollstaendig = await Evaluation.findByPk(evaluation.id, {
    include: [Project, Criterion, Juror]
  });
  res.status(201).json(vollstaendig);
});

// Bewertung korrigieren
router.put('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const evaluation = await Evaluation.findByPk(id);
  if (!evaluation) {
    throw HttpError.notFound(`Bewertung mit id ${id} nicht gefunden`);
  }

  const data = body(req);
  requireAtLeastOne(data, EVALUATION_FELDER);

  // Die drei Fremdschlüssel identifizieren die Bewertung, sie sind nach dem
  // Anlegen unveränderlich. Änderbar sind nur score und comment.
  for (const feld of ['projectId', 'criterionId', 'jurorId']) {
    if (data[feld] !== undefined && toInt(data[feld], feld) !== evaluation[feld]) {
      throw HttpError.badRequest(
        `${feld} kann nachträglich nicht geändert werden, dafür die Bewertung löschen und neu anlegen`,
        { field: feld }
      );
    }
  }

  const aenderungen = {};
  if (data.score !== undefined) {
    const criterion = await Criterion.findByPk(evaluation.criterionId);
    aenderungen.score = pruefeScore(data.score, criterion);
  }
  if (data.comment !== undefined) {
    aenderungen.comment = data.comment === null ? null : String(data.comment);
  }

  await evaluation.update(aenderungen);
  res.json(
    await Evaluation.findByPk(id, { include: [Project, Criterion, Juror] })
  );
});

router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const evaluation = await Evaluation.findByPk(id);
  if (!evaluation) {
    throw HttpError.notFound(`Bewertung mit id ${id} nicht gefunden`);
  }
  await evaluation.destroy();
  res.status(204).send();
});

module.exports = router;
