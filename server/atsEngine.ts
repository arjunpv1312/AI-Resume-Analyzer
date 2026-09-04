/**
 * Server-side ATS Rule-Based Simulation Engine
 * Performs comprehensive analysis of resume text against ATS standards:
 * - Keyword density & matching against target Job Description
 * - Section header presence and formatting
 * - Contact information visibility (email, phone)
 * - Length and page budgeting
 * - Bullet point quality, power verbs, and quantified metrics
 * - Font/casing consistency, spacing, and multi-column fragmentation
 */

export interface AtsSimulationResult {
  rulesScore: number;
  formattingScore: number;
  flags: string[];
  foundHeaders: string[];
  hasEmail: boolean;
  hasPhone: boolean;
  pageCount: number;
  topResumeKeywords: string[];
  jobKeywordsFound: string[];
  jobKeywordsMissing: string[];
  keywordDensity: number;
  bulletPointQualityScore: number;
  ocrUsed: boolean;
  isScannedPdf: boolean;
}

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in",
  "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the",
  "their", "then", "there", "these", "they", "this", "to", "was", "will",
  "with", "from", "your", "you", "we", "our", "can", "have", "has", "had"
]);

const actionVerbs = [
  "achieved", "improved", "trained", "managed", "created", "resolved",
  "increased", "decreased", "led", "developed", "coordinated", "designed",
  "implemented", "spearheaded", "generated", "optimized", "reduced",
  "maximized", "delivered", "orchestrated", "architected", "championed",
  "executed", "accelerated", "streamlined", "formulated", "engineered"
];

const buzzwordsList = [
  "hardworking", "hard working", "sincere", "diligent", "team player",
  "go getter", "go-getter", "think outside the box", "results driven",
  "results-driven", "self motivated", "self-motivated", "detail oriented",
  "passionate individual", "dynamic professional", "thought leader",
  "guru", "ninja", "wizard"
];

const redundantTerms = [
  "10th", "12th", "class 10", "class 12", "sslc", "cbse 10th",
  "semester 1", "semester 2", "windows os", "windows 10", "windows 11",
  "ms office", "ms word", "internet surfing", "marital status",
  "father's name", "date of birth", "dob:"
];

export function runAtsSimulation(
  resumeText: string,
  pages: number = 1,
  jobDesc?: string,
  fileName?: string,
  isScannedPdf: boolean = false,
  ocrUsed: boolean = false
): AtsSimulationResult {
  let rulesScore = 100;
  let formattingScore = 100;
  const flags: string[] = [];

  if (isScannedPdf || ocrUsed) {
    rulesScore -= 15;
    formattingScore -= 15;
    flags.push(
      "Scanned / Image-Based PDF Warning: Document contains non-selectable text parsed via Tesseract OCR. Standard enterprise ATS software without OCR will fail to parse image-based resumes. Re-export your resume as a text-native PDF or DOCX file."
    );
  }

  // 0. File Naming Convention Check
  if (fileName) {
    const cleanName = fileName.toLowerCase().trim();
    if (
      /^(resume|cv|my_resume|mycv|document|untitled|new_resume|draft|final|updated|profile)\.(pdf|docx|doc)$/i.test(
        cleanName
      ) ||
      cleanName.length < 7
    ) {
      rulesScore -= 10;
      formattingScore -= 5;
      flags.push(
        `File Naming Convention: Currently named '${fileName}'. Generic file names hinder automated candidate indexing in ATS databases. Rename to 'FirstName_LastName_TargetRole.pdf'.`
      );
    }
  }

  // Keyword analysis and density
  const extractKeywords = (text: string) => {
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const keywordCounts: Record<string, number> = {};
    words.forEach((word) => {
      if (!stopWords.has(word)) {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
    });
    return Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]);
  };

  const resumeKeywordsRaw = extractKeywords(resumeText);
  const topResumeKeywords = resumeKeywordsRaw.slice(0, 15).map((k) => k[0]);

  let keywordDensity = 0;
  const jobKeywordsFound: string[] = [];
  const jobKeywordsMissing: string[] = [];

  if (jobDesc && jobDesc.trim().length > 10) {
    const jobKeywordsRaw = extractKeywords(jobDesc);
    const targetKeywords = jobKeywordsRaw.slice(0, 20).map((k) => k[0]);

    targetKeywords.forEach((kw) => {
      const found = resumeKeywordsRaw.find((rk) => rk[0] === kw);
      if (found) {
        jobKeywordsFound.push(kw);
        keywordDensity += found[1];
      } else {
        jobKeywordsMissing.push(kw);
      }
    });

    const matchRatio = targetKeywords.length > 0 ? jobKeywordsFound.length / targetKeywords.length : 0;

    if (matchRatio < 0.3) {
      rulesScore -= 20;
      flags.push(
        `Keyword Match Low: Only found ${(matchRatio * 100).toFixed(0)}% of top job description keywords.`
      );
    } else if (matchRatio < 0.6) {
      rulesScore -= 10;
      flags.push(
        `Keyword Match Moderate: Consider adding missing keywords like '${jobKeywordsMissing.slice(0, 3).join(", ")}' if applicable.`
      );
    } else {
      rulesScore += 10;
    }
  }

  // 1. Contact Information Check
  const hasEmail = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/.test(resumeText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);

  if (!hasEmail) {
    rulesScore -= 15;
    flags.push("Missing Email Address: Contact visibility is critical.");
  }
  if (!hasPhone) {
    rulesScore -= 15;
    flags.push("Missing Phone Number: Recruiter accessibility is compromised.");
  }

  // 2. Section Header Detection
  const headers = [
    "EXPERIENCE", "WORK HISTORY", "EDUCATION", "SKILLS", "TECHNICAL SKILLS",
    "PROJECTS", "SUMMARY", "AWARDS", "CERTIFICATIONS"
  ];
  const foundHeaders = headers.filter((h) => new RegExp(`\\b${h}\\b`, "i").test(resumeText));

  if (foundHeaders.length < 3) {
    rulesScore -= 20;
    formattingScore -= 30;
    flags.push(`Incomplete Sectioning: Critical headers missing. Found: ${foundHeaders.join(", ") || "None"}`);
  } else if (foundHeaders.length < 5) {
    rulesScore -= 5;
    formattingScore -= 10;
    flags.push("Standard Sectioning: Consider adding more descriptive headers (Projects, Awards, etc.)");
  }

  // 3. Length Analysis
  if (pages <= 0) {
    const words = resumeText.split(/\s+/).length;
    pages = Math.ceil(words / 500);
  }

  if (pages > 2) {
    rulesScore -= 10;
    formattingScore -= 10;
    flags.push(`Excessive Length: Resume is ${pages} pages. Modern ATS systems and recruiters prefer 1-2 pages.`);
  } else if (pages === 1) {
    rulesScore += 5;
  }

  // 4. Formatting Analysis
  const bulletTypes = ["•", "○", "▪", "", "", "-", "*", "●"];
  const foundBullets = bulletTypes.filter((b) => resumeText.includes(b));
  if (foundBullets.length > 2) {
    formattingScore -= 25;
    flags.push(`Formatting Inconsistency: ${foundBullets.length} bullet styles detected. Uniformity improves scanability.`);
  } else if (foundBullets.length > 1) {
    formattingScore -= 10;
  }

  const lines = resumeText.split("\n").map((l) => l.trim());

  // Contact sub-element checks near top
  const contactSectionDetected = lines.slice(0, 15).join(" ").toLowerCase();
  const contactHasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(contactSectionDetected);
  const contactHasPhone = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})/i.test(contactSectionDetected);

  if (!contactHasEmail || !contactHasPhone) {
    formattingScore -= 10;
    flags.push("Contact Info: Missing expected sub-elements (email or phone) near top of the resume.");
  }

  // Experience section analysis
  const experienceIndex = lines.findIndex((l) => /experience|work history/i.test(l));
  let experienceLines = lines;
  if (experienceIndex !== -1) {
    const nextSectionIndex = lines.slice(experienceIndex + 1).findIndex((l) =>
      foundHeaders.some((h) => new RegExp(`^\\s*${h}\\s*$`, "i").test(l))
    );
    experienceLines = nextSectionIndex !== -1
      ? lines.slice(experienceIndex, experienceIndex + 1 + nextSectionIndex)
      : lines.slice(experienceIndex);
  } else {
    formattingScore -= 15;
    flags.push('Experience Section: Not clearly delineated. Use standard headers like "Experience" or "Work History".');
  }

  // Bullet Point Quality Score (Power verbs & Quantifiable metrics)
  const bulletLines = experienceLines.filter(
    (l) => bulletTypes.some((b) => l.startsWith(b)) || /^[•*-]\s/.test(l)
  );
  let bulletScoreAccumulator = 0;
  let bulletsMissingActionVerbs = 0;
  let bulletsMissingMetrics = 0;

  bulletLines.forEach((bl) => {
    const lowerBl = bl.toLowerCase();
    const hasActionVerb = actionVerbs.some((v) => lowerBl.includes(v));
    const hasMetrics =
      /\b\d{1,3}(,\d{3})*\b/.test(lowerBl) ||
      /\d+%/.test(lowerBl) ||
      /\$\d+/.test(lowerBl) ||
      /\b\d+x\b/i.test(lowerBl);

    let scoreForThisBullet = 0;
    if (hasActionVerb) scoreForThisBullet += 0.5;
    else bulletsMissingActionVerbs++;

    if (hasMetrics) scoreForThisBullet += 0.5;
    else bulletsMissingMetrics++;

    bulletScoreAccumulator += scoreForThisBullet;
  });

  const bulletPointQualityScore = bulletLines.length > 0
    ? Math.round((bulletScoreAccumulator / bulletLines.length) * 100)
    : 70;

  if (bulletLines.length > 0) {
    if (bulletPointQualityScore < 50) {
      rulesScore -= 15;
      flags.push(`Bullet Quality (Score ${bulletPointQualityScore}/100): Experience bullet points lack action verbs or quantifiable metrics.`);
    } else if (bulletPointQualityScore > 75) {
      rulesScore += 10;
    }
  }

  // Buzzwords check
  const lowerResume = resumeText.toLowerCase();
  const foundBuzzwords = buzzwordsList.filter((b) => lowerResume.includes(b));
  if (foundBuzzwords.length > 0) {
    rulesScore -= Math.min(15, foundBuzzwords.length * 4);
    flags.push(`Unverifiable Platitudes: Found generic buzzwords like '${foundBuzzwords.slice(0, 3).join("', '")}'. Replace with quantifiable metrics.`);
  }

  // Redundant content check
  const foundRedundant = redundantTerms.filter((rt) =>
    new RegExp(`\\b${rt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText)
  );
  if (foundRedundant.length > 0) {
    rulesScore -= Math.min(15, foundRedundant.length * 4);
    formattingScore -= 10;
    flags.push(`Redundant Content: Found basic entries like '${foundRedundant.slice(0, 3).join("', '")}'. Remove low-value school scores or demographics.`);
  }

  return {
    rulesScore: Math.max(0, Math.min(100, rulesScore)),
    formattingScore: Math.max(0, Math.min(100, formattingScore)),
    flags,
    foundHeaders,
    hasEmail,
    hasPhone,
    pageCount: pages,
    topResumeKeywords,
    jobKeywordsFound,
    jobKeywordsMissing,
    keywordDensity,
    bulletPointQualityScore,
    ocrUsed,
    isScannedPdf,
  };
}
