import OpenAI from "openai";

// Lazy-init: the client is only created when first used at runtime,
// not at module-evaluation time (which happens during `next build`).
let _openai = null;
function getClient() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function embedText(text) {
  const openai = getClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function embedChunks(chunks) {
  const openai = getClient();
  const embeddings = [];
  // OpenAI allows batching up to 2048 inputs per request
  const batchSize = 100;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    
    embeddings.push(...response.data.map(item => item.embedding));
  }
  
  return embeddings;
}
