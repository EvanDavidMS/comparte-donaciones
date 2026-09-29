'use strict';

const express = require('express');
const { asyncHandler } = require('../utils/errors');
const { validate } = require('../middleware/validate');
const { authenticate, resolveUser, signToken, setSessionCookie, clearSessionCookie } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../utils/validators');
const users = require('../services/userService');
const audit = require('../services/auditService');

module.exports = function authRoutes({ store, config }) {
  const router = express.Router();

  const startSession = (res, user, status) => {
    const token = signToken(user, config);
    setSessionCookie(res, token, config);
    res.status(status).json({ user: users.publicUser(user), token, expiresIn: config.jwtExpiresSec });
  };

  router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(async (req, res) => {
      const user = await users.createUser(store, req.body);
      audit.record(store, user, 'REGISTRO', `Nueva cuenta de ${user.role}: ${users.displayName(user)}`);
      startSession(res, user, 201);
    }),
  );

  router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(async (req, res) => {
      const user = await users.verifyCredentials(store, req.body.email, req.body.password);
      audit.record(store, user, 'INICIO_SESION');
      startSession(res, user, 200);
    }),
  );

  // Cerrar sesión revoca el token en el servidor, no solo borra la cookie.
  router.post('/logout', (req, res) => {
    const user = resolveUser(req, store, config);
    if (user) users.revokeSessions(store, user);
    clearSessionCookie(res, config);
    res.status(204).end();
  });

  router.get('/me', authenticate(store, config), (req, res) => {
    res.json({ user: users.publicUser(req.user) });
  });

  return router;
};
