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
  skillGapReport: { skill: string; importance: string }[];
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
