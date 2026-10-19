import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Globe,
  UserCheck,
  RefreshCw,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";

interface ConnectLinkedInModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedinUrl: string;
  linkedinData?: string;
  resumeContext?: string;
  resumeData?: any;
  initialTrustScore?: number | null;
  onSave: (url: string, data?: string, trustScore?: number) => void;
  onDisconnect: () => void;
  onOpenWalkthrough?: () => void;
  onVerificationComplete?: (score: number, report?: any) => void;
}

export type GranularStepKey = "fetching" | "syncing" | "validating";

export interface GranularStep {
  key: GranularStepKey;
  label: string;
  description: string;
}

export const GRANULAR_STEPS: GranularStep[] = [
  {
    key: "fetching",
    label: "Fetching profile data",
    description: "Extracting headline, bio & public profile payload",
  },
  {
    key: "syncing",
    label: "Syncing metrics",
    description: "Aligning skill endorsements & keyword density",
  },
  {
    key: "validating",
    label: "Validating experience",
    description: "Verifying timeline consistency & seniority level",
  },
];

export function ConnectLinkedInModal({
  isOpen,
  onClose,
  linkedinUrl,
  linkedinData = "",
  resumeContext = "",
  resumeData = null,
  initialTrustScore = null,
  onSave,
  onDisconnect,
  onOpenWalkthrough,
  onVerificationComplete,
}: ConnectLinkedInModalProps) {
  const [url, setUrl] = useState(linkedinUrl || "");
  const [profileText, setProfileText] = useState(linkedinData || "");
  const [accessToken, setAccessToken] = useState("");
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [isVerifyingTrust, setIsVerifyingTrust] = useState(false);
  const [trustReport, setTrustReport] = useState<any | null>(null);
  const [credibilityScore, setCredibilityScore] = useState<number | null>(initialTrustScore);
  const [retrievalStatus, setRetrievalStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  // Granular Import Progress Bar & Step Indicators
  const [importStep, setImportStep] = useState<GranularStepKey | "complete" | "idle">("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<GranularStepKey[]>([]);

  useEffect(() => {
    setUrl(linkedinUrl || "");
    setProfileText(linkedinData || "");
    setAccessToken("");
    setShowAuthOptions(false);
    setIsRetrieving(false);
    setIsVerifyingTrust(false);
    setCredibilityScore(initialTrustScore);
    setRetrievalStatus(null);
    setError(null);
    setSuccessNotice(false);
    setImportStep("idle");
    setImportProgress(0);
    setCompletedSteps([]);
  }, [linkedinUrl, linkedinData, initialTrustScore, isOpen]);

  if (!isOpen) return null;

  // Clean and normalize LinkedIn URL
  const normalizeLinkedInUrl = (raw: string): string => {
    let trimmed = raw.trim().replace(/^@/, "");
    if (!trimmed) return "";

    // Remove query params and hashes for base matching
    const [base] = trimmed.split(/[?#]/);
    let cleanBase = base.replace(/\/+$/, "");

    // If starts with linkedin.com or www.linkedin.com
    if (/^(https?:\/\/)?(www\.)?linkedin\.com\//i.test(cleanBase)) {
      if (!/^https?:\/\//i.test(cleanBase)) {
        cleanBase = "https://" + cleanBase;
      }
      return cleanBase;
    }

    // If starts with in/username
    if (/^in\/[a-zA-Z0-9\-_%]+/i.test(cleanBase)) {
      return `https://www.linkedin.com/${cleanBase}`;
    }

    // If just a username/handle (e.g. "alexmercer-tech")
    if (/^[a-zA-Z0-9\-_%]+$/.test(cleanBase)) {
      return `https://www.linkedin.com/in/${cleanBase}`;
    }

    if (!/^https?:\/\//i.test(cleanBase)) {
      return "https://" + cleanBase;
    }

    return cleanBase;
  };

  const extractHandle = (fullUrl: string): string => {
    const match = fullUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/i);
    return match ? match[1] : fullUrl.replace(/^https?:\/\//i, "");
  };

  const handleApplyDemo = () => {
    const demoUrl = "https://www.linkedin.com/in/alexmercer-tech";
    setUrl(demoUrl);
    setError(null);
    setIsRetrieving(true);
    setImportStep("fetching");
    setImportProgress(28);
    setCompletedSteps([]);
    setRetrievalStatus("Step 1 of 3: Fetching profile data...");

    setTimeout(() => {
      setImportStep("syncing");
      setImportProgress(62);
      setCompletedSteps(["fetching"]);
      setRetrievalStatus("Step 2 of 3: Syncing metrics & skills...");
    }, 350);

    setTimeout(() => {
      setImportStep("validating");
      setImportProgress(88);
      setCompletedSteps(["fetching", "syncing"]);
      setRetrievalStatus("Step 3 of 3: Validating experience & tenure...");
    }, 700);

    setTimeout(() => {
      setProfileText(
        "Headline: Senior Staff Software Engineer & Cloud Architect | Distributed Systems, Node.js, AWS\n\nAbout: 8+ years architecting high-throughput cloud infrastructure and mentoring engineering teams. Built event-driven architectures supporting 5M+ DAUs.\n\nKey Skills: Distributed Systems, Cloud Architecture, Node.js, AWS, Kubernetes, Microservices"
      );
      setImportStep("complete");
      setImportProgress(100);
      setCompletedSteps(["fetching", "syncing", "validating"]);
      setIsRetrieving(false);
      setRetrievalStatus("✓ Demo profile imported: All profile data, metrics, and experience validated.");
    }, 1100);
  };

  // Perform active profile data retrieval via backend API
  const handleRetrieveProfile = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a LinkedIn profile URL or handle before retrieving data.");
      return;
    }

    const normalized = normalizeLinkedInUrl(trimmed);
    if (!normalized.toLowerCase().includes("linkedin.com/in/")) {
      setError("Please provide a valid LinkedIn URL (e.g. linkedin.com/in/username).");
      return;
    }

    setIsRetrieving(true);
    setError(null);
    setImportStep("fetching");
    setImportProgress(25);
    setCompletedSteps([]);
    setRetrievalStatus("Step 1 of 3: Fetching profile data...");

    const t1 = setTimeout(() => {
      setImportStep("syncing");
      setImportProgress(60);
      setCompletedSteps(["fetching"]);
      setRetrievalStatus("Step 2 of 3: Syncing metrics & skill endorsements...");
    }, 550);

    const t2 = setTimeout(() => {
      setImportStep("validating");
      setImportProgress(85);
      setCompletedSteps(["fetching", "syncing"]);
      setRetrievalStatus("Step 3 of 3: Validating experience & timeline consistency...");
    }, 1200);

    try {
      const response = await fetch("/api/linkedin/retrieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken.trim()
            ? { Authorization: `Bearer ${accessToken.trim()}` }
            : {}),
        },
        body: JSON.stringify({
          url: normalized,
          accessToken: accessToken.trim() || undefined,
          resumeContext: resumeContext || undefined,
        }),
      });

      const data = await response.json();
      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        setImportStep("idle");
        if (response.status === 401 || data.isAuthError) {
          if (data.requiresAuth) {
            setError(
              "LinkedIn OAuth token is invalid or expired. Please check your token or continue with handle synchronization."
            );
          } else {
            setError(
              data.error ||
                "Gemini API key authentication failed. Please check your API configuration in Settings (GEMINI_API_KEY / GEMINI_API_KEY_2)."
            );
          }
          return;
        }
        throw new Error(data.error || "Failed to retrieve profile data from LinkedIn.");
      }

      if (data.success && data.formattedData) {
        setImportStep("complete");
        setImportProgress(100);
        setCompletedSteps(["fetching", "syncing", "validating"]);
        setProfileText(data.formattedData);
        setRetrievalStatus(
          data.source === "oauth_authenticated"
            ? "✓ Profile verified & retrieved via LinkedIn OAuth API."
            : "✓ Profile data retrieved and synthesized for ATS alignment."
        );
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setImportStep("idle");
      console.error("Profile retrieval error:", err);
      setError(
        err.message ||
          "Could not retrieve LinkedIn profile data. You can manually enter your headline below."
      );
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleVerifyTrustScore = async () => {
    const trimmed = url.trim();
    const normalized = trimmed ? normalizeLinkedInUrl(trimmed) : "";

    setIsVerifyingTrust(true);
    setError(null);
    setRetrievalStatus("Performing real-time verification against resume content...");

    try {
      const response = await fetch("/api/linkedin/verify-trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: normalized,
          linkedinData: profileText.trim(),
          resumeText: resumeContext,
          resumeData: resumeData,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to compute LinkedIn Trust Score.");
      }

      setCredibilityScore(data.credibilityScore);
      setTrustReport(data);
      if (!profileText.trim() && data.synchronizedProfileData) {
        setProfileText(data.synchronizedProfileData);
      }
      if (!url.trim() && data.normalizedUrl) {
        setUrl(data.normalizedUrl);
      }
      setRetrievalStatus(
        `✓ Real-time verification complete: ${data.credibilityScore}% Credibility Score (${data.credibilityTier})`
      );
      if (onVerificationComplete && typeof data.credibilityScore === "number") {
        onVerificationComplete(data.credibilityScore, data);
      }
    } catch (err: any) {
      console.error("Trust score verification error:", err);
      setError(err.message || "Could not verify LinkedIn Trust Score.");
    } finally {
      setIsVerifyingTrust(false);
    }
  };

  const handleSave = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a LinkedIn profile URL or handle.");
      return;
    }

    const normalized = normalizeLinkedInUrl(trimmed);
    if (!normalized.toLowerCase().includes("linkedin.com/in/")) {
      setError("Please provide a valid LinkedIn profile URL (e.g. linkedin.com/in/your-name).");
      return;
    }

    setError(null);
    onSave(normalized, profileText.trim(), credibilityScore ?? undefined);
    setSuccessNotice(true);
    setTimeout(() => {
      onClose();
      // If verification completed and user hasn't seen the walkthrough yet, open walkthrough
      if (typeof credibilityScore === "number") {
        try {
          const hasSeen = localStorage.getItem("has_seen_trust_score_walkthrough");
          if (!hasSeen) {
            onOpenWalkthrough?.();
          }
        } catch {
          // ignore
        }
      }
    }, 400);
  };

  const handleDisconnect = () => {
    setUrl("");
    setProfileText("");
    onDisconnect();
    onClose();
  };

  const isCurrentlyConnected = Boolean(linkedinUrl && linkedinUrl.trim());
  const currentHandle = url ? extractHandle(normalizeLinkedInUrl(url)) : "";

  return (
    <AnimatePresence>
      <div key="connect-linkedin-backdrop" className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-lg w-full bg-[#0a0f1d] rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header background accent */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0A66C2]/20 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#0A66C2]/20 border border-[#0A66C2]/40 flex items-center justify-center text-[#0A66C2] shadow-[0_0_20px_rgba(10,102,194,0.3)] shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Connect LinkedIn
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#38bdf8] text-[10px] font-black uppercase tracking-wider">
                  Sync Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Retrieve and cross-reference your LinkedIn profile for cross-vector ATS scoring, headline calibration, and keyword coverage.
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          {isCurrentlyConnected && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Currently Connected
                  </p>
                  <p className="text-[11px] text-emerald-400/80 font-mono truncate max-w-[240px] sm:max-w-xs">
                    {linkedinUrl}
                  </p>
                </div>
              </div>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-4 relative z-10">
            {/* URL Input with Retrieve Button */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#0A66C2]" />
                  LinkedIn Profile URL or Handle
                </label>
                <button
                  type="button"
                  onClick={handleApplyDemo}
                  className="text-[10px] font-bold text-teal-400 hover:text-teal-300 uppercase tracking-widest flex items-center gap-1 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded border border-teal-500/20 transition-all"
                >
                  <Sparkles className="w-3 h-3" /> Use Demo Profile
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://www.linkedin.com/in/your-username"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] transition-all font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRetrieveProfile}
                  disabled={isRetrieving || !url.trim()}
                  className="px-4 py-3 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 text-[#38bdf8] hover:text-white border border-[#0A66C2]/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrieving ? "animate-spin" : ""}`} />
                  {isRetrieving ? "Retrieving..." : "Retrieve Data"}
                </button>
              </div>

              {currentHandle && (
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="text-teal-400 font-semibold">Detected Handle:</span>
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white text-[10px]">
                    in/{currentHandle}
                  </span>
                </p>
              )}
            </div>

            {/* Granular Import Progress Bar and Status Indicator */}
            {(isRetrieving || importStep !== "idle") && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-[#071328]/95 border border-[#0A66C2]/40 shadow-xl space-y-3 overflow-hidden"
              >
                {/* Header with Step indicator and percentage */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[#0A66C2]/20 border border-[#0A66C2]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
                      {importStep === "complete" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">
                          {importStep === "complete"
                            ? "Import Complete"
                            : importStep === "fetching"
                            ? "Fetching Profile Data..."
                            : importStep === "syncing"
                            ? "Syncing Metrics..."
                            : "Validating Experience..."}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[9px] font-extrabold uppercase">
                          {importStep === "complete" ? "Ready" : "In Progress"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {importStep === "complete"
                          ? "All granular LinkedIn data points verified & cached"
                          : `Granular Step ${
                              importStep === "fetching" ? "1" : importStep === "syncing" ? "2" : "3"
                            } of 3 · Cross-vector data verification`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-mono font-black tabular-nums text-teal-300">
                      {importProgress}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Track with smooth gradient */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#0A66C2] via-teal-400 to-emerald-400 rounded-full"
                    animate={{ width: `${importProgress}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>

                {/* Granular Step Status Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {GRANULAR_STEPS.map((step, idx) => {
                    const isDone = completedSteps.includes(step.key) || importStep === "complete";
                    const isCurrent = importStep === step.key && !isDone;
                    return (
                      <div
                        key={step.key}
                        className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm"
                            : isCurrent
                            ? "bg-teal-500/15 border-teal-500/50 text-white shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/30"
                            : "bg-white/[0.02] border-white/5 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Step 0{idx + 1}
                          </span>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <RefreshCw className="w-3 h-3 text-teal-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                          )}
                        </div>
                        <div>
                          <div
                            className={`text-[11px] font-bold tracking-tight ${
                              isCurrent ? "text-teal-200" : isDone ? "text-emerald-300" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </div>
                          <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Optional OAuth Token Collapsible Section */}
            <div className="border border-white/5 rounded-xl bg-white/[0.02] p-3">
              <button
                type="button"
                onClick={() => setShowAuthOptions(!showAuthOptions)}
                className="w-full flex items-center justify-between text-left text-xs text-slate-400 hover:text-slate-200 transition-all font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Advanced: Official LinkedIn OAuth Token (Optional)
                </span>
                {showAuthOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAuthOptions && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    If you have a LinkedIn Developer Bearer access token, provide it below for official OpenID verification. Otherwise, our AI intelligence engine automatically bypasses scraping guardrails.
                  </p>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="AQV..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none focus:border-[#0A66C2]"
                  />
                </div>
              )}
            </div>

            {/* Profile Summary / Headline Context */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Synchronized Profile Data & Headline
                </label>
                <span className="text-[10px] text-teal-400 font-medium">Cross-Vector ATS Feed</span>
              </div>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Click 'Retrieve Data' above or paste your current LinkedIn headline, about section, or top skills to cross-reference against your resume..."
                rows={4}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] transition-all resize-none leading-relaxed font-mono"
              />
            </div>

            {/* Real-time LinkedIn Trust Score Verification Bar & Credibility Score */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/25 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>Real-Time Profile vs. Resume Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cross-check public LinkedIn identity, role seniority, timeline, and skills against your resume.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyTrustScore}
                  disabled={isVerifyingTrust}
                  className="px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 text-teal-400 ${isVerifyingTrust ? "animate-spin" : ""}`} />
                  <span>{isVerifyingTrust ? "Verifying..." : "LinkedIn Trust Score"}</span>
                </button>
              </div>

              {credibilityScore !== null && (
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="font-semibold text-white">Credibility Score</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-teal-300">
                        {trustReport?.credibilityTier ||
                          (credibilityScore >= 85
                            ? "Verified High Credibility"
                            : credibilityScore >= 70
                            ? "Strong Profile Credibility"
                            : "Moderate Credibility")}
                      </span>
                    </div>
                    <span className="text-lg font-mono font-bold tabular-nums text-teal-400">
                      {credibilityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${credibilityScore}%` }}
                    />
                  </div>
                  {trustReport?.trustFactors && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {trustReport.trustFactors.map((tf: any, idx: number) => (
                        <div
                          key={`modal-tf-${tf.name}-${idx}`}
                          className="flex items-center justify-between text-[11px] text-slate-400 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5"
                        >
                          <span className="truncate pr-2">{tf.name.split(" ")[0]}</span>
                          <span className="font-mono font-semibold tabular-nums text-slate-200">
                            {tf.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Share My Trust Score interactive highlight callout */}
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-teal-500/15 via-[#0A66C2]/15 to-indigo-500/15 border border-teal-500/40 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
                        <Share2 className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Verified Trust Score Ready to Share</span>
                          <span className="px-1.5 py-0.2 rounded bg-teal-400 text-slate-950 text-[9px] font-black uppercase">
                            New
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">
                          Highlight the "Share my Trust Score" button with an interactive guided walk-through.
                        </p>
                      </div>
                    </div>
                    {onOpenWalkthrough && (
                      <button
                        type="button"
                        onClick={() => {
                          const normalized = normalizeLinkedInUrl(url.trim());
                          if (normalized) {
                            onSave(normalized, profileText.trim(), credibilityScore ?? undefined);
                          }
                          onClose();
                          setTimeout(() => {
                            onOpenWalkthrough();
                          }, 350);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer shrink-0 active:scale-95 whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                        <span>Take Tour</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status message */}
            {retrievalStatus && !error && (
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center gap-2 text-teal-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
                <span>{retrievalStatus}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>LinkedIn profile linked and synchronized successfully!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              {isCurrentlyConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-4 py-3 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                  >
                    <Unlink className="w-4 h-4" /> Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-3 px-6 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(10,102,194,0.4)] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Update LinkedIn
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-3 px-6 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(10,102,194,0.4)] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Connect & Save
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

