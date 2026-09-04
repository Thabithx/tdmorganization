const express = require('express');
const { createChallenge, getChallenges, getChallengeById, acceptChallenge, rejectChallenge, cancelChallenge, requestAdminReview } = require('../controllers/challenge.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', createChallenge);
router.get('/', getChallenges);
router.get('/:id', getChallengeById);
router.post('/:id/accept', acceptChallenge);
router.post('/:id/reject', rejectChallenge);
router.post('/:id/cancel', cancelChallenge);
router.post('/:id/admin-review', requestAdminReview);

module.exports = router;
