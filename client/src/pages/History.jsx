import React from 'react';
import { History as HistoryIcon, Clock, Database } from 'lucide-react';

export default function History() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 shadow-geo-card">
        <div className="flex items-center space-x-3 mb-2">
          <HistoryIcon className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Project Processing History</h1>
        </div>
        <p className="text-xs text-slate-400">
          Audit trail of monocular depth predictions, calibrated elevation runs, and exported 3D assets.
        </p>

        <div className="mt-8 border border-dashed border-geo-700/70 rounded-lg p-12 text-center bg-geo-850/40">
          <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No processing runs recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Once imagery is uploaded and depth estimation is performed, sessions and calibrated models will be archived here.
          </p>
        </div>
      </div>
    </div>
  );
}
