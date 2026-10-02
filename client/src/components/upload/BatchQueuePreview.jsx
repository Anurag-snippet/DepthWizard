import React from 'react';
import { Layers, Trash2, CheckCircle2, FileImage, Plus, Eye } from 'lucide-react';

export default function BatchQueuePreview({
  filesList,
  activeIndex,
  onSelectIndex,
  onRemoveIndex,
  onClearAll,
  onAddMoreClick,
}) {
  if (!filesList || filesList.length === 0) return null;

  const activeFile = filesList[activeIndex] || filesList[0];

  return (
    <div className="bg-geo-850/90 border border-geo-700 rounded-xl p-5 shadow-geo-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-geo-700/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Satellite Imagery Ingestion Queue ({filesList.length} {filesList.length === 1 ? 'image' : 'images'})
            </h3>
            <p className="text-[11px] text-slate-400">
              Select any image to inspect details or run batch processing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onAddMoreClick && (
            <button
              type="button"
              onClick={onAddMoreClick}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-geo-800 hover:bg-geo-750 border border-geo-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add more</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-geo-800 transition-colors"
            title="Clear all images"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Grid / Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
        {filesList.map((item, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <div
              key={`${item.filename}-${idx}`}
              onClick={() => onSelectIndex(idx)}
              className={`group relative rounded-lg border p-2 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/50'
                  : 'border-geo-700/70 bg-geo-900/60 hover:border-slate-500 hover:bg-geo-850'
              }`}
            >
              <div className="aspect-video w-full rounded bg-geo-950 overflow-hidden relative flex items-center justify-center border border-geo-800">
                {item.objectUrl ? (
                  <img
                    src={item.objectUrl}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileImage className="w-6 h-6 text-cyan-400 opacity-60" />
                )}

                <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 px-1 py-0.2 rounded text-slate-300">
                  {item.extension}
                </span>

                {isSelected && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white rounded-full p-0.5 shadow">
                    <Eye className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              <div className="mt-2">
                <p className="text-[11px] font-medium text-slate-200 truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>{item.formattedSize}</span>
                  <span className="text-emerald-400">Ready</span>
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveIndex(idx);
                }}
                className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow transition-opacity"
                title="Remove this image"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Active File Inspector Box */}
      {activeFile && (
        <div className="bg-geo-900/70 border border-geo-700/60 rounded-lg p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded bg-geo-950 overflow-hidden border border-geo-700 flex-shrink-0 flex items-center justify-center">
              {activeFile.objectUrl ? (
                <img src={activeFile.objectUrl} alt={activeFile.filename} className="w-full h-full object-cover" />
              ) : (
                <FileImage className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-white text-xs truncate max-w-[260px] md:max-w-md" title={activeFile.filename}>
                Active selection: {activeFile.filename}
              </p>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono mt-0.5">
                <span>Resolution: {typeof activeFile.width === 'number' ? `${activeFile.width}×${activeFile.height}` : activeFile.width}</span>
                <span>Size: {activeFile.formattedSize}</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px] self-start md:self-auto bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed integrity check</span>
          </div>
        </div>
      )}
    </div>
  );
}
