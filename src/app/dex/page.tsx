"use client";

import { useEffect, useState } from "react";
import DexGrid from "@/components/DexGrid";
import MainLayout from "@/components/MainLayout";

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

export default function DexPage() {
  const [kanjiData, setKanjiData] = useState<KanjiData[]>([]);
  const [radicalData, setRadicalData] = useState<RadicalData[]>([]);
  const [unlockedKanji, setUnlockedKanji] = useState<DexItem[]>([]);
  const [unlockedRadicals, setUnlockedRadicals] = useState<DexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const kanjiResponse = await fetch("/api/data/kanji");
        const radicalResponse = await fetch("/api/data/radicals");
        
        const kanjiData: KanjiData[] = await kanjiResponse.json();
        const radicalData: RadicalData[] = await radicalResponse.json();
        
        setKanjiData(kanjiData);
        setRadicalData(radicalData);
        
        // For demonstration, we'll set a few items as unlocked
        // In a real application, this would come from user data
        const sampleUnlockedKanji = [1, 10, 100].map(index => {
          const kanji = kanjiData.find(k => k.dex_number === index);
          return {
            index,
            unlocked: true,
            character: kanji?.kanji,
            meaning: kanji?.meanings[0] || "",
          };
        });
        
        const sampleUnlockedRadicals = [1, 5, 10].map(index => {
          const radical = radicalData.find(r => r.ID === index);
          return {
            index,
            unlocked: true,
            character: radical?.["Radical Shape"],
            meaning: radical?.["English Name"] || "",
          };
        });
        
        setUnlockedKanji(sampleUnlockedKanji);
        setUnlockedRadicals(sampleUnlockedRadicals);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-xl">Loading Dex data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Collection Dex</h1>
        
        <div className="grid grid-cols-1 gap-12">
          <DexGrid 
            title="漢字図鑑" 
            totalItems={6355} 
            itemsPerRow={15}
            unlockedItems={unlockedKanji}
            onItemClick={handleKanjiClick}
          />
          
          <DexGrid 
            title="部首図鑑" 
            totalItems={252} 
            itemsPerRow={15}
            unlockedItems={unlockedRadicals}
            onItemClick={handleRadicalClick}
          />
        </div>
      </div>
    </MainLayout>
  );
} 