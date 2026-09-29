'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MAX_AUDIT_ENTRIES = 1000;

/**
 * Almacenamiento en memoria del servidor (sin base de datos externa).
 * Opcionalmente persiste en un archivo JSON local para sobrevivir a reinicios.
 * La escritura es atómica: se escribe un archivo temporal y luego se renombra.
 */
class Store {
  constructor({ file = null, saveDelayMs = 250 } = {}) {
    this.file = file;
    this.saveDelayMs = saveDelayMs;
    this.users = new Map();
    this.donations = new Map();
    this.requests = new Map();
    this.audit = [];
    this.timer = null;
  }

  load() {
    if (!this.file || !fs.existsSync(this.file)) return false;
    const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    this.users = toMap(raw.users);
    this.donations = toMap(raw.donations);
    this.requests = toMap(raw.requests);
    this.audit = Array.isArray(raw.audit) ? raw.audit.slice(0, MAX_AUDIT_ENTRIES) : [];
    return true;
  }

  toJSON() {
    return {
      users: [...this.users.values()],
      donations: [...this.donations.values()],
      requests: [...this.requests.values()],
      audit: this.audit,
    };
  }

  save() {
    if (!this.file) return false;
    clearTimeout(this.timer);
    this.timer = null;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.toJSON(), null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
    return true;
  }

  /** Agrupa escrituras seguidas en una sola para no bloquear el servidor. */
  scheduleSave() {
    if (!this.file) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.save(), this.saveDelayMs);
    this.timer.unref();
  }

  addAudit(entry) {
    this.audit.unshift(entry);
    if (this.audit.length > MAX_AUDIT_ENTRIES) this.audit.length = MAX_AUDIT_ENTRIES;
    this.scheduleSave();
  }
}

function toMap(list) {
  const map = new Map();
  if (Array.isArray(list)) {
    for (const item of list) {
      if (item && typeof item.id === 'string') map.set(item.id, item);
    }
  }
  return map;
}

module.exports = { Store, MAX_AUDIT_ENTRIES };
