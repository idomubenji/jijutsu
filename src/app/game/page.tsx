'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SignInForm } from '@/components/SignInForm';
import { SignupForm } from '@/components/SignupForm';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';
import { ClientLayout } from '@/components/ClientLayout';

export default function GamePage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user || null);
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

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    if (mode === 'signin') {
      setIsSignInOpen(true);
      setIsSignUpOpen(false);
    } else {
      setIsSignUpOpen(true);
      setIsSignInOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // No need to set user to null since the auth state change listener will do that
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthSuccess = () => {
    // Close both dialogs
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
  };

  return (
    <ClientLayout>
      <div className="min-h-screen flex" style={{ backgroundColor: '#F2E8DC' }}>
        {/* Main content area */}
        <div className="flex-1 relative">
          {/* Jijutsu logo at top left - moved from right to left */}
          <div className="absolute top-6 left-6">
            <div className="text-3xl font-bold tracking-wide">字術</div>
          </div>

          {/* Auth buttons at bottom left - show sign out if authenticated, else show sign in/up */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            {isLoading ? (
              <div className="text-stone-400 text-sm">Loading...</div>
            ) : user ? (
              // User is authenticated - show sign out button with custom styling
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-700 hover:bg-transparent p-0 flex items-center gap-1"
              >
                <LogOut size={16} /> Sign out
              </Button>
            ) : (
              // User is not authenticated - show sign in and sign up buttons
              <>
                <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleOpenAuth('signin')}>
                      Sign in
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Sign in to Jijutsu</DialogTitle>
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
                    <Button variant="default" size="sm" onClick={() => handleOpenAuth('signup')}>
                      Sign up
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create your Jijutsu account</DialogTitle>
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
        </div>

        {/* Sidebar for radical items */}
        <div className="w-64 border-l border-stone-200 flex flex-col" style={{ backgroundColor: '#E8DED2' }}>
          {/* Content area for radical items */}
          <div className="flex-1 p-4">
            {!user && !isLoading && (
              <div className="text-stone-400 text-sm">
                Radical items will appear here
              </div>
            )}
          </div>
          
          {/* User info moved to bottom of sidebar */}
          {user && (
            <div className="p-4 border-t border-stone-200">
              <div className="text-sm font-medium">
                <div className="text-stone-600">Logged in as:</div>
                <div className="text-stone-900">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
} 