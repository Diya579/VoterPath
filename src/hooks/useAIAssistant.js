import { useState } from 'react';
import { auth } from '../firebase/config';

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const sendMessage = async (prompt) => {
    setLoading(true);
    const newMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMsg]);

    try {
      // Get Firebase ID Token for backend verification
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to use the AI assistant.');
      }
      const token = await user.getIdToken();

      // Map messages to the format expected by Gemini API (role: user/model, parts: [{ text }])
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Calls our secure Node.js backend with Authorization header
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
