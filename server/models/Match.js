const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  type: { type: String, enum: ['IMAGE', 'VIDEO', 'URL', 'NOTE'], default: 'NOTE' },
  url: { type: String, default: '' },
  notes: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, unique: true },
  challengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  defenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', default: null },
  loserId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', default: null },
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR'], required: true },
  challengeAmount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  // Rank snapshots at time of challenge creation
  challengerRankAtChallenge: { type: Number, default: null },
  defenderRankAtChallenge: { type: Number, required: true },
  // Rank snapshots at time of match (may differ if rankings changed between challenge creation and match)
  challengerRankAtMatch: { type: Number, default: null },
  defenderRankAtMatch: { type: Number, default: null },
  result: { type: String, enum: ['CHALLENGER_WON', 'CHALLENGER_LOST'], default: null },
  resultStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'DISPUTED', 'CANCELLED'], default: 'PENDING' },
  evidence: [evidenceSchema],
  adminNotes: { type: String, default: '' },
  matchStartedAt: { type: Date },
  matchCompletedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

matchSchema.index({ challengerId: 1, resultStatus: 1 });
matchSchema.index({ defenderId: 1, resultStatus: 1 });
matchSchema.index({ winnerId: 1 });
matchSchema.index({ platform: 1, resultStatus: 1 });
matchSchema.index({ matchCompletedAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
