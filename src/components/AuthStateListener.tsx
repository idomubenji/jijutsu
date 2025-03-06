'use client';

import { useEffect } from 'react';
import { supabase, createOrUpdateUser } from '@/lib/supabase';

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
              // Use the createOrUpdateUser helper function to add or update the user
              const { success, message, error } = await createOrUpdateUser(user.id, user.email);
              
              if (!success) {
                console.error('Error handling user record in users table:', message, error);
                return;
              }
              
              console.log('User record managed successfully in users table:', message);
            } catch (error) {
              console.error('Error handling user table operation after authentication:', error);
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