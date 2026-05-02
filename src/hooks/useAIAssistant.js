import { useState } from 'react';

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const sendMessage = async (prompt) => {
    setLoading(true);
    const newMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMsg]);

    try {
      // Map messages to the format expected by Gemini API (role: user/model, parts: [{ text }])
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Calls our secure Node.js backend instead of exposing Gemini key
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.message || 'Sorry, I am having trouble connecting to my servers right now. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
};
