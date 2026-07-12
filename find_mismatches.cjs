const fs = require('fs');
const babel = require('@babel/parser');

const code = fs.readFileSync('src/App.tsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("No syntax errors found in App.tsx!");
} catch (e) {
  console.log("Error details:");
  console.log("Message:", e.message);
  console.log("Line:", e.loc.line, "Column:", e.loc.column);
  
  const lines = code.split('\n');
  const start = Math.max(0, e.loc.line - 15);
  const end = Math.min(lines.length, e.loc.line + 15);
  console.log("\nCode context around the error:");
  for (let i = start; i < end; i++) {
    const isErrorLine = (i + 1) === e.loc.line;
    console.log(`${isErrorLine ? '>> ' : '   '}${i + 1}: ${lines[i]}`);
  }
}
