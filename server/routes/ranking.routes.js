const express = require('express');
const { getLeaderboard } = require('../controllers/ranking.controller');

const router = express.Router();

router.get('/:platform', getLeaderboard);

module.exports = router;
