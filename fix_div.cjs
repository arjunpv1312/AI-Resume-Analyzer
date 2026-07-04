const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I need to move one `</div>` from INSIDE the `)}` to OUTSIDE the `)}`.

const target = `              </div>
              )}
{/* Floating Action Buttons */}`;

const replacement = `              )}
              </div>
{/* Floating Action Buttons */}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
