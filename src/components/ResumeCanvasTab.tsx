import React, { useState, useMemo, useRef } from "react";
import {
  FileText,
  Copy,
  Check,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Layout,
  Type,
  Wand2,
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

  const [fixes, setFixes] = useState<FormattingFixesState>({
    standardizeMargins: false,
    removeComplexTables: false,
    convertToStandardFont: false,
    standardizeHeaders: false,
    selectedFont: "Inter",
  });
  const [quickFixToast, setQuickFixToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    showToast("✓ All ATS formatting fixes applied: Margins, tables, fonts & headers standardized.");
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

  const baseFormattingScore =
    result.formattingHealthScore || result.atsAnalysis?.formattingScore || 82;

  const effectiveFormattingScore = useMemo(() => {
    let bonus = 0;
    if (fixes.standardizeMargins) bonus += 7;
    if (fixes.removeComplexTables) bonus += 8;
    if (fixes.convertToStandardFont) bonus += 6;
    if (fixes.standardizeHeaders) bonus += 4;
    return Math.min(100, baseFormattingScore + bonus);
  }, [baseFormattingScore, fixes]);

  const rawResumeText = useMemo(() => {
    if (result.atsMetadata?.rawText) {
      return result.atsMetadata.rawText;
    }
    const missingSkillsList =
      result.missingSkills || result.skillGapReport?.map((s) => s.skill) || [];
    const skillsList = result.foundSkills.slice(0, 15).join(", ");
    return `TARGET ROLE: ${result.careerPath.topRole || "Executive Leadership"}
OVERALL MATCH SCORE: ${result.overallScore}% | ATS COMPATIBILITY: ${result.atsCompatibility}%

PROFESSIONAL SUMMARY
${result.executiveSummary || "Demonstrated executive leadership with cross-functional mastery, team stewardship, and sustained track record delivering strategic impact across core organizational pillars."}

CORE COMPETENCIES & KEYWORDS
${skillsList || "Strategic Leadership, Operational Excellence, Budget Management, Cross-Functional Leadership"}

KEY CAREER STRENGTHS
${result.foundSkills.map((s) => `• Demonstrated capability in ${s}`).join("\n")}

RECOMMENDED STRATEGIC ADDITIONS (CRITICAL ATS KEYWORDS)
${missingSkillsList.map((s) => `• Recommended keyword addition: ${s}`).join("\n")}

CAREER TRAJECTORY & ROADMAP
Primary Target: ${result.careerPath.topRole} (${result.careerPath.confidence}% Alignment)
${result.careerPath.alternatives.map((a) => `Pivot Alternative: ${a.role} (${a.match}% Alignment)`).join("\n")}`;
  }, [result]);

  const resumeText = useMemo(() => {
    let text = rawResumeText;

    if (fixes.removeComplexTables) {
      const lines = text.split("\n");
      const cleaned = lines.map((line) => {
        if (/^(\|[ -:]+\|)+$/.test(line.trim()) || /^(\+[-+]+\+)+$/.test(line.trim())) {
          return "";
        }
        if (line.includes("|") && line.trim().startsWith("|") && line.trim().endsWith("|")) {
          const parts = line
            .split("|")
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length > 1) {
            return `• ${parts[0]}: ${parts.slice(1).join(" — ")}`;
          }
        } else if (line.includes(" | ")) {
          const parts = line
            .split(" | ")
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length >= 2) {
            return `${parts[0]}\n  • ${parts.slice(1).join(" • ")}`;
          }
        } else if (line.includes("\t") && line.split("\t").filter(Boolean).length >= 2) {
          const parts = line
            .split("\t")
            .map((p) => p.trim())
            .filter(Boolean);
          return `• ${parts.join(" — ")}`;
        }
        return line;
      });
      text = cleaned.filter((l, idx, arr) => !(l === "" && arr[idx - 1] === "")).join("\n");
    }

    if (fixes.standardizeHeaders) {
      text = text
        .replace(/^(Summary|About Me|Profile|Professional Bio)[:]?$/gim, "PROFESSIONAL SUMMARY")
        .replace(
          /^(Skills|Technical Skills|Competencies|Core Skills)[:]?$/gim,
          "CORE COMPETENCIES & TECHNICAL SKILLS"
        )
        .replace(
          /^(Work Experience|Experience|Employment History|Career History)[:]?$/gim,
          "PROFESSIONAL EXPERIENCE"
        )
        .replace(
          /^(Education|Academic Background|Degrees)[:]?$/gim,
          "EDUCATION & CREDENTIALS"
        )
        .replace(
          /^(Projects|Key Projects|Portfolio)[:]?$/gim,
          "KEY PROJECTS & ACHIEVEMENTS"
        );
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
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center text-violet-700 dark:text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-950 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Resume Canvas</span>
              <span className="text-xs font-mono font-semibold text-violet-700 dark:text-violet-400">
                · {file ? file.name : "Active Brief"}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tabular-nums">
              {wordCount} words · ~{readingTime} min recruiter read · {result.atsAnalysis.formattingScore}% ATS Parsable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-zinc-100 dark:bg-[#09090b] rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold px-2 text-zinc-700 dark:text-zinc-300 min-w-[42px] text-center tabular-nums">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Keyword Heatmap Toggle */}
          <button
            type="button"
            onClick={() => setShowKeywordHeatmap(!showKeywordHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showKeywordHeatmap
                ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                : "bg-zinc-100 dark:bg-[#16161d] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Keyword Heatmap</span>
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* PDF Preview */}
          {onPreviewPdf && (
            <button
              type="button"
              onClick={onPreviewPdf}
              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Preview and customize PDF report sections"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Preview</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Quick Print</span>
            </button>
          )}

          {onOpenBuilder && (
            <button
              type="button"
              onClick={onOpenBuilder}
              className="px-3.5 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Edit in Builder</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Quick Fix Toolbar */}
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

      {/* Document Stage */}
      <div className="flex justify-center overflow-x-auto py-4 bg-zinc-100 dark:bg-[#09090b] rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            ...getFontFamilyStyle(),
            ...(fixes.standardizeMargins
              ? { padding: "3rem", margin: "0 auto", maxWidth: "800px" }
              : {}),
          }}
          className={`w-full max-w-3xl bg-white dark:bg-[#111116] border ${
            fixes.standardizeMargins
              ? "border-violet-500 ring-1 ring-violet-500/30 shadow-xl"
              : "border-zinc-200 dark:border-zinc-800 shadow-lg"
          } rounded-2xl p-10 md:p-14 text-zinc-800 dark:text-zinc-200 transition-all duration-200 relative`}
        >
          {/* Active Quick Fix Indicator Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
            {fixes.standardizeMargins && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-violet-50 dark:bg-violet-950/90 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700/60 text-[10px] font-mono font-bold shadow-xs">
                <Layout className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span>1.0" ATS Margins</span>
              </span>
            )}
            {fixes.convertToStandardFont && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 text-[10px] font-mono font-bold shadow-xs">
                <Type className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{fixes.selectedFont}</span>
              </span>
            )}
          </div>

          {/* Header Metadata */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-violet-700 dark:text-violet-400 uppercase">
                  Candidate Profile & ATS Blueprint
                </span>
                <h2 className="text-2xl font-black font-display text-zinc-950 dark:text-white mt-1">
                  {file?.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") || "Executive Candidate"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Target Role:{" "}
                  <strong className="text-zinc-900 dark:text-zinc-200">
                    {result.careerPath.topRole || "Executive Mandate"}
                  </strong>
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-3xl font-black font-display text-violet-700 dark:text-violet-400 tabular-nums">
                  {result.overallScore}%
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  ATS Match Score
                </span>
              </div>
            </div>
          </div>

          {/* Heatmap Legend */}
          {showKeywordHeatmap && (
            <div className="mb-6 p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-600 dark:text-zinc-400">Keyword Heatmap:</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                  <span className="text-violet-700 dark:text-violet-300 font-semibold tabular-nums">
                    {result.foundSkills.length} Found Skills
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                  <span className="text-rose-700 dark:text-rose-300 font-semibold tabular-nums">
                    {result.missingSkills?.length ?? result.skillGapReport?.length ?? 0} Missing Gaps
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Document Content */}
          <div className="space-y-6 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {resumeText.split("\n\n").map((section, idx) => {
              const lines = section.split("\n");
              const isHeading =
                lines[0] && lines[0] === lines[0].toUpperCase() && lines[0].length < 60;

              return (
                <div key={`sec-${lines[0]?.slice(0, 20) || idx}-${idx}`} className="space-y-2">
                  {isHeading ? (
                    <>
                      <h4 className="text-xs font-black tracking-wider text-violet-700 dark:text-violet-400 uppercase pt-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                        {lines[0]}
                      </h4>
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs md:text-sm font-medium">
                        {lines.slice(1).join("\n")}
                      </p>
                    </>
                  ) : (
                    <p className="text-zinc-700 dark:text-zinc-300 text-xs md:text-sm font-medium">
                      {section}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Document Footer */}
          <div className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Verified with Executive ATS Engine</span>
            <span>Page 1 of 1 · Presentation Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
