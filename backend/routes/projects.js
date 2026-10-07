'use strict';

const express = require('express');
const router = express.Router();
const { fn, col } = require('sequelize');
const db = require('../models');
const { Project, Team, Evaluation, Criterion, Juror } = db;
const { HttpError } = require('../utils/errors');
const { body, requireFields, requireAtLeastOne, toInt, pick, trimmed } = require('../utils/validation');

/**
 * Vollständiges CRUD für Projekte inklusive der Auswertung.
 *
 * GET    /projects                 alle Projekte inkl. Team
 * GET    /projects/:id             ein Projekt inkl. Team und Bewertungen
 * GET    /projects/:id/evaluations die Bewertungen eines Projekts
 * GET    /projects/:id/auswertung  Durchschnitt der Punkte pro Kriterium
 * POST   /projects                 neues Projekt
 * PUT    /projects/:id             Projekt aktualisieren
 * DELETE /projects/:id             Projekt löschen
 */

const PROJECT_FELDER = ['teamId', 'titel', 'beschreibung', 'praesentiertAm'];

async function findProjectOrFail(id) {
  const project = await Project.findByPk(id);
  if (!project) {
    throw HttpError.notFound(`Projekt mit id ${id} nicht gefunden`);
  }
  return project;
}

async function assertTeamExists(teamId) {
  const team = await Team.findByPk(teamId);
  if (!team) {
    throw HttpError.badRequest(`Team mit id ${teamId} existiert nicht`, { field: 'teamId' });
  }
}

function normalisiereProjektDaten(data) {
  const aenderungen = pick(data, PROJECT_FELDER);
  if (aenderungen.teamId !== undefined) aenderungen.teamId = toInt(aenderungen.teamId, 'teamId');
  if (aenderungen.titel !== undefined) aenderungen.titel = trimmed(aenderungen.titel, 'titel');
  if (aenderungen.praesentiertAm !== undefined && aenderungen.praesentiertAm !== null) {
    const datum = String(aenderungen.praesentiertAm);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
      throw HttpError.badRequest('praesentiertAm muss das Format YYYY-MM-DD haben', {
        field: 'praesentiertAm',
        erhalten: datum
      });
    }
    aenderungen.praesentiertAm = datum;
  }
  return aenderungen;
}

router.get('/', async (req, res) => {
  const where = {};
  if (req.query.teamId !== undefined) {
    where.teamId = toInt(req.query.teamId, 'teamId');
  }
  const projects = await Project.findAll({ where, include: Team, order: [['id', 'ASC']] });
  res.json(projects);
});

// ein Projekt inkl. aller bisherigen Bewertungen
router.get('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const project = await Project.findByPk(id, {
    include: [
      Team,
      { model: Evaluation, include: [Criterion, Juror] }
    ]
  });
  if (!project) {
    throw HttpError.notFound(`Projekt mit id ${id} nicht gefunden`);
  }
  res.json(project);
});

// verschachtelt: Bewertungen eines Projekts
router.get('/:id/evaluations', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  await findProjectOrFail(id);
  const evaluations = await Evaluation.findAll({
    where: { projectId: id },
    include: [Criterion, Juror],
    order: [['criterionId', 'ASC'], ['jurorId', 'ASC']]
  });
  res.json(evaluations);
});

/**
 * Auswertung: Durchschnitt der Punktzahl pro Kriterium.
 *
 * Startpunkt ist Criterion (nicht Evaluation), damit Kriterien ohne Bewertung
 * mit durchschnitt null in der Antwort bleiben und nicht verschwinden. Der
 * LEFT JOIN entsteht durch required: false, die Einschränkung auf das Projekt
 * landet dadurch in der ON-Klausel.
 */
router.get('/:id/auswertung', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const project = await Project.findByPk(id, { include: Team });
  if (!project) {
    throw HttpError.notFound(`Projekt mit id ${id} nicht gefunden`);
  }

  const rows = await Criterion.findAll({
    attributes: [
      'id',
      'name',
      'maxScore',
      'weight',
      [fn('AVG', col('Evaluations.score')), 'durchschnitt'],
      [fn('COUNT', col('Evaluations.id')), 'anzahlBewertungen'],
      [fn('MIN', col('Evaluations.score')), 'minimum'],
      [fn('MAX', col('Evaluations.score')), 'maximum']
    ],
    include: [
      {
        model: Evaluation,
        attributes: [],
        required: false,
        where: { projectId: id }
      }
    ],
    group: ['Criterion.id'],
    order: [['id', 'ASC']],
    raw: true
  });

  const kriterien = rows.map((row) => {
    const anzahl = Number(row.anzahlBewertungen);
    const durchschnitt = anzahl > 0 ? Number(Number(row.durchschnitt).toFixed(2)) : null;
    return {
      criterionId: row.id,
      kriterium: row.name,
      maxScore: row.maxScore,
      weight: row.weight,
      anzahlBewertungen: anzahl,
      durchschnitt,
      minimum: anzahl > 0 ? Number(row.minimum) : null,
      maximum: anzahl > 0 ? Number(row.maximum) : null,
      // Anteil am erreichbaren Maximum, praktisch für Balken im Frontend
      durchschnittProzent: durchschnitt === null ? null : Number(((durchschnitt / row.maxScore) * 100).toFixed(1))
    };
  });

  // Gewichteter Gesamtdurchschnitt über alle Kriterien mit Bewertungen
  const bewertet = kriterien.filter((k) => k.anzahlBewertungen > 0);
  const summeGewicht = bewertet.reduce((summe, k) => summe + Number(k.weight), 0);
  const gesamt =
    summeGewicht > 0
      ? Number(
          (
            bewertet.reduce((summe, k) => summe + k.durchschnitt * Number(k.weight), 0) / summeGewicht
          ).toFixed(2)
        )
      : null;

  res.json({
    project: {
      id: project.id,
      titel: project.titel,
      teamId: project.teamId,
      team: project.Team ? project.Team.name : null,
      praesentiertAm: project.praesentiertAm
    },
    kriterien,
    gesamt: {
      // Gewichteter Durchschnitt über die Kriterien, nicht der Mittelwert der Mittelwerte
      durchschnitt: gesamt,
      summeGewicht: Number(summeGewicht.toFixed(2)),
      anzahlKriterien: kriterien.length,
      anzahlBewerteterKriterien: bewertet.length,
      summeBewertungen: kriterien.reduce((summe, k) => summe + k.anzahlBewertungen, 0)
    }
  });
});

router.post('/', async (req, res) => {
  const data = body(req);
  requireFields(data, ['teamId', 'titel']);

  const aenderungen = normalisiereProjektDaten(data);
  await assertTeamExists(aenderungen.teamId);

  const project = await Project.create(aenderungen);
  res.status(201).json(project);
});

router.put('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const project = await findProjectOrFail(id);

  const data = body(req);
  requireAtLeastOne(data, PROJECT_FELDER);

  const aenderungen = normalisiereProjektDaten(data);
  if (aenderungen.teamId !== undefined) {
    await assertTeamExists(aenderungen.teamId);
  }

  await project.update(aenderungen);
  res.json(project);
});

router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const project = await findProjectOrFail(id);
  await project.destroy();
  res.status(204).send();
});

module.exports = router;
