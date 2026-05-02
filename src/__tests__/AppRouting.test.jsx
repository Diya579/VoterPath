import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { VoterProvider } from '../contexts/VoterContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s) => s, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

vi.mock('../firebase/config', () => ({
  db: {}, analytics: {}, auth: {}, storage: {}
}));

vi.mock('../utils/seeder', () => ({
  seedDatabase: vi.fn()
}));

// Mock the components loaded by lazy loading
vi.mock('../components/IDScanner', () => ({ default: () => <div>IDScanner</div> }));
vi.mock('../components/EVMSimulator', () => ({ default: () => <div>EVM</div> }));
vi.mock('../components/Chatbot', () => ({ default: () => <div>Chatbot</div> }));
vi.mock('../components/ElectionTimeline', () => ({ default: () => <div>Timeline</div> }));
vi.mock('../components/BoothFinder', () => ({ default: () => <div>Booth</div> }));

describe('App Routing', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <VoterProvider>
        <App />
      </VoterProvider>
    );
    expect(container).toBeDefined();
  });
});
