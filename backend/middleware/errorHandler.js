'use strict';

const {
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ValidationError
} = require('sequelize');
const { HttpError } = require('../utils/errors');

/**
 * Wird für nicht existierende Routen aufgerufen.
 */
function notFound(req, res) {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} existiert nicht`
  });
}

/**
 * Zentrale Fehlerbehandlung. Express 5 leitet auch abgelehnte Promises aus
 * async-Routen automatisch hierher, deshalb brauchen die Routen kein try/catch.
 *
 * next muss als vierter Parameter stehen, sonst erkennt Express die Funktion
 * nicht als Error-Handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Eigene Fehler aus den Routen
  if (err instanceof HttpError) {
    const antwort = { error: err.message };
    if (err.details !== undefined) antwort.details = err.details;
    return res.status(err.status).json(antwort);
  }

  // Datenbankfehler in passende Statuscodes übersetzen
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      error: 'Ein Datensatz mit diesen Werten existiert bereits',
      details: err.errors.map((e) => ({ field: e.path, message: e.message }))
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      error: 'Die referenzierte ID existiert nicht',
      details: { fields: err.fields }
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validierung fehlgeschlagen',
      details: err.errors.map((e) => ({ field: e.path, message: e.message }))
    });
  }

  // express.json() lehnt kaputtes JSON ab. Ohne diesen Zweig würde daraus
  // ein 500er, obwohl der Fehler beim Aufrufer liegt.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Ungültiges JSON im Request-Body' });
  }

  // Weitere Fehler, die bereits einen 4xx-Status mitbringen (z.B. zu großer
  // Body von express.json()), durchreichen statt sie zu verschlucken.
  const status = err.status || err.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.expose ? err.message : 'Ungültige Anfrage' });
  }

  // Alles andere ist ein echter Serverfehler
  console.error(err);
  res.status(500).json({ error: 'Unerwarteter Serverfehler' });
}

module.exports = { notFound, errorHandler };
