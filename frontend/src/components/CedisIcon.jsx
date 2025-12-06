import React from 'react';

export default function CedisIcon({ className = "h-5 w-5" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Letter C for Cedis */}
      <path d="M16 8a6 6 0 0 0-6-6c-3.314 0-6 2.686-6 6v8a6 6 0 0 0 6 6c1.657 0 3.157-.672 4.243-1.757" />
      {/* Two horizontal lines through the C */}
      <line x1="3" y1="10" x2="13" y2="10" />
      <line x1="3" y1="14" x2="13" y2="14" />
    </svg>
  );
}
