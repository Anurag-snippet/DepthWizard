import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  ArrowLeft, 
  Play, 
  Pause
} from 'lucide-react';
import TerrainCanvas from '../components/canvas3d/TerrainCanvas';
import ElevationLegend from '../components/canvas3d/ElevationLegend';
import EmptyState from '../components/common/EmptyState';
import { projectStore } from '../services/projectStore';

export default function TerrainViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState(null);
  const [exaggeration, setExaggeration] = useState(1.5);
  const [shadingMode, setShadingMode] = useState('textured'); // 'textured' | 'wireframe' | 'elevation' | 'shaded'
  const [isFlythrough, setIsFlythrough] = useState(false);

  useEffect(() => {
    let p = null;
    if (projectId) {
      p = projectStore.getProject(projectId);
    } else {
      p = projectStore.getActiveProject();
    }
    if (p) {
      setProject(p);
    }
  }, [projectId]);

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={Compass}
          title="No terrain dataset loaded"
          description="Select an active analysis project or load a sample crop to view the 3D terrain canvas."
          actionLabel="Go to Dashboard"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const isMetric = project.mode === 'calibrated';

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-geo-950">
      {/* Top 3D Viewer Toolbar */}
      <div className="h-12 border-b border-geo-700/60 bg-geo-900/90 px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            to={`/workspace?id=${project.id}`}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-geo-800 transition-colors flex items-center space-x-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <div className="h-4 w-[1px] bg-geo-700/60" />

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[220px]">
              {project.name}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isMetric
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
            }`}>
              {isMetric ? 'Calibrated 3D Surface' : 'Relative Disparity Mesh'}
            </span>
          </div>
        </div>

        {/* Shading mode selector */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden md:flex items-center space-x-1 bg-geo-850 p-1 rounded-lg border border-geo-700/60">
            <button
              onClick={() => setShadingMode('textured')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                shadingMode === 'textured' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Textured
            </button>
            <button
              onClick={() => setShadingMode('elevation')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                shadingMode === 'elevation' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hypsometric
            </button>
            <button
              onClick={() => setShadingMode('wireframe')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                shadingMode === 'wireframe' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wireframe
            </button>
          </div>

          <button
            onClick={() => setIsFlythrough(!isFlythrough)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isFlythrough
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 animate-pulse'
                : 'bg-geo-850 hover:bg-geo-800 text-slate-200 border border-geo-700/60'
            }`}
          >
            {isFlythrough ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isFlythrough ? 'Pause Flight' : 'Auto Flythrough'}</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <TerrainCanvas
          textureUrl={project.imageSrc}
          depthUrl={project.depthMapSrc || project.imageSrc}
          exaggeration={exaggeration}
          shadingMode={shadingMode}
          isFlythrough={isFlythrough}
          isMetric={isMetric}
          minElev={project.metadata?.minElevationMeters || 0}
          maxElev={project.metadata?.maxElevationMeters || 1000}
        />

        {/* Floating Bottom Control Deck */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pointer-events-none">
          {/* Height Exaggeration Slider Control Card */}
          <div className="bg-geo-900/90 backdrop-blur-md border border-geo-700/70 rounded-xl p-4 shadow-2xl pointer-events-auto space-y-2 w-72">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Elevation Exaggeration</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold bg-geo-950 px-2 py-0.5 rounded border border-geo-700/60">
                {exaggeration.toFixed(1)}×
              </span>
            </div>

            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={exaggeration}
              onChange={(e) => setExaggeration(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-geo-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.1× (Subtle)</span>
              <span>1.0× (True)</span>
              <span>4.0× (Steep)</span>
            </div>
          </div>

          {/* Elevation Legend Overlay */}
          <div className="pointer-events-auto">
            <ElevationLegend
              min={isMetric ? project.metadata?.minElevationMeters || 3120 : 0}
              max={isMetric ? project.metadata?.maxElevationMeters || 4890 : 1}
              isMetric={isMetric}
              unit="m"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
