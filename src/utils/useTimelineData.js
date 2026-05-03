import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fallbackSchedules } from './fallbackData';

/**
 * @typedef {Object} Schedule
 * @property {string} id
 * @property {string} region
 * @property {string} date
 * @property {string} type
 * @property {string} [electors]
 * @property {string} [description]
 */

export function useTimelineData() {
  /** @type {[Schedule[], import('react').Dispatch<import('react').SetStateAction<Schedule[]>>]} */
  // @ts-ignore
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      // Check cache first
      const cached = localStorage.getItem('schedules');
      if (cached && JSON.parse(cached).length > 0) {
        setSchedules(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'schedules'));
        const snapshot = await getDocs(q);
        
        let fetchedData;
        if (snapshot.empty) {
          fetchedData = fallbackSchedules;
        } else {
          fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Sort by date chronologically
        // @ts-ignore
        const sorted = fetchedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSchedules(sorted);
        localStorage.setItem('schedules', JSON.stringify(sorted));
      } catch (err) {
        console.warn('Firestore fetch failed, using fallback schedules');
        // @ts-ignore
        const sorted = [...fallbackSchedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSchedules(sorted);
        localStorage.setItem('schedules', JSON.stringify(sorted));
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  return { schedules, loading };
}
