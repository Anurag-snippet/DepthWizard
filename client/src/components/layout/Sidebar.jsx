import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Layers, 
  PlusCircle, 
  LayoutDashboard, 
  Compass, 
  History, 
  HelpCircle
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new-analysis', label: 'New Analysis', icon: PlusCircle },
    { to: '/workspace', label: 'Analysis Workspace', icon: Layers },
    { to: '/terrain-viewer', label: '3D Terrain Viewer', icon: Compass },
    { to: '/history', label: 'Project History', icon: History },
  ];

  return (
    <aside className="w-16 border-r border-geo-700/50 bg-geo-900/60 flex flex-col items-center py-4 justify-between flex-shrink-0">
      <div className="flex flex-col space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                `p-2.5 rounded-lg transition-all relative group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-geo-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip on hover */}
              <span className="absolute left-16 ml-2 px-2 py-1 bg-geo-900 border border-geo-700 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>

      <div className="flex flex-col space-y-3 text-slate-500">
        <a
          href="https://github.com/Anurag-snippet/DepthWizard"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository & Documentation"
          className="p-2.5 hover:text-slate-300 hover:bg-geo-800 rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>
    </aside>
  );
}
