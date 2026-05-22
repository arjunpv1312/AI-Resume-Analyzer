import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
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
  Trash2,
  ChevronDown,
  ChevronUp,
  XCircle,
  Copy,
  Check,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface AnalysisResult {
  overallScore: number;
  atsCompatibility: number;
  skillsMatch: number;
  formattingHealthScore?: number;
  careerTrajectoryFitScore?: number;
  foundSkills: string[];
  missingSkills: string[];
  improvementPlan?: {
    missingSkillsToHighlight: string[];
    resumeHeadlineUpdates: string[];
    recommendedCertifications: string[];
    projectsToHighlight: string[];
    formattingFixes: string[];
  };
  careerPath: {
    topRole: string;
    confidence: number;
    alternatives: { role: string; match: number; reasoning?: string }[];
  };
  careerTimeline?: {
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  linkedinComparison?: {
    hasLinkedIn: boolean;
    resumeHeadline: string;
    linkedinHeadline: string;
    matchAnalysis: string;
    missingFromResume: string[];
    missingFromLinkedIn: string[];
  };
  atsAnalysis: {
    formattingScore: number;
    keywordDensity: number;
    bulletPointQualityScore?: number;
    recommendations: string[];
    topResumeKeywords?: string[];
    jobKeywordsFound?: string[];
    jobKeywordsMissing?: string[];
    jobKeywordDensity?: number;
    keywordOptimizations?: { keyword: string; suggestedPhrases: string[] }[];
  };
  skillGapReport: { skill: string; importance: string }[];
  sectionsFound: string[];
  sectionsDetailed?: { sectionName: string; summary: string }[];
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

const getScoreLevel = (score: number) => {
  if (score >= 90) return { label: 'Exceptional (Top 5%)', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
  if (score >= 80) return { label: 'Much Better', color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' };
  if (score >= 60) return { label: 'Moderate Fit', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
  return { label: 'Needs Opt', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' };
};

const ScoringCircle = ({ score, label, color, delay, tooltip }: { score: number, label: string, color: string, delay: number, tooltip?: React.ReactNode }) => {
  const data = [{ name: 'Score', value: score, fill: color }];
  const level = getScoreLevel(score);
  return (
    <div className="flex flex-col items-center justify-center relative w-full pt-4 pb-2">
      <div className="h-40 w-full max-w-[220px] relative overflow-hidden -mb-10">
        <ResponsiveContainer width="100%" height="200%">
          <RadialBarChart 
            cx="50%" cy="50%" 
            innerRadius="75%" outerRadius="100%" 
            barSize={14} 
            data={data}
            startAngle={180}
            endAngle={180 - (1.8 * score)}
          >
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.05)' }}
              dataKey="value"
              cornerRadius={8}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-16">
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.3, type: "spring", stiffness: 100 }}
            className="text-5xl font-black font-display flex flex-col items-center leading-none text-white tracking-tighter"
          >
            {score}<span className="text-[10px] text-slate-500 font-sans tracking-widest uppercase mt-2">out of 100</span>
          </motion.span>
        </div>
        <div className="absolute bottom-11 w-full flex justify-between px-6 text-[9px] font-black tracking-widest text-slate-600">
          <span>0</span>
          <span>100</span>
        </div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -z-10" />
      </div>
      
      <div className="mt-10 flex flex-col items-center justify-center gap-3">
        <motion.div 
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.5 }}
          className={`px-6 py-2 rounded-full border shadow-xl ${level.bg} ${level.border}`}
        >
          <span className={`text-xs font-black uppercase tracking-widest ${level.color}`}>
            Level: {level.label}
          </span>
        </motion.div>
        <div className="flex items-center gap-1.5 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          {tooltip && (
            <div className="group relative cursor-pointer">
              <Info className="h-3.5 w-3.5 text-slate-500 hover:text-white transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-[10px] font-medium p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl leading-relaxed text-left">
                {tooltip}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
              </div>
            </div>
          )}
        </div>
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isPurgePromptOpen, setIsPurgePromptOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [recommendationDetail, setRecommendationDetail] = useState<{explanation: string, examples: string[]} | null>(null);
  const [isGeneratingRecDetail, setIsGeneratingRecDetail] = useState(false);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

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

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      setError(`Unsupported file format or file too large. Please upload a PDF, DOCX, or TXT file.`);
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
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
      
      const generationResponse = await fetch('/api/generate-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          jobDescription,
          pageCount,
          atsMetadata,
          linkedinUrl
        }),
      });

      if (!generationResponse.ok) {
         const errorData = await generationResponse.json().catch(() => ({}));
         let errMessage = errorData.error || 'Intelligence processing failed.';
         if (errMessage.includes('API key is missing') || errMessage.includes('API_KEY_INVALID') || errMessage.includes('API key')) {
             errMessage = 'Your Gemini API Key is missing, invalid or has been revoked. Please update it in the settings / environment variables.';
         }
         throw new Error(errMessage);
      }

      setAnalysisStep('Parsing cognitive matrices output...');

      const analysis: AnalysisResult = await generationResponse.json();
      
      // Inject rule-based keyword data
      if (analysis.atsAnalysis) {
        analysis.atsAnalysis.topResumeKeywords = atsMetadata.topResumeKeywords;
        analysis.atsAnalysis.jobKeywordsFound = atsMetadata.jobKeywordsFound;
        analysis.atsAnalysis.jobKeywordsMissing = atsMetadata.jobKeywordsMissing;
        analysis.atsAnalysis.jobKeywordDensity = atsMetadata.keywordDensity;
        analysis.atsAnalysis.bulletPointQualityScore = atsMetadata.bulletPointQualityScore;
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

  const handleExpandRecommendation = async (recommendation: string) => {
    if (selectedRecommendation === recommendation) {
      setSelectedRecommendation(null);
      return;
    }
    
    setSelectedRecommendation(recommendation);
    setRecommendationDetail(null);
    setIsGeneratingRecDetail(true);
    
    try {
      const response = await fetch('/api/expand-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendation, jobDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMessage = errorData.error || 'Intelligence processing failed.';
        if (errMessage.includes('API key is missing') || errMessage.includes('API_KEY_INVALID') || errMessage.includes('API key')) {
            errMessage = 'Your Gemini API Key is missing, invalid or has been revoked. Please update it in the settings / environment variables.';
        }
        throw new Error(errMessage);
      }

      const parsedResponse = await response.json();

      setRecommendationDetail(parsedResponse);
    } catch (err) {
      console.error(err);
      setSelectedRecommendation(null);
    } finally {
      setIsGeneratingRecDetail(false);
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
          
          <div className="hidden md:flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <button 
              onClick={() => {
                 document.body.classList.toggle('theme-light');
              }}
              className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Toggle Theme
            </button>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Formatting Guide
            </button>
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
          {isGuideOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="max-w-4xl w-full bg-brand-deep rounded-3xl border border-white/10 p-8 md:p-12 space-y-8 my-auto"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-white font-display uppercase tracking-tighter mb-2">Resume Formatting Protocol</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Best Practices for ATS & Human Readability</p>
                  </div>
                  <button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* Typography & Spacing */}
                  <div className="space-y-6">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Typography & Layout</h4>
                      </div>
                      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-white block mb-1">Fonts:</strong> Avoid complex serif fonts. Stick to clean, modern sans-serif fonts like <strong>Helvetica, Arial, Calibri, Arial, or Roboto</strong>. Size should be <strong>10-12pt</strong> for body, and <strong>14-16pt</strong> for headers.
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Margins:</strong> Maintain <strong>0.5 to 1-inch margins</strong> on all sides to ensure it prints well and provides enough whitespace.
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Formats:</strong> Always export to <strong>PDF</strong>. Word documents (.docx) can break formatting depending on the ATS or the recruiter's system.
                        </div>
                      </div>
                    </div>

                    {/* Section Structuring */}
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400">
                          <Layout className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Section Structuring</h4>
                      </div>
                      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div><strong className="text-white">1. Contact Header:</strong> Name, Phone, Email, Location, LinkedIn/Portfolio. (No photos or exact street addresses).</div>
                        <div><strong className="text-white">2. Professional Summary:</strong> 2-3 sentences targeting the specific role. No objective statements.</div>
                        <div><strong className="text-white">3. Experience:</strong> Reverse-chronological order. Use 3-5 bullet points per role focusing on impact.</div>
                        <div><strong className="text-white">4. Skills:</strong> Group by category (e.g., Languages, Frameworks, Tools). Keep it scannable.</div>
                        <div><strong className="text-white">5. Education:</strong> Degree, Major, Institution, Year (Optional if 5+ years exp).</div>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Points & Visual Example */}
                  <div className="space-y-6">
                     <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                          <Zap className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">The XYZ Formula</h4>
                      </div>
                      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                        Google recruiters recommend the <strong>XYZ formula</strong> for achievements: "Accomplished [X] as measured by [Y], by doing [Z]."
                      </p>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-rose-500/5 border-l-2 border-rose-500 text-xs">
                          <span className="text-rose-400 font-bold uppercase text-[10px] block mb-1">Bad Example</span>
                          <span className="text-slate-400 line-through">Helped increase sales for the company.</span>
                        </div>
                        <div className="p-3 bg-emerald-500/5 border-l-2 border-emerald-500 text-xs text-slate-200">
                          <span className="text-emerald-400 font-bold uppercase text-[10px] block mb-1">Good Example</span>
                          "Grew Q3 revenue by 24% ($1.2M) mapping new sales territories and introducing a CRM automation pipeline."
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400">
                          <Target className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-teal-400 uppercase tracking-widest">ATS Anti-Patterns</h4>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-3">
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span><strong>2-Column Layouts:</strong> Many ATS parse left-to-right, completely scrambling two-column designs.</span>
                        </li>
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span><strong>Tables & Graphics:</strong> Exclude images, complex tables, progress bars, or skill rating circles.</span>
                        </li>
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span><strong>Headers/Footers:</strong> Don't put contact info in the document header/footer; some parsers ignore them.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

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
                <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-teal-500/50 before:to-transparent">
                  {history.map((item, mapIdx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mapIdx * 0.1 }}
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
                      <div className="absolute left-[-29px] top-5 w-3 h-3 rounded-full bg-[#0A0A15] border-2 border-teal-500/50 z-10 transition-colors group-hover:border-teal-400 group-hover:bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0)] group-hover:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                      
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
                    </motion.div>
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
                  className="mb-6 inline-flex items-center gap-2 group relative cursor-pointer px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                 >
                   <Lock className="h-3 w-3" />
                   Privacy-First Architecture • Zero Storage
                   <div className="absolute inset-x-0 bottom-full mb-3 hidden group-hover:block px-4 py-3 bg-[#0A0A15] border border-white/10 text-slate-300 text-[10px] font-medium normal-case tracking-normal rounded-xl shadow-2xl z-50 text-center w-64 mx-auto left-1/2 -translate-x-1/2 transition-all">
                      All parsing and analysis vectors happen locally or via stateless API protocols. We never store your resume files or personal data on our servers.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-[#0A0A15] border-b border-r border-white/10 rotate-45 transform"></div>
                   </div>
                 </motion.div>
                 <h2 className="text-6xl font-black font-display text-white mb-6 tracking-tighter leading-tight">
                   Beat the ATS.<br/>
                   <span className="glow-text-accent">Land Your Dream Job.</span>
                 </h2>
                 <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                   Upload your resume and target job description. Our AI evaluates your profile against Applicant Tracking Systems, identifies missing keywords, and provides actionable recommendations to get you hired.
                 </p>
              </div>

              {/* Upload Interface */}
              <div className="grid md:grid-cols-2 gap-8">
                <GlassCard delay={0.1}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Layers className="h-4 w-4 text-teal-400" />
                       Resume Upload
                    </h3>
                  </div>
                  <motion.div 
                    {...(getRootProps() as any)} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative rounded-2xl transition-all cursor-pointer text-center h-[14rem] flex flex-col items-center justify-center overflow-hidden
                      ${isDragReject ? 'bg-rose-500/10 border-rose-500/50' : isDragActive ? 'bg-teal-500/10 border-teal-500/50' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}
                  >
                    <div className="absolute inset-0 border-2 border-dashed rounded-2xl opacity-40 transition-colors duration-500 group-hover:border-teal-500/50" 
                         style={{ borderColor: isDragReject ? '#f43f5e' : isDragActive ? '#14b8a6' : 'rgba(255,255,255,0.15)' }} />
                    <input {...getInputProps()} />
                    
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       <ShieldCheck className="h-4 w-4 text-slate-500" />
                    </div>

                    <div className="flex flex-col items-center gap-4 relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                      <div className="relative">
                        <div className={`absolute inset-0 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 ${isDragReject ? 'bg-rose-500/30' : 'bg-teal-500/30'}`}></div>
                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-white/10 shadow-2xl relative z-10">
                          {isDragReject ? (
                            <AlertCircle className="h-7 w-7 transition-colors duration-500 text-rose-400" />
                          ) : (
                            <Upload className={`h-7 w-7 transition-colors duration-500 ${isDragActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'}`} />
                          )}
                        </div>
                      </div>
                      
                      {file ? (
                        <div className="space-y-1.5 px-6">
                          <p className="text-teal-400 font-black text-sm uppercase tracking-tight truncate max-w-[250px]">{file.name}</p>
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                             <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Ready For Analysis</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className={`font-black text-[13px] uppercase tracking-widest transition-colors ${isDragReject ? 'text-rose-400' : 'text-slate-200'}`}>
                            {isDragReject ? "Unsupported Format" : "Drag & Drop Resume Here"}
                          </p>
                          <div className="flex items-center justify-center gap-4 text-slate-500">
                             <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <FileText className="h-4 w-4" />
                                <span className="text-[9px] font-black tracking-widest uppercase">PDF</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <FileText className="h-4 w-4" />
                                <span className="text-[9px] font-black tracking-widest uppercase">DOCX</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <FileText className="h-4 w-4" />
                                <span className="text-[9px] font-black tracking-widest uppercase">TXT</span>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  <div className="flex justify-center mt-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Creating a mock sample file
                        const sampleContent = "John Doe\nSoftware Engineer\nExperience: 5 years at TechCorp using React, Node.js.\nSkills: JavaScript, HTML, CSS.";
                        const sample = new File([sampleContent], "sample_resume.txt", { type: "text/plain" });
                        setFile(sample);
                        setJobDescription("Looking for a Senior Frontend Developer with strong React and TypeScript background. Must know Node.js.");
                      }}
                      className="text-[10px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-widest bg-teal-500/10 hover:bg-teal-500/20 px-4 py-2 rounded-lg transition-all border border-teal-500/20 hover:border-teal-500/40"
                    >
                      Use Sample Resume & Job Description
                    </button>
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
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-sky-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        e.target.style.height = 'inherit';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Paste the target job requirements to calibrate the intelligence engine..."
                      className="w-full min-h-[14rem] max-h-[30rem] bg-[#0A0A15]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/60 transition-all resize-y font-medium leading-relaxed custom-scrollbar relative z-10 shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none z-20 bg-[#0A0A15]/80 px-2 py-1 rounded">
                      {jobDescription.length > 0 ? `${jobDescription.length} chars` : 'Optional Context'}
                    </div>
                  </div>
                </GlassCard>
              </div>

              {file && file.type === 'application/pdf' && (
                <div className="mt-8 flex justify-center">
                  <GlassCard className="w-full relative flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-400" />
                        Document Preview
                      </h3>
                      {numPages && numPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                            disabled={pageNumber <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 disabled:opacity-50 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest w-16 text-center">
                            {pageNumber} / {numPages}
                          </span>
                          <button 
                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                            disabled={pageNumber >= numPages}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 disabled:opacity-50 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 w-full overflow-auto flex justify-center document-preview-container max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
                       <Document
                         file={file}
                         onLoadSuccess={onDocumentLoadSuccess}
                         loading={
                           <div className="p-12 flex flex-col items-center justify-center gap-4">
                             <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                             <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Loading Document...</span>
                           </div>
                         }
                         error={
                           <div className="p-8 text-rose-400 text-xs font-bold uppercase flex items-center gap-2 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                             <AlertCircle className="h-4 w-4" /> Failed to load preview
                           </div>
                         }
                       >
                         <Page 
                            pageNumber={pageNumber} 
                            width={1000} 
                            scale={0.8}
                            renderTextLayer={true} 
                            renderAnnotationLayer={true} 
                            className="shadow-2xl !bg-transparent mx-auto"
                         />
                       </Document>
                    </div>
                  </GlassCard>
                </div>
              )}

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
                      Analyze Resume
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

              {/* Trust & How It Works */}
              <div className="mt-32 pt-16 border-t border-white/5">
                 <div className="text-center mb-16">
                    <h3 className="text-2xl font-black font-display text-white mb-4">How It Works</h3>
                    <p className="text-slate-400 text-sm max-w-2xl mx-auto">Our AI engine reverse-engineers the Applicant Tracking Systems used by top Fortune 500 companies to give you a competitive edge.</p>
                 </div>
                 
                 <div className="grid md:grid-cols-3 gap-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent -z-10 hidden md:block"></div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}
                      className="flex flex-col items-center text-center p-6 bg-[#0A0A15] border border-white/5 rounded-2xl relative z-10"
                    >
                       <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 font-black">1</div>
                       <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">Upload & Parse</h4>
                       <p className="text-slate-500 text-xs leading-relaxed">Drop in your resume and an optional job description. Our engine parses your formatting just like workday or greenhouse.</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
                      className="flex flex-col items-center text-center p-6 bg-[#0A0A15] border border-white/5 rounded-2xl relative z-10"
                    >
                       <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 font-black">2</div>
                       <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">Deep AI Analysis</h4>
                       <p className="text-slate-500 text-xs leading-relaxed">We scan for keyword density, structural integrity, and skill gaps using the latest Gemini models.</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} viewport={{ once: true }}
                      className="flex flex-col items-center text-center p-6 bg-[#0A0A15] border border-white/5 rounded-2xl relative z-10"
                    >
                       <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 font-black">3</div>
                       <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">Actionable Report</h4>
                       <p className="text-slate-500 text-xs leading-relaxed">Get a visual dashboard with your ATS score, missing keywords, and ready-to-copy bullet point improvements.</p>
                    </motion.div>
                 </div>

                 <div className="mt-24 text-center">
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-8">Built to beat top ATS platforms</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
                       <div className="text-lg font-black tracking-widest fill-current">WORKDAY</div>
                       <div className="text-lg font-black tracking-widest fill-current">GREENHOUSE</div>
                       <div className="text-lg font-black tracking-widest fill-current">LEVER</div>
                       <div className="text-lg font-black tracking-widest fill-current">TALEOS</div>
                    </div>
                 </div>

                 {/* Video Demo & Recruiter Appeal Section */}
                 <div className="mt-32 border border-white/10 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(20,184,166,0.1)]">
                    <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent"></div>
                    <div className="p-8 md:p-16 text-center relative z-10">
                       <h3 className="text-3xl md:text-5xl font-black font-display text-white mb-6">See It In Action</h3>
                       <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-12">Watch how a candidate goes from a 45% match to a 95% match with AI Resume Pro in under exactly 3 minutes.</p>
                       
                       <div className="relative aspect-video max-w-4xl mx-auto rounded-2xl bg-black border border-white/10 shadow-2xl flex items-center justify-center group cursor-pointer overflow-hidden mb-12">
                         {/* Mock Video Thumbnail */}
                         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-700 blur-[2px]"></div>
                         <div className="w-20 h-20 rounded-full bg-teal-500/80 backdrop-blur-md flex items-center justify-center text-white scale-100 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(20,184,166,0.5)] z-10">
                           <div className="w-0 h-0 border-t-8 border-b-8 border-l-[14px] border-transparent border-l-white ml-2"></div>
                         </div>
                         <div className="absolute top-4 left-4 flex gap-2 z-10">
                           <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                           <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                           <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                         </div>
                       </div>
                       
                       <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                         className="btn-primary py-4 px-12 text-sm uppercase flex items-center justify-center gap-3 mx-auto"
                       >
                         <Zap className="h-5 w-5" /> Try Live Demo Now
                       </motion.button>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6">
                         Hosted securely at <span className="text-teal-400/80">demo.airesumepro.com</span>
                       </p>
                    </div>
                 </div>
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
                    onClick={() => window.print()}
                    className="px-8 py-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[11px] uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all flex items-center gap-3 shadow-xl print:hidden"
                  >
                    <FileText className="h-4 w-4" /> Export PDF
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="btn-primary py-3 px-8 text-[11px] flex items-center gap-3 print:hidden"
                  >
                    <Download className="h-4 w-4" /> Export Assets
                  </button>
                </div>
              </div>

              {/* Scoring Infrastructure */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <GlassCard className="flex flex-col items-center justify-center py-8 border-t-4 border-t-teal-500 bg-gradient-to-b from-teal-500/5 to-transparent relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-50">
                    <CheckCircle2 className="h-6 w-6 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-black text-white font-display uppercase tracking-widest mb-2">Overall Match</h3>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-8 text-center max-w-xs">Holistic evaluation of your resume against the target role</p>
                  <ScoringCircle 
                    score={result.overallScore} 
                    label="Composite Fitness Score" 
                    color="#14b8a6" 
                    delay={0.1} 
                  />
                </GlassCard>

                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-sky-500 relative overflow-hidden">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">ATS Fit</h3>
                    <ScoringCircle 
                      score={result.atsCompatibility} 
                      label="" 
                      color="#0ea5e9" 
                      delay={0.2} 
                    />
                  </GlassCard>
                  
                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-indigo-500 relative overflow-hidden">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Skills Match</h3>
                    <ScoringCircle 
                      score={result.skillsMatch} 
                      label="" 
                      color="#6366f1" 
                      delay={0.3} 
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-emerald-500 relative overflow-hidden">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 text-center">Formatting Health</h3>
                    <ScoringCircle 
                      score={result.formattingHealthScore || result.atsAnalysis.formattingScore || 0} 
                      label="" 
                      color="#10b981" 
                      delay={0.4} 
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-amber-500 relative overflow-hidden">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 text-center">Career Trajectory</h3>
                    <ScoringCircle 
                      score={result.careerTrajectoryFitScore || 0} 
                      label="" 
                      color="#f59e0b" 
                      delay={0.5} 
                    />
                  </GlassCard>
                </div>
              </div>

              {/* Actionable Improvement Plan (Pointwise) */}
              {result.improvementPlan && (
                <GlassCard className="mb-8 border-l-4 border-l-rose-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">Actionable Improvement Plan</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Specific steps to bridge the gap</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.improvementPlan.missingSkillsToHighlight && result.improvementPlan.missingSkillsToHighlight.length > 0 && (
                      <div className="bg-[#0A0A15]/50 p-5 rounded-xl border border-white/5">
                        <h4 className="text-[11px] font-black text-sky-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Skills to Add</h4>
                        <ul className="space-y-3">
                          {result.improvementPlan.missingSkillsToHighlight.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.improvementPlan.resumeHeadlineUpdates && result.improvementPlan.resumeHeadlineUpdates.length > 0 && (
                      <div className="bg-[#0A0A15]/50 p-5 rounded-xl border border-white/5">
                        <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layout className="w-3 h-3"/> Headline Updates</h4>
                        <ul className="space-y-3">
                          {result.improvementPlan.resumeHeadlineUpdates.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.improvementPlan.recommendedCertifications && result.improvementPlan.recommendedCertifications.length > 0 && (
                      <div className="bg-[#0A0A15]/50 p-5 rounded-xl border border-white/5">
                        <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Award className="w-3 h-3"/> Certifications</h4>
                        <ul className="space-y-3">
                          {result.improvementPlan.recommendedCertifications.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.improvementPlan.projectsToHighlight && result.improvementPlan.projectsToHighlight.length > 0 && (
                      <div className="bg-[#0A0A15]/50 p-5 rounded-xl border border-white/5 lg:col-span-2">
                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase className="w-3 h-3"/> Projects to Highlight</h4>
                        <ul className="space-y-3">
                          {result.improvementPlan.projectsToHighlight.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.improvementPlan.formattingFixes && result.improvementPlan.formattingFixes.length > 0 && (
                      <div className="bg-[#0A0A15]/50 p-5 rounded-xl border border-white/5">
                        <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className="w-3 h-3"/> Formatting Fixes</h4>
                        <ul className="space-y-3">
                          {result.improvementPlan.formattingFixes.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}

              <GlassCard className="mb-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Detailed Sub-Metrics</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                    <Target className="h-3 w-3" />
                    Deep Analysis
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-8">
                  {[
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
                    },
                    { 
                      label: "System Match", score: Math.round((result.atsAnalysis.formattingScore + result.atsCompatibility) / 2), color: "#8b5cf6", desc: "Averaged health",
                      tooltip: (
                          <>
                            <strong className="text-purple-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">Average Health</strong>
                             Combines your formatting score and base ATS score into a single indicator of parsing reliability.
                          </>
                      )
                    },
                    {
                      label: "Bullet Quality", score: result.atsAnalysis.bulletPointQualityScore || 0, color: "#ec4899", desc: "Impact score",
                      tooltip: (
                          <>
                            <strong className="text-pink-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">Bullet Quality</strong>
                            Focuses on the presence of strong action verbs and quantifiable metrics (numbers, %, $) in your experience descriptions.
                          </>
                      )
                    }
                  ].map((m, i) => (
                    <div key={`m-${i}`} className="space-y-3">
                      <div className="flex justify-between items-end">
                         <div className="flex items-center gap-2">
                           <div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{m.label}</span>
                             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{m.desc}</span>
                           </div>
                           {m.tooltip && (
                             <div className="group relative cursor-pointer">
                               <Info className="h-4 w-4 text-slate-500 hover:text-white transition-colors" />
                               <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-slate-800 text-white text-[10px] font-medium p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl leading-relaxed">
                                 {m.tooltip}
                                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
                               </div>
                             </div>
                           )}
                         </div>
                         <span className="text-2xl font-black text-white font-display leading-none">{m.score}%</span>
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

              {/* LinkedIn Comparison (if available) */}
              {result.linkedinComparison && result.linkedinComparison.hasLinkedIn && (
                <GlassCard className="mb-8 border-t-2 border-t-blue-500 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="80" height="80" alt="LI" className="grayscale" />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center space-y-2 mb-10">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] text-center">LinkedIn Profile Sync</h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Cross-vector analysis of resume vs public profile</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 relative">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/10 hidden md:block" />
                    
                    {/* Resume Side */}
                    <div className="space-y-6">
                      <div className="bg-[#0A0A15]/60 p-5 rounded-2xl border border-white/5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Resume Headline</h4>
                        <p className="text-white text-sm font-bold">{result.linkedinComparison.resumeHeadline}</p>
                      </div>
                      
                      {result.linkedinComparison.missingFromLinkedIn && result.linkedinComparison.missingFromLinkedIn.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3"/> Present on Resume (Missing on LinkedIn)
                          </h4>
                          <ul className="space-y-2">
                            {result.linkedinComparison.missingFromLinkedIn.map((s, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-500">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* LinkedIn Side */}
                    <div className="space-y-6">
                      <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 border-b border-blue-500/20 pb-2">LinkedIn Headline</h4>
                        <p className="text-white text-sm font-bold">{result.linkedinComparison.linkedinHeadline}</p>
                      </div>

                      {result.linkedinComparison.missingFromResume && result.linkedinComparison.missingFromResume.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <AlertCircle className="w-3 h-3"/> Present on LinkedIn (Missing on Resume)
                          </h4>
                          <ul className="space-y-2">
                            {result.linkedinComparison.missingFromResume.map((s, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-rose-500">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/5 mx-auto max-w-2xl text-center">
                    <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                      " {result.linkedinComparison.matchAnalysis} "
                    </p>
                  </div>
                </GlassCard>
              )}

              {/* Skill Cloud Visualizer & Gap Chart */}
              <div className="grid lg:grid-cols-2 gap-8">
                <GlassCard>
                  <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">Skill Landscape Profile</h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Visual distribution of matched & missing capabilities</p>
                  </div>
                  <SkillCloud found={result.foundSkills} missing={result.skillGapReport.map(g => g.skill)} />
                </GlassCard>
                
                <GlassCard>
                  <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">Skill Gap Analysis</h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Severity of missing requirements</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={result.skillGapReport.map(sg => ({ 
                          name: sg.skill, 
                          severity: sg.importance.toLowerCase().includes('critical') ? 95 : 
                                    sg.importance.toLowerCase().includes('high') ? 75 : 
                                    sg.importance.toLowerCase().includes('medium') ? 50 : 30 
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.3)" 
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }} 
                          tickMargin={10}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.3)" 
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#0A0A15]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                  <p className="text-white text-xs font-bold uppercase">{payload[0].payload.name}</p>
                                  <p className="text-rose-400 text-[10px] font-black uppercase mt-1">Gap Severity: {payload[0].value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="severity" 
                          fill="#f43f5e" 
                          radius={[4, 4, 0, 0]} 
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Simplified Header with Core Strengths & Weaknesses */}
                <GlassCard className="lg:col-span-12">
                   <div className="grid md:grid-cols-3 gap-8">
                     <div className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <ShieldCheck className="h-3.5 w-3.5" /> Core Strength
                          </h4>
                          <p className="text-sm text-white font-black uppercase mb-1">Excellent {result.foundSkills[0] || 'Domain'} Exposure</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Your experience in {result.foundSkills.slice(0, 3).join(', ')} provides a strong foundation for this role.</p>
                        </div>
                     </div>
                     <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Zap className="h-3.5 w-3.5" /> High Priority Fix
                          </h4>
                          <p className="text-sm text-white font-black uppercase mb-1">Missing {result.skillGapReport[0]?.skill || 'Core Keywords'}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">The recruiter will look for {result.skillGapReport[0]?.skill}. Add this to your summary or experience.</p>
                        </div>
                     </div>
                     <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Target className="h-3.5 w-3.5" /> Target Role Fit
                          </h4>
                          <p className="text-sm text-white font-black uppercase mb-1">{result.careerPath.topRole}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">You are a {Math.round(result.careerPath.confidence * 100)}% match for this trajectory based on current assets.</p>
                        </div>
                     </div>
                   </div>

                   {/* Adjacent Roles */}
                   {result.careerPath.alternatives && result.careerPath.alternatives.length > 0 && (
                     <div className="mt-8 border-t border-white/5 pt-8">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Adjacent Career Vectors</h4>
                       <div className="grid md:grid-cols-2 gap-4">
                         {result.careerPath.alternatives.map((alt, i) => (
                           <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                             <div className="flex justify-between items-center">
                               <p className="text-xs text-white font-black uppercase">{alt.role}</p>
                               <span className="text-[10px] font-black text-sky-400 block">{alt.match}% Match</span>
                             </div>
                             {alt.reasoning && (
                               <p className="text-[10px] text-slate-500 leading-relaxed italic">{alt.reasoning}</p>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
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
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={`rec-${i}`} 
                        className="space-y-3"
                      >
                        <div 
                          className={`flex gap-5 p-5 rounded-2xl bg-white/5 border transition-all items-start group ${selectedRecommendation === step ? 'border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.15)] bg-white/10' : 'border-white/5 hover:border-white/20'}`}
                        >
                          <div className={`h-10 w-10 mt-1 shrink-0 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all ${selectedRecommendation === step ? 'border-teal-500 text-teal-400' : 'border-slate-700 text-slate-500 group-hover:border-teal-500 group-hover:text-teal-400'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-slate-300 font-medium text-[13px] leading-relaxed italic pr-4">
                                {step}
                              </p>
                              {selectedRecommendation === step ? (
                                <button onClick={() => handleExpandRecommendation(step)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-teal-400 shrink-0">
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                            
                            {selectedRecommendation !== step && (
                              <button 
                                onClick={() => handleExpandRecommendation(step)}
                                className="self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-400/80 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-4 py-2 rounded-lg transition-all border border-teal-500/20 hover:border-teal-500/40"
                              >
                                <Sparkles className="h-3 w-3" /> Get AI-Generated Example Content
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded Detail View */}
                        <AnimatePresence>
                          {selectedRecommendation === step && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 rounded-2xl bg-[#050510] border border-teal-500/20 shadow-inner ml-14 relative">
                                <div className="absolute top-[-10px] left-10 w-4 h-4 bg-[#050510] border-t border-l border-teal-500/20 rotate-45 transform origin-center z-10" />
                                
                                {isGeneratingRecDetail ? (
                                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                     <BrainCircuit className="h-6 w-6 text-teal-500 animate-pulse" />
                                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Generating strategic insights...</p>
                                  </div>
                                ) : recommendationDetail ? (
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" /> Context & Rationale
                                      </h4>
                                      <p className="text-slate-300 text-sm leading-relaxed">{recommendationDetail.explanation}</p>
                                    </div>
                                    
                                    {recommendationDetail.examples && recommendationDetail.examples.length > 0 && (
                                      <div>
                                        <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <TrendingUp className="h-3.5 w-3.5" /> Implementation Examples
                                        </h4>
                                        <div className="space-y-3">
                                          {recommendationDetail.examples.map((example, eIdx) => (
                                            <div key={`ex-${eIdx}`} className="group/ex relative p-4 pr-12 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-300 leading-relaxed font-mono">
                                              {example}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(example);
                                                  const btn = e.currentTarget;
                                                  const originalHTML = btn.innerHTML;
                                                  const checkHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-teal-400"><path d="M20 6 9 17l-5-5"/></svg>';
                                                  btn.innerHTML = checkHtml;
                                                  setTimeout(() => {
                                                    btn.innerHTML = originalHTML;
                                                  }, 2000);
                                                }}
                                                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 opacity-0 group-hover/ex:opacity-100 hover:bg-white/10 transition-all cursor-pointer text-slate-400 hover:text-white"
                                                title="Copy to clipboard"
                                              >
                                                <Copy className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-rose-400 text-xs">Failed to load details. Please try again.</div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
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
                              <span key={`kw-${i}`} className="text-[10px] font-bold px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-300 hover:bg-teal-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(20,184,166,0.1)] cursor-default">{kw}</span>
                           ))}
                        </div>
                      </div>
                      
                      {result.atsAnalysis.jobKeywordsFound && result.atsAnalysis.jobKeywordsFound.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-black text-sky-400/80 uppercase mb-2 flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                            <CheckCircle2 className="h-3 w-3 text-sky-400" /> Matched Job Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                             {result.atsAnalysis.jobKeywordsFound?.map((kw, i) => (
                                <span key={`jkf-${i}`} className="text-[10px] font-bold px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-300 hover:bg-sky-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(56,189,248,0.1)] cursor-default">{kw}</span>
                             ))}
                          </div>
                        </div>
                      )}

                      {result.atsAnalysis.jobKeywordsMissing && result.atsAnalysis.jobKeywordsMissing.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-black text-rose-400/80 uppercase mb-2 flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                            <XCircle className="h-3 w-3 text-rose-500" /> Missing Job Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                             {result.atsAnalysis.jobKeywordsMissing?.slice(0, 8).map((kw, i) => (
                                <span key={`jkm-${i}`} className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-300 hover:bg-rose-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)] cursor-default">{kw}</span>
                             ))}
                          </div>
                        </div>
                      )}

                      {result.atsAnalysis.keywordOptimizations && result.atsAnalysis.keywordOptimizations.length > 0 && (
                        <div className="pt-4 border-t border-white/10 mt-6">
                           <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5" /> Keyword Optimizations
                           </h4>
                           <div className="space-y-4">
                             {result.atsAnalysis.keywordOptimizations.map((opt, i) => (
                               <details key={`ko-${i}`} className="group bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-colors hover:border-amber-500/30">
                                 <summary className="text-[11px] font-bold text-white flex items-center justify-between cursor-pointer outline-none list-none [&::-webkit-details-marker]:hidden">
                                    <div className="flex items-center gap-2">
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                      {opt.keyword}
                                    </div>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                                 </summary>
                                 <div className="space-y-2 mt-4">
                                   {opt.suggestedPhrases.map((phrase, pIdx) => (
                                     <div key={`phrase-${i}-${pIdx}`} className="group/phrase relative p-3 pr-10 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed font-mono">
                                       {phrase}
                                       <button
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           navigator.clipboard.writeText(phrase);
                                           const btn = e.currentTarget;
                                           const originalHTML = btn.innerHTML;
                                           const checkHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-amber-400"><path d="M20 6 9 17l-5-5"/></svg>';
                                           btn.innerHTML = checkHtml;
                                           setTimeout(() => {
                                             btn.innerHTML = originalHTML;
                                           }, 2000);
                                         }}
                                         className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-md bg-white/5 opacity-0 group-hover/phrase:opacity-100 hover:bg-white/10 transition-all cursor-pointer text-slate-400 hover:text-white"
                                         title="Copy suggested phrase"
                                       >
                                         <Copy className="h-3 w-3" />
                                       </button>
                                     </div>
                                   ))}
                                 </div>
                               </details>
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

                  {result.sectionsDetailed && result.sectionsDetailed.length > 0 && (
                    <GlassCard>
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-teal-400" /> Extracted Sections
                      </h3>
                      <div className="space-y-4">
                        {result.sectionsDetailed.map((section, idx) => (
                          <div key={idx} className="group relative">
                            <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-colors">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                {section.sectionName}
                              </h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed border-l border-white/10 pl-3 ml-0.5 mt-1">
                                {section.summary}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
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
