import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Language Selection Modal with WCAG-compliant focus trap.
 * Keyboard focus is locked within the modal to prevent background interaction.
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback executed after a language is selected
 * @returns {any} The rendered LanguageSelector component
 */
export default function LanguageSelector({ onSelect }) {
  const { t, i18n } = useTranslation();
  /** @type {import('react').MutableRefObject<HTMLDivElement | null>} */
  // @ts-ignore
  const modalRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', native: 'English', color: 'bg-primary' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', color: 'bg-secondary text-white' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', color: 'bg-tertiary' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', color: 'bg-accent text-white' },
    { code: 'mr', name: 'Marathi', native: 'मরাठी', color: 'bg-primary' },
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

  /** @param {string} code */
  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('voterLanguage', code);
    onSelect();
  };

  /**
   * Focus Trap: Keeps keyboard focus within the modal.
   * Handles Tab, Shift+Tab, and Escape key events per WCAG 2.1 §2.1.2.
   */
  const handleKeyDown = useCallback(
    /** @param {KeyboardEvent} e */
    (e) => {
    if (!modalRef.current) return;

    const focusableEls = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = /** @type {HTMLElement} */ (focusableEls[0]);
    const lastEl = /** @type {HTMLElement} */ (focusableEls[focusableEls.length - 1]);

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  }, []);

  // Set initial focus and attach trap
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      const firstBtn = /** @type {HTMLElement | null} */ (modal.querySelector('button'));
      if (firstBtn) firstBtn.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-tertiary p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-selector-title"
    >
      <div ref={modalRef} className="brutal-card p-10 max-w-4xl w-full bg-white text-center">
        <h1
          id="lang-selector-title"
          className="text-4xl font-black mb-4 uppercase bg-primary inline-block p-4 brutal-border shadow-brutal-sm -rotate-2"
        >
          Select Language / भाषा चुनें
        </h1>
        <p className="text-2xl font-bold mb-10 mt-6 uppercase">
          Welcome to VoterPath India
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`brutal-btn ${lang.color} py-4 px-2 flex flex-col items-center justify-center gap-1`}
              aria-label={`Select ${lang.name} - ${lang.native}`}
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

LanguageSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
};
