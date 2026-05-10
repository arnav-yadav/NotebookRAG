import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";

// Create client
const getClient = () => {
  return new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });
};

const COLLECTION_NAME = "notebookrag";
const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small size

export async function initCollection() {
  const client = getClient();
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.find((c) => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      
      // Create payload index for documentId to allow filtering
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "documentId",
        field_schema: "keyword",
        wait: true
      });
      
      console.log(`Collection ${COLLECTION_NAME} and index created.`);
    }
  } catch (error) {
    console.error("Error initializing collection:", error);
    throw error;
  }
}

export async function upsertChunks(documentId, fileName, chunks, embeddings) {
  const client = getClient();
  await initCollection(); // Ensure it exists
  
  const points = chunks.map((chunkText, index) => {
    return {
      id: uuidv4(),
      vector: embeddings[index],
      payload: {
        documentId,
        fileName,
        text: chunkText,
        chunkIndex: index,
        // We could also try to extract page numbers if pdf-parse gives them easily, 
        // but text-based chunking might cross page boundaries.
      },
    };
  });

  // Upload in batches to avoid payload size issues
  const batchSize = 100;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: batch,
    });
  }
}

export async function searchSimilarChunks(documentId, queryEmbedding, limit = 5) {
  const client = getClient();
  
  const filter = documentId ? {
    must: [
      {
        key: "documentId",
        match: {
          value: documentId
        }
      }
    ]
  } : undefined;

  const results = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit,
    filter,
    with_payload: true,
  });

  return results;
}

export async function getDocuments() {
  // Qdrant doesn't have a direct "group by" or "distinct" on payload fields easily in the REST API
  // We can do a scroll to get unique documentIds, but since this is a simple app, we can use 
  // the scroll API to fetch points and extract unique docs.
  const client = getClient();
  
  try {
    const results = await client.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: true,
      with_vector: false
    });
    
    const docsMap = new Map();
    for (const point of results.points) {
      if (point.payload && point.payload.documentId) {
        if (!docsMap.has(point.payload.documentId)) {
          docsMap.set(point.payload.documentId, {
            id: point.payload.documentId,
            name: point.payload.fileName || "Unknown Document",
          });
        }
      }
    }
    
    return Array.from(docsMap.values());
  } catch (err) {
    console.error("Error getting documents:", err);
    return [];
  }
}

export async function deleteDocument(documentId) {
  const client = getClient();
  await client.delete(COLLECTION_NAME, {
    wait: true,
    filter: {
      must: [
        {
          key: "documentId",
          match: {
            value: documentId
          }
        }
      ]
    }
  });
}
