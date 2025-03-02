"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import DexGrid from "@/components/DexGrid";
import GameNav from "@/components/GameNav";
import { supabase } from '@/lib/supabase';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Import sorted radicals
import sortedRadicals from '../../../sorted-radicals.json';

interface KanjiData {
  id: string;
  kanji: string;
  dex_number: number;
  meanings: string[];
  on_reading?: string[];
  kun_reading?: string[];
}

interface RadicalData {
  id: string;
  dex_number: number;
  radical_number: number;
  radical_shape: string;
  english_name: string;
  stroke_count: number;
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
    id: string;
    dex_number: number;
    kanji: string;
    meanings: string[];
  };
}

interface KanjiDetails {
  id: string;
  kanji: string;
  dex_number: number;
  meanings: string[];
  on_reading?: string[];
  kun_reading?: string[];
}

interface UserAuth {
  id: string;
  email?: string;
}

export default function DexPage() {
  const [kanjiData, setKanjiData] = useState<KanjiData[]>([]);
  const [radicalData, setRadicalData] = useState<RadicalData[]>([]);
  const [unlockedKanjiNumbers, setUnlockedKanjiNumbers] = useState<Set<number>>(new Set());
  const [unlockedKanjiDetails, setUnlockedKanjiDetails] = useState<Map<number, {kanji: string, meanings: string[]}>>(new Map());
  const [unlockedRadicalCount, setUnlockedRadicalCount] = useState(10); // Start with 10 base radicals
  const [loading, setLoading] = useState(true);
  // We are using user indirectly in the code, removing the linter warning with a comment
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<UserAuth | null>(null);
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  // Add state for kanji details dialog
  // This state is used elsewhere in event handlers
  const [kanjiDetails, setKanjiDetails] = useState<KanjiDetails | null>(null);
  const [isKanjiDetailsOpen, setIsKanjiDetailsOpen] = useState(false);
  const [loadingKanjiDetails, setLoadingKanjiDetails] = useState(false);

  // Add a new state to store the actual maximum dex number
  const [maxAvailableDexNumber, setMaxAvailableDexNumber] = useState(6355);

  // Add a state for available kanji indices
  const [availableKanjiIndices, setAvailableKanjiIndices] = useState<number[]>([]);

  // Add notification state
  const [notifications, setNotifications] = useState<{
    id: string;
    message: string;
    type: 'success' | 'info';
  }[]>([]);

  // Track shown error messages to prevent duplicates
  const [shownErrorMessages, setShownErrorMessages] = useState<Set<string>>(new Set());

  // Function to add notifications
  const addNotification = useCallback((message: string, type: 'success' | 'info' = 'info') => {
    // Check if this error message has already been shown
    if (type === 'info' && shownErrorMessages.has(message)) {
      return; // Skip duplicate error messages
    }
    
    const newNotification = {
      id: Date.now().toString(),
      message,
      type,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // For error messages, track that we've shown this message
    if (type === 'info') {
      setShownErrorMessages(prev => new Set(prev).add(message));
    }
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, [shownErrorMessages]);

  // Convert unlocked numbers to DexItems with kanji data
  const unlockedKanjiItems = useMemo<DexItem[]>(() => {
    return Array.from(unlockedKanjiNumbers).map(dexNumber => {
      // First try to get data from unlockedKanjiDetails, which has more reliable data from user_kanji join
      const detailedEntry = unlockedKanjiDetails.get(dexNumber);
      if (detailedEntry) {
        return {
          index: dexNumber,
          unlocked: true,
          character: detailedEntry.kanji,
          meaning: detailedEntry.meanings[0] || ''
        };
      }
      
      // Fall back to kanjiData if for some reason we don't have the detailed entry
      const kanjiEntry = kanjiData.find(k => k.dex_number === dexNumber);
      return {
        index: dexNumber,
        unlocked: true,
        character: kanjiEntry?.kanji || '',
        meaning: kanjiEntry?.meanings?.[0] || ''
      };
    });
  }, [unlockedKanjiNumbers, unlockedKanjiDetails, kanjiData]);

  // Create unlocked radical items based on user's progress
  const unlockedRadicalItems = useMemo<DexItem[]>(() => {
    if (radicalData.length === 0) return [];

    // First determine which radical shapes the user has unlocked
    const unlockedRadicalShapes = sortedRadicals.slice(0, unlockedRadicalCount);
    
    // Create a map of radical shapes to their data for quick lookup
    const radicalShapeMap = new Map(
      radicalData.map(radical => [radical.radical_shape, radical])
    );
    
    // Log any missing radicals for debugging
    if (unlockedRadicalShapes.length > 0) {
      const missingRadicals = unlockedRadicalShapes.filter(
        shape => !radicalShapeMap.has(shape)
      );
      if (missingRadicals.length > 0) {
        console.warn('Radicals not found in database:', missingRadicals);
      }
    }
    
    // Generate items for each unlocked radical
    return unlockedRadicalShapes
      .map(radicalShape => {
        const radical = radicalShapeMap.get(radicalShape);
        
        if (!radical) {
          // Skip radicals not found in the database
          return null;
        }
        
        return {
          index: radical.dex_number, // Use the dex_number from the database
          unlocked: true,
          character: radical.radical_shape,
          meaning: radical.english_name
        };
      })
      .filter(Boolean) as DexItem[]; // Filter out null entries
  }, [unlockedRadicalCount, radicalData]);

  // Load user's discovered kanji from Supabase
  const loadUserKanji = async (userId: string) => {
    try {
      console.log('----- DEX PAGE LOAD USER KANJI START -----');
      console.log('Loading user kanji for user:', userId);
      
      // Parameters for retry logic
      const maxRetries = 3;
      const initialDelay = 1000; // 1 second before first retry
      let retries = 0;
      let error = null;
      let userKanjiData = null;
      
      // Retry loop with backoff strategy
      while (retries <= maxRetries && !userKanjiData) {
        try {
          if (retries > 0) {
            console.log(`Attempt ${retries}/${maxRetries} - Retrying user kanji data fetch...`);
          }
          
          const { data, error: fetchError } = await supabase
            .from('user_kanji')
            .select(`
              kanji_id,
              kanji_dex!inner (
                id,
                dex_number,
                kanji,
                meanings
              )
            `)
            .eq('user_id', userId)
            .returns<UserKanjiResponse[]>();
          
          if (fetchError) {
            error = fetchError;
            console.error(`Attempt ${retries + 1}/${maxRetries + 1} - Error loading user kanji:`, fetchError);
            retries++;
            
            if (retries <= maxRetries) {
              const delay = initialDelay * retries;
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            userKanjiData = data;
            console.log('Successfully loaded user kanji data');
            break;
          }
        } catch (unexpectedError) {
          console.error(`Unexpected error during user kanji fetch:`, unexpectedError);
          retries++;
          
          if (retries <= maxRetries) {
            const delay = initialDelay * retries;
            console.log(`Retrying after error in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            error = unexpectedError;
          }
        }
      }
      
      // If all retries failed, handle the error
      if (error) {
        console.error('Error loading user kanji after all retries:', error);
        addNotification('Error loading your Kanji Collection. Please check your internet connection and try again.', 'info');
        console.log('----- DEX PAGE LOAD USER KANJI END -----');
        return;
      }
      
      console.log('Loaded user kanji data:', userKanjiData);
      
      if (!userKanjiData || userKanjiData.length === 0) {
        console.log('No user kanji data found');
        setUnlockedKanjiNumbers(new Set());
        setUnlockedKanjiDetails(new Map());
        setUnlockedRadicalCount(10); // Reset to base radicals
        console.log('----- DEX PAGE LOAD USER KANJI END -----');
        return;
      }

      // Set unlocked dex numbers
      const unlockedDexNumbers = new Set(
        userKanjiData.map(row => row.kanji_dex.dex_number)
      );
      
      // Create detailed map of unlocked kanji data
      const detailsMap = new Map();
      userKanjiData.forEach(row => {
        detailsMap.set(row.kanji_dex.dex_number, {
          kanji: row.kanji_dex.kanji,
          meanings: Array.isArray(row.kanji_dex.meanings) ? row.kanji_dex.meanings : []
        });
      });
      
      // Calculate unlocked radicals (10 base + 1 per 10 kanji)
      const kanjiCount = userKanjiData.length;
      const unlockedRadicals = 10 + Math.floor(kanjiCount / 10);
      
      console.log('Unlocked dex numbers:', Array.from(unlockedDexNumbers));
      console.log('Unlocked details map:', Object.fromEntries(detailsMap));
      console.log('User has', kanjiCount, 'kanji, unlocking', unlockedRadicals, 'radicals');
      
      setUnlockedKanjiNumbers(unlockedDexNumbers);
      setUnlockedKanjiDetails(detailsMap);
      setUnlockedRadicalCount(unlockedRadicals);
      console.log('----- DEX PAGE LOAD USER KANJI END -----');
    } catch (error) {
      console.error('Error in loadUserKanji:', error);
      console.log('----- DEX PAGE LOAD USER KANJI END -----');
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('----- DEX PAGE AUTH CHECK START -----');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Dex page auth check - session:', session ? 'Found session' : 'No session');
        if (session?.user) {
          console.log('Dex page - user authenticated:', {
            id: session.user.id,
            email: session.user.email
          });
        }
        setUser(session?.user || null);

        if (session?.user) {
          console.log('Dex page - loading kanji for user ID:', session.user.id);
          await loadUserKanji(session.user.id);
        }

        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Dex page - auth state changed, session:', session ? 'Active' : 'None');
            
            // Store previous user before updating state
            const previousUser = user;
            const currentUser = session?.user || null;
            
            console.log('Previous user:', previousUser ? `ID: ${previousUser?.id}` : 'null');
            console.log('Current user:', currentUser ? `ID: ${currentUser.id}` : 'null');
            
            // Only update user state if it actually changed
            if (previousUser?.id !== currentUser?.id) {
              setUser(currentUser);
              
              // Only load kanji if we have a new user and they're different from the previous user
              if (currentUser && previousUser?.id !== currentUser.id) {
                console.log('Dex page - auth changed, loading kanji for user ID:', currentUser.id);
                await loadUserKanji(currentUser.id);
              } else if (!currentUser) {
                console.log('Dex page - user logged out, clearing unlocked kanji');
                setUnlockedKanjiNumbers(new Set()); // Clear unlocked kanji when user logs out
                setUnlockedKanjiDetails(new Map()); // Also clear the details map
                setUnlockedRadicalCount(10); // Reset to base radicals for non-logged in users
              }
            } else {
              console.log('Dex page - same user, not reloading kanji data');
            }
          }
        );
        console.log('----- DEX PAGE AUTH CHECK END -----');

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth state in Dex page:', error);
      }
    };

    checkUser();
  }, []);

  // Load kanji data
  useEffect(() => {
    const loadKanjiData = async () => {
      try {
        console.log('Loading all kanji data from kanji_dex');
        
        // Use pagination to load all kanji data
        let allKanjiData: any[] = [];
        let page = 0;
        const pageSize = 1000; // Load in chunks of 1000
        let hasMore = true;
        let loadingErrors = 0;
        const maxRetries = 3;
        
        while (hasMore && loadingErrors < maxRetries) {
          try {
            console.log(`Loading kanji data page ${page + 1}, offset: ${page * pageSize}`);
            
            const { data, error } = await supabase
              .from('kanji_dex')
              .select('*')
              .order('dex_number')
              .range(page * pageSize, (page + 1) * pageSize - 1);
              
            if (error) {
              console.error(`Error fetching kanji data page ${page + 1}:`, error);
              loadingErrors++;
              
              if (loadingErrors >= maxRetries) {
                console.error(`Too many errors (${loadingErrors}). Stopping data load.`);
                break;
              }
              
              // Wait a little before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            
            if (!data || data.length === 0) {
              console.log(`No more kanji data to load after page ${page}`);
              hasMore = false;
              break;
            }
            
            console.log(`Loaded ${data.length} kanji entries from page ${page + 1}`);
            allKanjiData = [...allKanjiData, ...data];
            
            // Reset error counter after successful load
            loadingErrors = 0;
            
            // Check if we got a full page
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } catch (e) {
            console.error(`Unexpected error loading page ${page + 1}:`, e);
            loadingErrors++;
            
            if (loadingErrors >= maxRetries) {
              console.error(`Too many unexpected errors (${loadingErrors}). Stopping data load.`);
              break;
            }
            
            // Wait a little before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Even if we had errors, proceed with what we have if we got some data
        if (allKanjiData.length === 0) {
          console.error('No kanji data returned from the database');
          return;
        }

        // Log statistics about the data
        console.log(`Loaded ${allKanjiData.length} total kanji entries from database`);
        
        // Check if we have expected number of kanji (should be around 6355)
        if (allKanjiData.length < 6000) {
          console.warn(`Only loaded ${allKanjiData.length} kanji, expected around 6355`);
          
          // Try a second approach - get kanji with specific high dex numbers to verify they exist
          const highIndexesToCheck = [800, 900, 1000, 1200, 1500, 2000, 3000, 4000, 5000];
          console.log(`Checking for specific high dex numbers: ${highIndexesToCheck.join(', ')}`);
          
          for (const index of highIndexesToCheck) {
            const { data, error } = await supabase
              .from('kanji_dex')
              .select('dex_number, kanji')
              .eq('dex_number', index)
              .single();
              
            if (error) {
              console.log(`No kanji found with dex_number = ${index}`);
            } else if (data) {
              console.log(`Found kanji with dex_number = ${index}: ${data.kanji}`);
              // Add to our data if it's not already there
              if (!allKanjiData.some(k => k.dex_number === index)) {
                allKanjiData.push(data);
              }
            }
          }
        }
        
        // Check for any kanji with high dex numbers
        const highIndexKanji = allKanjiData.filter(k => k.dex_number > 800);
        console.log(`Found ${highIndexKanji.length} kanji with dex_number > 800`);
        
        // Sample a few high index kanji to verify data quality
        if (highIndexKanji.length > 0) {
          const samples = highIndexKanji.slice(0, 5);
          console.log('Sample high index kanji:', samples.map(k => ({ 
            dex: k.dex_number, 
            kanji: k.kanji,
            meaningCount: Array.isArray(k.meanings) ? k.meanings.length : 0
          })));
        }

        // Ensure meanings is always an array
        const processedData = allKanjiData.map(k => ({
          ...k,
          meanings: Array.isArray(k.meanings) ? k.meanings : []
        }));

        setKanjiData(processedData);
        console.log('Successfully processed all kanji data, total count:', processedData.length);
      } catch (error) {
        console.error('Error loading kanji data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKanjiData();
  }, []);
  
  // Load radical data
  useEffect(() => {
    const loadRadicalData = async () => {
      try {
        console.log('Loading radical data from radical_dex');
        const { data, error } = await supabase
          .from('radical_dex')
          .select('*')
          .order('dex_number');

        if (error) {
          console.error('Error fetching radical data:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.error('No radical data returned from the database');
          return;
        }

        setRadicalData(data);
        console.log('Loaded radical data, total count:', data.length);
      } catch (error) {
        console.error('Error loading radical data:', error);
      }
    };

    loadRadicalData();
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

  // Debug logging for unlockedRadicalItems
  useEffect(() => {
    if (unlockedRadicalCount > 0 && radicalData.length > 0) {
      console.log('Creating unlockedRadicalItems...');
      console.log('Total radical data available:', radicalData.length);
      console.log('Unlocked radical count:', unlockedRadicalCount);
      
      // Check if we can find each unlocked radical in the data
      const unlockedRadicalShapes = sortedRadicals.slice(0, unlockedRadicalCount);
      unlockedRadicalShapes.forEach(radicalShape => {
        const found = radicalData.find(r => r.radical_shape === radicalShape);
        if (!found) {
          console.warn(`Could not find radical data for shape ${radicalShape}`);
        } else {
          console.log(`Found radical ${radicalShape}:`, found);
        }
      });
    }
  }, [unlockedRadicalCount, radicalData]);

  // Update the useEffect to store available indices
  useEffect(() => {
    // Check if kanjiData is loaded
    if (kanjiData.length > 0) {
      // Get all dex numbers that exist in our data
      const indices = kanjiData.map(k => k.dex_number).sort((a, b) => a - b);
      setAvailableKanjiIndices(indices);
      
      // Get the highest dex number we have data for
      const maxDexNumber = indices[indices.length - 1];
      setMaxAvailableDexNumber(maxDexNumber);
      
      // If we're showing more kanji than we have data for, log a warning
      if (maxDexNumber < 6355) {
        console.warn(`Data inconsistency detected: Total dex slots would be 6355, but highest dex number in data is ${maxDexNumber}`);
        console.log(`Total kanji available in database: ${indices.length}`);
        
        // Check for gaps in indices
        let gapCount = 0;
        for (let i = 1; i < indices.length && gapCount < 5; i++) {
          if (indices[i] - indices[i-1] > 1) {
            console.log(`Gap found between indices: ${indices[i-1]} and ${indices[i]}`);
            gapCount++;
          }
        }
        
        // Log the distribution of indices to help diagnose the issue
        const buckets = [0, 100, 200, 500, 800, 1000, 1500, 2000, 3000, 6355];
        for (let i = 1; i < buckets.length; i++) {
          const count = indices.filter(idx => idx > buckets[i-1] && idx <= buckets[i]).length;
          console.log(`Kanji with indices ${buckets[i-1]}+1 to ${buckets[i]}: ${count}`);
        }
      }
    }
  }, [kanjiData]);
  
  // Create kanji items for the grid based on available indices
  const kanjiGridItems = useMemo<DexItem[]>(() => {
    // If we're in show only unlocked mode, return unlockedKanjiItems
    if (showOnlyUnlocked) {
      return unlockedKanjiItems;
    }
    
    // Otherwise, create items for each available index
    return availableKanjiIndices.map(index => {
      // Check if this index is unlocked
      const isUnlocked = unlockedKanjiNumbers.has(index);
      
      if (isUnlocked) {
        // If unlocked, get data from unlocked items
        const unlockedItem = unlockedKanjiItems.find(item => item.index === index);
        if (unlockedItem) {
          return unlockedItem;
        }
      }
      
      // Get data from kanjiData
      const kanjiEntry = kanjiData.find(k => k.dex_number === index);
      
      return {
        index,
        unlocked: isUnlocked,
        character: isUnlocked && kanjiEntry?.kanji ? kanjiEntry.kanji : '',
        meaning: isUnlocked && kanjiEntry?.meanings?.[0] ? kanjiEntry.meanings[0] : ''
      };
    });
  }, [availableKanjiIndices, unlockedKanjiItems, unlockedKanjiNumbers, kanjiData, showOnlyUnlocked]);

  // Helper function to validate and process kanji data
  const validateKanjiData = (data: any) => {
    if (!data) return null;
    
    return {
      ...data,
      // Ensure meanings is an array
      meanings: Array.isArray(data.meanings) ? data.meanings : [],
      // Ensure on_reading and kun_reading are arrays if they exist
      on_reading: data.on_reading ? 
        (Array.isArray(data.on_reading) ? data.on_reading : []) : [],
      kun_reading: data.kun_reading ? 
        (Array.isArray(data.kun_reading) ? data.kun_reading : []) : []
    };
  };

  // Add function to fetch kanji details
  const fetchKanjiDetails = async (kanji: string) => {
    if (!kanji) return;
    
    console.log('Fetching details for kanji:', kanji, 'Character code:', kanji.charCodeAt(0));
    setLoadingKanjiDetails(true);
    
    try {
      // First try to get the kanji details from our already loaded kanjiData
      const kanjiFromMemory = kanjiData.find(k => k.kanji === kanji);
      console.log('Kanji found in memory?', !!kanjiFromMemory, kanjiFromMemory ? kanjiFromMemory.dex_number : 'N/A');
      
      const { data, error } = await supabase
        .from('kanji_dex')
        .select('id, kanji, dex_number, meanings, on_reading, kun_reading')
        .eq('kanji', kanji)
        .single();
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Error fetching kanji details:', error);
        
        // If we couldn't get it from Supabase but have it in memory, use that
        if (kanjiFromMemory) {
          console.log('Using in-memory data as fallback for kanji:', kanji);
          const processedData = validateKanjiData(kanjiFromMemory);
          setKanjiDetails(processedData);
          setIsKanjiDetailsOpen(true);
        } else {
          console.error('Could not find kanji data anywhere:', kanji);
        }
        return;
      }
      
      // Process data to ensure consistent format
      const processedData = validateKanjiData(data);
      setKanjiDetails(processedData);
      setIsKanjiDetailsOpen(true);
    } catch (error) {
      console.error('Unexpected error fetching kanji details:', error);
    } finally {
      setLoadingKanjiDetails(false);
    }
  };

  // Handle closing the dialog
  const handleCloseKanjiDetails = () => {
    setIsKanjiDetailsOpen(false);
    setTimeout(() => {
      setKanjiDetails(null);
    }, 300);
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

  // Prevent body scrolling when on this page
  useEffect(() => {
    // Save the original style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // Set body to not scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Add a helper function to fetch kanji by dex number
  const fetchKanjiByDexNumber = async (dexNumber: number) => {
    console.log('Attempting to fetch kanji by dex number:', dexNumber);
    
    // First try to find it in our cached data
    const kanjiFromMemory = kanjiData.find(k => k.dex_number === dexNumber);
    if (kanjiFromMemory) {
      console.log('Found kanji in memory for dex number:', dexNumber, kanjiFromMemory);
      
      // Process the data to ensure it has all required fields
      const processedKanji = {
        ...kanjiFromMemory,
        // Ensure meanings is an array
        meanings: Array.isArray(kanjiFromMemory.meanings) ? kanjiFromMemory.meanings : [],
        // Ensure on_reading and kun_reading are arrays if they exist
        on_reading: kanjiFromMemory.on_reading ? 
          (Array.isArray(kanjiFromMemory.on_reading) ? kanjiFromMemory.on_reading : []) : undefined,
        kun_reading: kanjiFromMemory.kun_reading ? 
          (Array.isArray(kanjiFromMemory.kun_reading) ? kanjiFromMemory.kun_reading : []) : undefined
      };
      
      console.log('Using processed in-memory kanji data:', processedKanji);
      setKanjiDetails(processedKanji);
      setIsKanjiDetailsOpen(true);
      return processedKanji;
    }
    
    // If not in memory, try to fetch from the database directly
    try {
      console.log('Kanji not found in memory, trying database for dex number:', dexNumber);
      const { data, error } = await supabase
        .from('kanji_dex')
        .select('id, kanji, dex_number, meanings, on_reading, kun_reading')
        .eq('dex_number', dexNumber)
        .single();
      
      if (error) {
        console.error('Error fetching kanji by dex number:', error);
        return null;
      }
      
      if (data) {
        console.log('Found kanji in database for dex number:', dexNumber, data);
        
        // Process the data to ensure it has all required fields
        const processedKanji = {
          ...data,
          // Ensure meanings is an array
          meanings: Array.isArray(data.meanings) ? data.meanings : [],
          // Ensure on_reading and kun_reading are arrays if they exist
          on_reading: data.on_reading ? 
            (Array.isArray(data.on_reading) ? data.on_reading : []) : undefined,
          kun_reading: data.kun_reading ? 
            (Array.isArray(data.kun_reading) ? data.kun_reading : []) : undefined
        };
        
        console.log('Using processed database kanji data:', processedKanji);
        setKanjiDetails(processedKanji);
        setIsKanjiDetailsOpen(true);
        return processedKanji;
      } else {
        console.warn(`No kanji found with dex_number = ${dexNumber} in database`);
      }
    } catch (error) {
      console.error('Unexpected error fetching kanji by dex number:', error);
    }
    
    // If we get here, we couldn't find the kanji
    console.warn(`Could not find kanji with dex_number = ${dexNumber} anywhere`);
    return null;
  };

  // Update the onItemClick handler to use the new function when needed
  const handleKanjiClick = async (index: number) => {
    console.log('DexGrid item clicked:', index);
    
    // Skip invalid indices
    if (index <= 0 || index > maxAvailableDexNumber) {
      console.warn(`Clicked on invalid kanji index: ${index}. Valid range is 1-${maxAvailableDexNumber}`);
      return;
    }
    
    // Check if this index is in our available indices list
    if (!availableKanjiIndices.includes(index)) {
      console.warn(`Clicked on kanji index ${index} which is not in our available indices list`);
      // Try to fetch by dex number directly as a fallback
      const fetchedKanji = await fetchKanjiByDexNumber(index);
      if (fetchedKanji) {
        console.log(`Successfully fetched and displayed kanji with dex number ${index}: ${fetchedKanji.kanji}`);
      } else {
        console.error(`Failed to fetch kanji with dex number ${index}`);
      }
      return;
    }
    
    // Find the kanji data for this index
    const kanjiItem = kanjiData.find(k => k.dex_number === index);
    if (kanjiItem?.kanji) {
      console.log('Found kanji data:', kanjiItem);
      fetchKanjiDetails(kanjiItem.kanji);
    } else {
      console.error('Could not find kanji data for index:', index);
      // This should be rare since we've already checked availableKanjiIndices
      console.log('Available kanji indices count:', availableKanjiIndices.length);
      
      // Try to fetch by dex number directly as a fallback
      console.log('Trying to fetch by dex number as fallback');
      const fetchedKanji = await fetchKanjiByDexNumber(index);
      if (fetchedKanji) {
        console.log(`Successfully fetched and displayed kanji with dex number ${index}: ${fetchedKanji.kanji}`);
      } else {
        console.error(`Failed to fetch kanji with dex number ${index}`);
        
        // If we're in development, give info about highest and lowest indices
        if (process.env.NODE_ENV === 'development') {
          const indices = kanjiData.map(k => k.dex_number).sort((a, b) => a - b);
          if (indices.length > 0) {
            console.log('Min index:', indices[0], 'Max index:', indices[indices.length - 1]);
            // Check if there are any gaps in the sequence
            let gapCount = 0;
            for (let i = 1; i < indices.length && gapCount < 5; i++) {
              if (indices[i] - indices[i-1] > 1) {
                console.log('Gap found between indices:', indices[i-1], 'and', indices[i]);
                gapCount++;
              }
            }
          }
        }
      }
    }
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
    <div className="flex flex-col w-full h-screen bg-[#F2E8DC] dark:bg-[#38332E] overflow-hidden">
      <GameNav />
      
      {/* Add Kanji Details Dialog */}
      <Dialog 
        open={isKanjiDetailsOpen} 
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange triggered, new state:', open);
          setIsKanjiDetailsOpen(open);
          if (!open) {
            handleCloseKanjiDetails();
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px] bg-stone-50/95 dark:bg-stone-800/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-black dark:text-white">
              Kanji Details
            </DialogTitle>
          </DialogHeader>
          
          {loadingKanjiDetails ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#78B693] border-t-transparent rounded-full"></div>
            </div>
          ) : kanjiDetails ? (
            <div className="py-4 space-y-6">
              {/* Kanji character - large and centered */}
              <div className="text-center">
                <div className="text-7xl font-bold mb-2 text-[#78B693] dark:text-[#78B693]">
                  {kanjiDetails.kanji}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  #{kanjiDetails.dex_number}
                </div>
              </div>
              
              {/* Meanings */}
              <div className="space-y-2">
                <h3 className="font-semibold text-black dark:text-white">Meanings</h3>
                <div className="flex flex-wrap gap-2">
                  {kanjiDetails.meanings.map((meaning, index) => (
                    <span key={index} className="px-2 py-1 bg-[#78B693]/20 rounded-md text-sm">
                      {meaning}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* On readings */}
              {kanjiDetails.on_reading && kanjiDetails.on_reading.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-black dark:text-white">On Reading</h3>
                  <div className="flex flex-wrap gap-2">
                    {kanjiDetails.on_reading.map((reading, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 rounded-md text-sm">
                        {reading}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Kun readings */}
              {kanjiDetails.kun_reading && kanjiDetails.kun_reading.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-black dark:text-white">Kun Reading</h3>
                  <div className="flex flex-wrap gap-2">
                    {kanjiDetails.kun_reading.map((reading, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 rounded-md text-sm">
                        {reading}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <h1 className="text-3xl font-bold mt-4 mb-6 text-center">KanjiDex</h1>
      
      {!user && (
        <div className="mx-auto mb-6 max-w-2xl">
          <div className="bg-amber-100 dark:bg-amber-900 border-l-4 border-amber-500 text-amber-700 dark:text-amber-200 p-4 rounded shadow-md">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>You must be signed in to view your kanji collection. Sign in to track your progress and unlock new kanji!</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 lg:px-8 pb-1 overflow-hidden">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-auto h-[calc(100vh-10rem)] p-6 order-1 lg:order-1 w-full lg:w-[20%]">
          <DexGrid 
            title="部首図鑑" 
            totalItems={showOnlyUnlocked ? unlockedRadicalItems.length : Math.max(...radicalData.map(r => r.dex_number), 0)}
            unlockedItems={unlockedRadicalItems}
            onItemClick={(index) => {
              console.log('Radical clicked:', index);
              // Find the radical data for this index
              const radicalItem = radicalData.find(r => r.dex_number === index);
              if (radicalItem?.radical_shape) {
                console.log('Found radical data:', radicalItem);
                fetchKanjiDetails(radicalItem.radical_shape);
              }
            }}
            showOnlyUnlocked={showOnlyUnlocked}
          />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-[calc(100vh-10rem)] p-6 order-2 lg:order-2 w-full lg:w-[80%] overflow-hidden flex flex-col">
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
          <div className="flex-1 overflow-hidden">
            <DexGrid 
              title="" 
              totalItems={showOnlyUnlocked ? unlockedKanjiItems.length : kanjiGridItems.length} 
              unlockedItems={unlockedKanjiItems}
              onItemClick={handleKanjiClick}
              showOnlyUnlocked={showOnlyUnlocked}
            />
          </div>
        </div>
      </div>

      {!isKanjiDetailsOpen && (
        <div 
          className="fixed bottom-4 right-4 cursor-pointer" 
          onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
        >
          <Switch 
            checked={showOnlyUnlocked} 
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-green-500"
          />
          <span className="text-sm ml-2 text-gray-600 dark:text-gray-400">
            {showOnlyUnlocked ? "Showing unlocked only" : "Showing all"}
          </span>
        </div>
      )}
      
      {/* Notifications */}
      <div className="fixed top-20 right-6 flex flex-col items-end space-y-2 max-w-xs z-50">
        {notifications.map((notification) => {
          const itemKey = `notification-${notification.id}`;
          const bgColorClass = notification.type === 'success' 
            ? 'bg-green-500 dark:bg-green-700' 
            : 'bg-[#78B693]/80 dark:bg-[#78B693]/80';
          
          return (
            <div 
              key={itemKey}
              className={`px-4 py-2 rounded-lg shadow-lg text-white flex items-center justify-between w-full
                ${bgColorClass} animate-in slide-in-from-right-5 duration-300`}
            >
              <div className="flex items-center gap-2">
                <span>{notification.message}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                }}
                className="ml-2 text-white hover:text-gray-200"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
} 