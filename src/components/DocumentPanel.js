"use client";

import { useState, useRef } from "react";

export default function DocumentPanel({ 
  documents, 
  activeDocId, 
  onSelectDoc, 
  onDeleteDoc, 
  onUploadSuccess 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt')) {
      alert('Please upload a PDF or TXT file.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File too large. Max 20MB allowed.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadSuccess(data);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <aside className="doc-panel">
      <div className="doc-panel-header">
        <h2>Catalogue</h2>
        <p>Your uploaded documents</p>
      </div>

      <div 
        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          {isUploading ? (
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          ) : (
            '📄'
          )}
        </div>
        <div className="upload-text">
          {isUploading ? 'Uploading & Indexing...' : 'Drag & drop document'}
        </div>
        {!isUploading && (
          <div className="upload-subtext">or click to browse · PDF, TXT (Max 20MB)</div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf,.txt"
          onChange={handleFileSelect}
        />
      </div>

      <div className="doc-list-container">
        {documents.length > 0 && (
          <div className="doc-list-title">Indexed Documents ({documents.length})</div>
        )}
        
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className={`doc-item ${activeDocId === doc.id ? 'active' : ''}`}
            onClick={() => onSelectDoc(doc.id)}
          >
            <div className="doc-icon">
              {doc.name.endsWith('.txt') ? '📝' : '📑'}
            </div>
            <div className="doc-info">
              <div className="doc-name" title={doc.name}>{doc.name}</div>
            </div>
            <div className="doc-actions">
              <button 
                className="btn-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDoc(doc.id);
                }}
                title="Delete document"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {documents.length === 0 && !isUploading && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No documents yet. Upload one to get started.
          </div>
        )}
      </div>
    </aside>
  );
}
