import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EVMSimulator from '../components/EVMSimulator';

/**
 * Integration Test Suite: "Vote Simulation → Results" End-to-End Journey
 *
 * This suite validates the full user journey through the Mock EVM:
 *   1. User sees the EVM in "Ready" state with all candidates.
 *   2. User casts a vote by clicking a candidate button.
 *   3. The EVM locks (all buttons disabled) to prevent double-voting.
 *   4. A visible confirmation message is displayed with the selected candidate's name.
 *   5. The confirmation region uses aria-live="assertive" for screen reader announcements.
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key
  })
}));

describe('Integration: Vote Simulation → Results Journey', () => {
  beforeEach(() => {
    // Mock Web Audio API (EVM beep sound)
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
  });

  it('Step 1: EVM renders in Ready state with all candidates visible', () => {
    render(<EVMSimulator />);
    
    // The "Ready" badge is displayed
    expect(screen.getByText('Ready')).toBeInTheDocument();
    
    // All 5 candidate vote buttons are present and enabled
    const voteButtons = screen.getAllByRole('button');
    expect(voteButtons.length).toBe(5);
    voteButtons.forEach(btn => expect(btn).not.toBeDisabled());
    
    // Instruction text is shown before voting
    expect(screen.getByText('evmInstruct')).toBeInTheDocument();
  });

  it('Step 2-4: Full voting journey — cast vote, lock EVM, show confirmation', () => {
    render(<EVMSimulator />);
    
    const voteButtons = screen.getAllByRole('button');
    
    // Cast a vote for the first candidate (Rajesh Kumar)
    fireEvent.click(voteButtons[0]);
    
    // The EVM must lock: ALL buttons become disabled after a single vote
    voteButtons.forEach(btn => expect(btn).toBeDisabled());
    
    // Confirmation message must appear with the candidate's name
    const confirmation = screen.getByText(/Vote cast for/i);
    expect(confirmation).toBeInTheDocument();
    expect(confirmation.textContent).toContain('Rajesh Kumar');
    expect(confirmation.textContent).toContain('Your vote has been recorded');
  });

  it('Step 5: Confirmation message uses aria-live for screen readers', () => {
    render(<EVMSimulator />);
    
    // The confirmation region must exist with aria-live="assertive"
    const liveRegion = document.querySelector('[aria-live="assertive"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('Prevents double voting: second click on another candidate is ignored', () => {
    render(<EVMSimulator />);
    
    const voteButtons = screen.getAllByRole('button');
    
    // Vote for candidate 1
    fireEvent.click(voteButtons[0]);
    
    // Attempt to vote for candidate 2 (should be blocked)
    fireEvent.click(voteButtons[1]);
    
    // Confirmation should still show candidate 1, NOT candidate 2
    const confirmation = screen.getByText(/Vote cast for/i);
    expect(confirmation.textContent).toContain('Rajesh Kumar');
    expect(confirmation.textContent).not.toContain('Priya Patel');
  });
});
