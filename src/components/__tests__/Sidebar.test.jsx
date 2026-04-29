import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('Sidebar Component', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar onLanguageChange={() => {}} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('timeline')).toBeInTheDocument();
    expect(screen.getByText('evm')).toBeInTheDocument();
  });
});
