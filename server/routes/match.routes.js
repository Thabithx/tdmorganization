const express = require('express');
const { getMatches, getMatchById, getMyMatchHistory } = require('../controllers/match.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getMatches);
router.get('/my', protect, getMyMatchHistory);
router.get('/:id', getMatchById);

module.exports = router;
