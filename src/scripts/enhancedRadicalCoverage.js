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
let previousCount = 0;

for (let n = 5; n <= 50; n += 5) {
  const data = calculateCoverage(n);
  
  // Calculate incremental gain
  const incrementalCount = data.count - previousCount;
  const incrementalPercentage = (incrementalCount / Object.keys(kanjiToRadicals).length * 100).toFixed(2);
  
  // Add additional statistics
  data.incrementalCount = incrementalCount;
  data.incrementalPercentage = incrementalPercentage;
  data.radicalRange = sortedRadicals.slice(n-5, n);
  
  coverageData.push(data);
  previousCount = data.count;
}

// Calculate the average radicals per kanji
let totalRadicals = 0;
let kanjiCount = 0;

for (const kanji in kanjiToRadicals) {
  const radicals = kanjiToRadicals[kanji];
  if (radicals && radicals.length > 0) {
    totalRadicals += radicals.length;
    kanjiCount++;
  }
}

const avgRadicalsPerKanji = (totalRadicals / kanjiCount).toFixed(2);

// Output results
console.log(`Total kanji in database: ${Object.keys(kanjiToRadicals).length}`);
console.log(`Average radicals per kanji: ${avgRadicalsPerKanji}`);
console.log(`\nKanji formation coverage by number of radicals:\n`);

console.log("| Radicals | Formable Kanji | % of Total | New Kanji | % Increase | New Radicals |");
console.log("|----------|---------------|-----------|----------|------------|-------------|");

coverageData.forEach(data => {
  console.log(`| Top ${data.numRadicals} | ${data.count} | ${data.percentage}% | +${data.incrementalCount} | ${data.incrementalPercentage}% | ${data.radicalRange.slice(0, 3).join(', ')}... |`);
});

// Output statistics for the top 10 radicals
console.log("\nTop 10 Radicals and their contribution:");
console.log("| Radical | Meaning | # of Kanji |");
console.log("|---------|---------|------------|");

// You would need a dictionary for radical meanings
const radicalMeanings = {
  "口": "mouth",
  "一": "one",
  "｜": "stick",
  "ノ": "bend",
  "木": "tree",
  "日": "sun/day",
  "二": "two",
  "土": "earth",
  "田": "field",
  "亠": "lid"
};

sortedRadicals.slice(0, 10).forEach((radical, _) => {
  const meaning = radicalMeanings[radical] || "-";
  const count = kanjiRadicalsData.radicalToKanji[radical].length;
  console.log(`| ${radical} | ${meaning} | ${count} |`);
});

// Output learning efficiency - kanji per radical learned
console.log("\nLearning Efficiency - Kanji per Radical:");
coverageData.forEach(data => {
  const efficiency = (data.count / data.numRadicals).toFixed(2);
  console.log(`Top ${data.numRadicals} radicals: ${efficiency} kanji per radical learned`);
});

// Output cumulative percentage graph (ASCII art)
console.log("\nCumulative Coverage (% of total kanji):");
coverageData.forEach(data => {
  const barLength = Math.round(parseFloat(data.percentage) / 2);
  const bar = "█".repeat(barLength);
  console.log(`Top ${data.numRadicals} radicals: ${bar} ${data.percentage}%`);
});

// Save to file
fs.writeFileSync(
  path.join(__dirname, '../data/enhancedRadicalCoverage.json'),
  JSON.stringify(coverageData, null, 2),
  'utf8'
); 