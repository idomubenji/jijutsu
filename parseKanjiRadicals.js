"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
/**
 * Parse the radkfile to get a mapping of radicals to kanji
 */
function parseRadkFile(filePath) {
    var content = fs.readFileSync(filePath, 'utf8');
    var radicalToKanji = {};
    var currentRadical = null;
    var lines = content.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmedLine = line.trim();
        if (trimmedLine.startsWith('$')) {
            // New radical section: "$ [radical] [level]"
            var parts = trimmedLine.split(' ');
            if (parts.length >= 2) {
                currentRadical = parts[1];
                radicalToKanji[currentRadical] = [];
            }
        }
        else if (currentRadical && trimmedLine.length > 0) {
            // Line contains kanji for the current radical
            // Add each character in the line to the array for the current radical
            for (var _a = 0, trimmedLine_1 = trimmedLine; _a < trimmedLine_1.length; _a++) {
                var kanji = trimmedLine_1[_a];
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
function parseKradFile(filePath) {
    var content = fs.readFileSync(filePath, 'utf8');
    var kanjiToRadicals = {};
    var lines = content.split('\n');
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        // Skip header lines, comments, or empty lines
        if (line.startsWith('#') || !line.includes(':') || line.trim() === '') {
            continue;
        }
        try {
            // Format is "kanji : radical1 radical2 radical3 ..."
            var parts = line.split(':');
            if (parts.length !== 2)
                continue;
            // The first part is the kanji (a single character)
            var kanji = parts[0].trim();
            if (kanji.length !== 1)
                continue;
            // The second part contains the radicals
            var radicals = parts[1].trim().split(/\s+/).filter(Boolean);
            kanjiToRadicals[kanji] = radicals;
        }
        catch (error) {
            console.error("Error parsing line: ".concat(line), error);
            // Continue processing other lines
        }
    }
    return kanjiToRadicals;
}
/**
 * Extract radical decomposition information from kradfile
 * This helps us know which radicals are made of which sub-radicals
 */
function extractRadicalDecomposition(kanjiToRadicals) {
    var radicalDecomposition = {};
    // First, identify all radicals (they appear as keys in kanjiToRadicals and also within values)
    var allRadicals = new Set();
    // Add all kanji as potential radicals
    Object.keys(kanjiToRadicals).forEach(function (kanji) {
        allRadicals.add(kanji);
    });
    // Add all components as potential radicals
    Object.values(kanjiToRadicals).forEach(function (radicals) {
        radicals.forEach(function (radical) { return allRadicals.add(radical); });
    });
    // For each radical, if it's in the kanjiToRadicals dict, that gives us its decomposition
    allRadicals.forEach(function (radical) {
        if (radical in kanjiToRadicals) {
            radicalDecomposition[radical] = __spreadArray([], kanjiToRadicals[radical], true);
        }
        else {
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
function detectRadicalEquivalencies(radicalDecomposition) {
    var equivalencies = {};
    // Initialize equivalencies for all radicals
    Object.keys(radicalDecomposition).forEach(function (radical) {
        equivalencies[radical] = [radical]; // Each radical is equivalent to itself
    });
    // Helper function to check if radical1 contains radical2 as a sub-radical
    function containsSubRadical(radical1, radical2, visited) {
        var _a;
        if (visited === void 0) { visited = new Set(); }
        if (visited.has(radical1))
            return false; // Prevent infinite recursion
        visited.add(radical1);
        // Direct check
        if ((_a = radicalDecomposition[radical1]) === null || _a === void 0 ? void 0 : _a.includes(radical2)) {
            return true;
        }
        // Recursive check through all sub-radicals
        for (var _i = 0, _b = (radicalDecomposition[radical1] || []); _i < _b.length; _i++) {
            var subRadical = _b[_i];
            if (subRadical !== radical1 && containsSubRadical(subRadical, radical2, visited)) {
                return true;
            }
        }
        return false;
    }
    // Find all pairs of radicals where each is a sub-radical of the other
    var radicals = Object.keys(radicalDecomposition);
    for (var i = 0; i < radicals.length; i++) {
        var radical1 = radicals[i];
        for (var j = i + 1; j < radicals.length; j++) {
            var radical2 = radicals[j];
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
    var changed = true;
    while (changed) {
        changed = false;
        for (var radical in equivalencies) {
            var equivSet = new Set(equivalencies[radical]);
            var initialSize = equivSet.size;
            // For each equivalent radical, add all of its equivalents
            for (var _i = 0, equivSet_1 = equivSet; _i < equivSet_1.length; _i++) {
                var equiv = equivSet_1[_i];
                for (var _a = 0, _b = equivalencies[equiv] || []; _a < _b.length; _a++) {
                    var transEquiv = _b[_a];
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
    var filteredEquivalencies = {};
    var _loop_1 = function (radical) {
        // Only include entries with at least one equivalent besides itself
        if (equivalencies[radical].length > 1) {
            // Create a new array without the self-reference
            filteredEquivalencies[radical] = equivalencies[radical].filter(function (equiv) { return equiv !== radical; });
        }
    };
    for (var radical in equivalencies) {
        _loop_1(radical);
    }
    return filteredEquivalencies;
}
/**
 * Optimize the kanjiToRadicals mapping by:
 * 1. Removing self-references (e.g., remove 糸 from the radicals for 糸)
 * 2. Taking into account radical equivalencies
 * 3. Removing sub-radicals that are contained in other radicals in the list
 */
function optimizeKanjiToRadicals(kanjiToRadicals, radicalDecomposition, radicalEquivalencies) {
    var optimized = {};
    // Helper function to get all sub-radicals of a radical (recursively)
    function getAllSubRadicals(radical, visited) {
        if (visited === void 0) { visited = new Set(); }
        if (visited.has(radical))
            return visited;
        visited.add(radical);
        var subRadicals = radicalDecomposition[radical] || [];
        for (var _i = 0, subRadicals_1 = subRadicals; _i < subRadicals_1.length; _i++) {
            var subRadical = subRadicals_1[_i];
            if (subRadical !== radical) { // Avoid infinite recursion
                getAllSubRadicals(subRadical, visited);
            }
        }
        return visited;
    }
    // Helper function to get equivalent radicals for a given radical
    function getEquivalentRadicals(radical) {
        // If the radical has equivalents in the dictionary, return them
        if (radical in radicalEquivalencies) {
            return __spreadArray([radical], radicalEquivalencies[radical], true);
        }
        // Otherwise, just return the radical itself
        return [radical];
    }
    // Process each kanji
    Object.entries(kanjiToRadicals).forEach(function (_a) {
        var kanji = _a[0], radicals = _a[1];
        // Step 1: Remove self-references
        var filteredRadicals = radicals.filter(function (radical) { return radical !== kanji; });
        // Step 2: Handle radical equivalencies
        // Group radicals by their equivalency classes
        var equivalencyGroups = new Map();
        filteredRadicals.forEach(function (radical) {
            var _a;
            // Create a key for the equivalency group based on sorted equivalents
            var equivalents = getEquivalentRadicals(radical);
            var equivKey = equivalents.sort().join('|');
            if (!equivalencyGroups.has(equivKey)) {
                equivalencyGroups.set(equivKey, []);
            }
            (_a = equivalencyGroups.get(equivKey)) === null || _a === void 0 ? void 0 : _a.push(radical);
        });
        // Select a representative from each equivalency group
        var representativeRadicals = [];
        equivalencyGroups.forEach(function (group) {
            if (group.length > 0) {
                // Choose the first radical in the group as representative
                representativeRadicals.push(group[0]);
            }
        });
        filteredRadicals = representativeRadicals;
        // Step 3: Remove sub-radicals
        // For each radical, collect all its sub-radicals
        var radicalWithSubRadicals = new Map();
        filteredRadicals.forEach(function (radical) {
            radicalWithSubRadicals.set(radical, getAllSubRadicals(radical));
        });
        // For each pair of radicals, if one's sub-radicals contain the other, mark for removal
        // Skip this check for radicals that are equivalent to each other
        var toRemove = new Set();
        filteredRadicals.forEach(function (radical1) {
            filteredRadicals.forEach(function (radical2) {
                if (radical1 !== radical2) {
                    // Check if they're equivalent
                    var isEquivalent = getEquivalentRadicals(radical1).includes(radical2);
                    if (!isEquivalent) {
                        var subRadicals1 = radicalWithSubRadicals.get(radical1) || new Set();
                        if (subRadicals1.has(radical2)) {
                            toRemove.add(radical2);
                        }
                    }
                }
            });
        });
        // Apply removals
        filteredRadicals = filteredRadicals.filter(function (radical) { return !toRemove.has(radical); });
        optimized[kanji] = filteredRadicals;
    });
    return optimized;
}
/**
 * Main function to parse both files and generate the optimized JSON
 */
function generateKanjiRadicalJson(radkFilePath, kradFilePath, outputPath) {
    console.log('Parsing radkfile...');
    var radicalToKanji = parseRadkFile(radkFilePath);
    console.log("Found ".concat(Object.keys(radicalToKanji).length, " radicals in radkfile."));
    console.log('Parsing kradfile...');
    var rawKanjiToRadicals = parseKradFile(kradFilePath);
    console.log("Found ".concat(Object.keys(rawKanjiToRadicals).length, " kanji in kradfile."));
    console.log('Extracting radical decomposition information...');
    var radicalDecomposition = extractRadicalDecomposition(rawKanjiToRadicals);
    console.log('Detecting radical equivalencies...');
    var radicalEquivalencies = detectRadicalEquivalencies(radicalDecomposition);
    console.log('Optimizing kanji-to-radicals mapping...');
    var kanjiToRadicals = optimizeKanjiToRadicals(rawKanjiToRadicals, radicalDecomposition, radicalEquivalencies);
    console.log('Writing output JSON...');
    var kanjiData = {
        radicalToKanji: radicalToKanji,
        kanjiToRadicals: kanjiToRadicals,
        radicalDecomposition: radicalDecomposition,
        radicalEquivalencies: radicalEquivalencies
    };
    fs.writeFileSync(outputPath, JSON.stringify(kanjiData, null, 2), 'utf8');
    console.log("Done! Output written to ".concat(outputPath));
}
// Debug function to print a sample of the data
function printDebugInfo(data, label, count) {
    if (count === void 0) { count = 5; }
    console.log("\n".concat(label, " (showing ").concat(count, " samples):"));
    var keys = Object.keys(data);
    for (var i = 0; i < Math.min(count, keys.length); i++) {
        var key = keys[i];
        console.log("  ".concat(key, ": ").concat(JSON.stringify(data[key])));
    }
    console.log("Total entries: ".concat(keys.length));
}
// If this script is run directly (not imported)
if (require.main === module) {
    // Check for command line arguments
    var args = process.argv.slice(2);
    if (args.length !== 3) {
        console.error('Usage: node parseKanjiRadicals.js <radkfile_path> <kradfile_path> <output_json_path>');
        process.exit(1);
    }
    var radkFilePath = args[0], kradFilePath = args[1], outputPath = args[2];
    // Check if files exist
    if (!fs.existsSync(radkFilePath)) {
        console.error("Error: radkfile not found at ".concat(radkFilePath));
        process.exit(1);
    }
    if (!fs.existsSync(kradFilePath)) {
        console.error("Error: kradfile not found at ".concat(kradFilePath));
        process.exit(1);
    }
    // Create output directory if it doesn't exist
    var outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    try {
        generateKanjiRadicalJson(radkFilePath, kradFilePath, outputPath);
        // Debug: Read the generated file back in to verify it contains data
        var jsonData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        printDebugInfo(jsonData.radicalToKanji, 'Radical To Kanji');
        printDebugInfo(jsonData.kanjiToRadicals, 'Kanji To Radicals');
        printDebugInfo(jsonData.radicalDecomposition, 'Radical Decomposition');
        printDebugInfo(jsonData.radicalEquivalencies, 'Radical Equivalencies');
    }
    catch (error) {
        console.error('Error generating kanji radical JSON:', error);
        process.exit(1);
    }
}
// CommonJS export
module.exports = { generateKanjiRadicalJson: generateKanjiRadicalJson };
