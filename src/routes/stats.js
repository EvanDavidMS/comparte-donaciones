'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const stats = require('../services/statsService');

module.exports = function statsRoutes({ store, config }) {
  const router = express.Router();

  // En modo demostración (SEED_DEMO=true) se exponen las cuentas de prueba para
  // facilitar la evaluación. En producción este bloque no se envía.
  const demo = config.seedDemo
    ? {
        password: config.demoPassword,
        accounts: [
          { role: 'donador', email: 'donador@comparte.org' },
          { role: 'beneficiario', email: 'beneficiario@comparte.org' },
          { role: 'beneficiario (sin verificar)', email: 'albergue@comparte.org' },
        ],
      }
    : undefined;

  router.get('/public', (req, res) => {
    res.json({ stats: stats.publicStats(store), demo });
  });

  router.get('/', authenticate(store, config), (req, res) => {
    res.json({ stats: stats.statsFor(store, req.user) });
  });

  return router;
};
