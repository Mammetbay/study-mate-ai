import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { SUPPORTED_LANGUAGES } from '../config/languages';

import tr from '../locales/tr.json';
import en from '../locales/en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  const langCode = locales[0]?.languageCode;
  if (langCode && SUPPORTED_LANGUAGES.includes(langCode as any)) {
    return langCode;
  }
  return 'en'; // default fallback
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
