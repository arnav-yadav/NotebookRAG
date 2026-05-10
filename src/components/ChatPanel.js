"use client";

import { useState, useRef, useEffect } from "react";
import SourceCard from "./SourceCard";
import ReactMarkdown from 'react-markdown';

export default function ChatPanel({ activeDocument }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Clear chat when document changes
  useEffect(() => {
    setMessages([]);
  }, [activeDocument]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || !activeDocument || isLoading) return;

    const userQuery = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userQuery }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          documentId: activeDocument.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

      // Add assistant message with sources
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.answer,
        sources: data.sources
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error while trying to answer your question." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!activeDocument) {
    return (
      <main className="chat-panel">
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Select a document</h3>
          <p>Upload a new PDF or TXT file, or select an existing one from the catalogue to start a grounded conversation.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-panel">
      <div className="message-list">
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '0', flex: 'none', marginTop: 'auto', marginBottom: 'auto' }}>
            <div className="empty-icon" style={{ fontSize: '2rem' }}>💬</div>
            <h3>Ask about {activeDocument.name}</h3>
            <p style={{ fontSize: '0.875rem' }}>Your questions will be answered strictly based on the content of this document.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '✨'}
            </div>
            <div className="message-content">
              {msg.role === 'user' ? (
                <div>{msg.content}</div>
              ) : (
                <>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-container">
                      {msg.sources.map((source, sIdx) => (
                        <SourceCard key={sIdx} source={source} index={sIdx + 1} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">✨</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form className="input-container" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a question about ${activeDocument.name}...`}
            rows={1}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={!input.trim() || isLoading}
            title="Send Message"
          >
            ➤
          </button>
        </form>
      </div>
    </main>
  );
}
