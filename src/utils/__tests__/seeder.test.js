import { describe, it, expect, vi } from 'vitest';
import { seedDatabase } from '../seeder';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ empty: false }),
  addDoc: vi.fn()
}));

vi.mock('../../firebase/config', () => ({ db: {} }));

describe('Database Seeder', () => {
  it('should not seed if data already exists', async () => {
    const result = await seedDatabase();
    expect(result).toBeUndefined();
  });
});
