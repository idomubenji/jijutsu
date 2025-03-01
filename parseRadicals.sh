#!/bin/bash

# This script runs the parseKanjiRadicals.ts parser to generate kanji-radical data

# Set the paths to the input and output files
RADKFILE="./radkfile.utf8"
KRADFILE="./kradfile.utf8"
OUTPUT="./src/data/kanjiRadicals.json"

# Check if the files exist
if [ ! -f "$RADKFILE" ]; then
  echo "Error: radkfile not found at $RADKFILE"
  exit 1
fi

if [ ! -f "$KRADFILE" ]; then
  echo "Error: kradfile not found at $KRADFILE"
  exit 1
fi

# Ensure output directory exists
mkdir -p $(dirname "$OUTPUT")

# First, make sure ts-node and typescript are installed
echo "Installing required dependencies..."
npm install --save-dev typescript ts-node

# Compile the TypeScript file to JavaScript
echo "Compiling TypeScript to JavaScript..."
npx tsc --esModuleInterop parseKanjiRadicals.ts || {
  echo "Failed to compile TypeScript. Creating a dedicated tsconfig.json..."
  
  # Create a minimal tsconfig.json file
  cat > tsconfig.json <<EOL
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
EOL
  
  # Try compiling again with the config file
  npx tsc parseKanjiRadicals.ts || {
    echo "TypeScript compilation failed. Trying direct execution with ts-node..."
  }
}

# Check if JavaScript file was created, use it
if [ -f "parseKanjiRadicals.js" ]; then
  echo "Running the JavaScript parser..."
  node parseKanjiRadicals.js "$RADKFILE" "$KRADFILE" "$OUTPUT"
else
  # Fall back to using ts-node directly with special flags
  echo "Running with ts-node directly..."
  npx ts-node-esm parseKanjiRadicals.ts "$RADKFILE" "$KRADFILE" "$OUTPUT" || {
    echo "ts-node-esm failed, trying with ts-node..."
    npx ts-node parseKanjiRadicals.ts "$RADKFILE" "$KRADFILE" "$OUTPUT"
  }
fi

echo "If successful, the kanji radical data is now available at $OUTPUT" 