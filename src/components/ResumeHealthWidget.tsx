import React, { useMemo } from "react";
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
  Sparkles,
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
  const healthData = useMemo(() => {
    if (!result) return null;

    // 1. Impact: Evaluates quantified metrics and action strength
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

    // 2. Clarity: Evaluates formatting readability and layout hygiene
    const clarityScore = Math.min(
      100,
      Math.max(
        40,
        result.formattingHealthScore ||
          result.atsAnalysis?.formattingScore ||
          Math.round(result.overallScore * 0.9)
      )
    );

    // 3. Keywords: Evaluates JD keyword coverage and skill density
    const jobFound = result.atsAnalysis?.jobKeywordsFound?.length || 0;
    const jobMissing = result.atsAnalysis?.jobKeywordsMissing?.length || 0;
    const keywordMatchPct =
      jobFound + jobMissing > 0
        ? Math.round((jobFound / (jobFound + jobMissing)) * 100)
        : result.skillsMatch || 75;
    const keywordScore = Math.min(100, Math.max(30, keywordMatchPct));

    // 4. Structure: Evaluates ATS parsing compatibility and section hygiene
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
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      description:
        "Measures quantified metrics (%, $, multipliers) and leadership outcome framing.",
      targetAdvice:
        healthData.impactScore < 75
          ? "Add 2-3 specific business metrics to your latest work experience bullets."
          : "Excellent metric density across professional accomplishments.",
    },
    {
      name: "Clarity",
      score: healthData.clarityScore,
      icon: Eye,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/30",
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
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
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
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      description:
        "Tests ATS header compliance, date formatting, and section parsing accuracy.",
      targetAdvice:
        healthData.structureScore < 75
          ? "Ensure standard section titles (e.g. Experience, Education, Skills) are strictly used."
          : "100% ATS machine parser friendly section hierarchy.",
    },
  ];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-teal-500/20 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black font-display text-white tracking-tight">
                Resume Health Overview
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-black uppercase tracking-wider">
                4-Quadrant Balance
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Holistic radar analysis balancing Impact, Clarity, Keywords, and Structure
            </p>
          </div>
        </div>

        {/* Overall Health Score Pill */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Health Index
            </span>
            <span className="text-xs font-black text-teal-400 uppercase">
              {healthData.compositeHealthScore >= 80
                ? "Optimal Balance"
                : healthData.compositeHealthScore >= 65
                ? "Moderate Equilibrium"
                : "Needs Optimization"}
            </span>
          </div>
          <div className="text-3xl font-black font-display text-white border-l border-white/10 pl-3">
            {healthData.compositeHealthScore}%
          </div>
        </div>
      </div>

      {/* Main Grid: Left Radar Chart, Right Quadrant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 4-Quadrant Spider Radar Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/5 relative min-h-[320px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Multivariate Spider Diagram
          </span>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="72%"
                data={healthData.radarChartData}
              >
                <PolarGrid
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeDasharray="3 3"
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                  }}
                />
                <PolarRadiusAxis
                  angle={45}
                  domain={[0, 100]}
                  stroke="rgba(255, 255, 255, 0.2)"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                />
                <Radar
                  name="Resume Health"
                  dataKey="score"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fill="#0d9488"
                  fillOpacity={0.45}
                  dot={{ r: 4, fill: "#2dd4bf", stroke: "#0f172a", strokeWidth: 1.5 }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-teal-500/40 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                            {data.subject}:{" "}
                            <span className="text-teal-300 font-black">{data.score}%</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
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

          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> Current Vector
            </span>
            <span className="text-slate-600">•</span>
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
                key={`quad-${idx}`}
                className={`p-4 rounded-2xl bg-slate-950/60 border ${q.borderColor} hover:bg-slate-950/90 transition-all flex flex-col justify-between group`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${q.bgColor} ${q.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {q.name}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black font-display ${
                        isPassing ? q.color : "text-amber-400"
                      }`}
                    >
                      {q.score}%
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        q.score >= 80 ? "bg-teal-400" : q.score >= 65 ? "bg-amber-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${q.score}%` }}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-400 leading-snug mb-2">
                    {q.description}
                  </p>
                </div>

                {/* Target Advice */}
                <div className="pt-2 border-t border-white/5 flex items-start gap-1.5 text-[10px] text-slate-300">
                  {isPassing ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
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
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Achieve holistic ATS equilibrium by injecting quantified metrics into low-scoring quadrants.
            </span>
          </div>

          <button
            onClick={() => onOpenOptimizer()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
          >
            <span>Optimize Resume Health</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
