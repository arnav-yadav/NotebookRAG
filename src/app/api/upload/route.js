import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@/lib/chunker";
import { embedChunks } from "@/lib/embeddings";
import { upsertChunks } from "@/lib/vectorStore";
import { PDFParse } from "pdf-parse";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60; // Allow 60s for Vercel

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing. Please add it to your Vercel Environment Variables." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let text = "";
    
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
    } else if (file.name.toLowerCase().endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF or TXT file." }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from the file." }, { status: 400 });
    }

    // Process the text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = splitter.splitText(text);
    
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No valid text chunks found." }, { status: 400 });
    }

    // Generate embeddings
    const embeddings = await embedChunks(chunks);

    // Store in vector database
    const documentId = uuidv4();
    await upsertChunks(documentId, file.name, chunks, embeddings);

    return NextResponse.json({ 
      success: true, 
      documentId,
      fileName: file.name,
      chunkCount: chunks.length 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process the document" }, { status: 500 });
  }
}
