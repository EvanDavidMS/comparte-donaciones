'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('../src/config');
const { Store, MAX_AUDIT_ENTRIES } = require('../src/store/store');
const { ensureAdmin, seedDemo } = require('../src/seed');
const { isRealDate, todayISO } = require('../src/utils/validators');
const { sumByUnit } = require('../src/services/statsService');
const { expireDonations } = require('../src/services/donationService');

describe('Configuración', () => {
  test('en desarrollo genera un secreto aleatorio y usa valores por defecto', () => {
    const a = loadConfig({});
    const b = loadConfig({});
    expect(a.jwtSecret).toHaveLength(96);
    expect(a.jwtSecret).not.toBe(b.jwtSecret);
    expect(a).toMatchObject({ port: 3000, seedDemo: true, cookieSecure: false, dataFile: 'data/db.json', adminEmail: 'admin@conectamas.org' });
  });

  test('sin credenciales en el entorno genera contraseñas aleatorias válidas', () => {
    const a = loadConfig({});
    expect(a.generatedCredentials).toBe(true);
    expect(a.adminPassword).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/);
    expect(a.adminPassword).not.toBe(loadConfig({}).adminPassword);
    expect(loadConfig({ ADMIN_PASSWORD: 'Aa123456', DEMO_PASSWORD: 'Bb123456' }).generatedCredentials).toBe(false);
  });

  test('en producción exige JWT_SECRET suficientemente largo', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', ADMIN_PASSWORD: 'X' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'corto', ADMIN_PASSWORD: 'X' })).toThrow(/JWT_SECRET/);
  });

  test('en producción exige ADMIN_PASSWORD', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) })).toThrow(/ADMIN_PASSWORD/);
  });

  test('en producción activa cookies seguras y desactiva la demo', () => {
    const c = loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), ADMIN_PASSWORD: 'Admin12345', ADMIN_EMAIL: 'Jefe@Org.com' });
    expect(c).toMatchObject({ cookieSecure: true, seedDemo: false, adminEmail: 'jefe@org.com', isProduction: true });
  });

  test('respeta variables explícitas y descarta números inválidos', () => {
    const c = loadConfig({ PORT: 'abc', COOKIE_SECURE: 'true', DATA_FILE: 'none', SEED_DEMO: 'false', TRUST_PROXY: 'true', JWT_EXPIRES_SEC: '60' });
    expect(c).toMatchObject({ port: 3000, cookieSecure: true, dataFile: null, seedDemo: false, trustProxy: true, jwtExpiresSec: 60 });
  });
});

describe('Almacenamiento en servidor', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'conecta-'));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  test('guarda y recupera los datos de forma atómica', () => {
    const file = path.join(dir, 'sub', 'db.json');
    const store = new Store({ file });
    store.users.set('u1', { id: 'u1', name: 'Ana' });
    store.addAudit({ id: 'a1', action: 'X' });
    expect(store.save()).toBe(true);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);

    const copy = new Store({ file });
    expect(copy.load()).toBe(true);
    expect(copy.users.get('u1').name).toBe('Ana');
    expect(copy.audit).toHaveLength(1);
  });

  test('ignora registros corruptos al cargar', () => {
    const file = path.join(dir, 'db.json');
    fs.writeFileSync(file, JSON.stringify({ users: [null, { id: 5 }, { id: 'ok' }], donations: 'x' }));
    const store = new Store({ file });
    store.load();
    expect([...store.users.keys()]).toEqual(['ok']);
    expect(store.donations.size).toBe(0);
    expect(store.audit).toEqual([]);
  });

  test('sin archivo funciona solo en memoria', () => {
    const store = new Store();
    expect(store.load()).toBe(false);
    expect(store.save()).toBe(false);
    store.scheduleSave();
    expect(store.timer).toBeNull();
    expect(new Store({ file: path.join(dir, 'nada.json') }).load()).toBe(false);
  });

  test('agrupa escrituras con scheduleSave', async () => {
    const file = path.join(dir, 'db.json');
    const store = new Store({ file, saveDelayMs: 5 });
    store.scheduleSave();
    store.scheduleSave();
    await new Promise((r) => setTimeout(r, 40));
    expect(fs.existsSync(file)).toBe(true);
  });

  test('limita el tamaño del registro de auditoría', () => {
    const store = new Store();
    for (let i = 0; i < MAX_AUDIT_ENTRIES + 5; i += 1) store.addAudit({ id: String(i) });
    expect(store.audit).toHaveLength(MAX_AUDIT_ENTRIES);
    expect(store.audit[0].id).toBe(String(MAX_AUDIT_ENTRIES + 4));
  });
});

describe('Datos iniciales', () => {
  const config = loadConfig({ ADMIN_PASSWORD: 'Admin12345', DEMO_PASSWORD: 'Demo12345' });

  test('crea el administrador una sola vez', async () => {
    const store = new Store();
    const admin = await ensureAdmin(store, config);
    expect(admin).toMatchObject({ role: 'admin', status: 'activo' });
    expect(await ensureAdmin(store, config)).toBeNull();
  });

  test('carga datos de demostración coherentes e idempotentes', async () => {
    const store = new Store();
    await ensureAdmin(store, config);
    expect(await seedDemo(store, config)).toBe(true);
    expect(store.users.size).toBe(5);
    expect(store.donations.size).toBe(5);
    expect([...store.donations.values()].filter((d) => d.status === 'entregada')).toHaveLength(1);
    expect(await seedDemo(store, config)).toBe(false);
  });
});

describe('Utilidades', () => {
  test('valida fechas reales', () => {
    expect(isRealDate('2024-02-29')).toBe(true);
    expect(isRealDate('2023-02-29')).toBe(false);
    expect(isRealDate('2023-13-01')).toBe(false);
  });

  test('todayISO devuelve la fecha UTC', () => {
    expect(todayISO(new Date('2026-03-05T10:00:00Z'))).toBe('2026-03-05');
  });

  test('suma cantidades por unidad', () => {
    expect(sumByUnit([{ unit: 'kg', quantity: 2 }, { unit: 'kg', quantity: 3 }, { unit: 'litros', quantity: 1 }])).toMatchObject({ kg: 5, litros: 1, cajas: 0 });
  });

  test('expireDonations no hace nada si no hay vencidas', () => {
    const store = new Store();
    store.donations.set('d', { id: 'd', status: 'disponible', expiresAt: null });
    expect(expireDonations(store)).toBe(false);
  });
});
