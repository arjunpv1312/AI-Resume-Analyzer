import { GoogleGenAI } from '@google/genai';

async function testKey(key) {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "say test"
    });
    console.log("Key works:", key);
  } catch (err) {
    console.error("Key failed:", key, err.message);
  }
}

async function main() {
  await testKey("AIzaSyBYaBjMbM-Zk9ajwRXrMVInTqWHyitXhtA");
  await testKey("AIzaSyDnNiXA4UEVREx39t3vm7Wc7bXK_og-D1Q");
  await testKey("AIzaSyAR4XoToIAsinvxbVw-WE1R-Nru0DJL7kU");
}
main();
