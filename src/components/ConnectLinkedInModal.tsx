import React, { useState, useEffect } from "react";
import {
  X,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  UserCheck,
  RefreshCw,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Share2,
  Compass,
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
  const [credibilityScore, setCredibilityScore] = useState<number | null>(
    initialTrustScore
  );
  const [retrievalStatus, setRetrievalStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const [importStep, setImportStep] = useState<
    GranularStepKey | "complete" | "idle"
  >("idle");
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

  const normalizeLinkedInUrl = (raw: string): string => {
    const trimmed = raw.trim().replace(/^@/, "");
    if (!trimmed) return "";

    const [base] = trimmed.split(/[?#]/);
    let cleanBase = base.replace(/\/+$/, "");

    if (/^(https?:\/\/)?(www\.)?linkedin\.com\//i.test(cleanBase)) {
      if (!/^https?:\/\//i.test(cleanBase)) {
        cleanBase = "https://" + cleanBase;
      }
      return cleanBase;
    }

    if (/^in\/[a-zA-Z0-9\-_%]+/i.test(cleanBase)) {
      return `https://www.linkedin.com/${cleanBase}`;
    }

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
      setRetrievalStatus(
        "Demo profile imported: All profile data, metrics, and experience validated."
      );
    }, 1100);
  };

  const handleRetrieveProfile = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError(
        "Please enter a LinkedIn profile URL or handle before retrieving data."
      );
      return;
    }

    const normalized = normalizeLinkedInUrl(trimmed);
    if (!normalized.toLowerCase().includes("linkedin.com/in/")) {
      setError(
        "Please provide a valid LinkedIn URL (e.g. linkedin.com/in/username)."
      );
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
      setRetrievalStatus(
        "Step 3 of 3: Validating experience & timeline consistency..."
      );
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
                "Profile retrieval service is temporarily unavailable. Please try again in a moment."
            );
          }
          return;
        }
        throw new Error(
          data.error || "Failed to retrieve profile data from LinkedIn."
        );
      }

      if (data.success && data.formattedData) {
        setImportStep("complete");
        setImportProgress(100);
        setCompletedSteps(["fetching", "syncing", "validating"]);
        setProfileText(data.formattedData);
        setRetrievalStatus(
          data.source === "oauth_authenticated"
            ? "Profile verified & retrieved via LinkedIn OAuth API."
            : "Profile data retrieved and synthesized for ATS alignment."
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
    setRetrievalStatus("Performing verification against resume content...");

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
        `Verification complete: ${data.credibilityScore}% Credibility Score (${data.credibilityTier})`
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
      setError(
        "Please provide a valid LinkedIn profile URL (e.g. linkedin.com/in/your-name)."
      );
      return;
    }

    setError(null);
    onSave(normalized, profileText.trim(), credibilityScore ?? undefined);
    setSuccessNotice(true);
    setTimeout(() => {
      onClose();
      if (typeof credibilityScore === "number") {
        try {
          const hasSeen = localStorage.getItem(
            "has_seen_trust_score_walkthrough"
          );
          if (!hasSeen) {
            onOpenWalkthrough?.();
          }
        } catch {
          // ignore
        }
      }
    }, 350);
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
    <div
      key="connect-linkedin-backdrop"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
    >
      <div
        className="relative max-w-lg w-full bg-white dark:bg-[#111116] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 sm:p-7 max-h-[90vh] overflow-y-auto text-zinc-950 dark:text-zinc-100"
      >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors z-10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
            </div>
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
                  Connect LinkedIn
                </h3>
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                  · Profile Sync Engine
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Retrieve and cross-reference your LinkedIn profile for cross-vector ATS scoring and credibility alignment.
              </p>
            </div>
          </div>

          {/* Connection Status Banner */}
          {isCurrentlyConnected && (
            <div className="mb-5 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                  Currently Connected
                </p>
                <p className="text-[11px] text-violet-700 dark:text-violet-300 font-mono truncate max-w-[240px] sm:max-w-xs mt-0.5">
                  {linkedinUrl}
                </p>
              </div>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                  LinkedIn Profile URL or Handle
                </label>
                <button
                  type="button"
                  onClick={handleApplyDemo}
                  className="text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                >
                  Use Demo Profile
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
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
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-violet-600 transition-colors font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRetrieveProfile}
                  disabled={isRetrieving || !url.trim()}
                  className="px-3.5 py-2.5 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRetrieving ? "animate-spin" : ""}`}
                  />
                  <span>{isRetrieving ? "Retrieving..." : "Retrieve Data"}</span>
                </button>
              </div>

              {currentHandle && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1.5">
                  <span className="text-violet-700 dark:text-violet-300 font-semibold">
                    Detected Handle:
                  </span>
                  <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-zinc-900 dark:text-white">
                    in/{currentHandle}
                  </span>
                </p>
              )}
            </div>

            {/* Granular Import Progress Bar */}
            {(isRetrieving || importStep !== "idle") && (
              <div
                className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
                      {importStep === "complete" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950 dark:text-white">
                        {importStep === "complete"
                          ? "Import Complete"
                          : importStep === "fetching"
                          ? "Fetching Profile Data..."
                          : importStep === "syncing"
                          ? "Syncing Metrics..."
                          : "Validating Experience..."}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {importStep === "complete"
                          ? "LinkedIn data verified and synchronized"
                          : `Step ${
                              importStep === "fetching"
                                ? "1"
                                : importStep === "syncing"
                                ? "2"
                                : "3"
                            } of 3`}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-mono font-bold tabular-nums text-violet-700 dark:text-violet-300">
                    {importProgress}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4c1d95] to-[#7e22ce] rounded-full transition-[width] duration-150"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {GRANULAR_STEPS.map((step, idx) => {
                    const isDone =
                      completedSteps.includes(step.key) ||
                      importStep === "complete";
                    const isCurrent = importStep === step.key && !isDone;
                    return (
                      <div
                        key={step.key}
                        className={`p-2.5 rounded-lg border text-left ${
                          isDone || isCurrent
                            ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700/60"
                            : "bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                            Step 0{idx + 1}
                          </span>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 shrink-0" />
                          ) : isCurrent ? (
                            <RefreshCw className="w-3 h-3 text-violet-600 dark:text-violet-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                          {step.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {step.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional OAuth Token Collapsible Section */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-[#09090b] p-3">
              <button
                type="button"
                onClick={() => setShowAuthOptions(!showAuthOptions)}
                className="w-full flex items-center justify-between text-left text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                  Advanced: Official LinkedIn OAuth Token (Optional)
                </span>
                {showAuthOptions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAuthOptions && (
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                    If you hold a LinkedIn Developer Bearer token, enter it below for OpenID verification.
                  </p>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="AQV..."
                    className="w-full p-2.5 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 font-mono focus:outline-none focus:border-violet-600"
                  />
                </div>
              )}
            </div>

            {/* Profile Summary Context */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                  Synchronized Profile Data & Headline
                </label>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Cross-Vector ATS Feed
                </span>
              </div>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Click 'Retrieve Data' above or paste your LinkedIn headline, about section, or top skills..."
                rows={4}
                className="w-full p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-violet-600 transition-colors resize-none leading-relaxed font-mono"
              />
            </div>

            {/* Trust Score Verification Bar */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    <span>Real-Time Profile vs. Resume Verification</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Cross-check public identity, role seniority, timeline, and skills.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyTrustScore}
                  disabled={isVerifyingTrust}
                  className="px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck
                    className={`w-3.5 h-3.5 ${
                      isVerifyingTrust ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {isVerifyingTrust ? "Verifying..." : "Compute Trust Score"}
                  </span>
                </button>
              </div>

              {credibilityScore !== null && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-950 dark:text-white">
                        Credibility Score
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-violet-700 dark:text-violet-300 font-semibold">
                        {trustReport?.credibilityTier ||
                          (credibilityScore >= 85
                            ? "Verified High Credibility"
                            : credibilityScore >= 70
                            ? "Strong Profile Credibility"
                            : "Moderate Credibility")}
                      </span>
                    </div>
                    <span className="text-lg font-mono font-bold tabular-nums text-violet-700 dark:text-violet-300">
                      {credibilityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-700 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${credibilityScore}%` }}
                    />
                  </div>
                  {trustReport?.trustFactors && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {trustReport.trustFactors.map((tf: any, idx: number) => (
                        <div
                          key={`modal-tf-${tf.name}-${idx}`}
                          className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#111116] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
                        >
                          <span className="truncate pr-2">
                            {tf.name.split(" ")[0]}
                          </span>
                          <span className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-white">
                            {tf.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-950 dark:text-white">
                          Verified Trust Score Ready
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          Launch the Share Card studio or interactive guide.
                        </p>
                      </div>
                    </div>
                    {onOpenWalkthrough && (
                      <button
                        type="button"
                        onClick={() => {
                          const normalized = normalizeLinkedInUrl(url.trim());
                          if (normalized) {
                            onSave(
                              normalized,
                              profileText.trim(),
                              credibilityScore ?? undefined
                            );
                          }
                          onClose();
                          setTimeout(() => {
                            onOpenWalkthrough();
                          }, 300);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Take Tour</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {retrievalStatus && !error && (
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl flex items-center gap-2 text-violet-800 dark:text-violet-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{retrievalStatus}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl flex items-center gap-2 text-violet-800 dark:text-violet-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>LinkedIn profile linked and synchronized!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {isCurrentlyConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Unlink className="w-4 h-4" /> Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-2.5 px-6 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Update LinkedIn
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-2.5 px-6 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> Connect & Save
                  </button>
                </>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
