import OpenAI from "openai";

// Reuse the same lazy-init pattern as embeddings.js
let _openai = null;
function getClient() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function generateGroundedAnswer(query, retrievedChunks) {
  const openai = getClient();

  // Prepare context
  const contextText = retrievedChunks.map((chunk, i) => {
    return `[Source ${i + 1}]:\n${chunk.payload.text}`;
  }).join("\n\n");

  const systemPrompt = `You are a helpful AI assistant that answers questions based ONLY on the provided document excerpts.
Your goal is to be accurate, helpful, and properly cite your sources.

Rules:
1. ONLY answer based on the provided context. Do not use outside knowledge.
2. If the context does not contain the answer, say "I cannot answer this based on the provided document."
3. Cite your sources using [Source X] notation where X is the source number.
4. Provide a clear, well-structured response.

Context:
${contextText}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: 0.2, // Low temperature for more factual responses
  });

  return response.choices[0].message.content;
}
