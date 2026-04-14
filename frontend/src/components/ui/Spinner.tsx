import React from 'react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-peach-200 border-t-peach-400 ${className || 'h-8 w-8'}`} />
  );
}
