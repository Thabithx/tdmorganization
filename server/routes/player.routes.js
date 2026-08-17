const express = require('express');
const multer = require('multer');
const { getPlayers, getPlayerById, updateProfile, getPlayerMatchHistory } = require('../controllers/player.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', getPlayers);
router.get('/:id', getPlayerById);
router.put('/', protect, upload.single('avatarFile'), updateProfile);
router.get('/:id/history', getPlayerMatchHistory);

module.exports = router;
