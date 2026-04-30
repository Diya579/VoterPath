import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EVMSimulator from '../EVMSimulator';

// Mock translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('EVMSimulator', () => {
  it('renders candidates and allows voting once', () => {
    // Mock Web Audio API
    window.AudioContext = vi.fn().mockImplementation(function() {
      return {
        createOscillator: () => ({
          type: '',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        }),
        createGain: () => ({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn()
        }),
        currentTime: 0,
        destination: {}
      };
    });

    render(<EVMSimulator />);
    
    // Title is rendered
    expect(screen.getByText('evm')).toBeInTheDocument();

    // Check Candidate button exists
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(5);

    // Vote for candidate 1
    fireEvent.click(buttons[0]);
    
    // All buttons should be disabled immediately (EVM locks)
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });
});
