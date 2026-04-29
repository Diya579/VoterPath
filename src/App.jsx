import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LanguageSelector from './components/LanguageSelector';
import IDScanner from './components/IDScanner';
import EVMSimulator from './components/EVMSimulator';
import Chatbot from './components/Chatbot';
import ElectionTimeline from './components/ElectionTimeline';
import BoothFinder from './components/BoothFinder';
import { seedDatabase } from './utils/seeder';
import { useTranslation } from 'react-i18next';

function Home() {
  const { t } = useTranslation();
  return (
    <div className="p-10 brutal-card bg-primary mt-8">
      <h1 className="text-5xl font-black mb-6 uppercase border-b-4 border-brutalBlack pb-4 inline-block">{t('welcome')}</h1>
      <p className="text-2xl font-bold bg-white inline-block p-2 brutal-border shadow-brutal-sm">{t('homeDesc')}</p>
    </div>
  );
}

export default function App() {
  const [showLangSelector, setShowLangSelector] = useState(false);

  useEffect(() => {
    seedDatabase();
    if (!localStorage.getItem('voterLanguage')) {
      setShowLangSelector(true);
    }
  }, []);

  if (showLangSelector) {
    return <LanguageSelector onSelect={() => setShowLangSelector(false)} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Sidebar onLanguageChange={() => setShowLangSelector(true)} />
        <main className="flex-1 ml-72 p-12">
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
