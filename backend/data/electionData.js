/**
 * Production Election Data for 2026 Assembly Elections.
 * Centralized data source to prevent controller bloat and ensure scalability.
 */
const electionData = {
  'Tamil Nadu': { 
    phase: 'Phase 1', 
    date: 'April 6, 2026', 
    seats: 234, 
    countingDate: 'May 10, 2026', 
    notes: 'Single phase election. Ensure you have your EPIC card ready.' 
  },
  'West Bengal': { 
    phase: 'Phase 2', 
    date: 'April 17, 2026', 
    seats: 294, 
    countingDate: 'May 10, 2026', 
    notes: 'Multi-phase election. Check your specific constituency schedule.' 
  },
  'Kerala': { 
    phase: 'Phase 1', 
    date: 'April 6, 2026', 
    seats: 140, 
    countingDate: 'May 10, 2026', 
    notes: 'Single phase election. Special provisions for elderly voters.' 
  },
  'Assam': { 
    phase: 'Phase 2', 
    date: 'April 22, 2026', 
    seats: 126, 
    countingDate: 'May 10, 2026', 
    notes: 'Check for updated polling booth lists in riverine areas.' 
  },
  'Puducherry': { 
    phase: 'Phase 3', 
    date: 'May 2, 2026', 
    seats: 30, 
    countingDate: 'May 10, 2026', 
    notes: 'Union Territory election. All booths are within 2 km of residential areas.' 
  },
  'Gujarat': { 
    phase: 'By-Poll', 
    date: 'May 7, 2026', 
    seats: 3, 
    countingDate: 'May 10, 2026', 
    notes: 'By-elections for 3 vacant assembly seats.' 
  },
  'Uttar Pradesh': { 
    phase: 'By-Poll', 
    date: 'May 7, 2026', 
    seats: 5, 
    countingDate: 'May 10, 2026', 
    notes: 'By-elections for 5 vacant assembly seats.' 
  },
  'Bihar': { 
    phase: 'By-Poll', 
    date: 'May 7, 2026', 
    seats: 2, 
    countingDate: 'May 10, 2026', 
    notes: 'By-elections for 2 vacant assembly seats.' 
  },
  'Rajasthan': { 
    phase: 'By-Poll', 
    date: 'May 7, 2026', 
    seats: 2, 
    countingDate: 'May 10, 2026', 
    notes: 'By-elections for 2 vacant assembly seats.' 
  },
  'Delhi': { 
    phase: 'No election in 2026', 
    date: 'N/A', 
    seats: 70, 
    countingDate: 'N/A', 
    notes: 'Delhi Assembly elections are not scheduled for 2026.' 
  },
  'Maharashtra': { 
    phase: 'No election in 2026', 
    date: 'N/A', 
    seats: 288, 
    countingDate: 'N/A', 
    notes: 'Maharashtra Assembly elections are not scheduled for 2026.' 
  },
  'Karnataka': { 
    phase: 'No election in 2026', 
    date: 'N/A', 
    seats: 224, 
    countingDate: 'N/A', 
    notes: 'Karnataka Assembly elections are not scheduled for 2026.' 
  }
};

/**
 * Maps cities/regions to states for intelligent state detection.
 */
const regionToState = {
  'Chennai': 'Tamil Nadu', 'Tamil Nadu': 'Tamil Nadu', 'Coimbatore': 'Tamil Nadu', 'Madurai': 'Tamil Nadu',
  'Kolkata': 'West Bengal', 'West Bengal': 'West Bengal', 'Howrah': 'West Bengal', 'Siliguri': 'West Bengal',
  'Ahmedabad': 'Gujarat', 'Gujarat': 'Gujarat', 'Surat': 'Gujarat', 'Vadodara': 'Gujarat',
  'Thiruvananthapuram': 'Kerala', 'Kerala': 'Kerala', 'Kochi': 'Kerala', 'Calicut': 'Kerala',
  'Guwahati': 'Assam', 'Assam': 'Assam', 'Dibrugarh': 'Assam', 'Silchar': 'Assam',
  'Puducherry': 'Puducherry', 'Pondicherry': 'Puducherry',
  'Varanasi': 'Uttar Pradesh', 'Uttar Pradesh': 'Uttar Pradesh', 'Lucknow': 'Uttar Pradesh',
  'Mumbai': 'Maharashtra', 'Maharashtra': 'Maharashtra', 'Pune': 'Maharashtra',
  'Bangalore': 'Karnataka', 'Bengaluru': 'Karnataka', 'Karnataka': 'Karnataka',
  'New Delhi': 'Delhi', 'Delhi': 'Delhi',
  'Patna': 'Bihar', 'Bihar': 'Bihar',
  'Jaipur': 'Rajasthan', 'Rajasthan': 'Rajasthan',
  'Chandigarh': 'Punjab', 'Punjab': 'Punjab',
  'Hyderabad': 'Telangana', 'Telangana': 'Telangana',
  'Bhubaneswar': 'Odisha', 'Odisha': 'Odisha'
};

/**
 * Fallback mapping for constituencies to nearest major landmarks.
 */
const constituencyBooths = {
  'Chennai Central': 'Madras Christian College Higher Secondary School, Tambaram',
  'Kolkata North': 'Scottish Church College, Maniktala',
  'Ahmedabad West': 'L.D. College of Engineering, Navrangpura',
  'Thiruvananthapuram': 'University College, Palayam',
  'Guwahati': 'Cotton University, Panbazar',
  'Puducherry': 'JIPMER Campus Auditorium, Dhanvantari Nagar',
  'Varanasi': 'Banaras Hindu University, Lanka',
  'Mumbai South': 'Elphinstone College, Fort',
  'Bangalore Central': "St. Joseph's College of Commerce, Brigade Road",
  'New Delhi': 'Modern School, Barakhamba Road'
};

module.exports = {
  electionData,
  regionToState,
  constituencyBooths,
  metadata: {
    lastUpdated: '2026-05-02T15:15:00Z',
    source: 'Election Commission of India (ECI) Official Schedule',
    disclaimer: 'Election dates and phases are subject to change. Always verify with official ECI notifications (eci.gov.in).'
  }
};
