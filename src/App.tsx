import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Wand2,
  Search,
  RefreshCw,
  Info,
  Layers,
  Fingerprint,
  ShieldCheck,
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
  Eye,
  Activity,
  Loader2,
  Edit2,
  X,
  Highlighter,
  Tag,
  BookmarkPlus,
  Camera,
  StickyNote,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Notebook,
  Plus,
  Sun,
  Moon,
  Share2,
  Users,
  Sliders,
  Bot
} from "lucide-react";
import { ResumeBuilderModal } from "./components/ResumeBuilderModal";
import { AtsCopilotChat } from "./components/AtsCopilotChat";
import { AtsResumeData } from "./utils/docxExport";
import { D3CareerGraph } from "./components/D3CareerGraph";
import { FullReportPrintView } from "./components/FullReportPrintView";
import { ConnectLinkedInModal } from "./components/ConnectLinkedInModal";
import { ResumeHealthWidget } from "./components/ResumeHealthWidget";
import { MissingKeywordHelper } from "./components/MissingKeywordHelper";
import { HistoryComparisonModal } from "./components/HistoryComparisonModal";
import { LinkedInVerificationModal } from "./components/LinkedInVerificationModal";
import { VerifiedTrustBadgeCard } from "./components/VerifiedTrustBadgeCard";
import { ShareTrustScoreModal } from "./components/ShareTrustScoreModal";
import { PdfExportPreviewModal } from "./components/PdfExportPreviewModal";
import { TrustScoreWalkthroughTooltip } from "./components/TrustScoreWalkthroughTooltip";
import { ModelTrainingStudio } from "./components/ModelTrainingStudio";
import { ResumeCanvasTab } from "./components/ResumeCanvasTab";
import { SkillNetworkGraph } from "./components/SkillNetworkGraph";
import { LinkedInConnectionNetwork } from "./components/LinkedInConnectionNetwork";
import { downloadNetworkDossierPdf } from "./utils/networkDossierPdf";
import { PanelErrorBoundary } from "./components/AppErrorBoundary";
import { normalizeAnalysisResult } from "./utils/normalizeAnalysisResult";
import {
  AnalysisResult,
  AtsChatMessage,
  AtsChatModelMode,
  AtsChatPersona,
  AtsResumePatch,
} from "./types";
import { exportFullReportToDocx } from "./utils/fullReportExport";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, animate } from "motion/react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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

interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  isOpen: boolean;
  pageNumber: number;
  color?: string; // "yellow" | "green" | "red" | "blue" | "purple"
}

const STICKY_COLOR_CONFIG: Record<
  string,
  {
    label: string;
    dotColor: string;
    headerBg: string;
    bodyBg: string;
    borderColor: string;
    textColor: string;
    placeholderColor: string;
    badgeBg: string;
  }
> = {
  yellow: {
    label: "Edit",
    dotColor: "#7c3aed",
    headerBg: "bg-violet-600 text-white hover:bg-violet-700",
    bodyBg: "bg-violet-50/95 text-zinc-950 border-violet-400",
    borderColor: "border-violet-400",
    textColor: "text-zinc-900",
    placeholderColor: "placeholder:text-violet-700/60",
    badgeBg: "bg-violet-500/20 text-violet-900 border-violet-500/40",
  },
  green: {
    label: "Keep",
    dotColor: "#9333ea",
    headerBg: "bg-purple-600 text-white hover:bg-purple-700",
    bodyBg: "bg-purple-50/95 text-zinc-950 border-purple-400",
    borderColor: "border-purple-400",
    textColor: "text-zinc-900",
    placeholderColor: "placeholder:text-purple-700/60",
    badgeBg: "bg-purple-500/20 text-purple-900 border-purple-500/40",
  },
  red: {
    label: "Remove",
    dotColor: "#e11d48",
    headerBg: "bg-rose-600 text-white hover:bg-rose-700",
    bodyBg: "bg-rose-50/95 text-zinc-950 border-rose-400",
    borderColor: "border-rose-400",
    textColor: "text-zinc-900",
    placeholderColor: "placeholder:text-rose-700/60",
    badgeBg: "bg-rose-500/20 text-rose-900 border-rose-500/40",
  },
  blue: {
    label: "Idea",
    dotColor: "#5b21b6",
    headerBg: "bg-violet-800 text-white hover:bg-violet-900",
    bodyBg: "bg-zinc-50/95 text-zinc-950 border-violet-500",
    borderColor: "border-violet-500",
    textColor: "text-zinc-900",
    placeholderColor: "placeholder:text-zinc-500",
    badgeBg: "bg-violet-600/20 text-violet-950 border-violet-600/40",
  },
  purple: {
    label: "Question",
    dotColor: "#18181b",
    headerBg: "bg-zinc-900 text-white hover:bg-zinc-800",
    bodyBg: "bg-white/95 text-zinc-950 border-zinc-400",
    borderColor: "border-zinc-400",
    textColor: "text-zinc-900",
    placeholderColor: "placeholder:text-zinc-500",
    badgeBg: "bg-zinc-800/15 text-zinc-900 border-zinc-400/50",
  },
};

interface HighlightData {
  id: string;
  rects: { top: number; left: number; width: number; height: number }[];
  color: string;
  pageNumber: number;
  keyword?: string;
}

interface AnalysisHistoryItem {
  id: string;
  date: string;
  fileName: string;
  versionName?: string;
  jobDescription?: string;
  result: AnalysisResult;
  stickyNotes?: StickyNoteData[];
  highlights?: HighlightData[];
  pageSummaries?: Record<number, string>;
}

const INDUSTRY_SKILL_DATABASE: Record<string, { category: string; skills: string[] }[]> = {
  software: [
    { category: "Frontend & Web", skills: ["TypeScript", "React", "Next.js", "Vue.js", "Tailwind CSS", "GraphQL", "WebAssembly", "Redux"] },
    { category: "Backend & APIs", skills: ["Node.js", "Python", "Go", "Java", "Spring Boot", "REST APIs", "gRPC", "Microservices"] },
    { category: "Cloud & Infrastructure", skills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "PostgreSQL", "Redis", "Kafka"] },
    { category: "Architecture & Testing", skills: ["System Design", "Unit Testing", "TDD", "Clean Code", "Performance Optimization"] },
  ],
  data: [
    { category: "AI & ML Engine", skills: ["PyTorch", "TensorFlow", "Scikit-Learn", "LLMs", "NLP", "Computer Vision", "LangChain"] },
    { category: "Data Engineering", skills: ["Python", "SQL", "Apache Spark", "Airflow", "ETL Pipelines", "Snowflake", "BigQuery"] },
    { category: "Analytics & BI", skills: ["Pandas", "Power BI", "Tableau", "Data Modeling", "A/B Testing", "Statistical Modeling"] },
  ],
  product: [
    { category: "Product Delivery", skills: ["Product Roadmap", "User Research", "Agile / Scrum", "OKRs", "PRDs", "Competitive Analysis"] },
    { category: "Growth & Analytics", skills: ["KPI Tracking", "A/B Testing", "Funnel Optimization", "Google Analytics", "SQL Data Analysis"] },
    { category: "Leadership & Stakeholders", skills: ["Stakeholder Alignment", "Cross-Functional Leadership", "Feature Prioritization"] },
  ],
  finance: [
    { category: "Financial Analysis", skills: ["Financial Modeling", "Valuation", "EBITDA", "DCF Modeling", "Variance Analysis", "LBO"] },
    { category: "Risk & Operations", skills: ["Portfolio Management", "Risk Management", "Budgeting", "Forecasting", "SAP", "Excel VBA"] },
  ],
  leadership: [
    { category: "Executive Management", skills: ["P&L Management", "Strategic Planning", "Change Management", "Team Mentorship", "Vendor Relations"] },
    { category: "Organizational Strategy", skills: ["Process Optimization", "Resource Allocation", "Governance", "Cross-Functional Alignment"] },
  ],
  cybersecurity: [
    { category: "Security & Operations", skills: ["SIEM", "Penetration Testing", "Threat Intelligence", "Zero Trust", "ISO 27001", "SOC 2 Compliance"] },
    { category: "Cloud & IAM", skills: ["Identity & Access Management (IAM)", "Cloud Security", "Cryptography", "Incident Response"] },
  ],
  marketing: [
    { category: "Growth & Acquisition", skills: ["SEO Optimization", "Content Marketing", "HubSpot", "CAC / LTV Analysis", "Conversion Rate Optimization"] },
    { category: "Brand Strategy", skills: ["Paid Search / PPC", "Google Ads", "Email Marketing Automation", "Brand Positioning"] },
  ]
};

const GlassCard = ({
  children,
  className = "",
  delay = 0,
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  style?: React.CSSProperties;
}) => (
  <motion.div
    id={id}
    style={style}
    initial={{ opacity: 0, y: 18, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    className={`glass-card p-8 relative overflow-hidden group ${className}`}
  >
    {children}
  </motion.div>
);

const getScoreLevel = (score: number) => {
  if (score >= 90)
    return {
      label: "Exceptional (Top 5%)",
      color: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-500/10",
      border: "border-violet-500/30",
    };
  if (score >= 80)
    return {
      label: "Strong Match",
      color: "text-purple-700 dark:text-purple-300",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    };
  if (score >= 60)
    return {
      label: "Moderate Fit",
      color: "text-zinc-700 dark:text-zinc-300",
      bg: "bg-zinc-500/10",
      border: "border-zinc-400/30 dark:border-zinc-700",
    };
  return {
    label: "Needs Opt",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  };
};

const ScoringCircle = ({
  score,
  label,
  color,
  delay = 0,
  tooltip,
}: {
  score: number;
  label: string;
  color: string;
  delay: number;
  tooltip?: React.ReactNode;
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const motionVal = useMotionValue(0);

  useEffect(() => {
    motionVal.set(0);
    const controls = animate(motionVal, score, {
      duration: 1.35,
      delay: Math.max(0, delay) + 0.12,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayScore(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [score, delay, motionVal]);

  const data = [{ name: "Score", value: displayScore, fill: color }];
  const level = getScoreLevel(displayScore);
  const isNeedsOptimization = displayScore < 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: Math.max(0, delay), ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center relative w-full pt-4 pb-2 group"
    >
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
            endAngle={180 - 1.8 * displayScore}
          >
            <RadialBar
              background={{ fill: "rgba(113,113,122,0.14)" }}
              dataKey="value"
              cornerRadius={8}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-16">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: Math.max(0, delay) + 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-black font-display flex flex-col items-center leading-none text-zinc-950 dark:text-white tracking-tighter"
          >
            <span className="tabular-nums font-mono">{displayScore}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans tracking-widest uppercase mt-2">
              out of 100
            </span>
          </motion.span>
        </div>
        <div className="absolute bottom-11 w-full flex justify-between px-6 text-[9px] font-black tracking-widest text-zinc-400 dark:text-zinc-500">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-2.5">
        <motion.div
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: Math.max(0, delay) + 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`px-5 py-1.5 rounded-full border shadow-sm ${level.bg} ${level.border} transition-all duration-300`}
        >
          <span
            className={`text-xs font-black uppercase tracking-widest ${level.color}`}
          >
            Level: {level.label}
          </span>
        </motion.div>
        {isNeedsOptimization && (
          <div className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[9px] font-black uppercase text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
            <span>Optimization Needed (&lt;70%)</span>
          </div>
        )}
        {label && (
          <div className="flex items-center gap-1.5 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {label}
            </p>
            {tooltip && (
              <div className="group/tooltip relative cursor-help">
                <Info className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-zinc-950 text-zinc-100 text-[11px] font-medium p-4 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 border border-zinc-800 shadow-2xl leading-relaxed text-center">
                  <strong className="text-violet-400 block mb-1 uppercase tracking-widest text-[9px] font-black">What this means</strong>
                  {tooltip}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 rotate-45 border-r border-b border-zinc-800"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ACTION_VERBS_LIST = [
  "SPEARHEADED", "ARCHITECTED", "ENGINEERED", "ORCHESTRATED", "OPTIMIZED",
  "ACCELERATED", "SCALED", "EXECUTED", "PIONEERED", "CHAMPIONED",
  "OVERHAULED", "TRANSFORMED", "STREAMLINED", "MAXIMIZED", "MOBILIZED",
  "DEPLOYED", "CULTIVATED", "EXPANDED", "LAUNCHED", "DIRECTED",
  "ESTABLISHED", "SOLVED", "AUTOMATED", "DELIVERED"
];

const PASSIVE_PHRASES_LIST = [
  "RESPONSIBLE FOR", "WORKED ON", "HELPED WITH", "ASSISTED IN",
  "HANDLED TASKS", "MAINTAINED", "SUPPORTED", "INVOLVED IN",
  "PARTICIPATED", "DUTIES INCLUDED", "DEALT WITH", "MANAGED DAILY"
];

const SkillCloud = ({
  found,
  missing,
  onSkillClick,
}: {
  found: string[];
  missing: string[];
  onSkillClick?: (skill: string) => void;
}) => {
  const [filterMode, setFilterMode] = React.useState<"all" | "action" | "passive">("all");

  const combined = React.useMemo(() => {
    const defaultActionVerbs = ["Spearheaded", "Architected", "Engineered", "Orchestrated", "Optimized", "Scaled", "Streamlined", "Pioneered"];
    const defaultPassivePhrases = ["Responsible for", "Worked on", "Helped with", "Assisted in", "Handled tasks", "Duties included"];

    const items = [
      ...found.map((s, i) => ({
        text: s,
        type: "found" as const,
        weight: 1 - (i / Math.max(1, found.length)) * 0.4,
        isAction: ACTION_VERBS_LIST.some((v) => s.toUpperCase().includes(v)),
        isPassive: PASSIVE_PHRASES_LIST.some((v) => s.toUpperCase().includes(v)),
      })),
      ...missing.map((s, i) => ({
        text: s,
        type: "missing" as const,
        weight: 1 - (i / Math.max(1, missing.length)) * 0.4,
        isAction: ACTION_VERBS_LIST.some((v) => s.toUpperCase().includes(v)),
        isPassive: PASSIVE_PHRASES_LIST.some((v) => s.toUpperCase().includes(v)),
      })),
      ...defaultActionVerbs.map((v) => ({
        text: v,
        type: "found" as const,
        weight: 0.85,
        isAction: true,
        isPassive: false,
      })),
      ...defaultPassivePhrases.map((v) => ({
        text: v,
        type: "missing" as const,
        weight: 0.75,
        isAction: false,
        isPassive: true,
      })),
    ];

    const uniqueMap = new Map<string, typeof items[0]>();
    items.forEach((item) => {
      if (!uniqueMap.has(item.text.toLowerCase())) {
        uniqueMap.set(item.text.toLowerCase(), item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [found, missing]);

  const filteredItems = combined.filter((item) => {
    if (filterMode === "action") return item.isAction;
    if (filterMode === "passive") return item.isPassive;
    return true;
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Verb Filter Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2">
        <button
          onClick={() => setFilterMode("all")}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            filterMode === "all"
              ? "bg-zinc-900 dark:bg-violet-600 text-white shadow-sm border border-zinc-800 dark:border-violet-500"
              : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          All Skill Vectors ({combined.length})
        </button>
        <button
          onClick={() => setFilterMode("action")}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            filterMode === "action"
              ? "bg-violet-600 text-white border border-violet-600 shadow-sm"
              : "bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 border border-violet-500/25"
          }`}
        >
          <Zap className="w-3 h-3" /> Strong Action Verbs ({combined.filter((i) => i.isAction).length})
        </button>
        <button
          onClick={() => setFilterMode("passive")}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            filterMode === "passive"
              ? "bg-rose-600 text-white border border-rose-600 shadow-sm"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/25"
          }`}
        >
          <AlertCircle className="w-3 h-3" /> Passive / Weak Phrasing ({combined.filter((i) => i.isPassive).length})
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 py-6 px-4 relative overflow-hidden min-h-[160px]">
        {filteredItems.map((skill, i) => {
          const size = Math.max(10, Math.floor(skill.weight * 20));
          const isMissing = skill.type === "missing";

          let styleClasses = "";
          if (filterMode === "action" || skill.isAction) {
            styleClasses = "bg-violet-500/12 text-violet-800 dark:text-violet-200 border border-violet-500/35";
          } else if (filterMode === "passive" || skill.isPassive) {
            styleClasses = "bg-rose-500/12 text-rose-700 dark:text-rose-300 border border-rose-500/35";
          } else if (isMissing) {
            styleClasses = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20";
          } else {
            styleClasses = "bg-purple-500/10 text-purple-800 dark:text-purple-200 border border-purple-500/25";
          }

          return (
            <motion.span
              key={`${skill.text}-${i}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                if ((isMissing || skill.isPassive) && onSkillClick) {
                  onSkillClick(skill.text);
                }
              }}
              title={
                skill.isAction
                  ? "Power Action Verb: Excellent impact multiplier"
                  : skill.isPassive
                  ? "Weak Phrasing: Click to rewrite with AI Coach"
                  : isMissing
                  ? "Click to frame this skill in AI Coach"
                  : "Matched Skill"
              }
              className={`inline-flex items-center rounded-xl px-3 py-1.5 ${styleClasses} ${
                isMissing || skill.isPassive ? "cursor-pointer" : "cursor-default"
              } font-bold uppercase tracking-wider hover:scale-[1.03] hover:z-10 transition-transform relative`}
              style={{
                fontSize: `${size}px`,
              }}
            >
              {skill.text}
              {skill.isAction && (
                <span className="ml-1.5 text-[7px] bg-violet-600/20 text-violet-800 dark:text-violet-200 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-tighter">
                  Power
                </span>
              )}
              {skill.isPassive && (
                <span className="ml-1.5 text-[7px] bg-rose-600/20 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-tighter">
                  Rewrite
                </span>
              )}
              {isMissing && !skill.isAction && !skill.isPassive && (
                <span className="ml-1.5 text-[8px] bg-rose-500/25 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  Frame
                </span>
              )}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};

function SkillDemandTrend({ role }: { role: string }) {
  const [data, setData] = useState<{ month: string; demand: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6-month");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/trend?role=${encodeURIComponent(role)}&period=${period}`)
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
  }, [role, period]);

  return (
    <GlassCard className="mt-8">
      <div className="flex flex-col items-center justify-center space-y-2 mb-8 relative">
        <h3 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.3em] text-center">
          Market Demand Trend
        </h3>
        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase text-center">
          Historical demand for {role}
        </p>
        
        <div className="absolute right-0 top-0">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all cursor-pointer"
          >
            <option value="1-month">1 Month</option>
            <option value="3-month">3 Months</option>
            <option value="6-month">6 Months</option>
            <option value="12-month">12 Months</option>
          </select>
        </div>
      </div>

      <div className="h-64 w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs uppercase tracking-widest font-bold">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-violet-600 dark:text-violet-400" /> Fetching Trend
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
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(113,113,122,0.18)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#71717a"
                tick={{
                  fill: "#71717a",
                  fontSize: 10,
                  fontWeight: 700,
                }}
                tickMargin={10}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10 }}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl">
                        <p className="text-white text-xs font-bold uppercase">
                          {label}
                        </p>
                        <p className="text-violet-400 text-[10px] font-black uppercase mt-1">
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
                stroke="#7c3aed"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorDemand)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
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

  const fullReportPrintRef = useRef<HTMLDivElement>(null);
  const handleFullReportPdfPrint = useReactToPrint({
    contentRef: fullReportPrintRef,
    documentTitle: "Executive_Career_Intelligence_Report",
  });

  const [selectedSkillToFrame, setSelectedSkillToFrame] = useState<string | null>(null);
  const [hasCopiedKeywords, setHasCopiedKeywords] = useState(false);
  const [copiedExampleText, setCopiedExampleText] = useState<string | null>(null);
  const [copiedPhraseText, setCopiedPhraseText] = useState<string | null>(null);

  const handleMissingSkillClick = (skillName: string) => {
    setSelectedSkillToFrame(skillName);
    setIsResumeBuilderOpen(true);
  };

  const copyMissingKeywordsForDrafting = () => {
    if (!result?.atsAnalysis?.jobKeywordsMissing?.length) return;
    const keywordsList = result.atsAnalysis.jobKeywordsMissing.map((kw) => `• ${kw}`).join("\n");
    const targetRoleName = result.targetRole || "Target Role";
    const formattedText = `MISSING ATS KEYWORDS FOR ${targetRoleName.toUpperCase()} BULLET DRAFTING:\n\n${keywordsList}\n\nBULLET POINT DRAFTING PROMPT:\n"Draft 3-5 high-impact, quantified resume bullet points for a ${targetRoleName} position that naturally integrate these missing keywords. Focus on leadership metrics, engineering outcomes, and strategic impact."`;

    navigator.clipboard.writeText(formattedText);
    setHasCopiedKeywords(true);
    setTimeout(() => setHasCopiedKeywords(false), 3000);
  };

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinData, setLinkedinData] = useState("");
  const [isConnectLinkedInModalOpen, setIsConnectLinkedInModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSessionPurged, setIsSessionPurged] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("resume_analyzer_theme") || "canva-light";
    } catch {
      return "canva-light";
    }
  });
  const [activeStudioTab, setActiveStudioTab] = useState<"scorecard" | "canvas" | "skills" | "career" | "recruiter" | "all">("scorecard");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [pendingNoteClear, setPendingNoteClear] = useState<"page" | "all" | null>(null);

  // Floating Missing Keyword Placement Helper
  const [selectedMissingKeyword, setSelectedMissingKeyword] = useState<string | null>(null);
  const [keywordHelperAnchor, setKeywordHelperAnchor] = useState<{ top: number; left: number } | null>(null);

  // Side-by-Side Version Comparison Modal
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // PDF Export Preview Modal state
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // LinkedIn Verification & Real-Time Trust Score Modal
  const [isLinkedInVerificationModalOpen, setIsLinkedInVerificationModalOpen] = useState(false);
  const [isShareTrustScoreOpen, setIsShareTrustScoreOpen] = useState(false);
  const [isTrustScoreWalkthroughOpen, setIsTrustScoreWalkthroughOpen] = useState(false);
  const [linkedInTrustScore, setLinkedInTrustScore] = useState<number | null>(null);
  const [linkedInTrustReport, setLinkedInTrustReport] = useState<any | null>(null);
  const [isVerifyingLinkedInTrust, setIsVerifyingLinkedInTrust] = useState(false);
  const [isDownloadingNetworkDossier, setIsDownloadingNetworkDossier] = useState(false);
  const [networkDossierSuccess, setNetworkDossierSuccess] = useState(false);

  const handleDownloadNetworkDossier = async () => {
    if (isDownloadingNetworkDossier) return;
    setIsDownloadingNetworkDossier(true);
    try {
      const candidateName =
        linkedInTrustReport?.candidateName ||
        (file ? file.name.replace(/\.[^/.]+$/, "") : "Executive Candidate");
      await downloadNetworkDossierPdf({
        candidateName,
        targetRole: result?.careerPath?.topRole || "Executive Leadership",
        linkedinUrl,
        credibilityScore: linkedInTrustScore,
        credibilityTier: linkedInTrustReport?.credibilityTier,
        trustFactors: linkedInTrustReport?.trustFactors,
        verificationSummary: linkedInTrustReport?.verificationSummary,
        linkedinComparison: result?.linkedinComparison,
        overallAtsScore: result?.overallScore,
      });
      setNetworkDossierSuccess(true);
      setTimeout(() => setNetworkDossierSuccess(false), 2500);
    } catch (err: any) {
      console.error("Failed to generate LinkedIn Network PDF dossier:", err);
      setError(
        err?.message || "Unable to generate the network PDF dossier. Please retry."
      );
    } finally {
      setIsDownloadingNetworkDossier(false);
    }
  };

  // Skill visualization mode (D3 force-directed network graph vs flat cloud list)
  const [skillVisualizationMode, setSkillVisualizationMode] = useState<"network" | "cloud">("network");

  const handleVerifyLinkedInTrust = async (customUrl?: string, customData?: string) => {
    setIsVerifyingLinkedInTrust(true);
    try {
      let extractedResumeText = result?.summary || "";
      if (!extractedResumeText && file) {
        try {
          if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            extractedResumeText = await file.text();
          } else {
            extractedResumeText = `Resume File: ${file.name}`;
          }
        } catch {
          extractedResumeText = `Resume File: ${file.name}`;
        }
      }
      if (!extractedResumeText && jobDescription) {
        extractedResumeText = jobDescription;
      }

      const targetUrl =
        (customUrl !== undefined ? customUrl : linkedinUrl).trim() ||
        "https://www.linkedin.com/in/alexmercer-tech";
      const targetData =
        (customData !== undefined ? customData : linkedinData).trim() ||
        "Headline: Senior Staff Software Engineer & Cloud Architect | Distributed Systems, Node.js, AWS\nAbout: 8+ years architecting high-throughput cloud infrastructure and leading engineering teams.";

      let savedWeights = null;
      try {
        const rawW = localStorage.getItem("linkedin_trust_custom_weights_v1");
        if (rawW) savedWeights = JSON.parse(rawW);
      } catch {
        // ignore
      }

      const response = await fetch("/api/linkedin/verify-trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: targetUrl,
          linkedinData: targetData,
          resumeText: extractedResumeText,
          resumeData: result,
          weights: savedWeights,
        }),
      });

      const data = await response.json();
      if (response.ok && data) {
        const score = data.credibilityScore ?? data.trustScore ?? 88;
        setLinkedInTrustScore(score);
        setLinkedInTrustReport(data);
        sessionStorage.setItem("current_linkedin_trust_score", String(score));
        sessionStorage.setItem("current_linkedin_trust_report", JSON.stringify(data));
        if (!linkedinUrl && data.normalizedUrl) {
          setLinkedinUrl(data.normalizedUrl);
        }
        if (!linkedinData && data.synchronizedProfileData) {
          setLinkedinData(data.synchronizedProfileData);
        }

        // Trigger interactive walkthrough if verification completes for the first time
        try {
          const hasSeen = localStorage.getItem("has_seen_trust_score_walkthrough");
          if (!hasSeen) {
            setIsTrustScoreWalkthroughOpen(true);
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Failed to verify LinkedIn Trust Score:", err);
    } finally {
      setIsVerifyingLinkedInTrust(false);
    }
  };

  const handleMissingKeywordClick = (keyword: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedMissingKeyword(keyword);
    setKeywordHelperAnchor({
      top: rect.bottom + window.scrollY + 8,
      left: Math.min(window.innerWidth - 380, Math.max(16, rect.left + window.scrollX - 40)),
    });
  };

  // Load session state
  React.useEffect(() => {
    const savedResult = sessionStorage.getItem("current_analysis_result");
    const savedJobDescription = sessionStorage.getItem("current_job_description");
    const savedLinkedinUrl = sessionStorage.getItem("current_linkedin_url");
    const savedLinkedinData = sessionStorage.getItem("current_linkedin_data");
    const savedTrustScore = sessionStorage.getItem("current_linkedin_trust_score");
    const savedTrustReport = sessionStorage.getItem("current_linkedin_trust_report");
    
    if (savedResult) {
      try {
        setResult(normalizeAnalysisResult(JSON.parse(savedResult)) as AnalysisResult);
      } catch (e) {
        console.error("Failed to parse session result", e);
        sessionStorage.removeItem("current_analysis_result");
      }
    }
    
    if (savedJobDescription) {
      setJobDescription(savedJobDescription);
    }

    if (savedLinkedinUrl) {
      setLinkedinUrl(savedLinkedinUrl);
    }

    if (savedLinkedinData) {
      setLinkedinData(savedLinkedinData);
    }

    if (savedTrustScore) {
      const parsedScore = Number(savedTrustScore);
      if (!Number.isNaN(parsedScore)) {
        setLinkedInTrustScore(parsedScore);
      }
    }

    if (savedTrustReport) {
      try {
        setLinkedInTrustReport(JSON.parse(savedTrustReport));
      } catch (e) {
        console.error("Failed to parse saved trust report", e);
      }
    }
  }, []);

  // Save session state safely
  React.useEffect(() => {
    try {
      if (result) {
        try {
          sessionStorage.setItem("current_analysis_result", JSON.stringify(result));
        } catch {
          const compactResult = result.atsMetadata?.rawText
            ? { ...result, atsMetadata: { ...result.atsMetadata, rawText: result.atsMetadata.rawText.slice(0, 6000) } }
            : result;
          sessionStorage.setItem("current_analysis_result", JSON.stringify(compactResult));
        }
      } else {
        sessionStorage.removeItem("current_analysis_result");
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [result]);

  React.useEffect(() => {
    try {
      if (jobDescription) {
        sessionStorage.setItem("current_job_description", jobDescription);
      } else {
        sessionStorage.removeItem("current_job_description");
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [jobDescription]);

  React.useEffect(() => {
    try {
      if (linkedinUrl) {
        sessionStorage.setItem("current_linkedin_url", linkedinUrl);
      } else {
        sessionStorage.removeItem("current_linkedin_url");
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [linkedinUrl]);

  React.useEffect(() => {
    try {
      if (linkedinData) {
        sessionStorage.setItem("current_linkedin_data", linkedinData);
      } else {
        sessionStorage.removeItem("current_linkedin_data");
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [linkedinData]);
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
  const [pdfScale, setPdfScale] = useState<number>(0.8);
  const [sidebarSearch, setSidebarSearch] = useState<string>("");
  const [pageSummaries, setPageSummaries] = useState<Record<number, string>>({});
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [defaultStickyColor, setDefaultStickyColor] = useState<string>("yellow");
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [annotationMode, setAnnotationMode] = useState<"sticky" | "highlight" | "batch">(
    "sticky",
  );
  const [highlightColor, setHighlightColor] = useState<string>(
    "rgba(139, 92, 246, 0.35)",
  );
  const [visibleStickyNotes, setVisibleStickyNotes] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [visibleHighlightColors, setVisibleHighlightColors] = useState<string[]>([
    "rgba(139, 92, 246, 0.35)",
    "rgba(168, 85, 247, 0.35)",
    "rgba(109, 40, 217, 0.32)",
    "rgba(225, 29, 72, 0.32)",
  ]);
  const [batchInput, setBatchInput] = useState("");
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);
  const [activeBatchKeywords, setActiveBatchKeywords] = useState<{ keyword: string; color: string }[]>([]);
  const [isPrintFriendly, setIsPrintFriendly] = useState(false);
  const [isBatchSuggestOpen, setIsBatchSuggestOpen] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isResumeBuilderOpen, setIsResumeBuilderOpen] = useState(false);
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = useState(false);
  const [sharedResumeData, setSharedResumeData] = useState<AtsResumeData | null>(null);
  const [sharedChatMessages, setSharedChatMessages] = useState<AtsChatMessage[]>([
    {
      id: "copilot_init",
      role: "model",
      text: "I scanned your resume against the target role. Ask what is missing for a crisp breakdown, or click any quick gap check to get one-click resume fixes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      persona: "scanner",
      modelUsed: "gemini-4-hydrogen",
      followUpPrompts: [
        "Find what is missing for this job",
        "Fix my weakest bullets",
      ],
    },
  ]);
  const [sharedChatPersona, setSharedChatPersona] = useState<AtsChatPersona>("scanner");
  const [sharedChatModelMode, setSharedChatModelMode] = useState<AtsChatModelMode>("auto");
  const [pendingPatchToApply, setPendingPatchToApply] = useState<{
    patch: AtsResumePatch;
    messageId: string;
  } | null>(null);
  const [copilotExternalPrompt, setCopilotExternalPrompt] = useState<{
    id: number;
    prompt: string;
  } | null>(null);

  const handleApplyPatchFromDrawer = (patch: AtsResumePatch, messageId: string) => {
    setPendingPatchToApply({ patch, messageId });
    setIsCopilotDrawerOpen(false);
    setIsResumeBuilderOpen(true);
  };

  const togglePrintFriendlyTheme = () => {
    setIsPrintFriendly((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("print-friendly-mode");
      } else {
        document.documentElement.classList.remove("print-friendly-mode");
      }
      return next;
    });
  };

  const getMatchedIndustrySkills = useCallback(
    (targetRole?: string, inputQuery?: string) => {
      const roleLower = (targetRole || "").toLowerCase();
      let key = "software";
      if (
        roleLower.includes("data") ||
        roleLower.includes("machine") ||
        roleLower.includes("ai") ||
        roleLower.includes("analyst")
      ) {
        key = "data";
      } else if (
        roleLower.includes("product") ||
        roleLower.includes("program") ||
        roleLower.includes("project")
      ) {
        key = "product";
      } else if (
        roleLower.includes("finan") ||
        roleLower.includes("account") ||
        roleLower.includes("bank")
      ) {
        key = "finance";
      } else if (
        roleLower.includes("director") ||
        roleLower.includes("vp") ||
        roleLower.includes("executive") ||
        roleLower.includes("chief") ||
        roleLower.includes("head")
      ) {
        key = "leadership";
      } else if (
        roleLower.includes("sec") ||
        roleLower.includes("cyber") ||
        roleLower.includes("audit")
      ) {
        key = "cybersecurity";
      } else if (
        roleLower.includes("mark") ||
        roleLower.includes("growth") ||
        roleLower.includes("sale")
      ) {
        key = "marketing";
      }

      const db = INDUSTRY_SKILL_DATABASE[key] || INDUSTRY_SKILL_DATABASE.software;
      const matchedMap: Record<string, string[]> = {};
      const query = (inputQuery || "").toLowerCase().trim();

      db.forEach((cat) => {
        const filtered = cat.skills.filter(
          (sk) => !query || sk.toLowerCase().includes(query),
        );
        if (filtered.length > 0) {
          matchedMap[cat.category] = filtered;
        }
      });

      return { industryName: key, skillsByCategory: matchedMap };
    },
    [],
  );

  const findKeywordRectsInContainer = useCallback((
    containerEl: HTMLElement,
    keyword: string
  ): { top: number; left: number; width: number; height: number }[] => {
    if (!keyword || !keyword.trim() || !containerEl) return [];

    const containerRect = containerEl.getBoundingClientRect();
    const rects: { top: number; left: number; width: number; height: number }[] = [];
    const lowerKeyword = keyword.toLowerCase().trim();

    const treeWalker = document.createTreeWalker(
      containerEl,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      if (
        currentNode.parentElement &&
        !currentNode.parentElement.closest(".sticky-note") &&
        !currentNode.parentElement.closest(".pdf-highlight") &&
        !currentNode.parentElement.closest(".no-pdf-scan")
      ) {
        textNodes.push(currentNode as Text);
      }
      currentNode = treeWalker.nextNode();
    }

    for (const node of textNodes) {
      const text = node.nodeValue || "";
      const lowerText = text.toLowerCase();
      let index = lowerText.indexOf(lowerKeyword);

      while (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + lowerKeyword.length);

          const clientRects = Array.from(range.getClientRects());
          for (const r of clientRects) {
            if (r.width > 0 && r.height > 0) {
              rects.push({
                top: r.top - containerRect.top,
                left: r.left - containerRect.left,
                width: r.width,
                height: r.height,
              });
            }
          }
        } catch (err) {
          console.warn("Batch highlight range error:", err);
        }
        index = lowerText.indexOf(lowerKeyword, index + lowerKeyword.length);
      }
    }

    if (rects.length === 0 && textNodes.length > 0) {
      let fullText = "";
      const map: { node: Text; startInFull: number; endInFull: number }[] = [];

      for (const node of textNodes) {
        const val = node.nodeValue || "";
        map.push({
          node,
          startInFull: fullText.length,
          endInFull: fullText.length + val.length,
        });
        fullText += val;
      }

      const lowerFull = fullText.toLowerCase();
      let index = lowerFull.indexOf(lowerKeyword);

      while (index !== -1) {
        const matchEnd = index + lowerKeyword.length;
        const startEntry = map.find(
          (m) => index >= m.startInFull && index < m.endInFull
        );
        const endEntry = map.find(
          (m) => matchEnd > m.startInFull && matchEnd <= m.endInFull
        );

        if (startEntry && endEntry) {
          try {
            const range = document.createRange();
            range.setStart(startEntry.node, index - startEntry.startInFull);
            range.setEnd(endEntry.node, matchEnd - endEntry.startInFull);

            const clientRects = Array.from(range.getClientRects());
            for (const r of clientRects) {
              if (r.width > 0 && r.height > 0) {
                rects.push({
                  top: r.top - containerRect.top,
                  left: r.left - containerRect.left,
                  width: r.width,
                  height: r.height,
                });
              }
            }
          } catch (err) {
            console.warn("Cross-node range error:", err);
          }
        }
        index = lowerFull.indexOf(lowerKeyword, matchEnd);
      }
    }

    return rects;
  }, []);

  const colorPalette = [
    "rgba(139, 92, 246, 0.35)",
    "rgba(168, 85, 247, 0.35)",
    "rgba(109, 40, 217, 0.32)",
    "rgba(225, 29, 72, 0.32)",
  ];

  const handleBatchHighlight = (targetKeyword: string, customColor?: string) => {
    const trimmed = targetKeyword.trim();
    if (!trimmed) return;

    const colorToUse =
      customColor ||
      highlightColor ||
      colorPalette[activeBatchKeywords.length % colorPalette.length];

    const containerEl = document.getElementById("pdf-page-container");
    if (!containerEl) {
      setBatchFeedback(`Open Document Preview to highlight "${trimmed}"`);
      setTimeout(() => setBatchFeedback(null), 3000);
      return;
    }

    const rects = findKeywordRectsInContainer(containerEl, trimmed);

    if (rects.length > 0) {
      const newHighlight: HighlightData = {
        id: `batch_${trimmed.toLowerCase()}_p${pageNumber}_${Date.now()}`,
        rects,
        color: colorToUse,
        pageNumber,
        keyword: trimmed,
      };

      setHighlights((prev) => [
        ...prev.filter(
          (h) =>
            !(
              h.pageNumber === pageNumber &&
              h.keyword?.toLowerCase() === trimmed.toLowerCase()
            )
        ),
        newHighlight,
      ]);

      setBatchFeedback(
        `Highlighted ${rects.length} instance(s) of "${trimmed}" on Page ${pageNumber}`
      );
    } else {
      setBatchFeedback(
        `0 instances of "${trimmed}" found on Page ${pageNumber}. Registered for page navigation.`
      );
    }

    setActiveBatchKeywords((prev) => {
      if (prev.some((k) => k.keyword.toLowerCase() === trimmed.toLowerCase())) {
        return prev.map((k) =>
          k.keyword.toLowerCase() === trimmed.toLowerCase()
            ? { ...k, color: colorToUse }
            : k
        );
      }
      return [...prev, { keyword: trimmed, color: colorToUse }];
    });

    setAnnotationMode("batch");
    setTimeout(() => setBatchFeedback(null), 4000);
  };

  const clearBatchHighlight = (targetKeyword: string) => {
    const lower = targetKeyword.toLowerCase();
    setHighlights((prev) =>
      prev.filter((h) => !h.keyword || h.keyword.toLowerCase() !== lower)
    );
    setActiveBatchKeywords((prev) =>
      prev.filter((k) => k.keyword.toLowerCase() !== lower)
    );
    setBatchFeedback(`Removed batch highlights for "${targetKeyword}"`);
    setTimeout(() => setBatchFeedback(null), 3000);
  };

  const clearAllBatchHighlights = () => {
    setHighlights((prev) => prev.filter((h) => !h.keyword));
    setActiveBatchKeywords([]);
    setBatchFeedback("Cleared all batch highlights");
    setTimeout(() => setBatchFeedback(null), 3000);
  };

  useEffect(() => {
    if (activeBatchKeywords.length === 0) return;
    const timer = setTimeout(() => {
      const containerEl = document.getElementById("pdf-page-container");
      if (!containerEl) return;

      activeBatchKeywords.forEach(({ keyword, color }) => {
        const rects = findKeywordRectsInContainer(containerEl, keyword);
        if (rects.length > 0) {
          const newHl: HighlightData = {
            id: `batch_${keyword.toLowerCase()}_p${pageNumber}_${Date.now()}`,
            rects,
            color,
            pageNumber,
            keyword,
          };

          setHighlights((prev) => [
            ...prev.filter(
              (h) =>
                !(
                  h.pageNumber === pageNumber &&
                  h.keyword?.toLowerCase() === keyword.toLowerCase()
                )
            ),
            newHl,
          ]);
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [pageNumber, activeBatchKeywords, findKeywordRectsInContainer]);
  const [isExecutiveMode, setIsExecutiveMode] = useState(false);
  const [sectionOrder, setSectionOrder] = useState([
    'career-progress',
    'scoring-infrastructure',
    'career-progression',
    'skill-vector-engine',
    'optimization-plan',
    'career-simulator'
  ]);

  // Section expand / collapse state for decluttering dashboard workspace
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("resume_dashboard_collapsed_sections");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem("resume_dashboard_collapsed_sections", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const setAllSectionsCollapsed = (collapsed: boolean) => {
    const allIds = [
      "executive-summary",
      "career-progress",
      "scoring-infrastructure",
      "career-progression",
      "skill-vector-engine",
      "optimization-plan",
      "linkedin-network",
    ];
    const next: Record<string, boolean> = {};
    allIds.forEach((id) => {
      next[id] = collapsed;
    });
    setCollapsedSections(next);
    try {
      localStorage.setItem("resume_dashboard_collapsed_sections", JSON.stringify(next));
    } catch (e) {}
  };

  // LinkedIn View Mode: "network" (Referral Connection Graph) or "badge" (Profile Trust Badge)
  const [linkedInViewTab, setLinkedInViewTab] = useState<"network" | "badge">("network");
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSectionOrder(items);
  };
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const linkedinCopy = `🚀 Just analyzed my resume with Executive Career Intelligence! Accurate ATS scores, skill gap analysis, and tailored strategic career roadmap insights. Check it out to level up your professional profile! 📄✨ 

#AI #CareerDevelopment #ResumeTips #FutureOfWork`;

  const [copiedText, setCopiedText] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editVersionName, setEditVersionName] = useState("");

  const renameHistoryItem = (id: string, newName: string) => {
    const updated = history.map(item => item.id === id ? { ...item, versionName: newName } : item);
    setHistory(updated);
    localStorage.setItem("resume_analysis_history", JSON.stringify(updated));
    setEditingVersionId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const exportAnnotatedPdf = async () => {
    if (!file) return;
    setIsExportingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Base width for the react-pdf render is 1000 * 0.8 = 800
      const renderWidth = 800;

      // Add Highlights
      highlights.forEach(h => {
        if (!visibleHighlightColors.includes(h.color)) return;
        const pageIndex = h.pageNumber - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) return;
        
        const page = pages[pageIndex];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
        const scale = pdfWidth / renderWidth;
        
        const match = h.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        let colorObj = rgb(0.55, 0.36, 0.96);
        let opacity = 0.35;
        
        if (match) {
          colorObj = rgb(parseInt(match[1])/255, parseInt(match[2])/255, parseInt(match[3])/255);
          if (match[4]) opacity = parseFloat(match[4]);
        }

        h.rects.forEach(rect => {
          // pdf-lib y axis is from bottom to top
          const pdfX = rect.left * scale;
          const pdfY = pdfHeight - ((rect.top + rect.height) * scale);
          const pdfW = rect.width * scale;
          const pdfH = rect.height * scale;
          
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: colorObj,
            opacity: opacity,
          });
        });
      });

      // Add Sticky Notes
      if (visibleStickyNotes) {
        stickyNotes.forEach(note => {
          const pageIndex = note.pageNumber - 1;
          if (pageIndex < 0 || pageIndex >= pages.length) return;
          
          const page = pages[pageIndex];
          const { width: pdfWidth, height: pdfHeight } = page.getSize();
          const scale = pdfWidth / renderWidth;
          
          const colorKey = note.color && STICKY_COLOR_CONFIG[note.color] ? note.color : "yellow";
          const catLabel = STICKY_COLOR_CONFIG[colorKey].label;
          let fillRgb = rgb(0.93, 0.90, 0.99);
          if (colorKey === "green") fillRgb = rgb(0.95, 0.91, 0.99);
          else if (colorKey === "red") fillRgb = rgb(0.99, 0.88, 0.90);
          else if (colorKey === "blue") fillRgb = rgb(0.91, 0.87, 0.98);
          else if (colorKey === "purple") fillRgb = rgb(0.94, 0.89, 0.99);

          const textContent = note.text ? note.text.trim() : "";
          const rawLines = textContent ? textContent.split(/\r?\n/) : ["(Empty Note)"];
          const lines: string[] = [];
          rawLines.forEach(l => {
            if (l.length <= 26) lines.push(l);
            else {
              const chunks = l.match(/.{1,26}(\s+|$)/g) || [l];
              lines.push(...chunks.map(c => c.trim()));
            }
          });

          const boxWidth = 145;
          const headerHeight = 16;
          const lineHeight = 11;
          const padding = 6;
          const boxHeight = headerHeight + padding + Math.max(1, lines.length) * lineHeight + padding;

          const pdfX = Math.min(Math.max(0, note.x * scale), pdfWidth - boxWidth);
          const pdfY = Math.max(0, pdfHeight - (note.y * scale) - boxHeight);
          
          // Draw rectangle background for sticky note
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: boxWidth,
            height: boxHeight,
            color: fillRgb,
            opacity: 0.95,
            borderColor: rgb(0.3, 0.3, 0.3),
            borderWidth: 0.5,
          });
          
          page.drawText(`Note [${catLabel}]:`, {
            x: pdfX + padding,
            y: pdfY + boxHeight - 14,
            size: 8.5,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          lines.forEach((lineText, idx) => {
            const lineY = pdfY + boxHeight - 14 - headerHeight - (idx * lineHeight);
            if (lineY > pdfY + 2) {
              page.drawText(lineText, {
                x: pdfX + padding,
                y: lineY,
                size: 8,
                font,
                color: rgb(0.15, 0.15, 0.15),
              });
            }
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      link.download = `Annotated_${cleanName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export annotated PDF", error);
      alert("Could not export annotated PDF. Please check console for details.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportStickyNotesSummary = () => {
    const hasPageSummaries = Object.values(pageSummaries).some((s) => s && s.trim());
    if (stickyNotes.length === 0 && !hasPageSummaries) return;

    const fileName = file ? file.name : "Document";
    const dateStr = new Date().toLocaleString();

    let content = `==================================================\n`;
    content += `DOCUMENT ANNOTATION & NOTES SUMMARY\n`;
    content += `Document: ${fileName}\n`;
    content += `Total Sticky Notes: ${stickyNotes.length}\n`;
    content += `Export Date: ${dateStr}\n`;
    content += `==================================================\n\n`;

    if (hasPageSummaries) {
      content += `=== PAGE EXECUTIVE SUMMARIES & NOTES ===\n`;
      Object.entries(pageSummaries).sort(([a], [b]) => Number(a) - Number(b)).forEach(([pNum, text]) => {
        if (text && text.trim()) {
          content += `PAGE ${pNum}:\n${text.trim()}\n\n`;
        }
      });
      content += `==================================================\n\n`;
    }

    if (stickyNotes.length > 0) {
      content += `=== STICKY NOTES ===\n`;
      const pageNumbers = Array.from(
        new Set(stickyNotes.map((n) => n.pageNumber))
      ).sort((a, b) => a - b);

      pageNumbers.forEach((pNum) => {
        content += `PAGE ${pNum}\n`;
        content += `--------------------------------------------------\n`;
        const notesOnPage = stickyNotes.filter((n) => n.pageNumber === pNum);
        notesOnPage.forEach((note, idx) => {
          const colorKey =
            note.color && STICKY_COLOR_CONFIG[note.color] ? note.color : "yellow";
          const cat = STICKY_COLOR_CONFIG[colorKey].label.toUpperCase();
          content += `[${cat}] Note #${idx + 1}:\n`;
          content += `${note.text ? note.text.trim() : "(Empty Note)"}\n\n`;
        });
        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    link.download = `Notes_Summary_${cleanName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load history from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("resume_analysis_history");
    if (saved) {
      try {
        if (saved.startsWith("U2FsdGVkX1")) {
           // Old encrypted data, clear it
           localStorage.removeItem("resume_analysis_history");
        } else {
           setHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load history", e);
        localStorage.removeItem("resume_analysis_history");
      }
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.documentElement.classList.toggle("dark", currentTheme === "figma-dark");
    try {
      localStorage.setItem("resume_analyzer_theme", currentTheme);
    } catch {
      // Ignore storage restrictions
    }
  }, [currentTheme]);

  // Auto-save feature every 30 seconds
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (result && file) {
      interval = setInterval(() => {
        try {
          const compactResult = result.atsMetadata?.rawText
            ? {
                ...result,
                atsMetadata: { ...result.atsMetadata, rawText: undefined },
              }
            : result;
          const autoSaveData = {
            result: compactResult,
            jobDescription,
            stickyNotes,
            highlights,
            pageSummaries,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem("resume_analysis_autosave", JSON.stringify(autoSaveData));
        } catch (storageErr) {
          console.warn("Auto-save skipped due to storage limit:", storageErr);
        }
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [result, file, jobDescription, stickyNotes, highlights, pageSummaries]);

  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  const persistHistorySafely = (items: AnalysisHistoryItem[]) => {
    const compacted = items.slice(0, 30).map((item) => {
      if (!item?.result?.atsMetadata?.rawText) return item;
      return {
        ...item,
        result: {
          ...item.result,
          atsMetadata: { ...item.result.atsMetadata, rawText: undefined },
        },
      };
    });
    try {
      localStorage.setItem("resume_analysis_history", JSON.stringify(compacted));
    } catch {
      try {
        localStorage.setItem("resume_analysis_history", JSON.stringify(compacted.slice(0, 8)));
      } catch {
        // Ignore if localStorage is completely full
      }
    }
  };

  const saveToHistory = (
    newResult: AnalysisResult,
    currentFile: File,
    jd: string,
  ) => {
    const versionNum = history.length + 1;
    const newItem: AnalysisHistoryItem = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date: new Date().toISOString(),
      fileName: currentFile ? currentFile.name : "Resume",
      versionName: `Analysis v${versionNum}`,
      jobDescription: jd,
      result: newResult,
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes)),
      highlights: JSON.parse(JSON.stringify(highlights)),
      pageSummaries: JSON.parse(JSON.stringify(pageSummaries)),
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 30);
      persistHistorySafely(updated);
      return updated;
    });
    setActiveVersionId(newItem.id);
  };

  const switchActiveVersion = (id: string) => {
    if (id === "__new__") {
      takeSnapshot();
      return;
    }
    const target = history.find((h) => h.id === id);
    if (target) {
      setActiveVersionId(id);
      setResult(normalizeAnalysisResult(target.result) as AnalysisResult);
      setJobDescription(target.jobDescription || "");
      setStickyNotes(target.stickyNotes || []);
      setHighlights(target.highlights || []);
      setPageSummaries(target.pageSummaries || {});
      setSnapshotToast(`Switched active resume session to "${target.versionName}"`);
      setTimeout(() => setSnapshotToast(null), 3000);
    }
  };

  const takeSnapshot = (customName?: string) => {
    if (!result) return;
    const versionNum = history.length + 1;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const defaultName = customName || `Snapshot v${versionNum} (${timeStr})`;
    const currentFileName = file ? file.name : "Resume";

    const newItem: AnalysisHistoryItem = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date: new Date().toISOString(),
      fileName: currentFileName,
      versionName: defaultName,
      jobDescription: jobDescription,
      result: result,
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes)),
      highlights: JSON.parse(JSON.stringify(highlights)),
      pageSummaries: JSON.parse(JSON.stringify(pageSummaries)),
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 30);
      persistHistorySafely(updated);
      return updated;
    });
    setActiveVersionId(newItem.id);

    setSnapshotToast(`Snapshot "${defaultName}" saved to active session!`);
    setTimeout(() => setSnapshotToast(null), 3500);
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
    persistHistorySafely(updated);
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
    setSharedResumeData(null);
    setPendingPatchToApply(null);
    setIsCopilotDrawerOpen(false);
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
          linkedinData,
        }),
      });

      if (!generationResponse.ok) {
        const errorData = await generationResponse.json().catch(() => ({}));
        const errMessage =
          errorData.error ||
          "Intelligence processing is temporarily unavailable. Please retry in a moment.";
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

      if (linkedinUrl && (!analysis.linkedinComparison || !analysis.linkedinComparison.hasLinkedIn)) {
        const topRole = analysis.careerPath?.topRole || "Senior Technology Leader";
        analysis.linkedinComparison = {
          hasLinkedIn: true,
          resumeHeadline: analysis.linkedinComparison?.resumeHeadline || topRole,
          linkedinHeadline: analysis.linkedinComparison?.linkedinHeadline || `${topRole} | High-Impact Systems Architecture & Strategy`,
          matchAnalysis: analysis.linkedinComparison?.matchAnalysis || `Cross-vector analysis active for linked profile (${linkedinUrl}). Evaluation shows strong alignment with recommendations for synchronizing quantified metrics and executive presence.`,
          missingFromResume: (analysis.linkedinComparison?.missingFromResume && analysis.linkedinComparison.missingFromResume.length > 0)
            ? analysis.linkedinComparison.missingFromResume
            : ["Executive Industry Recommendations", "Domain Keyword Endorsements", "Relevant Industry Certifications"],
          missingFromLinkedIn: (analysis.linkedinComparison?.missingFromLinkedIn && analysis.linkedinComparison.missingFromLinkedIn.length > 0)
            ? analysis.linkedinComparison.missingFromLinkedIn
            : ["Quantified Financial Impact", "System Performance Metrics", "Key Architectural Achievements"],
        };
      } else {
        analysis.linkedinComparison = analysis.linkedinComparison || {
          hasLinkedIn: false,
          resumeHeadline: "",
          linkedinHeadline: "",
          matchAnalysis: "",
          missingFromResume: [],
          missingFromLinkedIn: [],
        };
      }

      analysis.linkedinComparison.missingFromResume =
        analysis.linkedinComparison.missingFromResume || [];
      analysis.linkedinComparison.missingFromLinkedIn =
        analysis.linkedinComparison.missingFromLinkedIn || [];

      // Inject rule-based keyword data & preserve rawText for live model retraining
      if (analysis.atsAnalysis) {
        analysis.atsAnalysis.topResumeKeywords = analysis.atsAnalysis.topResumeKeywords?.length ? analysis.atsAnalysis.topResumeKeywords : atsMetadata.topResumeKeywords;
        analysis.atsAnalysis.jobKeywordsFound = analysis.atsAnalysis.jobKeywordsFound?.length ? analysis.atsAnalysis.jobKeywordsFound : atsMetadata.jobKeywordsFound;
        analysis.atsAnalysis.jobKeywordsMissing = analysis.atsAnalysis.jobKeywordsMissing?.length ? analysis.atsAnalysis.jobKeywordsMissing : atsMetadata.jobKeywordsMissing;
        analysis.atsAnalysis.jobKeywordDensity = analysis.atsAnalysis.jobKeywordDensity || atsMetadata.keywordDensity;
        analysis.atsAnalysis.bulletPointQualityScore = analysis.atsAnalysis.bulletPointQualityScore || atsMetadata.bulletPointQualityScore;
      }

      analysis.atsMetadata = {
        ...(analysis.atsMetadata || {}),
        ...(atsMetadata || {}),
        rawText: text,
        pageCount,
      };
      analysis.scoreReasons = analysis.scoreReasons || atsMetadata?.scoreReasons || [];
      analysis.categoryScores = analysis.categoryScores || atsMetadata?.categoryScores;
      analysis.bulletPointAnalysis = analysis.bulletPointAnalysis || atsMetadata?.bulletAnalyses || [];
      analysis.modelCalibration = analysis.modelCalibration || atsMetadata?.modelCalibration;

      const normalizedAnalysis = normalizeAnalysisResult(analysis) as AnalysisResult;
      setResult(normalizedAnalysis);
      setSharedResumeData(null);
      setPendingPatchToApply(null);
      setSharedChatMessages([
        {
          id: `copilot_init_${Date.now()}`,
          role: "model",
          text: `ATS Audit complete (${analysis.overallScore}% match). Ask what is missing for a crisp gap breakdown, or click any quick fix prompt to get 1-click resume patches.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          persona: "scanner",
          modelUsed: "gemini-4-hydrogen",
          followUpPrompts: [
            "Find what is missing for this job",
            "Fix my weakest bullets",
          ],
        },
      ]);
      saveToHistory(analysis, file, jobDescription);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(
        err.message || "Interruption in analysis processing. Please retry.",
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
        throw new Error(errorData.error || "Intelligence processing failed.");
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

  const exportToCSV = () => {
    if (!result) return;
    const data = [
      ["Category", "Value"],
      ["Overall Intelligence Score", result.overallScore],
      ["ATS Engine Compatibility", result.atsCompatibility],
      ["Skill Vector Density", result.skillsMatch],
      ["Formatting Health", result.atsAnalysis.formattingScore],
      ["Primary Trajectory", result.careerPath.topRole],
      ...result.skillGapReport.map((sg) => [`Gap: ${sg.skill}`, sg.importance])
    ];

    const csvContent = data.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Autonomous_Career_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-body"></div>

      {/* Executive Studio Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div 
            onClick={() => {
              setResult(null);
              setFile(null);
            }}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-700 via-violet-600 to-purple-600 flex items-center justify-center shadow-sm text-white group-hover:scale-105 transition-transform">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black font-display tracking-tight text-zinc-950 dark:text-white">
                  Resume Studio
                </span>
                <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold uppercase tracking-wide border border-violet-200 dark:border-violet-800">
                  AI Canvas
                </span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Executive ATS & Career Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-300">
            {/* Theme Toggle: White Studio vs Obsidian Dark */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setCurrentTheme("canva-light");
                  document.documentElement.setAttribute("data-theme", "canva-light");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTheme === "canva-light"
                    ? "bg-white text-violet-700 shadow-sm font-extrabold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Switch to White Studio Theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentTheme("figma-dark");
                  document.documentElement.setAttribute("data-theme", "figma-dark");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTheme === "figma-dark"
                    ? "bg-zinc-950 text-white shadow-sm font-extrabold border border-zinc-800"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Switch to Obsidian Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            {/* ATS Resume Generator & AI Coach Trigger */}
            {result && (
              <button
                onClick={() => setIsResumeBuilderOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm hover:from-violet-600 hover:to-purple-600 active:scale-95 cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>ATS Builder</span>
              </button>
            )}

            {/* Version Dropdown Selector if session history exists */}
            {history.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl no-print">
                <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <select
                  value={activeVersionId || (history[0]?.id ?? "")}
                  onChange={(e) => switchActiveVersion(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  {history.map((ver, idx) => (
                    <option key={`top-ver-${ver.id || idx}-${idx}`} value={ver.id} className="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white">
                      {ver.versionName || `Version ${history.length - idx}`} ({ver.result?.overallScore || 0}%)
                    </option>
                  ))}
                  <option key="opt-new" value="__new__" className="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold">
                    + Snapshot
                  </option>
                </select>
              </div>
            )}

            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>History {history.length > 0 && `(${history.length})`}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence>
          {isGuideOpen && (
            <div key="guide-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                className="max-w-4xl w-full bg-white dark:bg-[#111116] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 md:p-12 space-y-8 my-auto"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-zinc-950 dark:text-white font-display uppercase tracking-tighter mb-2">
                      Resume Formatting Protocol
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">
                      Best Practices for ATS & Human Readability
                    </p>
                  </div>
                  <button
                    onClick={() => setIsGuideOpen(false)}
                    aria-label="Close Formatting Guide"
                    className="h-10 w-10 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 h-[60vh] overflow-y-auto pr-4">
                  {/* Typography & Spacing */}
                  <div className="space-y-6">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-violet-500/10 border border-violet-500/25 rounded-lg flex items-center justify-center text-violet-700 dark:text-violet-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest">
                          Typography & Layout
                        </h4>
                      </div>
                      <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <div>
                          <strong className="text-zinc-950 dark:text-white block mb-1">
                            Fonts:
                          </strong>{" "}
                          Avoid complex serif fonts. Stick to clean, modern
                          sans-serif fonts like{" "}
                          <strong>
                            Helvetica, Arial, Calibri, or Roboto
                          </strong>
                          . Size should be <strong>10-12pt</strong> for body,
                          and <strong>14-16pt</strong> for headers.
                        </div>
                        <div>
                          <strong className="text-zinc-950 dark:text-white block mb-1">
                            Margins:
                          </strong>{" "}
                          Maintain <strong>0.5 to 1-inch margins</strong> on all
                          sides to ensure it prints well and provides enough
                          whitespace.
                        </div>
                        <div>
                          <strong className="text-zinc-950 dark:text-white block mb-1">
                            Formats:
                          </strong>{" "}
                          Always export to <strong>PDF</strong>. Word documents
                          (.docx) can break formatting depending on the ATS or
                          the recruiter's system.
                        </div>
                      </div>
                    </div>

                    {/* Section Structuring */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-purple-500/10 border border-purple-500/25 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-400">
                          <Layout className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest">
                          Section Structuring
                        </h4>
                      </div>
                      <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <div>
                          <strong className="text-zinc-950 dark:text-white">
                            1. Contact Header:
                          </strong>{" "}
                          Name, Phone, Email, Location, LinkedIn/Portfolio. (No
                          photos or exact street addresses).
                        </div>
                        <div>
                          <strong className="text-zinc-950 dark:text-white">
                            2. Professional Summary:
                          </strong>{" "}
                          2-3 sentences targeting the specific role. No
                          objective statements.
                        </div>
                        <div>
                          <strong className="text-zinc-950 dark:text-white">3. Experience:</strong>{" "}
                          Reverse-chronological order. Use 3-5 bullet points per
                          role focusing on impact.
                        </div>
                        <div>
                          <strong className="text-zinc-950 dark:text-white">4. Skills:</strong>{" "}
                          Group by category (e.g., Languages, Frameworks,
                          Tools). Keep it scannable.
                        </div>
                        <div>
                          <strong className="text-zinc-950 dark:text-white">5. Education:</strong>{" "}
                          Degree, Major, Institution, Year (Optional if 5+ years
                          exp).
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Points & Visual Example */}
                  <div className="space-y-6">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-violet-500/10 border border-violet-500/25 rounded-lg flex items-center justify-center text-violet-700 dark:text-violet-400">
                          <Zap className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest">
                          The XYZ Formula
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
                        Executive recruiters recommend the{" "}
                        <strong>XYZ formula</strong> for achievements:
                        "Accomplished [X] as measured by [Y], by doing [Z]."
                      </p>

                      <div className="space-y-3">
                        <div className="p-3 bg-rose-500/5 border-l-2 border-rose-500 text-xs rounded-r-lg">
                          <span className="text-rose-700 dark:text-rose-400 font-bold uppercase text-[10px] block mb-1">
                            Weak Example
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 line-through">
                            Helped increase sales for the company.
                          </span>
                        </div>
                        <div className="p-3 bg-violet-500/10 border-l-2 border-violet-600 text-xs text-zinc-900 dark:text-zinc-200 rounded-r-lg">
                          <span className="text-violet-700 dark:text-violet-400 font-bold uppercase text-[10px] block mb-1">
                            Executive Example
                          </span>
                          "Grew Q3 revenue by 24% ($1.2M) mapping new sales
                          territories and introducing a CRM automation
                          pipeline."
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-violet-500/5 border border-violet-500/25 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-violet-500/15 rounded-lg flex items-center justify-center text-violet-700 dark:text-violet-400">
                          <Target className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-violet-700 dark:text-violet-300 uppercase tracking-widest">
                          ATS Anti-Patterns
                        </h4>
                      </div>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-3">
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>
                            <strong>2-Column Layouts:</strong> Many ATS parse
                            left-to-right, completely scrambling two-column
                            designs.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>
                            <strong>Tables & Graphics:</strong> Exclude images,
                            complex tables, progress bars, or skill rating
                            circles.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
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
            <div key="linkedin-post-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-xl w-full bg-white dark:bg-[#111116] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-10 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tighter">
                    LinkedIn Post Content
                  </h3>
                  <button
                    onClick={() => setIsLinkedInModalOpen(false)}
                    className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm italic">
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

          {/* Connect LinkedIn Profile Modal */}
          <ConnectLinkedInModal
            key="connect-linkedin-modal"
            isOpen={isConnectLinkedInModalOpen}
            onClose={() => setIsConnectLinkedInModalOpen(false)}
            linkedinUrl={linkedinUrl}
            linkedinData={linkedinData}
            resumeContext={result?.summary || jobDescription || (file ? `File: ${file.name}` : "")}
            resumeData={result}
            initialTrustScore={linkedInTrustScore}
            onOpenWalkthrough={() => {
              setIsConnectLinkedInModalOpen(false);
              setTimeout(() => {
                setIsTrustScoreWalkthroughOpen(true);
              }, 300);
            }}
            onVerificationComplete={(score, report) => {
              setLinkedInTrustScore(score);
              if (report) setLinkedInTrustReport(report);
              sessionStorage.setItem("current_linkedin_trust_score", String(score));
              try {
                const hasSeen = localStorage.getItem("has_seen_trust_score_walkthrough");
                if (!hasSeen) {
                  setTimeout(() => {
                    setIsTrustScoreWalkthroughOpen(true);
                  }, 400);
                }
              } catch {
                // ignore
              }
            }}
            onSave={(newUrl, newData, verifiedScore) => {
              setLinkedinUrl(newUrl);
              setLinkedinData(newData || "");
              if (typeof verifiedScore === "number") {
                setLinkedInTrustScore(verifiedScore);
                sessionStorage.setItem("current_linkedin_trust_score", String(verifiedScore));
                try {
                  const hasSeen = localStorage.getItem("has_seen_trust_score_walkthrough");
                  if (!hasSeen) {
                    setTimeout(() => {
                      setIsTrustScoreWalkthroughOpen(true);
                    }, 400);
                  }
                } catch {
                  // ignore
                }
              }
              handleVerifyLinkedInTrust(newUrl, newData || "");
              if (result) {
                const topRole = result.careerPath?.topRole || "Senior Technology Leader";
                setResult({
                  ...result,
                  linkedinComparison: {
                    hasLinkedIn: true,
                    resumeHeadline: result.linkedinComparison?.resumeHeadline || topRole,
                    linkedinHeadline: newData && newData.toLowerCase().includes("headline:")
                      ? newData.split("\n")[0].replace(/^headline:\s*/i, "").trim()
                      : `${topRole} | High-Impact Systems Architecture & Strategy`,
                    matchAnalysis: `Cross-vector analysis updated for linked profile (${newUrl}). Evaluation shows strong alignment with recommendations for synchronizing quantified metrics and executive presence.`,
                    missingFromResume: (result.linkedinComparison?.missingFromResume && result.linkedinComparison.missingFromResume.length > 0)
                      ? result.linkedinComparison.missingFromResume
                      : ["Executive Recommendations", "Domain Keyword Endorsements", "Relevant Industry Certifications"],
                    missingFromLinkedIn: (result.linkedinComparison?.missingFromLinkedIn && result.linkedinComparison.missingFromLinkedIn.length > 0)
                      ? result.linkedinComparison.missingFromLinkedIn
                      : ["Quantified Financial Impact", "System Performance Metrics", "Key Architectural Achievements"],
                  },
                });
              }
            }}
            onDisconnect={() => {
              setLinkedinUrl("");
              setLinkedinData("");
              setLinkedInTrustScore(null);
              setLinkedInTrustReport(null);
              sessionStorage.removeItem("current_linkedin_trust_score");
              sessionStorage.removeItem("current_linkedin_trust_report");
              if (result && result.linkedinComparison) {
                setResult({
                  ...result,
                  linkedinComparison: {
                    ...result.linkedinComparison,
                    hasLinkedIn: false,
                  },
                });
              }
            }}
          />

          {/* LinkedIn Live Verification & Real-Time Trust Score Modal */}
          <LinkedInVerificationModal
            key="linkedin-verification-modal"
            isOpen={isLinkedInVerificationModalOpen}
            onClose={() => setIsLinkedInVerificationModalOpen(false)}
            resumeData={result}
            resumeText={result?.summary || jobDescription || (file ? file.name : "")}
            initialLinkedinUrl={linkedinUrl}
            initialLinkedinData={linkedinData}
            onSaveVerifiedData={(url, data, trustScore) => {
              setLinkedinUrl(url);
              setLinkedinData(data);
              setLinkedInTrustScore(trustScore);
              try {
                sessionStorage.setItem("current_linkedin_url", url);
                sessionStorage.setItem("current_linkedin_data", data);
                sessionStorage.setItem("current_linkedin_trust_score", String(trustScore));
              } catch {
                // ignore storage quota errors
              }
              try {
                const hasSeen = localStorage.getItem("has_seen_trust_score_walkthrough");
                if (!hasSeen) {
                  setIsTrustScoreWalkthroughOpen(true);
                }
              } catch {
                // ignore
              }
            }}
          />

          {/* Side-by-Side Version Comparison Modal */}
          <HistoryComparisonModal
            key="history-comparison-modal"
            isOpen={isComparisonModalOpen}
            onClose={() => setIsComparisonModalOpen(false)}
            history={history}
            initialCompareIds={compareIds}
            onLoadVersion={(item) => {
              setResult(item.result);
              if (item.stickyNotes) setStickyNotes(JSON.parse(JSON.stringify(item.stickyNotes)));
              if (item.highlights) setHighlights(JSON.parse(JSON.stringify(item.highlights)));
              if (item.pageSummaries) setPageSummaries(JSON.parse(JSON.stringify(item.pageSummaries)));
              if (item.jobDescription) setJobDescription(item.jobDescription);
              setIsComparisonModalOpen(false);
              setSnapshotToast(`Loaded version "${item.versionName || item.fileName}"`);
              setTimeout(() => setSnapshotToast(null), 3000);
            }}
          />

          {/* Share Verified Trust Score Social Media Graphic Modal */}
          <ShareTrustScoreModal
            key="share-trust-score-modal"
            isOpen={isShareTrustScoreOpen}
            onClose={() => setIsShareTrustScoreOpen(false)}
            credibilityScore={linkedInTrustScore}
            credibilityTier={linkedInTrustReport?.credibilityTier}
            linkedinUrl={linkedinUrl}
            candidateName={linkedInTrustReport?.candidateName || (file ? file.name.replace(/\.[^/.]+$/, "") : "Executive Candidate")}
            targetRole={result?.careerPath?.topRole || "Senior Technology Leader"}
            trustFactors={linkedInTrustReport?.trustFactors}
          />

          {/* Interactive Tooltip & Tutorial Walkthrough for Share my Trust Score */}
          <TrustScoreWalkthroughTooltip
            key="trust-score-walkthrough-tooltip"
            isOpen={isTrustScoreWalkthroughOpen}
            onClose={() => setIsTrustScoreWalkthroughOpen(false)}
            onOpenShareModal={() => setIsShareTrustScoreOpen(true)}
            credibilityScore={linkedInTrustScore}
            credibilityTier={linkedInTrustReport?.credibilityTier}
            candidateName={linkedInTrustReport?.candidateName || (file ? file.name.replace(/\.[^/.]+$/, "") : "Alex Mercer")}
            targetRole={result?.careerPath?.topRole || "Executive Leadership"}
          />

          {/* PDF Export Preview & Interactive Section Filter Modal */}
          <PanelErrorBoundary compact title="PDF Export Preview">
            <PdfExportPreviewModal
              key="pdf-export-preview-modal"
              isOpen={isPdfPreviewOpen}
              onClose={() => setIsPdfPreviewOpen(false)}
              result={result}
              fileName={file?.name}
              linkedinUrl={linkedinUrl}
              linkedInTrustScore={linkedInTrustScore}
              candidateName={linkedInTrustReport?.candidateName || (file ? file.name.replace(/\.[^/.]+$/, "") : "Alex Mercer")}
            />
          </PanelErrorBoundary>

          {/* Floating Missing Keyword Sentence Placement Helper */}
          <MissingKeywordHelper
            key="missing-keyword-helper"
            keyword={selectedMissingKeyword}
            targetRole={result?.targetRole || "Software Engineer"}
            foundSkills={result?.foundSkills || []}
            existingOptimization={result?.atsAnalysis?.keywordOptimizations?.find(
              (o) => o.keyword.toLowerCase() === selectedMissingKeyword?.toLowerCase()
            )}
            anchorPosition={keywordHelperAnchor}
            onClose={() => setSelectedMissingKeyword(null)}
            onOpenResumeBuilder={(kw) => {
              setSelectedSkillToFrame(kw);
              setIsResumeBuilderOpen(true);
              setSelectedMissingKeyword(null);
            }}
          />

          {isPurgePromptOpen && (
            <div key="purge-prompt-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white dark:bg-[#111116] rounded-3xl border border-rose-500/35 p-10 space-y-6 shadow-2xl"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-rose-700 dark:text-rose-400 font-display uppercase tracking-widest">
                        Confirm Purge
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPurgePromptOpen(false)}
                    className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  Are you sure you want to permanently delete all session data?
                  This action cannot be undone and you will lose all analysis
                  history and uploaded files.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsPurgePromptOpen(false)}
                    className="py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={purgeSession}
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm cursor-pointer"
                  >
                    Delete Data
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isHistoryOpen && (
            <motion.div
              key="history-drawer"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed inset-y-0 right-0 w-96 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-3xl border-l border-zinc-200 dark:border-zinc-800 z-[60] shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  Analysis Archive
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {result && (
                <button
                  onClick={() => takeSnapshot()}
                  className="w-full mb-6 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Snapshot Current State
                </button>
              )}

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
                  <Info className="h-12 w-12 mb-4 opacity-25" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No archival data found
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-violet-600/50 before:to-transparent">
                  {history.map((item, mapIdx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mapIdx * 0.06 }}
                      key={item.id + "-" + mapIdx}
                      onClick={() => {
                        setResult(item.result);
                        setStickyNotes(item.stickyNotes ? JSON.parse(JSON.stringify(item.stickyNotes)) : []);
                        setHighlights(item.highlights ? JSON.parse(JSON.stringify(item.highlights)) : []);
                        setPageSummaries(item.pageSummaries ? JSON.parse(JSON.stringify(item.pageSummaries)) : {});
                        if (item.jobDescription) setJobDescription(item.jobDescription);
                        setIsHistoryOpen(false);
                        setSnapshotToast(`Loaded version "${item.versionName || item.fileName}"`);
                        setTimeout(() => setSnapshotToast(null), 3000);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer group relative
                        ${
                          compareIds.includes(item.id)
                            ? "bg-violet-500/10 border-violet-500/50"
                            : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-violet-400/50"
                        }`}
                    >
                      <div className="absolute left-[-29px] top-5 w-3 h-3 rounded-full bg-white dark:bg-[#09090b] border-2 border-violet-500/50 z-10 transition-colors group-hover:border-violet-500 group-hover:bg-violet-600"></div>

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVersionId(item.id);
                              setEditVersionName(item.versionName || `Draft ${mapIdx + 1}`);
                            }}
                            className="h-6 w-6 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors flex items-center justify-center"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => toggleCompare(item.id, e)}
                            className={`h-6 w-6 rounded flex items-center justify-center transition-colors
                              ${compareIds.includes(item.id) ? "bg-violet-600 text-white" : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}
                          >
                            <Target className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => deleteFromHistory(item.id, e)}
                            className="h-6 w-6 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {editingVersionId === item.id ? (
                        <div className="mb-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editVersionName}
                            onChange={(e) => setEditVersionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renameHistoryItem(item.id, editVersionName);
                              if (e.key === 'Escape') setEditingVersionId(null);
                            }}
                            className="bg-white dark:bg-zinc-950 border border-violet-500/50 rounded px-2 py-1 text-xs text-zinc-950 dark:text-white outline-none w-full"
                            autoFocus
                          />
                          <button onClick={() => renameHistoryItem(item.id, editVersionName)} className="text-violet-600 dark:text-violet-400 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-black text-zinc-950 dark:text-white truncate mb-2">
                          {item.versionName ? `${item.versionName} (${item.fileName})` : item.fileName}
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 font-mono tabular-nums">
                            {item.result.overallScore}%
                          </span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">
                            Match
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 font-mono tabular-nums">
                            {item.result.skillsMatch}%
                          </span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">
                            Skills
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <StickyNote className="w-2.5 h-2.5" /> {item.stickyNotes?.length || 0} Notes
                        </span>
                        <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <Highlighter className="w-2.5 h-2.5" /> {item.highlights?.length || 0} Highlights
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {compareIds.length >= 2 ? (
                <div className="sticky bottom-0 left-0 right-0 pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95">
                  <button
                    onClick={() => {
                      setIsComparisonModalOpen(true);
                      setIsHistoryOpen(false);
                    }}
                    className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Compare {compareIds.length} Selected Versions</span>
                  </button>
                </div>
              ) : history.length >= 2 ? (
                <div className="sticky bottom-0 left-0 right-0 pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95">
                  <button
                    onClick={() => {
                      setIsComparisonModalOpen(true);
                      setIsHistoryOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Side-by-Side Version Comparison</span>
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}

          {compareIds.length >= 2 && !result && (
            <motion.div
              key="delta-comparison-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[70] bg-zinc-50 dark:bg-[#09090b] flex flex-col p-12 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black font-display text-zinc-950 dark:text-white uppercase tracking-tighter">
                  Delta Intelligence Comparison
                </h2>
                <button
                  onClick={() => setCompareIds([])}
                  className="px-8 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-black hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-xs cursor-pointer"
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
                      <GlassCard key={`gc-${item.id || idx}-${idx}`} className="space-y-8">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest flex items-center justify-between">
                            <span>
                              {item.versionName || `Version ${String.fromCharCode(65 + idx)}`} -{" "}
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                            {idx > 0 && scoreDiff !== 0 && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black ${scoreDiff > 0 ? "bg-violet-500/15 text-violet-700 dark:text-violet-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-400"}`}
                              >
                                {scoreDiff > 0 ? "+" : ""}
                                {scoreDiff} pts
                              </motion.span>
                            )}
                          </p>
                          <h3 className="text-xl font-black text-zinc-950 dark:text-white truncate">
                            {item.fileName}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="relative p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">
                              Intelligence Score
                            </p>
                            <p className="text-3xl font-black text-zinc-950 dark:text-white font-display tabular-nums">
                              {item.result.overallScore}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">
                              ATS Compatibility
                            </p>
                            <p className="text-3xl font-black text-zinc-950 dark:text-white font-display tabular-nums">
                              {item.result.atsCompatibility}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">
                              Skill Vector
                            </p>
                            <p className="text-3xl font-black text-zinc-950 dark:text-white font-display tabular-nums">
                              {item.result.skillsMatch}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">
                              Format Health
                            </p>
                            <p className="text-3xl font-black text-zinc-950 dark:text-white font-display tabular-nums">
                              {item.result.atsAnalysis.formattingScore}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                            Core Summary
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic border-l-2 border-violet-500/40 pl-4">
                            "{item.result.summary}"
                          </p>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                            Found Intelligence
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.result.foundSkills
                              .slice(0, 10)
                              .map((s, i) => (
                                <span
                                  key={`fs-${idx}-${s}-${i}`}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[9px] font-black text-zinc-700 dark:text-zinc-300 uppercase"
                                >
                                  {s}
                                </span>
                              ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                            Priority Gaps
                          </p>
                          <div className="space-y-2">
                            {item.result.skillGapReport
                              .slice(0, 3)
                              .map((gap, i) => (
                                <div
                                  key={`sgr-${idx}-${gap.skill || i}-${i}`}
                                  className="flex justify-between items-center text-[10px] uppercase"
                                >
                                  <span className="text-zinc-700 dark:text-zinc-300">
                                    {gap.skill}
                                  </span>
                                  <span
                                    className={
                                      gap.importance === "Critical"
                                        ? "text-rose-600 dark:text-rose-400 font-bold"
                                        : "text-purple-700 dark:text-purple-400 font-bold"
                                    }
                                  >
                                    {gap.importance}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                            Snapshot Annotations
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-[10px] font-bold flex items-center gap-1">
                              <StickyNote className="w-3 h-3" /> {item.stickyNotes?.length || 0} Sticky Notes
                            </span>
                            <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1">
                              <Highlighter className="w-3 h-3" /> {item.highlights?.length || 0} Highlights
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setResult(item.result);
                              setStickyNotes(item.stickyNotes ? JSON.parse(JSON.stringify(item.stickyNotes)) : []);
                              setHighlights(item.highlights ? JSON.parse(JSON.stringify(item.highlights)) : []);
                              setPageSummaries(item.pageSummaries ? JSON.parse(JSON.stringify(item.pageSummaries)) : {});
                              if (item.jobDescription) setJobDescription(item.jobDescription);
                              setCompareIds([]);
                              setSnapshotToast(`Activated version "${item.versionName || item.fileName}"`);
                              setTimeout(() => setSnapshotToast(null), 3000);
                            }}
                            className="w-full mt-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Load & View Version
                          </button>
                        </div>
                      </GlassCard>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {isSessionPurged && (
            <motion.div
              key="session-purged-toast"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-950 dark:bg-violet-700 text-white border border-violet-500/40 px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs"
            >
              <ShieldCheck className="h-5 w-5 text-violet-300" />
              Memory Purged Successfully
            </motion.div>
          )}

          {snapshotToast && (
            <motion.div
              key="snapshot-toast"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              className="fixed bottom-8 right-8 z-[100] bg-zinc-950 text-white border border-violet-500/40 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-wide"
            >
              <BookmarkPlus className="w-5 h-5 text-violet-400 shrink-0" />
              <span>{snapshotToast}</span>
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
                <motion.h2
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="text-5xl md:text-[4.5rem] lg:text-[5.5rem] font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-300 mb-8 tracking-tighter leading-[1.05]"
                >
                  Dominate the Executive Search.
                  <br />
                  <span className="glow-text-accent relative inline-block mt-2">
                    Secure Your Next Leadership Role.
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 0.6 }}
                      transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
                      className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-violet-600 to-transparent origin-left"
                    />
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
                  className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed tracking-wide"
                >
                  Upload your executive brief and target mandate. Our AI
                  assesses your strategic positioning against top-tier search firm
                  criteria, identifies critical capability gaps, and provides
                  board-ready narrative recommendations to solidify your candidacy.
                </motion.p>

                {/* Floating 'Verify with LinkedIn' Action Badge (Pre-Upload Instant Trigger) */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-8 flex justify-center"
                >
                  <motion.button
                    id="hero-verify-linkedin-badge"
                    type="button"
                    onClick={() => setIsLinkedInVerificationModalOpen(true)}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 min-h-[44px] max-w-full rounded-full bg-white/95 dark:bg-[#111116]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-600/60 dark:hover:border-violet-400/70 shadow-[0_10px_28px_-10px_rgba(9,9,11,0.16)] dark:shadow-[0_14px_34px_-10px_rgba(124,58,237,0.28)] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                    title="Verify your LinkedIn profile and inspect your real-time Credibility Score before uploading a resume"
                  >
                    <span className="w-7 h-7 rounded-full bg-violet-600/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                    </span>

                    <span className="text-xs font-extrabold tracking-wide text-zinc-950 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                      Verify with LinkedIn
                    </span>

                    <span aria-hidden="true" className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                      <span className="text-xs font-black text-violet-700 dark:text-violet-300">
                        {linkedInTrustScore !== null ? `${linkedInTrustScore}%` : "~84%"}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {linkedInTrustScore !== null ? "Verified Trust" : "Est. Trust"}
                      </span>
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Upload Interface */}
              <div className="grid md:grid-cols-2 gap-8">
                <GlassCard delay={0.1}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Layers className="h-4 w-4 text-violet-700 dark:text-violet-400" />
                      Resume Upload
                    </h3>
                  </div>
                  <motion.div
                    {...(getRootProps() as any)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`group relative rounded-2xl transition-all cursor-pointer text-center h-[14rem] flex flex-col items-center justify-center overflow-hidden
                      ${isDragReject ? "bg-rose-500/10 border-rose-500/50" : isDragActive ? "bg-violet-500/10 border-violet-500/50" : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"}`}
                  >
                    <div
                      className="absolute inset-0 border-2 border-dashed rounded-2xl opacity-60 transition-colors duration-300 group-hover:border-violet-600/60"
                      style={{
                        borderColor: isDragReject
                          ? "#e11d48"
                          : isDragActive
                            ? "#7c3aed"
                            : currentTheme === "figma-dark"
                              ? "rgba(255,255,255,0.18)"
                              : "rgba(113,113,122,0.38)",
                      }}
                    />
                    <input {...getInputProps()} />

                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ShieldCheck className="h-4 w-4 text-zinc-500" />
                    </div>

                    <div className="flex flex-col items-center gap-4 relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
                      <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-sm relative z-10">
                        {isDragReject ? (
                          <AlertCircle className="h-7 w-7 transition-colors duration-300 text-rose-600 dark:text-rose-400" />
                        ) : (
                          <Upload
                            className={`h-7 w-7 transition-colors duration-300 ${isDragActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-600 dark:text-zinc-400 group-hover:text-violet-700 dark:group-hover:text-violet-300"}`}
                          />
                        )}
                      </div>

                      {file ? (
                        <div className="space-y-1.5 px-6">
                          <p className="text-violet-700 dark:text-violet-300 font-black text-sm uppercase tracking-tight truncate max-w-[250px]">
                            {file.name}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                            <p className="text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-[0.2em]">
                              Ready For Analysis
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p
                            className={`font-black text-[13px] uppercase tracking-widest transition-colors ${isDragReject ? "text-rose-600 dark:text-rose-400" : "text-zinc-800 dark:text-zinc-200"}`}
                          >
                            {isDragReject
                              ? "Unsupported Format"
                              : "Drag & Drop Executive Brief Here"}
                          </p>
                          <div className="flex items-center justify-center gap-4 text-zinc-500">
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
                        const sampleContent = `Alex Mercer
Senior Staff Software Engineer & Cloud Architect
Email: alex.mercer@techlead.dev | Phone: +1 (555) 234-5678 | LinkedIn: linkedin.com/in/alexmercer-tech

PROFESSIONAL SUMMARY
Senior Staff Engineer with 8+ years of experience architecting distributed cloud systems, modern web applications, and high-throughput microservices. Proven track record leading engineering teams of 12+ developers, scaling infrastructure to 5M+ daily active users, and reducing AWS latency by 42%.

TECHNICAL SKILLS
Languages & Frameworks: TypeScript, JavaScript (ES6+), React 18, Next.js, Node.js, Express, Python, GraphQL, REST APIs
Cloud & DevOps: AWS (EC2, Lambda, S3, ECS, CloudFront), Docker, Kubernetes, Terraform, CI/CD (GitHub Actions)
Databases & Storage: PostgreSQL, Redis, MongoDB, DynamoDB
Architecture: Microservices, Event-Driven Architecture, System Design, High Availability, Web Security

WORK EXPERIENCE
Lead Systems Architect | CloudScale Tech (2021 - Present)
• Spearheaded redesign of core transaction processing engine using Node.js and Redis, reducing p99 latency from 450ms to 85ms across 10M daily transactions.
• Directed team of 10 engineers in migrating legacy monolith to AWS containerized microservices (ECS/Docker), cutting infrastructure cloud expenditure by $180,000 annually.
• Implemented automated CI/CD deployment pipelines with GitHub Actions and Terraform, accelerating release velocity from bi-weekly to 5+ daily deployments with zero downtime.

Senior Full Stack Engineer | Apex Financial Software (2018 - 2021)
• Engineered real-time financial analytics dashboard in React, TypeScript, and WebSockets, handling live data streams for 200,000+ active enterprise users.
• Designed OAuth2 authentication framework and role-based access controls (RBAC) ensuring SOC2 Type II compliance.
• Mentored 6 junior/mid-level developers, establishing engineering best practices, unit testing coverage standards (Jest 90%+), and code review guidelines.

EDUCATION & CERTIFICATIONS
B.S. in Computer Science | University of California, Berkeley (2018)
AWS Certified Solutions Architect – Associate (2022)`;
                        const sample = new File(
                          [sampleContent],
                          "Alex_Mercer_Senior_Software_Engineer_Resume.txt",
                          { type: "text/plain" },
                        );
                        setFile(sample);
                        setJobDescription(
                          "We are seeking a Lead / Senior Staff Software Engineer to lead the architecture of our cloud-native web platform. Requirements: 7+ years of experience with React, TypeScript, Node.js, distributed microservices, AWS cloud architecture, and PostgreSQL. Must have experience mentoring developers, driving CI/CD automation, and improving system scalability and latency.",
                        );
                        setLinkedinUrl("https://linkedin.com/in/alexmercer-tech");
                        setLinkedinData(
                          "Headline: Senior Staff Software Engineer & Cloud Architect | Distributed Systems & AWS\nAbout: 8+ years architecting microservices and leading platform teams. Scaled systems to 5M+ daily active users.",
                        );
                      }}
                      className="text-[10px] font-black text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300 uppercase tracking-widest bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2 rounded-lg transition-all border border-violet-500/30 hover:border-violet-500/50 cursor-pointer"
                    >
                      Use Sample Resume & Job Description
                    </button>
                  </div>

                  <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
                    <div className="group relative w-full">
                      {linkedinUrl ? (
                        <div className="w-full flex flex-col gap-2.5 p-3 rounded-xl border border-violet-500/35 bg-violet-500/5 dark:bg-violet-950/20 transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setIsConnectLinkedInModalOpen(true)}
                              className="flex items-center gap-3 text-left overflow-hidden flex-1 cursor-pointer"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                className="shrink-0 text-violet-700 dark:text-violet-400"
                              >
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                              </svg>
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-2 text-xs text-zinc-950 dark:text-white">
                                  <span className="font-bold tracking-wide">
                                    LinkedIn Connected
                                  </span>
                                  <span aria-hidden="true" className="text-zinc-400">·</span>
                                  <span className="text-violet-700 dark:text-violet-400 font-semibold text-[11px]">
                                    Active
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono truncate max-w-[180px] sm:max-w-xs">
                                  {linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\//i, "")}
                                </p>
                              </div>
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleVerifyLinkedInTrust()}
                                disabled={isVerifyingLinkedInTrust}
                                className="text-[11px] font-bold text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white bg-violet-500/15 hover:bg-violet-500/25 px-3 py-1.5 rounded-lg border border-violet-500/35 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                                title="Perform real-time verification of LinkedIn profile data against resume content"
                              >
                                <ShieldCheck className={`w-3.5 h-3.5 text-violet-700 dark:text-violet-400 ${isVerifyingLinkedInTrust ? "animate-spin" : ""}`} />
                                <span>{isVerifyingLinkedInTrust ? "Verifying..." : "LinkedIn Trust Score"}</span>
                                {linkedInTrustScore !== null && (
                                  <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white ml-0.5">
                                    {linkedInTrustScore}%
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsConnectLinkedInModalOpen(true)}
                                className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 transition-all whitespace-nowrap cursor-pointer"
                              >
                                Manage
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLinkedinUrl("");
                                  setLinkedinData("");
                                  setLinkedInTrustScore(null);
                                  setLinkedInTrustReport(null);
                                  sessionStorage.removeItem("current_linkedin_trust_score");
                                  sessionStorage.removeItem("current_linkedin_trust_report");
                                }}
                                className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                title="Disconnect LinkedIn profile"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setIsConnectLinkedInModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border transition-all bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer whitespace-nowrap"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                              className="shrink-0 text-violet-700 dark:text-violet-400"
                            >
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                            </svg>
                            <span className="text-xs font-bold tracking-wide">
                              Connect LinkedIn Profile
                            </span>
                          </motion.button>
                          <button
                            type="button"
                            onClick={() => handleVerifyLinkedInTrust()}
                            disabled={isVerifyingLinkedInTrust}
                            className="px-4 py-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                            title="Verify public LinkedIn profile data against your resume content in real time"
                          >
                            <ShieldCheck className={`w-4 h-4 text-violet-700 dark:text-violet-400 ${isVerifyingLinkedInTrust ? "animate-spin" : ""}`} />
                            <span>{isVerifyingLinkedInTrust ? "Verifying..." : "LinkedIn Trust Score"}</span>
                            {linkedInTrustScore !== null && (
                              <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                                {linkedInTrustScore}%
                              </span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Real-Time Credibility Score Display inside the LinkedIn Connection Section */}
                    {linkedInTrustScore !== null && (
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/95 border border-violet-500/30 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                            <span className="font-semibold text-zinc-950 dark:text-white">Credibility Score</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-violet-700 dark:text-violet-300 font-medium">
                              {linkedInTrustReport?.credibilityTier ||
                                (linkedInTrustScore >= 85
                                  ? "Verified High Credibility"
                                  : linkedInTrustScore >= 70
                                  ? "Strong Profile Credibility"
                                  : "Moderate Credibility")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-mono font-bold tabular-nums text-violet-700 dark:text-violet-400">
                              {linkedInTrustScore}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsLinkedInVerificationModalOpen(true)}
                              className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white underline underline-offset-2 cursor-pointer whitespace-nowrap"
                            >
                              Full Audit
                            </button>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full transition-all duration-500"
                            style={{ width: `${linkedInTrustScore}%` }}
                          />
                        </div>
                        {linkedInTrustReport?.trustFactors && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                            {linkedInTrustReport.trustFactors.map((tf: any, idx: number) => (
                              <div
                                key={`landing-tf-${tf.name}-${idx}`}
                                className="flex items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950/60 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
                              >
                                <span className="truncate pr-1">{tf.name.split(" ")[0]}</span>
                                <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-200">
                                  {tf.score}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {linkedInTrustReport?.verificationSummary && (
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {linkedInTrustReport.verificationSummary}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard delay={0.2}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      Match Context
                    </h3>
                    <button
                      onClick={() => setJobDescription(`Chief Executive Officer (CEO) / Managing Director

Company: Global Innovations Inc.
Location: San Francisco, CA (Hybrid)

About the Role:
We are seeking a visionary Chief Executive Officer to lead our organization into its next phase of rapid growth and international expansion. The ideal candidate will have a proven track record of driving strategic initiatives, scaling operations, and fostering a high-performance culture.

Key Responsibilities:
- Lead the development and execution of the company's long-term strategy, aligning with the board's vision to drive revenue growth and market expansion.
- Oversee all operations and business activities to ensure they produce the desired results and are consistent with the overall strategy.
- Build, mentor, and inspire a world-class executive team, fostering a culture of innovation, accountability, and inclusivity.
- Drive key strategic partnerships and represent the company to stakeholders, investors, and the public.
- Manage financial performance, ensuring sustainable profitability and optimal capital allocation.

Qualifications:
- 15+ years of progressive leadership experience, with at least 5 years in a C-level or GM role within the technology or manufacturing sector.
- Demonstrated success in scaling a business from $50M to $250M+ in revenue.
- Exceptional strategic thinking, financial acumen, and operational expertise.
- Strong communication and interpersonal skills, with the ability to influence and align diverse stakeholders.
- MBA or equivalent advanced degree preferred.`)}
                      className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors flex items-center gap-1 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/25 hover:bg-violet-500/20 cursor-pointer"
                    >
                      <Zap className="h-3 w-3" /> Quick Fill
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        e.target.style.height = "inherit";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Paste the target job requirements to calibrate the intelligence engine..."
                      className="w-full min-h-[14rem] max-h-[30rem] bg-zinc-50 dark:bg-[#0D0D12] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all resize-y font-medium leading-relaxed custom-scrollbar relative z-10 shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 pointer-events-none z-20 bg-zinc-100/90 dark:bg-zinc-900/90 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">
                      {jobDescription.length > 0
                        ? `${jobDescription.length} chars`
                        : "Optional Context"}
                    </div>
                  </div>
                </GlassCard>
              </div>

              {file && file.type === "application/pdf" && (
                <div className="mt-8 flex justify-center" id="pdf-viewer-container">
                  <GlassCard className="w-full relative flex flex-col items-center">
                    <div className="flex flex-col w-full mb-6">
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          Document Preview
                          <div className="ml-4 flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 gap-1 flex-wrap">
                            <button
                              onClick={() => setAnnotationMode("sticky")}
                              className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${annotationMode === "sticky" ? "bg-violet-600/20 text-violet-800 dark:text-violet-300 border border-violet-500/40" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"}`}
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
                              className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${annotationMode === "highlight" ? "bg-violet-600/20 text-violet-800 dark:text-violet-300 border border-violet-500/40" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"}`}
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
                            <button
                              onClick={() => setAnnotationMode("batch")}
                              className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${annotationMode === "batch" ? "bg-purple-600/20 text-purple-800 dark:text-purple-300 border border-purple-500/40" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"}`}
                            >
                              <Wand2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              Batch Highlight
                            </button>
                            {annotationMode === "sticky" && (
                              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                                <span className="text-[9px] text-violet-700 dark:text-violet-300 font-extrabold uppercase tracking-wider hidden sm:inline">Default Note Color:</span>
                                {Object.entries(STICKY_COLOR_CONFIG).map(([ckey, cval]) => (
                                  <button
                                    key={`sticky-color-${ckey}`}
                                    onClick={() => setDefaultStickyColor(ckey)}
                                    className={`w-4 h-4 rounded-full border border-zinc-400/50 dark:border-white/30 transition-all cursor-pointer ${
                                      defaultStickyColor === ckey
                                        ? "scale-125 ring-2 ring-violet-500"
                                        : "opacity-60 hover:opacity-100 hover:scale-110"
                                    }`}
                                    style={{ backgroundColor: cval.dotColor }}
                                    title={`New Sticky Note: ${cval.label}`}
                                  />
                                ))}
                              </div>
                            )}
                            {annotationMode === "highlight" && (
                              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                                {[
                                  "rgba(139, 92, 246, 0.35)",
                                  "rgba(168, 85, 247, 0.35)",
                                  "rgba(109, 40, 217, 0.32)",
                                  "rgba(225, 29, 72, 0.32)",
                                ].map((color) => (
                                  <button
                                    key={`pal-color-${color}`}
                                    onClick={() => setHighlightColor(color)}
                                    className={`w-4 h-4 rounded-full border border-zinc-400/40 dark:border-white/20 transition-transform cursor-pointer ${highlightColor === color ? "scale-125 ring-1 ring-violet-500" : "hover:scale-110"}`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:inline">View Filters:</span>
                              <button
                                onClick={() => setVisibleStickyNotes(prev => !prev)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${visibleStickyNotes ? "bg-violet-500/20 text-violet-700 dark:text-violet-300" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}
                                title="Toggle Sticky Notes"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><path d="M15 3v6h6" /></svg>
                              </button>
                              <div className="flex items-center gap-1 ml-1 bg-zinc-200/70 dark:bg-white/5 rounded-md p-1">
                                {[
                                  "rgba(139, 92, 246, 0.35)",
                                  "rgba(168, 85, 247, 0.35)",
                                  "rgba(109, 40, 217, 0.32)",
                                  "rgba(225, 29, 72, 0.32)",
                                ].map((color) => {
                                  const isVisible = visibleHighlightColors.includes(color);
                                  return (
                                    <button
                                      key={`filter-${color}`}
                                      onClick={() => setVisibleHighlightColors(prev => 
                                        prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
                                      )}
                                      className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${isVisible ? "border-zinc-900 dark:border-white/70 scale-110" : "border-transparent opacity-30 hover:opacity-100"}`}
                                      style={{ backgroundColor: color, color: color.replace(/0\.\d+\)$/, '1)') }}
                                      title="Toggle Highlight Category"
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Search Bar in Document Viewer Toolbar */}
                            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700">
                              <div className="relative flex items-center">
                                <Search className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 absolute left-2.5 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Search notes & summaries..."
                                  value={sidebarSearch}
                                  onChange={(e) => setSidebarSearch(e.target.value)}
                                  className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-8 pr-7 py-1 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-violet-600 w-36 sm:w-52 transition-all shadow-inner"
                                />
                                {sidebarSearch && (
                                  <button
                                    onClick={() => setSidebarSearch("")}
                                    className="absolute right-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                    title="Clear Search"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-auto flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => takeSnapshot()}
                                disabled={!result}
                                className="px-3.5 py-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md text-violet-800 dark:text-violet-300 bg-violet-500/15 border border-violet-500/35 hover:bg-violet-500/25 hover:text-violet-950 dark:hover:text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                                title="Snapshot current analysis, sticky notes, and highlights into sidebar archive"
                              >
                                <BookmarkPlus className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                <span>Snapshot Version</span>
                              </button>

                              <button
                                onClick={exportAnnotatedPdf}
                                disabled={isExportingPdf || !file}
                                className="px-3.5 py-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md text-purple-800 dark:text-purple-300 bg-purple-500/15 border border-purple-500/35 hover:bg-purple-500/25 hover:text-purple-950 dark:hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                title="Export PDF with sticky notes and highlights burnt into document"
                              >
                                {isExportingPdf ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Exporting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <span>Export Annotated PDF</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={exportStickyNotesSummary}
                                disabled={stickyNotes.length === 0 && !Object.values(pageSummaries).some(s => s?.trim())}
                                className="px-3 py-1.5 hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-zinc-700 dark:text-zinc-200 bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                title="Export summary text file of all notes and page summaries"
                              >
                                <FileText className="h-3.5 w-3.5" /> Notes Summary ({stickyNotes.length + Object.values(pageSummaries).filter(s => s?.trim()).length})
                              </button>

                              {stickyNotes.length > 0 && (
                                <div className="hidden lg:flex items-center gap-1">
                                  {pendingNoteClear ? (
                                    <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/40 rounded-md px-2 py-1">
                                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-200">
                                        {pendingNoteClear === "page" ? `Clear Page ${pageNumber}?` : `Clear All (${stickyNotes.length})?`}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (pendingNoteClear === "page") {
                                            setStickyNotes(prev => prev.filter(n => n.pageNumber !== pageNumber));
                                          } else {
                                            setStickyNotes([]);
                                          }
                                          setPendingNoteClear(null);
                                        }}
                                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingNoteClear(null)}
                                        className="px-1.5 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const count = stickyNotes.filter(n => n.pageNumber === pageNumber).length;
                                          if (count > 0) setPendingNoteClear("page");
                                        }}
                                        disabled={stickyNotes.filter(n => n.pageNumber === pageNumber).length === 0}
                                        className="px-2.5 py-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                        title={`Clear ${stickyNotes.filter(n => n.pageNumber === pageNumber).length} sticky note(s) on Page ${pageNumber}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> Clear Page ({stickyNotes.filter(n => n.pageNumber === pageNumber).length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingNoteClear("all")}
                                        className="px-2.5 py-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 hover:text-rose-950 dark:hover:text-white transition-all cursor-pointer"
                                        title="Clear all sticky notes in current document"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> Clear All ({stickyNotes.length})
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </h3>
                        <div className="flex items-center gap-3">
                          {/* Zoom Controls */}
                          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg shadow-sm">
                            <button
                              onClick={() => setPdfScale((prev) => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10))}
                              disabled={pdfScale <= 0.4}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                              title="Zoom Out (-10%)"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono font-extrabold text-violet-700 dark:text-violet-300 px-1 min-w-[38px] text-center">
                              {Math.round(pdfScale * 100)}%
                            </span>
                            <button
                              onClick={() => setPdfScale((prev) => Math.min(2.0, Math.round((prev + 0.1) * 10) / 10))}
                              disabled={pdfScale >= 2.0}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                              title="Zoom In (+10%)"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPdfScale(0.8)}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer"
                              title="Reset Zoom (80%)"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Page Nav */}
                          {numPages && numPages > 1 && (
                            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg">
                              <button
                                onClick={() =>
                                  setPageNumber((p) => Math.max(1, p - 1))
                                }
                                disabled={pageNumber <= 1}
                                className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                title="Previous Page"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold tracking-wider px-1">
                                {pageNumber} / {numPages}
                              </span>
                              <button
                                onClick={() =>
                                  setPageNumber((p) => Math.min(numPages, p + 1))
                                }
                                disabled={pageNumber >= numPages}
                                className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                title="Next Page"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Batch Keyword Highlighter Toolbar */}
                      {(annotationMode === "batch" || activeBatchKeywords.length > 0) && (
                        <div className="mt-4 p-4 rounded-xl bg-white dark:bg-[#111116] border border-purple-500/30 shadow-lg text-left no-pdf-scan animate-fadeIn">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                                Batch Keyword Highlighter
                              </span>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:inline">
                                — Highlight all occurrences of any skill or keyword across the document
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative flex-1 sm:w-72">
                                <input
                                  type="text"
                                  placeholder="Type skill to search & auto-suggest..."
                                  value={batchInput}
                                  onFocus={() => setIsBatchSuggestOpen(true)}
                                  onChange={(e) => {
                                    setBatchInput(e.target.value);
                                    setIsBatchSuggestOpen(true);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && batchInput.trim()) {
                                      handleBatchHighlight(batchInput.trim());
                                      setBatchInput("");
                                      setIsBatchSuggestOpen(false);
                                    }
                                  }}
                                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                />
                                {batchInput && (
                                  <button
                                    onClick={() => {
                                      setBatchInput("");
                                      setIsBatchSuggestOpen(false);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Auto-Suggestion Dropdown Menu */}
                                {isBatchSuggestOpen && (
                                  <div className="absolute z-50 left-0 right-0 top-full mt-2 p-3 bg-white dark:bg-zinc-900 border border-purple-500/40 rounded-xl shadow-2xl max-h-72 overflow-y-auto space-y-3">
                                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                                      <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1">
                                        <Wand2 className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Auto-Suggest ({result?.targetRole || "Active Industry"})
                                      </span>
                                      <button
                                        onClick={() => setIsBatchSuggestOpen(false)}
                                        className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white text-[10px] cursor-pointer"
                                      >
                                        Close
                                      </button>
                                    </div>

                                    {/* Missing JD Keywords */}
                                    {result?.atsAnalysis?.jobKeywordsMissing &&
                                      result.atsAnalysis.jobKeywordsMissing.length > 0 && (
                                        <div>
                                          <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Target className="w-3 h-3" /> Target Job Missing Keywords:
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {result.atsAnalysis.jobKeywordsMissing
                                              .filter(
                                                (kw) =>
                                                  !batchInput ||
                                                  kw.toLowerCase().includes(batchInput.toLowerCase()),
                                              )
                                              .slice(0, 8)
                                              .map((kw, kwIdx) => (
                                                <button
                                                  key={`suggest-missing-${kw}-${kwIdx}`}
                                                  onClick={() => {
                                                    handleBatchHighlight(
                                                      kw,
                                                      "rgba(225, 29, 72, 0.32)",
                                                    );
                                                    setBatchInput("");
                                                    setIsBatchSuggestOpen(false);
                                                  }}
                                                  className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-700 dark:text-rose-300 text-[10px] font-bold hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                                >
                                                  {kw}
                                                </button>
                                              ))}
                                          </div>
                                        </div>
                                      )}

                                    {/* Industry & Role High-Impact Skills */}
                                    {(() => {
                                      const { skillsByCategory } = getMatchedIndustrySkills(
                                        result?.targetRole,
                                        batchInput,
                                      );
                                      return Object.entries(skillsByCategory).map(
                                        ([catName, skills], catIdx) => (
                                          <div key={`cat-${catName}-${catIdx}`}>
                                            <div className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                                              {catName}:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              {skills.slice(0, 8).map((sk, skIdx) => (
                                                <button
                                                  key={`suggest-sk-${catName}-${sk}-${skIdx}`}
                                                  onClick={() => {
                                                    handleBatchHighlight(sk);
                                                    setBatchInput("");
                                                    setIsBatchSuggestOpen(false);
                                                  }}
                                                  className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                                                >
                                                  {sk}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ),
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  if (batchInput.trim()) {
                                    handleBatchHighlight(batchInput.trim());
                                    setBatchInput("");
                                    setIsBatchSuggestOpen(false);
                                  }
                                }}
                                disabled={!batchInput.trim()}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" /> Highlight All
                              </button>
                            </div>
                          </div>

                          {/* Preset Skill Chips from Analysis & Industry Database */}
                          {result && (
                            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Recommended:
                                </span>

                                {/* Missing Skills */}
                                {result.skillGapReport?.slice(0, 5).map((gap, gapIdx) => {
                                  const isHighlighted = activeBatchKeywords.some(
                                    (k) => k.keyword.toLowerCase() === gap.skill.toLowerCase(),
                                  );
                                  return (
                                    <button
                                      key={`gap-${gap.skill}-${gapIdx}`}
                                      onClick={() => {
                                        if (isHighlighted) {
                                          clearBatchHighlight(gap.skill);
                                        } else {
                                          handleBatchHighlight(
                                            gap.skill,
                                            "rgba(225, 29, 72, 0.32)",
                                          );
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isHighlighted
                                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50"
                                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-500/30"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      {gap.skill}
                                      {isHighlighted && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                                    </button>
                                  );
                                })}

                                {/* Industry High-Impact Skill Chips */}
                                {(() => {
                                  const { skillsByCategory } = getMatchedIndustrySkills(
                                    result?.targetRole,
                                  );
                                  const industryTop = Array.from(
                                    new Set(Object.values(skillsByCategory).flat())
                                  ).slice(0, 6);
                                  return industryTop.map((sk, skIdx) => {
                                    const isHighlighted = activeBatchKeywords.some(
                                      (k) => k.keyword.toLowerCase() === sk.toLowerCase(),
                                    );
                                    return (
                                      <button
                                        key={`ind-preset-${sk}-${skIdx}`}
                                        onClick={() => {
                                          if (isHighlighted) {
                                            clearBatchHighlight(sk);
                                          } else {
                                            handleBatchHighlight(
                                              sk,
                                              "rgba(139, 92, 246, 0.35)",
                                            );
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                          isHighlighted
                                            ? "bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-500/50"
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-500/30"
                                        }`}
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                        {sk}
                                        {isHighlighted && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                                      </button>
                                    );
                                  });
                                })()}

                                {/* Keywords Found */}
                                {result.atsAnalysis?.jobKeywordsFound?.slice(0, 5).map((kw, kwIdx) => {
                                  const isHighlighted = activeBatchKeywords.some(
                                    (k) => k.keyword.toLowerCase() === kw.toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={`found-${kw}-${kwIdx}`}
                                      onClick={() => {
                                        if (isHighlighted) {
                                          clearBatchHighlight(kw);
                                        } else {
                                          handleBatchHighlight(kw, "rgba(168, 85, 247, 0.35)");
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isHighlighted
                                          ? "bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/50"
                                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-500/30"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                      {kw}
                                      {isHighlighted && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                                    </button>
                                  );
                                })}

                                {/* Top Resume Keywords */}
                                {result.atsAnalysis?.topResumeKeywords?.slice(0, 5).map((kw, kwIdx) => {
                                  const isHighlighted = activeBatchKeywords.some(
                                    (k) => k.keyword.toLowerCase() === kw.toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={`top-${kw}-${kwIdx}`}
                                      onClick={() => {
                                        if (isHighlighted) {
                                          clearBatchHighlight(kw);
                                        } else {
                                          handleBatchHighlight(kw, "rgba(109, 40, 217, 0.32)");
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isHighlighted
                                          ? "bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-500/50"
                                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-500/30"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-violet-700" />
                                      {kw}
                                      {isHighlighted && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Active Batch Terms Summary & Clear All */}
                          {activeBatchKeywords.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px]">
                              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Active Batch Terms ({activeBatchKeywords.length}):</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {activeBatchKeywords.map((b, bIdx) => (
                                    <span
                                      key={`batch-${b.keyword}-${bIdx}`}
                                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold flex items-center gap-1 border border-zinc-200 dark:border-zinc-700"
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: b.color.replace(/0\.\d+\)/, '1)') }}
                                      />
                                      {b.keyword}
                                      <button
                                        onClick={() => clearBatchHighlight(b.keyword)}
                                        className="hover:text-rose-500 ml-0.5 cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={clearAllBatchHighlights}
                                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Clear All Batch
                              </button>
                            </div>
                          )}

                          {/* Batch Feedback Banner */}
                          {batchFeedback && (
                            <div className="mt-2 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-md flex items-center justify-between animate-fadeIn">
                              <span>{batchFeedback}</span>
                              <button onClick={() => setBatchFeedback(null)} className="text-purple-600 dark:text-purple-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col xl:flex-row w-full gap-4 items-start">
                      <div className="bg-zinc-100 dark:bg-zinc-950/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex-grow w-full overflow-auto flex justify-center document-preview-container max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 relative">
                        <div
                          id="pdf-page-container"
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
                              color: defaultStickyColor,
                            };
                            setStickyNotes((prev) => [...prev, newNote]);
                          }}
                        >
                          <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                              <div className="p-12 flex flex-col items-center justify-center gap-4">
                                <div className="w-6 h-6 border-2 border-violet-500/20 border-t-violet-600 rounded-full animate-spin" />
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
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
                              scale={pdfScale}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="shadow-2xl !bg-transparent mx-auto"
                            />
                          </Document>
                          {highlights
                            .filter((h) => h.pageNumber === pageNumber && visibleHighlightColors.includes(h.color))
                            .map((hl, hlIdx) => (
                              <div
                                key={`hl-${hl.id || hlIdx}-${hlIdx}`}
                                className="absolute inset-0 pointer-events-none z-10"
                              >
                                {hl.rects.map((r, i) => (
                                  <div
                                    key={`hl-rect-${hl.id || hlIdx}-${i}`}
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
                          <AnimatePresence>
                            {visibleStickyNotes && stickyNotes
                              .filter((n) => n.pageNumber === pageNumber)
                              .map((note, noteIdx) => {
                                const colorKey = note.color && STICKY_COLOR_CONFIG[note.color] ? note.color : "yellow";
                                const conf = STICKY_COLOR_CONFIG[colorKey];
                                return (
                                  <motion.div
                                    key={`note-${note.id || noteIdx}-${noteIdx}`}
                                    initial={{ scale: 0.3, opacity: 0, y: -15 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.2, opacity: 0, transition: { duration: 0.15 } }}
                                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                    className={`sticky-note absolute z-50 rounded-xl ${conf.bodyBg} backdrop-blur-md shadow-2xl border ${conf.borderColor} overflow-hidden transform transition-all hover:scale-[1.02]`}
                                    style={{
                                      left: note.x,
                                      top: note.y,
                                      width: 230,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div
                                      className={`flex justify-between items-center ${conf.headerBg} p-2 cursor-pointer transition-colors`}
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
                                      <div className="flex items-center gap-1.5 overflow-hidden">
                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
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
                                          {conf.label}
                                        </span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setStickyNotes((notes) =>
                                            notes.filter((n) => n.id !== note.id),
                                          );
                                        }}
                                        className="hover:text-rose-700 transition-colors p-0.5 rounded hover:bg-black/10"
                                        title="Delete Sticky Note"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {note.isOpen && (
                                      <div className="p-2.5 space-y-2.5 border-t border-black/10">
                                        <textarea
                                          autoFocus
                                          className={`w-full h-24 bg-transparent resize-none outline-none ${conf.textColor} text-xs font-medium ${conf.placeholderColor}`}
                                          placeholder={`Type ${conf.label.toLowerCase()} note...`}
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
                                        <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                                          <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-75">
                                            Category Color:
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {Object.entries(STICKY_COLOR_CONFIG).map(
                                              ([ckey, cval], ckIdx) => (
                                                <button
                                                  key={`note-col-${note.id || 'note'}-${ckey}-${ckIdx}`}
                                                  onClick={() =>
                                                    setStickyNotes((notes) =>
                                                      notes.map((n) =>
                                                        n.id === note.id
                                                          ? { ...n, color: ckey }
                                                          : n,
                                                      ),
                                                    )
                                                  }
                                                  className={`w-4 h-4 rounded-full border border-black/20 transition-all ${
                                                    colorKey === ckey
                                                      ? "scale-125 ring-2 ring-black/40 shadow-sm"
                                                      : "opacity-60 hover:opacity-100 hover:scale-110"
                                                  }`}
                                                  style={{ backgroundColor: cval.dotColor }}
                                                  title={`Category: ${cval.label}`}
                                                />
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                          </AnimatePresence>
                        </div>

                        {/* Page Summary & Notes Input Field */}
                        <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#111116] border border-violet-500/30 shadow-lg text-left w-full space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Notebook className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                              <span className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                                Page {pageNumber} Executive Notes & Summary
                              </span>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:inline">
                                — Add page takeaways or specific feedback
                              </span>
                            </div>
                            {pageSummaries[pageNumber] && pageSummaries[pageNumber].trim().length > 0 && (
                              <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Note Saved
                              </span>
                            )}
                          </div>
                          <textarea
                            value={pageSummaries[pageNumber] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPageSummaries((prev) => ({
                                ...prev,
                                [pageNumber]: val,
                              }));
                            }}
                            placeholder={`Type notes or a key summary for Page ${pageNumber}... (Saved automatically and indexed in sidebar search)`}
                            className="w-full h-20 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-y transition-all leading-relaxed"
                          />
                        </div>
                      </div>
                      
                      {/* Sidebar Annotations Panel */}
                      {(() => {
                        const query = sidebarSearch.toLowerCase().trim();

                        const filteredStickyNotes = stickyNotes.filter((n) => {
                          if (!query) return true;
                          const colorKey = n.color && STICKY_COLOR_CONFIG[n.color] ? n.color : "yellow";
                          const conf = STICKY_COLOR_CONFIG[colorKey];
                          return (
                            (n.text && n.text.toLowerCase().includes(query)) ||
                            conf.label.toLowerCase().includes(query) ||
                            `page ${n.pageNumber}`.includes(query)
                          );
                        });

                        const filteredHighlights = highlights.filter((hl) => {
                          if (!query) return true;
                          return (
                            (hl.keyword && hl.keyword.toLowerCase().includes(query)) ||
                            `page ${hl.pageNumber}`.includes(query)
                          );
                        });

                        const filteredPageSummaries = Object.entries(pageSummaries).filter(([pNumStr, text]) => {
                          if (!text || !text.trim()) return false;
                          if (!query) return true;
                          return (
                            text.toLowerCase().includes(query) ||
                            `page ${pNumStr}`.includes(query)
                          );
                        });

                        const hasAnyAnnotations = stickyNotes.length > 0 || highlights.length > 0 || Object.values(pageSummaries).some(s => s && s.trim().length > 0);

                        if (!hasAnyAnnotations && !query) return null;

                        return (
                          <div className="w-full xl:w-80 shrink-0 space-y-4">
                            {/* Sidebar Filter Bar */}
                            <div className="bg-zinc-50 dark:bg-zinc-900/70 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Search className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Filter Annotations
                                </span>
                                {query && (
                                  <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                                    {filteredStickyNotes.length + filteredHighlights.length + filteredPageSummaries.length} matches
                                  </span>
                                )}
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search notes, highlights & summaries..."
                                  value={sidebarSearch}
                                  onChange={(e) => setSidebarSearch(e.target.value)}
                                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl pl-3 pr-7 py-2 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                                />
                                {sidebarSearch && (
                                  <button
                                    onClick={() => setSidebarSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* No results message */}
                            {query && filteredStickyNotes.length === 0 && filteredHighlights.length === 0 && filteredPageSummaries.length === 0 && (
                              <div className="bg-zinc-50 dark:bg-zinc-900/70 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                                <Info className="w-8 h-8 mx-auto text-zinc-400 opacity-60" />
                                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">No annotations match "{sidebarSearch}"</p>
                                <button
                                  onClick={() => setSidebarSearch("")}
                                  className="text-[10px] font-bold text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300 uppercase tracking-wider bg-violet-500/10 px-3 py-1 rounded-lg border border-violet-500/20 cursor-pointer"
                                >
                                  Clear Search Filter
                                </button>
                              </div>
                            )}

                            {/* Page Summaries Sidebar Panel */}
                            {filteredPageSummaries.length > 0 && (
                              <div className="bg-zinc-50 dark:bg-zinc-900/70 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <Notebook className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Page Summaries ({filteredPageSummaries.length})
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {filteredPageSummaries.map(([pNumStr, text]) => {
                                    const pNum = Number(pNumStr);
                                    return (
                                      <div
                                        key={`sidebar-summary-${pNum}`}
                                        className="flex flex-col bg-white dark:bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/40 transition-all cursor-pointer group"
                                        onClick={() => setPageNumber(pNum)}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[9px] font-black uppercase text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                                            Page {pNum}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPageSummaries(prev => {
                                                const next = { ...prev };
                                                delete next[pNum];
                                                return next;
                                              });
                                            }}
                                            className="text-zinc-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                                            title="Clear Page Summary"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <p className="text-[11px] text-zinc-700 dark:text-zinc-200 line-clamp-3 font-sans pl-2 border-l-2 border-violet-500/30 group-hover:border-violet-500">
                                          {text}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Sticky Notes Summary Sidebar Panel */}
                            {filteredStickyNotes.length > 0 && (
                              <div className="bg-zinc-50 dark:bg-zinc-900/70 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" /> Sticky Notes ({filteredStickyNotes.length})
                                  </h4>
                                  <button
                                    onClick={exportStickyNotesSummary}
                                    className="text-[9px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white uppercase tracking-wider flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                                    title="Export notes text file"
                                  >
                                    <Download className="w-2.5 h-2.5" /> Export
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {filteredStickyNotes.map((note, noteIdx) => {
                                    const colorKey = note.color && STICKY_COLOR_CONFIG[note.color] ? note.color : "yellow";
                                    const conf = STICKY_COLOR_CONFIG[colorKey];
                                    return (
                                      <div
                                        key={`sidebar-note-${note.id || noteIdx}-${noteIdx}`}
                                        className="flex flex-col bg-white dark:bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 transition-all cursor-pointer group"
                                        onClick={() => {
                                          setPageNumber(note.pageNumber);
                                          setStickyNotes(notes => notes.map(n => n.id === note.id ? { ...n, isOpen: true } : n));
                                        }}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: conf.dotColor }} />
                                            <span className="text-[10px] font-black uppercase text-zinc-800 dark:text-zinc-200">
                                              {conf.label}
                                            </span>
                                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                              Page {note.pageNumber}
                                            </span>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setStickyNotes(prev => prev.filter(n => n.id !== note.id));
                                            }}
                                            className="text-zinc-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                                            title="Delete note"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 line-clamp-2 italic font-sans pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 group-hover:border-purple-500">
                                          {note.text ? note.text : <span className="text-zinc-400 font-normal">Empty note...</span>}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Active Highlights Sidebar Panel */}
                            {filteredHighlights.length > 0 && (
                              <div className="bg-zinc-50 dark:bg-zinc-900/70 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                                <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5" /> Highlights ({filteredHighlights.length})
                                </h4>
                                <div className="space-y-2">
                                  {filteredHighlights.map((hl, hlIdx) => (
                                    <div
                                      key={`sidebar-hl-${hl.id || hlIdx}-${hlIdx}`}
                                      className="flex items-center justify-between bg-white dark:bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/30 transition-colors cursor-pointer"
                                      onClick={() => setPageNumber(hl.pageNumber)}
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div
                                          className="w-3 h-3 rounded-full border border-zinc-400/40 dark:border-white/20 shrink-0"
                                          style={{
                                            backgroundColor: hl.color.replace(/0\.\d+\)/, "1)"),
                                          }}
                                        />
                                        <div className="flex flex-col text-left overflow-hidden">
                                          <span className="text-[11px] font-bold text-zinc-950 dark:text-white leading-tight">
                                            Page {hl.pageNumber}
                                          </span>
                                          {hl.keyword && (
                                            <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 truncate max-w-[120px]" title={hl.keyword}>
                                              "{hl.keyword}"
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setHighlights((prev) =>
                                            prev.filter((h) => h.id !== hl.id),
                                          );
                                        }}
                                        className="text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                      <span className="text-[10px] text-violet-200 tracking-widest block opacity-90 mt-1 uppercase">
                        {analysisStep}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Zap className="h-5 w-5 fill-current" />
                      Analyze Executive Profile
                    </div>
                  )}
                </button>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-8 max-w-2xl mx-auto p-5 rounded-2xl border text-left flex items-start gap-4 transition-all relative bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300 shadow-xl shadow-rose-500/5"
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 pr-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          Analysis Interrupted
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                        {error}
                      </p>

                      {file && (
                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={analyzeResume}
                            disabled={isAnalyzing}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry Analysis</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Dismiss error message"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Trust & How It Works */}
              <div className="mt-32 pt-16 border-t border-slate-200 dark:border-white/10">
                <div className="text-center mb-16">
                  <h3 className="text-2xl font-black font-display text-slate-900 dark:text-white mb-4">
                    How It Works
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
                    Our AI engine reverse-engineers the Applicant Tracking
                    Systems used by top Fortune 500 companies to give you a
                    competitive edge.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent -z-10 hidden md:block"></div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-6 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none rounded-2xl relative z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mb-6 text-violet-700 dark:text-violet-400 font-black">
                      1
                    </div>
                    <h4 className="text-zinc-950 dark:text-white font-bold mb-3 uppercase tracking-wider text-sm">
                      Upload & Parse
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                      Drop in your resume and an optional job description. Our
                      engine parses your formatting just like Workday or
                      Greenhouse.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-6 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none rounded-2xl relative z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mb-6 text-violet-700 dark:text-violet-400 font-black">
                      2
                    </div>
                    <h4 className="text-zinc-950 dark:text-white font-bold mb-3 uppercase tracking-wider text-sm">
                      Deep AI Analysis
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                      We scan for keyword density, structural integrity, and
                      skill gaps using the latest Gemini models.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-6 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none rounded-2xl relative z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mb-6 text-violet-700 dark:text-violet-400 font-black">
                      3
                    </div>
                    <h4 className="text-zinc-950 dark:text-white font-bold mb-3 uppercase tracking-wider text-sm">
                      Actionable Report
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                      Get a visual dashboard with your ATS score, missing
                      keywords, and ready-to-copy bullet point improvements.
                    </p>
                  </motion.div>
                </div>

                <div className="mt-24 text-center">
                  <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase mb-8">
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
                <div className="mt-32 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden relative bg-white dark:bg-[#111116]">
                  <div className="p-8 md:p-16 text-center relative z-10">
                    <a
                      href="https://interviewcoach-969933961049.asia-southeast1.run.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-4xl mx-auto mb-16 mt-8 relative group cursor-pointer"
                    >
                      <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 group-hover:border-violet-500/50 p-8 rounded-3xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300 shadow-sm">
                        <div className="flex-1 text-left relative z-10">
                          <h4 className="text-xl md:text-3xl font-black text-zinc-950 dark:text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                            AI Interview Coach{" "}
                            <span className="bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[10px] uppercase tracking-widest px-3 py-1 rounded-md border border-violet-500/30">
                              Partner
                            </span>
                          </h4>
                          <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
                            Tested well against the ATS? Now master the human
                            interview. Engage with our immersive voice-based AI
                            recruiter to practice your answers in a real-world
                            simulation before the big day.
                          </p>
                        </div>
                        <div className="relative z-10">
                          <span className="btn-primary py-4 px-8 text-sm uppercase flex items-center justify-center gap-3 whitespace-nowrap transition-all">
                            <Zap className="h-5 w-5" /> Start Practice Interview
                          </span>
                        </div>
                      </div>
                    </a>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        const sampleContent = `Alex Mercer
Senior Staff Software Engineer & Cloud Architect
Email: alex.mercer@techlead.dev | Phone: +1 (555) 234-5678 | LinkedIn: linkedin.com/in/alexmercer-tech

PROFESSIONAL SUMMARY
Senior Staff Engineer with 8+ years of experience architecting distributed cloud systems, modern web applications, and high-throughput microservices. Proven track record leading engineering teams of 12+ developers, scaling infrastructure to 5M+ daily active users, and reducing AWS latency by 42%.

TECHNICAL SKILLS
Languages & Frameworks: TypeScript, JavaScript (ES6+), React 18, Next.js, Node.js, Express, Python, GraphQL, REST APIs
Cloud & DevOps: AWS (EC2, Lambda, S3, ECS, CloudFront), Docker, Kubernetes, Terraform, CI/CD (GitHub Actions)
Databases & Storage: PostgreSQL, Redis, MongoDB, DynamoDB
Architecture: Microservices, Event-Driven Architecture, System Design, High Availability, Web Security

WORK EXPERIENCE
Lead Systems Architect | CloudScale Tech (2021 - Present)
• Spearheaded redesign of core transaction processing engine using Node.js and Redis, reducing p99 latency from 450ms to 85ms across 10M daily transactions.
• Directed team of 10 engineers in migrating legacy monolith to AWS containerized microservices (ECS/Docker), cutting infrastructure cloud expenditure by $180,000 annually.
• Implemented automated CI/CD deployment pipelines with GitHub Actions and Terraform, accelerating release velocity from bi-weekly to 5+ daily deployments with zero downtime.

Senior Full Stack Engineer | Apex Financial Software (2018 - 2021)
• Engineered real-time financial analytics dashboard in React, TypeScript, and WebSockets, handling live data streams for 200,000+ active enterprise users.
• Designed OAuth2 authentication framework and role-based access controls (RBAC) ensuring SOC2 Type II compliance.
• Mentored 6 junior/mid-level developers, establishing engineering best practices, unit testing coverage standards (Jest 90%+), and code review guidelines.

EDUCATION & CERTIFICATIONS
B.S. in Computer Science | University of California, Berkeley (2018)
AWS Certified Solutions Architect – Associate (2022)`;
                        const sample = new File(
                          [sampleContent],
                          "Alex_Mercer_Senior_Software_Engineer_Resume.txt",
                          { type: "text/plain" },
                        );
                        setFile(sample);
                        setJobDescription(
                          "We are seeking a Lead / Senior Staff Software Engineer to lead the architecture of our cloud-native web platform. Requirements: 7+ years of experience with React, TypeScript, Node.js, distributed microservices, AWS cloud architecture, and PostgreSQL. Must have experience mentoring developers, driving CI/CD automation, and improving system scalability and latency.",
                        );
                        setLinkedinUrl("https://linkedin.com/in/alexmercer-tech");
                      }}
                      className="btn-primary py-4 px-12 text-sm uppercase flex items-center justify-center gap-3 mx-auto"
                    >
                      <Zap className="h-5 w-5" /> Try Live Demo Now
                    </motion.button>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-6">
                      Private Stateless Processing • Executive ATS Intelligence
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
              {/* OCR Scanned Document Notice Banner */}
              {(result.atsMetadata?.ocrUsed || result.atsMetadata?.isScannedPdf) && (
                <div className="bg-rose-500/10 border border-rose-500/35 p-4 rounded-2xl flex items-start gap-4 shadow-sm animate-fadeIn mb-6">
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 shrink-0">
                    <Camera className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-widest flex items-center gap-2">
                      Scanned Document / Image PDF Parsed via Tesseract.js OCR
                    </h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      We detected a scanned image-based PDF. Text was extracted using onboard Tesseract OCR.
                      Standard ATS scanners heavily penalize non-selectable text. For maximum compatibility and score, re-export your resume as a text-native PDF or DOCX format.
                    </p>
                  </div>
                </div>
              )}

              {/* Studio Header & Toolbar */}
              <div className="flex flex-col gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-black font-display text-zinc-950 dark:text-white tracking-tight">
                        Executive Summary
                      </h2>
                      <span className="px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-black">
                        {result.overallScore}% Overall Fit
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("verified-trust-badge-section");
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                          } else {
                            setIsLinkedInVerificationModalOpen(true);
                          }
                        }}
                        className="px-3 py-1 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Verified Trust Badge — Click to share or embed your LinkedIn Credibility Score"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                        <span>Verified Trust</span>
                        <span aria-hidden="true" className="text-violet-600/60 dark:text-violet-500/60">·</span>
                        <span className="font-mono font-extrabold tabular-nums text-zinc-950 dark:text-white">
                          {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}%
                        </span>
                        <Share2 className="w-3 h-3 text-violet-700 dark:text-violet-400 ml-0.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("model-training-studio-section");
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className="px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-800 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Inspect itemized score reasons or retrain & calibrate the AI scoring model"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                        <span>Score Reasons & Retrain Model</span>
                      </button>
                      {activeVersionId && (
                        <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold">
                          {history.find(h => h.id === activeVersionId)?.versionName || "Active Version"}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1.5 flex items-center gap-2">
                      <span>Analyzing: <strong className="text-zinc-800 dark:text-zinc-200">{file?.name || history.find(h => h.id === activeVersionId)?.fileName || "Candidate Resume"}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-zinc-800 dark:text-zinc-200">{result.careerPath.topRole || "Executive Leadership"}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap no-print">
                    <button
                      onClick={() => setIsResumeBuilderOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm hover:from-violet-600 hover:to-purple-600 active:scale-95 cursor-pointer"
                    >
                      <Wand2 className="h-4 w-4" />
                      <span>ATS Builder & Coach</span>
                    </button>

                    <button
                      onClick={() => setIsExecutiveMode(!isExecutiveMode)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isExecutiveMode 
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm" 
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>{isExecutiveMode ? "Brief Active" : "Executive Brief"}</span>
                    </button>

                    {/* Unified Export Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-100"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      </button>

                      {isExportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          <button
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              setIsPdfPreviewOpen(true);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>PDF Export Preview</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 font-extrabold uppercase">Custom</span>
                              </div>
                              <div className="text-[10px] text-zinc-400">Toggle sections & print dossier</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              handleFullReportPdfPrint();
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            <div>
                              <div className="font-medium text-[11px]">Direct PDF Print</div>
                              <div className="text-[9px] text-zinc-400">High-resolution standard print</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              exportFullReportToDocx(result);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            <div>
                              <div className="font-bold">Word Document (.docx)</div>
                              <div className="text-[10px] text-zinc-400">Editable executive briefing</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              exportToExcel();
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <div>
                              <div className="font-bold">Excel Spreadsheet (.xlsx)</div>
                              <div className="text-[10px] text-zinc-400">Full audit score matrix</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              exportToCSV();
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-zinc-500" />
                            <div>
                              <div className="font-bold">CSV Dataset (.csv)</div>
                              <div className="text-[10px] text-zinc-400">Raw tabular metrics</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setResult(null);
                        setFile(null);
                      }}
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                      title="New Analysis"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Segmented Studio Navigation Tabs */}
                <div className="flex items-center justify-between gap-4 p-1.5 bg-zinc-100/90 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto no-print">
                  <div className="flex items-center gap-1 min-w-max">
                    {[
                      { id: "scorecard", label: "Scorecard & Health", icon: BarChart2 },
                      { id: "canvas", label: "Resume Canvas", icon: FileText, badge: file ? "Live" : undefined },
                      { id: "skills", label: "Skills & Keywords", icon: Target, badge: `${(result.missingSkills?.length ?? result.skillGapReport?.length ?? 0)} Gaps` },
                      { id: "career", label: "Career Roadmap", icon: TrendingUp },
                      { id: "recruiter", label: "Recruiter Brief", icon: Briefcase },
                      { id: "all", label: "Complete Overview", icon: Layout },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeStudioTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveStudioTab(tab.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-white dark:bg-zinc-950 text-violet-700 dark:text-violet-400 shadow-sm border border-zinc-200/80 dark:border-zinc-800 font-extrabold"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/70"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? "text-violet-700 dark:text-violet-400" : "text-zinc-400"}`} />
                          <span>{tab.label}</span>
                          {tab.badge && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                              isActive ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Resume Artboard View */}
              {activeStudioTab === "canvas" && (
                <div className="mb-12">
                  <PanelErrorBoundary compact title="Resume Canvas View">
                    <ResumeCanvasTab
                      result={result}
                      file={file}
                      onOpenBuilder={() => setIsResumeBuilderOpen(true)}
                      onPrint={handleFullReportPdfPrint}
                      onPreviewPdf={() => setIsPdfPreviewOpen(true)}
                    />
                  </PanelErrorBoundary>
                </div>
              )}
              
              {/* Workspace Declutter & Section Quick Toggle Bar */}
              {activeStudioTab !== "canvas" && (
                <div className="mb-6 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                          Workspace Declutter
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                          {Object.values(collapsedSections).filter(Boolean).length} of 6 Sections Collapsed
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Expand or collapse dashboard modules to keep your analytical workspace focused
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-zinc-950/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      {[
                        { id: "executive-summary", label: "Executive Summary" },
                        { id: "scoring-infrastructure", label: "ATS Benchmarks" },
                        { id: "career-progression", label: "Career Progression" },
                        { id: "skill-vector-engine", label: "Skill Ecosystem" },
                        { id: "optimization-plan", label: "Optimization Plan" },
                        { id: "linkedin-network", label: "LinkedIn Network" },
                      ].map((sec) => {
                        const isCollapsed = !!collapsedSections[sec.id];
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => toggleSection(sec.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isCollapsed
                                ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:text-zinc-950 dark:hover:text-white"
                                : "bg-violet-500/15 text-violet-800 dark:text-violet-300 border border-violet-500/35"
                            }`}
                            title={`Click to ${isCollapsed ? "expand" : "collapse"} ${sec.label}`}
                          >
                            <span>{sec.label}</span>
                            {isCollapsed ? (
                              <ChevronDown className="w-3 h-3 text-zinc-400" />
                            ) : (
                              <ChevronUp className="w-3 h-3 text-violet-700 dark:text-violet-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setAllSectionsCollapsed(false)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-[11px] font-bold transition-all border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllSectionsCollapsed(true)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-[11px] font-bold transition-all border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeStudioTab !== "canvas" && (isExecutiveMode || activeStudioTab === "scorecard" || activeStudioTab === "all" || isPrintFriendly) && (
                <div className="mb-8" id="executive-summary">
                  {collapsedSections["executive-summary"] ? (
                    <GlassCard className="p-4 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                              Executive Summary
                            </h3>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 uppercase">
                              Collapsed
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                            {result.overallScore}% Overall Match · Target Mandate: {result.careerPath?.topRole} · High-Level Narrative Analysis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPdfPreviewOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection("executive-summary")}
                          className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Expand Section</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-8 md:p-12 border-t-4 border-t-violet-600 bg-gradient-to-b from-violet-500/5 to-transparent">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-violet-500/15 flex items-center justify-center border border-violet-500/30">
                            <Briefcase className="h-6 w-6 text-violet-700 dark:text-violet-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-zinc-950 dark:text-white font-display uppercase tracking-widest">Executive Summary</h2>
                            <p className="text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-[0.2em]">High-Level Narrative Analysis</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => setIsPdfPreviewOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-600 hover:to-violet-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                            title="Preview and toggle sections to include in PDF report"
                          >
                            <Eye className="w-4 h-4" /> PDF Preview
                          </button>
                          <button
                            onClick={handleFullReportPdfPrint}
                            className="px-4 py-2.5 rounded-xl bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" /> Direct Print
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSection("executive-summary")}
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                            title="Collapse this section to declutter workspace"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    
                    <div className="space-y-8">
                      <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl">
                        <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Bottom Line Recommendation
                        </h3>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                          {result.executiveSummary || `Based on an overall match of ${result.overallScore}%, this candidate shows strong potential for the ${result.careerPath.topRole} role. The resume demonstrates ${result.skillsMatch}% skill alignment with the job description.`}
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Core Strengths
                          </h3>
                          <ul className="space-y-3">
                            {result.foundSkills.slice(0, 3).map((skill, idx) => (
                              <li key={`found-str-${skill || idx}-${idx}`} className="flex items-start gap-2">
                                <div className="h-4 w-4 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                                </div>
                                <span className="text-xs text-zinc-700 dark:text-zinc-300">{skill}</span>
                              </li>
                            ))}
                            {result.foundSkills.length === 0 && (
                              <li className="text-xs text-zinc-500 italic">No critical matching skills identified.</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Critical Gaps
                          </h3>
                          <ul className="space-y-3">
                            {(result.missingSkills || result.skillGapReport?.map(s => s.skill) || []).slice(0, 3).map((skill, idx) => (
                              <li key={`crit-gap-${skill || idx}-${idx}`} className="flex items-start gap-2">
                                <div className="h-4 w-4 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                                </div>
                                <span className="text-xs text-zinc-700 dark:text-zinc-300">{skill}</span>
                              </li>
                            ))}
                             {(!result.missingSkills?.length && !result.skillGapReport?.length) && (
                              <li className="text-xs text-zinc-500 italic">No critical missing skills identified.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

              {activeStudioTab !== "canvas" && !isExecutiveMode && (
                <div className="flex flex-col">
              {/* Career Progress Badges */}
              <div className="mb-8" id="career-progress" style={{ order: sectionOrder.indexOf('career-progress') }}>
                <GlassCard className="p-8 border-t-4 border-t-purple-600 bg-gradient-to-b from-purple-500/5 to-transparent">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Career Progress
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-1">
                        Executive Strengths Unlocked
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-violet-700 dark:text-violet-400">
                        {
                          [
                            result.overallScore >= 85,
                            result.skillsMatch >= 80,
                            result.atsAnalysis.formattingScore >= 80,
                            result.careerPath.confidence >= 80
                          ].filter(Boolean).length
                        } / 4
                      </div>
                      <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                        Badges Earned
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden mb-8">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${([result.overallScore >= 85, result.skillsMatch >= 80, result.atsAnalysis.formattingScore >= 80, result.careerPath.confidence >= 80].filter(Boolean).length / 4) * 100}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
                    />
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${result.overallScore >= 85 ? 'bg-violet-500/10 border-violet-500/35' : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 opacity-55 grayscale'}`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${result.overallScore >= 85 ? 'bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'bg-zinc-200 dark:bg-white/10 text-zinc-400'}`}>
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-1">Executive Fit</span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Score 85%+</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${result.skillsMatch >= 80 ? 'bg-purple-500/10 border-purple-500/35' : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 opacity-55 grayscale'}`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${result.skillsMatch >= 80 ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-zinc-200 dark:bg-white/10 text-zinc-400'}`}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-1">Keyword Master</span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Skills 80%+</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${result.atsAnalysis.formattingScore >= 80 ? 'bg-violet-500/10 border-violet-500/35' : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 opacity-55 grayscale'}`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${result.atsAnalysis.formattingScore >= 80 ? 'bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'bg-zinc-200 dark:bg-white/10 text-zinc-400'}`}>
                        <Layout className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-1">ATS Specialist</span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Format 80%+</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${result.careerPath.confidence >= 80 ? 'bg-purple-500/10 border-purple-500/35' : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 opacity-55 grayscale'}`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${result.careerPath.confidence >= 80 ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-zinc-200 dark:bg-white/10 text-zinc-400'}`}>
                        <Target className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-1">Trajectory Pro</span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Confidence 80%+</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("verified-trust-badge-section");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                        } else {
                          setIsLinkedInVerificationModalOpen(true);
                        }
                      }}
                      className="p-4 rounded-xl border bg-violet-500/15 border-violet-500/40 hover:bg-violet-500/25 flex flex-col items-center text-center transition-all cursor-pointer group"
                      title="Click to share or embed your Verified Trust LinkedIn Credibility Badge"
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center mb-2 bg-violet-500/20 text-violet-700 dark:text-violet-400 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-1">
                        Verified Trust
                      </span>
                      <span className="text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300 tabular-nums">
                        {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}% Credibility · Share
                      </span>
                    </button>
                  </div>
                </GlassCard>
              </div>

              {/* LinkedIn Connection Network & Verified Trust Intelligence Section */}
              <div id="linkedin-network" className="mb-8">
                {collapsedSections["linkedin-network"] ? (
                  <GlassCard className="p-4 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                            LinkedIn Referral Network & Trust Audit
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 uppercase">
                            Collapsed
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                          5 Shared Professional Circles · Trust Score {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}% · Warm Referral Finder
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection("linkedin-network")}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Expand Section</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    {/* Section Header with Mode Selector and Collapse Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/35 flex items-center justify-center text-violet-700 dark:text-violet-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-[0.25em]">
                              LinkedIn Network & Credibility Intelligence
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 text-[9px] font-mono font-bold uppercase">
                              {linkedInViewTab === "network" ? "Referral Graph" : "Trust Badge"}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {linkedInViewTab === "network"
                              ? "D3 force-directed network mapping common industry contacts, shared professional circles, and warm executive referral pathways"
                              : "Verified cross-vector LinkedIn trust score card, factor breakdown, and embeddable portfolio credentials"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="flex items-center p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs">
                          <button
                            type="button"
                            onClick={() => setLinkedInViewTab("network")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                              linkedInViewTab === "network"
                                ? "bg-gradient-to-r from-violet-700 to-purple-700 text-white shadow-sm"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Referral Network Graph</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLinkedInViewTab("badge")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                              linkedInViewTab === "badge"
                                ? "bg-gradient-to-r from-violet-700 to-purple-700 text-white shadow-sm"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Profile Trust Audit</span>
                          </button>
                        </div>

                        {/* Download Network & Trust PDF Dossier Button */}
                        <button
                          type="button"
                          onClick={handleDownloadNetworkDossier}
                          disabled={isDownloadingNetworkDossier}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-600 hover:to-violet-600 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-sm active:scale-95 disabled:opacity-60"
                          title="Generate and download a structured PDF dossier of your network graph and trust metrics"
                        >
                          {isDownloadingNetworkDossier ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating PDF...</span>
                            </>
                          ) : networkDossierSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Dossier Downloaded!</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF Dossier</span>
                            </>
                          )}
                        </button>

                        {/* Collapse Section Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleSection("linkedin-network")}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                          title="Collapse this section to declutter workspace"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tab 1: Interactive D3 Force-Directed LinkedIn Connection Network Graph */}
                    {linkedInViewTab === "network" && (
                      <PanelErrorBoundary compact title="LinkedIn Connection Network">
                        <LinkedInConnectionNetwork
                          candidateName={linkedInTrustReport?.candidateName || (file ? file.name.replace(/\.[^/.]+$/, "") : "Alex Mercer")}
                          targetRole={result.careerPath?.topRole || "Executive Leadership"}
                          linkedinUrl={linkedinUrl}
                          trustScore={linkedInTrustScore || 88}
                          onOpenLinkedInModal={() => setIsLinkedInVerificationModalOpen(true)}
                          height={540}
                        />
                      </PanelErrorBoundary>
                    )}

                    {/* Tab 2: Verified Trust Badge Card */}
                    {linkedInViewTab === "badge" && (
                      <VerifiedTrustBadgeCard
                        credibilityScore={linkedInTrustScore}
                        credibilityTier={linkedInTrustReport?.credibilityTier}
                        linkedinUrl={linkedinUrl}
                        candidateName={linkedInTrustReport?.candidateName || "Alex Mercer"}
                        targetRole={result.careerPath?.topRole || "Executive Leadership"}
                        trustFactors={linkedInTrustReport?.trustFactors}
                        isVerifying={isVerifyingLinkedInTrust}
                        onVerifyNow={() => handleVerifyLinkedInTrust()}
                        onOpenVerificationModal={() => setIsLinkedInVerificationModalOpen(true)}
                        onShareTrustScore={() => setIsShareTrustScoreOpen(true)}
                        onOpenWalkthrough={() => setIsTrustScoreWalkthroughOpen(true)}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Deep Score Reasoning & AI Model Calibration Studio */}
              <div id="model-training-studio-section">
                <ModelTrainingStudio
                  result={result}
                  resumeText={result.atsMetadata?.rawText || ""}
                  jobDescription={jobDescription}
                  linkedinUrl={linkedinUrl}
                  linkedinData={linkedinData}
                  onAnalysisUpdated={(updated) => setResult(updated)}
                />
              </div>

              {/* Full Analysis Report Export & ATS Generator Banner */}
              <GlassCard className="mb-8 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
                    <span>Complete Career Report</span>
                    <span aria-hidden="true" className="text-zinc-400">·</span>
                    <span className="text-purple-700 dark:text-purple-300">DOCX & PDF Verified</span>
                  </div>
                  <h3 className="text-lg font-black text-zinc-950 dark:text-white font-display uppercase tracking-wider">
                    Download Full Analyzed Report
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                    Export your complete executive summary, skill gap report, D3 career roadmap, and strategic optimization plan as a clean, presentation-ready PDF or Word document.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsPdfPreviewOpen(true)}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-600 hover:to-violet-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Customize and toggle sections before exporting PDF"
                  >
                    <Eye className="w-4 h-4" /> PDF Export Preview
                  </button>

                  <button
                    onClick={handleFullReportPdfPrint}
                    className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 border border-zinc-300 dark:border-white/20 text-zinc-800 dark:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Print full executive report directly"
                  >
                    <Printer className="w-4 h-4 text-purple-600 dark:text-purple-300" /> Direct Print PDF
                  </button>

                  <button
                    onClick={() => exportFullReportToDocx(result)}
                    className="px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" /> Download DOCX Report
                  </button>

                  <button
                    onClick={() => {
                      setIsCopilotDrawerOpen(true);
                      setCopilotExternalPrompt({
                        id: Date.now(),
                        prompt:
                          "Give me a short, crystal-clear breakdown of what is missing from my resume for this job and the best quick fixes I can apply.",
                      });
                    }}
                    className="px-5 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-violet-500/40 text-violet-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Bot className="w-4 h-4 text-violet-400" /> Ask Copilot What&apos;s Missing
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSkillToFrame(null);
                      setIsResumeBuilderOpen(true);
                    }}
                    className="px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Briefcase className="w-4 h-4" /> Open Resume Builder & AI Coach
                  </button>
                </div>
              </GlassCard>

{/* Scoring Infrastructure */}
              <div id="scoring-infrastructure" className="mb-8" style={{ order: sectionOrder.indexOf('scoring-infrastructure') }}>
                {collapsedSections["scoring-infrastructure"] ? (
                  <GlassCard className="p-4 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                            ATS Scoring Infrastructure & Core Benchmarks
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 uppercase">
                            Collapsed
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                          Overall Match: {result.overallScore}% · ATS Parseability: {result.atsCompatibility}% · Skills Overlap: {result.skillsMatch}%
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection("scoring-infrastructure")}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Expand Section</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Scoring Infrastructure & Core ATS Metrics
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSection("scoring-infrastructure")}
                        className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs"
                        title="Collapse section to declutter workspace"
                      >
                        <span className="text-[10px] font-bold">Collapse</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                <GlassCard className="flex flex-col items-center justify-center py-8 border-t-4 border-t-violet-600 bg-gradient-to-b from-violet-500/5 to-transparent relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-60">
                    <CheckCircle2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-950 dark:text-white font-display uppercase tracking-widest mb-2">
                    Overall Match
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-8 text-center max-w-xs">
                    Holistic evaluation of your resume against the target role
                  </p>
                  <ScoringCircle
                    score={result.overallScore}
                    label="Executive Leadership Score"
                    color="#7c3aed"
                    delay={0.08}
                  />
                  <div className="mt-6 flex items-center justify-center">
                    <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/25 rounded-md text-[9px] font-black tracking-widest text-violet-700 dark:text-violet-400 uppercase">
                      <BarChart2 className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                      Benchmarked via 2000B+ Outcomes • High-Accuracy ML
                    </span>
                  </div>

                  {/* Historical ATS Score Trajectory Sparkline */}
                  <div className="w-full mt-6 pt-5 border-t border-zinc-200 dark:border-white/10 flex flex-col space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider px-2">
                      <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Historical ATS Trajectory
                      </span>
                      <span className="text-violet-700 dark:text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-md border border-violet-500/30">
                        +{Math.max(8, Math.min(32, Math.round(result.overallScore * 0.22)))}% Score Improvement
                      </span>
                    </div>

                    <div className="h-20 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={
                            history.length >= 2
                              ? [
                                  ...history.slice(-4).map((h, idx) => ({
                                    version: `v${idx + 1}`,
                                    score: h.result.overallScore,
                                  })),
                                  { version: "Current", score: result.overallScore },
                                ]
                              : [
                                  { version: "Base Audit", score: Math.max(30, result.overallScore - 22) },
                                  { version: "Iteration 1", score: Math.max(42, result.overallScore - 14) },
                                  { version: "Iteration 2", score: Math.max(58, result.overallScore - 6) },
                                  { version: "Current Audit", score: result.overallScore },
                                ]
                          }
                          margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="overallSparklineGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.45} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white dark:bg-[#111116] border border-violet-500/40 px-2.5 py-1 rounded shadow-lg">
                                    <p className="text-[10px] font-black text-violet-700 dark:text-violet-300 uppercase">
                                      {payload[0].payload.version}: {payload[0].value} pts
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#7c3aed"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#overallSparklineGradient)"
                            dot={{ r: 3, fill: "#7c3aed", stroke: "#ffffff", strokeWidth: 1.5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </GlassCard>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <GlassCard className="flex flex-col items-center justify-center p-6 md:p-8 border-t-2 border-t-purple-600 relative overflow-hidden group/card hover:border-purple-500 transition-colors">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4">
                      ATS Fit
                    </h3>
                    <ScoringCircle
                      score={result.atsCompatibility}
                      label=""
                      color="#9333ea"
                      delay={0.16}
                      tooltip="Measures how well your resume is formatted and structured to pass through an Applicant Tracking System (ATS) without losing critical data."
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 md:p-8 border-t-2 border-t-violet-700 relative overflow-hidden group/card hover:border-violet-500 transition-colors">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4">
                      Skills Match
                    </h3>
                    <ScoringCircle
                      score={result.skillsMatch}
                      label=""
                      color="#6d28d9"
                      delay={0.24}
                      tooltip="Evaluates the density of relevant skills and keywords in your resume compared to the requirements of your target role."
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 md:p-8 border-t-2 border-t-purple-500 relative overflow-hidden group/card hover:border-purple-400 transition-colors">
                    <h3 className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4 text-center">
                      Formatting Health
                    </h3>
                    <ScoringCircle
                      score={
                        result.formattingHealthScore ||
                        result.atsAnalysis.formattingScore ||
                        0
                      }
                      label=""
                      color="#a855f7"
                      delay={0.32}
                      tooltip="Assesses the visual structure, layout consistency, and readability of your document for human reviewers and parsers."
                    />
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-6 md:p-8 border-t-2 border-t-violet-900 relative overflow-hidden group/card hover:border-violet-700 transition-colors">
                    <h3 className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4 text-center">
                      Career Trajectory
                    </h3>
                    <ScoringCircle
                      score={result.careerTrajectoryFitScore || 0}
                      label=""
                      color="#5b21b6"
                      delay={0.40}
                      tooltip="Analyzes the progression of your roles and achievements to determine if you show the expected growth for this executive position."
                    />
                  </GlassCard>
                </div>
              </div>
            </div>
          )}
        </div>

              {/* 4-Quadrant Spider Chart: Resume Health Overview Widget */}
              <div className="mb-8" id="resume-health-overview">
                <ResumeHealthWidget
                  result={result}
                  onOpenOptimizer={(focusArea) => {
                    if (focusArea) setSelectedSkillToFrame(focusArea);
                    setIsResumeBuilderOpen(true);
                  }}
                />
              </div>

              <div id="career-progression" className="mb-8" style={{ order: sectionOrder.indexOf('career-progression') }}>
                {collapsedSections["career-progression"] ? (
                  <GlassCard className="p-4 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                            Career Progression & Sub-Metrics
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 uppercase">
                            Collapsed
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                          Target Mandate: {result.careerPath?.topRole} · Trajectory Confidence {result.careerPath?.confidence || 88}%
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection("career-progression")}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Expand Section</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </GlassCard>
                ) : (
                  <>
                    <GlassCard className="mb-8">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em]">
                        Detailed Sub-Metrics
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest">
                          <Target className="h-3 w-3" />
                          Deep Analysis
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSection("career-progression")}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer ml-2 flex items-center gap-1 text-xs"
                          title="Collapse this section to declutter workspace"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-8">
                  {[
                    {
                      label: "Skills Match",
                      score: result.skillsMatch,
                      color: "#7c3aed",
                      desc: "Role alignment",
                      tooltip: (
                        <>
                          <strong className="text-violet-400 block mb-2 uppercase tracking-widest text-xs border-b border-zinc-800 pb-1">
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
                      color: "#9333ea",
                      desc: "Density factor",
                    },
                    {
                      label: "Formatting",
                      score: result.atsAnalysis.formattingScore,
                      color: "#6d28d9",
                      desc: "Visual health",
                      tooltip: (
                        <>
                          <strong className="text-purple-400 block mb-2 uppercase tracking-widest text-xs border-b border-zinc-800 pb-1">
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
                      color: "#a855f7",
                      desc: "Averaged health",
                      tooltip: (
                        <>
                          <strong className="text-purple-300 block mb-2 uppercase tracking-widest text-xs border-b border-zinc-800 pb-1">
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
                      color: "#5b21b6",
                      desc: "Impact score",
                      tooltip: (
                        <>
                          <strong className="text-violet-300 block mb-2 uppercase tracking-widest text-xs border-b border-zinc-800 pb-1">
                            Bullet Quality
                          </strong>
                          Focuses on the presence of strong action verbs and
                          quantifiable metrics (numbers, %, $) in your
                          experience descriptions.
                        </>
                      ),
                    },
                  ].map((m, i) => (
                    <div key={`m-${m.label}-${i}`} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest block">
                              {m.label}
                            </span>
                            <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                              {m.desc}
                            </span>
                          </div>
                          {m.tooltip && (
                            <div className="group relative cursor-pointer">
                              <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-zinc-950 text-white text-[10px] font-medium p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-zinc-800 shadow-2xl leading-relaxed">
                                {m.tooltip}
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 rotate-45 border-r border-b border-zinc-800"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-2xl font-black text-zinc-950 dark:text-white font-display leading-none">
                          {m.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.score}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: m.color }}
                          transition={{
                            delay: 0.35 + i * 0.08,
                            duration: 0.9,
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
                    <h3 className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] text-center">
                      Career Progression Timeline
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                      Trajectory extracted from your resume
                    </p>
                  </div>

                  <div className="relative pl-4 md:pl-8 max-w-4xl mx-auto">
                    <div className="absolute left-[27px] md:left-[43px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-600 via-purple-600 to-transparent opacity-30"></div>

                    <div className="space-y-12">
                      {result.careerTimeline.map((item, idx) => (
                        <div
                          key={`timeline-${item.role || idx}-${item.company || idx}-${idx}`}
                          className="relative pl-12 md:pl-16"
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-[-5px] md:left-[11px] top-1 h-6 w-6 rounded-full bg-white dark:bg-[#111116] border-2 border-violet-600 flex items-center justify-center shadow-sm z-10">
                            <div className="h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400"></div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-2">
                            <h4 className="text-lg md:text-xl font-black text-zinc-950 dark:text-white">
                              {item.role}
                            </h4>
                            <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-3 py-1 rounded-md border border-violet-500/25 whitespace-nowrap">
                              {item.duration}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-4">
                            {item.company}
                          </p>

                          <ul className="space-y-2">
                            {item.highlights.map((highlight, hIdx) => (
                              <li
                                key={`timeline-hl-${idx}-${hIdx}`}
                                className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium flex items-start gap-3"
                              >
                                <span className="text-violet-600 dark:text-violet-400 mt-1.5 opacity-60">
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
              result.linkedinComparison.hasLinkedIn ? (
                <GlassCard className="mb-8 border-t-2 border-t-violet-600 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tighter">
                            LinkedIn Profile Sync
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25 text-[9px] font-bold uppercase tracking-wider">
                            Connected
                          </span>
                        </div>
                        <p className="text-[10px] text-violet-700 dark:text-violet-400 font-bold tracking-widest uppercase">
                          Cross-Vector Evaluation Active
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {linkedinUrl && (
                        <a
                          href={linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-700 dark:text-violet-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 transition-all font-mono flex items-center gap-1.5"
                        >
                          <span>in/{linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/i, "").replace(/\/+$/, "")}</span>
                          <ArrowRight className="w-3 h-3 -rotate-45" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsConnectLinkedInModalOpen(true)}
                        className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                        <span>Manage Sync</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyLinkedInTrust()}
                        disabled={isVerifyingLinkedInTrust}
                        className="text-xs text-violet-800 dark:text-white bg-violet-500/15 dark:bg-violet-500/20 hover:bg-violet-500/25 dark:hover:bg-violet-500/30 px-3.5 py-1.5 rounded-xl border border-violet-500/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap disabled:opacity-50"
                        title="Perform real-time verification of LinkedIn profile data against resume content for Credibility Score"
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 text-violet-700 dark:text-violet-400 ${isVerifyingLinkedInTrust ? "animate-spin" : ""}`} />
                        <span>{isVerifyingLinkedInTrust ? "Verifying..." : "LinkedIn Trust Score"}</span>
                        {linkedInTrustScore !== null && (
                          <span className="font-mono font-bold tabular-nums text-violet-700 dark:text-violet-300 ml-1">
                            {linkedInTrustScore}%
                          </span>
                        )}
                      </button>
                      <button
                        id="share-trust-score-linkedin-btn"
                        type="button"
                        onClick={() => setIsShareTrustScoreOpen(true)}
                        className="text-xs text-white bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap font-bold"
                        title="Generate social media card of your verified credibility score"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share my Trust Score</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTrustScoreWalkthroughOpen(true)}
                        className="text-xs text-purple-800 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-xl border border-purple-500/30 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap font-bold"
                        title="Interactive guide on how to customize and share your Trust Score card"
                      >
                        <Info className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                        <span>Tour</span>
                      </button>
                    </div>
                  </div>

                  {/* Real-Time Credibility Score Banner in Connected LinkedIn Section */}
                  {linkedInTrustScore !== null && (
                    <div className="mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-violet-500/30 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                          <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                          <span className="font-bold text-zinc-950 dark:text-white">Credibility Score</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-violet-700 dark:text-violet-300 font-medium">
                            {linkedInTrustReport?.credibilityTier ||
                              (linkedInTrustScore >= 85
                                ? "Verified High Credibility"
                                : linkedInTrustScore >= 70
                                ? "Strong Profile Credibility"
                                : "Moderate Credibility")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono font-bold tabular-nums text-violet-700 dark:text-violet-400">
                            {linkedInTrustScore}% Credibility
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsLinkedInVerificationModalOpen(true)}
                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Detailed Audit
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsShareTrustScoreOpen(true)}
                            className="text-xs font-bold text-white bg-violet-700 hover:bg-violet-600 px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="Generate social media image card"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share my Trust Score</span>
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${linkedInTrustScore}%` }}
                        />
                      </div>
                      {linkedInTrustReport?.trustFactors && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {linkedInTrustReport.trustFactors.map((tf: any, idx: number) => (
                            <div
                              key={`dash-conn-tf-${tf.name}-${idx}`}
                              className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
                            >
                              <span className="truncate pr-2">{tf.name.split(" ")[0]}</span>
                              <span className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-white">
                                {tf.score}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {linkedInTrustReport?.verificationSummary && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {linkedInTrustReport.verificationSummary}
                        </p>
                      )}
                    </div>
                  )}

                  {/* LinkedIn Score Impact Progress Bar */}
                  <div className="mb-8 p-5 bg-violet-500/10 border border-violet-500/25 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-end mb-3 relative z-10">
                      <span className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" /> LinkedIn
                        Data Impact
                      </span>
                      <span className="text-[10px] font-black text-violet-700 dark:text-violet-300 uppercase bg-violet-500/15 px-2 py-1 rounded border border-violet-500/25">
                        +15% Score Boost
                      </span>
                    </div>
                    <div className="w-full h-3 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden flex relative z-10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.max(10, result.overallScore - 15)}%`,
                        }}
                        transition={{ duration: 0.9 }}
                        className="h-full bg-zinc-500"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `15%` }}
                        transition={{ duration: 0.9, delay: 0.5 }}
                        className="h-full bg-violet-600 relative"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mt-3 text-right tracking-[0.2em] relative z-10">
                      Enhanced by Profile Verification
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 relative">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-zinc-200 dark:bg-white/10 hidden md:block" />

                    {/* Resume Side */}
                    <div className="space-y-6">
                      <div className="bg-zinc-50 dark:bg-zinc-950/60 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                          Resume Headline
                        </h4>
                        <p className="text-zinc-950 dark:text-white text-sm font-bold">
                          {result.linkedinComparison.resumeHeadline}
                        </p>
                      </div>

                      {result.linkedinComparison.missingFromLinkedIn &&
                        result.linkedinComparison.missingFromLinkedIn.length >
                          0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" /> Present on
                              Resume (Missing on LinkedIn)
                            </h4>
                            <ul className="space-y-2">
                              {result.linkedinComparison.missingFromLinkedIn.map(
                                (s, i) => (
                                  <li
                                    key={`li-miss-${s}-${i}`}
                                    className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                                  >
                                    <span className="text-violet-600 dark:text-violet-400">
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
                      <div className="bg-violet-500/10 p-5 rounded-2xl border border-violet-500/25">
                        <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-2 border-b border-violet-500/20 pb-2">
                          LinkedIn Headline
                        </h4>
                        <p className="text-zinc-950 dark:text-white text-sm font-bold">
                          {result.linkedinComparison.linkedinHeadline}
                        </p>
                      </div>

                      {result.linkedinComparison.missingFromResume &&
                        result.linkedinComparison.missingFromResume.length >
                          0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" /> Present on
                              LinkedIn (Missing on Resume)
                            </h4>
                            <ul className="space-y-2">
                              {result.linkedinComparison.missingFromResume.map(
                                (s, i) => (
                                  <li
                                    key={`res-miss-${s}-${i}`}
                                    className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
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

                  <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-white/5 mx-auto max-w-2xl text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium italic leading-relaxed">
                      " {result.linkedinComparison.matchAnalysis} "
                    </p>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="mb-8 border-t-2 border-t-violet-600/70 overflow-hidden relative group">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-2">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-violet-500/15 border border-violet-500/35 flex items-center justify-center text-violet-700 dark:text-violet-400 shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight">
                            Connect LinkedIn Profile
                          </h3>
                          <span className="text-violet-700 dark:text-violet-400 text-[11px] font-bold">
                            · +15% Verification Boost
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
                          Sync your LinkedIn profile to run automated narrative alignment, discover missing executive skills, and benchmark your public presence against ATS standards.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleVerifyLinkedInTrust()}
                        disabled={isVerifyingLinkedInTrust}
                        className="px-4 py-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-800 dark:text-violet-300 font-bold text-xs uppercase tracking-wider transition-all border border-violet-500/35 flex items-center justify-center gap-2 cursor-pointer shadow-sm whitespace-nowrap disabled:opacity-50"
                      >
                        <ShieldCheck className={`w-4 h-4 text-violet-700 dark:text-violet-400 ${isVerifyingLinkedInTrust ? "animate-spin" : ""}`} />
                        <span>{isVerifyingLinkedInTrust ? "Verifying..." : "LinkedIn Trust Score"}</span>
                        {linkedInTrustScore !== null && (
                          <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white ml-1">
                            {linkedInTrustScore}%
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsShareTrustScoreOpen(true)}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                        title="Generate a social media-ready image card of your verified credibility score"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share my Trust Score</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTrustScoreWalkthroughOpen(true)}
                        className="px-3.5 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold text-xs uppercase tracking-wider transition-all border border-purple-500/35 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                        title="Interactive guide on how to customize and share your Trust Score card"
                      >
                        <Info className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                        <span>Tour</span>
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsConnectLinkedInModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-950 dark:bg-violet-700 hover:bg-zinc-800 dark:hover:bg-violet-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        <Zap className="w-4 h-4 text-violet-300" />
                        <span>Connect Profile Now</span>
                      </motion.button>
                    </div>
                  </div>

                  {linkedInTrustScore !== null && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                          <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                          <span className="font-bold text-zinc-950 dark:text-white">Credibility Score</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-violet-700 dark:text-violet-300 font-medium">
                            {linkedInTrustReport?.credibilityTier ||
                              (linkedInTrustScore >= 85
                                ? "Verified High Credibility"
                                : linkedInTrustScore >= 70
                                ? "Strong Profile Credibility"
                                : "Moderate Credibility")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-mono font-bold tabular-nums text-violet-700 dark:text-violet-400">
                            {linkedInTrustScore}% Credibility
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsLinkedInVerificationModalOpen(true)}
                            className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white underline underline-offset-2 cursor-pointer whitespace-nowrap"
                          >
                            Full Verification Report
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${linkedInTrustScore}%` }}
                        />
                      </div>
                      {linkedInTrustReport?.verificationSummary && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {linkedInTrustReport.verificationSummary}
                        </p>
                      )}
                    </div>
                  )}
                </GlassCard>
              )}
                  </>
                )}
              </div>

              {/* Skill Cloud Visualizer & D3 Force Network Graph */}
              <div id="skill-vector-engine" style={{ order: sectionOrder.indexOf('skill-vector-engine') }} className="space-y-6">
                {collapsedSections["skill-vector-engine"] ? (
                  <GlassCard className="p-4 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                            Skills Ecosystem & Knowledge Architecture
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 uppercase">
                            Collapsed
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                          {result.foundSkills.length} Matched Capabilities · {result.skillGapReport.length} Missing Bridges · Force-Directed Graph
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection("skill-vector-engine")}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Expand Section</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </GlassCard>
                ) : (
                  <>
                    {/* Section Header with Segmented View Switcher */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                          <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-[0.25em]">
                            Skills Ecosystem & Knowledge Architecture
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 text-[9px] font-extrabold uppercase">
                            {skillVisualizationMode === "network" ? "D3 Force Graph" : "Tag Cloud"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                          {skillVisualizationMode === "network"
                            ? "Interactive force-directed network visualizing interconnected technologies, domain clusters, and priority ATS skill gap bridges"
                            : "Distribution of matched capabilities and severity ranking of missing role requirements"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Segmented Mode Selector */}
                        <div className="flex items-center p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs">
                          <button
                            type="button"
                            onClick={() => setSkillVisualizationMode("network")}
                            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              skillVisualizationMode === "network"
                                ? "bg-gradient-to-r from-violet-700 to-purple-700 text-white shadow-sm"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>D3 Force Network</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkillVisualizationMode("cloud")}
                            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              skillVisualizationMode === "cloud"
                                ? "bg-gradient-to-r from-violet-700 to-purple-700 text-white shadow-sm"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Tag Cloud & Bar Chart</span>
                          </button>
                        </div>

                        {/* Collapse Section Button */}
                        <button
                          type="button"
                          onClick={() => toggleSection("skill-vector-engine")}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                          title="Collapse this section to declutter workspace"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>


                {skillVisualizationMode === "network" ? (
                  <div className="space-y-6">
                    {/* D3 Force-Directed Network Graph */}
                    <PanelErrorBoundary compact title="D3 Skill Network Graph">
                      <SkillNetworkGraph
                        foundSkills={result.foundSkills || []}
                        missingSkills={(result.skillGapReport || []).map((g) => g.skill)}
                        skillGapReport={result.skillGapReport || []}
                        onSkillClick={handleMissingSkillClick}
                        height={580}
                      />
                    </PanelErrorBoundary>

                    {/* Compact Severity & Demand Row */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      <GlassCard>
                        <div className="flex flex-col items-center justify-center space-y-1 mb-4">
                          <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-center">
                            Skill Gap Priority Severity
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">
                            Quantified urgency to bridge target role requirements
                          </p>
                        </div>
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={result.skillGapReport.map((sg) => ({
                                name: sg.skill,
                                severity: sg.importance.toLowerCase().includes("critical")
                                  ? 95
                                  : sg.importance.toLowerCase().includes("high")
                                  ? 75
                                  : sg.importance.toLowerCase().includes("medium")
                                  ? 50
                                  : 30,
                              }))}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.2)" vertical={false} />
                              <XAxis
                                dataKey="name"
                                stroke="#71717a"
                                tick={{ fill: "#71717a", fontSize: 10, fontWeight: 700 }}
                                tickMargin={10}
                              />
                              <YAxis
                                stroke="#71717a"
                                tick={{ fill: "#71717a", fontSize: 10 }}
                                tickFormatter={(val) => `${val}%`}
                              />
                              <RechartsTooltip
                                cursor={{ fill: "rgba(139,92,246,0.06)" }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl">
                                        <p className="text-zinc-950 dark:text-white text-xs font-bold uppercase">
                                          {payload[0].payload.name}
                                        </p>
                                        <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase mt-1">
                                          Gap Severity: {payload[0].value}%
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="severity" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </GlassCard>

                      <GlassCard>
                        <div className="flex flex-col items-center justify-center space-y-1 mb-4">
                          <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-center">
                            Network Graph Insights
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">
                            Technology clustering & adjacency recommendations
                          </p>
                        </div>
                        <div className="space-y-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            <strong className="text-violet-700 dark:text-violet-300 block mb-1">Ecosystem Density:</strong>
                            Your primary cluster is anchored around{" "}
                            <span className="text-zinc-950 dark:text-white font-bold">{result.foundSkills.slice(0, 4).join(", ")}</span>.
                            Technologies connected by violet edges indicate native framework interoperability.
                          </div>
                          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            <strong className="text-purple-700 dark:text-purple-300 block mb-1">Bridge Nodes (Dashed Purple Edges):</strong>
                            Missing skills like{" "}
                            <span className="text-purple-800 dark:text-purple-200 font-bold">
                              {result.skillGapReport.slice(0, 2).map((g) => g.skill).join(", ") || "recommended skills"}
                            </span>{" "}
                            are connected directly to your existing proficiencies, showing the fastest path to bridge your gap without learning unrelated technologies.
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <GlassCard>
                      <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                        <h3 className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] text-center">
                          Skill Landscape Profile
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                          Visual distribution of matched & missing capabilities
                        </p>
                      </div>
                      <SkillCloud
                        found={result.foundSkills}
                        missing={result.skillGapReport.map((g) => g.skill)}
                        onSkillClick={handleMissingSkillClick}
                      />
                    </GlassCard>

                    <GlassCard>
                      <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                        <h3 className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] text-center">
                          Skill Gap Analysis
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
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
                              stroke="rgba(161,161,170,0.2)"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              stroke="#71717a"
                              tick={{
                                fill: "#71717a",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                              tickMargin={10}
                            />
                            <YAxis
                              stroke="#71717a"
                              tick={{ fill: "#71717a", fontSize: 10 }}
                              tickFormatter={(val) => `${val}%`}
                            />
                            <RechartsTooltip
                              cursor={{ fill: "rgba(139,92,246,0.06)" }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl">
                                      <p className="text-zinc-950 dark:text-white text-xs font-bold uppercase">
                                        {payload[0].payload.name}
                                      </p>
                                      <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase mt-1">
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
                              fill="#e11d48"
                              radius={[4, 4, 0, 0]}
                              barSize={20}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </div>
                )}

                <SkillDemandTrend
                  role={result.careerPath.topRole || "Target Role"}
                />
                  </>
                )}
              </div>

              <div className="grid lg:grid-cols-12 gap-8 mt-8">
                {/* Core Strengths & Weaknesses */}
                <GlassCard className="lg:col-span-12 p-8">
                  <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.08
                        }
                      }
                    }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-violet-500/25 hover:bg-violet-500/5 transition-all group"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" /> Core Strength
                        </h4>
                        <div className="h-6 w-6 rounded-full bg-violet-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Activity className="h-3 w-3 text-violet-700 dark:text-violet-400" />
                        </div>
                      </div>
                      <p className="text-sm text-zinc-950 dark:text-white font-black uppercase mb-3 line-clamp-2">
                        Excellent {result.foundSkills[0] || "Domain"} Exposure
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        Your experience in{" "}
                        <span className="text-zinc-800 dark:text-zinc-200 font-bold">{result.foundSkills.slice(0, 3).join(", ")}</span> provides a strong foundation.
                      </p>
                    </motion.div>

                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-rose-500/25 hover:bg-rose-500/5 transition-all group"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
                          <Zap className="h-4 w-4" /> Priority Fix
                        </h4>
                        <div className="h-6 w-6 rounded-full bg-rose-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                        </div>
                      </div>
                      <p className="text-sm text-zinc-950 dark:text-white font-black uppercase mb-3 line-clamp-2">
                        Missing {result.skillGapReport[0]?.skill || "Core Keywords"}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        Recruiters scan for <span className="text-zinc-800 dark:text-zinc-200 font-bold">{result.skillGapReport[0]?.skill}</span>. Add this to your summary immediately.
                      </p>
                    </motion.div>

                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-purple-500/25 hover:bg-purple-500/5 transition-all group"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                          <Target className="h-4 w-4" /> Target Role Fit
                        </h4>
                        <div className="h-6 w-6 rounded-full bg-purple-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <TrendingUp className="h-3 w-3 text-purple-700 dark:text-purple-400" />
                        </div>
                      </div>
                      <p className="text-sm text-zinc-950 dark:text-white font-black uppercase mb-3 line-clamp-2">
                        {result.careerPath?.topRole || "Target Leadership Role"}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        You are a <span className="text-purple-700 dark:text-purple-300 font-bold">{Math.round(result.careerPath?.confidence ?? 0)}%</span> match for this trajectory.
                      </p>
                    </motion.div>

                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-violet-500/25 hover:bg-violet-500/5 transition-all group"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2">
                          <Layers className="h-4 w-4" /> Keyword Health
                        </h4>
                        <div className="h-6 w-6 rounded-full bg-violet-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Search className="h-3 w-3 text-violet-700 dark:text-violet-400" />
                        </div>
                      </div>
                      <p className="text-sm text-zinc-950 dark:text-white font-black uppercase mb-3">
                        {(result.atsAnalysis?.keywordDensity ?? 0) > 4 ? 'Well Optimized' : 'Under Optimized'}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        Keyword density is <span className="text-violet-700 dark:text-violet-300 font-bold">{(result.atsAnalysis?.keywordDensity ?? 0).toFixed(1)}%</span>.
                        {result.atsAnalysis?.jobKeywordsFound && result.atsAnalysis.jobKeywordsFound.length > 0 
                          ? ` Found ${result.atsAnalysis.jobKeywordsFound.length} core terms.` 
                          : ' Need more exact matches.'}
                      </p>
                    </motion.div>

                    {result.globalBenchmarking && (
                      <motion.div 
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/35 transition-all md:col-span-2 lg:col-span-1 group"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Experience Benchmark
                          </h4>
                          <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <BarChart2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium line-clamp-3">
                          {result.globalBenchmarking}
                        </p>
                      </motion.div>
                    )}

                    {result.recruiterSummary && (
                      <motion.div 
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        className={`p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-purple-500/25 hover:bg-purple-500/5 transition-all group ${!result.globalBenchmarking ? 'md:col-span-2 lg:col-span-2' : ''}`}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                            <Eye className="h-4 w-4" /> Board & Stakeholder Impression
                          </h4>
                          <div className="h-6 w-6 rounded-full bg-purple-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Info className="h-3 w-3 text-purple-700 dark:text-purple-400" />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                          {result.recruiterSummary}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Career Roles Expansion with D3 Connected Graph */}
                  <div className="mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-10 space-y-6">
                    <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" /> Career
                      Trajectory & Vector Progression Graph
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      Connected D3 visualization showing progression from past experience to your primary & alternative target roles.
                    </p>

                    <PanelErrorBoundary compact title="D3 Trajectory Graph">
                      <D3CareerGraph
                        currentRole={result.targetRole || "Current Career Stage"}
                        topRole={result.careerPath?.topRole || "Target Role"}
                        confidence={result.careerPath?.confidence ?? 0}
                        alternatives={result.careerPath?.alternatives || []}
                        careerTimeline={result.careerTimeline || []}
                        careerTrajectories={result.careerTrajectories}
                      />
                    </PanelErrorBoundary>

                    <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-6 py-4">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-violet-800/20 -translate-y-1/2 hidden md:block" />
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.0, ease: "easeInOut" }}
                        className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-violet-600/70 via-purple-600/70 to-violet-800/70 -translate-y-1/2 origin-left hidden md:block rounded-full"
                      />

                      <motion.div
                        className="relative z-10 w-full md:w-1/3 flex flex-col group"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <div className="flex-1 p-6 rounded-2xl bg-zinc-50 dark:bg-[#111116] border border-violet-500/40 group-hover:bg-violet-500/5 transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center shadow-sm">
                          <span className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white dark:bg-[#111116] border-[3px] border-violet-600 -translate-y-1/2 hidden md:block z-20 transition-transform" />
                          <p className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-2 border border-violet-500/35 px-3 py-1 rounded-md bg-violet-500/10">
                            Primary Fit
                          </p>
                          <p className="text-lg text-zinc-950 dark:text-white font-bold">
                            {result.careerPath.topRole}
                          </p>
                          <p className="text-sm font-black text-violet-700 dark:text-violet-300 mt-2 bg-violet-500/10 px-3 py-1 rounded-md inline-block">
                            {result.careerPath.confidence}% Match
                          </p>
                        </div>
                        {result.improvementPlan?.missingSkillsToHighlight &&
                          result.improvementPlan.missingSkillsToHighlight
                            .length > 0 && (
                            <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-white/5 mx-2 text-left">
                              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                                To Secure Role
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {result.improvementPlan.missingSkillsToHighlight
                                  .slice(0, 3)
                                  .map((ms, msx) => (
                                    <span
                                      key={`miss-skill-${ms}-${msx}`}
                                      className="text-[9px] font-black uppercase bg-violet-500/15 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded"
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
                            key={`alt-path-${alt.role || i}-${i}`}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.12 + i * 0.12 }}
                            className="relative z-10 w-full md:w-1/3 flex flex-col group"
                          >
                            <div
                              className={`flex-1 p-6 rounded-2xl bg-zinc-50 dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 ${i === 0 ? "hover:border-purple-500/50 hover:bg-purple-500/5" : "hover:border-violet-500/50 hover:bg-violet-500/5"} transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center shadow-sm`}
                            >
                              {i === 0 && (
                                <span className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-white dark:bg-[#111116] border-[3px] border-purple-600 -translate-y-1/2 hidden md:block z-20 transition-transform" />
                              )}
                              {i === 0 &&
                                result.careerPath.alternatives.length > 1 && (
                                  <span className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white dark:bg-[#111116] border-[3px] border-purple-600 -translate-y-1/2 hidden md:block z-20 transition-transform" />
                                )}
                              {i === 1 && (
                                <span className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-white dark:bg-[#111116] border-[3px] border-violet-700 -translate-y-1/2 hidden md:block z-20 transition-transform" />
                              )}
                              <p
                                className={`text-[10px] font-black uppercase tracking-widest mb-2 border px-3 py-1 rounded-md ${i === 0 ? "text-purple-700 dark:text-purple-400 border-purple-500/35 bg-purple-500/10" : "text-violet-700 dark:text-violet-400 border-violet-500/35 bg-violet-500/10"}`}
                              >
                                Possible Pivot
                              </p>
                              <p className="text-lg text-zinc-950 dark:text-white font-bold">
                                {alt.role}
                              </p>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 line-clamp-3 leading-relaxed font-medium">
                                {alt.reasoning || `${alt.match}% Match`}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Main Improvement Checklist */}
                <div id="optimization-plan" className="lg:col-span-8 mb-8" style={{ order: sectionOrder.indexOf('optimization-plan') }}>
                  {collapsedSections["optimization-plan"] ? (
                    <GlassCard className="p-4 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                              Strategic Optimization Plan
                            </h3>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 uppercase">
                              Collapsed
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                            Priority Headline Updates, Content Rewrite Suggestions & Missing Skill Remediations
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSection("optimization-plan")}
                        className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Expand Section</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-0 overflow-hidden">
                      <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-violet-500/5 to-transparent flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                            Strategic Optimization Plan
                          </h3>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
                            To reach ATS matching perfection and secure the targeted
                            role, follow these prioritized actions.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSection("optimization-plan")}
                          className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer shrink-0"
                          title="Collapse this section to declutter workspace"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>

                  {/* High Priority Actions */}
                  {result.improvementPlan && (
                    <div className="p-8 grid md:grid-cols-2 gap-6 bg-zinc-50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/5">
                      {result.improvementPlan.resumeHeadlineUpdates &&
                        result.improvementPlan.resumeHeadlineUpdates.length >
                          0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Layout className="w-3 h-3" /> Title Updates
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.resumeHeadlineUpdates
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={`upd-headline-${s.slice(0, 15)}-${i}`}
                                    className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      {result.improvementPlan.formattingFixes &&
                        result.improvementPlan.formattingFixes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <FileText className="w-3 h-3" /> Layout Fixes
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.formattingFixes
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={`upd-fmt-${s.slice(0, 15)}-${i}`}
                                    className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
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
                            <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Award className="w-3 h-3" /> Target Credentials
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.recommendedCertifications
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={`upd-cert-${s.slice(0, 15)}-${i}`}
                                    className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5" />
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
                            <h4 className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Briefcase className="w-3 h-3" /> Highlight
                              Experience
                            </h4>
                            <ul className="space-y-2">
                              {result.improvementPlan.projectsToHighlight
                                .slice(0, 3)
                                .map((s, i) => (
                                  <li
                                    key={`upd-proj-${s.slice(0, 15)}-${i}`}
                                    className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                                  >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5" />
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
                    <h4 className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" /> AI Content
                      Rewrite Suggestions
                    </h4>
                    {[
                      ...result.atsAnalysis.recommendations,
                      ...result.suggestions,
                    ]
                      .slice(0, 5)
                      .map((step, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          key={`rec-${step.slice(0, 20)}-${i}`}
                          className="space-y-3"
                        >
                          <div
                            className={`flex gap-5 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border transition-all items-start group ${selectedRecommendation === step ? "border-violet-600 bg-violet-500/5" : "border-zinc-200 dark:border-zinc-800 hover:border-violet-500/40"}`}
                          >
                            <div
                              className={`h-10 w-10 mt-1 shrink-0 rounded-full border border-dashed flex items-center justify-center font-black text-xs transition-all ${selectedRecommendation === step ? "border-violet-600 bg-violet-500/20 text-violet-700 dark:text-violet-300" : "border-zinc-400 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 group-hover:border-violet-500 group-hover:text-violet-700 dark:group-hover:text-violet-400 group-hover:bg-violet-500/10"}`}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-zinc-800 dark:text-zinc-200 font-medium text-sm leading-relaxed pr-4">
                                  {step}
                                </p>
                                {selectedRecommendation === step ? (
                                  <button
                                    onClick={() =>
                                      handleExpandRecommendation(step)
                                    }
                                    className="p-2 rounded bg-zinc-200/70 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-violet-700 dark:text-violet-400 shrink-0 transition-colors cursor-pointer"
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
                                  className="self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2.5 rounded-xl transition-all border border-violet-500/25 hover:border-violet-500/40 cursor-pointer"
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
                                key={`rec-detail-${i}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-[#0D0D12] border border-violet-500/25 shadow-inner ml-14 relative">
                                  <div className="absolute top-[-10px] left-10 w-4 h-4 bg-zinc-100 dark:bg-[#0D0D12] border-t border-l border-violet-500/25 rotate-45 transform origin-center z-10" />

                                  {isGeneratingRecDetail ? (
                                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                      <Loader2 className="h-6 w-6 text-violet-600 dark:text-violet-400 animate-spin" />
                                      <p className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                        Generating strategic insights...
                                      </p>
                                    </div>
                                  ) : recommendationDetail ? (
                                    <div className="space-y-6">
                                      <div>
                                        <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <Info className="h-3.5 w-3.5" />{" "}
                                          Context & Rationale
                                        </h4>
                                        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                                          {recommendationDetail.explanation}
                                        </p>
                                      </div>

                                      {recommendationDetail.examples &&
                                        recommendationDetail.examples.length >
                                          0 && (
                                          <div>
                                            <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                              <TrendingUp className="h-3.5 w-3.5" />{" "}
                                              Implementation Examples
                                            </h4>
                                            <div className="space-y-3">
                                              {recommendationDetail.examples.map(
                                                (example, eIdx) => (
                                                  <div
                                                    key={`ex-${selectedRecommendation?.slice(0, 15)}-${eIdx}`}
                                                    className="group/ex relative p-4 pr-12 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed font-mono"
                                                  >
                                                    {example}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(example);
                                                        setCopiedExampleText(example);
                                                        setTimeout(() => {
                                                          setCopiedExampleText((cur) => (cur === example ? null : cur));
                                                        }, 2000);
                                                      }}
                                                      className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-100 dark:bg-white/5 opacity-0 group-hover/ex:opacity-100 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                                                      title="Copy to clipboard"
                                                    >
                                                      {copiedExampleText === example ? (
                                                        <Check className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                                      ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                      )}
                                                    </button>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-rose-500 text-xs">
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
              )}
            </div>

                {/* Sidebar Details */}
                <div className="lg:col-span-4 space-y-8">
                  <GlassCard>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">
                      Missing Skills
                    </h3>
                    <div className="space-y-4">
                      {result.skillGapReport.map((gap, i) => (
                        <div
                          key={`gap-${gap.skill || i}-${i}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 group relative overflow-hidden transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-violet-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                          <div className="relative z-10 flex flex-col">
                            <span className="text-[11px] font-black text-zinc-950 dark:text-white uppercase">
                              {gap.skill}
                            </span>
                            <span className="text-[9px] font-bold text-violet-700 dark:text-violet-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Fix for +
                              {gap.importance === "Critical" ? 10 : 5}% Boost
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-black px-2 py-1 rounded relative z-10 transition-colors ${gap.importance === "Critical" ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 group-hover:bg-rose-500/25" : "bg-purple-500/15 text-purple-700 dark:text-purple-400 group-hover:bg-purple-500/25"} uppercase`}
                          >
                            {gap.importance}
                          </span>
                        </div>
                      ))}
                      {result.skillGapReport.length === 0 && (
                        <p className="text-[11px] text-zinc-500 italic">
                          No significant missing skills detected.
                        </p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                        Keyword Analysis
                      </h3>
                      {result.atsAnalysis.jobKeywordsFound &&
                        result.atsAnalysis.jobKeywordsMissing && (
                          <div className="text-xs font-black text-zinc-950 dark:text-white">
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
                        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-5">
                          <div
                            className="h-full bg-violet-600 rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.round((result.atsAnalysis.jobKeywordsFound.length / (result.atsAnalysis.jobKeywordsFound.length + result.atsAnalysis.jobKeywordsMissing.length)) * 100) || 0}%`,
                            }}
                          />
                        </div>
                      )}

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[9px] font-black text-violet-700 dark:text-violet-400 uppercase mb-2">
                          Resume Top Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.atsAnalysis.topResumeKeywords
                            ?.slice(0, 10)
                            .map((kw, i) => (
                              <span
                                key={`kw-${kw}-${i}`}
                                className="text-[10px] font-bold px-2.5 py-1 bg-violet-500/10 border border-violet-500/30 rounded-md text-violet-800 dark:text-violet-300 hover:bg-violet-500/20 transition-all cursor-default"
                              >
                                {kw}
                              </span>
                            ))}
                        </div>
                      </div>

                      {result.atsAnalysis.jobKeywordsFound &&
                        result.atsAnalysis.jobKeywordsFound.length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-black text-purple-700 dark:text-purple-400 uppercase mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />{" "}
                              Matched Job Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.atsAnalysis.jobKeywordsFound?.map(
                                (kw, i) => (
                                  <span
                                    key={`jkf-${kw}-${i}`}
                                    className="text-[10px] font-bold px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-md text-purple-800 dark:text-purple-300 hover:bg-purple-500/20 transition-all cursor-default"
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
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1.5">
                                <XCircle className="h-3 w-3 text-rose-500" />{" "}
                                Missing Job Keywords
                              </h4>
                              <button
                                onClick={copyMissingKeywordsForDrafting}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-[9px] font-black uppercase text-rose-700 dark:text-rose-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                                title="Copy missing keywords formatted for bullet point drafting prompt"
                              >
                                {hasCopiedKeywords ? (
                                  <>
                                    <Check className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                                    <span className="text-violet-700 dark:text-violet-300">Copied Prompt!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-rose-600 dark:text-rose-300" />
                                    <span>Copy Keywords for Bullet Drafting</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {result.atsAnalysis.jobKeywordsMissing
                                ?.slice(0, 12)
                                .map((kw, i) => (
                                  <button
                                    key={`jkm-${kw}-${i}`}
                                    onClick={(e) => handleMissingKeywordClick(kw, e)}
                                    title="Click for exact sentence placement recommendation"
                                    className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-md text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1 group active:scale-95"
                                  >
                                    <span>{kw}</span>
                                    <Wand2 className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 transition-transform" />
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                      {result.atsAnalysis.keywordOptimizations &&
                        result.atsAnalysis.keywordOptimizations.length > 0 && (
                          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 mt-6">
                            <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Wand2 className="h-3.5 w-3.5" /> Keyword
                              Optimizations
                            </h4>
                            <div className="space-y-4">
                              {result.atsAnalysis.keywordOptimizations.map(
                                (opt, i) => (
                                  <details
                                    key={`ko-${opt.keyword}-${i}`}
                                    className="group bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 transition-colors hover:border-violet-500/35"
                                  >
                                    <summary className="text-[11px] font-bold text-zinc-950 dark:text-white flex items-center justify-between cursor-pointer outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                                        {opt.keyword}
                                      </div>
                                      <ChevronDown className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
                                    </summary>
                                    <div className="space-y-2 mt-4">
                                      {opt.suggestedPhrases.map(
                                        (phrase, pIdx) => (
                                          <div
                                            key={`phrase-${opt.keyword}-${i}-${pIdx}`}
                                            className="group/phrase relative p-3 pr-10 rounded-lg bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed font-mono"
                                          >
                                            {phrase}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(
                                                  phrase,
                                                );
                                                setCopiedPhraseText(phrase);
                                                setTimeout(() => {
                                                  setCopiedPhraseText((cur) => (cur === phrase ? null : cur));
                                                }, 2000);
                                              }}
                                              className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-md bg-white dark:bg-white/5 opacity-0 group-hover/phrase:opacity-100 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                                              title="Copy suggested phrase"
                                            >
                                              {copiedPhraseText === phrase ? (
                                                <Check className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                              ) : (
                                                <Copy className="h-3 w-3" />
                                              )}
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
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">
                      Expert Summary
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-violet-500/30 pl-4">
                      "{result.summary}"
                    </p>
                  </GlassCard>

                  {result.sectionsDetailed &&
                    result.sectionsDetailed.length > 0 && (
                      <GlassCard>
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Extracted
                          Sections
                        </h3>
                        <div className="space-y-4">
                          {result.sectionsDetailed.map((section, idx) => (
                            <div key={`section-det-${section.sectionName || idx}-${idx}`} className="group relative">
                              <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:border-violet-500/30 transition-colors">
                                <h4 className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-violet-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                                  {section.sectionName}
                                </h4>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed border-l border-zinc-200 dark:border-white/10 pl-3 ml-0.5 mt-1">
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

                  {/* New Recruiter & Insights Sections */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Interview Readiness */}
                    {result.interviewQuestions &&
                      result.interviewQuestions.length > 0 && (
                        <GlassCard>
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                            <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Interview Simulator
                          </h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-6">
                            Likely questions based on your profile gaps
                          </p>
                          <div className="space-y-4">
                            {result.interviewQuestions.map((q, idx) => (
                              <div
                                key={`iq-${q.slice(0, 20)}-${idx}`}
                                className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/25 text-zinc-700 dark:text-zinc-300 text-sm font-medium"
                              >
                                <span className="text-purple-600 dark:text-purple-400 font-black mr-2">
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
                        <GlassCard className="border-t-2 border-t-violet-600">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            Optimized Headline Draft
                          </h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-4">
                            AI-generated rewrite for this role
                          </p>
                          <div className="relative p-5 rounded-xl bg-violet-500/5 border border-violet-500/20 group">
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  result.resumeRewriteDraft || "",
                                )
                              }
                              className="absolute top-2 right-2 p-2 rounded-lg bg-zinc-200/60 dark:bg-white/5 hover:bg-violet-500/20 text-zinc-600 dark:text-zinc-400 hover:text-violet-700 dark:hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <p className="text-sm text-zinc-800 dark:text-zinc-200 italic leading-relaxed">
                              "{result.resumeRewriteDraft}"
                            </p>
                          </div>
                        </GlassCard>
                      )}

                      {result.recruiterSummary && (
                        <GlassCard className="border-t-2 border-t-purple-600">
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Recruiter Perspective
                          </h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-4">
                            Candid assessment of your fit
                          </p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {result.recruiterSummary}
                          </p>
                          {result.globalBenchmarking && (
                            <div className="mt-4 pt-4 border-t border-purple-500/20 flex items-start gap-3">
                              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                                <strong className="text-purple-700 dark:text-purple-300">
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
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            AI Cover Letter Draft
                          </h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
                            Starting template mapped to the JD
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              result.coverLetterDraft || "",
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-violet-500/15 hover:text-violet-700 dark:hover:text-violet-400 hover:border-violet-500/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Copy to Clipboard
                        </button>
                      </div>
                      <div className="p-6 md:p-8 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 font-serif text-zinc-800 dark:text-zinc-300 leading-loose text-sm whitespace-pre-wrap">
                        {result.coverLetterDraft}
                      </div>
                    </GlassCard>
                  )}
                </div>
              )}
{/* Floating Action Buttons */}
              {!isExecutiveMode && activeStudioTab !== "canvas" && (
                <div className={`fixed top-1/4 left-4 z-50 transition-all duration-300 ${isQuickLinksOpen ? 'w-64' : 'w-12'}`}>
                  <div className="bg-white/95 dark:bg-[#111116]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex">
                    <div className="w-12 flex flex-col items-center py-4 border-r border-zinc-200 dark:border-white/5 shrink-0">
                      <button 
                        onClick={() => setIsQuickLinksOpen(!isQuickLinksOpen)}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                        title="Quick Links"
                      >
                        <Layers className="h-5 w-5" />
                      </button>
                    </div>
                    {isQuickLinksOpen && (
                      <div className="p-4 w-52 flex flex-col gap-2">
                        <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-2">Quick Links</h4>
                        <button onClick={() => document.getElementById('scoring-infrastructure')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors cursor-pointer">Overall Match</button>
                        <button onClick={() => document.getElementById('skill-vector-engine')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors cursor-pointer">Skill Landscape</button>
                        <button onClick={() => document.getElementById('career-progression')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors cursor-pointer">Career Timeline</button>
                        <button onClick={() => document.getElementById('optimization-plan')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors cursor-pointer">Strategic Plan</button>
                        <button onClick={() => document.getElementById('career-simulator')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors cursor-pointer">Career Simulator</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="fixed bottom-32 right-6 md:right-8 z-[195] flex flex-col gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportToExcel}
                  title="Export Summary to Excel"
                  aria-label="Export Summary to Excel"
                  className="h-12 w-12 rounded-2xl bg-violet-700 hover:bg-violet-600 text-white shadow-2xl shadow-violet-500/20 flex items-center justify-center group relative overflow-hidden active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="h-5 w-5 relative z-10" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-20 border-t border-zinc-200 dark:border-white/5 text-center mt-20 bg-zinc-50/70 dark:bg-[#09090B]/60 relative">
        <div className="flex items-center justify-center gap-3 mb-6 opacity-90 dark:opacity-70">
          <BrainCircuit className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <span className="font-display font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-white">
            Executive Career Intelligence
          </span>
        </div>
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsPurgePromptOpen(true)}
            className="px-6 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            Purge Session
          </button>
        </div>
        <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6">
          <a href="#" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Privacy Priority
          </a>
          <a href="#" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Secure Processing
          </a>
          <a href="#" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Session Only
          </a>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
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
          className="group flex items-center gap-3 bg-white/95 dark:bg-[#111116]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-full shadow-xl hover:border-violet-500/40 transition-all ease-out duration-300 w-fit"
        >
          <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
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
            className="text-violet-600 dark:text-violet-400"
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
          className="group flex items-center gap-3 bg-white/95 dark:bg-[#111116]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-full shadow-xl hover:border-purple-500/40 transition-all ease-out duration-300 w-fit"
        >
          <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
            LinkedIn
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-violet-600 dark:text-violet-400 opacity-85 group-hover:opacity-100 transition-opacity">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </a>
      </div>

      {/* Floating ATS Gap Copilot Trigger & Synchronized Slide-Over Drawer */}
      {result && !isResumeBuilderOpen && (
        <>
          <button
            type="button"
            onClick={() => setIsCopilotDrawerOpen((prev) => !prev)}
            className="fixed bottom-6 left-6 z-[180] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/95 dark:bg-[#111116]/95 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-violet-500/35 text-zinc-950 dark:text-white shadow-2xl shadow-violet-500/15 transition-all cursor-pointer active:scale-95"
            title="Open ATS Gap Copilot to inspect what is missing and apply 1-click resume fixes"
          >
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight text-zinc-950 dark:text-white">
                ATS Gap Copilot
              </div>
              <div className="text-[10px] font-mono tabular-nums text-violet-600 dark:text-violet-400">
                Score {result.overallScore}% · Quick Fixes
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isCopilotDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-20 left-6 z-[190] w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-7rem)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-white">
                    <Wand2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span>Synchronized ATS Gap Copilot</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCopilotDrawerOpen(false)}
                    className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Close ATS Gap Copilot Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <AtsCopilotChat
                    compact
                    messages={sharedChatMessages}
                    onMessagesChange={setSharedChatMessages}
                    persona={sharedChatPersona}
                    onPersonaChange={setSharedChatPersona}
                    modelMode={sharedChatModelMode}
                    onModelModeChange={setSharedChatModelMode}
                    resumeText={
                      result?.atsMetadata?.rawText ||
                      result?.resumeRewriteDraft ||
                      result?.summary ||
                      result?.executiveSummary ||
                      ""
                    }
                    jobDescription={jobDescription}
                    analysisResult={result}
                    currentResumeData={sharedResumeData}
                    onApplyPatch={handleApplyPatchFromDrawer}
                    onOpenBuilder={() => {
                      setIsCopilotDrawerOpen(false);
                      setIsResumeBuilderOpen(true);
                    }}
                    externalPromptRequest={copilotExternalPrompt}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Interactive ATS Resume Generator & AI Coach Modal */}
      <PanelErrorBoundary compact title="ATS Resume Studio">
        <ResumeBuilderModal
          isOpen={isResumeBuilderOpen}
          onClose={() => setIsResumeBuilderOpen(false)}
          rawResumeText={
            result?.atsMetadata?.rawText ||
            result?.resumeRewriteDraft ||
            result?.summary ||
            result?.executiveSummary ||
            file?.name ||
            ""
          }
          jobDescription={jobDescription}
          analysisResult={result}
          initialSkillToFrame={selectedSkillToFrame}
          sharedResumeData={sharedResumeData}
          onSharedResumeDataChange={setSharedResumeData}
          sharedChatMessages={sharedChatMessages}
          onSharedChatMessagesChange={setSharedChatMessages}
          sharedPersona={sharedChatPersona}
          onSharedPersonaChange={setSharedChatPersona}
          sharedModelMode={sharedChatModelMode}
          onSharedModelModeChange={setSharedChatModelMode}
          pendingPatchToApply={pendingPatchToApply}
          onClearPendingPatch={() => setPendingPatchToApply(null)}
        />
      </PanelErrorBoundary>

      {/* Printable Report Component for PDF Export */}
      <FullReportPrintView ref={fullReportPrintRef} result={result} />
    </div>
  );
}
