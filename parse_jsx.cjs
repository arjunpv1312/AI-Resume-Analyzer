const fs = require('fs');
const babel = require('@babel/parser');
const code = fs.readFileSync('src/App.tsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Babel parsed successfully!");
} catch(e) {
  console.log(e.message);
  console.log("Line:", e.loc.line, "Col:", e.loc.column);
}
