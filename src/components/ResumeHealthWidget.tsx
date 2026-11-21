import React, { useEffect, useMemo, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Activity,
  Zap,
  Eye,
  Target,
  Layout,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ResumeHealthWidgetProps {
  result: any;
  onOpenOptimizer?: (focusArea?: string) => void;
}

export const ResumeHealthWidget: React.FC<ResumeHealthWidgetProps> = ({
  result,
  onOpenOptimizer,
}) => {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    (document.documentElement.getAttribute("data-theme") === "figma-dark" ||
      document.documentElement.classList.contains("dark"))
  );

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(
        document.documentElement.getAttribute("data-theme") === "figma-dark" ||
          document.documentElement.classList.contains("dark")
      );
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => observer.disconnect();
  }, []);

  const healthData = useMemo(() => {
    if (!result) return null;

    const bulletQuality = result.atsAnalysis?.bulletPointQualityScore;
    const impactScore = Math.min(
      100,
      Math.max(
        35,
        bulletQuality
          ? bulletQuality
          : Math.round(
              result.overallScore * 0.6 +
                (result.careerTrajectoryFitScore || result.overallScore) * 0.4
            )
      )
    );

    const clarityScore = Math.min(
      100,
      Math.max(
        40,
        result.formattingHealthScore ||
          result.atsAnalysis?.formattingScore ||
          Math.round(result.overallScore * 0.9)
      )
    );

    const jobFound = result.atsAnalysis?.jobKeywordsFound?.length || 0;
    const jobMissing = result.atsAnalysis?.jobKeywordsMissing?.length || 0;
    const keywordMatchPct =
      jobFound + jobMissing > 0
        ? Math.round((jobFound / (jobFound + jobMissing)) * 100)
        : result.skillsMatch || 75;
    const keywordScore = Math.min(100, Math.max(30, keywordMatchPct));

    const structureScore = Math.min(
      100,
      Math.max(45, result.atsCompatibility || 75)
    );

    const radarChartData = [
      {
        subject: "Impact",
        score: impactScore,
        fullMark: 100,
        description: "Quantified results & active power verbs",
      },
      {
        subject: "Clarity",
        score: clarityScore,
        fullMark: 100,
        description: "Visual hierarchy & concise syntax",
      },
      {
        subject: "Keywords",
        score: keywordScore,
        fullMark: 100,
        description: "Target job description keyword alignment",
      },
      {
        subject: "Structure",
        score: structureScore,
        fullMark: 100,
        description: "ATS standard sections & parsing compliance",
      },
    ];

    const compositeHealthScore = Math.round(
      (impactScore + clarityScore + keywordScore + structureScore) / 4
    );

    return {
      impactScore,
      clarityScore,
      keywordScore,
      structureScore,
      compositeHealthScore,
      radarChartData,
    };
  }, [result]);

  if (!healthData) return null;

  const quadrants = [
    {
      name: "Impact",
      score: healthData.impactScore,
      icon: Zap,
      description:
        "Measures quantified metrics (%, $, multipliers) and leadership outcome framing.",
      targetAdvice:
        healthData.impactScore < 75
          ? "Add 2-3 specific business metrics to your latest work experience bullets."
          : "Strong metric density across professional accomplishments.",
    },
    {
      name: "Clarity",
      score: healthData.clarityScore,
      icon: Eye,
      description:
        "Evaluates human readability, bullet point conciseness, and whitespace rhythm.",
      targetAdvice:
        healthData.clarityScore < 75
          ? "Shorten run-on sentences to 1-2 lines per bullet for optimal recruiter scanning."
          : "Crisp typography and balanced white-space formatting.",
    },
    {
      name: "Keywords",
      score: healthData.keywordScore,
      icon: Target,
      description:
        "Cross-references technical and domain keywords against target job requirements.",
      targetAdvice:
        healthData.keywordScore < 75
          ? "Review Missing Job Keywords and embed them naturally in relevant projects."
          : "Strong semantic keyword coverage for target role.",
    },
    {
      name: "Structure",
      score: healthData.structureScore,
      icon: Layout,
      description:
        "Tests ATS header compliance, date formatting, and section parsing accuracy.",
      targetAdvice:
        healthData.structureScore < 75
          ? "Ensure standard section titles (e.g. Experience, Education, Skills) are strictly used."
          : "ATS machine parser friendly section hierarchy.",
    },
  ];

  const radarStroke = isDark ? "#a855f7" : "#4c1d95";
  const radarFill = isDark ? "#7e22ce" : "#7e22ce";
  const gridStroke = isDark ? "rgba(255,255,255,0.12)" : "rgba(24,24,27,0.12)";
  const angleTickColor = isDark ? "#d4d4d8" : "#27272a";
  const radiusTickColor = isDark ? "#71717a" : "#71717a";

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold font-display text-zinc-950 dark:text-white tracking-tight">
                Resume Health Overview
              </h3>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                · 4-Quadrant Balance
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Holistic radar analysis balancing Impact, Clarity, Keywords, and Structure
            </p>
          </div>
        </div>

        {/* Overall Health Score Display */}
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/90 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Health Index
            </span>
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
              {healthData.compositeHealthScore >= 80
                ? "Optimal Balance"
                : healthData.compositeHealthScore >= 65
                ? "Moderate Equilibrium"
                : "Needs Optimization"}
            </span>
          </div>
          <div className="text-2xl font-extrabold font-display tabular-nums text-zinc-950 dark:text-white border-l border-zinc-200 dark:border-zinc-800 pl-3">
            {healthData.compositeHealthScore}%
          </div>
        </div>
      </div>

      {/* Main Grid: Left Radar Chart, Right Quadrant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 4-Quadrant Spider Radar Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 relative min-h-[320px]">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            Multivariate Vector Diagram
          </span>

          <div className="w-full h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="72%"
                data={healthData.radarChartData}
              >
                <PolarGrid stroke={gridStroke} strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: angleTickColor,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
                <PolarRadiusAxis
                  angle={45}
                  domain={[0, 100]}
                  stroke={gridStroke}
                  tick={{ fill: radiusTickColor, fontSize: 10 }}
                />
                <Radar
                  name="Resume Health"
                  dataKey="score"
                  stroke={radarStroke}
                  strokeWidth={2.5}
                  fill={radarFill}
                  fillOpacity={isDark ? 0.35 : 0.22}
                  isAnimationActive={false}
                  dot={{
                    r: 4,
                    fill: isDark ? "#c084fc" : "#7e22ce",
                    stroke: isDark ? "#09090b" : "#ffffff",
                    strokeWidth: 1.5,
                  }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-[#111116] border border-violet-300 dark:border-violet-700/60 p-2.5 rounded-lg shadow-lg text-xs">
                          <p className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                            <span>{data.subject}:</span>
                            <span className="text-violet-700 dark:text-violet-300 font-extrabold tabular-nums">
                              {data.score}%
                            </span>
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {data.description}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-purple-400" />
              Current Vector
            </span>
            <span aria-hidden="true">·</span>
            <span>Target Benchmark: 85%+</span>
          </div>
        </div>

        {/* Right: 4 Quadrant Cards Breakdown */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quadrants.map((q, idx) => {
            const Icon = q.icon;
            const isPassing = q.score >= 70;

            return (
              <div
                key={`quad-${q.name}-${idx}`}
                className="p-4 rounded-xl bg-zinc-50/70 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          isPassing
                            ? "bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-950 dark:text-white">
                        {q.name}
                      </span>
                    </div>

                    <span
                      className={`text-sm font-extrabold font-display tabular-nums ${
                        isPassing
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {q.score}%
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        q.score >= 80
                          ? "bg-violet-700 dark:bg-violet-500"
                          : q.score >= 65
                          ? "bg-purple-600 dark:bg-purple-400"
                          : "bg-rose-600 dark:bg-rose-500"
                      }`}
                      style={{ width: `${q.score}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug mb-2">
                    {q.description}
                  </p>
                </div>

                {/* Target Advice */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                  {isPassing ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="line-clamp-2">{q.targetAdvice}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      {onOpenOptimizer && (
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
            <span>
              Strengthen low-scoring quadrants by adding quantified outcomes and verified role keywords.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenOptimizer()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Optimize Resume Health</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
