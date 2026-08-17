const PlayerProfile = require('../models/PlayerProfile');
const Ranking = require('../models/Ranking');
const statsService = require('../services/stats.service');
const RankingHistory = require('../models/RankingHistory');
const cloudinary = require('../config/cloudinary');

const DEFAULT_AVATAR = 'https://res.cloudinary.com/ag9gfghc/image/upload/v1/frost_defaults/default_avatar';

const uploadToCloudinary = (fileBuffer, folder = 'frost_avatars') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

const getPlayers = async (req, res, next) => {
  try {
    const { platform, status, search, rankFilter } = req.query;
    const query = { status: 'ACTIVE' };

    if (platform && platform !== 'ALL') query.platform = platform;

    let players = await PlayerProfile.find(query).populate('userId', 'username email role');

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      players = players.filter(p =>
        p.ign.toLowerCase().includes(s) || p.pubgUid.toLowerCase().includes(s)
      );
    }

    // Enrich with rank info
    const allRankings = await Ranking.find(
      platform && platform !== 'ALL' ? { platform } : {}
    );

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

    // Rank filter
    let filtered = enriched;
    if (rankFilter === 'RANKED') filtered = enriched.filter(p => p.currentRank !== null);
    else if (rankFilter === 'UNRANKED') filtered = enriched.filter(p => p.currentRank === null);

    res.json({ success: true, data: filtered });
  } catch (err) {
    next(err);
  }
};

const getPlayerById = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findById(req.params.id).populate('userId', 'username email');
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });

    const rankDoc = await Ranking.findOne({ platform: profile.platform, players: profile._id });
    const currentRank = rankDoc ? rankDoc.rank : null;

    const stats = await statsService.getPlayerStats(profile._id);
    const rankHistory = await RankingHistory.find({ playerId: profile._id })
      .sort({ createdAt: -1 }).limit(20);

    res.json({ success: true, data: { profile, currentRank, stats, rankHistory } });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    // Allow updating safe fields including pubgUid
    const allowed = ['avatar', 'bio', 'pubgUid'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== '') updates[key] = req.body[key];
    }

    // Handle avatar file upload if present
    if (req.file) {
      updates.avatar = await uploadToCloudinary(req.file.buffer);
    }

    Object.assign(profile, updates);
    await profile.save();

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const getPlayerMatchHistory = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Player not found.' });

    const { filter } = req.query;
    const history = await statsService.getPlayerMatchHistory(profile._id, filter);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlayers, getPlayerById, updateProfile, getPlayerMatchHistory };
