import * as fs from 'fs';
import * as path from 'path';

// Define our data structure types
interface KanjiData {
  radicalToKanji: Record<string, string[]>;
  kanjiToRadicals: Record<string, string[]>;
  radicalDecomposition: Record<string, string[]>; // Stores which radicals are made of which sub-radicals
  radicalEquivalencies: Record<string, string[]>; // Stores which radicals are equivalent due to mutual subradical relationships
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
 * Detect radicals that have a mutual sub-radical relationship
 * (i.e., radicals that are sub-radicals of each other)
 */
function detectRadicalEquivalencies(
  radicalDecomposition: Record<string, string[]>
): Record<string, string[]> {
  const equivalencies: Record<string, string[]> = {};
  
  // Initialize equivalencies for all radicals
  Object.keys(radicalDecomposition).forEach(radical => {
    equivalencies[radical] = [radical]; // Each radical is equivalent to itself
  });
  
  // Helper function to check if radical1 contains radical2 as a sub-radical
  function containsSubRadical(radical1: string, radical2: string, visited = new Set<string>()): boolean {
    if (visited.has(radical1)) return false; // Prevent infinite recursion
    visited.add(radical1);
    
    // Direct check
    if (radicalDecomposition[radical1]?.includes(radical2)) {
      return true;
    }
    
    // Recursive check through all sub-radicals
    for (const subRadical of (radicalDecomposition[radical1] || [])) {
      if (subRadical !== radical1 && containsSubRadical(subRadical, radical2, visited)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Find all pairs of radicals where each is a sub-radical of the other
  const radicals = Object.keys(radicalDecomposition);
  for (let i = 0; i < radicals.length; i++) {
    const radical1 = radicals[i];
    for (let j = i + 1; j < radicals.length; j++) {
      const radical2 = radicals[j];
      
      // Check for mutual sub-radical relationship
      if (containsSubRadical(radical1, radical2) && containsSubRadical(radical2, radical1)) {
        // Add each to the other's equivalency list
        if (!equivalencies[radical1].includes(radical2)) {
          equivalencies[radical1].push(radical2);
        }
        if (!equivalencies[radical2].includes(radical1)) {
          equivalencies[radical2].push(radical1);
        }
      }
    }
  }
  
  // Ensure transitive equivalence
  // If A ≡ B and B ≡ C, then A ≡ C
  let changed = true;
  while (changed) {
    changed = false;
    for (const radical in equivalencies) {
      const equivSet = new Set(equivalencies[radical]);
      const initialSize = equivSet.size;
      
      // For each equivalent radical, add all of its equivalents
      for (const equiv of equivSet) {
        for (const transEquiv of equivalencies[equiv] || []) {
          equivSet.add(transEquiv);
        }
      }
      
      // If we added new equivalents, update and mark as changed
      if (equivSet.size > initialSize) {
        equivalencies[radical] = Array.from(equivSet);
        changed = true;
      }
    }
  }
  
  // Filter out entries that only contain self-references
  // (i.e., radicals that have no equivalents)
  const filteredEquivalencies: Record<string, string[]> = {};
  for (const radical in equivalencies) {
    // Only include entries with at least one equivalent besides itself
    if (equivalencies[radical].length > 1) {
      // Create a new array without the self-reference
      filteredEquivalencies[radical] = equivalencies[radical].filter(
        equiv => equiv !== radical
      );
    }
  }
  
  return filteredEquivalencies;
}

/**
 * Optimize the kanjiToRadicals mapping by:
 * 1. Removing self-references (e.g., remove 糸 from the radicals for 糸)
 * 2. Taking into account radical equivalencies
 * 3. Removing sub-radicals that are contained in other radicals in the list
 */
function optimizeKanjiToRadicals(
  kanjiToRadicals: Record<string, string[]>,
  radicalDecomposition: Record<string, string[]>,
  radicalEquivalencies: Record<string, string[]>
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
  
  // Helper function to get equivalent radicals for a given radical
  function getEquivalentRadicals(radical: string): string[] {
    // If the radical has equivalents in the dictionary, return them
    if (radical in radicalEquivalencies) {
      return [radical, ...radicalEquivalencies[radical]];
    }
    // Otherwise, just return the radical itself
    return [radical];
  }
  
  // Process each kanji
  Object.entries(kanjiToRadicals).forEach(([kanji, radicals]) => {
    // Step 1: Remove self-references
    let filteredRadicals = radicals.filter(radical => radical !== kanji);
    
    // Step 2: Handle radical equivalencies
    // Group radicals by their equivalency classes
    const equivalencyGroups = new Map<string, string[]>();
    
    filteredRadicals.forEach(radical => {
      // Create a key for the equivalency group based on sorted equivalents
      const equivalents = getEquivalentRadicals(radical);
      const equivKey = equivalents.sort().join('|');
      
      if (!equivalencyGroups.has(equivKey)) {
        equivalencyGroups.set(equivKey, []);
      }
      equivalencyGroups.get(equivKey)?.push(radical);
    });
    
    // Select a representative from each equivalency group
    const representativeRadicals: string[] = [];
    equivalencyGroups.forEach((group) => {
      if (group.length > 0) {
        // Choose the first radical in the group as representative
        representativeRadicals.push(group[0]);
      }
    });
    
    filteredRadicals = representativeRadicals;
    
    // Step 3: Remove sub-radicals
    // For each radical, collect all its sub-radicals
    const radicalWithSubRadicals = new Map<string, Set<string>>();
    filteredRadicals.forEach(radical => {
      radicalWithSubRadicals.set(radical, getAllSubRadicals(radical));
    });
    
    // For each pair of radicals, if one's sub-radicals contain the other, mark for removal
    // Skip this check for radicals that are equivalent to each other
    const toRemove = new Set<string>();
    filteredRadicals.forEach(radical1 => {
      filteredRadicals.forEach(radical2 => {
        if (radical1 !== radical2) {
          // Check if they're equivalent
          const isEquivalent = getEquivalentRadicals(radical1).includes(radical2);
          
          if (!isEquivalent) {
            const subRadicals1 = radicalWithSubRadicals.get(radical1) || new Set();
            if (subRadicals1.has(radical2)) {
              toRemove.add(radical2);
            }
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
  
  console.log('Detecting radical equivalencies...');
  const radicalEquivalencies = detectRadicalEquivalencies(radicalDecomposition);
  
  console.log('Optimizing kanji-to-radicals mapping...');
  const kanjiToRadicals = optimizeKanjiToRadicals(rawKanjiToRadicals, radicalDecomposition, radicalEquivalencies);
  
  console.log('Writing output JSON...');
  const kanjiData: KanjiData = {
    radicalToKanji,
    kanjiToRadicals,
    radicalDecomposition,
    radicalEquivalencies
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
    printDebugInfo(jsonData.radicalEquivalencies, 'Radical Equivalencies');
  } catch (error) {
    console.error('Error generating kanji radical JSON:', error);
    process.exit(1);
  }
}

// CommonJS export
module.exports = { generateKanjiRadicalJson }; 