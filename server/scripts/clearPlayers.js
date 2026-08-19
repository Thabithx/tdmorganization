/**
 * clearPlayers.js
 * Wipes all player data from the FROST database.
 * Keeps the admin account (role: ADMIN) intact.
 * Run with: node scripts/clearPlayers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User          = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');
const Challenge     = require('../models/Challenge');
const Match         = require('../models/Match');
const Notification  = require('../models/Notification');
const Payment       = require('../models/Payment');
const Ranking       = require('../models/Ranking');
const RankingHistory= require('../models/RankingHistory');
const AdminAuditLog = require('../models/AdminAuditLog');

async function clearAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB:', mongoose.connection.host);

  // Delete all non-admin users
  const userResult = await User.deleteMany({ role: { $ne: 'ADMIN' } });
  console.log(`🗑  Users deleted:         ${userResult.deletedCount}`);

  const profileResult = await PlayerProfile.deleteMany({});
  console.log(`🗑  PlayerProfiles deleted: ${profileResult.deletedCount}`);

  const challengeResult = await Challenge.deleteMany({});
  console.log(`🗑  Challenges deleted:     ${challengeResult.deletedCount}`);

  const matchResult = await Match.deleteMany({});
  console.log(`🗑  Matches deleted:        ${matchResult.deletedCount}`);

  const notifResult = await Notification.deleteMany({});
  console.log(`🗑  Notifications deleted:  ${notifResult.deletedCount}`);

  const payResult = await Payment.deleteMany({});
  console.log(`🗑  Payments deleted:       ${payResult.deletedCount}`);

  const rankResult = await Ranking.deleteMany({});
  console.log(`🗑  Rankings deleted:       ${rankResult.deletedCount}`);

  const rankHistResult = await RankingHistory.deleteMany({});
  console.log(`🗑  RankingHistory deleted: ${rankHistResult.deletedCount}`);

  const auditResult = await AdminAuditLog.deleteMany({});
  console.log(`🗑  AuditLogs deleted:      ${auditResult.deletedCount}`);

  // Verify admin is still there
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  console.log(`\n✅  Admin accounts preserved: ${adminCount}`);

  console.log('\n🎉  Database cleared. Ready for new players!');
  await mongoose.disconnect();
}

clearAll().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
