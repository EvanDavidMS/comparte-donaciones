'use strict';

const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const { AppError, notFound } = require('../utils/errors');
const audit = require('./auditService');

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
// Hash de referencia para igualar el tiempo de respuesta cuando el correo no existe.
const DUMMY_HASH = bcrypt.hashSync('comparte-timing-guard', BCRYPT_ROUNDS);

/** Proyección segura del usuario: nunca incluye hash, intentos ni versión de token. */
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    status: user.status,
    createdAt: user.createdAt,
  };
}

const displayName = (user) => user.organization || user.name;

function findByEmail(store, email) {
  for (const user of store.users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

async function createUser(store, { name, email, password, role, organization = '', status }) {
  if (findByEmail(store, email)) {
    throw new AppError(409, 'El correo electrónico ya está registrado');
  }
  const user = {
    id: randomUUID(),
    name,
    email,
    role,
    organization,
    // Las organizaciones beneficiarias deben ser verificadas por un administrador.
    status: status || (role === 'beneficiario' ? 'pendiente' : 'activo'),
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    tokenVersion: 0,
    failedLogins: 0,
    lockUntil: null,
    createdAt: new Date().toISOString(),
  };
  store.users.set(user.id, user);
  store.scheduleSave();
  return user;
}

const invalidCredentials = () => new AppError(401, 'Correo o contraseña incorrectos', 'INVALID_CREDENTIALS');

async function verifyCredentials(store, email, password, now = Date.now()) {
  const user = findByEmail(store, email);
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw invalidCredentials();
  }
  if (user.lockUntil && user.lockUntil > now) {
    throw new AppError(423, 'Cuenta bloqueada temporalmente por varios intentos fallidos. Intenta en 15 minutos.');
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    user.failedLogins += 1;
    if (user.failedLogins >= MAX_FAILED_LOGINS) {
      user.lockUntil = now + LOCK_MS;
      user.failedLogins = 0;
      audit.record(store, null, 'CUENTA_BLOQUEADA', `Bloqueo temporal de ${user.email} por intentos fallidos`);
    }
    store.scheduleSave();
    throw invalidCredentials();
  }
  if (user.status === 'suspendido') {
    throw new AppError(403, 'Tu cuenta está suspendida. Contacta al administrador.');
  }
  user.failedLogins = 0;
  user.lockUntil = null;
  store.scheduleSave();
  return user;
}

/** Revoca todas las sesiones activas del usuario (logout o suspensión). */
function revokeSessions(store, user) {
  user.tokenVersion += 1;
  store.scheduleSave();
}

function listUsers(store, { role, status } = {}) {
  return [...store.users.values()]
    .filter((u) => (!role || u.role === role) && (!status || u.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(publicUser);
}

function setUserStatus(store, actor, userId, status) {
  const user = store.users.get(userId);
  if (!user) throw notFound('Usuario');
  if (user.role === 'admin') {
    throw new AppError(403, 'Las cuentas administradoras no se pueden modificar desde aquí');
  }
  if (user.status === status) {
    throw new AppError(409, `La cuenta ya está ${status}`);
  }
  const previous = user.status;
  user.status = status;
  if (status === 'suspendido') revokeSessions(store, user);
  store.scheduleSave();
  const action = status === 'suspendido' ? 'USUARIO_SUSPENDIDO' : previous === 'pendiente' ? 'USUARIO_VERIFICADO' : 'USUARIO_REACTIVADO';
  audit.record(store, actor, action, `${displayName(user)} (${user.email})`);
  return publicUser(user);
}

module.exports = {
  MAX_FAILED_LOGINS,
  LOCK_MS,
  publicUser,
  displayName,
  findByEmail,
  createUser,
  verifyCredentials,
  revokeSessions,
  listUsers,
  setUserStatus,
};
