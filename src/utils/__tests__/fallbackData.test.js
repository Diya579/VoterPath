import { describe, it, expect } from 'vitest';
import { fallbackBooths } from '../fallbackData';

describe('Fallback Data Utils', () => {
  it('contains booths for multiple states', () => {
    const states = new Set(fallbackBooths.map(b => b.constituency));
    expect(states.size).toBeGreaterThan(5);
  });

  it('each booth has required fields', () => {
    fallbackBooths.forEach(booth => {
      expect(booth).toHaveProperty('id');
      expect(booth).toHaveProperty('name');
      expect(booth).toHaveProperty('address');
    });
  });
});
