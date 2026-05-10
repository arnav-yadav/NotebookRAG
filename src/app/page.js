"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import DocumentPanel from "@/components/DocumentPanel";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleUploadSuccess = (data) => {
    const newDoc = { id: data.documentId, name: data.fileName };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(data.documentId);
  };

  const handleDeleteDoc = async (id) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (activeDocId === id) {
          setActiveDocId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const activeDocument = documents.find(d => d.id === activeDocId);

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <DocumentPanel 
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={setActiveDocId}
          onDeleteDoc={handleDeleteDoc}
          onUploadSuccess={handleUploadSuccess}
        />
        <ChatPanel 
          activeDocument={activeDocument} 
        />
      </div>
    </div>
  );
}
