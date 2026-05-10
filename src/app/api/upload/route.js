import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@/lib/chunker";
import { embedChunks } from "@/lib/embeddings";
import { upsertChunks } from "@/lib/vectorStore";
import { extractText } from "unpdf";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60; // Allow 60s for Vercel

export async function POST(request) {
  console.log("Upload request received");
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.QDRANT_URL) {
      console.error("Missing Environment Variables");
      return NextResponse.json({ 
        error: "Server configuration error: Missing API keys on Vercel." 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);

    const bytes = await file.arrayBuffer();
    const binaryData = new Uint8Array(bytes);
    
    let text = "";
    
    if (file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const result = await extractText(binaryData);
        text = result.text;
      } catch (pdfErr) {
        console.error("PDF Parsing Error:", pdfErr);
        return NextResponse.json({ error: "Failed to parse PDF: " + pdfErr.message }, { status: 500 });
      }
    } else if (file.name.toLowerCase().endsWith(".txt")) {
      text = new TextDecoder().decode(binaryData);
    } else {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (!text || (typeof text !== 'string' && typeof text.toString !== 'function')) {
      return NextResponse.json({ error: "No text could be extracted from this file." }, { status: 400 });
    }

    // Force to string if it's not one (e.g. if it's an array or object)
    text = String(text);
    console.log(`Extracted text length: ${text.length} characters`);

    if (text.trim().length === 0) {
      console.error("No text extracted from PDF");
      return NextResponse.json({ error: "Extracted text is empty." }, { status: 400 });
    }

    // Process chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = splitter.splitText(text);
    console.log(`Split into ${chunks.length} chunks`);

    // Generate embeddings
    const embeddings = await embedChunks(chunks);
    console.log(`Generated ${embeddings.length} embeddings`);

    // Store in Qdrant
    const documentId = uuidv4();
    await upsertChunks(documentId, file.name, chunks, embeddings);
    console.log(`Successfully stored document ${documentId} in Qdrant`);

    return NextResponse.json({ 
      success: true, 
      documentId,
      fileName: file.name,
      chunkCount: chunks.length 
    });

  } catch (error) {
    console.error("GLOBAL UPLOAD ERROR:", error);
    // GUARANTEE JSON RESPONSE
    return NextResponse.json({ 
      error: "Internal Server Error: " + (error.message || "Unknown error"),
      details: error.stack
    }, { status: 500 });
  }
}

