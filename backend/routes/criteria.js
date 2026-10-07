'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Criterion, Evaluation } = db;
const { HttpError } = require('../utils/errors');
const { body, requireFields, requireAtLeastOne, toInt, pick, trimmed } = require('../utils/validation');

/**
 * Vollständiges CRUD für Bewertungskriterien.
 *
 * GET    /criteria      alle Kriterien, optional ?withEvaluations=true
 * GET    /criteria/:id  ein Kriterium
 * POST   /criteria      neues Kriterium
 * PUT    /criteria/:id  Kriterium aktualisieren
 * DELETE /criteria/:id  Kriterium löschen
 *
 * name ist eindeutig, ein doppelter Name liefert 409 (Unique-Constraint).
 */

const CRITERION_FELDER = ['name', 'maxScore', 'weight'];

async function findCriterionOrFail(id) {
  const criterion = await Criterion.findByPk(id);
  if (!criterion) {
    throw HttpError.notFound(`Kriterium mit id ${id} nicht gefunden`);
  }
  return criterion;
}

function normalisiereKriteriumDaten(data) {
  const aenderungen = pick(data, CRITERION_FELDER);
  if (aenderungen.name !== undefined) aenderungen.name = trimmed(aenderungen.name, 'name');
  if (aenderungen.maxScore !== undefined) {
    aenderungen.maxScore = toInt(aenderungen.maxScore, 'maxScore');
    if (aenderungen.maxScore <= 0) {
      throw HttpError.badRequest('maxScore muss größer als 0 sein', { field: 'maxScore' });
    }
  }
  if (aenderungen.weight !== undefined) {
    const gewicht = Number(aenderungen.weight);
    if (Number.isNaN(gewicht) || gewicht <= 0) {
      throw HttpError.badRequest('weight muss eine Zahl größer als 0 sein', { field: 'weight' });
    }
    aenderungen.weight = gewicht;
  }
  return aenderungen;
}

router.get('/', async (req, res) => {
  const include = req.query.withEvaluations === 'true' ? [Evaluation] : [];
  const criteria = await Criterion.findAll({ include, order: [['id', 'ASC']] });
  res.json(criteria);
});

router.get('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  res.json(await findCriterionOrFail(id));
});

router.post('/', async (req, res) => {
  const data = body(req);
  requireFields(data, ['name', 'maxScore']);

  const criterion = await Criterion.create(normalisiereKriteriumDaten(data));
  res.status(201).json(criterion);
});

router.put('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const criterion = await findCriterionOrFail(id);

  const data = body(req);
  requireAtLeastOne(data, CRITERION_FELDER);

  await criterion.update(normalisiereKriteriumDaten(data));
  res.json(criterion);
});

router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const criterion = await findCriterionOrFail(id);
  await criterion.destroy();
  res.status(204).send();
});

module.exports = router;
