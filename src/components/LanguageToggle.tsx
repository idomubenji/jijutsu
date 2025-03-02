"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-gray-800/80 dark:bg-gray-200/80 rounded-full px-2 py-1.5 backdrop-blur-sm shadow-sm">
      <button 
        onClick={() => setLanguage('en')}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          language === 'en' 
            ? 'bg-black text-white dark:bg-white dark:text-black' 
            : 'text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      
      <button 
        onClick={() => setLanguage('jp')}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          language === 'jp' 
            ? 'bg-black text-white dark:bg-white dark:text-black' 
            : 'text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300'
        }`}
        aria-label="Switch to Japanese"
      >
        JP
      </button>
    </div>
  );
}; 