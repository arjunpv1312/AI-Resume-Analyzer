const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{/* Disabled */}
              </>
              )}
              </div>
{/* Floating Action Buttons */}`;

const replacement = `{/* Disabled */}
              </>
              )}
{/* Floating Action Buttons */}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
