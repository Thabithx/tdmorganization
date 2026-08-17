const paymentService = require('../services/payment.service');
const Payment = require('../models/Payment');
const PlayerProfile = require('../models/PlayerProfile');

const createPayment = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const result = await paymentService.createPayherePayment(challengeId, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const payhereWebhook = async (req, res, next) => {
  try {
    // PayHere sends form-encoded body
    await paymentService.handlePayhereWebhook(req.body);
    // PayHere expects a 200 OK response
    res.status(200).send('OK');
  } catch (err) {
    console.error('PayHere webhook error:', err.message);
    res.status(200).send('OK'); // Always return 200 to PayHere
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    const payments = await Payment.find({ payerId: profile._id })
      .populate('challengeId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPayment, payhereWebhook, getMyPayments };
