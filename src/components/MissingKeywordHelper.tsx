import React, { useState } from "react";
import {
  Copy,
  Check,
  X,
  ArrowRight,
  Target,
  FileText,
  Layers,
  Wand2,
  BookOpen,
} from "lucide-react";

export interface MissingKeywordHelperProps {
  keyword: string | null;
  targetRole?: string;
  foundSkills?: string[];
  existingOptimization?: { keyword: string; suggestedPhrases: string[] };
  anchorPosition?: { top: number; left: number } | null;
  onClose: () => void;
  onOpenResumeBuilder?: (keyword: string) => void;
}

export function generateKeywordPlacementRecommendations(
  keyword: string,
  targetRole: string = "Professional",
  suggestedPhrases?: string[]
): {
  primarySentence: string;
  recommendedSection: string;
  alternativeSentence: string;
  skillsHeadline: string;
  atsWeightReason: string;
} {
  const kw = keyword.trim();
  const kwLower = kw.toLowerCase();
  const cleanRole = targetRole || "Software Engineer";

  if (suggestedPhrases && suggestedPhrases.length > 0) {
    const primary = suggestedPhrases[0].includes(kw)
      ? suggestedPhrases[0]
      : `Spearheaded initiatives utilizing ${kw}, driving measurable efficiency gains of 35% across core operations.`;
    const alternative =
      suggestedPhrases[1] ||
      `Architected and optimized production workflows leveraging ${kw} to improve system resilience.`;

    return {
      primarySentence: primary,
      recommendedSection: "Professional Experience (Most Recent Role)",
      alternativeSentence: alternative,
      skillsHeadline: `${kw} · System Architecture · Process Optimization`,
      atsWeightReason: `Scored in top 15% of semantic requirements for ${cleanRole} job descriptions.`,
    };
  }

  if (kwLower.includes("docker") || kwLower.includes("container") || kwLower.includes("kubernetes")) {
    return {
      primarySentence: `Architected, containerized, and deployed mission-critical microservices using ${kw}, scaling throughput by 42% while reducing infrastructure costs.`,
      recommendedSection: "Professional Experience (Bullet 1 or 2)",
      alternativeSentence: `Standardized enterprise CI/CD deployment pipelines around ${kw}, reducing deployment rollback frequency by 60%.`,
      skillsHeadline: `${kw}, Cloud Infrastructure, CI/CD, Container Orchestration`,
      atsWeightReason:
        "Core infrastructure requirement with high parsing priority in modern DevOps and Engineering filters.",
    };
  }

  if (kwLower.includes("aws") || kwLower.includes("cloud") || kwLower.includes("azure") || kwLower.includes("gcp")) {
    return {
      primarySentence: `Designed and governed highly available cloud architectures on ${kw}, achieving 99.99% uptime SLA across distributed systems serving 2M+ active users.`,
      recommendedSection: "Professional Experience (Lead / Senior Position)",
      alternativeSentence: `Migrated legacy on-prem workloads to ${kw}, executing automated cost-optimization policies that reduced annual cloud spend by $120K.`,
      skillsHeadline: `${kw}, Distributed Systems, Cloud Architecture, Scalability`,
      atsWeightReason:
        "Heavy-weight ATS keyword essential for demonstrating cloud computing seniority and scale.",
    };
  }

  if (
    kwLower.includes("sql") ||
    kwLower.includes("postgres") ||
    kwLower.includes("mongo") ||
    kwLower.includes("database") ||
    kwLower.includes("data")
  ) {
    return {
      primarySentence: `Engineered high-concurrency database queries and indexing strategies in ${kw}, accelerating query response times by 3.5x for reporting pipelines.`,
      recommendedSection: "Professional Experience (Technical Achievements)",
      alternativeSentence: `Modeled and partitioned relational data schemas in ${kw} to support real-time analytical dashboards and high-volume ETL pipelines.`,
      skillsHeadline: `${kw}, Data Modeling, Query Tuning, ETL Engineering`,
      atsWeightReason:
        "Critical technical competency often parsed during initial database and backend filtration.",
    };
  }

  if (
    kwLower.includes("agile") ||
    kwLower.includes("scrum") ||
    kwLower.includes("leadership") ||
    kwLower.includes("management") ||
    kwLower.includes("cross-functional")
  ) {
    return {
      primarySentence: `Championed ${kw} best practices across a cross-functional team of 12 engineers, product managers, and designers, shortening sprint velocity cycles by 25%.`,
      recommendedSection: "Professional Experience (Leadership & Collaboration)",
      alternativeSentence: `Orchestrated ${kw} ceremonies and stakeholder retrospectives, aligning quarterly product deliverables with strategic business KPIs.`,
      skillsHeadline: `${kw}, Cross-Functional Leadership, Sprint Planning, Team Mentorship`,
      atsWeightReason:
        "High-value executive filter demonstrating organizational maturity and leadership competence.",
    };
  }

  if (
    kwLower.includes("python") ||
    kwLower.includes("typescript") ||
    kwLower.includes("react") ||
    kwLower.includes("node") ||
    kwLower.includes("java") ||
    kwLower.includes("golang")
  ) {
    return {
      primarySentence: `Engineered performant, production-grade applications using modern ${kw}, establishing strict unit-testing suites that raised test coverage to 92%.`,
      recommendedSection: "Professional Experience (Core Technical Impact)",
      alternativeSentence: `Refactored legacy codebase into modular ${kw} components, decreasing bundle size by 30% and significantly boosting end-user responsiveness.`,
      skillsHeadline: `${kw}, Full-Stack Development, Clean Code Architecture, CI/CD`,
      atsWeightReason:
        "Primary language keyword; ATS parser checks for explicit project context and quantified results.",
    };
  }

  if (
    kwLower.includes("security") ||
    kwLower.includes("compliance") ||
    kwLower.includes("audit") ||
    kwLower.includes("soc 2")
  ) {
    return {
      primarySentence: `Implemented enterprise-grade ${kw} controls and automated threat mitigation protocols, passing annual compliance audits with zero critical findings.`,
      recommendedSection: "Professional Experience or Certifications",
      alternativeSentence: `Spearheaded vulnerability scanning and remediation programs incorporating ${kw}, hardening attack vectors across the entire tech stack.`,
      skillsHeadline: `${kw}, Vulnerability Management, Enterprise Governance, Risk Mitigation`,
      atsWeightReason:
        "Crucial regulatory keyword with strong executive weight for enterprise candidates.",
    };
  }

  return {
    primarySentence: `Spearheaded strategic initiatives leveraging ${kw}, driving measurable efficiency gains of 30% and delivering projects 2 weeks ahead of scheduled deadlines.`,
    recommendedSection: "Professional Experience (Experience Bullet Point)",
    alternativeSentence: `Collaborated cross-functionally to integrate ${kw} into daily operational workflows, enhancing overall team deliverable quality by 28%.`,
    skillsHeadline: `${kw} · Strategic Execution · Cross-Functional Alignment`,
    atsWeightReason: `Identified as a top qualifying competency for target ${cleanRole} openings.`,
  };
}

export const MissingKeywordHelper: React.FC<MissingKeywordHelperProps> = ({
  keyword,
  targetRole = "Target Role",
  existingOptimization,
  anchorPosition,
  onClose,
  onOpenResumeBuilder,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!keyword) return null;

  const recommendations = generateKeywordPlacementRecommendations(
    keyword,
    targetRole,
    existingOptimization?.suggestedPhrases
  );

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div
      key={`missing-kw-backdrop-${keyword}`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm sm:p-0"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div
        style={
          anchorPosition && window.innerWidth > 768
            ? {
                position: "fixed",
                top: Math.min(Math.max(anchorPosition.top, 80), window.innerHeight - 480),
                left: Math.min(Math.max(anchorPosition.left - 200, 20), window.innerWidth - 460),
              }
            : undefined
        }
        className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 overflow-hidden"
      >
          {/* Top clean accent bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-600 via-purple-600 to-violet-600" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <span className="text-rose-700 dark:text-rose-400">Missing Keyword Placement</span>
                  <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="text-violet-700 dark:text-violet-400">ATS Impact: High</span>
                </div>
                <h3 className="text-base font-black text-zinc-950 dark:text-white mt-0.5">
                  "{keyword}"
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-3.5 space-y-3.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
                Recommended Section:
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 font-bold text-[11px] flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {recommendations.recommendedSection}
              </span>
            </div>

            {/* Primary Exact Sentence Placement */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-violet-700 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 className="w-3 h-3" /> Recommended Sentence (STAR Format)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(recommendations.primarySentence, "primary")}
                  className="px-2 py-1 rounded bg-white dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Copy sentence to clipboard"
                >
                  {copiedType === "primary" ? (
                    <>
                      <Check className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                      <span className="text-violet-700 dark:text-violet-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy Sentence</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans bg-white dark:bg-[#111116] p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {recommendations.primarySentence}
              </p>
            </div>

            {/* Alternative Sentence Variation */}
            <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Alternative Context Placement
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(recommendations.alternativeSentence, "alt")}
                  className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedType === "alt" ? (
                    <span className="text-violet-700 dark:text-violet-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-normal italic">
                "{recommendations.alternativeSentence}"
              </p>
            </div>

            {/* ATS Parsing Context */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-50/60 dark:bg-violet-950/25 border border-violet-200 dark:border-violet-800/50 text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
              <BookOpen className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-zinc-950 dark:text-white">Why this placement works:</strong>{" "}
                {recommendations.atsWeightReason} Integrating quantified outcomes prevents penalty flags for keyword stuffing.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Dismiss
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(recommendations.primarySentence, "primary")}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                <Copy className="w-3 h-3 text-zinc-500 dark:text-zinc-300" />
                <span>Copy</span>
              </button>

              {onOpenResumeBuilder && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenResumeBuilder(keyword);
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Insert in Builder</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};
