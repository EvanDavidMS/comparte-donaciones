'use strict';

const { AppError } = require('../utils/errors');
const { UUID_RE } = require('../utils/validators');

/**
 * Valida req[source] con un esquema zod. Los datos validados sustituyen a los
 * originales, de modo que las rutas nunca trabajan con campos no esperados.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new AppError(400, details[0].message, 'VALIDATION_ERROR', details));
  }
  if (source === 'query') req.validatedQuery = result.data;
  else req[source] = result.data;
  return next();
};

/** Rechaza identificadores que no sean UUID con 404 para no revelar nada. */
const uuidParam = (req, res, next, id) => (UUID_RE.test(id) ? next() : next(new AppError(404, 'Recurso no encontrado')));

module.exports = { validate, uuidParam };
