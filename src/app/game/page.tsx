'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SignInForm } from '@/components/SignInForm';
import { SignupForm } from '@/components/SignupForm';
import { supabase, restartSupabaseConnection, checkSupabaseHealth } from '@/lib/supabase';
import { LogOut, Info, X, Trash2 } from 'lucide-react';
import { useKanjiRadicals } from '@/hooks/useKanjiRadicals';
import { ThemeToggle } from '@/components/ThemeToggle';
import GameNav from '@/components/GameNav';
import { AuthStateListener } from '@/components/AuthStateListener';
import './animations.css';
import { useSearchParams, useRouter } from 'next/navigation';

// Types for game elements
interface ElementPosition {
  x: number;
  y: number;
}

interface GameElement {
  id: string;
  type: 'radical' | 'kanji';
  char: string;
  position: ElementPosition;
  isDragging: boolean;
  touchingElements: Set<string>; // IDs of elements this element is touching
  className?: string; // Optional class name for animations
  meaning?: string; // Optional meaning to display
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info';
  kanji?: string;
}

interface KanjiRadicalsData {
  radicalToKanji: Record<string, string[]>;
  kanjiToRadicals: Record<string, string[]>;
}

// Add an interface for sorted radicals
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SortedRadicalsData {
  sortedRadicals: string[];
}

// Add a new interface for KanjiDetails
interface KanjiDetails {
  id: string;
  kanji: string;
  dex_number: number;
  meanings: string[];
  on_reading?: string[];
  kun_reading?: string[];
}

// Interface for user authentication
interface UserAuth {
  id: string;
  email?: string;
}

// Add the interface for user kanji responses from Supabase
interface UserKanjiResponse {
  kanji_id: string;
  kanji_dex: {
    id: string;
    dex_number: number;
    kanji: string;
    meanings: string[];
  };
}

// Add interface for Supabase errors
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

// Create a ClientSide component that safely uses useSearchParams
function GamePageClient() {
  // Use the supabase client from imports, not a new instance
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Game state
  const { data: kanjiData, loading: loadingGameData } = useKanjiRadicals();
  
  // Constants and refs
  const DISCOVERY_COOLDOWN = 10000; // 10 seconds cooldown between same kanji discoveries
  // Track recently discovered kanji to prevent duplicates using a ref
  const recentDiscoveriesRef = useRef<Map<string, number>>(new Map());
  
  // Add dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Add notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Add loading states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    lastChecked: Date | null;
  }>({
    connected: true,
    message: "",
    lastChecked: null
  });
  
  // Add kanji discovery tracking state
  const [discoveredKanji, setDiscoveredKanji] = useState<Set<string>>(new Set());
  const [userKanjiCount, setUserKanjiCount] = useState(0);
  const [isLoadingUserKanji, setIsLoadingUserKanji] = useState(false);
  const [unlockedRadicalCount, setUnlockedRadicalCount] = useState(10); // Start with 10 radicals
  
  // Add state for kanji and radical meanings
  const [kanjiMeanings, setKanjiMeanings] = useState<Record<string, string[]>>({});
  const [radicalMeanings, setRadicalMeanings] = useState<Record<string, string>>({});
  
  // Add supabase kanji state
  const [supabaseKanji, setSupabaseKanji] = useState<string[]>([]);
  
  // Add user state
  const [user, setUser] = useState<UserAuth | null>(null);
  
  // Add state for tracking if we've synced kanji
  const [hasSyncedKanji, setHasSyncedKanji] = useState(false);
  
  // Auth state
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Use a ref to store the current user ID to avoid closure issues with the auth listener
  const currentUserIdRef = useRef<string | null>(null);
  
  // Use a ref to track if we've shown an error notification in this session
  const hasShownErrorRef = useRef<boolean>(false);
  
  const [elements, setElements] = useState<GameElement[]>([]);
  
  // Game instruction dialog
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Add state for showing kanji/radical meanings
  const [showMeanings, setShowMeanings] = useState(false);
  
  // Tracking drag state
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [sidebarDragging, setSidebarDragging] = useState(false);
  const [sidebarDraggedChar, setSidebarDraggedChar] = useState('');
  
  // Touchscreen support
  const [touchSupport, setTouchSupport] = useState(false);
  const touchOffsetRef = useRef({ x: 0, y: 0 });
  
  // Add state for tracking trash can hover
  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashCanRef = useRef<HTMLDivElement>(null);
  
  // Add a state for first-time tutorial
  const [showTutorialCue, setShowTutorialCue] = useState(false);
  
  // Add this to the existing game state variables
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Add state for tracking which elements are being hovered
  const [hoveredElements, setHoveredElements] = useState<Set<string>>(new Set());
  
  // Add a state to track connections between elements
  const [connections, setConnections] = useState<{from: string, to: string}[]>([]);
  
  // Add state for unlocked radicals
  const [sortedRadicals, setSortedRadicals] = useState<string[]>([]);
  
  // Add a debounce map to track recent discoveries
  
  // Add state for kanji details dialog
  const [selectedKanji, setSelectedKanji] = useState<string | null>(null);
  const [kanjiDetails, setKanjiDetails] = useState<KanjiDetails | null>(null);
  const [isKanjiDetailsOpen, setIsKanjiDetailsOpen] = useState(false);
  const [loadingKanjiDetails, setLoadingKanjiDetails] = useState(false);
  
  // Add this state declaration near the other useState hooks
  const [lastAddedElementId, setLastAddedElementId] = useState<string | null>(null);
  
  // Reference to the game area
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // Drag offset for positioning elements
  const dragOffset = { x: 0, y: 0 };
  const setDragOffset = (offset: { x: number, y: number }) => {
    dragOffset.x = offset.x;
    dragOffset.y = offset.y;
  };

  // Detect dark mode
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for dark class on html element (for Tailwind dark mode)
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                   darkModeMediaQuery.matches;
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();
    
    // Set up listeners
    const htmlClassObserver = new MutationObserver(checkDarkMode);
    htmlClassObserver.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    darkModeMediaQuery.addEventListener('change', checkDarkMode);
    
    return () => {
      htmlClassObserver.disconnect();
      darkModeMediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);
  
  // Lock scrolling on the page
  useEffect(() => {
    // Save the original body style
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    const originalPosition = document.body.style.position;
    
    // Lock scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    // Restore original style on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }, []);
  
  // Hide tutorial cue after 10 seconds
  useEffect(() => {
    if (showTutorialCue) {
      const timer = setTimeout(() => {
        setShowTutorialCue(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showTutorialCue]);
  
  // Initialize the game with all available radicals
  useEffect(() => {
    if (!kanjiData || loadingGameData) return;
    
    // Get all basic radicals (those that appear as keys in radicalToKanji)
    const allRadicals = Object.keys(kanjiData.radicalToKanji);
    
    // Create game elements for each radical
    const initialElements: GameElement[] = allRadicals.map((radical, index) => ({
      id: `radical-${index}-${radical}`,
      type: 'radical',
      char: radical,
      position: { x: 0, y: 0 }, // This will be positioned in the sidebar
      isDragging: false,
      touchingElements: new Set()
    }));
    
    setElements(initialElements);
    
    // Show tip on first load
    addNotification('Drag radicals into the workspace and combine them to discover kanji!', 'info');
  }, [kanjiData, loadingGameData]);

  // Load saved kanji from localStorage when component mounts
  useEffect(() => {
    // Try to load previous discovered kanji from localStorage
    try {
      const savedKanji = localStorage.getItem('jijutsu_discovered_kanji');
      if (savedKanji) {
        // For non-logged in users, load from localStorage
        if (!user) {
          setDiscoveredKanji(new Set(JSON.parse(savedKanji)));
        }
      }
    } catch (error) {
      console.error('Error loading saved kanji:', error);
    }
  }, [user]);

  // Save discovered kanji to localStorage whenever it changes
  useEffect(() => {
    // Only save to localStorage for non-logged in users
    if (!user && discoveredKanji.size > 0) {
      try {
        localStorage.setItem('jijutsu_discovered_kanji', JSON.stringify(Array.from(discoveredKanji)));
      } catch (error) {
        console.error('Error saving kanji:', error);
      }
    }
  }, [discoveredKanji, user]);

  // Load sorted radicals from JSON file
  useEffect(() => {
    // Fetch the sorted radicals JSON
    fetch('/sorted-radicals.json')
      .then(response => response.json())
      .then(data => {
        setSortedRadicals(data);
      })
      .catch(error => {
        console.error('Error loading sorted radicals:', error);
      });
  }, []);

  // Define a custom error type that includes code property
  interface SupabaseError extends Error {
    code?: string;
  }

  // Function to add notifications with better duplicate detection
  const addNotification = useCallback((message: string, type: 'success' | 'info' = 'info', kanji?: string) => {
    // For kanji discovery notifications, use kanji as a unique key
    if (type === 'success' && kanji && message.includes(`You discovered ${kanji}!`)) {
      // First check if we already have this notification
      const isDuplicate = notifications.some(
        notif => notif.type === 'success' && notif.kanji === kanji && 
          notif.message.includes(`You discovered ${kanji}!`)
      );
      
      if (isDuplicate) {
        console.log(`Skipping duplicate kanji discovery notification for ${kanji}`);
        return;
      }
      
      // Also check recent discoveries to avoid duplicate notifications
      const lastDiscoveryTime = recentDiscoveriesRef.current.get(kanji);
      const now = Date.now();
      if (lastDiscoveryTime && (now - lastDiscoveryTime) < DISCOVERY_COOLDOWN) {
        console.log(`Suppressing notification for recently discovered kanji: ${kanji}`);
        return;
      }
      
      // Mark this kanji as recently discovered
      recentDiscoveriesRef.current.set(kanji, now);
    }
    
    // For error messages about loading Kanji collection, only show once per session
    if (type === 'info' && message.includes('Error loading your Kanji Collection')) {
      if (hasShownErrorRef.current) {
        console.log('Suppressing duplicate Kanji Collection error notification');
        return;
      }
      hasShownErrorRef.current = true;
    }
    
    // Also check for duplicate error messages
    if (type === 'info' && !kanji) {
      const isDuplicateError = notifications.some(
        notif => notif.type === 'info' && notif.message === message
      );
      
      if (isDuplicateError) {
        // Skip duplicate error notifications
        return;
      }
    }
    
    // Generate a more specific ID for kanji notifications
    const notificationId = type === 'success' && kanji 
      ? `kanji-${kanji}-${Date.now()}`
      : Date.now().toString();
    
    const newNotification: Notification = {
      id: notificationId,
      message,
      type,
      kanji
    };
    
    // Log notification creation
    console.log(`Creating notification: ${type} - ${message} - ID: ${notificationId}`);
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => {
        // Only remove if the notification still exists
        if (prev.some(n => n.id === notificationId)) {
          console.log(`Auto-removing notification ID: ${notificationId}`);
          return prev.filter(n => n.id !== notificationId);
        }
        return prev;
      });
    }, 5000);
  }, [notifications, DISCOVERY_COOLDOWN]);

  // Fetch user kanji data from Supabase
  const fetchUserKanjiData = useCallback(async (forceRefresh = false) => {
    // Skip if not logged in
    if (!user) {
      console.log('fetchUserKanjiData: No user logged in, skipping');
      setIsLoadingUserKanji(false);
      return;
    }
    
    // Skip if already loaded and we're not forcing a refresh
    if (supabaseKanji.length > 0 && !forceRefresh) {
      console.log('fetchUserKanjiData: Already have kanji data and no force refresh, skipping');
      return;
    }
    
    console.log('fetchUserKanjiData: Fetching kanji data');
    setIsLoadingUserKanji(true);
    
    try {
      // First, get the count of user's kanji to update the progress bar
      console.log('Fetching kanji count for user ID:', user.id);
      
      // Parameters for the retry logic
      const maxRetries = 3;
      const timeout = 5000; // 5 second timeout
      let retries = 0;
      
      let kanjiCount = 0;
      let countError: SupabaseError | null = null;
      
      // Retry loop for getting the kanji count
      while (retries <= maxRetries && kanjiCount === 0 && !countError) {
        try {
          // Use a regular promise with AbortController for timeout handling
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort('Timeout exceeded'), timeout);
          
          console.log(`Attempt ${retries + 1}/${maxRetries + 1} - Fetching kanji count...`);
          
          try {
            // Execute the query directly
            const { count, error } = await supabase
              .from('user_kanji')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            
            clearTimeout(timeoutId);
            
            if (error) {
              console.error(`Attempt ${retries + 1}/${maxRetries + 1} - Error getting kanji count:`, error);
              countError = error;
              retries++;
              
              if (retries <= maxRetries) {
                console.log(`Retrying count in ${retries * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, retries * 1000));
              }
            } else {
              kanjiCount = count || 0;
              console.log(`Successfully got kanji count: ${kanjiCount}`);
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            
            // Handle network errors
            console.error(`Network error during kanji count fetch: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
            
            // Check if we're offline
            if (!navigator.onLine) {
              console.log('Device appears to be offline. Will try to use cached data if available.');
              
              // If we're offline, try to use localStorage data as a fallback
              try {
                const savedKanji = localStorage.getItem('jijutsu_discovered_kanji');
                if (savedKanji) {
                  const parsedKanji = JSON.parse(savedKanji);
                  if (Array.isArray(parsedKanji) && parsedKanji.length > 0) {
                    console.log(`Using ${parsedKanji.length} kanji from localStorage as fallback`);
                    setSupabaseKanji(parsedKanji);
                    setUserKanjiCount(parsedKanji.length);
                    setUnlockedRadicalCount(10 + Math.floor(parsedKanji.length / 10));
                    setIsLoadingUserKanji(false);
                    return;
                  }
                }
              } catch (lsError) {
                console.error('Error accessing localStorage:', lsError);
              }
            }
            
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying count in ${retries * 1000}ms after network error...`);
              await new Promise(resolve => setTimeout(resolve, retries * 1000));
            } else {
              countError = new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
            }
          }
        } catch (outerError) {
          console.error(`Unexpected error in retry loop: ${outerError instanceof Error ? outerError.message : String(outerError)}`);
          retries++;
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retries * 1000));
          } else {
            countError = new Error(`Unexpected error: ${outerError instanceof Error ? outerError.message : String(outerError)}`);
          }
        }
      }
      
      if (countError) {
        console.error('Failed to get kanji count after all retries:', countError);
        addNotification('Error loading your Kanji Collection. Please check your internet connection and try again.', 'info');
        setIsLoadingUserKanji(false);
        // Try to restart the connection in the background
        restartSupabaseConnection();
        return;
      }
      
      // Update the progress state
      setUserKanjiCount(kanjiCount);
      setUnlockedRadicalCount(10 + Math.floor(kanjiCount / 10));
      console.log(`Updated user kanji count: ${kanjiCount}, unlocking ${10 + Math.floor(kanjiCount / 10)} radicals`);
      
      // If count is 0, we know the user has no kanji, so we can skip the second query
      if (kanjiCount === 0) {
        console.log('User has no kanji, skipping details query');
        setSupabaseKanji([]);
        setIsLoadingUserKanji(false);
        return;
      }

      // Then get the actual kanji characters - improved query to ensure we get proper data
      console.log('Fetching kanji details for user ID:', user.id);
      
      // Reset retries for the second query
      retries = 0;
      let userKanjiData: UserKanjiResponse[] | null = null;
      let kanjiError: SupabaseError | null = null;
      
      // Retry loop for getting the kanji details
      while (retries <= maxRetries && userKanjiData === null && !kanjiError) {
        try {
          // Use a regular promise with AbortController for timeout handling
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort('Timeout exceeded'), timeout);
          
          console.log(`Attempt ${retries + 1}/${maxRetries + 1} - Fetching kanji details...`);
          
          try {
            // Execute the query directly
            const { data, error } = await supabase
              .from('user_kanji')
              .select(`
                kanji_id,
                kanji_dex!inner (
                  id,
                  kanji
                )
              `)
              .eq('user_id', user.id);
            
            clearTimeout(timeoutId);
            
            if (error) {
              console.error(`Attempt ${retries + 1}/${maxRetries + 1} - Error getting kanji details:`, error);
              kanjiError = error;
              retries++;
              
              if (retries <= maxRetries) {
                console.log(`Retrying kanji details in ${retries * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, retries * 1000));
              }
            } else {
              userKanjiData = data as unknown as UserKanjiResponse[];
              console.log(`Successfully got kanji details: ${userKanjiData.length} entries`);
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            
            // Handle network errors
            console.error(`Network error during kanji details fetch: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
            
            // Check if we're offline (already handled in the first query)
            if (!navigator.onLine) {
              console.log('Device still appears to be offline, using kanji count only');
              setIsLoadingUserKanji(false);
              return;
            }
            
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying kanji details in ${retries * 1000}ms...`);
              await new Promise(resolve => setTimeout(resolve, retries * 1000));
            } else {
              kanjiError = new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
            }
          }
        } catch (error) {
          console.error(`Attempt ${retries + 1}/${maxRetries + 1} - Kanji details fetch error:`, error);
          retries++;
          if (retries <= maxRetries) {
            console.log(`Retrying kanji details in ${retries * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, retries * 1000));
          } else {
            kanjiError = error as SupabaseError;
          }
        }
        
        if (kanjiError) {
          retries++;
          if (retries <= maxRetries) {
            console.log(`Retrying kanji details in ${retries * 1000}ms after error...`);
            await new Promise(resolve => setTimeout(resolve, retries * 1000));
            kanjiError = null; // Clear error to allow retry
          }
        }
      }
      
      if (kanjiError) {
        console.error('Error fetching user kanji after all retries:', kanjiError instanceof Error ? kanjiError.message : JSON.stringify(kanjiError));
        addNotification('Error loading your Kanji Collection. Please check your internet connection and try again.', 'info');
        setIsLoadingUserKanji(false);
        // Try to restart the connection in the background
        restartSupabaseConnection();
        return;
      }

      console.log('Received user kanji data:', userKanjiData);
      
      // Extract kanji characters from the nested JSON response
      if (userKanjiData && userKanjiData.length > 0) {
        const kanjiList = userKanjiData
          .filter(item => item.kanji_dex && item.kanji_dex.kanji)
          .map(item => item.kanji_dex.kanji);
        
        console.log('Extracted kanji list:', kanjiList);
        
        if (kanjiList.length === 0) {
          console.warn('No valid kanji found in the response');
          addNotification('Error processing your kanji collection. Please try again later.', 'info');
        } else {
          // Update the discovered kanji state
          setSupabaseKanji(kanjiList);
          console.log(`Updated supabaseKanji with ${kanjiList.length} kanji`);
          
          // Also update the discoveredKanji set for compatibility with the game logic
          setDiscoveredKanji(new Set(kanjiList));
        }
      } else {
        console.log('No kanji data found for user');
        setSupabaseKanji([]);
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserKanjiData:', error);
      addNotification('Error loading your Kanji Collection. Please check your internet connection and try again.', 'info');
      // Try to restart the connection in the background
      restartSupabaseConnection();
    } finally {
      setIsLoadingUserKanji(false);
    }
  }, [user, supabaseKanji.length, setSupabaseKanji, setUserKanjiCount, setUnlockedRadicalCount, setDiscoveredKanji, addNotification]);

  // Function to record kanji discovery in Supabase
  const recordKanjiDiscovery = useCallback(async (kanji: string) => {
    console.log('----- KANJI DISCOVERY TRACE START -----');
    console.log('Attempting to record kanji discovery for:', kanji);
    console.log('User authenticated:', !!user);
    console.log('User details:', user ? { id: user.id, email: user.email } : 'Not logged in');
    
    if (!user) {
      console.log('No user logged in, aborting kanji discovery');
      console.log('----- KANJI DISCOVERY TRACE END -----');
      return; // Only record for authenticated users
    }
    
    // Check if this kanji was recently discovered to prevent loops
    const lastDiscoveryTime = recentDiscoveriesRef.current.get(kanji);
    const now = Date.now();
    if (lastDiscoveryTime && (now - lastDiscoveryTime) < DISCOVERY_COOLDOWN) {
      console.log('Skipping duplicate discovery attempt for:', kanji);
      console.log('Last discovery time:', new Date(lastDiscoveryTime).toISOString());
      console.log('Current time:', new Date(now).toISOString());
      console.log('Cooldown period (ms):', DISCOVERY_COOLDOWN);
      console.log('----- KANJI DISCOVERY TRACE END -----');
      return;
    }
    recentDiscoveriesRef.current.set(kanji, now);
    
    // Clean up old entries from recentDiscoveries
    for (const [k, time] of recentDiscoveriesRef.current.entries()) {
      if (now - time > DISCOVERY_COOLDOWN) {
        recentDiscoveriesRef.current.delete(k);
      }
    }

    try {
      console.log('Starting kanji discovery DB operations');
      console.log('User ID:', user.id);
      
      // Improved: First check if user already has any kanji with this character
      console.log('Checking if user already has discovered kanji');
      const { data: existingKanji, error: existingError } = await supabase
        .from('user_kanji')
        .select('kanji_id')
        .eq('user_id', user.id);

      if (existingError) {
        console.error('Error checking existing kanji:', existingError);
        console.log('----- KANJI DISCOVERY TRACE END -----');
        return;
      }
      
      console.log('Existing kanji for user:', existingKanji);
      
      // Get the kanji_id from kanji_dex table
      console.log('Searching for kanji in dex:', kanji);
      const { data: kanjiData, error: kanjiError } = await supabase
        .from('kanji_dex')
        .select('id, kanji, dex_number, meanings')
        .eq('kanji', kanji);
      
      // Log more details for debugging
      console.log('Kanji lookup query result:', {
        kanji: kanji,
        dataReceived: kanjiData,
        dataLength: kanjiData?.length,
        error: kanjiError ? {
          message: kanjiError.message,
          code: kanjiError.code,
          details: kanjiError.details
        } : null
      });

      if (kanjiError) {
        console.error('Error finding kanji in dex:', kanjiError);
        addNotification(`Error finding kanji "${kanji}" in our database.`, 'info');
        console.log('----- KANJI DISCOVERY TRACE END -----');
        return;
      }

      // Check if we got any matching kanji
      if (!kanjiData || kanjiData.length === 0) {
        console.error('Kanji not found in dex:', kanji);
        
        // Try to find the kanji by wildcard search to help diagnose data issues
        try {
          console.log(`Attempting wildcard search for similar kanji...`);
          const { data: similarKanjiData } = await supabase
            .from('kanji_dex')
            .select('id, kanji, dex_number')
            .limit(5);
          
          if (similarKanjiData && similarKanjiData.length > 0) {
            console.log('Found some kanji in the database (sample):', similarKanjiData);
          } else {
            console.log('No sample kanji found in database - possible connection issue or empty table');
          }
        } catch (wildcardError) {
          console.error('Error during wildcard kanji search:', wildcardError);
        }
        
        // Try to verify if kanji_dex table contains expected data
        try {
          console.log(`Checking if dex_number 1 exists in kanji_dex table...`);
          const { data: firstKanjiData, error: firstKanjiError } = await supabase
            .from('kanji_dex')
            .select('id, kanji, dex_number')
            .eq('dex_number', 1);
          
          if (firstKanjiError) {
            console.error('Error querying first kanji:', firstKanjiError);
          } else if (firstKanjiData && firstKanjiData.length > 0) {
            console.log('First kanji in database:', firstKanjiData[0]);
          } else {
            console.log('Kanji with dex_number 1 not found - database may not be properly populated');
          }
        } catch (firstKanjiQueryError) {
          console.error('Error checking first kanji:', firstKanjiQueryError);
        }
        
        addNotification(`Kanji "${kanji}" not found in our database. We'll fix this in a future update.`, 'info');
        console.log('----- KANJI DISCOVERY TRACE END -----');
        return;
      }

      // Get the first matching kanji (should be only one)
      const kanjiRecord = kanjiData[0];
      
      if (!kanjiRecord?.id) {
        console.error('Kanji record missing ID. Details:', {
          searchedKanji: kanji,
          receivedData: kanjiRecord
        });
        console.log('----- KANJI DISCOVERY TRACE END -----');
        return;
      }

      console.log('Found kanji in dex:', {
        id: kanjiRecord.id,
        kanji: kanjiRecord.kanji,
        dexNumber: kanjiRecord.dex_number,
        meanings: kanjiRecord.meanings
      });

      // Check if this kanji is already in the user's collection
      const isAlreadyDiscovered = existingKanji?.some(
        entry => entry.kanji_id === kanjiRecord.id
      );
      
      console.log('Is kanji already discovered by user:', isAlreadyDiscovered);
      
      if (isAlreadyDiscovered) {
        console.log('User already has this kanji, aborting insert');
        console.log('----- KANJI DISCOVERY TRACE END -----');
        return;
      }

      // Insert into user_kanji table
      console.log('Inserting new kanji discovery into user_kanji table');
      console.log('Insert data:', {
        user_id: user.id,
        kanji_id: kanjiRecord.id
      });
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_kanji')
        .insert([{
          user_id: user.id,
          kanji_id: kanjiRecord.id
        }])
        .select();

      if (insertError) {
        // If it's a duplicate, that's fine - user already discovered this kanji
        if (insertError.code === '23505') { // Postgres unique violation code
          console.log('Kanji already discovered by user (constraint violation):', {
            userId: user.id,
            kanjiId: kanjiRecord.id,
            error: insertError
          });
          console.log('----- KANJI DISCOVERY TRACE END -----');
          return;
        }
        console.error('Error recording kanji discovery:', {
          error: insertError,
          userId: user.id,
          kanjiId: kanjiRecord.id
        });
        console.log('----- KANJI DISCOVERY TRACE END -----');
        return;
      }

      console.log('Successfully recorded kanji discovery:', {
        userId: user.id,
        kanjiId: kanjiRecord.id,
        insertedData: insertData
      });

      // Successfully recorded kanji, update count and kanji list
      setUserKanjiCount(prev => {
        const newCount = prev + 1;
        console.log('Updated user kanji count:', newCount);
        // Check if this unlocks a new radical
        if (newCount % 10 === 0) {
          // Increment the unlocked radical count
          const newRadicalCount = 10 + Math.floor(newCount / 10);
          console.log('Unlocked new radical, new count:', newRadicalCount);
          setUnlockedRadicalCount(newRadicalCount);
          addNotification(`You've unlocked a new radical!`, 'success');
        }
        return newCount;
      });

      // Add the new kanji to the Supabase kanji list
      setSupabaseKanji(prev => {
        const newList = [...prev, kanji];
        console.log('Updated supabaseKanji list to:', newList);
        return newList;
      });
      
      // Also update the local kanji set for compatibility
      setDiscoveredKanji(prev => {
        const newSet = new Set([...prev, kanji]);
        console.log('Updated discoveredKanji set to:', Array.from(newSet));
        return newSet;
      });
      
      // After successfully saving to database, trigger a refresh of user kanji data
      fetchUserKanjiData(true);
      
      console.log('----- KANJI DISCOVERY TRACE END -----');
    } catch (error) {
      console.error('Unexpected error in recordKanjiDiscovery:', error);
      addNotification('Error recording your kanji discovery. Please try again.', 'info');
      console.log('----- KANJI DISCOVERY TRACE END -----');
    }
  }, [user, addNotification, fetchUserKanjiData, hasSyncedKanji]);
  
  // Fetch user's kanji count and kanji list from Supabase when user changes
  useEffect(() => {
    // If logged out, we don't need to fetch anything
    if (!user) {
      setUserKanjiCount(0);
      setSupabaseKanji([]); // Clear Supabase kanji when logging out
      return;
    }

    // Fetch user's kanji count and kanji list from Supabase
    fetchUserKanjiData();
  }, [user, fetchUserKanjiData]); // Added fetchUserKanjiData as a dependency

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkUser = async () => {
      console.log('----- AUTH CHECK TRACE START -----');
      setIsLoading(true);
      try {
        // Get current session
        console.log('Getting current auth session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting auth session:', sessionError);
          console.log('----- AUTH CHECK TRACE END -----');
          setIsLoading(false);
          return;
        }
        
        console.log('Auth session result:', session ? 'Session found' : 'No session');
        if (session?.user) {
          console.log('User authenticated:', {
            id: session.user.id,
            email: session.user.email,
            lastSignIn: new Date(session.user.last_sign_in_at || '').toISOString()
          });
          
          // Store user ID in ref for comparison
          currentUserIdRef.current = session.user.id;
          
          // Set user before calling any dependent functions
          setUser(session.user);
          setHasSyncedKanji(false); // Reset sync flag to ensure we sync on sign-in
        } else {
          setUser(null);
          currentUserIdRef.current = null;
        }
        
        console.log('----- AUTH CHECK TRACE END -----');
      } catch (error) {
        console.error('Error in checkUser:', error);
        console.log('----- AUTH CHECK TRACE END -----');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []); // Run only once on component mount, not when user changes

  // Keep only one auth listener to avoid duplicates
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        console.log('New session:', session ? 'Session exists' : 'No session');
        
        // Get new user ID from session
        const newUserId = session?.user?.id || null;
        
        // Log for debugging
        console.log('Current user ID in ref:', currentUserIdRef.current);
        console.log('New user ID from event:', newUserId);
        
        // Skip redundant SIGNED_IN events for the same user
        if (event === 'SIGNED_IN' && newUserId === currentUserIdRef.current) {
          console.log('Ignoring redundant SIGNED_IN event for the same user');
          return;
        }
        
        // Handle actual user changes based on ID comparison
        if (newUserId !== currentUserIdRef.current) {
          // Update the ref
          currentUserIdRef.current = newUserId;
          
          // If user just signed in (previously null, now has value)
          if (!user && newUserId) {
            console.log('User signed in - updating state');
            setUser(session?.user || null);
            setHasSyncedKanji(false); // Reset sync flag to ensure we sync
            await fetchUserKanjiData(true); // Force refresh
          } 
          // If user just signed out (previously had value, now null)
          else if (user && !newUserId) {
            console.log('User signed out - clearing state');
            setUser(null);
            setDiscoveredKanji(new Set());
            setSupabaseKanji([]);
            setUserKanjiCount(0);
            setHasSyncedKanji(false);
          } 
          // User changed - update user
          else if (user?.id !== newUserId) {
            console.log('Different user signed in - updating state');
            setUser(session?.user || null);
            setHasSyncedKanji(false); // Reset sync flag for new user
            await fetchUserKanjiData(true); // Force refresh
          }
        } else {
          console.log('User ID unchanged, ignoring auth state change event');
        }
      }
    );
    
    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [user, recordKanjiDiscovery, addNotification, fetchUserKanjiData, hasSyncedKanji]);

  // Add this new handler for starting drags from the sidebar
  const handleSidebarDragStart = (radical: string, clientX: number, clientY: number, elementRect: DOMRect) => {
    // Set state to indicate we're dragging from sidebar
    setIsDraggingFromSidebar(true);
    setSidebarDraggedChar(radical);
    
    // Calculate offset (for positioning the floating element)
    setDragOffset({
      x: clientX - elementRect.left,
      y: clientY - elementRect.top
    });
  };

  // Handle starting a drag operation for elements already in the game area
  const handleStartDrag = (elementId: string, clientX: number, clientY: number, elementRect: DOMRect) => {
    // Set the element being dragged
    setDraggedElementId(elementId);
    
    // Calculate offset from cursor to element corner
    setDragOffset({
      x: clientX - elementRect.left,
      y: clientY - elementRect.top
    });
    
    // Update element state to indicate it's being dragged
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, isDragging: true } 
        : el
    ));
  };

  // Modify the existing handleDrag function to handle sidebar drags
  const handleDrag = (clientX: number, clientY: number) => {
    // Update current mouse position
    setMousePosition({ x: clientX, y: clientY });
    
    if (!gameAreaRef.current) return;
    
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    
    // Handle trash can hover check
    if (trashCanRef.current) {
      const trashRect = trashCanRef.current.getBoundingClientRect();
      const elementCenterX = clientX;
      const elementCenterY = clientY;
      
      // Check if element is overlapping with trash can
      const isOverTrash = 
        elementCenterX >= trashRect.left && 
        elementCenterX <= trashRect.right &&
        elementCenterY >= trashRect.top && 
        elementCenterY <= trashRect.bottom;
      
      setIsOverTrash(isOverTrash);
    }
    
    // Update hovered elements for both sidebar drags and regular drags
    if (isDraggingFromSidebar || draggedElementId) {
      const gameElements = elements.filter(el => (el.position.x !== 0 || el.position.y !== 0) && el.id !== draggedElementId);
      const hoveredElements = new Set<string>();
      const newConnections: {from: string, to: string}[] = [];
      const elementWidth = 40;
      const elementHeight = 40;
      
      // Determine the position of the currently dragged element
      let draggedX = 0;
      let draggedY = 0;
      const draggedId = draggedElementId || 'sidebar';
      
      if (draggedElementId) {
        // If dragging an existing element, get its position from elements state
        const draggedElementObj = elements.find(el => el.id === draggedElementId);
        if (draggedElementObj) {
          draggedX = draggedElementObj.position.x;
          draggedY = draggedElementObj.position.y;
        }
      } else if (isDraggingFromSidebar) {
        // If dragging from sidebar, calculate position from mouse and offset
        draggedX = clientX - gameRect.left - dragOffset.x;
        draggedY = clientY - gameRect.top - dragOffset.y;
      }
      
      // Define the bounding box of the dragged element
      const draggedLeft = draggedX;
      const draggedRight = draggedX + elementWidth;
      const draggedTop = draggedY;
      const draggedBottom = draggedY + elementHeight;
      
      // Check for overlaps with other elements
      for (const el of gameElements) {
        const elLeft = el.position.x;
        const elRight = el.position.x + elementWidth;
        const elTop = el.position.y;
        const elBottom = el.position.y + elementHeight;
        
        // Add some margin for easier merging
        const margin = 10;
        
        // Check for overlap with margin
        const isOverlapping = 
          draggedLeft - margin < elRight + margin && 
          draggedRight + margin > elLeft - margin && 
          draggedTop - margin < elBottom + margin && 
          draggedBottom + margin > elTop - margin;
        
        if (isOverlapping) {
          hoveredElements.add(el.id);
          
          // Add a connection between the dragged element and this element
          newConnections.push({
            from: draggedId,
            to: el.id
          });
        }
      }
      
      setHoveredElements(hoveredElements);
      setConnections(newConnections);
    } else {
      // Clear hover state when not dragging
      setHoveredElements(new Set());
      setConnections([]);
    }
    
    // Handle movement for regular drag operations
    if (draggedElementId) {
      // Update element position, keeping it within game area bounds
      setElements(prev => prev.map(el => {
        if (el.id === draggedElementId) {
          // Calculate new position relative to game area
          const newX = clientX - gameRect.left - dragOffset.x;
          const newY = clientY - gameRect.top - dragOffset.y;
          
          // Ensure element stays within bounds
          const elementWidth = 40; // Assuming element is 40px wide
          const elementHeight = 40; // Assuming element is 40px tall
          
          const boundedX = Math.max(0, Math.min(newX, gameRect.width - elementWidth));
          const boundedY = Math.max(0, Math.min(newY, gameRect.height - elementHeight));
          
          return { 
            ...el, 
            position: { x: boundedX, y: boundedY } 
          };
        }
        return el;
      }));
    }

    // Check for kanji discoveries with the current set of touching elements
    if (hoveredElements.size >= 2) {
      // Get all radical characters that are touching
      const radicalSet = new Set<string>();
      
      hoveredElements.forEach(id => {
        const element = elements.find(el => el.id === id);
        if (element) {
          radicalSet.add(element.char);
        }
      });
      
      // Convert set to sorted array for consistent checking
      const radicals = Array.from(radicalSet).sort();
      
      // Check if these radicals form a kanji
      if (kanjiData && radicals.length >= 2) {
        // Using every radical to check for potential kanji
        radicals.forEach(radical => {
          if (kanjiData.radicalToKanji[radical]) {
            kanjiData.radicalToKanji[radical].forEach(kanji => {
              // Get the set of radicals for this kanji
              const kanjiRadicals = kanjiData.kanjiToRadicals[kanji] || [];
              
              // Check if all radicals for this kanji are present in our touching set
              // AND check if our touching set contains exactly these radicals (no extras)
              if (
                kanjiRadicals.every(r => radicalSet.has(r)) && 
                kanjiRadicals.length === radicalSet.size
              ) {
                // We've discovered a kanji!
                if (!discoveredKanji.has(kanji)) {
                  // Add to discovered set
                  const newDiscoveredKanji = new Set(discoveredKanji);
                  newDiscoveredKanji.add(kanji);
                  
                  // Update state
                  recordKanjiDiscovery(kanji);
                  
                  // Show notification with the kanji
                  addNotification(`You discovered ${kanji}!`, 'success', kanji);
                  
                  // Add the kanji as a new element in the workspace
                  const newKanjiElement: GameElement = {
                    id: generateUniqueId('kanji', kanji),
                    type: 'kanji',
                    char: kanji,
                    position: {
                      x: Math.min(...Array.from(hoveredElements).map(el => elements.find(e => e.id === el)?.position.x || 0)) + 10,
                      y: Math.min(...Array.from(hoveredElements).map(el => elements.find(e => e.id === el)?.position.y || 0)) + 10
                    },
                    isDragging: false,
                    touchingElements: new Set(),
                    className: 'kanji-created',
                    meaning: kanjiMeanings[kanji] && kanjiMeanings[kanji].length > 0 ? kanjiMeanings[kanji][0] : undefined
                  };
                  
                  // Add new kanji and remove all the radicals used
                  setElements(prev => {
                    // Remove the radicals that were combined
                    const filtered = prev.filter(el => !hoveredElements.has(el.id));
                    // Add the new kanji
                    return [...filtered, newKanjiElement];
                  });
                }
              }
            });
          }
        });
      }
    }
  };

  // Modify the existing handleEndDrag function to handle sidebar drags
  const handleEndDrag = () => {
    // Clear hover state and connections
    setHoveredElements(new Set());
    setConnections([]);
    
    // Handle the case where we're dragging from the sidebar
    if (isDraggingFromSidebar && sidebarDraggedChar && gameAreaRef.current) {
      // Don't drop if we're over the trash
      if (!isOverTrash) {
        const gameRect = gameAreaRef.current.getBoundingClientRect();
        // Use tracked mouse position instead of window.event
        const currentPosition = mousePosition;
        
        // Only create element if cursor is within game area
        if (
          currentPosition.x >= gameRect.left && 
          currentPosition.x <= gameRect.right && 
          currentPosition.y >= gameRect.top && 
          currentPosition.y <= gameRect.bottom
        ) {
          // Calculate position inside game area
          const relativeX = currentPosition.x - gameRect.left - dragOffset.x;
          const relativeY = currentPosition.y - gameRect.top - dragOffset.y;
          
          // Ensure element stays within bounds
          const elementWidth = 40;
          const elementHeight = 40;
          
          const boundedX = Math.max(0, Math.min(relativeX, gameRect.width - elementWidth));
          const boundedY = Math.max(0, Math.min(relativeY, gameRect.height - elementHeight));
          
          // Create the new element
          const newId = generateUniqueId('element', sidebarDraggedChar);
          
          const newElement: GameElement = {
            id: newId,
            type: 'radical',
            char: sidebarDraggedChar,
            position: { x: boundedX, y: boundedY },
            isDragging: false,
            touchingElements: new Set(),
            className: 'merge-success ripple-effect' // Add animation classes
          };
          
          // Add the new element to the game and store its ID for collision check
          setElements(prev => [...prev, newElement]);
          
          // Store the ID for collision checking in the next render
          setLastAddedElementId(newId);
        }
      }
      
      // Reset sidebar drag state
      setIsDraggingFromSidebar(false);
      setSidebarDraggedChar('');
      setIsOverTrash(false);
    } 
    // Handle the case for regular dragged elements
    else if (draggedElementId) {
      // If element is over trash can, delete it
      if (isOverTrash) {
        setElements(prev => prev.filter(el => el.id !== draggedElementId));
        setIsOverTrash(false);
      } else {
        // Update element to no longer be dragging
        setElements(prev => prev.map(el => 
          el.id === draggedElementId 
            ? { ...el, isDragging: false } 
            : el
        ));
        
        // Check for collisions and potential merges
        checkElementCollisions(draggedElementId);
      }
      
      // Reset drag state
      setDraggedElementId(null);
    }
  };
  
  // Clone a radical from sidebar to game area
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCloneRadical = (radical: string, clientX: number, clientY: number, _elementRect: DOMRect) => {
    if (!gameAreaRef.current) return;
    
    // Get game area bounds
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    
    // Calculate position inside game area
    const relativeX = clientX - gameRect.left - dragOffset.x;
    const relativeY = clientY - gameRect.top - dragOffset.y;
    
    // Ensure element stays within bounds
    const elementWidth = 40; // Assuming element is 40px wide
    const elementHeight = 40; // Assuming element is 40px tall
    
    const boundedX = Math.max(0, Math.min(relativeX, gameRect.width - elementWidth));
    const boundedY = Math.max(0, Math.min(relativeY, gameRect.height - elementHeight));
    
    // Create new element ID with randomness to ensure uniqueness
    const newId = generateUniqueId('element', radical);
    
    // Add new element to game
    const newElement: GameElement = {
      id: newId,
      type: 'radical',
      char: radical,
      position: { x: boundedX, y: boundedY },
      isDragging: false,
      touchingElements: new Set(),
      className: 'merge-success ripple-effect' // Add animation classes
    };
    
    setElements(prev => [...prev, newElement]);
    
    // Check for collisions immediately
    setTimeout(() => checkElementCollisions(newId), 50);
  };
  
  // Check collisions between elements
  const checkElementCollisions = useCallback((changedElementId: string) => {
    if (!kanjiData) return;
      
    // Find the changed element
    const changedElement = elements.find(el => el.id === changedElementId);
    if (!changedElement) return;
    
    // Update touchingElements for all elements
    setElements(prev => {
      const updated = [...prev];
      
      // For each element, check if it's touching any other element
      for (let i = 0; i < updated.length; i++) {
        const el1 = updated[i];
        el1.touchingElements = new Set(); // Reset touching elements
        
        for (let j = 0; j < updated.length; j++) {
          if (i === j) continue; // Skip self
          
          const el2 = updated[j];
          
          // Check if elements are touching
          const el1Rect = {
            left: el1.position.x,
            right: el1.position.x + 40,
            top: el1.position.y,
            bottom: el1.position.y + 40,
          };
          
          const el2Rect = {
            left: el2.position.x,
            right: el2.position.x + 40,
            top: el2.position.y,
            bottom: el2.position.y + 40,
          };
          
          const isTouching = !(
            el1Rect.right < el2Rect.left ||
            el1Rect.left > el2Rect.right ||
            el1Rect.bottom < el2Rect.top ||
            el1Rect.top > el2Rect.bottom
          );
          
          if (isTouching) {
            el1.touchingElements.add(el2.id);
          }
        }
      }
      
      // Check for kanji formation
      // Get all connected elements
      const connectedIds = findConnectedElements(changedElementId, updated);
      
      // Get characters from connected elements
      const connectedChars = Array.from(connectedIds).map(id => {
        const el = updated.find(e => e.id === id);
        return el ? el.char : '';
      }).filter(Boolean);
      
      // Sort alphabetically to ensure consistent order
      connectedChars.sort();
      
      // Skip if only one element (no combination possible)
      if (connectedChars.length <= 1) return updated;
      
      // Check if these radicals form a kanji
      const possibleKanji = findPossibleKanji(connectedChars, kanjiData);
      
      // If kanji is formed, add to discovered kanji
      for (const kanji of possibleKanji) {
        // Skip if this kanji was already discovered
        if (discoveredKanji.has(kanji)) {
          // Check if we need to remove radicals and add the kanji to the workspace
          // If the kanji already exists on the board, don't create a duplicate
          const kanjiAlreadyOnBoard = updated.some(el => el.type === 'kanji' && el.char === kanji);
          
          if (!kanjiAlreadyOnBoard) {
            // Create a new kanji element to replace the radicals
            const newKanjiElement: GameElement = {
              id: `kanji-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${kanji}`,
              type: 'kanji',
              char: kanji,
              position: {
                x: Math.min(...Array.from(connectedIds).map(id => updated.find(e => e.id === id)?.position.x || 0)) + 10,
                y: Math.min(...Array.from(connectedIds).map(id => updated.find(e => e.id === id)?.position.y || 0)) + 10
              },
              isDragging: false,
              touchingElements: new Set(),
              className: 'kanji-created',
              meaning: kanjiMeanings[kanji] && kanjiMeanings[kanji].length > 0 ? kanjiMeanings[kanji][0] : undefined
            };
            
            // Remove the radicals that were used and add the new kanji
            return updated.filter(el => !connectedIds.has(el.id)).concat(newKanjiElement);
          }
          
          continue;
        }

        // Add to discovered list
        setDiscoveredKanji(prev => {
          const updated = new Set(prev);
          updated.add(kanji);
          return updated;
        });
        
        // Record discovery
        recordKanjiDiscovery(kanji);

        // Show notification with the kanji
        addNotification(`You discovered ${kanji}!`, 'success', kanji);
        
        // Create a new kanji element to replace the radicals
        const newKanjiElement: GameElement = {
          // Create a unique ID without using the generateUniqueId function
          id: `kanji-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${kanji}`,
          type: 'kanji',
          char: kanji,
          position: {
            // Position at the average of all combined elements
            x: Math.min(...Array.from(connectedIds).map(id => updated.find(e => e.id === id)?.position.x || 0)) + 10,
            y: Math.min(...Array.from(connectedIds).map(id => updated.find(e => e.id === id)?.position.y || 0)) + 10
          },
          isDragging: false,
          touchingElements: new Set(),
          className: 'kanji-created',
          meaning: kanjiMeanings[kanji] && kanjiMeanings[kanji].length > 0 ? kanjiMeanings[kanji][0] : undefined
        };
        
        // Remove the radicals that were used and add the new kanji
        return updated.filter(el => !connectedIds.has(el.id)).concat(newKanjiElement);
      }
      
      return updated;
    });
  }, [elements, setElements, discoveredKanji, setDiscoveredKanji, recordKanjiDiscovery, kanjiData, addNotification]);

  // Health check function
  const runHealthCheck = useCallback(async () => {
    try {
      const result = await checkSupabaseHealth();
      
      setConnectionStatus({
        connected: result.success,
        message: result.message,
        lastChecked: new Date()
      });
      
      if (!result.success) {
        // Only show notification if this is not the first health check
        if (connectionStatus.lastChecked) {
          addNotification('Connection to server lost. Some features may be unavailable.', 'info');
        }
      } else if (connectionStatus.lastChecked && !connectionStatus.connected) {
        // If we were previously disconnected and now reconnected
        addNotification('Connection to server restored!', 'success');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setConnectionStatus({
        connected: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      });
    }
  }, [connectionStatus.lastChecked, connectionStatus.connected, addNotification]);

  // Add health check effect - TEMPORARILY DISABLED to fix infinite loop
  /*
  useEffect(() => {
    // Run an initial health check
    runHealthCheck();
    
    // Set up an interval to run health checks periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      runHealthCheck();
    }, 30000); // 30 seconds
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [runHealthCheck]);
  */

  // Find all elements connected in a cluster using breadth-first search
  const findConnectedElements = (startId: string, elements: GameElement[]): Set<string> => {
    const connected = new Set<string>();
    const queue = [startId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (connected.has(currentId)) continue;
      connected.add(currentId);
      
      // Find the current element
      const element = elements.find(el => el.id === currentId);
      
      if (!element) continue;
      
      // Add all touching elements to the queue
      element.touchingElements.forEach(touchingId => {
        if (!connected.has(touchingId)) {
          queue.push(touchingId);
        }
      });
    }
    
    return connected;
  };

  // Function to sync localStorage kanji to database when user signs in
  const syncLocalKanjiToDatabase = useCallback(async (userId: string) => {
    if (hasSyncedKanji) {
      console.log('Already synced kanji, skipping');
      return;
    }
    
    try {
      // Get kanji from localStorage
      const savedKanji = localStorage.getItem('jijutsu_discovered_kanji');
      if (!savedKanji) {
        console.log('No local kanji to sync to database');
        return;
      }

      const localKanji = JSON.parse(savedKanji);
      if (!Array.isArray(localKanji) || localKanji.length === 0) {
        console.log('No local kanji to sync (empty array)');
        return;
      }

      console.log(`Syncing ${localKanji.length} kanji from localStorage to database for user ${userId}`);
      console.log('Kanji to sync:', localKanji);

      // For each kanji in localStorage, add it to the user's account
      for (const kanji of localKanji) {
        await recordKanjiDiscovery(kanji);
        // Add notification for each synced kanji
        addNotification(`Syncing 1 kanji to your account...`, 'success');
      }

      // Clear localStorage after successful sync
      localStorage.removeItem('jijutsu_discovered_kanji');
      
      // Force refresh user kanji data
      await fetchUserKanjiData();
      
      // Mark as synced
      setHasSyncedKanji(true);
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error syncing local kanji to database:', error);
    }
  }, [recordKanjiDiscovery, addNotification, fetchUserKanjiData, hasSyncedKanji]);

  // Keep this effect to handle loading kanji data when user changes
  useEffect(() => {
    if (user?.id) {
      // When user changes, fetch their kanji data
      fetchUserKanjiData();
    }
  }, [user, fetchUserKanjiData]);

  // Add a function to fetch kanji details from Supabase
  const fetchKanjiDetails = useCallback(async (kanji: string) => {
    if (!kanji) return;
    
    console.log('Fetching details for kanji:', kanji);
    setLoadingKanjiDetails(true);
    
    try {
      const { data, error } = await supabase
        .from('kanji_dex')
        .select('id, kanji, dex_number, meanings, on_reading, kun_reading')
        .eq('kanji', kanji)
        .single();
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Error fetching kanji details:', error);
        addNotification(`Failed to load details for ${kanji}`, 'info');
        return;
      }
      
      setKanjiDetails(data);
      // Open the dialog
      setIsKanjiDetailsOpen(true);
      console.log('Dialog should be open now with data:', data);
    } catch (error) {
      console.error('Unexpected error fetching kanji details:', error);
    } finally {
      setLoadingKanjiDetails(false);
    }
  }, []);
  
  // Use an effect to fetch kanji details when selectedKanji changes
  useEffect(() => {
    if (selectedKanji) {
      console.log('Selected kanji changed, fetching details for:', selectedKanji);
      fetchKanjiDetails(selectedKanji);
    }
  }, [selectedKanji, fetchKanjiDetails]);
  
  // Handle opening the kanji details dialog - simplified to just set the selected kanji
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleKanjiClick = (kanji: string, event: React.MouseEvent | React.TouchEvent) => {
    // Prevent any drag operations immediately
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Kanji clicked, setting selectedKanji:', kanji);
    // Directly fetch the kanji details instead of just setting selectedKanji
    setSelectedKanji(kanji);
    fetchKanjiDetails(kanji);
  };
  
  // Close kanji details dialog
  const handleCloseKanjiDetails = () => {
    console.log('Closing kanji details dialog');
    setIsKanjiDetailsOpen(false);
    // Clear details after animation completes
    setTimeout(() => {
      setKanjiDetails(null);
      setSelectedKanji(null);
    }, 300);
  };

  // Add this useEffect hook after the other useEffect hooks
  useEffect(() => {
    // If we have a lastAddedElementId, check for collisions
    if (lastAddedElementId) {
      checkElementCollisions(lastAddedElementId);
      // Reset the ID after checking
      setLastAddedElementId(null);
    }
  }, [lastAddedElementId, checkElementCollisions]);

  // Fetch user data and kanji on initial load and auth state change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Initial check on mount - just get the session once
    const initialCheck = async () => {
      try {
        console.log('Performing initial auth check...');
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        if (session?.user) {
          console.log('User found in initial check, fetching kanji data...');
          await fetchUserKanjiData();
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in initial auth check:', error);
        setIsLoading(false);
      }
    };

    initialCheck();
    
    // We don't setup auth listeners here anymore - it's done in the dedicated effect
  }, [fetchUserKanjiData]); // Only depend on fetchUserKanjiData

  // Define findPossibleKanji function with useCallback
  const findPossibleKanji = useCallback((chars: string[], kanjiData: KanjiRadicalsData): string[] => {
    if (!chars.length || !kanjiData) return [];
    
    console.log('Finding possible kanji for radicals:', chars);
    
    // Check which kanji can be formed with these radicals
    const possibleKanjiList: string[] = [];
    
    // Count occurrences of each radical in our set
    const radicalCounts = new Map<string, number>();
    chars.forEach(char => {
      radicalCounts.set(char, (radicalCounts.get(char) || 0) + 1);
    });
    
    // Go through the kanji in our data
    Object.entries(kanjiData.kanjiToRadicals).forEach(([kanji, requiredRadicals]) => {
      // Count required radicals for this kanji
      const requiredCounts = new Map<string, number>();
      requiredRadicals.forEach(radical => {
        requiredCounts.set(radical, (requiredCounts.get(radical) || 0) + 1);
      });
      
      // Check if we have all the required radicals with the right counts
      let hasAllRadicals = true;
      let hasExactRadicals = true;
      
      // Check if all required radicals are present in the right quantities
      requiredCounts.forEach((count, radical) => {
        if (!radicalCounts.has(radical) || radicalCounts.get(radical)! < count) {
          hasAllRadicals = false;
        }
      });
      
      // Check if we have exactly the right radicals (no extras)
      if (hasAllRadicals) {
        // Total radical count should match
        if (chars.length !== requiredRadicals.length) {
          hasExactRadicals = false;
        } else {
          // Check that each radical in our set is required for this kanji
          radicalCounts.forEach((count, radical) => {
            if (!requiredCounts.has(radical) || requiredCounts.get(radical)! !== count) {
              hasExactRadicals = false;
            }
          });
        }
      }
      
      // Special case for kanji that only list one radical but actually need multiples
      // This is a temporary fix for data issues with certain kanji
      if (
        // 昌 - two suns (日 + 日)
        (kanji === "昌" && chars.length === 2 && chars.every(c => c === "日")) ||
        // 品 - three mouths (口 + 口 + 口)
        (kanji === "品" && chars.length === 3 && chars.every(c => c === "口")) ||
        // 森 - three trees (木 + 木 + 木)
        (kanji === "森" && chars.length === 3 && chars.every(c => c === "木")) ||
        // 炎 - two fires (火 + 火)
        (kanji === "炎" && chars.length === 2 && chars.every(c => c === "火")) ||
        // 晶 - three suns (日 + 日 + 日)
        (kanji === "晶" && chars.length === 3 && chars.every(c => c === "日"))
      ) {
        hasAllRadicals = true;
        hasExactRadicals = true;
      }
      
      if (hasAllRadicals && hasExactRadicals) {
        possibleKanjiList.push(kanji);
        console.log(`Found matching kanji: ${kanji} with radicals:`, requiredRadicals);
      }
    });
    
    return possibleKanjiList;
  }, []);

  // Define handleRetryConnection function
  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      console.log('Attempting to retry connection...');
      
      // Try to run a health check
      const result = await checkSupabaseHealth();
      
      if (result.success) {
        console.log('Connection restored successfully!');
        setConnectionStatus({
          connected: true,
          lastChecked: new Date(),
          message: 'Connection re-established'
        });
        addNotification('Connection restored successfully!', 'success');
      } else {
        console.error('Failed to restore connection', result);
        setConnectionStatus({
          connected: false,
          lastChecked: new Date(),
          message: result.message || 'Failed to connect'
        });
        addNotification('Failed to restore connection. Please try again.', 'info');
      }
    } catch (error) {
      console.error('Error during retry:', error);
      setConnectionStatus({
        connected: false,
        lastChecked: new Date(),
        message: error instanceof Error ? error.message : 'Error during retry'
      });
      addNotification('Error while trying to reconnect. Please try again.', 'info');
    } finally {
      setIsRetrying(false);
    }
  };

  // Define clearGameArea function
  const clearGameArea = () => {
    // Implementation details...
  };

  // Define handleSignOut function
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Define handleOpenAuth function
  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    console.log(`Opening auth mode: ${mode}`);
    if (mode === 'signin') {
      setIsSignInOpen(true);
      setIsSignUpOpen(false);
    } else {
      setIsSignUpOpen(true);
      setIsSignInOpen(false);
    }
    setAuthMode(mode);
  };

  // Define handleAuthSuccess function
  const handleAuthSuccess = () => {
    console.log('Auth success callback triggered');
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
    
    // Reset the sync flag to force syncing local data to db
    setHasSyncedKanji(false);
    
    // Get the current session after successful auth
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Getting session after auth success:', session ? 'Session found' : 'No session');
      
      if (error) {
        console.error('Error getting session after auth:', error);
        return;
      }
      
      if (session?.user) {
        console.log('User authenticated after success:', session.user);
        setUser(session.user);
        // Don't call fetchUserKanjiData directly here
        // The useEffect with the user dependency will handle that
      }
    });
  };

  // Define resetProgress function
  const resetProgress = () => {
    if (!user) {
      console.log('No user signed in, nothing to reset');
      addNotification('Please sign in to reset your progress.', 'info');
      return;
    }
    
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to reset your progress? This will delete all your discovered kanji.')) {
      return;
    }
    
    (async () => {
      try {
        console.log('Resetting user progress...');
        addNotification('Resetting your progress...', 'info');
        
        // Delete all user's kanji from user_kanji table
        const { error } = await supabase
          .from('user_kanji')
          .delete()
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error resetting progress:', error);
          addNotification('Failed to reset your progress. Please try again later.', 'info');
          return;
        }
        
        // Reset local state
        setDiscoveredKanji(new Set());
        setSupabaseKanji([]);
        setUserKanjiCount(0);
        setUnlockedRadicalCount(10); // Reset to initial value
        
        // Clear kanji meanings cache
        setKanjiMeanings({});
        loadedKanjiRef.current.clear();
        
        // Reset tracking refs
        kanjiRefreshStateRef.current = {
          userKanjiLength: 0,
          discoveredKanjiSize: 0
        };
        
        // Clear game area
        clearGameArea();
        
        console.log('Successfully reset user progress');
        addNotification('Your progress has been reset!', 'success');
      } catch (error) {
        console.error('Error in reset progress:', error);
        addNotification('Failed to reset your progress. Please try again later.', 'info');
      }
    })();
  };

  // Add this function near the top of your component, below other state declarations
  const generateUniqueId = useCallback((prefix: string, kanji: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${kanji}`;
  }, []);

  // Update useEffect to check loadingData state
  useEffect(() => {
    console.log('Kanji data loading status:', loadingGameData);
    console.log('Is useKanjiRadicals data loaded:', kanjiData !== null);
    
    // Set loadingData based on kanjiData and loadingGameData
    if (!loadingGameData && kanjiData) {
      console.log('Setting loadingData to false, kanji data is loaded');
      setLoadingData(false);
    }
  }, [loadingGameData, kanjiData]);

  // Add a ref to track which kanji we've already loaded meanings for
  const loadedKanjiRef = useRef<Set<string>>(new Set());
  
  // Function to fetch and store kanji meanings
  const fetchKanjiMeanings = useCallback(async () => {
    try {
      // Get the array of kanji to fetch meanings for
      const kanjiToFetch = user ? supabaseKanji : Array.from(discoveredKanji);
      
      // If there are no kanji to fetch, return early
      if (kanjiToFetch.length === 0) {
        console.log('No kanji to fetch meanings for');
        return;
      }
      
      // Filter out kanji we already have meanings for
      const kanjiSet = new Set(kanjiToFetch);
      const loadedKanji = loadedKanjiRef.current;
      
      // Check if we've already loaded all these kanji
      const allAlreadyLoaded = Array.from(kanjiSet).every(k => 
        loadedKanji.has(k) || kanjiMeanings[k]
      );
      
      if (allAlreadyLoaded && Object.keys(kanjiMeanings).length >= kanjiToFetch.length) {
        console.log('All kanji meanings already loaded, skipping fetch');
        return;
      }
      
      // Find which kanji we need to fetch
      const kanjiToActuallyFetch = kanjiToFetch.filter(k => 
        !loadedKanji.has(k) && !kanjiMeanings[k]
      );
      
      if (kanjiToActuallyFetch.length === 0) {
        console.log('No new kanji meanings to fetch');
        return;
      }
      
      console.log(`Fetching meanings for ${kanjiToActuallyFetch.length} new kanji out of ${kanjiToFetch.length} total`);
      
      // Create a combined meanings map, starting with existing meanings
      const meaningsMap: Record<string, string[]> = { ...kanjiMeanings };
      
      // Process in batches of 100 to avoid query limits
      const BATCH_SIZE = 100;
      for (let i = 0; i < kanjiToActuallyFetch.length; i += BATCH_SIZE) {
        const batch = kanjiToActuallyFetch.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i/BATCH_SIZE + 1}/${Math.ceil(kanjiToActuallyFetch.length/BATCH_SIZE)}: ${batch.length} kanji`);
        
        try {
          const { data, error } = await supabase
            .from('kanji_dex')
            .select('kanji, meanings')
            .in('kanji', batch);
          
          if (error && Object.keys(error).length > 0) {
            console.error(`Error fetching batch ${i/BATCH_SIZE + 1}:`, error);
            continue; // Try the next batch instead of failing completely
          }
          
          if (!data || !Array.isArray(data)) {
            console.error(`No data returned for batch ${i/BATCH_SIZE + 1}`);
            continue;
          }
          
          // Add results to the meanings map
          data.forEach(item => {
            if (item.kanji && Array.isArray(item.meanings) && item.meanings.length > 0) {
              meaningsMap[item.kanji] = item.meanings;
              loadedKanji.add(item.kanji);
            }
          });
        } catch (batchError) {
          console.error(`Error processing batch ${i/BATCH_SIZE + 1}:`, batchError);
        }
      }
      
      setKanjiMeanings(meaningsMap);
      console.log('Kanji meanings loaded:', Object.keys(meaningsMap).length, 'out of', kanjiToFetch.length, 'requested');
      
      // Log any missing meanings for debugging
      const missingMeanings = kanjiToFetch.filter(k => !meaningsMap[k]);
      if (missingMeanings.length > 0) {
        console.log('Kanji without loaded meanings:', missingMeanings);
      }
    } catch (error) {
      console.error('Unexpected error fetching kanji meanings:', error);
    }
  }, [supabase, user, supabaseKanji, discoveredKanji, kanjiMeanings]);

  // Define some common radical meanings (since they may not be in the database)
  const initializeRadicalMeanings = useCallback(() => {
    // Common radical meanings - you can expand this list as needed
    const commonRadicalMeanings: Record<string, string> = {
      "口": "mouth",
      "一": "one",
      "｜": "line",
      "ノ": "bend",
      "木": "tree",
      "日": "sun/day",
      "二": "two",
      "土": "earth",
      "田": "field",
      "亠": "lid",
      "人": "person",
      "女": "woman",
      "子": "child",
      "心": "heart",
      "手": "hand",
      "水": "water",
      "火": "fire",
      "石": "stone",
      "言": "speech",
      "金": "metal/gold",
      "力": "power",
      "山": "mountain",
      "王": "king",
      "大": "big",
      "小": "small",
      "中": "middle",
      "刀": "knife",
      "月": "moon",
      "糸": "thread",
      "門": "gate",
      "足": "foot",
      "車": "car",
      "雨": "rain",
      "食": "eat",
      "禾": "grain",
      "示": "show",
      "立": "stand",
      "辶": "walk",
      "目": "eye",
      "竹": "bamboo",
      "米": "rice",
      "耳": "ear",
      "魚": "fish"
    };
    
    setRadicalMeanings(commonRadicalMeanings);
  }, []);

  // Load kanji meanings and initialize radical meanings
  useEffect(() => {
    fetchKanjiMeanings();
    initializeRadicalMeanings();
  }, [fetchKanjiMeanings, initializeRadicalMeanings]);
  
  // Add a ref to track current state to prevent unnecessary refreshes
  const kanjiRefreshStateRef = useRef({
    userKanjiLength: 0,
    discoveredKanjiSize: 0
  });

  // Reload kanji meanings when discovered kanji change
  useEffect(() => {
    // Skip if no kanji to fetch
    if ((user && supabaseKanji.length === 0) && (!user && discoveredKanji.size === 0)) {
      return;
    }
    
    // Check if the counts have actually changed to prevent loops
    const currentState = {
      userKanjiLength: user ? supabaseKanji.length : 0,
      discoveredKanjiSize: !user ? discoveredKanji.size : 0
    };
    
    const prevState = kanjiRefreshStateRef.current;
    
    // Only fetch if the counts have changed
    if (
      (user && currentState.userKanjiLength !== prevState.userKanjiLength) ||
      (!user && currentState.discoveredKanjiSize !== prevState.discoveredKanjiSize)
    ) {
      console.log(
        'Discovered kanji changed, updating meanings',
        user ? `Supabase: ${currentState.userKanjiLength} (was ${prevState.userKanjiLength})` :
        `Local: ${currentState.discoveredKanjiSize} (was ${prevState.discoveredKanjiSize})`
      );
      
      // Update the ref with current state
      kanjiRefreshStateRef.current = currentState;
      
      // Fetch kanji meanings
      fetchKanjiMeanings();
    }
  }, [user, supabaseKanji.length, discoveredKanji.size, fetchKanjiMeanings]);

  // Calculate sidebarRadicals based on unlocked radical count
  const sidebarRadicals = useMemo(() => {
    // Make sure we have sorted radicals data before calculating
    if (!sortedRadicals || sortedRadicals.length === 0) {
      return [];
    }
    
    // Take the first unlockedRadicalCount radicals from the sorted list
    // and convert them to the format expected by the UI
    return sortedRadicals
      .slice(0, unlockedRadicalCount)
      .filter(radical => kanjiData?.radicalToKanji[radical]) // Ensure radical exists in data
      .map(radical => ({ 
        char: radical,
        meaning: radicalMeanings[radical]
      }));
  }, [sortedRadicals, unlockedRadicalCount, kanjiData, radicalMeanings]);

  // Update the function that creates new element
  const createNewElement = useCallback((type: 'radical' | 'kanji', character: string, position: ElementPosition): GameElement => {
    const meaning = type === 'kanji' 
      ? (kanjiMeanings[character] && kanjiMeanings[character].length > 0 ? kanjiMeanings[character][0] : undefined)
      : radicalMeanings[character];
    
    return {
      id: generateUniqueId(type, character),
      type,
      char: character,
      position,
      isDragging: false,
      touchingElements: new Set(),
      meaning
    };
  }, [kanjiMeanings, radicalMeanings, generateUniqueId]);

  if (loadingData) {
    console.log('Rendering loading screen, loadingData =', loadingData);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2E8DC] dark:bg-[#38332E]">
        <GameNav />
        <div className="text-2xl">Loading game data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F2E8DC] dark:bg-[#38332E]">
      <GameNav />
      
      {/* Connection status indicator */}
      {connectionStatus.connected === false && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 dark:bg-red-700 text-white p-2 text-center z-50">
          <p className="text-sm">{connectionStatus.message}</p>
          <button 
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="mt-1 px-3 py-1 bg-white text-red-700 text-xs rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {isRetrying ? 'Reconnecting...' : 'Retry Connection'}
          </button>
        </div>
      )}
      
      {/* Main game area */}
      <div className="flex-1 flex">
        {/* Kanji Details Dialog */}
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
                  <h3 className="text-lg font-semibold text-black dark:text-white border-b border-stone-200 dark:border-stone-700 pb-1">
                    Meanings
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {kanjiDetails.meanings.map((meaning, idx) => (
                      <span 
                        key={`meaning-${idx}`} 
                        className="px-2 py-1 bg-stone-200 dark:bg-stone-700 rounded-md text-sm text-stone-800 dark:text-stone-200"
                      >
                        {meaning}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* On readings */}
                {kanjiDetails.on_reading && kanjiDetails.on_reading.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-black dark:text-white border-b border-stone-200 dark:border-stone-700 pb-1">
                      On Reading (音読み)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {kanjiDetails.on_reading.map((reading, idx) => (
                        <span 
                          key={`on-${idx}`} 
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded-md text-sm text-blue-800 dark:text-blue-200"
                        >
                          {reading}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Kun readings */}
                {kanjiDetails.kun_reading && kanjiDetails.kun_reading.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-black dark:text-white border-b border-stone-200 dark:border-stone-700 pb-1">
                      Kun Reading (訓読み)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {kanjiDetails.kun_reading.map((reading, idx) => (
                        <span 
                          key={`kun-${idx}`} 
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/40 rounded-md text-sm text-green-800 dark:text-green-200"
                        >
                          {reading}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-stone-500 dark:text-stone-400">
                No kanji details available
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={handleCloseKanjiDetails}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Game Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="sm:max-w-[500px] bg-stone-50/80 dark:bg-stone-800/80">
            <DialogHeader>
              <DialogTitle className="text-2xl text-black dark:text-white">Welcome to Jijutsu! 字術</DialogTitle>
              <DialogDescription className="text-base mt-2 text-black/70 dark:text-white/80">
                Discover kanji by combining their component radicals
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-black dark:text-white">How to Play:</h3>
                <ul className="list-disc pl-5 space-y-2 text-black/70 dark:text-white/80">
                  <li>Drag radicals from the sidebar into the main workspace.</li>
                  <li>Move radicals around and bring them close to each other to combine them.</li>
                  <li>When you have the exact set of radicals needed to form a kanji, they&apos;ll merge automatically!</li>
                  <li>Discovered kanji will appear in the sidebar. You can also use these to create more complex kanji.</li>
                  <li>When you see a blinking outline, it means you&apos;re close to forming a kanji!</li>
                  <li>Drag unwanted elements to the trash can to remove them.</li>
                  <li>The more kanji you discover, the more radicals you unlock!</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-black dark:text-white">Tips:</h3>
                <ul className="list-disc pl-5 space-y-2 text-black/70 dark:text-white/80">
                  <li>Start with simple combinations of 2-3 radicals.</li>
                  <li>Experiment! Not all combinations will create kanji.</li>
                  <li>Try to discover as many kanji as you can!</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowInstructions(false)}>Start Playing!</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main game area */}
        <div 
          ref={gameAreaRef}
          className="flex-1 relative" 
          onMouseMove={(e) => (draggedElementId || isDraggingFromSidebar) && handleDrag(e.clientX, e.clientY)}
          onMouseUp={() => handleEndDrag()}
          onMouseLeave={() => handleEndDrag()}
          onTouchMove={(e) => {
            if ((draggedElementId || isDraggingFromSidebar) && e.touches[0]) {
              handleDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={() => handleEndDrag()}
          onTouchCancel={() => handleEndDrag()}
        >
          {/* Kanji Counter */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm px-4 py-1 rounded-full shadow-sm flex items-center">
            <span className="text-base font-medium dark:text-stone-300">Discovered: </span>
            <span className="text-xl font-bold text-[#78B693] dark:text-[#78B693] ml-2">
              {user ? userKanjiCount : discoveredKanji.size}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">kanji</span>
          </div>

          {/* Clear Button */}
          <div className="absolute bottom-6 right-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearGameArea}
              className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm"
            >
              Clear Workspace
            </Button>
          </div>

          {/* Trash Can */}
          <div 
            ref={trashCanRef}
            className={`absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${isOverTrash ? 'bg-red-100 dark:bg-red-900 scale-125' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            style={{ 
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 5 // Keep it above background but below dragged elements
            }}
            title="Drag elements here to delete them"
            aria-label="Delete area"
          >
            <Trash2 
              size={28} 
              className={`transition-all duration-200 ${isOverTrash ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}
            />
            {isOverTrash && (
              <div className="absolute bottom-full mb-2 whitespace-nowrap rounded bg-black dark:bg-white px-2 py-1 text-xs text-white dark:text-black">
                Release to delete
              </div>
            )}
          </div>

          {/* Theme Toggle and Help Button */}
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowMeanings(!showMeanings)}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-transparent p-0 flex items-center gap-1"
              title="Toggle meanings"
            >
              {showMeanings ? "Hide Meanings" : "Show Meanings"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowInstructions(true)}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-transparent p-0 flex items-center gap-1"
            >
              <Info size={16} /> Help
            </Button>
          </div>

          {/* Game elements */}
          {elements.filter(el => el.position.x !== 0 || el.position.y !== 0).map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-grab select-none ${element.isDragging ? 'opacity-70 cursor-grabbing z-50' : 'opacity-100 z-10'} ${element.type === 'kanji' ? 'text-xl font-bold text-white' : 'text-lg'} rounded-md flex flex-col items-center justify-center transition-all duration-150 ${element.className || ''}`}
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: '40px',
                height: showMeanings && element.meaning ? '65px' : '40px',
                backgroundColor: element.type === 'kanji' 
                  ? (hoveredElements.has(element.id) 
                    ? 'rgba(0, 79, 23, 0.9)' // #004F17 with 90% opacity for hovered kanji
                    : 'rgba(0, 79, 23, 0.8)') // #004F17 with 80% opacity for kanji
                  : (hoveredElements.has(element.id) 
                    ? 'rgba(120, 182, 147, 0.85)' // Slightly more opaque for hovered radicals
                    : 'rgba(120, 182, 147, 0.8)'), // #78B693 with 80% opacity for radicals
                userSelect: 'none',
                boxShadow: hoveredElements.has(element.id) 
                  ? '0 0 0 2px rgba(120, 182, 147, 1), 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
                  : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                transform: hoveredElements.has(element.id) ? 'scale(1.05)' : 'scale(1)',
                transition: element.isDragging ? 'none' : 'all 0.15s ease-in-out'
              }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleStartDrag(element.id, e.clientX, e.clientY, rect);
                e.preventDefault(); // Prevent text selection
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleStartDrag(element.id, e.touches[0].clientX, e.touches[0].clientY, rect);
                  e.preventDefault(); // Prevent scrolling
                }
              }}
            >
              <div>{element.char}</div>
              {showMeanings && element.meaning && (
                <div className="text-[8px] text-white mt-1 px-1 text-center leading-tight">
                  {element.meaning}
                </div>
              )}
            </div>
          ))}

          {/* Notifications */}
          <div className="absolute top-16 right-6 flex flex-col items-end space-y-2 max-w-xs">
            {notifications.map((notification) => {
              // Generate a stable but unique key for each notification item
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
                    {notification.kanji && (
                      <span className="text-xl font-bold mr-2">{notification.kanji}</span>
                    )}
                    <span>{notification.message}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Stop event propagation
                      console.log(`Manually closing notification: ${notification.id}`);
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

          {/* Auth buttons at bottom left */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            {isLoading ? (
              <div className="text-stone-400 text-sm">Loading...</div>
            ) : user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-700 hover:bg-transparent p-0 flex items-center gap-1"
              >
                <LogOut size={16} /> Sign out
              </Button>
            ) : (
              <>
                {/* Sign In Dialog */}
                <Dialog 
                  open={isSignInOpen} 
                  onOpenChange={(open) => {
                    console.log('Sign In dialog onOpenChange:', open);
                    // If we're closing this dialog via the X button, 
                    // make sure we're not opening the other one
                    if (!open) {
                      setIsSignInOpen(false);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        console.log('Sign In button clicked');
                        setIsSignInOpen(true);
                        setIsSignUpOpen(false);
                      }}
                    >
                      Sign in
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-stone-800/80 dark:bg-stone-50/80">
                    <DialogHeader>
                      <DialogTitle className="text-white dark:text-black">Sign in to Jijutsu</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-white dark:text-black">
                      <SignInForm 
                        onSwitchToSignUp={() => {
                          console.log('Switching from sign in to sign up');
                          setIsSignInOpen(false);
                          setTimeout(() => setIsSignUpOpen(true), 50);
                        }}
                        onSuccess={handleAuthSuccess}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Sign Up Dialog */}
                <Dialog 
                  open={isSignUpOpen} 
                  onOpenChange={(open) => {
                    console.log('Sign Up dialog onOpenChange:', open);
                    // If we're closing this dialog via the X button, 
                    // make sure we're not opening the other one
                    if (!open) {
                      setIsSignUpOpen(false);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => {
                        console.log('Sign Up button clicked');
                        setIsSignUpOpen(true);
                        setIsSignInOpen(false);
                      }}
                    >
                      Sign up
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-stone-800/80 dark:bg-stone-50/80">
                    <DialogHeader>
                      <DialogTitle className="text-white dark:text-black">Create your Jijutsu account</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-white dark:text-black">
                      <SignupForm 
                        onSuccess={handleAuthSuccess}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          {/* Tutorial cue */}
          {showTutorialCue && (
            <div className="absolute inset-0 z-30 pointer-events-none">
              <div className="absolute top-1/2 left-1/3 transform -translate-y-1/2">
                <div className="animate-float text-center">
                  <div className="w-16 h-16 bg-sky-100 rounded-lg shadow-md flex items-center justify-center text-xl mb-2 mx-auto">
                    一
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Drag radicals from sidebar
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <svg width="50" height="24" viewBox="0 0 50 24" className="text-gray-400">
                      <path 
                        d="M2,12 L48,12" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M42,6 L48,12 L42,18" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update the floating element to handle scroll position correctly */}
          {isDraggingFromSidebar && sidebarDraggedChar && (
            <div 
              className={`absolute z-50 pointer-events-none ${discoveredKanji.has(sidebarDraggedChar) || supabaseKanji.includes(sidebarDraggedChar) ? 'text-white' : ''}`}
              style={{
                left: `${mousePosition.x}px`,
                top: `${mousePosition.y}px`,
                width: '40px',
                height: '40px',
                backgroundColor: discoveredKanji.has(sidebarDraggedChar) || supabaseKanji.includes(sidebarDraggedChar)
                  ? 'rgba(0, 79, 23, 0.8)' // Dark green for kanji
                  : 'rgba(120, 182, 147, 0.8)', // Original color for radicals
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                opacity: 0.8,
                transform: `translate(-${dragOffset.x}px, -${dragOffset.y}px) scale(1.1)`,
                fontSize: '1.125rem'
              }}
            >
              {sidebarDraggedChar}
            </div>
          )}

          {/* Connection lines between elements */}
          {connections.map((connection, index) => {
            const fromElement = connection.from === 'sidebar' 
              ? { 
                  position: { 
                    x: mousePosition.x - gameAreaRef.current!.getBoundingClientRect().left - dragOffset.x,
                    y: mousePosition.y - gameAreaRef.current!.getBoundingClientRect().top - dragOffset.y
                  } 
                } 
              : elements.find(el => el.id === connection.from);
            const toElement = elements.find(el => el.id === connection.to);
            
            if (!fromElement || !toElement) return null;
            
            const fromX = fromElement.position.x + 20; // Center X of from element
            const fromY = fromElement.position.y + 20; // Center Y of from element
            const toX = toElement.position.x + 20; // Center X of to element
            const toY = toElement.position.y + 20; // Center Y of to element
            
            return (
              <svg 
                key={`connection-${index}`}
                className="absolute top-0 left-0 w-full h-full z-5 pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="rgba(120, 182, 147, 1)"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  opacity="0.6"
                />
              </svg>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l border-stone-200 dark:border-stone-700 flex flex-col overflow-y-auto bg-[#E8DED2] dark:bg-[#302B27]">
          {/* Radical container */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-700">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold dark:text-stone-300">Radicals ({sidebarRadicals.length})</h3>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {user ? (
                  <div className="flex items-center gap-1">
                    <span>Kanji: {userKanjiCount}</span>
                    <span>•</span>
                    <span>Next at: {(Math.floor(userKanjiCount / 10) + 1) * 10}</span>
                  </div>
                ) : (
                  <div>Sign in to track progress</div>
                )}
              </div>
            </div>
            
            {/* Progress bar for unlocking the next radical */}
            {user && (
              (() => {
                console.log('Progress bar rendering with userKanjiCount:', userKanjiCount, 'percent:', (userKanjiCount % 10) * 10);
                return (
                  <div className="mt-2 mb-3">
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#78B693] h-full rounded-full transition-all duration-300 ease-out"
                        style={{ 
                          width: `${(userKanjiCount % 10) * 10}%`,
                          minWidth: userKanjiCount > 0 ? '5%' : '0%'
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-stone-500 dark:text-stone-400">
                      <span>{10 - (userKanjiCount % 10)} until next radical</span>
                      <span>{sidebarRadicals.length} of {sortedRadicals.length} radicals</span>
                    </div>
                  </div>
                );
              })()
            )}
            
            {/* Unlocked radicals grid */}
            <div className="grid grid-cols-8 gap-2 grid-flow-row-dense auto-rows-min">
              {sidebarRadicals.map((radical, index) => (
                <div
                  key={index}
                  className="w-10 h-10 flex flex-col items-center justify-center bg-[#78B693] rounded-md text-white cursor-grab relative group hover:bg-[#6BA684] active:bg-[#5E9373]"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleSidebarDragStart(radical.char, e.clientX, e.clientY, rect);
                    e.preventDefault(); // Prevent text selection
                  }}
                  onTouchStart={(e) => {
                    if (e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSidebarDragStart(radical.char, e.touches[0].clientX, e.touches[0].clientY, rect);
                      e.preventDefault();
                    }
                  }}
                  title={radical.meaning || radical.char}
                >
                  {radical.char}
                  {showMeanings && radical.meaning && (
                    <div className="text-[6px] mt-0.5 leading-tight">
                      {radical.meaning}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Show next few locked radicals */}
            {user && sortedRadicals.length > unlockedRadicalCount && (
              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400">Coming Next</h4>
                  <div className="text-xs text-stone-400 dark:text-stone-500">
                    Unlock more by creating kanji
                  </div>
                </div>
                <div className="grid grid-cols-17 gap-1 grid-flow-row-dense auto-rows-min">
                  {sortedRadicals.slice(unlockedRadicalCount, unlockedRadicalCount + 5)
                    .filter(radical => kanjiData?.radicalToKanji[radical]) // Ensure the radical exists in data
                    .map((radical, index) => {
                      const radicalKey = `locked-radical-${index}-${radical}`;
                      
                      return (
                        <div
                          key={radicalKey}
                          className="w-4 h-4 text-xs flex items-center justify-center rounded opacity-50 cursor-not-allowed select-none relative"
                          style={{
                            backgroundColor: 'rgba(120, 120, 120, 0.4)',
                            userSelect: 'none'
                          }}
                          title="Keep creating kanji to unlock this radical"
                        >
                          <span className="opacity-70">{radical}</span>
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-stone-300 dark:bg-stone-600 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500 dark:text-stone-400">
                              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                            </svg>
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          
          {/* Discovered kanji container */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold dark:text-stone-300">
                Discovered Kanji ({user ? userKanjiCount : discoveredKanji.size})
              </h3>
              
              {((user && userKanjiCount > 0) || (!user && discoveredKanji.size > 0)) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetProgress}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs p-1 h-auto"
                >
                  Reset
                </Button>
              )}
            </div>
            
            {/* Instruction for right-clicking kanji */}
            {((user && userKanjiCount > 0) || (!user && discoveredKanji.size > 0)) && (
              <p className="text-stone-500 dark:text-stone-400 text-xs mb-2 italic">
                Right-click on kanji to learn more about them!
              </p>
            )}
            
            {(user ? userKanjiCount === 0 : discoveredKanji.size === 0) ? (
              <div className="text-stone-400 dark:text-stone-500 text-sm">
                Drag and combine radicals to discover kanji!
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-2 grid-flow-row-dense auto-rows-min">
                {(user ? supabaseKanji : Array.from(discoveredKanji)).map((kanji, index) => {
                  // Generate a stable unique key for each discovered kanji
                  const kanjiKey = `discovered-${kanji}-${index}`;
                  
                  return (
                    <div
                      key={kanjiKey}
                      data-kanji={kanji}
                      className="flex flex-col items-center"
                    >
                      <div 
                        className="w-9 h-9 flex items-center justify-center rounded cursor-pointer select-none relative group text-white"
                        style={{ 
                          backgroundColor: 'rgba(0, 79, 23, 0.9)', // #004F17 with 90% opacity
                          userSelect: 'none',
                          zIndex: 30 // Ensure it's above other elements
                        }}
                        onContextMenu={(e) => {
                          // Show dictionary on right-click instead of context menu
                          e.preventDefault();
                          console.log('Right-click on kanji, showing dictionary:', kanji);
                          setSelectedKanji(kanji);
                          fetchKanjiDetails(kanji);
                          return false;
                        }}
                        onMouseDown={(e) => {
                          // Use left-click for dragging (button 0 is left mouse button)
                          if (e.button === 0) { // Left mouse button
                            console.log('Left click on kanji, starting drag:', kanji);
                            const rect = e.currentTarget.getBoundingClientRect();
                            handleSidebarDragStart(kanji, e.clientX, e.clientY, rect);
                            e.preventDefault();
                          }
                        }}
                        onTouchStart={(e) => {
                          // For touch devices - long press will be for dragging
                          // Short tap will show info
                          console.log('Touch start on kanji:', kanji);
                          
                          // Set up a timer for long press
                          const timer = setTimeout(() => {
                            // This will be a long press - start drag
                            const touch = e.touches[0];
                            const rect = e.currentTarget.getBoundingClientRect();
                            handleSidebarDragStart(kanji, touch.clientX, touch.clientY, rect);
                          }, 500); // 500ms for long press
                          
                          // Store the timer ID
                          e.currentTarget.setAttribute('data-timer', String(timer));
                          
                          // Don't prevent default here to allow both tap and long press
                        }}
                        onTouchEnd={(e) => {
                          // Clear the long press timer on touch end
                          const timer = e.currentTarget.getAttribute('data-timer');
                          if (timer) {
                            clearTimeout(Number(timer));
                            e.currentTarget.removeAttribute('data-timer');
                            
                            // If this is a short tap (not a drag), show info
                            if (!isDraggingFromSidebar) {
                              e.preventDefault();
                              setSelectedKanji(kanji);
                              fetchKanjiDetails(kanji);
                            }
                          }
                        }}
                        onTouchCancel={(e) => {
                          // Also clear timer on touch cancel
                          const timer = e.currentTarget.getAttribute('data-timer');
                          if (timer) {
                            clearTimeout(Number(timer));
                            e.currentTarget.removeAttribute('data-timer');
                          }
                        }}
                      >
                        {kanji}
                      </div>
                      {showMeanings && kanjiMeanings[kanji] && kanjiMeanings[kanji].length > 0 && (
                        <div className="text-[9px] mt-1 text-center text-black dark:text-white w-full">
                          {kanjiMeanings[kanji][0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* User info at bottom */}
          {user && (
            <div className="p-4 border-t border-stone-200 dark:border-stone-700">
              <div className="text-sm font-medium">
                <div className="text-stone-600 dark:text-stone-400">Logged in as:</div>
                <div className="text-stone-900 dark:text-stone-200">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="bg-slate-800 text-white p-6 rounded-lg">
        Loading game...
      </div>
    </div>}>
      <GamePageClient />
    </Suspense>
  );
} 