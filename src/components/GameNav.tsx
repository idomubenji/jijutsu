"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, BookOpen } from 'lucide-react';

export default function GameNav() {
  const pathname = usePathname();
  
  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
      <Link href="/game" className="font-bold text-2xl">字術</Link>
      
      <div className="flex items-center gap-2 bg-[#78B693]/80 dark:bg-[#78B693]/80 rounded-full px-2 py-1.5 backdrop-blur-sm shadow-sm">
        <Link 
          href="/game" 
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            pathname === '/game' 
              ? 'bg-[#004F17] text-white' 
              : 'text-white hover:bg-[#78B693]'
          }`}
          aria-current={pathname === '/game' ? 'page' : undefined}
          aria-label="Game"
        >
          <Gamepad2 size={20} />
        </Link>
        
        <Link 
          href="/dex" 
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            pathname === '/dex' 
              ? 'bg-[#004F17] text-white' 
              : 'text-white hover:bg-[#78B693]'
          }`}
          aria-current={pathname === '/dex' ? 'page' : undefined}
          aria-label="Dex"
        >
          <BookOpen size={20} />
        </Link>
      </div>
    </div>
  );
} 