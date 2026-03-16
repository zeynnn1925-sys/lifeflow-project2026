import React from 'react';

export function Logo({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path 
        d="M46 28 C54 28 56 36 52 42 C45 52 35 55 35 65 C35 75 45 78 55 70 C65 62 68 52 60 52 C52 52 45 60 50 70 C55 80 65 78 68 70" 
        stroke={color} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
