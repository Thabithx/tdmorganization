const mongoose = require('mongoose');
const crypto = require('crypto');
const Challenge = require('../models/Challenge');
const Payment = require('../models/Payment');
const Match = require('../models/Match');
const Ranking = require('../models/Ranking');
const Notification = require('../models/Notification');
const PlayerProfile = require('../models/PlayerProfile');

/**
 * Generate PayHere MD5 hash for payment verification.
 * Formula: MD5(merchant_id + order_id + amount_formatted + currency + MD5(secret).toUpperCase()).toUpperCase()
 */
const generatePayhereHash = (orderId, amount, currency) => {
  const secret = process.env.PAYHERE_SECRET || '';
  const merchantId = process.env.PAYHERE_MERCHANT_ID || '';

  const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
  const amountFormatted = parseFloat(amount).toFixed(2);
  const rawHash = `${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;
  return crypto.createHash('md5').update(rawHash).digest('hex').toUpperCase();
};

/**
 * Verify PayHere webhook signature.
 * Formula same as above, but includes status_code.
 */
const verifyPayhereWebhook = (body) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;
  const secret = process.env.PAYHERE_SECRET || '';
  const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
  const localMd5 = crypto
    .createHash('md5')
    .update(`${merchant_id}${order_id}${parseFloat(payhere_amount).toFixed(2)}${payhere_currency}${status_code}${hashedSecret}`)
    .digest('hex')
    .toUpperCase();
  return localMd5 === md5sig;
};

/**
 * Create a PayHere payment record and return payload for frontend redirect.
 */
const createPayherePayment = async (challengeId, userId) => {
  const challengerProfile = await PlayerProfile.findOne({ userId });
  if (!challengerProfile) throw Object.assign(new Error('Player profile not found.'), { statusCode: 404 });

  const challenge = await Challenge.findById(challengeId)
    .populate('defenderId', 'ign');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  if (challenge.challengerId.toString() !== challengerProfile._id.toString()) {
    throw Object.assign(new Error('You are not the challenger.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PAYMENT_PENDING') {
    throw Object.assign(new Error(`Challenge must be in PAYMENT_PENDING state. Current: ${challenge.status}`), { statusCode: 400 });
  }

  // Use server-side amount — NEVER trust frontend amount
  const amount = challenge.challengeAmount;
  const currency = challenge.currency || 'LKR';
  const orderId = `FROST-${challenge._id}-${Date.now()}`;

  // Create payment record
  const payment = await Payment.create({
    challengeId: challenge._id,
    payerId: challengerProfile._id,
    amount,
    currency,
    payhereOrderId: orderId,
    status: 'PENDING',
  });

  const hash = generatePayhereHash(orderId, amount, currency);

  const sandbox = process.env.PAYHERE_SANDBOX === 'true';
  const payhereUrl = sandbox
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

  return {
    payment,
    payhereUrl,
    payload: {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: `${process.env.CLIENT_URL}/challenges?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/challenges?payment=cancelled`,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: orderId,
      items: `FROST Challenge: vs ${challenge.defenderId.ign}`,
      currency,
      amount: parseFloat(amount).toFixed(2),
      hash,
    },
  };
};

/**
 * Handle PayHere webhook callback. Server-side verified only.
 */
const handlePayhereWebhook = async (body) => {
  // Verify signature
  const isValid = verifyPayhereWebhook(body);
  if (!isValid) {
    const err = new Error('Invalid PayHere signature. Payment not processed.');
    err.statusCode = 400;
    throw err;
  }

  const { order_id, payhere_amount, payhere_currency, status_code, payment_id } = body;

  const payment = await Payment.findOne({ payhereOrderId: order_id });
  if (!payment) throw Object.assign(new Error('Payment record not found.'), { statusCode: 404 });

  payment.gatewayResponse = body;
  payment.payhereTransactionId = payment_id;

  // status_code 2 = successful
  if (status_code === '2') {
    // Server-side amount validation
    if (Math.abs(parseFloat(payhere_amount) - payment.amount) > 1) {
      payment.status = 'FAILED';
      await payment.save();
      throw Object.assign(new Error('Payment amount mismatch. Payment rejected.'), { statusCode: 400 });
    }

    payment.status = 'CONFIRMED';
    payment.confirmedAt = new Date();
    await payment.save();

    // Transition challenge to PAYMENT_CONFIRMED → MATCH_PENDING
    const challenge = await Challenge.findById(payment.challengeId)
      .populate('challengerId', 'ign userId')
      .populate('defenderId', 'ign userId');

    if (challenge && challenge.status === 'PAYMENT_PENDING') {
      challenge.status = 'PAYMENT_CONFIRMED';
      await challenge.save();

      // Create Match record
      const challengerRankDoc = await Ranking.findOne({
        platform: challenge.platform,
        players: challenge.challengerId._id,
      });
      const defenderRankDoc = await Ranking.findOne({
        platform: challenge.platform,
        players: challenge.defenderId._id,
      });

      await Match.create({
        challengeId: challenge._id,
        challengerId: challenge.challengerId._id,
        defenderId: challenge.defenderId._id,
        platform: challenge.platform,
        challengeAmount: challenge.challengeAmount,
        currency: challenge.currency,
        challengerRankAtChallenge: challenge.challengerRankAtCreation,
        defenderRankAtChallenge: challenge.defenderRankAtCreation,
        challengerRankAtMatch: challengerRankDoc ? challengerRankDoc.rank : null,
        defenderRankAtMatch: defenderRankDoc ? defenderRankDoc.rank : null,
        resultStatus: 'PENDING',
      });

      // Move to MATCH_PENDING
      challenge.status = 'MATCH_PENDING';
      await challenge.save();

      // Notify both players
      await Notification.create({
        userId: challenge.challengerId.userId,
        type: 'PAYMENT_CONFIRMED',
        message: `Your payment of Rs. ${challenge.challengeAmount.toLocaleString()} has been confirmed. FROST will manage your match.`,
        relatedEntity: 'Challenge',
        relatedId: challenge._id,
      });
      await Notification.create({
        userId: challenge.defenderId.userId,
        type: 'PAYMENT_CONFIRMED',
        message: `The challenge payment from ${challenge.challengerId.ign} has been confirmed. Prepare for your match.`,
        relatedEntity: 'Challenge',
        relatedId: challenge._id,
      });
    }

  } else if (status_code === '-1') {
    payment.status = 'FAILED';
    await payment.save();
  } else if (status_code === '-2') {
    payment.status = 'FAILED';
    await payment.save();
  }

  return payment;
};

/**
 * Admin: manually confirm payment (fallback for PayHere issues).
 */
const adminConfirmPayment = async (paymentId, adminUser) => {
  const AdminAuditLog = require('../models/AdminAuditLog');
  const payment = await Payment.findById(paymentId);
  if (!payment) throw Object.assign(new Error('Payment not found.'), { statusCode: 404 });

  payment.status = 'CONFIRMED';
  payment.confirmedBy = adminUser._id;
  payment.confirmedAt = new Date();
  await payment.save();

  // Transition challenge
  const challenge = await Challenge.findById(payment.challengeId)
    .populate('challengerId', 'ign userId')
    .populate('defenderId', 'ign userId');

  if (challenge && challenge.status === 'PAYMENT_PENDING') {
    challenge.status = 'PAYMENT_CONFIRMED';
    await challenge.save();

    const challengerRankDoc = await Ranking.findOne({ platform: challenge.platform, players: challenge.challengerId._id });
    const defenderRankDoc = await Ranking.findOne({ platform: challenge.platform, players: challenge.defenderId._id });

    // Check if match already exists
    const existingMatch = await Match.findOne({ challengeId: challenge._id });
    if (!existingMatch) {
      await Match.create({
        challengeId: challenge._id,
        challengerId: challenge.challengerId._id,
        defenderId: challenge.defenderId._id,
        platform: challenge.platform,
        challengeAmount: challenge.challengeAmount,
        currency: challenge.currency,
        challengerRankAtChallenge: challenge.challengerRankAtCreation,
        defenderRankAtChallenge: challenge.defenderRankAtCreation,
        challengerRankAtMatch: challengerRankDoc ? challengerRankDoc.rank : null,
        defenderRankAtMatch: defenderRankDoc ? defenderRankDoc.rank : null,
        resultStatus: 'PENDING',
      });
    }

    challenge.status = 'MATCH_PENDING';
    await challenge.save();
  }

  await AdminAuditLog.create({
    adminId: adminUser._id,
    action: 'PAYMENT_CONFIRMED',
    targetEntity: 'Payment',
    targetId: payment._id,
    reason: 'Manual admin confirmation',
    metadata: { challengeId: payment.challengeId, amount: payment.amount },
  });

  return payment;
};

module.exports = {
  createPayherePayment,
  handlePayhereWebhook,
  adminConfirmPayment,
  generatePayhereHash,
};
