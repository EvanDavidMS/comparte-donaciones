'use strict';

const { CATEGORIES, DONATION_STATUSES, REQUEST_STATUSES, UNITS } = require('../utils/validators');
const { displayName } = require('./userService');
const { expireDonations } = require('./donationService');

const zeroes = (keys) => Object.fromEntries(keys.map((k) => [k, 0]));

function countBy(items, key, keys) {
  const out = zeroes(keys);
  for (const item of items) out[item[key]] += 1;
  return out;
}

function sumByUnit(donations) {
  const out = zeroes(UNITS);
  for (const d of donations) out[d.unit] += d.quantity;
  return out;
}

/** Métricas agregadas sin datos personales (se muestran antes de iniciar sesión). */
function publicStats(store) {
  expireDonations(store);
  const donations = [...store.donations.values()];
  const users = [...store.users.values()];
  const delivered = donations.filter((d) => d.status === 'entregada');
  return {
    availableDonations: donations.filter((d) => d.status === 'disponible').length,
    deliveredDonations: delivered.length,
    deliveredKg: sumByUnit(delivered).kg,
    verifiedOrganizations: users.filter((u) => u.role === 'beneficiario' && u.status === 'activo').length,
    activeDonors: users.filter((u) => u.role === 'donador' && u.status === 'activo').length,
  };
}

function adminStats(store) {
  const users = [...store.users.values()];
  const donations = [...store.donations.values()];
  const requests = [...store.requests.values()];
  const delivered = donations.filter((d) => d.status === 'entregada');

  const byDonor = new Map();
  for (const d of donations) {
    const entry = byDonor.get(d.donorId) || { total: 0, delivered: 0 };
    entry.total += 1;
    if (d.status === 'entregada') entry.delivered += 1;
    byDonor.set(d.donorId, entry);
  }
  const topDonors = [...byDonor.entries()]
    .map(([id, v]) => ({ name: displayName(store.users.get(id)), ...v }))
    .sort((a, b) => b.delivered - a.delivered || b.total - a.total)
    .slice(0, 5);

  return {
    users: {
      total: users.length,
      donadores: users.filter((u) => u.role === 'donador').length,
      beneficiarios: users.filter((u) => u.role === 'beneficiario').length,
      pendientes: users.filter((u) => u.status === 'pendiente').length,
      suspendidos: users.filter((u) => u.status === 'suspendido').length,
    },
    donations: countBy(donations, 'status', DONATION_STATUSES),
    byCategory: countBy(donations, 'category', CATEGORIES),
    requests: countBy(requests, 'status', REQUEST_STATUSES),
    delivered: sumByUnit(delivered),
    topDonors,
  };
}

function donorStats(store, donor) {
  const mine = [...store.donations.values()].filter((d) => d.donorId === donor.id);
  const ids = new Set(mine.map((d) => d.id));
  const delivered = mine.filter((d) => d.status === 'entregada');
  return {
    total: mine.length,
    donations: countBy(mine, 'status', DONATION_STATUSES),
    delivered: sumByUnit(delivered),
    organizationsHelped: new Set(delivered.map((d) => d.assignedTo)).size,
    pendingRequests: [...store.requests.values()].filter((r) => ids.has(r.donationId) && r.status === 'pendiente').length,
  };
}

function beneficiaryStats(store, beneficiary) {
  const mine = [...store.requests.values()].filter((r) => r.beneficiaryId === beneficiary.id);
  const received = mine.filter((r) => r.status === 'entregada').map((r) => store.donations.get(r.donationId));
  return {
    accountStatus: beneficiary.status,
    availableDonations: [...store.donations.values()].filter((d) => d.status === 'disponible').length,
    requests: countBy(mine, 'status', REQUEST_STATUSES),
    received: sumByUnit(received),
    receivedCount: received.length,
  };
}

function statsFor(store, user) {
  expireDonations(store);
  if (user.role === 'admin') return adminStats(store);
  if (user.role === 'donador') return donorStats(store, user);
  return beneficiaryStats(store, user);
}

module.exports = { publicStats, statsFor, sumByUnit };
