'use strict';

const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { securityHeaders, permissionsPolicy, noStore, sameOrigin, limiter } = require('./middleware/security');
const { apiNotFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FONTS_DIR = path.dirname(require.resolve('@fontsource-variable/inter/package.json'));
const WINDOW_MS = 15 * 60 * 1000;

function createApp({ store, config, logger = console }) {
  const app = express();
  const deps = { store, config };

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(securityHeaders());
  app.use(permissionsPolicy);
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.use('/api', noStore, sameOrigin, limiter(config.apiRateLimit, WINDOW_MS, 'Demasiadas solicitudes. Intenta más tarde.'));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use(
    '/api/auth',
    limiter(config.authRateLimit, WINDOW_MS, 'Demasiados intentos de autenticación. Espera unos minutos.'),
    authRoutes(deps),
  );
  app.use('/api/donations', donationRoutes(deps));
  app.use('/api/requests', requestRoutes(deps));
  app.use('/api/admin', adminRoutes(deps));
  app.use('/api/stats', statsRoutes(deps));
  app.use('/api', apiNotFound);

  app.use('/fonts', express.static(path.join(FONTS_DIR, 'files'), { maxAge: '30d', immutable: true }));
  app.use(
    express.static(PUBLIC_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
  app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html')));

  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
