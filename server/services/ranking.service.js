const Ranking = require('../models/Ranking');
const RankingHistory = require('../models/RankingHistory');
const AdminAuditLog = require('../models/AdminAuditLog');
const PlayerProfile = require('../models/PlayerProfile');

const ACTIVE_STATUSES = ['PENDING','ACCEPTED','PAYMENT_PENDING','PAYMENT_CONFIRMED','MATCH_PENDING','MATCH_ACTIVE','RESULT_PENDING'];

/**
 * Get the full leaderboard for a platform.
 */
const getLeaderboard = async (platform) => {
  return Ranking.getLeaderboard(platform);
};

/**
 * Get the current rank number of a player in a platform, or null if unranked.
 */
const getPlayerRank = async (playerId, platform) => {
  const rankDoc = await Ranking.findOne({ platform, players: playerId });
  return rankDoc ? rankDoc.rank : null;
};

/**
 * Get the ranking doc for a player in a platform.
 */
const getPlayerRankDoc = async (playerId, platform) => {
  return Ranking.findOne({ platform, players: playerId });
};

/**
 * Compute the minimum challenge amount based on defender rank.
 */
const getMinimumAmount = (defenderRank) => {
  const tiers = {
    1: 3000,
    2: 2500,
    3: 2000,
    4: 1500,
    5: 1000,
    6: 900,
    7: 800,
    8: 700,
    9: 600,
    10: 500
  };
  return tiers[defenderRank] || 500;
};

/**
 * Apply match result. Called inside a transaction session.
 * Returns an array of RankingHistory records created (unsaved, to be created by caller).
 *
 * RULES:
 * - RANKED CHALLENGER WINS → Direct rank swap
 * - UNRANKED CHALLENGER WINS → Insertion at defender's rank + push-down
 * - CHALLENGER LOSES → No ranking change
 */
const applyMatchResult = async (match, result, adminId, session) => {
  const historyEntries = [];

  if (result === 'CHALLENGER_LOST') {
    // No ranking changes
    return historyEntries;
  }

  // CHALLENGER WON
  const challengerId = match.challengerId;
  const defenderId = match.defenderId;
  const platform = match.platform;

  // Find current rank docs
  const challengerRankDoc = await Ranking.findOne({ platform, players: challengerId }).session(session);
  const defenderRankDoc = await Ranking.findOne({ platform, players: defenderId }).session(session);

  if (!defenderRankDoc) {
    throw new Error('Defender is not currently ranked. Cannot apply ranking change.');
  }

  const defenderRank = defenderRankDoc.rank;

  if (challengerRankDoc) {
    // === RANKED vs RANKED: DIRECT SWAP ===
    const challengerRank = challengerRankDoc.rank;

    // Remove challenger from their current rank
    challengerRankDoc.players = challengerRankDoc.players.filter(
      p => p.toString() !== challengerId.toString()
    );

    // Remove defender from their current rank
    defenderRankDoc.players = defenderRankDoc.players.filter(
      p => p.toString() !== defenderId.toString()
    );

    // Add challenger to defender's rank position
    defenderRankDoc.players.push(challengerId);

    // Add defender to challenger's old rank position
    challengerRankDoc.players.push(defenderId);

    // Validate capacities
    if (defenderRankDoc.players.length > 3 || challengerRankDoc.players.length > 3) {
      throw new Error('CAPACITY_CONFLICT: Rank swap would exceed 3-player limit.');
    }

    await defenderRankDoc.save({ session });

    // If they were in the same rank (same-rank challenge), save once is enough
    if (challengerRankDoc._id.toString() !== defenderRankDoc._id.toString()) {
      await challengerRankDoc.save({ session });
    }

    // RankingHistory for challenger
    historyEntries.push({
      playerId: challengerId,
      platform,
      previousRank: challengerRank,
      newRank: defenderRank,
      reason: 'MATCH_WIN',
      matchId: match._id,
      challengeId: match.challengeId,
      adminId,
    });
    // RankingHistory for defender
    historyEntries.push({
      playerId: defenderId,
      platform,
      previousRank: defenderRank,
      newRank: challengerRank,
      reason: 'MATCH_LOSS',
      matchId: match._id,
      challengeId: match.challengeId,
      adminId,
    });

  } else {
    // === UNRANKED CHALLENGER WINS: INSERTION + PUSH DOWN ===
    // Check capacity conflict for shared rank at defenderRank
    const targetRankDoc = defenderRankDoc; // same doc
    if (targetRankDoc.players.length >= 3) {
      // Cannot insert without violating 3-player cap — requires admin resolution
      const err = new Error('SHARED_RANK_CAPACITY_CONFLICT: The defender\'s rank is full (3 players). Admin must resolve placement manually.');
      err.code = 'SHARED_RANK_CAPACITY_CONFLICT';
      err.defenderRank = defenderRank;
      throw err;
    }

    // Shift all ranks below defenderRank down by 1
    // Get all ranks from defenderRank to 10, sorted descending
    const ranksToShift = await Ranking.find({
      platform,
      rank: { $gte: defenderRank, $lte: 10 },
    }).sort({ rank: -1 }).session(session);

    const historyShifts = []; // collect shifted players for history

    for (const rankDoc of ranksToShift) {
      const oldRank = rankDoc.rank;
      const newRank = oldRank + 1;

      if (newRank > 10) {
        // These players become UNRANKED
        for (const pid of rankDoc.players) {
          historyShifts.push({
            playerId: pid,
            platform,
            previousRank: oldRank,
            newRank: null,
            reason: 'UNRANKED_PROMOTION',
            matchId: match._id,
            challengeId: match.challengeId,
            adminId,
          });
        }
        // Delete this rank row
        await Ranking.deleteOne({ _id: rankDoc._id }).session(session);
      } else {
        // Check if rank newRank already exists
        let nextRankDoc = await Ranking.findOne({ platform, rank: newRank }).session(session);
        if (!nextRankDoc) {
          nextRankDoc = new Ranking({ platform, rank: newRank, players: rankDoc.players });
          for (const pid of rankDoc.players) {
            historyShifts.push({
              playerId: pid,
              platform,
              previousRank: oldRank,
              newRank,
              reason: 'UNRANKED_PROMOTION',
              matchId: match._id,
              challengeId: match.challengeId,
              adminId,
            });
          }
          await nextRankDoc.save({ session });
        } else {
          // Merge into existing rank (shouldn't happen normally)
          const combined = [...nextRankDoc.players, ...rankDoc.players];
          if (combined.length > 3) {
            throw new Error(`CAPACITY_CONFLICT: Shifting rank ${oldRank} to ${newRank} would exceed 3-player limit.`);
          }
          for (const pid of rankDoc.players) {
            historyShifts.push({
              playerId: pid,
              platform,
              previousRank: oldRank,
              newRank,
              reason: 'UNRANKED_PROMOTION',
              matchId: match._id,
              challengeId: match.challengeId,
              adminId,
            });
            nextRankDoc.players.push(pid);
          }
          await nextRankDoc.save({ session });
        }
        // Clear the old rank row (now moved to newRank)
        await Ranking.deleteOne({ _id: rankDoc._id }).session(session);
      }
    }

    // Now place the unranked challenger at defenderRank (which is now free)
    const newRankDoc = new Ranking({ platform, rank: defenderRank, players: [challengerId] });
    await newRankDoc.save({ session });

    // History for unranked challenger
    historyEntries.push({
      playerId: challengerId,
      platform,
      previousRank: null,
      newRank: defenderRank,
      reason: 'UNRANKED_PROMOTION',
      matchId: match._id,
      challengeId: match.challengeId,
      adminId,
    });

    // Add all shift history
    historyEntries.push(...historyShifts);
  }

  return historyEntries;
};

/**
 * Manual admin ranking adjustment.
 */
const manualAdminAdjustment = async ({ platform, action, playerId, targetRank, swapWithPlayerId, reason, adminId }) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    let historyEntry = null;
    let auditMetadata = {};

    if (action === 'ADD_TO_RANK') {
      let rankDoc = await Ranking.findOne({ platform, rank: targetRank }).session(session);
      if (!rankDoc) {
        rankDoc = new Ranking({ platform, rank: targetRank, players: [playerId] });
      } else {
        if (rankDoc.players.length >= 3) throw new Error('Rank is full (max 3 players).');
        if (rankDoc.players.map(p => p.toString()).includes(playerId.toString())) throw new Error('Player already in this rank.');
        rankDoc.players.push(playerId);
      }
      await rankDoc.save({ session });
      historyEntry = { playerId, platform, previousRank: null, newRank: targetRank, reason: 'PLAYER_ADDED', adminId };
      auditMetadata = { action, platform, targetRank };

    } else if (action === 'REMOVE_FROM_RANK') {
      const rankDoc = await Ranking.findOne({ platform, players: playerId }).session(session);
      if (!rankDoc) throw new Error('Player is not ranked.');
      const oldRank = rankDoc.rank;
      rankDoc.players = rankDoc.players.filter(p => p.toString() !== playerId.toString());
      if (rankDoc.players.length === 0) {
        await Ranking.deleteOne({ _id: rankDoc._id }).session(session);
      } else {
        await rankDoc.save({ session });
      }
      historyEntry = { playerId, platform, previousRank: oldRank, newRank: null, reason: 'PLAYER_REMOVED', adminId };
      auditMetadata = { action, platform, oldRank };

    } else if (action === 'MOVE_TO_RANK') {
      // Remove from current rank
      const currentRankDoc = await Ranking.findOne({ platform, players: playerId }).session(session);
      const oldRank = currentRankDoc ? currentRankDoc.rank : null;
      if (currentRankDoc) {
        currentRankDoc.players = currentRankDoc.players.filter(p => p.toString() !== playerId.toString());
        if (currentRankDoc.players.length === 0) {
          await Ranking.deleteOne({ _id: currentRankDoc._id }).session(session);
        } else {
          await currentRankDoc.save({ session });
        }
      }
      // Add to target rank
      let targetRankDoc = await Ranking.findOne({ platform, rank: targetRank }).session(session);
      if (!targetRankDoc) {
        targetRankDoc = new Ranking({ platform, rank: targetRank, players: [playerId] });
      } else {
        if (targetRankDoc.players.length >= 3) throw new Error('Target rank is full (max 3 players).');
        targetRankDoc.players.push(playerId);
      }
      await targetRankDoc.save({ session });
      historyEntry = { playerId, platform, previousRank: oldRank, newRank: targetRank, reason: 'ADMIN_ADJUSTMENT', adminId };
      auditMetadata = { action, platform, oldRank, targetRank };

    } else if (action === 'SWAP_PLAYERS') {
      // Swap two specific players in their rank positions
      const rankDocA = await Ranking.findOne({ platform, players: playerId }).session(session);
      const rankDocB = await Ranking.findOne({ platform, players: swapWithPlayerId }).session(session);
      if (!rankDocA || !rankDocB) throw new Error('One or both players are not ranked.');

      const rankA = rankDocA.rank;
      const rankB = rankDocB.rank;

      rankDocA.players = rankDocA.players.filter(p => p.toString() !== playerId.toString());
      rankDocA.players.push(swapWithPlayerId);

      rankDocB.players = rankDocB.players.filter(p => p.toString() !== swapWithPlayerId.toString());
      rankDocB.players.push(playerId);

      await rankDocA.save({ session });
      if (rankDocA._id.toString() !== rankDocB._id.toString()) {
        await rankDocB.save({ session });
      }

      historyEntry = [
        { playerId, platform, previousRank: rankA, newRank: rankB, reason: 'ADMIN_ADJUSTMENT', adminId },
        { playerId: swapWithPlayerId, platform, previousRank: rankB, newRank: rankA, reason: 'ADMIN_ADJUSTMENT', adminId },
      ];
      auditMetadata = { action, platform, rankA, rankB };
    }

    // Create history
    if (Array.isArray(historyEntry)) {
      await RankingHistory.insertMany(historyEntry.map(h => ({ ...h, metadata: { reason } })), { session });
    } else if (historyEntry) {
      await RankingHistory.create([{ ...historyEntry, metadata: { reason } }], { session });
    }

    // Create audit log
    await AdminAuditLog.create([{
      adminId,
      action: 'RANKING_MANUALLY_CHANGED',
      targetEntity: 'Ranking',
      reason,
      metadata: auditMetadata,
    }], { session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Validate ranking integrity for a platform.
 * Returns { valid: true } or { valid: false, issues: [...] }
 */
const validateRankingIntegrity = async (platform) => {
  const ranks = await Ranking.find({ platform });
  const issues = [];
  const seenPlayers = new Set();

  for (const rankDoc of ranks) {
    if (rankDoc.rank < 1 || rankDoc.rank > 10) issues.push(`Invalid rank number: ${rankDoc.rank}`);
    if (rankDoc.players.length === 0) issues.push(`Rank ${rankDoc.rank} has 0 players`);
    if (rankDoc.players.length > 3) issues.push(`Rank ${rankDoc.rank} has >3 players`);
    for (const pid of rankDoc.players) {
      const key = pid.toString();
      if (seenPlayers.has(key)) issues.push(`Player ${key} appears in multiple ranks`);
      seenPlayers.add(key);
    }
  }

  return { valid: issues.length === 0, issues };
};

module.exports = {
  getLeaderboard,
  getPlayerRank,
  getPlayerRankDoc,
  getMinimumAmount,
  applyMatchResult,
  manualAdminAdjustment,
  validateRankingIntegrity,
};
