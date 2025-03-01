const fs = require('fs');
const path = require('path');

// Read the kanjiRadicals.json file
const kanjiRadicalsPath = path.join(__dirname, '../data/kanjiRadicals.json');
const kanjiRadicalsData = JSON.parse(fs.readFileSync(kanjiRadicalsPath, 'utf8'));

// Extract the radicalToKanji dictionary
const { radicalToKanji } = kanjiRadicalsData;

// Create an array of radical entries with their counts
const radicalsWithCounts = Object.entries(radicalToKanji).map(([radical, kanjiList]) => ({
  radical,
  count: kanjiList.length
}));

// Sort by count in descending order
radicalsWithCounts.sort((a, b) => b.count - a.count);

// Create the final sorted list as a simple array
const sortedRadicals = radicalsWithCounts.map(entry => `${entry.radical}`);

// Output the result as JSON
const output = JSON.stringify(sortedRadicals, null, 2);
console.log(output);

// Also output a summary to the console
console.log(`\nTotal radicals: ${sortedRadicals.length}`);
console.log(`\nTop 20 radicals by kanji count:`);
radicalsWithCounts.slice(0, 20).forEach(entry => {
  console.log(`${entry.radical} - ${entry.count} kanji`);
}); 