import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader, Sparkles, User, HelpCircle, Paperclip, FileText, X } from 'lucide-react';
import { api } from '../utils/api';

export default function CareerCoach({ coachContext, clearCoachContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Career Coach. I can help you negotiate salary, prepare for technical rounds at FAANG, review your resume structure, or suggest high-value projects for your portfolio.\n\n**You can attach your resume (PDF or Word) here, and I'll analyze it to give you personalized career advice!**\n\nWhat are you focused on today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle outside context triggers (e.g. "Tailor Resume" redirect)
  useEffect(() => {
    if (coachContext && coachContext.initialMessage) {
      handleDirectPrompt(coachContext.initialMessage, coachContext.topic);
      clearCoachContext(); // Reset context so it doesn't trigger repeatedly
    }
  }, [coachContext]);

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;

    let textToSend = input;
    let originalUserMessage = input;

    if (attachedFile) {
      setAnalyzingFile(true);
      try {
        const analysis = await api.parseDocumentForCoach(attachedFile);
        // The Express API wraps the FastAPI response inside a "report" field
        const report = analysis.report || analysis;
        const resumeText = report.raw_text_preview || "";
        const detectedSkills = report.skills || report.skills_extracted || [];
        const atsScore = report.ats_score || "N/A";
        const missingSkills = report.skills_match?.missing_required || [];

        const fileContext = `[RESUME DOCUMENT CONTENT - You MUST read and reference this content in your response]\n` +
          `Document: "${attachedFile.name}"\n` +
          `ATS Score: ${atsScore}\n` +
          `Skills Found: ${detectedSkills.length > 0 ? detectedSkills.join(', ') : 'None detected'}\n` +
          `Missing Critical Skills: ${missingSkills.length > 0 ? missingSkills.join(', ') : 'None'}\n` +
          `--- BEGIN RESUME TEXT ---\n${resumeText}\n--- END RESUME TEXT ---\n\n`;

        textToSend = fileContext + (input || "Please analyze my resume in detail. Tell me what's strong, what's weak, and give me specific actionable improvements.");
        if (!originalUserMessage) {
          originalUserMessage = `📄 Analyzed document: ${attachedFile.name}`;
        }
      } catch (err) {
        console.error("Document parsing failed:", err);
        setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't process that file. Please make sure it's a valid PDF or Word document and that the backend services are running." }]);
        setAnalyzingFile(false);
        return;
      }
    }

    const text = textToSend;
    const userDisplayMsg = originalUserMessage;

    setInput('');
    setAttachedFile(null);
    setAnalyzingFile(false);

    handleDirectPrompt(text, null, userDisplayMsg);
  };

  const handleDirectPrompt = async (text, topic = null, displayMsg = null) => {
    const userBubble = { role: 'user', content: displayMsg || text };
    setMessages(prev => [...prev, userBubble]);
    setLoading(true);
    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      historyPayload.push({ role: 'user', content: text });

      const response = await api.sendMessageToCoach(text, historyPayload, topic);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (err) {
      const errorMsg = err.message.includes('401') || err.message.includes('Authentication')
        ? "Please log in to use the AI Career Coach features. Guest mode has limited AI access."
        : "I'm having trouble connecting to the AI services. Please ensure the backend microservices are running.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please upload a document smaller than 5MB.");
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Convert double-asterisk bold and linebreaks into clean HTML structure
  const renderMessageContent = (text) => {
    return text.split('\n').map((paragraph, index) => {
      // Basic markdown conversion for bold statements (**text**)
      const boldPattern = /\*\*(.*?)\*\*/g;
      const htmlText = paragraph.replace(boldPattern, '<strong>$1</strong>');

      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        return <li key={index} style={{ marginLeft: '12px' }} dangerouslySetInnerHTML={{ __html: htmlText.substring(2) }} />;
      }
      return <p key={index} style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: htmlText }} />;
    });
  };

  const quickActionChips = [
    { label: "💵 Salary Negotiation Script", prompt: "Give me a salary negotiation script for a job offer." },
    { label: "🚀 Google FAANG Prep", prompt: "Explain the FAANG interview loops and prep strategy." },
    { label: "📄 Optimize Resume Formatting", prompt: "How do I format my resume properly for ATS scanners?" },
    { label: "💡 Side Project Portfolio Ideas", prompt: "Give me some portfolio project ideas to showcase my technical skills." }
  ];

  return (
    <div className="career-coach-view animate-fadeIn">
      <div className="glass-card chat-container">

        {/* Chat Feed */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: msg.role === 'assistant' ? 'var(--primary-light)' : 'rgba(255,255,255,0.1)',
                  padding: '6px',
                  borderRadius: '6px',
                  color: msg.role === 'assistant' ? 'var(--primary)' : '#ffffff',
                  marginTop: '2px'
                }}>
                  {msg.role === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Loader className="animate-spin" size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI Coach is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="chat-chips">
          {quickActionChips.map((chip, idx) => (
            <button
              key={idx}
              className="chip-btn"
              onClick={() => handleDirectPrompt(chip.prompt)}
              disabled={loading}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="chat-input-container">
          {attachedFile && (
            <div className="file-attachment-pill animate-slideUp">
              <FileText size={14} />
              <span className="file-name">{attachedFile.name}</span>
              <button className="remove-file" onClick={() => setAttachedFile(null)}>
                <X size={12} />
              </button>
            </div>
          )}

          <div className="chat-input-area">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            <button
              className="btn-icon-secondary"
              title="Attach Document (PDF/Doc)"
              onClick={handleFileClick}
              disabled={loading || analyzingFile}
            >
              <Paperclip size={18} />
            </button>
            <textarea
              className="chat-input"
              placeholder={analyzingFile ? "Analyzing document content..." : "Type your question or attach a doc..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || analyzingFile}
            />
            <button
              className="btn btn-primary"
              style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px' }}
              onClick={handleSend}
              disabled={loading || analyzingFile || (!input.trim() && !attachedFile)}
            >
              {analyzingFile || loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
