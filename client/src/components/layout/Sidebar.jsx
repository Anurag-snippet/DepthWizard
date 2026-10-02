import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Compass, History, Settings, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Overview', icon: Layers },
    { to: '/workspace', label: '3D Workspace', icon: Compass },
    { to: '/history', label: 'Project History', icon: History },
  ];

  return (
    <aside className="w-16 border-r border-geo-700/50 bg-geo-900/60 flex flex-col items-center py-4 justify-between">
      <div className="flex flex-col space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `p-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-geo-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          );
        })}
      </div>

      <div className="flex flex-col space-y-3 text-slate-500">
        <button 
          title="Documentation & Specs" 
          className="p-2.5 hover:text-slate-300 hover:bg-geo-800 rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
