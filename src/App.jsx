import { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import Sidebar from './components/Sidebar';
import LanguageSelector from './components/LanguageSelector';
import { seedDatabase } from './utils/seeder';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useVoterContext } from './contexts/VoterContext';
import { auth } from './firebase/config';

// Code splitting: dynamically import heavy route components
const IDScanner = lazy(() => import('./components/IDScanner'));
const EVMSimulator = lazy(() => import('./components/EVMSimulator'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const ElectionTimeline = lazy(() => import('./components/ElectionTimeline'));
const BoothFinder = lazy(() => import('./components/BoothFinder'));

const OFFICIAL_VOTER_GUIDE_YT_ID = '-ucLifzB3HM';

function Home() {
  const { t } = useTranslation();
  return (
    <div className="p-10 brutal-card bg-primary mt-8">
      <h1 className="text-5xl font-black mb-6 uppercase border-b-4 border-brutalBlack pb-4 inline-block">{t('welcome')}</h1>
      <p className="text-2xl font-bold bg-white inline-block p-2 brutal-border shadow-brutal-sm mb-8">{t('homeDesc')}</p>
      
      {/* Google Services Integration: Official ECI YouTube Guide */}
      <div className="mt-10 border-4 border-brutalBlack p-4 bg-white shadow-brutal">
        <h2 className="text-2xl font-black mb-4 uppercase">📺 Official Voter Guide (by ECI)</h2>
        <div className="aspect-video">
          <iframe 
            className="w-full h-full border-2 border-brutalBlack"
            src={`https://www.youtube.com/embed/${OFFICIAL_VOTER_GUIDE_YT_ID}`}
            title="Official Voter Guide (by ECI)"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

// Fallback loader for Suspense
const RouteLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <Loader2 className="w-16 h-16 animate-spin stroke-[3] text-primary" />
    <p className="text-2xl font-black uppercase brutal-bg-white p-2 brutal-border">Loading Interface...</p>
  </div>
);

export default function App() {
  const { showLangSelector, setShowLangSelector } = useVoterContext();
  const seedingAttempted = useRef(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Authenticate user anonymously to get a secure session token
    // This allows us to use verifyToken on the backend without a public bypass.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('Anonymous Auth Failed:', err);
        }
      }
      setAuthLoading(false);
    });

    // 2. Robust idempotent seeding guard for production reliability
    const initApp = async () => {
      if (seedingAttempted.current) return;
      seedingAttempted.current = true;
      await seedDatabase();
    };
    initApp();

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <RouteLoader />;
  }

  if (showLangSelector) {
    return <LanguageSelector onSelect={() => setShowLangSelector(false)} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main id="main-content" className="flex-1 ml-72 p-12" role="main">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/timeline" element={<ElectionTimeline />} />
                <Route path="/scanner" element={<IDScanner />} />
                <Route path="/booth" element={<BoothFinder />} />
                <Route path="/evm" element={<EVMSimulator />} />
                <Route path="/chat" element={<Chatbot />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </Router>
  );
}
