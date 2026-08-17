require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');
const Ranking = require('../models/Ranking');
const Challenge = require('../models/Challenge');
const Payment = require('../models/Payment');
const Match = require('../models/Match');
const RankingHistory = require('../models/RankingHistory');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');

const seedData = async () => {
  try {
    // Clear existing database collections
    console.log('Clearing database...');
    await User.deleteMany({});
    await PlayerProfile.deleteMany({});
    await Ranking.deleteMany({});
    await Challenge.deleteMany({});
    await Payment.deleteMany({});
    await Match.deleteMany({});
    await RankingHistory.deleteMany({});
    await Notification.deleteMany({});
    await AdminAuditLog.deleteMany({});

    console.log('Database cleared.');

    // 1. Create Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@frost.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const adminUser = await User.create({
      username: 'frost_admin',
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('Admin user created:', adminEmail);

    // 2. Create Users & Profiles
    const mobileNames = ['FROSTY', 'NEKROZ', 'RAVEN', 'XENO', 'ACE', 'RAZE', 'VEX', 'NOVA', 'SHADOW', 'VOID', 'ZERO', 'PULSE', 'STORM', 'BLADE', 'VIPER'];
    const ipadNames = ['CHRONO', 'PHANTOM', 'TITAN', 'HYDRA', 'KRAKEN', 'ORION', 'SPECTER', 'GHOST', 'ECLIPSE', 'AURA'];
    const emulatorNames = ['MATRIX', 'CYBORG', 'VECTOR', 'PIXEL', 'WRATH', 'GOLIATH', 'BEAST', 'SHIVER', 'HAVOC', 'RUST'];

    const allProfiles = [];

    // PUBG-themed avatar seeds using DiceBear adventurer style (human characters)
    const avatarStyles = [
      'adventurer', 'adventurer-neutral', 'big-ears', 'big-ears-neutral'
    ];
    const getAvatar = (name) => {
      const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${name}&backgroundColor=0d1117,0f172a,1e293b&backgroundType=gradientLinear`;
    };

    // Helper to create users & profiles
    const createPlayersForPlatform = async (names, platform) => {
      for (const name of names) {
        const username = name.toLowerCase();
        const email = `${username}@frost.com`;
        
        const user = await User.create({
          username,
          email,
          passwordHash: 'player123',
          role: 'PLAYER',
          status: 'ACTIVE'
        });

        const profile = await PlayerProfile.create({
          userId: user._id,
          ign: name,
          pubgUid: Math.floor(100000000 + Math.random() * 900000000).toString(),
          platform,
          avatar: 'https://res.cloudinary.com/ag9gfghc/image/upload/v1786951284/frost_defaults/default_avatar.jpg',
          bio: `Official TDM Player for FROST Network on ${platform}. Think you're better? Prove it.`
        });

        allProfiles.push(profile);
      }
    };


    console.log('Creating mobile players...');
    await createPlayersForPlatform(mobileNames, 'MOBILE');
    console.log('Creating ipad players...');
    await createPlayersForPlatform(ipadNames, 'IPAD');
    console.log('Creating emulator players...');
    await createPlayersForPlatform(emulatorNames, 'EMULATOR');

    // Get profiles by platform
    const mobileProfiles = allProfiles.filter(p => p.platform === 'MOBILE');
    const ipadProfiles = allProfiles.filter(p => p.platform === 'IPAD');
    const emulatorProfiles = allProfiles.filter(p => p.platform === 'EMULATOR');

    // 3. Seed Rankings
    console.log('Seeding Rankings...');

    // MOBILE Top 10
    // Rank 1: FROSTY
    // Rank 2: NEKROZ
    // Rank 3: RAVEN
    // Rank 4: XENO, ACE (Shared)
    // Rank 5: RAZE
    // Rank 6: VEX
    // Rank 7: NOVA
    // Rank 8: SHADOW, VOID, ZERO (Shared - max 3)
    // Rank 9: PULSE
    // Rank 10: STORM
    // UNRANKED: BLADE, VIPER
    const mobileRankingData = [
      { rank: 1, players: [mobileProfiles[0]._id] }, // FROSTY
      { rank: 2, players: [mobileProfiles[1]._id] }, // NEKROZ
      { rank: 3, players: [mobileProfiles[2]._id] }, // RAVEN
      { rank: 4, players: [mobileProfiles[3]._id, mobileProfiles[4]._id] }, // XENO, ACE
      { rank: 5, players: [mobileProfiles[5]._id] }, // RAZE
      { rank: 6, players: [mobileProfiles[6]._id] }, // VEX
      { rank: 7, players: [mobileProfiles[7]._id] }, // NOVA
      { rank: 8, players: [mobileProfiles[8]._id, mobileProfiles[9]._id, mobileProfiles[10]._id] }, // SHADOW, VOID, ZERO
      { rank: 9, players: [mobileProfiles[11]._id] }, // PULSE
      { rank: 10, players: [mobileProfiles[12]._id] } // STORM
    ];


    for (const r of mobileRankingData) {
      await Ranking.create({ platform: 'MOBILE', rank: r.rank, players: r.players });
    }

    // IPAD Top 10 (Single players per rank)
    for (let i = 0; i < 10; i++) {
      await Ranking.create({
        platform: 'IPAD',
        rank: i + 1,
        players: [ipadProfiles[i]._id]
      });
    }

    // EMULATOR Top 10
    for (let i = 0; i < 10; i++) {
      await Ranking.create({
        platform: 'EMULATOR',
        rank: i + 1,
        players: [emulatorProfiles[i]._id]
      });
    }

    console.log('Rankings seeded.');

    // 4. Seed Matches (FROSTY defeated RAVEN 5x, XENO 3x, ACE 2x)
    console.log('Seeding Matches & Stats...');

    const frosty = mobileProfiles[0];  // FROSTY
    const nekroz = mobileProfiles[1];  // NEKROZ  
    const raven = mobileProfiles[2];   // RAVEN
    const xeno = mobileProfiles[3];    // XENO
    const ace = mobileProfiles[4];     // ACE
    const raze = mobileProfiles[5];    // RAZE


    // Helper to generate a completed match
    const createCompletedMatch = async (winner, loser, amount, winnerRank, loserRank) => {
      const challenge = await Challenge.create({
        challengerId: winner._id,
        defenderId: loser._id,
        platform: winner.platform,
        challengerRankAtCreation: winnerRank,
        defenderRankAtCreation: loserRank,
        challengeAmount: amount,
        minimumRequiredAmount: loserRank <= 5 ? 900 : 500,
        currency: 'LKR',
        status: 'COMPLETED',
        acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });

      await Payment.create({
        challengeId: challenge._id,
        payerId: winner._id,
        amount,
        currency: 'LKR',
        status: 'CONFIRMED',
        payhereOrderId: `FROST-SEED-${challenge._id}`,
        payhereTransactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      });

      return Match.create({
        challengeId: challenge._id,
        challengerId: winner._id,
        defenderId: loser._id,
        winnerId: winner._id,
        loserId: loser._id,
        platform: winner.platform,
        challengeAmount: amount,
        currency: 'LKR',
        challengerRankAtChallenge: winnerRank,
        defenderRankAtChallenge: loserRank,
        challengerRankAtMatch: winnerRank,
        defenderRankAtMatch: loserRank,
        result: 'CHALLENGER_WON',
        resultStatus: 'COMPLETED',
        adminNotes: 'Verified clean TDM match. Screen recording reviewed.',
        matchStartedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        matchCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        verifiedBy: adminUser._id
      });
    };

    // Helper to generate a match where challenger lost
    const createChallengerLostMatch = async (challenger, defender, amount, challengerRank, defenderRank) => {
      const challenge = await Challenge.create({
        challengerId: challenger._id,
        defenderId: defender._id,
        platform: challenger.platform,
        challengerRankAtCreation: challengerRank,
        defenderRankAtCreation: defenderRank,
        challengeAmount: amount,
        minimumRequiredAmount: defenderRank <= 5 ? 900 : 500,
        currency: 'LKR',
        status: 'COMPLETED',
        acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });

      await Payment.create({
        challengeId: challenge._id,
        payerId: challenger._id,
        amount,
        currency: 'LKR',
        status: 'CONFIRMED',
        payhereOrderId: `FROST-SEED-${challenge._id}`,
        payhereTransactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      });

      return Match.create({
        challengeId: challenge._id,
        challengerId: challenger._id,
        defenderId: defender._id,
        winnerId: defender._id,
        loserId: challenger._id,
        platform: challenger.platform,
        challengeAmount: amount,
        currency: 'LKR',
        challengerRankAtChallenge: challengerRank,
        defenderRankAtChallenge: defenderRank,
        challengerRankAtMatch: challengerRank,
        defenderRankAtMatch: defenderRank,
        result: 'CHALLENGER_LOST',
        resultStatus: 'COMPLETED',
        adminNotes: 'Defender won. Verified match score sheet.',
        matchStartedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        matchCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        verifiedBy: adminUser._id
      });
    };

    // Frosty wins:
    // vs Raven 5x (when Raven was #2, Frosty was #1 or #3 or #4)
    console.log('Seeding Frosty vs Raven matches...');
    for (let i = 0; i < 5; i++) {
      await createCompletedMatch(frosty, raven, 1200 + i * 100, 3, 2);
    }

    // vs Xeno 3x (when Xeno was #3)
    console.log('Seeding Frosty vs Xeno matches...');
    for (let i = 0; i < 3; i++) {
      await createCompletedMatch(frosty, xeno, 1000, 4, 3);
    }

    // vs Ace 2x (when Ace was #3)
    console.log('Seeding Frosty vs Ace matches...');
    for (let i = 0; i < 2; i++) {
      await createCompletedMatch(frosty, ace, 900, 4, 3);
    }

    // Other matches for variety
    console.log('Seeding other matches...');
    await createCompletedMatch(raven, raze, 1000, 2, 4);
    await createCompletedMatch(xeno, raze, 900, 3, 4);
    await createChallengerLostMatch(ace, raze, 950, 3, 4); // Raze wins, Ace loses
    await createCompletedMatch(ipadProfiles[0], ipadProfiles[1], 1500, 1, 2);
    await createCompletedMatch(emulatorProfiles[2], emulatorProfiles[3], 700, 3, 4);

    console.log('Matches seeded.');

    // 5. Seed Challenges in other states
    console.log('Seeding pending/active challenges...');
    
    // A pending challenge: APEX (Unranked) challenges FROSTY (#1)
    const apex = mobileProfiles[14];
    await Challenge.create({
      challengerId: apex._id,
      defenderId: frosty._id,
      platform: 'MOBILE',
      challengerRankAtCreation: null,
      defenderRankAtCreation: 1,
      challengeAmount: 1500,
      minimumRequiredAmount: 900,
      status: 'PENDING'
    });

    // An accepted/payment_pending challenge: VIPER (Unranked) challenges RAVEN (#2)
    const viper = mobileProfiles[13];
    const acceptChal = await Challenge.create({
      challengerId: viper._id,
      defenderId: raven._id,
      platform: 'MOBILE',
      challengerRankAtCreation: null,
      defenderRankAtCreation: 2,
      challengeAmount: 1000,
      minimumRequiredAmount: 900,
      status: 'PAYMENT_PENDING',
      acceptedAt: new Date()
    });

    await Payment.create({
      challengeId: acceptChal._id,
      payerId: viper._id,
      amount: 1000,
      status: 'PENDING',
      payhereOrderId: `FROST-SEED-${acceptChal._id}`
    });

    // An active match: PULSE (#8) vs RAZE (#4) - PAYMENT_CONFIRMED/MATCH_ACTIVE
    const pulse = mobileProfiles[10];
    const activeChal = await Challenge.create({
      challengerId: pulse._id,
      defenderId: raze._id,
      platform: 'MOBILE',
      challengerRankAtCreation: 8,
      defenderRankAtCreation: 4,
      challengeAmount: 1100,
      minimumRequiredAmount: 900,
      status: 'MATCH_ACTIVE',
      acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    await Payment.create({
      challengeId: activeChal._id,
      payerId: pulse._id,
      amount: 1100,
      status: 'CONFIRMED',
      payhereOrderId: `FROST-SEED-${activeChal._id}`,
      payhereTransactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      confirmedAt: new Date(Date.now() - 22 * 60 * 60 * 1000)
    });

    await Match.create({
      challengeId: activeChal._id,
      challengerId: pulse._id,
      defenderId: raze._id,
      platform: 'MOBILE',
      challengeAmount: 1100,
      challengerRankAtChallenge: 8,
      defenderRankAtChallenge: 4,
      challengerRankAtMatch: 8,
      defenderRankAtMatch: 4,
      resultStatus: 'PENDING'
    });

    console.log('Challenges seeded.');

    // 6. Seed Ranking History
    console.log('Seeding Ranking History...');
    await RankingHistory.create([
      {
        playerId: frosty._id,
        platform: 'MOBILE',
        previousRank: 2,
        newRank: 1,
        reason: 'MATCH_WIN',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        playerId: raven._id,
        platform: 'MOBILE',
        previousRank: 1,
        newRank: 2,
        reason: 'MATCH_LOSS',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        playerId: raze._id,
        platform: 'MOBILE',
        previousRank: null,
        newRank: 4,
        reason: 'UNRANKED_PROMOTION',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Ranking History seeded.');

    // 7. Seed Notifications
    console.log('Seeding Notifications...');
    await Notification.create([
      {
        userId: frosty.userId,
        type: 'MATCH_COMPLETED',
        message: 'Your match result vs RAVEN has been confirmed. You won and took rank #1!',
        isRead: false
      },
      {
        userId: raven.userId,
        type: 'MATCH_COMPLETED',
        message: 'Your match result vs FROSTY has been confirmed. You lost and dropped to rank #2.',
        isRead: true
      },
      {
        userId: raze.userId,
        type: 'CHALLENGE_RECEIVED',
        message: 'You have been challenged by PULSE for Rs. 1,100.',
        isRead: true
      }
    ]);
    console.log('Notifications seeded.');

    // 8. Seed Audit Logs
    console.log('Seeding Audit Logs...');
    await AdminAuditLog.create([
      {
        adminId: adminUser._id,
        action: 'MATCH_RESULT_CONFIRMED',
        targetEntity: 'Match',
        reason: 'Verified screen recording of final score.',
        metadata: { winner: 'FROSTY', loser: 'RAVEN' }
      },
      {
        adminId: adminUser._id,
        action: 'PAYMENT_CONFIRMED',
        targetEntity: 'Payment',
        reason: 'Manual validation of PayHere reference.'
      }
    ]);
    console.log('Audit Logs seeded.');

    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/frost').then(() => {
  seedData();
});
