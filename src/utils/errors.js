'use strict';

const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  423: 'LOCKED',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
};

/** Error de negocio con código HTTP y mensaje seguro para mostrar al cliente. */
class AppError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code || DEFAULT_CODES[status] || 'ERROR';
    if (details) this.details = details;
  }
}

const notFound = (what = 'Recurso') => new AppError(404, `${what} no encontrado`);

/** Envuelve handlers async para que Express 4 capture sus errores. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { AppError, notFound, asyncHandler };
