import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisionScanner } from '../useVisionScanner';

// Mock Firebase
vi.mock('../../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('test-token')
    }
  }
}));

describe('useVisionScanner Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully scans an image and returns enriched data', async () => {
    const mockData = {
      epic: 'XYZ1234567',
      name: 'Diya P',
      constituency: 'Alandur',
      nearestBooth: 'St. Peters School',
      meta: { extractionConfidence: 0.95 }
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: mockData })
    });

    const { result } = renderHook(() => useVisionScanner());
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    await act(async () => {
      await result.current.scanImage(file);
    });

    expect(result.current.result).toMatchObject(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('handles scan failure gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service Unavailable' })
    });

    const { result } = renderHook(() => useVisionScanner());
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    await act(async () => {
      await result.current.scanImage(file);
    });

    expect(result.current.error).toContain('Service Unavailable');
    expect(result.current.loading).toBe(false);
  });
});
