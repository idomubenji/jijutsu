'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Countdown } from '@/components/Countdown';
import { SakuraAnimation } from '@/components/SakuraAnimation';
import { SignupForm } from '@/components/SignupForm';
import { addToWaitlist } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the release date from environment variable
  const releaseDate = process.env.NEXT_PUBLIC_RELEASE_DATE || '2023-12-31T23:59:59';

  // Check if the countdown is already complete on initial load
  useEffect(() => {
    const isComplete = new Date(releaseDate).getTime() <= new Date().getTime();
    setIsCountdownComplete(isComplete);
    
    // If countdown is complete, redirect to the game page
    if (isComplete) {
      router.push('/game');
    }
  }, [releaseDate, router]);

  const handleCountdownComplete = () => {
    setIsCountdownComplete(true);
    // Redirect to game page when countdown completes
    router.push('/game');
  };

  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setWaitlistMessage({ text: 'Please enter a valid email address', isError: true });
      return;
    }

    setIsSubmitting(true);
    setWaitlistMessage(null);

    try {
      const result = await addToWaitlist(email);
      
      if (result.success) {
        setWaitlistMessage({ text: result.message, isError: false });
        setEmail('');
      } else {
        setWaitlistMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setWaitlistMessage({ 
        text: 'An error occurred. Please try again later.',
        isError: true 
      });
      console.error('Error submitting waitlist form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2E8DC] dark:bg-[#38332E]">
      {/* Theme toggle at the top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <main className="flex flex-col md:flex-row items-center justify-center w-full flex-1 px-5 gap-6 text-center">
        <Card className="w-full md:w-2/5 max-w-md aspect-[3/4] flex flex-col bg-stone-800/80 dark:bg-stone-50/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="flex flex-col items-center justify-between py-6 h-full">
            <div className="flex flex-col items-center">
              <CardTitle className="text-4xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#F2E8DC] dark:text-[#38332E] mb-2">
                字術へようこそ
              </CardTitle>
              <CardDescription className="text-lg md:text-base lg:text-lg text-white/80 dark:text-black/70 mb-4">
                Welcome to Jijutsu
              </CardDescription>
            </div>
            
            <SakuraAnimation />
            
            <div className="flex flex-col items-center">              
              <Countdown 
                targetDate={releaseDate} 
                onComplete={handleCountdownComplete} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Demo Video Card */}
        <Card className="w-full md:w-2/5 max-w-md aspect-[3/4] flex flex-col bg-stone-800/80 dark:bg-stone-50/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="flex flex-col items-center justify-between py-6 h-full">
            <div className="relative w-full flex-1 overflow-hidden rounded-md">
              <div className="absolute inset-0 flex items-center justify-center">
                <video 
                  className="min-h-full min-w-full object-cover object-[60%_center]" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source src="/jijutsu-demo-1.m4v" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <p className="text-center mt-4 text-white/80 dark:text-black/70 italic">
              currently evolving...
            </p>
          </CardContent>
        </Card>
      </main>
      
      {/* Inline waitlist form */}
      <div className="w-full px-4 max-w-3xl">
        {isCountdownComplete ? (
          <div className="w-full flex justify-center my-8">
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="py-6 px-10 text-lg">
                  Sign up
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create an account</DialogTitle>
                  <DialogDescription>Sign up to start creating with Jijutsu.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <SignupForm />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <form onSubmit={handleSubmitWaitlist} className="flex flex-col sm:flex-row items-center gap-4 my-8">
            <div className="w-full relative">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-6 px-4 text-lg w-full bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-sm border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-50 placeholder:text-stone-500 dark:placeholder:text-stone-400"
                required
              />
              {waitlistMessage && (
                <p className={`text-sm absolute -bottom-6 left-0 ${waitlistMessage.isError ? 'text-red-600' : 'text-green-600'}`}>
                  {waitlistMessage.text}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              variant="default" 
              className="py-6 px-10 text-lg whitespace-nowrap w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Join the waitlist'}
            </Button>
          </form>
        )}
      </div>
      
      <footer className="w-full py-6 text-center text-sm text-stone-500 dark:text-stone-400">
        &copy; {new Date().getFullYear()} Jijutsu
      </footer>
    </div>
  );
}
