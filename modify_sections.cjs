const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the start of Scoring Infrastructure
const startIdx = code.indexOf('{/* Scoring Infrastructure */}');
// Find Floating Action Buttons
const endIdx = code.indexOf('{/* Floating Action Buttons */}');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

let before = code.substring(0, startIdx);
let middle = code.substring(startIdx, endIdx);
let after = code.substring(endIdx);

// Add IDs
middle = middle.replace('<div className="grid md:grid-cols-2 gap-8 mb-8">', '<div id="scoring-infrastructure" className="grid md:grid-cols-2 gap-8 mb-8">');
middle = middle.replace('{/* Skill Cloud Visualizer & Gap Chart */}', '{/* Skill Cloud Visualizer & Gap Chart */}\n              <div id="skill-vector-engine">');
// We need to close this div before the next section
middle = middle.replace('{/* Market Viability Framework */}', '</div>\n              {/* Market Viability Framework */}\n              <div id="market-viability">');
middle = middle.replace('{/* ATS Simulation Engine */}', '</div>\n              {/* ATS Simulation Engine */}\n              <div id="ats-simulation">');
middle = middle.replace('{/* Executive Directives */}', '</div>\n              {/* Executive Directives */}\n              <div id="executive-directives">');
// close the last one
middle += '</div>\n              ';

// Wrap with !isExecutiveMode
const executiveSummary = `
              {isExecutiveMode && (
                <div className="mb-8">
                  <GlassCard className="p-8 md:p-12 border-t-4 border-t-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Briefcase className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest">Executive Summary</h2>
                        <p className="text-amber-400/80 text-xs font-bold uppercase tracking-[0.2em]">High-Level Narrative Analysis</p>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-teal-400" /> Bottom Line Recommendation
                        </h3>
                        <p className="text-slate-300 leading-relaxed text-sm">
                          {result.executiveSummary || \`Based on an overall match of \${result.overallScore}%, this candidate shows strong potential for the \${result.careerPath.topRole} role. The resume demonstrates \${result.skillsMatch}% skill alignment with the job description.\`}
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400" /> Core Strengths
                          </h3>
                          <ul className="space-y-3">
                            {result.skillGapReport.filter(sg => sg.importance.toLowerCase().includes("critical") && sg.status === "present").slice(0, 3).map((sg, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                </div>
                                <span className="text-xs text-slate-300">{sg.skill}</span>
                              </li>
                            ))}
                            {result.skillGapReport.filter(sg => sg.importance.toLowerCase().includes("critical") && sg.status === "present").length === 0 && (
                              <li className="text-xs text-slate-500 italic">No critical matching skills identified.</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-400" /> Critical Gaps
                          </h3>
                          <ul className="space-y-3">
                            {result.skillGapReport.filter(sg => sg.importance.toLowerCase().includes("critical") && sg.status === "missing").slice(0, 3).map((sg, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="h-4 w-4 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                </div>
                                <span className="text-xs text-slate-300">{sg.skill}</span>
                              </li>
                            ))}
                             {result.skillGapReport.filter(sg => sg.importance.toLowerCase().includes("critical") && sg.status === "missing").length === 0 && (
                              <li className="text-xs text-slate-500 italic">No critical missing skills identified.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}
`;

const wrappedMiddle = `
              {!isExecutiveMode && (
                <>
${middle}
                </>
              )}
`;

fs.writeFileSync('src/App.tsx', before + executiveSummary + wrappedMiddle + after);
console.log("Done");
