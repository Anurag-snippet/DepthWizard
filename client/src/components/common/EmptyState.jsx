import React from 'react';
import { Layers } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Layers, 
  title = 'No analyses found', 
  description = 'Get started by uploading a satellite crop for monocular height estimation.',
  actionLabel,
  onAction
}) {
  return (
    <div className="border border-dashed border-geo-700/80 rounded-xl p-12 text-center bg-geo-900/30 flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-xl bg-geo-850 border border-geo-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-900/30 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
