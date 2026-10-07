'use strict';

const { HttpError } = require('./errors');

/**
 * Express 5 liefert `undefined`, wenn ein Request ohne Body ankommt
 * (Express 4 lieferte hier `{}`). Deshalb immer über diese Funktion gehen,
 * sonst wirft jede Destrukturierung einen TypeError.
 */
function body(req) {
  return req.body ?? {};
}

/**
 * Prüft, ob alle Pflichtfelder vorhanden und nicht leer sind.
 */
function requireFields(data, fields) {
  const missing = fields.filter(
    (feld) => data[feld] === undefined || data[feld] === null || data[feld] === ''
  );
  if (missing.length > 0) {
    throw HttpError.badRequest(
      `Pflichtfelder fehlen oder sind leer: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

/**
 * Prüft, dass mindestens eines der Felder im Body steht (für PUT sinnvoll,
 * damit ein leerer Body nicht stillschweigend nichts tut).
 */
function requireAtLeastOne(data, fields) {
  const vorhanden = fields.filter((feld) => data[feld] !== undefined);
  if (vorhanden.length === 0) {
    throw HttpError.badRequest(
      `Mindestens eines dieser Felder muss angegeben werden: ${fields.join(', ')}`,
      { allowedFields: fields }
    );
  }
}

/**
 * Wandelt einen Wert in eine ganze Zahl. Path-Parameter sind in Express
 * immer Strings, daher hier die Umwandlung inkl. Plausibilitätsprüfung.
 *
 * Bewusst streng: `true` oder `"1.5"` sind keine gültigen IDs, `Number()`
 * würde daraus sonst stillschweigend 1 bzw. 1.5 machen. Ein Array (bei
 * doppelt angegebenem Query-Parameter) wird ebenfalls abgelehnt.
 */
function toInt(value, feld) {
  if (typeof value === 'boolean' || typeof value === 'object' || value === null || value === undefined) {
    throw HttpError.badRequest(`${feld} muss eine ganze Zahl sein (erhalten: ${JSON.stringify(value)})`);
  }
  const text = String(value).trim();
  if (!/^-?\d+$/.test(text)) {
    throw HttpError.badRequest(`${feld} muss eine ganze Zahl sein (erhalten: "${value}")`);
  }
  const zahl = Number(text);
  if (!Number.isSafeInteger(zahl)) {
    throw HttpError.badRequest(`${feld} liegt außerhalb des erlaubten Zahlenbereichs`);
  }
  return zahl;
}

/**
 * Übernimmt nur die tatsächlich übergebenen Felder, damit ein PUT keine
 * nicht gesendeten Werte auf null setzt.
 */
function pick(data, fields) {
  const ergebnis = {};
  for (const feld of fields) {
    if (data[feld] !== undefined) ergebnis[feld] = data[feld];
  }
  return ergebnis;
}

/**
 * Kürzt Textfelder und lehnt reine Leerstrings ab.
 */
function trimmed(value, feld) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw HttpError.badRequest(`${feld} darf nicht leer sein`);
  }
  return value.trim();
}

module.exports = { body, requireFields, requireAtLeastOne, toInt, pick, trimmed };
