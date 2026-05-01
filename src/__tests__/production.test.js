import { describe, it, expect, vi } from 'vitest';
import { langNames } from '../utils/constants';

describe('Production Readiness Audit', () => {
  it('langNames contains all 15 supported locales', () => {
    const expectedLocales = ['en', 'hi', 'ta', 'bn', 'gu', 'te', 'mr', 'ur', 'kn', 'or', 'ml', 'pa', 'as', 'ne', 'ks'];
    expectedLocales.forEach(code => {
      expect(langNames[code]).toBeDefined();
      expect(typeof langNames[code]).toBe('string');
    });
    expect(Object.keys(langNames)).toHaveLength(15);
  });

  it('langNames returns English for "en" locale', () => {
    expect(langNames['en']).toBe('English');
  });

  it('langNames is importable as a shared constant (DRY check)', () => {
    // Verifies the shared constant exists and is properly exported
    expect(langNames).toBeDefined();
    expect(typeof langNames).toBe('object');
  });
});
