'use strict';

const { request, auth, world, buildApp, createDonation, createRequest } = require('./helpers');

describe('Estadísticas', () => {
  let w;
  beforeEach(async () => {
    w = await world();
    const d = await createDonation(w.app, w.donor.token, { quantity: 30 });
    await createDonation(w.app, w.donor.token, { category: 'ropa', unit: 'unidades', expiresAt: undefined });
    await createDonation(w.app, w.donor2.token);
    const r = await createRequest(w.app, w.org.token, d.id);
    await request(w.app).patch(`/api/requests/${r.id}/approve`).set(auth(w.admin.token));
    await request(w.app).patch(`/api/requests/${r.id}/confirm`).set(auth(w.org.token));
  });

  test('las métricas públicas no requieren sesión ni exponen datos personales', async () => {
    const res = await request(w.app).get('/api/stats/public');
    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({ availableDonations: 2, deliveredDonations: 1, deliveredKg: 30, verifiedOrganizations: 1, activeDonors: 2 });
    expect(res.body.demo).toBeUndefined();
  });

  test('en modo demostración se informan las cuentas de prueba', async () => {
    const { app } = buildApp({ seedDemo: true });
    const res = await request(app).get('/api/stats/public');
    expect(res.body.demo.accounts).toHaveLength(3);
  });

  test('el administrador recibe el resumen global', async () => {
    const { body } = await request(w.app).get('/api/stats').set(auth(w.admin.token));
    expect(body.stats.users).toMatchObject({ total: 5, donadores: 2, beneficiarios: 2, pendientes: 1, suspendidos: 0 });
    expect(body.stats.donations).toMatchObject({ disponible: 2, entregada: 1 });
    expect(body.stats.byCategory).toMatchObject({ alimentos: 2, ropa: 1 });
    expect(body.stats.requests.entregada).toBe(1);
    expect(body.stats.delivered.kg).toBe(30);
    expect(body.stats.topDonors[0]).toMatchObject({ name: 'Súper Norte', delivered: 1, total: 2 });
  });

  test('el donador recibe su impacto', async () => {
    const { body } = await request(w.app).get('/api/stats').set(auth(w.donor.token));
    expect(body.stats).toMatchObject({ total: 2, organizationsHelped: 1, pendingRequests: 0 });
    expect(body.stats.delivered.kg).toBe(30);
  });

  test('la organización recibe lo que ha recibido', async () => {
    const { body } = await request(w.app).get('/api/stats').set(auth(w.org.token));
    expect(body.stats).toMatchObject({ accountStatus: 'activo', availableDonations: 2, receivedCount: 1 });
    expect(body.stats.received.kg).toBe(30);
  });

  test('las métricas privadas requieren sesión', async () => {
    expect((await request(w.app).get('/api/stats')).status).toBe(401);
  });
});
