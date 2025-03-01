'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Please enter a valid email address', isError: true });
      return;
    }

    if (!password || password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // First, check if this email is already in use in Auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummyPasswordForCheckingOnly', // Intentionally using a dummy password
      });
      
      // If we can sign in (no error about invalid credentials, only wrong password),
      // then the email exists and is verified
      if (signInError && !signInError.message.includes('Invalid login credentials')) {
        console.error('Error checking if email exists:', signInError);
      } else if (signInData?.user) {
        // The email exists and is verified (we got a wrong password error but the email is valid)
        setMessage({ text: 'An account with this email already exists. Please sign in instead.', isError: true });
        setIsSubmitting(false);
        return;
      }

      // Check if the email already exists in our users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking if user exists:', checkError);
        throw checkError;
      }

      if (existingUser) {
        setMessage({ text: 'An account with this email already exists. Please sign in instead.', isError: true });
        setIsSubmitting(false);
        return;
      }

      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth signUp error:', error);
        // Check if the error is related to an existing account
        if (error.message.includes('already registered')) {
          setMessage({ text: 'An account with this email already exists. Please sign in instead.', isError: true });
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      if (!data?.user) {
        throw new Error('No user returned from signup');
      }
      
      // Check if the email was already confirmed (indicating existing verified account)
      if (data.user.email_confirmed_at) {
        console.log('User already has a verified account with this email:', data.user.id);
        setMessage({ text: 'An account with this email already exists. Please sign in instead.', isError: true });
        setIsSubmitting(false);
        return;
      }
      
      console.log('User signed up successfully:', data.user.id);
      
      // No longer adding the user to the users table here
      // They will be added after email confirmation

      setMessage({ 
        text: 'Account created successfully! Check your email for the confirmation link.', 
        isError: false 
      });
      setIsSignupComplete(true);
      // Empty the form fields
      setEmail('');
      setPassword('');
      
      // Do not call onSuccess here to keep dialog open
      
    } catch (error: unknown) {
      console.error('Error signing up:', error);
      console.error('Detailed error:', JSON.stringify(error, null, 2));
      
      // Check for various forms of duplicate email errors
      if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' && (
          error.message.includes('duplicate key value') || 
          error.message.includes('users_email_key') ||
          error.message.includes('already registered') ||
          error.message.includes('23505')
      )) {
        setMessage({ 
          text: 'An account with this email already exists. Please sign in instead.',
          isError: true 
        });
      } else {
        // Generic error fallback
        setMessage({ 
          text: `An error occurred during signup. Please try again later.`,
          isError: true 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {isSignupComplete ? (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <p className="text-green-700 font-medium">Account created successfully!</p>
            <p className="text-green-600 mt-2">
              Please check your email for the confirmation link to activate your account.
            </p>
            <p className="text-green-600 mt-2">
              After confirming your email, you&apos;ll be able to sign in to your account.
            </p>
          </div>
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleCloseDialog}
          >
            Close
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {message && (
            <p className={`text-sm ${message.isError ? 'text-red-500' : 'text-green-500'}`}>
              {message.text}
            </p>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing up...' : 'Sign up'}
          </Button>
        </>
      )}
    </form>
  );
} 