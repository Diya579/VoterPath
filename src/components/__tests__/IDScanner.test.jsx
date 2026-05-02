import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useVisionScanner } from '../../hooks/useVisionScanner';
import IDScanner from '../IDScanner';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en', changeLanguage: vi.fn() } })
}));

vi.mock('../../hooks/useVisionScanner', () => ({
  useVisionScanner: vi.fn(() => ({
    scanImage: vi.fn(),
    loading: false,
    result: null,
    error: null
  }))
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
    vi.mocked(useVisionScanner).mockReturnValue({
      scanImage: vi.fn(),
      loading: false,
      result: null,
      error: 'File size must be under 2MB.'
    });
    
    render(<IDScanner />);
    // The error alert div should exist when error state is present
    expect(screen.getByText(/File size must be under 2MB/i)).toBeDefined();
  });
});
