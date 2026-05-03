const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { ECI_PUBLIC_KEY } = require('../config/authoritativeKeys');

/**
 * ECI Authoritative Data Service
 * 
 * Provides a cryptographically verified source of truth for election facts.
 * IMPLEMENTATION: Zero-trust authoritative gateway with RSA-SHA256 verification.
 */
class EciService {
  constructor() {
    this.factsPath = path.join(__dirname, '../data/electionFacts.json');
    this.registryPath = path.join(__dirname, '../config/trusted_registry.json');
    this.cache = null;
    this.lastRefreshed = null;
    this.provenance = null;
  }

  /**
   * Cryptographically verifies the authoritative manifest.
   * Uses RSA-SHA256 signature verification against the ECI public key.
   * @param {string} rawData 
   * @param {string} signature 
   */
  _verifyAuthoritativeSignature(rawData, signature) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(rawData);
      verify.end();
      
      const isValid = verify.verify(ECI_PUBLIC_KEY, signature, 'base64');
      if (!isValid) {
        throw new Error('Cryptographic signature mismatch. The manifest may be tampered with or unauthorized.');
      }
      return true;
    } catch (err) {
      console.error('[ECI Security] Verification Failed:', err.message);
      return false;
    }
  }

  /**
   * Refreshes the local fact cache from the authoritative source.
   * REAL-WORLD: Fetches from a secure ECI API with mutual TLS.
   */
  async refreshFacts() {
    try {
      // 1. Fetch the manifest and the trusted registry (metadata + signature)
      const data = await fs.readFile(this.factsPath, 'utf8');
      const registryRaw = await fs.readFile(this.registryPath, 'utf8');
      const registry = JSON.parse(registryRaw);

      // 2. STRICTURE INTEGRITY CHECK: RSA-SHA256 Signature Verification
      const isVerified = this._verifyAuthoritativeSignature(data, registry.manifest.signature);
      if (!isVerified) {
        throw new Error('Authoritative verification failed. Security policy prevents loading untrusted data.');
      }

      // 3. Verify Hash Integrity (prevent bit-rot)
      const actualHash = crypto.createHash('sha256').update(data).digest('hex');
      if (actualHash !== registry.manifest.hash) {
        throw new Error('Integrity hash mismatch. Manifest content is inconsistent.');
      }

      this.cache = JSON.parse(data);
      this.lastRefreshed = new Date();
      this.provenance = {
        source: registry.manifest.provider,
        verifiedAt: this.lastRefreshed.toISOString(),
        signature: registry.manifest.signature.substring(0, 16) + '...',
        trustLevel: 'CRYPTO_VERIFIED_AUTHORITATIVE'
      };

      console.log(`[ECI Service] Successfully loaded and verified manifest (Hash: ${actualHash.substring(0, 8)})`);
      return this.cache;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[ECI Service] CRITICAL FAILURE:', err.message);
      throw new Error(`Data Integrity Violation: ${err.message}`);
    }
  }

  /**
   * Returns the complete election fact manifest.
   */
  async getFacts() {
    if (!this.cache) await this.refreshFacts();
    return this.cache;
  }

  /**
   * Normalizes strings for deterministic exact matching.
   * Removes extra spaces and handles case-insensitivity.
   * @param {string} input 
   */
  _normalize(input) {
    return input ? input.toLowerCase().trim().replace(/\s+/g, ' ') : '';
  }

  /**
   * Resolves the state for a given region using DETERMINISTIC EXACT mapping.
   * @param {string} region
   */
  async resolveState(region) {
    if (!region) return null;
    const facts = await this.getFacts();
    const normalized = this._normalize(region);
    
    // Exact mapping logic only. No heuristics.
    const regionEntry = Object.entries(facts.regionToState).find(([k]) => this._normalize(k) === normalized);
    return regionEntry ? regionEntry[1] : null;
  }

  /**
   * Returns the election schedule for a specific state.
   * @param {string} state
   */
  async getScheduleForState(state) {
    if (!state) return null;
    const facts = await this.getFacts();
    const normalizedState = this._normalize(state);
    
    return facts.schedules.find(s => this._normalize(s.region) === normalizedState) || null;
  }

  /**
   * Returns a deterministic polling booth for a constituency.
   * @param {string} constituency
   */
  async getBoothForConstituency(constituency) {
    if (!constituency) return null;
    const facts = await this.getFacts();
    const normalized = this._normalize(constituency);

    const boothEntry = Object.entries(facts.constituencyBooths).find(([k]) => this._normalize(k) === normalized);
    return boothEntry ? boothEntry[1] : null;
  }

  /**
   * Returns data freshness and provenance metadata.
   */
  async getFreshness() {
    if (!this.cache) await this.refreshFacts();
    return {
      lastUpdated: this.cache.lastUpdated,
      version: this.cache.version,
      provenance: this.provenance
    };
  }
}

module.exports = new EciService();
