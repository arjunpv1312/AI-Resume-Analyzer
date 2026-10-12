export interface ScoreReasonItem {
  id: string;
  category:
    | "ATS Structure & Parsing"
    | "Impact & XYZ Quantification"
    | "Technical & Domain Keywords"
    | "Executive & Action Language"
    | "Career Trajectory & Scope";
  factor: string;
  impactDelta: number; // e.g. +14 or -12
  scoreEarned: number;
  maxScore: number;
  status: "strong" | "moderate" | "critical";
  evidenceFromResume: string;
  detailedReason: string;
  howToFix: string;
}

export interface ModelCalibrationConfig {
  version: string;
  strictness: "standard" | "faang_strict" | "executive_leadership" | "technical_deep";
  weights: {
    impactQuantification: number; // %
    keywordAlignment: number; // %
    atsFormatting: number; // %
    actionVerbStrength: number; // %
    careerTrajectory: number; // %
  };
  customPromptFocus?: string;
  lastTrainedAt: string;
  trainingEpoch: number;
  benchmarkDatasetSize: number;
  accuracyIndex: number;
}

export interface DetailedSuggestionItem {
  title: string;
  category: string;
  impact: string;
  reason: string;
  beforeExample?: string;
  afterExample?: string;
  actionSteps: string[];
}

export interface BulletAnalysisItem {
  original: string;
  hasActionVerb: boolean;
  hasMetric: boolean;
  hasWeakPhrase: boolean;
  score: number;
  issueReason: string;
  suggestedRewrite: string;
}

export interface AnalysisResult {
  overallScore: number;
  atsCompatibility: number;
  skillsMatch: number;
  formattingHealthScore?: number;
  careerTrajectoryFitScore?: number;
  foundSkills: string[];
  missingSkills?: string[];
  softSkills?: string[];
  powerVerbs?: string[];
  scoreReasons?: ScoreReasonItem[];
  categoryScores?: {
    impactQuantification: number;
    keywordAlignment: number;
    atsFormatting: number;
    actionVerbStrength: number;
    careerTrajectory: number;
  };
  modelCalibration?: ModelCalibrationConfig;
  detailedSuggestions?: DetailedSuggestionItem[];
  bulletPointAnalysis?: BulletAnalysisItem[];
  improvementPlan?: {
    missingSkillsToHighlight: string[];
    resumeHeadlineUpdates: string[];
    recommendedCertifications: string[];
    projectsToHighlight: string[];
    formattingFixes: string[];
  };
  careerPath: {
    topRole: string;
    confidence: number;
    alternatives: { role: string; match: number; reasoning?: string }[];
  };
  careerTimeline?: {
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  linkedinComparison?: {
    hasLinkedIn: boolean;
    resumeHeadline: string;
    linkedinHeadline: string;
    matchAnalysis: string;
    missingFromResume: string[];
    missingFromLinkedIn: string[];
  };
  atsAnalysis: {
    formattingScore: number;
    keywordDensity: number;
    bulletPointQualityScore?: number;
    recommendations: string[];
    topResumeKeywords?: string[];
    jobKeywordsFound?: string[];
    jobKeywordsMissing?: string[];
    jobKeywordDensity?: number;
    keywordOptimizations?: { keyword: string; suggestedPhrases: string[] }[];
  };
  skillGapReport: { skill: string; importance: string; reason?: string }[];
  executiveSummary?: string;
  careerTrajectories?: {
    title: string;
    timeline: string;
    requiredSkills: string[];
    requiredCertifications: string[];
  }[];
  sectionsFound: string[];
  sectionsDetailed?: { sectionName: string; summary: string }[];
  summary: string;
  suggestions: string[];
  interviewQuestions?: string[];
  resumeRewriteDraft?: string;
  coverLetterDraft?: string;
  globalBenchmarking?: string;
  recruiterSummary?: string;
  targetRole?: string;
  atsMetadata?: {
    ocrUsed?: boolean;
    isScannedPdf?: boolean;
    rulesScore?: number;
    formattingScore?: number;
    parsedLength?: number;
    rawText?: string;
    [key: string]: any;
  };
}
