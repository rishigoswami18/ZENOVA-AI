import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader, Sparkles, User, HelpCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function CareerCoach({ coachContext, clearCoachContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Career Coach. I can help you negotiate salary, prepare for technical rounds at FAANG, review your resume structure, or suggest high-value projects for your portfolio.\n\nWhat are you focused on today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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

  const handleDirectPrompt = async (text, topic = null) => {
    const userBubble = { role: 'user', content: text };
    setMessages(prev => [...prev, userBubble]);
    setLoading(true);
    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      historyPayload.push(userBubble);
      
      const response = await api.sendMessageToCoach(text, historyPayload, topic);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting to the career advisory service. Please check if the FastAPI microservice is online." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    handleDirectPrompt(text);
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
        <div className="chat-input-area">
          <textarea
            className="chat-input"
            placeholder="Type your question here (e.g., 'How should I explain a gap on my resume?' or 'Draft an email script...')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button 
            className="btn btn-primary"
            style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px' }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
