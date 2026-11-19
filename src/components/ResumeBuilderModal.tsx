import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  Printer,
  FileText,
  Target,
  Edit3,
  Plus,
  Trash2,
  Eye,
  RefreshCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Check,
  FileCheck,
  Wand2,
  RotateCcw,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Document, Page, pdfjs } from "react-pdf";
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}
import { AtsResumeData, exportAtsResumeToDocx } from "../utils/docxExport";
import {
  AtsBuilderTemplateStyle,
  generateAtsResumePdfBlob,
  downloadAtsResumePdf,
} from "../utils/pdfExport";
import { useAtsScoreEngine } from "../hooks/useAtsScoreEngine";
import { AtsCopilotChat } from "./AtsCopilotChat";
import {
  AtsChatMessage,
  AtsChatModelMode,
  AtsChatPersona,
  AtsResumePatch,
} from "../types";

interface ResumeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawResumeText: string;
  jobDescription: string;
  analysisResult: any;
  initialSkillToFrame?: string | null;
  sharedResumeData?: AtsResumeData | null;
  onSharedResumeDataChange?: React.Dispatch<React.SetStateAction<AtsResumeData | null>>;
  sharedChatMessages?: AtsChatMessage[];
  onSharedChatMessagesChange?: React.Dispatch<React.SetStateAction<AtsChatMessage[]>>;
  sharedPersona?: AtsChatPersona;
  onSharedPersonaChange?: (p: AtsChatPersona) => void;
  sharedModelMode?: AtsChatModelMode;
  onSharedModelModeChange?: (m: AtsChatModelMode) => void;
  pendingPatchToApply?: { patch: AtsResumePatch; messageId: string } | null;
  onClearPendingPatch?: () => void;
}

export const ResumeBuilderModal: React.FC<ResumeBuilderModalProps> = ({
  isOpen,
  onClose,
  rawResumeText,
  jobDescription,
  analysisResult,
  initialSkillToFrame,
  sharedResumeData,
  onSharedResumeDataChange,
  sharedChatMessages,
  onSharedChatMessagesChange,
  sharedPersona,
  onSharedPersonaChange,
  sharedModelMode,
  onSharedModelModeChange,
  pendingPatchToApply,
  onClearPendingPatch,
}) => {
  // Support both controlled shared state (synced with App.tsx) and standalone local state
  const [localResumeData, setLocalResumeData] = useState<AtsResumeData | null>(null);
  const resumeData = sharedResumeData !== undefined ? sharedResumeData : localResumeData;
  const setResumeData = onSharedResumeDataChange || setLocalResumeData;

  const [localChatMessages, setLocalChatMessages] = useState<AtsChatMessage[]>([
    {
      id: "copilot_init",
      role: "model",
      text: "I scanned your resume against the target role. Ask what is missing for a crisp breakdown, or click any quick gap check to get one-click resume fixes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      persona: "scanner",
      modelUsed: "gemini-4-hydrogen",
      followUpPrompts: [
        "Find what is missing for this job",
        "Fix my weakest bullets",
      ],
    },
  ]);
  const chatMessages = sharedChatMessages !== undefined ? sharedChatMessages : localChatMessages;
  const setChatMessages = onSharedChatMessagesChange || setLocalChatMessages;

  const [localPersona, setLocalPersona] = useState<AtsChatPersona>("scanner");
  const persona = sharedPersona !== undefined ? sharedPersona : localPersona;
  const setPersona = onSharedPersonaChange || setLocalPersona;

  const [localModelMode, setLocalModelMode] = useState<AtsChatModelMode>("auto");
  const modelMode = sharedModelMode !== undefined ? sharedModelMode : localModelMode;
  const setModelMode = onSharedModelModeChange || setLocalModelMode;

  const [activeTab, setActiveTab] = useState<"pdf" | "heatmap" | "preview" | "editor" | "export">("pdf");
  const [templateStyle, setTemplateStyle] = useState<AtsBuilderTemplateStyle>("classic-executive");
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);

  // Undo history & toast notifications
  const [undoStack, setUndoStack] = useState<AtsResumeData[]>([]);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [externalPromptRequest, setExternalPromptRequest] = useState<{
    id: number;
    prompt: string;
  } | null>(null);

  // Real-Time ATS Analyzer Engine Hook
  const atsEngine = useAtsScoreEngine({
    resumeData,
    jobDescription,
    initialScore: analysisResult?.overallScore || 75,
    initialKeywordsMissing: analysisResult?.atsAnalysis?.jobKeywordsMissing || [],
    initialKeywordsFound: analysisResult?.atsAnalysis?.jobKeywordsFound || [],
  });

  const activeScore = atsEngine.liveScore;
  const baselineScore = analysisResult?.overallScore || 75;
  const scoreDelta = activeScore - baselineScore;

  // Real-Time PDF Previewer State
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfViewType, setPdfViewType] = useState<"native" | "stage">("native");
  const [vectorNumPages, setVectorNumPages] = useState<number>(1);
  const [vectorRenderError, setVectorRenderError] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Immediate DOCX Download State
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [docxDownloaded, setDocxDownloaded] = useState(false);

  // Specific Bullet Metric Improver Drawer
  const [isBulletImproverOpen, setIsBulletImproverOpen] = useState(false);
  const [selectedExpKey, setSelectedExpKey] = useState<string>("");
  const [isImprovingBullet, setIsImprovingBullet] = useState(false);
  const [bulletImprovementResult, setBulletImprovementResult] = useState<{
    improvedBullet: string;
    variations: string[];
    metricsAdded: string[];
    explanation: string;
  } | null>(null);

  const printPreviewRef = useRef<HTMLDivElement>(null);
  const handlePdfPrint = useReactToPrint({
    contentRef: printPreviewRef,
  });

  const triggerToast = (msg: string) => {
    setAppliedNotification(msg);
    setTimeout(() => setAppliedNotification(null), 3200);
  };

  // Real-time PDF Blob generation whenever resumeData or templateStyle changes
  useEffect(() => {
    if (!resumeData) return;
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsGeneratingPdf(true);
        const blob = await generateAtsResumePdfBlob(resumeData, templateStyle);
        if (isMounted) {
          setVectorRenderError(false);
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        console.warn("Real-time PDF compilation error:", err);
      } finally {
        if (isMounted) setIsGeneratingPdf(false);
      }
    }, 320);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [resumeData, templateStyle]);

  // Default selected bullet
  useEffect(() => {
    if (resumeData?.experience && resumeData.experience.length > 0 && !selectedExpKey) {
      const firstExp = resumeData.experience[0];
      if (firstExp.bulletPoints && firstExp.bulletPoints.length > 0) {
        setSelectedExpKey(`${firstExp.id || "exp_0"}:0`);
      }
    }
  }, [resumeData, selectedExpKey]);

  const lastFramedSkillRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && !resumeData && !isGeneratingInitial) {
      generateInitialAtsResume();
    }
  }, [isOpen]);

  // Auto-trigger skill framing if initialSkillToFrame is passed
  useEffect(() => {
    if (isOpen && initialSkillToFrame && lastFramedSkillRef.current !== initialSkillToFrame) {
      lastFramedSkillRef.current = initialSkillToFrame;
      setExternalPromptRequest({
        id: Date.now(),
        prompt: `How can I naturally add the missing skill "${initialSkillToFrame}" to my resume for this ${
          analysisResult?.careerPath?.topRole || analysisResult?.targetRole || "target"
        } role? Give me a short diagnosis and a 1-click patch.`,
      });
    }
  }, [isOpen, initialSkillToFrame, analysisResult]);

  // Handle pending patch triggered from global Copilot Drawer
  useEffect(() => {
    if (isOpen && pendingPatchToApply && resumeData) {
      handleApplyChatPatch(pendingPatchToApply.patch, pendingPatchToApply.messageId);
      onClearPendingPatch?.();
    }
  }, [isOpen, pendingPatchToApply, resumeData]);

  const generateInitialAtsResume = async () => {
    setIsGeneratingInitial(true);
    try {
      const res = await fetch("/api/generate-ats-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: rawResumeText,
          jobDescription,
          analysisResult,
        }),
      });
      const data = await res.json();
      if (res.ok && data.name) {
        setResumeData(data);
      } else {
        const fallback: AtsResumeData = {
          name: "Candidate Name",
          title: analysisResult?.careerPath?.topRole || analysisResult?.targetRole || "Professional",
          contact: { email: "", phone: "", location: "" },
          summary: rawResumeText ? rawResumeText.slice(0, 260) : "Results-driven professional.",
          experience: [
            {
              id: "exp_1",
              company: "Previous Organization",
              position: analysisResult?.targetRole || "Specialist",
              duration: "2021 - Present",
              bulletPoints: [
                "Spearheaded key initiatives delivering measurable improvements across core deliverables.",
                "Collaborated cross-functionally to execute high-priority product milestones.",
              ],
            },
          ],
          education: [
            {
              id: "edu_1",
              degree: "Bachelor's Degree",
              institution: "University",
              year: "2020",
            },
          ],
          skills: {
            core: analysisResult?.atsAnalysis?.jobKeywordsFound || ["Leadership", "System Design"],
          },
          estimatedAtsScore: analysisResult?.overallScore || 75,
        };
        setResumeData(fallback);
      }
    } catch (err) {
      console.error("Initial ATS resume structuring error:", err);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  // Apply structured AI patch cleanly with Undo snapshot
  const handleApplyChatPatch = (patch: AtsResumePatch, messageId: string) => {
    if (!resumeData) return;

    const snapshot: AtsResumeData = JSON.parse(JSON.stringify(resumeData));
    setUndoStack((prev) => [...prev.slice(-14), snapshot]);

    setResumeData((prev) => {
      if (!prev) return prev;
      const next: AtsResumeData = JSON.parse(JSON.stringify(prev));

      if (patch.targetSection === "title") {
        next.title = patch.afterText;
      } else if (patch.targetSection === "summary") {
        next.summary = patch.afterText;
      } else if (patch.targetSection === "skills") {
        const existingCore = next.skills?.core || [];
        const toAdd =
          patch.skillsToAdd && patch.skillsToAdd.length > 0
            ? patch.skillsToAdd
            : patch.afterText
                .replace(/^adds?:\s*/i, "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        const merged = Array.from(new Set([...existingCore, ...toAdd]));
        next.skills = { ...(next.skills || {}), core: merged };
      } else if (patch.targetSection === "experience") {
        if (!next.experience || next.experience.length === 0) {
          next.experience = [
            {
              id: `exp_${Date.now()}`,
              company: "Target Organization",
              position: next.title || "Lead Engineer",
              duration: "Present",
              bulletPoints: [patch.afterText],
            },
          ];
        } else {
          const eIdx = Math.min(Math.max(0, patch.expIndex ?? 0), next.experience.length - 1);
          const bullets = [...(next.experience[eIdx].bulletPoints || [])];
          if (
            typeof patch.bulletIndex === "number" &&
            patch.bulletIndex >= 0 &&
            patch.bulletIndex < bullets.length
          ) {
            bullets[patch.bulletIndex] = patch.afterText;
          } else {
            bullets.push(patch.afterText);
          }
          next.experience[eIdx] = { ...next.experience[eIdx], bulletPoints: bullets };
        }
      }
      return next;
    });

    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              patches: m.patches?.map((p) => (p.id === patch.id ? { ...p, applied: true } : p)),
            }
          : m
      )
    );

    triggerToast(`Applied: ${patch.label}`);
  };

  const handleUndoLastPatch = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setResumeData(lastState);
    triggerToast("Reverted last edit");
  };

  const handleImmediateDocxDownload = async () => {
    if (!resumeData) return;
    try {
      setIsDownloadingDocx(true);
      await exportAtsResumeToDocx(resumeData);
      setDocxDownloaded(true);
      setTimeout(() => setDocxDownloaded(false), 3000);
    } catch (err) {
      console.error("Immediate DOCX export failed:", err);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleImmediatePdfDownload = async () => {
    if (!resumeData) return;
    try {
      setIsDownloadingPdf(true);
      await downloadAtsResumePdf(resumeData, templateStyle);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleOpenBulletImprover = (expId: string, bpIdx: number) => {
    setSelectedExpKey(`${expId}:${bpIdx}`);
    setIsBulletImproverOpen(true);
    setBulletImprovementResult(null);
  };

  const handleExecuteImproveBullet = async () => {
    if (!resumeData || !selectedExpKey) return;
    const [expId, bpIdxStr] = selectedExpKey.split(":");
    const bpIdx = parseInt(bpIdxStr, 10);
    const exp =
      resumeData.experience?.find((e, idx) => (e.id || `exp_${idx}`) === expId) ||
      resumeData.experience?.[0];
    if (!exp || !exp.bulletPoints?.[bpIdx]) return;

    const originalBullet = exp.bulletPoints[bpIdx];
    setIsImprovingBullet(true);
    setBulletImprovementResult(null);

    try {
      const res = await fetch("/api/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulletPoint: originalBullet,
          position: exp.position,
          company: exp.company,
          jobDescription,
          targetRole: analysisResult?.targetRole || exp.position,
        }),
      });

      const data = await res.json();
      if (res.ok && data.improvedBullet) {
        setBulletImprovementResult(data);
      } else {
        setBulletImprovementResult({
          improvedBullet: `Spearheaded key initiatives at ${exp.company}, accelerating performance by 35% and delivering measurable impact across cross-functional teams.`,
          variations: [
            `Engineered strategic process improvements, slashing operational overhead by 25% while expanding throughput.`,
            `Orchestrated delivery for ${exp.position} initiatives, boosting reliability by 40% and saving 15+ hours weekly.`,
          ],
          metricsAdded: ["+35% performance gain", "25% overhead reduction", "15+ hours saved weekly"],
          explanation: "Injected quantifiable metrics and active executive power verbs.",
        });
      }
    } catch (err) {
      console.error("Improve bullet error:", err);
    } finally {
      setIsImprovingBullet(false);
    }
  };

  const handleApplyImprovedBullet = (newBullet: string) => {
    if (!resumeData || !selectedExpKey) return;
    const [expId, bpIdxStr] = selectedExpKey.split(":");
    const bpIdx = parseInt(bpIdxStr, 10);

    setUndoStack((prev) => [...prev.slice(-14), JSON.parse(JSON.stringify(resumeData))]);

    let expCompany = "";
    setResumeData((prev) => {
      if (!prev) return null;
      const updatedExperience = prev.experience.map((e, idx) => {
        if ((e.id || `exp_${idx}`) === expId) {
          expCompany = e.company;
          const updatedBullets = [...e.bulletPoints];
          updatedBullets[bpIdx] = newBullet;
          return { ...e, bulletPoints: updatedBullets };
        }
        return e;
      });
      return { ...prev, experience: updatedExperience };
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `applied_${Date.now()}`,
        role: "model",
        text: `Updated bullet in ${expCompany || "Experience"} with quantified impact metrics. Your live ATS score updated automatically.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona,
        modelUsed: "XYZ Optimizer",
      },
    ]);

    triggerToast(`Applied bullet to ${expCompany || "Experience"}`);
  };

  const askCopilotFromStudio = (prompt: string) => {
    setExternalPromptRequest({ id: Date.now(), prompt });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-5 overflow-hidden">
      <div className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-[1440px] h-[94vh] flex flex-col shadow-2xl overflow-hidden text-zinc-950 dark:text-zinc-100">
        {/* Top Live ATS Telemetry & Action Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-400 shrink-0">
              <Wand2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold font-display text-zinc-950 dark:text-white whitespace-nowrap">
                  ATS Resume Studio & Gap Copilot
                </h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  1-Column ATS Verified · Live Auto-Rescoring
                </span>
              </div>
              {appliedNotification && (
                <p className="text-xs text-violet-700 dark:text-violet-400 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {appliedNotification}
                </p>
              )}
            </div>
          </div>

          {/* Live Telemetry Metrics + Exports */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-4 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">ATS Score</span>
                <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white text-sm">
                  {activeScore}%
                </span>
                {scoreDelta !== 0 && (
                  <span
                    className={`font-mono font-semibold tabular-nums text-[11px] ${
                      scoreDelta > 0
                        ? "text-violet-700 dark:text-violet-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                  </span>
                )}
                {atsEngine.isCalculating && (
                  <RefreshCcw className="w-3 h-3 text-violet-600 dark:text-violet-400 animate-spin" />
                )}
              </div>

              <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />

              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Keywords</span>
                <span className="font-mono font-bold tabular-nums text-violet-700 dark:text-violet-300">
                  {atsEngine.keywordCoveragePct}%
                </span>
              </div>

              <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700 hidden md:block" aria-hidden="true" />

              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Quantified</span>
                <span className="font-mono font-bold tabular-nums text-purple-700 dark:text-purple-300">
                  {atsEngine.bulletQualityScore}%
                </span>
              </div>
            </div>

            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndoLastPatch}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo ({undoStack.length})</span>
              </button>
            )}

            {resumeData && (
              <>
                <button
                  type="button"
                  onClick={handleImmediateDocxDownload}
                  disabled={isDownloadingDocx}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 text-zinc-950 dark:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isDownloadingDocx ? (
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : docxDownloaded ? (
                    <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  )}
                  <span>{docxDownloaded ? "DOCX Saved" : "DOCX"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleImmediatePdfDownload}
                  disabled={isDownloadingPdf}
                  className="px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isDownloadingPdf ? (
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 12-Col Split Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column (5 cols): Multi-Turn Gap Copilot + Optional Single Bullet Enhancer */}
          <div className="lg:col-span-5 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
            {/* Collapsible Single-Bullet XYZ Enhancer Strip */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsBulletImproverOpen((prev) => !prev);
                  setBulletImprovementResult(null);
                }}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-zinc-50 dark:hover:bg-[#16161d] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  Targeted Bullet XYZ Metric Enhancer
                </span>
                {isBulletImproverOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>

              {isBulletImproverOpen && (
                <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] space-y-2.5">
                  <select
                    value={selectedExpKey}
                    onChange={(e) => {
                      setSelectedExpKey(e.target.value);
                      setBulletImprovementResult(null);
                    }}
                    className="w-full bg-white dark:bg-[#111116] border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white outline-none focus:border-violet-600"
                  >
                    {resumeData?.experience?.flatMap((exp, expIdx) =>
                      exp.bulletPoints?.map((bp, bpIdx) => (
                        <option
                          key={`bullet-opt-${exp.id || expIdx}-${bpIdx}`}
                          value={`${exp.id || `exp_${expIdx}`}:${bpIdx}`}
                        >
                          {exp.company} ({exp.position}): "{bp.slice(0, 50)}..."
                        </option>
                      )) || []
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={handleExecuteImproveBullet}
                    disabled={isImprovingBullet || !selectedExpKey}
                    className="w-full py-2 px-3 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isImprovingBullet ? (
                      <>
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Injecting Quantified XYZ Metrics...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Rewrite Selected Bullet with Metrics</span>
                      </>
                    )}
                  </button>

                  {bulletImprovementResult && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#111116] border border-violet-300 dark:border-violet-700/60 space-y-2">
                      <p className="text-xs text-zinc-950 dark:text-white leading-relaxed">
                        {bulletImprovementResult.improvedBullet}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {bulletImprovementResult.explanation}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyImprovedBullet(bulletImprovementResult.improvedBullet)
                          }
                          className="px-3 py-1 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold text-xs shrink-0 cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Turn Gap Copilot */}
            <div className="flex-1 overflow-hidden">
              <AtsCopilotChat
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                persona={persona}
                onPersonaChange={setPersona}
                modelMode={modelMode}
                onModelModeChange={setModelMode}
                resumeText={rawResumeText}
                jobDescription={jobDescription}
                analysisResult={analysisResult}
                currentResumeData={resumeData}
                onApplyPatch={handleApplyChatPatch}
                onUndoLastPatch={handleUndoLastPatch}
                canUndo={undoStack.length > 0}
                externalPromptRequest={externalPromptRequest}
              />
            </div>
          </div>

          {/* Right Column (7 cols): Live Preview, JD Heatmap, Section Grader, Editor & Export */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
            {/* Navigation Tabs & Template Preset Switcher */}
            <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#16161d] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("pdf")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === "pdf"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" /> Live PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("heatmap")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === "heatmap"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> JD Gap Heatmap
                  {atsEngine.jobKeywordsMissing.length > 0 && (
                    <span className="font-mono text-[10px] opacity-90 tabular-nums">
                      ({atsEngine.jobKeywordsMissing.length})
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> HTML View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("editor")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === "editor"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Section Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("export")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === "export"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>

              {/* Template Style Selector */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <select
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value as AtsBuilderTemplateStyle)}
                  className="bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-medium outline-none focus:border-violet-500 cursor-pointer"
                  title="Select ATS layout preset"
                >
                  <option value="classic-executive">Classic Executive</option>
                  <option value="modern-minimalist">Modern Minimalist</option>
                  <option value="compact-technical">Compact Technical</option>
                </select>
              </div>
            </div>

            {/* Right Pane Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-[#09090b]">
              {isGeneratingInitial ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                  <RefreshCcw className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Structuring your resume into a clean ATS layout...
                  </p>
                </div>
              ) : activeTab === "pdf" ? (
                <div className="h-full flex flex-col space-y-3 max-w-4xl mx-auto">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>8.5 × 11" Letter · Vector Helvetica · 1-Column Safe</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-zinc-100 dark:bg-[#16161d] rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => setPdfZoom((z) => Math.max(60, z - 10))}
                          disabled={pdfZoom <= 60}
                          className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-[11px] font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                          {pdfZoom}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setPdfZoom((z) => Math.min(150, z + 10))}
                          disabled={pdfZoom >= 150}
                          className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center bg-zinc-100 dark:bg-[#16161d] rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPdfViewType("native")}
                          className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                            pdfViewType === "native"
                              ? "bg-violet-600 text-white"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                          }`}
                        >
                          PDF Vector
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfViewType("stage")}
                          className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                            pdfViewType === "stage"
                              ? "bg-violet-600 text-white"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                          }`}
                        >
                          Paper Stage
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[580px] rounded-xl overflow-hidden relative flex items-center justify-center bg-zinc-200/70 dark:bg-[#0c0c10] border border-zinc-200 dark:border-zinc-800 p-2 sm:p-4">
                    {isGeneratingPdf && !pdfBlobUrl ? (
                      <div className="flex flex-col items-center space-y-2">
                        <RefreshCcw className="w-7 h-7 text-violet-600 dark:text-violet-400 animate-spin" />
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">Compiling PDF...</span>
                      </div>
                    ) : pdfViewType === "native" && pdfBlobUrl && !vectorRenderError ? (
                      <div className="w-full h-full min-h-[580px] max-h-[68vh] relative rounded-lg overflow-auto flex flex-col items-center py-3 px-2 bg-zinc-200/50 dark:bg-[#0c0c10]">
                        {isGeneratingPdf && (
                          <div className="sticky top-2 right-2 self-end z-10 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-[#16161d]/95 border border-zinc-300 dark:border-zinc-700 text-violet-700 dark:text-violet-300 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                            <RefreshCcw className="w-3 h-3 animate-spin" />
                            <span>Updating PDF...</span>
                          </div>
                        )}
                        <Document
                          file={pdfBlobUrl}
                          onLoadSuccess={({ numPages }) => {
                            setVectorNumPages(Math.max(1, numPages));
                            setVectorRenderError(false);
                          }}
                          onLoadError={() => setVectorRenderError(true)}
                          loading={
                            <div className="flex flex-col items-center justify-center py-16 space-y-2">
                              <RefreshCcw className="w-6 h-6 text-violet-600 dark:text-violet-400 animate-spin" />
                              <span className="text-xs text-zinc-700 dark:text-zinc-300">Rendering PDF canvas...</span>
                            </div>
                          }
                          className="flex flex-col items-center gap-4"
                        >
                          {Array.from({ length: vectorNumPages }, (_, pageIdx) => (
                            <div
                              key={`vector-page-${pageIdx + 1}`}
                              className="bg-white rounded shadow-xl overflow-hidden border border-zinc-300 dark:border-zinc-700"
                            >
                              <Page
                                pageNumber={pageIdx + 1}
                                scale={(pdfZoom / 100) * 1.05}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                            </div>
                          ))}
                        </Document>
                      </div>
                    ) : (
                      <div
                        className="transition-transform duration-150 origin-top flex justify-center py-2"
                        style={{ transform: `scale(${pdfZoom / 100})` }}
                      >
                        <div
                          className={`w-[816px] min-h-[1056px] bg-white text-zinc-900 shadow-2xl font-sans text-xs leading-normal border border-zinc-300 ${
                            templateStyle === "compact-technical" ? "p-8 space-y-3.5" : "p-12 space-y-5"
                          }`}
                        >
                          <div
                            className={`space-y-1 pb-3 border-b border-zinc-300 ${
                              templateStyle === "modern-minimalist" ? "text-left" : "text-center"
                            }`}
                          >
                            <h1 className="text-2xl font-bold uppercase tracking-wide text-zinc-950">
                              {resumeData?.name || "Candidate Name"}
                            </h1>
                            <p
                              className={`text-sm font-semibold ${
                                templateStyle === "modern-minimalist" ? "text-violet-700" : "text-zinc-700"
                              }`}
                            >
                              {resumeData?.title || "Target Professional Title"}
                            </p>
                            <p className="text-[11px] text-zinc-600">
                              {[
                                resumeData?.contact?.phone,
                                resumeData?.contact?.email,
                                resumeData?.contact?.location,
                                resumeData?.contact?.linkedin,
                                resumeData?.contact?.portfolio,
                              ]
                                .filter(Boolean)
                                .join("  |  ")}
                            </p>
                          </div>

                          {resumeData?.summary && (
                            <div className="space-y-1">
                              <h2
                                className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 ${
                                  templateStyle === "modern-minimalist"
                                    ? "text-violet-800 border-violet-600"
                                    : "text-zinc-950 border-zinc-300"
                                }`}
                              >
                                Professional Summary
                              </h2>
                              <p className="text-zinc-800 leading-relaxed text-[11px]">
                                {resumeData.summary}
                              </p>
                            </div>
                          )}

                          {resumeData?.experience && resumeData.experience.length > 0 && (
                            <div className="space-y-3">
                              <h2
                                className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 ${
                                  templateStyle === "modern-minimalist"
                                    ? "text-violet-800 border-violet-600"
                                    : "text-zinc-950 border-zinc-300"
                                }`}
                              >
                                Professional Work Experience
                              </h2>
                              {resumeData.experience.map((exp, idx) => (
                                <div key={`stage-exp-${exp.id || idx}`} className="space-y-1">
                                  <div className="flex justify-between items-baseline font-bold text-zinc-950 text-[11px]">
                                    <span>
                                      {exp.position}{" "}
                                      <span className="font-normal text-zinc-700">
                                        — {exp.company}
                                      </span>
                                    </span>
                                    <span className="text-zinc-600 text-[10px] font-mono tabular-nums">
                                      {exp.duration}
                                    </span>
                                  </div>
                                  <ul className="list-disc list-inside space-y-1 text-zinc-800 text-[11px] pl-1">
                                    {exp.bulletPoints?.map((bp, bIdx) => (
                                      <li key={`stage-bp-${idx}-${bIdx}`} className="leading-snug">
                                        {bp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}

                          {resumeData?.skills && (
                            <div className="space-y-1">
                              <h2
                                className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 ${
                                  templateStyle === "modern-minimalist"
                                    ? "text-violet-800 border-violet-600"
                                    : "text-zinc-950 border-zinc-300"
                                }`}
                              >
                                Core Competencies & Technical Skills
                              </h2>
                              <div className="space-y-0.5 text-[11px]">
                                {Object.entries(resumeData.skills).map(([cat, list]) =>
                                  list && list.length > 0 ? (
                                    <p key={`stage-sk-${cat}`} className="text-zinc-800">
                                      <strong className="capitalize text-zinc-950">{cat}: </strong>
                                      {list.join(", ")}
                                    </p>
                                  ) : null
                                )}
                              </div>
                            </div>
                          )}

                          {resumeData?.education && resumeData.education.length > 0 && (
                            <div className="space-y-1">
                              <h2
                                className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 ${
                                  templateStyle === "modern-minimalist"
                                    ? "text-violet-800 border-violet-600"
                                    : "text-zinc-950 border-zinc-300"
                                }`}
                              >
                                Education & Credentials
                              </h2>
                              {resumeData.education.map((edu, idx) => (
                                <div
                                  key={`stage-edu-${edu.id || idx}`}
                                  className="flex justify-between text-[11px] text-zinc-800"
                                >
                                  <span>
                                    <strong className="text-zinc-950">{edu.degree}</strong>,{" "}
                                    {edu.institution}
                                  </span>
                                  <span className="text-zinc-600 text-[10px]">{edu.year}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "heatmap" ? (
                /* JD KEYWORD GAP HEATMAP + SECTION STRENGTH GRADER */
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Section Strength Grader */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-950 dark:text-white">Section Strength Grader</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Click Fix via Copilot on any section below 85% to get a ready-to-apply upgrade.
                        </p>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-violet-700 dark:text-violet-400 font-semibold">
                        Overall Live Match: {activeScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {atsEngine.sectionMetrics.map((sec) => {
                        const statusColor =
                          sec.status === "strong"
                            ? "text-violet-700 dark:text-violet-400"
                            : sec.status === "moderate"
                            ? "text-purple-700 dark:text-purple-400"
                            : "text-rose-700 dark:text-rose-400";
                        const barColor =
                          sec.status === "strong"
                            ? "bg-violet-600"
                            : sec.status === "moderate"
                            ? "bg-purple-500"
                            : "bg-rose-600";
                        return (
                          <div
                            key={sec.id}
                            className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-zinc-950 dark:text-white">{sec.label}</span>
                              <span className={`text-xs font-mono font-bold tabular-nums ${statusColor}`}>
                                {sec.score}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${sec.score}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{sec.diagnostic}</p>
                              {sec.score < 90 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    askCopilotFromStudio(
                                      `Fix my "${sec.label}" section (${sec.score}%): ${sec.diagnostic}. Give me a 1-click patch.`
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white border border-violet-200 dark:border-violet-800 text-[11px] font-semibold shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  Fix via Copilot
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Missing JD Keywords Action Matrix */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                          <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          Missing Job Description Keywords ({atsEngine.jobKeywordsMissing.length})
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Click any missing term to ask AI Copilot for a 1-click skill or bullet insertion.
                        </p>
                      </div>
                      {atsEngine.jobKeywordsMissing.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            askCopilotFromStudio(
                              `Weave these top missing JD keywords into my summary, core skills, and experience bullets cleanly: ${atsEngine.jobKeywordsMissing
                                .slice(0, 5)
                                .join(", ")}`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Inject Top Missing Keywords
                        </button>
                      )}
                    </div>

                    {atsEngine.jobKeywordsMissing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {atsEngine.jobKeywordsMissing.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() =>
                              askCopilotFromStudio(
                                `Give me a short 1-click patch adding the missing keyword "${kw}" naturally into my resume.`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Click to ask Copilot where to place this keyword"
                          >
                            <span>+ {kw}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span>All tracked target keywords are now present in your resume!</span>
                      </div>
                    )}

                    {/* Matched Keywords */}
                    {atsEngine.jobKeywordsFound.length > 0 && (
                      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 block">
                          Matched in Resume ({atsEngine.jobKeywordsFound.length})
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {atsEngine.jobKeywordsFound.map((kw) => (
                            <span
                              key={kw}
                              className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-[11px] font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weak Verbs Warning */}
                    {atsEngine.weakPhrasesDetected.length > 0 && (
                      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            Weak passive phrases detected:{" "}
                            <strong className="font-mono">
                              {atsEngine.weakPhrasesDetected.join(", ")}
                            </strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            askCopilotFromStudio(
                              `Replace weak passive phrases (${atsEngine.weakPhrasesDetected.join(
                                ", "
                              )}) in my experience bullets with executive action verbs and XYZ metrics.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
                        >
                          Fix Weak Verbs
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "preview" ? (
                /* LIVE 1-COLUMN ATS HTML VIEW + PRINT */
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handlePdfPrint()}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-violet-600 hover:bg-zinc-800 dark:hover:bg-violet-700 border border-zinc-800 dark:border-violet-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print HTML Preview
                    </button>
                  </div>
                  <div
                    className="bg-white text-zinc-900 p-8 sm:p-12 rounded-xl shadow-2xl font-sans text-xs leading-normal border border-zinc-300 space-y-5"
                    ref={printPreviewRef}
                  >
                    <div className="text-center space-y-1 pb-3 border-b border-zinc-300">
                      <h1 className="text-2xl font-bold uppercase tracking-wide text-zinc-950">
                        {resumeData?.name || "Candidate Name"}
                      </h1>
                      <p className="text-sm font-semibold text-violet-700">
                        {resumeData?.title || "Target Professional Title"}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {[
                          resumeData?.contact?.phone,
                          resumeData?.contact?.email,
                          resumeData?.contact?.location,
                          resumeData?.contact?.linkedin,
                          resumeData?.contact?.portfolio,
                        ]
                          .filter(Boolean)
                          .join("  |  ")}
                      </p>
                    </div>

                    {resumeData?.summary && (
                      <div className="space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5">
                          Professional Summary
                        </h2>
                        <p className="text-zinc-800 leading-relaxed text-[11px]">
                          {resumeData.summary}
                        </p>
                      </div>
                    )}

                    {resumeData?.experience && resumeData.experience.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5">
                          Professional Work Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={`print-exp-${exp.id || idx}`} className="space-y-1">
                            <div className="flex justify-between items-baseline font-bold text-zinc-950 text-[11px]">
                              <span>
                                {exp.position}{" "}
                                <span className="font-normal text-zinc-700">— {exp.company}</span>
                              </span>
                              <span className="text-zinc-600 text-[10px]">{exp.duration}</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-zinc-800 text-[11px] pl-1">
                              {exp.bulletPoints?.map((bp, bIdx) => (
                                <li key={`print-exp-bp-${idx}-${bIdx}`} className="leading-snug">
                                  {bp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {resumeData?.skills && (
                      <div className="space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5">
                          Core Competencies & Technical Skills
                        </h2>
                        <div className="space-y-0.5 text-[11px]">
                          {Object.entries(resumeData.skills).map(([cat, list]) =>
                            list && list.length > 0 ? (
                              <p key={`print-skill-${cat}`} className="text-zinc-800">
                                <strong className="capitalize text-zinc-950">{cat}: </strong>
                                {list.join(", ")}
                              </p>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}

                    {resumeData?.education && resumeData.education.length > 0 && (
                      <div className="space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5">
                          Education & Certifications
                        </h2>
                        {resumeData.education.map((edu, idx) => (
                          <div
                            key={`print-edu-${edu.id || idx}`}
                            className="flex justify-between text-[11px] text-zinc-800"
                          >
                            <span>
                              <strong className="text-zinc-950">{edu.degree}</strong>,{" "}
                              {edu.institution}
                            </span>
                            <span className="text-zinc-600 text-[10px]">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "editor" ? (
                /* INTERACTIVE SECTION EDITOR */
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                      Header & Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={resumeData?.name || ""}
                          onChange={(e) =>
                            setResumeData((prev) =>
                              prev ? { ...prev, name: e.target.value } : null
                            )
                          }
                          className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                          Target Title
                        </label>
                        <input
                          type="text"
                          value={resumeData?.title || ""}
                          onChange={(e) =>
                            setResumeData((prev) =>
                              prev ? { ...prev, title: e.target.value } : null
                            )
                          }
                          className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                          Email Address
                        </label>
                        <input
                          type="text"
                          value={resumeData?.contact?.email || ""}
                          onChange={(e) =>
                            setResumeData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    contact: { ...prev.contact, email: e.target.value },
                                  }
                                : null
                            )
                          }
                          className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={resumeData?.contact?.phone || ""}
                          onChange={(e) =>
                            setResumeData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    contact: { ...prev.contact, phone: e.target.value },
                                  }
                                : null
                            )
                          }
                          className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Editor */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                        Professional Summary
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          askCopilotFromStudio(
                            "Rewrite my Professional Summary into a tight 3-line executive hook with missing JD keywords."
                          )
                        }
                        className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white cursor-pointer"
                      >
                        Improve with Copilot
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={resumeData?.summary || ""}
                      onChange={(e) =>
                        setResumeData((prev) =>
                          prev ? { ...prev, summary: e.target.value } : null
                        )
                      }
                      className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-950 dark:text-white leading-relaxed focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Experience Editor */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                        Work Experience ({resumeData?.experience?.length || 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newExp = {
                            id: `exp_${Date.now()}`,
                            company: "Organization Name",
                            position: "Role Title",
                            duration: "2022 - Present",
                            bulletPoints: [
                              "Spearheaded core architecture delivering 35% performance improvement.",
                            ],
                          };
                          setResumeData((prev) =>
                            prev
                              ? { ...prev, experience: [...(prev.experience || []), newExp] }
                              : null
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white border border-violet-200 dark:border-violet-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Role
                      </button>
                    </div>

                    {resumeData?.experience?.map((exp, expIdx) => (
                      <div
                        key={`edit-exp-${exp.id || expIdx}`}
                        className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Job Position"
                            value={exp.position}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updated = [...prev.experience];
                                updated[expIdx] = { ...updated[expIdx], position: val };
                                return { ...prev, experience: updated };
                              });
                            }}
                            className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white font-semibold focus:outline-none focus:border-violet-500"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updated = [...prev.experience];
                                updated[expIdx] = { ...updated[expIdx], company: val };
                                return { ...prev, experience: updated };
                              });
                            }}
                            className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={exp.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updated = [...prev.experience];
                                updated[expIdx] = { ...updated[expIdx], duration: val };
                                return { ...prev, experience: updated };
                              });
                            }}
                            className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div className="space-y-2">
                          {exp.bulletPoints?.map((bp, bpIdx) => (
                            <div key={`edit-bp-${expIdx}-${bpIdx}`} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={bp}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResumeData((prev) => {
                                    if (!prev) return null;
                                    const updated = [...prev.experience];
                                    const bps = [...updated[expIdx].bulletPoints];
                                    bps[bpIdx] = val;
                                    updated[expIdx] = { ...updated[expIdx], bulletPoints: bps };
                                    return { ...prev, experience: updated };
                                  });
                                }}
                                className="flex-1 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-violet-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleOpenBulletImprover(exp.id || `exp_${expIdx}`, bpIdx)}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white border border-purple-200 dark:border-purple-800 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                              >
                                <Wand2 className="w-3 h-3" />
                                <span className="hidden sm:inline">Quantify</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setResumeData((prev) => {
                                    if (!prev) return null;
                                    const updated = [...prev.experience];
                                    const bps = updated[expIdx].bulletPoints.filter((_, i) => i !== bpIdx);
                                    updated[expIdx] = { ...updated[expIdx], bulletPoints: bps };
                                    return { ...prev, experience: updated };
                                  });
                                }}
                                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updated = [...prev.experience];
                                updated[expIdx] = {
                                  ...updated[expIdx],
                                  bulletPoints: [
                                    ...(updated[expIdx].bulletPoints || []),
                                    "Increased efficiency by X% through strategic optimization.",
                                  ],
                                };
                                return { ...prev, experience: updated };
                              });
                            }}
                            className="text-xs text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Bullet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills Editor */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                      Skills & Competencies
                    </h4>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                          Core Skills (comma separated)
                        </label>
                        <input
                          type="text"
                          value={resumeData?.skills?.core?.join(", ") || ""}
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            setResumeData((prev) =>
                              prev ? { ...prev, skills: { ...prev.skills, core: arr } } : null
                            );
                          }}
                          className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                          Tools & Frameworks (comma separated)
                        </label>
                        <input
                          type="text"
                          value={resumeData?.skills?.tools?.join(", ") || ""}
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            setResumeData((prev) =>
                              prev ? { ...prev, skills: { ...prev.skills, tools: arr } } : null
                            );
                          }}
                          className="w-full bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Education Editor */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                        Education & Credentials
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setResumeData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  education: [
                                    ...(prev.education || []),
                                    {
                                      id: `edu_${Date.now()}`,
                                      degree: "Bachelor of Science",
                                      institution: "University",
                                      year: "2020",
                                    },
                                  ],
                                }
                              : null
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white border border-violet-200 dark:border-violet-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Education
                      </button>
                    </div>
                    {resumeData?.education?.map((edu, eduIdx) => (
                      <div
                        key={`edit-edu-${edu.id || eduIdx}`}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800"
                      >
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => {
                              if (!prev) return null;
                              const updated = [...prev.education];
                              updated[eduIdx] = { ...updated[eduIdx], degree: val };
                              return { ...prev, education: updated };
                            });
                          }}
                          className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white font-semibold focus:outline-none focus:border-violet-500"
                        />
                        <input
                          type="text"
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => {
                              if (!prev) return null;
                              const updated = [...prev.education];
                              updated[eduIdx] = { ...updated[eduIdx], institution: val };
                              return { ...prev, education: updated };
                            });
                          }}
                          className="bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Year"
                            value={edu.year}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updated = [...prev.education];
                                updated[eduIdx] = { ...updated[eduIdx], year: val };
                                return { ...prev, education: updated };
                              });
                            }}
                            className="flex-1 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setResumeData((prev) => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  education: prev.education.filter((_, i) => i !== eduIdx),
                                };
                              });
                            }}
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* DEDICATED EXPORT OPTIONS */
                <div className="max-w-3xl mx-auto space-y-5">
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-6">
                    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                      <h3 className="text-base font-bold text-zinc-950 dark:text-white">Export Optimized Resume</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        All applied patches and template presets are immediately included in both exports.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-violet-700 dark:text-violet-400 font-semibold">
                            <span>ATS Vector PDF</span>
                            <span className="font-mono text-zinc-500 dark:text-zinc-400">.PDF</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            Single-column Letter layout using clean Helvetica text streams verified for Workday, Greenhouse, and Lever.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleImmediatePdfDownload}
                          disabled={isDownloadingPdf || !resumeData}
                          className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>{isDownloadingPdf ? "Compiling PDF..." : "Download PDF Resume"}</span>
                        </button>
                      </div>

                      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#16161d] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 font-semibold">
                            <span>Editable Word Document</span>
                            <span className="font-mono text-zinc-500 dark:text-zinc-400">.DOCX</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            Structured Microsoft Word file preserving Heading styles, bullet lists, and clean section breaks.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleImmediateDocxDownload}
                          disabled={isDownloadingDocx || !resumeData}
                          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>
                            {isDownloadingDocx
                              ? "Generating DOCX..."
                              : docxDownloaded
                              ? "DOCX Downloaded"
                              : "Download DOCX Resume"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
