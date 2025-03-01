import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Add diagnostic logging
console.log(`Supabase initialization with URL: ${supabaseUrl ? 'URL provided' : 'URL MISSING'}`);
console.log(`Supabase anon key: ${supabaseAnonKey ? 'Key provided' : 'Key MISSING'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Add a function to reinitialize the Supabase client if needed
export function restartSupabaseConnection() {
  console.log('Attempting to restart Supabase connection...');
  
  try {
    // Recreate the client with the same settings
    const newClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    
    // Replace all methods on the existing client with the new one
    // This is a workaround since we can't directly reassign the exported constant
    Object.keys(newClient).forEach(key => {
      // Use type assertion to handle the index signature issue
      const clientKey = key as keyof typeof newClient;
      const supabaseKey = key as keyof typeof supabase;
      
      if (typeof newClient[clientKey] === 'function' || typeof newClient[clientKey] === 'object') {
        // Use type assertion to safely copy properties
        (supabase[supabaseKey] as unknown) = newClient[clientKey];
      }
    });
    
    console.log('Supabase connection restarted successfully');
    return true;
  } catch (error) {
    console.error('Failed to restart Supabase connection:', error);
    return false;
  }
}

// Add health check function
export async function checkSupabaseHealth() {
  try {
    console.log('Checking Supabase connectivity...');
    // Try a simple query to see if we can connect
    const startTime = Date.now();
    const { error } = await supabase.from('kanji_dex').select('id').limit(1);
    const elapsedTime = Date.now() - startTime;
    
    if (error) {
      console.error('Supabase health check failed:', error);
      return { 
        success: false, 
        message: `Connection failed: ${error.message}`,
        error 
      };
    }
    
    console.log(`Supabase connection successful (${elapsedTime}ms)`);
    return { 
      success: true, 
      message: `Connection successful in ${elapsedTime}ms` 
    };
  } catch (error) {
    console.error('Supabase health check exception:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      error 
    };
  }
}

// Helper function to add a user to the waitlist
export async function addToWaitlist(email: string) {
  try {
    // Check if the email already exists in the waitlist
    const { data, error: selectError } = await supabase
      .from('waitlisted_users')
      .select('email')
      .eq('email', email);

    if (selectError) {
      console.error('Error checking waitlist:', selectError);
      return { success: false, message: 'Failed to check waitlist. Please try again.' };
    }

    // If we found any records with this email, it already exists
    if (data && data.length > 0) {
      return { success: false, message: 'Already on the waitlist!' };
    }

    // Add the user to the waitlist
    const { error: insertError } = await supabase
      .from('waitlisted_users')
      .insert([{ email }]);

    if (insertError) {
      // If we get a unique violation error, it means the email already exists
      // This is a fallback in case the first check missed it
      if (insertError.code === '23505') {
        return { success: false, message: 'Already on the waitlist!' };
      }
      throw insertError;
    }
    
    return { success: true, message: 'Added to the waitlist!' };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { success: false, message: 'Failed to join waitlist. Please try again.' };
  }
} 