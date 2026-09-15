const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../services/challenge.service.js');
let code = fs.readFileSync(file, 'utf8');

// Update createChallenge
code = code.replace(
  'const createChallenge = async ({ challengerUserId, defenderId, amount }) => {',
  'const createChallenge = async ({ challengerUserId, defenderId, amount }) => {'
);
code = code.replace(
  "if (challengerProfile.platform !== defenderProfile.platform) {",
  "if (challengerProfile.platform !== defenderProfile.platform) {\n    throw Object.assign(new Error('Players must be on the same platform.'), { statusCode: 400 });\n  }\n  if (challengerProfile.region !== defenderProfile.region) {\n    throw Object.assign(new Error('Players must be in the same region.'), { statusCode: 400 });\n  }"
);
// Make sure to remove the old platform check if we just replaced it. Actually let's just find `defenderProfile.platform` and insert region check after.
// It's safer to use regex replacement on the specific lines.
code = code.replace(
  /if \(challengerProfile\.platform !== defenderProfile\.platform\) \{\s*throw Object\.assign\(new Error\('Players must be on the same platform\.'\), \{ statusCode: 400 \}\);\s*\}/,
  "if (challengerProfile.platform !== defenderProfile.platform) {\n    throw Object.assign(new Error('Players must be on the same platform.'), { statusCode: 400 });\n  }\n  if (challengerProfile.region !== defenderProfile.region) {\n    throw Object.assign(new Error('Players must be in the same region.'), { statusCode: 400 });\n  }"
);

// We need to pass region to getMinimumAmount
code = code.replace(
  'const defenderRankDoc = await Ranking.findOne({ platform: defenderProfile.platform, players: defenderProfile._id });',
  'const defenderRankDoc = await Ranking.findOne({ platform: defenderProfile.platform, region: defenderProfile.region, players: defenderProfile._id });'
);
// Also in rejectChallenge Anti-Abuse Decline Limit Check
code = code.replace(
  'const defenderRankDoc = await Ranking.findOne({ platform: challenge.platform, players: defenderProfile._id });',
  'const defenderRankDoc = await Ranking.findOne({ platform: challenge.platform, region: challenge.region || defenderProfile.region, players: defenderProfile._id });'
);
// When creating the challenge doc
code = code.replace(
  /defenderId: defenderProfile\._id,\n\s*platform: challengerProfile\.platform,/,
  'defenderId: defenderProfile._id,\n    platform: challengerProfile.platform,\n    region: challengerProfile.region,'
);

fs.writeFileSync(file, code);
console.log("Updated challenge.service.js");
