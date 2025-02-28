'use client';

import { useEffect, useState } from 'react';

type SakuraPetal = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  amplitude: number;
  phase: number;
};

export function SakuraAnimation() {
  const [petals, setPetals] = useState<SakuraPetal[]>([]);

  // Create the initial petals
  useEffect(() => {
    const initialPetals: SakuraPetal[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Position around the circle
      y: Math.random() * 360, // Angle in degrees
      size: 8 + Math.random() * 8, // Size between 8-16px
      rotation: Math.random() * 360, // Initial rotation
      speed: 0.5 + Math.random() * 1.5, // Speed of rotation
      amplitude: 20 + Math.random() * 30, // How far from center
      phase: Math.random() * Math.PI * 2, // Initial phase
    }));

    setPetals(initialPetals);
  }, []);

  // Animate the petals
  useEffect(() => {
    const animatePetals = () => {
      setPetals((prevPetals) =>
        prevPetals.map((petal) => ({
          ...petal,
          y: (petal.y + petal.speed) % 360, // Move along the circle
          rotation: (petal.rotation + petal.speed * 2) % 360, // Rotate the petal
        }))
      );
    };

    const intervalId = setInterval(animatePetals, 50);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative w-[300px] h-[300px]">
      {/* Logo in the center */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-4xl font-bold tracking-wide">字術</div>
      </div>

      {/* Sakura petals */}
      {petals.map((petal) => {
        // Convert to cartesian coordinates
        const angle = (petal.y * Math.PI) / 180;
        const distance = 80 + Math.sin(angle + petal.phase) * petal.amplitude;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <div
            key={petal.id}
            className="absolute bg-pink-200 rounded-full opacity-80"
            style={{
              width: `${petal.size}px`,
              height: `${petal.size * 0.8}px`,
              left: `calc(50% + ${x}px - ${petal.size / 2}px)`,
              top: `calc(50% + ${y}px - ${petal.size / 2}px)`,
              transform: `rotate(${petal.rotation}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
          />
        );
      })}
    </div>
  );
} 