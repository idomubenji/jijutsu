'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export function SignupForm() {
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

    if (!password || password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Check if the email already exists in our users table
      // In a more secure implementation, this would be done server-side
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
        setMessage({ text: 'Account already exists!', isError: true });
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
        throw error;
      }

      if (!data?.user) {
        throw new Error('No user returned from signup');
      }
      
      console.log('User signed up successfully:', data.user.id);

      // Add the user to the users table - now our policy is more permissive
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ 
          email, 
          user_id: data.user.id 
        }]);

      if (insertError) {
        console.error('Error inserting user into users table:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      setMessage({ 
        text: 'Account created successfully! Check your email for the confirmation link.', 
        isError: false 
      });
      setEmail('');
      setPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error signing up:', error);
      console.error('Detailed error:', JSON.stringify(error, null, 2));
      setMessage({ 
        text: `An error occurred during signup: ${errorMessage}. Please try again later.`,
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
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
    </form>
  );
} 