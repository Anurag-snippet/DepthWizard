import React from 'react';

export default function MetricsCard({ title, value, subtitle, icon: Icon, badge, highlight }) {
  return (
    <div className={`min-h-[132px] p-4 rounded-xl border bg-white transition-all ${
      highlight ? 'border-blue-300 shadow-geo-card' : 'border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
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
