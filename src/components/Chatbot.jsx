import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { langNames } from '../utils/constants';

/**
 * Chatbot Component: A domain-locked AI assistant for election queries.
 * Enforces native script responses and strictly adheres to the election context.
 */
export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const { messages, sendMessage, loading } = useAIAssistant();
  const [input, setInput] = useState('');
  const currentLang = i18n.language || 'en';
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const langInstruction = currentLang !== 'en' ? ` [Please strictly answer in ${langNames[currentLang] || 'Hindi'}]` : ' [Please strictly answer in English]';
    
    sendMessage(input + langInstruction);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-black uppercase inline-block bg-accent text-white p-3 brutal-border shadow-brutal-sm">{t('chat')}</h2>
      </div>

      <div 
        className="flex-1 overflow-y-auto bg-white p-8 brutal-card mb-6 space-y-8"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="text-center mt-20">
            <div className="bg-primary inline-block p-6 rounded-full brutal-border shadow-brutal-sm mb-6">
              <Bot className="w-16 h-16 stroke-[3]" />
            </div>
            <p className="text-2xl font-bold uppercase bg-gray-100 inline-block p-4 brutal-border">Start a conversation. Try asking: "I am 17, can I vote?"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-14 h-14 brutal-border flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-tertiary ml-4 shadow-brutal-sm' : 'bg-primary mr-4 shadow-brutal-sm'}`}>
                {msg.role === 'user' ? <User className="w-8 h-8 stroke-[3]" /> : <Bot className="w-8 h-8 stroke-[3]" />}
              </div>
              <div className={`p-5 brutal-border shadow-brutal-sm ${msg.role === 'user' ? 'bg-gray-100' : 'bg-white'}`}>
                <p className="text-xl font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="w-14 h-14 brutal-border bg-primary mr-4 shadow-brutal-sm flex items-center justify-center shrink-0">
                <Bot className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="p-5 brutal-border shadow-brutal-sm bg-white flex items-center">
                <Loader2 className="w-6 h-6 animate-spin mr-3 stroke-[3]" />
                <span className="text-xl font-bold uppercase">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('askAI')}
          className="brutal-input flex-1"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="brutal-btn bg-primary disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          <Send className="w-8 h-8 stroke-[3]" />
        </button>
      </form>
    </div>
  );
}
