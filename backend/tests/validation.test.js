const { describe, it, expect } = require('@jest/globals');
const { validateVoterIdFormat } = require('../shared/validation');

describe('Shared Voter ID Validation', () => {
  it('validates standard EPIC format (3 letters + 7 digits)', () => {
    expect(validateVoterIdFormat('ABC1234567')).toBe(true);
    expect(validateVoterIdFormat('XYZ7654321')).toBe(true);
  });

  it('validates extended EPIC format (4 letters + 6-7 digits)', () => {
    expect(validateVoterIdFormat('ABCD123456')).toBe(true);
    expect(validateVoterIdFormat('WXYZ1234567')).toBe(true);
  });

  it('allows hyphens and spaces between letters and digits', () => {
    expect(validateVoterIdFormat('ABC-1234567')).toBe(true);
    expect(validateVoterIdFormat('ABC 1234567')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(validateVoterIdFormat('abc1234567')).toBe(true);
    expect(validateVoterIdFormat('Xyz1234567')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(validateVoterIdFormat('')).toBe(false);
    // @ts-ignore
    expect(validateVoterIdFormat(null)).toBe(false);
    // @ts-ignore
    expect(validateVoterIdFormat(undefined)).toBe(false);
    expect(validateVoterIdFormat('12345')).toBe(false);
    expect(validateVoterIdFormat('AB1234567')).toBe(false);   // only 2 letters
    expect(validateVoterIdFormat('ABCDE1234567')).toBe(false); // 5 letters
    expect(validateVoterIdFormat('ABC12345')).toBe(false);     // only 5 digits
  });
});
