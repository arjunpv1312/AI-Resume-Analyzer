import React, { forwardRef } from "react";

interface FullReportPrintViewProps {
  result: any;
  fileName?: string;
}

export const FullReportPrintView = forwardRef<HTMLDivElement, FullReportPrintViewProps>(
  ({ result }, ref) => {
    if (!result) return null;

    return (
      <div className="hidden">
        <div
          ref={ref}
          className="p-10 bg-white text-zinc-900 font-sans max-w-4xl mx-auto space-y-8"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          {/* Header Banner */}
          <div className="border-b-2 border-violet-700 pb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">
                Executive Career Intelligence Report
              </h1>
              <p className="text-sm font-bold text-violet-700 uppercase tracking-wider mt-1">
                Target Role: {result.careerPath?.topRole || result.targetRole || "Executive Position"}
              </p>
            </div>
            <div className="text-right text-xs text-zinc-500 font-semibold">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p className="font-mono text-[10px] text-violet-700 font-bold mt-1">
                Status: Verified Analysis
              </p>
            </div>
          </div>

          {/* 1. Executive Summary */}
          {(result.executiveSummary || result.summary) && (
            <div className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-zinc-200 pb-1 text-violet-800">
                1. Executive Summary
              </h2>
              <p className="text-xs text-zinc-700 leading-relaxed font-medium bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                {result.executiveSummary || result.summary}
              </p>
            </div>
          )}

          {/* 2. Core Score Card Grid */}
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-zinc-200 pb-1 text-violet-800">
              2. Core Benchmarks & ATS Scores
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl text-center">
                <span className="text-[10px] font-extrabold text-violet-900 uppercase block">
                  Overall Match
                </span>
                <span className="text-2xl font-black text-violet-700 tabular-nums">
                  {result.overallScore}%
                </span>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                <span className="text-[10px] font-extrabold text-purple-900 uppercase block">
                  ATS Parsing
                </span>
                <span className="text-2xl font-black text-purple-700 tabular-nums">
                  {result.atsCompatibility}%
                </span>
              </div>
              <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-xl text-center">
                <span className="text-[10px] font-extrabold text-violet-900 uppercase block">
                  Skills Match
                </span>
                <span className="text-2xl font-black text-violet-800 tabular-nums">
                  {result.skillsMatch}%
                </span>
              </div>
              <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-xl text-center">
                <span className="text-[10px] font-extrabold text-zinc-800 uppercase block">
                  Formatting
                </span>
                <span className="text-2xl font-black text-zinc-900 tabular-nums">
                  {result.formattingHealthScore || result.atsAnalysis?.formattingScore || 85}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. Skill Gap Analysis */}
          {result.skillGapReport && result.skillGapReport.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-zinc-200 pb-1 text-violet-800">
                3. Skill Gap Analysis & Missing Requirements
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {result.skillGapReport.map((gap: any, idx: number) => (
                  <div
                    key={`print-gap-${gap.skill || idx}-${idx}`}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-zinc-900 uppercase block">
                        {gap.skill}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold">
                        Priority Requirement
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                        gap.importance === "Critical"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {gap.importance}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Career Roadmap & Trajectory */}
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-zinc-200 pb-1 text-violet-800">
              4. Career Trajectory & Pivots
            </h2>
            <div className="p-4 bg-[#09090b] text-white rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider block">
                    Primary Target Fit
                  </span>
                  <span className="text-base font-bold">{result.careerPath?.topRole}</span>
                </div>
                <span className="text-lg font-black text-purple-300 tabular-nums">
                  {result.careerPath?.confidence}% Match
                </span>
              </div>

              {result.careerPath?.alternatives && result.careerPath.alternatives.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">
                    Alternative Trajectory Pivots
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {result.careerPath.alternatives.slice(0, 2).map((alt: any, idx: number) => (
                      <div
                        key={`print-alt-${alt.role || idx}-${idx}`}
                        className="p-2.5 bg-[#16161d] rounded-lg border border-zinc-800"
                      >
                        <span className="text-xs font-bold text-white block">{alt.role}</span>
                        <span className="text-[10px] text-violet-400 font-bold tabular-nums">
                          {alt.match}% Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Strategic Optimization Checklist */}
          {result.improvementPlan && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-zinc-200 pb-1 text-violet-800">
                5. Strategic Optimization Checklist
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {result.improvementPlan.resumeHeadlineUpdates && (
                  <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-black text-violet-900 uppercase block">
                      Title Updates
                    </span>
                    <ul className="text-xs text-zinc-700 space-y-1 list-disc pl-4 font-medium">
                      {result.improvementPlan.resumeHeadlineUpdates
                        .slice(0, 2)
                        .map((u: string, i: number) => (
                          <li key={`print-hl-${u.slice(0, 15)}-${i}`}>{u}</li>
                        ))}
                    </ul>
                  </div>
                )}
                {result.improvementPlan.formattingFixes && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-black text-rose-800 uppercase block">
                      Layout Fixes
                    </span>
                    <ul className="text-xs text-zinc-700 space-y-1 list-disc pl-4 font-medium">
                      {result.improvementPlan.formattingFixes
                        .slice(0, 2)
                        .map((f: string, i: number) => (
                          <li key={`print-fmt-${f.slice(0, 15)}-${i}`}>{f}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-zinc-200 pt-4 text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">
            Confidential • Executive Career Intelligence Report
          </div>
        </div>
      </div>
    );
  }
);

FullReportPrintView.displayName = "FullReportPrintView";
