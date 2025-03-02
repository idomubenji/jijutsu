"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Available languages
type Language = 'en' | 'jp';

// Context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // English translations
    'app.title': 'Kanji Game',
    'radical.sidebar.title': 'Radicals',
    'kanji.details.title': 'Kanji Details',
    'drag.instructions': 'Drag radicals to create kanji',
    'login.button': 'Sign In',
    'signup.button': 'Sign Up',
    'logout.button': 'Sign Out',
    'success.combination': 'You created a new kanji!',
    'clear.button': 'Clear Area',
    'reset.button': 'Reset Progress',
    // Add more as needed
  },
  jp: {
    // Japanese translations
    'app.title': '漢字ゲーム',
    'radical.sidebar.title': '部首',
    'kanji.details.title': '漢字の詳細',
    'drag.instructions': '部首をドラッグして漢字を作成',
    'login.button': 'ログイン',
    'signup.button': '登録',
    'logout.button': 'ログアウト',
    'success.combination': '新しい漢字を作成しました！',
    'clear.button': 'クリア',
    'reset.button': '進捗リセット',
    // Add more as needed
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Initialize with user's preference or fallback to English
  const [language, setLanguage] = useState<Language>('en');

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'jp')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext); 