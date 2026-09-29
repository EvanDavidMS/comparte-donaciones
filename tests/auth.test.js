'use strict';

const jwt = require('jsonwebtoken');
const { request, buildApp, auth, register, login, PASSWORD } = require('./helpers');
const { COOKIE_NAME } = require('../src/middleware/auth');
const { MAX_FAILED_LOGINS } = require('../src/services/userService');

describe('Registro', () => {
  let app;
  beforeEach(() => ({ app } = buildApp()));

  test('registra un donador activo y abre sesión con cookie segura', async () => {
    const { res } = await register(app, { email: 'Ana@Test.com' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: 'donador', status: 'activo', email: 'ana@test.com' });
    expect(res.body.token).toEqual(expect.any(String));
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(new RegExp(`^${COOKIE_NAME}=`));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  test('nunca devuelve el hash de la contraseña ni datos internos', async () => {
    const { res } = await register(app);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('tokenVersion');
    expect(res.body.user).not.toHaveProperty('failedLogins');
  });

  test('las organizaciones beneficiarias quedan pendientes de verificación', async () => {
    const { res } = await register(app, { role: 'beneficiario', organization: 'Comedor Luz' });
    expect(res.status).toBe(201);
    expect(res.body.user.status).toBe('pendiente');
  });

  test('exige el nombre de la organización a beneficiarios', async () => {
    const { res } = await register(app, { role: 'beneficiario', organization: undefined });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('organization');
  });

  test('impide autoasignarse el rol de administrador (escalada de privilegios)', async () => {
    const { res } = await register(app, { role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rechaza campos no permitidos (asignación masiva)', async () => {
    const { res } = await register(app, { status: 'activo' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no permitidos/);
  });

  test.each([
    ['corta', 'Ab1'],
    ['sin mayúscula', 'segura123'],
    ['sin minúscula', 'SEGURA123'],
    ['sin número', 'SeguraSegura'],
  ])('rechaza contraseñas débiles (%s)', async (_label, password) => {
    const { res } = await register(app, { password });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('password');
  });

  test('rechaza correos duplicados sin importar mayúsculas', async () => {
    await register(app, { email: 'dup@test.com' });
    const { res } = await register(app, { email: 'DUP@test.com' });
    expect(res.status).toBe(409);
  });

  test('rechaza marcado HTML en campos de texto (defensa contra XSS)', async () => {
    const { res } = await register(app, { name: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/caracteres no permitidos/);
  });

  test('rechaza tipos inesperados (inyección de objetos)', async () => {
    const { res } = await register(app, { email: { $ne: '' } });
    expect(res.status).toBe(400);
  });
});

describe('Inicio de sesión', () => {
  let app;
  let email;
  beforeEach(async () => {
    ({ app } = buildApp());
    ({ email } = await register(app));
  });

  test('inicia sesión con credenciales válidas', async () => {
    const { res } = await login(app, email.toUpperCase());
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.expiresIn).toBe(7200);
  });

  test('usa el mismo mensaje para contraseña incorrecta y correo inexistente', async () => {
    const wrong = await login(app, email, 'Incorrecta1');
    const unknown = await login(app, 'nadie@test.com', 'Incorrecta1');
    expect(wrong.res.status).toBe(401);
    expect(unknown.res.status).toBe(401);
    expect(wrong.res.body.error.message).toBe(unknown.res.body.error.message);
  });

  test(`bloquea la cuenta tras ${MAX_FAILED_LOGINS} intentos fallidos`, async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i += 1) await login(app, email, 'Incorrecta1');
    const { res } = await login(app, email, PASSWORD);
    expect(res.status).toBe(423);
  });

  test('desbloquea la cuenta cuando vence el bloqueo', async () => {
    const { store } = buildApp();
    const users = require('../src/services/userService');
    const user = await users.createUser(store, { name: 'Bloq', email: 'b@test.com', password: PASSWORD, role: 'donador' });
    user.lockUntil = Date.now() - 1000;
    await expect(users.verifyCredentials(store, 'b@test.com', PASSWORD)).resolves.toBe(user);
    expect(user.lockUntil).toBeNull();
  });

  test('valida el formato del cuerpo', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('Sesión y token JWT', () => {
  let app;
  let config;
  let token;
  let user;
  beforeEach(async () => {
    ({ app, config } = buildApp());
    ({ token, user } = await register(app));
  });

  test('/me responde con el usuario usando cabecera Bearer', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  test('/me funciona con la cookie de sesión', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', `${COOKIE_NAME}=${token}`);
    expect(res.status).toBe(200);
  });

  test('sin token responde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/iniciar sesión/);
  });

  test('rechaza tokens manipulados', async () => {
    const [h, , s] = token.split('.');
    const payload = Buffer.from(JSON.stringify({ sub: user.id, role: 'admin', tv: 0 })).toString('base64url');
    const res = await request(app).get('/api/auth/me').set(auth(`${h}.${payload}.${s}`));
    expect(res.status).toBe(401);
  });

  test('rechaza tokens sin firma (alg=none)', async () => {
    const unsigned = jwt.sign({ sub: user.id, role: 'admin', tv: 0 }, null, { algorithm: 'none', issuer: 'conecta-api', audience: 'conecta-web' });
    const res = await request(app).get('/api/auth/me').set(auth(unsigned));
    expect(res.status).toBe(401);
  });

  test('rechaza tokens firmados con otro secreto', async () => {
    const forged = jwt.sign({ sub: user.id, role: 'donador', tv: 0 }, 'otro-secreto-de-al-menos-32-caracteres!!', { issuer: 'conecta-api', audience: 'conecta-web' });
    const res = await request(app).get('/api/auth/me').set(auth(forged));
    expect(res.status).toBe(401);
  });

  test('rechaza tokens expirados', async () => {
    const expired = jwt.sign({ sub: user.id, role: 'donador', tv: 0, exp: Math.floor(Date.now() / 1000) - 10 }, config.jwtSecret, {
      issuer: 'conecta-api',
      audience: 'conecta-web',
    });
    const res = await request(app).get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/expiró/);
  });

  test('cerrar sesión revoca el token en el servidor', async () => {
    const out = await request(app).post('/api/auth/logout').set(auth(token));
    expect(out.status).toBe(204);
    expect(out.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/);
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(401);
  });

  test('cerrar sesión sin token también responde 204', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('Límites de peticiones y formato', () => {
  test('limita los intentos de autenticación por IP', async () => {
    const { app } = buildApp({ authRateLimit: 2 });
    await login(app, 'a@test.com', 'Xx123456');
    await login(app, 'a@test.com', 'Xx123456');
    const { res } = await login(app, 'a@test.com', 'Xx123456');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  test('responde 400 ante JSON mal formado', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });

  test('responde 413 ante cuerpos demasiado grandes', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'x'.repeat(20000) });
    expect(res.status).toBe(413);
  });
});
