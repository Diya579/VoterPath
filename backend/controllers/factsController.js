/**
 * VoterPath Facts Controller
 * Provides deterministic, rule-based API endpoints for election data.
 */

const eciService = require('../services/eciService');

const getEligibility = async (req, res) => {
  // Eligibility is universal in India (18+), but could be state-specific for local elections.
  return res.json({
    rules: [
      { id: 'age', title: 'Age Requirement', value: '18+ as of qualifying date', status: 'verified' },
      { id: 'citizenship', title: 'Citizenship', value: 'Must be an Indian Citizen', status: 'verified' },
      { id: 'residence', title: 'Ordinary Resident', value: 'Must reside in the constituency', status: 'verified' }
    ],
    provenance: await eciService.getFreshness()
  });
};

const getSchedules = async (req, res) => {
  const { state } = req.query;
  const facts = await eciService.getFacts();
  
  if (state) {
    const schedule = await eciService.getScheduleForState(state);
    return res.json({ 
      data: schedule ? [schedule] : [], 
      query: state,
      meta: await eciService.getFreshness() 
    });
  }

  return res.json({ 
    data: facts.schedules, 
    meta: await eciService.getFreshness() 
  });
};

const getRegistrationSteps = async (req, res) => {
  return res.json({
    steps: [
      { step: 1, title: 'Form 6 Submission', description: 'Apply for fresh registration via voters.eci.gov.in' },
      { step: 2, title: 'Field Verification', description: 'Booth Level Officer (BLO) visits for address verification' },
      { step: 3, title: 'EPIC Generation', description: 'Voter ID card is generated and sent via post' }
    ],
    links: {
      portal: 'https://voters.eci.gov.in',
      track: 'https://voters.eci.gov.in/track-status'
    },
    meta: await eciService.getFreshness()
  });
};

module.exports = { getEligibility, getSchedules, getRegistrationSteps };
