'use strict';

const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { AppError } = require('../utils/errors');

/** Cabeceras de seguridad: CSP estricta (sin scripts inline), anti-clickjacking, etc. */
const securityHeaders = () =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    referrerPolicy: { policy: 'no-referrer' },
  });

const permissionsPolicy = (req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
};

/** Las respuestas de la API nunca deben quedar en caché (contienen datos personales). */
const noStore = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
};

/**
 * Defensa CSRF adicional a SameSite=Strict: si el navegador envía Origin en una
 * petición que modifica datos, debe coincidir con el host del servidor.
 */
const sameOrigin = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return next(new AppError(403, 'Origen no permitido'));
  }
  return host === req.get('host') ? next() : next(new AppError(403, 'Origen no permitido'));
};

const limiter = (limit, windowMs, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError(429, message)),
  });

module.exports = { securityHeaders, permissionsPolicy, noStore, sameOrigin, limiter };
