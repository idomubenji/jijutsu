import { useState, useEffect } from 'react';
import kanjiRadicalData from '../data/kanjiRadicals.json';

export interface KanjiRadicalData {
  radicalToKanji: Record<string, string[]>;
  kanjiToRadicals: Record<string, string[]>;
  radicalDecomposition: Record<string, string[]>;
}

/**
 * A hook to access the kanji radical data in your game components
 */
export function useKanjiRadicals() {
  const [data, setData] = useState<KanjiRadicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('useKanjiRadicals: Starting to load kanji radical data...');
    try {
      // The JSON is imported directly so it's available immediately
      console.log('useKanjiRadicals: Importing kanji radical data...');
      const importedData = kanjiRadicalData as KanjiRadicalData;
      console.log('useKanjiRadicals: Data import successful, sample data:', 
        Object.keys(importedData.radicalToKanji).length + ' radicals,',
        Object.keys(importedData.kanjiToRadicals).length + ' kanji');
      
      setData(importedData);
      setLoading(false);
      console.log('useKanjiRadicals: Data loaded and loading state set to false');
    } catch (err) {
      console.error('Error loading kanji radical data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, []);

  /**
   * Find all possible kanji that can be created with the given radicals
   * @param radicals Array of radical characters
   * @returns Array of possible kanji
   */
  const findPossibleKanji = (radicals: string[]): string[] => {
    if (!data || radicals.length === 0) return [];

    // Start with all kanji from the first radical
    const firstRadical = radicals[0];
    const kanjiSet = new Set(data.radicalToKanji[firstRadical] || []);

    // For each additional radical, filter to keep only kanji that contain all radicals
    for (let i = 1; i < radicals.length; i++) {
      const radical = radicals[i];
      const kanjiWithThisRadical = new Set(data.radicalToKanji[radical] || []);

      // Remove kanji that don't contain this radical
      for (const kanji of kanjiSet) {
        if (!kanjiWithThisRadical.has(kanji)) {
          kanjiSet.delete(kanji);
        }
      }
    }

    return Array.from(kanjiSet);
  };

  /**
   * Check if a kanji can be formed from the given radicals
   * @param kanji The kanji to check
   * @param radicals Array of radical characters
   * @returns Boolean indicating if the kanji can be formed
   */
  const canFormKanji = (kanji: string, radicals: string[]): boolean => {
    if (!data) return false;

    // Get the required radicals for this kanji
    const requiredRadicals = data.kanjiToRadicals[kanji] || [];
    
    // Check if all required radicals are in the provided radicals array
    return requiredRadicals.every(radical => radicals.includes(radical));
  };

  /**
   * Get all radicals required to form a specific kanji
   * @param kanji The kanji character
   * @returns Array of required radical characters
   */
  const getRequiredRadicals = (kanji: string): string[] => {
    if (!data) return [];
    return data.kanjiToRadicals[kanji] || [];
  };

  /**
   * Get all available base radicals (those that aren't composed of other radicals)
   * @returns Array of base radical characters
   */
  const getBaseRadicals = (): string[] => {
    if (!data) return [];
    
    return Object.entries(data.radicalDecomposition)
      .filter(entry => entry[1].length === 0)
      .map(entry => entry[0]);
  };

  return {
    data,
    loading,
    error,
    findPossibleKanji,
    canFormKanji,
    getRequiredRadicals,
    getBaseRadicals
  };
} 