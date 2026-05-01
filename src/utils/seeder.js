import { db } from '../firebase/config';
import { doc, writeBatch } from 'firebase/firestore';
import { fallbackSchedules, fallbackBooths } from './fallbackData';

const SEED_VERSION = 'v4'; // bump this to force a re-seed

/**
 * Seeds the Firestore database with election schedules and polling booths
 * using a WriteBatch for efficient, atomic parallel writes.
 * Runs only once per browser session per seed version using localStorage.
 */
export const seedDatabase = async () => {
  try {
    // Check if this seed version has already run
    if (localStorage.getItem('seed_version') === SEED_VERSION) {
      return;
    }

    // Clear old cached booth/schedule data to force fresh fetch
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('booths_') || key === 'schedules') {
        localStorage.removeItem(key);
      }
    });

    console.log('Seeding database at version', SEED_VERSION, '...');

    // Use WriteBatch for efficient, atomic parallel writes (vs. sequential for...of await)
    const batch = writeBatch(db);

    for (const s of fallbackSchedules) {
      batch.set(doc(db, 'schedules', s.id), s);
    }
    console.log(`Seeded ${fallbackSchedules.length} schedules.`);

    for (const b of fallbackBooths) {
      batch.set(doc(db, 'booths', b.id), b);
    }
    console.log(`Seeded ${fallbackBooths.length} booths.`);

    await batch.commit();

    // Mark seed as complete
    localStorage.setItem('seed_version', SEED_VERSION);
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
