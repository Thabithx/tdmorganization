const mongoose = require('mongoose');

const rankingHistorySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR'], required: true },
  previousRank: { type: Number, default: null },
  newRank: { type: Number, default: null },
  reason: {
    type: String,
    enum: ['MATCH_WIN', 'MATCH_LOSS', 'UNRANKED_PROMOTION', 'ADMIN_ADJUSTMENT', 'PLAYER_ADDED', 'PLAYER_REMOVED'],
    required: true
  },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', default: null },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

rankingHistorySchema.index({ playerId: 1, platform: 1, createdAt: -1 });

module.exports = mongoose.model('RankingHistory', rankingHistorySchema);
