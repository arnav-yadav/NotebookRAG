# NotebookRAG 📚

A professional, grounded AI chat application built for conversational RAG (Retrieval-Augmented Generation). Upload documents and have accurate, cited conversations with your data.

## 🚀 Features
- **PDF & TXT Support**: Seamlessly upload and index document content.
- **Grounded Generation**: Answers are strictly derived from the uploaded documents to prevent hallucinations.
- **Source Citations**: Every answer includes clickable citations to the exact part of the document used.
- **Vector Search**: High-performance semantic search powered by Qdrant Cloud.
- **Premium UI**: Modern, glassmorphic dark mode interface built with Next.js.

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **AI Models**: 
  - **Generation**: OpenAI `gpt-4o-mini`
  - **Embeddings**: OpenAI `text-embedding-3-small`
- **Vector Database**: [Qdrant Cloud](https://qdrant.tech/)
- **Parsing**: `pdf-parse` (v2)
- **Styling**: Vanilla CSS with modern design tokens

## 📋 Setup Instructions

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_key_here
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_api_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture
1. **Ingestion**: Documents are split into semantic chunks using a recursive character text splitter.
2. **Embedding**: Each chunk is converted into a 1536-dimensional vector using OpenAI's embedding model.
3. **Storage**: Vectors and metadata are stored in a Qdrant collection with payload indexing for fast retrieval.
4. **Retrieval**: User queries are embedded and compared against the vector store using cosine similarity.
5. **Generation**: The top relevant chunks are passed to GPT-4o-mini as context to generate a cited, grounded response.
