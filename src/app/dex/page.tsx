"use client";

import { useEffect, useState, useMemo } from "react";
import DexGrid from "@/components/DexGrid";
import GameNav from "@/components/GameNav";
import { supabase } from '@/lib/supabase';

interface KanjiData {
  kanji: string;
  dex_number: number;
  meanings: string[];
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
  kanji_dex: {
    dex_number: number;
  };
}

export default function DexPage() {
  const [kanjiData, setKanjiData] = useState<KanjiData[]>([]);
  const [radicalData, setRadicalData] = useState<RadicalData[]>([]);
  const [unlockedKanjiNumbers, setUnlockedKanjiNumbers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Convert unlocked numbers to DexItems with kanji data
  const unlockedKanjiItems = useMemo<DexItem[]>(() => {
    return Array.from(unlockedKanjiNumbers).map(dexNumber => {
      const kanjiEntry = kanjiData.find(k => k.dex_number === dexNumber);
      return {
        index: dexNumber,
        unlocked: true,
        character: kanjiEntry?.kanji,
        meaning: kanjiEntry?.meanings[0]
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
      const { data, error } = await supabase
        .from('user_kanji')
        .select(`
          kanji_id,
          kanji_dex!inner (
            dex_number
          )
        `)
        .eq('user_id', userId)
        .returns<UserKanjiResponse[]>();

      if (error) {
        console.error('Error loading user kanji:', error);
        return;
      }

      // Create a set of unlocked dex numbers
      const unlockedDexNumbers = new Set(
        (data || []).map(row => row.kanji_dex.dex_number)
      );
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
        const { data, error } = await supabase
          .from('kanji_dex')
          .select('kanji, dex_number, meanings')
          .order('dex_number');

        if (error) {
          throw error;
        }

        setKanjiData(data || []);
      } catch (error) {
        console.error('Error loading kanji data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKanjiData();
  }, []);

  const handleKanjiClick = (index: number) => {
    console.log(`Kanji ${index} clicked`);
    // Future functionality: Toggle unlock state, show details, etc.
  };

  const handleRadicalClick = (index: number) => {
    console.log(`Radical ${index} clicked`);
    // Future functionality: Toggle unlock state, show details, etc.
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
          <DexGrid 
            title="漢字図鑑" 
            totalItems={6355} 
            unlockedItems={unlockedKanjiItems}
            onItemClick={handleKanjiClick}
          />
        </div>
      </div>
    </div>
  );
} 