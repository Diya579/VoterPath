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
  /** @type {import('react').MutableRefObject<HTMLDivElement | null>} */
  // @ts-ignore
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /** @param {React.FormEvent} e */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const langInstruction = currentLang !== 'en' ? ` [Please strictly answer in ${langNames[currentLang] || 'Hindi'}]` : ' [Please strictly answer in English]';
    
    sendMessage(input + langInstruction);
    setInput('');
  };

  return (
    <main className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto" role="main" aria-label="Election Assistant Chat">
      <header className="mb-8">
        <h2 className="text-4xl font-black uppercase inline-block bg-accent text-white p-3 brutal-border shadow-brutal-sm">{t('chat')}</h2>
      </header>

      <section 
        className="flex-1 overflow-y-auto bg-white p-8 brutal-card mb-6 space-y-8"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        role="log"
      >
        {messages.length === 0 && (
          <div className="text-center mt-20">
            <div className="bg-primary inline-block p-6 rounded-full brutal-border shadow-brutal-sm mb-6">
              <Bot className="w-16 h-16 stroke-[3]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold uppercase bg-gray-100 inline-block p-4 brutal-border">
              {t('chatStartPrompt', 'Start a conversation. Try asking: "I am 17, can I vote?"')}
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <article key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} aria-label={`${msg.role} message`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-14 h-14 brutal-border flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-tertiary ml-4 shadow-brutal-sm' : 'bg-primary mr-4 shadow-brutal-sm'}`}>
                {msg.role === 'user' ? <User className="w-8 h-8 stroke-[3]" aria-hidden="true" /> : <Bot className="w-8 h-8 stroke-[3]" aria-hidden="true" />}
              </div>
              <div className={`p-5 brutal-border shadow-brutal-sm ${msg.role === 'user' ? 'bg-gray-100' : 'bg-white'}`}>
                <p className="text-xl font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </article>
        ))}
        {loading && (
          <div className="flex justify-start" aria-live="assertive" role="status">
            <div className="flex max-w-[80%] flex-row">
              <div className="w-14 h-14 brutal-border bg-primary mr-4 shadow-brutal-sm flex items-center justify-center shrink-0">
                <Bot className="w-8 h-8 stroke-[3]" aria-hidden="true" />
              </div>
              <div className="p-5 brutal-border shadow-brutal-sm bg-white flex items-center">
                <Loader2 className="w-6 h-6 animate-spin mr-3 stroke-[3]" aria-hidden="true" />
                <span className="text-xl font-bold uppercase">{t('aiThinking', 'Thinking...')}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      <form onSubmit={handleSubmit} className="flex gap-6" aria-label="Send a message to the assistant">
        <label htmlFor="chat-input" className="sr-only">{t('askAI')}</label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('askAI')}
          className="brutal-input flex-1 focus:ring-4 focus:ring-accent"
          disabled={loading}
          aria-required="true"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="brutal-btn bg-primary disabled:opacity-50 flex items-center justify-center min-w-[100px] hover:bg-tertiary focus:ring-4 focus:ring-accent"
          aria-label={t('send', 'Send')}
        >
          <Send className="w-8 h-8 stroke-[3]" aria-hidden="true" />
        </button>
      </form>
    </main>
  );
}
