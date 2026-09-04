const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res, next) => {
  try {
    const { username, email, password, ign, pubgUid, platform, whatsapp } = req.body;

    if (!username || !email || !password || !ign || !pubgUid || !platform || !whatsapp) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!['MOBILE', 'IPAD', 'EMULATOR'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await User.create({ username, email, passwordHash: password, role: 'PLAYER' });
    const profile = await PlayerProfile.create({ userId: user._id, ign, pubgUid, platform, whatsapp });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, data: { token, user, profile } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const profile = await PlayerProfile.findOne({ userId: user._id });
    
    let declineCount = 0;
    if (profile) {
      const Challenge = require('../models/Challenge');
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

    const token = generateToken(user._id);
    res.json({ success: true, data: { token, user, profile, declineCount } });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user._id });
    let declineCount = 0;
    if (profile) {
      const Challenge = require('../models/Challenge');
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
    res.json({ success: true, data: { user: req.user, profile, declineCount } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
