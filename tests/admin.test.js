'use strict';

const { request, auth, world, login, createDonation, createRequest, PASSWORD } = require('./helpers');

describe('Administración', () => {
  let w;
  beforeEach(async () => {
    w = await world();
  });
  const setStatus = (id, status, token = w.admin.token) => request(w.app).patch(`/api/admin/users/${id}/status`).set(auth(token)).send({ status });

  test('lista usuarios con filtros y sin datos sensibles', async () => {
    const all = await request(w.app).get('/api/admin/users').set(auth(w.admin.token));
    expect(all.status).toBe(200);
    expect(all.body.users).toHaveLength(5);
    expect(all.body.users.some((u) => 'passwordHash' in u)).toBe(false);
    const pending = await request(w.app).get('/api/admin/users?status=pendiente').set(auth(w.admin.token));
    expect(pending.body.users.map((u) => u.id)).toEqual([w.pendingOrg.user.id]);
    const donors = await request(w.app).get('/api/admin/users?role=donador').set(auth(w.admin.token));
    expect(donors.body.users).toHaveLength(2);
  });

  test.each(['donor', 'org'])('el rol %s no accede a la administración', async (who) => {
    const res = await request(w.app).get('/api/admin/users').set(auth(w[who].token));
    expect(res.status).toBe(403);
    expect((await request(w.app).get('/api/admin/audit').set(auth(w[who].token))).status).toBe(403);
  });

  test('verificar una organización le permite solicitar donaciones', async () => {
    const res = await setStatus(w.pendingOrg.user.id, 'activo');
    expect(res.body.user.status).toBe('activo');
    const d = await createDonation(w.app, w.donor.token);
    const r = await createRequest(w.app, w.pendingOrg.token, d.id);
    expect(r.status).toBe('pendiente');
  });

  test('suspender una cuenta cierra sus sesiones y bloquea el acceso', async () => {
    await setStatus(w.donor.user.id, 'suspendido');
    expect((await request(w.app).get('/api/auth/me').set(auth(w.donor.token))).status).toBe(401);
    const { res } = await login(w.app, w.donor.email, PASSWORD);
    expect(res.status).toBe(403);
    const back = await setStatus(w.donor.user.id, 'activo');
    expect(back.body.user.status).toBe('activo');
    expect((await login(w.app, w.donor.email, PASSWORD)).res.status).toBe(200);
  });

  test('no permite modificar cuentas administradoras', async () => {
    const res = await setStatus(w.admin.user.id, 'suspendido');
    expect(res.status).toBe(403);
  });

  test('valida el estado y la existencia del usuario', async () => {
    expect((await setStatus(w.donor.user.id, 'activo')).status).toBe(409);
    expect((await setStatus(w.donor.user.id, 'admin')).status).toBe(400);
    expect((await setStatus('00000000-0000-4000-8000-000000000000', 'activo')).status).toBe(404);
    expect((await setStatus('no-es-uuid', 'activo')).status).toBe(404);
  });

  test('registra las acciones en la auditoría', async () => {
    await setStatus(w.pendingOrg.user.id, 'activo');
    const res = await request(w.app).get('/api/admin/audit').set(auth(w.admin.token));
    const actions = res.body.entries.map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(['REGISTRO', 'INICIO_SESION', 'USUARIO_VERIFICADO']));
    expect(res.body.entries[0]).toMatchObject({ action: 'USUARIO_VERIFICADO', actorRole: 'admin' });
  });

  test('registra en auditoría el bloqueo por intentos fallidos', async () => {
    for (let i = 0; i < 5; i += 1) await login(w.app, w.donor.email, 'Incorrecta1');
    const res = await request(w.app).get('/api/admin/audit').set(auth(w.admin.token));
    expect(res.body.entries[0]).toMatchObject({ action: 'CUENTA_BLOQUEADA', actorName: 'Sistema' });
  });
});
