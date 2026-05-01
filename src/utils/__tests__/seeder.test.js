import { describe, it, expect, vi } from 'vitest';
import { seedDatabase } from '../seeder';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ empty: false }),
  addDoc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(),
  doc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue()
  }))
}));

vi.mock('../../firebase/config', () => ({ db: {} }));

describe('Database Seeder', () => {
  it('should not seed if data already exists', async () => {
    const result = await seedDatabase();
    expect(result).toBeUndefined();
  });
});
