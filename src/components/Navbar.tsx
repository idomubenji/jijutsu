import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link 
          href="/" 
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          字術 Jijutsu
        </Link>
        
        <div className="flex space-x-6">
          <Link 
            href="/" 
            className={`${
              pathname === '/' 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            } transition-colors`}
          >
            Home
          </Link>
          
          <Link 
            href="/game" 
            className={`${
              pathname === '/game' 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            } transition-colors`}
          >
            Game
          </Link>
          
          <Link 
            href="/dex" 
            className={`${
              pathname === '/dex' 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            } transition-colors`}
          >
            Dex
          </Link>
        </div>
      </div>
    </nav>
  );
} 