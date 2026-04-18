import { createContext, useContext, useState, useCallback } from 'react';
import en from './en';
import es from './es';

const translations = { en, es };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ts_lang') || 'en');

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'es' : 'en';
      localStorage.setItem('ts_lang', next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key, vars = {}) => {
      let str = translations[lang]?.[key] || translations.en[key] || key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
      return str;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
