const User = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');
const Ranking = require('../models/Ranking');
const Challenge = require('../models/Challenge');
const Payment = require('../models/Payment');
const Match = require('../models/Match');
const AdminAuditLog = require('../models/AdminAuditLog');
const RankingHistory = require('../models/RankingHistory');
const rankingService = require('../services/ranking.service');
const paymentService = require('../services/payment.service');
const matchService = require('../services/match.service');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'frost_match_evidence' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};


// Dashboard summary stats
const getDashboard = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const PLATFORMS = ['MOBILE', 'IPAD', 'EMULATOR'];

    const [
      totalPlayers, rankedAgg, pendingChallenges, pendingPayments,
      activeMatches, completedMatches, disputedMatches, matchesAwaitingResult
    ] = await Promise.all([
      PlayerProfile.countDocuments(),
      Ranking.aggregate([{ $project: { count: { $size: '$players' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Challenge.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED'] } }),
      Payment.countDocuments({ status: 'PENDING' }),
      Challenge.countDocuments({ status: { $in: ['MATCH_PENDING', 'MATCH_ACTIVE'] } }),
      Match.countDocuments({ resultStatus: 'COMPLETED' }),
      Match.countDocuments({ resultStatus: 'DISPUTED' }),
      Challenge.countDocuments({ status: 'RESULT_PENDING' }),
    ]);

    const rankedCount = rankedAgg[0]?.total || 0;

    // Platform breakdown
    const platformBreakdown = await Promise.all(PLATFORMS.map(async (platform) => {
      const rankDocs = await Ranking.find({ platform });
      const rankedInPlatform = rankDocs.reduce((sum, r) => sum + r.players.length, 0);
      const activeChallenges = await Challenge.countDocuments({ platform, status: { $in: ['MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING'] } });
      const completedMatchesOnPlatform = await Match.countDocuments({ platform, resultStatus: 'COMPLETED' });
      return { platform, rankedCount: rankedInPlatform, activeChallenges, completedMatches: completedMatchesOnPlatform };
    }));

    // Action queue: items requiring admin attention
    const [resultPendingChallenges, disputedMatchDocs, failedPayments] = await Promise.all([
      Challenge.find({ status: 'RESULT_PENDING' })
        .populate('challengerId', 'ign')
        .populate('defenderId', 'ign')
        .sort({ updatedAt: 1 })
        .limit(20),
      Match.find({ resultStatus: 'DISPUTED' })
        .populate('challengerId', 'ign')
        .populate('defenderId', 'ign')
        .sort({ createdAt: 1 })
        .limit(10),
      Payment.find({ status: 'FAILED' })
        .populate('payerId', 'ign')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const actionQueue = [
      ...resultPendingChallenges.map(c => ({
        type: 'RESULT_PENDING',
        urgency: 'HIGH',
        label: `${c.challengerId?.ign || 'Unknown'} vs ${c.defenderId?.ign || 'Unknown'}`,
        detail: `Rs. ${c.challengeAmount} — result required`,
        linkType: 'challenge',
        linkId: c._id,
        timestamp: c.updatedAt,
      })),
      ...disputedMatchDocs.map(m => ({
        type: 'DISPUTED',
        urgency: 'HIGH',
        label: `${m.challengerId?.ign || 'Unknown'} vs ${m.defenderId?.ign || 'Unknown'}`,
        detail: 'Match dispute — needs resolution',
        linkType: 'match',
        linkId: m._id,
        timestamp: m.createdAt,
      })),
      ...failedPayments.map(p => ({
        type: 'PAYMENT_FAILED',
        urgency: 'MEDIUM',
        label: `${p.payerId?.ign || 'Unknown'}`,
        detail: `Payment of Rs. ${p.amount} failed`,
        linkType: 'payment',
        linkId: p._id,
        timestamp: p.createdAt,
      })),
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Recent activity from audit log
    const recentActivity = await AdminAuditLog.find()
      .populate('adminId', 'username')
      .sort({ createdAt: -1 })
      .limit(15);

    // Leaderboard preview
    const leaderboardPreview = {};
    for (const platform of PLATFORMS) {
      const ranks = await Ranking.find({ platform, rank: { $gte: 1, $lte: 10 } })
        .populate('players', 'ign _id')
        .sort({ rank: 1 });
      leaderboardPreview[platform] = ranks.map(r => ({
        rank: r.rank,
        players: r.players.map(p => ({ _id: p._id, ign: p.ign })),
      }));
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalPlayers,
          rankedPlayers: rankedCount,
          unrankedPlayers: totalPlayers - rankedCount,
          pendingChallenges,
          pendingPayments,
          activeMatches,
          matchesAwaitingResult,
          completedMatches,
          disputedMatches,
        },
        platformBreakdown,
        actionQueue,
        recentActivity,
        leaderboardPreview,
      },
    });
  } catch (err) {
    next(err);
  }
};


// Players management
const getAdminPlayers = async (req, res, next) => {
  try {
    const { search, platform, status } = req.query;
    const query = {};
    if (platform) query.platform = platform;
    if (status) query.status = status;

    let players = await PlayerProfile.find(query).populate('userId', 'username email role status');

    if (search) {
      const s = search.toLowerCase();
      players = players.filter(p =>
        p.ign.toLowerCase().includes(s) || p.pubgUid.toLowerCase().includes(s)
      );
    }

    const allRankings = await Ranking.find();
    const enriched = players.map(p => {
      let rank = null;
      for (const r of allRankings) {
        if (r.players.map(pid => pid.toString()).includes(p._id.toString())) {
          rank = r.rank;
          break;
        }
      }
      return { ...p.toObject(), currentRank: rank };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

const updateAdminPlayer = async (req, res, next) => {
  try {
    const allowed = ['ign', 'pubgUid', 'platform', 'avatar', 'bio', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const profile = await PlayerProfile.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'PLAYER_UPDATED',
      targetEntity: 'PlayerProfile',
      targetId: profile._id,
      metadata: updates,
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const suspendPlayer = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findByIdAndUpdate(req.params.id, { status: 'SUSPENDED' }, { new: true });
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });
    await User.findByIdAndUpdate(profile.userId, { status: 'SUSPENDED' });

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'PLAYER_SUSPENDED',
      targetEntity: 'PlayerProfile',
      targetId: profile._id,
      reason: req.body.reason || '',
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const restorePlayer = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findByIdAndUpdate(req.params.id, { status: 'ACTIVE' }, { new: true });
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });
    await User.findByIdAndUpdate(profile.userId, { status: 'ACTIVE' });

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'PLAYER_RESTORED',
      targetEntity: 'PlayerProfile',
      targetId: profile._id,
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Rankings
const getAdminRankings = async (req, res, next) => {
  try {
    const { platform } = req.query;
    const query = platform ? { platform } : {};
    const rankings = await Ranking.find(query).sort({ platform: 1, rank: 1 })
      .populate('players', 'ign pubgUid platform avatar');
    res.json({ success: true, data: rankings });
  } catch (err) {
    next(err);
  }
};

const manualRankingUpdate = async (req, res, next) => {
  try {
    const { platform, action, playerId, targetRank, swapWithPlayerId, reason } = req.body;
    if (!platform || !action || !reason) {
      return res.status(400).json({ success: false, message: 'platform, action, and reason are required.' });
    }
    await rankingService.manualAdminAdjustment({
      platform, action, playerId, targetRank, swapWithPlayerId, reason, adminId: req.user._id,
    });
    res.json({ success: true, message: 'Ranking updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// Challenges
const getAdminChallenges = async (req, res, next) => {
  try {
    const { status, platform } = req.query;
    const query = {};
    if (status) query.status = status;
    if (platform) query.platform = platform;
    const challenges = await Challenge.find(query)
      .populate('challengerId', 'ign pubgUid platform avatar')
      .populate('defenderId', 'ign pubgUid platform avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: challenges });
  } catch (err) {
    next(err);
  }
};

const updateChallengeStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const ADMIN_ALLOWED = ['DISPUTED', 'CANCELLED'];
    if (!ADMIN_ALLOWED.includes(status)) {
      return res.status(400).json({ success: false, message: 'Admin can only set DISPUTED or CANCELLED status.' });
    }
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'CHALLENGE_STATUS_UPDATED',
      targetEntity: 'Challenge',
      targetId: challenge._id,
      reason: reason || '',
      metadata: { newStatus: status },
    });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

// Payments
const getAdminPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const payments = await Payment.find(query)
      .populate({ path: 'challengeId', populate: [{ path: 'challengerId', select: 'ign' }, { path: 'defenderId', select: 'ign' }] })
      .populate('payerId', 'ign')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

const confirmPaymentManual = async (req, res, next) => {
  try {
    const payment = await paymentService.adminConfirmPayment(req.params.id, req.user);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// Matches
const getAdminMatches = async (req, res, next) => {
  try {
    const { status, platform } = req.query;
    const query = {};
    if (status) query.resultStatus = status;
    if (platform) query.platform = platform;
    const matches = await Match.find(query)
      .populate('challengerId', 'ign pubgUid platform avatar')
      .populate('defenderId', 'ign pubgUid platform avatar')
      .populate('winnerId', 'ign')
      .populate('loserId', 'ign')
      .populate('verifiedBy', 'username')
      .sort({ createdAt: -1 });

    // Enrich with challenge and payment data
    const enriched = await Promise.all(matches.map(async m => {
      const challenge = await Challenge.findById(m.challengeId);
      const payment = await Payment.findOne({ challengeId: m.challengeId, status: 'CONFIRMED' });
      return { ...m.toObject(), challenge, paymentConfirmed: !!payment };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

const getAdminMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('challengerId', 'ign pubgUid platform avatar')
      .populate('defenderId', 'ign pubgUid platform avatar')
      .populate('winnerId', 'ign')
      .populate('verifiedBy', 'username');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });

    const challenge = await Challenge.findById(match.challengeId);
    const payment = await Payment.findOne({ challengeId: match.challengeId });

    res.json({ success: true, data: { match, challenge, payment } });
  } catch (err) {
    next(err);
  }
};

const addMatchEvidence = async (req, res, next) => {
  try {
    const { type, notes } = req.body;
    let url = req.body.url || '';

    if (req.file) {
      url = await uploadToCloudinary(req.file.buffer);
    }

    const match = await matchService.addEvidence({
      matchId: req.params.id,
      evidence: { type: type || 'IMAGE', url, notes: notes || '' },
      adminUser: req.user,
    });
    res.json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
};

const updateMatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await matchService.updateMatchStatus({
      matchId: req.params.id,
      status,
      adminUser: req.user,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const confirmMatchResult = async (req, res, next) => {
  try {
    const { result } = req.body;
    const outcome = await matchService.confirmResult({
      matchId: req.params.id,
      result,
      adminUser: req.user,
    });
    if (outcome.requiresAdminResolution) {
      return res.status(409).json({ success: false, requiresAdminResolution: true, message: outcome.message, data: outcome });
    }
    res.json({ success: true, data: outcome });
  } catch (err) {
    next(err);
  }
};

// Audit logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, adminId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (adminId) query.adminId = adminId;
    const logs = await AdminAuditLog.find(query)
      .populate('adminId', 'username email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

const getRankingHistory = async (req, res, next) => {
  try {
    const { playerId, platform } = req.query;
    const query = {};
    if (playerId) query.playerId = playerId;
    if (platform) query.platform = platform;
    const history = await RankingHistory.find(query)
      .populate('playerId', 'ign')
      .populate('adminId', 'username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

// Global Admin Search
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, data: { players: [], challenges: [], matches: [], payments: [] } });
    }

    const mongoose = require('mongoose');
    const queryRegex = new RegExp(q, 'i');
    
    // 1. Players Search
    const players = await PlayerProfile.find({
      $or: [
        { ign: queryRegex },
        { pubgUid: queryRegex },
        { bio: queryRegex }
      ]
    }).limit(10);

    // 2. Challenges Search
    let challenges = [];
    if (mongoose.Types.ObjectId.isValid(q)) {
      challenges = await Challenge.find({ _id: q })
        .populate('challengerId', 'ign')
        .populate('defenderId', 'ign');
    } else {
      const searchPlayers = await PlayerProfile.find({ ign: queryRegex });
      const playerIds = searchPlayers.map(p => p._id);
      challenges = await Challenge.find({
        $or: [
          { challengerId: { $in: playerIds } },
          { defenderId: { $in: playerIds } }
        ]
      })
        .populate('challengerId', 'ign')
        .populate('defenderId', 'ign')
        .limit(10);
    }

    // 3. Matches Search
    let matches = [];
    if (mongoose.Types.ObjectId.isValid(q)) {
      matches = await Match.find({ $or: [{ _id: q }, { challengeId: q }] })
        .populate('challengerId', 'ign')
        .populate('defenderId', 'ign');
    } else {
      const searchPlayers = await PlayerProfile.find({ ign: queryRegex });
      const playerIds = searchPlayers.map(p => p._id);
      matches = await Match.find({
        $or: [
          { challengerId: { $in: playerIds } },
          { defenderId: { $in: playerIds } }
        ]
      })
        .populate('challengerId', 'ign')
        .populate('defenderId', 'ign')
        .limit(10);
    }

    // 4. Payments Search
    let payments = [];
    if (mongoose.Types.ObjectId.isValid(q)) {
      payments = await Payment.find({ $or: [{ _id: q }, { challengeId: q }] })
        .populate('payerId', 'ign');
    } else {
      payments = await Payment.find({
        $or: [
          { payhereOrderId: queryRegex },
          { payhereTransactionId: queryRegex }
        ]
      })
        .populate('payerId', 'ign')
        .limit(10);
    }

    res.json({
      success: true,
      data: { players, challenges, matches, payments }
    });
  } catch (err) {
    next(err);
  }
};

// Player Details aggregated
const getAdminPlayerById = async (req, res, next) => {
  try {
    const statsService = require('../services/stats.service');
    const profile = await PlayerProfile.findById(req.params.id)
      .populate('userId', 'username email role status')
      .populate('adminNotes.adminId', 'username');
      
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });

    const rankDoc = await Ranking.findOne({ platform: profile.platform, players: profile._id });
    const currentRank = rankDoc ? rankDoc.rank : null;

    const stats = await statsService.getPlayerStats(profile._id);
    const challengesCreated = await Challenge.find({ challengerId: profile._id })
      .populate('defenderId', 'ign')
      .sort({ createdAt: -1 });
    const challengesReceived = await Challenge.find({ defenderId: profile._id })
      .populate('challengerId', 'ign')
      .sort({ createdAt: -1 });

    const matches = await Match.find({
      $or: [{ challengerId: profile._id }, { defenderId: profile._id }]
    })
      .populate('challengerId', 'ign')
      .populate('defenderId', 'ign')
      .populate('winnerId', 'ign')
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ payerId: profile._id })
      .populate('challengeId')
      .sort({ createdAt: -1 });

    const rankHistory = await RankingHistory.find({ playerId: profile._id })
      .populate('adminId', 'username')
      .sort({ createdAt: -1 });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const declinesLast7Days = await Challenge.countDocuments({
      defenderId: profile._id,
      status: { $in: ['REJECTED', 'EXPIRED'] },
      $or: [
        { rejectedAt: { $gte: sevenDaysAgo } },
        { status: 'EXPIRED', updatedAt: { $gte: sevenDaysAgo } }
      ]
    });

    res.json({
      success: true,
      data: {
        profile,
        currentRank,
        stats,
        challengesCreated,
        challengesReceived,
        matches,
        payments,
        rankHistory,
        declinesLast7Days
      }
    });
  } catch (err) {
    next(err);
  }
};

// Private Admin Notes
const addPlayerNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Note content is required.' });

    const profile = await PlayerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });

    profile.adminNotes.push({
      adminId: req.user._id,
      content,
      createdAt: new Date()
    });

    await profile.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'PLAYER_NOTE_ADDED',
      targetEntity: 'PlayerProfile',
      targetId: profile._id,
      metadata: { note: content }
    });

    res.json({ success: true, data: profile.adminNotes });
  } catch (err) {
    next(err);
  }
};

const deletePlayerNote = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });

    profile.adminNotes = profile.adminNotes.filter(n => n._id.toString() !== req.params.noteId);
    await profile.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'PLAYER_NOTE_DELETED',
      targetEntity: 'PlayerProfile',
      targetId: profile._id,
      metadata: { noteId: req.params.noteId }
    });

    res.json({ success: true, data: profile.adminNotes });
  } catch (err) {
    next(err);
  }
};

// Challenge details timeline helper
const getAdminChallengeById = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('challengerId', 'ign pubgUid platform avatar')
      .populate('defenderId', 'ign pubgUid platform avatar');
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });

    const payment = await Payment.findOne({ challengeId: challenge._id });
    const match = await Match.findOne({ challengeId: challenge._id })
      .populate('winnerId', 'ign')
      .populate('loserId', 'ign')
      .populate('verifiedBy', 'username');

    res.json({
      success: true,
      data: { challenge, payment, match }
    });
  } catch (err) {
    next(err);
  }
};

// Transactional Match result correction workflow
const correctMatchResult = async (req, res, next) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { result, reason } = req.body;
    if (!['CHALLENGER_WON', 'CHALLENGER_LOST'].includes(result)) {
      return res.status(400).json({ success: false, message: 'Invalid result value.' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for result correction is required.' });
    }

    const match = await Match.findById(req.params.id)
      .populate('challengerId')
      .populate('defenderId');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });

    const originalResult = match.result;
    if (originalResult === result) {
      return res.status(400).json({ success: false, message: 'New result cannot be the same as original result.' });
    }

    // 1. REVERSE RANKINGS USING MATCH RANKING HISTORY
    const history = await RankingHistory.find({ matchId: match._id }).session(session);
    
    // First remove them from their newRank
    for (const h of history) {
      if (h.newRank) {
        const rDoc = await Ranking.findOne({ platform: h.platform, rank: h.newRank }).session(session);
        if (rDoc) {
          rDoc.players = rDoc.players.filter(pid => pid.toString() !== h.playerId.toString());
          if (rDoc.players.length === 0) {
            await Ranking.deleteOne({ _id: rDoc._id }).session(session);
          } else {
            await rDoc.save({ session });
          }
        }
      }
    }
    
    // Next insert them back into their previousRank
    for (const h of history) {
      if (h.previousRank) {
        let rDoc = await Ranking.findOne({ platform: h.platform, rank: h.previousRank }).session(session);
        if (!rDoc) {
          rDoc = new Ranking({ platform: h.platform, rank: h.previousRank, players: [h.playerId] });
        } else {
          if (!rDoc.players.map(p => p.toString()).includes(h.playerId.toString())) {
            rDoc.players.push(h.playerId);
          }
        }
        await rDoc.save({ session });
      }
    }

    // Delete old history entries
    await RankingHistory.deleteMany({ matchId: match._id }).session(session);

    // 2. APPLY THE NEW CORRECTED RESULT
    const newWinnerId = result === 'CHALLENGER_WON' ? match.challengerId._id : match.defenderId._id;
    const newLoserId = result === 'CHALLENGER_WON' ? match.defenderId._id : match.challengerId._id;

    const rankingHistoryEntries = await rankingService.applyMatchResult(
      {
        ...match.toObject(),
        challengerId: match.challengerId._id,
        defenderId: match.defenderId._id,
        platform: match.platform,
      },
      result,
      req.user._id,
      session
    );

    // Update Match Doc
    match.winnerId = newWinnerId;
    match.loserId = newLoserId;
    match.result = result;
    match.adminNotes = `${match.adminNotes || ''}\n[CORRECTED by admin: ${req.user.username} on ${new Date().toISOString()}. Reason: ${reason}]`;
    await match.save({ session });

    // Save new ranking history
    if (rankingHistoryEntries.length > 0) {
      await RankingHistory.insertMany(rankingHistoryEntries, { session });
    }

    // Log admin action
    await AdminAuditLog.create([{
      adminId: req.user._id,
      action: 'MATCH_RESULT_CORRECTED',
      targetEntity: 'Match',
      targetId: match._id,
      reason,
      metadata: { originalResult, correctedResult: result }
    }], { session });

    await session.commitTransaction();
    res.json({ success: true, message: 'Match result corrected successfully.' });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getDashboard, getAdminPlayers, updateAdminPlayer, suspendPlayer, restorePlayer,
  getAdminRankings, manualRankingUpdate,
  getAdminChallenges, updateChallengeStatus,
  getAdminPayments, confirmPaymentManual,
  getAdminMatches, getAdminMatchById, addMatchEvidence, updateMatchStatus, confirmMatchResult,
  getAuditLogs, getRankingHistory,
  globalSearch, getAdminPlayerById, addPlayerNote, deletePlayerNote, getAdminChallengeById, correctMatchResult,
};
