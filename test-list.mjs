import { GoogleGenAI } from '@google/genai';

async function testKey(key) {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const models = await ai.models.list();
    console.log("Key works:", key);
    for await (const m of models) {
      console.log(m.name);
    }
  } catch (err) {
    console.error("Key failed:", key, err.message);
  }
}

async function main() {
  await testKey("AIzaSyBYaBjMbM-Zk9ajwRXrMVInTqWHyitXhtA");
  await testKey("AIzaSyDnNiXA4UEVREx39t3vm7Wc7bXK_og-D1Q");
}
main();
