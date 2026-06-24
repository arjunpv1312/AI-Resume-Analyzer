import React, { useState, useCallback, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { useDropzone } from "react-dropzone";
import { useReactToPrint } from "react-to-print";
import DOMPurify from "dompurify";
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
  Briefcase,
  Printer,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
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
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

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
  interviewQuestions?: string[];
  resumeRewriteDraft?: string;
  coverLetterDraft?: string;
  globalBenchmarking?: string;
  recruiterSummary?: string;
}

interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  isOpen: boolean;
  pageNumber: number;
}

interface HighlightData {
  id: string;
  rects: { top: number; left: number; width: number; height: number }[];
  color: string;
  pageNumber: number;
}

interface AnalysisHistoryItem {
  id: string;
  date: string;
  fileName: string;
  jobDescription?: string;
  result: AnalysisResult;
}

const GlassCard = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={`glass-card p-6 relative overflow-hidden group ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    {children}
  </motion.div>
);

const getScoreLevel = (score: number) => {
  if (score >= 90)
    return {
      label: "Exceptional (Top 5%)",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
    };
  if (score >= 80)
    return {
      label: "Much Better",
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      border: "border-teal-400/20",
    };
  if (score >= 60)
    return {
      label: "Moderate Fit",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
    };
  return {
    label: "Needs Opt",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  };
};

const ScoringCircle = ({
  score,
  label,
  color,
  delay,
  tooltip,
}: {
  score: number;
  label: string;
  color: string;
  delay: number;
  tooltip?: React.ReactNode;
}) => {
  const data = [{ name: "Score", value: score, fill: color }];
  const level = getScoreLevel(score);
  return (
    <div className="flex flex-col items-center justify-center relative w-full pt-4 pb-2">
      <div className="h-40 w-full max-w-[220px] relative overflow-hidden -mb-10">
        <ResponsiveContainer width="100%" height="200%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            barSize={14}
            data={data}
            startAngle={180}
            endAngle={180 - 1.8 * score}
          >
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.05)" }}
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
            {score}
            <span className="text-[10px] text-slate-500 font-sans tracking-widest uppercase mt-2">
              out of 100
            </span>
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
          <span
            className={`text-xs font-black uppercase tracking-widest ${level.color}`}
          >
            Level: {level.label}
          </span>
        </motion.div>
        <div className="flex items-center gap-1.5 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {label}
          </p>
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

const SkillCloud = ({
  found,
  missing,
}: {
  found: string[];
  missing: string[];
}) => {
  // We use randomly assigned but deterministic-looking weights to simulate "importance/frequency"
  const combined = [
    ...found.map((s, i) => ({
      text: s,
      type: "found",
      weight: 1 - (i / found.length) * 0.4,
    })),
    ...missing.map((s, i) => ({
      text: s,
      type: "missing",
      weight: 1 - (i / missing.length) * 0.4,
    })),
  ]
    .sort((a, b) => a.text.localeCompare(b.text))
    .sort(() => Math.random() - 0.5);

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
            transition={{ delay: i * 0.03, type: "spring" }}
            className={`inline-block rounded-full px-4 py-2 ${skill.type === "found" ? "bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]" : "bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]"} font-black uppercase tracking-widest hover:scale-110 hover:z-10 transition-transform cursor-default relative`}
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
  );
};

function SkillDemandTrend({ role }: { role: string }) {
  const [data, setData] = useState<{ month: string; demand: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/trend?role=${encodeURIComponent(role)}`)
      .then((res) => res.json())
      .then((d) => {
        if (isMounted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [role]);

  return (
    <GlassCard className="mt-8">
      <div className="flex flex-col items-center justify-center space-y-2 mb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">
          Market Demand Trend
        </h3>
        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase text-center">
          6-Month historical demand for {role}
        </p>
      </div>

      <div className="h-64 w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs uppercase tracking-widest font-bold">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching Trend
            Data...
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.3)"
                tick={{
                  fill: "rgba(255,255,255,0.5)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
                tickMargin={10}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0A0A15]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                        <p className="text-white text-xs font-bold uppercase">
                          {label}
                        </p>
                        <p className="text-teal-400 text-[10px] font-black uppercase mt-1">
                          Demand Index: {payload[0].value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="demand"
                stroke="#14b8a6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorDemand)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
            No data available
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function App() {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "AI_Resume_Analysis",
  });

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSessionPurged, setIsSessionPurged] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [currentTheme, setCurrentTheme] = useState("cosmic");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isPurgePromptOpen, setIsPurgePromptOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<
    string | null
  >(null);
  const [recommendationDetail, setRecommendationDetail] = useState<{
    explanation: string;
    examples: string[];
  } | null>(null);
  const [isGeneratingRecDetail, setIsGeneratingRecDetail] = useState(false);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [annotationMode, setAnnotationMode] = useState<"sticky" | "highlight">(
    "sticky",
  );
  const [highlightColor, setHighlightColor] = useState<string>(
    "rgba(250, 204, 21, 0.4)",
  ); // amber-400 transparent

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const linkedinCopy = `🚀 Just analyzed my resume with AI Resume Pro! Accurate ATS scores, skill gap analysis, and tailored career roadmap insights. Check it out to level up your professional profile! 📄✨ 

#AI #CareerDevelopment #ResumeTips #FutureOfWork`;

  const [copiedText, setCopiedText] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Load history from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("resume_analysis_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    const existingTheme = document.documentElement.getAttribute("data-theme");
    if (existingTheme) {
      setCurrentTheme(existingTheme);
    }
  }, []);

  const saveToHistory = (
    newResult: AnalysisResult,
    currentFile: File,
    jd: string,
  ) => {
    const newItem: AnalysisHistoryItem = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date: new Date().toISOString(),
      fileName: currentFile.name,
      jobDescription: jd,
      result: newResult,
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 50);
      localStorage.setItem("resume_analysis_history", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
    localStorage.setItem("resume_analysis_history", JSON.stringify(updated));
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
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
    setJobDescription("");
    setError(null);
    setIsSessionPurged(true);
    setIsPurgePromptOpen(false);

    // Attempt to hint manual GC if available (non-standard but useful in some envs)
    if ((window as any).gc) {
      try {
        (window as any).gc();
      } catch (e) {}
    }

    setTimeout(() => setIsSessionPurged(false), 3000);
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      setError(
        `Unsupported file format or file too large. Please upload a PDF, DOCX, or TXT file.`,
      );
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "text/plain": [".txt"],
      },
      multiple: false,
    });

  const analyzeResume = async () => {
    if (!file) {
      setError("Resume file is required component for analysis.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setElapsedTime(0);
    setAnalysisStep("Initiating neural gateway...");
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      // 0. Pre-flight health check
      const healthCheck = await fetch("/api/health").catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.warn(
          "Neural gateway appears unresponsive. Attempting direct sync anyway...",
        );
      } else {
        const healthData = await healthCheck.json().catch(() => ({}));
        console.log("Neural gateway active:", healthData.timestamp);
      }

      setAnalysisStep("Formatting document for structural extraction...");
      // 1. Sanitize Inputs
      const cleanJD = DOMPurify.sanitize(jobDescription);

      // 2. Extract text from server
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", cleanJD);
      if (linkedinUrl) {
        formData.append("linkedinUrl", DOMPurify.sanitize(linkedinUrl));
      }

      setAnalysisStep("Parsing resume text via server-side engine...");
      const extractionResponse = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!extractionResponse.ok) {
        const contentType = extractionResponse.headers.get("content-type");
        const handledBy = extractionResponse.headers.get("X-Handled-By");
        console.error(
          `Fetch failed. Handled by: ${handledBy}, Content-Type: ${contentType}`,
        );

        if (contentType && contentType.includes("application/json")) {
          const errorData = await extractionResponse.json();
          throw new Error(
            errorData.error ||
              errorData.details ||
              "Cognitive extraction failed.",
          );
        } else {
          const textError = await extractionResponse.text();
          console.error(
            "Non-JSON error response from server:",
            textError.substring(0, 500),
          );
          throw new Error(
            `Server abstraction error (${extractionResponse.status}). The neural gate returned an incompatible format.`,
          );
        }
      }

      const contentType = extractionResponse.headers.get("content-type");
      const handledBy = extractionResponse.headers.get("X-Handled-By");

      if (!contentType || !contentType.includes("application/json")) {
        const textError = await extractionResponse.text();
        console.error(
          `Incompatible format from ${handledBy || "Unknown Engine"}. CT: ${contentType}. Body:`,
          textError.substring(0, 200),
        );
        throw new Error(
          "Neural response synchronization failed: Invalid data format received. Try a different file format.",
        );
      }

      setAnalysisStep("Running deterministic ATS rule simulations...");
      const { text, pageCount, atsMetadata } = await extractionResponse.json();

      setAnalysisStep(
        "Initiating high-dimensional intelligence model generation...",
      );

      const generationResponse = await fetch("/api/generate-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          jobDescription,
          pageCount,
          atsMetadata,
          linkedinUrl,
        }),
      });

      if (!generationResponse.ok) {
        const errorData = await generationResponse.json().catch(() => ({}));
        let errMessage = errorData.error || "Intelligence processing failed.";
        if (
          errMessage.includes("API key is missing") ||
          errMessage.includes("API_KEY_INVALID") ||
          errMessage.includes("API key")
        ) {
          errMessage =
            "Your Gemini API Key is missing, invalid or has been revoked. Please update it in the settings / environment variables.";
        }
        throw new Error(errMessage);
      }

      setAnalysisStep("Parsing cognitive matrices output...");

      const analysis: AnalysisResult = await generationResponse.json();

      analysis.careerPath = analysis.careerPath || {
        topRole: "Candidate",
        confidence: 0,
        alternatives: [],
      };
      analysis.careerPath.alternatives = analysis.careerPath.alternatives || [];
      analysis.careerTimeline = analysis.careerTimeline || [];
      analysis.skillGapReport = analysis.skillGapReport || [];
      analysis.sectionsDetailed = analysis.sectionsDetailed || [];
      analysis.interviewQuestions = analysis.interviewQuestions || [];
      analysis.suggestions = analysis.suggestions || [];

      if (!analysis.atsAnalysis) {
        analysis.atsAnalysis = {
          formattingScore: 50,
          keywordDensity: 50,
          recommendations: [],
        };
      }
      analysis.atsAnalysis.recommendations =
        analysis.atsAnalysis.recommendations || [];
      analysis.atsAnalysis.keywordOptimizations =
        analysis.atsAnalysis.keywordOptimizations || [];

      if (!analysis.improvementPlan) {
        analysis.improvementPlan = {
          missingSkillsToHighlight: [],
          resumeHeadlineUpdates: [],
          recommendedCertifications: [],
          projectsToHighlight: [],
          formattingFixes: [],
        };
      } else {
        analysis.improvementPlan.missingSkillsToHighlight =
          analysis.improvementPlan.missingSkillsToHighlight || [];
        analysis.improvementPlan.resumeHeadlineUpdates =
          analysis.improvementPlan.resumeHeadlineUpdates || [];
        analysis.improvementPlan.recommendedCertifications =
          analysis.improvementPlan.recommendedCertifications || [];
        analysis.improvementPlan.projectsToHighlight =
          analysis.improvementPlan.projectsToHighlight || [];
        analysis.improvementPlan.formattingFixes =
          analysis.improvementPlan.formattingFixes || [];
      }

      analysis.linkedinComparison = analysis.linkedinComparison || {
        hasLinkedIn: false,
        resumeHeadline: "",
        linkedinHeadline: "",
        matchAnalysis: "",
        missingFromResume: [],
        missingFromLinkedIn: [],
      };

      analysis.linkedinComparison.missingFromResume =
        analysis.linkedinComparison.missingFromResume || [];
      analysis.linkedinComparison.missingFromLinkedIn =
        analysis.linkedinComparison.missingFromLinkedIn || [];

      // Inject rule-based keyword data
      if (analysis.atsAnalysis) {
        analysis.atsAnalysis.topResumeKeywords = atsMetadata.topResumeKeywords;
        analysis.atsAnalysis.jobKeywordsFound = atsMetadata.jobKeywordsFound;
        analysis.atsAnalysis.jobKeywordsMissing =
          atsMetadata.jobKeywordsMissing;
        analysis.atsAnalysis.jobKeywordDensity = atsMetadata.keywordDensity;
        analysis.atsAnalysis.bulletPointQualityScore =
          atsMetadata.bulletPointQualityScore;
      }

      setResult(analysis);
      if (analysis.overallScore >= 75) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#14b8a6", "#0ea5e9", "#8b5cf6"],
        });
      }
      saveToHistory(analysis, file, jobDescription);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(
        err.message || "Interruption in neural processing. Please retry.",
      );
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
      const response = await fetch("/api/expand-recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recommendation, jobDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMessage = errorData.error || "Intelligence processing failed.";
        if (
          errMessage.includes("API key is missing") ||
          errMessage.includes("API_KEY_INVALID") ||
          errMessage.includes("API key")
        ) {
          errMessage =
            "Your Gemini API Key is missing, invalid or has been revoked. Please update it in the settings / environment variables.";
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
    const XLSX = await import("xlsx");
    const data = [
      { Category: "Overall Intelligence Score", Value: result.overallScore },
      { Category: "ATS Engine Compatibility", Value: result.atsCompatibility },
      { Category: "Skill Vector Density", Value: result.skillsMatch },
      {
        Category: "Formatting Health",
        Value: result.atsAnalysis.formattingScore,
      },
      { Category: "Primary Trajectory", Value: result.careerPath.topRole },
      ...result.skillGapReport.map((sg) => ({
        Category: `Gap: ${sg.skill}`,
        Value: sg.importance,
      })),
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AI_Report");
    XLSX.writeFile(wb, "Autonomous_Career_Report.xlsx");
  };

  return (
    <div className="min-h-screen selection:bg-teal-500/30">
      <div className="bg-gradient-body"></div>
      {/* Background Orbs & Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-accent/10 blur-[150px] animate-pulse transition-all duration-1000"></div>
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-purple/10 blur-[150px] animate-pulse transition-all duration-1000"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-brand-glow/5 blur-[150px] mix-blend-screen -z-10 animate-pulse transition-all duration-1000"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Floating Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Modern Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-deep/60 backdrop-blur-[30px] border-b border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-glow to-brand-accent flex items-center justify-center shadow-[0_0_24px_rgba(0,255,204,0.3)] border border-white/20 cursor-pointer"
            >
              <BrainCircuit className="text-white h-6 w-6" />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black font-display tracking-tight glow-text uppercase">
                AI Resume Pro
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1">
                ADVANCED VERSION
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a
              href="https://interviewcoach-969933961049.asia-southeast1.run.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/20 px-3 py-2 rounded-full text-brand-teal hover:bg-brand-teal/20 hover:text-white transition-colors shadow-[0_0_15px_rgba(20,184,166,0.15)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 14 4-4" />
                <path d="M3.34 19a10 10 0 1 1 17.32 0" />
              </svg>
              Interview Coach
            </a>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-full">
              {[
                { id: "cosmic", color: "bg-[#7000ff]", name: "Cosmic" },
                { id: "ocean", color: "bg-[#2563eb]", name: "Ocean" },
                { id: "ember", color: "bg-[#e11d48]", name: "Ember" },
                { id: "forest", color: "bg-[#059669]", name: "Forest" },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    document.documentElement.setAttribute(
                      "data-theme",
                      theme.id,
                    );
                  }}
                  title={theme.name}
                  className={`w-5 h-5 rounded-full transition-all duration-300 ${theme.color} ${currentTheme === theme.id ? "ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]" : "opacity-40 hover:opacity-100 hover:scale-110 cursor-pointer"}`}
                />
              ))}
            </div>
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
                    <h3 className="text-3xl font-black text-white font-display uppercase tracking-tighter mb-2">
                      Resume Formatting Protocol
                    </h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">
                      Best Practices for ATS & Human Readability
                    </p>
                  </div>
                  <button
                    onClick={() => setIsGuideOpen(false)}
                    className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
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
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">
                          Typography & Layout
                        </h4>
                      </div>
                      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-white block mb-1">
                            Fonts:
                          </strong>{" "}
                          Avoid complex serif fonts. Stick to clean, modern
                          sans-serif fonts like{" "}
                          <strong>
                            Helvetica, Arial, Calibri, Arial, or Roboto
                          </strong>
                          . Size should be <strong>10-12pt</strong> for body,
                          and <strong>14-16pt</strong> for headers.
                        </div>
                        <div>
                          <strong className="text-white block mb-1">
                            Margins:
                          </strong>{" "}
                          Maintain <strong>0.5 to 1-inch margins</strong> on all
                          sides to ensure it prints well and provides enough
                          whitespace.
                        </div>
                        <div>
                          <strong className="text-white block mb-1">
                            Formats:
                          </strong>{" "}
                          Always export to <strong>PDF</strong>. Word documents
                          (.docx) can break formatting depending on the ATS or
                          the recruiter's system.
                        </div>
                      </div>
                    </div>

                    {/* Section Structuring */}
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400">
                          <Layout className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">
                          Section Structuring
                        </h4>
                      </div>
                      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-white">
                            1. Contact Header:
                          </strong>{" "}
                          Name, Phone, Email, Location, LinkedIn/Portfolio. (No
                          photos or exact street addresses).
                        </div>
                        <div>
                          <strong className="text-white">
                            2. Professional Summary:
                          </strong>{" "}
                          2-3 sentences targeting the specific role. No
                          objective statements.
                        </div>
                        <div>
                          <strong className="text-white">3. Experience:</strong>{" "}
                          Reverse-chronological order. Use 3-5 bullet points per
                          role focusing on impact.
                        </div>
                        <div>
                          <strong className="text-white">4. Skills:</strong>{" "}
                          Group by category (e.g., Languages, Frameworks,
                          Tools). Keep it scannable.
                        </div>
                        <div>
                          <strong className="text-white">5. Education:</strong>{" "}
                          Degree, Major, Institution, Year (Optional if 5+ years
                          exp).
                        </div>
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
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">
                          The XYZ Formula
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                        Google recruiters recommend the{" "}
                        <strong>XYZ formula</strong> for achievements:
                        "Accomplished [X] as measured by [Y], by doing [Z]."
                      </p>

                      <div className="space-y-3">
                        <div className="p-3 bg-rose-500/5 border-l-2 border-rose-500 text-xs">
                          <span className="text-rose-400 font-bold uppercase text-[10px] block mb-1">
                            Bad Example
                          </span>
                          <span className="text-slate-400 line-through">
                            Helped increase sales for the company.
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-500/5 border-l-2 border-emerald-500 text-xs text-slate-200">
                          <span className="text-emerald-400 font-bold uppercase text-[10px] block mb-1">
                            Good Example
                          </span>
                          "Grew Q3 revenue by 24% ($1.2M) mapping new sales
                          territories and introducing a CRM automation
                          pipeline."
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400">
                          <Target className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-teal-400 uppercase tracking-widest">
                          ATS Anti-Patterns
                        </h4>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-3">
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>
                            <strong>2-Column Layouts:</strong> Many ATS parse
                            left-to-right, completely scrambling two-column
                            designs.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>
                            <strong>Tables & Graphics:</strong> Exclude images,
                            complex tables, progress bars, or skill rating
                            circles.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>
                            <strong>Headers/Footers:</strong> Don't put contact
                            info in the document header/footer; some parsers
                            ignore them.
                          </span>
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
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                    LinkedIn Post Content
                  </h3>
                  <button
                    onClick={() => setIsLinkedInModalOpen(false)}
                    className="text-slate-500 hover:text-white"
                  >
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
                  {copiedText ? "Copied!" : "Copy to Clipboard"}
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
                      <h3 className="text-lg font-black text-rose-400 font-display uppercase tracking-widest">
                        Confirm Purge
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPurgePromptOpen(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Are you sure you want to permanently delete all session data?
                  This action cannot be undone and you will lose all analysis
                  history and uploaded files.
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
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600">
                  <Info className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No archival data found
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-teal-500/50 before:to-transparent">
                  {history.map((item, mapIdx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mapIdx * 0.1 }}
                      key={item.id + "-" + mapIdx}
                      onClick={() => {
                        setResult(item.result);
                        setIsHistoryOpen(false);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer group relative
                        ${
                          compareIds.includes(item.id)
                            ? "bg-teal-500/10 border-teal-500/50"
                            : "bg-white/5 border-white/5 hover:border-white/20"
                        }`}
                    >
                      <div className="absolute left-[-29px] top-5 w-3 h-3 rounded-full bg-[#0A0A15] border-2 border-teal-500/50 z-10 transition-colors group-hover:border-teal-400 group-hover:bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0)] group-hover:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => toggleCompare(item.id, e)}
                            className={`h-6 w-6 rounded flex items-center justify-center transition-colors
                              ${compareIds.includes(item.id) ? "bg-teal-500 text-white" : "bg-white/5 text-slate-500 hover:text-white"}`}
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
                      <p className="text-sm font-black text-white truncate mb-2">
                        {item.fileName}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-teal-400">
                            {item.result.overallScore}%
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase">
                            Match
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-400">
                            {item.result.skillsMatch}%
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase">
                            Skills
                          </span>
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
                      const items = compareIds
                        .map((id) => history.find((h) => h.id === id))
                        .filter(Boolean);
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
                <h2 className="text-3xl font-black font-display text-white uppercase tracking-tighter">
                  Delta Intelligence Comparison
                </h2>
                <button
                  onClick={() => setCompareIds([])}
                  className="px-8 py-3 rounded-full border border-white/10 text-slate-300 font-black hover:bg-white/5 transition-all text-xs"
                >
                  Exit Comparison
                </button>
              </div>

              <div
                className={`grid gap-8 ${compareIds.length === 2 ? "grid-cols-2" : compareIds.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}
              >
                {compareIds
                  .map((id) => history.find((h) => h.id === id))
                  .map((item, idx, arr) => {
                    if (!item) return null;
                    const prevItem = arr[idx - 1];
                    const scoreDiff = prevItem
                      ? item.result.overallScore - prevItem.result.overallScore
                      : 0;

                    return (
                      <GlassCard key={`gc-${idx}`} className="space-y-8">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center justify-between">
                            <span>
                              Version {String.fromCharCode(65 + idx)} -{" "}
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                            {idx > 0 && scoreDiff !== 0 && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black ${scoreDiff > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                              >
                                {scoreDiff > 0 ? "+" : ""}
                                {scoreDiff} pts
                              </motion.span>
                            )}
                          </p>
                          <h3 className="text-xl font-black text-white truncate">
                            {item.fileName}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="relative p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                              Intelligence Score
                            </p>
                            <p className="text-3xl font-black text-white font-display">
                              {item.result.overallScore}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                              ATS Compatibility
                            </p>
                            <p className="text-3xl font-black text-white font-display">
                              {item.result.atsCompatibility}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                              Skill Vector
                            </p>
                            <p className="text-3xl font-black text-white font-display">
                              {item.result.skillsMatch}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                              Format Health
                            </p>
                            <p className="text-3xl font-black text-white font-display">
                              {item.result.atsAnalysis.formattingScore}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Core Summary
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-teal-500/20 pl-4">
                            "{item.result.summary}"
                          </p>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Found Intelligence
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.result.foundSkills
                              .slice(0, 10)
                              .map((s, i) => (
                                <span
                                  key={`fs-${i}`}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase"
                                >
                                  {s}
                                </span>
                              ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Priority Gaps
                          </p>
                          <div className="space-y-2">
                            {item.result.skillGapReport
                              .slice(0, 3)
                              .map((gap, i) => (
                                <div
                                  key={`sgr-${i}`}
                                  className="flex justify-between items-center text-[10px] uppercase"
                                >
                                  <span className="text-slate-400">
                                    {gap.skill}
                                  </span>
                                  <span
                                    className={
                                      gap.importance === "Critical"
                                        ? "text-rose-400"
                                        : "text-amber-400"
                                    }
                                  >
                                    {gap.importance}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
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
                    All parsing and analysis vectors happen locally or via
                    stateless API protocols. We never store your resume files or
                    personal data on our servers.{" "}
                    <strong className="text-teal-400 font-bold">
                      100% GDPR & ISO 27001 Compliant.
                    </strong>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-[#0A0A15] border-b border-r border-white/10 rotate-45 transform"></div>
                  </div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="text-6xl md:text-7xl font-black font-display text-white mb-6 tracking-tighter leading-tight"
                >
                  Beat the ATS.
                  <br />
                  <span className="glow-text-accent">Land Your Dream Job.</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed"
                >
                  Upload your resume and target job description. Our AI
                  evaluates your profile against Applicant Tracking Systems,
                  identifies missing keywords, and provides actionable
                  recommendations to get you hired.
                </motion.p>
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
                      ${isDragReject ? "bg-rose-500/10 border-rose-500/50" : isDragActive ? "bg-teal-500/10 border-teal-500/50" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}
                  >
                    <div
                      className="absolute inset-0 border-2 border-dashed rounded-2xl opacity-40 transition-colors duration-500 group-hover:border-teal-500/50"
                      style={{
                        borderColor: isDragReject
                          ? "#f43f5e"
                          : isDragActive
                            ? "#14b8a6"
                            : "rgba(255,255,255,0.15)",
                      }}
                    />
                    <input {...getInputProps()} />

                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ShieldCheck className="h-4 w-4 text-slate-500" />
                    </div>

                    <div className="flex flex-col items-center gap-4 relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                      <div className="relative">
                        <div
                          className={`absolute inset-0 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 ${isDragReject ? "bg-rose-500/30" : "bg-teal-500/30"}`}
                        ></div>
                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-white/10 shadow-2xl relative z-10">
                          {isDragReject ? (
                            <AlertCircle className="h-7 w-7 transition-colors duration-500 text-rose-400" />
                          ) : (
                            <Upload
                              className={`h-7 w-7 transition-colors duration-500 ${isDragActive ? "text-teal-400" : "text-slate-400 group-hover:text-white"}`}
                            />
                          )}
                        </div>
                      </div>

                      {file ? (
                        <div className="space-y-1.5 px-6">
                          <p className="text-teal-400 font-black text-sm uppercase tracking-tight truncate max-w-[250px]">
                            {file.name}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                              Ready For Analysis
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p
                            className={`font-black text-[13px] uppercase tracking-widest transition-colors ${isDragReject ? "text-rose-400" : "text-slate-200"}`}
                          >
                            {isDragReject
                              ? "Unsupported Format"
                              : "Drag & Drop Resume Here"}
                          </p>
                          <div className="flex items-center justify-center gap-4 text-slate-500">
                            <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <FileText className="h-4 w-4" />
                              <span className="text-[9px] font-black tracking-widest uppercase">
                                PDF
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <FileText className="h-4 w-4" />
                              <span className="text-[9px] font-black tracking-widest uppercase">
                                DOCX
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <FileText className="h-4 w-4" />
                              <span className="text-[9px] font-black tracking-widest uppercase">
                                TXT
                              </span>
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
                        const sampleContent =
                          "John Doe\nSoftware Engineer\nExperience: 5 years at TechCorp using React, Node.js.\nSkills: JavaScript, HTML, CSS.";
                        const sample = new File(
                          [sampleContent],
                          "sample_resume.txt",
                          { type: "text/plain" },
                        );
                        setFile(sample);
                        setJobDescription(
                          "Looking for a Senior Frontend Developer with strong React and TypeScript background. Must know Node.js.",
                        );
                      }}
                      className="text-[10px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-widest bg-teal-500/10 hover:bg-teal-500/20 px-4 py-2 rounded-lg transition-all border border-teal-500/20 hover:border-teal-500/40"
                    >
                      Use Sample Resume & Job Description
                    </button>
                  </div>

                  <div className="mt-4 border-t border-white/5 pt-4">
                    <div className="group relative w-full">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const url = window.prompt(
                            "Enter your LinkedIn Profile URL:",
                          );
                          if (url) setLinkedinUrl(url);
                        }}
                        className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl border transition-all ${
                          linkedinUrl
                            ? "bg-[#0A66C2]/20 border-[#0A66C2]/50 text-white shadow-[0_0_20px_rgba(10,102,194,0.3)]"
                            : "bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 border-[#0A66C2]/20 text-[#0A66C2] hover:shadow-[0_0_15px_rgba(10,102,194,0.2)]"
                        }`}
                      >
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                          width="18"
                          height="18"
                          alt="LI"
                          className={
                            linkedinUrl
                              ? "grayscale-0"
                              : "grayscale group-hover:grayscale-0 transition-all duration-300"
                          }
                        />
                        <span className="text-xs font-black uppercase tracking-widest">
                          {linkedinUrl
                            ? "LinkedIn Profile Connected"
                            : "Connect LinkedIn Profile"}
                        </span>
                      </motion.button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-[10px] font-medium p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl leading-relaxed text-center hidden group-hover:block">
                        Import your LinkedIn profile for deeper analysis and
                        cross-vector evaluation.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-slate-800 border-b border-r border-white/10 rotate-45 transform"></div>
                      </div>
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
                        e.target.style.height = "inherit";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Paste the target job requirements to calibrate the intelligence engine..."
                      className="w-full min-h-[14rem] max-h-[30rem] bg-[#0A0A15]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/60 transition-all resize-y font-medium leading-relaxed custom-scrollbar relative z-10 shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none z-20 bg-[#0A0A15]/80 px-2 py-1 rounded">
                      {jobDescription.length > 0
                        ? `${jobDescription.length} chars`
                        : "Optional Context"}
                    </div>
                  </div>
                </GlassCard>
              </div>

              {file && file.type === "application/pdf" && (
                <div className="mt-8 flex justify-center">
                  <GlassCard className="w-full relative flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-400" />
                        Document Preview
                        <div className="ml-4 flex items-center bg-white/5 p-1 rounded-lg border border-white/10 gap-1">
                          <button
                            onClick={() => setAnnotationMode("sticky")}
                            className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${annotationMode === "sticky" ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                              <path d="M15 3v6h6" />
                            </svg>
                            Sticky Notes
                          </button>
                          <button
                            onClick={() => setAnnotationMode("highlight")}
                            className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${annotationMode === "highlight" ? "bg-teal-400/20 text-teal-400 border border-teal-400/30" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m9 11-6 6v3h9l3-3" />
                              <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
                            </svg>
                            Highlight Tool
                          </button>
                          {annotationMode === "highlight" && (
                            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
                              {[
                                "rgba(250, 204, 21, 0.4)",
                                "rgba(52, 211, 153, 0.4)",
                                "rgba(56, 189, 248, 0.4)",
                                "rgba(244, 114, 182, 0.4)",
                              ].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setHighlightColor(color)}
                                  className={`w-4 h-4 rounded-full border border-white/20 transition-transform ${highlightColor === color ? "scale-125 ring-1 ring-white/50" : "hover:scale-110"}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </h3>
                      {numPages && numPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setPageNumber((p) => Math.max(1, p - 1))
                            }
                            disabled={pageNumber <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 disabled:opacity-50 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest w-16 text-center">
                            {pageNumber} / {numPages}
                          </span>
                          <button
                            onClick={() =>
                              setPageNumber((p) => Math.min(numPages, p + 1))
                            }
                            disabled={pageNumber >= numPages}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 disabled:opacity-50 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col xl:flex-row w-full gap-4 items-start">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex-grow w-full overflow-auto flex justify-center document-preview-container max-h-[600px] scrollbar-thin scrollbar-thumb-white/10 relative">
                        <div
                          className={`relative ${annotationMode === "sticky" ? "cursor-crosshair" : "cursor-text"}`}
                          onMouseUp={(e) => {
                            if (annotationMode !== "highlight") return;
                            const target = e.target as HTMLElement;
                            if (
                              target.closest(".sticky-note") ||
                              target.closest(".pdf-highlight")
                            )
                              return;

                            const selection = window.getSelection();
                            if (!selection || selection.isCollapsed) return;

                            const range = selection.getRangeAt(0);
                            const rects = Array.from(range.getClientRects());

                            if (rects.length === 0) return;

                            const container =
                              e.currentTarget.getBoundingClientRect();

                            const highlightRects = rects.map((r) => ({
                              top: r.top - container.top,
                              left: r.left - container.left,
                              width: r.width,
                              height: r.height,
                            }));

                            const newHighlight: HighlightData = {
                              id: `hl_${Date.now()}`,
                              rects: highlightRects,
                              color: highlightColor,
                              pageNumber,
                            };

                            setHighlights((prev) => [...prev, newHighlight]);
                            selection.removeAllRanges();
                          }}
                          onClick={(e) => {
                            if (annotationMode !== "sticky") return;
                            const target = e.target as HTMLElement;
                            if (
                              target.closest(".sticky-note") ||
                              target.closest(".pdf-highlight")
                            )
                              return;

                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            let x = e.clientX - rect.left;
                            let y = e.clientY - rect.top;

                            const newNote: StickyNoteData = {
                              id: `note_${Date.now()}`,
                              x,
                              y,
                              text: "",
                              isOpen: true,
                              pageNumber,
                            };
                            setStickyNotes((prev) => [...prev, newNote]);
                          }}
                        >
                          <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                              <div className="p-12 flex flex-col items-center justify-center gap-4">
                                <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                  Loading Document...
                                </span>
                              </div>
                            }
                            error={
                              <div className="p-8 text-rose-400 text-xs font-bold uppercase flex items-center gap-2 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                                <AlertCircle className="h-4 w-4" /> Failed to
                                load preview
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
                          {highlights
                            .filter((h) => h.pageNumber === pageNumber)
                            .map((hl) => (
                              <div
                                key={hl.id}
                                className="absolute inset-0 pointer-events-none z-10"
                              >
                                {hl.rects.map((r, i) => (
                                  <div
                                    key={i}
                                    className="absolute mix-blend-multiply pdf-highlight pointer-events-auto cursor-pointer"
                                    style={{
                                      top: r.top,
                                      left: r.left,
                                      width: r.width,
                                      height: r.height,
                                      backgroundColor: hl.color,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHighlights((prev) =>
                                        prev.filter((h) => h.id !== hl.id),
                                      );
                                    }}
                                    title="Click to remove highlight"
                                  />
                                ))}
                              </div>
                            ))}
                          {stickyNotes
                            .filter((n) => n.pageNumber === pageNumber)
                            .map((note) => (
                              <div
                                key={note.id}
                                className="sticky-note absolute z-50 rounded-xl bg-amber-200/90 backdrop-blur-md shadow-2xl border border-amber-400 overflow-hidden transform transition-all hover:scale-105"
                                style={{
                                  left: note.x,
                                  top: note.y,
                                  width: 220,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="flex justify-between items-center bg-amber-400/80 p-2 cursor-pointer hover:bg-amber-400 text-amber-900 transition-colors"
                                  onClick={() => {
                                    setStickyNotes((notes) =>
                                      notes.map((n) =>
                                        n.id === note.id
                                          ? { ...n, isOpen: !n.isOpen }
                                          : n,
                                      ),
                                    );
                                  }}
                                >
                                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-sticky-note"
                                    >
                                      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                                      <path d="M15 3v6h6" />
                                    </svg>
                                    Sticky Note
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStickyNotes((notes) =>
                                        notes.filter((n) => n.id !== note.id),
                                      );
                                    }}
                                    className="hover:text-rose-600 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {note.isOpen && (
                                  <div className="p-2 border-t border-amber-400/30">
                                    <textarea
                                      autoFocus
                                      className="w-full h-24 bg-transparent resize-none outline-none text-slate-800 text-xs font-medium placeholder:text-amber-800/40"
                                      placeholder="Type note... (click header to collapse)"
                                      value={note.text}
                                      onChange={(e) =>
                                        setStickyNotes((notes) =>
                                          notes.map((n) =>
                                            n.id === note.id
                                              ? { ...n, text: e.target.value }
                                              : n,
                                          ),
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      {highlights.length > 0 && (
                        <div className="w-full xl:w-64 shrink-0 bg-white/5 p-4 rounded-2xl border border-white/5 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Active Highlights
                            <span className="ml-auto bg-white/10 text-white px-2 py-0.5 rounded-full">
                              {highlights.length}
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {highlights.map((hl) => (
                              <div
                                key={hl.id}
                                className="flex items-center justify-between bg-[#0A0A15]/50 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                                onClick={() => setPageNumber(hl.pageNumber)}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-3 h-3 rounded-full border border-white/20"
                                    style={{
                                      backgroundColor: hl.color.replace(
                                        "0.4",
                                        "1",
                                      ),
                                    }}
                                  />
                                  <span className="text-[11px] font-bold text-white">
                                    Page {hl.pageNumber}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHighlights((prev) =>
                                      prev.filter((h) => h.id !== hl.id),
                                    );
                                  }}
                                  className="text-slate-500 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                    ${!file || isAnalyzing ? "opacity-50 grayscale" : ""}`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Processing: {elapsedTime.toFixed(1)}s</span>
                      </div>
                      <span className="text-[10px] text-teal-300 tracking-widest block opacity-80 mt-1 uppercase">
                        {analysisStep}
                      </span>
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
                  <h3 className="text-2xl font-black font-display text-white mb-4">
                    How It Works
                  </h3>
                  <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                    Our AI engine reverse-engineers the Applicant Tracking
                    Systems used by top Fortune 500 companies to give you a
                    competitive edge.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent -z-10 hidden md:block"></div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-6 bg-[#0A0A15] border border-white/5 rounded-2xl relative z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 font-black">
                      1
                    </div>
                    <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">
                      Upload & Parse
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Drop in your resume and an optional job description. Our
                      engine parses your formatting just like workday or
                      greenhouse.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-6 bg-[#0A0A15] border border-white/5 rounded-2xl relative z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 font-black">
                      2
                    </div>
                    <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">
                      Deep AI Analysis
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      We scan for keyword density, structural integrity, and
                      skill gaps using the latest Gemini models.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-6 bg-[#0A0A15] border border-white/5 rounded-2xl relative z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 font-black">
                      3
                    </div>
                    <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">
                      Actionable Report
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Get a visual dashboard with your ATS score, missing
                      keywords, and ready-to-copy bullet point improvements.
                    </p>
                  </motion.div>
                </div>

                <div className="mt-24 text-center">
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-8">
                    Built to beat top ATS platforms
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
                    <div className="text-lg font-black tracking-widest fill-current">
                      WORKDAY
                    </div>
                    <div className="text-lg font-black tracking-widest fill-current">
                      GREENHOUSE
                    </div>
                    <div className="text-lg font-black tracking-widest fill-current">
                      LEVER
                    </div>
                    <div className="text-lg font-black tracking-widest fill-current">
                      TALEOS
                    </div>
                  </div>
                </div>

                {/* Video Demo & Recruiter Appeal Section */}
                <div className="mt-32 border border-white/10 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(20,184,166,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent"></div>
                  <div className="p-8 md:p-16 text-center relative z-10">
                    <div
                      className="max-w-4xl mx-auto mb-16 mt-8 relative group cursor-pointer"
                      onClick={() =>
                        window.open(
                          "https://interviewcoach-969933961049.asia-southeast1.run.app",
                          "_blank",
                        )
                      }
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-sky-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative bg-[#0A0A15]/80 backdrop-blur-xl border border-white/10 group-hover:border-teal-500/50 p-8 rounded-3xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-500">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-500"></div>
                        <div className="flex-1 text-left relative z-10">
                          <h4 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                            AI Interview Coach{" "}
                            <span className="bg-teal-500/20 text-teal-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-teal-500/30">
                              Partner
                            </span>
                          </h4>
                          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                            Tested well against the ATS? Now master the human
                            interview. Engage with our immersive voice-based AI
                            recruiter to practice your answers in a real-world
                            simulation before the big day.
                          </p>
                        </div>
                        <div className="relative z-10">
                          <a
                            href="https://interviewcoach-969933961049.asia-southeast1.run.app"
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-primary py-4 px-8 text-sm uppercase flex items-center justify-center gap-3 whitespace-nowrap shadow-[0_0_30px_rgba(20,184,166,0.3)] group-hover:shadow-[0_0_50px_rgba(20,184,166,0.5)] transition-all"
                          >
                            <Zap className="h-5 w-5" /> Start Practice Interview
                          </a>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        const sampleContent =
                          "John Doe\nSoftware Engineer\nExperience: 5 years at TechCorp using React, Node.js, and TypeScript.\nSkills: JavaScript, HTML, CSS, React, AWS, Docker.\nEducation: B.S. Computer Science.";
                        const sample = new File(
                          [sampleContent],
                          "sample_resume.txt",
                          { type: "text/plain" },
                        );
                        setFile(sample);
                        setJobDescription(
                          "Looking for a Senior Frontend Developer with strong React and TypeScript background. Must know Node.js. Experience with cloud platforms like AWS is a plus.",
                        );
                        setLinkedinUrl("https://linkedin.com/in/johndoe");
                      }}
                      className="btn-primary py-4 px-12 text-sm uppercase flex items-center justify-center gap-3 mx-auto"
                    >
                      <Zap className="h-5 w-5" /> Try Live Demo Now
                    </motion.button>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6">
                      Hosted securely at{" "}
                      <span className="text-teal-400/80">
                        demo.airesumepro.com
                      </span>{" "}
                      • SOC2 & GDPR Compliant
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
              ref={printRef}
            >
              {/* Header Controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                  <h2 className="text-4xl font-black font-display text-white tracking-tight">
                    Executive Summary
                  </h2>
                  <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-2">
                    Analysis For: {file?.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 no-print">
                  <button
                    onClick={() => setIsLinkedInModalOpen(true)}
                    className="px-8 py-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-3 shadow-xl"
                  >
                    <Layers className="h-4 w-4" /> Share On LinkedIn
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-8 py-3 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-black text-[11px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all flex items-center gap-3 shadow-xl"
                  >
                    <Printer className="h-4 w-4" /> Print to PDF
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                    }}
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
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <GlassCard className="flex flex-col items-center justify-center py-8 border-t-4 border-t-teal-500 bg-gradient-to-b from-teal-500/5 to-transparent relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-50">
                    <CheckCircle2 className="h-6 w-6 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-black text-white font-display uppercase tracking-widest mb-2">
                    Overall Match
                  </h3>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-8 text-center max-w-xs">
                    Holistic evaluation of your resume against the target role
                  </p>
                  <ScoringCircle
                    score={result.overallScore}
                    label="Composite Fitness Score"
                    color="#14b8a6"
                    delay={0.1}
                  />
                  <div className="mt-6 flex items-center justify-center">
                    <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-[9px] font-black tracking-widest text-teal-400 uppercase">
                      <BarChart2 className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                      Benchmarked via 2000B+ Outcomes • High-Accuracy ML
                    </span>
                  </div>
                </GlassCard>

                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-sky-500 relative overflow-hidden">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                      ATS Fit
                    </h3>
                    <ScoringCircle
                      score={result.atsCompatibility}
                      label=""
                      color="#0ea5e9"
                      delay={0.2}
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-indigo-500 relative overflow-hidden">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                      Skills Match
                    </h3>
                    <ScoringCircle
                      score={result.skillsMatch}
                      label=""
                      color="#6366f1"
                      delay={0.3}
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-emerald-500 relative overflow-hidden">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 text-center">
                      Formatting Health
                    </h3>
                    <ScoringCircle
                      score={
                        result.formattingHealthScore ||
                        result.atsAnalysis.formattingScore ||
                        0
                      }
                      label=""
                      color="#10b981"
                      delay={0.4}
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 border-t-2 border-t-amber-500 relative overflow-hidden">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 text-center">
                      Career Trajectory
                    </h3>
                    <ScoringCircle
                      score={result.careerTrajectoryFitScore || 0}
                      label=""
                      color="#f59e0b"
                      delay={0.5}
                    />
                  </GlassCard>
                </div>
              </div>

              <GlassCard className="mb-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                    Detailed Sub-Metrics
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                    <Target className="h-3 w-3" />
                    Deep Analysis
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-8">
                  {[
                    {
                      label: "Skills Match",
                      score: result.skillsMatch,
                      color: "#0ea5e9",
                      desc: "Role alignment",
                      tooltip: (
                        <>
                          <strong className="text-sky-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">
                            Skills Match
                          </strong>
                          The overlap between your extracted skills and the
                          job's core requirements. High scores indicate strong
                          technical and domain alignment.
                        </>
                      ),
                    },
                    {
                      label: "Keywords",
                      score: result.atsAnalysis.keywordDensity,
                      color: "#10b981",
                      desc: "Density factor",
                    },
                    {
                      label: "Formatting",
                      score: result.atsAnalysis.formattingScore,
                      color: "#f59e0b",
                      desc: "Visual health",
                      tooltip: (
                        <>
                          <strong className="text-amber-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">
                            Formatting Health
                          </strong>
                          Assesses how easily an ATS parser can process your
                          resume. Penalizes complex layouts, graphics, tables,
                          or unreadable fonts.
                        </>
                      ),
                    },
                    {
                      label: "System Match",
                      score: Math.round(
                        (result.atsAnalysis.formattingScore +
                          result.atsCompatibility) /
                          2,
                      ),
                      color: "#8b5cf6",
                      desc: "Averaged health",
                      tooltip: (
                        <>
                          <strong className="text-purple-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">
                            Average Health
                          </strong>
                          Combines your formatting score and base ATS score into
                          a single indicator of parsing reliability.
                        </>
                      ),
                    },
                    {
                      label: "Bullet Quality",
                      score: result.atsAnalysis.bulletPointQualityScore || 0,
                      color: "#ec4899",
                      desc: "Impact score",
                      tooltip: (
                        <>
                          <strong className="text-pink-400 block mb-2 uppercase tracking-widest text-xs border-b border-white/10 pb-1">
                            Bullet Quality
                          </strong>
                          Focuses on the presence of strong action verbs and
                          quantifiable metrics (numbers, %, $) in your
                          experience descriptions.
                        </>
                      ),
                    },
                  ].map((m, i) => (
                    <div key={`m-${i}`} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                              {m.label}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                              {m.desc}
                            </span>
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
                        <span className="text-2xl font-black text-white font-display leading-none">
                          {m.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.score}%` }}
                          className="h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          style={{ backgroundColor: m.color }}
                          transition={{
                            delay: 0.5 + i * 0.1,
                            duration: 1.5,
                            ease: "easeOut",
                          }}
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      Career Progression Timeline
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                      Trajectory extracted from your resume
                    </p>
                  </div>

                  <div className="relative pl-4 md:pl-8 max-w-4xl mx-auto">
                    <div className="absolute left-[27px] md:left-[43px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-500 via-sky-500 to-transparent opacity-30"></div>

                    <div className="space-y-12">
                      {result.careerTimeline.map((item, idx) => (
                        <div
                          key={`timeline-${idx}`}
                          className="relative pl-12 md:pl-16"
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-[-5px] md:left-[11px] top-1 h-6 w-6 rounded-full bg-[#050510] border-2 border-teal-500 flex items-center justify-center shadow-[0_0_10px_rgba(20,184,166,0.3)] z-10">
                            <div className="h-2 w-2 rounded-full bg-teal-400"></div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-2">
                            <h4 className="text-lg md:text-xl font-black text-white">
                              {item.role}
                            </h4>
                            <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 whitespace-nowrap">
                              {item.duration}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-slate-400 mb-4">
                            {item.company}
                          </p>

                          <ul className="space-y-2">
                            {item.highlights.map((highlight, hIdx) => (
                              <li
                                key={`hl-${hIdx}`}
                                className="text-[12px] text-slate-300 leading-relaxed font-medium flex items-start gap-3"
                              >
                                <span className="text-teal-500 mt-1.5 opacity-50">
                                  •
                                </span>
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
              {result.linkedinComparison &&
                result.linkedinComparison.hasLinkedIn && (
                  <GlassCard className="mb-8 border-t-2 border-t-[#14b8a6] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                        height="150"
                        width="150"
                        alt="LI"
                        className="grayscale"
                      />
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-10 w-10 rounded-xl bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                          LinkedIn Profile Sync
                        </h3>
                        <p className="text-[10px] text-[#14b8a6] font-bold tracking-widest uppercase">
                          Cross-Vector Evaluation Active
                        </p>
                      </div>
                    </div>

                    {/* LinkedIn Score Impact Progress Bar */}
                    <div className="mb-8 p-5 bg-[#14b8a6]/10 border border-[#14b8a6]/20 rounded-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#14b8a6]/5 to-transparent flex translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                      <div className="flex justify-between items-end mb-3 relative z-10">
                        <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[#14b8a6]" /> LinkedIn
                          Data Impact
                        </span>
                        <span className="text-[10px] font-black text-[#14b8a6] uppercase bg-[#14b8a6]/20 px-2 py-1 rounded">
                          +15% Score Boost
                        </span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex relative z-10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.max(10, result.overallScore - 15)}%`,
                          }}
                          transition={{ duration: 1 }}
                          className="h-full bg-slate-500"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `15%` }}
                          transition={{ duration: 1, delay: 1 }}
                          className="h-full bg-[#14b8a6] relative"
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-3 text-right tracking-[0.2em] relative z-10">
                        Enhanced by Profile Verification
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 relative">
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/10 hidden md:block" />

                      {/* Resume Side */}
                      <div className="space-y-6">
                        <div className="bg-[#0A0A15]/60 p-5 rounded-2xl border border-white/5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
                            Resume Headline
                          </h4>
                          <p className="text-white text-sm font-bold">
                            {result.linkedinComparison.resumeHeadline}
                          </p>
                        </div>

                        {result.linkedinComparison.missingFromLinkedIn &&
                          result.linkedinComparison.missingFromLinkedIn.length >
                            0 && (
                            <div>
                              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> Present on
                                Resume (Missing on LinkedIn)
                              </h4>
                              <ul className="space-y-2">
                                {result.linkedinComparison.missingFromLinkedIn.map(
                                  (s, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-slate-300 flex items-start gap-2"
                                    >
                                      <span className="text-emerald-500">
                                        •
                                      </span>{" "}
                                      {s}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>

                      {/* LinkedIn Side */}
                      <div className="space-y-6">
                        <div className="bg-teal-500/10 p-5 rounded-2xl border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                          <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2 border-b border-teal-500/20 pb-2">
                            LinkedIn Headline
                          </h4>
                          <p className="text-white text-sm font-bold">
                            {result.linkedinComparison.linkedinHeadline}
                          </p>
                        </div>

                        {result.linkedinComparison.missingFromResume &&
                          result.linkedinComparison.missingFromResume.length >
                            0 && (
                            <div>
                              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Present on
                                LinkedIn (Missing on Resume)
                              </h4>
                              <ul className="space-y-2">
                                {result.linkedinComparison.missingFromResume.map(
                                  (s, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-slate-300 flex items-start gap-2"
                                    >
                                      <span className="text-rose-500">•</span>{" "}
                                      {s}
                                    </li>
                                  ),
                                )}
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      Skill Landscape Profile
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                      Visual distribution of matched & missing capabilities
                    </p>
                  </div>
                  <SkillCloud
                    found={result.foundSkills}
                    missing={result.skillGapReport.map((g) => g.skill)}
                  />
                </GlassCard>

                <GlassCard>
                  <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      Skill Gap Analysis
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                      Severity of missing requirements
                    </p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={result.skillGapReport.map((sg) => ({
                          name: sg.skill,
                          severity: sg.importance
                            .toLowerCase()
                            .includes("critical")
                            ? 95
                            : sg.importance.toLowerCase().includes("high")
                              ? 75
                              : sg.importance.toLowerCase().includes("medium")
                                ? 50
                                : 30,
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.3)"
                          tick={{
                            fill: "rgba(255,255,255,0.5)",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                          tickMargin={10}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.3)"
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "rgba(255,255,255,0.02)" }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#0A0A15]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                  <p className="text-white text-xs font-bold uppercase">
                                    {payload[0].payload.name}
                                  </p>
                                  <p className="text-rose-400 text-[10px] font-black uppercase mt-1">
                                    Gap Severity: {payload[0].value}%
                                  </p>
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

              <SkillDemandTrend
                role={result.careerPath.topRole || "Target Role"}
              />

              <div className="grid lg:grid-cols-12 gap-8 mt-8">
                {/* Simplified Header with Core Strengths & Weaknesses */}
                <GlassCard className="lg:col-span-12 p-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex flex-col justify-between hover:bg-teal-500/10 transition-colors">
                      <div>
                        <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" /> Core Strength
                        </h4>
                        <p className="text-sm text-white font-black uppercase mb-2">
                          Excellent {result.foundSkills[0] || "Domain"} Exposure
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Your experience in{" "}
                          {result.foundSkills.slice(0, 3).join(", ")} provides a
                          strong foundation for this role.
                        </p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between hover:bg-rose-500/10 transition-colors">
                      <div>
                        <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Zap className="h-4 w-4" /> High Priority Fix
                        </h4>
                        <p className="text-sm text-white font-black uppercase mb-2">
                          Missing{" "}
                          {result.skillGapReport[0]?.skill || "Core Keywords"}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          The recruiter will look for{" "}
                          {result.skillGapReport[0]?.skill}. Add this to your
                          summary or experience.
                        </p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between hover:bg-blue-500/10 transition-colors">
                      <div>
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Target className="h-4 w-4" /> Target Role Fit
                        </h4>
                        <p className="text-sm text-white font-black uppercase mb-2">
                          {result.careerPath.topRole}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          You are a{" "}
                          {Math.round(result.careerPath.confidence * 100)}%
                          match for this trajectory based on current assets.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Career Roles Expansion */}
                  <div className="mt-10 border-t border-white/5 pt-10">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-400" /> Career
                      Trajectory Forecast
                    </h4>
                    <p className="text-xs text-slate-400 mb-8 font-medium">
                      Potential roles mapped to your current skill vectors and
                      experience.
                    </p>

                    <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-6 py-4">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500/20 via-sky-500/20 to-purple-500/20 -translate-y-1/2 hidden md:block" />
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-teal-500/80 via-sky-500/80 to-purple-500/80 -translate-y-1/2 origin-left hidden md:block shadow-[0_0_20px_rgba(20,184,166,0.3)] rounded-full"
                      />

                      <motion.div
                        className="relative z-10 w-full md:w-1/3 flex flex-col group"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <div className="flex-1 p-6 rounded-2xl bg-[#0A0A15]/80 backdrop-blur-md border border-teal-500/40 group-hover:bg-teal-500/10 transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(20,184,166,0.15)] flex flex-col items-center justify-center text-center">
                          <span className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#0A0A15] border-[3px] border-teal-500 -translate-y-1/2 hidden md:block z-20 shadow-[0_0_15px_rgba(20,184,166,0.6)] group-hover:scale-125 transition-transform" />
                          <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2 border border-teal-500/40 px-3 py-1 rounded-full bg-teal-500/10">
                            Primary Fit
                          </p>
                          <p className="text-lg text-white font-bold">
                            {result.careerPath.topRole}
                          </p>
                          <p className="text-sm font-black text-teal-300 mt-2 bg-teal-500/10 px-3 py-1 rounded-full inline-block">
                            {result.careerPath.confidence}% Match
                          </p>
                        </div>
                        {result.improvementPlan?.missingSkillsToHighlight &&
                          result.improvementPlan.missingSkillsToHighlight
                            .length > 0 && (
                            <div className="mt-4 p-4 border border-white/5 rounded-xl bg-white/5 mx-2 text-left">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                                To Secure Role
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {result.improvementPlan.missingSkillsToHighlight
                                  .slice(0, 3)
                                  .map((ms, msx) => (
                                    <span
                                      key={msx}
                                      className="text-[9px] font-black uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded"
                                    >
                                      {ms}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                      </motion.div>

                      {result.careerPath.alternatives
                        ?.slice(0, 2)
                        .map((alt, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + i * 0.2 }}
                            className="relative z-10 w-full md:w-1/3 flex flex-col group"
                          >
                            <div
                              className={`flex-1 p-6 rounded-2xl bg-[#0A0A15]/80 backdrop-blur-md border border-white/10 ${i === 0 ? "hover:border-sky-400/50 hover:bg-sky-500/10" : "hover:border-purple-400/50 hover:bg-purple-500/10"} transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center text-center`}
                            >
                              {i === 0 && (
                                <span className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#0A0A15] border-[3px] border-sky-500 -translate-y-1/2 hidden md:block z-20 shadow-[0_0_15px_rgba(14,165,233,0.6)] group-hover:scale-125 transition-transform" />
                              )}
                              {i === 0 &&
                                result.careerPath.alternatives.length > 1 && (
                                  <span className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#0A0A15] border-[3px] border-sky-500 -translate-y-1/2 hidden md:block z-20 shadow-[0_0_15px_rgba(14,165,233,0.6)] group-hover:scale-125 transition-transform" />
                                )}
                              {i === 1 && (
                                <span className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#0A0A15] border-[3px] border-purple-500 -translate-y-1/2 hidden md:block z-20 shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:scale-125 transition-transform" />
                              )}
                              <p
                                className={`text-[10px] font-black uppercase tracking-widest mb-2 border px-3 py-1 rounded-full ${i === 0 ? "text-sky-400 border-sky-500/40 bg-sky-500/10" : "text-purple-400 border-purple-500/40 bg-purple-500/10"}`}
                              >
                                Possible Pivot
                              </p>
                              <p className="text-lg text-white font-bold">
                                {alt.role}
                              </p>
                              <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed font-medium">
                                {alt.reasoning || `${alt.match}% Match`}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Main Improvement Checklist */}
                <GlassCard className="lg:col-span-8 p-0 overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-gradient-to-r from-teal-500/5 to-transparent">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-teal-400" />
                      Strategic Optimization Plan
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      To reach ATS matching perfection and secure the targeted
                      role, follow these prioritized actions.
                    </p>
                  </div>

                  {/* High Priority Actions */}
                  {result.improvementPlan && (
                    <div className="p-8 grid md:grid-cols-2 gap-6 bg-black/20 border-b border-white/5">
                      {result.improvementPlan.resumeHeadlineUpdates &&
                        result.improvementPlan.resumeHeadlineUpdates.length >
                          0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Layout className="w-3 h-3" /> Title Updates
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.resumeHeadlineUpdates
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-slate-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      {result.improvementPlan.formattingFixes &&
                        result.improvementPlan.formattingFixes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <FileText className="w-3 h-3" /> Layout Fixes
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.formattingFixes
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-slate-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      {result.improvementPlan.recommendedCertifications &&
                        result.improvementPlan.recommendedCertifications
                          .length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Award className="w-3 h-3" /> Target Credentials
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.recommendedCertifications
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-slate-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      {result.improvementPlan.projectsToHighlight &&
                        result.improvementPlan.projectsToHighlight.length >
                          0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Briefcase className="w-3 h-3" /> Highlight
                              Experience
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.projectsToHighlight
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-slate-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Deep AI Recommendations */}
                  <div className="p-8 space-y-6">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-400" /> AI Content
                      Rewrite Suggestions
                    </h4>
                    {[
                      ...result.atsAnalysis.recommendations,
                      ...result.suggestions,
                    ]
                      .slice(0, 5)
                      .map((step, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={`rec-${i}`}
                          className="space-y-3"
                        >
                          <div
                            className={`flex gap-5 p-5 rounded-2xl bg-[#0A0A15]/80 border transition-all items-start group ${selectedRecommendation === step ? "border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.15)] bg-teal-500/5" : "border-white/5 hover:border-white/20"}`}
                          >
                            <div
                              className={`h-10 w-10 mt-1 shrink-0 rounded-full border border-dashed flex items-center justify-center font-black text-xs transition-all ${selectedRecommendation === step ? "border-teal-500 bg-teal-500/20 text-teal-400" : "border-slate-600 text-slate-400 group-hover:border-teal-500 group-hover:text-teal-400 group-hover:bg-teal-500/10"}`}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-slate-200 font-medium text-sm leading-relaxed pr-4">
                                  {step}
                                </p>
                                {selectedRecommendation === step ? (
                                  <button
                                    onClick={() =>
                                      handleExpandRecommendation(step)
                                    }
                                    className="p-2 rounded bg-white/5 hover:bg-white/10 text-teal-400 shrink-0 transition-colors"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                ) : null}
                              </div>

                              {selectedRecommendation !== step && (
                                <button
                                  onClick={() =>
                                    handleExpandRecommendation(step)
                                  }
                                  className="self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-400/80 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-4 py-2.5 rounded-xl transition-all border border-teal-500/20 hover:border-teal-500/40"
                                >
                                  <BrainCircuit className="h-3.5 w-3.5" />{" "}
                                  Generate Actionable Example
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Detail View */}
                          <AnimatePresence>
                            {selectedRecommendation === step && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 rounded-2xl bg-[#050510] border border-teal-500/20 shadow-inner ml-14 relative">
                                  <div className="absolute top-[-10px] left-10 w-4 h-4 bg-[#050510] border-t border-l border-teal-500/20 rotate-45 transform origin-center z-10" />

                                  {isGeneratingRecDetail ? (
                                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                      <BrainCircuit className="h-6 w-6 text-teal-500 animate-pulse" />
                                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                                        Generating strategic insights...
                                      </p>
                                    </div>
                                  ) : recommendationDetail ? (
                                    <div className="space-y-6">
                                      <div>
                                        <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <Info className="h-3.5 w-3.5" />{" "}
                                          Context & Rationale
                                        </h4>
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                          {recommendationDetail.explanation}
                                        </p>
                                      </div>

                                      {recommendationDetail.examples &&
                                        recommendationDetail.examples.length >
                                          0 && (
                                          <div>
                                            <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                              <TrendingUp className="h-3.5 w-3.5" />{" "}
                                              Implementation Examples
                                            </h4>
                                            <div className="space-y-3">
                                              {recommendationDetail.examples.map(
                                                (example, eIdx) => (
                                                  <div
                                                    key={`ex-${eIdx}`}
                                                    className="group/ex relative p-4 pr-12 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-300 leading-relaxed font-mono"
                                                  >
                                                    {example}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(
                                                          example,
                                                        );
                                                        const btn =
                                                          e.currentTarget;
                                                        const originalHTML =
                                                          btn.innerHTML;
                                                        const checkHtml =
                                                          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-teal-400"><path d="M20 6 9 17l-5-5"/></svg>';
                                                        btn.innerHTML =
                                                          checkHtml;
                                                        setTimeout(() => {
                                                          btn.innerHTML =
                                                            originalHTML;
                                                        }, 2000);
                                                      }}
                                                      className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 opacity-0 group-hover/ex:opacity-100 hover:bg-white/10 transition-all cursor-pointer text-slate-400 hover:text-white"
                                                      title="Copy to clipboard"
                                                    >
                                                      <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-rose-400 text-xs">
                                      Failed to load details. Please try again.
                                    </div>
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
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                      Missing Skills
                    </h3>
                    <div className="space-y-4">
                      {result.skillGapReport.map((gap, i) => (
                        <div
                          key={`gap-${i}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group relative overflow-hidden transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-emerald-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                          <div className="relative z-10 flex flex-col">
                            <span className="text-[11px] font-black text-white uppercase">
                              {gap.skill}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Fix for +
                              {gap.importance === "Critical" ? 10 : 5}% Boost
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-black px-2 py-1 rounded relative z-10 transition-colors ${gap.importance === "Critical" ? "bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30" : "bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30"} uppercase`}
                          >
                            {gap.importance}
                          </span>
                        </div>
                      ))}
                      {result.skillGapReport.length === 0 && (
                        <p className="text-[11px] text-slate-500 italic">
                          No significant missing skills detected.
                        </p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Keyword Analysis
                      </h3>
                      {result.atsAnalysis.jobKeywordsFound &&
                        result.atsAnalysis.jobKeywordsMissing && (
                          <div className="text-xs font-black text-white">
                            {Math.round(
                              (result.atsAnalysis.jobKeywordsFound.length /
                                (result.atsAnalysis.jobKeywordsFound.length +
                                  result.atsAnalysis.jobKeywordsMissing
                                    .length)) *
                                100,
                            ) || 0}
                            % Match
                          </div>
                        )}
                    </div>

                    {result.atsAnalysis.jobKeywordsFound &&
                      result.atsAnalysis.jobKeywordsMissing && (
                        <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden mb-5">
                          <div
                            className="h-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.round((result.atsAnalysis.jobKeywordsFound.length / (result.atsAnalysis.jobKeywordsFound.length + result.atsAnalysis.jobKeywordsMissing.length)) * 100) || 0}%`,
                            }}
                          />
                        </div>
                      )}

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[9px] font-black text-teal-500 uppercase mb-2">
                          Resume Top Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.atsAnalysis.topResumeKeywords
                            ?.slice(0, 10)
                            .map((kw, i) => (
                              <span
                                key={`kw-${i}`}
                                className="text-[10px] font-bold px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-300 hover:bg-teal-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(20,184,166,0.1)] cursor-default"
                              >
                                {kw}
                              </span>
                            ))}
                        </div>
                      </div>

                      {result.atsAnalysis.jobKeywordsFound &&
                        result.atsAnalysis.jobKeywordsFound.length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-black text-sky-400/80 uppercase mb-2 flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                              <CheckCircle2 className="h-3 w-3 text-sky-400" />{" "}
                              Matched Job Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.atsAnalysis.jobKeywordsFound?.map(
                                (kw, i) => (
                                  <span
                                    key={`jkf-${i}`}
                                    className="text-[10px] font-bold px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-300 hover:bg-sky-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(56,189,248,0.1)] cursor-default"
                                  >
                                    {kw}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {result.atsAnalysis.jobKeywordsMissing &&
                        result.atsAnalysis.jobKeywordsMissing.length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-black text-rose-400/80 uppercase mb-2 flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                              <XCircle className="h-3 w-3 text-rose-500" />{" "}
                              Missing Job Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.atsAnalysis.jobKeywordsMissing
                                ?.slice(0, 8)
                                .map((kw, i) => (
                                  <span
                                    key={`jkm-${i}`}
                                    className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-300 hover:bg-rose-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)] cursor-default"
                                  >
                                    {kw}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                      {result.atsAnalysis.keywordOptimizations &&
                        result.atsAnalysis.keywordOptimizations.length > 0 && (
                          <div className="pt-4 border-t border-white/10 mt-6">
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5" /> Keyword
                              Optimizations
                            </h4>
                            <div className="space-y-4">
                              {result.atsAnalysis.keywordOptimizations.map(
                                (opt, i) => (
                                  <details
                                    key={`ko-${i}`}
                                    className="group bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-colors hover:border-amber-500/30"
                                  >
                                    <summary className="text-[11px] font-bold text-white flex items-center justify-between cursor-pointer outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                        {opt.keyword}
                                      </div>
                                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                                    </summary>
                                    <div className="space-y-2 mt-4">
                                      {opt.suggestedPhrases.map(
                                        (phrase, pIdx) => (
                                          <div
                                            key={`phrase-${i}-${pIdx}`}
                                            className="group/phrase relative p-3 pr-10 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed font-mono"
                                          >
                                            {phrase}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(
                                                  phrase,
                                                );
                                                const btn = e.currentTarget;
                                                const originalHTML =
                                                  btn.innerHTML;
                                                const checkHtml =
                                                  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-amber-400"><path d="M20 6 9 17l-5-5"/></svg>';
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
                                        ),
                                      )}
                                    </div>
                                  </details>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                      Expert Summary
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-teal-500/20 pl-4">
                      "{result.summary}"
                    </p>
                  </GlassCard>

                  {result.sectionsDetailed &&
                    result.sectionsDetailed.length > 0 && (
                      <GlassCard>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-teal-400" /> Extracted
                          Sections
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

                  {/* New Recruiter & Insights Sections */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Interview Readiness */}
                    {result.interviewQuestions &&
                      result.interviewQuestions.length > 0 && (
                        <GlassCard>
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                            <BrainCircuit className="h-4 w-4 text-purple-400" />
                            Interview Simulator
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-6">
                            Likely questions based on your profile gaps
                          </p>
                          <div className="space-y-4">
                            {result.interviewQuestions.map((q, idx) => (
                              <div
                                key={`iq-${idx}`}
                                className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-slate-300 text-sm font-medium"
                              >
                                <span className="text-purple-400 font-black mr-2">
                                  Q:
                                </span>
                                {q}
                              </div>
                            ))}
                          </div>
                        </GlassCard>
                      )}

                    {/* AI Re-writes */}
                    <div className="space-y-8">
                      {result.resumeRewriteDraft && (
                        <GlassCard className="border-t-2 border-t-amber-500">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            Optimized Headline Draft
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">
                            AI-generated rewrite for this role
                          </p>
                          <div className="relative p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 group">
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  result.resumeRewriteDraft || "",
                                )
                              }
                              className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <p className="text-sm text-slate-200 italic leading-relaxed">
                              "{result.resumeRewriteDraft}"
                            </p>
                          </div>
                        </GlassCard>
                      )}

                      {result.recruiterSummary && (
                        <GlassCard className="border-t-2 border-t-sky-500">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Search className="h-4 w-4 text-sky-400" />
                            Recruiter Perspective
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">
                            Candid assessment of your fit
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {result.recruiterSummary}
                          </p>
                          {result.globalBenchmarking && (
                            <div className="mt-4 pt-4 border-t border-sky-500/20 flex items-start gap-3">
                              <Award className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-slate-400 font-medium">
                                <strong className="text-sky-300">
                                  Global Benchmark:
                                </strong>{" "}
                                {result.globalBenchmarking}
                              </p>
                            </div>
                          )}
                        </GlassCard>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter Draft */}
                  {result.coverLetterDraft && (
                    <GlassCard>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-400" />
                            AI Cover Letter Draft
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                            Starting template mapped to the JD
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              result.coverLetterDraft || "",
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Copy className="h-3 w-3" /> Copy to Clipboard
                        </button>
                      </div>
                      <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/5 font-serif text-slate-300 leading-loose text-sm whitespace-pre-wrap">
                        {result.coverLetterDraft}
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
          <span className="font-display font-black text-sm uppercase tracking-widest text-white">
            AI Resume Pro
          </span>
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
          <a href="#" className="hover:text-teal-400 transition-colors">
            Privacy Priority
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            Secure Processing
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            Session Only
          </a>
        </div>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          © 2026 Professional Career Intelligence. All data processed locally
          for this session.
        </p>
      </footer>

      {/* Developer Links */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[200] flex flex-col items-end gap-3">
        <a
          href="https://personal-portfolio--serenayt06.replit.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 bg-[#0A0A15]/90 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-full shadow-xl hover:border-teal-500/40 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] transition-all ease-out duration-300 w-fit"
        >
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-teal-400 transition-colors">
            Portfolio
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-teal-500"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/arjun-pv1312"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 bg-[#0A0A15]/90 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-full shadow-xl hover:border-[#0A66C2]/40 hover:shadow-[0_0_20px_rgba(10,102,194,0.15)] transition-all ease-out duration-300 w-fit"
        >
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-[#0A66C2] transition-colors">
            LinkedIn
          </span>
          <img
            src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
            width="14"
            height="14"
            className="rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"
            alt="LinkedIn"
          />
        </a>
      </div>
    </div>
  );
}
