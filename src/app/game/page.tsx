'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SignInForm } from '@/components/SignInForm';
import { SignupForm } from '@/components/SignupForm';
import { supabase } from '@/lib/supabase';
import { LogOut, Info, X, Trash2 } from 'lucide-react';
import { ClientLayout } from '@/components/ClientLayout';
import MainLayout from '@/components/MainLayout';
import { useKanjiRadicals } from '@/hooks/useKanjiRadicals';
import { ThemeToggle } from '@/components/ThemeToggle';
import GameNav from '@/components/GameNav';
import { AuthStateListener } from '@/components/AuthStateListener';
import './animations.css';

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

export default function GamePage() {
  // Auth state
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Game state
  const { data: kanjiData, loading: loadingData } = useKanjiRadicals();
  const [elements, setElements] = useState<GameElement[]>([]);
  const [discoveredKanji, setDiscoveredKanji] = useState<Set<string>>(new Set());
  const [supabaseKanji, setSupabaseKanji] = useState<string[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // Game instruction dialog
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Notification system
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Tracking drag state
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<ElementPosition>({ x: 0, y: 0 });
  
  // Add state for tracking trash can hover
  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashCanRef = useRef<HTMLDivElement>(null);
  
  // Add a state for first-time tutorial
  const [showTutorialCue, setShowTutorialCue] = useState(false);
  
  // Add this to the existing game state variables
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [sidebarDraggedChar, setSidebarDraggedChar] = useState<string | null>(null);
  
  // Add these state variables to track mouse position
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Add state for tracking which elements are being hovered
  const [hoveredElements, setHoveredElements] = useState<Set<string>>(new Set());
  
  // Add a state to track connections between elements
  const [connections, setConnections] = useState<{from: string, to: string}[]>([]);
  
  // Add state for tracking dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Add state for unlocked radicals
  const [sortedRadicals, setSortedRadicals] = useState<string[]>([]);
  const [unlockedRadicalCount, setUnlockedRadicalCount] = useState<number>(10); // Start with 10
  const [userKanjiCount, setUserKanjiCount] = useState<number>(0);
  
  // Add a debounce map to track recent discoveries
  const recentDiscoveries = new Map<string, number>();
  const DISCOVERY_COOLDOWN = 2000; // 2 seconds cooldown
  
  // Add state for kanji details dialog
  const [selectedKanji, setSelectedKanji] = useState<string | null>(null);
  const [kanjiDetails, setKanjiDetails] = useState<KanjiDetails | null>(null);
  const [isKanjiDetailsOpen, setIsKanjiDetailsOpen] = useState(false);
  const [loadingKanjiDetails, setLoadingKanjiDetails] = useState(false);
  
  // Add this state declaration near the other useState hooks
  const [lastAddedElementId, setLastAddedElementId] = useState<string | null>(null);
  
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
    if (!kanjiData || loadingData) return;
    
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
  }, [kanjiData, loadingData]);

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

  // Fetch user's kanji count and kanji list from Supabase when user changes
  useEffect(() => {
    if (!user) {
      // If not logged in, set to default (10 radicals)
      setUnlockedRadicalCount(10);
      setUserKanjiCount(0);
      setSupabaseKanji([]); // Clear Supabase kanji when logging out
      return;
    }

    // Fetch user's kanji count and kanji list from Supabase
    fetchUserKanjiData();
  }, [user, discoveredKanji.size]); // Refetch when user changes or discoveredKanji changes

  // Function to add a notification
  const addNotification = (message: string, type: 'success' | 'info' = 'info', kanji?: string) => {
    // Generate a unique ID with timestamp plus random suffix
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, message, type, kanji }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Extract fetchUserKanjiData to its own function so it can be reused
  const fetchUserKanjiData = useCallback(async () => {
    if (!user) return;
    
    try {
      // First get the count
      const { count, error: countError } = await supabase
        .from('user_kanji')
        .select('*', { count: 'exact', head: false })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error fetching user kanji count:', countError);
        return;
      }

      // Set the user's kanji count
      setUserKanjiCount(count || 0);
      
      // Calculate unlocked radicals: 10 base + 1 per 10 kanji created
      const unlockedRadicals = 10 + Math.floor((count || 0) / 10);
      setUnlockedRadicalCount(unlockedRadicals);
      
      // Add notification about unlocked radicals
      if ((count || 0) > 0 && (count || 0) % 10 === 0) {
        addNotification(`You've unlocked a new radical!`, 'success');
      }

      // Then get the actual kanji characters
      const { data: userKanjiData, error: kanjiError } = await supabase
        .from('user_kanji')
        .select(`
          kanji_id,
          kanji_dex:kanji_id(kanji)
        `)
        .eq('user_id', user.id);

      if (kanjiError) {
        console.error('Error fetching user kanji:', kanjiError);
        return;
      }

      // Extract kanji characters from the nested JSON response
      if (userKanjiData && userKanjiData.length > 0) {
        // Define a more specific type to handle the nested structure
        interface KanjiDexResponse {
          kanji_id: string;
          kanji_dex: { kanji: string } | null;
        }
        
        const typedData = userKanjiData as unknown as KanjiDexResponse[];
        
        const kanjiList = typedData
          .map(item => item.kanji_dex?.kanji)
          .filter(Boolean) as string[];
        
        setSupabaseKanji(kanjiList);
        
        // Also update the local kanji set for compatibility
        setDiscoveredKanji(new Set(kanjiList));
      } else {
        // No kanji found, clear lists
        setSupabaseKanji([]);
        setDiscoveredKanji(new Set());
      }
    } catch (error) {
      console.error('Error in fetchUserKanjiData:', error);
    }
  }, [user]);

  // Function to record kanji discovery in Supabase
  const recordKanjiDiscovery = async (kanji: string) => {
    if (!user) return; // Only record for authenticated users
    
    // Check if this kanji was recently discovered to prevent loops
    const lastDiscoveryTime = recentDiscoveries.get(kanji);
    const now = Date.now();
    if (lastDiscoveryTime && (now - lastDiscoveryTime) < DISCOVERY_COOLDOWN) {
      console.log('Skipping duplicate discovery attempt for:', kanji);
      return;
    }
    recentDiscoveries.set(kanji, now);
    
    // Clean up old entries from recentDiscoveries
    for (const [k, time] of recentDiscoveries.entries()) {
      if (now - time > DISCOVERY_COOLDOWN) {
        recentDiscoveries.delete(k);
      }
    }

    try {
      console.log('Starting kanji discovery process for:', kanji);
      console.log('User ID:', user.id);
      
      // First check if user already has this kanji
      const { data: existingKanji, error: existingError } = await supabase
        .from('user_kanji')
        .select('kanji_id')
        .eq('user_id', user.id)
        .single();

      if (existingKanji) {
        console.log('User already has this kanji:', kanji);
        return;
      }

      if (existingError && existingError.code !== 'PGRST116') {  // PGRST116 means no rows returned
        console.error('Error checking existing kanji:', existingError);
        return;
      }
      
      // Get the kanji_id from kanji_dex table
      const { data: kanjiData, error: kanjiError } = await supabase
        .from('kanji_dex')
        .select('id, kanji, dex_number, meanings')
        .eq('kanji', kanji)
        .single();

      console.log('Kanji lookup query result:', {
        kanji: kanji,
        data: kanjiData,
        error: kanjiError ? {
          message: kanjiError.message,
          code: kanjiError.code,
          details: kanjiError.details
        } : null
      });

      if (kanjiError) {
        console.error('Error finding kanji in dex:', kanjiError);
        return;
      }

      if (!kanjiData?.id) {
        console.error('Kanji not found in dex. Details:', {
          searchedKanji: kanji,
          receivedData: kanjiData,
          dexNumber: kanjiData?.dex_number,
          meanings: kanjiData?.meanings
        });
        return;
      }

      console.log('Found kanji in dex:', {
        id: kanjiData.id,
        kanji: kanjiData.kanji,
        dexNumber: kanjiData.dex_number,
        meanings: kanjiData.meanings
      });

      // Insert into user_kanji table
      const { data: insertData, error: insertError } = await supabase
        .from('user_kanji')
        .insert([{
          user_id: user.id,
          kanji_id: kanjiData.id
        }])
        .select();

      if (insertError) {
        // If it's a duplicate, that's fine - user already discovered this kanji
        if (insertError.code === '23505') { // Postgres unique violation code
          console.log('Kanji already discovered by user:', {
            userId: user.id,
            kanjiId: kanjiData.id
          });
          return;
        }
        console.error('Error recording kanji discovery:', {
          error: insertError,
          userId: user.id,
          kanjiId: kanjiData.id
        });
        return;
      }

      console.log('Successfully recorded kanji discovery:', {
        userId: user.id,
        kanjiId: kanjiData.id,
        insertedData: insertData
      });

      // Successfully recorded kanji, update count and kanji list
      setUserKanjiCount(prev => {
        const newCount = prev + 1;
        // Check if this unlocks a new radical
        if (newCount % 10 === 0) {
          // Increment the unlocked radical count
          setUnlockedRadicalCount(10 + Math.floor(newCount / 10));
          addNotification(`You've unlocked a new radical!`, 'success');
        }
        return newCount;
      });

        // Add the new kanji to the Supabase kanji list
        setSupabaseKanji(prev => [...prev, kanji]);
        // Also update the local kanji set for compatibility
        setDiscoveredKanji(prev => new Set([...prev, kanji]));

    } catch (error) {
      console.error('Unexpected error in recordKanjiDiscovery:', error);
    }
  };

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            const previousUser = user;
            const currentUser = session?.user || null;
            
            // If user just signed in (previously null, now has value)
            if (!previousUser && currentUser) {
              syncLocalKanjiToDatabase(currentUser);
            }
            
            setUser(currentUser);
          }
        );
        
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

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
    setDraggedElement(elementId);
    
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
    if (isDraggingFromSidebar || draggedElement) {
      const gameElements = elements.filter(el => (el.position.x !== 0 || el.position.y !== 0) && el.id !== draggedElement);
      const hoveredElements = new Set<string>();
      const newConnections: {from: string, to: string}[] = [];
      const elementWidth = 40;
      const elementHeight = 40;
      
      // Determine the position of the currently dragged element
      let draggedX = 0;
      let draggedY = 0;
      let draggedId = draggedElement || 'sidebar';
      
      if (draggedElement) {
        // If dragging an existing element, get its position from elements state
        const draggedElementObj = elements.find(el => el.id === draggedElement);
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
    if (draggedElement) {
      // Update element position, keeping it within game area bounds
      setElements(prev => prev.map(el => {
        if (el.id === draggedElement) {
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
                    id: `kanji-${Date.now()}-${kanji}`,
                    type: 'kanji',
                    char: kanji,
                    position: {
                      x: Math.min(...Array.from(hoveredElements).map(el => elements.find(e => e.id === el)?.position.x || 0)) + 10,
                      y: Math.min(...Array.from(hoveredElements).map(el => elements.find(e => e.id === el)?.position.y || 0)) + 10
                    },
                    isDragging: false,
                    touchingElements: new Set(),
                    className: 'kanji-created'
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
          const newId = `element-${Date.now()}-${sidebarDraggedChar}-${Math.random().toString(36).substr(2, 9)}`;
          
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
      setSidebarDraggedChar(null);
      setIsOverTrash(false);
    } 
    // Handle the case for regular dragged elements
    else if (draggedElement) {
      // If element is over trash can, delete it
      if (isOverTrash) {
        setElements(prev => prev.filter(el => el.id !== draggedElement));
        setIsOverTrash(false);
      } else {
        // Update element to no longer be dragging
        setElements(prev => prev.map(el => 
          el.id === draggedElement 
            ? { ...el, isDragging: false } 
            : el
        ));
        
        // Check for collisions and potential merges
        checkElementCollisions(draggedElement);
      }
      
      // Reset drag state
      setDraggedElement(null);
    }
  };
  
  // Clone a radical from sidebar to game area
  const handleCloneRadical = (radical: string, clientX: number, clientY: number, elementRect: DOMRect) => {
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
    const newId = `element-${Date.now()}-${radical}-${Math.random().toString(36).substr(2, 9)}`;
    
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
  const checkElementCollisions = (changedElementId: string) => {
    if (!kanjiData) return;
    
    // Get all elements in the game area (not in sidebar)
    const gameElements = elements.filter(el => el.position.x !== 0 || el.position.y !== 0);
    
    // Find the changed element
    const changedElement = gameElements.find(el => el.id === changedElementId);
    if (!changedElement) return;
    
    // Check if this element is touching any others
    const elementWidth = 40;
    const elementHeight = 40;
    const margin = 10; // Same margin as in highlighting logic
    
    // Reset touching relationships for this element
    changedElement.touchingElements = new Set();
    
    // Gather all elements that are touching the changed element
    const touchingIds = new Set<string>();
    
    // Define the bounding box of the changed element
    const changedLeft = changedElement.position.x;
    const changedRight = changedElement.position.x + elementWidth;
    const changedTop = changedElement.position.y;
    const changedBottom = changedElement.position.y + elementHeight;
    
    for (const otherEl of gameElements) {
      if (otherEl.id === changedElement.id) continue;
      
      // Define the bounding box of the other element
      const otherLeft = otherEl.position.x;
      const otherRight = otherEl.position.x + elementWidth;
      const otherTop = otherEl.position.y;
      const otherBottom = otherEl.position.y + elementHeight;
      
      // Check for overlap with margin
      const isOverlapping = 
        changedLeft - margin < otherRight + margin && 
        changedRight + margin > otherLeft - margin && 
        changedTop - margin < otherBottom + margin && 
        changedBottom + margin > otherTop - margin;
      
      if (isOverlapping) {
        touchingIds.add(otherEl.id);
        
        // Mark both elements as touching each other
        changedElement.touchingElements.add(otherEl.id);
        otherEl.touchingElements.add(changedElement.id);
      }
    }
    
    // If not touching anything, no need to proceed
    if (touchingIds.size === 0) {
      // Update element's touching set in the state
      setElements(prev => prev.map(el => 
        el.id === changedElement.id 
          ? { ...el, touchingElements: new Set() } 
        : el
      ));
      return;
    }
    
    // Now perform a breadth-first search to find all connected elements
    const touchingCluster = findConnectedElements(changedElement.id, gameElements);
    
    // Get all characters in the cluster
    const clusterElements = gameElements.filter(el => touchingCluster.has(el.id));
    const clusterChars = clusterElements.map(el => el.char);
    
    // New approach: Consider both direct and indirect combinations
    // 1. Try the direct combination of all characters in the cluster
    const directPossibleKanji = findPossibleKanji(clusterChars, kanjiData);
    
    // 2. Also try to expand kanji in the cluster to their component radicals
    let expandedClusterChars = [...clusterChars];
    let hasExpandedKanji = false;
    
    // Expand each kanji in the cluster to its radicals
    clusterElements.forEach(el => {
      if (el.type === 'kanji' && kanjiData.kanjiToRadicals[el.char]) {
        hasExpandedKanji = true;
        // Remove the kanji itself from the expanded list as we're replacing it with its components
        expandedClusterChars = expandedClusterChars.filter(char => char !== el.char);
        // Add all of its component radicals
        expandedClusterChars.push(...kanjiData.kanjiToRadicals[el.char]);
      }
    });
    
    // Only check the expanded list if we actually expanded some kanji
    const expandedPossibleKanji = hasExpandedKanji 
      ? findPossibleKanji(expandedClusterChars, kanjiData) 
      : [];
    
    // Combine both sets of possible kanji
    const possibleKanji = [...new Set([...directPossibleKanji, ...expandedPossibleKanji])];
    
    // For each possible kanji, check if the requirements match
    const newKanji: string[] = [];
    
    possibleKanji.forEach(kanji => {
      const requiredRadicals = new Set(kanjiData.kanjiToRadicals[kanji] || []);
      
      // First check direct match with cluster characters
      let directMatch = checkExactMatch(clusterChars, requiredRadicals);
      
      // If not a direct match and we have expanded some kanji, check the expanded list
      let expandedMatch = false;
      if (!directMatch && hasExpandedKanji) {
        expandedMatch = checkExactMatch(expandedClusterChars, requiredRadicals);
      }
      
      // If either match works and we haven't discovered this kanji yet, add it
      if ((directMatch || expandedMatch) && !discoveredKanji.has(kanji)) {
        newKanji.push(kanji);
        setDiscoveredKanji(prev => new Set([...prev, kanji]));
        // Show notification for discovered kanji
        addNotification(`You discovered ${kanji}!`, 'success', kanji);
        // Record the discovery in Supabase
        recordKanjiDiscovery(kanji);
      }
    });
    
    // Helper function to check if a set of characters exactly matches required radicals
    function checkExactMatch(chars: string[], requiredRadicals: Set<string>): boolean {
      // Special handling for kanji that need multiple of the same radical (like 林 needing 2x 木)
      // Check if we have at least the right radicals, in the right quantities
      
      // Count occurrences of each character in our cluster
      const charCounts = new Map<string, number>();
      chars.forEach(char => {
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      });
      
      // For requiredRadicals, we need to count occurrences too, but we need to infer from the data
      // Most of our data structure just lists each radical once, even if multiple are needed
      
      // First approach: Check if all required radicals exist at least once
      for (const radical of requiredRadicals) {
        if (!charCounts.has(radical)) return false;
      }
      
      // For special cases of multiple identical radicals:
      // If all radicals in the kanji are the same single radical (like 林 = 木+木)
      // Check if we have enough of that radical
      if (requiredRadicals.size === 1) {
        const [singleRadical] = requiredRadicals;
        // For kanji like 林, we need at least 2 of the radical
        // If our character count has at least 2, it's a potential match
        if (charCounts.get(singleRadical) && charCounts.get(singleRadical)! >= 2) {
          return true;
        }
      }
      
      // Standard case: check if we have exactly the right radicals
      // This usually catches most other cases where the radical compositions are more varied
      if (requiredRadicals.size !== charCounts.size) return false;
      
      // Check if all our characters are in the required list
      for (const [char, count] of charCounts.entries()) {
        if (!requiredRadicals.has(char)) return false;
      }
      
      return true;
    }
    
    // Update elements state with new touching information
    setElements(prev => {
      // First update all touching information
      const updated = prev.map(el => {
        if (touchingCluster.has(el.id)) {
          // Update touching info for elements in the cluster
          return {
            ...el,
            touchingElements: new Set([...el.touchingElements].filter(id => touchingCluster.has(id)))
          };
        }
        return el;
      });
      
      // If we created new kanji, replace the cluster with the kanji
      if (newKanji.length > 0) {
        // Calculate average position of the cluster for kanji placement
        const clusterElements = updated.filter(el => touchingCluster.has(el.id));
        const avgX = clusterElements.reduce((sum, el) => sum + el.position.x, 0) / clusterElements.length;
        const avgY = clusterElements.reduce((sum, el) => sum + el.position.y, 0) / clusterElements.length;
        
        // Create new kanji elements with guaranteed unique IDs
        const newKanjiElements = newKanji.map((kanji, idx) => {
          // Create a unique ID that includes the timestamp, kanji, and a random string
          const uniqueId = `kanji-${Date.now()}-${idx}-${kanji}-${Math.random().toString(36).substr(2, 9)}`;
          
          return {
            id: uniqueId,
            type: 'kanji' as const,
            char: kanji,
            position: { x: avgX, y: avgY },
            isDragging: false,
            touchingElements: new Set<string>(),
            className: 'merge-success ripple-effect' // Add animation classes
          };
        });
        
        // Remove all elements in the cluster and add the new kanji
        return [
          ...updated.filter(el => !touchingCluster.has(el.id)),
          ...newKanjiElements
        ];
      }
      
      return updated;
    });
  };
  
  // Find all elements connected in a cluster using breadth-first search
  const findConnectedElements = (startId: string, gameElements: GameElement[]): Set<string> => {
    const connected = new Set<string>([startId]);
    const queue = [startId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentElement = gameElements.find(el => el.id === currentId);
      
      if (!currentElement) continue;
      
      // Add all touching elements that haven't been processed yet
      currentElement.touchingElements.forEach(id => {
        if (!connected.has(id)) {
          connected.add(id);
          queue.push(id);
        }
      });
    }
    
    return connected;
  };
  
  // Find kanji that can be formed from a set of characters
  const findPossibleKanji = (chars: string[], kanjiData: KanjiRadicalsData): string[] => {
    if (!chars.length || !kanjiData) return [];
    
    // Fix type annotation to properly handle string sets
    const kanjiSets = chars.map(char => {
      // Check if this is a direct radical
      if (kanjiData.radicalToKanji[char]) {
        return new Set<string>(kanjiData.radicalToKanji[char] || []);
      }
      // If it's a kanji, find all kanji that contain its radicals
      else if (kanjiData.kanjiToRadicals[char]) {
        // First find all kanji that contain this kanji as a component
        // This is a simplification since we don't have direct kanji->kanji mapping
        // We're finding kanji that share all the same radicals as this kanji
        const radicals = kanjiData.kanjiToRadicals[char];
        
        // Start with all kanji from the first radical
        if (!radicals.length) return new Set<string>();
        
        let potentialKanji = new Set<string>(kanjiData.radicalToKanji[radicals[0]] || []);
        
        // Intersect with kanji from each other radical
        for (let i = 1; i < radicals.length; i++) {
          const radical = radicals[i];
          const kanjiWithRadical = new Set<string>(kanjiData.radicalToKanji[radical] || []);
          
          potentialKanji = new Set(
            [...potentialKanji].filter(k => kanjiWithRadical.has(k))
          );
        }
        
        return potentialKanji;
      }
      
      return new Set<string>();
    });
    
    // If any character isn't associated with any kanji, return empty array
    if (kanjiSets.some(set => set.size === 0)) return [];
    
    // Find kanji that appear in all sets
    let result = kanjiSets[0];
    
    for (let i = 1; i < kanjiSets.length; i++) {
      result = new Set([...result].filter(kanji => kanjiSets[i].has(kanji)));
    }
    
    return Array.from(result);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    if (mode === 'signin') {
      setIsSignInOpen(true);
      setIsSignUpOpen(false);
    } else {
      setIsSignUpOpen(true);
      setIsSignInOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthSuccess = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
  };

  // Filter elements to get only the unique radicals for the sidebar
  const sidebarRadicals = useMemo(() => {
    if (!kanjiData || !sortedRadicals.length) return [];
    
    // Get the unlocked radicals based on the unlocked count
    const unlockedRadicals = sortedRadicals.slice(0, unlockedRadicalCount);
    
    // Filter available radicals to only include unlocked ones
    return unlockedRadicals
      .filter(radical => kanjiData.radicalToKanji[radical]) // Ensure the radical exists in data
      .map(radical => ({ char: radical }));
  }, [kanjiData, sortedRadicals, unlockedRadicalCount]);

  // Function to clear all elements from the game area
  const clearGameArea = () => {
    // Filter out elements that are in the game area (not in sidebar)
    setElements(prev => prev.filter(el => el.position.x === 0 && el.position.y === 0));
  };

  // Function to reset all progress
  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset your progress? All discovered kanji will be lost.')) {
      if (user) {
        // For logged in users, delete all kanji from Supabase
        const deleteUserKanji = async () => {
          try {
            // Ensure we're only deleting the current user's data
            if (!user.id) {
              console.error('Error: User ID is missing');
              addNotification('Failed to reset progress: User ID is missing', 'info');
              return;
            }

            console.log('Attempting to delete kanji for user ID:', user.id);
            
            // First, check if we can read the user's kanji to verify auth is working
            const { data: userKanji, error: readError } = await supabase
              .from('user_kanji')
              .select('*')
              .eq('user_id', user.id);
              
            if (readError) {
              console.error('Error reading user kanji before deletion:', readError);
              addNotification('Failed to reset: Cannot read user data', 'info');
              return;
            }
            
            console.log(`Found ${userKanji?.length || 0} kanji records for user`);
            
            // Now attempt to delete the records
            const { error: deleteError, count } = await supabase
              .from('user_kanji')
              .delete({ count: 'exact' })
              .eq('user_id', user.id);
            
            if (deleteError) {
              console.error('Error deleting user kanji:', deleteError);
              // Show more detailed error message
              const errorMessage = deleteError.message || 'Unknown error';
              addNotification(`Failed to reset progress: ${errorMessage}`, 'info');
              return;
            }
            
            console.log(`Successfully deleted ${count || 0} kanji records`);
            
            // Reset counts and lists
            setUserKanjiCount(0);
            setSupabaseKanji([]);
            setUnlockedRadicalCount(10); // Reset to default 10 radicals
            clearGameArea(); // Clear the game area too
            addNotification(`Progress has been reset. ${count || 0} kanji removed.`, 'info');
          } catch (error) {
            // More detailed error logging
            console.error('Unexpected error in deleteUserKanji:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            addNotification(`Failed to reset progress: ${errorMessage}`, 'info');
          }
        };
        
        deleteUserKanji();
      } else {
        // For non-logged in users, just clear localStorage
        setDiscoveredKanji(new Set());
        localStorage.removeItem('jijutsu_discovered_kanji');
        addNotification('Progress has been reset', 'info');
      }
    }
  };

  // Check if this is the first visit and show instructions if it is
  useEffect(() => {
    // Check if user has seen instructions before
    const hasSeenInstructions = localStorage.getItem('jijutsu_has_seen_instructions');
    if (!hasSeenInstructions) {
      setShowInstructions(true);
      // Mark that user has seen instructions
      localStorage.setItem('jijutsu_has_seen_instructions', 'true');
    }
  }, []);

  // Add a function to sync localStorage kanji to database when user signs in
  const syncLocalKanjiToDatabase = async (currentUser: any) => {
    if (!currentUser) return;
    
    try {
      // Get kanji from localStorage
      const savedKanji = localStorage.getItem('jijutsu_discovered_kanji');
      if (!savedKanji || JSON.parse(savedKanji).length === 0) return;
      
      const localKanji = JSON.parse(savedKanji) as string[];
      console.log(`Found ${localKanji.length} kanji in localStorage to sync`);
      
      // For each kanji in localStorage, add it to the user's account
      let syncedCount = 0;
      
      for (const kanji of localKanji) {
        // Get the kanji_id from kanji_dex table
        const { data: kanjiData, error: kanjiError } = await supabase
          .from('kanji_dex')
          .select('id')
          .eq('kanji', kanji)
          .single();

        if (kanjiError || !kanjiData?.id) {
          console.error(`Error finding kanji ${kanji} in database:`, kanjiError);
          continue;
        }

        // Insert into user_kanji table - if duplicate, that's fine due to unique constraint
        const { error: insertError } = await supabase
          .from('user_kanji')
          .insert([{
            user_id: currentUser.id,
            kanji_id: kanjiData.id
          }]);

        // Ignore unique constraint violations (already saved kanji)
        if (insertError && insertError.code !== '23505') {
          console.error(`Error syncing kanji ${kanji}:`, insertError);
        } else {
          syncedCount++;
        }
      }
      
      if (syncedCount > 0) {
        addNotification(`Synced ${syncedCount} kanji discoveries to your account!`, 'success');
        // Clear localStorage after successful sync
        localStorage.removeItem('jijutsu_discovered_kanji');
      }
      
      // Refresh the user's kanji data 
      await fetchUserKanjiData();
      
    } catch (error) {
      console.error('Error syncing localStorage kanji to database:', error);
    }
  };

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
  }, [lastAddedElementId]);

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2E8DC] dark:bg-[#38332E]">
        <GameNav />
        <div className="text-2xl">Loading game data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F2E8DC] dark:bg-[#38332E]">
      <AuthStateListener />
      <GameNav />
      
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
                <li>When you have the exact set of radicals needed to form a kanji, they'll merge automatically!</li>
                <li>Discovered kanji will appear in the sidebar. You can also use these to create more complex kanji.</li>
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
        onMouseMove={(e) => (draggedElement || isDraggingFromSidebar) && handleDrag(e.clientX, e.clientY)}
        onMouseUp={() => handleEndDrag()}
        onMouseLeave={() => handleEndDrag()}
        onTouchMove={(e) => {
          if ((draggedElement || isDraggingFromSidebar) && e.touches[0]) {
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
            className={`absolute cursor-grab select-none ${element.isDragging ? 'opacity-70 cursor-grabbing z-50' : 'opacity-100 z-10'} ${element.type === 'kanji' ? 'text-xl font-bold' : 'text-lg'} rounded-md flex items-center justify-center transition-all duration-150 ${element.className || ''}`}
            style={{
              left: `${element.position.x}px`,
              top: `${element.position.y}px`,
              width: '40px',
              height: '40px',
              backgroundColor: element.type === 'kanji' 
                ? (hoveredElements.has(element.id) 
                  ? 'rgba(120, 182, 147, 0.9)' // Slightly more opaque for hovered kanji
                  : 'rgba(120, 182, 147, 0.8)') // #78B693 with 80% opacity for kanji
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
            {element.char}
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
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
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
              <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => handleOpenAuth('signin')}>
                    Sign in
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-stone-800/80 dark:bg-stone-50/80">
                  <DialogHeader>
                    <DialogTitle className="text-white dark:text-black">Sign in to Jijutsu</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <SignInForm 
                      onSwitchToSignUp={() => handleOpenAuth('signup')}
                      onSuccess={handleAuthSuccess}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" onClick={() => handleOpenAuth('signup')}>
                    Sign up
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-stone-800/80 dark:bg-stone-50/80">
                  <DialogHeader>
                    <DialogTitle className="text-white dark:text-black">Create your Jijutsu account</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
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
                      strokeDasharray="4"
                    />
                    <path 
                      d="M40,6 L48,12 L40,18" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="absolute top-1/2 right-1/3 transform -translate-y-1/2">
              <div className="animate-float text-center animation-delay-500">
                <div className="w-16 h-16 bg-sky-100 rounded-lg shadow-md flex items-center justify-center text-xl mb-2 mx-auto">
                  丨
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Combine to form kanji
                </div>
              </div>
            </div>
            
            <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animation-delay-1000">
              <div className="animate-bounce text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-lg shadow-md flex items-center justify-center text-2xl mb-2 mx-auto">
                  十
                </div>
                <div className="text-lg text-blue-600 font-medium">
                  New kanji!
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowTutorialCue(false)} 
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded pointer-events-auto"
            >
              Got it!
            </button>
          </div>
        )}

        {/* Update the floating element to handle scroll position correctly */}
        {isDraggingFromSidebar && sidebarDraggedChar && (
          <div 
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(120, 182, 147, 0.8)', // #78B693 with 80% opacity
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
          )}
          
          {/* Unlocked radicals grid */}
          <div className="grid grid-cols-17 gap-1">
            {sidebarRadicals.map(({ char }, index) => {
              // Generate a truly unique key for each radical
              const radicalKey = `sidebar-radical-${index}-${char}-${Math.random().toString(36).slice(2, 5)}`;
              
              return (
                <div
                  key={radicalKey}
                  className="w-4 h-4 text-xs flex items-center justify-center rounded cursor-grab select-none"
                  style={{
                    backgroundColor: 'rgba(120, 182, 147, 0.8)',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleSidebarDragStart(char, e.clientX, e.clientY, rect);
                    e.preventDefault(); // Prevent text selection
                  }}
                  onTouchStart={(e) => {
                    if (e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSidebarDragStart(char, e.touches[0].clientX, e.touches[0].clientY, rect);
                      e.preventDefault();
                    }
                  }}
                >
                  {char}
                </div>
              );
            })}
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
              <div className="grid grid-cols-17 gap-1">
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
          
          {(user ? userKanjiCount === 0 : discoveredKanji.size === 0) ? (
            <div className="text-stone-400 dark:text-stone-500 text-sm">
              Drag and combine radicals to discover kanji!
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {(user ? supabaseKanji : Array.from(discoveredKanji)).map((kanji, index) => {
                // Generate a stable unique key for each discovered kanji
                const kanjiKey = `discovered-${kanji}-${index}`;
                
                return (
                  <div
                    key={kanjiKey}
                    data-kanji={kanji}
                    className="w-9 h-9 flex items-center justify-center rounded cursor-pointer select-none relative group"
                    style={{ 
                      backgroundColor: 'rgba(120, 182, 147, 0.9)',
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
  );
} 