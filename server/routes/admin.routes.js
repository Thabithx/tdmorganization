const express = require('express');
const {
  getDashboard, getAdminPlayers, updateAdminPlayer, suspendPlayer, restorePlayer,
  getAdminRankings, manualRankingUpdate,
  getAdminChallenges, updateChallengeStatus,
  getAdminPayments, confirmPaymentManual,
  getAdminMatches, getAdminMatchById, addMatchEvidence, updateMatchStatus, confirmMatchResult,
  getAuditLogs, getRankingHistory,
  globalSearch, getAdminPlayerById, addPlayerNote, deletePlayerNote, getAdminChallengeById, correctMatchResult
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboard);
router.get('/search', globalSearch);

router.get('/players', getAdminPlayers);
router.get('/players/:id', getAdminPlayerById);
router.put('/players/:id', updateAdminPlayer);
router.post('/players/:id/suspend', suspendPlayer);
router.post('/players/:id/restore', restorePlayer);
router.post('/players/:id/notes', addPlayerNote);
router.delete('/players/:id/notes/:noteId', deletePlayerNote);

router.get('/rankings', getAdminRankings);
router.post('/rankings/manual-update', manualRankingUpdate);

router.get('/challenges', getAdminChallenges);
router.get('/challenges/:id', getAdminChallengeById);
router.put('/challenges/:id/status', updateChallengeStatus);
router.post('/challenges/:id/resolve-review', require('../controllers/admin.controller').resolveAdminReview);

router.get('/payments', getAdminPayments);
router.post('/payments/:id/confirm', confirmPaymentManual);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/matches', getAdminMatches);
router.get('/matches/:id', getAdminMatchById);
router.post('/matches/:id/evidence', upload.single('evidence'), addMatchEvidence);
router.put('/matches/:id/status', updateMatchStatus);
router.post('/matches/:id/result', confirmMatchResult);
router.post('/matches/:id/correct', correctMatchResult);

router.get('/audit-logs', getAuditLogs);
router.get('/ranking-history', getRankingHistory);

// Notifications
router.get('/notifications', async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

router.post('/notifications/send', async (req, res, next) => {
  try {
    const { userId, type, message, relatedEntity, relatedId } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'userId and message are required.' });
    }
    const Notification = require('../models/Notification');
    const AdminAuditLog = require('../models/AdminAuditLog');
    const notification = await Notification.create({ userId, type: type || 'ADMIN_MESSAGE', message, relatedEntity, relatedId });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'NOTIFICATION_SENT',
      targetEntity: 'User',
      targetId: userId,
      metadata: { type, message }
    });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
});

// Email all players requesting WhatsApp number
router.post('/email-whatsapp-request', async (req, res, next) => {
  try {
    const nodemailer = require('nodemailer');
    const User = require('../models/User');

    const GMAIL_USER     = process.env.GMAIL_USER;
    const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;
    const YOUR_WHATSAPP  = process.env.YOUR_WHATSAPP || '+94784175594';

    if (!GMAIL_USER || !GMAIL_APP_PASS) {
      return res.status(500).json({ success: false, message: 'Email credentials not configured on server.' });
    }

    const players = await User.find({ role: 'PLAYER' }).select('email username');
    if (players.length === 0) {
      return res.json({ success: true, message: 'No players found to email.', sent: 0 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS },
    });

    let sent = 0, failed = 0, failedEmails = [];

    for (const player of players) {
      try {
        await transporter.sendMail({
          from: `FROST Organization <${GMAIL_USER}>`,
          to: player.email,
          subject: '❄️ FROST — Please Send Us Your WhatsApp Number',
          html: `
            <div style="font-family:Arial,sans-serif;background:#040810;color:#F4FBFF;padding:32px;border-radius:12px;max-width:560px;margin:auto;">
              <div style="text-align:center;margin-bottom:24px;">
                <h1 style="color:#8BE3FF;font-size:28px;letter-spacing:6px;margin:0;">❄️ FROST</h1>
                <p style="color:#4A5D6E;font-size:11px;letter-spacing:3px;margin:4px 0 0;">COMPETITIVE NETWORK</p>
              </div>
              <p style="color:#F4FBFF;font-size:15px;">Hey <strong>${player.username || 'Player'}</strong>,</p>
              <p style="color:#8A9AAD;font-size:14px;line-height:1.7;">
                You're registered on the <strong style="color:#8BE3FF;">FROST Organization</strong> platform.
                We've updated our system and now require a <strong style="color:#F4FBFF;">WhatsApp number</strong>
                from every member so we can coordinate matches and keep you updated.
              </p>
              <div style="background:#0B101A;border:1px solid #1A2A3A;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
                <p style="color:#4A5D6E;font-size:12px;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Send your WhatsApp number to</p>
                <a href="https://wa.me/${YOUR_WHATSAPP.replace(/\D/g,'')}" style="color:#8BE3FF;font-size:22px;font-weight:bold;text-decoration:none;">${YOUR_WHATSAPP}</a>
                <p style="color:#4A5D6E;font-size:12px;margin:8px 0 0;">Message us on WhatsApp with your IGN</p>
              </div>
              <p style="color:#8A9AAD;font-size:13px;line-height:1.7;">
                Simply send: <strong style="color:#F4FBFF;">Your IGN + WhatsApp Number</strong>
              </p>
              <p style="color:#8A9AAD;font-size:13px;">Stay tuned — the FROST TDM ranking is coming soon. ❄️</p>
              <hr style="border:none;border-top:1px solid #1A2A3A;margin:24px 0;"/>
              <p style="color:#2A3D4E;font-size:11px;text-align:center;letter-spacing:2px;text-transform:uppercase;">© FROST COMPETITIVE NETWORK</p>
            </div>
          `,
        });
        sent++;
      } catch (e) {
        failed++;
        failedEmails.push(player.email);
      }
      await new Promise(r => setTimeout(r, 400));
    }

    res.json({ success: true, total: players.length, sent, failed, failedEmails });
  } catch (err) { next(err); }
});

module.exports = router;

