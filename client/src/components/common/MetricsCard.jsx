import React from 'react';

export default function MetricsCard({ title, value, subtitle, icon: Icon, badge, highlight }) {
  return (
    <div className={`p-4 rounded-xl border bg-geo-850/80 transition-all ${
      highlight ? 'border-blue-500/50 shadow-geo-glow' : 'border-geo-700/60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-geo-900 border border-geo-700/60 text-blue-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold font-mono text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-1.5 leading-tight font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}
