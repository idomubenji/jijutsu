import * as fs from 'fs';
import * as path from 'path';

// Define our data structure types
interface KanjiData {
  radicalToKanji: Record<string, string[]>;
  kanjiToRadicals: Record<string, string[]>;
  radicalDecomposition: Record<string, string[]>; // Stores which radicals are made of which sub-radicals
}

/**
 * Parse the radkfile to get a mapping of radicals to kanji
 */
function parseRadkFile(filePath: string): Record<string, string[]> {
  const content = fs.readFileSync(filePath, 'utf8');
  const radicalToKanji: Record<string, string[]> = {};
  
  let currentRadical: string | null = null;
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('$')) {
      // New radical section: "$ [radical] [level]"
      const parts = trimmedLine.split(' ');
      if (parts.length >= 2) {
        currentRadical = parts[1];
        radicalToKanji[currentRadical] = [];
      }
    } else if (currentRadical && trimmedLine.length > 0) {
      // Line contains kanji for the current radical
      // Add each character in the line to the array for the current radical
      for (const kanji of trimmedLine) {
        if (kanji && !radicalToKanji[currentRadical].includes(kanji)) {
          radicalToKanji[currentRadical].push(kanji);
        }
      }
    }
  }
  
  return radicalToKanji;
}

/**
 * Parse the kradfile to get a mapping of kanji to their component radicals
 */
function parseKradFile(filePath: string): Record<string, string[]> {
  const content = fs.readFileSync(filePath, 'utf8');
  const kanjiToRadicals: Record<string, string[]> = {};
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Skip header lines, comments, or empty lines
    if (line.startsWith('#') || !line.includes(':') || line.trim() === '') {
      continue;
    }
    
    try {
      // Format is "kanji : radical1 radical2 radical3 ..."
      const parts = line.split(':');
      if (parts.length !== 2) continue;
      
      // The first part is the kanji (a single character)
      const kanji = parts[0].trim();
      if (kanji.length !== 1) continue;
      
      // The second part contains the radicals
      const radicals = parts[1].trim().split(/\s+/).filter(Boolean);
      
      kanjiToRadicals[kanji] = radicals;
    } catch (error) {
      console.error(`Error parsing line: ${line}`, error);
      // Continue processing other lines
    }
  }
  
  return kanjiToRadicals;
}

/**
 * Extract radical decomposition information from kradfile
 * This helps us know which radicals are made of which sub-radicals
 */
function extractRadicalDecomposition(kanjiToRadicals: Record<string, string[]>): Record<string, string[]> {
  const radicalDecomposition: Record<string, string[]> = {};
  
  // First, identify all radicals (they appear as keys in kanjiToRadicals and also within values)
  const allRadicals = new Set<string>();
  
  // Add all kanji as potential radicals
  Object.keys(kanjiToRadicals).forEach(kanji => {
    allRadicals.add(kanji);
  });
  
  // Add all components as potential radicals
  Object.values(kanjiToRadicals).forEach(radicals => {
    radicals.forEach(radical => allRadicals.add(radical));
  });
  
  // For each radical, if it's in the kanjiToRadicals dict, that gives us its decomposition
  allRadicals.forEach(radical => {
    if (radical in kanjiToRadicals) {
      radicalDecomposition[radical] = [...kanjiToRadicals[radical]];
    } else {
      // If a radical isn't in kanjiToRadicals, it's a basic radical with no decomposition
      radicalDecomposition[radical] = [];
    }
  });
  
  return radicalDecomposition;
}

/**
 * Optimize the kanjiToRadicals mapping by:
 * 1. Removing self-references (e.g., remove 糸 from the radicals for 糸)
 * 2. Removing sub-radicals that are contained in other radicals in the list
 */
function optimizeKanjiToRadicals(
  kanjiToRadicals: Record<string, string[]>,
  radicalDecomposition: Record<string, string[]>
): Record<string, string[]> {
  const optimized: Record<string, string[]> = {};
  
  // Helper function to get all sub-radicals of a radical (recursively)
  function getAllSubRadicals(radical: string, visited = new Set<string>()): Set<string> {
    if (visited.has(radical)) return visited;
    
    visited.add(radical);
    
    const subRadicals = radicalDecomposition[radical] || [];
    for (const subRadical of subRadicals) {
      if (subRadical !== radical) { // Avoid infinite recursion
        getAllSubRadicals(subRadical, visited);
      }
    }
    
    return visited;
  }
  
  // Process each kanji
  Object.entries(kanjiToRadicals).forEach(([kanji, radicals]) => {
    // Step 1: Remove self-references
    let filteredRadicals = radicals.filter(radical => radical !== kanji);
    
    // Step 2: Remove sub-radicals
    // For each radical, collect all its sub-radicals
    const radicalWithSubRadicals = new Map<string, Set<string>>();
    filteredRadicals.forEach(radical => {
      radicalWithSubRadicals.set(radical, getAllSubRadicals(radical));
    });
    
    // For each pair of radicals, if one's sub-radicals contain the other, mark for removal
    const toRemove = new Set<string>();
    filteredRadicals.forEach(radical1 => {
      filteredRadicals.forEach(radical2 => {
        if (radical1 !== radical2) {
          const subRadicals1 = radicalWithSubRadicals.get(radical1) || new Set();
          if (subRadicals1.has(radical2)) {
            toRemove.add(radical2);
          }
        }
      });
    });
    
    // Apply removals
    filteredRadicals = filteredRadicals.filter(radical => !toRemove.has(radical));
    
    optimized[kanji] = filteredRadicals;
  });
  
  return optimized;
}

/**
 * Main function to parse both files and generate the optimized JSON
 */
function generateKanjiRadicalJson(radkFilePath: string, kradFilePath: string, outputPath: string): void {
  console.log('Parsing radkfile...');
  const radicalToKanji = parseRadkFile(radkFilePath);
  console.log(`Found ${Object.keys(radicalToKanji).length} radicals in radkfile.`);
  
  console.log('Parsing kradfile...');
  const rawKanjiToRadicals = parseKradFile(kradFilePath);
  console.log(`Found ${Object.keys(rawKanjiToRadicals).length} kanji in kradfile.`);
  
  console.log('Extracting radical decomposition information...');
  const radicalDecomposition = extractRadicalDecomposition(rawKanjiToRadicals);
  
  console.log('Optimizing kanji-to-radicals mapping...');
  const kanjiToRadicals = optimizeKanjiToRadicals(rawKanjiToRadicals, radicalDecomposition);
  
  console.log('Writing output JSON...');
  const kanjiData: KanjiData = {
    radicalToKanji,
    kanjiToRadicals,
    radicalDecomposition
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(kanjiData, null, 2), 'utf8');
  console.log(`Done! Output written to ${outputPath}`);
}

// Debug function to print a sample of the data
function printDebugInfo(data: any, label: string, count = 5) {
  console.log(`\n${label} (showing ${count} samples):`);
  const keys = Object.keys(data);
  for (let i = 0; i < Math.min(count, keys.length); i++) {
    const key = keys[i];
    console.log(`  ${key}: ${JSON.stringify(data[key])}`);
  }
  console.log(`Total entries: ${keys.length}`);
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error('Usage: node parseKanjiRadicals.js <radkfile_path> <kradfile_path> <output_json_path>');
    process.exit(1);
  }
  
  const [radkFilePath, kradFilePath, outputPath] = args;
  
  // Check if files exist
  if (!fs.existsSync(radkFilePath)) {
    console.error(`Error: radkfile not found at ${radkFilePath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(kradFilePath)) {
    console.error(`Error: kradfile not found at ${kradFilePath}`);
    process.exit(1);
  }
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    generateKanjiRadicalJson(radkFilePath, kradFilePath, outputPath);
    
    // Debug: Read the generated file back in to verify it contains data
    const jsonData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    printDebugInfo(jsonData.radicalToKanji, 'Radical To Kanji');
    printDebugInfo(jsonData.kanjiToRadicals, 'Kanji To Radicals');
    printDebugInfo(jsonData.radicalDecomposition, 'Radical Decomposition');
  } catch (error) {
    console.error('Error generating kanji radical JSON:', error);
    process.exit(1);
  }
}

// CommonJS export
module.exports = { generateKanjiRadicalJson }; 