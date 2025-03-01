'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SignInForm } from '@/components/SignInForm';
import { SignupForm } from '@/components/SignupForm';
import { supabase } from '@/lib/supabase';
import { LogOut, Info, X } from 'lucide-react';
import { ClientLayout } from '@/components/ClientLayout';
import { useKanjiRadicals } from '@/hooks/useKanjiRadicals';
import { ThemeToggle } from '@/components/ThemeToggle';

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
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info';
  kanji?: string;
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
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Notification system
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Tracking drag state
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<ElementPosition>({ x: 0, y: 0 });
  
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

  // Function to add a notification
  const addNotification = (message: string, type: 'success' | 'info' = 'info', kanji?: string) => {
    const id = Date.now().toString();
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

  // Handle starting a drag operation
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
  
  // Handle drag movement
  const handleDrag = (clientX: number, clientY: number) => {
    if (!draggedElement || !gameAreaRef.current) return;
    
    // Get game area bounds
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    
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
  };
  
  // Handle end of drag operation
  const handleEndDrag = () => {
    if (!draggedElement) return;
    
    // Update element to no longer be dragging
    setElements(prev => prev.map(el => 
      el.id === draggedElement 
        ? { ...el, isDragging: false } 
        : el
    ));
    
    // Check for collisions and potential merges
    checkElementCollisions(draggedElement);
    
    // Reset drag state
    setDraggedElement(null);
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
    
    // Create new element ID
    const newId = `element-${Date.now()}-${radical}`;
    
    // Add new element to game
    const newElement: GameElement = {
      id: newId,
      type: 'radical',
      char: radical,
      position: { x: boundedX, y: boundedY },
      isDragging: false,
      touchingElements: new Set()
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
    const touchDistance = 5; // How close elements need to be to count as "touching"
    
    // Reset touching relationships for this element
    changedElement.touchingElements = new Set();
    
    // Gather all elements that are touching the changed element
    const touchingIds = new Set<string>();
    
    for (const otherEl of gameElements) {
      if (otherEl.id === changedElement.id) continue;
      
      // Check if the elements are touching
      const isXOverlap = Math.abs((changedElement.position.x + elementWidth/2) - (otherEl.position.x + elementWidth/2)) < elementWidth + touchDistance;
      const isYOverlap = Math.abs((changedElement.position.y + elementHeight/2) - (otherEl.position.y + elementHeight/2)) < elementHeight + touchDistance;
      
      if (isXOverlap && isYOverlap) {
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
    const clusterChars = Array.from(touchingCluster).map(id => {
      const el = gameElements.find(e => e.id === id);
      return el ? el.char : '';
    }).filter(Boolean);
    
    // Check if this combination can form any kanji
    const possibleKanji = findPossibleKanji(clusterChars, kanjiData);
    
    // For each possible kanji, check if the exact requirements match
    const newKanji: string[] = [];
    
    possibleKanji.forEach(kanji => {
      const requiredRadicals = new Set(kanjiData.kanjiToRadicals[kanji] || []);
      
      // Create a set of the cluster characters for easier comparison
      const clusterCharsSet = new Set(clusterChars);
      
      // Check if the cluster has exactly the required radicals
      let isMatch = requiredRadicals.size === clusterCharsSet.size;
      
      if (isMatch) {
        for (const radical of requiredRadicals) {
          if (!clusterCharsSet.has(radical)) {
            isMatch = false;
            break;
          }
        }
      }
      
      if (isMatch && !discoveredKanji.has(kanji)) {
        newKanji.push(kanji);
        setDiscoveredKanji(prev => new Set([...prev, kanji]));
        // Show notification for discovered kanji
        addNotification(`You discovered ${kanji}!`, 'success', kanji);
      }
    });
    
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
        
        // Create new kanji elements
        const newKanjiElements = newKanji.map((kanji, idx) => ({
          id: `kanji-${Date.now()}-${idx}-${kanji}`,
          type: 'kanji' as const,
          char: kanji,
          position: { x: avgX, y: avgY },
          isDragging: false,
          touchingElements: new Set<string>()
        }));
        
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
  const findPossibleKanji = (chars: string[], kanjiData: { radicalToKanji: Record<string, string[]> }): string[] => {
    if (!chars.length || !kanjiData) return [];
    
    // Initialize with all kanji from the first character
    let possibleKanji = new Set(kanjiData.radicalToKanji[chars[0]] || []);
    
    // Intersect with kanji from each other character
    for (let i = 1; i < chars.length; i++) {
      const char = chars[i];
      const kanjiWithChar = new Set(kanjiData.radicalToKanji[char] || []);
      
      // Keep only kanji that contain all characters so far
      possibleKanji = new Set(
        [...possibleKanji].filter(kanji => kanjiWithChar.has(kanji))
      );
    }
    
    return Array.from(possibleKanji);
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

  if (loadingData) {
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#F2E8DC] dark:bg-[#38332E]">
          <div className="text-2xl">Loading game data...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen flex bg-[#F2E8DC] dark:bg-[#38332E]">
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
          onMouseMove={(e) => draggedElement && handleDrag(e.clientX, e.clientY)}
          onMouseUp={() => draggedElement && handleEndDrag()}
          onMouseLeave={() => draggedElement && handleEndDrag()}
          onTouchMove={(e) => {
            if (draggedElement && e.touches[0]) {
              handleDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={() => draggedElement && handleEndDrag()}
          onTouchCancel={() => draggedElement && handleEndDrag()}
        >
          {/* Jijutsu logo at top left */}
          <div className="absolute top-6 left-6">
            <div className="text-3xl font-bold tracking-wide text-[#F2E8DC] dark:text-[#38332E]">字術</div>
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
              className={`absolute cursor-grab select-none ${element.isDragging ? 'opacity-70 cursor-grabbing z-50' : 'opacity-100 z-10'} ${element.type === 'kanji' ? 'text-xl font-bold' : 'text-lg'} rounded-md flex items-center justify-center`}
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: '40px',
                height: '40px',
                backgroundColor: element.type === 'kanji' ? '#bae6fd' : '#e0f2fe',
                userSelect: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                transition: element.isDragging ? 'none' : 'box-shadow 0.3s ease'
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
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`px-4 py-2 rounded-lg shadow-lg text-white flex items-center justify-between w-full
                  ${notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'} 
                  animate-in slide-in-from-right-5 duration-300`}
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
                >
                  <X size={14} />
                </button>
              </div>
            ))}
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
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l border-stone-200 dark:border-stone-700 flex flex-col overflow-y-auto bg-[#E8DED2] dark:bg-[#302B27]">
          {/* Radical container */}
          <div className="p-3 border-b border-stone-200">
            <h3 className="font-semibold mb-2">Radicals</h3>
            <div className="grid grid-cols-17 gap-1">
              {sidebarRadicals.map(({ char }, index) => (
                <div
                  key={`sidebar-radical-${index}-${char}`}
                  className="w-4 h-4 text-xs flex items-center justify-center bg-sky-100 rounded cursor-grab select-none"
                  style={{
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDragOffset({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    });
                  }}
                  onMouseUp={(e) => {
                    if (gameAreaRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleCloneRadical(char, e.clientX, e.clientY, rect);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragOffset({
                        x: e.touches[0].clientX - rect.left,
                        y: e.touches[0].clientY - rect.top
                      });
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (e.changedTouches[0] && gameAreaRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleCloneRadical(
                        char, 
                        e.changedTouches[0].clientX, 
                        e.changedTouches[0].clientY, 
                        rect
                      );
                    }
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>
          
          {/* Discovered kanji container */}
          <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="font-semibold mb-2">Discovered Kanji ({discoveredKanji.size})</h3>
            {discoveredKanji.size === 0 ? (
              <div className="text-stone-400 text-sm">
                Drag and combine radicals to discover kanji!
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-2">
                {Array.from(discoveredKanji).map((kanji) => (
                  <div
                    key={`discovered-${kanji}`}
                    className="w-9 h-9 flex items-center justify-center bg-sky-200 rounded cursor-grab select-none"
                    style={{ userSelect: 'none' }}
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragOffset({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }}
                    onMouseUp={(e) => {
                      if (gameAreaRef.current) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleCloneRadical(kanji, e.clientX, e.clientY, rect);
                      }
                    }}
                    onTouchStart={(e) => {
                      if (e.touches[0]) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDragOffset({
                          x: e.touches[0].clientX - rect.left,
                          y: e.touches[0].clientY - rect.top
                        });
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (e.changedTouches[0] && gameAreaRef.current) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleCloneRadical(
                          kanji, 
                          e.changedTouches[0].clientX, 
                          e.changedTouches[0].clientY, 
                          rect
                        );
                      }
                    }}
                  >
                    {kanji}
                  </div>
                ))}
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
    </ClientLayout>
  );
} 