'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Member, Team } = db;
const { HttpError } = require('../utils/errors');
const { body, requireFields, requireAtLeastOne, toInt, pick, trimmed } = require('../utils/validation');

/**
 * Vollständiges CRUD für Mitglieder. Team steht als Referenz bereit, damit
 * die Zuordnung in der Antwort sichtbar ist.
 *
 * GET    /members           alle Mitglieder, optional ?teamId= filtern
 * GET    /members/:id       ein Mitglied
 * POST   /members           neues Mitglied
 * PUT    /members/:id       Mitglied aktualisieren
 * DELETE /members/:id       Mitglied löschen
 */

const MEMBER_FELDER = ['teamId', 'vorname', 'nachname'];

async function findMemberOrFail(id) {
  const member = await Member.findByPk(id, { include: Team });
  if (!member) {
    throw HttpError.notFound(`Mitglied mit id ${id} nicht gefunden`);
  }
  return member;
}

/**
 * Prüft, ob das angegebene Team existiert. Verhindert eine unmögliche Zuordnung
 * schon vor dem Insert mit einer klaren Meldung.
 */
async function assertTeamExists(teamId) {
  const team = await Team.findByPk(teamId);
  if (!team) {
    throw HttpError.badRequest(`Team mit id ${teamId} existiert nicht`, { field: 'teamId' });
  }
}

router.get('/', async (req, res) => {
  const where = {};
  if (req.query.teamId !== undefined) {
    where.teamId = toInt(req.query.teamId, 'teamId');
  }
  const members = await Member.findAll({ where, include: Team, order: [['id', 'ASC']] });
  res.json(members);
});

router.get('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  res.json(await findMemberOrFail(id));
});

router.post('/', async (req, res) => {
  const data = body(req);
  requireFields(data, MEMBER_FELDER);

  const teamId = toInt(data.teamId, 'teamId');
  await assertTeamExists(teamId);

  const member = await Member.create({
    teamId,
    vorname: trimmed(data.vorname, 'vorname'),
    nachname: trimmed(data.nachname, 'nachname')
  });
  res.status(201).json(member);
});

router.put('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const member = await findMemberOrFail(id);

  const data = body(req);
  requireAtLeastOne(data, MEMBER_FELDER);

  const aenderungen = pick(data, MEMBER_FELDER);
  if (aenderungen.teamId !== undefined) {
    aenderungen.teamId = toInt(aenderungen.teamId, 'teamId');
    await assertTeamExists(aenderungen.teamId);
  }
  if (aenderungen.vorname !== undefined) aenderungen.vorname = trimmed(aenderungen.vorname, 'vorname');
  if (aenderungen.nachname !== undefined) aenderungen.nachname = trimmed(aenderungen.nachname, 'nachname');

  await member.update(aenderungen);
  res.json(member);
});

router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const member = await findMemberOrFail(id);
  await member.destroy();
  res.status(204).send();
});

module.exports = router;
