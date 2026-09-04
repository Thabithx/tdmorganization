const Match = require('../models/Match');
const PlayerProfile = require('../models/PlayerProfile');

/**
 * Get full stats for a player, derived from Match records.
 */
const getPlayerStats = async (playerId) => {
  const pid = playerId.toString();

  const completedMatches = await Match.find({
    $or: [{ challengerId: playerId }, { defenderId: playerId }],
    resultStatus: 'COMPLETED',
  }).populate('challengerId', 'ign pubgUid platform avatar').populate('defenderId', 'ign pubgUid platform avatar');

  const total = completedMatches.length;
  const wins = completedMatches.filter(m => m.winnerId && m.winnerId.toString() === pid).length;
  const losses = completedMatches.filter(m => m.loserId && m.loserId.toString() === pid).length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

  // Players defeated: group losses
  const defeatedMap = {};
  for (const match of completedMatches) {
    if (match.winnerId && match.winnerId.toString() === pid) {
      const opponent = match.challengerId._id.toString() === pid ? match.defenderId : match.challengerId;
      if (!opponent) continue;
      const key = opponent._id.toString();
      if (!defeatedMap[key]) {
        defeatedMap[key] = { profile: opponent, count: 0, lastRank: null };
      }
      defeatedMap[key].count += 1;
      // Track rank at time of match
      const opponentIsDefender = match.defenderId._id.toString() === opponent._id.toString();
      const rankAtTime = opponentIsDefender ? match.defenderRankAtMatch : match.challengerRankAtMatch;
      if (rankAtTime !== null && rankAtTime !== undefined) {
        defeatedMap[key].lastRank = rankAtTime;
      }
    }
  }

  const playersDefeated = Object.values(defeatedMap).sort((a, b) => b.count - a.count);

  // Notable victories: wins where opponent was ranked
  const notableVictories = [];
  for (const match of completedMatches) {
    if (match.winnerId && match.winnerId.toString() === pid) {
      const opponent = match.challengerId._id.toString() === pid ? match.defenderId : match.challengerId;
      const opponentIsDefender = match.defenderId._id.toString() === opponent._id.toString();
      const opponentRank = opponentIsDefender ? match.defenderRankAtMatch : match.challengerRankAtMatch;
      if (opponentRank !== null && opponentRank !== undefined) {
        notableVictories.push({
          opponent,
          rank: opponentRank,
          matchId: match._id,
          date: match.matchCompletedAt,
          amount: match.challengeAmount,
        });
      }
    }
  }
  notableVictories.sort((a, b) => a.rank - b.rank);

  // Recent matches (last 10)
  const recentMatches = completedMatches
    .sort((a, b) => new Date(b.matchCompletedAt) - new Date(a.matchCompletedAt))
    .slice(0, 10)
    .map(m => {
      const isChallenger = m.challengerId._id.toString() === pid;
      const opponent = isChallenger ? m.defenderId : m.challengerId;
      const won = m.winnerId && m.winnerId.toString() === pid;
      const playerRankAtMatch = isChallenger ? m.challengerRankAtMatch : m.defenderRankAtMatch;
      const opponentRankAtMatch = isChallenger ? m.defenderRankAtMatch : m.challengerRankAtMatch;
      return {
        matchId: m._id,
        opponent,
        result: won ? 'WIN' : 'LOSS',
        amount: m.challengeAmount,
        playerRankAtMatch,
        opponentRankAtMatch,
        date: m.matchCompletedAt,
        platform: m.platform,
      };
    });

  // Head-to-head with all opponents
  const h2hMap = {};
  for (const match of completedMatches) {
    const opponent = match.challengerId._id.toString() === pid ? match.defenderId : match.challengerId;
    if (!opponent) continue;
    const key = opponent._id.toString();
    if (!h2hMap[key]) h2hMap[key] = { profile: opponent, wins: 0, losses: 0 };
    if (match.winnerId && match.winnerId.toString() === pid) {
      h2hMap[key].wins += 1;
    } else {
      h2hMap[key].losses += 1;
    }
  }

  return {
    total,
    wins,
    losses,
    winRate: parseFloat(winRate),
    playersDefeated,
    notableVictories: notableVictories.slice(0, 10),
    recentMatches,
    headToHead: Object.values(h2hMap),
  };
};

/**
 * Get all completed matches for a player (for match history page).
 */
const getPlayerMatchHistory = async (playerId, filter = 'ALL') => {
  const query = {
    $or: [{ challengerId: playerId }, { defenderId: playerId }],
    resultStatus: 'COMPLETED',
  };

  const matches = await Match.find(query)
    .populate('challengerId', 'ign pubgUid platform avatar')
    .populate('defenderId', 'ign pubgUid platform avatar')
    .sort({ matchCompletedAt: -1 });

  const pid = playerId.toString();

  const enriched = matches.map(m => {
    const isChallenger = m.challengerId._id.toString() === pid;
    const opponent = isChallenger ? m.defenderId : m.challengerId;
    const won = m.winnerId && m.winnerId.toString() === pid;
    return { ...m.toObject(), opponent, result: won ? 'WIN' : 'LOSS', isChallenger };
  });

  if (filter === 'WINS') return enriched.filter(m => m.result === 'WIN');
  if (filter === 'LOSSES') return enriched.filter(m => m.result === 'LOSS');
  return enriched;
};

const getDefenderReliability = async (playerId) => {
  const Challenge = require('../models/Challenge');
  
  const receivedChallenges = await Challenge.find({
    defenderId: playerId,
    cancellationReason: { $nin: ['PLAYER_CANCELLED', 'SYSTEM_CANCELLED', 'ADMIN_REVIEW_APPROVED'] }
  });

  const totalValid = receivedChallenges.length;
  if (totalValid === 0) return { score: 100, label: 'No Data' };

  let reliableCount = 0;
  for (const c of receivedChallenges) {
    if (['ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED', 'DISPUTED'].includes(c.status)) {
      reliableCount++;
    } else if (c.status === 'CANCELLED' && c.cancellationReason === 'PAYMENT_TIMEOUT') {
      reliableCount++; // Defender accepted, challenger failed to pay. Defender is reliable.
    } else if (c.status === 'CANCELLED' && c.cancellationReason === 'DEFENDER_CONFLICT_CANCELLED') {
       // Ignore these entirely as they aren't failures of reliability (system cancelled them). Wait, these should not be in the denominator either!
       // Let's filter them out completely.
    }
  }

  // Refine totalValid: remove DEFENDER_CONFLICT_CANCELLED
  const actualChallenges = receivedChallenges.filter(c => c.cancellationReason !== 'DEFENDER_CONFLICT_CANCELLED');
  const actualTotal = actualChallenges.length;
  
  if (actualTotal === 0) return { score: 100, label: 'No Data' };

  reliableCount = 0;
  for (const c of actualChallenges) {
    if (['ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED', 'DISPUTED'].includes(c.status)) {
      reliableCount++;
    } else if (c.status === 'CANCELLED' && c.cancellationReason === 'PAYMENT_TIMEOUT') {
      reliableCount++; 
    }
  }

  const score = Math.round((reliableCount / actualTotal) * 100);
  
  let label = '';
  if (score >= 90) label = 'Highly Reliable';
  else if (score >= 70) label = 'Reliable';
  else if (score >= 50) label = 'Inconsistent';
  else label = 'Unreliable';

  return { score, label, total: actualTotal, reliableCount };
};

module.exports = { getPlayerStats, getPlayerMatchHistory, getDefenderReliability };
