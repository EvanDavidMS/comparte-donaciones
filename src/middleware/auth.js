'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

const COOKIE_NAME = 'comparte_token';
const ISSUER = 'comparte-api';
const AUDIENCE = 'comparte-web';

function signToken(user, config) {
  return jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresSec,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

function extractToken(req) {
  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.[COOKIE_NAME] || null;
}

/**
 * Resuelve el usuario del token. Además de la firma y expiración, verifica
 * contra el servidor que la cuenta siga activa y que la sesión no se haya
 * revocado (tokenVersion), así un logout o una suspensión invalidan tokens viejos.
 */
function resolveUser(req, store, config) {
  const token = extractToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
  } catch {
    return null;
  }
  const user = store.users.get(payload.sub);
  if (!user || user.status === 'suspendido' || user.tokenVersion !== payload.tv) return null;
  return user;
}

const authenticate = (store, config) => (req, res, next) => {
  const hadToken = Boolean(extractToken(req));
  const user = resolveUser(req, store, config);
  if (!user) {
    return next(new AppError(401, hadToken ? 'Tu sesión expiró o no es válida' : 'Debes iniciar sesión'));
  }
  req.user = user;
  return next();
};

const authorize =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role) ? next() : next(new AppError(403, 'No tienes permisos para realizar esta acción'));

function setSessionCookie(res, token, config) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    maxAge: config.jwtExpiresSec * 1000,
    path: '/',
  });
}

function clearSessionCookie(res, config) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict', secure: config.cookieSecure, path: '/' });
}

module.exports = {
  COOKIE_NAME,
  signToken,
  resolveUser,
  authenticate,
  authorize,
  setSessionCookie,
  clearSessionCookie,
};
