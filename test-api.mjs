async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'test resume text',
        pageCount: 1,
        atsMetadata: { rulesScore: 100, formattingScore: 100, flags: [], foundHeaders: [] }
      })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error(err);
  }
}
test();
