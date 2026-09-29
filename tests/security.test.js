'use strict';

const { request, buildApp, auth, register } = require('./helpers');
const { errorHandler } = require('../src/middleware/errorHandler');
const { AppError } = require('../src/utils/errors');

describe('Cabeceras y protecciones HTTP', () => {
  let app;
  beforeEach(() => ({ app } = buildApp()));

  test('aplica una política de seguridad de contenido estricta', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-inline');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['permissions-policy']).toContain('camera=()');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('las respuestas de la API no se guardan en caché', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  test('bloquea peticiones que modifican datos desde otro origen (CSRF)', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({ email: 'a@a.com', password: 'x' });
    expect(res.status).toBe(403);
    const malformed = await request(app).post('/api/auth/login').set('Origin', 'not a url').send({});
    expect(malformed.status).toBe(403);
  });

  test('permite peticiones del mismo origen', async () => {
    const res = await request(app).post('/api/auth/login').set('Host', 'localhost:3000').set('Origin', 'http://localhost:3000').send({ email: 'a@a.com', password: 'Xx123456' });
    expect(res.status).toBe(401);
  });

  test('las rutas de API desconocidas devuelven JSON 404', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('las páginas desconocidas devuelven la página 404', async () => {
    const res = await request(app).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.text).toContain('Página no encontrada');
  });

  test('fuera de la API solo se admiten GET/HEAD y los clientes JSON reciben JSON', async () => {
    const probe = await request(app).patch('/latest/meta-data/');
    expect(probe.status).toBe(405);
    expect(probe.headers.allow).toBe('GET, HEAD');
    expect(probe.body.error.code).toBe('METHOD_NOT_ALLOWED');
    const json = await request(app).get('/no-existe').set('Accept', 'application/json');
    expect(json.status).toBe(404);
    expect(json.body.error.code).toBe('NOT_FOUND');
  });

  test('no permite recorrer directorios fuera de la carpeta pública', async () => {
    const res = await request(app).get('/..%2f..%2fpackage.json');
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('"dependencies"');
  });

  test('sirve la tipografía local', async () => {
    const res = await request(app).get('/fonts/inter-latin-wght-normal.woff2');
    expect(res.status).toBe(200);
  });

  test('los errores de validación de un token válido no filtran información interna', async () => {
    const { token } = await register(app);
    const res = await request(app).post('/api/donations').set(auth(token)).send({ title: 1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at \w+ \(/);
  });
});

describe('Manejador de errores', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  test('oculta los detalles de errores inesperados', () => {
    const logger = { error: jest.fn() };
    const res = mockRes();
    errorHandler(logger)(new Error('fallo secreto en la base'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.message).not.toContain('secreto');
    expect(logger.error).toHaveBeenCalled();
  });

  test('conserva los errores de negocio', () => {
    const res = mockRes();
    errorHandler({ error: jest.fn() })(new AppError(409, 'Conflicto'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'CONFLICT', message: 'Conflicto' } });
  });

  test('usa un código genérico si el estado no es conocido', () => {
    expect(new AppError(418, 'Tetera').code).toBe('ERROR');
  });
});
