'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Team, Member, Project } = db;
const { HttpError } = require('../utils/errors');
const { body, requireFields, requireAtLeastOne, toInt, pick, trimmed } = require('../utils/validation');

/**
 * Vollständiges CRUD für Teams.
 *
 * GET    /teams              alle Teams inkl. Mitglieder und Projekte
 * GET    /teams/:id          ein Team inkl. Mitglieder und Projekte
 * GET    /teams/:id/members  nur die Mitglieder eines Teams
 * GET    /teams/:id/projects nur die Projekte eines Teams
 * POST   /teams              neues Team
 * PUT    /teams/:id          Team aktualisieren
 * DELETE /teams/:id          Team löschen (löscht Mitglieder und Projekte mit)
 */

const TEAM_FELDER = ['name', 'klasse'];

async function findTeamOrFail(id) {
  const team = await Team.findByPk(id);
  if (!team) {
    throw HttpError.notFound(`Team mit id ${id} nicht gefunden`);
  }
  return team;
}

// alle Teams
router.get('/', async (req, res) => {
  const teams = await Team.findAll({
    include: [Member, Project],
    order: [['id', 'ASC']]
  });
  res.json(teams);
});

// ein Team per ID
router.get('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const team = await Team.findByPk(id, { include: [Member, Project] });
  if (!team) {
    throw HttpError.notFound(`Team mit id ${id} nicht gefunden`);
  }
  res.json(team);
});

// verschachtelt: Mitglieder eines Teams
router.get('/:id/members', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  await findTeamOrFail(id);
  const members = await Member.findAll({ where: { teamId: id }, order: [['id', 'ASC']] });
  res.json(members);
});

// verschachtelt: Projekte eines Teams
router.get('/:id/projects', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  await findTeamOrFail(id);
  const projects = await Project.findAll({ where: { teamId: id }, order: [['id', 'ASC']] });
  res.json(projects);
});

// neues Team anlegen
router.post('/', async (req, res) => {
  const data = body(req);
  requireFields(data, TEAM_FELDER);

  const team = await Team.create({
    name: trimmed(data.name, 'name'),
    klasse: trimmed(data.klasse, 'klasse')
  });
  res.status(201).json(team);
});

// Team aktualisieren
router.put('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const team = await findTeamOrFail(id);

  const data = body(req);
  requireAtLeastOne(data, TEAM_FELDER);

  const aenderungen = pick(data, TEAM_FELDER);
  if (aenderungen.name !== undefined) aenderungen.name = trimmed(aenderungen.name, 'name');
  if (aenderungen.klasse !== undefined) aenderungen.klasse = trimmed(aenderungen.klasse, 'klasse');

  await team.update(aenderungen);
  res.json(team);
});

// Team löschen
router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const team = await findTeamOrFail(id);
  await team.destroy();
  res.status(204).send();
});

module.exports = router;
