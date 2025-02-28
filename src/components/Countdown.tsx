'use client';

import { useEffect, useState } from 'react';

type CountdownProps = {
  targetDate: string;
  onComplete?: () => void;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function Countdown({ targetDate, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className="flex flex-wrap justify-center gap-4 text-center my-8">
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.days}</div>
        <div className="text-sm uppercase text-stone-600 dark:text-stone-400">Days</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
        <div className="text-sm uppercase text-stone-600 dark:text-stone-400">Hours</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
        <div className="text-sm uppercase text-stone-600 dark:text-stone-400">Minutes</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
        <div className="text-sm uppercase text-stone-600 dark:text-stone-400">Seconds</div>
      </div>
    </div>
  );
} 