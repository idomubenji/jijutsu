import { useState } from 'react';
import { useKanjiRadicals } from '@/hooks/useKanjiRadicals';
import { Button } from '@/components/ui/button';

export function RadicalSelector() {
  const { loading, getBaseRadicals, findPossibleKanji, getRequiredRadicals } = useKanjiRadicals();
  const [selectedRadicals, setSelectedRadicals] = useState<string[]>([]);
  const [possibleKanji, setPossibleKanji] = useState<string[]>([]);

  // Handle selecting a radical
  const handleSelectRadical = (radical: string) => {
    if (selectedRadicals.includes(radical)) {
      // If already selected, remove it
      setSelectedRadicals(selectedRadicals.filter(r => r !== radical));
    } else {
      // Otherwise add it
      setSelectedRadicals([...selectedRadicals, radical]);
    }
  };

  // Update possible kanji when radicals change
  const updatePossibleKanji = () => {
    if (selectedRadicals.length === 0) {
      setPossibleKanji([]);
      return;
    }
    
    const kanji = findPossibleKanji(selectedRadicals);
    setPossibleKanji(kanji);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedRadicals([]);
    setPossibleKanji([]);
  };

  // Get details about a kanji's required radicals
  const getKanjiDetails = (kanji: string) => {
    return getRequiredRadicals(kanji);
  };

  if (loading) {
    return <div className="p-4">Loading radical data...</div>;
  }

  const baseRadicals = getBaseRadicals();

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Radical Selector</h2>
      
      {/* Radical selection area */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Available Radicals</h3>
        <div className="grid grid-cols-10 gap-2">
          {baseRadicals.slice(0, 100).map((radical) => (
            <Button
              key={radical}
              variant={selectedRadicals.includes(radical) ? "default" : "outline"}
              className="h-10 w-10 text-lg"
              onClick={() => handleSelectRadical(radical)}
            >
              {radical}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex space-x-2">
          <Button onClick={updatePossibleKanji} disabled={selectedRadicals.length === 0}>
            Find Kanji
          </Button>
          <Button variant="outline" onClick={clearSelections}>
            Clear
          </Button>
        </div>
      </div>

      {/* Selected radicals display */}
      {selectedRadicals.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Selected Radicals</h3>
          <div className="flex flex-wrap gap-2">
            {selectedRadicals.map((radical) => (
              <div key={radical} className="border border-gray-300 rounded-md p-2 text-lg">
                {radical}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Possible kanji display */}
      {possibleKanji.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2">Possible Kanji ({possibleKanji.length})</h3>
          <div className="grid grid-cols-8 gap-2">
            {possibleKanji.slice(0, 64).map((kanji) => (
              <div 
                key={kanji} 
                className="border border-gray-300 rounded-md p-2 text-lg text-center hover:bg-gray-100 cursor-pointer"
                title={`Required radicals: ${getKanjiDetails(kanji).join(', ')}`}
              >
                {kanji}
              </div>
            ))}
          </div>
          {possibleKanji.length > 64 && (
            <div className="text-sm text-gray-500 mt-2">
              And {possibleKanji.length - 64} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
} 