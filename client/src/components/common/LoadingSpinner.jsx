import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Processing geospatial payload...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-blue-400 animate-spin`} />
      {message && (
        <p className="text-xs font-mono text-slate-400 tracking-wide text-center">
          {message}
        </p>
      )}
    </div>
  );
}
