const fs = require('fs');
const ts = require('typescript');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true);

function visit(node) {
  if (node.kind === ts.SyntaxKind.JsxElement) {
    const opening = node.openingElement.tagName.getText();
    const closing = node.closingElement.tagName.getText();
    if (opening !== closing) {
      console.log(`Mismatch: <${opening}> closed with </${closing}>`);
    }
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);
console.log("AST traversal complete.");
