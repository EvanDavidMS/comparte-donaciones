'use strict';

// Obtiene un JWT de administrador para que OWASP ZAP escanee los endpoints autenticados.
const BASE = process.env.BASE_URL || 'http://localhost:3000';

fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@conectamas.org', password: process.env.ADMIN_PASSWORD || 'Admin12345' }),
})
  .then(async (res) => {
    if (!res.ok) throw new Error(`login falló con ${res.status}`);
    process.stdout.write((await res.json()).token);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
