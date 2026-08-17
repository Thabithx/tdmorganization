const mongoose = require('mongoose');
const Match = require('../models/Match');
const Challenge = require('../models/Challenge');
const Payment = require('../models/Payment');
const Ranking = require('../models/Ranking');
const RankingHistory = require('../models/RankingHistory');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const PlayerProfile = require('../models/PlayerProfile');
const rankingService = require('./ranking.service');

/**
 * Admin: confirm match result.
 * This is the most critical operation in FROST.
 * Performed atomically inside a MongoDB transaction.
 */
const confirmResult = async ({ matchId, result, adminUser }) => {
  if (!['CHALLENGER_WON', 'CHALLENGER_LOST'].includes(result)) {
    throw Object.assign(new Error('Invalid result. Must be CHALLENGER_WON or CHALLENGER_LOST.'), { statusCode: 400 });
  }

  const match = await Match.findById(matchId)
    .populate('challengerId', 'ign userId platform')
    .populate('defenderId', 'ign userId platform');

  if (!match) throw Object.assign(new Error('Match not found.'), { statusCode: 404 });
  if (match.resultStatus === 'COMPLETED') {
    throw Object.assign(new Error('Match has already been completed.'), { statusCode: 400 });
  }

  const challenge = await Challenge.findById(match.challengeId);
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  if (!['MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING'].includes(challenge.status)) {
    throw Object.assign(
      new Error(`Challenge must be in MATCH_PENDING/ACTIVE/RESULT_PENDING state. Current: ${challenge.status}`),
      { statusCode: 400 }
    );
  }

  // Verify payment
  const payment = await Payment.findOne({ challengeId: challenge._id, status: 'CONFIRMED' });
  if (!payment) {
    throw Object.assign(new Error('Payment has not been confirmed for this challenge.'), { statusCode: 400 });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get current ranks at time of match confirmation
    const challengerRankDoc = await Ranking.findOne({
      platform: match.platform,
      players: match.challengerId._id,
    }).session(session);
    const defenderRankDoc = await Ranking.findOne({
      platform: match.platform,
      players: match.defenderId._id,
    }).session(session);

    const challengerCurrentRank = challengerRankDoc ? challengerRankDoc.rank : null;
    const defenderCurrentRank = defenderRankDoc ? defenderRankDoc.rank : null;

    // Determine winner and loser
    const winnerId = result === 'CHALLENGER_WON' ? match.challengerId._id : match.defenderId._id;
    const loserId = result === 'CHALLENGER_WON' ? match.defenderId._id : match.challengerId._id;

    // Apply ranking algorithm (within transaction)
    let rankingHistoryEntries = [];
    try {
      rankingHistoryEntries = await rankingService.applyMatchResult(
        {
          ...match.toObject(),
          challengerId: match.challengerId._id,
          defenderId: match.defenderId._id,
          platform: match.platform,
        },
        result,
        adminUser._id,
        session
      );
    } catch (rankErr) {
      if (rankErr.code === 'SHARED_RANK_CAPACITY_CONFLICT') {
        // Abort transaction and notify admin to resolve manually
        await session.abortTransaction();
        session.endSession();
        return {
          requiresAdminResolution: true,
          message: rankErr.message,
          defenderRank: rankErr.defenderRank,
          matchId: match._id,
        };
      }
      throw rankErr;
    }

    // Update match record
    match.winnerId = winnerId;
    match.loserId = loserId;
    match.result = result;
    match.resultStatus = 'COMPLETED';
    match.matchCompletedAt = new Date();
    match.verifiedBy = adminUser._id;
    match.challengerRankAtMatch = challengerCurrentRank;
    match.defenderRankAtMatch = defenderCurrentRank;
    await match.save({ session });

    // Update challenge status
    challenge.status = 'COMPLETED';
    await challenge.save({ session });

    // Create RankingHistory entries
    if (rankingHistoryEntries.length > 0) {
      await RankingHistory.insertMany(rankingHistoryEntries, { session });
    }

    // Create AdminAuditLog
    await AdminAuditLog.create([{
      adminId: adminUser._id,
      action: 'MATCH_RESULT_CONFIRMED',
      targetEntity: 'Match',
      targetId: match._id,
      metadata: {
        challenger: match.challengerId.ign,
        defender: match.defenderId.ign,
        result,
        amount: match.challengeAmount,
        rankingChanges: rankingHistoryEntries.length,
      },
    }], { session });

    // Create notifications
    const winnerProfile = result === 'CHALLENGER_WON' ? match.challengerId : match.defenderId;
    const loserProfile = result === 'CHALLENGER_WON' ? match.defenderId : match.challengerId;

    const winnerNewRank = rankingHistoryEntries.find(
      h => h.playerId.toString() === winnerProfile._id.toString()
    )?.newRank;
    const loserNewRank = rankingHistoryEntries.find(
      h => h.playerId.toString() === loserProfile._id.toString()
    )?.newRank;

    let winnerMessage = `Your match result has been confirmed. You defeated ${loserProfile.ign}!`;
    if (winnerNewRank) {
      winnerMessage += ` You are now ranked #${winnerNewRank}.`;
    }

    let loserMessage = `Your match result has been confirmed. You lost to ${winnerProfile.ign}.`;
    if (loserNewRank !== undefined && loserNewRank !== null) {
      loserMessage += ` Your new rank is #${loserNewRank}.`;
    } else if (result === 'CHALLENGER_LOST') {
      loserMessage += ` Your rank remains unchanged.`;
    }

    await Notification.insertMany([
      {
        userId: winnerProfile.userId,
        type: 'MATCH_COMPLETED',
        message: winnerMessage,
        relatedEntity: 'Match',
        relatedId: match._id,
      },
      {
        userId: loserProfile.userId,
        type: 'MATCH_COMPLETED',
        message: loserMessage,
        relatedEntity: 'Match',
        relatedId: match._id,
      },
    ], { session });

    await session.commitTransaction();

    return { success: true, match, rankingChanges: rankingHistoryEntries };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Admin: add evidence to a match.
 */
const addEvidence = async ({ matchId, evidence, adminUser }) => {
  const match = await Match.findById(matchId);
  if (!match) throw Object.assign(new Error('Match not found.'), { statusCode: 404 });

  match.evidence.push(evidence);
  await match.save();

  await AdminAuditLog.create({
    adminId: adminUser._id,
    action: 'EVIDENCE_UPDATED',
    targetEntity: 'Match',
    targetId: match._id,
    metadata: { evidence },
  });

  return match;
};

/**
 * Admin: update match status (advance through lifecycle).
 */
const updateMatchStatus = async ({ matchId, status, adminUser }) => {
  const VALID_ADMIN_TRANSITIONS = {
    MATCH_PENDING: 'MATCH_ACTIVE',
    MATCH_ACTIVE: 'RESULT_PENDING',
  };

  const match = await Match.findById(matchId);
  if (!match) throw Object.assign(new Error('Match not found.'), { statusCode: 404 });

  const challenge = await Challenge.findById(match.challengeId);
  if (!challenge) throw Object.assign(new Error('Challenge not found.'), { statusCode: 404 });

  const validNext = VALID_ADMIN_TRANSITIONS[challenge.status];
  if (status !== validNext) {
    throw Object.assign(
      new Error(`Invalid transition from ${challenge.status} to ${status}.`),
      { statusCode: 400 }
    );
  }

  challenge.status = status;
  await challenge.save();

  await AdminAuditLog.create({
    adminId: adminUser._id,
    action: 'MATCH_STATUS_UPDATED',
    targetEntity: 'Match',
    targetId: match._id,
    metadata: { newStatus: status },
  });

  return challenge;
};

module.exports = { confirmResult, addEvidence, updateMatchStatus };
