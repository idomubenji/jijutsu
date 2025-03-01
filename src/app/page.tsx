'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/game');
  }, [router]);
  
  // Return empty div while redirecting
  return <div />;
}
