const Challenge = require('../models/Challenge');
const Ranking = require('../models/Ranking');
const PlayerProfile = require('../models/PlayerProfile');
const Notification = require('../models/Notification');
const rankingService = require('./ranking.service');

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING'];
const IN_PROGRESS_STATUSES = ['ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'DISPUTED'];

/**
 * Lazy-expire a challenge if its timeouts have elapsed.
 */
const checkAndLazyExpire = async (challenge) => {
  if (!challenge) return challenge;

  const now = new Date();

  // 1. Pending 72-hour expiration check
  if (challenge.status === 'PENDING') {
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    if (challenge.createdAt < seventyTwoHoursAgo) {
      challenge.status = 'EXPIRED';
      challenge.expiredAt = now;
      challenge.cancellationReason = 'AUTO_EXPIRED';
      await challenge.save();

      const populated = await Challenge.findById(challenge._id).populate('challengerId defenderId');
      if (populated?.challengerId?.userId) {
        await Notification.create({
          userId: populated.challengerId.userId,
          type: 'CHALLENGE_EXPIRED',
          message: `Your challenge to ${populated.defenderId?.ign || 'defender'} has expired without response.`,
          relatedEntity: 'Challenge',
          relatedId: challenge._id
        });
      }
      if (populated?.defenderId?.userId) {
        await Notification.create({
          userId: populated.defenderId.userId,
          type: 'CHALLENGE_EXPIRED',
          message: `The challenge from ${populated.challengerId?.ign || 'challenger'} has expired. This counts as a decline.`,
          relatedEntity: 'Challenge',
          relatedId: challenge._id
        });
      }
      return challenge;
    }
  }

  // 2. PAYMENT_PENDING 24-hour timeout check
  if (challenge.status === 'PAYMENT_PENDING') {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deadlinePassed = challenge.paymentDeadline ? challenge.paymentDeadline < now : (challenge.acceptedAt && challenge.acceptedAt < twentyFourHoursAgo);
    if (deadlinePassed) {
      challenge.status = 'CANCELLED';
      challenge.cancellationReason = 'PAYMENT_TIMEOUT';
      await challenge.save();

      const populated = await Challenge.findById(challenge._id).populate('challengerId defenderId');
      if (populated?.challengerId?.userId) {
        await Notification.create({
          userId: populated.challengerId.userId,
          type: 'CHALLENGE_CANCELLED',
          message: `Payment deadline (24 hours) for your challenge against ${populated.defenderId?.ign || 'defender'} expired. The challenge is cancelled.`,
          relatedEntity: 'Challenge',
          relatedId: challenge._id
        });
      }
      if (populated?.defenderId?.userId) {
        await Notification.create({
          userId: populated.defenderId.userId,
          type: 'CHALLENGE_CANCELLED',
          message: `Payment deadline for the challenge with ${populated.challengerId?.ign || 'challenger'} expired. Challenge cancelled.`,
          relatedEntity: 'Challenge',
          relatedId: challenge._id
        });
      }
      return challenge;
    }
  }

  return challenge;
};

/**
 * Create a new challenge.
 */
const createChallenge = async ({ challengerUserId, defenderId, amount }) => {
  // Load challenger profile
  const challengerProfile = await PlayerProfile.findOne({ userId: challengerUserId });
  if (!challengerProfile) throw Object.assign(new Error('Your player profile not found.'), { statusCode: 404 });
  if (challengerProfile.status === 'SUSPENDED') {
    throw Object.assign(new Error('Suspended accounts cannot create challenges.'), { statusCode: 403 });
  }

  // Load defender profile
  const defenderProfile = await PlayerProfile.findById(defenderId);
  if (!defenderProfile) throw Object.assign(new Error('Defender not found.'), { statusCode: 404 });
  if (defenderProfile.status === 'SUSPENDED') {
    throw Object.assign(new Error('Cannot challenge a suspended account.'), { statusCode: 403 });
  }

  // Self-challenge check
  if (challengerProfile._id.toString() === defenderId.toString()) {
    throw Object.assign(new Error('You cannot challenge yourself.'), { statusCode: 400 });
  }

  // Authoritative Platform check
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
      new Error(`Minimum challenge amount for rank #${defenderRank} is Rs. ${minimum}.`),
      { statusCode: 400 }
    );
  }

  // Anti-Abuse: SYMMETRIC Maximum 2 challenge attempts between the same player pair within rolling 7 days
  // Excludes automatic system cancellations: DEFENDER_CONFLICT_CANCELLED and PAYMENT_TIMEOUT
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pairAttemptsCount = await Challenge.countDocuments({
    $or: [
      { challengerId: challengerProfile._id, defenderId: defenderProfile._id },
      { challengerId: defenderProfile._id, defenderId: challengerProfile._id }
    ],
    createdAt: { $gte: sevenDaysAgo },
    cancellationReason: { $nin: ['DEFENDER_CONFLICT_CANCELLED', 'PAYMENT_TIMEOUT'] }
  });

  if (pairAttemptsCount >= 2) {
    throw Object.assign(
      new Error("Maximum 2 challenge attempts between you and this player within a rolling 7-day period has been reached."),
      { statusCode: 400 }
    );
  }

  // Duplicate active challenge check — block if active challenge exists between these two players
  const existingChallenge = await Challenge.findOne({
    $or: [
      { challengerId: challengerProfile._id, defenderId: defenderProfile._id },
      { challengerId: defenderProfile._id, defenderId: challengerProfile._id },
    ],
    status: { $in: ACTIVE_STATUSES },
  });
  if (existingChallenge) {
    const checked = await checkAndLazyExpire(existingChallenge);
    if (ACTIVE_STATUSES.includes(checked.status)) {
      throw Object.assign(new Error('An active challenge already exists between you and this player.'), { statusCode: 409 });
    }
  }

  // Single active match check: Challenger cannot have an existing in-progress match
  const challengerInProgress = await Challenge.findOne({
    $or: [{ challengerId: challengerProfile._id }, { defenderId: challengerProfile._id }],
    status: { $in: IN_PROGRESS_STATUSES }
  });
  if (challengerInProgress) {
    const checked = await checkAndLazyExpire(challengerInProgress);
    if (IN_PROGRESS_STATUSES.includes(checked.status)) {
      throw Object.assign(new Error('You already have an active match in progress. Complete your match before issuing new challenges.'), { statusCode: 400 });
    }
  }

  // Get challenger's current rank
  const challengerRank = await rankingService.getPlayerRank(challengerProfile._id, challengerProfile.platform);

  // Unranked players can only challenge ranks 4–10.
  // Ranks 1–3 can only be challenged by ranked players.
  if (challengerRank === null && defenderRank <= 3) {
    throw Object.assign(
      new Error('Unranked players cannot challenge Top 3 ranked players (Ranks #1–#3). You must be ranked first.'),
      { statusCode: 403 }
    );
  }

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
  if (defenderProfile.status === 'SUSPENDED') {
    throw Object.assign(new Error('Suspended accounts cannot accept challenges.'), { statusCode: 403 });
  }

  let challenge = await Challenge.findById(challengeId)
    .populate('challengerId', 'ign userId status')
    .populate('defenderId', 'ign userId status');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  // Lazy expiration check
  challenge = await checkAndLazyExpire(challenge);

  if (challenge.defenderId._id.toString() !== defenderProfile._id.toString()) {
    throw Object.assign(new Error('You are not the defender of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING') {
    throw Object.assign(new Error(`Challenge is in ${challenge.status} state and cannot be accepted.`), { statusCode: 400 });
  }

  // Check single active match constraint for BOTH defender and challenger
  const defenderActiveMatch = await Challenge.findOne({
    _id: { $ne: challenge._id },
    $or: [{ challengerId: defenderProfile._id }, { defenderId: defenderProfile._id }],
    status: { $in: IN_PROGRESS_STATUSES }
  });
  if (defenderActiveMatch) {
    const checked = await checkAndLazyExpire(defenderActiveMatch);
    if (IN_PROGRESS_STATUSES.includes(checked.status)) {
      throw Object.assign(new Error('You already have an accepted or active match in progress.'), { statusCode: 400 });
    }
  }

  const challengerActiveMatch = await Challenge.findOne({
    _id: { $ne: challenge._id },
    $or: [{ challengerId: challenge.challengerId._id }, { defenderId: challenge.challengerId._id }],
    status: { $in: IN_PROGRESS_STATUSES }
  });
  if (challengerActiveMatch) {
    const checked = await checkAndLazyExpire(challengerActiveMatch);
    if (IN_PROGRESS_STATUSES.includes(checked.status)) {
      throw Object.assign(new Error('The challenger already has another active match in progress.'), { statusCode: 400 });
    }
  }

  const now = new Date();
  const paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour payment deadline

  challenge.status = 'PAYMENT_PENDING';
  challenge.acceptedAt = now;
  challenge.paymentDeadline = paymentDeadline;
  await challenge.save();

  // Auto-cancel any OTHER pending challenges targeting defender or created by defender
  const conflictingChallenges = await Challenge.find({
    _id: { $ne: challenge._id },
    $or: [{ defenderId: defenderProfile._id }, { challengerId: defenderProfile._id }],
    status: 'PENDING'
  }).populate('challengerId defenderId');

  for (const conflict of conflictingChallenges) {
    conflict.status = 'CANCELLED';
    conflict.cancellationReason = 'DEFENDER_CONFLICT_CANCELLED';
    await conflict.save();

    if (conflict.challengerId?.userId) {
      await Notification.create({
        userId: conflict.challengerId.userId,
        type: 'CHALLENGE_CANCELLED',
        message: `Your challenge was automatically cancelled because ${defenderProfile.ign} accepted another challenge.`,
        relatedEntity: 'Challenge',
        relatedId: conflict._id
      });
    }
  }

  // Notify challenger to pay within 24 hours
  await Notification.create({
    userId: challenge.challengerId.userId,
    type: 'CHALLENGE_ACCEPTED',
    message: `${defenderProfile.ign} accepted your challenge! Please complete payment of Rs. ${challenge.challengeAmount.toLocaleString()} within 24 hours.`,
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
  if (defenderProfile.status === 'SUSPENDED') {
    throw Object.assign(new Error('Suspended accounts cannot reject challenges.'), { statusCode: 403 });
  }

  let challenge = await Challenge.findById(challengeId)
    .populate('challengerId', 'ign userId')
    .populate('defenderId', 'ign userId');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  challenge = await checkAndLazyExpire(challenge);

  if (challenge.defenderId._id.toString() !== defenderProfile._id.toString()) {
    throw Object.assign(new Error('You are not the defender of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING') {
    throw Object.assign(new Error(`Challenge cannot be rejected in ${challenge.status} state.`), { statusCode: 400 });
  }

  // Anti-Abuse Decline Limit Check: Top 10 players cannot decline (reject or expire) more than 3 challenges in rolling 7 days
  const defenderRankDoc = await Ranking.findOne({ platform: challenge.platform, players: defenderProfile._id });
  if (defenderRankDoc && defenderRankDoc.rank <= 10) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const declineCount = await Challenge.countDocuments({
      defenderId: defenderProfile._id,
      status: { $in: ['REJECTED', 'EXPIRED'] },
      $or: [
        { rejectedAt: { $gte: sevenDaysAgo } },
        { expiredAt: { $gte: sevenDaysAgo } },
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

  let challenge = await Challenge.findById(challengeId)
    .populate('challengerId', 'ign userId')
    .populate('defenderId', 'ign userId');
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  challenge = await checkAndLazyExpire(challenge);

  if (challenge.challengerId._id.toString() !== challengerProfile._id.toString()) {
    throw Object.assign(new Error('You are not the challenger of this challenge.'), { statusCode: 403 });
  }

  if (challenge.status !== 'PENDING' && challenge.status !== 'PAYMENT_PENDING') {
    throw Object.assign(new Error(`Challenge cannot be cancelled in ${challenge.status} state.`), { statusCode: 400 });
  }

  challenge.status = 'CANCELLED';
  challenge.cancellationReason = 'PLAYER_CANCELLED';
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

module.exports = { createChallenge, acceptChallenge, rejectChallenge, cancelChallenge, checkAndLazyExpire };
