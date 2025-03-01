"use client";

import { useEffect, useState, useMemo } from "react";
import DexGrid from "@/components/DexGrid";
import GameNav from "@/components/GameNav";
import { supabase } from '@/lib/supabase';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface KanjiData {
  id: string;
  kanji: string;
  dex_number: number;
  meanings: string[];
  on_reading?: string[];
  kun_reading?: string[];
}

interface RadicalData {
  ID: number;
  "Radical Shape": string;
  "English Name": string;
  "Radical Number": string;
}

interface DexItem {
  index: number;
  unlocked?: boolean;
  character?: string;
  meaning?: string;
}

interface UserKanjiResponse {
  kanji_id: string;
  kanji_dex: KanjiData;
}

export default function DexPage() {
  const [kanjiData, setKanjiData] = useState<KanjiData[]>([]);
  const [radicalData, setRadicalData] = useState<RadicalData[]>([]);
  const [unlockedKanjiNumbers, setUnlockedKanjiNumbers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Convert unlocked numbers to DexItems with kanji data
  const unlockedKanjiItems = useMemo<DexItem[]>(() => {
    return Array.from(unlockedKanjiNumbers).map(dexNumber => {
      const kanjiEntry = kanjiData.find(k => k.dex_number === dexNumber);
      return {
        index: dexNumber,
        unlocked: true,
        character: kanjiEntry?.kanji || '',
        meaning: kanjiEntry?.meanings?.[0] || ''
      };
    });
  }, [unlockedKanjiNumbers, kanjiData]);

  // Create unlocked radical items (all radicals are unlocked)
  const unlockedRadicalItems = useMemo<DexItem[]>(() => {
    return Array.from({ length: 252 }, (_, i) => ({
      index: i + 1,
      unlocked: true
    }));
  }, []);

  // Load user's discovered kanji from Supabase
  const loadUserKanji = async (userId: string) => {
    try {
      console.log('Loading user kanji for user:', userId);
      const { data: userKanjiData, error: userKanjiError } = await supabase
        .from('user_kanji')
        .select(`
          kanji_id,
          kanji_dex!inner (
            dex_number
          )
        `)
        .eq('user_id', userId)
        .returns<UserKanjiResponse[]>();

      if (userKanjiError) {
        console.error('Error loading user kanji:', userKanjiError);
        return;
      }

      console.log('Loaded user kanji data:', userKanjiData);
      
      if (!userKanjiData) {
        console.log('No user kanji data found');
        return;
      }

      // Just set the unlocked numbers, don't modify kanjiData
      const unlockedDexNumbers = new Set(
        userKanjiData.map(row => row.kanji_dex.dex_number)
      );
      
      console.log('Unlocked dex numbers:', Array.from(unlockedDexNumbers));
      setUnlockedKanjiNumbers(unlockedDexNumbers);
    } catch (error) {
      console.error('Error in loadUserKanji:', error);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
          await loadUserKanji(session.user.id);
        }

        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
              await loadUserKanji(session.user.id);
            } else {
              setUnlockedKanjiNumbers(new Set()); // Clear unlocked kanji when user logs out
            }
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    checkUser();
  }, []);

  // Load kanji data
  useEffect(() => {
    const loadKanjiData = async () => {
      try {
        console.log('Loading all kanji data from kanji_dex');
        const { data, error } = await supabase
          .from('kanji_dex')
          .select('*')
          .order('dex_number');

        if (error) {
          console.error('Error fetching kanji data:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.error('No kanji data returned from the database');
          return;
        }

        // Ensure meanings is always an array
        const processedData = data.map(k => ({
          ...k,
          meanings: Array.isArray(k.meanings) ? k.meanings : []
        }));

        setKanjiData(processedData);
        console.log('Loaded all kanji data, total count:', processedData.length);
      } catch (error) {
        console.error('Error loading kanji data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKanjiData();
  }, []);

  // Debug logging for unlockedKanjiItems
  useEffect(() => {
    if (unlockedKanjiNumbers.size > 0) {
      console.log('Creating unlockedKanjiItems...');
      console.log('Total kanji data available:', kanjiData.length);
      console.log('Unlocked numbers:', Array.from(unlockedKanjiNumbers));
      
      // Check if we can find each unlocked kanji in the data
      Array.from(unlockedKanjiNumbers).forEach(dexNumber => {
        const found = kanjiData.find(k => k.dex_number === dexNumber);
        if (!found) {
          console.warn(`Could not find kanji data for dex number ${dexNumber}`);
        } else {
          console.log(`Found kanji for ${dexNumber}:`, found);
        }
      });
    }
  }, [unlockedKanjiNumbers, kanjiData]);

  const handleKanjiClick = (index: number) => {
    console.log(`Kanji ${index} clicked`);
    // Future functionality: Toggle unlock state, show details, etc.
  };

  const handleRadicalClick = (index: number) => {
    console.log(`Radical ${index} clicked`);
    // Future functionality: Toggle unlock state, show details, etc.
  };

  // Handle toggle with loading animation
  const handleToggle = (checked: boolean) => {
    setIsToggling(true);
    setShowOnlyUnlocked(checked);
    // Add a small delay to simulate loading and make the animation visible
    setTimeout(() => {
      setIsToggling(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-screen bg-[#F2E8DC] dark:bg-[#38332E]">
        <GameNav />
        <p className="text-xl">Loading Dex data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#F2E8DC] dark:bg-[#38332E]">
      <GameNav />
      
      <h1 className="text-3xl font-bold mt-4 mb-6 text-center">Collection Dex</h1>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 lg:px-8 pb-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-auto h-[calc(100vh-10rem)] p-6 order-1 lg:order-1 w-full lg:w-[20%]">
          <DexGrid 
            title="部首図鑑" 
            totalItems={252} 
            unlockedItems={unlockedRadicalItems}
            onItemClick={handleRadicalClick}
          />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-auto h-[calc(100vh-10rem)] p-6 order-2 lg:order-2 w-full lg:w-[80%]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">漢字図鑑</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-unlocked" className="text-sm flex items-center gap-2">
                {isToggling ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500 dark:text-blue-400" />
                ) : showOnlyUnlocked ? (
                  <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
                Show unlocked only
              </Label>
              <Switch
                id="show-unlocked"
                checked={showOnlyUnlocked}
                onCheckedChange={handleToggle}
              />
            </div>
          </div>
          <DexGrid 
            title="" 
            totalItems={showOnlyUnlocked ? unlockedKanjiItems.length : 6355} 
            unlockedItems={unlockedKanjiItems}
            onItemClick={handleKanjiClick}
            showOnlyUnlocked={showOnlyUnlocked}
          />
        </div>
      </div>
    </div>
  );
} 