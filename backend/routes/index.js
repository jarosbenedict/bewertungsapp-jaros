'use strict';

const express = require('express');
const router = express.Router();

/**
 * Sammelt alle Ressourcen-Routen an einer Stelle, damit index.js nur eine
 * Zeile braucht und der Überblick erhalten bleibt.
 */
router.use('/teams', require('./teams'));
router.use('/members', require('./members'));
router.use('/projects', require('./projects'));
router.use('/criteria', require('./criteria'));
router.use('/jurors', require('./jurors'));
router.use('/evaluations', require('./evaluations'));

// Übersicht der verfügbaren Ressourcen, praktisch zum Prüfen im Browser
router.get('/', (req, res) => {
  res.json({
    name: 'Bewertungsapp API',
    ressourcen: ['/teams', '/members', '/projects', '/criteria', '/jurors', '/evaluations'],
    auswertung: ['/projects/:id/auswertung', '/evaluations/auswertung']
  });
});

module.exports = router;
