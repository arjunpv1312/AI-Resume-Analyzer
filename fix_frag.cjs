const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('{!isExecutiveMode && (\n                <>', '{!isExecutiveMode && (\n                <div className="flex flex-col">');
code = code.replace('              </>\n              )}\n{/* Floating Action Buttons */}', '              </div>\n              )}\n{/* Floating Action Buttons */}');

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
