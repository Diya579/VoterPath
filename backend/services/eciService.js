/**
 * VoterPath ECI Authoritative Data Service
 * (c) 2024 VoterPath Contributors
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { z } = require('zod');
const { ECI_PUBLIC_KEY } = require('../config/authoritativeKeys');

/**
 * ECI DATA AUTHORITY SERVICE
 */
class EciService {
  constructor() {
    this.factsPath = path.join(__dirname, '../data/electionFacts.json');
    this.registryPath = path.join(__dirname, '../config/trusted_registry.json');
    
    this.EXPECTED_KEY_FINGERPRINT = 'dcec81c53917b0bc98aac0600e658bf32740406bb601ab84c6717ccf169553d5';
    this.EXPECTED_ISSUER = 'ECI-REGISTRY-V1';
    
    this.keyRegistry = {
      'ECI-REGISTRY-V1': {
        fingerprint: this.EXPECTED_KEY_FINGERPRINT,
        expiresAt: '2027-05-01T00:00:00Z'
      }
    };
    
    this.cache = null;
    this.provenance = null;

    this.stateMap = new Map();
    this.aliasMap = new Map();
    this.boothMap = new Map();
    this.consistencyMap = new Map();
  }

  _getSchema() {
    return z.object({
      version: z.string(),
      lastUpdated: z.string(),
      provider: z.string(),
      eligibility: z.object({
        ageLimit: z.number(),
        nationality: z.string(),
        residenceRequirement: z.string(),
        qualifyingDate: z.string()
      }),
      entityAliases: z.record(z.string()),
      regionToState: z.record(z.string()),
      schedules: z.array(z.object({
        region: z.string(),
        phase: z.string(),
        date: z.string(),
        seats: z.number(),
        countingDate: z.string(),
        notes: z.string()
      })),
      constituencyBooths: z.record(z.string()),
      constituencyStateMap: z.record(z.string())
    });
  }

  _normalize(input) {
    if (!input) return '';
    return input
      .normalize('NFKC')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  _initializeMaps(facts) {
    this.stateMap.clear();
    this.aliasMap.clear();
    this.boothMap.clear();
    this.consistencyMap.clear();

    for (const [region, state] of Object.entries(facts.regionToState)) {
      this.stateMap.set(this._normalize(region), state);
    }
    for (const [alias, full] of Object.entries(facts.entityAliases)) {
      this.aliasMap.set(this._normalize(alias), full);
    }
    for (const [constituency, booth] of Object.entries(facts.constituencyBooths)) {
      this.boothMap.set(this._normalize(constituency), booth);
    }
    for (const [constituency, state] of Object.entries(facts.constituencyStateMap)) {
      this.consistencyMap.set(this._normalize(constituency), state);
    }
    for (const s of facts.schedules) {
      this.stateMap.set(this._normalize(s.region), s.region);
    }
  }

  _verifyManifestTrust(rawData, signature) {
    try {
      const keyMetadata = this.keyRegistry[this.EXPECTED_ISSUER];
      if (!keyMetadata) throw new Error('Untrusted Key Issuer.');

      const actualFingerprint = crypto.createHash('sha256').update(ECI_PUBLIC_KEY).digest('hex');
      if (actualFingerprint !== keyMetadata.fingerprint) throw new Error('Key Fingerprint Mismatch.');

      if (new Date() > new Date(keyMetadata.expiresAt)) throw new Error('Trusted Key Expired.');

      const verify = crypto.createVerify('SHA256');
      verify.update(rawData);
      verify.end();
      
      return verify.verify(ECI_PUBLIC_KEY, signature, 'base64');
    } catch (error) {
      console.error('[Security] Manifest Verification Failed:', error.message);
      return false;
    }
  }

  async refreshFacts() {
    try {
      const data = await fs.readFile(this.factsPath, 'utf8');
      const registryData = await fs.readFile(this.registryPath, 'utf8');
      const registry = JSON.parse(registryData).manifest;

      if (new Date() > new Date(registry.expiresAt)) throw new Error('Manifest Expired.');
      if (!this._verifyManifestTrust(data, registry.signature)) throw new Error('Signature Verification Failed.');

      const parsed = JSON.parse(data);
      const validated = this._getSchema().parse(parsed);

      this.cache = validated;
      this.provenance = {
        issuer: registry.provider,
        verifiedAt: new Date().toISOString(),
        fingerprint: this.EXPECTED_KEY_FINGERPRINT
      };

      this._initializeMaps(validated);
      return validated;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`ECI Service Integrity Failure: ${msg}`);
    }
  }

  async getFacts() {
    if (!this.cache) await this.refreshFacts();
    return this.cache;
  }

  async resolveState(input) {
    if (!this.cache) await this.refreshFacts();
    const normalized = this._normalize(input);
    const value = this.stateMap.get(normalized) || this.aliasMap.get(normalized);
    return value ? { status: 'exact', value } : { status: 'unverified', value: null };
  }

  async getScheduleForState(state) {
    if (!this.cache) await this.refreshFacts();
    const normalized = this._normalize(state);
    return this.cache.schedules.find(s => this._normalize(s.region) === normalized) || null;
  }

  async getBoothForConstituency(constituency) {
    if (!this.cache) await this.refreshFacts();
    const normalized = this._normalize(constituency);
    const value = this.boothMap.get(normalized);
    return value ? { status: 'exact', value } : { status: 'unverified', value: null };
  }

  async validateEntityConsistency(constituency, state) {
    if (!this.cache) await this.refreshFacts();
    const mappedState = this.consistencyMap.get(this._normalize(constituency));
    return mappedState ? this._normalize(mappedState) === this._normalize(state) : null;
  }

  async getFreshness() {
    if (!this.cache) await this.refreshFacts();
    return {
      version: this.cache.version,
      lastUpdated: this.cache.lastUpdated,
      provenance: this.provenance
    };
  }
}

module.exports = new EciService();
