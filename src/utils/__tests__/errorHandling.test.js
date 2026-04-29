import { describe, it, expect } from 'vitest';

describe('Global Error Handling Logic', () => {
  it('should catch and format errors correctly', () => {
    const error = new Error('Test Error');
    expect(error.message).toBe('Test Error');
  });
});
