import React, { useState, useMemo } from "react";
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
  BookOpen
} from "lucide-react";
import { AnalysisResult } from "../types";

interface ResumeCanvasTabProps {
  result: AnalysisResult;
  file: File | null;
  onOpenBuilder?: () => void;
  onPrint?: () => void;
}

export const ResumeCanvasTab: React.FC<ResumeCanvasTabProps> = ({
  result,
  file,
  onOpenBuilder,
  onPrint,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showKeywordHeatmap, setShowKeywordHeatmap] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  // Extract or synthesize resume text representation
  const resumeText = useMemo(() => {
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
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
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

      {/* Canva Artboard / Paper Canvas */}
      <div className="flex justify-center overflow-x-auto py-4 bg-slate-100 dark:bg-slate-950/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl p-10 md:p-14 text-slate-800 dark:text-slate-200 transition-transform duration-200"
        >
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
