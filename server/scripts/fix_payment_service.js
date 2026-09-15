const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../services/payment.service.js');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/region: challenge\.region, region: challenge\.region,/g, 'region: challenge.region,');
code = code.replace(/Ranking\.findOne\(\{\s*platform: challenge\.platform,\n\s*region: challenge\.region, players: challenge/g, 'Ranking.findOne({\n        platform: challenge.platform,\n        region: challenge.region,\n        players: challenge');

fs.writeFileSync(file, code);
