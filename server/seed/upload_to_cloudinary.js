require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const PlayerProfile = require('../models/PlayerProfile');

const WARRIOR_SVGS = [
  // 1. Spartan Crest (Aggressive & Simple Vector)
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#05070D" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M256 60 L290 180 L222 180 Z" fill="#8BDFFF"/>
    <path d="M140 240 C140 160 372 160 372 240 C372 340 256 440 256 440 C256 440 140 340 140 240 Z" fill="#101722" stroke="#8BDFFF" stroke-width="16"/>
    <path d="M256 200 L256 360" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M190 270 Q256 310 322 270" stroke="#FF5252" stroke-width="12" fill="none"/>
  </svg>`,

  // 2. Skull Crosshair (Aggressive & Simple Vector)
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#05070D" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M180 180 C180 140 332 140 332 180 C332 230 300 270 300 320 L212 320 C212 270 180 230 180 180 Z" fill="#101722" stroke="#8BDFFF" stroke-width="16"/>
    <circle cx="220" cy="200" r="24" fill="#FF5252"/>
    <circle cx="292" cy="200" r="24" fill="#FF5252"/>
    <path d="M220 270 L240 270 M272 270 L292 270" stroke="#8BDFFF" stroke-width="10"/>
    <circle cx="256" cy="256" r="190" fill="none" stroke="#FF5252" stroke-dasharray="24 12" stroke-width="6"/>
  </svg>`,

  // 3. Demon Horns (Aggressive & Simple Vector)
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#05070D" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M150 150 Q120 80 180 60 Q170 120 210 160 Z" fill="#FF5252"/>
    <path d="M362 150 Q392 80 332 60 Q342 120 302 160 Z" fill="#FF5252"/>
    <path d="M170 220 C170 160 342 160 342 220 C342 300 256 380 256 380 C256 380 170 300 170 220 Z" fill="#101722" stroke="#8BDFFF" stroke-width="16"/>
    <polygon points="210,210 230,230 220,250" fill="#FF5252"/>
    <polygon points="302,210 282,230 292,250" fill="#FF5252"/>
    <path d="M210 290 Q256 330 302 290" stroke="#FF5252" stroke-width="10" fill="none"/>
  </svg>`,

  // 4. Ninja Mask (Aggressive & Simple Vector)
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#05070D" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M160 200 C160 150 352 150 352 200 C352 280 320 340 256 370 C192 340 160 280 160 200 Z" fill="#101722" stroke="#8BDFFF" stroke-width="16"/>
    <rect x="180" y="200" width="152" height="46" rx="10" fill="#05070D" stroke="#FF5252" stroke-width="8"/>
    <circle cx="220" cy="223" r="10" fill="#FF5252"/>
    <circle cx="292" cy="223" r="10" fill="#FF5252"/>
  </svg>`,

  // 5. Shield & Swords (Aggressive & Simple Vector)
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#05070D" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M130 380 L380 130" stroke="#FF5252" stroke-width="20" stroke-linecap="round"/>
    <path d="M380 380 L130 130" stroke="#FF5252" stroke-width="20" stroke-linecap="round"/>
    <path d="M256 120 L350 170 L330 320 Q256 400 256 400 Q256 400 182 320 L162 170 Z" fill="#101722" stroke="#8BDFFF" stroke-width="16"/>
  </svg>`,

  // 6. Cyber Tactical Helmet (Aggressive & Simple Vector)
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#05070D" stroke="#8BDFFF" stroke-width="12"/>
    <path d="M170 200 Q256 120 342 200 L342 250 Q256 180 170 250 Z" fill="#8BDFFF"/>
    <path d="M170 240 C170 180 342 180 342 240 C342 320 256 380 256 380 C256 380 170 300 170 240 Z" fill="#101722" stroke="#8BDFFF" stroke-width="16"/>
    <circle cx="210" cy="245" r="14" fill="#FF5252"/>
    <circle cx="302" cy="245" r="14" fill="#FF5252"/>
  </svg>`
];

const uploadAllToCloudinary = async () => {
  const urls = [];
  for (let i = 0; i < WARRIOR_SVGS.length; i++) {
    const svgContent = WARRIOR_SVGS[i];
    // Convert the SVG XML string to base64 Data URI for direct Cloudinary upload
    const base64Svg = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    console.log(`Uploading simple vector avatar ${i + 1} to Cloudinary...`);
    try {
      const result = await cloudinary.uploader.upload(base64Svg, {
        folder: 'frost_vector_avatars',
        public_id: `warrior_vector_${i + 1}`
      });
      console.log(`Uploaded! URL: ${result.secure_url}`);
      urls.push(result.secure_url);
    } catch (err) {
      console.error(`Failed to upload vector avatar ${i + 1}:`, err);
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

    console.log('Assigning uploaded flat vector Cloudinary URLs to all seeded players...');
    const profiles = await PlayerProfile.find({});
    
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const urlIndex = i % uploadedUrls.length;
      profile.avatar = uploadedUrls[urlIndex];
      profile.avatarPosition = 'center center'; 
      await profile.save();
      console.log(`Assigned vector avatar to player ${profile.ign}: ${profile.avatar}`);
    }

    console.log('All player avatars updated successfully with flat aggressive vector Cloudinary URLs in MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Error during upload and DB update:', err);
    process.exit(1);
  }
};

run();
