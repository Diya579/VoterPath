/**
 * VoterPath Deterministic Facts Controller
 * (c) 2024 VoterPath Contributors
 */

const eciService = require('../services/eciService');

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

/**
 * Returns deterministic voter eligibility rules from the authoritative manifest.
 * @param {Request} req
 * @param {Response} res
 */
const getEligibility = async (req, res) => {
  try {
    const facts = await eciService.getFacts();
    const freshness = await eciService.getFreshness();

    return res.json({
      eligibility: facts.eligibility,
      provenance: freshness.provenance,
      meta: {
        version: freshness.version,
        lastUpdated: freshness.lastUpdated
      }
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return res.status(500).json({ error: err.message, code: 'facts/eligibility-failed' });
  }
};

/**
 * Returns election schedules filtered by state from the authoritative manifest.
 * @param {Request} req
 * @param {Response} res
 */
const getSchedules = async (req, res) => {
  try {
    const { state } = req.query;
    const facts = await eciService.getFacts();
    const freshness = await eciService.getFreshness();
    
    // Multi-stage Entity Resolution for State
    if (state && typeof state === 'string') {
      const resolution = await eciService.resolveState(state);
      if (resolution.status === 'exact') {
        const schedule = await eciService.getScheduleForState(resolution.value);
        return res.json({ 
          data: schedule ? [schedule] : [], 
          query: state,
          resolution: resolution,
          provenance: freshness.provenance
        });
      }
    }

    // Default: Return all verified schedules
    return res.json({ 
      data: facts.schedules, 
      provenance: freshness.provenance,
      meta: {
        totalRecords: facts.schedules.length,
        version: freshness.version
      }
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return res.status(500).json({ error: err.message, code: 'facts/schedules-failed' });
  }
};

/**
 * Returns verified registration and correction steps.
 * @param {Request} req
 * @param {Response} res
 */
const getRegistrationSteps = async (req, res) => {
  try {
    const freshness = await eciService.getFreshness();
    
    // In production, these steps are typically pulled from the manifest.
    // Here we provide a verified, auditable JSON response.
    return res.json({
      steps: [
        { 
          id: 1, 
          title: 'Fresh Registration (Form 6)', 
          description: 'Submit Form 6 on the official ECI portal for new voter registration.' 
        },
        { 
          id: 2, 
          title: 'BLO Field Verification', 
          description: 'The Booth Level Officer will visit your residence for document verification.' 
        },
        { 
          id: 3, 
          title: 'EPIC Card Dispatch', 
          description: 'Once approved, your Voter ID (EPIC) will be sent via Speed Post.' 
        }
      ],
      officialLinks: {
        votersPortal: 'https://voters.eci.gov.in',
        trackStatus: 'https://voters.eci.gov.in/track-status'
      },
      provenance: freshness.provenance
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return res.status(500).json({ error: err.message, code: 'facts/steps-failed' });
  }
};

module.exports = { getEligibility, getSchedules, getRegistrationSteps };
