/**
 * ECI (Election Commission of India) Authoritative Data Service.
 * This service simulates a dynamic fetch from the official ECI API.
 * It serves as the single source of truth for election dates, qualifying rules, 
 * and procedural guidelines.
 */

const eciData = {
  electionCycle: '2026 Assembly Elections',
  qualifyingDate: 'January 1, 2026',
  minAge: 18,
  lastUpdated: '2026-05-02T15:30:00Z',
  officialSource: 'https://eci.gov.in',
  
  states: {
    'Tamil Nadu': {
      electionDate: 'April 6, 2026',
      countingDate: 'May 10, 2026',
      totalSeats: 234,
      phases: 1,
      procedures: [
        'Form 6 submission deadline: Feb 15, 2026',
        'Model Code of Conduct starts: March 1, 2026',
        'Voter Information Slips distribution: March 25 - April 1, 2026'
      ]
    },
    'Kerala': {
      electionDate: 'April 6, 2026',
      countingDate: 'May 10, 2026',
      totalSeats: 140,
      phases: 1,
      procedures: [
        'Form 6 submission deadline: Feb 15, 2026',
        'Polling hours: 7 AM to 6 PM'
      ]
    },
    'West Bengal': {
      electionDate: 'April 17 & April 22, 2026',
      countingDate: 'May 10, 2026',
      totalSeats: 294,
      phases: 2,
      procedures: [
        'Phase 1: 147 constituencies',
        'Phase 2: 147 constituencies'
      ]
    },
    'Assam': {
      electionDate: 'April 22, 2026',
      countingDate: 'May 10, 2026',
      totalSeats: 126,
      phases: 1
    },
    'Puducherry': {
      electionDate: 'May 2, 2026',
      countingDate: 'May 10, 2026',
      totalSeats: 30,
      phases: 1
    }
  }
};

/**
 * Fetches the most recent election data.
 * In a real production environment, this would call the ECI API with a cache layer.
 */
const getEciData = async () => {
  // Simulate network latency
  return eciData;
};

/**
 * Validates if a voter is eligible based on ECI qualifying date.
 * @param {string} dob - Date of birth in YYYY-MM-DD
 */
const checkEligibility = (dob) => {
  const qDate = new Date('2026-01-01');
  const birthDate = new Date(dob);
  let age = qDate.getFullYear() - birthDate.getFullYear();
  const m = qDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && qDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= eciData.minAge;
};

module.exports = {
  getEciData,
  checkEligibility
};
