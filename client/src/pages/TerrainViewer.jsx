import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Play,
  Pause,
  Sliders,
  MousePointer2,
  Navigation,
  Gauge,
} from 'lucide-react';
import TerrainCanvas from '../components/canvas3d/TerrainCanvas';
import ElevationLegend from '../components/canvas3d/ElevationLegend';
import EmptyState from '../components/common/EmptyState';
import { projectStore } from '../services/projectStore';
import { resolveAiUrl } from '../services/api';

export default function TerrainViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState(null);
  const [exaggeration, setExaggeration] = useState(1.5);
  const [shadingMode, setShadingMode] = useState('textured'); // 'textured' | 'wireframe' | 'elevation'
  const [navigationMode, setNavigationMode] = useState('orbit');
  const [flight, setFlight] = useState({ start: null, end: null, running: false, restart: 0 });
  const [speed, setSpeed] = useState(40);
  const [clearance, setClearance] = useState(15);
  const [telemetry, setTelemetry] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [raster, setRaster] = useState(null);
  const [rasterError, setRasterError] = useState(null);
  const [quality, setQuality] = useState('balanced');
  const [hoverPoint, setHoverPoint] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);

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

  useEffect(() => {
    if (!project) return undefined;
    const isMetricProject = project.metadata?.calibrationStatus === 'calibrated' && Boolean(project.elevationRawSrc);
    const url = isMetricProject ? project.elevationRawSrc : project.rawDisparitySrc;
    if (!url) { setRaster(null); setRasterError('This project has no saved numeric raster. Re-run inference to create a terrain derived from model output.'); return undefined; }
    const controller = new AbortController();
    setRaster(null); setRasterError(null);
    fetch(resolveAiUrl(url), { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(`Raster download failed (${response.status}).`); return response.arrayBuffer(); })
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        if (bytes.length < 10 || bytes[0] !== 0x93 || bytes[1] !== 0x4e || bytes[2] !== 0x55 || bytes[3] !== 0x4d || bytes[4] !== 0x50 || bytes[5] !== 0x59) throw new Error('The terrain output is not a supported NumPy raster.');
        const version = bytes[6]; const view = new DataView(buffer);
        const headerLength = version === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
        const headerOffset = version === 1 ? 10 : 12; const offset = headerOffset + headerLength;
        if (offset >= buffer.byteLength || offset % 4 !== 0) throw new Error('The NumPy terrain header is invalid.');
        const header = new TextDecoder('latin1').decode(bytes.slice(headerOffset, offset));
        const shape = header.match(/'shape':\s*\((\d+),\s*(\d+)/);
        const dtype = header.match(/'descr':\s*'([<=>|])f4'/);
        if (!shape || !dtype) throw new Error('Terrain output must be a 2D float32 NumPy raster.');
        const values = new Float32Array(buffer.slice(offset));
        const height = Number(shape[1]); const width = Number(shape[2]);
        if (values.length !== width * height) throw new Error('Terrain raster data length does not match its declared dimensions.');
        setRaster({ values, width, height, isMetric: isMetricProject });
      }).catch((error) => { if (error.name !== 'AbortError') setRasterError(error.message); });
    return () => controller.abort();
  }, [project]);

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

  const isMetric = raster?.isMetric || false;
  const unitLabel = isMetric ? 'm' : 'relative depth';
  const handlePick = (point) => {
    setSelectedPoint(point);
    setFlight((current) => current.start && current.end ? { ...current, start: point, end: null, running: false } : !current.start ? { ...current, start: point } : { ...current, end: point });
  };
  const beginFlight = () => { if (flight.start && flight.end) { setNavigationMode('flight'); setFlight((current) => ({ ...current, running: true })); } };
  const resetPathFlight = () => {
    setFlight((current) => ({ ...current, running: false, restart: current.restart + 1 }));
    setViewRequest({ type: 'path-start', id: Date.now() });
  };
  const resetCurrentView = () => setViewRequest({ type: 'reset', id: Date.now() });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* ── Top 3D Viewer Toolbar ── */}
      <div className="h-12 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            to={`/workspace?id=${project.id}`}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center space-x-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <div className="h-4 w-[1px] bg-geo-700/60" />

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 tracking-wide truncate max-w-[220px]">
              {project.name}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isMetric
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isMetric ? 'Calibrated 3D Surface' : 'Relative Disparity Mesh'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Shading mode */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['textured', 'elevation', 'wireframe'].map((mode) => (
              <button
                key={mode}
                onClick={() => setShadingMode(mode)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                  shadingMode === mode ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'elevation' ? 'Hypsometric' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">{[['orbit', 'Orbit'], ['free', 'Free Flight'], ['flight', 'Path Flight']].map(([mode, label]) => <button key={mode} onClick={() => { setNavigationMode(mode); if (mode !== 'flight') setFlight((current) => ({ ...current, running: false })); }} className={`px-2 py-1 text-[11px] rounded ${navigationMode === mode ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>)}</div>
        </div>
      </div>

      {/* ── Main 3D Canvas Area ── */}
      <div className="flex-1 relative overflow-hidden">
        {rasterError ? <div className="h-full flex items-center justify-center p-8 text-center text-amber-800 text-sm bg-amber-50">{rasterError}</div> : !raster ? <div className="h-full flex items-center justify-center text-slate-600 text-sm">Loading numeric terrain raster…</div> : <TerrainCanvas textureUrl={project.imageSrc} raster={raster.values} rasterWidth={raster.width} rasterHeight={raster.height} exaggeration={exaggeration} shadingMode={shadingMode} isMetric={isMetric} navigationMode={navigationMode} flight={flight} speed={speed} clearance={clearance} quality={quality} viewRequest={viewRequest} onPick={handlePick} onHover={setHoverPoint} onTelemetry={setTelemetry} />}

        <div className="absolute top-20 right-5 w-72 bg-white/95 border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between"><span className="font-semibold text-slate-900 flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-blue-600" />Flythrough controls</span><span className="font-mono text-[10px] text-slate-500">{navigationMode}</span></div>
          <div><label className="flex justify-between text-[10px] text-slate-600"><span>Mesh quality</span><span className="capitalize">{quality}</span></label><select aria-label="Mesh quality" value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-800"><option value="low">Low — fast</option><option value="balanced">Balanced — 256 grid</option><option value="high">High — 384 grid</option></select></div>
          {navigationMode === 'free' && <><p className="text-[11px] leading-relaxed text-slate-600">Click the scene for mouse-look. Use <strong>WASD</strong> or arrows to move; <strong>R/F</strong> rise/lower. Clearance prevents terrain intersections.</p><button type="button" onClick={resetCurrentView} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Reset free-flight camera</button></>}
          {navigationMode === 'flight' && <><p className="text-[11px] text-slate-400"><MousePointer2 className="w-3 h-3 inline" /> Click terrain: {flight.start && !flight.end ? 'select end point' : flight.end ? 'both points ready; next click resets start' : 'select start point'}.</p><div className="grid grid-cols-2 gap-2 text-[10px] font-mono"><span className="text-emerald-400">Start: {flight.start ? 'set' : '—'}</span><span className="text-orange-400">End: {flight.end ? 'set' : '—'}</span></div><div><label className="flex justify-between text-[10px] text-slate-400"><span>Speed</span><span>{speed} units/s</span></label><input className="w-full accent-blue-500" type="range" min="10" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /></div><div><label className="flex justify-between text-[10px] text-slate-400"><span>Clearance</span><span>{clearance} visual units</span></label><input className="w-full accent-emerald-500" type="range" min="5" max="60" value={clearance} onChange={(e) => setClearance(Number(e.target.value))} /></div><div className="flex gap-2"><button onClick={beginFlight} disabled={!flight.start || !flight.end} className="flex-1 bg-blue-600 disabled:bg-geo-800 px-2 py-1.5 rounded text-white"><Play className="inline w-3 h-3 mr-1" />{flight.running ? 'Resume' : 'Start'}</button><button onClick={() => setFlight((current) => ({ ...current, running: false }))} className="px-2 py-1.5 bg-geo-800 rounded text-slate-200" aria-label="Pause path flight"><Pause className="w-3 h-3" /></button><button onClick={resetPathFlight} className="px-2 py-1.5 bg-slate-700 rounded text-white" aria-label="Reset path flight" title="Return camera to path start">↺</button></div></>}
          {selectedPoint && <div className="border-t border-slate-200 pt-2 text-[10px] font-mono text-slate-700"><strong className="text-blue-700">Selected point</strong><br />X {selectedPoint.x.toFixed(1)} · Z {selectedPoint.z.toFixed(1)}<br />{isMetric ? `Elevation ~${selectedPoint.terrain.toFixed(2)} ${unitLabel}` : `Estimated ${unitLabel}: ${selectedPoint.terrain.toFixed(3)}`}</div>}
          {hoverPoint && <div className="text-[10px] font-mono text-slate-600">Cursor: {isMetric ? `${hoverPoint.terrain.toFixed(2)} m` : `relative ${hoverPoint.terrain.toFixed(3)}`}</div>}
          {telemetry && <div className="border-t border-slate-200 pt-2 text-[10px] font-mono text-slate-700"><Gauge className="inline w-3 h-3 text-emerald-600" /> Camera X {telemetry.x.toFixed(1)} · Y {telemetry.y.toFixed(1)} · Z {telemetry.z.toFixed(1)}</div>}
        </div>

        {/* ── Floating Bottom Control Deck ── */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pointer-events-none">
          {/* Exaggeration Slider */}
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
              max="5.0"
              step="0.1"
              value={exaggeration}
              onChange={(e) => setExaggeration(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-geo-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.1× Subtle</span>
              <span>1.0× True</span>
              <span>5.0× Steep</span>
            </div>
          </div>

          {/* Elevation Legend */}
          <div className="pointer-events-auto">
            <ElevationLegend
              min={isMetric ? (project.metadata?.minElevationMeters ?? 0) : 0}
              max={isMetric ? (project.metadata?.maxElevationMeters ?? 8849) : 1}
              isMetric={isMetric}
              unit="m"
              mode={shadingMode === 'elevation' ? 'Hypsometric' : shadingMode === 'wireframe' ? 'Wireframe' : 'Textured'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
