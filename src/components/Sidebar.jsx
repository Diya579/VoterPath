import { useTranslation } from 'react-i18next';
import { Home, Calendar, Scan, MapPin, CheckSquare, MessageSquare, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

import { useVoterContext } from '../contexts/VoterContext';

/**
 * Sidebar navigation component
 * @returns {JSX.Element} The rendered Sidebar component
 */
export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setShowLangSelector } = useVoterContext();

  // Persist high contrast preference across sessions
  useEffect(() => {
    const saved = localStorage.getItem('highContrast');
    if (saved === 'true') {
      document.documentElement.setAttribute('data-contrast', 'high');
    }
  }, []);

  const links = [
    { name: t('home'), path: '/', icon: Home, color: 'bg-primary' },
    { name: t('timeline'), path: '/timeline', icon: Calendar, color: 'bg-tertiary' },
    { name: t('scanner'), path: '/scanner', icon: Scan, color: 'bg-secondary' },
    { name: t('booth'), path: '/booth', icon: MapPin, color: 'bg-accent' },
    { name: t('evm'), path: '/evm', icon: CheckSquare, color: 'bg-primary' },
    { name: t('chat'), path: '/chat', icon: MessageSquare, color: 'bg-tertiary' }
  ];

  return (
    <div className="w-72 h-screen bg-surface border-r-8 border-brutalBlack p-6 flex flex-col fixed left-0 top-0 overflow-y-auto z-50">
      <div>
        <h1 className="text-3xl font-black text-brutalBlack mb-10 flex items-center bg-primary p-3 brutal-border shadow-brutal-sm">
          <CheckSquare className="mr-3 stroke-[3]" /> {t('appTitle')}
        </h1>
        <nav className="space-y-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center p-4 transition-all brutal-border shadow-brutal-sm font-bold text-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-hover ${
                  isActive ? `${link.color} text-black` : 'bg-white hover:bg-gray-100 text-black'
                }`}
              >
                <Icon className="mr-3 w-6 h-6 stroke-[3]" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-4">
          <a
            href="https://voters.eci.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 transition-all brutal-border shadow-brutal-sm font-bold text-lg bg-yellow-300 hover:bg-yellow-400 text-black hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-hover"
          >
            <CheckSquare className="mr-3 w-6 h-6 stroke-[3]" />
            {t('voterRegistration')}
          </a>
          <a
            href="https://affidavit.eci.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 transition-all brutal-border shadow-brutal-sm font-bold text-lg bg-green-300 hover:bg-green-400 text-black hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-hover"
          >
            <MessageSquare className="mr-3 w-6 h-6 stroke-[3]" />
            {t('knowYourCandidate')}
          </a>
        </div>
      </div>

      <button 
        onClick={() => setShowLangSelector(true)}
        className="mt-8 flex items-center justify-center bg-white hover:bg-gray-200 text-black w-full brutal-btn"
        aria-label="Change Application Language"
      >
        <Globe className="mr-2 stroke-[3]" />
        Change Language
      </button>

      <button 
        onClick={() => {
          const isHighContrast = document.documentElement.getAttribute('data-contrast') === 'high';
          const next = isHighContrast ? 'normal' : 'high';
          document.documentElement.setAttribute('data-contrast', next);
          localStorage.setItem('highContrast', String(next === 'high'));
        }}
        className="mt-4 flex items-center justify-center bg-brutalBlack text-white w-full brutal-btn"
        aria-label="Toggle High Contrast Mode"
      >
        High Contrast
      </button>

      <div className="mt-auto pt-6 text-xs font-bold text-center border-t-2 border-brutalBlack">
        <p className="uppercase mb-1 tracking-tighter">🔒 PII Shield Active</p>
        <p className="text-[10px] leading-tight">Voter ID scans are processed in-memory. No PII is stored. 2026 Election Data.</p>
      </div>
    </div>
  );
}
