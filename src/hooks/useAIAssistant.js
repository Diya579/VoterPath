import { useState, useCallback } from 'react';
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

  /**
   * @param {string} prompt
   */
  const sendMessage = useCallback(async (prompt) => {
    setLoading(true);
    /** @type {Message} */
    const newMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMsg]);

    try {
      // STRICT FAIL-CLOSED AUTH: Every request MUST have a valid token.
      let token = null;
      const user = auth.currentUser;
      if (user) {
        token = await user.getIdToken();
      } else {
        // Force anonymous sign-in if not already authenticated
        const { signInAnonymously } = await import('firebase/auth');
        const cred = await signInAnonymously(auth);
        token = await cred.user.getIdToken();
      }

      if (!token) throw new Error('Authentication failed. Please refresh and try again.');

      // Map messages to the format expected by Gemini API (role: user/model, parts: [{ text }])
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Calls our secure Node.js backend
      const fetchOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, history })
      };

      const response = await fetch('/api/chat', fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      /** @type {Message} */
      const assistantMsg = { role: 'assistant', content: data.text };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      /** @type {Message} */
      const errorMsg = {
        role: 'assistant',
        content: err.message || 'Sorry, I am having trouble connecting to my servers right now. Please try again.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  return { messages, sendMessage, loading };
};
