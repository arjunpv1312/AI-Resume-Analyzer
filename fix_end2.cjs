const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{/* Disabled */}
              )}
              </div>`;

const replacement = `{/* Disabled */}
              </>
              )}
              </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
