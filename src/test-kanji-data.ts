// A simple test script to verify that our kanji-radical data can be loaded and used

import * as fs from 'fs';
import * as path from 'path';

// Load the data
const dataPath = path.join(__dirname, 'data', 'kanjiRadicals.json');
console.log(`Loading data from ${dataPath}`);

try {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log('Data loaded successfully!');
  
  // Print some statistics
  console.log(`Number of radicals: ${Object.keys(data.radicalToKanji).length}`);
  console.log(`Number of kanji: ${Object.keys(data.kanjiToRadicals).length}`);
  console.log(`Number of entries in radical decomposition: ${Object.keys(data.radicalDecomposition).length}`);
  
  // Test finding kanji for a couple of radicals
  const testRadicals = ['木', '火'];
  console.log(`\nFinding kanji containing radicals: ${testRadicals.join(', ')}`);
  
  // Start with all kanji from the first radical
  const kanjiSet = new Set(data.radicalToKanji[testRadicals[0]] || []);
  
  // Filter for kanji that contain all the test radicals
  for (let i = 1; i < testRadicals.length; i++) {
    const radical = testRadicals[i];
    const kanjiWithRadical = new Set(data.radicalToKanji[radical] || []);
    
    for (const kanji of Array.from(kanjiSet)) {
      if (!kanjiWithRadical.has(kanji)) {
        kanjiSet.delete(kanji);
      }
    }
  }
  
  console.log(`Found ${kanjiSet.size} kanji containing all test radicals:`);
  console.log(Array.from(kanjiSet).join(' '));
  
  // Test getting radicals for a kanji
  const testKanji = '森';
  console.log(`\nRadicals for ${testKanji}: ${data.kanjiToRadicals[testKanji]?.join(', ') || 'None found'}`);
  
} catch (error) {
  console.error('Error loading or processing data:', error);
} 