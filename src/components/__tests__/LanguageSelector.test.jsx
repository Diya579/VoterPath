import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageSelector from '../LanguageSelector';
// removed useTranslation import

const mockChangeLanguage = vi.fn();
const mockT = vi.fn(str => str);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: 'en'
    }
  })
}));

describe('LanguageSelector', () => {
  it('renders language options', () => {
    render(<LanguageSelector />);
    expect(screen.getByText(/Select Language \/ भाषा चुनें/i)).toBeDefined();
  });

  it('triggers changeLanguage on selection', async () => {
    const mockOnSelect = vi.fn();
    render(<LanguageSelector onSelect={mockOnSelect} />);
    const hindiButton = screen.getByRole('button', { name: /हिन्दी/i });
    fireEvent.click(hindiButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
  });
});
