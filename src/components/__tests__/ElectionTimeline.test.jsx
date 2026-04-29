import { describe, it, expect, vi } from 'vitest';
import ElectionTimeline from '../ElectionTimeline';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str })
}));

vi.mock('../../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn()
}));

import { render, screen, waitFor } from '@testing-library/react';

describe('ElectionTimeline', () => {
  it.skip('renders regions in timeline', async () => {
    render(<ElectionTimeline />);
    await waitFor(() => {
      expect(screen.getByText(/Tamil Nadu/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
