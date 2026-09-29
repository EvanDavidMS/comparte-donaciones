'use strict';

const { randomUUID } = require('node:crypto');

/** Registra una acción relevante para trazabilidad (quién, qué y cuándo). */
function record(store, actor, action, detail = '') {
  store.addAudit({
    id: randomUUID(),
    at: new Date().toISOString(),
    actorId: actor ? actor.id : null,
    actorName: actor ? actor.name : 'Sistema',
    actorRole: actor ? actor.role : 'sistema',
    action,
    detail,
  });
}

function listAudit(store, limit = 200) {
  return store.audit.slice(0, limit);
}

module.exports = { record, listAudit };
