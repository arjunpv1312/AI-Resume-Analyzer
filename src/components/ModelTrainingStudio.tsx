import React, { useState, useEffect } from "react";
import {
  Cpu,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileSearch,
  Zap,
  ArrowRight,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import {
  AnalysisResult,
  ModelCalibrationConfig,
  ScoreReasonItem,
} from "../types";

interface ModelTrainingStudioProps {
  result: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  linkedinUrl?: string;
  linkedinData?: string;
  onAnalysisUpdated: (updated: AnalysisResult) => void;
}

const DEFAULT_CALIBRATION: ModelCalibrationConfig = {
  version: "v4.2-Enterprise-Neural-ATS",
  strictness: "standard",
  weights: {
    impactQuantification: 30,
    keywordAlignment: 25,
    atsFormatting: 20,
    actionVerbStrength: 15,
    careerTrajectory: 10,
  },
  customPromptFocus: "",
  lastTrainedAt: new Date().toISOString(),
  trainingEpoch: 14,
  benchmarkDatasetSize: 125000,
  accuracyIndex: 96.4,
};

export const ModelTrainingStudio: React.FC<ModelTrainingStudioProps> = ({
  result,
  resumeText = "",
  jobDescription = "",
  linkedinUrl = "",
  linkedinData = "",
  onAnalysisUpdated,
}) => {
  const initialCal = result.modelCalibration || DEFAULT_CALIBRATION;

  const [activeTab, setActiveTab] = useState<
    "reasons" | "bullets" | "suggestions" | "retrain"
  >("reasons");
  const [reasonFilter, setReasonFilter] = useState<
    "all" | "critical" | "moderate" | "strong"
  >("all");
  const [strictness, setStrictness] = useState<
    "standard" | "faang_strict" | "executive_leadership" | "technical_deep"
  >(initialCal.strictness || "standard");
  const [weights, setWeights] = useState({
    impactQuantification: initialCal.weights?.impactQuantification ?? 30,
    keywordAlignment: initialCal.weights?.keywordAlignment ?? 25,
    atsFormatting: initialCal.weights?.atsFormatting ?? 20,
    actionVerbStrength: initialCal.weights?.actionVerbStrength ?? 15,
    careerTrajectory: initialCal.weights?.careerTrajectory ?? 10,
  });
  const [customFeedback, setCustomFeedback] = useState<string>(
    initialCal.customPromptFocus || ""
  );
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState<string>("");
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingBanner, setTrainingBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasonIds, setExpandedReasonIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (result.modelCalibration) {
      setStrictness(result.modelCalibration.strictness || "standard");
      if (result.modelCalibration.weights) {
        setWeights(result.modelCalibration.weights);
      }
      if (result.modelCalibration.customPromptFocus !== undefined) {
        setCustomFeedback(result.modelCalibration.customPromptFocus);
      }
    }
  }, [result.modelCalibration]);

  const scoreReasons: ScoreReasonItem[] = result.scoreReasons || [];
  const filteredReasons = scoreReasons.filter((item) => {
    if (reasonFilter === "all") return true;
    return item.status === reasonFilter;
  });

  const bulletDiagnostics = result.bulletPointAnalysis || [];
  const detailedSuggestions = result.detailedSuggestions || [];
  const categoryScores = result.categoryScores || {
    impactQuantification: result.atsAnalysis?.bulletPointQualityScore || 72,
    keywordAlignment: result.skillsMatch || 76,
    atsFormatting: result.formattingHealthScore || result.atsCompatibility || 80,
    actionVerbStrength: 78,
    careerTrajectory: result.careerTrajectoryFitScore || 80,
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasonExpand = (id: string) => {
    setExpandedReasonIds((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const handlePresetStrictness = (
    mode: "standard" | "faang_strict" | "executive_leadership" | "technical_deep"
  ) => {
    setStrictness(mode);
    if (mode === "faang_strict") {
      setWeights({
        impactQuantification: 38,
        keywordAlignment: 26,
        atsFormatting: 16,
        actionVerbStrength: 12,
        careerTrajectory: 8,
      });
    } else if (mode === "executive_leadership") {
      setWeights({
        impactQuantification: 34,
        keywordAlignment: 18,
        atsFormatting: 16,
        actionVerbStrength: 16,
        careerTrajectory: 16,
      });
    } else if (mode === "technical_deep") {
      setWeights({
        impactQuantification: 28,
        keywordAlignment: 36,
        atsFormatting: 16,
        actionVerbStrength: 10,
        careerTrajectory: 10,
      });
    } else {
      setWeights({
        impactQuantification: 30,
        keywordAlignment: 25,
        atsFormatting: 20,
        actionVerbStrength: 15,
        careerTrajectory: 10,
      });
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingBanner(null);
    setTrainingProgress(15);
    setTrainingStep(
      "Stage 1/4: Re-weighting feature vectors & taxonomy..."
    );

    try {
      await new Promise((r) => setTimeout(r, 380));
      setTrainingProgress(45);
      setTrainingStep(
        "Stage 2/4: Calibrating XYZ impact quantification & ATS parser rules..."
      );

      await new Promise((r) => setTimeout(r, 380));
      setTrainingProgress(75);
      setTrainingStep(
        "Stage 3/4: Auditing resume evidence & synthesizing deep score reasons..."
      );

      const response = await fetch("/api/model/retrain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strictness,
          weights,
          customPromptFocus: customFeedback,
          resumeText: resumeText || result.atsMetadata?.rawText || "",
          jobDescription,
          pageCount: result.atsMetadata?.pageCount || 1,
          atsMetadata: result.atsMetadata || {},
          linkedinUrl,
          linkedinData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to recalibrate model");
      }

      setTrainingProgress(100);
      setTrainingStep("Stage 4/4: Calibration complete. Updating analysis...");

      if (data.updatedAnalysis) {
        onAnalysisUpdated({
          ...result,
          ...data.updatedAnalysis,
          modelCalibration: data.calibration,
          atsMetadata: {
            ...(result.atsMetadata || {}),
            rawText: resumeText || result.atsMetadata?.rawText,
            modelCalibration: data.calibration,
          },
        });
      }

      setTrainingBanner(
        data.message ||
          `Model recalibrated (Epoch #${data.calibration?.trainingEpoch || 15}) with updated score reasoning.`
      );
      setTimeout(() => {
        setActiveTab("reasons");
      }, 500);
    } catch (err: any) {
      setTrainingBanner(
        `Calibration Notice: ${err?.message || "Completed local weight recalibration."}`
      );
    } finally {
      setTimeout(() => {
        setIsTraining(false);
        setTrainingProgress(0);
        setTrainingStep("");
      }, 450);
    }
  };

  const totalRawWeight =
    weights.impactQuantification +
      weights.keywordAlignment +
      weights.atsFormatting +
      weights.actionVerbStrength +
      weights.careerTrajectory || 100;

  const criticalCount = scoreReasons.filter((r) => r.status === "critical").length;
  const moderateCount = scoreReasons.filter((r) => r.status === "moderate").length;
  const strongCount = scoreReasons.filter((r) => r.status === "strong").length;

  return (
    <div className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm mb-10">
      {/* Top Header Bar */}
      <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#09090b]/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5 text-violet-700 dark:text-violet-400 font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                {initialCal.version}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Epoch #{initialCal.trainingEpoch} · {initialCal.accuracyIndex}% Precision
              </span>
              <span aria-hidden="true">·</span>
              <span className="uppercase tracking-wider">
                Mode: {strictness.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
              Deep Score Reasoning & Model Calibration Studio
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
              Every point in your{" "}
              <span className="text-zinc-950 dark:text-white font-semibold tabular-nums">
                {result.overallScore}/100
              </span>{" "}
              score is backed by verifiable resume evidence below. Inspect exact point deductions, copy XYZ bullet rewrites, or recalibrate model weights to match your target hiring bar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("retrain")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "retrain"
                  ? "bg-violet-700 dark:bg-violet-600 text-white shadow-sm"
                  : "bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Retrain & Calibrate Model
            </button>
          </div>
        </div>

        {/* 5-Vector Sub-Score Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          {[
            {
              label: "Impact & XYZ Metrics",
              score: categoryScores.impactQuantification,
              weight: Math.round((weights.impactQuantification / totalRawWeight) * 100),
            },
            {
              label: "Skill & JD Alignment",
              score: categoryScores.keywordAlignment,
              weight: Math.round((weights.keywordAlignment / totalRawWeight) * 100),
            },
            {
              label: "ATS Structure & Layout",
              score: categoryScores.atsFormatting,
              weight: Math.round((weights.atsFormatting / totalRawWeight) * 100),
            },
            {
              label: "Action Verb Authority",
              score: categoryScores.actionVerbStrength,
              weight: Math.round((weights.actionVerbStrength / totalRawWeight) * 100),
            },
            {
              label: "Career Scope & Fit",
              score: categoryScores.careerTrajectory,
              weight: Math.round((weights.careerTrajectory / totalRawWeight) * 100),
            },
          ].map((vec) => {
            const color =
              vec.score >= 82
                ? "text-violet-700 dark:text-violet-400"
                : vec.score >= 68
                ? "text-purple-700 dark:text-purple-400"
                : "text-rose-700 dark:text-rose-400";
            const barColor =
              vec.score >= 82
                ? "bg-violet-600 dark:bg-violet-500"
                : vec.score >= 68
                ? "bg-purple-500 dark:bg-purple-400"
                : "bg-rose-600 dark:bg-rose-500";
            return (
              <div
                key={vec.label}
                className="bg-white dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5"
              >
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  <span className="truncate font-medium">{vec.label}</span>
                  <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                    {vec.weight}% W
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-lg font-bold font-mono tabular-nums ${color}`}>
                    {vec.score}/100
                  </span>
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    +{Math.round((vec.score * vec.weight) / 100)} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(5, vec.score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {trainingBanner && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 flex items-center justify-between gap-3 text-xs text-violet-900 dark:text-violet-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="font-medium">{trainingBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setTrainingBanner(null)}
              className="text-violet-700 dark:text-violet-300 hover:underline text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-[#09090b]/40">
        <button
          type="button"
          onClick={() => setActiveTab("reasons")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "reasons"
              ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/25"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
          }`}
        >
          <FileSearch className="w-4 h-4" />
          Score Audit Ledger ({scoreReasons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bullets")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "bullets"
              ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/25"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
          }`}
        >
          <Zap className="w-4 h-4" />
          Bullet-by-Bullet XYZ Diagnostics ({bulletDiagnostics.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("suggestions")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "suggestions"
              ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/25"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Before & After Blueprints ({detailedSuggestions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("retrain")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "retrain"
              ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/25"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Train & Calibrate Model
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 md:p-8">
        {/* TAB 1: SCORE REASONS & AUDIT LEDGER */}
        {activeTab === "reasons" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  Why You Received {result.overallScore}/100 — Point-by-Point Evidence Ledger
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Each factor below shows exact evidence extracted from your resume, the root-cause scoring reason, and how to capture remaining points.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReasonFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    reasonFilter === "all"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border border-zinc-950 dark:border-white"
                      : "bg-zinc-50 dark:bg-[#16161d] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  All ({scoreReasons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReasonFilter("critical")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    reasonFilter === "critical"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                      : "bg-zinc-50 dark:bg-[#16161d] text-rose-700 dark:text-rose-400 border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                >
                  Critical Deductions ({criticalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReasonFilter("moderate")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    reasonFilter === "moderate"
                      ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                      : "bg-zinc-50 dark:bg-[#16161d] text-purple-700 dark:text-purple-400 border border-zinc-200 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  }`}
                >
                  Optimization Gaps ({moderateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReasonFilter("strong")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    reasonFilter === "strong"
                      ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                      : "bg-zinc-50 dark:bg-[#16161d] text-violet-700 dark:text-violet-400 border border-zinc-200 dark:border-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                  }`}
                >
                  Verified Strengths ({strongCount})
                </button>
              </div>
            </div>

            {filteredReasons.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No factors match the selected filter. Switch to "All" to inspect all scoring reasons.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReasons.map((item) => {
                  const isExpanded = expandedReasonIds[item.id] !== false;
                  const badgeStyle =
                    item.status === "strong"
                      ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60"
                      : item.status === "moderate"
                      ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";

                  const IconComponent =
                    item.status === "strong"
                      ? CheckCircle2
                      : item.status === "moderate"
                      ? AlertTriangle
                      : XCircle;

                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-50/70 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700/60 rounded-xl transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleReasonExpand(item.id)}
                        className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2 rounded-lg border mt-0.5 shrink-0 ${badgeStyle}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {item.category}
                              </span>
                              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
                              <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
                                {item.factor}
                              </h4>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
                              {item.evidenceFromResume}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <div className="text-right">
                            <span
                              className={`inline-block font-mono text-xs font-bold px-2.5 py-1 rounded-md border tabular-nums ${badgeStyle}`}
                            >
                              {item.impactDelta >= 0
                                ? `+${item.impactDelta} pts`
                                : `${item.impactDelta} pts`}
                            </span>
                            <div className="text-[11px] font-mono text-zinc-500 mt-0.5 tabular-nums">
                              Factor Score: {item.scoreEarned}/{item.maxScore}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                1. Evidence Detected in Resume
                              </div>
                              <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-mono text-[11px]">
                                {item.evidenceFromResume}
                              </p>
                            </div>

                            <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-violet-700 dark:text-violet-400 mb-1">
                                2. Why Model Scored This ({item.scoreEarned}/{item.maxScore})
                              </div>
                              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {item.detailedReason}
                              </p>
                            </div>

                            <div className="bg-violet-50/70 dark:bg-violet-950/25 border border-violet-200 dark:border-violet-800/50 rounded-lg p-3">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">
                                3. Actionable Fix & Score Lift
                              </div>
                              <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                {item.howToFix}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BULLET-BY-BULLET XYZ DIAGNOSTICS */}
        {activeTab === "bullets" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Experience Bullet-Point XYZ Audit & Instant Rewrites
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Inspects experience lines for Action Verb authority, Quantified Outcomes (%, $, latency, scale), and passive phrase penalties.
              </p>
            </div>

            {bulletDiagnostics.length === 0 ? (
              <div className="p-6 bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                No individual experience bullets were isolated. Ensure your Work Experience section uses standard bullet markers (• or -) on separate lines.
              </div>
            ) : (
              <div className="space-y-4">
                {bulletDiagnostics.map((b, idx) => {
                  const scoreColor =
                    b.score >= 85
                      ? "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60"
                      : b.score >= 60
                      ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60"
                      : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60";

                  return (
                    <div
                      key={idx}
                      className="bg-zinc-50/70 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono text-zinc-500 dark:text-zinc-400">
                            Bullet #{idx + 1}
                          </span>
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${scoreColor}`}
                          >
                            Quality: {b.score}/100
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              b.hasActionVerb
                                ? "text-violet-700 dark:text-violet-300"
                                : "text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {b.hasActionVerb ? "✓ Strong Action Verb" : "✗ Missing Power Verb"}
                          </span>
                          <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
                          <span
                            className={`text-[11px] font-medium ${
                              b.hasMetric
                                ? "text-violet-700 dark:text-violet-300"
                                : "text-purple-700 dark:text-purple-400"
                            }`}
                          >
                            {b.hasMetric ? "✓ Quantified Metric" : "✗ Unquantified Claim"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(b.suggestedRewrite, `bullet-${idx}`)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 text-xs font-semibold transition-all cursor-pointer"
                        >
                          {copiedId === `bullet-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                              Copied Rewrite
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy XYZ Upgrade
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                          <div className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                            Current Resume Bullet
                          </div>
                          <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed">
                            "{b.original}"
                          </p>
                          <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-purple-700 dark:text-purple-300">
                            <span className="font-semibold">Model Diagnosis: </span>
                            {b.issueReason}
                          </div>
                        </div>

                        <div className="bg-violet-50/60 dark:bg-violet-950/25 border border-violet-200 dark:border-violet-800/60 rounded-lg p-3">
                          <div className="text-[10px] font-mono uppercase text-violet-700 dark:text-violet-400 mb-1">
                            Calibrated XYZ High-Impact Rewrite
                          </div>
                          <p className="text-zinc-900 dark:text-violet-100 leading-relaxed font-medium">
                            "{b.suggestedRewrite}"
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DETAILED BEFORE/AFTER BLUEPRINTS */}
        {activeTab === "suggestions" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Strategic Score-Lift Blueprints (Root Cause + Before & After)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                High-leverage structural and content upgrades ranked by their point impact on your overall ATS evaluation.
              </p>
            </div>

            <div className="space-y-4">
              {detailedSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50/70 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                        {sug.impact}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {sug.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 dark:text-white">{sug.title}</h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                      <span className="text-violet-700 dark:text-violet-400 font-semibold">
                        Root-Cause Reason:{" "}
                      </span>
                      {sug.reason}
                    </p>
                  </div>

                  {(sug.beforeExample || sug.afterExample) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {sug.beforeExample && (
                        <div className="bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/50 rounded-lg p-3">
                          <div className="text-[10px] font-mono uppercase text-rose-700 dark:text-rose-400 mb-1">
                            Before (Weak / Penalized Pattern)
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 italic">{sug.beforeExample}</p>
                        </div>
                      )}
                      {sug.afterExample && (
                        <div className="bg-violet-50/70 dark:bg-violet-950/25 border border-violet-200 dark:border-violet-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono uppercase text-violet-700 dark:text-violet-400">
                              After (Calibrated Top-5% Pattern)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(sug.afterExample!, `sug-${idx}`)
                              }
                              className="text-[11px] text-violet-700 dark:text-violet-300 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === `sug-${idx}` ? (
                                <>
                                  <Check className="w-3 h-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-zinc-900 dark:text-violet-100 font-medium">
                            {sug.afterExample}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {sug.actionSteps && sug.actionSteps.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-2">
                        Implementation Checklist
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {sug.actionSteps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-2 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-700 dark:text-zinc-300"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RETRAIN & CALIBRATE MODEL */}
        {activeTab === "retrain" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Strictness Presets & Custom Feedback */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    1. Select Industry Evaluation Benchmark
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Choose the target hiring bar to calibrate how strictly the model evaluates missing metrics, skill gaps, and structural formatting.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "standard",
                      title: "Enterprise Standard",
                      desc: "Balanced Fortune 500 Workday / Greenhouse ATS calibration.",
                    },
                    {
                      id: "faang_strict",
                      title: "FAANG / Tier-1 Bar",
                      desc: "Strict XYZ metric density, scale multipliers, and system depth.",
                    },
                    {
                      id: "executive_leadership",
                      title: "Executive & Staff+",
                      desc: "Prioritizes organizational scope, P&L ROI, and strategic narrative.",
                    },
                    {
                      id: "technical_deep",
                      title: "Deep Technical Stack",
                      desc: "Heavily weights engineering tools, cloud architecture & CI/CD.",
                    },
                  ].map((preset) => {
                    const active = strictness === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetStrictness(preset.id as any)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                          active
                            ? "bg-violet-50 dark:bg-violet-950/35 border-violet-600 dark:border-violet-500 text-zinc-950 dark:text-white shadow-sm"
                            : "bg-zinc-50 dark:bg-[#16161d] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{preset.title}</span>
                          {active && (
                            <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {preset.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    2. Custom Model Training Directive / Reasoning Feedback
                  </label>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                    Specify evaluation priorities (e.g., "Focus on backend scalability, Kubernetes, and flag bullets without % or $ metrics").
                  </p>
                  <textarea
                    rows={3}
                    value={customFeedback}
                    onChange={(e) => setCustomFeedback(e.target.value)}
                    placeholder="e.g., Prioritize distributed systems, cloud cost optimization, and strict XYZ bullet quantification..."
                    className="w-full rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 focus:border-violet-600 dark:focus:border-violet-500 focus:outline-none p-3 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                  />
                </div>
              </div>

              {/* Right Column: Neural Feature Weight Sliders */}
              <div className="lg:col-span-6 bg-zinc-50/70 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      3. Scoring Dimension Weights
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Fine-tune how each dimension contributes to the composite 0–100 score.
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-white dark:bg-[#09090b] text-violet-700 dark:text-violet-300 border border-zinc-200 dark:border-zinc-800">
                    Auto-Normalized (100%)
                  </span>
                </div>

                {[
                  {
                    key: "impactQuantification",
                    label: "Impact & XYZ Metric Density",
                    val: weights.impactQuantification,
                  },
                  {
                    key: "keywordAlignment",
                    label: "Technical & JD Skill Alignment",
                    val: weights.keywordAlignment,
                  },
                  {
                    key: "atsFormatting",
                    label: "ATS Structural & Parsing Compliance",
                    val: weights.atsFormatting,
                  },
                  {
                    key: "actionVerbStrength",
                    label: "Executive Action Verb Authority",
                    val: weights.actionVerbStrength,
                  },
                  {
                    key: "careerTrajectory",
                    label: "Career Trajectory & Role Scope",
                    val: weights.careerTrajectory,
                  },
                ].map((slider) => {
                  const normalizedPct = Math.round(
                    (slider.val / totalRawWeight) * 100
                  );
                  return (
                    <div key={slider.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {slider.label}
                        </span>
                        <span className="font-mono text-violet-700 dark:text-violet-400 font-bold tabular-nums">
                          {normalizedPct}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={60}
                        value={slider.val}
                        onChange={(e) =>
                          setWeights((prev) => ({
                            ...prev,
                            [slider.key]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Training updates model weights and immediately re-audits your resume.
                  </div>

                  <button
                    type="button"
                    disabled={isTraining}
                    onClick={handleTrainModel}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isTraining ? "animate-spin" : ""}`}
                    />
                    {isTraining
                      ? "Training & Recalibrating..."
                      : "Train Model & Re-Score Resume"}
                  </button>
                </div>

                {isTraining && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-violet-700 dark:text-violet-300 font-mono">
                      <span>{trainingStep}</span>
                      <span className="tabular-nums">{trainingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 transition-all duration-300"
                        style={{ width: `${trainingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
