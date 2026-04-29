import { describe, it, expect } from 'vitest';
import { db, analytics } from './config';

describe('Firebase Configuration', () => {
  it('exports db and analytics', () => {
    expect(db).toBeDefined();
    expect(analytics).toBeDefined();
  });
});
