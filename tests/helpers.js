'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { Store } = require('../src/store/store');
const { loadConfig } = require('../src/config');
const { ensureAdmin } = require('../src/seed');

const PASSWORD = 'Segura123';
const ADMIN_PASSWORD = 'AdminTest123';
let counter = 0;

function buildApp(overrides = {}) {
  const config = {
    ...loadConfig({
      NODE_ENV: 'test',
      DATA_FILE: 'none',
      SEED_DEMO: 'false',
      ADMIN_PASSWORD,
      AUTH_RATE_LIMIT: '1000',
      API_RATE_LIMIT: '5000',
    }),
    ...overrides,
  };
  const store = new Store();
  const logger = { error: jest.fn() };
  const app = createApp({ store, config, logger });
  return { app, store, config, logger };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function register(app, overrides = {}) {
  counter += 1;
  const body = {
    name: 'Usuario Prueba',
    email: `usuario${counter}@test.com`,
    password: PASSWORD,
    role: 'donador',
    ...overrides,
  };
  if (body.role === 'beneficiario' && !('organization' in overrides)) body.organization = `Organización ${counter}`;
  const res = await request(app).post('/api/auth/register').send(body);
  return { res, token: res.body.token, user: res.body.user, email: body.email };
}

async function login(app, email, password = PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { res, token: res.body.token, user: res.body.user };
}

const futureDate = (days = 30) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const donationPayload = (overrides = {}) => ({
  title: 'Arroz blanco',
  category: 'alimentos',
  quantity: 50,
  unit: 'kg',
  expiresAt: futureDate(),
  location: 'Monterrey',
  description: 'Costales cerrados',
  ...overrides,
});

/** Crea un escenario completo: admin, dos donadores, organización activa y otra pendiente. */
async function world(overrides) {
  const ctx = buildApp(overrides);
  await ensureAdmin(ctx.store, ctx.config);
  const admin = await login(ctx.app, ctx.config.adminEmail, ADMIN_PASSWORD);
  const donor = await register(ctx.app, { role: 'donador', organization: 'Súper Norte' });
  const donor2 = await register(ctx.app, { role: 'donador' });
  const org = await register(ctx.app, { role: 'beneficiario' });
  const pendingOrg = await register(ctx.app, { role: 'beneficiario' });
  await request(ctx.app).patch(`/api/admin/users/${org.user.id}/status`).set(auth(admin.token)).send({ status: 'activo' });
  return { ...ctx, admin, donor, donor2, org, pendingOrg };
}

async function createDonation(app, token, overrides) {
  const res = await request(app).post('/api/donations').set(auth(token)).send(donationPayload(overrides));
  return res.body.donation;
}

async function createRequest(app, token, donationId, message = 'Lo necesitamos') {
  const res = await request(app).post('/api/requests').set(auth(token)).send({ donationId, message });
  return res.body.request;
}

module.exports = {
  request,
  buildApp,
  auth,
  register,
  login,
  world,
  futureDate,
  donationPayload,
  createDonation,
  createRequest,
  PASSWORD,
  ADMIN_PASSWORD,
};
