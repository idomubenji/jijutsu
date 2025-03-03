"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Available languages
type Language = 'en' | 'jp';

// Context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, values?: Record<string, string | number>): string => key,
});

// Translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App general
    'app.title': 'Kanji Game',
    
    // Navigation and sidebar
    'radical.sidebar.title': 'Radicals',
    'kanji.sidebar.title': 'Discovered Kanji',
    'kanji.sidebar.reset': 'Reset',
    'kanji.sidebar.empty': 'Drag and combine radicals to discover kanji!',
    'kanji.sidebar.instructions': 'Right-Click to Use. Left-Click for Info.',
    'next.radical': 'until next radical',
    'of.radicals': 'of radicals',
    'coming.next': 'Coming Next',
    'unlock.more': 'Unlock more by creating kanji',
    'kanji.count': 'Discovered kanji',
    'discovered.count': 'Discovered: {count} kanji',
    'kanji.count.label': 'Kanji: {count}',
    'next.at': 'Next at:',
    
    // Instructions
    'drag.instructions': 'Drag radicals to create kanji',
    'welcome.title': 'Welcome to Jijutsu! 字術',
    'welcome.subtitle': 'Discover kanji by combining their component radicals',
    'instructions.how.to.play': 'How to Play:',
    'instructions.step.1': 'Drag radicals from the sidebar into the main workspace.',
    'instructions.step.2': 'Move radicals around and bring them close to each other to combine them.',
    'instructions.step.3': 'When you have the exact set of radicals needed to form a kanji, they\'ll merge automatically!',
    'instructions.step.4': 'Discovered kanji will appear in the sidebar. You can also use these to create more complex kanji.',
    'instructions.step.5': 'When you see a blinking outline, it means you\'re close to forming a kanji!',
    'instructions.step.6': 'Drag unwanted elements to the trash can to remove them.',
    'instructions.step.7': 'The more kanji you discover, the more radicals you unlock!',
    'instructions.tips': 'Tips:',
    'instructions.tip.1': 'Start with simple combinations of 2-3 radicals.',
    'instructions.tip.2': 'Experiment! Not all combinations will create kanji.',
    'instructions.tip.3': 'Try to discover as many kanji as you can!',
    'start.playing': 'Start Playing!',
    
    // Kanji details dialog
    'kanji.details.title': 'Kanji Details',
    'kanji.details.meanings': 'Meanings',
    'kanji.details.on.reading': 'On Reading (音読み)',
    'kanji.details.kun.reading': 'Kun Reading (訓読み)',
    'kanji.details.no.available': 'No kanji details available',
    'kanji.details.close': 'Close',
    
    // Dex page
    'kanji.dex.title': 'KanjiDex',
    'kanji.dex.on.reading': 'On Reading',
    'kanji.dex.kun.reading': 'Kun Reading',
    'kanji.dex.show.unlocked': 'Show unlocked only',
    'kanji.dex.show.all': 'Show all kanji',
    'kanji.dex.meanings': 'Meanings',
    'kanji.dex.details.title': 'Kanji Details',
    'kanji.dex.radical.title': 'RadicalDex',
    
    // Authentication
    'sign.in': 'Sign In',
    'sign.up': 'Sign Up',
    'sign.in.to.jijutsu': 'Sign In to Jijutsu',
    'create.account': 'Create your Jijutsu account',
    
    // Buttons and controls
    'login.button': 'Sign In',
    'signup.button': 'Sign Up',
    'logout.button': 'Sign Out',
    'clear.button': 'Clear Workspace',
    'reset.button': 'Reset Progress',
    'retry.connection': 'Retry Connection',
    'release.to.delete': 'Release to delete',
    'help.button': 'Help',
    'show.meanings': 'Show Meanings',
    'hide.meanings': 'Hide Meanings',
    'toggle.meanings.title': 'Toggle meaning display',
    'logged.in.as': 'Logged in as:',
    
    // Messages
    'success.combination': 'You created a new kanji!',
    'loading': 'Loading...',
    'loading.game.data': 'Loading game data...',
    'sign.in.to.track': 'Sign in to track progress',
    'right.click.info': 'Right-click on kanji to learn more about them!',
    'drag.and.combine': 'Drag and combine radicals to discover kanji!',
    'reconnecting': 'Reconnecting...'
  },
  jp: {
    // App general
    'app.title': '漢字ゲーム',
    
    // Navigation and sidebar
    'radical.sidebar.title': '部首',
    'kanji.sidebar.title': '発見済み漢字',
    'kanji.sidebar.reset': 'リセット',
    'kanji.sidebar.empty': '部首をドラッグして漢字を発見しよう！',
    'kanji.sidebar.instructions': '右クリックで使用。左クリックで詳細。',
    'next.radical': '次の部首まで',
    'of.radicals': '部首',
    'coming.next': '次の部首',
    'unlock.more': '漢字を作成してロック解除',
    'kanji.count': '発見された漢字',
    'discovered.count': '発見済み: {count} 漢字',
    'kanji.count.label': '漢字: {count}',
    'next.at': '次のレベル:',
    
    // Instructions
    'drag.instructions': '部首をドラッグして漢字を作成',
    'welcome.title': '字術へようこそ！',
    'welcome.subtitle': '部首を組み合わせて漢字を発見しよう',
    'instructions.how.to.play': 'プレイ方法:',
    'instructions.step.1': 'サイドバーから部首をメインワークスペースにドラッグします。',
    'instructions.step.2': '部首を移動させ、近づけて組み合わせます。',
    'instructions.step.3': '漢字を形成するために必要な部首が揃うと、自動的に合体します！',
    'instructions.step.4': '発見した漢字はサイドバーに表示されます。これらを使ってより複雑な漢字を作ることもできます。',
    'instructions.step.5': '点滅する輪郭が見えたら、漢字を形成する近くにいることを意味します！',
    'instructions.step.6': '不要な要素はゴミ箱にドラッグして削除します。',
    'instructions.step.7': '発見する漢字が増えるほど、より多くの部首がロック解除されます！',
    'instructions.tips': 'ヒント:',
    'instructions.tip.1': '2-3個の部首の簡単な組み合わせから始めましょう。',
    'instructions.tip.2': '実験してみてください！すべての組み合わせが漢字になるわけではありません。',
    'instructions.tip.3': 'できるだけ多くの漢字を発見してみましょう！',
    'start.playing': 'プレイ開始！',
    
    // Kanji details dialog
    'kanji.details.title': '漢字の詳細',
    'kanji.details.meanings': '意味',
    'kanji.details.on.reading': '音読み',
    'kanji.details.kun.reading': '訓読み',
    'kanji.details.no.available': '漢字の詳細はありません',
    'kanji.details.close': '閉じる',
    
    // Dex page
    'kanji.dex.title': '漢字図鑑',
    'kanji.dex.on.reading': '音読み',
    'kanji.dex.kun.reading': '訓読み',
    'kanji.dex.show.unlocked': '解除済みのみ表示',
    'kanji.dex.show.all': '全ての漢字を表示',
    'kanji.dex.meanings': '意味',
    'kanji.dex.details.title': '漢字の詳細',
    'kanji.dex.radical.title': '部首図鑑',
    
    // Authentication
    'sign.in': 'ログイン',
    'sign.up': '登録',
    'sign.in.to.jijutsu': 'Jijutsuにログイン',
    'create.account': 'Jijutsuアカウントを作成',
    
    // Buttons and controls
    'login.button': 'ログイン',
    'signup.button': '登録',
    'logout.button': 'ログアウト',
    'clear.button': 'クリア',
    'reset.button': '進捗リセット',
    'retry.connection': '再接続',
    'release.to.delete': '離して削除',
    'help.button': 'ヘルプ',
    'show.meanings': '意味を表示',
    'hide.meanings': '意味を非表示',
    'toggle.meanings.title': '意味の表示を切り替える',
    'logged.in.as': 'ログイン中:',
    
    // Messages
    'success.combination': '新しい漢字を作成しました！',
    'loading': '読み込み中...',
    'loading.game.data': 'ゲームデータを読み込み中...',
    'sign.in.to.track': 'ログインして進捗を記録',
    'right.click.info': '漢字を右クリックして詳細を確認！',
    'drag.and.combine': '部首をドラッグして組み合わせて漢字を発見しよう！',
    'reconnecting': '再接続中...'
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
  const t = (key: string, values?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;
    
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, String(v));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext); 