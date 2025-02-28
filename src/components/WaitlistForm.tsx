'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addToWaitlist } from '@/lib/supabase';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Please enter a valid email address', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await addToWaitlist(email);
      
      if (result.success) {
        setMessage({ text: result.message, isError: false });
        setEmail('');
      } else {
        setMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setMessage({ 
        text: 'An error occurred. Please try again later.',
        isError: true 
      });
      console.error('Error submitting waitlist form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      {message && (
        <p className={`text-sm ${message.isError ? 'text-red-500' : 'text-green-500'}`}>
          {message.text}
        </p>
      )}
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Join the waitlist'}
      </Button>
    </form>
  );
} 