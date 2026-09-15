const rankingService = require('../services/ranking.service');

const getLeaderboard = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { region = 'SRI_LANKA' } = req.query;

    if (!['MOBILE', 'IPAD', 'EMULATOR'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform.' });
    }
    if (!['SRI_LANKA', 'ASIA'].includes(region)) {
      return res.status(400).json({ success: false, message: 'Invalid region.' });
    }

    const leaderboard = await rankingService.getLeaderboard(platform, region);
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
