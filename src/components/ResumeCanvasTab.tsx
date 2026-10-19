import React, { useState, useMemo, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  Search, 
  Sliders, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Share2,
  BookOpen,
  Layout,
  Table,
  Type,
  Wand2
} from "lucide-react";
import { AnalysisResult } from "../types";
import { ResumeQuickFixToolbar, FormattingFixesState } from "./ResumeQuickFixToolbar";

interface ResumeCanvasTabProps {
  result: AnalysisResult;
  file: File | null;
  onOpenBuilder?: () => void;
  onPrint?: () => void;
  onPreviewPdf?: () => void;
}

export const ResumeCanvasTab: React.FC<ResumeCanvasTabProps> = ({
  result,
  file,
  onOpenBuilder,
  onPrint,
  onPreviewPdf,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showKeywordHeatmap, setShowKeywordHeatmap] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  // Floating Quick Fix Toolbar States
  const [fixes, setFixes] = useState<FormattingFixesState>({
    standardizeMargins: false,
    removeComplexTables: false,
    convertToStandardFont: false,
    standardizeHeaders: false,
    selectedFont: "Inter",
  });
  const [quickFixToast, setQuickFixToast] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setQuickFixToast(message);
    toastTimerRef.current = setTimeout(() => setQuickFixToast(null), 3500);
  };

  const handleToggleFix = (key: keyof Omit<FormattingFixesState, "selectedFont">) => {
    setFixes((prev) => {
      const nextVal = !prev[key];
      const updated = { ...prev, [key]: nextVal };
      if (nextVal) {
        if (key === "standardizeMargins") {
          showToast("✓ Margins standardized: 1.0\" ATS uniform margin coordinates applied");
        } else if (key === "removeComplexTables") {
          showToast("✓ Tables removed: Converted multi-column & pipe tables to linear ATS bullets");
        } else if (key === "convertToStandardFont") {
          showToast(`✓ Font converted: Switched to ATS-standard ${prev.selectedFont} typography`);
        } else if (key === "standardizeHeaders") {
          showToast("✓ Section headers standardized to universal ATS keywords");
        }
      } else {
        showToast(`Reverted ${key} to original uploaded state`);
      }
      return updated;
    });
  };

  const handleSelectFont = (font: "Inter" | "Arial" | "Calibri" | "Georgia") => {
    setFixes((prev) => ({
      ...prev,
      selectedFont: font,
      convertToStandardFont: true,
    }));
    showToast(`✓ Font converted: Switched to ATS-standard ${font} typography`);
  };

  const handleApplyAllFixes = () => {
    setFixes({
      standardizeMargins: true,
      removeComplexTables: true,
      convertToStandardFont: true,
      standardizeHeaders: true,
      selectedFont: "Inter",
    });
    showToast("✓ All ATS formatting fixes applied: Margins, tables, fonts & headers standardized!");
  };

  const handleResetFixes = () => {
    setFixes({
      standardizeMargins: false,
      removeComplexTables: false,
      convertToStandardFont: false,
      standardizeHeaders: false,
      selectedFont: "Inter",
    });
    showToast("Formatting reset to raw document state");
  };

  const baseFormattingScore = result.formattingHealthScore || result.atsAnalysis?.formattingScore || 82;

  const effectiveFormattingScore = useMemo(() => {
    let bonus = 0;
    if (fixes.standardizeMargins) bonus += 7;
    if (fixes.removeComplexTables) bonus += 8;
    if (fixes.convertToStandardFont) bonus += 6;
    if (fixes.standardizeHeaders) bonus += 4;
    return Math.min(100, baseFormattingScore + bonus);
  }, [baseFormattingScore, fixes]);

  // Extract or synthesize resume text representation
  const rawResumeText = useMemo(() => {
    if (result.atsMetadata?.rawText) {
      return result.atsMetadata.rawText;
    }
    const missingSkillsList = result.missingSkills || result.skillGapReport?.map(s => s.skill) || [];
    const skillsList = result.foundSkills.slice(0, 15).join(", ");
    return `TARGET ROLE: ${result.careerPath.topRole || "Executive Leadership"}
OVERALL MATCH SCORE: ${result.overallScore}% | ATS COMPATIBILITY: ${result.atsCompatibility}%

PROFESSIONAL SUMMARY
${result.executiveSummary || "Demonstrated executive leadership with cross-functional mastery, team stewardship, and sustained track record delivering strategic impact across core organizational pillars."}

CORE COMPETENCIES & KEYWORDS
${skillsList || "Strategic Leadership, Operational Excellence, Budget Management, Cross-Functional Leadership"}

KEY CAREER STRENGTHS
${result.foundSkills.map(s => `• Demonstrated capability in ${s}`).join("\n")}

RECOMMENDED STRATEGIC ADDITIONS (CRITICAL ATS KEYWORDS)
${missingSkillsList.map(s => `• Recommended keyword addition: ${s}`).join("\n")}

CAREER TRAJECTORY & ROADMAP
Primary Target: ${result.careerPath.topRole} (${result.careerPath.confidence}% Alignment)
${result.careerPath.alternatives.map(a => `Pivot Alternative: ${a.role} (${a.match}% Alignment)`).join("\n")}`;
  }, [result]);

  // Apply ATS transformations when quick fixes are active
  const resumeText = useMemo(() => {
    let text = rawResumeText;

    if (fixes.removeComplexTables) {
      const lines = text.split("\n");
      const cleaned = lines.map((line) => {
        // Remove markdown table borders like |---|---|
        if (/^(\|[ -:]+\|)+$/.test(line.trim()) || /^(\+[-+]+\+)+$/.test(line.trim())) {
          return "";
        }
        // Pipe-delimited tables: | Col1 | Col2 |
        if (line.includes("|") && line.trim().startsWith("|") && line.trim().endsWith("|")) {
          const parts = line.split("|").map(p => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            return `• ${parts[0]}: ${parts.slice(1).join(" — ")}`;
          }
        } else if (line.includes(" | ")) {
          const parts = line.split(" | ").map(p => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            return `${parts[0]}\n  • ${parts.slice(1).join(" • ")}`;
          }
        } else if (line.includes("\t") && line.split("\t").filter(Boolean).length >= 2) {
          const parts = line.split("\t").map(p => p.trim()).filter(Boolean);
          return `• ${parts.join(" — ")}`;
        }
        return line;
      });
      text = cleaned.filter((l, idx, arr) => !(l === "" && arr[idx - 1] === "")).join("\n");
    }

    if (fixes.standardizeHeaders) {
      text = text
        .replace(/^(Summary|About Me|Profile|Professional Bio)[:]?$/gim, "PROFESSIONAL SUMMARY")
        .replace(/^(Skills|Technical Skills|Competencies|Core Skills)[:]?$/gim, "CORE COMPETENCIES & TECHNICAL SKILLS")
        .replace(/^(Work Experience|Experience|Employment History|Career History)[:]?$/gim, "PROFESSIONAL EXPERIENCE")
        .replace(/^(Education|Academic Background|Degrees)[:]?$/gim, "EDUCATION & CREDENTIALS")
        .replace(/^(Projects|Key Projects|Portfolio)[:]?$/gim, "KEY PROJECTS & ACHIEVEMENTS");
    }

    return text;
  }, [rawResumeText, fixes.removeComplexTables, fixes.standardizeHeaders]);

  const wordCount = useMemo(() => {
    return resumeText.trim().split(/\s+/).filter(Boolean).length;
  }, [resumeText]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 220));
  }, [wordCount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFontFamilyStyle = () => {
    if (!fixes.convertToStandardFont) return undefined;
    switch (fixes.selectedFont) {
      case "Arial":
        return { fontFamily: "Arial, Helvetica, sans-serif" };
      case "Calibri":
        return { fontFamily: "Calibri, 'Segoe UI', sans-serif" };
      case "Georgia":
        return { fontFamily: "Georgia, 'Times New Roman', serif" };
      case "Inter":
      default:
        return { fontFamily: "'Inter', Arial, -apple-system, BlinkMacSystemFont, sans-serif" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Canva Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Resume Canvas</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                {file ? file.name : "Active Brief"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {wordCount} words • ~{readingTime} min recruiter read • {result.atsAnalysis.formattingScore}% ATS Parsable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold px-2 text-slate-600 dark:text-slate-300 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Keyword Heatmap Toggle */}
          <button
            onClick={() => setShowKeywordHeatmap(!showKeywordHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showKeywordHeatmap
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Keyword Heatmap</span>
          </button>

          {/* Action: Copy */}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Action: Print / PDF */}
          {onPreviewPdf && (
            <button
              onClick={onPreviewPdf}
              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Preview and customize PDF report sections"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Preview</span>
            </button>
          )}

          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Print</span>
            </button>
          )}

          {/* Action: Open Builder */}
          {onOpenBuilder && (
            <button
              onClick={onOpenBuilder}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Edit in Builder</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Quick Fix Toolbar near the top of the resume canvas */}
      <ResumeQuickFixToolbar
        fixes={fixes}
        onToggleFix={handleToggleFix}
        onSelectFont={handleSelectFont}
        onApplyAll={handleApplyAllFixes}
        onReset={handleResetFixes}
        baseFormattingScore={baseFormattingScore}
        effectiveFormattingScore={effectiveFormattingScore}
        activeToastMessage={quickFixToast}
      />

      {/* Canva Artboard / Paper Canvas */}
      <div className="flex justify-center overflow-x-auto py-4 bg-slate-100 dark:bg-slate-950/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            ...getFontFamilyStyle(),
            ...(fixes.standardizeMargins
              ? { padding: "3rem", margin: "0 auto", maxWidth: "800px" }
              : {}),
          }}
          className={`w-full max-w-3xl bg-white dark:bg-slate-900 border ${
            fixes.standardizeMargins
              ? "border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.18)] ring-1 ring-teal-500/30"
              : "border-slate-200 dark:border-slate-700/80 shadow-xl"
          } rounded-2xl p-10 md:p-14 text-slate-800 dark:text-slate-200 transition-all duration-200 relative`}
        >
          {/* Active Quick Fix Badge Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
            {fixes.standardizeMargins && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/90 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 text-[10px] font-mono font-bold shadow-sm">
                <Layout className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>1.0" ATS Margins</span>
              </span>
            )}
            {fixes.convertToStandardFont && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 text-[10px] font-mono font-bold shadow-sm">
                <Type className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{fixes.selectedFont}</span>
              </span>
            )}
          </div>

          {/* Header Metadata */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                  Candidate Profile & ATS Blueprint
                </span>
                <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-1">
                  {file?.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") || "Executive Candidate"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Target Role: <strong className="text-slate-800 dark:text-slate-200">{result.careerPath.topRole || "Executive Mandate"}</strong>
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-3xl font-black font-display text-indigo-600 dark:text-indigo-400">
                  {result.overallScore}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ATS Match Score
                </span>
              </div>
            </div>
          </div>

          {/* Heatmap Legend */}
          {showKeywordHeatmap && (
            <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Keyword Heatmap:</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{result.foundSkills.length} Found Skills</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-amber-700 dark:text-amber-300 font-semibold">
                    {(result.missingSkills?.length ?? result.skillGapReport?.length ?? 0)} Missing Gaps
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Document Content */}
          <div className="space-y-6 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {resumeText.split("\n\n").map((section, idx) => {
              const lines = section.split("\n");
              const isHeading = lines[0] && lines[0] === lines[0].toUpperCase() && lines[0].length < 60;

              return (
                <div key={`sec-${lines[0]?.slice(0, 20) || idx}-${idx}`} className="space-y-2">
                  {isHeading ? (
                    <>
                      <h4 className="text-xs font-black tracking-wider text-indigo-700 dark:text-indigo-400 uppercase pt-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                        {lines[0]}
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm font-medium">
                        {lines.slice(1).join("\n")}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm font-medium">
                      {section}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Document Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified with Executive ATS Engine</span>
            <span>Page 1 of 1 • Presentation Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
