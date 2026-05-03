import { useState } from 'react';
import { auth } from '../firebase/config';

/**
 * @typedef {Object} Message
 * @property {'user' | 'assistant'} role
 * @property {string} content
 */

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  /** @type {[Message[], import('react').Dispatch<import('react').SetStateAction<Message[]>>]} */
  // @ts-ignore
  const [messages, setMessages] = useState([]);

  const sendMessage = async (prompt) => {
    setLoading(true);
    const newMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMsg]);

    try {
      // Best-effort token retrieval (fails gracefully if anonymous auth is restricted)
      let token = null;
      try {
        const user = auth.currentUser;
        if (user) {
          token = await user.getIdToken();
        }
      } catch (authErr) {
        console.warn('[Auth] Token retrieval failed, falling back to Origin-based security.');
      }

      // Map messages to the format expected by Gemini API (role: user/model, parts: [{ text }])
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Calls our secure Node.js backend
      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      };

      if (token) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', fetchOptions);

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
