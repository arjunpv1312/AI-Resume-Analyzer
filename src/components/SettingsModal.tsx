import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Key,
  Server,
  Lock,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  maskApiKey,
  isValidGeminiApiKeyFormat,
  copySecretSafely,
} from "../utils/masking";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

interface ServerKeyStatus {
  primaryConfigured: boolean;
  primarySource: string;
  primaryMasked: string | null;
  secondaryConfigured: boolean;
  secondarySource: string;
  secondaryMasked: string | null;
  totalKeys: number;
  sources: string[];
  securityProxyActive: boolean;
  model: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  // Key state (stored securely in session storage if user customizes it)
  const [primaryKey, setPrimaryKey] = useState<string>(() => {
    return sessionStorage.getItem("custom_gemini_api_key") || "";
  });
  const [secondaryKey, setSecondaryKey] = useState<string>(() => {
    return sessionStorage.getItem("custom_gemini_api_key_2") || "";
  });

  // Secure View & Visibility Toggle State
  const [isPrimaryVisible, setIsPrimaryVisible] = useState(false);
  const [isSecondaryVisible, setIsSecondaryVisible] = useState(false);

  // Auto-mask security timers (seconds remaining)
  const [primaryAutoMaskTimer, setPrimaryAutoMaskTimer] = useState<number | null>(null);
  const [secondaryAutoMaskTimer, setSecondaryAutoMaskTimer] = useState<number | null>(null);

  // Copy feedback state
  const [copiedPrimary, setCopiedPrimary] = useState(false);
  const [copiedSecondary, setCopiedSecondary] = useState(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // Server configured key status
  const [serverStatus, setServerStatus] = useState<ServerKeyStatus | null>(null);
  const [isLoadingServerStatus, setIsLoadingServerStatus] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<"keys" | "server" | "security">("keys");

  // Timer intervals
  const primaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const secondaryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch server status on modal open
  useEffect(() => {
    if (isOpen) {
      fetchServerKeysStatus();
    } else {
      // Auto-lock when modal closes
      lockAllKeys();
    }
  }, [isOpen]);

  const fetchServerKeysStatus = async () => {
    setIsLoadingServerStatus(true);
    try {
      const res = await fetch("/api/settings/keys");
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      } else {
        // Fallback to /api/health if settings endpoint is not ready
        const healthRes = await fetch("/api/health");
        const health = await healthRes.json();
        setServerStatus({
          primaryConfigured: Boolean(health.geminiConfigured),
          primarySource: health.sources?.[0] || "GEMINI_API_KEY",
          primaryMasked: health.geminiConfigured ? "AIzaSy••••••••••••••••••••••••••••••" : null,
          secondaryConfigured: (health.sources?.length || 0) > 1,
          secondarySource: health.sources?.[1] || "GEMINI_API_KEY_2",
          secondaryMasked: (health.sources?.length || 0) > 1 ? "AIzaSy••••••••••••••••••••••••••••••" : null,
          totalKeys: health.keysCount || (health.geminiConfigured ? 1 : 0),
          sources: health.sources || [],
          securityProxyActive: true,
          model: "gemini-2.5-flash",
        });
      }
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingServerStatus(false);
    }
  };

  // Lock all keys immediately
  const lockAllKeys = () => {
    setIsPrimaryVisible(false);
    setIsSecondaryVisible(false);
    setPrimaryAutoMaskTimer(null);
    setSecondaryAutoMaskTimer(null);
    if (primaryTimerRef.current) clearInterval(primaryTimerRef.current);
    if (secondaryTimerRef.current) clearInterval(secondaryTimerRef.current);
  };

  // Secure toggle for primary key with 15s auto-mask countdown
  const togglePrimaryVisibility = () => {
    if (isPrimaryVisible) {
      setIsPrimaryVisible(false);
      setPrimaryAutoMaskTimer(null);
      if (primaryTimerRef.current) clearInterval(primaryTimerRef.current);
    } else {
      setIsPrimaryVisible(true);
      setPrimaryAutoMaskTimer(15);
      if (primaryTimerRef.current) clearInterval(primaryTimerRef.current);
      primaryTimerRef.current = setInterval(() => {
        setPrimaryAutoMaskTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(primaryTimerRef.current!);
            setIsPrimaryVisible(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Secure toggle for secondary key with 15s auto-mask countdown
  const toggleSecondaryVisibility = () => {
    if (isSecondaryVisible) {
      setIsSecondaryVisible(false);
      setSecondaryAutoMaskTimer(null);
      if (secondaryTimerRef.current) clearInterval(secondaryTimerRef.current);
    } else {
      setIsSecondaryVisible(true);
      setSecondaryAutoMaskTimer(15);
      if (secondaryTimerRef.current) clearInterval(secondaryTimerRef.current);
      secondaryTimerRef.current = setInterval(() => {
        setSecondaryAutoMaskTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(secondaryTimerRef.current!);
            setIsSecondaryVisible(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Handle Save to Session
  const handleSaveKeys = () => {
    if (primaryKey.trim()) {
      sessionStorage.setItem("custom_gemini_api_key", primaryKey.trim());
    } else {
      sessionStorage.removeItem("custom_gemini_api_key");
    }

    if (secondaryKey.trim()) {
      sessionStorage.setItem("custom_gemini_api_key_2", secondaryKey.trim());
    } else {
      sessionStorage.removeItem("custom_gemini_api_key_2");
    }

    lockAllKeys();
    if (onKeysUpdated) onKeysUpdated();
    testConnection(primaryKey.trim());
  };

  // Clear Custom Session Keys
  const handleClearKeys = () => {
    sessionStorage.removeItem("custom_gemini_api_key");
    sessionStorage.removeItem("custom_gemini_api_key_2");
    setPrimaryKey("");
    setSecondaryKey("");
    lockAllKeys();
    setTestResult(null);
    if (onKeysUpdated) onKeysUpdated();
  };

  // Test API Connection
  const testConnection = async (keyToTest?: string) => {
    setIsTesting(true);
    setTestResult(null);
    const startTime = performance.now();

    try {
      const activeKey = keyToTest !== undefined ? keyToTest : primaryKey.trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeKey) {
        headers["x-gemini-api-key"] = activeKey;
      }

      const res = await fetch("/api/test-gemini", {
        method: "POST",
        headers,
        body: JSON.stringify(activeKey ? { apiKey: activeKey } : {}),
      });

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || "Gemini API key verified & authenticated successfully!",
          latencyMs,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || "Authentication check failed. Please check key validity.",
          latencyMs,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Network error while validating API credentials.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100"
        >
          {/* Modal Header */}
          <div className="p-6 md:p-8 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black font-display tracking-tight text-white">
                    API & Security Settings
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase tracking-wider border border-teal-500/30">
                    Masked Storage
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Secure API credential management with auto-masking protection
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
            <button
              onClick={() => setActiveTab("keys")}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "keys"
                  ? "border-teal-400 text-teal-300 bg-slate-900/40 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>API Credentials</span>
            </button>
            <button
              onClick={() => setActiveTab("server")}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "server"
                  ? "border-teal-400 text-teal-300 bg-slate-900/40 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Environment & Proxy</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "security"
                  ? "border-teal-400 text-teal-300 bg-slate-900/40 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Leak Prevention Policy</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {activeTab === "keys" && (
              <div className="space-y-6">
                {/* Security Banner */}
                <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/20 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 text-slate-300 leading-relaxed">
                    <p className="font-semibold text-teal-200">
                      Zero Plain-Text Display Guarantee
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Keys are masked by default. Revealing keys triggers a 15-second security timer that automatically re-masks them to prevent accidental exposure on screen shares or over-the-shoulder viewing.
                    </p>
                  </div>
                </div>

                {/* Primary Key Input Field */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span>Primary Gemini API Key</span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">
                        GEMINI_API_KEY
                      </code>
                    </label>
                    {isPrimaryVisible && primaryAutoMaskTimer !== null && (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        Auto-masking in {primaryAutoMaskTimer}s
                      </span>
                    )}
                  </div>

                  {/* Masked Preview & Input Group */}
                  <div className="relative">
                    <input
                      type={isPrimaryVisible ? "text" : "password"}
                      value={primaryKey}
                      onChange={(e) => setPrimaryKey(e.target.value)}
                      placeholder={
                        serverStatus?.primaryConfigured
                          ? `Inherited from environment (${serverStatus.primaryMasked})`
                          : "AIzaSy..."
                      }
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all pr-24 tracking-wide"
                    />

                    {/* Action buttons inside input */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {primaryKey.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            copySecretSafely(primaryKey, () => {
                              setCopiedPrimary(true);
                              setTimeout(() => setCopiedPrimary(false), 2000);
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy API key safely"
                        >
                          {copiedPrimary ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={togglePrimaryVisibility}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isPrimaryVisible
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                        }`}
                        title={isPrimaryVisible ? "Mask key now" : "Reveal key securely (15s timer)"}
                      >
                        {isPrimaryVisible ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Masked Representation Display */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Masked View:</span>
                      <code className="bg-slate-950 px-2 py-0.5 rounded text-teal-300 font-mono text-[10px] border border-slate-800">
                        {primaryKey.trim()
                          ? maskApiKey(primaryKey, { mode: "partial" })
                          : serverStatus?.primaryMasked || "••••••••••••••••••••••••••••••••••••"}
                      </code>
                    </span>
                    {primaryKey.trim() && (
                      <span
                        className={`font-semibold ${
                          isValidGeminiApiKeyFormat(primaryKey)
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {isValidGeminiApiKeyFormat(primaryKey)
                          ? "✓ Valid Google AI Key format"
                          : "Custom key length"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Secondary Key Input Field (Failover) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span>Secondary / Failover API Key</span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        GEMINI_API_KEY_2
                      </code>
                    </label>
                    {isSecondaryVisible && secondaryAutoMaskTimer !== null && (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        Auto-masking in {secondaryAutoMaskTimer}s
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={isSecondaryVisible ? "text" : "password"}
                      value={secondaryKey}
                      onChange={(e) => setSecondaryKey(e.target.value)}
                      placeholder={
                        serverStatus?.secondaryConfigured
                          ? `Inherited from environment (${serverStatus.secondaryMasked})`
                          : "Optional backup key for quota failover..."
                      }
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all pr-24 tracking-wide"
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {secondaryKey.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            copySecretSafely(secondaryKey, () => {
                              setCopiedSecondary(true);
                              setTimeout(() => setCopiedSecondary(false), 2000);
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy backup API key safely"
                        >
                          {copiedSecondary ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleSecondaryVisibility}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSecondaryVisible
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                        }`}
                        title={isSecondaryVisible ? "Mask key now" : "Reveal backup key securely (15s timer)"}
                      >
                        {isSecondaryVisible ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Masked View:</span>
                      <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono text-[10px] border border-slate-800">
                        {secondaryKey.trim()
                          ? maskApiKey(secondaryKey, { mode: "partial" })
                          : serverStatus?.secondaryMasked || "Optional / Failover Unset"}
                      </code>
                    </span>
                  </div>
                </div>

                {/* Connection Test & Feedback Card */}
                {testResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                      testResult.success
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/30 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        )}
                        <span>
                          {testResult.success ? "Connection Verified" : "Authentication Issue"}
                        </span>
                      </span>
                      {testResult.latencyMs && (
                        <span className="text-[10px] opacity-80 font-mono">
                          {testResult.latencyMs}ms latency
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {testResult.success ? testResult.message : testResult.error}
                    </p>
                  </div>
                )}

                {/* Actions: Save, Test, Clear */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => testConnection()}
                      disabled={isTesting}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-teal-400" : ""}`}
                      />
                      <span>{isTesting ? "Validating Key..." : "Test Connection"}</span>
                    </button>

                    {(primaryKey || secondaryKey) && (
                      <button
                        type="button"
                        onClick={handleClearKeys}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Clear custom session keys and fallback to environment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveKeys}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save & Apply Key</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "server" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Server className="w-4 h-4 text-teal-400" />
                      <span>Server-Side Proxy Architecture</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All Gemini API requests are dispatched through a secure server-side proxy route (<code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/api/analyze</code>, <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/api/deep-dive</code>).
                    The client browser never makes direct API calls with plain-text credentials, and every server response is automatically scrubbed of API key strings.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Environment Keys Status
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div>
                        <div className="font-semibold text-slate-200">Primary Key</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {serverStatus?.primaryMasked || "Not configured in environment"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          serverStatus?.primaryConfigured
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {serverStatus?.primaryConfigured ? "Configured" : "Unset"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div>
                        <div className="font-semibold text-slate-200">Secondary / Failover Key</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {serverStatus?.secondaryMasked || "Not configured in environment"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          serverStatus?.secondaryConfigured
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {serverStatus?.secondaryConfigured ? "Configured" : "Optional"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Secret Incident Remediation Checklist</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    If GitGuardian or GitHub alerts you to a compromised commit in your git history, follow these security remediation steps:
                  </p>
                  <ol className="text-xs text-slate-300 space-y-2.5 pl-4 list-decimal">
                    <li>
                      <strong>Revoke the old key immediately:</strong> Visit Google AI Studio or Google Cloud Console and delete/revoke any key that was previously committed.
                    </li>
                    <li>
                      <strong>Generate a fresh API key:</strong> Create a new key and configure it in your secure environment variables or via this Settings modal.
                    </li>
                    <li>
                      <strong>Resolve GitGuardian Alert:</strong> Open your GitGuardian incident notification and mark it as <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded font-mono">Resolved: Revoked</code>.
                    </li>
                    <li>
                      <strong>Verify .gitignore:</strong> Your repository includes full ignore patterns for <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono">.env*</code>, preventing accidental future pushes.
                    </li>
                  </ol>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-300">
                    Need to generate or manage your Google Gemini API keys?
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-300 hover:text-teal-200 font-bold flex items-center gap-1.5"
                  >
                    <span>Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
