import { useState } from 'react';
import { Layers, Maximize2, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

export default function VisualizationPanel({
  title,
  subtitle,
  imageSrc,
  colormap = 'turbo',
  onColormapChange,
  showColormapSelector = false,
  isMetric = false,
  badgeText,
  emptyMessage,
  elevationRange,
  isLoading = false,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFit, setIsFit] = useState(true);

  const colormapOptions = [
    { id: 'turbo',     label: 'Turbo (Vivid)' },
    { id: 'viridis',   label: 'Viridis (Scientific)' },
    { id: 'inferno',   label: 'Inferno' },
    { id: 'grayscale', label: 'Grayscale' },
  ];

  const handleZoomIn  = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => { setZoomLevel(1); setIsFit(true); };

  return (
    <div className="bg-white border border-geo-700 rounded-xl overflow-hidden shadow-geo-card flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-geo-700 bg-slate-50 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {badgeText && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isMetric
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
              }`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{subtitle}</p>}
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-1">
          {showColormapSelector && (
            <select
              value={colormap}
              onChange={(e) => onColormapChange && onColormapChange(e.target.value)}
              className="bg-white text-slate-700 text-[11px] rounded px-2 py-1 border border-geo-700 focus:outline-none focus:border-blue-500 mr-2"
            >
              {colormapOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-geo-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-geo-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Fit"
            className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-geo-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewport Area */}
      <div className="flex-1 bg-slate-100 min-h-[320px] relative overflow-hidden flex items-center justify-center p-4">
        {isLoading ? (
          <div className="text-center p-8 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Running TensorFlow inference…</p>
          </div>
        ) : imageSrc ? (
          <div
            className="transition-transform duration-100 flex items-center justify-center max-w-full max-h-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={imageSrc}
              alt={title}
              className={`rounded border border-geo-700/50 shadow-lg ${
                isFit ? 'max-w-full max-h-[360px] object-contain' : ''
              }`}
            />
          </div>
        ) : (
          <div className="text-center p-8 space-y-2 max-w-xs">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">{emptyMessage || 'No data stream available'}</p>
          </div>
        )}

        {/* Range bar at bottom */}
        {elevationRange && (
          <div className="absolute bottom-2 left-4 right-4 bg-white/95 backdrop-blur-sm border border-geo-700 rounded px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-700">
            <span>Min: {elevationRange.min}{isMetric ? ' m' : ''}</span>
            <div className="h-2 flex-1 mx-4 rounded-full bg-gradient-to-r from-blue-900 via-emerald-600 to-amber-400 border border-slate-700/50" />
            <span>Max: {elevationRange.max}{isMetric ? ' m' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
