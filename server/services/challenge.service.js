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

  // Notify defender
  await Notification.create({
    userId: defenderProfile.userId,
    type: 'CHALLENGE_RECEIVED',
    message: `You have been challenged by ${challengerProfile.ign} for Rs. ${amount.toLocaleString()}.`,
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
    .populate('challengerId', 'ign userId');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  if (challenge.defenderId.toString() !== defenderProfile._id.toString()) {
    throw Object.assign(new Error('You are not the defender of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING') {
    throw Object.assign(new Error(`Challenge cannot be rejected in ${challenge.status} state.`), { statusCode: 400 });
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

module.exports = { createChallenge, acceptChallenge, rejectChallenge };
