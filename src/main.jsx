import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './i18n';
import ErrorBoundary from './components/ErrorBoundary';
import { VoterProvider } from './contexts/VoterContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <VoterProvider>
        <App />
      </VoterProvider>
    </ErrorBoundary>
  </StrictMode>,
);
