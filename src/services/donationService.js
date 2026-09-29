'use strict';

const { randomUUID } = require('node:crypto');
const { AppError, notFound } = require('../utils/errors');
const { todayISO } = require('../utils/validators');
const { displayName } = require('./userService');
const audit = require('./auditService');

const ACTIVE_REQUEST = new Set(['pendiente', 'aprobada']);

/** Rechaza automáticamente las solicitudes pendientes de una donación. */
function rejectPendingRequests(store, donationId, reason, exceptId = null) {
  const now = new Date().toISOString();
  for (const r of store.requests.values()) {
    if (r.donationId === donationId && r.status === 'pendiente' && r.id !== exceptId) {
      r.status = 'rechazada';
      r.reason = reason;
      r.decidedAt = now;
    }
  }
}

/** Marca como vencidas las donaciones disponibles cuya fecha de caducidad ya pasó. */
function expireDonations(store, today = todayISO()) {
  let changed = false;
  for (const d of store.donations.values()) {
    if (d.status === 'disponible' && d.expiresAt && d.expiresAt < today) {
      d.status = 'vencida';
      d.updatedAt = new Date().toISOString();
      rejectPendingRequests(store, d.id, 'La donación venció antes de ser asignada');
      changed = true;
    }
  }
  if (changed) store.scheduleSave();
  return changed;
}

function presentDonation(store, d, viewer) {
  const donor = store.users.get(d.donorId);
  const out = {
    id: d.id,
    title: d.title,
    category: d.category,
    quantity: d.quantity,
    unit: d.unit,
    expiresAt: d.expiresAt,
    location: d.location,
    description: d.description,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    deliveredAt: d.deliveredAt,
    donor: { name: donor ? displayName(donor) : 'Donante' },
  };
  if (viewer.role === 'beneficiario') {
    const mine = [...store.requests.values()].find(
      (r) => r.donationId === d.id && r.beneficiaryId === viewer.id && ACTIVE_REQUEST.has(r.status),
    );
    out.myRequestStatus = mine ? mine.status : null;
    return out;
  }
  const assigned = d.assignedTo ? store.users.get(d.assignedTo) : null;
  out.assignedTo = assigned ? { name: displayName(assigned) } : null;
  out.pendingRequests = [...store.requests.values()].filter((r) => r.donationId === d.id && r.status === 'pendiente').length;
  if (viewer.role === 'admin' && donor) out.donor.email = donor.email;
  return out;
}

function canView(store, d, viewer) {
  if (viewer.role === 'admin') return true;
  if (viewer.role === 'donador') return d.donorId === viewer.id;
  if (d.status === 'disponible') return true;
  return [...store.requests.values()].some((r) => r.donationId === d.id && r.beneficiaryId === viewer.id);
}

function listDonations(store, viewer, { status, category, q } = {}) {
  expireDonations(store);
  const term = q ? q.toLowerCase() : '';
  return [...store.donations.values()]
    .filter((d) => {
      if (viewer.role === 'donador' && d.donorId !== viewer.id) return false;
      if (viewer.role === 'beneficiario' && d.status !== 'disponible') return false;
      if (status && d.status !== status) return false;
      if (category && d.category !== category) return false;
      if (term && !`${d.title} ${d.description} ${d.location}`.toLowerCase().includes(term)) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((d) => presentDonation(store, d, viewer));
}

function getDonation(store, viewer, id) {
  expireDonations(store);
  const d = store.donations.get(id);
  // Se responde 404 también cuando no hay permiso, para no revelar que el recurso existe.
  if (!d || !canView(store, d, viewer)) throw notFound('Donación');
  return presentDonation(store, d, viewer);
}

function createDonation(store, donor, data) {
  const now = new Date().toISOString();
  const d = {
    id: randomUUID(),
    donorId: donor.id,
    title: data.title,
    category: data.category,
    quantity: data.quantity,
    unit: data.unit,
    expiresAt: data.expiresAt || null,
    location: data.location,
    description: data.description || '',
    status: 'disponible',
    assignedTo: null,
    createdAt: now,
    updatedAt: now,
    deliveredAt: null,
  };
  store.donations.set(d.id, d);
  store.scheduleSave();
  audit.record(store, donor, 'DONACION_PUBLICADA', `${d.title} (${d.quantity} ${d.unit})`);
  return presentDonation(store, d, donor);
}

function cancelDonation(store, actor, id) {
  const d = store.donations.get(id);
  if (!d || (actor.role === 'donador' && d.donorId !== actor.id)) throw notFound('Donación');
  if (d.status !== 'disponible') {
    throw new AppError(409, 'Solo se pueden cancelar donaciones disponibles');
  }
  d.status = 'cancelada';
  d.updatedAt = new Date().toISOString();
  rejectPendingRequests(store, d.id, 'La donación fue cancelada');
  store.scheduleSave();
  audit.record(store, actor, 'DONACION_CANCELADA', d.title);
  return presentDonation(store, d, actor);
}

module.exports = {
  ACTIVE_REQUEST,
  rejectPendingRequests,
  expireDonations,
  presentDonation,
  listDonations,
  getDonation,
  createDonation,
  cancelDonation,
};
