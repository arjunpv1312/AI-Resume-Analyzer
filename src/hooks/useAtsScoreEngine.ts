import { useState, useEffect, useRef } from "react";
import { AtsResumeData } from "../utils/docxExport";

export interface AtsEngineResult {
  liveScore: number;
  rulesScore: number;
  formattingScore: number;
  bulletQualityScore: number;
  flags: string[];
  jobKeywordsFound: string[];
  jobKeywordsMissing: string[];
  isCalculating: boolean;
}

/**
 * Converts structured AtsResumeData into formatted plain text
 * suitable for ATS parser simulation engines.
 */
export function serializeResumeDataToText(data: AtsResumeData | null): string {
  if (!data) return "";

  const lines: string[] = [];

  // Header
  if (data.name) lines.push(data.name.toUpperCase());
  if (data.title) lines.push(data.title);

  const contacts = [
    data.contact?.phone,
    data.contact?.email,
    data.contact?.location,
    data.contact?.linkedin,
    data.contact?.portfolio,
  ].filter(Boolean);
  if (contacts.length > 0) lines.push(contacts.join(" | "));

  lines.push("\n");

  // Professional Summary
  if (data.summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push(data.summary);
    lines.push("\n");
  }

  // Work Experience
  if (data.experience && data.experience.length > 0) {
    lines.push("WORK EXPERIENCE");
    data.experience.forEach((exp) => {
      lines.push(`${exp.position} — ${exp.company} ${exp.duration ? `(${exp.duration})` : ""}`);
      exp.bulletPoints?.forEach((bp) => {
        lines.push(`• ${bp}`);
      });
      lines.push("");
    });
    lines.push("\n");
  }

  // Skills
  if (data.skills) {
    lines.push("TECHNICAL SKILLS");
    Object.entries(data.skills).forEach(([cat, list]) => {
      if (list && list.length > 0) {
        lines.push(`${cat.toUpperCase()}: ${list.join(", ")}`);
      }
    });
    lines.push("\n");
  }

  // Education
  if (data.education && data.education.length > 0) {
    lines.push("EDUCATION");
    data.education.forEach((edu) => {
      lines.push(`${edu.degree}, ${edu.institution} ${edu.year ? `(${edu.year})` : ""}`);
    });
  }

  return lines.join("\n");
}

/**
 * Hook calling the ATS analyzer engine whenever the resume text content is modified,
 * ensuring the live ATS score updates seamlessly without refreshing the entire analysis results.
 */
export function useAtsScoreEngine({
  resumeData,
  jobDescription,
  initialScore = 75,
  initialKeywordsMissing = [],
}: {
  resumeData: AtsResumeData | null;
  jobDescription: string;
  initialScore?: number;
  initialKeywordsMissing?: string[];
}): AtsEngineResult {
  const [liveScore, setLiveScore] = useState<number>(initialScore);
  const [rulesScore, setRulesScore] = useState<number>(initialScore);
  const [formattingScore, setFormattingScore] = useState<number>(85);
  const [bulletQualityScore, setBulletQualityScore] = useState<number>(75);
  const [flags, setFlags] = useState<string[]>([]);
  const [jobKeywordsFound, setJobKeywordsFound] = useState<string[]>([]);
  const [jobKeywordsMissing, setJobKeywordsMissing] = useState<string[]>(initialKeywordsMissing);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const debounceTimerRef = useRef<any>(null);
  const lastAnalyzedTextRef = useRef<string>("");

  useEffect(() => {
    if (!resumeData) return;

    const currentText = serializeResumeDataToText(resumeData);
    if (!currentText.trim() || currentText === lastAnalyzedTextRef.current) {
      return;
    }

    // 1. Instant local optimistic calculation (0ms latency for smooth typing)
    const lowerText = currentText.toLowerCase();
    let instantBonus = 0;
    let localFound: string[] = [];
    let localMissing: string[] = [];

    if (initialKeywordsMissing && initialKeywordsMissing.length > 0) {
      initialKeywordsMissing.forEach((kw) => {
        if (kw && lowerText.includes(kw.toLowerCase())) {
          localFound.push(kw);
          instantBonus += 2.5;
        } else if (kw) {
          localMissing.push(kw);
        }
      });
    }

    // Quantified bullets bonus
    const bullets = resumeData.experience?.flatMap((e) => e.bulletPoints || []) || [];
    let quantifiedCount = 0;
    bullets.forEach((b) => {
      if (/\d+%|\$\d+|\d+\s*(k|m|million|billion|users|clients|team|x|hrs|%)|\b(increased|reduced|grew|saved|generated)\b/i.test(b)) {
        quantifiedCount++;
      }
    });

    const metricRatio = bullets.length > 0 ? quantifiedCount / bullets.length : 0;
    const instantBulletScore = Math.round(metricRatio * 100);
    const instantMetricBonus = Math.round(metricRatio * 12);

    const calculatedInstantScore = Math.min(
      99,
      Math.max(55, Math.round(initialScore + instantBonus + instantMetricBonus - 3))
    );
    setLiveScore(calculatedInstantScore);
    setBulletQualityScore(instantBulletScore);
    if (localFound.length > 0) setJobKeywordsFound(localFound);
    if (localMissing.length > 0) setJobKeywordsMissing(localMissing);

    // 2. Debounced asynchronous ATS simulation engine query
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsCalculating(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        lastAnalyzedTextRef.current = currentText;

        const res = await fetch("/api/ats-analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: currentText,
            jobDescription,
            fileName: `${(resumeData.name || "Resume").replace(/\s+/g, "_")}_ATS.pdf`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.overallAtsScore === "number") {
            setLiveScore(data.overallAtsScore);
          }
          if (typeof data.rulesScore === "number") setRulesScore(data.rulesScore);
          if (typeof data.formattingScore === "number") setFormattingScore(data.formattingScore);
          if (typeof data.bulletPointQualityScore === "number") {
            setBulletQualityScore(data.bulletPointQualityScore);
          }
          if (Array.isArray(data.flags)) setFlags(data.flags);
          if (Array.isArray(data.jobKeywordsFound)) setJobKeywordsFound(data.jobKeywordsFound);
          if (Array.isArray(data.jobKeywordsMissing)) setJobKeywordsMissing(data.jobKeywordsMissing);
        }
      } catch (err) {
        console.warn("Live ATS engine background calculation error:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resumeData, jobDescription, initialScore, initialKeywordsMissing]);

  return {
    liveScore,
    rulesScore,
    formattingScore,
    bulletQualityScore,
    flags,
    jobKeywordsFound,
    jobKeywordsMissing,
    isCalculating,
  };
}
