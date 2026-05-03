/**
 * VoterPath ECI Data Service
 * (c) 2024 VoterPath Contributors
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { ECI_PUBLIC_KEY } = require('../config/authoritativeKeys');

/**
 * ECI MANIFEST-GROUNDED DATA SERVICE
 * 
 * Provides a cryptographically checked, curated local cache of election facts.
 * 
 * TRUST MODEL:
 * 1. INTEGRITY: RSA-SHA256 signature verification against an environment-pinned public key.
 * 2. PROVENANCE: Manifest metadata (issuer, timestamps) validated on each refresh.
 * 3. BOUNDARY: This service provides 'Manifest-Grounded' truth, which is a local 
 *    signed cache, not a live authoritative ECI endpoint.
 */
class EciService {
  constructor() {
    this.factsPath = path.join(__dirname, '../data/electionFacts.json');
    this.registryPath = path.join(__dirname, '../config/trusted_registry.json');
    
    // Security Pins
    this.EXPECTED_KEY_FINGERPRINT = 'b1a9678a1219d39c223d5c4340a12b4d893577ce2d00ccc4387cf0a3e365b4ff';
    this.EXPECTED_ISSUER = 'ECI-REGISTRY-V1';
    
    this.cache = null;
    this.lastRefreshed = null;
    this.provenance = null;
  }

  /**
   * Validates the Public Key Fingerprint and performs RSA-SHA256 verification.
   * @param {string} rawData - The raw manifest string
   * @param {string} signature - The base64 signature
   */
  _verifyManifestTrust(rawData, signature) {
    try {
      // 1. Key Fingerprint Validation (Anti-Shadow Key Protection)
      const actualFingerprint = crypto.createHash('sha256').update(ECI_PUBLIC_KEY).digest('hex');
      if (actualFingerprint !== this.EXPECTED_KEY_FINGERPRINT) {
        throw new Error('Public Key Fingerprint Mismatch. Security chain compromised.');
      }

      // 2. Cryptographic Verification
      const verify = crypto.createVerify('SHA256');
      verify.update(rawData);
      verify.end();
      
      const isValid = verify.verify(ECI_PUBLIC_KEY, signature, 'base64');
      if (!isValid) {
        throw new Error('RSA-SHA256 Signature Mismatch. Manifest is tampered or unauthorized.');
      }

      return true;
    } catch (err) {
      console.error('[ECI Security] Trust Verification Failed:', err.message);
      return false;
    }
  }

  /**
   * Refreshes the local fact cache and validates metadata boundaries.
   */
  async refreshFacts() {
    try {
      const data = await fs.readFile(this.factsPath, 'utf8');
      const registryRaw = await fs.readFile(this.registryPath, 'utf8');
      const registry = JSON.parse(registryRaw).manifest;

      // 1. Metadata Boundary Validation
      if (registry.issuerId !== this.EXPECTED_ISSUER) {
        throw new Error(`Untrusted Issuer: ${registry.issuerId}`);
      }

      const now = new Date();
      const expiresAt = new Date(registry.expiresAt);
      if (now > expiresAt) {
        throw new Error(`Manifest Expired: Valid until ${registry.expiresAt}`);
      }

      // 2. Cryptographic Trust Verification
      const isVerified = this._verifyManifestTrust(data, registry.signature);
      if (!isVerified) {
        throw new Error('Cryptographic trust verification failed.');
      }

      // 3. Bit-rot Integrity Check
      const actualHash = crypto.createHash('sha256').update(data).digest('hex');
      if (actualHash !== registry.hash) {
        throw new Error('Integrity hash mismatch. Cache may be corrupted.');
      }

      this.cache = JSON.parse(data);
      this.lastRefreshed = now;
      this.provenance = {
        dataMode: 'SIGNED_LOCAL_CACHE',
        issuer: registry.provider,
        issuerId: registry.issuerId,
        signedAt: registry.signedAt,
        expiresAt: registry.expiresAt,
        fingerprint: this.EXPECTED_KEY_FINGERPRINT.substring(0, 12) + '...',
        verificationStatus: 'CRYPTO_VERIFIED_GROUNDED'
      };

      console.log(`[ECI Service] Manifest Grounded: ${actualHash.substring(0, 8)} | Verified: ${this.provenance.verificationStatus}`);
      return this.cache;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[ECI Service] CRITICAL INTEGRITY FAILURE:', err.message);
      throw new Error(`Integrity Violation: ${err.message}`);
    }
  }

  /**
   * Returns the complete grounded fact manifest.
   */
  async getFacts() {
    if (!this.cache) await this.refreshFacts();
    return this.cache;
  }

  _normalize(input) {
    return input ? input.toLowerCase().trim().replace(/\s+/g, ' ') : '';
  }

  /**
   * Resolves the state with a two-tier result (Exact vs Suggestions).
   * @param {string} region
   */
  async resolveState(region) {
    if (!region) return { status: 'unverified', value: null };
    const facts = await this.getFacts();
    const normalized = this._normalize(region);
    
    // Tier 1: Exact Match
    const regionEntry = Object.entries(facts.regionToState).find(([k]) => this._normalize(k) === normalized);
    if (regionEntry) {
      return { status: 'exact', value: regionEntry[1], provenance: 'MANIFEST_MATCH' };
    }

    // Tier 2: Suggestion Path (Deterministic Aliases could go here)
    return { status: 'unverified', value: null, suggestions: [] };
  }

  /**
   * Returns a deterministic polling booth for a constituency.
   * @param {string} constituency
   */
  async getBoothForConstituency(constituency) {
    if (!constituency) return { status: 'unverified', value: null };
    const facts = await this.getFacts();
    const normalized = this._normalize(constituency);

    const boothEntry = Object.entries(facts.constituencyBooths).find(([k]) => this._normalize(k) === normalized);
    if (boothEntry) {
      return { status: 'exact', value: boothEntry[1], provenance: 'MANIFEST_MATCH' };
    }

    return { status: 'unverified', value: null };
  }

  /**
   * Returns data freshness and rich provenance metadata.
   */
  async getFreshness() {
    if (!this.cache) await this.refreshFacts();
    return {
      lastUpdated: this.cache.lastUpdated,
      version: this.cache.version,
      cacheRefreshedAt: this.lastRefreshed.toISOString(),
      provenance: this.provenance
    };
  }
}

module.exports = new EciService();
