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
    const [
      totalPlayers, rankedPlayers, pendingChallenges, pendingPayments,
      activeMatches, completedMatches, disputedMatches
    ] = await Promise.all([
      PlayerProfile.countDocuments({ status: 'ACTIVE' }),
      Ranking.aggregate([{ $project: { count: { $size: '$players' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Challenge.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED'] } }),
      Payment.countDocuments({ status: 'PENDING' }),
      Challenge.countDocuments({ status: { $in: ['MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING'] } }),
      Match.countDocuments({ resultStatus: 'COMPLETED' }),
      Match.countDocuments({ resultStatus: 'DISPUTED' }),
    ]);

    const recentMatches = await Match.find({ resultStatus: 'COMPLETED' })
      .populate('challengerId', 'ign')
      .populate('defenderId', 'ign')
      .populate('winnerId', 'ign')
      .sort({ matchCompletedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalPlayers,
        rankedPlayers: rankedPlayers[0]?.total || 0,
        unrankedPlayers: totalPlayers - (rankedPlayers[0]?.total || 0),
        pendingChallenges,
        pendingPayments,
        activeMatches,
        completedMatches,
        disputedMatches,
        recentMatches,
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

module.exports = {
  getDashboard, getAdminPlayers, updateAdminPlayer, suspendPlayer, restorePlayer,
  getAdminRankings, manualRankingUpdate,
  getAdminChallenges, updateChallengeStatus,
  getAdminPayments, confirmPaymentManual,
  getAdminMatches, getAdminMatchById, addMatchEvidence, updateMatchStatus, confirmMatchResult,
  getAuditLogs, getRankingHistory,
};
