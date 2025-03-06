'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, createOrUpdateUser } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

interface SignInFormProps {
  onSwitchToSignUp?: () => void;
  onSuccess?: () => void;
}

export function SignInForm({ onSwitchToSignUp, onSuccess }: SignInFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ text: t('invalid.email'), isError: true });
      return;
    }

    if (!password || password.length < 1) {
      setMessage({ text: t('enter.password'), isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Sign in the user with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setMessage({ text: t('invalid.credentials'), isError: true });
        return;
      }

      if (!data?.user) {
        throw new Error('No user returned from sign in');
      }
      
      // Add the authenticated user to the users table
      const userId = data.user.id;
      const userEmail = data.user.email || email;
      
      const { success, message: userMessage, error: userError } = await createOrUpdateUser(userId, userEmail);
      
      if (!success) {
        console.warn('User record creation/update warning:', userMessage, userError);
        // We continue even if there was an error adding the user to the database
        // This ensures users can still sign in even if there's a database issue
      }
      
      setMessage({ text: t('signin.success'), isError: false });
      
      // Use the onSuccess callback if provided, otherwise reload the page
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback to reload if no callback provided
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error signing in:', error);
      setMessage({ 
        text: t('signin.error'),
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="signin-email" className="text-white dark:text-black">{t('email.label')}</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder={t('email.placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-white dark:text-black placeholder:text-stone-400 dark:placeholder:text-stone-600"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signin-password" className="text-white dark:text-black">{t('password.label')}</Label>
        <Input
          id="signin-password"
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
        {isSubmitting ? t('signing.in') : t('sign.in')}
      </Button>
      
      <div className="text-sm text-center text-stone-300 dark:text-stone-700">
        <span>{t('dont.have.account')} </span>
        <Button 
          variant="link" 
          className="p-0 h-auto font-normal text-white dark:text-black" 
          onClick={(e) => {
            e.preventDefault();
            if (onSwitchToSignUp) {
              onSwitchToSignUp();
            }
          }}
        >
          {t('sign.up')}
        </Button>
      </div>
    </form>
  );
}