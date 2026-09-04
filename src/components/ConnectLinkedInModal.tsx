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
} from "lucide-react";

interface ConnectLinkedInModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedinUrl: string;
  linkedinData?: string;
  resumeContext?: string;
  onSave: (url: string, data?: string) => void;
  onDisconnect: () => void;
}

export function ConnectLinkedInModal({
  isOpen,
  onClose,
  linkedinUrl,
  linkedinData = "",
  resumeContext = "",
  onSave,
  onDisconnect,
}: ConnectLinkedInModalProps) {
  const [url, setUrl] = useState(linkedinUrl || "");
  const [profileText, setProfileText] = useState(linkedinData || "");
  const [accessToken, setAccessToken] = useState("");
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalStatus, setRetrievalStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    setUrl(linkedinUrl || "");
    setProfileText(linkedinData || "");
    setAccessToken("");
    setShowAuthOptions(false);
    setIsRetrieving(false);
    setRetrievalStatus(null);
    setError(null);
    setSuccessNotice(false);
  }, [linkedinUrl, linkedinData, isOpen]);

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
    setProfileText(
      "Headline: Senior Staff Software Engineer & Cloud Architect | Distributed Systems, Node.js, AWS\n\nAbout: 8+ years architecting high-throughput cloud infrastructure and mentoring engineering teams. Built event-driven architectures supporting 5M+ DAUs.\n\nKey Skills: Distributed Systems, Cloud Architecture, Node.js, AWS, Kubernetes, Microservices"
    );
    setError(null);
    setRetrievalStatus("Demo profile loaded and ready for ATS synchronization.");
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
    setRetrievalStatus("Connecting to LinkedIn API gateway & synchronizing profile...");

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

      if (!response.ok) {
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
        setProfileText(data.formattedData);
        setRetrievalStatus(
          data.source === "oauth_authenticated"
            ? "✓ Profile verified & retrieved via LinkedIn OAuth API."
            : "✓ Profile data retrieved and synthesized for ATS alignment."
        );
      }
    } catch (err: any) {
      console.error("Profile retrieval error:", err);
      setError(
        err.message ||
          "Could not retrieve LinkedIn profile data. You can manually enter your headline below."
      );
    } finally {
      setIsRetrieving(false);
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
    onSave(normalized, profileText.trim());
    setSuccessNotice(true);
    setTimeout(() => {
      onClose();
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
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
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

