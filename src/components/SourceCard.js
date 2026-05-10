"use client";

import { useState } from "react";

export default function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="source-card">
      <div 
        className="source-header" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="source-title">
          <span>📚 Source {index}</span>
          <span style={{ opacity: 0.6 }}>· {source.fileName}</span>
        </div>
        <div className="source-toggle">
          {expanded ? "Hide" : "Show"} context
        </div>
      </div>
      {expanded && (
        <div className="source-content">
          {source.text}
        </div>
      )}
    </div>
  );
}
