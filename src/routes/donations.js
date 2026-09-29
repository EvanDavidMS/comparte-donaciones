'use strict';

const express = require('express');
const { validate, uuidParam } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { donationSchema, donationQuerySchema } = require('../utils/validators');
const donations = require('../services/donationService');

module.exports = function donationRoutes({ store, config }) {
  const router = express.Router();
  router.param('id', uuidParam);
  router.use(authenticate(store, config));

  router.get('/', validate(donationQuerySchema, 'query'), (req, res) => {
    res.json({ donations: donations.listDonations(store, req.user, req.validatedQuery) });
  });

  router.post('/', authorize('donador'), validate(donationSchema), (req, res) => {
    res.status(201).json({ donation: donations.createDonation(store, req.user, req.body) });
  });

  router.get('/:id', (req, res) => {
    res.json({ donation: donations.getDonation(store, req.user, req.params.id) });
  });

  router.patch('/:id/cancel', authorize('donador', 'admin'), (req, res) => {
    res.json({ donation: donations.cancelDonation(store, req.user, req.params.id) });
  });

  return router;
};
