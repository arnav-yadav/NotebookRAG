import { NextResponse } from "next/server";
import { embedText } from "@/lib/embeddings";
import { searchSimilarChunks } from "@/lib/vectorStore";
import { generateGroundedAnswer } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { query, documentId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Embed the user's query
    console.log(`Chat Query: "${query}" for Doc: ${documentId}`);
    const queryEmbedding = await embedText(query);

    // 2. Retrieve relevant chunks
    const retrievedChunks = await searchSimilarChunks(documentId, queryEmbedding, 5);
    console.log(`Retrieved ${retrievedChunks.length} chunks from Qdrant`);

    if (retrievedChunks.length === 0) {
      console.warn("No relevant chunks found in database.");
      return NextResponse.json({ 
        answer: "I couldn't find any relevant information in the document.",
        sources: []
      });
    }

    // 3. Generate answer using OpenAI
    const answer = await generateGroundedAnswer(query, retrievedChunks);

    // 4. Format sources for the response
    const sources = retrievedChunks.map(chunk => ({
      text: chunk.payload.text,
      fileName: chunk.payload.fileName,
      chunkIndex: chunk.payload.chunkIndex,
      score: chunk.score
    }));

    return NextResponse.json({ 
      answer,
      sources
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate answer" }, { status: 500 });
  }
}
