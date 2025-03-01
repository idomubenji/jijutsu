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

// Create the final sorted list of radical entries
const sortedRadicals = radicalsWithCounts.map(entry => ({
  radical: entry.radical,
  count: entry.count,
  kanji: radicalToKanji[entry.radical]
}));

// Output the result as JSON
const output = JSON.stringify(sortedRadicals, null, 2);
console.log(output);

// Optionally save the result to a file
fs.writeFileSync(
  path.join(__dirname, '../data/sortedRadicals.json'),
  output,
  'utf8'
);

console.log(`Processed ${sortedRadicals.length} radicals.`);
console.log(`Top 10 radicals by kanji count:`);
sortedRadicals.slice(0, 10).forEach(entry => {
  console.log(`${entry.radical} - ${entry.count} kanji`);
}); 