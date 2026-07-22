import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '../config/languages';
import i18n from './i18n';

const STORAGE_KEYS = {
  LANGUAGE: '@studymate_language',
  DARK_MODE: '@studymate_dark_mode',
  API_KEY: '@studymate_api_key',
  ONBOARDING_COMPLETED: '@studymate_onboarding',
} as const;

interface AppContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  isReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(true);
  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Load persisted settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedLang, savedDarkMode, savedApiKey, savedOnboarding] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        ]);

        if (savedLang) {
          setLanguageState(savedLang as LanguageCode);
          i18n.changeLanguage(savedLang);
        }
        if (savedDarkMode !== null) {
          setIsDarkModeState(savedDarkMode === 'true');
        }
        if (savedApiKey) {
          setApiKeyState(savedApiKey);
        }
        if (savedOnboarding !== null) {
          setOnboardingCompletedState(savedOnboarding === 'true');
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      } finally {
        setIsReady(true);
      }
    };

    loadSettings();
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
  }, []);

  const setIsDarkMode = useCallback((isDark: boolean) => {
    setIsDarkModeState(isDark);
    AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
  }, []);

  const setOnboardingCompleted = useCallback((completed: boolean) => {
    setOnboardingCompletedState(completed);
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        apiKey,
        setApiKey,
        isDarkMode,
        setIsDarkMode,
        onboardingCompleted,
        setOnboardingCompleted,
        isReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

/** Convenience hook: returns the active color palette based on isDarkMode */
export const useThemeColors = () => {
  const { isDarkMode } = useAppContext();
  const { theme } = require('./theme');
  return isDarkMode ? theme.colors.dark : theme.colors.light;
};
