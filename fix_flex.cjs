const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('{!isExecutiveMode && (\n                <div className="flex flex-col">', '{!isExecutiveMode && (\n                <>');
code = code.replace('              </div>\n              )}\n{/* Floating Action Buttons */}', '              </>\n              )}\n{/* Floating Action Buttons */}');

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
