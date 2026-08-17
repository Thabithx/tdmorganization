const express = require('express');
const { getPlayers, getPlayerById, updateProfile, getPlayerMatchHistory } = require('../controllers/player.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getPlayers);
router.get('/:id', getPlayerById);
router.put('/', protect, updateProfile);
router.get('/:id/history', getPlayerMatchHistory);

module.exports = router;
