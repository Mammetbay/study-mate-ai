import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '../config/languages';
import { AISettings } from '../types/ai';
import i18n from './i18n';

const STORAGE_KEYS = {
  LANGUAGE: '@studymate_language',
  DARK_MODE: '@studymate_dark_mode',
  API_KEY: '@studymate_api_key',
  AI_SETTINGS: '@studymate_ai_settings',
  ONBOARDING_COMPLETED: '@studymate_onboarding',
} as const;

const DEFAULT_AI_SETTINGS: AISettings = {
  providerId: 'groq',
  apiKeys: {},
  // Models are chosen from the provider's live catalog in Settings, so there
  // are no hardcoded defaults — they stay null until a catalog is loaded.
  selectedModels: {
    stt: null,
    vision: null,
    chat: null,
  },
};

interface AppContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  aiSettings: AISettings;
  setAiSettings: (settings: AISettings) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  isReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [aiSettings, setAiSettingsState] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(true);
  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Load persisted settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedLang, savedDarkMode, savedAiSettings, savedApiKey, savedOnboarding] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
            AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
            AsyncStorage.getItem(STORAGE_KEYS.AI_SETTINGS),
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

        // Migration: if old API_KEY exists but no AI_SETTINGS, migrate
        if (savedAiSettings) {
          const parsed = JSON.parse(savedAiSettings) as AISettings;
          setAiSettingsState(parsed);
        } else if (savedApiKey) {
          const migrated: AISettings = {
            ...DEFAULT_AI_SETTINGS,
            apiKeys: { groq: savedApiKey },
          };
          setAiSettingsState(migrated);
          await AsyncStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(migrated));
          await AsyncStorage.removeItem(STORAGE_KEYS.API_KEY);
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

  const setAiSettings = useCallback((settings: AISettings) => {
    setAiSettingsState(settings);
    AsyncStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(settings));
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
        aiSettings,
        setAiSettings,
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
