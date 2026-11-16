import { AnalysisResult } from "../types";

const clampScore = (val: any, fallback = 0): number => {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const normalizeConfidence = (val: any, fallback = 75): number => {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  // Handle both 0-1 normalized decimals (e.g. 0.88) and 0-100 percentages (e.g. 88)
  const scaled = n > 0 && n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(scaled)));
};

const safeStringArray = (val: any): string[] => {
  if (!Array.isArray(val)) return [];
  return val.filter((item) => typeof item === "string" && item.trim().length > 0);
};

export function normalizeAnalysisResult(raw: any): AnalysisResult {
  const input = raw && typeof raw === "object" ? raw : {};

  const rawCareerPath = input.careerPath && typeof input.careerPath === "object" ? input.careerPath : {};
  const rawAts = input.atsAnalysis && typeof input.atsAnalysis === "object" ? input.atsAnalysis : {};
  const rawPlan = input.improvementPlan && typeof input.improvementPlan === "object" ? input.improvementPlan : {};

  const alternatives = Array.isArray(rawCareerPath.alternatives)
    ? rawCareerPath.alternatives
        .filter((a: any) => a && typeof a === "object")
        .map((a: any) => ({
          role: String(a.role || "Adjacent Role"),
          match: normalizeConfidence(a.match, 72),
          reasoning: typeof a.reasoning === "string" ? a.reasoning : "",
        }))
    : [];

  const careerTimeline = Array.isArray(input.careerTimeline)
    ? input.careerTimeline
        .filter((t: any) => t && typeof t === "object")
        .map((t: any) => ({
          role: String(t.role || "Role"),
          company: String(t.company || "Organization"),
          duration: String(t.duration || "Present"),
          highlights: safeStringArray(t.highlights),
        }))
    : [];

  const skillGapReport = Array.isArray(input.skillGapReport)
    ? input.skillGapReport
        .filter((s: any) => s && typeof s === "object")
        .map((s: any) => ({
          skill: String(s.skill || "Skill"),
          importance: String(s.importance || "High"),
          reason: typeof s.reason === "string" ? s.reason : undefined,
        }))
    : [];

  const keywordOptimizations = Array.isArray(rawAts.keywordOptimizations)
    ? rawAts.keywordOptimizations
        .filter((k: any) => k && typeof k === "object")
        .map((k: any) => ({
          keyword: String(k.keyword || ""),
          suggestedPhrases: safeStringArray(k.suggestedPhrases),
        }))
        .filter((k: any) => k.keyword.length > 0)
    : [];

  const rawLinkedIn =
    input.linkedinComparison && typeof input.linkedinComparison === "object"
      ? {
          hasLinkedIn: Boolean(input.linkedinComparison.hasLinkedIn),
          resumeHeadline: String(input.linkedinComparison.resumeHeadline || ""),
          linkedinHeadline: String(input.linkedinComparison.linkedinHeadline || ""),
          matchAnalysis: String(input.linkedinComparison.matchAnalysis || ""),
          missingFromResume: safeStringArray(input.linkedinComparison.missingFromResume),
          missingFromLinkedIn: safeStringArray(input.linkedinComparison.missingFromLinkedIn),
        }
      : undefined;

  return {
    ...input,
    overallScore: clampScore(input.overallScore, 70),
    atsCompatibility: clampScore(input.atsCompatibility, clampScore(rawAts.formattingScore, 72)),
    skillsMatch: clampScore(input.skillsMatch, 70),
    formattingHealthScore: clampScore(
      input.formattingHealthScore ?? rawAts.formattingScore,
      75
    ),
    careerTrajectoryFitScore: clampScore(input.careerTrajectoryFitScore, 75),
    foundSkills: safeStringArray(input.foundSkills),
    missingSkills: safeStringArray(input.missingSkills),
    softSkills: safeStringArray(input.softSkills),
    powerVerbs: safeStringArray(input.powerVerbs),
    scoreReasons: Array.isArray(input.scoreReasons) ? input.scoreReasons : [],
    detailedSuggestions: Array.isArray(input.detailedSuggestions) ? input.detailedSuggestions : [],
    bulletPointAnalysis: Array.isArray(input.bulletPointAnalysis) ? input.bulletPointAnalysis : [],
    improvementPlan: {
      missingSkillsToHighlight: safeStringArray(rawPlan.missingSkillsToHighlight),
      resumeHeadlineUpdates: safeStringArray(rawPlan.resumeHeadlineUpdates),
      recommendedCertifications: safeStringArray(rawPlan.recommendedCertifications),
      projectsToHighlight: safeStringArray(rawPlan.projectsToHighlight),
      formattingFixes: safeStringArray(rawPlan.formattingFixes),
    },
    careerPath: {
      topRole: String(rawCareerPath.topRole || input.targetRole || "Target Role"),
      confidence: normalizeConfidence(rawCareerPath.confidence, 78),
      alternatives,
    },
    careerTimeline,
    linkedinComparison: rawLinkedIn,
    atsAnalysis: {
      formattingScore: clampScore(rawAts.formattingScore, 75),
      keywordDensity: Number.isFinite(Number(rawAts.keywordDensity))
        ? Number(rawAts.keywordDensity)
        : 0,
      bulletPointQualityScore: clampScore(rawAts.bulletPointQualityScore, 70),
      recommendations: safeStringArray(rawAts.recommendations),
      topResumeKeywords: safeStringArray(rawAts.topResumeKeywords),
      jobKeywordsFound: safeStringArray(rawAts.jobKeywordsFound),
      jobKeywordsMissing: safeStringArray(rawAts.jobKeywordsMissing),
      jobKeywordDensity: Number.isFinite(Number(rawAts.jobKeywordDensity))
        ? Number(rawAts.jobKeywordDensity)
        : undefined,
      keywordOptimizations,
    },
    skillGapReport,
    executiveSummary: typeof input.executiveSummary === "string" ? input.executiveSummary : undefined,
    careerTrajectories: Array.isArray(input.careerTrajectories) ? input.careerTrajectories : [],
    sectionsFound: safeStringArray(input.sectionsFound),
    sectionsDetailed: Array.isArray(input.sectionsDetailed) ? input.sectionsDetailed : [],
    summary: String(input.summary || input.executiveSummary || ""),
    suggestions: safeStringArray(input.suggestions),
    interviewQuestions: safeStringArray(input.interviewQuestions),
    resumeRewriteDraft: typeof input.resumeRewriteDraft === "string" ? input.resumeRewriteDraft : undefined,
    coverLetterDraft: typeof input.coverLetterDraft === "string" ? input.coverLetterDraft : undefined,
    globalBenchmarking: typeof input.globalBenchmarking === "string" ? input.globalBenchmarking : undefined,
    recruiterSummary: typeof input.recruiterSummary === "string" ? input.recruiterSummary : undefined,
    targetRole: typeof input.targetRole === "string" ? input.targetRole : String(rawCareerPath.topRole || "Target Role"),
    atsMetadata: input.atsMetadata && typeof input.atsMetadata === "object" ? input.atsMetadata : {},
  };
}
