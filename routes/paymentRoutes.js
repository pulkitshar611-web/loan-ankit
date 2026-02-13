const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const { validatePayment } = require('../utils/validators');

// @route   POST /api/payments/manual
router.post('/manual', auth, ...validatePayment, paymentController.recordManualPayment);

// @route   POST /api/payments/stripe/webhook
router.post('/stripe/webhook', paymentController.stripeWebhook);

// @route   GET /api/payments/client/:clientId
router.get('/client/:clientId', auth, paymentController.getClientPayments);

module.exports = router;
