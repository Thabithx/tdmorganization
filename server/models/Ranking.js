const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
  platform: { type: String, enum: ['MOBILE', 'IPAD', 'EMULATOR'], required: true },
  rank: { type: Number, required: true, min: 1, max: 10 },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlayerProfile',
  }],
}, { timestamps: true });

rankingSchema.index({ platform: 1, rank: 1 }, { unique: true });

rankingSchema.pre('save', function (next) {
  if (this.players.length > 3) {
    return next(new Error('A rank cannot have more than 3 players'));
  }
  next();
});

rankingSchema.statics.getLeaderboard = async function (platform) {
  return this.find({ platform }).sort({ rank: 1 }).populate({
    path: 'players',
    select: 'ign pubgUid platform avatar bio status',
  });
};

module.exports = mongoose.model('Ranking', rankingSchema);
