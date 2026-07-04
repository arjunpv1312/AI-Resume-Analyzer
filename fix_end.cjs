const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              )}
              </div>
{/* Floating Action Buttons */}`;

const replacement = `              )}
              </div>
              )}
{/* Floating Action Buttons */}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
