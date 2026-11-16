import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Zap,
  Target,
  Edit3,
  Check,
  Copy,
  RefreshCcw,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  GitCompare,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Sliders,
} from "lucide-react";
import {
  AtsChatMessage,
  AtsChatModelMode,
  AtsChatPersona,
  AtsResumePatch,
} from "../types";
import { AtsResumeData } from "../utils/docxExport";

interface AtsCopilotChatProps {
  messages: AtsChatMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<AtsChatMessage[]>>;
  persona: AtsChatPersona;
  onPersonaChange: (p: AtsChatPersona) => void;
  modelMode: AtsChatModelMode;
  onModelModeChange: (m: AtsChatModelMode) => void;
  resumeText: string;
  jobDescription: string;
  analysisResult: any;
  currentResumeData: AtsResumeData | null;
  onApplyPatch?: (patch: AtsResumePatch, messageId: string) => void;
  onUndoLastPatch?: () => void;
  canUndo?: boolean;
  onOpenBuilder?: () => void;
  compact?: boolean;
  externalPromptRequest?: { id: number; prompt: string } | null;
}

const PERSONA_META: Record<
  AtsChatPersona,
  { label: string; shortDesc: string; icon: React.ReactNode }
> = {
  scanner: {
    label: "ATS Gap Scanner",
    shortDesc: "Spots missing keywords & weak signals fast",
    icon: <Target className="w-3.5 h-3.5" />,
  },
  recruiter: {
    label: "Hiring Recruiter",
    shortDesc: "6-second scan & executive narrative critique",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  rewriter: {
    label: "XYZ Bullet Coach",
    shortDesc: "Rewrites bullets with quantified impact metrics",
    icon: <Edit3 className="w-3.5 h-3.5" />,
  },
};

const QUICK_PROMPTS = [
  {
    label: "Find What's Missing",
    prompt:
      "Give me a short, crystal-clear breakdown of what is missing from my resume for this job and the best quick fixes I can apply.",
  },
  {
    label: "Fix Weak Bullets",
    prompt:
      "Identify my weakest experience bullets and give quantified XYZ replacements ready to apply.",
  },
  {
    label: "Inject JD Keywords",
    prompt:
      "Which high-priority job description keywords am I missing, and where should I insert them naturally?",
  },
  {
    label: "Tighten Summary",
    prompt:
      "Rewrite my professional summary into a crisp 3-line executive hook aligned to the target role.",
  },
];

export const AtsCopilotChat: React.FC<AtsCopilotChatProps> = ({
  messages,
  onMessagesChange,
  persona,
  onPersonaChange,
  modelMode,
  onModelModeChange,
  resumeText,
  jobDescription,
  analysisResult,
  currentResumeData,
  onApplyPatch,
  onUndoLastPatch,
  canUndo = false,
  onOpenBuilder,
  compact = false,
  externalPromptRequest,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openDiffIds, setOpenDiffIds] = useState<Record<string, boolean>>({});
  const threadEndRef = useRef<HTMLDivElement>(null);
  const lastExternalReqId = useRef<number>(0);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query || isLoading) return;

    const userMsg: AtsChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHistory = [...messages, userMsg];
    onMessagesChange(nextHistory);
    if (!textOverride) setInput("");
    setIsLoading(true);

    try {
      const customKey = sessionStorage.getItem("custom_gemini_api_key");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey) headers["x-gemini-api-key"] = customKey;

      const res = await fetch("/api/ats-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: query,
          chatHistory: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          persona,
          modelMode,
          resumeText,
          jobDescription,
          analysisResult,
          currentResumeData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onMessagesChange((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "model",
            text: data.error || "Unable to complete analysis turn. Please retry.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isError: true,
          },
        ]);
        return;
      }

      const aiMsg: AtsChatMessage = {
        id: `m_${Date.now()}`,
        role: "model",
        text: data.reply || "Here are your top missing gaps and ready-to-apply suggestions.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona,
        modelUsed: data.modelUsed || "gemini-4-hydrogen",
        shortMissingPoints: data.shortMissingPoints || [],
        patches: data.patches || [],
        followUpPrompts: data.followUpPrompts || [],
      };

      onMessagesChange((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      onMessagesChange((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: err?.message || "Network error contacting Gemini ATS Copilot.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (externalPromptRequest && externalPromptRequest.id !== lastExternalReqId.current) {
      lastExternalReqId.current = externalPromptRequest.id;
      sendMessage(externalPromptRequest.prompt);
    }
  }, [externalPromptRequest]);

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1800);
  };

  const toggleDiff = (patchId: string) => {
    setOpenDiffIds((prev) => ({ ...prev, [patchId]: !prev[patchId] }));
  };

  const handleClearChat = () => {
    onMessagesChange([
      {
        id: `welcome_${Date.now()}`,
        role: "model",
        text: "Ready to audit your resume. Ask me what is missing, click a quick gap check below, or click any missing keyword to weave it right in.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona,
        modelUsed: "gemini-4-hydrogen",
        followUpPrompts: [
          "What's missing for this job?",
          "Fix my weakest bullet",
        ],
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 text-slate-100 overflow-hidden">
      {/* Top Role & Model Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate">
                  ATS Gap Copilot
                </h4>
                <span className="text-[10px] font-mono text-teal-400 tabular-nums shrink-0">
                  {modelMode === "fast"
                    ? "Lite"
                    : modelMode === "deep"
                    ? "Deep Think"
                    : modelMode === "standard"
                    ? "Hydrogen"
                    : "Smart Route"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {PERSONA_META[persona].shortDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canUndo && onUndoLastPatch && (
              <button
                type="button"
                onClick={onUndoLastPatch}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                title="Undo last AI resume patch"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset conversation thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Persona Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {(["scanner", "recruiter", "rewriter"] as AtsChatPersona[]).map((pKey) => {
            const active = persona === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => onPersonaChange(pKey)}
                className={`px-2 py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap truncate ${
                  active
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {PERSONA_META[pKey].icon}
                <span className="truncate">{PERSONA_META[pKey].label}</span>
              </button>
            );
          })}
        </div>

        {/* Speed / Depth Selector */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1 shrink-0">
            <Sliders className="w-3 h-3 text-slate-500" /> Depth:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {(
              [
                { id: "auto", label: "Auto" },
                { id: "fast", label: "Fast" },
                { id: "standard", label: "Balanced" },
                { id: "deep", label: "Deep Audit" },
              ] as { id: AtsChatModelMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onModelModeChange(opt.id)}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  modelMode === opt.id
                    ? "bg-slate-800 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage(qp.prompt)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Zap className="w-3 h-3 text-teal-400 shrink-0" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Multi-Turn Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? "bg-indigo-600 text-white"
                    : msg.isError
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`flex-1 min-w-0 max-w-[90%] space-y-2.5 ${
                  isUser ? "flex flex-col items-end" : ""
                }`}
              >
                {/* Core Message Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : msg.isError
                      ? "bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-tl-xs"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`mt-1.5 flex items-center gap-2 text-[10px] font-mono tabular-nums ${
                      isUser ? "text-indigo-200 justify-end" : "text-slate-500"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && msg.modelUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{msg.modelUsed}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Short Missing Gaps Digest */}
                {!isUser && msg.shortMissingPoints && msg.shortMissingPoints.length > 0 && (
                  <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        What's Missing ({msg.shortMissingPoints.length})
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {msg.shortMissingPoints.map((pt, idx) => {
                        const sevColor =
                          pt.severity === "critical"
                            ? "text-rose-400"
                            : pt.severity === "polish"
                            ? "text-sky-400"
                            : "text-amber-400";
                        const sevLabel =
                          pt.severity === "critical"
                            ? "Critical"
                            : pt.severity === "polish"
                            ? "Polish"
                            : "Recommended";
                        return (
                          <li
                            key={pt.id || idx}
                            className="text-xs leading-snug border-b border-slate-800/60 last:border-b-0 pb-1.5 last:pb-0"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-semibold text-white">{pt.title}</span>
                              <span className={`text-[10px] font-semibold shrink-0 ${sevColor}`}>
                                {sevLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{pt.whyItMatters}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* One-Click Apply Patch Cards with Before/After Diff */}
                {!isUser && msg.patches && msg.patches.length > 0 && (
                  <div className="space-y-2">
                    {msg.patches.map((patch) => {
                      const showDiff = !!openDiffIds[patch.id];
                      return (
                        <div
                          key={patch.id}
                          className={`rounded-xl border p-3 space-y-2 transition-colors ${
                            patch.applied
                              ? "bg-emerald-950/20 border-emerald-500/40"
                              : "bg-slate-900 border-slate-800 hover:border-teal-500/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">
                                {patch.targetSection}
                                {patch.estimatedPointsGain ? ` · +${patch.estimatedPointsGain} ATS pts` : ""}
                              </span>
                              <p className="text-xs font-semibold text-white truncate">
                                {patch.label}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleDiff(patch.id)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                title="Preview Before vs After change"
                              >
                                <GitCompare className="w-3 h-3" />
                                <span>{showDiff ? "Hide Diff" : "Diff"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(patch.id, patch.afterText)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                title="Copy suggestion"
                              >
                                {copiedId === patch.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Suggestion Text or Before/After Diff */}
                          {showDiff && patch.beforeText ? (
                            <div className="space-y-1.5 text-[11px] rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                              <div className="text-rose-300/90 line-through decoration-rose-400/70">
                                - {patch.beforeText}
                              </div>
                              <div className="text-emerald-300 font-medium">
                                + {patch.afterText}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-200 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                              {patch.afterText}
                            </p>
                          )}

                          {/* Action Row */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            {onApplyPatch ? (
                              <button
                                type="button"
                                disabled={patch.applied}
                                onClick={() => onApplyPatch(patch, msg.id)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  patch.applied
                                    ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                                    : "bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                                }`}
                              >
                                {patch.applied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Applied to Resume</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Apply Fix to Resume</span>
                                  </>
                                )}
                              </button>
                            ) : onOpenBuilder ? (
                              <button
                                type="button"
                                onClick={onOpenBuilder}
                                className="w-full py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <span>Open in Resume Builder</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Follow-up Suggestion Buttons */}
                {!isUser && msg.followUpPrompts && msg.followUpPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {msg.followUpPrompts.map((fp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isLoading}
                        onClick={() => sendMessage(fp)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {fp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-teal-300 text-xs p-3 rounded-xl bg-slate-900 border border-slate-800">
            <RefreshCcw className="w-3.5 h-3.5 animate-spin text-teal-400 shrink-0" />
            <span>
              Scanning missing gaps & preparing ready-to-apply suggestions...
            </span>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/95 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
            placeholder={
              compact
                ? "Ask what's missing or request a fix..."
                : "Ask Gemini what's missing, paste a bullet to rewrite, or inject JD keywords..."
            }
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
            {!compact && <span>Send</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
