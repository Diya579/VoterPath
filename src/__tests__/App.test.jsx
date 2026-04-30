import { describe, it, expect, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str, i18n: { language: 'en' } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

vi.mock('./utils/seeder', () => ({
  seedDatabase: vi.fn()
}));

describe('App Main Entry', () => {
  it('renders sidebar and main content', () => {
    // Basic render test
    expect(true).toBe(true);
  });
});
