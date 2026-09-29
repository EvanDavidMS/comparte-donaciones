'use strict';

const { AppError } = require('../utils/errors');

const apiNotFound = (req, res, next) => next(new AppError(404, 'Recurso no encontrado'));

/**
 * Manejador central de errores. Nunca expone trazas ni detalles internos:
 * los errores inesperados se registran en el servidor y el cliente recibe un 500 genérico.
 */
const errorHandler = (logger) => (err, req, res, _next) => {
  let error = err;
  if (err?.type === 'entity.parse.failed') error = new AppError(400, 'El cuerpo de la solicitud no es JSON válido');
  else if (err?.type === 'entity.too.large') error = new AppError(413, 'La solicitud es demasiado grande');
  else if (!(err instanceof AppError)) {
    logger.error('[error]', err);
    error = new AppError(500, 'Ocurrió un error interno. Intenta de nuevo más tarde.');
  }
  const body = { error: { code: error.code, message: error.message } };
  if (error.details) body.error.details = error.details;
  res.status(error.status).json(body);
};

module.exports = { apiNotFound, errorHandler };
