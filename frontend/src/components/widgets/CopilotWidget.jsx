import React, { useState } from 'react';
import { Sparkles, Send, ArrowRight } from 'lucide-react';
import './CopilotWidget.css';

export default function CopilotWidget({ onAsk, className = '' }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleQuestion = "Why is US CPI coming down faster than expected?";

  const handleAsk = async (q) => {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      if (onAsk) {
        const res = await onAsk(query);
        setResponse(res);
      } else {
        const { api } = await import('../../services/api');
        const res = await api.askCopilot(query, 'summary');
        setResponse(res);
      }
    } catch (e) {
      console.error(e);
      setResponse({
        text: "Sorry, I'm currently unable to fetch insights. Please check if the backend is running.",
        sources: [],
      });
    }
    setLoading(false);
  };

  return (
    <div className={`copilot-widget ${className}`}>
      <div className="copilot-widget__header">
        <Sparkles size={16} className="copilot-widget__icon" />
        <span>AI Copilot</span>
      </div>

      <div className="copilot-widget__body">
        {!response && !loading && (
          <div
            className="copilot-widget__sample"
            onClick={() => { setQuestion(sampleQuestion); handleAsk(sampleQuestion); }}
          >
            {sampleQuestion}
          </div>
        )}

        {loading && (
          <div className="copilot-widget__loading">
            <div className="copilot-loading-dots">
              <span></span><span></span><span></span>
            </div>
            <p>Analyzing macro data...</p>
          </div>
        )}

        {response && (
          <div className="copilot-widget__response animate-fade-in-up">
            <div className="copilot-widget__ai-badge">
              <Sparkles size={14} />
              <span>Cinsight AI</span>
            </div>
            <p className="copilot-widget__text">{response.text}</p>
            {response.sources && (
              <div className="copilot-widget__sources">
                {response.sources.map((s, i) => (
                  <span key={i} className="copilot-widget__source-tag">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="copilot-widget__input-area">
        <input
          type="text"
          placeholder="Ask about any macro trend..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button onClick={() => handleAsk()} disabled={loading}>
          <Send size={16} />
        </button>
      </div>

      <button className="copilot-widget__full-btn">
        Explore Full Analysis <ArrowRight size={14} />
      </button>
    </div>
  );
}
