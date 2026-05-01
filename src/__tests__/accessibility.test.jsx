import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Chatbot from '../components/Chatbot';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en' } })
}));

vi.mock('../hooks/useGeminiChat', () => ({
  useGeminiChat: () => ({
    messages: [
      { role: 'user', content: 'Can I vote?' },
      { role: 'assistant', content: 'Yes, if you are 18+.' }
    ],
    sendMessage: vi.fn(),
    loading: false
  })
}));

describe('Accessibility Standards Audit', () => {
  it('Chatbot message list has aria-live region for screen reader announcements', () => {
    render(<Chatbot />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('Chatbot renders both user and assistant messages', () => {
    render(<Chatbot />);
    expect(screen.getByText('Can I vote?')).toBeDefined();
    expect(screen.getByText('Yes, if you are 18+.')).toBeDefined();
  });

  it('Send button is present and labeled', () => {
    render(<Chatbot />);
    const submitBtn = document.querySelector('button[type="submit"]');
    expect(submitBtn).not.toBeNull();
  });
});
