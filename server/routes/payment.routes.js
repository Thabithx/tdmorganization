const express = require('express');
const { createPayment, payhereWebhook, getMyPayments } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/checkout/:challengeId', protect, createPayment);
router.post('/payhere/webhook', payhereWebhook);
router.get('/my', protect, getMyPayments);

module.exports = router;
