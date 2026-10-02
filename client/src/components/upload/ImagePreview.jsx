import { FileImage, Trash2, CheckCircle2 } from 'lucide-react';

export default function ImagePreview({ fileInfo, onClear }) {
  if (!fileInfo) return null;

  return (
    <div className="bg-geo-850/90 border border-geo-700 rounded-xl p-4 shadow-geo-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileImage className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Image Ingestion Payload
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-geo-800 transition-colors"
          title="Remove selected image"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Thumbnail Preview */}
        <div className="aspect-video bg-geo-950 rounded-lg overflow-hidden border border-geo-700/60 relative flex items-center justify-center">
          {fileInfo.objectUrl ? (
            <img
              src={fileInfo.objectUrl}
              alt={fileInfo.filename}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-4">
              <FileImage className="w-8 h-8 text-cyan-400 mx-auto mb-1 opacity-70" />
              <p className="text-[10px] font-mono text-slate-400">GeoTIFF Data Matrix</p>
            </div>
          )}
          <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-slate-300">
            {fileInfo.extension}
          </span>
        </div>

        {/* Metadata Details */}
        <div className="md:col-span-2 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-geo-700/50 pb-1.5">
            <span className="text-slate-400">Filename:</span>
            <span className="font-mono text-white font-medium truncate max-w-[200px]" title={fileInfo.filename}>
              {fileInfo.filename}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-geo-700/50 pb-1.5">
            <span className="text-slate-400">Dimensions:</span>
            <span className="font-mono text-cyan-300 font-semibold">
              {typeof fileInfo.width === 'number' ? `${fileInfo.width} × ${fileInfo.height} px` : fileInfo.width}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-geo-700/50 pb-1.5">
            <span className="text-slate-400">File Size:</span>
            <span className="font-mono text-slate-200">
              {fileInfo.formattedSize}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-400">Validation:</span>
            <span className="inline-flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Passed integrity check</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
