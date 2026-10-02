import React from 'react';

export default function StatusBadge({ status, label, detail }) {
  const isOnline = status === 'online';
  
  return (
    <div title={`${label} service is ${isOnline ? 'online' : 'unavailable'}`} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full border ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-500' : 'bg-rose-500'
        }`} 
      />
      <span className={`text-xs font-semibold ${isOnline ? 'text-emerald-800' : 'text-rose-800'}`}>{label}</span>
      <span className={`font-mono text-[11px] capitalize ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
        {detail || (isOnline ? 'Online' : 'Offline')}
      </span>
    </div>
  );
}
