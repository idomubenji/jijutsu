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
  itemsPerRow?: number;
  unlockedItems?: DexItem[];
  onItemClick?: (index: number) => void;
}

export default function DexGrid({ 
  title, 
  totalItems, 
  itemsPerRow = 15, 
  unlockedItems = [],
  onItemClick 
}: DexGridProps) {
  // Create a map for quick lookup of unlocked items
  const unlockedMap = new Map(unlockedItems.map(item => [item.index, item]));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <div 
          className="grid gap-2 overflow-auto"
          style={{ 
            gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))`,
            maxHeight: totalItems > 1000 ? '70vh' : '50vh'
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
                  border border-black p-1 cursor-pointer transition-colors
                  ${isUnlocked 
                    ? 'bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
                onClick={() => onItemClick && onItemClick(index)}
              >
                <div className="text-sm font-bold">
                  {isUnlocked && unlockedItem.character ? unlockedItem.character : index}
                </div>
                <div className="text-xs mt-1 text-center truncate w-full">
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