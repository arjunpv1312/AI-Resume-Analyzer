const fs = require('fs');
const babel = require('@babel/parser');
const code = fs.readFileSync('src/App.tsx', 'utf8');

// We will find the element that is unclosed.
try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
} catch(e) {
  console.log("Error at", e.loc);
  // We can write a custom JSX parser to count tags, but let's just use regex
  const snippet = code.substring(0, code.indexOf('id="career-simulator"'));
  let divOpens = (snippet.match(/<div(\s|>)/g) || []).length;
  let divCloses = (snippet.match(/<\/div>/g) || []).length;
  console.log("div opens:", divOpens, "div closes:", divCloses);
  
  const glassOpens = (snippet.match(/<GlassCard(\s|>)/g) || []).length;
  const glassCloses = (snippet.match(/<\/GlassCard>/g) || []).length;
  console.log("GlassCard opens:", glassOpens, "GlassCard closes:", glassCloses);
}
