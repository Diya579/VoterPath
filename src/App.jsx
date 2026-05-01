import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LanguageSelector from './components/LanguageSelector';
import IDScanner from './components/IDScanner';
import EVMSimulator from './components/EVMSimulator';
import Chatbot from './components/Chatbot';
import ElectionTimeline from './components/ElectionTimeline';
import BoothFinder from './components/BoothFinder';
import { auth } from './firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { seedDatabase } from './utils/seeder';
import { useTranslation } from 'react-i18next';

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
            src="https://www.youtube.com/embed/sA-eA3x3M8U" 
            title="ECI Voter Guide"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showLangSelector, setShowLangSelector] = useState(() => !localStorage.getItem('voterLanguage'));

  useEffect(() => {
    // Anonymous auth removed to prevent 400 network errors in the console.
    seedDatabase();
  }, []);

  if (showLangSelector) {
    return <LanguageSelector onSelect={() => setShowLangSelector(false)} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Sidebar onLanguageChange={() => setShowLangSelector(true)} />
        <main id="main-content" className="flex-1 ml-72 p-12" role="main">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/timeline" element={<ElectionTimeline />} />
              <Route path="/scanner" element={<IDScanner />} />
              <Route path="/booth" element={<BoothFinder />} />
              <Route path="/evm" element={<EVMSimulator />} />
              <Route path="/chat" element={<Chatbot />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
