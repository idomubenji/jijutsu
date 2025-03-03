'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ text: t('invalid.email'), isError: true });
      return;
    }

    if (!password || password.length < 6) {
      setMessage({ text: t('password.min.length'), isError: true });
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
        setMessage({ text: t('email.exists'), isError: true });
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
        setMessage({ text: t('email.exists'), isError: true });
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
          setMessage({ text: t('email.exists'), isError: true });
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
        setMessage({ text: t('email.exists'), isError: true });
        setIsSubmitting(false);
        return;
      }
      
      console.log('User signed up successfully:', data.user.id);
      
      // No longer adding the user to the users table here
      // They will be added after email confirmation

      setMessage({ 
        text: t('signup.success'),
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
          text: t('email.exists'),
          isError: true 
        });
      } else {
        // Generic error fallback
        setMessage({ 
          text: t('signup.error'),
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
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-300 font-medium">{t('account.created')}</p>
            <p className="text-green-600 dark:text-green-400 mt-2">
              {t('check.email')}
            </p>
            <p className="text-green-600 dark:text-green-400 mt-2">
              {t('after.confirming')}
            </p>
          </div>
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleCloseDialog}
          >
            {t('close.button')}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-white dark:text-black">{t('email.label')}</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder={t('email.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-white dark:text-black placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-white dark:text-black">{t('password.label')}</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder={t('password.placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-white dark:text-black placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
          </div>
          
          {message && (
            <p className={`text-sm ${message.isError ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
              {message.text}
            </p>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('signing.up') : t('sign.up')}
          </Button>
        </>
      )}
    </form>
  );
} 