const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendResetEmail = async (toEmail, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"FROST TDM" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'FROST — Reset Your Password',
    html: `
      <div style="background:#05070D;color:#F4FBFF;font-family:sans-serif;padding:40px;border-radius:12px;max-width:480px;margin:auto">
        <h2 style="color:#8BE3FF;letter-spacing:2px;font-size:20px;margin-bottom:8px">FROST TDM</h2>
        <p style="color:#8BA8B8;font-size:13px;margin-bottom:24px;text-transform:uppercase;letter-spacing:1px">Password Reset Request</p>
        <p style="font-size:14px;color:#C8DDE8;line-height:1.6">You requested to reset your password. Click the button below within <strong style="color:#8BE3FF">1 hour</strong> before this link expires.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;background:#8BE3FF;color:#05070D;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;letter-spacing:1px;text-transform:uppercase">Reset Password</a>
        <p style="font-size:12px;color:#4A5D6E;margin-top:24px">If you didn't request this, ignore this email. Your password will not change.</p>
        <hr style="border:none;border-top:1px solid #1A2B35;margin:24px 0"/>
        <p style="font-size:11px;color:#2A3D4E">This link expires in 1 hour and can only be used once.</p>
      </div>
    `,
  });
};

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

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success — don't reveal whether email exists
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (emailErr) {
      // Rollback token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Hash the incoming raw token to compare against stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    user.passwordHash = password; // pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
