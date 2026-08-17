require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const PlayerProfile = require('../models/PlayerProfile');
const fs = require('fs');
const path = require('path');

const localImages = [
  {
    name: 'spartan',
    path: '/Users/thabith/.gemini/antigravity/brain/0e5ec18f-97a1-4ec0-ab51-03660541c61b/default_player_avatar_1786944872801.jpg'
  },
  {
    name: 'soldier',
    path: '/Users/thabith/.gemini/antigravity/brain/0e5ec18f-97a1-4ec0-ab51-03660541c61b/soldier_avatar_1786948309946.jpg'
  },
  {
    name: 'demon',
    path: '/Users/thabith/.gemini/antigravity/brain/0e5ec18f-97a1-4ec0-ab51-03660541c61b/demon_avatar_1786948400633.jpg'
  }
];

const uploadAllToCloudinary = async () => {
  const urls = [];
  for (const img of localImages) {
    if (fs.existsSync(img.path)) {
      console.log(`Uploading ${img.name} to Cloudinary...`);
      try {
        const result = await cloudinary.uploader.upload(img.path, {
          folder: 'frost_premium_avatars',
          public_id: img.name
        });
        console.log(`Uploaded! URL: ${result.secure_url}`);
        urls.push(result.secure_url);
      } catch (err) {
        console.error(`Failed to upload ${img.name}:`, err);
      }
    } else {
      console.error(`File does not exist: ${img.path}`);
    }
  }
  return urls;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    const uploadedUrls = await uploadAllToCloudinary();
    if (uploadedUrls.length === 0) {
      console.log('No avatars uploaded. Exiting.');
      process.exit(1);
    }

    console.log('Assigning uploaded Cloudinary avatars to all seeded players...');
    const profiles = await PlayerProfile.find({});
    
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      // Deterministically assign one of the uploaded Cloudinary URLs
      const urlIndex = i % uploadedUrls.length;
      profile.avatar = uploadedUrls[urlIndex];
      profile.avatarPosition = 'center center'; // auto-centered on save
      await profile.save();
      console.log(`Assigned avatar to player ${profile.ign}: ${profile.avatar}`);
    }

    console.log('All player avatars updated successfully with Cloudinary URLs in MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Error during upload and DB update:', err);
    process.exit(1);
  }
};

run();
