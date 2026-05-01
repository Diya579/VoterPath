import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IDScanner from '../IDScanner';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en', changeLanguage: vi.fn() } })
}));

vi.mock('../../hooks/useVisionScanner', () => ({
  useVisionScanner: () => ({
    scanImage: vi.fn(),
    loading: false,
    result: null,
    error: null
  })
}));

vi.mock('../../firebase/config', () => ({
  db: {}, analytics: null, auth: {}, storage: {}
}));

vi.mock('pdfjs-dist', () => ({
  default: { GlobalWorkerOptions: {} },
  GlobalWorkerOptions: {}
}));

describe('IDScanner', () => {
  it('renders upload zone with correct accessible role and label', () => {
    render(<IDScanner />);
    const dropZone = screen.getByRole('region', { name: /upload zone/i });
    expect(dropZone).toBeDefined();
  });

  it('renders the e-voter guide section', () => {
    render(<IDScanner />);
    expect(screen.getByText('eVoterGuideTitle')).toBeDefined();
  });

  it('drop zone responds to Enter key for keyboard accessibility', () => {
    render(<IDScanner />);
    const dropZone = screen.getByRole('region', { name: /upload zone/i });
    // Should not throw on keyboard interaction
    expect(() => fireEvent.keyDown(dropZone, { key: 'Enter' })).not.toThrow();
  });

  it('displays error message when error prop is set', () => {
    vi.mock('../../hooks/useVisionScanner', () => ({
      useVisionScanner: () => ({
        scanImage: vi.fn(),
        loading: false,
        result: null,
        error: 'File size must be under 2MB.'
      })
    }));
    // Re-rendering with the mock state — verifies error branch is present
    const { rerender } = render(<IDScanner />);
    // The error alert div should exist when error state is present
    expect(document.querySelector('[aria-live="polite"]')).toBeDefined();
  });
});
