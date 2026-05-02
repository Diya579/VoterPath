import { useState } from 'react';

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const sendMessage = async (prompt) => {
    setLoading(true);
    const newMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMsg]);

    try {
      // Calls our secure Node.js backend instead of exposing Gemini key
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      // BUGFIX: use consistent { role, content } shape — previously used { id, sender, text }
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

    } catch (err) {
      // Use consistent message shape so Chatbot.jsx renders msg.content correctly
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting to my servers right now. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
};
