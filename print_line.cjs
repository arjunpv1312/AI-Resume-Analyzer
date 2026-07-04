const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = code.indexOf('{/* Career Progress Badges */}');
const snippet = code.substring(startIdx);
const lines = snippet.split('\n');

for (let i = 120; i < 140; i++) {
  console.log(i + 1, ":", lines[i]);
}
