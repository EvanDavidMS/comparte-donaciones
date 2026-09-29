'use strict';

const { randomUUID } = require('node:crypto');
const { AppError, notFound } = require('../utils/errors');
const { displayName } = require('./userService');
const { ACTIVE_REQUEST, expireDonations, rejectPendingRequests } = require('./donationService');
const audit = require('./auditService');

const MAX_PENDING_PER_BENEFICIARY = 10;

function presentRequest(store, r, viewer) {
  const d = store.donations.get(r.donationId);
  const donor = store.users.get(d.donorId);
  const beneficiary = store.users.get(r.beneficiaryId);
  const out = {
    id: r.id,
    status: r.status,
    message: r.message,
    reason: r.reason,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    deliveredAt: r.deliveredAt,
    donation: {
      id: d.id,
      title: d.title,
      category: d.category,
      quantity: d.quantity,
      unit: d.unit,
      location: d.location,
      expiresAt: d.expiresAt,
      status: d.status,
      donor: { name: displayName(donor) },
    },
    beneficiary: { name: displayName(beneficiary) },
  };
  if (viewer.role === 'admin') {
    out.beneficiary.contact = beneficiary.name;
    out.beneficiary.email = beneficiary.email;
    out.beneficiary.status = beneficiary.status;
  }
  return out;
}

function findVisible(store, viewer, id) {
  const r = store.requests.get(id);
  if (!r) throw notFound('Solicitud');
  if (viewer.role === 'beneficiario' && r.beneficiaryId !== viewer.id) throw notFound('Solicitud');
  return r;
}

function requireStatus(r, status, message) {
  if (r.status !== status) throw new AppError(409, message);
}

function listRequests(store, viewer, { status, donationId } = {}) {
  expireDonations(store);
  return [...store.requests.values()]
    .filter((r) => {
      if (viewer.role === 'beneficiario' && r.beneficiaryId !== viewer.id) return false;
      if (viewer.role === 'donador' && store.donations.get(r.donationId).donorId !== viewer.id) return false;
      if (status && r.status !== status) return false;
      if (donationId && r.donationId !== donationId) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => presentRequest(store, r, viewer));
}

function createRequest(store, beneficiary, { donationId, message = '' }) {
  if (beneficiary.status !== 'activo') {
    throw new AppError(403, 'Tu organización debe ser verificada por un administrador antes de solicitar donaciones');
  }
  expireDonations(store);
  const d = store.donations.get(donationId);
  if (!d) throw notFound('Donación');
  if (d.status !== 'disponible') throw new AppError(409, 'La donación ya no está disponible');

  const mine = [...store.requests.values()].filter((r) => r.beneficiaryId === beneficiary.id);
  if (mine.some((r) => r.donationId === donationId && ACTIVE_REQUEST.has(r.status))) {
    throw new AppError(409, 'Ya tienes una solicitud activa para esta donación');
  }
  if (mine.filter((r) => r.status === 'pendiente').length >= MAX_PENDING_PER_BENEFICIARY) {
    throw new AppError(409, `Alcanzaste el límite de ${MAX_PENDING_PER_BENEFICIARY} solicitudes pendientes`);
  }

  const r = {
    id: randomUUID(),
    donationId,
    beneficiaryId: beneficiary.id,
    message,
    status: 'pendiente',
    reason: '',
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null,
    deliveredAt: null,
  };
  store.requests.set(r.id, r);
  store.scheduleSave();
  audit.record(store, beneficiary, 'SOLICITUD_CREADA', d.title);
  return presentRequest(store, r, beneficiary);
}

function cancelRequest(store, beneficiary, id) {
  const r = findVisible(store, beneficiary, id);
  requireStatus(r, 'pendiente', 'Solo puedes cancelar solicitudes pendientes');
  r.status = 'cancelada';
  r.decidedAt = new Date().toISOString();
  store.scheduleSave();
  audit.record(store, beneficiary, 'SOLICITUD_CANCELADA', store.donations.get(r.donationId).title);
  return presentRequest(store, r, beneficiary);
}

function approveRequest(store, admin, id) {
  const r = findVisible(store, admin, id);
  requireStatus(r, 'pendiente', 'Solo se pueden aprobar solicitudes pendientes');
  const d = store.donations.get(r.donationId);
  if (d.status !== 'disponible') throw new AppError(409, 'La donación ya no está disponible');
  const beneficiary = store.users.get(r.beneficiaryId);
  if (beneficiary.status !== 'activo') throw new AppError(409, 'La organización solicitante no está activa');

  const now = new Date().toISOString();
  Object.assign(r, { status: 'aprobada', decidedAt: now, decidedBy: admin.id });
  Object.assign(d, { status: 'reservada', assignedTo: r.beneficiaryId, updatedAt: now });
  rejectPendingRequests(store, d.id, 'La donación fue asignada a otra organización', r.id);
  store.scheduleSave();
  audit.record(store, admin, 'SOLICITUD_APROBADA', `${d.title} → ${displayName(beneficiary)}`);
  return presentRequest(store, r, admin);
}

function rejectRequest(store, admin, id, reason) {
  const r = findVisible(store, admin, id);
  requireStatus(r, 'pendiente', 'Solo se pueden rechazar solicitudes pendientes');
  Object.assign(r, { status: 'rechazada', reason, decidedAt: new Date().toISOString(), decidedBy: admin.id });
  store.scheduleSave();
  audit.record(store, admin, 'SOLICITUD_RECHAZADA', `${store.donations.get(r.donationId).title}: ${reason}`);
  return presentRequest(store, r, admin);
}

/** Revoca una asignación aprobada (p. ej. la organización no recogió) y libera la donación. */
function revokeRequest(store, admin, id, reason) {
  const r = findVisible(store, admin, id);
  requireStatus(r, 'aprobada', 'Solo se pueden revocar solicitudes aprobadas');
  const d = store.donations.get(r.donationId);
  const now = new Date().toISOString();
  Object.assign(r, { status: 'rechazada', reason, decidedAt: now, decidedBy: admin.id });
  Object.assign(d, { status: 'disponible', assignedTo: null, updatedAt: now });
  store.scheduleSave();
  audit.record(store, admin, 'ASIGNACION_REVOCADA', `${d.title}: ${reason}`);
  return presentRequest(store, r, admin);
}

/** La organización (o un administrador) confirma que la donación fue recibida. */
function confirmDelivery(store, actor, id) {
  const r = findVisible(store, actor, id);
  requireStatus(r, 'aprobada', 'Solo se pueden confirmar solicitudes aprobadas');
  const d = store.donations.get(r.donationId);
  const now = new Date().toISOString();
  Object.assign(r, { status: 'entregada', deliveredAt: now });
  Object.assign(d, { status: 'entregada', deliveredAt: now, updatedAt: now });
  store.scheduleSave();
  audit.record(store, actor, 'ENTREGA_CONFIRMADA', `${d.title} (${d.quantity} ${d.unit})`);
  return presentRequest(store, r, actor);
}

module.exports = {
  MAX_PENDING_PER_BENEFICIARY,
  presentRequest,
  listRequests,
  createRequest,
  cancelRequest,
  approveRequest,
  rejectRequest,
  revokeRequest,
  confirmDelivery,
};
