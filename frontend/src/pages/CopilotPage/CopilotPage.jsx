import React, { useState, useEffect } from 'react';
import { Send, Bot, User, History, Sparkles, Trash2, BarChart2 } from 'lucide-react';
import './CopilotPage.css';

export default function CopilotPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello Monish. I'm your Hexaware AI Copilot. You can ask me to analyze macro trends, summarize reports, or find specific data points. What would you like to explore today?" }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('copilot_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    } else {
      const defaultHistory = [
        "How will the ECB rate cut affect EUR/USD?",
        "Summarize the latest US jobs report",
        "What is the outlook for copper prices?"
      ];
      setHistory(defaultHistory);
      localStorage.setItem('copilot_history', JSON.stringify(defaultHistory));
    }
  }, []);

  const saveToHistory = (query) => {
    const newHist = [query, ...history.filter(q => q !== query)].slice(0, 10);
    setHistory(newHist);
    localStorage.setItem('copilot_history', JSON.stringify(newHist));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('copilot_history');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    const query = input;
    setInput('');
    saveToHistory(query);
    
    // Add temporary loading indicator message
    setMessages(prev => [...prev, { role: 'ai', content: "...", isLoading: true }]);
    
    try {
      const { api } = await import('../../services/api');
      const res = await api.askCopilot(query, 'detailed');
      setMessages(prev => {
        const newMsg = [...prev];
        newMsg.pop(); // remove loading message
        newMsg.push({ role: 'ai', content: res.text, sources: res.sources, liveDataUsed: res.liveDataUsed });
        return newMsg;
      });
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const newMsg = [...prev];
        newMsg.pop();
        newMsg.push({ role: 'ai', content: "Sorry, I couldn't reach the data backend. Please ensure the API is running." });
        return newMsg;
      });
    }
  };

  return (
    <div className="copilot-page">
      <div className="copilot-sidebar">
        <div className="copilot-sidebar__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><History size={16} /> Chat History</h3>
          <button className="btn btn--ghost text-danger" style={{ padding: 4 }} onClick={clearHistory} title="Clear History">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="copilot-history">
          {history.length === 0 && <p className="text-muted" style={{ padding: 12, fontSize: 13 }}>No history found.</p>}
          {history.map((item, i) => (
            <button key={i} className="copilot-history-item" onClick={() => setInput(item)}>{item}</button>
          ))}
        </div>
      </div>

      <div className="copilot-main">
        <div className="page-header" style={{ padding: '0 32px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}>
          <div className="flex align-center gap-2">
            <div className="avatar-icon"><Sparkles size={20} className="text-white" /></div>
            <h1 className="page-title" style={{ fontSize: 24, marginBottom: 0 }}>AI Copilot</h1>
          </div>
        </div>

        <div className="copilot-chat-area">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-message--${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="chat-bubble">
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="copilot-widget__sources mt-4">
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>Sources Used:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {msg.sources.map((s, idx) => (
                        <span key={idx} className="badge bg-secondary text-muted" style={{ fontSize: 11 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {msg.liveDataUsed && (
                  <div className="mt-2" style={{ display: 'flex', gap: 8 }}>
                    <span className="badge" style={{ fontSize: 11, backgroundColor: '#12B981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>Live Economic Indicators</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="copilot-input-area">
          <form onSubmit={handleSend} className="copilot-form">
            <input 
              type="text" 
              placeholder="Ask anything about global macroeconomics..." 
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn--primary" disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </form>
          <p className="copilot-disclaimer">AI can make mistakes. Verify critical data against original sources.</p>
        </div>
      </div>
    </div>
  );
}
