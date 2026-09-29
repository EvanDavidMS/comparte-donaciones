'use strict';

/**
 * Prueba de humo contra un entorno desplegado (staging). Recorre el flujo
 * principal de los tres roles y verifica controles de seguridad básicos.
 * Uso: BASE_URL=http://localhost:3000 ADMIN_PASSWORD=... node scripts/smoke-test.js
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@comparte.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin12345';
const stamp = Date.now();
let passed = 0;

async function call(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, json, text };
}

function check(name, condition, detail = '') {
  if (!condition) throw new Error(`FALLÓ: ${name} ${detail}`);
  passed += 1;
  console.log(`  ✔ ${name}`);
}

async function main() {
  console.log(`Prueba de humo contra ${BASE}`);
  const health = await call('GET', '/api/health');
  check('health responde ok', health.status === 200 && health.json.status === 'ok');

  const home = await call('GET', '/');
  check('la aplicación web carga', home.status === 200 && home.text.includes('Comparte'));
  check('cabecera CSP presente', /script-src 'self'/.test(home.headers.get('content-security-policy') || ''));
  check('X-Powered-By oculto', !home.headers.get('x-powered-by'));

  const admin = await call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check('login de administrador', admin.status === 200, JSON.stringify(admin.json));
  const adminToken = admin.json.token;

  const donor = await call('POST', '/api/auth/register', {
    body: { name: 'Donador Smoke', email: `smoke-donor-${stamp}@test.com`, password: 'Smoke12345', role: 'donador' },
  });
  check('registro de donador', donor.status === 201);
  const org = await call('POST', '/api/auth/register', {
    body: { name: 'Org Smoke', email: `smoke-org-${stamp}@test.com`, password: 'Smoke12345', role: 'beneficiario', organization: 'Org Smoke' },
  });
  check('registro de organización (pendiente)', org.status === 201 && org.json.user.status === 'pendiente');

  const escalation = await call('POST', '/api/auth/register', {
    body: { name: 'Hacker', email: `smoke-x-${stamp}@test.com`, password: 'Smoke12345', role: 'admin' },
  });
  check('no se puede registrar un administrador', escalation.status === 400);

  const expiresAt = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const donation = await call('POST', '/api/donations', {
    token: donor.json.token,
    body: { title: 'Smoke arroz', category: 'alimentos', quantity: 10, unit: 'kg', expiresAt, location: 'CI' },
  });
  check('el donador publica una donación', donation.status === 201);
  const donationId = donation.json.donation.id;

  const xss = await call('POST', '/api/donations', {
    token: donor.json.token,
    body: { title: '<script>alert(1)</script>', category: 'ropa', quantity: 1, unit: 'unidades', location: 'CI' },
  });
  check('se rechaza contenido HTML (XSS)', xss.status === 400);

  const blocked = await call('POST', '/api/requests', { token: org.json.token, body: { donationId } });
  check('organización sin verificar no puede solicitar', blocked.status === 403);

  const forbidden = await call('GET', '/api/admin/users', { token: donor.json.token });
  check('un donador no accede a administración', forbidden.status === 403);

  const verify = await call('PATCH', `/api/admin/users/${org.json.user.id}/status`, { token: adminToken, body: { status: 'activo' } });
  check('el administrador verifica la organización', verify.status === 200);

  const req = await call('POST', '/api/requests', { token: org.json.token, body: { donationId, message: 'Smoke' } });
  check('la organización solicita la donación', req.status === 201);

  const approve = await call('PATCH', `/api/requests/${req.json.request.id}/approve`, { token: adminToken });
  check('el administrador aprueba', approve.status === 200 && approve.json.request.status === 'aprobada');

  const confirm = await call('PATCH', `/api/requests/${req.json.request.id}/confirm`, { token: org.json.token });
  check('la organización confirma la entrega', confirm.status === 200 && confirm.json.request.status === 'entregada');

  const logout = await call('POST', '/api/auth/logout', { token: donor.json.token });
  const reuse = await call('GET', '/api/auth/me', { token: donor.json.token });
  check('el token queda revocado tras cerrar sesión', logout.status === 204 && reuse.status === 401);

  console.log(`\n${passed} verificaciones superadas`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
