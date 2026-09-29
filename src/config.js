'use strict';

const crypto = require('node:crypto');

const MIN_SECRET_LENGTH = 32;

/**
 * Construye la configuración de la aplicación a partir de variables de entorno.
 * En producción exige secretos explícitos; en desarrollo genera valores seguros
 * temporales para que el proyecto funcione sin preparación previa.
 */
function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  let jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
    if (isProduction) {
      throw new Error(`JWT_SECRET es obligatorio en producción (mínimo ${MIN_SECRET_LENGTH} caracteres)`);
    }
    jwtSecret = crypto.randomBytes(48).toString('hex');
  }

  // Las credenciales nunca se escriben en el código: llegan por entorno
  // (en local, desde demo.env) o se generan aleatoriamente en desarrollo.
  if (isProduction && !env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD es obligatorio en producción');
  }
  const adminPassword = env.ADMIN_PASSWORD || randomPassword();
  const demoPassword = env.DEMO_PASSWORD || randomPassword();

  return {
    nodeEnv,
    isProduction,
    port: toInt(env.PORT, 3000),
    jwtSecret,
    jwtExpiresSec: toInt(env.JWT_EXPIRES_SEC, 2 * 60 * 60),
    cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProduction,
    trustProxy: env.TRUST_PROXY === 'true',
    dataFile: env.DATA_FILE === 'none' ? null : env.DATA_FILE || 'data/db.json',
    adminEmail: (env.ADMIN_EMAIL || 'admin@conectamas.org').toLowerCase(),
    adminPassword,
    seedDemo: env.SEED_DEMO ? env.SEED_DEMO === 'true' : !isProduction,
    demoPassword,
    generatedCredentials: !env.ADMIN_PASSWORD || !env.DEMO_PASSWORD,
    authRateLimit: toInt(env.AUTH_RATE_LIMIT, 20),
    apiRateLimit: toInt(env.API_RATE_LIMIT, 600),
  };
}

/** Contraseña temporal que cumple la política (mayúscula, minúscula y número). */
function randomPassword() {
  return `Tmp${crypto.randomBytes(6).toString('hex')}X9`;
}

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

module.exports = { loadConfig, MIN_SECRET_LENGTH };
