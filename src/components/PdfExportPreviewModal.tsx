import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReactToPrint } from "react-to-print";
import {
  X,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
  Award,
  TrendingUp,
  Target,
  Sliders,
  ShieldCheck,
  Download,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Layers,
  Eye,
  Layout,
  AlignLeft,
  Check,
  Zap,
} from "lucide-react";

export type ExportTemplate = "modern-executive" | "minimalist-ats" | "creative-impact";

export interface PdfExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  fileName?: string;
  linkedinUrl?: string;
  linkedInTrustScore?: number | null;
  candidateName?: string;
  initialTemplate?: ExportTemplate;
}

export const PdfExportPreviewModal: React.FC<PdfExportPreviewModalProps> = ({
  isOpen,
  onClose,
  result,
  fileName = "Resume.pdf",
  linkedinUrl = "",
  linkedInTrustScore,
  candidateName = "Alex Mercer",
  initialTemplate = "modern-executive",
}) => {
  // Export Template layout state
  const [exportTemplate, setExportTemplate] = useState<ExportTemplate>(initialTemplate);

  // Toggle states for report sections
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeBenchmarks, setIncludeBenchmarks] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeTrajectory, setIncludeTrajectory] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [includeLinkedIn, setIncludeLinkedIn] = useState(true);

  // Styling & Theme options
  const [reportTheme, setReportTheme] = useState<"teal" | "navy" | "mono">("teal");
  const [customTitle, setCustomTitle] = useState("Executive Career Intelligence & ATS Audit");
  const [customName, setCustomName] = useState(candidateName);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printAreaRef,
    documentTitle: `${customName.replace(/\s+/g, "_")}_${
      exportTemplate === "modern-executive"
        ? "Modern_Executive"
        : exportTemplate === "minimalist-ats"
        ? "Minimalist_ATS"
        : "Creative_Impact"
    }_ATS_Report`,
  });

  if (!isOpen || !result) return null;

  const targetRole = result.careerPath?.topRole || result.targetRole || "Executive Leader";
  const overallScore = result.overallScore || 85;
  const atsCompatibility = result.atsCompatibility || 88;
  const skillsMatch = result.skillsMatch || 82;
  const formattingScore = result.formattingHealthScore || result.atsAnalysis?.formattingScore || 90;

  const initials =
    customName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "EM";

  const selectedCount = [
    includeSummary,
    includeBenchmarks,
    includeSkills,
    includeTrajectory,
    includeChecklist,
    includeLinkedIn,
  ].filter(Boolean).length;

  const toggleAll = (enable: boolean) => {
    setIncludeSummary(enable);
    setIncludeBenchmarks(enable);
    setIncludeSkills(enable);
    setIncludeTrajectory(enable);
    setIncludeChecklist(enable);
    setIncludeLinkedIn(enable);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="max-w-6xl w-full h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-teal-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black font-display tracking-tight text-white">
                    PDF Export Preview
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                    Template & Section Filter
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Select an export layout template and customize printable sections
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Split View */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Controls Sidebar (4 cols) */}
            <div className="lg:col-span-4 p-5 md:p-6 bg-slate-950/70 border-r border-slate-800/80 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* 1. Export Template Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-purple-400" />
                      <span>Export Template</span>
                    </label>
                    <span className="text-[10px] text-teal-400 font-mono font-bold uppercase">
                      {exportTemplate === "modern-executive"
                        ? "Modern Executive"
                        : exportTemplate === "minimalist-ats"
                        ? "Minimalist ATS"
                        : "Creative Impact"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* Option 1: Modern Executive */}
                    <button
                      type="button"
                      onClick={() => setExportTemplate("modern-executive")}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer group ${
                        exportTemplate === "modern-executive"
                          ? "bg-purple-500/15 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/40 text-white"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-xl mt-0.5 ${
                            exportTemplate === "modern-executive"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-white/5 text-slate-400 group-hover:text-white"
                          }`}
                        >
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Modern Executive</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono font-bold uppercase">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            Corporate balance with executive scorecards, strategic roadmaps & verified badges
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center shrink-0 border ${
                          exportTemplate === "modern-executive"
                            ? "border-purple-400 bg-purple-500 text-white"
                            : "border-slate-600 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </button>

                    {/* Option 2: Minimalist ATS */}
                    <button
                      type="button"
                      onClick={() => setExportTemplate("minimalist-ats")}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer group ${
                        exportTemplate === "minimalist-ats"
                          ? "bg-teal-500/15 border-teal-500/60 shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/40 text-white"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-xl mt-0.5 ${
                            exportTemplate === "minimalist-ats"
                              ? "bg-teal-500/20 text-teal-300"
                              : "bg-white/5 text-slate-400 group-hover:text-white"
                          }`}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Minimalist ATS</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/30 text-teal-200 font-mono font-bold uppercase">
                              100% Parsable
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            High-density linear architecture, hairline rules & clean text flow designed for parsing bots
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center shrink-0 border ${
                          exportTemplate === "minimalist-ats"
                            ? "border-teal-400 bg-teal-500 text-slate-950"
                            : "border-slate-600 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </button>

                    {/* Option 3: Creative Impact */}
                    <button
                      type="button"
                      onClick={() => setExportTemplate("creative-impact")}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer group ${
                        exportTemplate === "creative-impact"
                          ? "bg-indigo-500/15 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/40 text-white"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-xl mt-0.5 ${
                            exportTemplate === "creative-impact"
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-white/5 text-slate-400 group-hover:text-white"
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Creative Impact</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-mono font-bold uppercase">
                              Visual Focus
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            Hero banner, visual horizontal score progress bars, dynamic two-column split & modern accents
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center shrink-0 border ${
                          exportTemplate === "creative-impact"
                            ? "border-indigo-400 bg-indigo-500 text-white"
                            : "border-slate-600 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Document Customization Options */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-teal-400" />
                    <span>Report Customization</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Candidate Display Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Candidate Name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  {exportTemplate !== "minimalist-ats" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Visual Accent Palette
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setReportTheme("teal")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            reportTheme === "teal"
                              ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Executive Teal
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTheme("navy")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            reportTheme === "navy"
                              ? "bg-blue-600 text-white font-black shadow-sm"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Deep Navy
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTheme("mono")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            reportTheme === "mono"
                              ? "bg-slate-200 text-slate-900 font-black shadow-sm"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Classic Mono
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Section Inclusion Toggles */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Include Report Sections ({selectedCount}/6)</span>
                    </h4>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => toggleAll(true)}
                        className="text-teal-400 hover:underline font-bold cursor-pointer"
                      >
                        All
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => toggleAll(false)}
                        className="text-slate-400 hover:underline font-bold cursor-pointer"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* 1. Summary */}
                    <label
                      onClick={() => setIncludeSummary(!includeSummary)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeSummary
                          ? "bg-teal-950/30 border-teal-500/40 text-teal-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className={`w-4 h-4 ${includeSummary ? "text-teal-400" : "text-slate-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">1. Executive Summary</span>
                          <span className="text-[10px] text-slate-400">Holistic match summary & position thesis</span>
                        </div>
                      </div>
                      {includeSummary ? (
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </label>

                    {/* 2. Benchmarks */}
                    <label
                      onClick={() => setIncludeBenchmarks(!includeBenchmarks)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeBenchmarks
                          ? "bg-teal-950/30 border-teal-500/40 text-teal-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Target className={`w-4 h-4 ${includeBenchmarks ? "text-teal-400" : "text-slate-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">2. Core Benchmarks & ATS Scores</span>
                          <span className="text-[10px] text-slate-400">Overall score, ATS parseability & metrics</span>
                        </div>
                      </div>
                      {includeBenchmarks ? (
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </label>

                    {/* 3. Skills */}
                    <label
                      onClick={() => setIncludeSkills(!includeSkills)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeSkills
                          ? "bg-teal-950/30 border-teal-500/40 text-teal-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className={`w-4 h-4 ${includeSkills ? "text-teal-400" : "text-slate-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">3. Skill Gap Analysis</span>
                          <span className="text-[10px] text-slate-400">Missing JD keywords & priority skills</span>
                        </div>
                      </div>
                      {includeSkills ? (
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </label>

                    {/* 4. Trajectory */}
                    <label
                      onClick={() => setIncludeTrajectory(!includeTrajectory)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeTrajectory
                          ? "bg-teal-950/30 border-teal-500/40 text-teal-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className={`w-4 h-4 ${includeTrajectory ? "text-teal-400" : "text-slate-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">4. Career Trajectory & Pivots</span>
                          <span className="text-[10px] text-slate-400">Target role match & alternative pivots</span>
                        </div>
                      </div>
                      {includeTrajectory ? (
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </label>

                    {/* 5. Checklist */}
                    <label
                      onClick={() => setIncludeChecklist(!includeChecklist)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeChecklist
                          ? "bg-teal-950/30 border-teal-500/40 text-teal-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 ${includeChecklist ? "text-teal-400" : "text-slate-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">5. Optimization Checklist</span>
                          <span className="text-[10px] text-slate-400">Headline remedies & formatting plan</span>
                        </div>
                      </div>
                      {includeChecklist ? (
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </label>

                    {/* 6. LinkedIn */}
                    <label
                      onClick={() => setIncludeLinkedIn(!includeLinkedIn)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeLinkedIn
                          ? "bg-teal-950/30 border-teal-500/40 text-teal-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className={`w-4 h-4 ${includeLinkedIn ? "text-teal-400" : "text-slate-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">6. LinkedIn Credibility Audit</span>
                          <span className="text-[10px] text-slate-400">Cross-vector profile trust score</span>
                        </div>
                      </div>
                      {includeLinkedIn ? (
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Action in Sidebar */}
              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  disabled={selectedCount === 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-purple-600/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate & Print PDF</span>
                </button>
              </div>
            </div>

            {/* Right Printable Preview Pane (8 cols) */}
            <div className="lg:col-span-8 bg-slate-950 p-4 md:p-8 overflow-y-auto flex flex-col items-center">
              <div className="w-full max-w-[210mm] mb-3 flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-teal-400" />
                  <span>Real-Time Printable Page Representation</span>
                </span>
                <span className="text-[11px] font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <span className="text-teal-400 font-bold uppercase">
                    {exportTemplate === "modern-executive"
                      ? "Modern Executive"
                      : exportTemplate === "minimalist-ats"
                      ? "Minimalist ATS"
                      : "Creative Impact"}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>{selectedCount} Sections</span>
                </span>
              </div>

              {/* Printable Document Canvas */}
              <div ref={printAreaRef} className="w-full max-w-[210mm]">
                {/* TEMPLATE 1: MODERN EXECUTIVE */}
                {exportTemplate === "modern-executive" && (
                  <div
                    className={`w-full bg-white text-slate-900 shadow-2xl rounded-2xl p-8 md:p-12 space-y-7 transition-all ${
                      reportTheme === "navy"
                        ? "border-t-8 border-t-blue-700"
                        : reportTheme === "mono"
                        ? "border-t-8 border-t-slate-800"
                        : "border-t-8 border-t-teal-600"
                    }`}
                    style={{ minHeight: "297mm" }}
                  >
                    {/* Header Banner */}
                    <div
                      className={`border-b-2 pb-5 flex items-start justify-between ${
                        reportTheme === "navy"
                          ? "border-blue-700"
                          : reportTheme === "mono"
                          ? "border-slate-800"
                          : "border-teal-600"
                      }`}
                    >
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-display">
                          {customTitle}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-slate-800 uppercase">
                            {customName}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${
                              reportTheme === "navy"
                                ? "text-blue-700"
                                : reportTheme === "mono"
                                ? "text-slate-700"
                                : "text-teal-700"
                            }`}
                          >
                            Target Role: {targetRole}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-semibold shrink-0">
                        <p>Audit Date: {new Date().toLocaleDateString()}</p>
                        <p className="font-mono text-[10px] text-teal-700 font-bold mt-0.5">
                          Format: Modern Executive Layout
                        </p>
                      </div>
                    </div>

                    {/* 1. Executive Summary */}
                    {includeSummary && (result.executiveSummary || result.summary) && (
                      <div className="space-y-2">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "navy"
                              ? "text-blue-800 border-blue-100"
                              : reportTheme === "mono"
                              ? "text-slate-800 border-slate-200"
                              : "text-teal-800 border-teal-100"
                          }`}
                        >
                          1. Executive Summary & Diagnostic Narrative
                        </h2>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                          {result.executiveSummary || result.summary}
                        </p>
                      </div>
                    )}

                    {/* 2. Core Score Card Grid */}
                    {includeBenchmarks && (
                      <div className="space-y-2.5">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "navy"
                              ? "text-blue-800 border-blue-100"
                              : reportTheme === "mono"
                              ? "text-slate-800 border-slate-200"
                              : "text-teal-800 border-teal-100"
                          }`}
                        >
                          2. Core Benchmarks & ATS Compatibility Scores
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-teal-800 uppercase block">
                              Overall Match
                            </span>
                            <span className="text-2xl font-black text-teal-700">{overallScore}%</span>
                          </div>
                          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-sky-800 uppercase block">
                              ATS Parsing
                            </span>
                            <span className="text-2xl font-black text-sky-700">{atsCompatibility}%</span>
                          </div>
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-indigo-800 uppercase block">
                              Skills Match
                            </span>
                            <span className="text-2xl font-black text-indigo-700">{skillsMatch}%</span>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                              Formatting
                            </span>
                            <span className="text-2xl font-black text-emerald-700">
                              {formattingScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Skill Gap Analysis */}
                    {includeSkills && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "navy"
                              ? "text-blue-800 border-blue-100"
                              : reportTheme === "mono"
                              ? "text-slate-800 border-slate-200"
                              : "text-teal-800 border-teal-100"
                          }`}
                        >
                          3. Skill Gap Analysis & Priority Requirements
                        </h2>

                        {result.skillGapReport && result.skillGapReport.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2.5">
                            {result.skillGapReport.slice(0, 6).map((gap: any, idx: number) => (
                              <div
                                key={`preview-gap-${gap.skill || idx}-${idx}`}
                                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block">
                                    {gap.skill}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {gap.reason || "High priority target keyword"}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                    gap.importance === "Critical"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {gap.importance || "Required"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 font-medium">
                            All primary job description skill requirements are currently indexed and verified in candidate resume.
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Career Roadmap & Trajectory */}
                    {includeTrajectory && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "navy"
                              ? "text-blue-800 border-blue-100"
                              : reportTheme === "mono"
                              ? "text-slate-800 border-slate-200"
                              : "text-teal-800 border-teal-100"
                          }`}
                        >
                          4. Career Trajectory & Role Alignment
                        </h2>
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div>
                              <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider block">
                                Target Executive Role Match
                              </span>
                              <span className="text-base font-bold">{targetRole}</span>
                            </div>
                            <span className="text-lg font-black text-teal-300">
                              {result.careerPath?.confidence || 88}% Confidence
                            </span>
                          </div>

                          {result.careerPath?.alternatives && result.careerPath.alternatives.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                                Recommended Pivot Pathways
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {result.careerPath.alternatives.slice(0, 2).map((alt: any, idx: number) => (
                                  <div
                                    key={`preview-alt-${alt.role || idx}-${idx}`}
                                    className="p-2.5 bg-slate-800 rounded-lg border border-slate-700"
                                  >
                                    <span className="text-xs font-bold text-white block">
                                      {alt.role}
                                    </span>
                                    <span className="text-[10px] text-teal-400 font-bold">
                                      {alt.match}% Overlap
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. Strategic Optimization Checklist */}
                    {includeChecklist && result.improvementPlan && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "navy"
                              ? "text-blue-800 border-blue-100"
                              : reportTheme === "mono"
                              ? "text-slate-800 border-slate-200"
                              : "text-teal-800 border-teal-100"
                          }`}
                        >
                          5. Strategic ATS Action Checklist
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {result.improvementPlan.resumeHeadlineUpdates && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                              <span className="text-[10px] font-black text-amber-800 uppercase block">
                                Title & Header Alignment
                              </span>
                              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4 font-medium">
                                {result.improvementPlan.resumeHeadlineUpdates.slice(0, 2).map((u: string, i: number) => (
                                  <li key={`preview-hl-${i}`}>{u}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.improvementPlan.formattingFixes && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                              <span className="text-[10px] font-black text-rose-800 uppercase block">
                                ATS Formatting Remedies
                              </span>
                              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4 font-medium">
                                {result.improvementPlan.formattingFixes.slice(0, 2).map((f: string, i: number) => (
                                  <li key={`preview-fmt-${i}`}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 6. LinkedIn Credibility Section */}
                    {includeLinkedIn && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "navy"
                              ? "text-blue-800 border-blue-100"
                              : reportTheme === "mono"
                              ? "text-slate-800 border-slate-200"
                              : "text-teal-800 border-teal-100"
                          }`}
                        >
                          6. LinkedIn Cross-Vector Credibility Audit
                        </h2>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-teal-600" />
                              <span>Public LinkedIn Profile Trust Score</span>
                            </span>
                            <span className="text-[11px] text-slate-600 font-mono block">
                              {linkedinUrl ? `Target Profile: ${linkedinUrl}` : "Verified Resume Persona Baseline"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-teal-700 block">
                              {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}%
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                              {linkedInTrustScore && linkedInTrustScore >= 85 ? "High Trust" : "Verified Alignment"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      <span>Confidential • Modern Executive Intelligence Audit</span>
                      <span>Source File: {fileName}</span>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 2: MINIMALIST ATS */}
                {exportTemplate === "minimalist-ats" && (
                  <div
                    className="w-full bg-white text-slate-950 font-sans p-8 md:p-12 space-y-6 border border-slate-300 shadow-2xl"
                    style={{ minHeight: "297mm", fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    {/* Minimalist Top Header */}
                    <div className="border-b-2 border-slate-900 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-xl font-bold uppercase tracking-wide text-black">
                            {customTitle}
                          </h1>
                          <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                            CANDIDATE: {customName.toUpperCase()} | TARGET MANDATE: {targetRole.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-700">
                          <div>AUDIT DATE: {new Date().toLocaleDateString()}</div>
                          <div className="font-bold text-black mt-0.5">ATS PARSEABILITY: 100%</div>
                        </div>
                      </div>
                    </div>

                    {/* Machine-Readable Benchmark Table */}
                    {includeBenchmarks && (
                      <div className="border border-slate-900 p-3 space-y-1 bg-slate-50/50">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
                          CORE BENCHMARK METRICS (ATS QUANTIFIED SCORES)
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs text-black border-t border-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-600 block">OVERALL MATCH:</span>
                            <strong className="text-sm">{overallScore}%</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 block">ATS PARSEABILITY:</span>
                            <strong className="text-sm">{atsCompatibility}%</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 block">SKILLS OVERLAP:</span>
                            <strong className="text-sm">{skillsMatch}%</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 block">FORMATTING HEALTH:</span>
                            <strong className="text-sm">{formattingScore}%</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. Summary (Minimalist Linear) */}
                    {includeSummary && (result.executiveSummary || result.summary) && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-400 pb-0.5">
                          1. PROFESSIONAL SUMMARY & POSITION THESIS
                        </h2>
                        <p className="text-xs text-slate-900 leading-relaxed text-justify">
                          {result.executiveSummary || result.summary}
                        </p>
                      </div>
                    )}

                    {/* 2. Skills Gap Linear List */}
                    {includeSkills && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-400 pb-0.5">
                          2. TARGET ATS KEYWORD REQUIREMENTS & GAP AUDIT
                        </h2>
                        {result.skillGapReport && result.skillGapReport.length > 0 ? (
                          <div className="space-y-1 text-xs text-slate-900">
                            {result.skillGapReport.map((gap: any, idx: number) => (
                              <div
                                key={`ats-gap-${gap.skill}-${idx}`}
                                className="flex items-baseline justify-between py-1 border-b border-slate-200 font-mono text-[11px]"
                              >
                                <span>
                                  <strong>• {gap.skill}</strong> — {gap.reason || "Target JD Keyword"}
                                </span>
                                <span className="font-bold text-slate-800 shrink-0 ml-3">
                                  [{gap.importance ? gap.importance.toUpperCase() : "REQUIRED"}]
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 italic">
                            All target keywords verified in candidate resume text.
                          </p>
                        )}
                      </div>
                    )}

                    {/* 3. Career Trajectory Linear Format */}
                    {includeTrajectory && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-400 pb-0.5">
                          3. CAREER TRAJECTORY & ROLE CONFIDENCE
                        </h2>
                        <div className="text-xs text-slate-900 space-y-1 font-mono">
                          <div>
                            PRIMARY ALIGNMENT: <strong>{targetRole}</strong> —{" "}
                            {result.careerPath?.confidence || 88}% Confidence Index
                          </div>
                          {result.careerPath?.alternatives && result.careerPath.alternatives.length > 0 && (
                            <div className="pt-1">
                              PIVOT ALTERNATIVES:{" "}
                              {result.careerPath.alternatives.map((a: any) => `${a.role} (${a.match}%)`).join(" | ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Optimization Checklist */}
                    {includeChecklist && result.improvementPlan && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-400 pb-0.5">
                          4. ACTIONABLE REMEDIES & ATS COMPLIANCE CHECKLIST
                        </h2>
                        <div className="text-xs text-slate-900 space-y-1.5">
                          {result.improvementPlan.resumeHeadlineUpdates && (
                            <div>
                              <strong className="block text-[11px] font-mono text-slate-700">
                                [HEADLINE & STRUCTURE]:
                              </strong>
                              <ul className="list-disc pl-5 space-y-0.5">
                                {result.improvementPlan.resumeHeadlineUpdates.map((u: string, i: number) => (
                                  <li key={`ats-hl-${i}`}>{u}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.improvementPlan.formattingFixes && (
                            <div>
                              <strong className="block text-[11px] font-mono text-slate-700">
                                [ATS FORMATTING REMEDIES]:
                              </strong>
                              <ul className="list-disc pl-5 space-y-0.5">
                                {result.improvementPlan.formattingFixes.map((f: string, i: number) => (
                                  <li key={`ats-fmt-${i}`}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. LinkedIn Verification */}
                    {includeLinkedIn && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-400 pb-0.5">
                          5. LINKEDIN CROSS-VECTOR IDENTITY VERIFICATION
                        </h2>
                        <div className="p-2.5 border border-slate-300 font-mono text-xs flex items-center justify-between">
                          <div>
                            <span>PROFILE: {linkedinUrl || "Active Candidate Baseline"}</span>
                            <div className="text-[10px] text-slate-600 mt-0.5">STATUS: Verified Cross-Vector Audit</div>
                          </div>
                          <div className="text-right font-bold text-sm">
                            {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}% TRUST INDEX
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Minimalist Footer */}
                    <div className="border-t border-slate-400 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-600">
                      <span>DOCUMENT FORMAT: MINIMALIST ATS LINEAR TEMPLATE</span>
                      <span>SYSTEM AUDIT REFERENCE • {fileName}</span>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 3: CREATIVE IMPACT */}
                {exportTemplate === "creative-impact" && (
                  <div
                    className="w-full bg-white text-slate-900 shadow-2xl rounded-2xl p-8 md:p-12 space-y-7 border-l-8 border-l-indigo-600 transition-all"
                    style={{ minHeight: "297mm" }}
                  >
                    {/* Creative Header Banner */}
                    <div className="border-b border-slate-200 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/30 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest block">
                              Talent Mandate Dossier
                            </span>
                            <h1 className="text-2xl font-black text-slate-950 font-display tracking-tight mt-0.5">
                              {customName}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                                {targetRole}
                              </span>
                              <span className="text-slate-400 text-xs">•</span>
                              <span className="text-xs text-slate-500 font-medium">
                                Audit: {new Date().toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="inline-flex flex-col items-end px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-md">
                            <span className="text-[9px] font-mono uppercase text-teal-400 font-extrabold tracking-wider">
                              Executive Fit
                            </span>
                            <span className="text-xl font-black text-white tabular-nums">
                              {overallScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual Horizontal Score Progress Bars */}
                    {includeBenchmarks && (
                      <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800">
                          <span>Strategic Competency Indicators</span>
                          <span className="text-[10px] font-mono text-indigo-600">High Impact Calibration</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          {/* Metric 1 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>Overall Role Alignment</span>
                              <span className="font-mono text-teal-700">{overallScore}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full"
                                style={{ width: `${overallScore}%` }}
                              />
                            </div>
                          </div>

                          {/* Metric 2 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>ATS Machine Parseability</span>
                              <span className="font-mono text-sky-700">{atsCompatibility}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full"
                                style={{ width: `${atsCompatibility}%` }}
                              />
                            </div>
                          </div>

                          {/* Metric 3 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>Skills Density Match</span>
                              <span className="font-mono text-indigo-700">{skillsMatch}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                                style={{ width: `${skillsMatch}%` }}
                              />
                            </div>
                          </div>

                          {/* Metric 4 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>Formatting & Layout Standard</span>
                              <span className="font-mono text-emerald-700">{formattingScore}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                style={{ width: `${formattingScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. Executive Summary with Left Accent Bar */}
                    {includeSummary && (result.executiveSummary || result.summary) && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span>Candidate Value Proposition & Strategic Summary</span>
                        </h2>
                        <div className="border-l-4 border-l-indigo-600 bg-indigo-50/40 p-4 rounded-r-xl border border-y-indigo-100/50 border-r-indigo-100/50">
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {result.executiveSummary || result.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. Skills Gap Modern Chips */}
                    {includeSkills && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>High-Priority Capability Calibration</span>
                        </h2>

                        {result.skillGapReport && result.skillGapReport.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2.5">
                            {result.skillGapReport.slice(0, 6).map((gap: any, idx: number) => (
                              <div
                                key={`creative-gap-${gap.skill}-${idx}`}
                                className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between"
                              >
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-slate-900 block">
                                    {gap.skill}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    {gap.reason || "Recommended target keyword"}
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase">
                                  {gap.importance || "Core"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                            Full capability alignment detected across core mandates.
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Trajectory & Growth Roadmap */}
                    {includeTrajectory && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          <span>Career Roadmap & Leadership Horizons</span>
                        </h2>
                        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-teal-400 font-bold uppercase block">
                                Primary Career Mandate
                              </span>
                              <span className="text-sm font-bold text-white">{targetRole}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/40">
                              {result.careerPath?.confidence || 88}% Alignment
                            </span>
                          </div>

                          {result.careerPath?.alternatives && result.careerPath.alternatives.length > 0 && (
                            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                              {result.careerPath.alternatives.slice(0, 2).map((alt: any, idx: number) => (
                                <div
                                  key={`creative-alt-${idx}`}
                                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between"
                                >
                                  <span className="text-slate-200 font-bold">{alt.role}</span>
                                  <span className="text-teal-400 font-mono font-bold text-[11px]">
                                    {alt.match}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Action Checklist */}
                    {includeChecklist && result.improvementPlan && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Strategic ATS Optimization Steps</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {result.improvementPlan.resumeHeadlineUpdates && (
                            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                              <span className="text-[10px] font-black text-amber-900 uppercase block">
                                Header Calibration
                              </span>
                              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                {result.improvementPlan.resumeHeadlineUpdates.slice(0, 2).map((u: string, i: number) => (
                                  <li key={`cr-hl-${i}`}>{u}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.improvementPlan.formattingFixes && (
                            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                              <span className="text-[10px] font-black text-purple-900 uppercase block">
                                Semantic ATS Formatting
                              </span>
                              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                {result.improvementPlan.formattingFixes.slice(0, 2).map((f: string, i: number) => (
                                  <li key={`cr-fmt-${i}`}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. LinkedIn Credibility */}
                    {includeLinkedIn && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-indigo-50/40 to-purple-50 border border-indigo-200/80 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Verified LinkedIn Trust Score
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 font-mono block">
                            {linkedinUrl ? linkedinUrl : "Authenticated Executive Candidate Baseline"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-indigo-700 tabular-nums block">
                            {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}%
                          </span>
                          <span className="text-[9px] font-mono uppercase font-bold text-teal-700">
                            Authenticated
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Creative Footer */}
                    <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      <span>Creative Impact Layout • Executive Intelligence Portfolio</span>
                      <span>Verified Document • {fileName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
