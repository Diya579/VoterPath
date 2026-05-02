import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIAssistant } from '../useAIAssistant';

describe('useAIAssistant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty messages and not loading', () => {
    const { result } = renderHook(() => useAIAssistant());
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('sends a message and receives a response with correct shape', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'You must be 18 to vote.' })
    });

    const { result } = renderHook(() => useAIAssistant());
    await act(async () => {
      await result.current.sendMessage('Can I vote at 17?');
    });

    const messages = result.current.messages;
    expect(messages).toHaveLength(2);
    // User message
    expect(messages[0]).toEqual({ role: 'user', content: 'Can I vote at 17?' });
    // Bot response — must use { role, content } shape, NOT { id, sender, text }
    expect(messages[1]).toMatchObject({ role: 'assistant', content: 'You must be 18 to vote.' });
    expect(result.current.loading).toBe(false);
  });

  it('handles network failure with correct error message shape', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useAIAssistant());
    await act(async () => {
      await result.current.sendMessage('Will I be able to vote?');
    });

    const messages = result.current.messages;
    expect(messages).toHaveLength(2);
    // Error response MUST use { role: 'assistant', content } to render correctly
    expect(messages[1].role).toBe('assistant');
    expect(typeof messages[1].content).toBe('string');
    expect(messages[1].content.length).toBeGreaterThan(0);
    expect(result.current.loading).toBe(false);
  });

  it('handles non-OK HTTP response as an error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useAIAssistant());
    await act(async () => {
      await result.current.sendMessage('test prompt');
    });

    const messages = result.current.messages;
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].content).toContain('trouble connecting');
  });
});
