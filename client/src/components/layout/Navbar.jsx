import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Mountain, Cpu, ShieldCheck, PlusCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function Navbar({ backendStatus, aiStatus }) {
  return (
    <header className="h-14 border-b border-geo-700/60 bg-geo-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
      <div className="flex items-center space-x-6">
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
            <p className="text-[10px] text-slate-400 font-mono leading-none">Single-View Height Estimation & 3D Flythrough</p>
          </div>
        </Link>

        {/* Quick Nav Links in Header */}
        <nav className="hidden md:flex items-center space-x-1 text-xs">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md font-medium transition-colors ${
                isActive ? 'bg-geo-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/workspace"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md font-medium transition-colors ${
                isActive ? 'bg-geo-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            Workspace
          </NavLink>
          <NavLink
            to="/terrain-viewer"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md font-medium transition-colors ${
                isActive ? 'bg-geo-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            3D Terrain
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md font-medium transition-colors ${
                isActive ? 'bg-geo-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            History
          </NavLink>
        </nav>
      </div>

      {/* Global telemetry & compliance badges */}
      <div className="flex items-center space-x-3 text-xs">
        <Link
          to="/new-analysis"
          className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/30 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </Link>

        <div className="h-4 w-[1px] bg-geo-700/60 hidden sm:block" />

        <div className="hidden lg:flex items-center space-x-2 bg-geo-850 px-2.5 py-1 rounded-md border border-geo-700/50">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-cyan-300 font-semibold text-[11px]">TF 2.21</span>
        </div>

        <StatusBadge 
          status={backendStatus} 
          label="API" 
          detail={backendStatus === 'online' ? '5000' : 'Offline'} 
        />

        <StatusBadge 
          status={aiStatus} 
          label="AI" 
          detail={aiStatus === 'online' ? '8000' : 'Offline'} 
        />

        <div className="hidden xl:flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium font-mono">Relative ≠ Metric Guard</span>
        </div>
      </div>
    </header>
  );
}
