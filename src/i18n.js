import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import gu from './locales/gu.json';
import ta from './locales/ta.json';
import bn from './locales/bn.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import ur from './locales/ur.json';
import kn from './locales/kn.json';
import or_locale from './locales/or.json';
import ml from './locales/ml.json';
import pa from './locales/pa.json';
import as_locale from './locales/as.json';
import ne from './locales/ne.json';
import ks from './locales/ks.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  gu: { translation: gu },
  ta: { translation: ta },
  bn: { translation: bn },
  te: { translation: te },
  mr: { translation: mr },
  ur: { translation: ur },
  kn: { translation: kn },
  or: { translation: or_locale },
  ml: { translation: ml },
  pa: { translation: pa },
  as: { translation: as_locale },
  ne: { translation: ne },
  ks: { translation: ks }
};

const savedLanguage = localStorage.getItem('voterLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
