const fs = require('fs');
const babel = require('@babel/parser');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const replaced = code.replace(/\{result\.careerTrajectories(?:.|\n)*?\{!isExecutiveMode && \(/g, '{!isExecutiveMode && (');

try {
  babel.parse(replaced, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Parsed!");
} catch(e) {
  console.log(e.message, e.loc);
}
