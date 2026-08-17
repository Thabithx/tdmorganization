const rankingService = require('../services/ranking.service');

const getLeaderboard = async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (!['MOBILE', 'IPAD', 'EMULATOR'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform.' });
    }
    const leaderboard = await rankingService.getLeaderboard(platform);
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
