const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../services/payment.service.js');
let code = fs.readFileSync(file, 'utf8');

// Update Ranking.findOne to use region in payment.service.js
code = code.replace(
  /Ranking\.findOne\(\{\s*platform: challenge\.platform,\s*players: challenge\.challengerId\._id,?\s*\}\)/g,
  'Ranking.findOne({ platform: challenge.platform, region: challenge.region, players: challenge.challengerId._id })'
);
code = code.replace(
  /Ranking\.findOne\(\{\s*platform: challenge\.platform,\s*players: challenge\.defenderId\._id,?\s*\}\)/g,
  'Ranking.findOne({ platform: challenge.platform, region: challenge.region, players: challenge.defenderId._id })'
);

// Add region to Match.create
code = code.replace(
  /platform: challenge\.platform,/g,
  'platform: challenge.platform,\n        region: challenge.region,'
);

fs.writeFileSync(file, code);
console.log("Updated payment.service.js");
