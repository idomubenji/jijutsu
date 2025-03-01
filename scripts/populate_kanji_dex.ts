import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Type definition for our kanji data
interface KanjiEntry {
  kanji: string
  on_reading: string[]
  kun_reading: string[]
  meanings: string[]
  dex_number: number
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateKanjiDex() {
  try {
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'kanji_data_final.json')
    const rawData = fs.readFileSync(jsonPath, 'utf8')
    const kanjiData: KanjiEntry[] = JSON.parse(rawData)

    console.log(`Found ${kanjiData.length} kanji entries to insert`)

    // Insert data in batches of 50 to avoid rate limits
    const batchSize = 50
    for (let i = 0; i < kanjiData.length; i += batchSize) {
      const batch = kanjiData.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('kanji_dex')
        .insert(batch)
        .select()

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
        continue
      }

      console.log(`Successfully inserted batch ${i / batchSize + 1} (${batch.length} entries)`)
    }

    console.log('Finished populating kanji_dex table')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the script
populateKanjiDex() 