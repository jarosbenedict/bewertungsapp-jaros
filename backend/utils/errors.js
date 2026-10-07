'use strict';

/**
 * Fehler mit HTTP-Status. Wird vom zentralen errorHandler in eine JSON-Antwort
 * umgewandelt, damit die Routen selbst nur `throw` schreiben müssen.
 */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    if (details !== undefined) this.details = details;
  }

  static badRequest(message, details) {
    return new HttpError(400, message, details);
  }

  static notFound(message, details) {
    return new HttpError(404, message, details);
  }

  static conflict(message, details) {
    return new HttpError(409, message, details);
  }
}

module.exports = { HttpError };
