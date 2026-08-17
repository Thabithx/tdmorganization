const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  payhereOrderId: { type: String },
  payhereTransactionId: { type: String },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  paymentMethod: { type: String, default: 'PAYHERE' },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: { type: Date },
}, { timestamps: true });

paymentSchema.index({ challengeId: 1 });
paymentSchema.index({ payhereOrderId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
