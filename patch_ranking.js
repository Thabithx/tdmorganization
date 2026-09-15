const fs = require('fs');
const file = '/Users/thabith/Desktop/frostcommunity/server/services/ranking.service.js';
let code = fs.readFileSync(file, 'utf8');

// Find applyMatchResult definition
const funcStart = code.indexOf('const applyMatchResult = async (match, result, adminId, session) => {');

// Rename it to executeRankSwap and modify its parameters
let updatedCode = code.slice(0, funcStart) + 
`const executeRankSwap = async (match, result, adminId, session, platform, region, isSecondary = false) => {` + 
code.slice(funcStart + 'const applyMatchResult = async (match, result, adminId, session) => {'.length);

// Inside executeRankSwap, comment out the original platform/region extraction
updatedCode = updatedCode.replace(
  '  const platform = match.platform;\n    const region = match.region;',
  '  // const platform = match.platform;\n  // const region = match.region;'
);

// We need to fix the line 152: const ranksToShift = await Ranking.find({ platform, rank: ... 
// It misses region in the query! That's a pre-existing bug!
updatedCode = updatedCode.replace(
  'const ranksToShift = await Ranking.find({\n      platform,\n      rank: { $gte: defenderRank, $lte: 10 },\n    })',
  'const ranksToShift = await Ranking.find({\n      platform,\n      region,\n      rank: { $gte: defenderRank, $lte: 10 },\n    })'
);

// Add the wrapper applyMatchResult below it
const executeRankSwapEnd = updatedCode.indexOf('};\n\n/**\n * Manual admin ranking adjustment.');
const executeRankSwapBody = updatedCode.substring(0, executeRankSwapEnd + 2);
const restOfFile = updatedCode.substring(executeRankSwapEnd + 2);

const newApplyMatchResult = `
const applyMatchResult = async (match, result, adminId, session) => {
  const historyEntries = [];

  if (result === 'CHALLENGER_LOST') {
    return historyEntries;
  }

  try {
    const primaryEntries = await executeRankSwap(match, result, adminId, session, match.platform, match.region, false);
    historyEntries.push(...primaryEntries);
  } catch (err) {
    throw err; // Primary swap must succeed
  }

  // Dual-swap for Sri Lankans (also swap ASIA rank)
  if (match.region === 'SRI_LANKA') {
    try {
      const secondaryEntries = await executeRankSwap(match, result, adminId, session, 'ALL', 'ASIA', true);
      historyEntries.push(...secondaryEntries);
    } catch (err) {
      // If defender isn't ranked in ASIA, or there's a capacity conflict in ASIA, we just ignore the secondary swap 
      // rather than failing the primary match resolution.
      console.warn('Secondary ASIA rank swap failed or skipped:', err.message);
    }
  }

  return historyEntries;
};

`;

fs.writeFileSync(file, executeRankSwapBody + newApplyMatchResult + restOfFile);
console.log('Patched ranking.service.js successfully.');
