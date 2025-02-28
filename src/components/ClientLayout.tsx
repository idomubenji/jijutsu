'use client';

import { ReactNode } from 'react';
import { AuthStateListener } from './AuthStateListener';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      {/* This component doesn't render anything visible but handles auth state */}
      <AuthStateListener />
      
      {/* Render children */}
      {children}
    </>
  );
} 