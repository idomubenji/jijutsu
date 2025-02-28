'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

interface SignInFormProps {
  onSwitchToSignUp?: () => void;
  onSuccess?: () => void;
}

export function SignInForm({ onSwitchToSignUp, onSuccess }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Please enter a valid email address', isError: true });
      return;
    }

    if (!password || password.length < 1) {
      setMessage({ text: 'Please enter your password', isError: true });
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
        setMessage({ text: 'Invalid email or password', isError: true });
        return;
      }

      if (!data?.user) {
        throw new Error('No user returned from sign in');
      }
      
      setMessage({ text: 'Signed in successfully!', isError: false });
      
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
        text: 'An error occurred during sign in. Please try again.',
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
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
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
      
      <div className="text-sm text-center text-stone-500">
        <span>Don't have an account? </span>
        <Button 
          variant="link" 
          className="p-0 h-auto font-normal" 
          onClick={(e) => {
            e.preventDefault();
            if (onSwitchToSignUp) {
              onSwitchToSignUp();
            }
          }}
        >
          Sign up
        </Button>
      </div>
    </form>
  );
} 