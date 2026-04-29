import { useTranslation } from 'react-i18next';

export default function LanguageSelector({ onSelect }) {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', native: 'English', color: 'bg-primary' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', color: 'bg-secondary text-white' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', color: 'bg-tertiary' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', color: 'bg-accent text-white' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', color: 'bg-primary' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', color: 'bg-secondary text-white' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', color: 'bg-tertiary' },
    { code: 'ur', name: 'Urdu', native: 'اردو', color: 'bg-accent text-white' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', color: 'bg-primary' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', color: 'bg-secondary text-white' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', color: 'bg-tertiary' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', color: 'bg-accent text-white' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', color: 'bg-primary' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली', color: 'bg-secondary text-white' },
    { code: 'ks', name: 'Kashmiri', native: 'کٲشُر', color: 'bg-tertiary' }
  ];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('voterLanguage', code);
    onSelect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tertiary p-8">
      <div className="brutal-card p-10 max-w-4xl w-full bg-white text-center">
        <h1 className="text-4xl font-black mb-4 uppercase bg-primary inline-block p-4 brutal-border shadow-brutal-sm -rotate-2">
          🗳️ VoterPath India
        </h1>
        <p className="text-2xl font-bold mb-10 mt-6 uppercase">
          {t('selectLanguage')}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`brutal-btn ${lang.color} py-4 px-2 flex flex-col items-center justify-center gap-1`}
            >
              <span className="text-xl font-black">{lang.native}</span>
              <span className="text-xs font-bold opacity-70 uppercase">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
