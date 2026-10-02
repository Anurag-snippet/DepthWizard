import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function Navbar({ backendStatus, aiStatus, dbStatus }) {
  const { pathname } = useLocation();
  const pageName = pathname.startsWith('/new-analysis') ? 'New analysis'
    : pathname.startsWith('/workspace') ? 'Analysis workspace'
      : pathname.startsWith('/terrain-viewer') ? '3D terrain viewer'
        : pathname.startsWith('/history') ? 'Project history' : 'Dashboard';
  return (
    <header className="h-16 border-b border-geo-700 bg-white/95 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
      <div className="flex items-center space-x-5">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-geo-card group-hover:scale-105 transition-transform">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-base text-slate-900">DepthWizard</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Terrain from a single image</p>
          </div>
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

        {dbStatus && (
          <StatusBadge 
            status={dbStatus} 
            label="DB" 
            detail={dbStatus === 'online' ? 'MongoDB' : 'Fallback'}
          />
        )}
      </div>
    </header>
  );
}
