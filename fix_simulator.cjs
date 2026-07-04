const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              {/* Career Path Simulator */}
              {result.careerTrajectories && result.careerTrajectories.length > 0 && (
                <div className="mb-8" id="career-simulator" style={{ order: sectionOrder.indexOf('career-simulator') }}>
                  <GlassCard className="p-8 md:p-12 border-t-4 border-t-indigo-500 bg-gradient-to-b from-indigo-500/5 to-transparent">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <TrendingUp className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest">Career Path Simulator</h2>
                        <p className="text-indigo-400/80 text-xs font-bold uppercase tracking-[0.2em]">AI-Generated Trajectories</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-indigo-500/20">
                      {result.careerTrajectories.map((traj, idx) => (
                        <div key={\`traj-\${idx}\`} className="relative pl-12">
                          <div className="absolute left-[-1px] top-1.5 h-10 w-10 rounded-full bg-brand-deep border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <span className="text-[10px] font-black text-indigo-400">{idx + 1}</span>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-black text-white">{traj.title}</h3>
                              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black text-indigo-400 tracking-widest uppercase">
                                {traj.timeline}
                              </span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                              <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Zap className="h-3.5 w-3.5" /> Required Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {traj.requiredSkills.map((skill, sIdx) => (
                                    <span key={sIdx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-300">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Award className="h-3.5 w-3.5" /> Recommended Certifications
                                </h4>
                                <ul className="space-y-2">
                                  {traj.requiredCertifications.map((cert, cIdx) => (
                                    <li key={cIdx} className="text-xs text-slate-300 flex items-start gap-2">
                                      <span className="text-indigo-400 mt-0.5">•</span> {cert}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}`;

code = code.replace(target, `{/* Disabled */}`);
fs.writeFileSync('src/App.tsx', code);
console.log("Done");
