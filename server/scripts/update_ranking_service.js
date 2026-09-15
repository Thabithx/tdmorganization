const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../services/ranking.service.js');
let code = fs.readFileSync(file, 'utf8');

// Update getLeaderboard
code = code.replace(
  'const getLeaderboard = async (platform) => {',
  'const getLeaderboard = async (platform, region = "SRI_LANKA") => {'
).replace(
  'return Ranking.getLeaderboard(platform);',
  'return Ranking.getLeaderboard(platform, region);'
);

// Update getPlayerRank
code = code.replace(
  'const getPlayerRank = async (playerId, platform) => {',
  'const getPlayerRank = async (playerId, platform, region = "SRI_LANKA") => {'
).replace(
  'return Ranking.findOne({ platform, players: playerId });',
  'return Ranking.findOne({ platform, region, players: playerId });'
);
// Replace second one (the code had two findOne)
code = code.replace(
  /const rankDoc = await Ranking\.findOne\(\{ platform, players: playerId \}\);/,
  'const rankDoc = await Ranking.findOne({ platform, region, players: playerId });'
);

// Update getPlayerRankDoc
code = code.replace(
  'const getPlayerRankDoc = async (playerId, platform) => {',
  'const getPlayerRankDoc = async (playerId, platform, region = "SRI_LANKA") => {'
);
code = code.replace(
  /return Ranking\.findOne\(\{ platform, players: playerId \}\);/,
  'return Ranking.findOne({ platform, region, players: playerId });'
);

// Update applyMatchResult
// Find `const platform = match.platform;` and add region
code = code.replace(
  'const platform = match.platform;',
  'const platform = match.platform;\n    const region = match.region;'
);
// Now replace `{ platform }` with `{ platform, region }` inside applyMatchResult, but ONLY where it makes sense.
// Actually, it's safer to just replace `{ platform, rank: ` with `{ platform, region, rank: ` 
// and `{ platform, players: ` with `{ platform, region, players: `
code = code.replace(/\{ platform, rank:/g, '{ platform, region, rank:');
code = code.replace(/\{ platform, players:/g, '{ platform, region, players:');
// History creation
code = code.replace(/playerId: pid,\n\s*platform,/g, 'playerId: pid,\n              platform,\n              region,');
code = code.replace(/playerId: challengerId,\n\s*platform,/g, 'playerId: challengerId,\n      platform,\n      region,');

// Update manualAdminAdjustment
code = code.replace(
  'const manualAdminAdjustment = async ({ platform, action, playerId, targetRank, swapWithPlayerId, reason, adminId }) => {',
  'const manualAdminAdjustment = async ({ platform, region = "SRI_LANKA", action, playerId, targetRank, swapWithPlayerId, reason, adminId }) => {'
);
code = code.replace(/historyEntry = \{ playerId, platform,/g, 'historyEntry = { playerId, platform, region,');
code = code.replace(/historyEntry = \[\n\s*\{ playerId, platform,/g, 'historyEntry = [\n        { playerId, platform, region,');
code = code.replace(/\{ playerId: swapWithPlayerId, platform,/g, '{ playerId: swapWithPlayerId, platform, region,');
code = code.replace(/auditMetadata = \{ action, platform/g, 'auditMetadata = { action, platform, region');

// Update validateRankingIntegrity
code = code.replace(
  'const validateRankingIntegrity = async (platform) => {',
  'const validateRankingIntegrity = async (platform, region = "SRI_LANKA") => {'
);
code = code.replace(
  'const ranks = await Ranking.find({ platform });',
  'const ranks = await Ranking.find({ platform, region });'
);

fs.writeFileSync(file, code);
console.log("Updated ranking.service.js");
