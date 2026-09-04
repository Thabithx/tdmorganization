const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  ign: { type: String, required: true, unique: true, trim: true },
  pubgUid: { type: String, required: true, unique: true, trim: true },
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR'], required: true },
  whatsapp: { type: String, required: true, trim: true },
  avatar: { type: String, default: '/default_avatar.png' },
  avatarPosition: { type: String, default: 'center top' },
  bio: { type: String, default: '', maxlength: 300 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  tiktok: { type: String, default: '' },
  instagram: { type: String, default: '' },
  yearsPlaying: { type: Number, default: 0 },
  lookingFor: { type: String, default: '' },
  controlsLayout: { type: String, default: '' },
  adminNotes: [{
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  abandonmentTimeouts: { type: Number, default: 0 },
  abandonmentCooldownUntil: { type: Date },
  abandonmentFlaggedForReview: { type: Boolean, default: false },
  monthlyReviewsUsed: { type: Number, default: 0 },
  reviewMonthTracker: { type: String, default: '' } // YYYY-MM
}, { timestamps: true });

playerProfileSchema.index({ ign: 'text' });
playerProfileSchema.index({ platform: 1 });
playerProfileSchema.index({ status: 1, platform: 1 });

module.exports = mongoose.model('PlayerProfile', playerProfileSchema);
