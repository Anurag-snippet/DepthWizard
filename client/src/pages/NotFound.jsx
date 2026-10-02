import React from 'react';
import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <Mountain className="w-12 h-12 text-slate-600 mb-4" />
      <h2 className="text-xl font-bold text-white">404 — Page Not Found</h2>
      <p className="text-xs text-slate-400 mt-1 mb-4">The requested geospatial coordinate could not be found.</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500">
        Return to Dashboard
      </Link>
    </div>
  );
}
