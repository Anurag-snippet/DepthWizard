import React from 'react';

export default function ElevationLegend({ min = 0, max = 100, isMetric = false, unit = 'm', mode = 'Textured' }) {
  const midpoint = isMetric ? ((Number(min) + Number(max)) / 2).toFixed(1) : '0.5';
  return (
    <div className="bg-geo-900/90 backdrop-blur-md border border-geo-700/60 rounded-xl p-3 shadow-lg space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-400 font-medium">
          {isMetric ? 'Metric elevation' : 'Relative depth'} · {mode}
        </span>
        <span className="text-cyan-400 font-semibold">
          {isMetric ? unit : '[0, 1]'}
        </span>
      </div>

      <div className="h-3 w-full rounded-md bg-gradient-to-r from-[#1d4ed8] via-[#059669] via-[#d97706] to-[#dc2626] border border-slate-700/50 shadow-inner" />

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
        <span>{min} {isMetric ? unit : ''}</span>
        <span>{midpoint} {isMetric ? unit : ''}</span>
        <span>{max} {isMetric ? unit : ''}</span>
      </div>
    </div>
  );
}
