import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
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

// Generates high-impact, ATS-optimized sentence placement recommendations for any keyword
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

  // Use pre-computed phrase if provided from ATS analysis
  if (suggestedPhrases && suggestedPhrases.length > 0) {
    const primary = suggestedPhrases[0].includes(kw)
      ? suggestedPhrases[0]
      : `Spearheaded initiatives utilizing ${kw}, driving measurable efficiency gains of 35% across core operations.`;
    const alternative = suggestedPhrases[1] || `Architected and optimized production workflows leveraging ${kw} to improve system resilience.`;

    return {
      primarySentence: primary,
      recommendedSection: "Professional Experience (Most Recent Role)",
      alternativeSentence: alternative,
      skillsHeadline: `${kw} • System Architecture • Process Optimization`,
      atsWeightReason: `Scored in top 15% of semantic requirements for ${cleanRole} job descriptions.`,
    };
  }

  // Domain-specific tailored sentence recommendations
  if (kwLower.includes("docker") || kwLower.includes("container") || kwLower.includes("kubernetes")) {
    return {
      primarySentence: `Architected, containerized, and deployed mission-critical microservices using ${kw}, scaling throughput by 42% while reducing infrastructure costs.`,
      recommendedSection: "Professional Experience (Bullet 1 or 2)",
      alternativeSentence: `Standardized enterprise CI/CD deployment pipelines around ${kw}, reducing deployment rollback frequency by 60%.`,
      skillsHeadline: `${kw}, Cloud Infrastructure, CI/CD, Container Orchestration`,
      atsWeightReason: "Core infrastructure requirement with high parsing priority in modern DevOps and Engineering filters.",
    };
  }

  if (kwLower.includes("aws") || kwLower.includes("cloud") || kwLower.includes("azure") || kwLower.includes("gcp")) {
    return {
      primarySentence: `Designed and governed highly available cloud architectures on ${kw}, achieving 99.99% uptime SLA across distributed systems serving 2M+ active users.`,
      recommendedSection: "Professional Experience (Lead / Senior Position)",
      alternativeSentence: `Migrated legacy on-prem workloads to ${kw}, executing automated cost-optimization policies that reduced annual cloud spend by $120K.`,
      skillsHeadline: `${kw}, Distributed Systems, Cloud Architecture, Scalability`,
      atsWeightReason: "Heavy-weight ATS keyword essential for demonstrating cloud computing seniority and scale.",
    };
  }

  if (kwLower.includes("sql") || kwLower.includes("postgres") || kwLower.includes("mongo") || kwLower.includes("database") || kwLower.includes("data")) {
    return {
      primarySentence: `Engineered high-concurrency database queries and indexing strategies in ${kw}, accelerating query response times by 3.5x for reporting pipelines.`,
      recommendedSection: "Professional Experience (Technical Achievements)",
      alternativeSentence: `Modeled and partitioned relational data schemas in ${kw} to support real-time analytical dashboards and high-volume ETL pipelines.`,
      skillsHeadline: `${kw}, Data Modeling, Query Tuning, ETL Engineering`,
      atsWeightReason: "Critical technical competency often parsed during initial database and backend filtration.",
    };
  }

  if (kwLower.includes("agile") || kwLower.includes("scrum") || kwLower.includes("leadership") || kwLower.includes("management") || kwLower.includes("cross-functional")) {
    return {
      primarySentence: `Championed ${kw} best practices across a cross-functional team of 12 engineers, product managers, and designers, shortening sprint velocity cycles by 25%.`,
      recommendedSection: "Professional Experience (Leadership & Collaboration)",
      alternativeSentence: `Orchestrated ${kw} ceremonies and stakeholder retrospectives, aligning quarterly product deliverables with strategic business KPIs.`,
      skillsHeadline: `${kw}, Cross-Functional Leadership, Sprint Planning, Team Mentorship`,
      atsWeightReason: "High-value executive filter demonstrating organizational maturity and leadership competence.",
    };
  }

  if (kwLower.includes("python") || kwLower.includes("typescript") || kwLower.includes("react") || kwLower.includes("node") || kwLower.includes("java") || kwLower.includes("golang")) {
    return {
      primarySentence: `Engineered performant, production-grade applications using modern ${kw}, establishing strict unit-testing suites that raised test coverage to 92%.`,
      recommendedSection: "Professional Experience (Core Technical Impact)",
      alternativeSentence: `Refactored legacy codebase into modular ${kw} components, decreasing bundle size by 30% and significantly boosting end-user responsiveness.`,
      skillsHeadline: `${kw}, Full-Stack Development, Clean Code Architecture, CI/CD`,
      atsWeightReason: "Primary language keyword; ATS parser checks for explicit project context and quantified results.",
    };
  }

  if (kwLower.includes("security") || kwLower.includes("compliance") || kwLower.includes("audit") || kwLower.includes("soc 2")) {
    return {
      primarySentence: `Implemented enterprise-grade ${kw} controls and automated threat mitigation protocols, passing annual compliance audits with zero critical findings.`,
      recommendedSection: "Professional Experience or Certifications",
      alternativeSentence: `Spearheaded vulnerability scanning and remediation programs incorporating ${kw}, hardening attack vectors across the entire tech stack.`,
      skillsHeadline: `${kw}, Vulnerability Management, Enterprise Governance, Risk Mitigation`,
      atsWeightReason: "Crucial regulatory keyword with strong executive weight for enterprise candidates.",
    };
  }

  // Universal high-impact STAR framework placement
  return {
    primarySentence: `Spearheaded strategic initiatives leveraging ${kw}, driving measurable efficiency gains of 30% and delivering projects 2 weeks ahead of scheduled deadlines.`,
    recommendedSection: "Professional Experience (Experience Bullet Point)",
    alternativeSentence: `Collaborated cross-functionally to integrate ${kw} into daily operational workflows, enhancing overall team deliverable quality by 28%.`,
    skillsHeadline: `${kw} • Strategic Execution • Cross-Functional Alignment`,
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:p-0">
        {/* Backdrop dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={
            anchorPosition && window.innerWidth > 768
              ? {
                  position: "fixed",
                  top: Math.min(Math.max(anchorPosition.top, 80), window.innerHeight - 480),
                  left: Math.min(Math.max(anchorPosition.left - 200, 20), window.innerWidth - 460),
                }
              : undefined
          }
          className="relative z-10 w-full max-w-lg bg-slate-900/95 border border-rose-500/40 rounded-2xl shadow-2xl shadow-rose-950/40 p-5 overflow-hidden backdrop-blur-xl"
        >
          {/* Top glowing ambient accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-teal-400" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase">
                    Missing Keyword Placement
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-extrabold border border-rose-500/30">
                    ATS Impact: High
                  </span>
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5 mt-0.5">
                  "{keyword}"
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-3.5 space-y-3.5">
            {/* Section placement guidance tag */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Recommended Section:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-[11px] flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {recommendations.recommendedSection}
              </span>
            </div>

            {/* Primary Exact Sentence Placement */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Recommended Sentence (STAR Format)
                </span>
                <button
                  onClick={() => handleCopy(recommendations.primarySentence, "primary")}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Copy sentence to clipboard"
                >
                  {copiedType === "primary" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Sentence</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-white/5 p-2.5 rounded-lg border border-white/5">
                {recommendations.primarySentence}
              </p>
            </div>

            {/* Alternative Sentence Variation */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Alternative Context Placement
                </span>
                <button
                  onClick={() => handleCopy(recommendations.alternativeSentence, "alt")}
                  className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedType === "alt" ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal italic">
                "{recommendations.alternativeSentence}"
              </p>
            </div>

            {/* ATS Parsing Context */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/20 text-[11px] text-teal-200/90 leading-snug">
              <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <span>
                <strong>Why this placement works:</strong> {recommendations.atsWeightReason} Integrating quantified outcomes (percentages, multipliers) prevents penalty flags for keyword stuffing.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-white/5 transition-all"
            >
              Dismiss
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(recommendations.primarySentence, "primary")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
              >
                <Copy className="w-3 h-3 text-slate-300" />
                <span>Copy</span>
              </button>

              {onOpenResumeBuilder && (
                <button
                  onClick={() => {
                    onOpenResumeBuilder(keyword);
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Insert in Builder</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
