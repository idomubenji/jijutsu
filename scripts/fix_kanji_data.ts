import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixKanjiData() {
  try {
    console.log('Starting kanji data verification script...')
    
    // First check if the kanji "唖" exists
    const kanjiToCheck = '唖'
    console.log(`Checking if kanji "${kanjiToCheck}" exists in database...`)
    
    const { data: existingData, error: existingError } = await supabase
      .from('kanji_dex')
      .select('id, kanji, dex_number, meanings')
      .eq('kanji', kanjiToCheck)
    
    if (existingError) {
      console.error('Error checking for existing kanji:', existingError)
      process.exit(1)
    }
    
    if (existingData && existingData.length > 0) {
      console.log(`Found kanji "${kanjiToCheck}" in database:`, existingData[0])
      console.log('No fix needed.')
      return
    }
    
    console.log(`Kanji "${kanjiToCheck}" not found in database. Adding it...`)
    
    // Insert the missing kanji
    const kanjiEntry = {
      kanji: '唖',
      dex_number: 2,
      meanings: ['mute', 'dumb'],
      on_reading: ['ア', 'アク'],
      kun_reading: ['おし']
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('kanji_dex')
      .insert([kanjiEntry])
      .select()
    
    if (insertError) {
      // Check if error is due to unique constraint on dex_number
      if (insertError.code === '23505') {
        console.error('Unique constraint violated. Checking what is at dex_number 2...')
        
        const { data: existingAtDex2, error: dexError } = await supabase
          .from('kanji_dex')
          .select('id, kanji, dex_number')
          .eq('dex_number', 2)
        
        if (dexError) {
          console.error('Error checking dex_number 2:', dexError)
        } else if (existingAtDex2 && existingAtDex2.length > 0) {
          console.log('Found kanji at dex_number 2:', existingAtDex2[0])
          
          // Try inserting with a different dex_number
          const nextDexNumber = 3000 // A number unlikely to be used
          console.log(`Trying to insert with dex_number ${nextDexNumber} instead...`)
          
          const { data: altInsertData, error: altInsertError } = await supabase
            .from('kanji_dex')
            .insert([{ ...kanjiEntry, dex_number: nextDexNumber }])
            .select()
          
          if (altInsertError) {
            console.error('Error inserting with alternative dex_number:', altInsertError)
          } else {
            console.log('Successfully inserted kanji with alternative dex_number:', altInsertData)
          }
        }
      } else {
        console.error('Error inserting kanji:', insertError)
      }
    } else {
      console.log('Successfully inserted kanji:', insertData)
    }
    
    console.log('Script completed.')
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
fixKanjiData() 