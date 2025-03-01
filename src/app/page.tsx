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
import { SignInForm } from '@/components/SignInForm';
import { supabase, addToWaitlist } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import MainLayout from '@/components/MainLayout';
import { LogOut } from 'lucide-react';

interface KanjiData {
  kanji: string;
  dex_number: number;
  meanings: string[];
}

interface RadicalData {
  radical_shape: string;
  english_name: string;
  dex_number: number;
}

interface UserKanjiResponse {
  kanji_id: string;
  kanji_dex: KanjiData;
}

export default function Home() {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [discoveredKanji, setDiscoveredKanji] = useState<KanjiData[]>([]);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

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

  // Load user's discovered kanji from Supabase
  const loadUserKanji = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_kanji')
        .select(`
          kanji_id,
          kanji_dex!inner (
            kanji,
            dex_number,
            meanings
          )
        `)
        .eq('user_id', userId)
        .returns<UserKanjiResponse[]>();

      if (error) {
        console.error('Error loading user kanji:', error);
        return;
      }

      // Extract kanji data from the response
      const kanjiData = data?.map(row => row.kanji_dex) || [];
      setDiscoveredKanji(kanjiData);
    } catch (error) {
      console.error('Error in loadUserKanji:', error);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
          await loadUserKanji(session.user.id);
        }

        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
              await loadUserKanji(session.user.id);
            } else {
              setDiscoveredKanji([]); // Clear kanji when user logs out
            }
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleCountdownComplete = () => {
    setIsCountdownComplete(true);
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

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    if (mode === 'signin') {
      setIsSignInOpen(true);
      setIsSignUpOpen(false);
    } else {
      setIsSignUpOpen(true);
      setIsSignInOpen(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <MainLayout>
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

          {/* Kanji Collection or Demo Video Card */}
          <Card className="w-full md:w-2/5 max-w-md aspect-[3/4] flex flex-col bg-stone-800/80 dark:bg-stone-50/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="flex flex-col items-center justify-between py-6 h-full">
              {user ? (
                <>
                  <div className="flex flex-col items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#F2E8DC] dark:text-[#38332E]">
                      Your Collection
                    </h2>
                    <p className="text-white/80 dark:text-black/70">
                      {discoveredKanji.length} kanji discovered
                    </p>
                  </div>
                  <div className="flex-1 w-full overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {discoveredKanji.map((kanji) => (
                        <div
                          key={kanji.dex_number}
                          className="aspect-square bg-[#78B693]/80 rounded-lg flex flex-col items-center justify-center p-1"
                        >
                          <span className="text-xl font-bold text-white dark:text-black">
                            {kanji.kanji}
                          </span>
                          <span className="text-xs text-white/80 dark:text-black/70 truncate w-full text-center">
                            {kanji.meanings[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-red-500 hover:text-red-700 hover:bg-transparent p-0 flex items-center gap-1"
                    >
                      <LogOut size={16} /> Sign out
                    </Button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        </main>
        
        {/* Auth or waitlist form */}
        <div className="w-full px-4 max-w-3xl">
          {isCountdownComplete ? (
            <div className="w-full flex justify-center gap-2 my-8">
              {!user && (
                <>
                  <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => handleOpenAuth('signin')}>
                        Sign in
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-stone-800/80 dark:bg-stone-50/80">
                      <DialogHeader>
                        <DialogTitle className="text-white dark:text-black">Sign in to Jijutsu</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <SignInForm 
                          onSwitchToSignUp={() => handleOpenAuth('signup')}
                          onSuccess={handleAuthSuccess}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" onClick={() => handleOpenAuth('signup')}>
                        Sign up
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-stone-800/80 dark:bg-stone-50/80">
                      <DialogHeader>
                        <DialogTitle className="text-white dark:text-black">Create your Jijutsu account</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <SignupForm 
                          onSuccess={handleAuthSuccess}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
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
    </MainLayout>
  );
}
