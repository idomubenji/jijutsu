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
}

export default function DexGrid({ 
  title, 
  totalItems, 
  unlockedItems = [],
  onItemClick 
}: DexGridProps) {
  const [itemsPerRow, setItemsPerRow] = useState(32);
  
  // Create a map for quick lookup of unlocked items
  const unlockedMap = new Map(unlockedItems.map(item => [item.index, item]));

  // Update grid columns based on screen size
  useEffect(() => {
    const updateGridSize = () => {
      const width = window.innerWidth;
      // Responsive column count based on screen width
      if (width > 1600) {
        setItemsPerRow(40);
      } else if (width > 1200) {
        setItemsPerRow(32);
      } else if (width > 768) {
        setItemsPerRow(24);
      } else if (width > 640) {
        setItemsPerRow(16);
      } else {
        setItemsPerRow(12);
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
  const isSmallGrid = itemsPerRow > 20;
  const textSizeClass = isSmallGrid ? "text-xs" : "text-sm";
  const meaningTextSizeClass = isSmallGrid ? "text-[8px]" : "text-xs";

  return (
    <section className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg overflow-hidden">
        <div 
          className="grid gap-[1px] overflow-auto h-full"
          style={{ 
            gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))`,
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
                  border border-black cursor-pointer transition-colors
                  ${isUnlocked 
                    ? 'bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
                onClick={() => onItemClick && onItemClick(index)}
              >
                <div className={`${textSizeClass} font-bold`}>
                  {isUnlocked && unlockedItem.character ? unlockedItem.character : index}
                </div>
                {!isSmallGrid && (
                  <div className={`${meaningTextSizeClass} mt-[1px] text-center truncate w-full`}>
                    {isUnlocked && unlockedItem.meaning ? unlockedItem.meaning : "?????"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 