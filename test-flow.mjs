import fs from 'fs';

async function run() {
  console.log("Creating test resume...");
  const resumeContent = "John Doe\n\njohn.doe@example.com\n555-123-4567\n\nSoftware Engineer with 5 years of experience in React and Node.js.\nExperience:\n- Built a web app with React.\n- Created a REST API with Node.js and Express.\n\nEducation:\nBS Computer Science, University of X";
  fs.writeFileSync('test-resume.txt', resumeContent);

  const jobDesc = "We are looking for a Software Engineer with experience in React, Node.js, and Express to build web applications.";

  console.log("Calling /api/analyze...");
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="resume"; filename="test-resume.txt"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += `${resumeContent}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="jobDescription"\r\n\r\n`;
  body += `${jobDesc}\r\n`;
  body += `--${boundary}--\r\n`;

  const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });
  
  const analyzeData = await analyzeRes.json();
  console.log("/api/analyze status:", analyzeRes.status);
  if (analyzeRes.status !== 200) {
    console.error("Analyze error:", analyzeData);
    return;
  }
  console.log("Analyze success");
  
  console.log("Calling /api/generate-analysis...");
  const generateRes = await fetch('http://localhost:3000/api/generate-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: analyzeData.text,
      jobDescription: jobDesc,
      pageCount: analyzeData.atsMetadata.pageCount,
      atsMetadata: analyzeData.atsMetadata
    })
  });
  
  console.log("/api/generate-analysis status:", generateRes.status);
  const generateBody = await generateRes.text();
  try {
     const data = JSON.parse(generateBody);
     console.log("Generate success, Top-level keys:", Object.keys(data));
  } catch(e) {
     console.error("Failed to parse generation JSON:", generateBody);
  }
}
run();
