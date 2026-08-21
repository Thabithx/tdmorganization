const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  challengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  defenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR'], required: true },
  challengerRankAtCreation: { type: Number, default: null },
  defenderRankAtCreation: { type: Number, required: true },
  challengeAmount: { type: Number, required: true },
  minimumRequiredAmount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  status: {
    type: String,
    enum: [
      'PENDING', 'ACCEPTED', 'REJECTED',
      'PAYMENT_PENDING', 'PAYMENT_CONFIRMED',
      'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING',
      'COMPLETED', 'DISPUTED', 'CANCELLED', 'EXPIRED'
    ],
    default: 'PENDING'
  },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  paymentDeadline: { type: Date },
  notes: { type: String, default: '' },
}, { timestamps: true });

challengeSchema.index({ challengerId: 1, status: 1 });
challengeSchema.index({ defenderId: 1, status: 1 });
challengeSchema.index({ platform: 1 });
challengeSchema.index({ status: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
