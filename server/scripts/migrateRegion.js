const mongoose = require('mongoose');

const Ranking = require('../models/Ranking');
const PlayerProfile = require('../models/PlayerProfile');
const Challenge = require('../models/Challenge');
const Match = require('../models/Match');
const RankingHistory = require('../models/RankingHistory');

const DIRECT_URI = "mongodb://thabith2222_db_user:jvondinaI3ibYovo@ac-jygcvau-shard-00-00.faso4gd.mongodb.net:27017,ac-jygcvau-shard-00-01.faso4gd.mongodb.net:27017,ac-jygcvau-shard-00-02.faso4gd.mongodb.net:27017/frost?ssl=true&replicaSet=atlas-13vbx4-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const migrate = async () => {
  try {
    await mongoose.connect(DIRECT_URI);
    console.log('Connected to DB via DIRECT_URI');

    try {
      await Ranking.collection.dropIndex('platform_1_rank_1');
      console.log('Dropped old Ranking index platform_1_rank_1');
    } catch (e) {
      console.log('Old Ranking index not found or already dropped:', e.message);
    }

    const collections = [
      { model: PlayerProfile, name: 'PlayerProfile' },
      { model: Ranking, name: 'Ranking' },
      { model: Challenge, name: 'Challenge' },
      { model: Match, name: 'Match' },
      { model: RankingHistory, name: 'RankingHistory' }
    ];

    for (const { model, name } of collections) {
      const result = await model.updateMany(
        { region: { $exists: false } },
        { $set: { region: 'SRI_LANKA' } }
      );
      console.log(`Updated ${result.modifiedCount} ${name} documents with region: SRI_LANKA`);
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
