import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageSelector from '../LanguageSelector';
import { useTranslation } from 'react-i18next';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str) => str,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en'
    }
  })
}));

describe('LanguageSelector', () => {
  it('renders language options', () => {
    render(<LanguageSelector />);
    expect(screen.getByText('selectLanguage')).toBeDefined();
  });

  it('triggers changeLanguage on selection', () => {
    const { i18n } = useTranslation();
    render(<LanguageSelector />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Click Hindi button
    expect(i18n.changeLanguage).toHaveBeenCalled();
  });
});
