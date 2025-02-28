import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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