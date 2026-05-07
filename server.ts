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
    const PORT = 3000;

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 15, // limit each IP to 15 requests per windowMs
      message: { error: 'Too many requests, please try again later.' }
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
          keywordDensity
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
          keywordDensity: atsRulesResults.keywordDensity
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
      
      let apiKey = process.env.GEMINI_API_KEY;

      if(!apiKey || apiKey.startsWith('AIzaSyBYaBjMbM') || apiKey === 'MY_GEMINI_API_KEY') {
          apiKey = "AIzaSyAR4XoToIAsinvxbVw-WE1R-Nru0DJL7kU"; // Fallback to user provided key
      }

      if(!apiKey) {
          return res.status(500).json({ error: 'Intelligence engine API key is missing on the server. Please check your environment variables.' });
      }

      console.log("USING API KEY EXACTLY:", JSON.stringify(apiKey));
      require('fs').writeFileSync('debug-api-key-2.txt', JSON.stringify(apiKey));
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an expert ATS (Applicant Tracking System) and Career Coach. 
        Analyze the following resume text against the provided job description.
        
        RESUME TEXT:
        ${text}
        
        JOB DESCRIPTION:
        ${jobDescription || "Not provided - analyze resume for general professional quality."}

        LINKEDIN PROFILE URL (if provided, incorporate this into analysis for richer recommendations):
        ${linkedinUrl || "Not provided."}

        PRE-COLLECTED RULE-BASED DATA:
        - Reported Pages: ${pageCount}
        - Base ATS Compatibility Score: ${atsMetadata.rulesScore}/100
        - Detailed Formatting Score: ${atsMetadata.formattingScore}/100
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
          "foundSkills": string[],
          "missingSkills": string[],
          "careerPath": {
            "topRole": string,
            "confidence": number,
            "alternatives": { "role": string, "match": number }[]
          },
          "careerTimeline": [
            {
              "role": string,
              "company": string,
              "duration": string,
              "highlights": string[]
            }
          ],
          "atsAnalysis": {
            "formattingScore": number (0-100),
            "keywordDensity": number (0-100),
            "recommendations": string[],
            "jobKeywordsFound": string[],
            "jobKeywordsMissing": string[]
          },
          "skillGapReport": { "skill": string, "importance": "Critical" | "High" | "Medium" }[],
          "sectionsFound": string[],
          "summary": string,
          "suggestions": string[]
        }
        For "suggestions", provide 5-7 actionable tips to improve the resume's impact, clarity, and ATS performance.
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
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
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
      res.status(500).json({ error: 'Internal server error during AI generation', details: error.message, stack: error.stack });
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
