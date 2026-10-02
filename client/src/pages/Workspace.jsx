import React, { useState } from 'react';
import { 
  UploadCloud, 
  Layers, 
  Compass, 
  Sliders, 
  Activity, 
  Eye, 
  Maximize2,
  Info
} from 'lucide-react';

export default function Workspace() {
  const [activeSubTab, setActiveSubTab] = useState('2d');

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Top Workspace Toolbar */}
      <div className="h-12 border-b border-geo-700/60 bg-geo-900/80 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-geo-850 p-1 rounded-lg border border-geo-700/50 text-xs">
            <button
              onClick={() => setActiveSubTab('2d')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeSubTab === '2d'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D Multispectral / Depth
            </button>
            <button
              onClick={() => setActiveSubTab('3d')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeSubTab === '3d'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Flythrough Canvas
            </button>
          </div>

          <div className="h-4 w-[1px] bg-geo-700/60" />

          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>Projection:</span>
            <span className="text-slate-200 font-semibold">WGS 84 / Pseudo-Mercator</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 bg-geo-850 px-2.5 py-1 rounded border border-geo-700/50 font-mono">
            State: Ready for Ingestion (Phase 2)
          </span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Tool Panel */}
        <div className="w-80 border-r border-geo-700/60 bg-geo-900/50 p-4 overflow-y-auto space-y-4">
          <div className="bg-geo-850 border border-geo-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <UploadCloud className="w-4 h-4 text-blue-400" />
              <span>Imagery Ingestion</span>
            </div>
            <p className="text-xs text-slate-400">
              Drag-and-drop single optical satellite crop (GeoTIFF, PNG, JPEG) and optional reference DEM.
            </p>
            <div className="border-2 border-dashed border-geo-700/70 hover:border-blue-500/50 rounded-lg p-6 text-center transition-colors cursor-pointer bg-geo-900/40">
              <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">Drop satellite image here</p>
              <p className="text-[10px] text-slate-500 mt-1">GeoTIFF, PNG, or JPEG up to 50MB</p>
            </div>
          </div>

          <div className="bg-geo-850 border border-geo-700/50 rounded-lg p-4 space-y-2 opacity-60">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Depth & Calibration Parameters</span>
            </div>
            <p className="text-xs text-slate-500">
              Activation in Phase 3 (TensorFlow Inference) & Phase 5 (Elevation Calibration).
            </p>
          </div>

          <div className="bg-geo-850 border border-geo-700/50 rounded-lg p-4 space-y-2 opacity-60">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Flight Simulation Controls</span>
            </div>
            <p className="text-xs text-slate-500">
              Activation in Phase 8 (Spline Flightpath & Drone Navigation).
            </p>
          </div>
        </div>

        {/* Central Viewport */}
        <div className="flex-1 bg-geo-950 flex flex-col items-center justify-center p-8 relative">
          <div className="max-w-md text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-geo-900 border border-geo-700/80 flex items-center justify-center mx-auto shadow-geo-glow text-blue-400">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Geospatial 3D Workspace</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Phase 1 (Architecture & Setup) is active. The 3D Three.js canvas and TensorFlow prediction pipeline will be wired in successive phases.
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/40 text-blue-300 border border-blue-800/40 text-xs font-mono">
              <Info className="w-3.5 h-3.5" />
              <span>Next Phase: Phase 2 Imagery Preprocessing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
