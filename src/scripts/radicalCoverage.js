const fs = require('fs');
const path = require('path');

// Read the kanjiRadicals.json file
const kanjiRadicalsPath = path.join(__dirname, '../data/kanjiRadicals.json');
const kanjiRadicalsData = JSON.parse(fs.readFileSync(kanjiRadicalsPath, 'utf8'));

// Read the sorted-radicals.json file
const sortedRadicalsPath = path.join(__dirname, '../../sorted-radicals.json');
const sortedRadicals = JSON.parse(fs.readFileSync(sortedRadicalsPath, 'utf8'));

// Extract the kanjiToRadicals dictionary
const { kanjiToRadicals } = kanjiRadicalsData;

// Function to check if all kanji radicals are in the allowed set
function canFormKanji(kanji, allowedRadicals) {
  const radicals = kanjiToRadicals[kanji];
  if (!radicals) return false;
  return radicals.every(radical => allowedRadicals.has(radical));
}

// Function to calculate how many kanji can be formed with N radicals
function calculateCoverage(numRadicals) {
  // Create a set of allowed radicals
  const allowedRadicals = new Set(sortedRadicals.slice(0, numRadicals));
  
  // Count kanji that can be formed
  let count = 0;
  let formableKanji = [];
  
  for (const kanji in kanjiToRadicals) {
    if (canFormKanji(kanji, allowedRadicals)) {
      count++;
      formableKanji.push(kanji);
    }
  }
  
  return {
    numRadicals,
    count,
    percentage: (count / Object.keys(kanjiToRadicals).length * 100).toFixed(2),
    formableKanji: formableKanji.slice(0, 10) // Just include first 10 examples
  };
}

// Calculate coverage for different numbers of radicals
const coverageData = [];
for (let n = 5; n <= 50; n += 5) {
  coverageData.push(calculateCoverage(n));
}

// Output results
console.log(`Total kanji in database: ${Object.keys(kanjiToRadicals).length}`);
console.log(`\nKanji formation coverage by number of radicals:\n`);

console.log("| Radicals | Formable Kanji | % of Total | Examples |");
console.log("|----------|---------------|-----------|----------|");

coverageData.forEach(data => {
  console.log(`| Top ${data.numRadicals} | ${data.count} | ${data.percentage}% | ${data.formableKanji.slice(0, 5).join(', ')}... |`);
});

// Output as JSON
console.log("\nJSON format:");
console.log(JSON.stringify(coverageData, null, 2));

// Save to file
fs.writeFileSync(
  path.join(__dirname, '../data/radicalCoverage.json'),
  JSON.stringify(coverageData, null, 2),
  'utf8'
); 