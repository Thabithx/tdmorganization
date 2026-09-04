const Challenge = require('../models/Challenge');
const PlayerProfile = require('../models/PlayerProfile');
const challengeService = require('../services/challenge.service');

const createChallenge = async (req, res, next) => {
  try {
    const { defenderId, amount } = req.body;
    if (!defenderId || !amount) {
      return res.status(400).json({ success: false, message: 'defenderId and amount are required.' });
    }
    const challenge = await challengeService.createChallenge({
      challengerUserId: req.user._id,
      defenderId,
      amount: parseFloat(amount),
    });
    res.status(201).json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

const getChallenges = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const { status, role } = req.query;
    const query = {};

    if (role === 'incoming') query.defenderId = profile._id;
    else if (role === 'outgoing') query.challengerId = profile._id;
    else query.$or = [{ challengerId: profile._id }, { defenderId: profile._id }];

    if (status) query.status = status;

    const challenges = await Challenge.find(query)
      .populate('challengerId', 'ign pubgUid platform avatar')
      .populate('defenderId', 'ign pubgUid platform avatar')
      .sort({ createdAt: -1 });

    // Lazy expiration check for all returned challenges
    for (let i = 0; i < challenges.length; i++) {
      challenges[i] = await challengeService.checkAndLazyExpire(challenges[i]);
    }

    let declineCount = 0;
    let isRankedTop10 = false;
    if (profile) {
      const Ranking = require('../models/Ranking');
      const defenderRankDoc = await Ranking.findOne({ platform: profile.platform, players: profile._id });
      if (defenderRankDoc && defenderRankDoc.rank <= 10) {
        isRankedTop10 = true;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        declineCount = await Challenge.countDocuments({
          defenderId: profile._id,
          status: { $in: ['REJECTED', 'EXPIRED'] },
          $or: [
            { rejectedAt: { $gte: sevenDaysAgo } },
            { expiredAt: { $gte: sevenDaysAgo } },
            { status: 'EXPIRED', updatedAt: { $gte: sevenDaysAgo } }
          ]
        });
      }
    }

    res.json({ success: true, data: challenges, meta: { declineCount, isRankedTop10 } });
  } catch (err) {
    next(err);
  }
};

const getChallengeById = async (req, res, next) => {
  try {
    let challenge = await Challenge.findById(req.params.id)
      .populate('challengerId', 'ign pubgUid platform avatar')
      .populate('defenderId', 'ign pubgUid platform avatar');
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
    challenge = await challengeService.checkAndLazyExpire(challenge);

    let isOldestPending = false;
    if (challenge.status === 'PENDING') {
      const oldest = await Challenge.findOne({
        defenderId: challenge.defenderId._id,
        status: 'PENDING'
      }).sort({ createdAt: 1 });
      if (oldest && oldest._id.toString() === challenge._id.toString()) {
        isOldestPending = true;
      }
    }

    res.json({ success: true, data: challenge, meta: { isOldestPending } });
  } catch (err) {
    next(err);
  }
};

const acceptChallenge = async (req, res, next) => {
  try {
    const challenge = await challengeService.acceptChallenge({
      challengeId: req.params.id,
      defenderUserId: req.user._id,
    });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

const rejectChallenge = async (req, res, next) => {
  try {
    const challenge = await challengeService.rejectChallenge({
      challengeId: req.params.id,
      defenderUserId: req.user._id,
    });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

const cancelChallenge = async (req, res, next) => {
  try {
    const challenge = await challengeService.cancelChallenge({
      challengeId: req.params.id,
      challengerUserId: req.user._id,
    });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

const requestAdminReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const challenge = await challengeService.requestAdminReview({
      challengeId: req.params.id,
      defenderUserId: req.user._id,
      reason
    });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

module.exports = { createChallenge, getChallenges, getChallengeById, acceptChallenge, rejectChallenge, cancelChallenge, requestAdminReview };
