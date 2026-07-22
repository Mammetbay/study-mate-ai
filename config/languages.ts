export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  tr: 'Türkçe',
  en: 'English',
};
