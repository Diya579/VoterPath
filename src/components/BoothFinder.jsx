import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, analytics } from '../firebase/config';
import { logEvent } from 'firebase/analytics';
import { MapPin, Search, Info, Smartphone, Users, Accessibility, Loader2 } from 'lucide-react';
import { fallbackBooths } from '../utils/fallbackData';

const langNames = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', bn: 'Bengali', gu: 'Gujarati',
  te: 'Telugu', mr: 'Marathi', ur: 'Urdu', kn: 'Kannada', or: 'Odia',
  ml: 'Malayalam', pa: 'Punjabi', as: 'Assamese', ne: 'Nepali', ks: 'Kashmiri'
};

/**
 * Translates polling booth names and addresses using the backend AI service.
 * @param {Array} booths - Array of booth objects to translate.
 * @param {string} targetLangCode - The language code (e.g., 'gu', 'hi').
 * @returns {Promise<Array>} - Translated booth objects.
 */
async function translateBooths(booths, targetLangCode) {
  if (targetLangCode === 'en') return booths;
  const targetLang = langNames[targetLangCode] || 'English';

  try {
    const names = booths.map(b => b.name).join('\n');
    const addresses = booths.map(b => b.address).join('\n');

    const langInstruction = ` [Please strictly answer in ${targetLang}]`;
    const prompt = `Translate the following Indian polling booth names and addresses to ${targetLang} using native script ONLY (not romanized). Return a JSON object with two arrays: "names" and "addresses", each containing the translated strings in the same order.

Booth Names:
${names}

Booth Addresses:
${addresses}

IMPORTANT: Use only native ${targetLang} script. Do NOT romanize. Return only JSON.${langInstruction}`;

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    const text = data.text || '';
    
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn('No JSON found in translation response:', text);
      return booths;
    }
    
    const parsed = JSON.parse(match[0]);

    return booths.map((b, i) => ({
      ...b,
      nameTranslated: parsed.names?.[i] || b.name,
      addressTranslated: parsed.addresses?.[i] || b.address
    }));
  } catch (e) {
    console.warn('Translation failed, showing English:', e);
    return booths;
  }
}

/**
 * Memoized Component for rendering individual booth cards to improve performance.
 */
const BoothCard = memo(({ booth, getBadgeColor }) => (
  <div 
    role="listitem"
    className="brutal-card p-6 bg-white flex items-start hover:-translate-y-1 hover:shadow-brutal transition-all"
  >
    <div className="bg-secondary p-3 brutal-border mr-6 shrink-0 shadow-brutal-sm">
      <MapPin className="w-10 h-10 text-white stroke-[3]" aria-hidden="true" />
    </div>
    <div className="flex-1">
      <h3 className="text-2xl font-black uppercase mb-3">
        {booth.nameTranslated || booth.name}
      </h3>
      <div className="flex flex-wrap gap-3">
        <p className="text-lg font-bold bg-gray-100 inline-block px-3 py-1 brutal-border shadow-brutal-sm">
          📍 {booth.addressTranslated || booth.address}
        </p>
        <span className={`text-lg font-black inline-block px-3 py-1 brutal-border shadow-brutal-sm ${getBadgeColor(booth.type)}`}>
          {booth.type || 'General'}
        </span>
      </div>
    </div>
  </div>
));

/**
 * Main component for finding polling booths.
 * Integrates with Firebase Firestore and Google Analytics.
 */
export default function BoothFinder() {
  const { t, i18n } = useTranslation();
  const [constituency, setConstituency] = useState('Ahmedabad West');
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const currentLang = i18n.language || 'en';

  const constituencies = useMemo(() => [
    { value: 'Ahmedabad West', label: 'Ahmedabad West (Gujarat)' },
    { value: 'Chennai Central', label: 'Chennai Central (Tamil Nadu)' },
    { value: 'Kolkata North', label: 'Kolkata North (West Bengal)' },
    { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram (Kerala)' },
    { value: 'Guwahati', label: 'Guwahati (Assam)' },
    { value: 'Puducherry', label: 'Puducherry (UT)' },
    { value: 'Varanasi', label: 'Varanasi (Uttar Pradesh)' },
    { value: 'Mumbai South', label: 'Mumbai South (Maharashtra)' },
    { value: 'Bangalore Central', label: 'Bangalore Central (Karnataka)' },
    { value: 'New Delhi', label: 'New Delhi (Delhi)' },
  ], []);

  const fetchAndTranslate = useCallback(async (queryConst, lang) => {
    setLoading(true);

    // Google Analytics: Track booth search event
    logEvent(analytics, 'booth_search', {
      constituency: queryConst,
      language: lang
    });

    const cacheKey = `booths_${queryConst}_${lang}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData && JSON.parse(cachedData).length > 0) {
      setBooths(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    let rawBooths;
    try {
      const q = query(collection(db, 'booths'), where('constituency', '==', queryConst));
      const snapshot = await getDocs(q);
      rawBooths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (rawBooths.length === 0) {
        rawBooths = fallbackBooths.filter(b => b.constituency === queryConst);
      }
    } catch {
      rawBooths = fallbackBooths.filter(b => b.constituency === queryConst);
    }

    setLoading(false);

    if (lang !== 'en') {
      setTranslating(true);
      const translated = await translateBooths(rawBooths, lang);
      localStorage.setItem(cacheKey, JSON.stringify(translated));
      setBooths(translated);
      setTranslating(false);
    } else {
      localStorage.setItem(cacheKey, JSON.stringify(rawBooths));
      setBooths(rawBooths);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAndTranslate(constituency, currentLang);
  }, [currentLang, fetchAndTranslate, constituency]);

  const handleSearch = (e) => {
    e.preventDefault();
    localStorage.removeItem(`booths_${constituency}_${currentLang}`);
    fetchAndTranslate(constituency, currentLang);
  };

  const getBadgeColor = useCallback((type) => {
    if (type?.includes('Pink')) return 'bg-pink-500 text-white';
    if (type?.includes('PWD') || type?.includes('Accessible')) return 'bg-blue-600 text-white';
    return 'bg-brutalBlack text-white';
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12" role="main">
      <h2 className="text-4xl font-black flex items-center bg-primary p-4 brutal-border shadow-brutal-sm inline-block rotate-1 uppercase">
        <MapPin className="mr-4 stroke-[3] w-10 h-10" aria-hidden="true" />
        {t('booth')}
      </h2>

      <form onSubmit={handleSearch} className="flex gap-6" aria-label="Booth search form">
        <select
          value={constituency}
          onChange={(e) => setConstituency(e.target.value)}
          className="brutal-input flex-1 bg-white cursor-pointer"
          aria-label="Select Assembly Constituency"
        >
          {constituencies.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button 
          type="submit" 
          className="brutal-btn bg-tertiary flex items-center text-xl"
          aria-label="Search for booths"
        >
          <Search className="mr-3 stroke-[3]" aria-hidden="true" /> {t('continue') || 'Search'}
        </button>
      </form>

      {(loading || translating) ? (
        <div className="space-y-6" role="status" aria-live="polite">
          {translating && (
            <div className="flex items-center gap-4 bg-primary p-4 brutal-border shadow-brutal-sm">
              <Loader2 className="w-6 h-6 animate-spin stroke-[3]" />
              <span className="font-bold text-lg uppercase">Translating booth names to {langNames[currentLang]}...</span>
            </div>
          )}
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 brutal-border shadow-brutal-sm animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid gap-6" role="list" aria-label="Polling booth list">
          {booths.length === 0 ? (
            <div className="brutal-card p-10 text-center bg-white">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30 stroke-[2]" />
              <p className="text-2xl font-bold uppercase">{t('noBooths')}</p>
              <p className="text-lg font-semibold text-gray-500 mt-2">Try searching for another constituency above.</p>
            </div>
          ) : (
            booths.map(booth => (
              <BoothCard key={booth.id} booth={booth} getBadgeColor={getBadgeColor} />
            ))
          )}
        </div>
      )}

      {/* Google Maps Integration */}
      <section className="brutal-card bg-white p-4" aria-labelledby="map-heading">
        <h3 id="map-heading" className="text-2xl font-black uppercase mb-4 px-2">🗺️ {t('mapView')}: {constituency}</h3>
        <div className="brutal-border overflow-hidden h-96 bg-gray-100">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            title={`Interactive map showing polling booths in ${constituency}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(constituency + ' India')}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>
      </section>

      {/* Important Information */}
      <section className="brutal-card bg-accent p-8 text-white -rotate-1 relative overflow-hidden" aria-labelledby="info-heading">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 -mr-16 -mt-16 rotate-45"></div>
        
        <h3 id="info-heading" className="text-3xl font-black uppercase mb-6 text-black bg-white inline-block px-4 py-2 brutal-border shadow-brutal-sm relative z-10">
          {t('importantInfo') || 'Important Information'}
        </h3>
        
        <ul className="text-xl font-bold mt-4 space-y-5 relative z-10">
          {[
            { icon: Info, key: 'boothInfo1', fallback: 'Carry your original Voter ID card.' },
            { icon: Smartphone, key: 'boothInfo2', fallback: 'Mobile phones are prohibited.' },
            { icon: Users, key: 'boothInfo3', fallback: 'Pink Booths are managed by women.' },
            { icon: Accessibility, key: 'boothInfo4', fallback: 'Accessible booths have ramps.' }
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-4 bg-black/20 p-4 brutal-border">
              <item.icon className="w-7 h-7 shrink-0 mt-0.5 stroke-[3] text-primary" aria-hidden="true" />
              <span>{t(item.key) || item.fallback}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

