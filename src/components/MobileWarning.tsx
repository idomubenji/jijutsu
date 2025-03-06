"use client";

import { useEffect, useState } from "react";

const MobileWarning = ({ children }: { children: React.ReactNode }) => {
  // Default to false for server-side rendering
  const [isMobile, setIsMobile] = useState(false);
  // Track whether we've mounted the component
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted
    setHasMounted(true);
    
    // Function to check if the device is mobile
    const checkIfMobile = () => {
      const mobileWidth = 768; // Standard breakpoint for mobile devices
      setIsMobile(window.innerWidth < mobileWidth);
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // During server-side rendering or before mounting, just render children
  if (!hasMounted) {
    return <>{children}</>;
  }

  // If not mobile, render children
  if (!isMobile) {
    return <>{children}</>;
  }

  // Mobile view warning screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">Desktop Only Experience</h2>
        <p className="mb-6 text-muted-foreground">
          Jijutsu is currently desktop only; we apologize for the inconvenience.
        </p>
        <p className="text-sm text-muted-foreground">
          Please visit us on a desktop or laptop device for the best experience.
        </p>
      </div>
    </div>
  );
};

export default MobileWarning; 