const fs = require('fs').promises;
const path = require('path');

/**
 * ECI Authoritative Data Service
 * 
 * Provides a single source of truth for election facts, schedules, and rules.
 * Data is sourced from an authoritative manifest and refreshed periodically.
 */
class EciService {
  constructor() {
    this.factsPath = path.join(__dirname, '../data/electionFacts.json');
    this.cache = null;
    this.lastRefreshed = null;
  }

  /**
   * Refreshes the local fact cache from the authoritative source.
   * In production, this would fetch from a remote ECI-linked endpoint.
   */
  async refreshFacts() {
    try {
      const data = await fs.readFile(this.factsPath, 'utf8');
      this.cache = JSON.parse(data);
      this.lastRefreshed = new Date();
      return this.cache;
    } catch (error) {
      console.error('[ECI Service] Failed to refresh facts:', error.message);
      throw new Error('Authoritative fact source unavailable.');
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
   * Resolves the state for a given city/region using the authoritative mapping.
   */
  async resolveState(region) {
    if (!region) return null;
    const facts = await this.getFacts();
    for (const [key, value] of Object.entries(facts.regionToState)) {
      if (region.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return null;
  }

  /**
   * Returns the election schedule for a specific state.
   */
  async getScheduleForState(state) {
    if (!state) return null;
    const facts = await this.getFacts();
    return facts.schedules.find(s => s.region === state) || null;
  }

  /**
   * Returns a deterministic polling booth for a constituency.
   */
  async getBoothForConstituency(constituency) {
    if (!constituency) return null;
    const facts = await this.getFacts();
    for (const [key, value] of Object.entries(facts.constituencyBooths)) {
      if (constituency.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return null;
  }

  /**
   * Returns the data freshness metadata.
   */
  async getFreshness() {
    const facts = await this.getFacts();
    return {
      lastUpdated: facts.lastUpdated,
      version: facts.version,
      lastRefreshed: this.lastRefreshed ? this.lastRefreshed.toISOString() : new Date().toISOString()
    };
  }
}

module.exports = new EciService();
