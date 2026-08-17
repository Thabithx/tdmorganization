const express = require('express');
const {
  getDashboard, getAdminPlayers, updateAdminPlayer, suspendPlayer, restorePlayer,
  getAdminRankings, manualRankingUpdate,
  getAdminChallenges, updateChallengeStatus,
  getAdminPayments, confirmPaymentManual,
  getAdminMatches, getAdminMatchById, addMatchEvidence, updateMatchStatus, confirmMatchResult,
  getAuditLogs, getRankingHistory
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboard);

router.get('/players', getAdminPlayers);
router.put('/players/:id', updateAdminPlayer);
router.post('/players/:id/suspend', suspendPlayer);
router.post('/players/:id/restore', restorePlayer);

router.get('/rankings', getAdminRankings);
router.post('/rankings/manual-update', manualRankingUpdate);

router.get('/challenges', getAdminChallenges);
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

router.get('/audit-logs', getAuditLogs);
router.get('/ranking-history', getRankingHistory);

module.exports = router;
