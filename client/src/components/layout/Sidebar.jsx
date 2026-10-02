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
    <aside className="hidden md:flex w-52 border-r border-geo-700 bg-white flex-col py-5 justify-between flex-shrink-0">
      <div className="flex flex-col space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg transition-all relative group flex items-center space-x-3 text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-geo-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="px-3 text-slate-500">
        <a
          href="https://github.com/Anurag-snippet/DepthWizard"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository & Documentation"
          className="px-3 py-2 text-sm flex items-center space-x-3 hover:text-slate-900 hover:bg-geo-800 rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </a>
      </div>
    </aside>
  );
}
