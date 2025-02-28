'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthStateListener() {
  useEffect(() => {
    // Set up a listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only proceed if a user is signing in and we have a session
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          
          // Only add user to the users table if they have a confirmed email
          if (user.email && user.email_confirmed_at) {
            console.log('User signed in with confirmed email:', user.email);
            
            try {
              // Check if user already exists in the users table
              const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

              if (checkError) {
                console.error('Error checking if user exists in users table:', checkError);
                return;
              }

              // If user doesn't exist in the table, add them
              if (!existingUser) {
                const { error: insertError } = await supabase
                  .from('users')
                  .insert([{ 
                    email: user.email, 
                    user_id: user.id 
                  }]);

                if (insertError) {
                  console.error('Error adding user to users table:', insertError);
                  return;
                }

                console.log('User successfully added to users table after email confirmation');
              }
            } catch (error) {
              console.error('Error handling user table insertion after authentication:', error);
            }
          }
        }
      }
    );

    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This component doesn't render anything
  return null;
} 