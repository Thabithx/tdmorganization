const Match = require('../models/Match');
const PlayerProfile = require('../models/PlayerProfile');
const statsService = require('../services/stats.service');

const getMatches = async (req, res, next) => {
  try {
    const { platform, status } = req.query;
    const query = {};
    if (platform) query.platform = platform;
    if (status) query.resultStatus = status;

    const matches = await Match.find(query)
      .populate('challengerId', 'ign pubgUid platform avatar avatarPosition')
      .populate('defenderId', 'ign pubgUid platform avatar avatarPosition')
      .populate('winnerId', 'ign')
      .populate('loserId', 'ign')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};

const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('challengerId', 'ign pubgUid platform avatar avatarPosition')
      .populate('defenderId', 'ign pubgUid platform avatar avatarPosition')
      .populate('winnerId', 'ign')
      .populate('loserId', 'ign')
      .populate('verifiedBy', 'username');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    res.json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
};

const getMyMatchHistory = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    const { filter } = req.query;
    const history = await statsService.getPlayerMatchHistory(profile._id, filter);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMatches, getMatchById, getMyMatchHistory };
