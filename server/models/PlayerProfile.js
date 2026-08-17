const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  ign: { type: String, required: true, unique: true, trim: true },
  pubgUid: { type: String, required: true, unique: true, trim: true },
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR'], required: true },
  avatar: { type: String, default: 'https://res.cloudinary.com/ag9gfghc/image/upload/v1786951284/frost_defaults/default_avatar.jpg' },
  avatarPosition: { type: String, default: 'center center' },
  bio: { type: String, default: '', maxlength: 300 },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
}, { timestamps: true });

playerProfileSchema.index({ ign: 'text' });
playerProfileSchema.index({ platform: 1 });

module.exports = mongoose.model('PlayerProfile', playerProfileSchema);
