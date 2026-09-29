'use strict';

const { request, auth, world, register, createDonation, createRequest } = require('./helpers');
const { MAX_PENDING_PER_BENEFICIARY } = require('../src/services/requestService');

describe('Solicitudes de donación', () => {
  let w;
  let d;
  beforeEach(async () => {
    w = await world();
    d = await createDonation(w.app, w.donor.token);
  });

  const patch = (path, token, body) => request(w.app).patch(path).set(auth(token)).send(body);

  describe('creación', () => {
    test('una organización verificada solicita una donación', async () => {
      const res = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: d.id, message: 'Para 40 familias' });
      expect(res.status).toBe(201);
      expect(res.body.request).toMatchObject({ status: 'pendiente', message: 'Para 40 familias', donation: { id: d.id } });
      expect(res.body.request.beneficiary.email).toBeUndefined();
    });

    test('el mensaje es opcional', async () => {
      const res = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: d.id });
      expect(res.status).toBe(201);
      expect(res.body.request.message).toBe('');
    });

    test('una organización sin verificar no puede solicitar', async () => {
      const res = await request(w.app).post('/api/requests').set(auth(w.pendingOrg.token)).send({ donationId: d.id });
      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/verificada/);
    });

    test('los donadores no pueden solicitar', async () => {
      const res = await request(w.app).post('/api/requests').set(auth(w.donor2.token)).send({ donationId: d.id });
      expect(res.status).toBe(403);
    });

    test('no permite solicitudes duplicadas activas', async () => {
      await createRequest(w.app, w.org.token, d.id);
      const res = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: d.id });
      expect(res.status).toBe(409);
    });

    test('valida el identificador de la donación', async () => {
      const bad = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: "' OR 1=1 --" });
      expect(bad.status).toBe(400);
      const missing = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: '00000000-0000-4000-8000-000000000000' });
      expect(missing.status).toBe(404);
    });

    test('no se puede solicitar una donación que ya no está disponible', async () => {
      await patch(`/api/donations/${d.id}/cancel`, w.donor.token);
      const res = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: d.id });
      expect(res.status).toBe(409);
    });

    test(`limita a ${MAX_PENDING_PER_BENEFICIARY} solicitudes pendientes por organización`, async () => {
      for (let i = 0; i < MAX_PENDING_PER_BENEFICIARY; i += 1) {
        const extra = await createDonation(w.app, w.donor.token, { title: `Donación ${i}` });
        await createRequest(w.app, w.org.token, extra.id);
      }
      const res = await request(w.app).post('/api/requests').set(auth(w.org.token)).send({ donationId: d.id });
      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/límite/);
    });
  });

  describe('consulta', () => {
    beforeEach(async () => {
      await createRequest(w.app, w.org.token, d.id);
    });

    test('la organización ve sus solicitudes y el catálogo marca lo ya solicitado', async () => {
      const res = await request(w.app).get('/api/requests').set(auth(w.org.token));
      expect(res.body.requests).toHaveLength(1);
      const catalog = await request(w.app).get('/api/donations').set(auth(w.org.token));
      expect(catalog.body.donations[0].myRequestStatus).toBe('pendiente');
    });

    test('el donador ve las solicitudes de sus donaciones y otro donador no', async () => {
      expect((await request(w.app).get('/api/requests').set(auth(w.donor.token))).body.requests).toHaveLength(1);
      expect((await request(w.app).get('/api/requests').set(auth(w.donor2.token))).body.requests).toHaveLength(0);
    });

    test('el administrador ve todo con datos de contacto y puede filtrar', async () => {
      const all = await request(w.app).get('/api/requests').set(auth(w.admin.token));
      expect(all.body.requests[0].beneficiary.email).toBe(w.org.email);
      const filtered = await request(w.app).get(`/api/requests?status=pendiente&donationId=${d.id}`).set(auth(w.admin.token));
      expect(filtered.body.requests).toHaveLength(1);
      const none = await request(w.app).get('/api/requests?status=entregada').set(auth(w.admin.token));
      expect(none.body.requests).toHaveLength(0);
      const other = await request(w.app).get('/api/requests?donationId=00000000-0000-4000-8000-000000000000').set(auth(w.admin.token));
      expect(other.body.requests).toHaveLength(0);
    });

    test('otra organización no ve solicitudes ajenas', async () => {
      const res = await request(w.app).get('/api/requests').set(auth(w.pendingOrg.token));
      expect(res.body.requests).toHaveLength(0);
    });
  });

  describe('flujo de aprobación', () => {
    let r;
    let r2;
    let org2;
    beforeEach(async () => {
      org2 = await register(w.app, { role: 'beneficiario' });
      await patch(`/api/admin/users/${org2.user.id}/status`, w.admin.token, { status: 'activo' });
      r = await createRequest(w.app, w.org.token, d.id);
      r2 = await createRequest(w.app, org2.token, d.id);
    });

    test('aprobar reserva la donación y rechaza a las demás organizaciones', async () => {
      const res = await patch(`/api/requests/${r.id}/approve`, w.admin.token);
      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe('aprobada');
      expect(w.store.donations.get(d.id)).toMatchObject({ status: 'reservada', assignedTo: w.org.user.id });
      expect(w.store.requests.get(r2.id)).toMatchObject({ status: 'rechazada', reason: 'La donación fue asignada a otra organización' });
      const donorView = await request(w.app).get(`/api/donations/${d.id}`).set(auth(w.donor.token));
      expect(donorView.body.donation.assignedTo.name).toBe(w.org.user.organization);
    });

    test('solo el administrador aprueba o rechaza', async () => {
      expect((await patch(`/api/requests/${r.id}/approve`, w.org.token)).status).toBe(403);
      expect((await patch(`/api/requests/${r.id}/approve`, w.donor.token)).status).toBe(403);
      expect((await patch(`/api/requests/${r.id}/reject`, w.donor.token, { reason: 'No' })).status).toBe(403);
    });

    test('no se aprueba dos veces ni una solicitud de donación reservada', async () => {
      await patch(`/api/requests/${r.id}/approve`, w.admin.token);
      expect((await patch(`/api/requests/${r.id}/approve`, w.admin.token)).status).toBe(409);
      w.store.requests.get(r2.id).status = 'pendiente';
      const res = await patch(`/api/requests/${r2.id}/approve`, w.admin.token);
      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/ya no está disponible/);
    });

    test('no se aprueba si la organización fue suspendida', async () => {
      await patch(`/api/admin/users/${w.org.user.id}/status`, w.admin.token, { status: 'suspendido' });
      const res = await patch(`/api/requests/${r.id}/approve`, w.admin.token);
      expect(res.status).toBe(409);
    });

    test('rechazar exige un motivo', async () => {
      expect((await patch(`/api/requests/${r.id}/reject`, w.admin.token, {})).status).toBe(400);
      const res = await patch(`/api/requests/${r.id}/reject`, w.admin.token, { reason: 'Fuera de zona' });
      expect(res.status).toBe(200);
      expect(res.body.request).toMatchObject({ status: 'rechazada', reason: 'Fuera de zona' });
      expect((await patch(`/api/requests/${r.id}/reject`, w.admin.token, { reason: 'Otra vez' })).status).toBe(409);
    });

    test('la organización cancela su solicitud pendiente, pero no la de otros', async () => {
      expect((await patch(`/api/requests/${r2.id}/cancel`, w.org.token)).status).toBe(404);
      const res = await patch(`/api/requests/${r.id}/cancel`, w.org.token);
      expect(res.body.request.status).toBe('cancelada');
      expect((await patch(`/api/requests/${r.id}/cancel`, w.org.token)).status).toBe(409);
    });

    test('la organización confirma la recepción y la donación queda entregada', async () => {
      expect((await patch(`/api/requests/${r.id}/confirm`, w.org.token)).status).toBe(409);
      await patch(`/api/requests/${r.id}/approve`, w.admin.token);
      expect((await patch(`/api/requests/${r.id}/confirm`, org2.token)).status).toBe(404);
      const res = await patch(`/api/requests/${r.id}/confirm`, w.org.token);
      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe('entregada');
      expect(w.store.donations.get(d.id).status).toBe('entregada');
    });

    test('el administrador también puede registrar la entrega', async () => {
      await patch(`/api/requests/${r.id}/approve`, w.admin.token);
      const res = await patch(`/api/requests/${r.id}/confirm`, w.admin.token);
      expect(res.body.request.status).toBe('entregada');
    });

    test('revocar una asignación libera la donación', async () => {
      expect((await patch(`/api/requests/${r.id}/revoke`, w.admin.token, { reason: 'No recogió' })).status).toBe(409);
      await patch(`/api/requests/${r.id}/approve`, w.admin.token);
      const res = await patch(`/api/requests/${r.id}/revoke`, w.admin.token, { reason: 'No recogió' });
      expect(res.status).toBe(200);
      expect(res.body.request).toMatchObject({ status: 'rechazada', reason: 'No recogió' });
      expect(w.store.donations.get(d.id)).toMatchObject({ status: 'disponible', assignedTo: null });
    });

    test('las solicitudes inexistentes responden 404', async () => {
      const res = await patch('/api/requests/00000000-0000-4000-8000-000000000000/approve', w.admin.token);
      expect(res.status).toBe(404);
    });
  });
});
