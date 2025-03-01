'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [showTutorialCue, setShowTutorialCue] = useState(true);
  
  // Add this to the existing game state variables
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [sidebarDraggedChar, setSidebarDraggedChar] = useState<string | null>(null);
  
  // Add these state variables to track mouse position
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Add state for tracking which elements are being hovered
  const [hoveredElements, setHoveredElements] = useState<Set<string>>(new Set());
  
  // Add a state to track connections between elements
  const [connections, setConnections] = useState<{from: string, to: string}[]>([]);
  
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
        setDiscoveredKanji(new Set(JSON.parse(savedKanji)));
      }
    } catch (error) {
      console.error('Error loading saved kanji:', error);
    }
  }, []);

  // Save discovered kanji to localStorage whenever it changes
  useEffect(() => {
    if (discoveredKanji.size > 0) {
      try {
        localStorage.setItem('jijutsu_discovered_kanji', JSON.stringify(Array.from(discoveredKanji)));
      } catch (error) {
        console.error('Error saving kanji:', error);
      }
    }
  }, [discoveredKanji]);

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
            setUser(session?.user || null);
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
      const hoveredIds = new Set<string>();
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
          hoveredIds.add(el.id);
          
          // Add a connection between the dragged element and this element
          newConnections.push({
            from: draggedId,
            to: el.id
          });
        }
      }
      
      setHoveredElements(hoveredIds);
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
          
          // Add the new element to the game
          setElements(prev => [...prev, newElement]);
          
          // Check for collisions
          setTimeout(() => checkElementCollisions(newId), 50);
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
    if (!kanjiData) return [];
    return Object.keys(kanjiData.radicalToKanji)
      .map(radical => ({ char: radical }));
  }, [kanjiData]);

  // Function to clear all elements from the game area
  const clearGameArea = () => {
    // Filter out elements that are in the game area (not in sidebar)
    setElements(prev => prev.filter(el => el.position.x === 0 && el.position.y === 0));
  };

  // Function to reset all progress
  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset your progress? All discovered kanji will be lost.')) {
      setDiscoveredKanji(new Set());
      localStorage.removeItem('jijutsu_discovered_kanji');
      addNotification('Progress has been reset', 'info');
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
      <GameNav />
      
      {/* Game Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-[500px] bg-stone-800/80 dark:bg-stone-50/80">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white dark:text-black">Welcome to Jijutsu! 字術</DialogTitle>
            <DialogDescription className="text-base mt-2 text-white/80 dark:text-black/70">
              Discover kanji by combining their component radicals
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white dark:text-black">How to Play:</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80 dark:text-black/70">
                <li>Drag radicals from the sidebar into the main workspace.</li>
                <li>Move radicals around and bring them close to each other to combine them.</li>
                <li>When you have the exact set of radicals needed to form a kanji, they'll merge automatically!</li>
                <li>Discovered kanji will appear in the sidebar. You can also use these to create more complex kanji.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white dark:text-black">Tips:</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80 dark:text-black/70">
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
        {/* Jijutsu logo at top left */}
        <div className="absolute top-6 left-6">
          <div className="text-3xl font-bold tracking-wide text-[#F2E8DC] dark:text-[#38332E]">字術</div>
        </div>

        {/* Kanji Counter */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <span className="text-base font-medium">Discovered: </span>
          <span className="text-xl font-bold text-blue-600">{discoveredKanji.size}</span>
          <span className="text-sm text-gray-500 ml-1">kanji</span>
        </div>

        {/* Clear Button */}
        <div className="absolute bottom-6 right-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearGameArea}
            className="bg-white/80 backdrop-blur-sm"
          >
            Clear Workspace
          </Button>
        </div>

        {/* Trash Can */}
        <div 
          ref={trashCanRef}
          className={`absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${isOverTrash ? 'bg-red-100 scale-125' : 'bg-gray-100 hover:bg-gray-200'}`}
          style={{ 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 5 // Keep it above background but below dragged elements
          }}
          title="Drag elements here to delete them"
          aria-label="Delete area"
        >
          <Trash2 
            size={28} 
            className={`transition-all duration-200 ${isOverTrash ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}
          />
          {isOverTrash && (
            <div className="absolute bottom-full mb-2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white">
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
            className="text-stone-500 hover:text-stone-700 hover:bg-transparent p-0 flex items-center gap-1"
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
                ? (hoveredElements.has(element.id) ? '#93c5fd' : '#bae6fd') 
                : (hoveredElements.has(element.id) ? '#bfdbfe' : '#e0f2fe'),
              userSelect: 'none',
              boxShadow: hoveredElements.has(element.id) 
                ? '0 0 0 2px #3b82f6, 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
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
            const bgColorClass = notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500';
            
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
              backgroundColor: '#e0f2fe',
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
                stroke="#3b82f6"
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
        <div className="p-3 border-b border-stone-200">
          <h3 className="font-semibold mb-2">Radicals</h3>
          <div className="grid grid-cols-17 gap-1">
            {sidebarRadicals.map(({ char }, index) => {
              // Generate a truly unique key for each radical
              const radicalKey = `sidebar-radical-${index}-${char}-${Math.random().toString(36).slice(2, 5)}`;
              
              return (
                <div
                  key={radicalKey}
                  className="w-4 h-4 text-xs flex items-center justify-center bg-sky-100 rounded cursor-grab select-none"
                  style={{
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
        </div>
        
        {/* Discovered kanji container */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Discovered Kanji ({discoveredKanji.size})</h3>
            
            {discoveredKanji.size > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetProgress}
                className="text-red-500 hover:text-red-600 text-xs p-1 h-auto"
              >
                Reset
              </Button>
            )}
          </div>
          
          {discoveredKanji.size === 0 ? (
            <div className="text-stone-400 text-sm">
              Drag and combine radicals to discover kanji!
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {Array.from(discoveredKanji).map((kanji, index) => {
                // Generate a stable unique key for each discovered kanji
                const kanjiKey = `discovered-${kanji}-${index}`;
                
                return (
                  <div
                    key={kanjiKey}
                    className="w-9 h-9 flex items-center justify-center bg-sky-200 rounded cursor-grab select-none"
                    style={{ userSelect: 'none' }}
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSidebarDragStart(kanji, e.clientX, e.clientY, rect);
                      e.preventDefault(); // Prevent text selection
                    }}
                    onTouchStart={(e) => {
                      if (e.touches[0]) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleSidebarDragStart(kanji, e.touches[0].clientX, e.touches[0].clientY, rect);
                        e.preventDefault();
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
          <div className="p-4 border-t border-stone-200">
            <div className="text-sm font-medium">
              <div className="text-stone-600">Logged in as:</div>
              <div className="text-stone-900">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 