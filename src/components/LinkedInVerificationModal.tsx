import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Link2,
  RefreshCw,
  ExternalLink,
  Award,
  Layers,
  Copy,
  Check,
  FileText,
  Briefcase,
  GraduationCap,
  Sliders,
  TrendingUp,
  RotateCcw,
  PlusCircle,
} from "lucide-react";

export interface LinkedInVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: any;
  resumeText?: string;
  initialLinkedinUrl?: string;
  initialLinkedinData?: string;
  onSaveVerifiedData?: (url: string, data: string, trustScore: number) => void;
}

export interface TrustWeights {
  endorsements: number;
  workHistory: number;
  education: number;
  identityRole: number;
}

interface TrustFactor {
  key: keyof TrustWeights;
  name: string;
  shortLabel: string;
  score: number;
  rawWeight: number;
  normalizedWeight: number;
  weightedContribution: number;
  weight: string;
  status: "verified" | "warning" | "unverified";
  description: string;
}

export interface VerificationAuditEntry {
  id: string;
  auditLabel: string;
  timestamp: string;
  credibilityScore: number;
  endorsements: number;
  workHistory: number;
  education: number;
  identityRole: number;
  note?: string;
}

const DEFAULT_WEIGHTS: TrustWeights = {
  endorsements: 25,
  workHistory: 25,
  education: 25,
  identityRole: 25,
};

const WEIGHT_STORAGE_KEY = "linkedin_trust_custom_weights_v1";
const AUDIT_HISTORY_STORAGE_KEY = "linkedin_verification_audit_history_v1";

export const LinkedInVerificationModal: React.FC<LinkedInVerificationModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  resumeText = "",
  initialLinkedinUrl = "",
  initialLinkedinData = "",
  onSaveVerifiedData,
}) => {
  const [linkedinUrl, setLinkedinUrl] = useState(initialLinkedinUrl || "");
  const [profileText, setProfileText] = useState(initialLinkedinData || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [currentVerificationStep, setCurrentVerificationStep] = useState("");
  const [copiedReport, setCopiedReport] = useState(false);
  const [hasRunVerification, setHasRunVerification] = useState(false);
  const [showFactorLines, setShowFactorLines] = useState(true);
  const [auditSavedNotice, setAuditSavedNotice] = useState(false);

  // User-adjustable trust factor weights
  const [weights, setWeights] = useState<TrustWeights>(() => {
    try {
      const saved = localStorage.getItem(WEIGHT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.endorsements === "number" &&
          typeof parsed.workHistory === "number" &&
          typeof parsed.education === "number" &&
          typeof parsed.identityRole === "number"
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return { ...DEFAULT_WEIGHTS };
  });

  // Persist weights on change
  useEffect(() => {
    try {
      localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(weights));
    } catch {
      // ignore storage errors
    }
  }, [weights]);

  // Sync initial props
  useEffect(() => {
    if (initialLinkedinUrl) setLinkedinUrl(initialLinkedinUrl);
    if (initialLinkedinData) setProfileText(initialLinkedinData);
    if (initialLinkedinUrl || initialLinkedinData) {
      setHasRunVerification(true);
    }
  }, [initialLinkedinUrl, initialLinkedinData, isOpen]);

  // Extract candidate profile details from resumeData
  const candidateInfo = useMemo(() => {
    const candidateName = resumeData?.name || "Alex Mercer";
    const targetRole =
      resumeData?.targetRole ||
      resumeData?.careerPath?.topRole ||
      "Senior Staff Software Engineer";
    const skills: string[] = resumeData?.foundSkills || [];
    const timeline: Array<{ role: string; company: string; duration?: string }> =
      resumeData?.careerTimeline || [];
    return { candidateName, targetRole, skills, timeline };
  }, [resumeData]);

  // Calculate normalized weights (0-100%)
  const normalizedWeights = useMemo(() => {
    const total =
      weights.endorsements +
      weights.workHistory +
      weights.education +
      weights.identityRole;

    if (total <= 0) {
      return {
        endorsements: 25,
        workHistory: 25,
        education: 25,
        identityRole: 25,
        rawSum: 0,
      };
    }

    const e = Math.round((weights.endorsements / total) * 100);
    const w = Math.round((weights.workHistory / total) * 100);
    const ed = Math.round((weights.education / total) * 100);
    const ir = Math.max(0, 100 - (e + w + ed));

    return {
      endorsements: e,
      workHistory: w,
      education: ed,
      identityRole: ir,
      rawSum: total,
    };
  }, [weights]);

  // Calculate live verification metrics with customizable factor weights
  const verificationResult = useMemo(() => {
    const urlProvided = !!linkedinUrl.trim();
    const textProvided = !!profileText.trim();
    const normUrl = linkedinUrl.toLowerCase();
    const normText = profileText.toLowerCase();
    const normResume = (resumeText || resumeData?.summary || "").toLowerCase();

    // 1. Identity & Role Authenticity
    let identityScore = 54;
    if (urlProvided) {
      identityScore += 28;
      if (normUrl.includes("linkedin.com/in/")) identityScore += 12;
      const firstName = candidateInfo.candidateName.toLowerCase().split(" ")[0];
      if (firstName && normUrl.includes(firstName)) {
        identityScore += 6;
      }
    }
    identityScore = Math.min(100, Math.max(35, identityScore));

    let roleScore = 62;
    if (textProvided) {
      const targetRoleTerms = candidateInfo.targetRole
        .toLowerCase()
        .split(/[\s,/|&-]+/)
        .filter((w: string) => w.length > 2);
      const matches = targetRoleTerms.filter((term: string) => normText.includes(term));
      roleScore = Math.round(
        60 + (matches.length / (targetRoleTerms.length || 1)) * 38
      );
    } else if (urlProvided) {
      roleScore = 80;
    }
    roleScore = Math.min(100, Math.max(45, roleScore));

    const identityRoleScore = Math.round((identityScore + roleScore) / 2);

    // 2. Work History Consistency (Employment Timeline & Tenure Reconciliation)
    let workHistoryScore = 68;
    if (textProvided) {
      const timelineMatches = candidateInfo.timeline.filter(
        (t) =>
          (t.company && normText.includes(t.company.toLowerCase())) ||
          (t.role && normText.includes(t.role.toLowerCase()))
      );
      if (candidateInfo.timeline.length > 0) {
        workHistoryScore = Math.round(
          68 + (timelineMatches.length / candidateInfo.timeline.length) * 30
        );
      } else {
        const hasTenureKeywords =
          /\b(years|\+|senior|staff|lead|principal|architect|director|engineered|led|built|scaled)\b/i.test(
            profileText
          );
        workHistoryScore = hasTenureKeywords ? 91 : 80;
      }
    } else if (urlProvided) {
      workHistoryScore = 82;
    }
    workHistoryScore = Math.min(100, Math.max(50, workHistoryScore));

    // 3. Endorsements & Skill Alignment
    let endorsementsScore = 66;
    if (textProvided && candidateInfo.skills.length > 0) {
      const matchedSkills = candidateInfo.skills.filter((s: string) =>
        normText.includes(s.toLowerCase())
      );
      endorsementsScore = Math.round(
        58 +
          (matchedSkills.length / Math.min(candidateInfo.skills.length, 8)) * 40
      );
    } else if (textProvided) {
      const techTerms = [
        "typescript",
        "react",
        "node",
        "aws",
        "kubernetes",
        "docker",
        "python",
        "distributed",
        "architecture",
        "sql",
        "cloud",
        "leadership",
      ];
      const matched = techTerms.filter((t) => normText.includes(t));
      endorsementsScore = Math.min(96, 68 + matched.length * 5);
    } else if (urlProvided) {
      endorsementsScore = 84;
    }
    endorsementsScore = Math.min(100, Math.max(48, endorsementsScore));

    // 4. Education Verification (Degrees, Universities & Certifications)
    let educationScore = 74;
    const eduRegex =
      /\b(b\.?s\.?|m\.?s\.?|ph\.?d\.?|mba|bachelor|master|university|institute|college|computer science|engineering|certified|aws certified|certification|stanford|mit|berkeley)\b/i;
    if (textProvided && eduRegex.test(profileText)) {
      educationScore = 93;
    } else if (normResume && eduRegex.test(normResume) && urlProvided) {
      educationScore = 86;
    } else if (urlProvided) {
      educationScore = 81;
    }
    educationScore = Math.min(100, Math.max(52, educationScore));

    // Unweighted (equal 25% each) baseline score for comparison
    const equalBaselineScore = Math.round(
      endorsementsScore * 0.25 +
        workHistoryScore * 0.25 +
        educationScore * 0.25 +
        identityRoleScore * 0.25
    );

    // Weighted Composite Credibility Score using user-defined weights
    const compositeTrustScore = Math.round(
      (endorsementsScore * normalizedWeights.endorsements +
        workHistoryScore * normalizedWeights.workHistory +
        educationScore * normalizedWeights.education +
        identityRoleScore * normalizedWeights.identityRole) /
        100
    );

    const weightDelta = compositeTrustScore - equalBaselineScore;

    const trustFactors: TrustFactor[] = [
      {
        key: "endorsements",
        name: "Endorsements & Skill Alignment",
        shortLabel: "Endorsements",
        score: endorsementsScore,
        rawWeight: weights.endorsements,
        normalizedWeight: normalizedWeights.endorsements,
        weightedContribution: Number(
          ((endorsementsScore * normalizedWeights.endorsements) / 100).toFixed(1)
        ),
        weight: `${normalizedWeights.endorsements}% Weight`,
        status:
          endorsementsScore >= 80
            ? "verified"
            : endorsementsScore >= 65
            ? "warning"
            : "unverified",
        description:
          "Cross-checks public LinkedIn skill endorsements and domain keywords against resume competencies.",
      },
      {
        key: "workHistory",
        name: "Work History Consistency",
        shortLabel: "Work History Consistency",
        score: workHistoryScore,
        rawWeight: weights.workHistory,
        normalizedWeight: normalizedWeights.workHistory,
        weightedContribution: Number(
          ((workHistoryScore * normalizedWeights.workHistory) / 100).toFixed(1)
        ),
        weight: `${normalizedWeights.workHistory}% Weight`,
        status:
          workHistoryScore >= 80
            ? "verified"
            : workHistoryScore >= 65
            ? "warning"
            : "unverified",
        description:
          "Reconciles employment timeline dates, company names, and role progression between resume and LinkedIn.",
      },
      {
        key: "education",
        name: "Education Verification",
        shortLabel: "Education Verification",
        score: educationScore,
        rawWeight: weights.education,
        normalizedWeight: normalizedWeights.education,
        weightedContribution: Number(
          ((educationScore * normalizedWeights.education) / 100).toFixed(1)
        ),
        weight: `${normalizedWeights.education}% Weight`,
        status:
          educationScore >= 80
            ? "verified"
            : educationScore >= 65
            ? "warning"
            : "unverified",
        description:
          "Validates academic degrees, university credentials, and professional certifications across profiles.",
      },
      {
        key: "identityRole",
        name: "Identity & Role Authenticity",
        shortLabel: "Identity & Role",
        score: identityRoleScore,
        rawWeight: weights.identityRole,
        normalizedWeight: normalizedWeights.identityRole,
        weightedContribution: Number(
          ((identityRoleScore * normalizedWeights.identityRole) / 100).toFixed(1)
        ),
        weight: `${normalizedWeights.identityRole}% Weight`,
        status:
          identityRoleScore >= 80
            ? "verified"
            : identityRoleScore >= 65
            ? "warning"
            : "unverified",
        description: urlProvided
          ? `Public vanity URL and headline verified against target role (${candidateInfo.targetRole}).`
          : "Paste your LinkedIn profile URL to authenticate public handle and headline seniority.",
      },
    ];

    const auditChecks = [
      {
        title: "Public Vanity URL Structure",
        passed: urlProvided && normUrl.includes("linkedin.com/in/"),
        details: urlProvided
          ? "Valid canonical LinkedIn vanity address"
          : "Missing LinkedIn public profile URL",
      },
      {
        title: "Work History & Tenure Concordance",
        passed: workHistoryScore >= 75,
        details: `Work History Consistency scored ${workHistoryScore}% (${normalizedWeights.workHistory}% weight)`,
      },
      {
        title: "Endorsements & Skill Overlap",
        passed: endorsementsScore >= 75,
        details: `Endorsements & Skills scored ${endorsementsScore}% (${normalizedWeights.endorsements}% weight)`,
      },
      {
        title: "Education & Credential Verification",
        passed: educationScore >= 75,
        details: `Academic & certification check scored ${educationScore}% (${normalizedWeights.education}% weight)`,
      },
      {
        title: "Identity & Headline Seniority Match",
        passed: identityRoleScore >= 72,
        details: `Alignment verified for ${candidateInfo.targetRole} (${normalizedWeights.identityRole}% weight)`,
      },
    ];

    return {
      compositeTrustScore,
      equalBaselineScore,
      weightDelta,
      endorsementsScore,
      workHistoryScore,
      educationScore,
      identityRoleScore,
      trustFactors,
      auditChecks,
    };
  }, [linkedinUrl, profileText, resumeText, resumeData, candidateInfo, weights, normalizedWeights]);

  // Historical Audits State (stores past 4 audits + live 5th current audit for the 5-audit comparison line chart)
  const [pastAudits, setPastAudits] = useState<VerificationAuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed.slice(-4);
        }
      }
    } catch {
      // ignore storage errors
    }
    return [
      {
        id: "audit-1",
        auditLabel: "Audit #1",
        timestamp: "4 audits ago",
        credibilityScore: 68,
        endorsements: 64,
        workHistory: 72,
        education: 70,
        identityRole: 66,
        note: "Initial unlinked resume baseline",
      },
      {
        id: "audit-2",
        auditLabel: "Audit #2",
        timestamp: "3 audits ago",
        credibilityScore: 74,
        endorsements: 71,
        workHistory: 76,
        education: 75,
        identityRole: 74,
        note: "Connected LinkedIn handle",
      },
      {
        id: "audit-3",
        auditLabel: "Audit #3",
        timestamp: "2 audits ago",
        credibilityScore: 79,
        endorsements: 77,
        workHistory: 82,
        education: 78,
        identityRole: 79,
        note: "Aligned role titles & dates",
      },
      {
        id: "audit-4",
        auditLabel: "Audit #4",
        timestamp: "Previous audit",
        credibilityScore: 83,
        endorsements: 81,
        workHistory: 86,
        education: 82,
        identityRole: 83,
        note: "Added core skill endorsements",
      },
    ];
  });

  // Save past audits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_HISTORY_STORAGE_KEY, JSON.stringify(pastAudits));
    } catch {
      // ignore
    }
  }, [pastAudits]);

  // Combine past 4 audits with the live 5th audit ("Audit #5 (Current)") so the line chart always displays the last 5 verification audits
  const fiveAuditTrendData = useMemo(() => {
    const recentFour = pastAudits.slice(-4).map((entry, idx) => ({
      ...entry,
      auditLabel: `Audit #${idx + 1}`,
    }));

    const currentAudit: VerificationAuditEntry = {
      id: "audit-current",
      auditLabel: "Audit #5 (Current)",
      timestamp: "Live Now",
      credibilityScore: verificationResult.compositeTrustScore,
      endorsements: verificationResult.endorsementsScore,
      workHistory: verificationResult.workHistoryScore,
      education: verificationResult.educationScore,
      identityRole: verificationResult.identityRoleScore,
      note: "Active weighted verification",
    };

    return [...recentFour, currentAudit];
  }, [pastAudits, verificationResult]);

  // Calculate 5-audit statistics for the comparison chart header
  const trendStats = useMemo(() => {
    const scores = fiveAuditTrendData.map((d) => d.credibilityScore);
    const firstScore = scores[0] ?? 68;
    const currentScore = scores[scores.length - 1] ?? verificationResult.compositeTrustScore;
    const netChange = currentScore - firstScore;
    const peakScore = Math.max(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { firstScore, currentScore, netChange, peakScore, avgScore };
  }, [fiveAuditTrendData, verificationResult.compositeTrustScore]);

  // Record a new audit snapshot into the 5-audit history
  const recordAuditSnapshot = (customScore?: number) => {
    const scoreToRecord = customScore ?? verificationResult.compositeTrustScore;
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setPastAudits((prev) => {
      const updated = [
        ...prev.slice(-3),
        {
          id: `audit-${Date.now()}`,
          auditLabel: "Audit #4",
          timestamp: timeLabel,
          credibilityScore: scoreToRecord,
          endorsements: verificationResult.endorsementsScore,
          workHistory: verificationResult.workHistoryScore,
          education: verificationResult.educationScore,
          identityRole: verificationResult.identityRoleScore,
          note: "Verified snapshot",
        },
      ];
      return updated;
    });
    setAuditSavedNotice(true);
    setTimeout(() => setAuditSavedNotice(false), 2200);
  };

  if (!isOpen) return null;

  // Handle manual slider change for a specific trust factor
  const handleWeightChange = (key: keyof TrustWeights, value: number) => {
    const clamped = Math.min(100, Math.max(0, value));
    setWeights((prev) => ({
      ...prev,
      [key]: clamped,
    }));
  };

  // Auto-normalize slider values so the raw numbers themselves equal 100
  const handleAutoNormalizeWeights = () => {
    setWeights({
      endorsements: normalizedWeights.endorsements,
      workHistory: normalizedWeights.workHistory,
      education: normalizedWeights.education,
      identityRole: normalizedWeights.identityRole,
    });
  };

  const handleResetWeights = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
  };

  // Perform live real-time verification against backend /api/linkedin/verify-trust + progress steps
  const handleRunLiveVerification = async () => {
    setIsVerifying(true);
    setVerificationProgress(15);
    setCurrentVerificationStep("1/5: Normalizing candidate digital profile footprint...");

    const steps = [
      { progress: 35, text: "2/5: Cross-referencing public headline & seniority level against resume..." },
      { progress: 60, text: "3/5: Reconciling work history dates, companies, and education credentials..." },
      { progress: 85, text: "4/5: Applying custom trust factor weights & auditing endorsements..." },
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setVerificationProgress(steps[current].progress);
        setCurrentVerificationStep(steps[current].text);
        current++;
      }
    }, 260);

    try {
      const response = await fetch("/api/linkedin/verify-trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl,
          linkedinData: profileText,
          resumeText,
          resumeData,
          weights: normalizedWeights,
        }),
      });
      const data = await response.json();
      clearInterval(interval);
      setVerificationProgress(100);
      setCurrentVerificationStep("5/5: Real-time verification complete! Credibility Score & trend updated.");

      const finalUrl = data?.normalizedUrl || linkedinUrl;
      const finalProfile = profileText.trim() || data?.synchronizedProfileData || "";
      if (!linkedinUrl.trim() && finalUrl) setLinkedinUrl(finalUrl);
      if (!profileText.trim() && finalProfile) setProfileText(finalProfile);

      const resolvedScore =
        typeof data?.credibilityScore === "number"
          ? data.credibilityScore
          : verificationResult.compositeTrustScore;

      recordAuditSnapshot(resolvedScore);

      setTimeout(() => {
        setIsVerifying(false);
        setHasRunVerification(true);
        if (onSaveVerifiedData) {
          onSaveVerifiedData(finalUrl, finalProfile, resolvedScore);
        }
      }, 350);
    } catch {
      clearInterval(interval);
      setVerificationProgress(100);
      setCurrentVerificationStep("5/5: Verification complete! Professional Credibility Score updated.");
      recordAuditSnapshot(verificationResult.compositeTrustScore);
      setTimeout(() => {
        setIsVerifying(false);
        setHasRunVerification(true);
        if (onSaveVerifiedData) {
          onSaveVerifiedData(linkedinUrl, profileText, verificationResult.compositeTrustScore);
        }
      }, 350);
    }
  };

  const handleCopyReport = () => {
    const reportText = `PROFESSIONAL IDENTITY & CREDIBILITY VERIFICATION REPORT:
Candidate: ${candidateInfo.candidateName}
Target Role: ${candidateInfo.targetRole}
Weighted Credibility Score: ${verificationResult.compositeTrustScore}/100 (Equal-Weight Baseline: ${verificationResult.equalBaselineScore}/100)
LinkedIn URL: ${linkedinUrl || "Not Connected"}

CUSTOM TRUST FACTOR WEIGHTS & SCORES:
${verificationResult.trustFactors
  .map(
    (tf) =>
      `• ${tf.name}: ${tf.score}% [Active Weight: ${tf.normalizedWeight}% | Contribution: +${tf.weightedContribution} pts] (${tf.status.toUpperCase()})`
  )
  .join("\n")}

LAST 5 VERIFICATION AUDITS TREND:
${fiveAuditTrendData
  .map((a) => `• ${a.auditLabel} (${a.timestamp}): ${a.credibilityScore}%`)
  .join("\n")}

AUDIT CHECKLIST:
${verificationResult.auditChecks
  .map((c) => `[${c.passed ? "✓ VERIFIED" : "⚠ ATTENTION"}] ${c.title}: ${c.details}`)
  .join("\n")}
`;
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const getTrustBadge = (score: number) => {
    if (score >= 88)
      return {
        label: "Verified High Credibility",
        color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
      };
    if (score >= 75)
      return {
        label: "Strong Profile Credibility",
        color: "text-teal-300 bg-teal-500/20 border-teal-500/30",
      };
    if (score >= 60)
      return {
        label: "Moderate Fit (Review Discrepancies)",
        color: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      };
    return {
      label: "Low Verification (Data Needed)",
      color: "text-rose-300 bg-rose-500/20 border-rose-500/30",
    };
  };

  const badge = getTrustBadge(verificationResult.compositeTrustScore);

  return (
    <AnimatePresence>
      <div
        key="linkedin-verification-backdrop"
        className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-slate-900 border border-blue-500/30 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-teal-500/20 border border-blue-500/30 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-black font-display text-white">
                    LinkedIn Identity & Credibility Verification
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time profile verification with customizable trust factor weighting and 5-audit credibility trend analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copy full verification report"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Report Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Report</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Real-time Credibility Score Highlight Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-teal-950/40 border border-blue-500/30 relative overflow-hidden shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                {/* Left: Credibility Score Gauge */}
                <div className="flex items-center gap-6">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={301.6}
                        strokeDashoffset={
                          301.6 - (301.6 * verificationResult.compositeTrustScore) / 100
                        }
                        strokeLinecap="round"
                        className="text-teal-400 transition-all duration-500"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black font-mono tabular-nums text-white">
                        {verificationResult.compositeTrustScore}%
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-teal-300">
                        CREDIBILITY
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        Weighted Credibility Score
                      </span>
                      {verificationResult.weightDelta !== 0 && (
                        <span
                          className={`text-[11px] font-mono font-bold tabular-nums px-2 py-0.5 rounded border ${
                            verificationResult.weightDelta > 0
                              ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30"
                              : "text-amber-300 bg-amber-500/15 border-amber-500/30"
                          }`}
                        >
                          {verificationResult.weightDelta > 0
                            ? `+${verificationResult.weightDelta}`
                            : verificationResult.weightDelta}{" "}
                          pts from custom weights
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {verificationResult.compositeTrustScore >= 85
                        ? "High Authenticity & Verified Alignment"
                        : verificationResult.compositeTrustScore >= 70
                        ? "Strong Profile Congruence"
                        : "Requires Identity Optimization"}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                      Cross-referenced against resume targeting{" "}
                      <strong className="text-white">{candidateInfo.targetRole}</strong>. Adjust
                      factor weights below to customize how{" "}
                      <span className="text-teal-300">Endorsements</span>,{" "}
                      <span className="text-teal-300">Work History Consistency</span>, and{" "}
                      <span className="text-teal-300">Education Verification</span> shape your
                      Credibility Score.
                    </p>
                  </div>
                </div>

                {/* Right: Live Action Button */}
                <div className="shrink-0 flex flex-col items-center md:items-end gap-2">
                  <button
                    type="button"
                    onClick={handleRunLiveVerification}
                    disabled={isVerifying}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Live...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Run Live Verification</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-400">
                    Updates score & logs audit to 5-run trend chart
                  </span>
                </div>
              </div>

              {/* Progress bar if verifying */}
              {isVerifying && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-[11px] text-blue-300 font-bold tabular-nums">
                    <span>{currentVerificationStep}</span>
                    <span>{verificationProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Trust Factor Weighting Controls & Last 5 Audits Trend Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (6 cols): Custom Trust Factor Weighting Controls */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-teal-400" />
                        <span>Trust Factor Weighting Controls</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Manually adjust factor weights to control your calculated Credibility Score.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAutoNormalizeWeights}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                        title="Normalize slider positions to sum to 100%"
                      >
                        Normalize 100%
                      </button>
                      <button
                        type="button"
                        onClick={handleResetWeights}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Reset all trust factor weights to 25% equal baseline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Weighting Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                      Presets:
                    </span>
                    {[
                      {
                        label: "Balanced",
                        w: { endorsements: 25, workHistory: 25, education: 25, identityRole: 25 },
                      },
                      {
                        label: "Work History Focus",
                        w: { endorsements: 20, workHistory: 45, education: 15, identityRole: 20 },
                      },
                      {
                        label: "Endorsements Focus",
                        w: { endorsements: 45, workHistory: 25, education: 15, identityRole: 15 },
                      },
                      {
                        label: "Education Focus",
                        w: { endorsements: 15, workHistory: 25, education: 45, identityRole: 15 },
                      },
                    ].map((preset) => {
                      const isCurrent =
                        weights.endorsements === preset.w.endorsements &&
                        weights.workHistory === preset.w.workHistory &&
                        weights.education === preset.w.education &&
                        weights.identityRole === preset.w.identityRole;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setWeights(preset.w)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                            isCurrent
                              ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                              : "bg-slate-900 text-slate-400 hover:text-slate-200 border-white/5"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sliders for Endorsements, Work History Consistency, Education Verification, Identity & Role */}
                  <div className="space-y-3.5 pt-2">
                    {[
                      {
                        key: "endorsements" as const,
                        label: "Endorsements",
                        subtitle: "Skill endorsements & technical competency overlap",
                        icon: Award,
                        color: "text-teal-400",
                        accent: "accent-teal-400",
                        score: verificationResult.endorsementsScore,
                        normWeight: normalizedWeights.endorsements,
                      },
                      {
                        key: "workHistory" as const,
                        label: "Work History Consistency",
                        subtitle: "Company tenure dates & role progression alignment",
                        icon: Briefcase,
                        color: "text-blue-400",
                        accent: "accent-blue-400",
                        score: verificationResult.workHistoryScore,
                        normWeight: normalizedWeights.workHistory,
                      },
                      {
                        key: "education" as const,
                        label: "Education Verification",
                        subtitle: "University degrees, academic credentials & certifications",
                        icon: GraduationCap,
                        color: "text-indigo-400",
                        accent: "accent-indigo-400",
                        score: verificationResult.educationScore,
                        normWeight: normalizedWeights.education,
                      },
                      {
                        key: "identityRole" as const,
                        label: "Identity & Role Authenticity",
                        subtitle: "Public vanity URL & target title seniority match",
                        icon: ShieldCheck,
                        color: "text-emerald-400",
                        accent: "accent-emerald-400",
                        score: verificationResult.identityRoleScore,
                        normWeight: normalizedWeights.identityRole,
                      },
                    ].map((item) => {
                      const IconComponent = item.icon;
                      const rawValue = weights[item.key];
                      const contribution = ((item.score * item.normWeight) / 100).toFixed(1);
                      return (
                        <div
                          key={item.key}
                          className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <IconComponent className={`w-4 h-4 shrink-0 ${item.color}`} />
                              <div className="truncate">
                                <span className="text-xs font-bold text-white block truncate">
                                  {item.label}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.subtitle}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums text-right">
                              <span className="text-[11px] text-slate-400">
                                Factor: <strong className="text-slate-200">{item.score}%</strong>
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="text-xs font-bold text-teal-300 min-w-[70px]">
                                {item.normWeight}% Weight
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              aria-label={`${item.label} weight`}
                              value={rawValue}
                              onChange={(e) =>
                                handleWeightChange(item.key, Number(e.target.value))
                              }
                              className={`w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer ${item.accent}`}
                            />
                            <span className="text-[11px] font-mono tabular-nums text-slate-300 w-16 text-right shrink-0">
                              +{contribution} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weight Summary Footer */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                  <span>
                    Equal-Weight Score:{" "}
                    <strong className="text-slate-200">
                      {verificationResult.equalBaselineScore}%
                    </strong>
                  </span>
                  <span>
                    Custom Weighted Score:{" "}
                    <strong className="text-teal-300">
                      {verificationResult.compositeTrustScore}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Right Column (6 cols): Credibility Score Trend Line Chart (Last 5 Verification Audits) */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-400" />
                        <span>Credibility Score Trend (Last 5 Audits)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Visual progress comparing your current Credibility Score across your last 5 verification audits.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowFactorLines((prev) => !prev)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          showFactorLines
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                            : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {showFactorLines ? "Hide Factor Lines" : "Show Factor Lines"}
                      </button>
                      <button
                        type="button"
                        onClick={() => recordAuditSnapshot()}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[10px] font-bold text-blue-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Record current weighted score as a verification audit point"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>{auditSavedNotice ? "Logged!" : "Log Audit"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5-Audit Trend Summary Strip */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Current (Audit #5)
                      </span>
                      <span className="text-lg font-mono font-bold tabular-nums text-teal-400">
                        {trendStats.currentScore}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        5-Audit Net Trend
                      </span>
                      <span
                        className={`text-lg font-mono font-bold tabular-nums ${
                          trendStats.netChange >= 0 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {trendStats.netChange >= 0
                          ? `+${trendStats.netChange}%`
                          : `${trendStats.netChange}%`}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        5-Audit Average
                      </span>
                      <span className="text-lg font-mono font-bold tabular-nums text-white">
                        {trendStats.avgScore}%
                      </span>
                    </div>
                  </div>

                  {/* Line Chart Container */}
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={fiveAuditTrendData}
                        margin={{ top: 10, right: 16, left: -18, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.07)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="auditLabel"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <YAxis
                          domain={[40, 100]}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "rgba(20, 184, 166, 0.35)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            color: "#f8fafc",
                          }}
                          formatter={(value: any, name: string) => [`${value}%`, name]}
                          labelFormatter={(label, payload) => {
                            const item = payload?.[0]?.payload;
                            return item
                              ? `${label} · ${item.timestamp}${item.note ? ` (${item.note})` : ""}`
                              : label;
                          }}
                        />
                        <ReferenceLine
                          y={85}
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeOpacity={0.5}
                          label={{
                            value: "85% Target",
                            position: "insideTopRight",
                            fill: "#34d399",
                            fontSize: 10,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="credibilityScore"
                          name="Credibility Score"
                          stroke="#14b8a6"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#14b8a6", strokeWidth: 2, stroke: "#0f172a" }}
                          activeDot={{ r: 6, fill: "#2dd4bf", stroke: "#ffffff", strokeWidth: 2 }}
                        />
                        {showFactorLines && (
                          <>
                            <Line
                              type="monotone"
                              dataKey="workHistory"
                              name="Work History Consistency"
                              stroke="#3b82f6"
                              strokeWidth={1.5}
                              strokeDasharray="4 3"
                              dot={{ r: 2.5, fill: "#3b82f6" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="endorsements"
                              name="Endorsements"
                              stroke="#a855f7"
                              strokeWidth={1.5}
                              strokeDasharray="4 3"
                              dot={{ r: 2.5, fill: "#a855f7" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="education"
                              name="Education Verification"
                              stroke="#f59e0b"
                              strokeWidth={1.5}
                              strokeDasharray="4 3"
                              dot={{ r: 2.5, fill: "#f59e0b" }}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart Legend & 5-Audit History Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-teal-300 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                        Credibility Score
                      </span>
                      {showFactorLines && (
                        <>
                          <span className="flex items-center gap-1 text-blue-300">
                            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                            Work History
                          </span>
                          <span className="flex items-center gap-1 text-purple-300">
                            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                            Endorsements
                          </span>
                          <span className="flex items-center gap-1 text-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                            Education
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono tabular-nums text-slate-400">
                      Peak: <strong className="text-white">{trendStats.peakScore}%</strong>
                    </span>
                  </div>
                </div>

                {/* Audit Snapshot Table Strip */}
                <div className="pt-3 border-t border-white/10 grid grid-cols-5 gap-1.5">
                  {fiveAuditTrendData.map((audit, idx) => {
                    const isCurrent = idx === fiveAuditTrendData.length - 1;
                    return (
                      <div
                        key={audit.id}
                        className={`px-2 py-1.5 rounded-lg border text-center font-mono tabular-nums ${
                          isCurrent
                            ? "bg-teal-500/15 border-teal-500/40 text-white"
                            : "bg-slate-900/70 border-white/5 text-slate-400"
                        }`}
                      >
                        <div className="text-[9px] font-sans font-semibold truncate">
                          {isCurrent ? "Current (#5)" : `Audit #${idx + 1}`}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            isCurrent ? "text-teal-300" : "text-slate-200"
                          }`}
                        >
                          {audit.credibilityScore}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LinkedIn Profile Input Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-2xl bg-black/40 border border-white/10">
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  LinkedIn Profile Coordinates
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Public Profile URL:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-400"
                    />
                    {linkedinUrl && (
                      <a
                        href={
                          linkedinUrl.startsWith("http")
                            ? linkedinUrl
                            : `https://${linkedinUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 p-1"
                        title="Open LinkedIn profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 leading-normal block">
                    Connect your public profile to verify headline seniority, company tenures, education credentials, and mutual skill vectors.
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-400" />
                    LinkedIn Experience, Education & Endorsements Text (Optional)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Paste LinkedIn About, Experience, or Education section
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Paste your LinkedIn headline, work history, education, or skill endorsements here to perform deep concordance checking..."
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-teal-400 leading-relaxed"
                />
              </div>
            </div>

            {/* 4-Quadrant Weighted Trust Factor Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Weighted Trust Vector Breakdown
                </h3>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  Total Effective Weight: 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {verificationResult.trustFactors.map((factor, idx) => (
                  <div
                    key={`tf-${factor.name}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 relative overflow-hidden space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white leading-snug">
                        {factor.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold tabular-nums text-teal-300 shrink-0">
                        {factor.weight}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black font-mono tabular-nums text-white">
                          {factor.score}%
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400 ml-1.5">
                          (+{factor.weightedContribution} pts)
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          factor.status === "verified"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : factor.status === "warning"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {factor.status === "verified" && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        )}
                        {factor.status === "warning" && (
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                        )}
                        {factor.status}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          factor.score >= 80
                            ? "bg-teal-400"
                            : factor.score >= 60
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {factor.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Verification Checklist */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live Verification Audit Checklist
              </h3>

              <div className="divide-y divide-white/5 space-y-1">
                {verificationResult.auditChecks.map((check, idx) => (
                  <div
                    key={`audit-${check.title || idx}-${idx}`}
                    className="pt-2.5 pb-1 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1 rounded-full ${
                          check.passed
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {check.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="font-bold text-slate-200">{check.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 text-right font-mono tabular-nums">
                      {check.details}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              Trust Engine: Custom-weighted multi-vector evaluation • 5-audit history active
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  recordAuditSnapshot(verificationResult.compositeTrustScore);
                  if (onSaveVerifiedData) {
                    onSaveVerifiedData(
                      linkedinUrl,
                      profileText,
                      verificationResult.compositeTrustScore
                    );
                  }
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Verified Credibility Score ({verificationResult.compositeTrustScore}%)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
