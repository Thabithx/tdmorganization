const express = require('express');
const { register, login, getMe, forgotPassword, resetPassword, testEmail, forceResetJoy } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/test-email', testEmail);
router.get('/force-reset-joy', forceResetJoy);
router.get('/migrate-region', async (req, res) => {
  try {
    const PlayerProfile = require('../models/PlayerProfile');
    const Ranking = require('../models/Ranking');
    const Challenge = require('../models/Challenge');
    const Match = require('../models/Match');
    const RankingHistory = require('../models/RankingHistory');
    const mongoose = require('mongoose');

    // Drop the old unique index - new one is defined in schema
    try { await Ranking.collection.dropIndex('platform_1_rank_1'); } catch (e) { /* already gone */ }

    const results = {};
    for (const [name, model] of [['PlayerProfile', PlayerProfile], ['Ranking', Ranking], ['Challenge', Challenge], ['Match', Match], ['RankingHistory', RankingHistory]]) {
      const r = await model.updateMany({ region: { $exists: false } }, { $set: { region: 'SRI_LANKA' } });
      results[name] = r.modifiedCount;
    }

    res.json({ success: true, message: 'Migration complete', results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
