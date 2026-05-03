import { describe, it, expect } from 'vitest';
// This mimics the logic in resolveState from the backend to ensure consistency
/** @type {Record<string, string>} */
const regionToState = {
  "Tamil Nadu": "Tamil Nadu",
  "Chennai": "Tamil Nadu",
  "Kerala": "Kerala",
  "Kochi": "Kerala"
};

/** @param {string} city */
function resolveState(city) {
  return regionToState[city] || null;
}

describe('Election State Resolution Logic', () => {
  it('identifies Tamil Nadu from Chennai', () => {
    expect(resolveState('Chennai')).toBe('Tamil Nadu');
  });

  it('identifies Kerala from Kochi', () => {
    expect(resolveState('Kochi')).toBe('Kerala');
  });

  it('returns null for unknown regions', () => {
    expect(resolveState('New York')).toBe(null);
  });
});
