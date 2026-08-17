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

module.exports = router;
