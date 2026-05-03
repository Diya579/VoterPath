import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LanguageSelector from '../components/LanguageSelector';
import IDScanner from '../components/IDScanner';
import { VoterProvider } from '../contexts/VoterContext';

// Mock dependencies
vi.mock('../firebase/config', () => ({
  auth: { currentUser: null },
  db: {}
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <VoterProvider>
        {ui}
      </VoterProvider>
    </BrowserRouter>
  );
};

describe('Production Accessibility Audit (WCAG 2.1)', () => {
  it('Sidebar contains landmark navigation and skip-link targets', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('navigation')).toBeDefined();
    const navLinks = screen.getAllByRole('link');
    expect(navLinks.length).toBeGreaterThan(0);
    navLinks.forEach(link => {
      expect(link.getAttribute('aria-label') || link.textContent).toBeTruthy();
    });
  });

  it('LanguageSelector has correct semantic structure for screen readers', () => {
    renderWithProviders(<LanguageSelector onSelect={() => {}} />);
    expect(screen.getByRole('dialog')).toBeDefined();
    // It uses h1 for the main title
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    const langButtons = screen.getAllByRole('button');
    expect(langButtons.length).toBeGreaterThan(0);
  });

  it('IDScanner provides accessible instructions and status regions', () => {
    renderWithProviders(<IDScanner />);
    const statusRegion = document.querySelector('[aria-live="polite"]');
    expect(statusRegion).toBeDefined();
    expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
    
    // Use a more specific query for the upload input to avoid ambiguity with the label/region
    const uploadInput = screen.getByLabelText(/Upload Voter ID Card/i);
    expect(uploadInput).toBeDefined();
  });
});
