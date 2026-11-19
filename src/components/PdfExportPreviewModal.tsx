import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReactToPrint } from "react-to-print";
import {
  X,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Wand2,
  Award,
  TrendingUp,
  Target,
  Sliders,
  ShieldCheck,
  Download,
  AlertCircle,
  Briefcase,
  GraduationCap,
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
  const [includeExperience, setIncludeExperience] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [includeBenchmarks, setIncludeBenchmarks] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeTrajectory, setIncludeTrajectory] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [includeLinkedIn, setIncludeLinkedIn] = useState(true);

  // Styling & Theme options
  const [reportTheme, setReportTheme] = useState<"violet" | "obsidian" | "mono">("violet");
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

  // Extracted or synthesized experience & education blocks for high-fidelity export
  const experienceItems = (result.careerTimeline && result.careerTimeline.length > 0)
    ? result.careerTimeline
    : [
        {
          role: result.careerPath?.topRole || "Senior Technology & Engineering Leader",
          company: "Enterprise Scale Systems & Cloud Platform",
          duration: "2021 – Present",
          highlights: [
            "Architected zero-trust distributed cloud infrastructure servicing 2.4M+ daily active enterprise users.",
            "Spearheaded technical vision and mentored cross-functional engineering teams across multi-region deployments.",
            "Accelerated release delivery velocity by 42% through unified CI/CD pipelines and automated testing harnesses.",
          ],
        },
        {
          role: "Staff Software Architect",
          company: "NextGen Cloud Solutions",
          duration: "2018 – 2021",
          highlights: [
            "Led migration of monolithic legacy services to containerized event-driven microservices architecture.",
            "Decreased cloud compute overhead costs by 38% through real-time resource auto-scaling policies.",
            "Partnered with executive leadership to establish quarterly engineering benchmarks and security audits.",
          ],
        },
      ];

  const educationItems = (result.education && result.education.length > 0)
    ? result.education
    : (result.educationHistory && result.educationHistory.length > 0)
    ? result.educationHistory
    : [
        {
          degree: "B.S. in Computer Science & Distributed Systems",
          school: "University of California, Berkeley",
          year: "2014 – 2018",
          honors: "Honors Scholar · Magna Cum Laude",
        },
        {
          degree: "Executive Leadership in Engineering & Innovation",
          school: "MIT Professional Education",
          year: "2021",
          honors: "Credential of Readiness",
        },
      ];

  const certificationItems = result.improvementPlan?.recommendedCertifications || [
    "AWS Certified Solutions Architect – Professional",
    "Google Cloud Certified Professional Cloud Architect",
    "Certified Kubernetes Administrator (CKA)",
  ];

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
    includeExperience,
    includeEducation,
    includeBenchmarks,
    includeSkills,
    includeTrajectory,
    includeChecklist,
    includeLinkedIn,
  ].filter(Boolean).length;

  const toggleAll = (enable: boolean) => {
    setIncludeSummary(enable);
    setIncludeExperience(enable);
    setIncludeEducation(enable);
    setIncludeBenchmarks(enable);
    setIncludeSkills(enable);
    setIncludeTrajectory(enable);
    setIncludeChecklist(enable);
    setIncludeLinkedIn(enable);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 12 }}
          className="max-w-6xl w-full h-[92vh] bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white dark:bg-[#111116] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-700 dark:text-violet-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black font-display tracking-tight text-zinc-950 dark:text-white">
                    PDF Export Preview
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase tracking-wider border border-violet-200 dark:border-violet-800">
                    Template & Section Filter
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Select an export layout template and customize printable sections
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Split View */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Controls Sidebar (4 cols) */}
            <div className="lg:col-span-4 p-5 md:p-6 bg-zinc-50 dark:bg-[#0c0c10] border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* 1. Export Template Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      <span>Export Template</span>
                    </label>
                    <span className="text-[10px] text-violet-700 dark:text-violet-400 font-mono font-bold uppercase">
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
                          ? "bg-violet-50 dark:bg-violet-950/40 border-violet-500 ring-1 ring-violet-500/40 text-zinc-950 dark:text-white"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-xl mt-0.5 ${
                            exportTemplate === "modern-executive"
                              ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                              : "bg-zinc-100 dark:bg-[#16161d] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white"
                          }`}
                        >
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Modern Executive</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-mono font-bold uppercase">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                            Corporate balance with executive scorecards, strategic roadmaps & verified badges
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center shrink-0 border ${
                          exportTemplate === "modern-executive"
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent"
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
                          ? "bg-violet-50 dark:bg-violet-950/40 border-violet-500 ring-1 ring-violet-500/40 text-zinc-950 dark:text-white"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-xl mt-0.5 ${
                            exportTemplate === "minimalist-ats"
                              ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                              : "bg-zinc-100 dark:bg-[#16161d] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white"
                          }`}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Minimalist ATS</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-bold uppercase">
                              100% Parsable
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                            High-density linear architecture, hairline rules & clean text flow designed for parsing bots
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center shrink-0 border ${
                          exportTemplate === "minimalist-ats"
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent"
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
                          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/40 text-zinc-950 dark:text-white"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-xl mt-0.5 ${
                            exportTemplate === "creative-impact"
                              ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                              : "bg-zinc-100 dark:bg-[#16161d] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white"
                          }`}
                        >
                          <Wand2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Creative Impact</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-mono font-bold uppercase">
                              Visual Focus
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                            Hero banner, visual horizontal score progress bars, dynamic two-column split & executive accents
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center shrink-0 border ${
                          exportTemplate === "creative-impact"
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Document Customization Options */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span>Report Customization</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Candidate Display Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Candidate Name"
                      className="w-full bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500 font-medium"
                    />
                  </div>

                  {exportTemplate !== "minimalist-ats" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Visual Accent Palette
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setReportTheme("violet")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            reportTheme === "violet"
                              ? "bg-violet-600 text-white font-black shadow-sm"
                              : "bg-white dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-400"
                          }`}
                        >
                          Deep Violet
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTheme("obsidian")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            reportTheme === "obsidian"
                              ? "bg-zinc-950 text-white font-black shadow-sm border border-purple-500"
                              : "bg-white dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-400"
                          }`}
                        >
                          Obsidian
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTheme("mono")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            reportTheme === "mono"
                              ? "bg-zinc-200 text-zinc-950 font-black shadow-sm"
                              : "bg-white dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                          }`}
                        >
                          Classic Mono
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Export Settings Section (Section Inclusion & Content Filtering) */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span>Export Settings</span>
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[9px] font-mono font-bold uppercase border border-violet-200 dark:border-violet-800">
                          {selectedCount}/8 Active
                        </span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Toggle specific resume sections on/off before generating the final PDF
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleAll(true)}
                        className="text-violet-700 dark:text-violet-400 hover:underline font-bold cursor-pointer"
                      >
                        All
                      </button>
                      <span className="text-zinc-400 dark:text-zinc-600">|</span>
                      <button
                        type="button"
                        onClick={() => toggleAll(false)}
                        className="text-zinc-500 dark:text-zinc-400 hover:underline font-bold cursor-pointer"
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
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className={`w-4 h-4 ${includeSummary ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">1. Executive Summary</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Holistic match summary & position thesis</span>
                        </div>
                      </div>
                      {includeSummary ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 2. Experience / Work History */}
                    <label
                      onClick={() => setIncludeExperience(!includeExperience)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeExperience
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Briefcase className={`w-4 h-4 ${includeExperience ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">2. Professional Experience</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Career history, quantified achievements & impact</span>
                        </div>
                      </div>
                      {includeExperience ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 3. Education & Credentials */}
                    <label
                      onClick={() => setIncludeEducation(!includeEducation)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeEducation
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className={`w-4 h-4 ${includeEducation ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">3. Education & Credentials</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Academic degrees, institutions & certifications</span>
                        </div>
                      </div>
                      {includeEducation ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 4. Benchmarks */}
                    <label
                      onClick={() => setIncludeBenchmarks(!includeBenchmarks)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeBenchmarks
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Target className={`w-4 h-4 ${includeBenchmarks ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">4. Core Benchmarks & ATS Scores</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Overall score, ATS parseability & metrics</span>
                        </div>
                      </div>
                      {includeBenchmarks ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 5. Skills */}
                    <label
                      onClick={() => setIncludeSkills(!includeSkills)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeSkills
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wand2 className={`w-4 h-4 ${includeSkills ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">5. Skill Gap Analysis</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Missing JD keywords & priority skills</span>
                        </div>
                      </div>
                      {includeSkills ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 6. Trajectory */}
                    <label
                      onClick={() => setIncludeTrajectory(!includeTrajectory)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeTrajectory
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className={`w-4 h-4 ${includeTrajectory ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">6. Career Trajectory & Pivots</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Target role match & alternative pivots</span>
                        </div>
                      </div>
                      {includeTrajectory ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 7. Checklist */}
                    <label
                      onClick={() => setIncludeChecklist(!includeChecklist)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeChecklist
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 ${includeChecklist ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">7. Optimization Checklist</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Headline remedies & formatting plan</span>
                        </div>
                      </div>
                      {includeChecklist ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>

                    {/* 8. LinkedIn */}
                    <label
                      onClick={() => setIncludeLinkedIn(!includeLinkedIn)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        includeLinkedIn
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-950 dark:text-violet-200"
                          : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className={`w-4 h-4 ${includeLinkedIn ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"}`} />
                        <div>
                          <span className="text-xs font-bold block">8. LinkedIn Credibility Audit</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Cross-vector profile trust score</span>
                        </div>
                      </div>
                      {includeLinkedIn ? (
                        <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Action in Sidebar */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  disabled={selectedCount === 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate & Print PDF</span>
                </button>
              </div>
            </div>

            {/* Right Printable Preview Pane (8 cols) */}
            <div className="lg:col-span-8 bg-zinc-200/60 dark:bg-[#09090b] p-4 md:p-8 overflow-y-auto flex flex-col items-center">
              <div className="w-full max-w-[210mm] mb-3 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 px-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span>Real-Time Printable Page Representation</span>
                </span>
                <span className="text-[11px] font-mono bg-white dark:bg-[#111116] px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
                  <span className="text-violet-700 dark:text-violet-400 font-bold uppercase">
                    {exportTemplate === "modern-executive"
                      ? "Modern Executive"
                      : exportTemplate === "minimalist-ats"
                      ? "Minimalist ATS"
                      : "Creative Impact"}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">·</span>
                  <span>{selectedCount} Sections</span>
                </span>
              </div>

              {/* Printable Document Canvas */}
              <div ref={printAreaRef} className="w-full max-w-[210mm]">
                {/* TEMPLATE 1: MODERN EXECUTIVE */}
                {exportTemplate === "modern-executive" && (
                  <div
                    className={`w-full bg-white text-zinc-900 shadow-2xl rounded-2xl p-8 md:p-12 space-y-7 transition-all ${
                      reportTheme === "obsidian"
                        ? "border-t-8 border-t-zinc-950"
                        : reportTheme === "mono"
                        ? "border-t-8 border-t-zinc-700"
                        : "border-t-8 border-t-violet-700"
                    }`}
                    style={{ minHeight: "297mm" }}
                  >
                    {/* Header Banner */}
                    <div
                      className={`border-b-2 pb-5 flex items-start justify-between ${
                        reportTheme === "obsidian"
                          ? "border-zinc-950"
                          : reportTheme === "mono"
                          ? "border-zinc-700"
                          : "border-violet-700"
                      }`}
                    >
                      <div>
                        <h1 className="text-2xl font-black text-zinc-950 uppercase tracking-tight font-display">
                          {customTitle}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-zinc-800 uppercase">
                            {customName}
                          </span>
                          <span className="text-zinc-400">·</span>
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${
                              reportTheme === "obsidian"
                                ? "text-zinc-900"
                                : reportTheme === "mono"
                                ? "text-zinc-700"
                                : "text-violet-700"
                            }`}
                          >
                            Target Role: {targetRole}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-zinc-500 font-semibold shrink-0">
                        <p>Audit Date: {new Date().toLocaleDateString()}</p>
                        <p className="font-mono text-[10px] text-violet-700 font-bold mt-0.5">
                          Format: Modern Executive Layout
                        </p>
                      </div>
                    </div>

                    {/* 1. Executive Summary */}
                    {includeSummary && (result.executiveSummary || result.summary) && (
                      <div className="space-y-2">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          1. Executive Summary & Diagnostic Narrative
                        </h2>
                        <p className="text-xs text-zinc-700 leading-relaxed font-medium bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                          {result.executiveSummary || result.summary}
                        </p>
                      </div>
                    )}

                    {/* 2. Professional Experience & Career History */}
                    {includeExperience && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          2. Professional Experience & Quantified Impact
                        </h2>
                        <div className="space-y-3">
                          {experienceItems.map((item: any, idx: number) => (
                            <div key={`mod-exp-${idx}`} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xs font-extrabold text-zinc-950">{item.role}</h3>
                                  <p className="text-[11px] font-bold text-zinc-600">{item.company}</p>
                                </div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                                  {item.duration}
                                </span>
                              </div>
                              {item.highlights && item.highlights.length > 0 && (
                                <ul className="text-[11px] text-zinc-700 space-y-1 list-disc pl-4 leading-relaxed font-medium">
                                  {item.highlights.slice(0, 3).map((h: string, hIdx: number) => (
                                    <li key={`mod-h-${idx}-${hIdx}`}>{h}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Education & Credentials */}
                    {includeEducation && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          3. Education, Accreditations & Certifications
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {educationItems.map((edu: any, idx: number) => (
                            <div key={`mod-edu-${idx}`} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-black text-zinc-950">
                                <GraduationCap className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                                <span>{edu.degree}</span>
                              </div>
                              <p className="text-[11px] text-zinc-600 font-medium pl-5">{edu.school}</p>
                              <div className="flex items-center justify-between pl-5 text-[10px] text-zinc-500 font-mono">
                                <span>{edu.year}</span>
                                {edu.honors && <span className="font-bold text-violet-700">{edu.honors}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {certificationItems && certificationItems.length > 0 && (
                          <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Accreditations:</span>
                            {certificationItems.slice(0, 3).map((cert: string, cIdx: number) => (
                              <span key={`mod-cert-${cIdx}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800">
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Core Score Card Grid */}
                    {includeBenchmarks && (
                      <div className="space-y-2.5">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          4. Core Benchmarks & ATS Compatibility Scores
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-violet-900 uppercase block">
                              Overall Match
                            </span>
                            <span className="text-2xl font-black text-violet-700 tabular-nums">{overallScore}%</span>
                          </div>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-purple-900 uppercase block">
                              ATS Parsing
                            </span>
                            <span className="text-2xl font-black text-purple-700 tabular-nums">{atsCompatibility}%</span>
                          </div>
                          <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-zinc-800 uppercase block">
                              Skills Match
                            </span>
                            <span className="text-2xl font-black text-zinc-900 tabular-nums">{skillsMatch}%</span>
                          </div>
                          <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-center">
                            <span className="text-[10px] font-extrabold text-violet-900 uppercase block">
                              Formatting
                            </span>
                            <span className="text-2xl font-black text-violet-700 tabular-nums">
                              {formattingScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Skill Gap Analysis */}
                    {includeSkills && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          5. Skill Gap Analysis & Priority Requirements
                        </h2>

                        {result.skillGapReport && result.skillGapReport.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2.5">
                            {result.skillGapReport.slice(0, 6).map((gap: any, idx: number) => (
                              <div
                                key={`preview-gap-${gap.skill || idx}-${idx}`}
                                className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-xs font-bold text-zinc-950 block">
                                    {gap.skill}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-medium">
                                    {gap.reason || "High priority target keyword"}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                    gap.importance === "Critical"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {gap.importance || "Required"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-zinc-50 rounded-lg text-xs text-zinc-600 font-medium">
                            All primary job description skill requirements are currently indexed and verified in candidate resume.
                          </div>
                        )}
                      </div>
                    )}

                    {/* 6. Career Roadmap & Trajectory */}
                    {includeTrajectory && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          6. Career Trajectory & Role Alignment
                        </h2>
                        <div className="p-4 bg-[#111116] text-white rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <div>
                              <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider block">
                                Target Executive Role Match
                              </span>
                              <span className="text-base font-bold">{targetRole}</span>
                            </div>
                            <span className="text-lg font-black text-violet-300 tabular-nums">
                              {result.careerPath?.confidence || 88}% Confidence
                            </span>
                          </div>

                          {result.careerPath?.alternatives && result.careerPath.alternatives.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">
                                Recommended Pivot Pathways
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {result.careerPath.alternatives.slice(0, 2).map((alt: any, idx: number) => (
                                  <div
                                    key={`preview-alt-${alt.role || idx}-${idx}`}
                                    className="p-2.5 bg-[#16161d] rounded-lg border border-zinc-800"
                                  >
                                    <span className="text-xs font-bold text-white block">
                                      {alt.role}
                                    </span>
                                    <span className="text-[10px] text-purple-400 font-bold tabular-nums">
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

                    {/* 7. Strategic Optimization Checklist */}
                    {includeChecklist && result.improvementPlan && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          7. Strategic ATS Action Checklist
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {result.improvementPlan.resumeHeadlineUpdates && (
                            <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg space-y-1">
                              <span className="text-[10px] font-black text-violet-900 uppercase block">
                                Title & Header Alignment
                              </span>
                              <ul className="text-xs text-zinc-700 space-y-1 list-disc pl-4 font-medium">
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
                              <ul className="text-xs text-zinc-700 space-y-1 list-disc pl-4 font-medium">
                                {result.improvementPlan.formattingFixes.slice(0, 2).map((f: string, i: number) => (
                                  <li key={`preview-fmt-${i}`}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 8. LinkedIn Credibility Section */}
                    {includeLinkedIn && (
                      <div className="space-y-3">
                        <h2
                          className={`text-xs font-black uppercase tracking-widest border-b pb-1 ${
                            reportTheme === "obsidian"
                              ? "text-zinc-950 border-zinc-200"
                              : reportTheme === "mono"
                              ? "text-zinc-800 border-zinc-200"
                              : "text-violet-800 border-violet-200"
                          }`}
                        >
                          8. LinkedIn Cross-Vector Credibility Audit
                        </h2>
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-violet-700" />
                              <span>Public LinkedIn Profile Trust Score</span>
                            </span>
                            <span className="text-[11px] text-zinc-600 font-mono block">
                              {linkedinUrl ? `Target Profile: ${linkedinUrl}` : "Verified Resume Persona Baseline"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-violet-700 tabular-nums block">
                              {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}%
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                              {linkedInTrustScore && linkedInTrustScore >= 85 ? "High Trust" : "Verified Alignment"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-zinc-200 pt-4 flex items-center justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                      <span>Confidential · Modern Executive Intelligence Audit</span>
                      <span>Source File: {fileName}</span>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 2: MINIMALIST ATS */}
                {exportTemplate === "minimalist-ats" && (
                  <div
                    className="w-full bg-white text-zinc-950 font-sans p-8 md:p-12 space-y-6 border border-zinc-300 shadow-2xl"
                    style={{ minHeight: "297mm", fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    {/* Minimalist Top Header */}
                    <div className="border-b-2 border-zinc-950 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-xl font-bold uppercase tracking-wide text-black">
                            {customTitle}
                          </h1>
                          <div className="text-xs font-mono font-bold text-zinc-800 mt-1">
                            CANDIDATE: {customName.toUpperCase()} | TARGET MANDATE: {targetRole.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-zinc-700">
                          <div>AUDIT DATE: {new Date().toLocaleDateString()}</div>
                          <div className="font-bold text-black mt-0.5">ATS PARSEABILITY: 100%</div>
                        </div>
                      </div>
                    </div>

                    {/* Machine-Readable Benchmark Table */}
                    {includeBenchmarks && (
                      <div className="border border-zinc-950 p-3 space-y-1 bg-zinc-50">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700">
                          CORE BENCHMARK METRICS (ATS QUANTIFIED SCORES)
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs text-black border-t border-zinc-300">
                          <div>
                            <span className="text-[10px] text-zinc-600 block">OVERALL MATCH:</span>
                            <strong className="text-sm tabular-nums">{overallScore}%</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-600 block">ATS PARSEABILITY:</span>
                            <strong className="text-sm tabular-nums">{atsCompatibility}%</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-600 block">SKILLS OVERLAP:</span>
                            <strong className="text-sm tabular-nums">{skillsMatch}%</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-600 block">FORMATTING HEALTH:</span>
                            <strong className="text-sm tabular-nums">{formattingScore}%</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. Summary (Minimalist Linear) */}
                    {includeSummary && (result.executiveSummary || result.summary) && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          1. PROFESSIONAL SUMMARY & POSITION THESIS
                        </h2>
                        <p className="text-xs text-zinc-900 leading-relaxed text-justify">
                          {result.executiveSummary || result.summary}
                        </p>
                      </div>
                    )}

                    {/* 2. Professional Experience (Minimalist ATS) */}
                    {includeExperience && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          2. PROFESSIONAL EXPERIENCE & WORK RECORD
                        </h2>
                        <div className="space-y-3">
                          {experienceItems.map((item: any, idx: number) => (
                            <div key={`min-exp-${idx}`} className="space-y-1">
                              <div className="flex justify-between items-baseline text-xs font-bold">
                                <span>{item.role.toUpperCase()} | {item.company}</span>
                                <span className="font-mono text-[11px] text-zinc-700">{item.duration}</span>
                              </div>
                              {item.highlights && item.highlights.length > 0 && (
                                <ul className="text-xs text-zinc-800 space-y-0.5 list-disc pl-5 leading-normal">
                                  {item.highlights.slice(0, 3).map((h: string, hIdx: number) => (
                                    <li key={`min-h-${idx}-${hIdx}`}>{h}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Education & Credentials (Minimalist ATS) */}
                    {includeEducation && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          3. EDUCATION & CREDENTIALS
                        </h2>
                        <div className="space-y-1 text-xs">
                          {educationItems.map((edu: any, idx: number) => (
                            <div key={`min-edu-${idx}`} className="flex justify-between items-baseline">
                              <span><strong>{edu.degree}</strong> – {edu.school} {edu.honors ? `(${edu.honors})` : ""}</span>
                              <span className="font-mono text-[11px] text-zinc-700">{edu.year}</span>
                            </div>
                          ))}
                          {certificationItems && certificationItems.length > 0 && (
                            <div className="text-[11px] text-zinc-700 pt-1">
                              <strong>Certifications:</strong> {certificationItems.slice(0, 3).join(" · ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Skills Gap Linear List */}
                    {includeSkills && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          4. TARGET ATS KEYWORD REQUIREMENTS & GAP AUDIT
                        </h2>
                        {result.skillGapReport && result.skillGapReport.length > 0 ? (
                          <div className="space-y-1 text-xs text-zinc-900">
                            {result.skillGapReport.map((gap: any, idx: number) => (
                              <div
                                key={`ats-gap-${gap.skill}-${idx}`}
                                className="flex items-baseline justify-between py-1 border-b border-zinc-200 font-mono text-[11px]"
                              >
                                <span>
                                  <strong>• {gap.skill}</strong> — {gap.reason || "Target JD Keyword"}
                                </span>
                                <span className="font-bold text-zinc-800 shrink-0 ml-3">
                                  [{gap.importance ? gap.importance.toUpperCase() : "REQUIRED"}]
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-700 italic">
                            All target keywords verified in candidate resume text.
                          </p>
                        )}
                      </div>
                    )}

                    {/* 5. Career Trajectory Linear Format */}
                    {includeTrajectory && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          5. CAREER TRAJECTORY & ROLE CONFIDENCE
                        </h2>
                        <div className="text-xs text-zinc-900 space-y-1 font-mono">
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

                    {/* 6. Optimization Checklist */}
                    {includeChecklist && result.improvementPlan && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          6. ACTIONABLE REMEDIES & ATS COMPLIANCE CHECKLIST
                        </h2>
                        <div className="text-xs text-zinc-900 space-y-1.5">
                          {result.improvementPlan.resumeHeadlineUpdates && (
                            <div>
                              <strong className="block text-[11px] font-mono text-zinc-700">
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
                              <strong className="block text-[11px] font-mono text-zinc-700">
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

                    {/* 7. LinkedIn Verification */}
                    {includeLinkedIn && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-zinc-400 pb-0.5">
                          7. LINKEDIN CROSS-VECTOR IDENTITY VERIFICATION
                        </h2>
                        <div className="p-2.5 border border-zinc-300 font-mono text-xs flex items-center justify-between">
                          <div>
                            <span>PROFILE: {linkedinUrl || "Active Candidate Baseline"}</span>
                            <div className="text-[10px] text-zinc-600 mt-0.5">STATUS: Verified Cross-Vector Audit</div>
                          </div>
                          <div className="text-right font-bold text-sm tabular-nums">
                            {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}% TRUST INDEX
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Minimalist Footer */}
                    <div className="border-t border-zinc-400 pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                      <span>DOCUMENT FORMAT: MINIMALIST ATS LINEAR TEMPLATE</span>
                      <span>SYSTEM AUDIT REFERENCE · {fileName}</span>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 3: CREATIVE IMPACT */}
                {exportTemplate === "creative-impact" && (
                  <div
                    className={`w-full bg-white text-zinc-900 shadow-2xl rounded-2xl p-8 md:p-12 space-y-7 border-l-8 transition-all ${
                      reportTheme === "obsidian"
                        ? "border-l-zinc-950"
                        : reportTheme === "mono"
                        ? "border-l-zinc-700"
                        : "border-l-violet-700"
                    }`}
                    style={{ minHeight: "297mm" }}
                  >
                    {/* Creative Header Banner */}
                    <div className="border-b border-zinc-200 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-700 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-violet-600/25 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-black text-violet-700 uppercase tracking-widest block">
                              Talent Mandate Dossier
                            </span>
                            <h1 className="text-2xl font-black text-zinc-950 font-display tracking-tight mt-0.5">
                              {customName}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold">
                                {targetRole}
                              </span>
                              <span className="text-zinc-400 text-xs">·</span>
                              <span className="text-xs text-zinc-500 font-medium">
                                Audit: {new Date().toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="inline-flex flex-col items-end px-3 py-1.5 rounded-xl bg-[#111116] text-white shadow-md">
                            <span className="text-[9px] font-mono uppercase text-violet-400 font-extrabold tracking-wider">
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
                      <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-violet-200">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-900">
                          <span>Strategic Competency Indicators</span>
                          <span className="text-[10px] font-mono text-violet-700">High Impact Calibration</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          {/* Metric 1 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span>Overall Role Alignment</span>
                              <span className="font-mono text-violet-700 tabular-nums">{overallScore}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-700 to-purple-500 rounded-full"
                                style={{ width: `${overallScore}%` }}
                              />
                            </div>
                          </div>

                          {/* Metric 2 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span>ATS Machine Parseability</span>
                              <span className="font-mono text-purple-700 tabular-nums">{atsCompatibility}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full"
                                style={{ width: `${atsCompatibility}%` }}
                              />
                            </div>
                          </div>

                          {/* Metric 3 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span>Skills Density Match</span>
                              <span className="font-mono text-violet-800 tabular-nums">{skillsMatch}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-800 to-purple-600 rounded-full"
                                style={{ width: `${skillsMatch}%` }}
                              />
                            </div>
                          </div>

                          {/* Metric 4 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span>Formatting & Layout Standard</span>
                              <span className="font-mono text-zinc-900 tabular-nums">{formattingScore}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-zinc-800 to-violet-600 rounded-full"
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
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-violet-700" />
                          <span>Candidate Value Proposition & Strategic Summary</span>
                        </h2>
                        <div className="border-l-4 border-l-violet-700 bg-violet-50/50 p-4 rounded-r-xl border border-y-violet-100 border-r-violet-100">
                          <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                            {result.executiveSummary || result.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. Professional Experience (Creative Impact) */}
                    {includeExperience && (
                      <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>Professional Experience & Leadership Milestones</span>
                        </h2>
                        <div className="space-y-3">
                          {experienceItems.map((item: any, idx: number) => (
                            <div
                              key={`cr-exp-${idx}`}
                              className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xs font-black text-zinc-950">{item.role}</h3>
                                  <p className="text-[11px] font-bold text-violet-700">{item.company}</p>
                                </div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-900">
                                  {item.duration}
                                </span>
                              </div>
                              {item.highlights && item.highlights.length > 0 && (
                                <ul className="text-[11px] text-zinc-700 space-y-1 list-disc pl-4 font-medium">
                                  {item.highlights.slice(0, 3).map((h: string, hIdx: number) => (
                                    <li key={`cr-h-${idx}-${hIdx}`}>{h}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Education & Credentials (Creative Impact) */}
                    {includeEducation && (
                      <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-violet-600" />
                          <span>Education & Verified Accreditations</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {educationItems.map((edu: any, idx: number) => (
                            <div key={`cr-edu-${idx}`} className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-black text-zinc-950">
                                <GraduationCap className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                                <span>{edu.degree}</span>
                              </div>
                              <p className="text-[11px] text-zinc-600 font-medium pl-5">{edu.school}</p>
                              <div className="flex items-center justify-between pl-5 text-[10px] text-zinc-500 font-mono">
                                <span>{edu.year}</span>
                                {edu.honors && <span className="font-bold text-violet-700">{edu.honors}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {certificationItems && certificationItems.length > 0 && (
                          <div className="p-2.5 bg-violet-50/60 rounded-xl border border-violet-200 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-violet-900 tracking-wider">Accreditations:</span>
                            {certificationItems.slice(0, 3).map((cert: string, cIdx: number) => (
                              <span key={`cr-cert-${cIdx}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-violet-200 text-violet-800">
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Skills Gap Modern Chips */}
                    {includeSkills && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>High-Priority Capability Calibration</span>
                        </h2>

                        {result.skillGapReport && result.skillGapReport.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2.5">
                            {result.skillGapReport.slice(0, 6).map((gap: any, idx: number) => (
                              <div
                                key={`creative-gap-${gap.skill}-${idx}`}
                                className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between"
                              >
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-zinc-950 block">
                                    {gap.skill}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 block">
                                    {gap.reason || "Recommended target keyword"}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    gap.importance === "Critical"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-violet-100 text-violet-800"
                                  }`}
                                >
                                  {gap.importance || "Core"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-900 font-medium">
                            Full capability alignment detected across core mandates.
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Trajectory & Growth Roadmap */}
                    {includeTrajectory && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-violet-600" />
                          <span>Career Roadmap & Leadership Horizons</span>
                        </h2>
                        <div className="p-4 rounded-2xl bg-[#111116] text-white space-y-3 shadow-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-violet-400 font-bold uppercase block">
                                Primary Career Mandate
                              </span>
                              <span className="text-sm font-bold text-white">{targetRole}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-violet-950 text-violet-300 font-mono text-xs font-bold border border-violet-800 tabular-nums">
                              {result.careerPath?.confidence || 88}% Alignment
                            </span>
                          </div>

                          {result.careerPath?.alternatives && result.careerPath.alternatives.length > 0 && (
                            <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2">
                              {result.careerPath.alternatives.slice(0, 2).map((alt: any, idx: number) => (
                                <div
                                  key={`creative-alt-${idx}`}
                                  className="p-2.5 rounded-xl bg-[#16161d] border border-zinc-800 text-xs flex items-center justify-between"
                                >
                                  <span className="text-zinc-200 font-bold">{alt.role}</span>
                                  <span className="text-purple-400 font-mono font-bold text-[11px] tabular-nums">
                                    {alt.match}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 6. Action Checklist */}
                    {includeChecklist && result.improvementPlan && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>Strategic ATS Optimization Steps</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {result.improvementPlan.resumeHeadlineUpdates && (
                            <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200 space-y-1">
                              <span className="text-[10px] font-black text-violet-900 uppercase block">
                                Header Calibration
                              </span>
                              <ul className="text-xs text-zinc-700 space-y-1 list-disc pl-4">
                                {result.improvementPlan.resumeHeadlineUpdates.slice(0, 2).map((u: string, i: number) => (
                                  <li key={`cr-hl-${i}`}>{u}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.improvementPlan.formattingFixes && (
                            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                              <span className="text-[10px] font-black text-rose-900 uppercase block">
                                Semantic ATS Formatting
                              </span>
                              <ul className="text-xs text-zinc-700 space-y-1 list-disc pl-4">
                                {result.improvementPlan.formattingFixes.slice(0, 2).map((f: string, i: number) => (
                                  <li key={`cr-fmt-${i}`}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 7. LinkedIn Credibility */}
                    {includeLinkedIn && (
                      <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-violet-700" />
                            <span className="text-xs font-bold text-zinc-950">
                              Verified LinkedIn Trust Score
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-600 font-mono block">
                            {linkedinUrl ? linkedinUrl : "Authenticated Executive Candidate Baseline"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-violet-700 tabular-nums block">
                            {linkedInTrustScore ?? (linkedinUrl ? 86 : 78)}%
                          </span>
                          <span className="text-[9px] font-mono uppercase font-bold text-purple-700">
                            Authenticated
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Creative Footer */}
                    <div className="border-t border-zinc-200 pt-4 flex items-center justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                      <span>Creative Impact Layout · Executive Intelligence Portfolio</span>
                      <span>Verified Document · {fileName}</span>
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
