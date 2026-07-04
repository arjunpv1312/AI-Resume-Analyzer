const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = code.indexOf('{/* Career Progress Badges */}');
const endIdx = code.indexOf('{/* Floating Action Buttons */}');
const snippet = code.substring(startIdx, endIdx);

// Let's strip out JS expressions inside {...} to not mess up tag matching
let cleanSnippet = snippet.replace(/\{[^{}]*\}/g, ' ');
while(/\{[^{}]*\}/.test(cleanSnippet)) {
  cleanSnippet = cleanSnippet.replace(/\{[^{}]*\}/g, ' ');
}

// Now match all <tag> and </tag>
const tagRegex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*?)?(?<!\/)>/g;
let match;
const stack = [];

while ((match = tagRegex.exec(cleanSnippet)) !== null) {
  let tag = match[1];
  if (match[0].startsWith('</')) {
    if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
      stack.pop();
    } else {
      console.log("Mismatch at index", match.index, ": Expected", stack.length > 0 ? stack[stack.length - 1].tag : "none", "but found", tag);
    }
  } else {
    // Check if it's self closing. We did negative lookbehind for />, but let's double check.
    if (!match[0].endsWith('/>')) {
      // It's an opening tag
      let line = snippet.substring(0, match.index).split('\n').length;
      stack.push({tag, index: match.index, line});
    }
  }
}

console.log("Unclosed tags remaining in stack:");
stack.forEach(s => console.log(s.tag, "at relative line", s.line));

