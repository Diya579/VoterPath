import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Chatbot from '../Chatbot';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en' } })
}));

vi.mock('../../hooks/useGeminiChat', () => ({
  useGeminiChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    loading: false
  })
}));

describe('Chatbot', () => {
  it('renders input area', () => {
    render(<Chatbot />);
    const input = screen.getByPlaceholderText('askAI');
    expect(input).toBeDefined();
  });
});
