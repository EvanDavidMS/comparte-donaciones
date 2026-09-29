'use strict';

const express = require('express');
const { validate, uuidParam } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { userQuerySchema, userStatusSchema } = require('../utils/validators');
const users = require('../services/userService');
const audit = require('../services/auditService');

module.exports = function adminRoutes({ store, config }) {
  const router = express.Router();
  router.param('id', uuidParam);
  router.use(authenticate(store, config), authorize('admin'));

  router.get('/users', validate(userQuerySchema, 'query'), (req, res) => {
    res.json({ users: users.listUsers(store, req.validatedQuery) });
  });

  router.patch('/users/:id/status', validate(userStatusSchema), (req, res) => {
    res.json({ user: users.setUserStatus(store, req.user, req.params.id, req.body.status) });
  });

  router.get('/audit', (req, res) => {
    res.json({ entries: audit.listAudit(store) });
  });

  return router;
};
