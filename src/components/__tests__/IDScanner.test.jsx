import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IDScanner from '../IDScanner';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en' } })
}));

vi.mock('../../hooks/useVisionScanner', () => ({
  useVisionScanner: () => ({
    scanImage: vi.fn(),
    loading: false,
    result: null,
    error: null
  })
}));

describe('IDScanner', () => {
  it('renders upload zone', () => {
    render(<IDScanner />);
    expect(screen.getByText('uploadID')).toBeDefined();
  });

  it('shows guide steps', () => {
    render(<IDScanner />);
    expect(screen.getByText('eVoterGuideTitle')).toBeDefined();
  });
});
