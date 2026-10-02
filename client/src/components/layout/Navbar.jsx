import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function Navbar({ backendStatus, aiStatus }) {
  const { pathname } = useLocation();
  const pageName = pathname.startsWith('/new-analysis') ? 'New analysis'
    : pathname.startsWith('/workspace') ? 'Analysis workspace'
      : pathname.startsWith('/terrain-viewer') ? '3D terrain viewer'
        : pathname.startsWith('/history') ? 'Project history' : 'Dashboard';
  return (
    <header className="h-16 border-b border-geo-700 bg-white/95 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
      <div className="flex items-center space-x-5">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/25 ring-1 ring-blue-400/30 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all">
            <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden="true">
              <path d="M4 24.5 11.2 10l4.2 7 3.5-5.5L28 24.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 24.5h20" stroke="#a5f3fc" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M9 27h14" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
              <circle cx="23.5" cy="8.5" r="2.25" fill="#fef3c7" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-base text-slate-900">DepthWizard</span>
        </Link>

        <span className="hidden sm:inline text-xs text-slate-500 border-l border-slate-200 pl-5" aria-current="page">{pageName}</span>
      </div>

      {/* Global telemetry & compliance badges */}
      <div className="flex items-center space-x-2.5 text-xs">
        <StatusBadge 
          status={backendStatus} 
          label="API" 
          detail={backendStatus === 'online' ? 'online' : 'unavailable'}
        />

        <StatusBadge 
          status={aiStatus} 
          label="AI" 
          detail={aiStatus === 'online' ? 'online' : (aiStatus === 'waking_up' ? 'waking up' : 'unavailable')}
        />
      </div>
    </header>
  );
}
