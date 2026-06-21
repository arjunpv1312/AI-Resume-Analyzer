import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function startServer() {
  try {
    const app = express();
    app.set('trust proxy', 1); // Fix for express-rate-limit trust proxy warning
    
    // Custom key generator using X-Forwarded-For to fix the Forwarded header warning
    const PORT = 3000;

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 15, // limit each IP to 15 requests per windowMs
      message: { error: 'Too many requests, please try again later.' },
      validate: {
        xForwardedForHeader: false
      }
    });

    // Middlewares
    app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for vite dev
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Anonymized Logger
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[REQUEST] ${timestamp} - ${req.method} ${req.url}`);
      // Add a header to identify if it's handled by Express or fell through
      res.set('X-Server-Timestamp', timestamp);
      next();
    });

    // Multer setup for file uploads
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
    });

    // API Routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.post('/api/analyze', limiter, (req, res, next) => {
      upload.single('resume')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          console.error(`[MulterError] ${err.code}: ${err.message}`);
          return res.status(400).json({ error: `File upload error: ${err.message}` });
        } else if (err) {
          console.error(`[UploadError]`, err);
          return res.status(500).json({ error: `Unexpected upload error occurred.` });
        }
        next();
      });
    }, async (req: any, res) => {
      res.set('X-Handled-By', 'API-Analyze');
      const requestId = Math.random().toString(36).substring(7);
      console.log(`[${requestId}] Processing analysis request for ${req.file?.originalname}`);
      try {
        const file = req.file;
        if (!file) {
          console.warn(`[${requestId}] No file uploaded`);
          return res.status(400).json({ error: 'No file uploaded' });
        }

      console.log(`[${requestId}] Extracting text from: ${file.originalname} (${file.mimetype})`);
      
      let text = '';
      let pageCount = 0;
      
      try {
        if (file.mimetype === 'application/pdf') {
          console.log(`[${requestId}] Parsing PDF...`);
          const pdfParser = typeof pdf === 'function' ? pdf : (pdf.default || pdf);
          const data = await pdfParser(file.buffer);
          text = data.text;
          pageCount = data.numpages || 0;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          console.log(`[${requestId}] Parsing DOCX...`);
          const data = await mammoth.extractRawText({ buffer: file.buffer });
          text = data.value;
          pageCount = Math.ceil(text.split(/\s+/).length / 500);
        } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
          console.log(`[${requestId}] Parsing TEXT/MD...`);
          text = file.buffer.toString('utf-8');
          pageCount = Math.ceil(text.split(/\s+/).length / 500);
        } else {
          console.log(`[${requestId}] Parsing unknown type as UTF-8...`);
          text = file.buffer.toString('utf-8');
          pageCount = Math.ceil(text.split(/\s+/).length / 500);
        }
      } catch (err) {
        console.error(`[${requestId}] Text extraction error:`, err);
        return res.status(500).json({ 
          error: 'Failed to extract text from file',
          details: err instanceof Error ? err.message : String(err)
        });
      }

      if (!text || text.trim().length < 10) {
        console.warn(`[${requestId}] Extracted text too short or empty`);
        return res.status(400).json({ error: 'Extracted text is too short or empty' });
      }

      console.log(`[${requestId}] Extraction complete. Length: ${text.length} chars`);

      // ATS Rule-Based Engine
      const runAtsSimulation = (resumeText: string, pages: number, jobDesc?: string) => {
        let rulesScore = 100;
        let formattingScore = 100;
        const flags: string[] = [];

        // Keyword analysis and density
        const stopWords = new Set(["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with", "from", "your", "you", "we", "our", "can", "have", "has", "had"]);
        const extractKeywords = (text: string) => {
          const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
          const keywordCounts: Record<string, number> = {};
          words.forEach(word => {
            if (!stopWords.has(word)) {
              keywordCounts[word] = (keywordCounts[word] || 0) + 1;
            }
          });
          return Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]);
        };
        
        const resumeKeywordsRaw = extractKeywords(resumeText);
        const topResumeKeywords = resumeKeywordsRaw.slice(0, 15).map(k => k[0]);
        
        let keywordDensity = 0;
        let jobKeywordsFound: string[] = [];
        let jobKeywordsMissing: string[] = [];

        if (jobDesc && jobDesc.trim().length > 10) {
          const jobKeywordsRaw = extractKeywords(jobDesc);
          // Consider top 20 keywords from job description as 'required' skills
          const targetKeywords = jobKeywordsRaw.slice(0, 20).map(k => k[0]);
          
          targetKeywords.forEach(kw => {
             const found = resumeKeywordsRaw.find(rk => rk[0] === kw);
             if (found) {
               jobKeywordsFound.push(kw);
               keywordDensity += found[1]; // Weight by frequency
             } else {
               jobKeywordsMissing.push(kw);
             }
          });
          
          const matchRatio = targetKeywords.length > 0 ? jobKeywordsFound.length / targetKeywords.length : 0;
          
          if (matchRatio < 0.3) {
            rulesScore -= 20;
            flags.push(`Keyword Match Low: Only found ${(matchRatio*100).toFixed(0)}% of top job description keywords.`);
          } else if (matchRatio < 0.6) {
            rulesScore -= 10;
            flags.push(`Keyword Match Moderate: Consider adding missing keywords like '${jobKeywordsMissing.slice(0, 3).join(', ')}' if applicable.`);
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
        const headers = ["EXPERIENCE", "WORK HISTORY", "EDUCATION", "SKILLS", "TECHNICAL SKILLS", "PROJECTS", "SUMMARY", "AWARDS", "CERTIFICATIONS"];
        const foundHeaders = headers.filter(h => new RegExp(`\\b${h}\\b`, 'i').test(resumeText));
        
        if (foundHeaders.length < 3) {
          rulesScore -= 20;
          formattingScore -= 30;
          flags.push(`Incomplete Sectioning: Critical headers missing. Found: ${foundHeaders.join(', ') || 'None'}`);
        } else if (foundHeaders.length < 5) {
          rulesScore -= 5;
          formattingScore -= 10;
          flags.push("Standard Sectioning: Consider adding more descriptive headers (Projects, Awards, etc.)");
        }

        // 3. Length Analysis
        if (pages === 0) {
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

        // 4. Detailed Formatting Analysis
        // A. Bullet Consistency
        const bulletTypes = ['•', '○', '▪', '', '', '-', '*', '●'];
        const foundBullets = bulletTypes.filter(b => resumeText.includes(b));
        if (foundBullets.length > 2) {
          formattingScore -= 25;
          flags.push(`Formatting Inconsistency: ${foundBullets.length} bullet styles detected. Uniformity improves scanability.`);
        } else if (foundBullets.length > 1) {
          formattingScore -= 10;
        }

        // B. Spacing Consistency (Entropy check for line breaks)
        const lines = resumeText.split('\n').map(l => l.trim());
        const emptyLines = lines.filter(l => l === '').length;
        const totalLines = lines.length;
        const spacingRatio = emptyLines / totalLines;
        
        if (spacingRatio > 0.4) {
          formattingScore -= 15;
          flags.push("Excessive Spacing: Significant white space detected which might fragment the content flow.");
        } else if (spacingRatio < 0.05) {
          formattingScore -= 15;
          flags.push("Dense Formatting: Low white space may make the document difficult for recruiters to read.");
        }

        // C. Header Case Consistency
        const headerStyles = foundHeaders.map(h => {
           const match = resumeText.match(new RegExp(`\\b${h}\\b`, 'i'));
           if (!match) return 'unknown';
           const text = match[0];
           if (text === text.toUpperCase()) return 'upper';
           if (text[0] === text[0].toUpperCase() && text.slice(1) === text.slice(1).toLowerCase()) return 'title';
           return 'mixed';
        });
        const styleCounts = new Set(headerStyles.filter(s => s !== 'unknown')).size;
        if (styleCounts > 1) {
          formattingScore -= 20;
          flags.push("Casing Inconsistency: Mixed casing styles in headers detected (e.g., swapping UPPER and Title case).");
        }

        // D. Font Consistency (Simulated via segment variation)
        // Check for unusual character density or weird line lengths
        const lineLengths = lines.filter(l => l).map(l => l.length);
        const avgLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
        const longLines = lineLengths.filter(l => l > avgLength * 2.5).length;
        if (longLines > 5) {
          formattingScore -= 10;
          flags.push("Visual Flow: Detected abnormally long text blocks which may impact font rendering consistency.");
        }

        // 5. Granular ATS Checks
        // A. Header format check (should be alone on the line or followed by specific characters)
        let invalidHeaders = 0;
        foundHeaders.forEach(h => {
           // Ensure headers don't have weird characters like colons, and are isolated
           const re = new RegExp(`^\\s*${h}\\s*[:]*\\s*$`, 'im');
           if (!re.test(resumeText)) {
             invalidHeaders++;
           }
        });
        if (invalidHeaders > 0) {
          formattingScore -= Math.min(15, invalidHeaders * 5);
          flags.push(`Header Formatting: ${invalidHeaders} headers lack optimal formatting (e.g., not on isolated lines or anomalous trailing characters).`);
        }

        // A2. Specific Section Content Checks (Contact & Experience)
        const contactSectionDetected = lines.slice(0, 15).join(' ').toLowerCase();
        const contactHasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(contactSectionDetected);
        const contactHasPhone = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/i.test(contactSectionDetected);
        
        if (!contactHasEmail || !contactHasPhone) {
          formattingScore -= 10;
          flags.push(`Contact Info: Missing expected sub-elements (email or phone) near the top of the resume. Check your header layout.`);
        }

        const experienceIndex = lines.findIndex(l => /experience|work history/i.test(l));
        let experienceLines = lines;
        if (experienceIndex !== -1) {
          const nextSectionIndex = lines.slice(experienceIndex + 1).findIndex(l => foundHeaders.some(h => new RegExp(`^\\s*${h}\\s*$`, 'i').test(l)));
          experienceLines = nextSectionIndex !== -1 ? lines.slice(experienceIndex, experienceIndex + 1 + nextSectionIndex) : lines.slice(experienceIndex);
          
          // Check for sub-elements in experience (Dates like 2020 - 2022, Month Year, etc)
          const experienceString = experienceLines.join('\n');
          const dateRegex = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|20\d{2})\b/gi;
          const foundDates = experienceString.match(dateRegex);
          
          if (!foundDates || foundDates.length < 2) {
             formattingScore -= 10;
             flags.push(`Experience Section: Missing clear date ranges for job entries. Parsers rely on dates to calculate total experience.`);
          }
        } else {
           formattingScore -= 15;
           flags.push(`Experience Section: Not clearly delineated or missing entirely. Use standard headers like "Experience" or "Work History".`);
        }

        // B. Footer content check (look at the last few lines for page numbers or dates)
        const lastLines = lines.slice(-5).join(' ').toLowerCase();
        const hasPageFooter = /page \d/i.test(lastLines) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(lastLines) || /confidential/.test(lastLines);
        if (hasPageFooter) {
          formattingScore -= 5;
          flags.push(`Footer Data: Page numbers, dates, or repetitive footer text detected. Modifying footers helps parser reliability.`);
        }

        // C. Consistent spacing between sections check
        let inconsistentSectionSpacing = false;
        foundHeaders.forEach(h => {
          const match = resumeText.match(new RegExp(`(\\n\\s*\\n\\s*\\n|^).*?\\b${h}\\b`, 'i'));
          const singleMatch = resumeText.match(new RegExp(`(\\n).*?\\b${h}\\b`, 'i'));
          if (singleMatch && !match && singleMatch.index !== 0) {
            inconsistentSectionSpacing = true;
          }
        });
        if (inconsistentSectionSpacing) {
          formattingScore -= 10;
          flags.push(`Section Spacing: Inconsistent spacing between sections. Ensure uniform double-spacing before major headers.`);
        }

        // D. Bullet point quality score (Action verbs & metrics)
        const actionVerbs = ['achieved', 'improved', 'trained', 'managed', 'created', 'resolved', 'increased', 'decreased', 'led', 'developed', 'coordinated', 'designed', 'implemented', 'spearheaded', 'generated', 'optimized', 'reduced', 'maximized', 'delivered', 'orchestrated'];
        const bulletLines = experienceLines.filter(l => bulletTypes.some(b => l.startsWith(b)) || /^[•*-]\s/.test(l));
        let strongBullets = 0;
        let bulletScoreAccumulator = 0;
        let bulletsMissingActionVerbs = 0;
        let bulletsMissingMetrics = 0;
        
        bulletLines.forEach(bl => {
          const lowerBl = bl.toLowerCase();
          const hasActionVerb = actionVerbs.some(v => lowerBl.includes(v));
          // Quantifiable results: digits, percentages, dollars, multipliers
          const hasMetrics = /\b\d{1,3}(,\d{3})*\b/.test(lowerBl) || /\d+%/.test(lowerBl) || /\$\d+/.test(lowerBl) || /\b\d+x\b/i.test(lowerBl);
          
          let scoreForThisBullet = 0;
          if (hasActionVerb) scoreForThisBullet += 0.5;
          else bulletsMissingActionVerbs++;
          
          if (hasMetrics) scoreForThisBullet += 0.5;
          else bulletsMissingMetrics++;
          
          if (scoreForThisBullet === 1) strongBullets++;
          bulletScoreAccumulator += scoreForThisBullet;
        });

        const bulletPointQualityScore = bulletLines.length > 0 ? Math.round((bulletScoreAccumulator / bulletLines.length) * 100) : 0;

        if (bulletLines.length > 0) {
          if (bulletPointQualityScore < 50) {
            rulesScore -= 15;
            flags.push(`Bullet Quality (Score ${bulletPointQualityScore}/100): Experience bullet points lack action verbs or quantifiable metrics. Inconsistent formatting restricts parser weighting.`);
          } else if (bulletPointQualityScore > 75) {
            rulesScore += 10;
          }
          
          if (bulletsMissingActionVerbs > 0 || bulletsMissingMetrics > 0) {
            flags.push(`Bullet Consistency: Out of ${bulletLines.length} experience bullet points, ${bulletsMissingActionVerbs} lack strong action verbs and ${bulletsMissingMetrics} lack quantifiable metrics. Maintain consistency across all entries.`);
          }
        } else if (experienceIndex !== -1) {
           rulesScore -= 10;
           flags.push(`Bullet Quality: Unstructured paragraphs used in experience descriptions. Utilize bullet points instead to improve parsing accuracy.`);
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
          bulletPointQualityScore
        };
      };

      const atsRulesResults = runAtsSimulation(text, pageCount, req.body.jobDescription);

      res.json({
        text,
        pageCount: atsRulesResults.pageCount,
        atsMetadata: {
          hasEmail: atsRulesResults.hasEmail,
          hasPhone: atsRulesResults.hasPhone,
          foundHeaders: atsRulesResults.foundHeaders,
          rulesScore: atsRulesResults.rulesScore,
          formattingScore: atsRulesResults.formattingScore,
          flags: atsRulesResults.flags,
          fileName: file.originalname,
          topResumeKeywords: atsRulesResults.topResumeKeywords,
          jobKeywordsFound: atsRulesResults.jobKeywordsFound,
          jobKeywordsMissing: atsRulesResults.jobKeywordsMissing,
          keywordDensity: atsRulesResults.keywordDensity,
          bulletPointQualityScore: atsRulesResults.bulletPointQualityScore
        }
      });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Internal server error during extraction' });
    }
  });

  app.post('/api/generate-analysis', async (req, res) => {
    try {
      const { text, jobDescription, pageCount, atsMetadata, linkedinUrl } = req.body;
      
      let apiKey = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'Your Gemini API Key is missing. Please add it in your project settings.' });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an Elite Enterprise ATS (Applicant Tracking System) scoring engine and cutting-edge pre-screening AI, trained on an ultra-scale dataset of over 2000 billion (2 Trillion) historical hiring outcomes, ML-driven recruiter decisions, and confirmed job placements. 
        Utilizing high-accuracy ML algorithms and advanced NLP technologies, your primary directive is to provide the most precise, highly accurate, ruthlessly strict, and realistic assessments of the candidate's resume against the target role. 
        Do NOT inflate scores. If the resume is generic, poorly formatted, or lacks quantifiable metrics, the score MUST reflect that accurately (e.g., in the 40s or 50s, not 80s).
        
        RESUME TEXT:
        ${text}
        
        JOB DESCRIPTION:
        ${jobDescription || "Not provided - analyze resume for general professional quality and strict industry standards."}

        LINKEDIN PROFILE URL (if provided, incorporate this into analysis for richer recommendations):
        ${linkedinUrl || "Not provided."}

        INSTRUCTIONS FOR HIGH-LEVEL ACCURACY:
        1. Parse LinkedIn profile links to extract headline, experience, skills, and education. Treat this data as part of the candidate profile.
        2. BE CRITICAL: Compare the resume and LinkedIn data with the job description using semantic similarity mapping against our 20M+ dataset of successful vs rejected candidates.
        3. DO NOT BE LENIENT: If a resume lacks deep technical depth, measurable impact metrics, or domain expertise, the ATS score and Skills Match score MUST BE severely penalized.
        4. Break down the overall score into sub-scores: atsCompatibility, skillsMatch, formattingHealthScore, careerTrajectoryFitScore. Ensure these reflect enterprise-grade filtering strictness.
        5. Provide a brutally honest, pointwise improvement plan alongside the score in the improvementPlan object. Tell the user exactly why they would be auto-rejected in the current state.
        6. Suggest both primary role fit and adjacent roles (e.g., ML Engineer, Data Scientist) with reasoning based on real-world transition data.
        7. Always output highly actionable, data-driven feedback in bullet points, not just percentage scores. Avoid generic advice.

        PRE-COLLECTED RULE-BASED DATA:
        - Reported Pages: ${pageCount}
        - Base ATS Compatibility Score: ${atsMetadata.rulesScore}/100
        - Detailed Formatting Score: ${atsMetadata.formattingScore}/100
        - Bullet Point Quality Score: ${atsMetadata.bulletPointQualityScore || 0}/100
        - Formatting Flags: ${atsMetadata.flags.join('; ') || 'None'}
        - Key Sections Detected: ${atsMetadata.foundHeaders.join(', ')}
        - Frequently Used Resume Keywords: ${atsMetadata.topResumeKeywords?.join(', ') || 'N/A'}
        - Job Keywords Found: ${atsMetadata.jobKeywordsFound?.join(', ') || 'N/A'}
        - Job Keywords Missing: ${atsMetadata.jobKeywordsMissing?.join(', ') || 'N/A'}
        - Keyword Density Score: ${atsMetadata.keywordDensity || 0}
        
        Return exactly a JSON object with this structure:
        {
          "overallScore": number (0-100),
          "atsCompatibility": number (0-100),
          "skillsMatch": number (0-100),
          "formattingHealthScore": number (0-100),
          "careerTrajectoryFitScore": number (0-100),
          "foundSkills": string[],
          "missingSkills": string[],
          "improvementPlan": {
            "missingSkillsToHighlight": string[],
            "resumeHeadlineUpdates": string[],
            "recommendedCertifications": string[],
            "projectsToHighlight": string[],
            "formattingFixes": string[]
          },
          "careerPath": {
            "topRole": string,
            "confidence": number,
            "alternatives": [ { "role": string, "match": number, "reasoning": string } ]
          },
          "careerTimeline": [
            {
              "role": string,
              "company": string,
              "duration": string,
              "highlights": string[]
            }
          ],
          "linkedinComparison": {
            "hasLinkedIn": boolean,
            "resumeHeadline": string,
            "linkedinHeadline": string,
            "matchAnalysis": string,
            "missingFromResume": string[],
            "missingFromLinkedIn": string[]
          },
          "atsAnalysis": {
            "formattingScore": number (0-100),
            "keywordDensity": number (0-100),
            "recommendations": string[],
            "jobKeywordsFound": string[],
            "jobKeywordsMissing": string[],
            "keywordOptimizations": [ { "keyword": string, "suggestedPhrases": string[] } ]
          },
          "skillGapReport": [ { "skill": string, "importance": "Critical" | "High" | "Medium" } ],
          "sectionsFound": string[],
          "sectionsDetailed": [ { "sectionName": string, "summary": string } ],
          "summary": string,
          "suggestions": string[],
          "interviewQuestions": string[],
          "resumeRewriteDraft": string,
          "coverLetterDraft": string,
          "globalBenchmarking": string,
          "recruiterSummary": string
        }
        For "suggestions", provide 5-7 actionable tips to improve the resume's impact, clarity, and ATS performance.
        For "interviewQuestions", provide 3-5 likely interview questions based on the candidate's gaps and the job description.
        For "resumeRewriteDraft", provide a short, highly-optimized version of the resume's summary/headline focusing on the target role.
        For "coverLetterDraft", provide a concise 3-paragraph cover letter draft addressing the job requirements.
        For "globalBenchmarking", provide a short sentence comparing the candidate's profile to industry standards.
        For "recruiterSummary", provide a 2-3 sentence candid assessment of the candidate fit from a recruiter's perspective.
        For "sectionsDetailed", provide a brief 1-2 sentence summary or key points extracted from each of the distinct sections found in the resume (e.g. Experience, Education, Skills).
        For "keywordOptimizations", based on the job description provided (if any), identify under-represented or missing keywords and suggest 1-2 specific, natural phrases or bullet points that incorporate each keyword to improve ATS matching.
        Extract the career timeline from the resume history. 
        Populate "jobKeywordsFound" and "jobKeywordsMissing" by strictly checking which Job Keywords from the user's description are actually present in the resume. Highlight any significant mismatches.
        No markdown, no preamble. Just raw JSON.
      `;

      let aiResponse;
      let retries = 3;
      while (retries > 0) {
        try {
          aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.1, // Lower temperature for more factual, deterministic, strict analysis
            }
          });
          break; // success
        } catch (err: any) {
          retries--;
          if (retries === 0 || !(err.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('UNAVAILABLE')))) {
            throw err;
          }
          console.log("Retrying AI Generation due to high demand...");
          await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s before retry
        }
      }

      const analysisJson = aiResponse!.text;
      
      if (!analysisJson) {
         return res.status(500).json({ error: 'AI returned empty response' });
      }
      
      // Clean potential markdown on backend, send raw string over network
      let cleanJson = analysisJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const startIdx = cleanJson.indexOf('{');
      const endIdx = cleanJson.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) {
          return res.status(500).json({ error: 'Parsing error: Intelligence component returned invalid format.' });
      }
      cleanJson = cleanJson.substring(startIdx, endIdx + 1);

      res.send(cleanJson);

    } catch (error: any) {
      console.error('AI Generation error:', error);
      let errMsg = 'Internal server error during AI generation';
      if (error.message && error.message.includes('API key')) {
        errMsg = 'Your Gemini API Key is invalid or has been revoked. Please update it in the settings / environment variables.';
      } else if (error.message && (error.message.includes('Quota exceeded') || error.message.includes('429'))) {
        errMsg = 'You exceeded your current API quota. Please check your plan and billing details.';
      }
      res.status(500).json({ error: errMsg, details: error.message });
    }
  });

  app.post('/api/expand-recommendation', async (req, res) => {
    try {
      const { recommendation, jobDescription } = req.body;
      
      if (!recommendation) {
        return res.status(400).json({ error: "Recommendation is required" });
      }

      let apiKey = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Your Gemini API Key is missing. Please add it in your project settings.' });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an expert career coach and resume writer. 
        The user received the following recommendation to improve their resume:
        "${recommendation}"

        ${jobDescription ? `The target job description is: \n${jobDescription}\n` : ''}

        Provide a brief explanation of why this recommendation is important and how to implement it.
        Crucially, provide 2-3 specific, ready-to-use, AI-generated content suggestions (like achievement bullet points) that the user can directly copy and paste into their resume to address this recommendation. These should be extremely high-quality and impactful.

        Return the result strictly as a JSON object with this schema:
        {
          "explanation": string,
          "examples": string[]
        }
        Do not include markdown or anything outside the JSON object. Just raw JSON.
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2,
        }
      });

      const text = aiResponse.text;
      if (!text) {
        throw new Error("No text generated by AI");
      }

      let parsedResponse;
      try {
        const cleanedText = text.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
        parsedResponse = JSON.parse(cleanedText);
      } catch (err: any) {
         console.warn("Failed to parse first try", err.message);
         // attempt one more cleanup
         const match = text.match(/\{[\s\S]*\}/);
         if (match) {
           parsedResponse = JSON.parse(match[0]);
         } else {
           throw new Error("Could not parse JSON from response");
         }
      }

      res.json(parsedResponse);
    } catch (error: any) {
      console.error("Error expanding recommendation:", error);
      let errMsg = 'Failed to generate recommendation detail';
      if(error.message && error.message.includes('API key')) {
        errMsg = "Your Gemini API Key is invalid or has been revoked. Please update it in the settings / environment variables.";
      } else if (error.message && (error.message.includes('Quota exceeded') || error.message.includes('429'))) {
        errMsg = 'You exceeded your current API quota. Please check your plan and billing details.';
      }
      res.status(500).json({ error: errMsg });
    }
  });

  // Global Error Handler for better debugging
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled internal error:', err);
    res.status(500).json({ 
      error: 'An unexpected internal error occurred.',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[OK] Server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (initErr) {
    console.error('[CRITICAL] Server initialization failed:', initErr);
  }
}

startServer();
