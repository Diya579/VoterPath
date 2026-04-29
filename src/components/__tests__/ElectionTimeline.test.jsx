import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ElectionTimeline from '../ElectionTimeline';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str) => str })
}));

describe('ElectionTimeline', () => {
  it('renders all 5 states in timeline', () => {
    render(<ElectionTimeline />);
    expect(screen.getByText('Tamil Nadu')).toBeDefined();
    expect(screen.getByText('West Bengal')).toBeDefined();
    expect(screen.getByText('Kerala')).toBeDefined();
    expect(screen.getByText('Assam')).toBeDefined();
    expect(screen.getByText('Puducherry')).toBeDefined();
  });
});
