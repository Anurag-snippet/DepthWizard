import React from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Cpu, ShieldCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function Navbar({ backendStatus, aiStatus }) {
  return (
    <header className="h-14 border-b border-geo-700/60 bg-geo-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center space-x-3 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-geo-glow group-hover:scale-105 transition-transform">
          <Mountain className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-wider text-base text-white">DEPTHWIZARD</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
              SIH 26175
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono leading-none">Single-View Height Estimation & 3D Flythrough</p>
        </div>
      </Link>

      {/* Global telemetry & compliance badges */}
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-2 bg-geo-850 px-3 py-1.5 rounded-md border border-geo-700/50">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Engine:</span>
          <span className="font-mono text-cyan-300 font-semibold">TensorFlow 2.21</span>
        </div>

        <StatusBadge 
          status={backendStatus} 
          label="Backend API" 
          detail={backendStatus === 'online' ? 'Port 5000' : 'Offline'} 
        />

        <StatusBadge 
          status={aiStatus} 
          label="AI Service" 
          detail={aiStatus === 'online' ? 'Port 8000' : 'Offline'} 
        />

        <div className="hidden lg:flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Relative ≠ Metric Guard</span>
        </div>
      </div>
    </header>
  );
}
