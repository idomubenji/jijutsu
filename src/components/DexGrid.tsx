import React, { useEffect, useState } from 'react';

interface DexItem {
  index: number;
  unlocked?: boolean;
  character?: string;
  meaning?: string;
}

interface DexGridProps {
  title: string;
  totalItems: number;
  itemsPerRow?: number;
  unlockedItems?: DexItem[];
  onItemClick?: (index: number) => void;
  useAutoFit?: boolean;
}

export default function DexGrid({ 
  title, 
  totalItems, 
  unlockedItems = [],
  onItemClick,
  useAutoFit = false
}: DexGridProps) {
  const [itemsPerRow, setItemsPerRow] = useState(16);
  
  // Create a map for quick lookup of unlocked items
  const unlockedMap = new Map(unlockedItems.map(item => [item.index, item]));

  // Update grid columns based on screen size
  useEffect(() => {
    const updateGridSize = () => {
      const width = window.innerWidth;
      // Responsive column count based on screen width
      if (width > 1600) {
        setItemsPerRow(20);
      } else if (width > 1200) {
        setItemsPerRow(16);
      } else if (width > 768) {
        setItemsPerRow(12);
      } else if (width > 640) {
        setItemsPerRow(8);
      } else {
        setItemsPerRow(6);
      }
    };

    // Set initial size
    updateGridSize();
    
    // Add resize listener
    window.addEventListener('resize', updateGridSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  // Adjust text size based on number of items per row
  const isSmallGrid = itemsPerRow > 16;
  const textSizeClass = isSmallGrid ? "text-lg" : "text-xl";
  const meaningTextSizeClass = isSmallGrid ? "text-sm" : "text-base";

  return (
    <section className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg overflow-hidden">
        <div 
          className="grid gap-4 overflow-auto h-full"
          style={{ 
            gridTemplateColumns: useAutoFit 
              ? `repeat(auto-fit, minmax(80px, 1fr))`
              : `repeat(${itemsPerRow}, minmax(80px, 1fr))`,
            gridAutoRows: 'minmax(80px, auto)',
            rowGap: '1rem',
          }}
        >
          {Array.from({ length: totalItems }, (_, i) => i + 1).map((index) => {
            const unlockedItem = unlockedMap.get(index);
            const isUnlocked = !!unlockedItem;
            
            return (
              <div 
                key={`dex-item-${index}`}
                className={`
                  aspect-square flex flex-col items-center justify-center 
                  border-2 rounded-lg border-gray-200 dark:border-gray-600 cursor-pointer transition-all
                  min-w-[80px] min-h-[80px]
                  ${isUnlocked 
                    ? 'bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 hover:scale-105' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'}
                `}
                onClick={() => onItemClick && onItemClick(index)}
              >
                <div className={`${textSizeClass} font-bold`}>
                  {isUnlocked && unlockedItem.character ? unlockedItem.character : index}
                </div>
                <div className={`${meaningTextSizeClass} mt-1 text-center truncate w-full px-1`}>
                  {isUnlocked && unlockedItem.meaning ? unlockedItem.meaning : "?????"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 