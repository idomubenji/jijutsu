import React from 'react';

interface DexItem {
  index: number;
  unlocked?: boolean;
  character?: string;
  meaning?: string;
}

interface DexGridProps {
  title: string;
  totalItems: number;
  unlockedItems?: DexItem[];
  onItemClick?: (index: number) => void;
  showOnlyUnlocked?: boolean;
}

export default function DexGrid({ 
  title, 
  totalItems, 
  unlockedItems = [],
  onItemClick,
  showOnlyUnlocked = false,
}: DexGridProps) {
  // Create a map for quick lookup of unlocked items
  const unlockedMap = new Map(unlockedItems.map(item => [item.index, item]));

  // Generate grid items based on showOnlyUnlocked
  const gridItems = showOnlyUnlocked
    ? unlockedItems.sort((a, b) => a.index - b.index)
    : Array.from({ length: totalItems }, (_, i) => {
        const index = i + 1;
        return unlockedMap.get(index) || { index };
      });

  return (
    <section className="flex flex-col h-full">
      {title && <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg overflow-hidden">
        <div 
          className="grid gap-4 overflow-y-auto overflow-x-hidden h-full px-3 py-2"
          style={{ 
            gridTemplateColumns: `repeat(auto-fit, minmax(80px, 1fr))`,
            gridAutoRows: 'minmax(80px, auto)',
            rowGap: '1rem',
          }}
        >
          {gridItems.map((item) => {
            const isUnlocked = !!unlockedMap.get(item.index);
            
            return (
              <div 
                key={`dex-item-${item.index}`}
                className={`
                  aspect-square flex flex-col items-center justify-center 
                  border-2 rounded-lg border-gray-200 dark:border-gray-600 cursor-pointer transition-all
                  min-w-[80px] min-h-[80px]
                  ${isUnlocked 
                    ? 'bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 hover:scale-105' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'}
                `}
                onClick={() => onItemClick && onItemClick(item.index)}
              >
                <div className="text-lg font-bold">
                  {isUnlocked && item.character ? item.character : item.index}
                </div>
                <div className="text-sm mt-1 text-center truncate w-full px-1">
                  {isUnlocked && item.meaning ? item.meaning : "?????"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 