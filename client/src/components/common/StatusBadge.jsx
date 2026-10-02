import React from 'react';

export default function StatusBadge({ status, label, detail }) {
  const isOnline = status === 'online';
  
  return (
    <div className="flex items-center space-x-2 bg-geo-850 px-3 py-1.5 rounded-md border border-geo-700/50">
      <div 
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
        }`} 
      />
      <span className="text-slate-400 text-xs">{label}:</span>
      <span className="font-mono text-xs text-slate-200 capitalize font-medium">
        {detail || (isOnline ? 'Online' : 'Offline')}
      </span>
    </div>
  );
}
