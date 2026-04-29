import { describe, it, expect } from 'vitest';
import i18n from './i18n';

describe('i18next Configuration', () => {
  it('has all 15 languages configured', () => {
    const languages = Object.keys(i18n.options.resources);
    expect(languages).toContain('gu');
    expect(languages).toContain('hi');
    expect(languages).toContain('ta');
    expect(languages).toContain('bn');
    expect(languages.length).toBeGreaterThanOrEqual(15);
  });

  it('defaults to English', () => {
    expect(i18n.language).toBe('en');
  });
});
