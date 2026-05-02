import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { VoterProvider } from '../../contexts/VoterContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('Sidebar Component', () => {
  it('renders navigation links', () => {
    render(
      <VoterProvider>
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      </VoterProvider>
    );
    
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('timeline')).toBeInTheDocument();
    expect(screen.getByText('evm')).toBeInTheDocument();
  });
});
