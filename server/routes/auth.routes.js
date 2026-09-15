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

    // Drop ALL old unique indexes on Ranking that don't include region
    const indexesBefore = await Ranking.collection.indexes();
    const dropResults = [];
    for (const idx of indexesBefore) {
      const keys = Object.keys(idx.key || {});
      // Drop any index that has platform+rank but NOT region
      if (keys.includes('platform') && keys.includes('rank') && !keys.includes('region')) {
        try {
          await Ranking.collection.dropIndex(idx.name);
          dropResults.push(`Dropped: ${idx.name}`);
        } catch (e) {
          dropResults.push(`Failed to drop ${idx.name}: ${e.message}`);
        }
      }
    }

    // Ensure new index exists
    try {
      await Ranking.collection.createIndex({ platform: 1, region: 1, rank: 1 }, { unique: true, name: 'platform_1_region_1_rank_1' });
      dropResults.push('Created new index: platform_1_region_1_rank_1');
    } catch (e) {
      dropResults.push(`New index note: ${e.message}`);
    }

    // Set region on all docs missing it
    const results = {};
    for (const [name, model] of [['PlayerProfile', PlayerProfile], ['Ranking', Ranking], ['Challenge', Challenge], ['Match', Match], ['RankingHistory', RankingHistory]]) {
      const r = await model.updateMany({ region: { $exists: false } }, { $set: { region: 'SRI_LANKA' } });
      results[name] = r.modifiedCount;
    }

    const indexesAfter = await Ranking.collection.indexes();

    res.json({ success: true, message: 'Migration complete', indexOps: dropResults, results, currentIndexes: indexesAfter.map(i => i.name) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
