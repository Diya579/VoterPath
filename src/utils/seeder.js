import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

const SEED_VERSION = 'v4'; // bump this to force a re-seed

const schedules = [
  { id: 'phase1_tn_kerala', region: 'Tamil Nadu & Kerala', date: 'April 23, 2026', type: 'poll', electors: '6.2 Crore', description: 'Phase 1 polling across Tamil Nadu (234 seats) and Kerala (140 seats). Model Code of Conduct in full effect.' },
  { id: 'phase2_wb1', region: 'West Bengal (Phase 1)', date: 'April 29, 2026', type: 'poll', electors: '3.4 Crore', description: 'First phase of West Bengal elections covering 100 assembly seats across southern districts.' },
  { id: 'phase3_assam', region: 'Assam & Puducherry', date: 'May 2, 2026', type: 'poll', electors: '2.4 Crore', description: 'Polling across Assam (126 seats) and the Union Territory of Puducherry (30 seats).' },
  { id: 'phase4_wb2', region: 'West Bengal (Phase 2)', date: 'May 5, 2026', type: 'poll', electors: '3.8 Crore', description: 'Second and final phase of West Bengal elections covering the remaining 194 assembly seats.' },
  { id: 'phase5_bypolls', region: 'By-Polls (Multiple States)', date: 'May 7, 2026', type: 'poll', electors: '0.8 Crore', description: 'By-elections for 12 vacant assembly seats across Uttar Pradesh, Bihar, and Rajasthan.' },
  { id: 'counting', region: 'All States — Results Day', date: 'May 10, 2026', type: 'count', electors: '15.8 Crore', description: 'Counting of votes for all 2026 Assembly Elections. Results expected by evening.' }
];

const booths = [
  // Chennai Central
  { id: 'b1', constituency: 'Chennai Central', name: 'Madras Christian College Higher Secondary School', address: 'Near Tambaram Station, Chennai – 600059', type: 'General' },
  { id: 'b2', constituency: 'Chennai Central', name: 'Government Girls Higher Secondary School', address: 'Egmore, Chennai – 600008', type: 'Pink Booth (Women)' },
  { id: 'b3', constituency: 'Chennai Central', name: 'Sri Ramakrishna Mission Vidyalaya', address: 'Mylapore, Chennai – 600004', type: 'Accessible (PWD)' },
  // Kolkata North
  { id: 'b6', constituency: 'Kolkata North', name: 'Scottish Church College', address: 'Maniktala Main Road, Kolkata – 700006', type: 'General' },
  { id: 'b7', constituency: 'Kolkata North', name: 'Presidency University', address: 'College Street, Kolkata – 700073', type: 'General' },
  { id: 'b8', constituency: 'Kolkata North', name: 'Bethune College', address: 'Cornwallis Street, Kolkata – 700006', type: 'Pink Booth (Women)' },
  // Ahmedabad West
  { id: 'b10', constituency: 'Ahmedabad West', name: 'L.D. College of Engineering', address: 'Navrangpura, Ahmedabad – 380015', type: 'General' },
  { id: 'b11', constituency: 'Ahmedabad West', name: 'H.L. College of Commerce', address: 'Navrangpura, Ahmedabad – 380009', type: 'General' },
  { id: 'b12', constituency: 'Ahmedabad West', name: 'Blind Peoples Association Centre', address: 'Vastrapur, Ahmedabad – 380015', type: 'Accessible (PWD)' },
  // Thiruvananthapuram
  { id: 'b15', constituency: 'Thiruvananthapuram', name: 'University College Thiruvananthapuram', address: 'Palayam, Thiruvananthapuram – 695034', type: 'General' },
  { id: 'b16', constituency: 'Thiruvananthapuram', name: 'Cotton Hill Girls Higher Secondary School', address: 'Vazhuthacaud, Thiruvananthapuram – 695014', type: 'Pink Booth (Women)' },
  // Guwahati
  { id: 'b17', constituency: 'Guwahati', name: 'Cotton University', address: 'Panbazar, Guwahati – 781001', type: 'General' },
  { id: 'b18', constituency: 'Guwahati', name: 'Handique Girls College', address: 'Dighalipukhuri East, Guwahati – 781001', type: 'Accessible (PWD)' },
  // Puducherry
  { id: 'b19', constituency: 'Puducherry', name: 'JIPMER Campus Auditorium', address: 'Dhanvantari Nagar, Puducherry – 605006', type: 'General' },
  { id: 'b20', constituency: 'Puducherry', name: 'French Institute of Pondicherry', address: 'White Town, Puducherry – 605001', type: 'General' },
  // Varanasi
  { id: 'b21', constituency: 'Varanasi', name: 'Banaras Hindu University (Auditorium Block)', address: 'Lanka, Varanasi – 221005', type: 'General' },
  { id: 'b22', constituency: 'Varanasi', name: 'Harish Chandra Degree College', address: 'Maidagin, Varanasi – 221001', type: 'Pink Booth (Women)' },
  // Mumbai South
  { id: 'b23', constituency: 'Mumbai South', name: 'Elphinstone College', address: 'Mahapalika Marg, Fort, Mumbai – 400032', type: 'General' },
  { id: 'b24', constituency: 'Mumbai South', name: 'St. Xavier\'s College Mumbai', address: '5, Mahapalika Marg, Mumbai – 400001', type: 'General' },
  // Bangalore Central
  { id: 'b25', constituency: 'Bangalore Central', name: 'St. Joseph\'s College of Commerce', address: '163, Brigade Road, Bengaluru – 560025', type: 'General' },
  { id: 'b26', constituency: 'Bangalore Central', name: 'Mount Carmel College', address: 'Vasanth Nagar, Bengaluru – 560052', type: 'Pink Booth (Women)' },
  // New Delhi
  { id: 'b27', constituency: 'New Delhi', name: 'Modern School', address: 'Barakhamba Road, New Delhi – 110001', type: 'General' },
  { id: 'b28', constituency: 'New Delhi', name: 'Lady Shri Ram College', address: 'Lajpat Nagar IV, New Delhi – 110024', type: 'Accessible (PWD)' }
];

export const seedDatabase = async () => {
  try {
    // Check if this seed version has already run
    if (localStorage.getItem('seed_version') === SEED_VERSION) {
      console.log('Database already seeded at version', SEED_VERSION);
      return;
    }

    // Clear old cached booth/schedule data to force fresh fetch
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('booths_') || key === 'schedules') {
        localStorage.removeItem(key);
      }
    });

    console.log('Seeding database at version', SEED_VERSION, '...');

    // Always upsert all schedules
    for (const s of schedules) {
      await setDoc(doc(db, 'schedules', s.id), s);
    }
    console.log(`Seeded ${schedules.length} schedules.`);

    // Always upsert all booths
    for (const b of booths) {
      await setDoc(doc(db, 'booths', b.id), b);
    }
    console.log(`Seeded ${booths.length} booths.`);

    // Mark seed as complete
    localStorage.setItem('seed_version', SEED_VERSION);
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
