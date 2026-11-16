import { useState, useEffect, useRef } from "react";
import { AtsResumeData } from "../utils/docxExport";

export interface SectionStrengthMetric {
  id: "contact" | "summary" | "experience" | "skills" | "education";
  label: string;
  score: number;
  status: "strong" | "moderate" | "needs-work";
  diagnostic: string;
}

export interface AtsEngineResult {
  liveScore: number;
  rulesScore: number;
  formattingScore: number;
  bulletQualityScore: number;
  keywordCoveragePct: number;
  flags: string[];
  weakPhrasesDetected: string[];
  sectionMetrics: SectionStrengthMetric[];
  jobKeywordsFound: string[];
  jobKeywordsMissing: string[];
  isCalculating: boolean;
}

const WEAK_ACTION_PATTERNS = [
  "responsible for",
  "worked on",
  "helped with",
  "assisted in",
  "tasked with",
  "participated in",
  "duties included",
  "handled",
  "involved in",
];

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

function computeSectionStrengths(
  resumeData: AtsResumeData | null,
  quantifiedCount: number,
  totalBullets: number,
  weakCount: number
): SectionStrengthMetric[] {
  if (!resumeData) return [];

  const contactFilled = [
    resumeData.name,
    resumeData.contact?.email,
    resumeData.contact?.phone,
    resumeData.contact?.linkedin,
  ].filter((x) => Boolean(x && x.trim())).length;
  const contactScore = Math.min(100, contactFilled * 25);

  const summaryWords = (resumeData.summary || "").trim().split(/\s+/).filter(Boolean).length;
  const summaryHasMetric = /\d+%|\$\d+|\d+\+/.test(resumeData.summary || "");
  const summaryScore =
    summaryWords === 0
      ? 20
      : Math.min(100, (summaryWords >= 28 && summaryWords <= 90 ? 80 : 60) + (summaryHasMetric ? 20 : 0));

  const metricRatio = totalBullets > 0 ? quantifiedCount / totalBullets : 0;
  const expScore =
    totalBullets === 0
      ? 30
      : Math.min(100, Math.max(35, Math.round(50 + metricRatio * 50 - weakCount * 8)));

  const totalSkills = Object.values(resumeData.skills || {}).flat().filter(Boolean).length;
  const skillsScore = Math.min(100, totalSkills >= 10 ? 96 : totalSkills >= 5 ? 78 : Math.max(30, totalSkills * 14));

  const eduCount = resumeData.education?.length || 0;
  const eduScore = eduCount > 0 ? 95 : 40;

  const toStatus = (s: number): "strong" | "moderate" | "needs-work" =>
    s >= 82 ? "strong" : s >= 65 ? "moderate" : "needs-work";

  return [
    {
      id: "contact",
      label: "Header & Contact",
      score: contactScore,
      status: toStatus(contactScore),
      diagnostic:
        contactFilled >= 4
          ? "Complete ATS contact header with email, phone & LinkedIn."
          : `${4 - contactFilled} key header field(s) missing (add email, phone, LinkedIn).`,
    },
    {
      id: "summary",
      label: "Executive Summary",
      score: summaryScore,
      status: toStatus(summaryScore),
      diagnostic:
        summaryWords === 0
          ? "Summary is empty — add a 3-line target value proposition."
          : summaryHasMetric
          ? `${summaryWords} words with impact proof.`
          : `${summaryWords} words — add 1–2 quantified proof metrics.`,
    },
    {
      id: "experience",
      label: "Experience & Impact",
      score: expScore,
      status: toStatus(expScore),
      diagnostic:
        totalBullets === 0
          ? "No experience bullets detected."
          : `${quantifiedCount} of ${totalBullets} bullets quantified${weakCount > 0 ? ` · ${weakCount} passive phrase(s)` : ""}.`,
    },
    {
      id: "skills",
      label: "Skills Taxonomy",
      score: skillsScore,
      status: toStatus(skillsScore),
      diagnostic:
        totalSkills >= 10
          ? `${totalSkills} structured skills indexed for ATS matching.`
          : `Only ${totalSkills} skills listed — inject missing JD skills.`,
    },
    {
      id: "education",
      label: "Education & Certs",
      score: eduScore,
      status: toStatus(eduScore),
      diagnostic: eduCount > 0 ? `${eduCount} verified credential(s) formatted.` : "Add degree or certification.",
    },
  ];
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
  initialKeywordsFound = [],
}: {
  resumeData: AtsResumeData | null;
  jobDescription: string;
  initialScore?: number;
  initialKeywordsMissing?: string[];
  initialKeywordsFound?: string[];
}): AtsEngineResult {
  const [liveScore, setLiveScore] = useState<number>(initialScore);
  const [rulesScore, setRulesScore] = useState<number>(initialScore);
  const [formattingScore, setFormattingScore] = useState<number>(85);
  const [bulletQualityScore, setBulletQualityScore] = useState<number>(75);
  const [flags, setFlags] = useState<string[]>([]);
  const [weakPhrasesDetected, setWeakPhrasesDetected] = useState<string[]>([]);
  const [sectionMetrics, setSectionMetrics] = useState<SectionStrengthMetric[]>([]);
  const [jobKeywordsFound, setJobKeywordsFound] = useState<string[]>(initialKeywordsFound);
  const [jobKeywordsMissing, setJobKeywordsMissing] = useState<string[]>(initialKeywordsMissing);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const debounceTimerRef = useRef<any>(null);
  const lastAnalyzedTextRef = useRef<string>("");

  useEffect(() => {
    if (!resumeData) return;

    const currentText = serializeResumeDataToText(resumeData);
    if (!currentText.trim()) return;

    const lowerText = currentText.toLowerCase();
    const allTrackedKeywords = Array.from(
      new Set([...(initialKeywordsFound || []), ...(initialKeywordsMissing || [])])
    ).filter(Boolean);

    const localFound: string[] = [];
    const localMissing: string[] = [];
    let newlyMatchedCount = 0;

    allTrackedKeywords.forEach((kw) => {
      if (lowerText.includes(kw.toLowerCase())) {
        localFound.push(kw);
        if ((initialKeywordsMissing || []).some((m) => m.toLowerCase() === kw.toLowerCase())) {
          newlyMatchedCount++;
        }
      } else {
        localMissing.push(kw);
      }
    });

    // Quantified bullets & weak verb detection
    const bullets = resumeData.experience?.flatMap((e) => e.bulletPoints || []) || [];
    let quantifiedCount = 0;
    const foundWeak: string[] = [];

    bullets.forEach((b) => {
      if (/\d+%|\$\d+|\d+\s*(k|m|million|billion|users|clients|team|x|hrs|%)|\b(increased|reduced|grew|saved|generated|accelerated|slashed|improved)\b/i.test(b)) {
        quantifiedCount++;
      }
      const lowerB = b.toLowerCase();
      WEAK_ACTION_PATTERNS.forEach((pat) => {
        if (lowerB.includes(pat) && !foundWeak.includes(pat)) {
          foundWeak.push(pat);
        }
      });
    });

    const metricRatio = bullets.length > 0 ? quantifiedCount / bullets.length : 0;
    const instantBulletScore = Math.round(metricRatio * 100);
    const instantMetricBonus = Math.round(metricRatio * 10);
    const instantBonus = newlyMatchedCount * 2.5;

    setSectionMetrics(
      computeSectionStrengths(resumeData, quantifiedCount, bullets.length, foundWeak.length)
    );
    setWeakPhrasesDetected(foundWeak);
    setBulletQualityScore(instantBulletScore);
    if (allTrackedKeywords.length > 0) {
      setJobKeywordsFound(localFound);
      setJobKeywordsMissing(localMissing);
    }

    const calculatedInstantScore = Math.min(
      99,
      Math.max(55, Math.round(initialScore + instantBonus + instantMetricBonus - foundWeak.length * 1.5))
    );
    setLiveScore(calculatedInstantScore);

    if (currentText === lastAnalyzedTextRef.current) {
      return;
    }

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
            setLiveScore(Math.max(data.overallAtsScore, calculatedInstantScore));
          }
          if (typeof data.rulesScore === "number") setRulesScore(data.rulesScore);
          if (typeof data.formattingScore === "number") setFormattingScore(data.formattingScore);
          if (typeof data.bulletPointQualityScore === "number") {
            setBulletQualityScore(data.bulletPointQualityScore);
          }
          if (Array.isArray(data.flags)) setFlags(data.flags);
          if (Array.isArray(data.jobKeywordsFound) && data.jobKeywordsFound.length > 0) {
            setJobKeywordsFound(Array.from(new Set([...localFound, ...data.jobKeywordsFound])));
          }
          if (Array.isArray(data.jobKeywordsMissing) && data.jobKeywordsMissing.length > 0) {
            // Filter out terms that are visibly present in currentText
            const trulyMissing = data.jobKeywordsMissing.filter(
              (k: string) => !lowerText.includes(k.toLowerCase())
            );
            setJobKeywordsMissing(trulyMissing);
          }
        }
      } catch (err) {
        console.warn("Live ATS engine background calculation error:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resumeData, jobDescription, initialScore, initialKeywordsMissing, initialKeywordsFound]);

  const totalKw = jobKeywordsFound.length + jobKeywordsMissing.length;
  const keywordCoveragePct = totalKw > 0 ? Math.round((jobKeywordsFound.length / totalKw) * 100) : 100;

  return {
    liveScore,
    rulesScore,
    formattingScore,
    bulletQualityScore,
    keywordCoveragePct,
    flags,
    weakPhrasesDetected,
    sectionMetrics,
    jobKeywordsFound,
    jobKeywordsMissing,
    isCalculating,
  };
}
