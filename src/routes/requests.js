'use strict';

const express = require('express');
const { validate, uuidParam } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { requestSchema, requestQuerySchema, reasonSchema } = require('../utils/validators');
const requests = require('../services/requestService');

module.exports = function requestRoutes({ store, config }) {
  const router = express.Router();
  router.param('id', uuidParam);
  router.use(authenticate(store, config));

  router.get('/', validate(requestQuerySchema, 'query'), (req, res) => {
    res.json({ requests: requests.listRequests(store, req.user, req.validatedQuery) });
  });

  router.post('/', authorize('beneficiario'), validate(requestSchema), (req, res) => {
    res.status(201).json({ request: requests.createRequest(store, req.user, req.body) });
  });

  router.patch('/:id/cancel', authorize('beneficiario'), (req, res) => {
    res.json({ request: requests.cancelRequest(store, req.user, req.params.id) });
  });

  router.patch('/:id/approve', authorize('admin'), (req, res) => {
    res.json({ request: requests.approveRequest(store, req.user, req.params.id) });
  });

  router.patch('/:id/reject', authorize('admin'), validate(reasonSchema), (req, res) => {
    res.json({ request: requests.rejectRequest(store, req.user, req.params.id, req.body.reason) });
  });

  router.patch('/:id/revoke', authorize('admin'), validate(reasonSchema), (req, res) => {
    res.json({ request: requests.revokeRequest(store, req.user, req.params.id, req.body.reason) });
  });

  router.patch('/:id/confirm', authorize('beneficiario', 'admin'), (req, res) => {
    res.json({ request: requests.confirmDelivery(store, req.user, req.params.id) });
  });

  return router;
};
