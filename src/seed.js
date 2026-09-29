'use strict';

const { createUser, findByEmail } = require('./services/userService');
const { createDonation } = require('./services/donationService');
const { createRequest, approveRequest, confirmDelivery } = require('./services/requestService');

const addDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

/** Garantiza que exista la cuenta administradora (no se puede crear desde el registro público). */
async function ensureAdmin(store, config) {
  if ([...store.users.values()].some((u) => u.role === 'admin')) return null;
  return createUser(store, {
    name: 'Administración Comparte',
    email: config.adminEmail,
    password: config.adminPassword,
    role: 'admin',
    organization: 'Comparte',
    status: 'activo',
  });
}

/** Datos de demostración para que la plataforma se pueda probar de inmediato. */
async function seedDemo(store, config) {
  if (findByEmail(store, 'donador@comparte.org')) return false;
  const admin = [...store.users.values()].find((u) => u.role === 'admin');
  const pwd = config.demoPassword;

  const donor = await createUser(store, { name: 'Laura Méndez', email: 'donador@comparte.org', password: pwd, role: 'donador', organization: 'Supermercados La Cosecha' });
  const donor2 = await createUser(store, { name: 'Carlos Ruiz', email: 'panaderia@comparte.org', password: pwd, role: 'donador', organization: 'Panadería San José' });
  const org = await createUser(store, { name: 'María Torres', email: 'beneficiario@comparte.org', password: pwd, role: 'beneficiario', organization: 'Comedor Comunitario Esperanza', status: 'activo' });
  await createUser(store, { name: 'Jorge Salas', email: 'albergue@comparte.org', password: pwd, role: 'beneficiario', organization: 'Albergue Nuevo Amanecer' });

  const arroz = createDonation(store, donor, { title: 'Arroz y frijol', category: 'alimentos', quantity: 120, unit: 'kg', expiresAt: addDays(90), location: 'Monterrey, N.L.', description: 'Costales de 5 kg, empaque cerrado.' });
  createDonation(store, donor, { title: 'Leche UHT', category: 'alimentos', quantity: 60, unit: 'litros', expiresAt: addDays(20), location: 'Monterrey, N.L.', description: 'Cajas de 12 piezas de 1 L.' });
  createDonation(store, donor, { title: 'Kits de higiene personal', category: 'higiene', quantity: 45, unit: 'unidades', location: 'San Pedro, N.L.', description: 'Jabón, pasta dental, cepillo y shampoo.' });
  const pan = createDonation(store, donor2, { title: 'Pan dulce del día', category: 'alimentos', quantity: 15, unit: 'kg', expiresAt: addDays(3), location: 'Guadalupe, N.L.', description: 'Recoger antes de las 18:00 h.' });
  createDonation(store, donor2, { title: 'Chamarras de invierno', category: 'ropa', quantity: 30, unit: 'unidades', location: 'Guadalupe, N.L.', description: 'Tallas surtidas, en buen estado.' });

  const delivered = createRequest(store, org, { donationId: arroz.id, message: 'Atendemos a 80 familias por semana.' });
  approveRequest(store, admin, delivered.id);
  confirmDelivery(store, org, delivered.id);
  createRequest(store, org, { donationId: pan.id, message: 'Podemos recoger hoy por la tarde.' });
  return true;
}

module.exports = { ensureAdmin, seedDemo };
