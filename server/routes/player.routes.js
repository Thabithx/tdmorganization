const express = require('express');
const multer = require('multer');
const { getPlayers, getPlayerById, updateProfile, getPlayerMatchHistory } = require('../controllers/player.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', getPlayers);
router.get('/:id', optionalAuth, getPlayerById);
router.put('/', protect, upload.fields([
  { name: 'avatarFile', maxCount: 1 },
  { name: 'controlsLayoutFile', maxCount: 1 }
]), updateProfile);
router.get('/:id/history', getPlayerMatchHistory);

module.exports = router;
