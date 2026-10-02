import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mountain, 
  Layers, 
  Compass, 
  Sliders, 
  Activity, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  FileCode,
  Box
} from 'lucide-react';

export default function Dashboard({ backendHealth, aiHealth }) {
  const phases = [
    { id: 'Phase 1', title: 'Project Setup & Architecture', status: 'Active / Completed', desc: 'Monorepo scaffolding, microservices, health telemetry, and client layout.' },
    { id: 'Phase 2', title: 'Image Upload & Geospatial Preprocessing', status: 'Pending', desc: 'Optical and GeoTIFF ingestion, contrast normalization, metadata inspection.' },
    { id: 'Phase 3', title: 'TensorFlow Monocular Depth Estimation', status: 'Pending', desc: 'Pretrained neural model inference to produce relative depth maps [0, 1].' },
    { id: 'Phase 4', title: 'Relative Depth Visualization & Inspection', status: 'Pending', desc: 'Colormapped 2D viewers, interactive depth probe, histogram analysis.' },
    { id: 'Phase 5', title: 'Metric Elevation Calibration (DEM/GCP)', status: 'Pending', desc: 'Reference elevation regression to convert relative disparity into true metres.' },
    { id: 'Phase 6-8', title: '3D Terrain Mesh & Flythrough Canvas', status: 'Pending', desc: 'Three.js displacement mesh, satellite texture projection, spline flightpath.' },
    { id: 'Phase 9-10', title: 'Terrain Analysis, Export & History', status: 'Pending', desc: 'Transect elevation profiles, slope calculations, GLTF/DEM exports.' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 shadow-geo-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Phase 1 Implemented
              </span>
              <span className="text-xs font-mono text-slate-400">SIH Problem Statement 26175</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">DepthWizard Engineering Console</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Single-view height estimation and real-time 3D flight simulation for optical satellite imagery.
              Powered by TensorFlow/Keras monocular estimation, reference elevation calibration, and WebGL Three.js rendering.
            </p>
          </div>

          <Link
            to="/workspace"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-600/30 whitespace-nowrap self-start md:self-auto"
          >
            <span>Open 3D Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Live Service Diagnostic Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-geo-850 border border-geo-700/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Box className="w-3.5 h-3.5 text-blue-400" />
                <span>Frontend Client</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Active (Vite)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              React 19, Tailwind CSS, Three.js, React Three Fiber & Drei.
            </p>
          </div>

          <div className="bg-geo-850 border border-geo-700/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backend Gateway</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                backendHealth.online 
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' 
                  : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
              }`}>
                {backendHealth.online ? 'Online (5000)' : 'Awaiting Start'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Node.js Express REST API, Multer upload pipeline, elevation calibrator.
            </p>
          </div>

          <div className="bg-geo-850 border border-geo-700/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Inference Engine</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                aiHealth.online 
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' 
                  : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
              }`}>
                {aiHealth.online ? 'Online (8000)' : 'Awaiting Start'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              FastAPI, TensorFlow 2.21, Keras 3.15, OpenCV, NumPy.
            </p>
          </div>
        </div>
      </div>

      {/* Geospatial Scientific Integrity Protocol Notice */}
      <div className="bg-blue-950/20 border border-blue-800/40 rounded-lg p-4 flex items-start space-x-3">
        <Terminal className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-blue-300">SIH 26175 Scientific Requirement Notice:</p>
          <p className="text-slate-400 leading-relaxed">
            The monocular depth network outputs relative depth values $[0, 1]$ representing distance from viewpoint or relative relief. 
            <strong> Relative depth will strictly NOT be labeled as absolute metric elevation</strong> until calibrated against verified reference Digital Elevation Models (e.g. SRTM, ALOS, TanDEM-X) or Ground Control Points (GCPs).
          </p>
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div className="bg-geo-900/60 border border-geo-700/50 rounded-xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Implementation Phases Roadmap</h2>
        <div className="space-y-3">
          {phases.map((p, i) => (
            <div 
              key={p.id}
              className={`p-3.5 rounded-lg border flex items-center justify-between ${
                i === 0 
                  ? 'bg-geo-850/80 border-blue-500/40' 
                  : 'bg-geo-850/30 border-geo-700/30 opacity-75'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                  i === 0 ? 'bg-blue-500 text-white' : 'bg-geo-800 text-slate-400'
                }`}>
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-200">{p.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{p.id}</span>
                  </div>
                  <p className="text-xs text-slate-400">{p.desc}</p>
                </div>
              </div>

              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                i === 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-500 bg-geo-800/50'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
