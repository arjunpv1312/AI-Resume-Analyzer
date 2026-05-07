import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import DOMPurify from 'dompurify';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  BrainCircuit, 
  Zap, 
  Target, 
  Layout, 
  TrendingUp,
  Award,
  Sparkles,
  Search,
  RefreshCw,
  Info,
  Layers,
  Fingerprint,
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar,
  Tooltip as RechartsTooltip
} from 'recharts';

interface AnalysisResult {
  overallScore: number;
  atsCompatibility: number;
  skillsMatch: number;
  foundSkills: string[];
  missingSkills: string[];
  careerPath: {
    topRole: string;
    confidence: number;
    alternatives: { role: string; match: number }[];
  };
  careerTimeline?: {
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  atsAnalysis: {
    formattingScore: number;
    keywordDensity: number;
    recommendations: string[];
    topResumeKeywords?: string[];
    jobKeywordsFound?: string[];
    jobKeywordsMissing?: string[];
    jobKeywordDensity?: number;
  };
  skillGapReport: { skill: string; importance: string }[];
  sectionsFound: string[];
  summary: string;
  suggestions: string[];
}

interface AnalysisHistoryItem {
  id: string;
  date: string;
  fileName: string;
  jobDescription?: string;
  result: AnalysisResult;
}

const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`glass-card p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const ScoringCircle = ({ score, label, color, delay, tooltip }: { score: number, label: string, color: string, delay: number, tooltip?: React.ReactNode }) => {
  const data = [{ name: 'Score', value: score, fill: color }];
  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="h-32 w-32 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" cy="50%" 
            innerRadius="70%" outerRadius="100%" 
            barSize={10} 
            data={data}
            startAngle={90}
            endAngle={90 - (3.6 * score)}
          >
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.05)' }}
              dataKey="value"
              cornerRadius={5}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
            className="text-2xl font-bold font-display"
          >
            {score}%
          </motion.span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {tooltip && (
          <div className="group relative cursor-pointer">
            <Info className="h-3.5 w-3.5 text-slate-500 hover:text-white transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-slate-800 text-white text-[10px] font-medium p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl leading-relaxed text-left">
              {tooltip}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SkillCloud = ({ found, missing }: { found: string[], missing: string[] }) => {
  // We use randomly assigned but deterministic-looking weights to simulate "importance/frequency"
  const combined = [
    ...found.map((s, i) => ({ text: s, type: 'found', weight: 1 - (i / found.length) * 0.4 })),
    ...missing.map((s, i) => ({ text: s, type: 'missing', weight: 1 - (i / missing.length) * 0.4 }))
  ].sort((a,b) => a.text.localeCompare(b.text)).sort(() => Math.random() - 0.5);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-8 px-4 relative overflow-hidden">
      {/* Background ambient glow matching the cloud */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-rose-500/5 blur-3xl pointer-events-none" />
      {combined.map((skill, i) => {
         const size = Math.max(10, Math.floor(skill.weight * 24));
         return (
         <motion.span 
           key={`${skill.text}-${i}`}
           initial={{ opacity: 0, scale: 0 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ delay: i * 0.03, type: 'spring' }}
           className={`inline-block rounded-full px-4 py-2 ${skill.type === 'found' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'} font-black uppercase tracking-widest hover:scale-110 hover:z-10 transition-transform cursor-default relative`}
           style={{
             fontSize: `${size}px`,
           }}
           whileHover={{ scale: 1.15 }}
         >
           {skill.text}
         </motion.span>
         );
      })}
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSessionPurged, setIsSessionPurged] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isPurgePromptOpen, setIsPurgePromptOpen] = useState(false);

  const linkedinCopy = `🚀 Just analyzed my resume with AI Resume Pro! Accurate ATS scores, skill gap analysis, and tailored career roadmap insights. Check it out to level up your professional profile! 📄✨ 

#AI #CareerDevelopment #ResumeTips #FutureOfWork`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Load history from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('resume_analysis_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newResult: AnalysisResult, currentFile: File, jd: string) => {
    const newItem: AnalysisHistoryItem = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date: new Date().toISOString(),
      fileName: currentFile.name,
      jobDescription: jd,
      result: newResult
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      localStorage.setItem('resume_analysis_history', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    setCompareIds(prev => prev.filter(cid => cid !== id));
    localStorage.setItem('resume_analysis_history', JSON.stringify(updated));
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id]; // Shift and add
      }
      return [...prev, id];
    });
  };

  const purgeSession = () => {
    // Explicitly unsetting all sensitive variables for garbage collection
    setFile(null);
    setResult(null);
    setJobDescription('');
    setError(null);
    setIsSessionPurged(true);
    setIsPurgePromptOpen(false);
    
    // Attempt to hint manual GC if available (non-standard but useful in some envs)
    if ((window as any).gc) {
      try { (window as any).gc(); } catch(e) {}
    }
    
    setTimeout(() => setIsSessionPurged(false), 3000);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const analyzeResume = async () => {
    if (!file) {
      setError("Resume file is required component for analysis.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setElapsedTime(0); 
    setAnalysisStep('Initiating neural gateway...');
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      // 0. Pre-flight health check
      const healthCheck = await fetch('/api/health').catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.warn("Neural gateway appears unresponsive. Attempting direct sync anyway...");
      } else {
        const healthData = await healthCheck.json().catch(() => ({}));
        console.log("Neural gateway active:", healthData.timestamp);
      }

      setAnalysisStep('Formatting document for structural extraction...');
      // 1. Sanitize Inputs
      const cleanJD = DOMPurify.sanitize(jobDescription);
      
      // 2. Extract text from server
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', cleanJD);
      if (linkedinUrl) {
        formData.append('linkedinUrl', DOMPurify.sanitize(linkedinUrl));
      }
      
      setAnalysisStep('Parsing resume text via server-side engine...');
      const extractionResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!extractionResponse.ok) {
        const contentType = extractionResponse.headers.get("content-type");
        const handledBy = extractionResponse.headers.get("X-Handled-By");
        console.error(`Fetch failed. Handled by: ${handledBy}, Content-Type: ${contentType}`);

        if (contentType && contentType.includes("application/json")) {
          const errorData = await extractionResponse.json();
          throw new Error(errorData.error || errorData.details || 'Cognitive extraction failed.');
        } else {
          const textError = await extractionResponse.text();
          console.error("Non-JSON error response from server:", textError.substring(0, 500));
          throw new Error(`Server abstraction error (${extractionResponse.status}). The neural gate returned an incompatible format.`);
        }
      }

      const contentType = extractionResponse.headers.get("content-type");
      const handledBy = extractionResponse.headers.get("X-Handled-By");
      
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await extractionResponse.text();
        console.error(`Incompatible format from ${handledBy || 'Unknown Engine'}. CT: ${contentType}. Body:`, textError.substring(0, 200));
        throw new Error("Neural response synchronization failed: Invalid data format received. Try a different file format.");
      }

      setAnalysisStep('Running deterministic ATS rule simulations...');
      const { text, pageCount, atsMetadata } = await extractionResponse.json();

      setAnalysisStep('Initiating high-dimensional intelligence model generation...');
      // API call to the backend for AI generation
      const analysisResponse = await fetch('/api/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          jobDescription,
          pageCount,
          atsMetadata,
          linkedinUrl
        })
      });

      setAnalysisStep('Parsing cognitive matrices output...');

      if (!analysisResponse.ok) {
        let errMessage = 'Intelligence extraction failed on server.';
        try {
          const errData = await analysisResponse.json();
          if (errData.details && errData.details.includes('API key not valid')) {
            errMessage = 'Your Gemini API Key is invalid or has been revoked. Please update it in the settings / environment variables.';
          } else if (errData.details && (errData.details.includes('503') || errData.details.includes('high demand'))) {
            errMessage = 'The AI model is currently experiencing high demand. Please try again in a few moments.';
          } else {
            errMessage = errData.error || errMessage;
          }
        } catch (e) {
           // fallback to default error
        }
        throw new Error(errMessage);
      }

      let analysisJson = await analysisResponse.text();

      if (!analysisJson) throw new Error("AI returned empty response");
      
      // Clean potential markdown
      analysisJson = analysisJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const startIdx = analysisJson.indexOf('{');
      const endIdx = analysisJson.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) {
        console.error("Malformed AI response:", analysisJson);
        throw new Error('Parsing error: Intelligence component returned invalid format.');
      }
      analysisJson = analysisJson.substring(startIdx, endIdx + 1);
      
      const analysis: AnalysisResult = JSON.parse(analysisJson);
      
      // Inject rule-based keyword data
      if (analysis.atsAnalysis) {
        analysis.atsAnalysis.topResumeKeywords = atsMetadata.topResumeKeywords;
        analysis.atsAnalysis.jobKeywordsFound = atsMetadata.jobKeywordsFound;
        analysis.atsAnalysis.jobKeywordsMissing = atsMetadata.jobKeywordsMissing;
        analysis.atsAnalysis.jobKeywordDensity = atsMetadata.keywordDensity;
      }
      
      setResult(analysis);
      saveToHistory(analysis, file, jobDescription);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "Interruption in neural processing. Please retry.");
    } finally {
      setIsAnalyzing(false);
      clearInterval(timer);
    }
  };

  const exportToExcel = async () => {
    if (!result) return;
    const XLSX = await import('xlsx');
    const data = [
      { Category: 'Overall Intelligence Score', Value: result.overallScore },
      { Category: 'ATS Engine Compatibility', Value: result.atsCompatibility },
      { Category: 'Skill Vector Density', Value: result.skillsMatch },
      { Category: 'Formatting Health', Value: result.atsAnalysis.formattingScore },
      { Category: 'Primary Trajectory', Value: result.careerPath.topRole },
      ...result.skillGapReport.map(sg => ({ Category: `Gap: ${sg.skill}`, Value: sg.importance }))
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AI_Report");
    XLSX.writeFile(wb, "Autonomous_Career_Report.xlsx");
  };

  return (
    <div className="min-h-screen selection:bg-teal-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-accent/10 blur-[150px] animate-pulse transition-opacity duration-1000"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-purple/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-brand-glow/5 blur-[150px] mix-blend-screen -z-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Modern Navigation */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-[30px] border-b border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-glow to-brand-accent flex items-center justify-center shadow-[0_0_24px_rgba(0,255,204,0.3)] border border-white/20">
              <BrainCircuit className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black font-display tracking-tight glow-text uppercase">AI Resume Pro</span>
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1">ADVANCED VERSION</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              History {history.length > 0 && `(${history.length})`}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence>
          {isLinkedInModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-xl w-full bg-brand-deep rounded-3xl border border-white/10 p-10 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">LinkedIn Post Content</h3>
                  <button onClick={() => setIsLinkedInModalOpen(false)} className="text-slate-500 hover:text-white">
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-slate-300 text-sm italic">
                  {linkedinCopy}
                </div>
                <button 
                  onClick={() => copyToClipboard(linkedinCopy)}
                  className="w-full btn-primary py-4 text-xs"
                >
                  Copy to Clipboard
                </button>
              </motion.div>
            </div>
          )}

          {isPurgePromptOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-brand-deep rounded-3xl border border-rose-500/30 p-10 space-y-6 shadow-2xl shadow-rose-500/20"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-rose-400 font-display uppercase tracking-widest">Confirm Purge</h3>
                    </div>
                  </div>
                  <button onClick={() => setIsPurgePromptOpen(false)} className="text-slate-500 hover:text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Are you sure you want to permanently delete all session data? This action cannot be undone and you will lose all analysis history and uploaded files.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsPurgePromptOpen(false)}
                    className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={purgeSession}
                    className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-rose-500/10"
                  >
                    Delete Data
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isHistoryOpen && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed inset-y-0 right-0 w-96 bg-brand-deep/95 backdrop-blur-3xl border-l border-white/5 z-[60] shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-400" />
                  Analysis Archive
                </h3>
                <button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600">
                   <Info className="h-12 w-12 mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No archival data found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, mapIdx) => (
                    <div 
                      key={item.id + '-' + mapIdx}
                      onClick={() => {
                        setResult(item.result);
                        setIsHistoryOpen(false);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer group relative
                        ${compareIds.includes(item.id) 
                          ? 'bg-teal-500/10 border-teal-500/50' 
                          : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(item.date).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => toggleCompare(item.id, e)}
                            className={`h-6 w-6 rounded flex items-center justify-center transition-colors
                              ${compareIds.includes(item.id) ? 'bg-teal-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                          >
                            <Target className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={(e) => deleteFromHistory(item.id, e)}
                            className="h-6 w-6 rounded bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-black text-white truncate mb-2">{item.fileName}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-teal-400">{item.result.overallScore}%</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Match</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-400">{item.result.skillsMatch}%</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Skills</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {compareIds.length >= 2 && (
                <div className="sticky bottom-0 left-0 right-0 pt-8 mt-8 border-t border-white/5 bg-brand-deep/95">
                  <button 
                    onClick={() => {
                      // We'll calculate a comparison result
                      const items = compareIds.map(id => history.find(h => h.id === id)).filter(Boolean);
                      if (items.length >= 2) {
                        // For simplicity, we just trigger UI view or we could create a "virtual" result
                        // But let's just alert the scores for now or open a simple comparison modal
                        // Better: Set a "comparison" mode state
                        setResult(null); // Clear main result view to show compare view if implemented
                      }
                    }}
                    className="w-full btn-primary py-4 text-[11px]"
                  >
                    Compare Selected Versions
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {compareIds.length >= 2 && !result && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[70] bg-brand-deep flex flex-col p-12 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black font-display text-white uppercase tracking-tighter">Delta Intelligence Comparison</h2>
                <button 
                  onClick={() => setCompareIds([])}
                  className="px-8 py-3 rounded-full border border-white/10 text-slate-300 font-black hover:bg-white/5 transition-all text-xs"
                >
                  Exit Comparison
                </button>
              </div>

              <div className={`grid gap-8 ${compareIds.length === 2 ? 'grid-cols-2' : compareIds.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {compareIds.map(id => history.find(h => h.id === id)).map((item, idx) => item && (
                  <GlassCard key={`gc-${idx}`} className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Version {String.fromCharCode(65 + idx)} - {new Date(item.date).toLocaleDateString()}</p>
                      <h3 className="text-xl font-black text-white truncate">{item.fileName}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Intelligence Score</p>
                        <p className="text-3xl font-black text-white font-display">{item.result.overallScore}%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">ATS Compatibility</p>
                        <p className="text-3xl font-black text-white font-display">{item.result.atsCompatibility}%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Skill Vector</p>
                        <p className="text-3xl font-black text-white font-display">{item.result.skillsMatch}%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Format Health</p>
                        <p className="text-3xl font-black text-white font-display">{item.result.atsAnalysis.formattingScore}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Core Summary</p>
                      <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-teal-500/20 pl-4">
                        "{item.result.summary}"
                      </p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Found Intelligence</p>
                      <div className="flex flex-wrap gap-2">
                        {item.result.foundSkills.slice(0, 10).map((s, i) => (
                          <span key={`fs-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Priority Gaps</p>
                      <div className="space-y-2">
                        {item.result.skillGapReport.slice(0, 3).map((gap, i) => (
                          <div key={`sgr-${i}`} className="flex justify-between items-center text-[10px] uppercase">
                            <span className="text-slate-400">{gap.skill}</span>
                            <span className={gap.importance === 'Critical' ? 'text-rose-400' : 'text-amber-400'}>{gap.importance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {isSessionPurged && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs"
            >
              <ShieldCheck className="h-5 w-5" />
              Memory Purged Successfully
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Hero Section */}
              <div className="text-center mb-16 relative">
                 <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/5 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-[0.3em]"
                 >
                   <EyeOff className="h-3 w-3" />
                   Zero-Storage Environment Enabled
                 </motion.div>
                 <h2 className="text-6xl font-black font-display text-white mb-6 tracking-tighter leading-tight">
                   Optimize Your <br/>
                   <span className="glow-text-accent">Professional Identity</span>
                 </h2>
                 <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                   Advanced intelligence layer for career trajectory mapping. Our ATS-centric engine identifies efficiency gaps and predicts optimal career paths with high-fidelity accuracy.
                 </p>
              </div>

              {/* Upload Interface */}
              <div className="grid md:grid-cols-2 gap-8">
                <GlassCard delay={0.1}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Layers className="h-4 w-4 text-teal-400" />
                       Source Upload
                    </h3>
                  </div>
                  <div 
                    {...getRootProps()} 
                    className={`group relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer text-center h-40 flex items-center justify-center mb-4
                      ${isDragActive ? 'border-teal-400 bg-teal-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-6 w-6 text-teal-400" />
                      </div>
                      {file ? (
                        <div className="space-y-1">
                          <p className="text-teal-400 font-black text-sm uppercase tracking-tight">{file.name}</p>
                          <p className="text-slate-500 text-[10px] font-bold">READY FOR INGESTION</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-slate-300 font-bold text-sm tracking-tight">Drop Resume Source</p>
                          <p className="text-slate-600 text-[10px] font-black tracking-widest uppercase">PDF • DOCX • TXT</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-white/5 pt-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">LinkedIn Profile (Optional)</label>
                     <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-teal-500/50 transition-colors">
                        <div className="px-4 flex items-center justify-center bg-white/5 border-r border-white/10">
                           <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="16" height="16" alt="LI" className="opacity-80" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          className="w-full bg-transparent px-4 py-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none font-medium"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                        />
                     </div>
                  </div>
                </GlassCard>

                <GlassCard delay={0.2}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Target className="h-4 w-4 text-teal-400" />
                       Match Context
                    </h3>
                  </div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target requirements to calibrate the intelligence engine..."
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-teal-500/50 transition-all resize-none font-medium leading-relaxed"
                  />
                </GlassCard>
              </div>

              <div className="mt-16 text-center">
                <button 
                  id="initiateAnalysis"
                  onClick={analyzeResume}
                  disabled={!file || isAnalyzing}
                  className={`btn-primary px-16 py-5 text-sm font-black uppercase tracking-[0.2em] flex flex-col items-center gap-1 mx-auto
                    ${(!file || isAnalyzing) ? 'opacity-50 grayscale' : ''}`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Processing: {elapsedTime.toFixed(1)}s</span>
                      </div>
                      <span className="text-[10px] text-teal-300 tracking-widest block opacity-80 mt-1 uppercase">{analysisStep}</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Zap className="h-5 w-5 fill-current shadow-glow" />
                      Analyze Identity
                    </div>
                  )}
                </button>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 flex items-center justify-center gap-3 text-rose-400 bg-rose-500/5 px-6 py-4 rounded-2xl border border-rose-500/20 font-bold text-sm"
                  >
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Header Controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                  <h2 className="text-4xl font-black font-display text-white tracking-tight">Executive Summary</h2>
                  <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-2">Analysis For: {file?.name}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsLinkedInModalOpen(true)}
                    className="px-8 py-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-3 shadow-xl"
                  >
                    <Layers className="h-4 w-4" /> Share On LinkedIn
                  </button>
                  <button 
                    onClick={() => { setResult(null); setFile(null); }}
                    className="px-8 py-3 rounded-full border border-white/10 text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-3 shadow-xl"
                  >
                    <RefreshCw className="h-4 w-4" /> Reset Stream
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="btn-primary py-3 px-8 text-[11px] flex items-center gap-3"
                  >
                    <Download className="h-4 w-4" /> Export Assets
                  </button>
                </div>
              </div>

              {/* Scoring Infrastructure */}
              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard className="col-span-1 flex flex-col items-center justify-center border-teal-500/20">
                  <ScoringCircle 
                    score={result.overallScore} 
                    label="Overall Match" 
                    color="#14b8a6" 
                    delay={0.1} 
                    tooltip={
                      <>
                        <strong className="text-teal-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">Overall Match</strong>
                        This composite score represents your holistic fitness for the role, combining ATS formatting health, keyword density, and experiential overlap.<br/><br/>
                        <span className="text-slate-300 block mb-1"><strong className="text-white">90-100%:</strong> Outstanding fit</span>
                        <span className="text-slate-300 block mb-1"><strong className="text-white">70-89%:</strong> Strong fit</span>
                        <span className="text-slate-300 block mb-1"><strong className="text-white">&lt;70%:</strong> Needs optimization</span>
                      </>
                    }
                  />
                </GlassCard>
                
                <GlassCard className="col-span-2">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Quick Overview</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                      <CheckCircle2 className="h-3 w-3" />
                      Scan Validated
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    {[
                      { 
                        label: "ATS Score", score: result.atsCompatibility, color: "#14b8a6", desc: "System compatibility",
                        tooltip: (
                           <>
                             <strong className="text-teal-400 block mb-3 uppercase tracking-widest text-xs border-b border-white/10 pb-2">Score Calculation</strong>
                             <div className="space-y-4">
                               <div>
                                 <div className="flex justify-between mb-1.5"><span className="text-slate-300">Keyword Matching</span><span className="text-white font-black">{result.atsAnalysis.keywordDensity}%</span></div>
                                 <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] rounded-full" style={{ width: `${result.atsAnalysis.keywordDensity}%` }} /></div>
                               </div>
                               <div>
                                 <div className="flex justify-between mb-1.5"><span className="text-slate-300">Formatting</span><span className="text-white font-black">{result.atsAnalysis.formattingScore}%</span></div>
                                 <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] rounded-full" style={{ width: `${result.atsAnalysis.formattingScore}%` }} /></div>
                               </div>
                               <div>
                                 <div className="flex justify-between mb-1.5"><span className="text-slate-300">Section Headers</span><span className="text-white font-black">{Math.round((result.atsAnalysis.formattingScore + result.atsCompatibility) / 2)}%</span></div>
                                 <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)] rounded-full" style={{ width: `${Math.round((result.atsAnalysis.formattingScore + result.atsCompatibility) / 2)}%` }} /></div>
                               </div>
                             </div>
                           </>
                        )
                      },
                      { 
                        label: "Skills Match", score: result.skillsMatch, color: "#0ea5e9", desc: "Role alignment",
                        tooltip: (
                            <>
                              <strong className="text-sky-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">Skills Match</strong>
                               The overlap between your extracted skills and the job's core requirements. High scores indicate strong technical and domain alignment.
                            </>
                        )
                      },
                      { 
                        label: "Keywords", score: result.atsAnalysis.keywordDensity, color: "#10b981", desc: "Density factor" 
                      },
                      { 
                        label: "Formatting", score: result.atsAnalysis.formattingScore, color: "#f59e0b", desc: "Visual health",
                        tooltip: (
                            <>
                              <strong className="text-amber-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">Formatting Health</strong>
                               Assesses how easily an ATS parser can process your resume. Penalizes complex layouts, graphics, tables, or unreadable fonts.
                            </>
                        )
                      }
                    ].map((m, i) => (
                      <div key={`m-${i}`} className="space-y-3">
                        <div className="flex justify-between items-end">
                           <div className="flex items-center gap-2">
                             <div>
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{m.label}</span>
                               <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{m.desc}</span>
                             </div>
                             {m.tooltip && (
                               <div className="group relative cursor-pointer">
                                 <Info className="h-4 w-4 text-slate-400 hover:text-white transition-colors" />
                                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-slate-800 text-white text-[10px] font-medium p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl leading-relaxed">
                                   {m.tooltip}
                                   <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
                                 </div>
                               </div>
                             )}
                           </div>
                           <span className="text-xl font-black text-white font-display leading-none">{m.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${m.score}%` }} 
                            className="h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]" 
                            style={{ backgroundColor: m.color }}
                            transition={{ delay: 0.5 + (i * 0.1), duration: 1.5, ease: "easeOut" }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Career Progression Timeline */}
              {result.careerTimeline && result.careerTimeline.length > 0 && (
                <GlassCard className="mb-8">
                  <div className="flex flex-col items-center justify-center space-y-2 mb-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">Career Progression Timeline</h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Trajectory extracted from your resume</p>
                  </div>
                  
                  <div className="relative pl-4 md:pl-8 max-w-4xl mx-auto">
                    <div className="absolute left-[27px] md:left-[43px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-500 via-sky-500 to-transparent opacity-30"></div>
                    
                    <div className="space-y-12">
                      {result.careerTimeline.map((item, idx) => (
                        <div key={`timeline-${idx}`} className="relative pl-12 md:pl-16">
                          {/* Timeline dot */}
                          <div className="absolute left-[-5px] md:left-[11px] top-1 h-6 w-6 rounded-full bg-[#050510] border-2 border-teal-500 flex items-center justify-center shadow-[0_0_10px_rgba(20,184,166,0.3)] z-10">
                            <div className="h-2 w-2 rounded-full bg-teal-400"></div>
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-2">
                             <h4 className="text-lg md:text-xl font-black text-white">{item.role}</h4>
                             <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 whitespace-nowrap">{item.duration}</span>
                          </div>
                          
                          <p className="text-sm font-bold text-slate-400 mb-4">{item.company}</p>
                          
                          <ul className="space-y-2">
                            {item.highlights.map((highlight, hIdx) => (
                              <li key={`hl-${hIdx}`} className="text-[12px] text-slate-300 leading-relaxed font-medium flex items-start gap-3">
                                <span className="text-teal-500 mt-1.5 opacity-50">•</span>
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Skill Cloud Visualizer */}
              <GlassCard>
                <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">Skill Landscape Profile</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Visual distribution of matched & missing capabilities</p>
                </div>
                <SkillCloud found={result.foundSkills} missing={result.skillGapReport.map(g => g.skill)} />
              </GlassCard>

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Simplified Header with Core Strengths & Weaknesses */}
                <GlassCard className="lg:col-span-12">
                   <div className="grid md:grid-cols-3 gap-8">
                     <div className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20">
                        <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <ShieldCheck className="h-3.5 w-3.5" /> Core Strength
                        </h4>
                        <p className="text-sm text-white font-black uppercase mb-1">Excellent {result.foundSkills[0] || 'Domain'} Exposure</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Your experience in {result.foundSkills.slice(0, 3).join(', ')} provides a strong foundation for this role.</p>
                     </div>
                     <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Zap className="h-3.5 w-3.5" /> High Priority Fix
                        </h4>
                        <p className="text-sm text-white font-black uppercase mb-1">Missing {result.skillGapReport[0]?.skill || 'Core Keywords'}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">The recruiter will look for {result.skillGapReport[0]?.skill}. Add this to your summary or experience.</p>
                     </div>
                     <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Target className="h-3.5 w-3.5" /> Target Role
                        </h4>
                        <p className="text-sm text-white font-black uppercase mb-1">{result.careerPath.topRole}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">You are a {Math.round(result.careerPath.confidence * 100)}% match for this trajectory based on current assets.</p>
                     </div>
                   </div>
                </GlassCard>

                {/* Main Improvement Checklist */}
                <GlassCard className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-teal-400" />
                        Step-by-Step Improvement Plan
                     </h3>
                  </div>
                  <div className="space-y-4">
                    {[...result.atsAnalysis.recommendations, ...result.suggestions].slice(0, 5).map((step, i) => (
                      <div key={`rec-${i}`} className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all items-center group">
                        <div className="h-10 w-10 shrink-0 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-500 font-black text-xs group-hover:border-teal-500 group-hover:text-teal-400 transition-all">
                          {i + 1}
                        </div>
                        <p className="text-slate-300 font-medium text-[13px] leading-relaxed italic">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Sidebar Details */}
                <div className="lg:col-span-4 space-y-8">
                  <GlassCard>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Missing Skills</h3>
                    <div className="space-y-4">
                      {result.skillGapReport.map((gap, i) => (
                        <div key={`gap-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                           <span className="text-[11px] font-black text-white uppercase">{gap.skill}</span>
                           <span className={`text-[9px] font-black px-2 py-1 rounded ${gap.importance === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'} uppercase`}>{gap.importance}</span>
                        </div>
                      ))}
                      {result.skillGapReport.length === 0 && (
                        <p className="text-[11px] text-slate-500 italic">No significant missing skills detected.</p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Keyword Analysis</h3>
                       {result.atsAnalysis.jobKeywordsFound && result.atsAnalysis.jobKeywordsMissing && (
                         <div className="text-xs font-black text-white">
                           {Math.round((result.atsAnalysis.jobKeywordsFound.length / (result.atsAnalysis.jobKeywordsFound.length + result.atsAnalysis.jobKeywordsMissing.length)) * 100) || 0}% Match
                         </div>
                       )}
                    </div>
                    
                    {result.atsAnalysis.jobKeywordsFound && result.atsAnalysis.jobKeywordsMissing && (
                      <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden mb-5">
                        <div 
                          className="h-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${Math.round((result.atsAnalysis.jobKeywordsFound.length / (result.atsAnalysis.jobKeywordsFound.length + result.atsAnalysis.jobKeywordsMissing.length)) * 100) || 0}%` 
                          }} 
                        />
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[9px] font-black text-teal-500 uppercase mb-2">Resume Top Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                           {result.atsAnalysis.topResumeKeywords?.slice(0,10).map((kw, i) => (
                              <span key={`kw-${i}`} className="text-[10px] font-medium px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded text-teal-300">{kw}</span>
                           ))}
                        </div>
                      </div>
                      
                      {result.atsAnalysis.jobKeywordsFound && result.atsAnalysis.jobKeywordsFound.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase mb-2">Matched Job Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                             {result.atsAnalysis.jobKeywordsFound?.map((kw, i) => (
                                <span key={`jkf-${i}`} className="text-[10px] font-medium px-2 py-1 bg-white/5 border border-white/10 rounded text-slate-300">{kw}</span>
                             ))}
                          </div>
                        </div>
                      )}

                      {result.atsAnalysis.jobKeywordsMissing && result.atsAnalysis.jobKeywordsMissing.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-black text-rose-400 uppercase mb-2">Missing Job Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                             {result.atsAnalysis.jobKeywordsMissing?.slice(0, 8).map((kw, i) => (
                                <span key={`jkm-${i}`} className="text-[10px] font-medium px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-rose-300">{kw}</span>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Expert Summary</h3>
                    <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-teal-500/20 pl-4">
                       "{result.summary}"
                    </p>
                  </GlassCard>
                </div>
              </div>

              {/* Floating Action Buttons */}
              <div className="fixed bottom-12 right-12 z-50 flex flex-col gap-4">
                 <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={exportToExcel}
                    className="h-16 w-16 rounded-2xl bg-teal-500 text-white shadow-2xl shadow-teal-500/20 flex items-center justify-center group relative overflow-hidden active:scale-95 transition-all"
                  >
                    <Download className="h-7 w-7 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-20 border-t border-white/5 text-center mt-20 bg-brand-deep/20 relative">
        <div className="flex items-center justify-center gap-3 mb-6 opacity-40">
           <BrainCircuit className="h-5 w-5 text-teal-400" />
           <span className="font-display font-black text-sm uppercase tracking-widest text-white">AI Resume Pro</span>
        </div>
        <div className="flex justify-center mb-8">
           <button 
             onClick={() => setIsPurgePromptOpen(true)}
             className="px-6 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all transition-duration-300 text-[10px] font-black uppercase tracking-widest"
           >
             Purge Session
           </button>
        </div>
        <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-6">
           <a href="#" className="hover:text-teal-400 transition-colors">Privacy Priority</a>
           <a href="#" className="hover:text-teal-400 transition-colors">Secure Processing</a>
           <a href="#" className="hover:text-teal-400 transition-colors">Session Only</a>
        </div>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 Professional Career Intelligence. All data processed locally for this session.</p>
      </footer>
      
      {/* Floating Lingering LinkedIn Connect */}
      <motion.a 
        href="https://www.linkedin.com/in/arjun-pv1312" 
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 1,
        }}
        className="fixed bottom-8 left-8 z-[200] group flex items-center justify-start gap-0 overflow-hidden bg-[#0A66C2] text-white h-14 w-14 rounded-full shadow-[0_8px_30px_rgba(10,102,194,0.4)] hover:w-48 hover:shadow-[0_8px_40px_rgba(10,102,194,0.6)] transition-[width,box-shadow] duration-500 ease-out border border-white/10"
        whileHover={{ 
          scale: 1.05,
          y: -5
        }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0" />
        <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 z-10">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="22" height="22" className="rounded-sm brightness-110" alt="LinkedIn" />
        </div>
        <span className="font-display font-black uppercase tracking-widest text-[10px] whitespace-nowrap opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-500 z-10 pr-6">
          Let's Connect
        </span>
      </motion.a>
    </div>
  );
}
