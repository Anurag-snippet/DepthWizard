import React from 'react';

export default function StatusBadge({ status, label, detail }) {
  const isOnline = status === 'online';
  const isWakingUp = status === 'waking_up' || status === 'starting';

  let containerClass = 'bg-rose-50 border-rose-200 text-rose-800';
  let dotClass = 'bg-rose-500';
  let textClass = 'text-rose-700';
  let defaultDetail = 'Unavailable';
  let tooltip = `${label} service is unavailable`;

  if (isOnline) {
    containerClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    dotClass = 'bg-emerald-500';
    textClass = 'text-emerald-700';
    defaultDetail = 'Online';
    tooltip = `${label} service is connected and operational`;
  } else if (isWakingUp) {
    containerClass = 'bg-amber-50 border-amber-200 text-amber-800';
    dotClass = 'bg-amber-500 animate-pulse';
    textClass = 'text-amber-700';
    defaultDetail = 'Waking up...';
    tooltip = `${label} service is waking up from Render standby (takes ~30-60s)`;
  }

  return (
    <div title={tooltip} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full border transition-colors ${containerClass}`}>
      <div className="relative flex items-center justify-center">
        {isWakingUp && (
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75" />
        )}
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
      </div>
      <span className="text-xs font-semibold">{label}</span>
      <span className={`font-mono text-[11px] capitalize ${textClass}`}>
        {detail || defaultDetail}
      </span>
    </div>
  );
}
