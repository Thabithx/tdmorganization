const Challenge = require('../models/Challenge');
const Ranking = require('../models/Ranking');
const PlayerProfile = require('../models/PlayerProfile');
const Notification = require('../models/Notification');
const rankingService = require('./ranking.service');

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING'];

/**
 * Create a new challenge.
 */
const createChallenge = async ({ challengerUserId, defenderId, amount }) => {
  // Load challenger profile
  const challengerProfile = await PlayerProfile.findOne({ userId: challengerUserId });
  if (!challengerProfile) throw Object.assign(new Error('Your player profile not found.'), { statusCode: 404 });

  // Load defender profile
  const defenderProfile = await PlayerProfile.findById(defenderId);
  if (!defenderProfile) throw Object.assign(new Error('Defender not found.'), { statusCode: 404 });

  // Self-challenge check
  if (challengerProfile._id.toString() === defenderId.toString()) {
    throw Object.assign(new Error('You cannot challenge yourself.'), { statusCode: 400 });
  }

  // Platform check
  if (challengerProfile.platform !== defenderProfile.platform) {
    throw Object.assign(new Error('You can only challenge players on the same platform.'), { statusCode: 400 });
  }

  // Check defender is ranked
  const defenderRankDoc = await Ranking.findOne({ platform: defenderProfile.platform, players: defenderId });
  if (!defenderRankDoc) {
    throw Object.assign(new Error('You can only challenge ranked players.'), { statusCode: 400 });
  }

  const defenderRank = defenderRankDoc.rank;

  // Minimum amount validation (server-side, not trusting frontend)
  const minimum = rankingService.getMinimumAmount(defenderRank);
  if (!amount || isNaN(amount) || amount < minimum) {
    throw Object.assign(
      new Error(`Minimum challenge amount for this rank is Rs. ${minimum}.`),
      { statusCode: 400 }
    );
  }

  // Anti-Abuse: Maximum 2 challenges against the same opponent within a rolling 7-day period (excluding CANCELLED)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const challengeCountAgainstOpponent = await Challenge.countDocuments({
    challengerId: challengerProfile._id,
    defenderId: defenderProfile._id,
    createdAt: { $gte: sevenDaysAgo },
    status: { $ne: 'CANCELLED' }
  });

  if (challengeCountAgainstOpponent >= 2) {
    throw Object.assign(
      new Error("You have already challenged this player twice within the last 7 days. You can challenge them again once the oldest challenge falls outside the 7-day window."),
      { statusCode: 400 }
    );
  }

  // Duplicate challenge check — block if active challenge exists between these two players
  const existingChallenge = await Challenge.findOne({
    $or: [
      { challengerId: challengerProfile._id, defenderId: defenderProfile._id },
      { challengerId: defenderProfile._id, defenderId: challengerProfile._id },
    ],
    status: { $in: ACTIVE_STATUSES },
  });
  if (existingChallenge) {
    throw Object.assign(new Error('An active challenge already exists between you and this player.'), { statusCode: 409 });
  }

  // Get challenger's current rank
  const challengerRank = await rankingService.getPlayerRank(challengerProfile._id, challengerProfile.platform);

  const challenge = await Challenge.create({
    challengerId: challengerProfile._id,
    defenderId: defenderProfile._id,
    platform: challengerProfile.platform,
    challengerRankAtCreation: challengerRank,
    defenderRankAtCreation: defenderRank,
    challengeAmount: amount,
    minimumRequiredAmount: minimum,
    currency: 'LKR',
    status: 'PENDING',
  });

  // Notify defender with 80% defender prize amount
  const defenderPrize = Math.floor(amount * 0.80);
  await Notification.create({
    userId: defenderProfile.userId,
    type: 'CHALLENGE_RECEIVED',
    message: `You have been challenged by ${challengerProfile.ign} for Rs. ${defenderPrize.toLocaleString()}.`,
    relatedEntity: 'Challenge',
    relatedId: challenge._id,
  });

  return challenge;
};

/**
 * Accept a challenge (by defender).
 */
const acceptChallenge = async ({ challengeId, defenderUserId }) => {
  const defenderProfile = await PlayerProfile.findOne({ userId: defenderUserId });
  if (!defenderProfile) throw Object.assign(new Error('Defender profile not found.'), { statusCode: 404 });

  const challenge = await Challenge.findById(challengeId)
    .populate('challengerId', 'ign userId')
    .populate('defenderId', 'ign userId');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  if (challenge.defenderId._id.toString() !== defenderProfile._id.toString()) {
    throw Object.assign(new Error('You are not the defender of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING') {
    throw Object.assign(new Error(`Challenge is in ${challenge.status} state and cannot be accepted.`), { statusCode: 400 });
  }

  challenge.status = 'PAYMENT_PENDING';
  challenge.acceptedAt = new Date();
  await challenge.save();

  // Notify challenger
  await Notification.create({
    userId: challenge.challengerId.userId,
    type: 'CHALLENGE_ACCEPTED',
    message: `${defenderProfile.ign} accepted your challenge. Please complete your payment of Rs. ${challenge.challengeAmount.toLocaleString()}.`,
    relatedEntity: 'Challenge',
    relatedId: challenge._id,
  });

  return challenge;
};

/**
 * Reject a challenge (by defender).
 */
const rejectChallenge = async ({ challengeId, defenderUserId }) => {
  const defenderProfile = await PlayerProfile.findOne({ userId: defenderUserId });
  if (!defenderProfile) throw Object.assign(new Error('Defender profile not found.'), { statusCode: 404 });

  const challenge = await Challenge.findById(challengeId)
    .populate('challengerId', 'ign userId')
    .populate('defenderId', 'ign userId');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  if (challenge.defenderId._id.toString() !== defenderProfile._id.toString()) {
    throw Object.assign(new Error('You are not the defender of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING') {
    throw Object.assign(new Error(`Challenge cannot be rejected in ${challenge.status} state.`), { statusCode: 400 });
  }

  // Anti-Abuse Decline Limit Check: Top 10 players cannot reject more than 3 incoming challenges in rolling 7 days
  const defenderRankDoc = await Ranking.findOne({ platform: challenge.platform, players: defenderProfile._id });
  if (defenderRankDoc && defenderRankDoc.rank <= 10) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const declineCount = await Challenge.countDocuments({
      defenderId: defenderProfile._id,
      status: { $in: ['REJECTED', 'EXPIRED'] },
      $or: [
        { rejectedAt: { $gte: sevenDaysAgo } },
        { status: 'EXPIRED', updatedAt: { $gte: sevenDaysAgo } }
      ]
    });

    if (declineCount >= 3) {
      throw Object.assign(
        new Error("You have reached your maximum of 3 declined challenges within the last 7 days. You must accept this challenge or allow it to expire."),
        { statusCode: 400 }
      );
    }
  }

  challenge.status = 'REJECTED';
  challenge.rejectedAt = new Date();
  await challenge.save();

  // Notify challenger
  await Notification.create({
    userId: challenge.challengerId.userId,
    type: 'CHALLENGE_REJECTED',
    message: `${defenderProfile.ign} rejected your challenge.`,
    relatedEntity: 'Challenge',
    relatedId: challenge._id,
  });

  return challenge;
};

/**
 * Cancel a challenge (by challenger).
 */
const cancelChallenge = async ({ challengeId, challengerUserId }) => {
  const challengerProfile = await PlayerProfile.findOne({ userId: challengerUserId });
  if (!challengerProfile) throw Object.assign(new Error('Challenger profile not found.'), { statusCode: 404 });

  const challenge = await Challenge.findById(challengeId)
    .populate('challengerId', 'ign userId')
    .populate('defenderId', 'ign userId');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  if (challenge.challengerId._id.toString() !== challengerProfile._id.toString()) {
    throw Object.assign(new Error('You are not the challenger of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING' && challenge.status !== 'PAYMENT_PENDING') {
    throw Object.assign(new Error(`Challenge cannot be cancelled in ${challenge.status} state.`), { statusCode: 400 });
  }

  challenge.status = 'CANCELLED';
  await challenge.save();

  // Notify defender
  await Notification.create({
    userId: challenge.defenderId.userId,
    type: 'CHALLENGE_CANCELLED',
    message: `${challengerProfile.ign} cancelled their challenge.`,
    relatedEntity: 'Challenge',
    relatedId: challenge._id,
  });

  return challenge;
};

module.exports = { createChallenge, acceptChallenge, rejectChallenge, cancelChallenge };
