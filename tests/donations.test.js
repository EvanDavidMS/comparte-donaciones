'use strict';

const { request, auth, world, donationPayload, createDonation, createRequest, futureDate } = require('./helpers');

describe('Donaciones', () => {
  let w;
  beforeEach(async () => {
    w = await world();
  });

  describe('publicación', () => {
    test('un donador publica una donación disponible', async () => {
      const res = await request(w.app).post('/api/donations').set(auth(w.donor.token)).send(donationPayload());
      expect(res.status).toBe(201);
      expect(res.body.donation).toMatchObject({ status: 'disponible', quantity: 50, donor: { name: 'Súper Norte' } });
    });

    test('las categorías no alimentarias no requieren caducidad', async () => {
      const res = await request(w.app)
        .post('/api/donations')
        .set(auth(w.donor.token))
        .send(donationPayload({ category: 'ropa', unit: 'unidades', expiresAt: undefined, description: undefined }));
      expect(res.status).toBe(201);
      expect(res.body.donation.expiresAt).toBeNull();
      expect(res.body.donation.description).toBe('');
    });

    test.each(['beneficiario', 'admin'])('el rol %s no puede publicar donaciones', async (role) => {
      const token = role === 'admin' ? w.admin.token : w.org.token;
      const res = await request(w.app).post('/api/donations').set(auth(token)).send(donationPayload());
      expect(res.status).toBe(403);
    });

    test.each([
      ['alimentos sin caducidad', { expiresAt: undefined }, 'expiresAt'],
      ['fecha pasada', { expiresAt: '2020-01-01' }, 'expiresAt'],
      ['fecha de hoy', { expiresAt: new Date().toISOString().slice(0, 10) }, 'expiresAt'],
      ['fecha inexistente', { expiresAt: '2099-02-30' }, 'expiresAt'],
      ['formato de fecha', { expiresAt: '30/12/2099' }, 'expiresAt'],
      ['cantidad como texto', { quantity: '50' }, 'quantity'],
      ['cantidad negativa', { quantity: -3 }, 'quantity'],
      ['cantidad decimal', { quantity: 2.5 }, 'quantity'],
      ['cantidad excesiva', { quantity: 100001 }, 'quantity'],
      ['categoría inválida', { category: 'armas' }, 'category'],
      ['unidad inválida', { unit: 'toneladas' }, 'unit'],
      ['título con HTML', { title: '<img src=x onerror=alert(1)>' }, 'title'],
      ['título vacío', { title: '  ' }, 'title'],
    ])('valida la entrada: %s', async (_label, overrides, fieldName) => {
      const res = await request(w.app).post('/api/donations').set(auth(w.donor.token)).send(donationPayload(overrides));
      expect(res.status).toBe(400);
      expect(res.body.error.details.map((d) => d.field)).toContain(fieldName);
    });

    test('no acepta campos extra como el estado o el donante', async () => {
      const res = await request(w.app)
        .post('/api/donations')
        .set(auth(w.donor.token))
        .send({ ...donationPayload(), status: 'entregada', donorId: w.donor2.user.id });
      expect(res.status).toBe(400);
    });

    test('los datos con apariencia de inyección SQL se guardan como texto literal', async () => {
      const title = "Arroz' OR '1'='1";
      const res = await request(w.app).post('/api/donations').set(auth(w.donor.token)).send(donationPayload({ title }));
      expect(res.status).toBe(201);
      expect(res.body.donation.title).toBe(title);
      const list = await request(w.app).get('/api/donations').set(auth(w.donor2.token));
      expect(list.body.donations).toHaveLength(0);
    });
  });

  describe('consulta', () => {
    let mine;
    let other;
    beforeEach(async () => {
      mine = await createDonation(w.app, w.donor.token, { title: 'Leche entera', category: 'alimentos', unit: 'litros' });
      await createDonation(w.app, w.donor.token, { title: 'Chamarras', category: 'ropa', unit: 'unidades', expiresAt: undefined, location: 'Saltillo' });
      other = await createDonation(w.app, w.donor2.token, { title: 'Pan dulce' });
    });

    test('cada donador ve solo sus donaciones', async () => {
      const res = await request(w.app).get('/api/donations').set(auth(w.donor.token));
      expect(res.body.donations.map((d) => d.title).sort()).toEqual(['Chamarras', 'Leche entera']);
    });

    test('las organizaciones ven solo donaciones disponibles y sin correos del donante', async () => {
      await request(w.app).patch(`/api/donations/${other.id}/cancel`).set(auth(w.donor2.token));
      const res = await request(w.app).get('/api/donations').set(auth(w.org.token));
      expect(res.body.donations).toHaveLength(2);
      expect(res.body.donations.every((d) => d.status === 'disponible')).toBe(true);
      expect(res.body.donations[0].donor.email).toBeUndefined();
      expect(res.body.donations[0].myRequestStatus).toBeNull();
    });

    test('el administrador ve todas con el correo del donante', async () => {
      const res = await request(w.app).get('/api/donations').set(auth(w.admin.token));
      expect(res.body.donations).toHaveLength(3);
      expect(res.body.donations[0].donor.email).toMatch(/@test\.com$/);
    });

    test('filtra por texto, categoría y estado', async () => {
      const byText = await request(w.app).get('/api/donations?q=salti').set(auth(w.admin.token));
      expect(byText.body.donations.map((d) => d.title)).toEqual(['Chamarras']);
      const byCategory = await request(w.app).get('/api/donations?category=ropa').set(auth(w.admin.token));
      expect(byCategory.body.donations).toHaveLength(1);
      const byStatus = await request(w.app).get('/api/donations?status=entregada').set(auth(w.admin.token));
      expect(byStatus.body.donations).toHaveLength(0);
    });

    test('rechaza parámetros de consulta duplicados o inválidos', async () => {
      const dup = await request(w.app).get('/api/donations?q=a&q=b').set(auth(w.admin.token));
      expect(dup.status).toBe(400);
      const bad = await request(w.app).get('/api/donations?status=robada').set(auth(w.admin.token));
      expect(bad.status).toBe(400);
    });

    test('obtiene el detalle respetando permisos', async () => {
      expect((await request(w.app).get(`/api/donations/${mine.id}`).set(auth(w.donor.token))).status).toBe(200);
      expect((await request(w.app).get(`/api/donations/${mine.id}`).set(auth(w.org.token))).status).toBe(200);
      expect((await request(w.app).get(`/api/donations/${mine.id}`).set(auth(w.admin.token))).status).toBe(200);
      // Otro donador no puede verla (IDOR) y recibe 404 para no revelar que existe.
      expect((await request(w.app).get(`/api/donations/${mine.id}`).set(auth(w.donor2.token))).status).toBe(404);
    });

    test('una organización puede ver una donación que solicitó aunque ya no esté disponible', async () => {
      const r = await createRequest(w.app, w.org.token, mine.id);
      await request(w.app).patch(`/api/requests/${r.id}/approve`).set(auth(w.admin.token));
      const seen = await request(w.app).get(`/api/donations/${mine.id}`).set(auth(w.org.token));
      expect(seen.status).toBe(200);
      expect(seen.body.donation.myRequestStatus).toBe('aprobada');
      const hidden = await request(w.app).get(`/api/donations/${mine.id}`).set(auth(w.pendingOrg.token));
      expect(hidden.status).toBe(404);
    });

    test('identificadores inválidos o inexistentes responden 404', async () => {
      expect((await request(w.app).get('/api/donations/1%20OR%201=1').set(auth(w.admin.token))).status).toBe(404);
      expect((await request(w.app).get('/api/donations/00000000-0000-4000-8000-000000000000').set(auth(w.admin.token))).status).toBe(404);
    });

    test('requiere autenticación', async () => {
      expect((await request(w.app).get('/api/donations')).status).toBe(401);
    });
  });

  describe('cancelación y vencimiento', () => {
    let d;
    beforeEach(async () => {
      d = await createDonation(w.app, w.donor.token);
    });

    test('el donador cancela su donación y se rechazan las solicitudes pendientes', async () => {
      const r = await createRequest(w.app, w.org.token, d.id);
      const res = await request(w.app).patch(`/api/donations/${d.id}/cancel`).set(auth(w.donor.token));
      expect(res.status).toBe(200);
      expect(res.body.donation.status).toBe('cancelada');
      expect(w.store.requests.get(r.id)).toMatchObject({ status: 'rechazada', reason: 'La donación fue cancelada' });
    });

    test('otro donador no puede cancelarla', async () => {
      const res = await request(w.app).patch(`/api/donations/${d.id}/cancel`).set(auth(w.donor2.token));
      expect(res.status).toBe(404);
    });

    test('una organización no puede cancelar donaciones', async () => {
      const res = await request(w.app).patch(`/api/donations/${d.id}/cancel`).set(auth(w.org.token));
      expect(res.status).toBe(403);
    });

    test('el administrador puede cancelarla y no se cancela dos veces', async () => {
      expect((await request(w.app).patch(`/api/donations/${d.id}/cancel`).set(auth(w.admin.token))).status).toBe(200);
      const again = await request(w.app).patch(`/api/donations/${d.id}/cancel`).set(auth(w.admin.token));
      expect(again.status).toBe(409);
    });

    test('las donaciones con fecha vencida pasan a "vencida" y rechazan solicitudes', async () => {
      const r = await createRequest(w.app, w.org.token, d.id);
      w.store.donations.get(d.id).expiresAt = '2020-01-01';
      const res = await request(w.app).get('/api/donations').set(auth(w.donor.token));
      expect(res.body.donations[0].status).toBe('vencida');
      expect(w.store.requests.get(r.id).status).toBe('rechazada');
    });

    test('una fecha futura no vence la donación', async () => {
      w.store.donations.get(d.id).expiresAt = futureDate(2);
      const res = await request(w.app).get('/api/donations').set(auth(w.donor.token));
      expect(res.body.donations[0].status).toBe('disponible');
    });
  });
});
