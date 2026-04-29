import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BoothFinder from '../BoothFinder';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en' } })
}));

vi.mock('../../firebase/config', () => ({
  db: {},
  analytics: {},
  auth: { currentUser: { uid: 'test-user' } },
  storage: {}
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  logEvent: vi.fn()
}));

describe('BoothFinder', () => {
  it('renders search select', () => {
    render(<BoothFinder />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
  });
});
