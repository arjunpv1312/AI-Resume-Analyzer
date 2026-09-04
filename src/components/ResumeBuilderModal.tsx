import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  Download,
  Printer,
  FileText,
  Bot,
  User,
  Zap,
  Target,
  Edit3,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  RefreshCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { AtsResumeData, exportAtsResumeToDocx } from "../utils/docxExport";

interface ResumeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawResumeText: string;
  jobDescription: string;
  analysisResult: any;
  initialSkillToFrame?: string | null;
}

interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
}

export const ResumeBuilderModal: React.FC<ResumeBuilderModalProps> = ({
  isOpen,
  onClose,
  rawResumeText,
  jobDescription,
  analysisResult,
  initialSkillToFrame,
}) => {
  const [resumeData, setResumeData] = useState<AtsResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [activeScore, setActiveScore] = useState<number>(
    analysisResult?.overallScore || 75
  );
  const [openAccordion, setOpenAccordion] = useState<string>("summary");

  const printPreviewRef = useRef<HTMLDivElement>(null);
  const handlePdfPrint = useReactToPrint({
    contentRef: printPreviewRef,
  });

  // Dynamic Real-Time ATS Score recalculation whenever resumeData changes
  useEffect(() => {
    if (!resumeData) return;

    let score = analysisResult?.overallScore || 75;
    const missingKeywords: string[] = analysisResult?.atsAnalysis?.jobKeywordsMissing || [];

    // Combine all text in current resume data for analysis
    const allText = [
      resumeData.summary || "",
      ...(resumeData.experience?.flatMap((e) => [
        e.position,
        e.company,
        ...(e.bulletPoints || []),
      ]) || []),
      ...(Object.values(resumeData.skills || {}).flat().filter(Boolean) as string[]),
    ]
      .join(" ")
      .toLowerCase();

    // 1. Reward for resolved missing keywords
    let keywordsFoundCount = 0;
    missingKeywords.forEach((kw) => {
      if (kw && allText.includes(kw.toLowerCase())) {
        keywordsFoundCount++;
      }
    });
    const keywordBonus = Math.min(15, keywordsFoundCount * 3);

    // 2. Reward for quantified bullet points (% numbers, $, numbers)
    const bullets = resumeData.experience?.flatMap((e) => e.bulletPoints || []) || [];
    let quantifiedCount = 0;
    bullets.forEach((bp) => {
      if (/\d+%|\$\d+|\d+\s*(k|m|million|billion|users|clients|team|x|hrs|%)|\b(increased|reduced|grew|saved|generated)\b/i.test(bp)) {
        quantifiedCount++;
      }
    });
    const metricBonus = bullets.length > 0 ? Math.min(10, Math.round((quantifiedCount / bullets.length) * 12)) : 0;

    // 3. Section Completeness Check
    let completeness = 0;
    if (resumeData.name) completeness += 2;
    if (resumeData.contact?.email && resumeData.contact?.phone) completeness += 3;
    if (resumeData.summary && resumeData.summary.length > 50) completeness += 3;
    if (bullets.length >= 3) completeness += 4;

    const calculatedScore = Math.min(99, Math.max(60, score + keywordBonus + metricBonus + completeness - 5));
    setActiveScore(calculatedScore);
  }, [resumeData, analysisResult]);

  const lastFramedSkillRef = useRef<string | null>(null);

  // Generate initial ATS resume JSON on modal open if not generated yet
  useEffect(() => {
    if (isOpen && !resumeData && !isGeneratingInitial) {
      generateInitialAtsResume();
    }
  }, [isOpen]);

  // Auto-trigger skill framing if initialSkillToFrame is provided
  useEffect(() => {
    if (isOpen && initialSkillToFrame && lastFramedSkillRef.current !== initialSkillToFrame) {
      lastFramedSkillRef.current = initialSkillToFrame;
      const prompt = `How can I frame the missing skill "${initialSkillToFrame}" in the context of my previous work experience for a ${analysisResult?.careerPath?.topRole || analysisResult?.targetRole || 'target'} position? Provide 2-3 tailored bullet points I can add directly.`;
      handleSendMessage(prompt, `Frame "${initialSkillToFrame}"`);
    }
  }, [isOpen, initialSkillToFrame, analysisResult]);

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
        if (data.estimatedAtsScore) {
          setActiveScore(data.estimatedAtsScore);
        }
        setChatHistory([
          {
            id: "msg_init",
            sender: "coach",
            text: `👋 Hello! I am your AI ATS Resume Coach. I've structured your resume into a 100% ATS-compliant 1-column layout. We're starting at a **${data.estimatedAtsScore || 90}% ATS Compatibility Score**. Click any Quick Action Chip below or ask me to optimize specific sections!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        // Fallback default structure
        const fallback: AtsResumeData = {
          name: "Candidate Name",
          title: analysisResult?.targetRole || "Professional",
          contact: { email: "", phone: "", location: "" },
          summary: rawResumeText.slice(0, 250) + "...",
          experience: [
            {
              id: "exp_1",
              company: "Previous Organization",
              position: analysisResult?.targetRole || "Specialist",
              duration: "2021 - Present",
              bulletPoints: [
                "Spearheaded key initiatives delivering measurable results.",
                "Collaborated cross-functionally to achieve business objectives.",
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
            core: analysisResult?.atsAnalysis?.jobKeywordsFound || ["Leadership"],
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

  const handleSendMessage = async (promptText?: string, actionName?: string) => {
    const textToSend = promptText || userInput;
    if (!textToSend.trim() || isCoachingLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: actionName ? `[Quick Action] ${actionName}: ${textToSend}` : textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    if (!promptText) setUserInput("");
    setIsCoachingLoading(true);

    try {
      const res = await fetch("/api/resume-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: rawResumeText,
          jobDescription,
          analysisResult,
          currentResumeData: resumeData,
          chatHistory: chatHistory.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          })),
          userPrompt: textToSend,
          quickAction: actionName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const coachMsg: ChatMessage = {
          id: `coach_${Date.now()}`,
          sender: "coach",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, coachMsg]);

        if (data.updatedResume && data.updatedResume.name) {
          setResumeData(data.updatedResume);
        }
        if (data.estimatedAtsScore) {
          setActiveScore(data.estimatedAtsScore);
        }
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: "coach",
            text: data.error || "Sorry, I had trouble processing that request. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Coach message error:", err);
    } finally {
      setIsCoachingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-6 overflow-hidden animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-display text-white">
                  ATS Resume Generator & AI Coach
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% ATS Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Co-create, re-score, and export ATS-optimized Word DOCX and PDF documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-Time ATS Score Badge */}
            <div className="px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                ATS Score:
              </span>
              <span className="text-base font-black text-purple-300">
                {activeScore}%
              </span>
            </div>

            {/* DOCX Download */}
            {resumeData && (
              <button
                onClick={() => exportAtsResumeToDocx(resumeData)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" /> Download DOCX
              </button>
            )}

            {/* PDF Export */}
            <button
              onClick={() => handlePdfPrint()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <Printer className="w-4 h-4" /> Export PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: AI Resume Coach Panel (5 cols) */}
          <div className="lg:col-span-5 border-r border-white/10 bg-slate-950/40 flex flex-col overflow-hidden">
            {/* Coach Panel Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 uppercase tracking-widest flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" /> Interactive AI Coach
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Powered by Gemini 2.5
              </span>
            </div>

            {/* Quick Action Chips Bar */}
            <div className="p-3 border-b border-white/10 bg-purple-500/5 space-y-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                ⚡ Quick Action Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    handleSendMessage(
                      "Review my current experience bullet points and add quantitative metrics (percentages %, revenue $, team size, performance multipliers) to maximize ATS impact.",
                      "Quantify Metrics"
                    )
                  }
                  disabled={isCoachingLoading}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold hover:bg-purple-500/20 transition-all flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-purple-400" /> Quantify Bullets
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      "Seamlessly incorporate all missing high-impact job keywords into my work experience and summary without keyword stuffing.",
                      "Inject Keywords"
                    )
                  }
                  disabled={isCoachingLoading}
                  className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[10px] font-bold hover:bg-pink-500/20 transition-all flex items-center gap-1"
                >
                  <Target className="w-3 h-3 text-pink-400" /> Inject Missing Keywords
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      "Rewrite my professional summary into a high-impact, 3-line executive value proposition tailored to the target role.",
                      "Rewrite Summary"
                    )
                  }
                  disabled={isCoachingLoading}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-blue-400" /> Elevate Summary
                </button>
              </div>
            </div>

            {/* Chat History Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white rounded-tr-none shadow-lg"
                        : "bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`text-[9px] text-right font-medium ${
                        msg.sender === "user" ? "text-purple-200" : "text-slate-500"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isCoachingLoading && (
                <div className="flex items-center gap-3 text-purple-300 text-xs font-medium p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 animate-pulse">
                  <RefreshCcw className="w-4 h-4 animate-spin text-purple-400" />
                  AI Coach is optimizing your resume...
                </div>
              )}
            </div>

            {/* Chat Input Field */}
            <div className="p-3 border-t border-white/10 bg-slate-950/80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask coach to rewrite a bullet, add skills, or re-frame role..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  disabled={isCoachingLoading}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || isCoachingLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live ATS Preview & Section Editor (7 cols) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-900">
            {/* View Mode Toggle Switch */}
            <div className="p-3 border-b border-white/10 bg-slate-950/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Live ATS Preview
                </button>
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "editor"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Interactive Section Editor
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Format: 1-Column Plain-Text Standard
              </span>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/20">
              {isGeneratingInitial ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <RefreshCcw className="w-10 h-10 text-purple-400 animate-spin" />
                  <p className="text-sm font-bold text-slate-300">
                    Formatting resume into 100% ATS-compliant structure...
                  </p>
                </div>
              ) : activeTab === "preview" ? (
                /* LIVE 1-COLUMN ATS PRINT PREVIEW */
                <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl font-sans text-xs leading-normal border border-slate-300 space-y-5" ref={printPreviewRef}>
                  {/* Name & Title */}
                  <div className="text-center space-y-1 pb-3 border-b border-slate-300">
                    <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                      {resumeData?.name || "Candidate Name"}
                    </h1>
                    <p className="text-sm font-semibold text-slate-700">
                      {resumeData?.title || "Target Professional Title"}
                    </p>
                    <p className="text-[11px] text-slate-600">
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

                  {/* Summary Section */}
                  {resumeData?.summary && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                        Professional Summary
                      </h2>
                      <p className="text-slate-800 leading-relaxed text-[11px]">
                        {resumeData.summary}
                      </p>
                    </div>
                  )}

                  {/* Work Experience Section */}
                  {resumeData?.experience && resumeData.experience.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                        Professional Work Experience
                      </h2>
                      {resumeData.experience.map((exp, idx) => (
                        <div key={exp.id || idx} className="space-y-1">
                          <div className="flex justify-between items-baseline font-bold text-slate-900 text-[11px]">
                            <span>
                              {exp.position} <span className="font-normal text-slate-700">— {exp.company}</span>
                            </span>
                            <span className="text-slate-600 text-[10px]">{exp.duration}</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-800 text-[11px] pl-1">
                            {exp.bulletPoints?.map((bp, bIdx) => (
                              <li key={bIdx} className="leading-snug">
                                <span className="align-top">{bp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills Section */}
                  {resumeData?.skills && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                        Core Competencies & Technical Skills
                      </h2>
                      <div className="space-y-0.5 text-[11px]">
                        {Object.entries(resumeData.skills).map(([category, list]) =>
                          list && list.length > 0 ? (
                            <p key={category} className="text-slate-800">
                              <strong className="capitalize text-slate-900">{category}: </strong>
                              {list.join(", ")}
                            </p>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Education Section */}
                  {resumeData?.education && resumeData.education.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                        Education & Certifications
                      </h2>
                      {resumeData.education.map((edu, idx) => (
                        <div key={edu.id || idx} className="flex justify-between text-[11px] text-slate-800">
                          <span>
                            <strong className="text-slate-900">{edu.degree}</strong>, {edu.institution}
                          </span>
                          <span className="text-slate-600 text-[10px]">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* INTERACTIVE SECTION EDITOR MODE */
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Contact Info Editor */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest">
                      Personal & Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
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
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
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
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
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
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
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
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Editor */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest">
                      Professional Summary
                    </h4>
                    <textarea
                      rows={3}
                      value={resumeData?.summary || ""}
                      onChange={(e) =>
                        setResumeData((prev) =>
                          prev ? { ...prev, summary: e.target.value } : null
                        )
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white leading-relaxed"
                    />
                  </div>

                  {/* Work Experience Editor */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest">
                        Work Experience ({resumeData?.experience?.length || 0})
                      </h4>
                      <button
                        onClick={() => {
                          const newExp = {
                            id: `exp_${Date.now()}`,
                            company: "New Company",
                            position: "Role Title",
                            duration: "Year - Present",
                            bulletPoints: ["Achieved X by implementing Y, resulting in Z% improvement."],
                          };
                          setResumeData((prev) =>
                            prev
                              ? { ...prev, experience: [...(prev.experience || []), newExp] }
                              : null
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Position
                      </button>
                    </div>

                    {resumeData?.experience?.map((exp, expIdx) => (
                      <div
                        key={exp.id || expIdx}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3"
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
                                const updatedExp = [...prev.experience];
                                updatedExp[expIdx].position = val;
                                return { ...prev, experience: updatedExp };
                              });
                            }}
                            className="bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={exp.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updatedExp = [...prev.experience];
                                updatedExp[expIdx].company = val;
                                return { ...prev, experience: updatedExp };
                              });
                            }}
                            className="bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Duration (e.g. 2021-Present)"
                            value={exp.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updatedExp = [...prev.experience];
                                updatedExp[expIdx].duration = val;
                                return { ...prev, experience: updatedExp };
                              });
                            }}
                            className="bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white"
                          />
                        </div>

                        {/* Bullet points editor */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] text-slate-400 font-bold block">
                            Bullet Points ({exp.bulletPoints?.length || 0}):
                          </label>
                          {exp.bulletPoints?.map((bp, bpIdx) => (
                            <div key={bpIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={bp}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResumeData((prev) => {
                                    if (!prev) return null;
                                    const updatedExp = [...prev.experience];
                                    updatedExp[expIdx].bulletPoints[bpIdx] = val;
                                    return { ...prev, experience: updatedExp };
                                  });
                                }}
                                className="flex-1 bg-black/80 border border-white/10 rounded p-1.5 text-xs text-slate-200"
                              />
                              <button
                                onClick={() => {
                                  setResumeData((prev) => {
                                    if (!prev) return null;
                                    const updatedExp = [...prev.experience];
                                    updatedExp[expIdx].bulletPoints.splice(bpIdx, 1);
                                    return { ...prev, experience: updatedExp };
                                  });
                                }}
                                className="text-rose-400 hover:text-rose-300 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updatedExp = [...prev.experience];
                                updatedExp[expIdx].bulletPoints.push("Increased efficiency by X% through strategic optimization.");
                                return { ...prev, experience: updatedExp };
                              });
                            }}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 pt-1"
                          >
                            <Plus className="w-3 h-3" /> Add Bullet Point
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills & Competencies Editor */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest">
                      Skills & Technical Competencies
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Core Technical Skills (comma separated)
                        </label>
                        <input
                          type="text"
                          value={resumeData?.skills?.core?.join(", ") || ""}
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            setResumeData((prev) =>
                              prev
                                ? { ...prev, skills: { ...prev.skills, core: arr } }
                                : null
                            );
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Tools & Frameworks (comma separated)
                        </label>
                        <input
                          type="text"
                          value={resumeData?.skills?.tools?.join(", ") || ""}
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            setResumeData((prev) =>
                              prev
                                ? { ...prev, skills: { ...prev.skills, tools: arr } }
                                : null
                            );
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Education Editor */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest">
                        Education & Academic Credentials
                      </h4>
                      <button
                        onClick={() => {
                          const newEdu = {
                            id: `edu_${Date.now()}`,
                            degree: "Bachelor of Science",
                            institution: "University Name",
                            year: "2020",
                          };
                          setResumeData((prev) =>
                            prev
                              ? { ...prev, education: [...(prev.education || []), newEdu] }
                              : null
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Education
                      </button>
                    </div>
                    {resumeData?.education?.map((edu, eduIdx) => (
                      <div key={edu.id || eduIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10">
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => {
                              if (!prev) return null;
                              const updatedEdu = [...prev.education];
                              updatedEdu[eduIdx].degree = val;
                              return { ...prev, education: updatedEdu };
                            });
                          }}
                          className="bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => {
                              if (!prev) return null;
                              const updatedEdu = [...prev.education];
                              updatedEdu[eduIdx].institution = val;
                              return { ...prev, education: updatedEdu };
                            });
                          }}
                          className="bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white"
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
                                const updatedEdu = [...prev.education];
                                updatedEdu[eduIdx].year = val;
                                return { ...prev, education: updatedEdu };
                              });
                            }}
                            className="flex-1 bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white"
                          />
                          <button
                            onClick={() => {
                              setResumeData((prev) => {
                                if (!prev) return null;
                                const updatedEdu = [...prev.education];
                                updatedEdu.splice(eduIdx, 1);
                                return { ...prev, education: updatedEdu };
                              });
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
