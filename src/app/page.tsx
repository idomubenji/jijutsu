'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Countdown } from '@/components/Countdown';
import { SakuraAnimation } from '@/components/SakuraAnimation';
import { WaitlistForm } from '@/components/WaitlistForm';
import { SignupForm } from '@/components/SignupForm';

export default function Home() {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 dark:bg-stone-900">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-5 text-center">
        <Card className="w-full max-w-md bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              字術へようこそ
            </CardTitle>
            <CardDescription className="text-xl text-stone-600 dark:text-stone-300">
              Welcome to Jijutsu
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <SakuraAnimation />
            
            <div className="h-1 w-16 bg-gradient-to-r from-pink-400 to-amber-400 rounded-full mx-auto my-6"></div>
            
            <p className="text-md text-stone-600 dark:text-stone-400 mb-4">
              The art of characters
            </p>
            
            <Countdown 
              targetDate={releaseDate} 
              onComplete={handleCountdownComplete} 
            />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  {isCountdownComplete ? 'Sign up' : 'Join the waitlist'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {isCountdownComplete ? 'Create an account' : 'Join the waitlist'}
                  </DialogTitle>
                  <DialogDescription>
                    {isCountdownComplete 
                      ? 'Sign up to start creating with Jijutsu.' 
                      : 'Be the first to know when Jijutsu launches.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {isCountdownComplete ? <SignupForm /> : <WaitlistForm />}
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </main>
      <footer className="w-full py-6 text-center text-sm text-stone-500 dark:text-stone-400">
        &copy; {new Date().getFullYear()} Jijutsu
      </footer>
    </div>
  );
}
