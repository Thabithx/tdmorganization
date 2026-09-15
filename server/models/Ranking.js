const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR', 'ALL'], required: true },
  region: { type: String, enum: ['SRI_LANKA', 'ASIA'], required: true, default: 'SRI_LANKA' },
  rank: { type: Number, required: true, min: 1, max: 10 },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlayerProfile',
  }],
}, { timestamps: true });

rankingSchema.index({ platform: 1, region: 1, rank: 1 }, { unique: true });

rankingSchema.pre('save', function (next) {
  if (this.players.length > 3) {
    return next(new Error('A rank cannot have more than 3 players'));
  }
  next();
});

rankingSchema.statics.getLeaderboard = async function (platform, region = 'SRI_LANKA') {
  // Also match pre-migration docs that have no region field (treat as SRI_LANKA)
  const regionQuery = region === 'SRI_LANKA'
    ? { $in: ['SRI_LANKA', null, undefined] }
    : region;
  return this.find({ platform, region: regionQuery }).sort({ rank: 1 }).populate({
    path: 'players',
    select: 'ign pubgUid platform region avatar bio status reliability countryFlag avatarPosition',
  });
};

module.exports = mongoose.model('Ranking', rankingSchema);
