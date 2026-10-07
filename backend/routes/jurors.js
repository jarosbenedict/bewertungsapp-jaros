'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Juror, Evaluation } = db;
const { HttpError } = require('../utils/errors');
const { body, requireFields, requireAtLeastOne, toInt, pick, trimmed } = require('../utils/validation');

/**
 * Vollständiges CRUD für Juroren.
 *
 * GET    /jurors      alle Juroren
 * GET    /jurors/:id  ein Juror
 * POST   /jurors      neuer Juror
 * PUT    /jurors/:id  Juror aktualisieren
 * DELETE /jurors/:id  Juror löschen
 *
 * email ist eindeutig und dient ab Einheit 7 als Login-Kennung, ein Duplikat
 * liefert daher 409, ein ungültiges Format 400 (Model-Validator isEmail).
 */

const JUROR_FELDER = ['name', 'email'];

async function findJurorOrFail(id) {
  const juror = await Juror.findByPk(id);
  if (!juror) {
    throw HttpError.notFound(`Juror mit id ${id} nicht gefunden`);
  }
  return juror;
}

function normalisiereJurorDaten(data) {
  const aenderungen = pick(data, JUROR_FELDER);
  if (aenderungen.name !== undefined) aenderungen.name = trimmed(aenderungen.name, 'name');
  if (aenderungen.email !== undefined) aenderungen.email = trimmed(aenderungen.email, 'email').toLowerCase();
  return aenderungen;
}

router.get('/', async (req, res) => {
  // Passwortfelder gibt es hier noch nicht, deshalb darf die Liste roh raus.
  const jurors = await Juror.findAll({ order: [['id', 'ASC']] });
  res.json(jurors);
});

router.get('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  res.json(await findJurorOrFail(id));
});

router.post('/', async (req, res) => {
  const data = body(req);
  requireFields(data, JUROR_FELDER);

  const juror = await Juror.create(normalisiereJurorDaten(data));
  res.status(201).json(juror);
});

router.put('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const juror = await findJurorOrFail(id);

  const data = body(req);
  requireAtLeastOne(data, JUROR_FELDER);

  await juror.update(normalisiereJurorDaten(data));
  res.json(juror);
});

/**
 * Löschen nur, solange keine Bewertungen hängen. Sonst würde der
 * Fremdschlüssel die Bewertungen mitlöschen, was hier nicht gewollt ist.
 */
router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const juror = await findJurorOrFail(id);

  const anzahl = await Evaluation.count({ where: { jurorId: id } });
  if (anzahl > 0) {
    throw HttpError.conflict(
      `Juror ${id} hat noch ${anzahl} Bewertungen und kann nicht gelöscht werden`,
      { evaluations: anzahl }
    );
  }

  await juror.destroy();
  res.status(204).send();
});

module.exports = router;
