import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Check,
  Copy,
  BarChart2,
  Plus,
} from "lucide-react";

export interface AnalysisResult {
  overallScore: number;
  atsCompatibility: number;
  skillsMatch: number;
  formattingHealthScore?: number;
  careerTrajectoryFitScore?: number;
  foundSkills: string[];
  missingSkills: string[];
  atsAnalysis: {
    formattingScore: number;
    keywordDensity: number;
    recommendations: string[];
    topResumeKeywords?: string[];
    jobKeywordsFound?: string[];
    jobKeywordsMissing?: string[];
  };
  summary: string;
  targetRole?: string;
  [key: string]: any;
}

export interface AnalysisHistoryItem {
  id: string;
  date: string;
  fileName: string;
  versionName?: string;
  jobDescription?: string;
  result: any;
  [key: string]: any;
}

interface HistoryComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisHistoryItem[];
  initialCompareIds?: string[];
  onLoadVersion?: (item: any) => void;
}

export const HistoryComparisonModal: React.FC<HistoryComparisonModalProps> = ({
  isOpen,
  onClose,
  history,
  initialCompareIds = [],
  onLoadVersion,
}) => {
  const defaultV1 = history.length > 1 ? history[history.length - 1].id : history[0]?.id || "";
  const defaultV2 = history.length > 1 ? history[0].id : history[0]?.id || "";

  const [v1Id, setV1Id] = useState<string>(initialCompareIds[0] || defaultV1);
  const [v2Id, setV2Id] = useState<string>(
    initialCompareIds[1] ||
      (initialCompareIds[0] !== defaultV2 ? defaultV2 : history[1]?.id || defaultV2)
  );
  const [copiedSummary, setCopiedSummary] = useState(false);

  React.useEffect(() => {
    if (initialCompareIds.length >= 2) {
      setV1Id(initialCompareIds[0]);
      setV2Id(initialCompareIds[1]);
    } else if (history.length >= 2) {
      if (!v1Id || !history.some((h) => h.id === v1Id)) {
        setV1Id(history[1]?.id || history[0]?.id);
      }
      if (!v2Id || !history.some((h) => h.id === v2Id)) {
        setV2Id(history[0]?.id);
      }
    }
  }, [initialCompareIds, history]);

  const item1 = useMemo(
    () => history.find((h) => h.id === v1Id) || history[1] || history[0],
    [history, v1Id]
  );
  const item2 = useMemo(
    () => history.find((h) => h.id === v2Id) || history[0],
    [history, v2Id]
  );

  if (!isOpen) return null;

  const calculateImprovement = (val1: number, val2: number) => {
    const pts = val2 - val1;
    const base = val1 === 0 ? 1 : val1;
    const pct = ((val2 - val1) / base) * 100;
    return {
      pts,
      pct: Math.round(pct * 10) / 10,
      isPositive: pts > 0,
      isNeutral: pts === 0,
    };
  };

  const metrics =
    item1 && item2
      ? [
          {
            label: "Overall Match Score",
            v1: item1.result.overallScore,
            v2: item2.result.overallScore,
            ...calculateImprovement(item1.result.overallScore, item2.result.overallScore),
            color: "from-violet-700 to-purple-600",
          },
          {
            label: "ATS Compatibility",
            v1: item1.result.atsCompatibility,
            v2: item2.result.atsCompatibility,
            ...calculateImprovement(
              item1.result.atsCompatibility,
              item2.result.atsCompatibility
            ),
            color: "from-violet-600 to-purple-500",
          },
          {
            label: "Skills Vector Match",
            v1: item1.result.skillsMatch,
            v2: item2.result.skillsMatch,
            ...calculateImprovement(item1.result.skillsMatch, item2.result.skillsMatch),
            color: "from-purple-700 to-violet-500",
          },
          {
            label: "Formatting Health",
            v1:
              item1.result.atsAnalysis?.formattingScore ||
              item1.result.formattingHealthScore ||
              70,
            v2:
              item2.result.atsAnalysis?.formattingScore ||
              item2.result.formattingHealthScore ||
              70,
            ...calculateImprovement(
              item1.result.atsAnalysis?.formattingScore ||
                item1.result.formattingHealthScore ||
                70,
              item2.result.atsAnalysis?.formattingScore ||
                item2.result.formattingHealthScore ||
                70
            ),
            color: "from-zinc-800 to-violet-600 dark:from-violet-500 dark:to-purple-400",
          },
        ]
      : [];

  const skills1 = new Set(item1?.result?.foundSkills || []);
  const skills2 = new Set(item2?.result?.foundSkills || []);
  const newlyAddedSkills = Array.from(skills2).filter((s) => !skills1.has(s));

  const handleCopySummary = () => {
    if (!item1 || !item2) return;
    const text = `RESUME VERSION COMPARISON REPORT:
Baseline (${item1.versionName || item1.fileName}): Overall ${item1.result.overallScore}%, ATS ${item1.result.atsCompatibility}%, Skills ${item1.result.skillsMatch}%
Optimized (${item2.versionName || item2.fileName}): Overall ${item2.result.overallScore}%, ATS ${item2.result.atsCompatibility}%, Skills ${item2.result.skillsMatch}%

IMPROVEMENT DELTA:
• Overall Score: ${item2.result.overallScore - item1.result.overallScore >= 0 ? "+" : ""}${item2.result.overallScore - item1.result.overallScore} pts (${calculateImprovement(item1.result.overallScore, item2.result.overallScore).pct}% change)
• ATS Compatibility: ${item2.result.atsCompatibility - item1.result.atsCompatibility >= 0 ? "+" : ""}${item2.result.atsCompatibility - item1.result.atsCompatibility} pts (${calculateImprovement(item1.result.atsCompatibility, item2.result.atsCompatibility).pct}% change)
• Skills Match: ${item2.result.skillsMatch - item1.result.skillsMatch >= 0 ? "+" : ""}${item2.result.skillsMatch - item1.result.skillsMatch} pts (${calculateImprovement(item1.result.skillsMatch, item2.result.skillsMatch).pct}% change)
• Newly Added Skills: ${newlyAddedSkills.join(", ") || "None"}
`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <AnimatePresence>
      <div
        key="history-comparison-backdrop"
        className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black font-display text-zinc-950 dark:text-white">
                    Side-by-Side Version Comparison
                  </h2>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Delta Intelligence
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Compare two resume versions and quantify relative gains across core ATS dimensions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copy comparison summary to clipboard"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span className="text-violet-700 dark:text-violet-300">Copied Summary</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Version Selectors Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              {/* Version 1 (Baseline) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    Baseline Version (Earlier)
                  </span>
                  {item1 && onLoadVersion && (
                    <button
                      type="button"
                      onClick={() => {
                        onLoadVersion(item1);
                        onClose();
                      }}
                      className="text-[10px] text-violet-700 dark:text-violet-400 hover:underline font-bold transition-colors cursor-pointer"
                    >
                      Load into Dashboard →
                    </button>
                  )}
                </div>
                <select
                  value={v1Id}
                  onChange={(e) => setV1Id(e.target.value)}
                  className="w-full bg-white dark:bg-[#111116] border border-zinc-300 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-violet-600"
                >
                  {history.map((h, idx) => (
                    <option key={`v1-opt-${h.id || idx}-${idx}`} value={h.id}>
                      {h.versionName || `Version ${idx + 1}`} ({h.fileName}) -{" "}
                      {new Date(h.date).toLocaleDateString()} [Score: {h.result.overallScore}%]
                    </option>
                  ))}
                </select>
              </div>

              {/* Version 2 (Optimized) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                    Optimized Version (Comparison Target)
                  </span>
                  {item2 && onLoadVersion && (
                    <button
                      type="button"
                      onClick={() => {
                        onLoadVersion(item2);
                        onClose();
                      }}
                      className="text-[10px] text-violet-700 dark:text-violet-400 hover:underline font-bold transition-colors cursor-pointer"
                    >
                      Load into Dashboard →
                    </button>
                  )}
                </div>
                <select
                  value={v2Id}
                  onChange={(e) => setV2Id(e.target.value)}
                  className="w-full bg-white dark:bg-[#111116] border border-violet-300 dark:border-violet-700/70 rounded-xl p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-violet-600"
                >
                  {history.map((h, idx) => (
                    <option key={`v2-opt-${h.id || idx}-${idx}`} value={h.id}>
                      {h.versionName || `Version ${idx + 1}`} ({h.fileName}) -{" "}
                      {new Date(h.date).toLocaleDateString()} [Score: {h.result.overallScore}%]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Score Percentage Improvements Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  Score Improvement Metrics
                </h3>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Relative percentage gain between selected versions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, mIdx) => (
                  <div
                    key={`metric-${metric.label}-${mIdx}`}
                    className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700/60 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        {metric.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums ${
                          metric.isPositive
                            ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60"
                            : metric.isNeutral
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        {metric.isPositive ? "+" : ""}
                        {metric.pct}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-display text-zinc-950 dark:text-white tabular-nums">
                          {metric.v2}%
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through tabular-nums">
                          {metric.v1}%
                        </span>
                      </div>
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          metric.isPositive
                            ? "text-violet-700 dark:text-violet-400"
                            : metric.isNeutral
                            ? "text-zinc-500"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {metric.isPositive ? `+${metric.pts} pts` : `${metric.pts} pts`}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full"
                        style={{ width: `${Math.min(metric.v1, 100)}%` }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r ${metric.color} transition-all duration-700`}
                        style={{ width: `${Math.min(metric.v2, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-Side Detailed Columns */}
            {item1 && item2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Baseline */}
                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                        Baseline Document
                      </span>
                      <h4 className="text-sm font-black text-zinc-950 dark:text-white truncate max-w-[260px]">
                        {item1.versionName || item1.fileName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3 h-3" /> {new Date(item1.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                      Resume Summary
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic bg-white dark:bg-[#111116] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 line-clamp-4">
                      "{item1.result.summary}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
                      Matched Skills ({item1.result.foundSkills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {item1.result.foundSkills?.map((skill: string, sIdx: number) => (
                        <span
                          key={`s1-${skill}-${sIdx}`}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Optimized */}
                <div className="p-5 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 space-y-4">
                  <div className="pb-3 border-b border-violet-200 dark:border-violet-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400 block">
                        Optimized Target
                      </span>
                      <h4 className="text-sm font-black text-zinc-950 dark:text-white truncate max-w-[260px]">
                        {item2.versionName || item2.fileName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-violet-700 dark:text-violet-300 flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3 h-3" /> {new Date(item2.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 block mb-1">
                      Enhanced Resume Summary
                    </span>
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed italic bg-white/80 dark:bg-[#111116] p-3 rounded-xl border border-violet-200 dark:border-violet-800/50 line-clamp-4">
                      "{item2.result.summary}"
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 block">
                        Matched Skills ({item2.result.foundSkills?.length || 0})
                      </span>
                      {newlyAddedSkills.length > 0 && (
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> {newlyAddedSkills.length} Newly Detected
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {item2.result.foundSkills?.map((skill: string, sIdx: number) => {
                        const isNew = newlyAddedSkills.includes(skill);
                        return (
                          <span
                            key={`s2-${skill}-${sIdx}`}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center gap-1 ${
                              isNew
                                ? "bg-violet-100 dark:bg-violet-950/60 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200 font-bold"
                                : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {isNew && <Plus className="w-2.5 h-2.5 text-violet-600 dark:text-violet-400" />}
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] flex items-center justify-between shrink-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Selected 2 versions from {history.length} archival snapshots
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-xs font-semibold transition-all cursor-pointer"
              >
                Close View
              </button>
              {item2 && onLoadVersion && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadVersion(item2);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Work with Optimized Version</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
