const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('{!isExecutiveMode && (', '{!isExecutiveMode && (\n                <div className="flex flex-col">');
code = code.replace(/\{(\/\* Floating Action Buttons \*\/)\}/g, '</div>\n{$1}');

code = code.replace('<div className="mb-8">\n                <GlassCard className="p-8 border-t-4 border-t-emerald-500 bg-gradient-to-b from-emerald-500/5 to-transparent">', '<div className="mb-8" id="career-progress" style={{ order: sectionOrder.indexOf(\'career-progress\') }}>\n                <GlassCard className="p-8 border-t-4 border-t-emerald-500 bg-gradient-to-b from-emerald-500/5 to-transparent">');

code = code.replace('<div id="scoring-infrastructure" className="grid md:grid-cols-2 gap-8 mb-8">', '<div id="scoring-infrastructure" className="grid md:grid-cols-2 gap-8 mb-8" style={{ order: sectionOrder.indexOf(\'scoring-infrastructure\') }}>');
code = code.replace('<GlassCard className="mb-8">', '<GlassCard className="mb-8" id="career-progression" style={{ order: sectionOrder.indexOf(\'career-progression\') }}>');
code = code.replace('<div id="skill-vector-engine">', '<div id="skill-vector-engine" style={{ order: sectionOrder.indexOf(\'skill-vector-engine\') }}>');
code = code.replace('<GlassCard className="lg:col-span-8 p-0 overflow-hidden">', '<GlassCard className="lg:col-span-8 p-0 overflow-hidden" id="optimization-plan" style={{ order: sectionOrder.indexOf(\'optimization-plan\') }}>');
code = code.replace('<div className="mb-8" id="career-simulator">', '<div className="mb-8" id="career-simulator" style={{ order: sectionOrder.indexOf(\'career-simulator\') }}>');

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
