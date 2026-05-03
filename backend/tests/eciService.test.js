/**
 * ECI Service Production Test Suite
 * Verifies the Authority-Grounded Trust Model.
 */

const eciService = require('../services/eciService');

describe('ECI Service (Authority Layer)', () => {
  
  test('should successfully sync with the authoritative manifest', async () => {
    const facts = await eciService.refreshFacts();
    expect(facts).toHaveProperty('version');
    expect(facts).toHaveProperty('provider');
    expect(facts.provider).toContain('Official');
  });

  test('should return rich provenance metadata on freshness check', async () => {
    const freshness = await eciService.getFreshness();
    expect(freshness.provenance).not.toBeNull();
    if (freshness.provenance) {
      expect(freshness.provenance.verificationStatus).toBe('CRYPTO_VERIFIED_AUTHORITATIVE');
      expect(freshness.provenance.fingerprint).toBeDefined();
    }
  });

  test('should resolve state aliases deterministically (TN -> Tamil Nadu)', async () => {
    const result = await eciService.resolveState('TN');
    expect(result.status).toBe('exact');
    expect(result.value).toBe('Tamil Nadu');
    expect(result.provenance).toBe('MANIFEST_ALIAS_MATCH');
  });

  test('should validate semantic consistency (Alandur in Tamil Nadu)', async () => {
    const isValid = await eciService.validateEntityConsistency('Alandur', 'Tamil Nadu');
    expect(isValid).toBe(true);
  });

  test('should reject semantic inconsistency (Alandur in Gujarat)', async () => {
    const isValid = await eciService.validateEntityConsistency('Alandur', 'Gujarat');
    expect(isValid).toBe(false);
  });

  test('should return unverified for unknown regions', async () => {
    const result = await eciService.resolveState('UnknownLand');
    expect(result.status).toBe('unverified');
    expect(result.value).toBe(null);
  });

  test('should retrieve eligibility rules from manifest', async () => {
    const facts = await eciService.getFacts();
    expect(facts.eligibility.ageLimit).toBe(18);
    expect(facts.eligibility.nationality).toBe('Indian');
  });
});
